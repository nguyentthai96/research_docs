# 🕸️ Social Graph Analysis — Neo4j GDS Deep Dive

> **Nghiên cứu chuyên sâu: Neo4j Graph Data Science cho phân tích mạng xã hội Facebook**
> Centrality · Community Detection · Link Prediction · Graph ML — Zero to Hero
> Cập nhật: Tháng 7/2026

---

## Mục Lục

1. [Nền Tảng: Graph Theory & Social Network Analysis](#1-nền-tảng-graph-theory--social-network-analysis)
2. [Neo4j Foundations — Setup & Data Model](#2-neo4j-foundations--setup--data-model)
3. [Import Facebook Data vào Neo4j](#3-import-facebook-data-vào-neo4j)
4. [Neo4j GDS — Graph Data Science Library](#4-neo4j-gds--graph-data-science-library)
5. [Centrality Algorithms — Ai Quan Trọng Nhất?](#5-centrality-algorithms--ai-quan-trọng-nhất)
6. [Community Detection — Phát Hiện Nhóm](#6-community-detection--phát-hiện-nhóm)
7. [Link Prediction — Gợi Ý Bạn Bè](#7-link-prediction--gợi-ý-bạn-bè)
8. [Graph Embeddings & Machine Learning](#8-graph-embeddings--machine-learning)
9. [Python Integration — End-to-End Pipeline](#9-python-integration--end-to-end-pipeline)
10. [Visualization & Reporting](#10-visualization--reporting)
11. [Use Cases & Ứng Dụng Thực Tế](#11-use-cases--ứng-dụng-thực-tế)
12. [Lộ Trình Học Tập](#12-lộ-trình-học-tập)

---

## 1. Nền Tảng: Graph Theory & Social Network Analysis

### 1.1 Tại Sao Dùng Graph Cho Mạng Xã Hội?

```
Relational DB (SQL):                    Graph DB (Neo4j):
┌──────┐  ┌──────────────┐              Alice ──FRIEND── Bob
│Users │  │ Friendships  │                │                │
├──────┤  ├──────────────┤              FRIEND          FRIEND
│id    │  │user_id_1     │                │                │
│name  │  │user_id_2     │              Carol ──FRIEND── Dave
│...   │  │created_at    │
└──────┘  └──────────────┘

"Tìm bạn chung của Alice và Bob":

SQL: 3 JOINs, complex subquery        Cypher: MATCH pattern traversal
→ O(n²) với dataset lớn               → O(k) k = số relationships
→ CHẬM khi network lớn                → NHANH bất kể network size
```

**Graph = native model cho mạng xã hội** vì:
- **Relationships là first-class citizens** (không cần JOIN)
- **Traversal = constant time per hop** (không phụ thuộc vào tổng số records)
- **Pattern matching tự nhiên** (Friends-of-Friends chỉ cần 2 hops)

### 1.2 Các Khái Niệm Cơ Bản

```
┌──────────────────────────────────────────────────────────────┐
│                GRAPH FUNDAMENTALS                            │
│                                                              │
│  NODE (Đỉnh):                                               │
│  • Đại diện cho một entity (Person, Page, Post)              │
│  • Có properties (name, age, location)                       │
│  • Có labels (:Person, :Post, :Group)                        │
│                                                              │
│  RELATIONSHIP (Cạnh):                                        │
│  • Kết nối 2 nodes                                           │
│  • Có type: [:FRIEND_WITH], [:POSTED], [:LIKES]              │
│  • Có direction (nhưng có thể traverse cả 2 hướng)           │
│  • Có properties (since, weight, strength)                   │
│                                                              │
│  PROPERTY: key-value data trên node hoặc relationship        │
│  LABEL: category/type của node (:Person, :Company)           │
│  PATH: chuỗi nodes + relationships nối liền                  │
│                                                              │
│  UNDIRECTED vs DIRECTED:                                     │
│  • Facebook friendship = UNDIRECTED (A bạn B ↔ B bạn A)     │
│  • Twitter follow = DIRECTED (A follow B ≠ B follow A)      │
└──────────────────────────────────────────────────────────────┘
```

### 1.3 Social Network Analysis (SNA) — Các Câu Hỏi Cốt Lõi

| Câu hỏi SNA                                | Thuật toán GDS                  | Loại     |
|:------------------------------------------- |:------------------------------- |:-------- |
| "Ai là người ảnh hưởng nhất?"               | PageRank, Eigenvector Centrality | Centrality |
| "Ai là cầu nối giữa các nhóm?"             | Betweenness Centrality          | Centrality |
| "Ai có nhiều bạn nhất?"                     | Degree Centrality               | Centrality |
| "Có những nhóm bạn nào?"                    | Louvain, Label Propagation      | Community |
| "Ai nên kết bạn với ai?"                    | Adamic-Adar, Jaccard            | Link Prediction |
| "Có bao nhiều mạng con tách biệt?"         | Weakly Connected Components     | Pathfinding |
| "Khoảng cách trung bình giữa 2 người?"     | Shortest Path, Diameter         | Pathfinding |
| "Biểu diễn network dưới dạng vector?"      | FastRP, GraphSAGE, Node2Vec     | Embedding |

---

## 2. Neo4j Foundations — Setup & Data Model

### 2.1 Cài Đặt Neo4j + GDS

```bash
# === OPTION 1: Docker (KHUYẾN NGHỊ cho development) ===
docker run -d \
  --name neo4j \
  -p 7474:7474 \
  -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/your_password \
  -e NEO4J_PLUGINS='["graph-data-science"]' \
  -v $(pwd)/neo4j_data:/data \
  -v $(pwd)/neo4j_import:/var/lib/neo4j/import \
  neo4j:5-enterprise

# === OPTION 2: Neo4j Desktop ===
# Download từ https://neo4j.com/download/
# Cài GDS plugin qua Plugin Manager

# === Verify GDS ===
# Mở browser: http://localhost:7474
# Chạy: RETURN gds.version()
```

### 2.2 Data Model — Facebook Social Graph

```
┌──────────────────────────────────────────────────────────────────┐
│                FACEBOOK SOCIAL GRAPH MODEL                       │
│                                                                  │
│  ┌─────────────┐          ┌─────────────┐                        │
│  │  :Person     │─FRIEND──│  :Person     │                        │
│  │  id          │  WITH   │             │                        │
│  │  name        │ {since} │             │                        │
│  │  gender      │         │             │                        │
│  │  location    │         │             │                        │
│  │  workplace   │         │             │                        │
│  │  education   │         │             │                        │
│  │  birthday    │         │             │                        │
│  │  about       │         │             │                        │
│  └──────┬───────┘         └─────────────┘                        │
│         │                                                        │
│         ├── POSTED ──→ ┌──────────────┐                          │
│         │              │  :Post        │                          │
│         │              │  content      │                          │
│         │              │  timestamp    │                          │
│         │              │  type         │                          │
│         │              │  likes_count  │                          │
│         │              │  comments_cnt │                          │
│         │              └──────┬───────┘                          │
│         │                     │                                   │
│         ├── LIKES ───→ :Post  │── HAS_COMMENT ──→ :Comment       │
│         ├── MEMBER_OF →:Group │── HAS_PHOTO ────→ :Photo         │
│         ├── WORKS_AT ──→:Company                                 │
│         └── STUDIED_AT →:School                                  │
│                                                                  │
│  RELATIONSHIP TYPES:                                             │
│  • (Person)-[:FRIEND_WITH {since}]-(Person)    ← undirected     │
│  • (Person)-[:POSTED {at}]->(Post)             ← directed       │
│  • (Person)-[:LIKES]->(Post)                   ← directed       │
│  • (Person)-[:COMMENTED_ON]->(Post)            ← directed       │
│  • (Person)-[:TAGGED_IN]->(Photo)              ← directed       │
│  • (Person)-[:MEMBER_OF]->(Group)              ← directed       │
│  • (Person)-[:WORKS_AT]->(Company)             ← directed       │
│  • (Person)-[:STUDIED_AT]->(School)            ← directed       │
└──────────────────────────────────────────────────────────────────┘
```

### 2.3 Schema Setup — Cypher

```cypher
-- =============================================
-- SCHEMA SETUP: Constraints + Indexes
-- =============================================

-- Unique constraints (auto-create indexes)
CREATE CONSTRAINT person_id IF NOT EXISTS
  FOR (p:Person) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT post_id IF NOT EXISTS
  FOR (p:Post) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT group_id IF NOT EXISTS
  FOR (g:Group) REQUIRE g.id IS UNIQUE;

-- Composite indexes cho performance
CREATE INDEX person_name IF NOT EXISTS
  FOR (p:Person) ON (p.name);

CREATE INDEX post_timestamp IF NOT EXISTS
  FOR (p:Post) ON (p.timestamp);

-- Full-text search index (cho content search)
CREATE FULLTEXT INDEX post_content IF NOT EXISTS
  FOR (p:Post) ON EACH [p.content];
```

---

## 3. Import Facebook Data vào Neo4j

### 3.1 Cách Lấy Data Facebook

```
┌──────────────────────────────────────────────────────────────┐
│              LẤY DATA FACEBOOK                               │
│                                                              │
│  BƯỚC 1: Settings → Accounts Center                         │
│  BƯỚC 2: Your information and permissions                    │
│  BƯỚC 3: Download your information                           │
│  BƯỚC 4: Download or transfer information                    │
│  BƯỚC 5: Chọn:                                              │
│    • Format: JSON (BẮT BUỘC — không dùng HTML)              │
│    • Data: Friends, Posts, Likes, Comments, Photos           │
│    • Date range: All time                                    │
│    • Media quality: Low (giảm file size)                     │
│  BƯỚC 6: Create Files → chờ email → Download                │
│                                                              │
│  STRUCTURE SAU KHI GIẢI NÉN:                                │
│  facebook-data/                                              │
│  ├── friends/                                                │
│  │   └── friends.json                                        │
│  ├── posts/                                                  │
│  │   └── your_posts_1.json                                   │
│  ├── likes_and_reactions/                                     │
│  │   └── posts_and_comments.json                             │
│  ├── comments/                                               │
│  │   └── comments.json                                       │
│  ├── profile_information/                                     │
│  │   └── profile_information.json                            │
│  └── photos_and_videos/                                      │
│      └── album/                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Python Script — Parse & Import

```python
# =========================================
# FACEBOOK DATA → NEO4J IMPORT
# =========================================
import json
from pathlib import Path
from neo4j import GraphDatabase
from datetime import datetime

class FacebookNeo4jImporter:
    """Import Facebook JSON data vào Neo4j"""

    def __init__(self, uri: str = "bolt://localhost:7687",
                 user: str = "neo4j", password: str = "your_password"):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def _run_query(self, query: str, params: dict = None):
        with self.driver.session() as session:
            return session.run(query, params or {})

    # ---- FRIENDS ----
    def import_friends(self, friends_json_path: str, my_user_id: str = "me"):
        """Import friends list"""
        with open(friends_json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        friends = data.get("friends_v2", data.get("friends", []))
        print(f"📥 Importing {len(friends)} friends...")

        # Tạo node cho chính mình
        self._run_query("""
            MERGE (me:Person {id: $id})
            SET me.name = 'Me', me.is_self = true
        """, {"id": my_user_id})

        # Batch import friends
        batch_size = 500
        for i in range(0, len(friends), batch_size):
            batch = friends[i:i+batch_size]
            friends_data = []
            for friend in batch:
                name = friend.get("name", "Unknown")
                # Facebook JSON encode tên UTF-8 đặc biệt
                if isinstance(name, str):
                    name = name.encode('latin-1').decode('utf-8', errors='replace')
                timestamp = friend.get("timestamp", 0)
                friends_data.append({
                    "name": name,
                    "friend_since": datetime.fromtimestamp(timestamp).isoformat()
                        if timestamp else None
                })

            self._run_query("""
                UNWIND $friends AS f
                MERGE (friend:Person {name: f.name})
                WITH friend, f
                MATCH (me:Person {id: $my_id})
                MERGE (me)-[r:FRIEND_WITH]->(friend)
                SET r.since = f.friend_since
            """, {"friends": friends_data, "my_id": my_user_id})

        print(f"✅ Imported {len(friends)} friends")

    # ---- POSTS ----
    def import_posts(self, posts_json_path: str, my_user_id: str = "me"):
        """Import posts/timeline"""
        with open(posts_json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        posts = data if isinstance(data, list) else data.get("posts_v2", data.get("posts", []))
        print(f"📥 Importing {len(posts)} posts...")

        batch_size = 200
        for i in range(0, len(posts), batch_size):
            batch = posts[i:i+batch_size]
            posts_data = []
            for idx, post in enumerate(batch):
                content = ""
                if "data" in post:
                    for item in post["data"]:
                        if "post" in item:
                            content = item["post"]
                            if isinstance(content, str):
                                content = content.encode('latin-1').decode('utf-8', errors='replace')

                timestamp = post.get("timestamp", 0)
                post_id = f"post_{i+idx}_{timestamp}"

                # Tags (people mentioned in post)
                tags = []
                if "tags" in post:
                    tags = [t.get("name", "") for t in post.get("tags", []) if t.get("name")]

                posts_data.append({
                    "id": post_id,
                    "content": content[:5000] if content else "",  # Truncate long posts
                    "timestamp": datetime.fromtimestamp(timestamp).isoformat()
                        if timestamp else None,
                    "title": post.get("title", ""),
                    "tags": tags
                })

            self._run_query("""
                UNWIND $posts AS p
                MERGE (post:Post {id: p.id})
                SET post.content = p.content,
                    post.timestamp = p.timestamp,
                    post.title = p.title
                WITH post, p
                MATCH (me:Person {id: $my_id})
                MERGE (me)-[:POSTED]->(post)
                WITH post, p
                UNWIND p.tags AS tagName
                MERGE (tagged:Person {name: tagName})
                MERGE (tagged)-[:TAGGED_IN]->(post)
            """, {"posts": posts_data, "my_id": my_user_id})

        print(f"✅ Imported {len(posts)} posts")

    # ---- LIKES ----
    def import_likes(self, likes_json_path: str, my_user_id: str = "me"):
        """Import likes/reactions"""
        with open(likes_json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        reactions = data.get("reactions_v2", data.get("reactions", []))
        print(f"📥 Importing {len(reactions)} reactions...")

        for reaction in reactions:
            title = reaction.get("title", "")
            timestamp = reaction.get("timestamp", 0)
            reaction_type = reaction.get("data", [{}])[0].get("reaction", {}).get("reaction", "LIKE")

            self._run_query("""
                MATCH (me:Person {id: $my_id})
                MERGE (target:Content {title: $title})
                MERGE (me)-[r:REACTED_TO]->(target)
                SET r.type = $reaction_type,
                    r.timestamp = $timestamp
            """, {
                "my_id": my_user_id,
                "title": title,
                "reaction_type": reaction_type,
                "timestamp": datetime.fromtimestamp(timestamp).isoformat()
                    if timestamp else None
            })

        print(f"✅ Imported {len(reactions)} reactions")

    # ---- STATS ----
    def get_import_stats(self) -> dict:
        """Thống kê data đã import"""
        result = self._run_query("""
            MATCH (p:Person) WITH count(p) AS persons
            MATCH ()-[f:FRIEND_WITH]-() WITH persons, count(f)/2 AS friendships
            OPTIONAL MATCH (post:Post) WITH persons, friendships, count(post) AS posts
            RETURN persons, friendships, posts
        """)
        record = result.single()
        return {
            "total_persons": record["persons"],
            "total_friendships": record["friendships"],
            "total_posts": record["posts"]
        }


# ========== USAGE ==========
if __name__ == "__main__":
    importer = FacebookNeo4jImporter()

    # Import data
    importer.import_friends("facebook-data/friends/friends.json")
    importer.import_posts("facebook-data/posts/your_posts_1.json")

    # Check stats
    stats = importer.get_import_stats()
    print(f"\n📊 Database Stats:")
    print(f"  Persons: {stats['total_persons']}")
    print(f"  Friendships: {stats['total_friendships']}")
    print(f"  Posts: {stats['total_posts']}")

    importer.close()
```

---

## 4. Neo4j GDS — Graph Data Science Library

### 4.1 GDS Workflow — 3 Bước

```
┌──────────────────────────────────────────────────────────────┐
│              NEO4J GDS WORKFLOW                               │
│                                                              │
│  BƯỚC 1: GRAPH PROJECTION (bắt buộc)                        │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Neo4j Database         →    In-Memory Graph        │     │
│  │  (disk, toàn bộ data)        (RAM, subset data)     │     │
│  │                                                     │     │
│  │  Tại sao? GDS algorithms chạy trên in-memory graph  │     │
│  │  để đạt tốc độ tối đa (parallelized computation)   │     │
│  └─────────────────────────────────────────────────────┘     │
│                          ↓                                   │
│  BƯỚC 2: RUN ALGORITHM                                      │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  4 Execution Modes:                                 │     │
│  │  • .stream() → trả kết quả về client (xem results) │     │
│  │  • .write()  → ghi kết quả vào DB (persistent)     │     │
│  │  • .mutate() → ghi vào in-memory graph (tạm thời)  │     │
│  │  • .stats()  → chỉ trả statistics (overview)       │     │
│  └─────────────────────────────────────────────────────┘     │
│                          ↓                                   │
│  BƯỚC 3: CONSUME RESULTS                                    │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Dùng kết quả cho:                                  │     │
│  │  • Visualization (Neo4j Bloom, D3.js)               │     │
│  │  • Downstream analysis (Python, Pandas)             │     │
│  │  • Machine learning features                        │     │
│  │  • Business insights / reporting                    │     │
│  └─────────────────────────────────────────────────────┘     │
│                          ↓                                   │
│  CLEANUP: Drop in-memory graph khi xong                     │
│  CALL gds.graph.drop('myGraph')                             │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Graph Projection — Cypher

```cypher
-- =============================================
-- GRAPH PROJECTION: Load social network vào RAM
-- =============================================

-- Native Projection (nhanh nhất, dùng labels/types trực tiếp)
CALL gds.graph.project(
  'social-graph',                    -- Tên projection
  'Person',                          -- Node label
  {
    FRIEND_WITH: {
      orientation: 'UNDIRECTED'      -- Facebook friendship = undirected
    }
  }
)
YIELD graphName, nodeCount, relationshipCount;

-- Kiểm tra
CALL gds.graph.list()
YIELD graphName, nodeCount, relationshipCount, memoryUsage;

-- Memory estimation (chạy TRƯỚC khi project graph lớn)
CALL gds.graph.project.estimate(
  'Person',
  {FRIEND_WITH: {orientation: 'UNDIRECTED'}}
)
YIELD requiredMemory;
```

```cypher
-- Cypher Projection (linh hoạt hơn, có thể filter)
CALL gds.graph.project.cypher(
  'active-friends',
  'MATCH (p:Person) WHERE p.is_self = true OR exists((p)-[:FRIEND_WITH]-(:Person {is_self: true})) RETURN id(p) AS id',
  'MATCH (a:Person)-[r:FRIEND_WITH]-(b:Person) RETURN id(a) AS source, id(b) AS target, r.since AS since'
)
```

---

## 5. Centrality Algorithms — Ai Quan Trọng Nhất?

### 5.1 Tổng Quan Centrality

```
┌──────────────────────────────────────────────────────────────┐
│           CENTRALITY ALGORITHMS — COMPARISON                 │
│                                                              │
│  Degree Centrality          PageRank                         │
│  "Ai có NHIỀU bạn nhất?"   "Ai QUAN TRỌNG nhất?"            │
│                                                              │
│       ╱·─·╲                     ╱·─·╲                       │
│      ╱  │  ╲                   ╱  │  ╲                      │
│     · ─ ★ ─ ·               · ─ ★ ─ ·  ← ★ được bạn       │
│      ╲  │  ╱                   ╲  │  ╱     quan trọng       │
│       ╲·─·╱                     ╲·─·╱      giới thiệu      │
│                                                              │
│  ★ = cao (nhiều connections)  ★ = cao (connected to VIPs)   │
│  Đơn giản, đếm số cạnh       Recursive, transitive          │
│                                                              │
│  Betweenness Centrality       Closeness Centrality           │
│  "Ai là CẦU NỐI?"            "Ai TIẾP CẬN nhanh nhất?"     │
│                                                              │
│    A ─ ★ ─ B                   · ─ · ─ ★ ─ · ─ ·            │
│    │       │                   · ─ · ╱     ╲ · ─ ·           │
│    C       D                                                 │
│                                                              │
│  ★ = cao (nằm trên nhiều     ★ = cao (khoảng cách trung     │
│    shortest paths)             bình đến mọi node THẤP nhất)  │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Degree Centrality

**Câu hỏi:** "Ai có nhiều bạn nhất?"

```cypher
-- =============================================
-- DEGREE CENTRALITY
-- =============================================

-- Stream mode (xem results)
CALL gds.degree.stream('social-graph')
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).name AS person,
       score AS friend_count
ORDER BY score DESC
LIMIT 20;

-- Write mode (lưu vào DB)
CALL gds.degree.write('social-graph', {
  writeProperty: 'degree_centrality'
})
YIELD nodePropertiesWritten;

-- Xem kết quả đã lưu
MATCH (p:Person)
WHERE p.degree_centrality > 0
RETURN p.name, p.degree_centrality
ORDER BY p.degree_centrality DESC
LIMIT 10;
```

**Giải thích:** Degree = số relationships. Đơn giản nhưng hiệu quả — người có nhiều bạn nhất.

### 5.3 PageRank

**Câu hỏi:** "Ai là người có ảnh hưởng nhất?" (không chỉ nhiều bạn, mà bạn của họ cũng quan trọng)

```cypher
-- =============================================
-- PAGERANK — Transitive Influence
-- =============================================

CALL gds.pageRank.stream('social-graph', {
  maxIterations: 20,          -- Số vòng lặp (default 20)
  dampingFactor: 0.85,        -- Xác suất "tiếp tục duyệt" (default 0.85)
  tolerance: 0.0001           -- Convergence threshold
})
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).name AS person,
       round(score, 4) AS pagerank
ORDER BY score DESC
LIMIT 20;

-- Write results
CALL gds.pageRank.write('social-graph', {
  writeProperty: 'pagerank',
  maxIterations: 20,
  dampingFactor: 0.85
})
YIELD nodePropertiesWritten, ranIterations, didConverge;
```

**Giải thích toán học:**
```
PR(A) = (1-d)/N + d × Σ( PR(Ti) / C(Ti) )

Với:
  PR(A)  = PageRank của node A
  d      = damping factor (0.85)
  N      = tổng số nodes
  Ti     = node i có link đến A
  C(Ti)  = số links đi ra từ Ti (out-degree)

Ý nghĩa: PR cao ← được nhiều node quan trọng chỉ đến
→ "Bạn quan trọng vì bạn bè của bạn cũng quan trọng"
```

### 5.4 Betweenness Centrality

**Câu hỏi:** "Ai là cầu nối giữa các nhóm?" (Connector/Broker)

```cypher
-- =============================================
-- BETWEENNESS CENTRALITY — Bridge Detection
-- =============================================

CALL gds.betweenness.stream('social-graph', {
  samplingSize: 1000,    -- Sampling cho graph lớn (tăng tốc)
  samplingRatio: 0.5     -- % nodes được sample
})
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).name AS person,
       round(score, 2) AS betweenness
ORDER BY score DESC
LIMIT 20;

-- Write
CALL gds.betweenness.write('social-graph', {
  writeProperty: 'betweenness'
})
YIELD nodePropertiesWritten;
```

**Giải thích:**
```
BC(v) = Σ( σ(s,t | v) / σ(s,t) )

Với:
  σ(s,t)    = tổng số shortest paths từ s đến t
  σ(s,t|v)  = số shortest paths từ s đến t đi QUA v

Ý nghĩa: BC cao = node nằm trên nhiều shortest paths
→ "Người cầu nối" — nếu remove, network bị chia cắt
→ Trong social network: người kết nối các nhóm bạn khác nhau
```

### 5.5 Closeness Centrality

**Câu hỏi:** "Ai có thể tiếp cận mọi người nhanh nhất?"

```cypher
-- =============================================
-- CLOSENESS CENTRALITY
-- =============================================

CALL gds.closeness.stream('social-graph')
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).name AS person,
       round(score, 4) AS closeness
ORDER BY score DESC
LIMIT 20;
```

### 5.6 So Sánh Kết Quả

```cypher
-- =============================================
-- TỔNG HỢP: So sánh tất cả centrality metrics
-- =============================================

MATCH (p:Person)
WHERE p.degree_centrality IS NOT NULL
RETURN p.name,
       p.degree_centrality AS degree,
       p.pagerank AS pagerank,
       p.betweenness AS betweenness
ORDER BY p.pagerank DESC
LIMIT 20;

-- Tìm "Hidden Influencers" (PageRank cao nhưng Degree thấp)
MATCH (p:Person)
WHERE p.pagerank > 0.5 AND p.degree_centrality < 50
RETURN p.name, p.pagerank, p.degree_centrality
ORDER BY p.pagerank DESC;
```

---

## 6. Community Detection — Phát Hiện Nhóm

### 6.1 Tổng Quan Algorithms

```
┌──────────────────────────────────────────────────────────────┐
│              COMMUNITY DETECTION ALGORITHMS                  │
│                                                              │
│  Louvain                          Label Propagation (LPA)    │
│  ├── Tối ưu hóa modularity       ├── Lightweight, nhanh     │
│  ├── Hierarchical (multi-level)   ├── Mỗi node nhận label   │
│  ├── Tìm communities chặt chẽ    │   phổ biến nhất từ       │
│  ├── Tốt cho phát hiện "echo     │   neighbors              │
│  │   chambers", fraud rings       ├── Non-deterministic      │
│  └── Complexity: O(n·log²n)       └── Complexity: O(m)       │
│                                                              │
│  Weakly Connected Components (WCC)                           │
│  ├── Tìm các "islands" tách biệt                            │
│  ├── Chạy TRƯỚC community detection                          │
│  └── Nếu chỉ có 1 component → network liên thông             │
│                                                              │
│  Triangle Count + Clustering Coefficient                     │
│  ├── Đo mức độ "kết dính" (cohesion) của network            │
│  ├── CC cao → nhóm bạn chặt chẽ (friends know each other)   │
│  └── CC thấp → connections rời rạc                           │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Weakly Connected Components (WCC) — Chạy Trước

```cypher
-- =============================================
-- WCC: Tìm các mạng con tách biệt
-- =============================================

-- Luôn chạy WCC TRƯỚC khi chạy community detection
CALL gds.wcc.stream('social-graph')
YIELD nodeId, componentId
WITH componentId, count(*) AS size
RETURN componentId, size
ORDER BY size DESC;

-- Nếu chỉ có 1 component lớn → network liên thông, tốt!
-- Nếu nhiều components → có thể cần xử lý riêng từng component
```

### 6.3 Louvain — Community Detection Chính

```cypher
-- =============================================
-- LOUVAIN: Phát hiện nhóm bạn
-- =============================================

-- Stream (xem results)
CALL gds.louvain.stream('social-graph', {
  maxLevels: 10,              -- Max hierarchical levels
  maxIterations: 10,          -- Max iterations per level
  tolerance: 0.0001,          -- Convergence threshold
  includeIntermediateCommunities: true  -- Xem cả sub-communities
})
YIELD nodeId, communityId, intermediateCommunityIds
RETURN gds.util.asNode(nodeId).name AS person,
       communityId,
       intermediateCommunityIds
ORDER BY communityId;

-- Write results
CALL gds.louvain.write('social-graph', {
  writeProperty: 'community_id'
})
YIELD communityCount, modularity, modularities;

-- ===== PHÂN TÍCH KẾT QUẢ =====

-- 1. Đếm số thành viên mỗi community
MATCH (p:Person)
WHERE p.community_id IS NOT NULL
RETURN p.community_id AS community,
       count(p) AS members,
       collect(p.name)[..5] AS sample_members  -- 5 ví dụ
ORDER BY members DESC;

-- 2. Tìm "leaders" mỗi community (highest PageRank)
MATCH (p:Person)
WHERE p.community_id IS NOT NULL AND p.pagerank IS NOT NULL
WITH p.community_id AS community, p
ORDER BY p.pagerank DESC
WITH community, collect(p.name)[..3] AS top_influencers,
     count(p) AS size
RETURN community, size, top_influencers
ORDER BY size DESC;

-- 3. Cross-community connections (ai kết nối các nhóm?)
MATCH (a:Person)-[:FRIEND_WITH]-(b:Person)
WHERE a.community_id <> b.community_id
RETURN a.name, a.community_id,
       b.name, b.community_id
LIMIT 20;
```

### 6.4 Label Propagation — Alternative (Nhanh Hơn)

```cypher
-- =============================================
-- LABEL PROPAGATION
-- =============================================

CALL gds.labelPropagation.stream('social-graph', {
  maxIterations: 10
})
YIELD nodeId, communityId
RETURN gds.util.asNode(nodeId).name AS person, communityId
ORDER BY communityId;

-- So sánh với Louvain
CALL gds.labelPropagation.write('social-graph', {
  writeProperty: 'lpa_community_id'
});
```

### 6.5 Triangle Count & Clustering Coefficient

```cypher
-- =============================================
-- TRIANGLE COUNT: Đo mức độ kết dính nhóm
-- =============================================

-- Đếm triangles cho mỗi node
CALL gds.triangleCount.stream('social-graph')
YIELD nodeId, triangleCount
RETURN gds.util.asNode(nodeId).name AS person, triangleCount
ORDER BY triangleCount DESC
LIMIT 20;

-- Local Clustering Coefficient
CALL gds.localClusteringCoefficient.stream('social-graph')
YIELD nodeId, localClusteringCoefficient
RETURN gds.util.asNode(nodeId).name AS person,
       round(localClusteringCoefficient, 3) AS clustering_coeff
ORDER BY localClusteringCoefficient DESC
LIMIT 20;

-- Clustering Coefficient cao (>0.5): Bạn bè của bạn cũng quen nhau
-- Clustering Coefficient thấp (<0.1): Bạn bè rời rạc, nhiều circles riêng
```

---

## 7. Link Prediction — Gợi Ý Bạn Bè

### 7.1 Các Thuật Toán

```
┌──────────────────────────────────────────────────────────────┐
│              LINK PREDICTION ALGORITHMS                      │
│                                                              │
│  Common Neighbors:                                           │
│  score(A,B) = |N(A) ∩ N(B)|                                  │
│  "A và B có bao nhiêu bạn chung?"                            │
│                                                              │
│  Jaccard Similarity:                                         │
│  score(A,B) = |N(A) ∩ N(B)| / |N(A) ∪ N(B)|                │
│  "Tỷ lệ bạn chung trên tổng bạn" (0→1)                     │
│                                                              │
│  Adamic-Adar Index:                                          │
│  score(A,B) = Σ 1/log(|N(z)|) for z ∈ N(A) ∩ N(B)          │
│  "Bạn chung hiếm → điểm cao hơn"                            │
│  (Nếu bạn chung chỉ có ít bạn → predictive hơn)             │
│                                                              │
│  Preferential Attachment:                                    │
│  score(A,B) = |N(A)| × |N(B)|                               │
│  "Người nhiều bạn → dễ có thêm bạn" (rich get richer)       │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Cypher Queries

```cypher
-- =============================================
-- LINK PREDICTION: Gợi ý bạn bè
-- =============================================

-- 1. Common Neighbors (bạn chung)
MATCH (me:Person {is_self: true})-[:FRIEND_WITH]-(mutual)-[:FRIEND_WITH]-(suggested)
WHERE NOT (me)-[:FRIEND_WITH]-(suggested) AND me <> suggested
RETURN suggested.name,
       count(mutual) AS common_friends,
       collect(mutual.name)[..5] AS mutual_names
ORDER BY common_friends DESC
LIMIT 20;

-- 2. Adamic-Adar Score
MATCH (me:Person {is_self: true})-[:FRIEND_WITH]-(mutual)-[:FRIEND_WITH]-(suggested)
WHERE NOT (me)-[:FRIEND_WITH]-(suggested) AND me <> suggested
WITH suggested, mutual
MATCH (mutual)-[:FRIEND_WITH]-(any_friend)
WITH suggested, mutual, count(any_friend) AS mutual_degree
WITH suggested,
     sum(1.0 / log(mutual_degree + 1)) AS adamic_adar_score,
     count(mutual) AS common_friends
RETURN suggested.name,
       round(adamic_adar_score, 4) AS adamic_adar,
       common_friends
ORDER BY adamic_adar_score DESC
LIMIT 20;

-- 3. Jaccard Similarity (dùng GDS)
CALL gds.nodeSimilarity.stream('social-graph', {
  topK: 10,
  similarityCutoff: 0.1
})
YIELD node1, node2, similarity
WITH gds.util.asNode(node1) AS person1,
     gds.util.asNode(node2) AS person2,
     similarity
WHERE NOT exists((person1)-[:FRIEND_WITH]-(person2))
RETURN person1.name, person2.name,
       round(similarity, 4) AS jaccard
ORDER BY similarity DESC
LIMIT 20;

-- 4. Gợi ý bạn trong CÙNG community (nhưng chưa kết bạn)
MATCH (me:Person {is_self: true})
MATCH (suggested:Person)
WHERE suggested.community_id = me.community_id
  AND NOT (me)-[:FRIEND_WITH]-(suggested)
  AND me <> suggested
RETURN suggested.name, suggested.community_id
LIMIT 20;
```

---

## 8. Graph Embeddings & Machine Learning

### 8.1 FastRP — Fast Random Projection

```cypher
-- =============================================
-- FastRP: Biến graph structure thành vectors
-- =============================================

-- Tạo embeddings cho mỗi node
CALL gds.fastRP.mutate('social-graph', {
  embeddingDimension: 128,     -- Vector size
  iterationWeights: [0.0, 1.0, 1.0, 0.8, 0.5],  -- Weight per hop
  randomSeed: 42
})
YIELD nodePropertiesWritten;

-- Stream embeddings
CALL gds.fastRP.stream('social-graph', {
  embeddingDimension: 128
})
YIELD nodeId, embedding
RETURN gds.util.asNode(nodeId).name AS person,
       embedding[..5] AS embedding_sample  -- First 5 dims
LIMIT 10;

-- Write embeddings to DB
CALL gds.fastRP.write('social-graph', {
  embeddingDimension: 128,
  writeProperty: 'graph_embedding'
})
YIELD nodePropertiesWritten;
```

### 8.2 GraphSAGE — Inductive Learning

```cypher
-- =============================================
-- GraphSAGE: Neural network-based embeddings
-- =============================================

-- Train GraphSAGE model
CALL gds.beta.graphSage.train('social-graph', {
  modelName: 'social-graphsage',
  featureProperties: ['degree_centrality', 'pagerank'],  -- Node features
  embeddingDimension: 64,
  aggregator: 'mean',
  activationFunction: 'sigmoid',
  sampleSizes: [25, 10],
  epochs: 5,
  learningRate: 0.01
})
YIELD modelInfo;

-- Generate embeddings
CALL gds.beta.graphSage.stream('social-graph', {
  modelName: 'social-graphsage'
})
YIELD nodeId, embedding
RETURN gds.util.asNode(nodeId).name, embedding[..5]
LIMIT 10;
```

### 8.3 Dùng Embeddings Cho ML (Python)

```python
# =========================================
# GRAPH EMBEDDINGS → Machine Learning
# =========================================
from graphdatascience import GraphDataScience
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.manifold import TSNE
import matplotlib.pyplot as plt

# Connect
gds = GraphDataScience("bolt://localhost:7687", auth=("neo4j", "password"))

# Project graph
G, project_result = gds.graph.project(
    'social-ml',
    'Person',
    {'FRIEND_WITH': {'orientation': 'UNDIRECTED'}}
)

# Generate FastRP embeddings
fastrp_result = gds.fastRP.stream(G, embeddingDimension=128)

# Convert to DataFrame
df = pd.DataFrame({
    'nodeId': fastrp_result['nodeId'],
    'embedding': fastrp_result['embedding'].tolist()
})

# Expand embeddings into columns
embeddings_df = pd.DataFrame(
    df['embedding'].tolist(),
    index=df['nodeId']
)

# ===== K-Means Clustering =====
kmeans = KMeans(n_clusters=5, random_state=42)
df['cluster'] = kmeans.fit_predict(embeddings_df)

# ===== t-SNE Visualization =====
tsne = TSNE(n_components=2, random_state=42, perplexity=30)
coords = tsne.fit_transform(embeddings_df)

plt.figure(figsize=(12, 8))
scatter = plt.scatter(coords[:, 0], coords[:, 1],
                      c=df['cluster'], cmap='tab10', alpha=0.7)
plt.colorbar(scatter, label='Cluster')
plt.title('Social Network — Graph Embeddings (t-SNE)')
plt.xlabel('t-SNE 1')
plt.ylabel('t-SNE 2')
plt.savefig('social_network_clusters.png', dpi=150)
plt.show()

# Cleanup
G.drop()
```

---

## 9. Python Integration — End-to-End Pipeline

### 9.1 Complete Python Pipeline

```python
# =========================================
# COMPLETE SOCIAL GRAPH ANALYSIS PIPELINE
# =========================================
from graphdatascience import GraphDataScience
import pandas as pd
from neo4j import GraphDatabase

class SocialGraphAnalyzer:
    """End-to-end social graph analysis with Neo4j GDS"""

    def __init__(self, uri="bolt://localhost:7687",
                 user="neo4j", password="password"):
        self.gds = GraphDataScience(uri, auth=(user, password))
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        self.graph = None

    def project_graph(self, name: str = "social"):
        """Step 1: Project graph vào memory"""
        # Drop if exists
        try:
            existing = self.gds.graph.get(name)
            existing.drop()
        except:
            pass

        self.graph, result = self.gds.graph.project(
            name, 'Person',
            {'FRIEND_WITH': {'orientation': 'UNDIRECTED'}}
        )
        print(f"✅ Projected: {result['nodeCount']} nodes, "
              f"{result['relationshipCount']} relationships")
        return result

    def run_centrality(self) -> pd.DataFrame:
        """Step 2: Chạy tất cả centrality algorithms"""
        results = {}

        # Degree
        degree = self.gds.degree.stream(self.graph)
        results['degree'] = degree.set_index('nodeId')['score']

        # PageRank
        pr = self.gds.pageRank.stream(self.graph,
                                       maxIterations=20,
                                       dampingFactor=0.85)
        results['pagerank'] = pr.set_index('nodeId')['score']

        # Betweenness
        bc = self.gds.betweenness.stream(self.graph)
        results['betweenness'] = bc.set_index('nodeId')['score']

        # Closeness
        cc = self.gds.closeness.stream(self.graph)
        results['closeness'] = cc.set_index('nodeId')['score']

        df = pd.DataFrame(results)
        print(f"✅ Centrality computed for {len(df)} nodes")
        return df

    def run_community_detection(self) -> pd.DataFrame:
        """Step 3: Community detection"""
        # WCC first
        wcc = self.gds.wcc.stream(self.graph)
        wcc_summary = wcc.groupby('componentId').size()
        print(f"  WCC: {len(wcc_summary)} components")

        # Louvain
        louvain = self.gds.louvain.stream(self.graph)
        community_summary = louvain.groupby('communityId').size()
        print(f"  Louvain: {len(community_summary)} communities")

        # Triangle count
        triangles = self.gds.triangleCount.stream(self.graph)

        # Merge results
        df = louvain.merge(triangles, on='nodeId', how='left')
        print(f"✅ Community detection done")
        return df

    def run_link_prediction(self, target_node_name: str,
                            top_k: int = 10) -> list:
        """Step 4: Link prediction cho 1 person"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (me:Person {name: $name})-[:FRIEND_WITH]-(mutual)-[:FRIEND_WITH]-(suggested)
                WHERE NOT (me)-[:FRIEND_WITH]-(suggested) AND me <> suggested
                WITH suggested, count(mutual) AS common_friends,
                     collect(mutual.name)[..3] AS sample_mutuals
                MATCH (suggested)-[:FRIEND_WITH]-(any)
                WITH suggested, common_friends, sample_mutuals,
                     count(any) AS suggested_degree
                WITH suggested, common_friends, sample_mutuals,
                     suggested_degree,
                     toFloat(common_friends) / suggested_degree AS jaccard_approx
                RETURN suggested.name AS suggested_friend,
                       common_friends,
                       sample_mutuals,
                       round(jaccard_approx, 4) AS similarity
                ORDER BY common_friends DESC, similarity DESC
                LIMIT $top_k
            """, name=target_node_name, top_k=top_k)
            return [dict(r) for r in result]

    def generate_embeddings(self, dim: int = 128) -> pd.DataFrame:
        """Step 5: Generate graph embeddings"""
        result = self.gds.fastRP.stream(self.graph,
                                         embeddingDimension=dim)
        print(f"✅ Generated {dim}-dim embeddings for {len(result)} nodes")
        return result

    def get_network_summary(self) -> dict:
        """Tổng hợp thống kê network"""
        with self.driver.session() as session:
            stats = session.run("""
                MATCH (p:Person)
                WITH count(p) AS total_persons
                MATCH ()-[f:FRIEND_WITH]-()
                WITH total_persons, count(f)/2 AS total_friendships
                RETURN total_persons, total_friendships,
                       toFloat(total_friendships * 2) / total_persons AS avg_degree
            """).single()

            return {
                "total_persons": stats["total_persons"],
                "total_friendships": stats["total_friendships"],
                "average_degree": round(stats["avg_degree"], 2),
            }

    def full_analysis(self, target_person: str = None) -> dict:
        """Chạy toàn bộ pipeline"""
        print("🔄 Starting full social graph analysis...")

        # 1. Project
        self.project_graph()

        # 2. Network summary
        summary = self.get_network_summary()
        print(f"\n📊 Network: {summary['total_persons']} people, "
              f"{summary['total_friendships']} friendships, "
              f"avg degree: {summary['average_degree']}")

        # 3. Centrality
        centrality = self.run_centrality()
        print(f"\n🏆 Top 5 by PageRank:")
        print(centrality.nlargest(5, 'pagerank')[['pagerank', 'degree']])

        # 4. Communities
        communities = self.run_community_detection()
        n_communities = communities['communityId'].nunique()
        print(f"\n🏘️ Found {n_communities} communities")

        # 5. Link prediction
        suggestions = []
        if target_person:
            suggestions = self.run_link_prediction(target_person)
            print(f"\n🤝 Top friend suggestions for {target_person}:")
            for s in suggestions[:5]:
                print(f"  → {s['suggested_friend']} "
                      f"({s['common_friends']} mutual friends)")

        # 6. Embeddings
        embeddings = self.generate_embeddings(dim=128)

        # Cleanup
        self.graph.drop()

        return {
            "summary": summary,
            "centrality": centrality,
            "communities": communities,
            "suggestions": suggestions,
            "embeddings": embeddings
        }

    def close(self):
        self.driver.close()


# ========== USAGE ==========
if __name__ == "__main__":
    analyzer = SocialGraphAnalyzer()
    results = analyzer.full_analysis(target_person="Me")
    analyzer.close()
```

---

## 10. Visualization & Reporting

### 10.1 Neo4j Browser Queries (trực quan)

```cypher
-- =============================================
-- VISUALIZATION QUERIES
-- =============================================

-- Xem network topology (limit để browser không crash)
MATCH (p:Person)-[r:FRIEND_WITH]-(f:Person)
RETURN p, r, f
LIMIT 200;

-- Xem communities (màu theo community_id)
MATCH (p:Person)
WHERE p.community_id IS NOT NULL
MATCH (p)-[r:FRIEND_WITH]-(f:Person)
WHERE f.community_id = p.community_id  -- Chỉ xem intra-community
RETURN p, r, f
LIMIT 300;

-- Xem cross-community bridges
MATCH (a:Person)-[r:FRIEND_WITH]-(b:Person)
WHERE a.community_id <> b.community_id
  AND a.betweenness > 100  -- Chỉ bridges quan trọng
RETURN a, r, b
LIMIT 100;
```

### 10.2 Python Visualization

```python
# =========================================
# MATPLOTLIB VISUALIZATION
# =========================================
import matplotlib.pyplot as plt
import numpy as np

def plot_centrality_comparison(centrality_df: pd.DataFrame):
    """So sánh các centrality metrics"""
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    metrics = ['degree', 'pagerank', 'betweenness', 'closeness']
    titles = ['Degree Centrality', 'PageRank', 'Betweenness', 'Closeness']

    for ax, metric, title in zip(axes.flat, metrics, titles):
        top20 = centrality_df.nlargest(20, metric)
        ax.barh(range(len(top20)), top20[metric])
        ax.set_title(title)
        ax.invert_yaxis()

    plt.tight_layout()
    plt.savefig('centrality_comparison.png', dpi=150)
    plt.show()

def plot_community_sizes(communities_df: pd.DataFrame):
    """Biểu đồ kích thước communities"""
    sizes = communities_df.groupby('communityId').size().sort_values(ascending=False)

    fig, ax = plt.subplots(figsize=(12, 6))
    ax.bar(range(len(sizes)), sizes.values)
    ax.set_xlabel('Community ID')
    ax.set_ylabel('Number of Members')
    ax.set_title('Community Size Distribution')
    plt.savefig('community_sizes.png', dpi=150)
    plt.show()

def plot_degree_distribution(centrality_df: pd.DataFrame):
    """Power-law distribution check"""
    degrees = centrality_df['degree'].values

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Histogram
    ax1.hist(degrees, bins=50, edgecolor='black', alpha=0.7)
    ax1.set_xlabel('Degree')
    ax1.set_ylabel('Frequency')
    ax1.set_title('Degree Distribution')

    # Log-log (power law check)
    unique, counts = np.unique(degrees.astype(int), return_counts=True)
    ax2.loglog(unique, counts, 'bo', markersize=4)
    ax2.set_xlabel('Degree (log)')
    ax2.set_ylabel('Frequency (log)')
    ax2.set_title('Degree Distribution (Log-Log)')

    plt.tight_layout()
    plt.savefig('degree_distribution.png', dpi=150)
    plt.show()
```

---

## 11. Use Cases & Ứng Dụng Thực Tế

### 11.1 Bản Đồ Ứng Dụng

| Use Case                           | Algorithms                           | Mô tả                                        |
|:---------------------------------- |:------------------------------------ |:---------------------------------------------- |
| **Tìm Influencers**               | PageRank + Degree                    | Ai có ảnh hưởng nhất trong network?            |
| **Phát hiện Echo Chambers**        | Louvain + Modularity                 | Các nhóm khép kín, cùng quan điểm?            |
| **Gợi ý bạn bè**                  | Common Neighbors + Adamic-Adar       | Ai nên kết bạn với ai?                         |
| **Phát hiện tài khoản giả**       | Anomaly detection + Triangle Count   | Accounts với pattern bất thường?               |
| **Phân tích lan truyền thông tin** | Shortest Path + Betweenness          | Tin tức lan truyền thế nào trong network?       |
| **Phân loại người dùng**          | FastRP + ML Classification           | Dự đoán sở thích/hành vi từ graph structure    |
| **Đánh giá profile**              | All centrality + Community + Context | Hồ sơ tổng hợp: ảnh hưởng + nhóm + hành vi   |

### 11.2 Ứng Dụng Cho Profile Analysis System

Kết hợp với hệ thống đã thiết kế trước:

```
┌──────────────────────────────────────────────────────────────┐
│     PROFILE ANALYSIS: Social Graph Module                    │
│                                                              │
│  INPUT: user_id                                              │
│                                                              │
│  1. Centrality Scores:                                       │
│     degree=156, pagerank=2.34, betweenness=892               │
│     → "Người có ảnh hưởng vừa phải, là cầu nối quan trọng"  │
│                                                              │
│  2. Community:                                               │
│     community_id=3, size=45, community_type="Tech Workers"   │
│     → "Thuộc nhóm 45 người, chủ yếu ngành công nghệ"        │
│                                                              │
│  3. Triangle Count:                                          │
│     triangles=234, clustering_coeff=0.72                     │
│     → "Nhóm bạn rất gắn kết (bạn bè đều quen nhau)"        │
│                                                              │
│  4. Network Position:                                        │
│     cross_community_connections=12                            │
│     → "Kết nối 3 nhóm khác nhau, đa dạng mối quan hệ"      │
│                                                              │
│  5. Graph Embedding:                                         │
│     vector=[0.12, -0.34, ...] (128-dim)                      │
│     → Dùng cho ML: clustering, similarity, classification    │
│                                                              │
│  OUTPUT → Feed vào LangGraph synthesize node                 │
│           → GPT-4o tổng hợp thành profile report             │
└──────────────────────────────────────────────────────────────┘
```

---

## 12. Lộ Trình Học Tập

### Phase 1: Foundations (Tuần 1-2)
- [ ] Cài đặt Neo4j + GDS (Docker)
- [ ] Học Cypher cơ bản: MATCH, CREATE, MERGE, WHERE
- [ ] Hiểu Graph Theory: nodes, relationships, paths
- [ ] Import sample data (MovieLens hoặc tự tạo)
- [ ] Project: Tạo social network giả lập, query basic patterns

### Phase 2: GDS Algorithms (Tuần 3-4)
- [ ] Graph Projection: native vs Cypher
- [ ] Centrality: Degree, PageRank, Betweenness, Closeness
- [ ] Community: WCC, Louvain, Label Propagation
- [ ] Triangle Count + Clustering Coefficient
- [ ] Project: Phân tích dataset SNAP Facebook (public dataset)

### Phase 3: Advanced Analysis (Tuần 5-6)
- [ ] Link Prediction: Common Neighbors, Adamic-Adar, Jaccard
- [ ] Node Similarity: NodeSimilarity, Jaccard
- [ ] Graph Embeddings: FastRP, GraphSAGE
- [ ] Python GDS Client integration
- [ ] Project: Import Facebook data cá nhân + full analysis

### Phase 4: Production (Tuần 7-8)
- [ ] Visualization: Neo4j Bloom, matplotlib, D3.js
- [ ] Integration: LlamaIndex PropertyGraph + LangGraph
- [ ] ML Pipeline: embeddings → scikit-learn classification
- [ ] Performance: tuning, memory estimation, Cypher profiling
- [ ] Project: Complete profile analysis system

---

## 📖 Tài Nguyên

### Datasets Thực Hành
| Dataset                      | Nodes    | Edges     | Source                              |
|:---------------------------- |:-------- |:--------- |:------------------------------------ |
| SNAP Facebook Ego Networks   | 4,039    | 88,234    | snap.stanford.edu                   |
| SNAP Social Circles          | 347      | 2,519     | snap.stanford.edu                   |
| Twitch Social Network        | 168,114  | 6,797,557 | snap.stanford.edu                   |
| Your Facebook Data           | Varies   | Varies    | facebook.com/dyi                    |

### Install Commands

```bash
# Neo4j + GDS (Docker)
docker run -d --name neo4j -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  -e NEO4J_PLUGINS='["graph-data-science"]' \
  neo4j:5-enterprise

# Python dependencies
pip install graphdatascience neo4j neomodel
pip install pandas numpy scikit-learn matplotlib

# Verify connection
python -c "from graphdatascience import GraphDataScience; print('OK')"
```

### Documentation
- Neo4j GDS: https://neo4j.com/docs/graph-data-science/current/
- GDS Python Client: https://neo4j.com/docs/graph-data-science-client/current/
- Cypher Manual: https://neo4j.com/docs/cypher-manual/current/
- GraphAcademy: https://graphacademy.neo4j.com/
