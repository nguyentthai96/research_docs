# 🧠 RAG Database — Implementation Plan (Updated)

> **Status**: ✅ Research & Design Complete → Awaiting Approval for Execution
> **Last Updated**: 2026-07-24

---

## Decisions Finalized (from User Feedback)

| # | Decision | User Input | Final Choice |
|---|----------|-----------|--------------|
| D1 | Embedding model | "model trung bình tối ưu" | **BGE-M3** (1024d) — SOTA cho Vietnamese, hybrid search |
| D2 | Graph store | "có cả PostgreSQL và Neo4j" | **Dual-store**: PG (OLTP + vector) + Neo4j (GDS algorithms) |
| D3 | LLM backend | "local LLM" | **Ollama + Qwen3-8B** |
| D4 | Data volume | "500K friends, 1M posts" | pgvector HNSW index, Neo4j GDS với samplingSize |
| D5 | Image analysis | "cần phân biệt ảnh chân dung" | **InsightFace** (RetinaFace + ArcFace) |
| D6 | Scope | "phương án tối ưu" | Full pipeline: Embed → Score → Graph → Query |
| D7 | Index strategy | ~1M records | **HNSW** (dynamic data, no reindex needed) |

---

## Implementation Guide Created

> [!IMPORTANT]
> Tài liệu triển khai chi tiết đã được tạo tại:
> [rag_database_implementation_guide.md](file:///home/nguyentthai96/Desktop/bigbang/research_docs/guides/rag_database_implementation_guide.md)

### Nội dung tài liệu (12 sections):

1. **Kiến Trúc Tổng Quan** — Dual-store hybrid architecture diagram
2. **Technology Stack** — Decision log + full dependency list
3. **Neo4j GDS — SOTA Algorithms** — Louvain, WCC, PageRank, Betweenness, FastRP (full Cypher)
4. **Embedding Strategy** — BGE-M3 text + FastRP graph + ArcFace face → PCA fusion (512d)
5. **Image Analysis Pipeline** — InsightFace face detection, portrait classification, stock/AI detection
6. **Local LLM** — Ollama + Qwen3-8B RAG query handler
7. **Fake Detection Scoring** — 5-dimension scoring (profile/behavioral/graph/image/temporal)
8. **PostgreSQL V9 Migration** — Complete SQL for RAG tables + HNSW indexes
9. **Neo4j Schema** — Full Cypher for data ingestion + GDS pipeline
10. **Data Sync Pipeline** — PG ↔ Neo4j bidirectional sync
11. **RAG Query Pipeline** — Hybrid retrieval (vector + graph + keyword) + WRRF re-ranking
12. **Deployment** — Docker Compose + Cron schedule

---

## Execution Phases

### Phase 1: Database Schema (V9 migration)
- [ ] Apply V9__rag_support.sql migration
- [ ] Verify pgvector extension + HNSW indexes
- [ ] Create materialized views

### Phase 2: Neo4j Setup
- [ ] Create Neo4j constraints & indexes
- [ ] Sync PostgreSQL → Neo4j (initial load)
- [ ] Run GDS pipeline (Louvain → PageRank → FastRP)
- [ ] Export FastRP embeddings → PostgreSQL

### Phase 3: Embedding Pipeline
- [ ] Setup BGE-M3 via Ollama
- [ ] Generate text embeddings for all profiles
- [ ] Generate post content embeddings (1M posts)
- [ ] Fuse text + graph embeddings → PCA reduction

### Phase 4: Image Analysis
- [ ] Setup InsightFace (buffalo_l pack)
- [ ] Analyze friend profile photos
- [ ] Extract face embeddings (ArcFace 512d)
- [ ] Classify portrait types & detect stock/AI photos

### Phase 5: Scoring & Detection
- [ ] Compute multi-dimensional fake scores
- [ ] Run Isolation Forest anomaly detection
- [ ] Detect scam patterns (romance/investment/bot farm)
- [ ] Generate LLM explanations

### Phase 6: RAG Query Engine
- [ ] Setup Ollama + Qwen3-8B
- [ ] Implement hybrid retrieval pipeline
- [ ] Implement WRRF re-ranking
- [ ] Test with sample queries

---

## Verification Plan

### Automated Tests
```bash
# 1. Schema migration
psql -f V9__rag_support.sql && echo "✅ Migration OK"

# 2. Neo4j GDS pipeline
python -m pytest tests/test_neo4j_gds.py -v

# 3. Embedding generation
python -m pytest tests/test_embeddings.py -v

# 4. Face analysis
python -m pytest tests/test_face_analysis.py -v

# 5. Scoring accuracy
python -m pytest tests/test_fake_scoring.py -v

# 6. RAG queries
python -m pytest tests/test_rag_queries.py -v
```

### Manual Verification
- User reviews top-20 suspicious accounts → confirm fake/real labels
- User validates community clustering matches real social circles
- User tests RAG queries in Vietnamese
- Compare RAG fake_score vs. existing friend_scores
