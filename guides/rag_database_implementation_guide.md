# 🧠 RAG Database — Tài Liệu Nghiên Cứu & Triển Khai

> **Đề tài**: Xây dựng RAG Database khai thác dữ liệu Facebook — Đánh giá mối quan hệ & Phát hiện tài khoản ảo/bot/scam
> **Cập nhật**: 2026-07-24
> **Stack**: PostgreSQL 16 (pgvector) + Neo4j GDS + Ollama (Local LLM) + Python
> **Data scale**: ~500K friends, ~1M posts

---

## Mục Lục

1. [Kiến Trúc Tổng Quan](#1-kiến-trúc-tổng-quan)
2. [Technology Stack & Quyết Định](#2-technology-stack--quyết-định)
3. [Neo4j Graph Database — SOTA Algorithms](#3-neo4j-graph-database--sota-algorithms)
4. [Embedding Strategy — BGE-M3 + FastRP](#4-embedding-strategy--bge-m3--fastrp)
5. [Image Analysis Pipeline — Face Detection](#5-image-analysis-pipeline--face-detection)
6. [Local LLM Integration — Ollama](#6-local-llm-integration--ollama)
7. [Fake Account Detection — Scoring Framework](#7-fake-account-detection--scoring-framework)
8. [PostgreSQL RAG Schema — V9 Migration](#8-postgresql-rag-schema--v9-migration)
9. [Neo4j Schema & Cypher Queries](#9-neo4j-schema--cypher-queries)
10. [Data Sync Pipeline — PostgreSQL ↔ Neo4j](#10-data-sync-pipeline--postgresql--neo4j)
11. [RAG Query Pipeline](#11-rag-query-pipeline)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)

---

## 1. Kiến Trúc Tổng Quan

### 1.1 Dual-Store Hybrid Architecture

```mermaid
flowchart TB
    subgraph Sources["📦 Data Sources (PostgreSQL — 40+ tables)"]
        direction LR
        S1["friends\nfriend_details\nfriend_photos"]
        S2["mutual_friends\nfriend_commonalities"]
        S3["friend_posts\nfriend_post_comments"]
        S4["followings\nfollowers"]
        S5["facebook_groups\ngroup_posts"]
        S6["change_events\nunfriend_executions"]
    end

    subgraph Extract["🔧 Feature Extraction Pipeline (Python)"]
        direction LR
        E1["Profile\nExtractor"]
        E2["Behavioral\nExtractor"]
        E3["Image\nAnalyzer\n(InsightFace)"]
        E4["NLP\nExtractor\n(BGE-M3)"]
        E5["Temporal\nExtractor"]
    end

    subgraph DualStore["🗄️ Dual Store"]
        direction LR
        subgraph PG["PostgreSQL + pgvector"]
            PG1["Relational Data\n(OLTP)"]
            PG2["Vector Store\n(HNSW index)"]
            PG3["Feature Store\n(Materialized Views)"]
        end
        subgraph N4J["Neo4j + GDS"]
            N1["Social Graph\n(Nodes + Edges)"]
            N2["GDS Algorithms\n(Louvain, PageRank)"]
            N3["FastRP Embeddings\n(Structural)"]
        end
    end

    subgraph Query["🤖 RAG Query Engine"]
        direction LR
        Q1["Hybrid Retrieval\n(Vector + Graph)"]
        Q2["Re-ranking\n(WRRF fusion)"]
        Q3["Local LLM\n(Ollama/Qwen3)"]
    end

    Sources --> Extract
    Extract --> DualStore
    DualStore --> Query
    N4J -.->|FastRP export| PG
    PG -.->|Entity sync| N4J
```

### 1.2 Nguyên Tắc Phân Chia Trách Nhiệm

| Concern | PostgreSQL | Neo4j |
|---------|-----------|-------|
| **Primary role** | OLTP, relational storage, vector search | Graph traversal, community detection, structural analysis |
| **Embeddings** | Text/content embeddings (BGE-M3, 1024d) | Structural embeddings (FastRP, 128d) |
| **Queries** | Semantic search, tabular filters, SQL analytics | Multi-hop traversals, path finding, centrality |
| **Algorithms** | Isolation Forest, DBSCAN (via Python) | Louvain, PageRank, FastRP, WCC (native GDS) |
| **Scale** | ~1M records (posts), ~500K (friends) | ~500K nodes, ~5M edges |

---

## 2. Technology Stack & Quyết Định

### 2.1 Decision Log

| # | Decision | Alternatives Considered | Rationale |
|---|----------|------------------------|-----------|
| D1 | **BGE-M3** (1024d) cho text embeddings | MiniLM-L12-v2 (384d), Qwen3-Embedding (8B) | BGE-M3 vượt trội cho Vietnamese trên MTEB, hỗ trợ hybrid search (dense+sparse), context 8K tokens. MiniLM quá yếu cho Vietnamese. Qwen3-Embedding quá nặng. |
| D2 | **HNSW** index cho pgvector | IVFFlat | Data thay đổi liên tục (incremental crawl) → HNSW xử lý dynamic data tốt hơn, không cần REINDEX. 1M records hoàn toàn trong phạm vi HNSW. |
| D3 | **Neo4j GDS** cho graph algorithms | NetworkX (Python), PostgreSQL CTEs | Neo4j GDS native algorithms (FastRP, Louvain) nhanh gấp 10-100x so với NetworkX trên 500K nodes. Có sẵn infra. |
| D4 | **FastRP** cho graph embeddings | Node2Vec, GraphSAGE | FastRP nhanh hơn 100x Node2Vec, inductive (xử lý được new nodes), tích hợp native GDS. |
| D5 | **Ollama + Qwen3-8B** cho Local LLM | Llama 3.3, Mistral, GPT-4 API | Qwen3 SOTA cho multilingual/Vietnamese, native tool-calling, structured output. 8B fits consumer GPU (8GB VRAM). |
| D6 | **InsightFace** cho face detection | YOLO, MediaPipe, MTCNN | InsightFace (RetinaFace + ArcFace) toàn diện nhất: detection + landmarks + embedding + attributes. MIT license. |
| D7 | **Dual-store** (PG + Neo4j) | PG only, Neo4j only | PG mạnh cho OLTP + vector search. Neo4j mạnh cho graph algorithms. Cả hai complementary, đều đã có sẵn. |
| D8 | **Hybrid retrieval** (Vector + Graph + Keyword) | Vector-only, Graph-only | Theo SOTA 2025: hybrid retrieval + WRRF re-ranking cho F1 cao nhất. |

### 2.2 Full Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
├─────────────────────────────────────────────────────────┤
│  RAG Query Engine    │  Python 3.11+                    │
│  Orchestration       │  LlamaIndex / LangChain          │
│  Local LLM           │  Ollama + Qwen3-8B               │
├─────────────────────────────────────────────────────────┤
│                    Processing Layer                      │
├─────────────────────────────────────────────────────────┤
│  Text Embeddings     │  BGE-M3 (via Ollama/HuggingFace) │
│  Graph Embeddings    │  Neo4j GDS FastRP                 │
│  Face Analysis       │  InsightFace (buffalo_l pack)     │
│  NLP Processing      │  underthesea (Vietnamese)         │
│  ML/Scoring          │  scikit-learn, polars             │
│  Re-ranking          │  bge-reranker-v2-m3               │
├─────────────────────────────────────────────────────────┤
│                    Storage Layer                         │
├─────────────────────────────────────────────────────────┤
│  Relational + Vector │  PostgreSQL 16 + pgvector 0.7+   │
│  Graph               │  Neo4j 5.x + GDS 2.x             │
│  Cache               │  Redis (optional)                 │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Python Dependencies

```txt
# Core
polars>=1.0
sqlalchemy[asyncio]>=2.0
psycopg[binary]>=3.1
neo4j>=5.0

# Embeddings & NLP
sentence-transformers>=3.0
FlagEmbedding>=1.2       # BGE-M3
underthesea>=6.0          # Vietnamese NLP
transformers>=4.40

# Face Analysis
insightface>=0.7
onnxruntime-gpu>=1.17     # or onnxruntime for CPU
opencv-python>=4.9

# ML & Graph
scikit-learn>=1.4
networkx>=3.2             # Lightweight graph ops

# LLM
ollama>=0.3
llama-index>=0.11         # RAG orchestration

# Image
Pillow>=10.0
requests>=2.31
```

---

## 3. Neo4j Graph Database — SOTA Algorithms

### 3.1 Graph Data Model

```mermaid
graph LR
    subgraph Nodes["Node Types"]
        P["(:Person)\nfb_id, display_name\nfake_score, community_id"]
        G["(:Group)\nfb_group_id, name"]
        L["(:Location)\ncity, country"]
        O["(:Organization)\ncompany, position"]
        S["(:School)\nname, degree"]
    end

    subgraph Relationships["Edge Types"]
        P -->|:IS_FRIEND_OF| P
        P -->|:MUTUAL_FRIEND| P
        P -->|:FOLLOWS| P
        P -->|:MEMBER_OF| G
        P -->|:LIVES_IN| L
        P -->|:WORKS_AT| O
        P -->|:STUDIED_AT| S
        P -->|:CO_TAGGED_IN| P
        P -->|:COMMENTED_ON_POST_OF| P
    end
```

### 3.2 GDS Algorithm Pipeline — 5 Stages

```mermaid
flowchart TD
    S1["Stage 1: Graph Projection\ngds.graph.project()"] --> S2
    S2["Stage 2: Community Detection\nLouvain / WCC"] --> S3
    S3["Stage 3: Centrality Scoring\nPageRank + Betweenness"] --> S4
    S4["Stage 4: Structural Embeddings\nFastRP (128d)"] --> S5
    S5["Stage 5: Anomaly Detection\nIsolation + Community-aware"]

    S1 -.-> N1["Project: Person nodes\n+ IS_FRIEND_OF edges\n+ MUTUAL_FRIEND edges"]
    S2 -.-> N2["Output: community_id\nper node"]
    S3 -.-> N3["Output: pagerank_score\nbetweenness_score"]
    S4 -.-> N4["Output: fastrp_embedding\nvector(128)"]
    S5 -.-> N5["Output: anomaly_score\nrisk_category"]
```

### 3.3 Cypher Implementation — Stage by Stage

#### Stage 1: Graph Projection

```cypher
// Project the social graph into GDS in-memory workspace
CALL gds.graph.project(
    'social-graph',                    // Graph name
    {
        Person: {
            label: 'Person',
            properties: {
                fake_score: { defaultValue: 0 },
                friend_count: { defaultValue: 0 },
                mutual_friend_count: { defaultValue: 0 },
                profile_completeness: { defaultValue: 0 },
                post_count: { defaultValue: 0 }
            }
        }
    },
    {
        IS_FRIEND_OF: {
            type: 'IS_FRIEND_OF',
            orientation: 'UNDIRECTED',
            properties: ['weight']
        },
        MUTUAL_FRIEND: {
            type: 'MUTUAL_FRIEND',
            orientation: 'UNDIRECTED'
        }
    }
);
```

#### Stage 2: Community Detection — Louvain

```cypher
// Run Louvain community detection
// Louvain cho hierarchical communities — SOTA cho social networks
CALL gds.louvain.write('social-graph', {
    writeProperty: 'community_id',
    includeIntermediateCommunities: true,    // Hierarchical levels
    maxLevels: 10,
    maxIterations: 20,
    tolerance: 0.0001,
    relationshipWeightProperty: 'weight',
    concurrency: 4
})
YIELD communityCount, modularity, ranLevels
RETURN communityCount, modularity, ranLevels;

// Weakly Connected Components — find isolated clusters
CALL gds.wcc.write('social-graph', {
    writeProperty: 'component_id',
    concurrency: 4
})
YIELD componentCount, componentDistribution
RETURN componentCount, componentDistribution;
```

#### Stage 3: Centrality — PageRank + Betweenness

```cypher
// PageRank — find influential nodes
CALL gds.pageRank.write('social-graph', {
    writeProperty: 'pagerank_score',
    maxIterations: 20,
    dampingFactor: 0.85,
    concurrency: 4
})
YIELD nodePropertiesWritten, ranIterations
RETURN nodePropertiesWritten, ranIterations;

// Betweenness Centrality — find bridge nodes
CALL gds.betweenness.write('social-graph', {
    writeProperty: 'betweenness_score',
    concurrency: 4,
    samplingSize: 10000        // Sample for performance at 500K nodes
})
YIELD nodePropertiesWritten
RETURN nodePropertiesWritten;

// Degree Centrality — basic connectivity
CALL gds.degree.write('social-graph', {
    writeProperty: 'degree_score',
    orientation: 'UNDIRECTED'
})
YIELD nodePropertiesWritten
RETURN nodePropertiesWritten;
```

#### Stage 4: Structural Embeddings — FastRP

```cypher
// FastRP — Fast Random Projection embeddings
// Captures local neighborhood structure into 128-dimensional vectors
CALL gds.fastRP.write('social-graph', {
    writeProperty: 'fastrp_embedding',
    embeddingDimension: 128,
    iterationWeights: [0.0, 1.0, 1.0, 0.8, 0.5],  // 4 iterations
    normalizationStrength: 0.05,
    propertyRatio: 0.5,             // Mix 50% structure + 50% properties
    featureProperties: [
        'fake_score', 'friend_count',
        'mutual_friend_count', 'profile_completeness',
        'post_count'
    ],
    randomSeed: 42,
    concurrency: 4
})
YIELD nodePropertiesWritten
RETURN nodePropertiesWritten;
```

#### Stage 5: Graph-Based Anomaly Signals

```cypher
// 1. Find isolated nodes (no community or tiny component)
MATCH (p:Person)
WHERE p.component_id IS NOT NULL
WITH p.component_id AS comp, collect(p) AS members, count(p) AS size
WHERE size <= 3
UNWIND members AS isolated
SET isolated.is_isolated = true;

// 2. Find nodes with anomalous PageRank (too high for few connections)
MATCH (p:Person)
WHERE p.pagerank_score > 0.01 AND p.friend_count < 10
SET p.anomaly_flag = 'HIGH_PAGERANK_LOW_FRIENDS';

// 3. Find bridge nodes between communities (potential fake connecting accounts)
MATCH (p:Person)
WHERE p.betweenness_score > percentileCont(0.95)
  AND p.community_id IS NOT NULL
WITH p, p.community_id AS comm
MATCH (p)-[:IS_FRIEND_OF]-(neighbor:Person)
WHERE neighbor.community_id <> comm
WITH p, count(DISTINCT neighbor.community_id) AS cross_communities
WHERE cross_communities >= 3
SET p.anomaly_flag = 'CROSS_COMMUNITY_BRIDGE';

// 4. Community-level anomaly: communities with high avg fake_score
MATCH (p:Person)
WITH p.community_id AS comm, 
     avg(p.fake_score) AS avg_fake,
     count(p) AS size
WHERE avg_fake > 50 AND size >= 5
MATCH (suspect:Person {community_id: comm})
SET suspect.community_risk = 'HIGH';
```

### 3.4 Export FastRP Embeddings → PostgreSQL

```python
from neo4j import GraphDatabase
import psycopg
import numpy as np

def export_fastrp_to_postgres(neo4j_uri, neo4j_auth, pg_dsn):
    """Export FastRP embeddings from Neo4j → PostgreSQL pgvector."""
    
    # 1. Read embeddings from Neo4j
    driver = GraphDatabase.driver(neo4j_uri, auth=neo4j_auth)
    with driver.session() as session:
        result = session.run("""
            MATCH (p:Person)
            WHERE p.fastrp_embedding IS NOT NULL
            RETURN p.fb_id AS fb_id,
                   p.fastrp_embedding AS embedding,
                   p.community_id AS community_id,
                   p.pagerank_score AS pagerank,
                   p.betweenness_score AS betweenness,
                   p.is_isolated AS is_isolated
        """)
        records = list(result)
    
    # 2. Write to PostgreSQL
    with psycopg.connect(pg_dsn) as conn:
        with conn.cursor() as cur:
            for rec in records:
                embedding_str = "[" + ",".join(str(x) for x in rec["embedding"]) + "]"
                cur.execute("""
                    INSERT INTO rag_profile_embeddings 
                        (friend_id, account_id, graph_embedding, 
                         community_id, pagerank_score, betweenness_score)
                    SELECT f.id, f.account_id, %s::vector(128),
                           %s, %s, %s
                    FROM friends f WHERE f.fb_friend_id = %s
                    ON CONFLICT (friend_id) DO UPDATE SET
                        graph_embedding = EXCLUDED.graph_embedding,
                        community_id = EXCLUDED.community_id,
                        pagerank_score = EXCLUDED.pagerank_score,
                        betweenness_score = EXCLUDED.betweenness_score,
                        updated_at = NOW()
                """, (embedding_str, rec["community_id"], 
                      rec["pagerank"], rec["betweenness"], rec["fb_id"]))
        conn.commit()
    
    print(f"Exported {len(records)} FastRP embeddings to PostgreSQL")
```

---

## 4. Embedding Strategy — BGE-M3 + FastRP

### 4.1 Multi-Modal Embedding Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  EMBEDDING STRATEGY                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Text Embeddings (BGE-M3, 1024d)                        │
│  ├── Profile text → profile_embedding                   │
│  │   Input: "{name} | {work} | {edu} | {location} |    │
│  │           {bio} | {about}"                           │
│  ├── Post content → post_embedding                      │
│  │   Input: post.content (chunked 512 tokens)           │
│  └── Comment text → comment_embedding                   │
│      Input: comment.content                              │
│                                                          │
│  Graph Embeddings (FastRP via Neo4j GDS, 128d)          │
│  └── Structural neighborhood → graph_embedding          │
│      Input: IS_FRIEND_OF + MUTUAL_FRIEND edges          │
│      + node properties (fake_score, friend_count, etc)  │
│                                                          │
│  Image Embeddings (InsightFace ArcFace, 512d)           │
│  └── Face embedding → face_embedding                    │
│      Input: Detected face region from avatar             │
│                                                          │
│  Fused Embedding (Concatenation → PCA, 512d)            │
│  └── [text_1024d ⊕ graph_128d ⊕ face_512d]            │
│      → PCA reduce → fused_embedding (512d)              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4.2 BGE-M3 Text Embedding — Implementation

```python
from FlagEmbedding import BGEM3FlagModel
import numpy as np

class TextEmbedder:
    """BGE-M3 text embedding with hybrid retrieval support."""
    
    def __init__(self, device: str = "cuda"):
        self.model = BGEM3FlagModel(
            'BAAI/bge-m3',
            use_fp16=True,       # Half precision for speed
            device=device
        )
    
    def embed_profile(self, friend_detail: dict) -> np.ndarray:
        """Create profile text embedding from friend details."""
        # Construct semantic profile text
        parts = []
        if friend_detail.get("display_name"):
            parts.append(f"Tên: {friend_detail['display_name']}")
        if friend_detail.get("current_city"):
            parts.append(f"Thành phố: {friend_detail['current_city']}")
        if friend_detail.get("hometown"):
            parts.append(f"Quê quán: {friend_detail['hometown']}")
        if friend_detail.get("work_details"):
            for w in friend_detail["work_details"]:
                parts.append(f"Công ty: {w.get('company', '')} - {w.get('position', '')}")
        if friend_detail.get("education_details"):
            for e in friend_detail["education_details"]:
                parts.append(f"Trường: {e.get('school', '')} - {e.get('degree', '')}")
        if friend_detail.get("bio_text"):
            parts.append(f"Bio: {friend_detail['bio_text']}")
        if friend_detail.get("about_text"):
            parts.append(f"Giới thiệu: {friend_detail['about_text']}")
        
        text = " | ".join(parts) if parts else "Không có thông tin"
        
        # Generate dense embedding (1024d)
        output = self.model.encode(
            [text],
            batch_size=1,
            max_length=512,
            return_dense=True,
            return_sparse=True,    # For hybrid search
            return_colbert_vecs=False
        )
        
        return {
            "dense": output["dense_vecs"][0],          # np.array(1024,)
            "sparse": output["lexical_weights"][0],     # Dict for BM25-like matching
        }
    
    def embed_posts(self, posts: list[str], batch_size: int = 32) -> np.ndarray:
        """Batch embed post contents."""
        # Chunk long posts
        from underthesea import sent_tokenize
        
        chunks = []
        for post in posts:
            if not post or len(post.strip()) < 10:
                chunks.append("Bài viết trống")
                continue
            # Vietnamese sentence-aware chunking
            sentences = sent_tokenize(post)
            current_chunk = ""
            for sent in sentences:
                if len(current_chunk) + len(sent) < 1500:  # ~512 tokens
                    current_chunk += " " + sent
                else:
                    chunks.append(current_chunk.strip())
                    current_chunk = sent
            chunks.append(current_chunk.strip())
        
        output = self.model.encode(
            chunks,
            batch_size=batch_size,
            max_length=512,
            return_dense=True,
            return_sparse=False
        )
        return output["dense_vecs"]  # np.array(N, 1024)
```

### 4.3 Fusion Strategy

```python
from sklearn.decomposition import PCA
import numpy as np

class EmbeddingFuser:
    """Fuse text + graph + face embeddings into unified representation."""
    
    def __init__(self, output_dim: int = 512):
        self.pca = PCA(n_components=output_dim)
        self.is_fitted = False
    
    def fuse(self, 
             text_emb: np.ndarray,      # (N, 1024)
             graph_emb: np.ndarray,      # (N, 128) 
             face_emb: np.ndarray = None # (N, 512) or None
             ) -> np.ndarray:
        """
        Weighted concatenation → PCA → fused embedding.
        
        Weights reflect importance for fake detection (SOTA findings):
        - Graph structure: 40% (most important per literature)
        - Text/profile: 35%
        - Face/image: 25%
        """
        # Normalize each modality
        text_norm = text_emb / (np.linalg.norm(text_emb, axis=1, keepdims=True) + 1e-8)
        graph_norm = graph_emb / (np.linalg.norm(graph_emb, axis=1, keepdims=True) + 1e-8)
        
        # Weight and concatenate
        weighted_text = text_norm * 0.35
        weighted_graph = graph_norm * 0.40
        
        if face_emb is not None:
            face_norm = face_emb / (np.linalg.norm(face_emb, axis=1, keepdims=True) + 1e-8)
            weighted_face = face_norm * 0.25
            concatenated = np.hstack([weighted_text, weighted_graph, weighted_face])
        else:
            # Re-distribute face weight
            weighted_text *= (0.35 + 0.125) / 0.35
            weighted_graph *= (0.40 + 0.125) / 0.40
            concatenated = np.hstack([weighted_text, weighted_graph])
        
        # PCA reduction
        if not self.is_fitted:
            self.pca.fit(concatenated)
            self.is_fitted = True
        
        return self.pca.transform(concatenated)  # (N, 512)
```

---

## 5. Image Analysis Pipeline — Face Detection

### 5.1 Tại Sao Cần Face Analysis?

Vì crawler tự động crawl ảnh profile, cần xác định:
1. **Ảnh nào là chân dung (portrait)?** → Phân biệt ảnh người vs. phong cảnh/logo
2. **Ảnh có khuôn mặt thật?** → Phát hiện ảnh stock, ảnh AI-generated
3. **Chân dung hay toàn thân?** → Face area ratio
4. **Đặc điểm khuôn mặt** → Age/gender estimation cho cross-validation với profile info

### 5.2 InsightFace Pipeline

```python
import cv2
import numpy as np
from insightface.app import FaceAnalysis
from pathlib import Path
import requests
from io import BytesIO
from PIL import Image
from enum import Enum

class PhotoType(Enum):
    NO_FACE = "NO_FACE"                # Không phát hiện khuôn mặt
    PORTRAIT_CLOSEUP = "PORTRAIT_CLOSEUP"  # Chân dung cận (face > 25% ảnh)
    PORTRAIT_HALF = "PORTRAIT_HALF"        # Chân dung bán thân (10-25%)
    FULL_BODY = "FULL_BODY"                # Toàn thân (face < 10%)
    GROUP_PHOTO = "GROUP_PHOTO"            # Nhiều người (>1 face)
    STOCK_SUSPECT = "STOCK_SUSPECT"        # Nghi ảnh stock (perfect lighting + center)
    AI_SUSPECT = "AI_SUSPECT"              # Nghi ảnh AI-generated

class AvatarAnalyzer:
    """Analyze friend profile photos for fake detection signals."""
    
    def __init__(self, ctx_id: int = 0):
        """
        ctx_id: -1 for CPU, 0+ for GPU index
        """
        self.app = FaceAnalysis(
            name="buffalo_l",          # Best accuracy pack
            allowed_modules=["detection", "recognition", "genderage"]
        )
        self.app.prepare(ctx_id=ctx_id, det_size=(640, 640))
    
    def analyze_from_url(self, image_url: str) -> dict:
        """Download and analyze an image from URL."""
        try:
            resp = requests.get(image_url, timeout=10)
            resp.raise_for_status()
            img_array = np.frombuffer(resp.content, np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            if img is None:
                return {"error": "Cannot decode image", "photo_type": PhotoType.NO_FACE.value}
            return self.analyze(img)
        except Exception as e:
            return {"error": str(e), "photo_type": PhotoType.NO_FACE.value}
    
    def analyze(self, img: np.ndarray) -> dict:
        """
        Core analysis: detect faces, classify photo type, extract features.
        
        Returns:
        {
            "photo_type": "PORTRAIT_CLOSEUP",
            "face_count": 1,
            "face_area_ratio": 0.35,
            "faces": [{
                "bbox": [x1, y1, x2, y2],
                "det_score": 0.99,
                "age": 28,
                "gender": "M",
                "embedding": np.array(512,),  # ArcFace embedding
                "is_centered": True,
                "landmark_quality": 0.95
            }],
            "signals": {
                "has_real_face": True,
                "is_portrait": True,
                "face_quality_score": 0.92,
                "stock_photo_score": 0.15,
                "ai_generated_score": 0.05
            }
        }
        """
        h, w = img.shape[:2]
        img_area = h * w
        
        # Detect faces
        faces = self.app.get(img)
        
        result = {
            "face_count": len(faces),
            "image_size": {"width": w, "height": h},
            "faces": [],
            "signals": {}
        }
        
        if len(faces) == 0:
            result["photo_type"] = PhotoType.NO_FACE.value
            result["signals"] = {
                "has_real_face": False,
                "is_portrait": False,
                "face_quality_score": 0.0,
            }
            return result
        
        # Analyze each face
        total_face_area = 0
        for face in faces:
            bbox = face.bbox.astype(int)
            face_w = bbox[2] - bbox[0]
            face_h = bbox[3] - bbox[1]
            face_area = face_w * face_h
            face_area_ratio = face_area / img_area
            total_face_area += face_area
            
            # Check if face is centered
            face_center_x = (bbox[0] + bbox[2]) / 2
            face_center_y = (bbox[1] + bbox[3]) / 2
            is_centered = (
                abs(face_center_x - w/2) < w * 0.2 and
                abs(face_center_y - h/2) < h * 0.3
            )
            
            # Landmark quality (5-point)
            landmarks = face.kps  # 5x2 array
            landmark_quality = self._assess_landmark_quality(landmarks, bbox)
            
            face_info = {
                "bbox": bbox.tolist(),
                "det_score": float(face.det_score),
                "age": int(face.age) if hasattr(face, 'age') else None,
                "gender": "M" if (hasattr(face, 'gender') and face.gender == 1) else "F",
                "embedding": face.embedding if hasattr(face, 'embedding') else None,
                "face_area_ratio": round(face_area_ratio, 4),
                "is_centered": is_centered,
                "landmark_quality": round(landmark_quality, 4),
            }
            result["faces"].append(face_info)
        
        # Classify photo type
        total_ratio = total_face_area / img_area
        
        if len(faces) > 1:
            result["photo_type"] = PhotoType.GROUP_PHOTO.value
        elif total_ratio > 0.25:
            result["photo_type"] = PhotoType.PORTRAIT_CLOSEUP.value
        elif total_ratio > 0.10:
            result["photo_type"] = PhotoType.PORTRAIT_HALF.value
        else:
            result["photo_type"] = PhotoType.FULL_BODY.value
        
        # Compute signals
        primary_face = result["faces"][0]
        result["signals"] = {
            "has_real_face": True,
            "is_portrait": total_ratio > 0.10 and len(faces) == 1,
            "face_quality_score": round(primary_face["det_score"] * primary_face["landmark_quality"], 4),
            "face_area_ratio": round(total_ratio, 4),
            # Stock photo heuristic: perfectly centered + high quality + even lighting
            "stock_photo_score": self._estimate_stock_score(img, primary_face),
            # AI-generated heuristic: too smooth skin + symmetric landmarks
            "ai_generated_score": self._estimate_ai_score(primary_face),
        }
        
        return result
    
    def _assess_landmark_quality(self, landmarks, bbox) -> float:
        """Assess facial landmark quality (symmetry, completeness)."""
        if landmarks is None:
            return 0.0
        # Check if all 5 landmarks are within the bounding box
        in_bbox = sum(
            1 for lm in landmarks
            if bbox[0] <= lm[0] <= bbox[2] and bbox[1] <= lm[1] <= bbox[3]
        )
        return in_bbox / 5.0
    
    def _estimate_stock_score(self, img, face_info: dict) -> float:
        """Heuristic: stock photos tend to be perfectly centered with even lighting."""
        score = 0.0
        if face_info["is_centered"]:
            score += 0.3
        if face_info["det_score"] > 0.99:
            score += 0.2
        if face_info["landmark_quality"] > 0.95:
            score += 0.2
        # Check lighting uniformity
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        std_dev = np.std(gray)
        if std_dev < 30:  # Very uniform lighting
            score += 0.3
        return min(score, 1.0)
    
    def _estimate_ai_score(self, face_info: dict) -> float:
        """Heuristic: AI faces tend to have perfect symmetry and high detection confidence."""
        score = 0.0
        if face_info["det_score"] > 0.999:
            score += 0.3
        if face_info["landmark_quality"] >= 1.0:
            score += 0.3
        # More heuristics can be added (skin smoothness, etc.)
        return min(score, 1.0)
    
    def compare_faces(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """Compare two face embeddings. Returns cosine similarity [0, 1]."""
        sim = np.dot(embedding1, embedding2) / (
            np.linalg.norm(embedding1) * np.linalg.norm(embedding2) + 1e-8
        )
        return float(sim)
```

### 5.3 Batch Processing for Friend Photos

```python
async def analyze_all_friend_photos(pg_dsn: str, analyzer: AvatarAnalyzer):
    """Analyze all friend photos from friend_photos table."""
    import psycopg
    
    with psycopg.connect(pg_dsn) as conn:
        with conn.cursor() as cur:
            # Get unanalyzed photos
            cur.execute("""
                SELECT fp.id, fp.friend_id, fp.photo_url, fp.album_type
                FROM friend_photos fp
                LEFT JOIN rag_photo_analysis rpa ON fp.id = rpa.photo_id
                WHERE rpa.id IS NULL
                ORDER BY fp.album_type ASC  -- profile photos first
                LIMIT 1000
            """)
            photos = cur.fetchall()
            
            for photo_id, friend_id, url, album_type in photos:
                result = analyzer.analyze_from_url(url)
                
                # Store analysis results
                face_embedding = None
                if result.get("faces") and result["faces"][0].get("embedding") is not None:
                    emb = result["faces"][0]["embedding"]
                    face_embedding = "[" + ",".join(str(x) for x in emb) + "]"
                
                cur.execute("""
                    INSERT INTO rag_photo_analysis (
                        photo_id, friend_id, photo_type, face_count,
                        face_area_ratio, face_quality_score,
                        stock_photo_score, ai_generated_score,
                        has_real_face, is_portrait,
                        face_embedding, age_estimate, gender_estimate,
                        analyzed_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                              %s::vector(512), %s, %s, NOW())
                """, (
                    photo_id, friend_id,
                    result["photo_type"],
                    result["face_count"],
                    result["signals"].get("face_area_ratio", 0),
                    result["signals"].get("face_quality_score", 0),
                    result["signals"].get("stock_photo_score", 0),
                    result["signals"].get("ai_generated_score", 0),
                    result["signals"].get("has_real_face", False),
                    result["signals"].get("is_portrait", False),
                    face_embedding,
                    result["faces"][0].get("age") if result.get("faces") else None,
                    result["faces"][0].get("gender") if result.get("faces") else None,
                ))
            
            conn.commit()
    print(f"Analyzed {len(photos)} photos")
```

---

## 6. Local LLM Integration — Ollama

### 6.1 Setup

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull qwen3:8b              # Main LLM (reasoning, analysis)
ollama pull bge-m3                 # Text embeddings (1024d)
ollama pull bge-reranker-v2-m3     # Re-ranking (optional)
```

### 6.2 RAG Query Handler

```python
import ollama
import json

class RAGQueryHandler:
    """Handle RAG queries using local Ollama LLM."""
    
    SYSTEM_PROMPT = """Bạn là trợ lý phân tích mạng xã hội Facebook. 
    Nhiệm vụ: Phân tích dữ liệu bạn bè, đánh giá mối quan hệ, phát hiện tài khoản ảo/bot/scam.
    
    Quy tắc:
    - Trả lời bằng tiếng Việt
    - Dựa trên dữ liệu được cung cấp, KHÔNG bịa thông tin
    - Khi đánh giá tài khoản đáng nghi, luôn giải thích LÝ DO cụ thể
    - Sử dụng scoring factors từ context để minh chứng
    - Phân biệt rõ giữa "đáng nghi" và "chắc chắn fake"
    """
    
    def __init__(self, model: str = "qwen3:8b"):
        self.model = model
    
    def query(self, user_question: str, context: dict) -> str:
        """
        Process a RAG query with retrieved context.
        
        context = {
            "profiles": [...],       # Retrieved friend profiles
            "graph_data": {...},     # Community, centrality data  
            "posts": [...],          # Relevant posts
            "scoring": {...},        # Fake scores and factors
        }
        """
        # Build context string
        context_str = self._format_context(context)
        
        response = ollama.chat(
            model=self.model,
            messages=[
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": f"""
Dựa trên dữ liệu sau, hãy trả lời câu hỏi:

=== DỮ LIỆU ===
{context_str}

=== CÂU HỎI ===
{user_question}

Hãy phân tích chi tiết và đưa ra đánh giá.
"""}
            ],
            options={
                "temperature": 0.3,     # Low temperature for analytical tasks
                "num_predict": 2048,
                "top_p": 0.9,
            }
        )
        
        return response["message"]["content"]
    
    def _format_context(self, context: dict) -> str:
        """Format retrieved context for LLM consumption."""
        parts = []
        
        if "profiles" in context:
            parts.append("## Thông Tin Profile")
            for p in context["profiles"][:10]:  # Top 10
                parts.append(f"- **{p['display_name']}** | Fake Score: {p.get('fake_score', 'N/A')} | "
                           f"Mutual Friends: {p.get('mutual_count', 'N/A')} | "
                           f"Community: {p.get('community_id', 'N/A')} | "
                           f"Posts: {p.get('post_count', 0)}")
        
        if "graph_data" in context:
            gd = context["graph_data"]
            parts.append(f"\n## Graph Analysis")
            parts.append(f"- Communities: {gd.get('community_count', 'N/A')}")
            parts.append(f"- Isolated nodes: {gd.get('isolated_count', 'N/A')}")
            parts.append(f"- Avg clustering coefficient: {gd.get('avg_clustering', 'N/A')}")
        
        if "scoring" in context:
            sc = context["scoring"]
            parts.append(f"\n## Scoring Summary")
            parts.append(f"- High Risk (>60): {sc.get('high_risk_count', 0)}")
            parts.append(f"- Medium Risk (35-60): {sc.get('medium_risk_count', 0)}")
            parts.append(f"- Low Risk (<35): {sc.get('low_risk_count', 0)}")
        
        return "\n".join(parts)
```

---

## 7. Fake Account Detection — Scoring Framework

### 7.1 Multi-Dimensional Score (0-100)

```mermaid
pie title "Trọng Số SOTA — Fake Score Components"
    "Graph Structure" : 30
    "Profile Completeness" : 20
    "Behavioral Patterns" : 20
    "Image Analysis" : 15
    "Temporal Signals" : 15
```

### 7.2 Complete Scoring SQL

```sql
-- Materialized view: Comprehensive fake scoring
CREATE MATERIALIZED VIEW rag_fake_score_mv AS
WITH profile_score AS (
    SELECT 
        f.id AS friend_id,
        (
            -- Avatar analysis
            CASE WHEN fd.avatar_hd_url IS NULL THEN 8 ELSE 0 END +
            CASE WHEN fd.cover_photo_url IS NULL THEN 3 ELSE 0 END +
            -- Bio/About
            CASE WHEN fd.bio_text IS NULL OR LENGTH(fd.bio_text) < 5 THEN 4 ELSE 0 END +
            CASE WHEN fd.about_text IS NULL OR LENGTH(fd.about_text) < 5 THEN 2 ELSE 0 END +
            -- Work/Education
            CASE WHEN fd.work_details = '[]'::jsonb AND fd.education_details = '[]'::jsonb THEN 3 ELSE 0 END +
            -- Location
            CASE WHEN fd.current_city IS NULL AND fd.hometown IS NULL THEN 2 ELSE 0 END +
            -- Name pattern (has numbers or very short)
            CASE WHEN f.display_name ~ '\d' THEN 5
                 WHEN LENGTH(f.display_name) < 4 THEN 3
                 ELSE 0 END +
            -- Profile completeness from existing field
            CASE WHEN COALESCE(fd.profile_completeness, 0) < 15 THEN 5 ELSE 0 END
        )::INTEGER AS score
    FROM friends f
    LEFT JOIN friend_details fd ON f.id = fd.friend_id
),
behavioral_score AS (
    SELECT 
        f.id AS friend_id,
        (
            -- Zero posts
            CASE WHEN COALESCE(post_stats.total_posts, 0) = 0 THEN 10 ELSE 0 END +
            -- All reposts (>90% shared content)
            CASE WHEN post_stats.total_posts > 5 AND 
                 post_stats.shared_ratio > 0.9 THEN 5 ELSE 0 END +
            -- No comments received
            CASE WHEN COALESCE(post_stats.total_comments_received, 0) = 0 
                 AND post_stats.total_posts > 3 THEN 3 ELSE 0 END +
            -- Suspicious engagement: uniform reactions
            CASE WHEN post_stats.total_posts > 5 AND 
                 post_stats.reaction_std < 1.0 THEN 4 ELSE 0 END +
            -- Posting burst (>20 posts in single day)
            CASE WHEN post_stats.max_posts_per_day > 20 THEN 3 ELSE 0 END
        )::INTEGER AS score
    FROM friends f
    LEFT JOIN LATERAL (
        SELECT 
            COUNT(*) AS total_posts,
            COUNT(*) FILTER (WHERE post_type IN ('SHARE_LINK','SHARE_POST','REPOST_GROUP'))::FLOAT 
                / NULLIF(COUNT(*), 0) AS shared_ratio,
            SUM(comment_count) AS total_comments_received,
            STDDEV(reaction_count) AS reaction_std,
            MAX(daily_count) AS max_posts_per_day
        FROM friend_posts fp
        LEFT JOIN LATERAL (
            SELECT COUNT(*) AS daily_count
            FROM friend_posts fp2
            WHERE fp2.friend_id = fp.friend_id
            AND fp2.posted_at::date = fp.posted_at::date
            GROUP BY fp2.posted_at::date
        ) daily ON true
        WHERE fp.friend_id = f.id
    ) post_stats ON true
),
graph_score AS (
    SELECT 
        f.id AS friend_id,
        (
            -- Zero mutual friends (strongest signal)
            CASE WHEN COALESCE(mutual_count, 0) = 0 THEN 15
                 WHEN COALESCE(mutual_count, 0) < 3 THEN 8
                 ELSE 0 END +
            -- No commonalities
            CASE WHEN COALESCE(commonality_count, 0) = 0 THEN 5 ELSE 0 END +
            -- Excessive friend count
            CASE WHEN COALESCE(fd.friend_count, 0) > 4500 THEN 3 ELSE 0 END +
            -- Very few friends (suspicious for active accounts)
            CASE WHEN COALESCE(fd.friend_count, 0) < 10 
                 AND COALESCE(fd.friend_count, 0) > 0 THEN 4 ELSE 0 END +
            -- Isolated in graph (from Neo4j export)
            CASE WHEN rpe.is_isolated = true THEN 7 ELSE 0 END
        )::INTEGER AS score
    FROM friends f
    LEFT JOIN friend_details fd ON f.id = fd.friend_id
    LEFT JOIN LATERAL (
        SELECT COUNT(*) AS mutual_count
        FROM mutual_friends mf WHERE mf.friend_id = f.id
    ) mc ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*) AS commonality_count
        FROM friend_commonalities fc
        WHERE fc.friend_a_id = f.id OR fc.friend_b_id = f.id
    ) cc ON true
    LEFT JOIN rag_profile_embeddings rpe ON f.id = rpe.friend_id
),
image_score AS (
    SELECT 
        f.id AS friend_id,
        (
            -- No portrait photo found
            CASE WHEN NOT COALESCE(photo_analysis.has_portrait, false) THEN 5 ELSE 0 END +
            -- Stock photo detected
            CASE WHEN COALESCE(photo_analysis.max_stock_score, 0) > 0.7 THEN 5 ELSE 0 END +
            -- AI-generated photo detected
            CASE WHEN COALESCE(photo_analysis.max_ai_score, 0) > 0.7 THEN 5 ELSE 0 END
        )::INTEGER AS score
    FROM friends f
    LEFT JOIN LATERAL (
        SELECT 
            bool_or(is_portrait) AS has_portrait,
            MAX(stock_photo_score) AS max_stock_score,
            MAX(ai_generated_score) AS max_ai_score
        FROM rag_photo_analysis rpa
        WHERE rpa.friend_id = f.id
    ) photo_analysis ON true
),
temporal_score AS (
    SELECT 
        f.id AS friend_id,
        (
            -- New account with many friends
            CASE WHEN fd.joined_date IS NOT NULL 
                 AND (CURRENT_DATE - fd.joined_date) < 90 
                 AND COALESCE(fd.friend_count, 0) > 500 THEN 8 ELSE 0 END +
            -- Profile changes frequently
            CASE WHEN COALESCE(snapshot_changes, 0) > 3 THEN 3 ELSE 0 END +
            -- Was previously unfriended
            CASE WHEN unfriended_before THEN 2 ELSE 0 END +
            -- Bulk friend request timing
            CASE WHEN burst_friends > 5 THEN 4 ELSE 0 END
        )::INTEGER AS score
    FROM friends f
    LEFT JOIN friend_details fd ON f.id = fd.friend_id
    LEFT JOIN LATERAL (
        SELECT COUNT(*) AS snapshot_changes
        FROM profile_snapshots ps
        WHERE ps.friend_id = f.id
        AND ps.captured_at > NOW() - INTERVAL '90 days'
    ) sc ON true
    LEFT JOIN LATERAL (
        SELECT EXISTS(
            SELECT 1 FROM unfriend_executions ue WHERE ue.friend_id = f.id
        ) AS unfriended_before
    ) uf ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*) AS burst_friends
        FROM friends f2
        WHERE f2.account_id = f.account_id
        AND f2.created_at::date = f.created_at::date
        AND f2.id != f.id
    ) bf ON true
)
SELECT 
    f.id AS friend_id,
    f.account_id,
    f.display_name,
    LEAST(ps.score, 20) AS profile_score,
    LEAST(bs.score, 20) AS behavioral_score,
    LEAST(gs.score, 30) AS graph_score,
    LEAST(is_.score, 15) AS image_score,
    LEAST(ts.score, 15) AS temporal_score,
    LEAST(
        COALESCE(ps.score, 0) + COALESCE(bs.score, 0) + 
        COALESCE(gs.score, 0) + COALESCE(is_.score, 0) + 
        COALESCE(ts.score, 0), 
        100
    ) AS total_fake_score,
    CASE 
        WHEN COALESCE(ps.score, 0) + COALESCE(bs.score, 0) + 
             COALESCE(gs.score, 0) + COALESCE(is_.score, 0) + 
             COALESCE(ts.score, 0) >= 70 THEN 'CRITICAL'
        WHEN COALESCE(ps.score, 0) + COALESCE(bs.score, 0) + 
             COALESCE(gs.score, 0) + COALESCE(is_.score, 0) + 
             COALESCE(ts.score, 0) >= 50 THEN 'HIGH'
        WHEN COALESCE(ps.score, 0) + COALESCE(bs.score, 0) + 
             COALESCE(gs.score, 0) + COALESCE(is_.score, 0) + 
             COALESCE(ts.score, 0) >= 30 THEN 'MEDIUM'
        WHEN COALESCE(ps.score, 0) + COALESCE(bs.score, 0) + 
             COALESCE(gs.score, 0) + COALESCE(is_.score, 0) + 
             COALESCE(ts.score, 0) >= 15 THEN 'LOW'
        ELSE 'SAFE'
    END AS risk_category
FROM friends f
LEFT JOIN profile_score ps ON f.id = ps.friend_id
LEFT JOIN behavioral_score bs ON f.id = bs.friend_id
LEFT JOIN graph_score gs ON f.id = gs.friend_id
LEFT JOIN image_score is_ ON f.id = is_.friend_id
LEFT JOIN temporal_score ts ON f.id = ts.friend_id;

CREATE UNIQUE INDEX ON rag_fake_score_mv(friend_id);
CREATE INDEX ON rag_fake_score_mv(total_fake_score DESC);
CREATE INDEX ON rag_fake_score_mv(risk_category);
```

### 7.3 Scam Pattern Detection

```python
class ScamPatternDetector:
    """Detect specific scam patterns using multi-signal analysis."""
    
    PATTERNS = {
        "ROMANCE_SCAM": {
            "signals": [
                ("graph", "zero_mutual_friends", 0.3),
                ("image", "stock_or_ai_photo", 0.25),
                ("profile", "attractive_young_person", 0.2),
                ("temporal", "new_account", 0.15),
                ("behavioral", "low_local_engagement", 0.1),
            ],
            "threshold": 0.6,
        },
        "INVESTMENT_SCAM": {
            "signals": [
                ("content", "crypto_forex_keywords", 0.35),
                ("behavioral", "repost_heavy", 0.2),
                ("profile", "fake_wealth_signals", 0.2),
                ("graph", "few_mutual_friends", 0.15),
                ("temporal", "bulk_friend_timing", 0.1),
            ],
            "threshold": 0.5,
        },
        "BOT_FARM": {
            "signals": [
                ("content", "duplicate_content_hash", 0.3),
                ("temporal", "coordinated_posting", 0.25),
                ("graph", "cluster_of_similar_profiles", 0.2),
                ("behavioral", "uniform_engagement", 0.15),
                ("profile", "template_profile", 0.1),
            ],
            "threshold": 0.55,
        },
        "IMPERSONATION": {
            "signals": [
                ("profile", "similar_name_to_existing", 0.35),
                ("image", "different_face_same_name", 0.3),
                ("graph", "overlapping_mutual_friends", 0.2),
                ("temporal", "recent_account", 0.15),
            ],
            "threshold": 0.5,
        },
    }
    
    @staticmethod
    def detect_investment_scam_content(posts: list[str]) -> float:
        """NLP-based detection of investment scam content."""
        keywords_vi = [
            "đầu tư", "lợi nhuận", "thu nhập thụ động", "tài chính",
            "forex", "crypto", "bitcoin", "kiếm tiền online",
            "passive income", "freedom", "financial freedom",
            "hệ thống", "tự động", "cam kết lợi nhuận",
        ]
        if not posts:
            return 0.0
        
        match_count = 0
        for post in posts:
            lower = post.lower() if post else ""
            if any(kw in lower for kw in keywords_vi):
                match_count += 1
        
        return min(match_count / max(len(posts), 1), 1.0)
```

---

## 8. PostgreSQL RAG Schema — V9 Migration

```sql
-- ============================================================
-- V9: RAG Support — Vector Store, Feature Store, Analysis Tables
-- Date: 2026-07-24
-- Ref: RAG Database Implementation Guide
-- ============================================================

-- ── 1. Enable pgvector extension ────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 2. Profile Embeddings (text + graph + fused) ────────────
CREATE TABLE IF NOT EXISTS rag_profile_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    friend_id UUID NOT NULL UNIQUE REFERENCES friends(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES facebook_accounts(id) ON DELETE CASCADE,
    
    -- Text embedding (BGE-M3, dim=1024)
    profile_text_embedding vector(1024),
    
    -- Graph embedding (FastRP from Neo4j, dim=128)
    graph_embedding vector(128),
    
    -- Face embedding (ArcFace from InsightFace, dim=512)
    face_embedding vector(512),
    
    -- Fused embedding (PCA reduced, dim=512)
    fused_embedding vector(512),
    
    -- Neo4j graph metrics (synced from Neo4j)
    community_id INTEGER,
    pagerank_score DOUBLE PRECISION,
    betweenness_score DOUBLE PRECISION,
    is_isolated BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    model_version VARCHAR(50) DEFAULT 'bge-m3',
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW indexes for vector similarity search (~1M records)
CREATE INDEX IF NOT EXISTS idx_rag_text_hnsw ON rag_profile_embeddings
    USING hnsw (profile_text_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);

CREATE INDEX IF NOT EXISTS idx_rag_fused_hnsw ON rag_profile_embeddings
    USING hnsw (fused_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);

CREATE INDEX IF NOT EXISTS idx_rag_face_hnsw ON rag_profile_embeddings
    USING hnsw (face_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);

CREATE INDEX IF NOT EXISTS idx_rag_pe_community ON rag_profile_embeddings(community_id);

-- ── 3. Post Content Embeddings ──────────────────────────────
CREATE TABLE IF NOT EXISTS rag_post_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    friend_post_id UUID NOT NULL REFERENCES friend_posts(id) ON DELETE CASCADE,
    content_embedding vector(1024),
    model_version VARCHAR(50) DEFAULT 'bge-m3',
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_post_hnsw ON rag_post_embeddings
    USING hnsw (content_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);

-- ── 4. Photo Analysis Results ───────────────────────────────
CREATE TABLE IF NOT EXISTS rag_photo_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    photo_id UUID NOT NULL,  -- references friend_photos(id) if table exists
    friend_id UUID NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
    
    -- Classification
    photo_type VARCHAR(30) NOT NULL DEFAULT 'NO_FACE'
        CHECK (photo_type IN (
            'NO_FACE', 'PORTRAIT_CLOSEUP', 'PORTRAIT_HALF',
            'FULL_BODY', 'GROUP_PHOTO', 'STOCK_SUSPECT', 'AI_SUSPECT'
        )),
    face_count INTEGER DEFAULT 0,
    face_area_ratio DECIMAL(5,4) DEFAULT 0,
    face_quality_score DECIMAL(5,4) DEFAULT 0,
    
    -- Fake detection signals
    stock_photo_score DECIMAL(5,4) DEFAULT 0,
    ai_generated_score DECIMAL(5,4) DEFAULT 0,
    has_real_face BOOLEAN DEFAULT FALSE,
    is_portrait BOOLEAN DEFAULT FALSE,
    
    -- Face embedding for comparison (ArcFace, dim=512)
    face_embedding vector(512),
    
    -- Demographics (from InsightFace)
    age_estimate INTEGER,
    gender_estimate VARCHAR(5),
    
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_photo_friend ON rag_photo_analysis(friend_id);
CREATE INDEX IF NOT EXISTS idx_rag_photo_type ON rag_photo_analysis(photo_type);

-- ── 5. Community Detection Results ──────────────────────────
CREATE TABLE IF NOT EXISTS rag_communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    account_id UUID NOT NULL REFERENCES facebook_accounts(id) ON DELETE CASCADE,
    community_label INTEGER NOT NULL,
    community_name VARCHAR(200),
    member_count INTEGER DEFAULT 0,
    avg_fake_score DECIMAL(5,2) DEFAULT 0,
    high_risk_count INTEGER DEFAULT 0,
    dominant_location VARCHAR(200),
    dominant_school VARCHAR(200),
    dominant_company VARCHAR(200),
    modularity_score DECIMAL(6,4),
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rag_community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    community_id UUID NOT NULL REFERENCES rag_communities(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
    membership_score DECIMAL(5,4) DEFAULT 1.0,
    is_bridge BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(community_id, friend_id)
);

-- ── 6. RAG Fake Assessments (final scores) ──────────────────
CREATE TABLE IF NOT EXISTS rag_fake_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    friend_id UUID NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES facebook_accounts(id) ON DELETE CASCADE,
    
    -- Multi-dimensional scores
    profile_score INTEGER DEFAULT 0 CHECK (profile_score BETWEEN 0 AND 20),
    behavioral_score INTEGER DEFAULT 0 CHECK (behavioral_score BETWEEN 0 AND 20),
    graph_score INTEGER DEFAULT 0 CHECK (graph_score BETWEEN 0 AND 30),
    image_score INTEGER DEFAULT 0 CHECK (image_score BETWEEN 0 AND 15),
    temporal_score INTEGER DEFAULT 0 CHECK (temporal_score BETWEEN 0 AND 15),
    
    -- Composite
    total_fake_score INTEGER DEFAULT 0 CHECK (total_fake_score BETWEEN 0 AND 100),
    risk_category VARCHAR(20) DEFAULT 'UNKNOWN'
        CHECK (risk_category IN ('SAFE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'UNKNOWN')),
    
    -- Scam pattern detection
    scam_patterns JSONB DEFAULT '[]',  -- [{type: "ROMANCE_SCAM", score: 0.7, ...}]
    
    -- Explanation
    risk_factors JSONB DEFAULT '[]',
    llm_explanation TEXT,
    
    -- ML scores
    isolation_forest_score DECIMAL(6,4),
    community_anomaly_score DECIMAL(6,4),
    
    -- Metadata
    model_version VARCHAR(50),
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(friend_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_rag_fake_score ON rag_fake_assessments(total_fake_score DESC);
CREATE INDEX IF NOT EXISTS idx_rag_fake_risk ON rag_fake_assessments(risk_category);

-- ── 7. RAG Query Audit Log ──────────────────────────────────
CREATE TABLE IF NOT EXISTS rag_query_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    account_id UUID NOT NULL REFERENCES facebook_accounts(id),
    query_text TEXT NOT NULL,
    query_intent VARCHAR(50),
    results_count INTEGER,
    response_text TEXT,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. Update crawl_jobs constraint for RAG jobs ────────────
ALTER TABLE crawl_jobs DROP CONSTRAINT IF EXISTS crawl_jobs_job_type_check;
ALTER TABLE crawl_jobs ADD CONSTRAINT crawl_jobs_job_type_check
    CHECK (job_type IN (
        'FRIEND_LIST', 'POSTS', 'FRIEND_DETAIL', 'DELETE',
        'GROUP_POSTS', 'GROUP_COMMENTS', 'EVENT_PREDICT',
        'FRIEND_POSTS', 'FRIEND_POST_COMMENTS',
        'FRIEND_PROFILE', 'GRAPH_SYNC',
        'RAG_EMBED', 'RAG_SCORE', 'RAG_PHOTO_ANALYZE',  -- NEW
        'FOLLOWING_LIST', 'FOLLOWER_LIST',
        'FRIEND_REQUEST_SENT', 'FRIEND_REQUEST_RECEIVED'
    ));
```

---

## 9. Neo4j Schema & Cypher Queries

### 9.1 Initial Data Ingestion (PostgreSQL → Neo4j)

```python
from neo4j import GraphDatabase

def sync_pg_to_neo4j(pg_dsn: str, neo4j_uri: str, neo4j_auth: tuple):
    """Sync friend data from PostgreSQL to Neo4j."""
    import psycopg
    
    driver = GraphDatabase.driver(neo4j_uri, auth=neo4j_auth)
    
    with psycopg.connect(pg_dsn) as conn:
        with conn.cursor() as cur:
            # 1. Sync Person nodes
            cur.execute("""
                SELECT f.fb_friend_id, f.display_name, f.status,
                       fd.friend_count, fd.mutual_friend_count,
                       fd.current_city, fd.hometown,
                       fd.profile_completeness, fd.profile_photo_count,
                       fd.education_details, fd.work_details,
                       fs.fake_score, fs.activity_score,
                       (SELECT COUNT(*) FROM friend_posts fp WHERE fp.friend_id = f.id) AS post_count
                FROM friends f
                LEFT JOIN friend_details fd ON f.id = fd.friend_id
                LEFT JOIN friend_scores fs ON f.id = fs.friend_id
                WHERE f.account_id = '00000000-0000-0000-0000-000000000002'
            """)
            friends = cur.fetchall()
            
            with driver.session() as session:
                for row in friends:
                    session.run("""
                        MERGE (p:Person {fb_id: $fb_id})
                        SET p.display_name = $name,
                            p.status = $status,
                            p.friend_count = $friend_count,
                            p.mutual_friend_count = $mutual_count,
                            p.current_city = $city,
                            p.hometown = $hometown,
                            p.profile_completeness = $completeness,
                            p.photo_count = $photo_count,
                            p.fake_score = $fake_score,
                            p.activity_score = $activity_score,
                            p.post_count = $post_count
                    """, {
                        "fb_id": row[0], "name": row[1], "status": row[2],
                        "friend_count": row[3] or 0, "mutual_count": row[4] or 0,
                        "city": row[5], "hometown": row[6],
                        "completeness": row[7] or 0, "photo_count": row[8] or 0,
                        "fake_score": row[11] or 0, "activity_score": row[12] or 0,
                        "post_count": row[13] or 0
                    })
                
                # 2. Create Location nodes
                session.run("""
                    MATCH (p:Person) WHERE p.current_city IS NOT NULL
                    MERGE (l:Location {name: p.current_city})
                    MERGE (p)-[:LIVES_IN]->(l)
                """)
                
                # 3. Create School nodes from education_details
                session.run("""
                    MATCH (p:Person)
                    UNWIND p.education_details AS edu
                    WITH p, edu WHERE edu.school IS NOT NULL
                    MERGE (s:School {name: edu.school})
                    MERGE (p)-[:STUDIED_AT {degree: edu.degree}]->(s)
                """)
                
                # 4. Create Organization nodes from work_details
                session.run("""
                    MATCH (p:Person)
                    UNWIND p.work_details AS work
                    WITH p, work WHERE work.company IS NOT NULL
                    MERGE (o:Organization {name: work.company})
                    MERGE (p)-[:WORKS_AT {position: work.position}]->(o)
                """)
            
            # 5. Sync mutual friend edges
            cur.execute("""
                SELECT f1.fb_friend_id AS source_fb_id,
                       mf.mutual_fb_id AS target_fb_id,
                       mf.mutual_name
                FROM mutual_friends mf
                JOIN friends f1 ON mf.friend_id = f1.id
                WHERE f1.account_id = '00000000-0000-0000-0000-000000000002'
            """)
            mutual_edges = cur.fetchall()
            
            with driver.session() as session:
                for src, tgt, name in mutual_edges:
                    session.run("""
                        MATCH (a:Person {fb_id: $src})
                        MERGE (b:Person {fb_id: $tgt})
                        ON CREATE SET b.display_name = $name
                        MERGE (a)-[:IS_FRIEND_OF]->(b)
                    """, {"src": src, "tgt": tgt, "name": name})
    
    driver.close()
    print(f"Synced {len(friends)} persons and {len(mutual_edges)} edges to Neo4j")
```

---

## 10. Data Sync Pipeline — PostgreSQL ↔ Neo4j

### 10.1 Sync Architecture

```mermaid
flowchart LR
    subgraph PG["PostgreSQL (Source of Truth)"]
        P1["friends\nfriend_details"]
        P2["mutual_friends\nfriend_commonalities"]
        P3["friend_posts"]
    end

    subgraph Sync["Sync Pipeline (Python Cron)"]
        S1["PG → Neo4j\n(Nodes + Edges)"]
        S2["Neo4j GDS\n(Algorithms)"]
        S3["Neo4j → PG\n(Results export)"]
    end

    subgraph N4J["Neo4j (Graph Analytics)"]
        N1["Person nodes"]
        N2["Relationship edges"]
        N3["GDS results"]
    end

    P1 -->|"Cron: hourly"| S1
    P2 -->|"Cron: hourly"| S1
    S1 --> N1
    S1 --> N2
    N1 --> S2
    N2 --> S2
    S2 --> N3
    N3 -->|"Cron: daily"| S3
    S3 -->|"Write back"| PG
```

### 10.2 Orchestrator

```python
class RAGPipelineOrchestrator:
    """Orchestrate the full RAG pipeline: Extract → Embed → Score → Sync."""
    
    def __init__(self, pg_dsn, neo4j_uri, neo4j_auth):
        self.pg_dsn = pg_dsn
        self.neo4j_uri = neo4j_uri
        self.neo4j_auth = neo4j_auth
        self.text_embedder = TextEmbedder(device="cuda")
        self.avatar_analyzer = AvatarAnalyzer(ctx_id=0)
        self.query_handler = RAGQueryHandler(model="qwen3:8b")
    
    def run_full_pipeline(self):
        """Run the complete RAG pipeline."""
        print("=" * 60)
        print("  RAG Pipeline — Full Execution")
        print("=" * 60)
        
        # Stage 1: Sync PG → Neo4j
        print("\n[1/6] Syncing PostgreSQL → Neo4j...")
        sync_pg_to_neo4j(self.pg_dsn, self.neo4j_uri, self.neo4j_auth)
        
        # Stage 2: Run Neo4j GDS algorithms
        print("\n[2/6] Running Neo4j GDS algorithms...")
        self._run_gds_algorithms()
        
        # Stage 3: Export Neo4j results → PostgreSQL
        print("\n[3/6] Exporting Neo4j results → PostgreSQL...")
        export_fastrp_to_postgres(self.neo4j_uri, self.neo4j_auth, self.pg_dsn)
        
        # Stage 4: Generate text embeddings (BGE-M3)
        print("\n[4/6] Generating text embeddings (BGE-M3)...")
        self._generate_text_embeddings()
        
        # Stage 5: Analyze photos (InsightFace)
        print("\n[5/6] Analyzing photos (InsightFace)...")
        self._analyze_photos()
        
        # Stage 6: Compute fake scores
        print("\n[6/6] Computing fake scores...")
        self._compute_scores()
        
        print("\n✅ Pipeline complete!")
    
    def _run_gds_algorithms(self):
        """Execute Neo4j GDS algorithm pipeline."""
        driver = GraphDatabase.driver(self.neo4j_uri, auth=self.neo4j_auth)
        with driver.session() as session:
            # Drop existing projection
            try:
                session.run("CALL gds.graph.drop('social-graph', false)")
            except:
                pass
            
            # Project graph
            session.run("""
                CALL gds.graph.project(
                    'social-graph', 'Person',
                    {IS_FRIEND_OF: {orientation: 'UNDIRECTED'}}
                )
            """)
            
            # Run algorithms sequentially
            for algo, config in [
                ("gds.louvain.write", {"writeProperty": "community_id"}),
                ("gds.wcc.write", {"writeProperty": "component_id"}),
                ("gds.pageRank.write", {"writeProperty": "pagerank_score"}),
                ("gds.betweenness.write", {"writeProperty": "betweenness_score", "samplingSize": 10000}),
                ("gds.fastRP.write", {
                    "writeProperty": "fastrp_embedding",
                    "embeddingDimension": 128,
                    "iterationWeights": [0.0, 1.0, 1.0, 0.8, 0.5]
                }),
            ]:
                result = session.run(f"CALL {algo}('social-graph', $config)", config=config)
                print(f"  ✓ {algo.split('.')[-2]}")
        
        driver.close()
    
    def _generate_text_embeddings(self):
        """Generate BGE-M3 embeddings for all friend profiles."""
        import psycopg
        
        with psycopg.connect(self.pg_dsn) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT f.id, f.display_name, fd.bio_text, fd.about_text,
                           fd.current_city, fd.hometown, fd.work_details,
                           fd.education_details
                    FROM friends f
                    LEFT JOIN friend_details fd ON f.id = fd.friend_id
                    LEFT JOIN rag_profile_embeddings rpe ON f.id = rpe.friend_id
                    WHERE rpe.profile_text_embedding IS NULL
                    LIMIT 5000
                """)
                rows = cur.fetchall()
                
                for row in rows:
                    detail = {
                        "display_name": row[1], "bio_text": row[2],
                        "about_text": row[3], "current_city": row[4],
                        "hometown": row[5], "work_details": row[6] or [],
                        "education_details": row[7] or []
                    }
                    result = self.text_embedder.embed_profile(detail)
                    emb_str = "[" + ",".join(str(x) for x in result["dense"]) + "]"
                    
                    cur.execute("""
                        INSERT INTO rag_profile_embeddings (friend_id, account_id, profile_text_embedding)
                        SELECT %s, f.account_id, %s::vector(1024)
                        FROM friends f WHERE f.id = %s
                        ON CONFLICT (friend_id) DO UPDATE SET
                            profile_text_embedding = EXCLUDED.profile_text_embedding,
                            updated_at = NOW()
                    """, (row[0], emb_str, row[0]))
                
                conn.commit()
        print(f"  Generated {len(rows)} text embeddings")
    
    def _analyze_photos(self):
        """Run InsightFace analysis on friend photos."""
        # Delegate to batch processing function
        import asyncio
        asyncio.run(analyze_all_friend_photos(self.pg_dsn, self.avatar_analyzer))
    
    def _compute_scores(self):
        """Refresh materialized view for fake scores."""
        import psycopg
        with psycopg.connect(self.pg_dsn) as conn:
            with conn.cursor() as cur:
                cur.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY rag_fake_score_mv")
            conn.commit()
        print("  Refreshed rag_fake_score_mv")
```

---

## 11. RAG Query Pipeline

### 11.1 Hybrid Retrieval Flow

```mermaid
sequenceDiagram
    participant User
    participant Router
    participant PGVector
    participant Neo4j
    participant FeatureStore
    participant Reranker
    participant LLM

    User->>Router: "Những ai có khả năng là tài khoản ảo?"
    Router->>Router: Intent: FAKE_DETECTION

    par Parallel retrieval
        Router->>PGVector: Semantic search (top-50)
        Router->>FeatureStore: SQL filter (fake_score > 40)
        Router->>Neo4j: Graph: isolated + anomaly nodes
    end

    PGVector-->>Router: 50 similar profiles
    FeatureStore-->>Router: N high-risk profiles
    Neo4j-->>Router: M anomalous nodes

    Router->>Router: Merge + deduplicate
    Router->>Reranker: Re-rank top-30 (WRRF)
    Reranker-->>Router: Top-15 ranked results

    Router->>LLM: Context: top-15 profiles + graph data
    LLM-->>User: "Phát hiện 12 tài khoản đáng nghi..."
```

### 11.2 Query Intent Classification

```python
QUERY_INTENTS = {
    "FAKE_DETECTION": {
        "keywords": ["fake", "ảo", "giả", "bot", "scam", "lừa đảo", "đáng nghi", "suspicious"],
        "strategy": "feature_store + graph_anomaly + vector_similarity",
    },
    "RELATIONSHIP_EVAL": {
        "keywords": ["mối quan hệ", "thân", "quen", "relationship", "gần gũi", "tương tác"],
        "strategy": "relationship_scores + graph_centrality",
    },
    "COMMUNITY_DISCOVERY": {
        "keywords": ["nhóm", "cộng đồng", "community", "cluster", "chia", "phân loại"],
        "strategy": "neo4j_community + feature_aggregation",
    },
    "SIMILAR_PROFILES": {
        "keywords": ["giống", "tương tự", "similar", "liên quan"],
        "strategy": "vector_similarity + graph_neighbors",
    },
    "ACTIVITY_ANALYSIS": {
        "keywords": ["hoạt động", "active", "ghost", "inactive", "đăng bài"],
        "strategy": "behavioral_features + temporal_analysis",
    },
}
```

---

## 12. Deployment & Infrastructure

### 12.1 Docker Compose Addition

```yaml
# Add to existing docker-compose.yml
services:
  # ... existing pda services ...
  
  # Ollama (Local LLM)
  ollama:
    image: ollama/ollama:latest
    container_name: pda-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

  # RAG Worker (Python pipeline)
  rag-worker:
    build:
      context: ./pda-rag
      dockerfile: Dockerfile
    container_name: pda-rag-worker
    environment:
      - PG_DSN=postgresql://pda:pda@postgres:5432/pda
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=password
      - OLLAMA_HOST=http://ollama:11434
    depends_on:
      - postgres
      - neo4j
      - ollama
    volumes:
      - ./pda-rag:/app
    restart: unless-stopped

volumes:
  ollama_data:
```

### 12.2 Cron Schedule

```
# RAG Pipeline Cron Jobs
# ──────────────────────────────────────────────
# PG → Neo4j sync (every 2 hours)
0 */2 * * * python /app/sync_pg_neo4j.py

# Neo4j GDS algorithms (daily 2am)
0 2 * * * python /app/run_gds_algorithms.py

# Text embeddings (daily 3am)
0 3 * * * python /app/generate_embeddings.py

# Photo analysis (daily 4am)
0 4 * * * python /app/analyze_photos.py

# Fake score refresh (daily 5am)
0 5 * * * python /app/refresh_scores.py

# Neo4j → PG export (daily 5:30am)
30 5 * * * python /app/export_neo4j_results.py
```

---

## Tham Khảo

### Papers SOTA (đã đọc)
- [Graph-based Fake Account Detection Survey (2025)](../papers/SYNTHESIS_fake_account_detection_sota.md)
- [TwiBot-22 Benchmark](../papers/02_twibot22_benchmark.md)
- [SYBILGAT (2024)](../papers/03_sybilgat_2024.md)
- [Graph Clustering Survey (2024)](../papers/04_graph_clustering_survey.md)
- [Cluster-Aware Anomaly Detection](../papers/06_cluster_aware_anomaly.md)
- [LLM Social Bot Detection (2025)](../papers/08_llm_social_bot_2025.md)

### Neo4j GDS Documentation
- [Neo4j GDS - Community Detection](https://neo4j.com/docs/graph-data-science/current/algorithms/community-detection/)
- [Neo4j GDS - FastRP](https://neo4j.com/docs/graph-data-science/current/machine-learning/node-embeddings/fastrp/)
- [Neo4j GDS - Fraud Detection](https://neo4j.com/developer/graph-data-science/fraud-detection/)

### Embedding & LLM
- [BGE-M3 on HuggingFace](https://huggingface.co/BAAI/bge-m3)
- [InsightFace Documentation](https://github.com/deepinsight/insightface)
- [Ollama Models](https://ollama.com/library)
- [pgvector HNSW](https://github.com/pgvector/pgvector#hnsw)
