# Phân Tích ZooKeeper Trong Hệ Sinh Thái Spring & Mô Hình Tối Ưu 1 Billion TPS

> **Ngày tạo**: 2026-07-23  
> **Phương pháp**: Multi-Agent Brainstorming (5-Agent Structured Review)  
> **Tham chiếu**: [RESEARCH_apache_zookeeper.md](file:///home/nguyentthai96/Desktop/bigbang/research_docs/papers/RESEARCH_apache_zookeeper.md), [GUIDE_zookeeper_spring_boot.md](file:///home/nguyentthai96/Desktop/bigbang/research_docs/papers/GUIDE_zookeeper_spring_boot.md)

---

## Mục Lục

1. [Understanding Summary](#1-understanding-summary)
2. [Agent 1 — Primary Designer: Phân Tích Kiến Trúc](#2-agent-1--primary-designer-phân-tích-kiến-trúc)
3. [Agent 2 — Skeptic/Challenger: Tìm Điểm Yếu](#3-agent-2--skepticchallenger-tìm-điểm-yếu)
4. [Agent 3 — Constraint Guardian: Đánh Giá Giới Hạn 1B TPS](#4-agent-3--constraint-guardian-đánh-giá-giới-hạn-1b-tps)
5. [Agent 4 — User Advocate: Developer Experience](#5-agent-4--user-advocate-developer-experience)
6. [Agent 5 — Integrator/Arbiter: Phán Quyết Cuối Cùng](#6-agent-5--integratorarbiter-phán-quyết-cuối-cùng)
7. [Ma Trận So Sánh Toàn Diện](#7-ma-trận-so-sánh-toàn-diện)
8. [Mô Hình Tối Ưu 1 Billion TPS](#8-mô-hình-tối-ưu-1-billion-tps)
9. [Decision Log](#9-decision-log)
10. [Lộ Trình Chuyển Đổi](#10-lộ-trình-chuyển-đổi)

---

## 1. Understanding Summary

### Bài Toán Cốt Lõi

- **Đang xây dựng**: Hệ thống phân tán quy mô cực lớn (target 1 billion TPS) sử dụng Spring ecosystem
- **Câu hỏi chính**: ZooKeeper có phù hợp không? Nếu không, công nghệ nào tốt hơn?
- **Đối tượng**: Kiến trúc sư hệ thống, Tech Lead, DevOps engineers
- **Ràng buộc**: Spring ecosystem là bắt buộc, cần coordination service cho distributed systems
- **Non-goals**: Không phải chọn 1 tool duy nhất cho mọi nhu cầu — cần chiến lược phân tầng (tiered strategy)

### Assumptions

1. "1 billion TPS" = tổng throughput của toàn hệ thống (aggregate), KHÔNG phải throughput trên 1 node coordination
2. Spring Boot 3.x + Spring Cloud 2024/2025+ là tech stack chính
3. Hệ thống triển khai trên Kubernetes hoặc hybrid cloud
4. Cần cả service discovery, distributed lock, leader election, và config management
5. Chi phí vận hành (operational cost) là yếu tố quan trọng

---

## 2. Agent 1 — Primary Designer: Phân Tích Kiến Trúc

### 2.1 ZooKeeper — Đánh Giá Trong Spring Ecosystem (2026)

#### ✅ Điểm Mạnh

| Khía Cạnh | Chi Tiết |
|---|---|
| **Distributed Lock** | Best-in-class với Curator recipes (InterProcessMutex, Read-Write Lock) |
| **Leader Election** | Ephemeral + Sequential znodes = tự động failover, zero-downtime |
| **Strong Consistency** | CP model — linearizable writes, sequential reads |
| **Battle-tested** | 15+ năm production, backbone của HBase/Hadoop/ClickHouse |
| **Hierarchical Model** | ZNode tree phù hợp với tổ chức metadata phức tạp |

#### ❌ Điểm Yếu Nghiêm Trọng

| Khía Cạnh | Chi Tiết | Mức Độ |
|---|---|---|
| **Single-leader write bottleneck** | MỌI writes đi qua 1 leader node — KHÔNG scale write horizontally | 🔴 Critical |
| **Write throughput ceiling** | ~5,000-10,000 writes/sec (với SSD) — thêm node không tăng write | 🔴 Critical |
| **Java monolith** | Nặng, JVM heap management phức tạp, GC pauses | 🟡 Medium |
| **Declining ecosystem** | Kafka bỏ ZK (KRaft), Pulsar chuyển Oxia, xu hướng Kubernetes-native | 🟡 Medium |
| **Operational burden** | Cần dedicated servers, SSD cho txn log, monitoring riêng | 🟡 Medium |
| **No horizontal scaling** | Thêm node = tăng fault tolerance nhưng GIẢM write latency | 🔴 Critical |

### 2.2 Các Đối Thủ Cạnh Tranh

#### 🏆 Consul (HashiCorp)

```
Phù hợp Spring: ★★★★☆
Scalability:     ★★★☆☆
Dev Experience:  ★★★★★
Production-ready:★★★★☆
```

- **Spring Cloud Consul** — integration native, batteries-included
- Service Discovery + Config + Health Check + Multi-DC + Service Mesh (Consul Connect)
- CP model (Raft), nhưng hỗ trợ stale reads cho high-throughput reads
- **Hạn chế**: Vẫn single-leader write, không sharded — ceiling tương tự ZK cho writes

#### 🏆 etcd

```
Phù hợp Spring: ★★★☆☆
Scalability:     ★★★☆☆
Dev Experience:  ★★★☆☆
Production-ready:★★★★★
```

- De-facto standard cho Kubernetes — nếu đã dùng K8s thì sẵn có
- Lightweight (Go binary), gRPC API hiện đại
- Watch streaming (không one-time như ZK legacy)
- **Hạn chế**: Flat key-value (không hierarchical), Spring integration kém hơn Consul/ZK

#### 🏆 Nacos (Alibaba)

```
Phù hợp Spring: ★★★★★ (tốt nhất)
Scalability:     ★★★★☆
Dev Experience:  ★★★★★
Production-ready:★★★★☆
```

- **Designed cho Spring Cloud** — native integration tốt nhất
- Unified: Service Discovery + Dynamic Configuration trong 1 platform
- Hỗ trợ cả CP và AP mode (chuyển đổi được)
- Dashboard UI, versioning, rollback config
- **Hạn chế**: Distributed lock recipes không mạnh bằng Curator, ecosystem nhỏ hơn ngoài Java

#### 🏆 Redis (Redisson)

```
Phù hợp Spring: ★★★★★
Scalability:     ★★★★★
Dev Experience:  ★★★★★
Production-ready:★★★★★
```

- **Distributed Lock**: Nhanh nhất (~5-15ms latency vs ZK ~10-100ms)
- Throughput: ~100,000+ ops/sec (10x-20x ZK)
- Redisson cung cấp Lock, Semaphore, CountDownLatch, Read-Write Lock
- **Hạn chế**: Redlock là "best-effort" — KHÔNG đảm bảo correctness tuyệt đối trong network partition
- ⚠️ **Dùng cho efficiency-critical, KHÔNG dùng cho correctness-critical**

#### 🏆 Oxia (CNCF Sandbox)

```
Phù hợp Spring: ★★☆☆☆ (mới, chưa mature)
Scalability:     ★★★★★ (thiết kế cho massive scale)
Dev Experience:  ★★☆☆☆
Production-ready:★★☆☆☆
```

- **Sharded architecture** — horizontal scaling cho cả reads VÀ writes
- Cùng programming model với ZK (ephemerals, watches, CAS) nhưng scale 10x+
- CNCF Sandbox (từ Oct 2025) — còn rất mới
- **Hạn chế**: Chưa có Spring integration, ecosystem non-existent, risk cao cho production

#### 🏆 Temporal (Workflow Engine)

```
Phù hợp Spring: ★★★★☆
Scalability:     ★★★★★
Dev Experience:  ★★★★☆
Production-ready:★★★★☆
```

- **Thay thế distributed locks bằng durable workflows** — paradigm shift
- Tự xử lý retries, timeouts, state persistence
- **Hạn chế**: Không phải drop-in replacement cho ZK, học curve cao, over-engineering cho simple locks

---

## 3. Agent 2 — Skeptic/Challenger: Tìm Điểm Yếu

> *"Assume this design fails in production. Why?"*

### 3.1 ZooKeeper SẼ Fail Tại 1B TPS — Lý Do Cụ Thể

```
╔══════════════════════════════════════════════════════════════════╗
║  🔴 VERDICT: ZooKeeper KHÔNG THỂ phục vụ 1 billion TPS         ║
║                                                                  ║
║  ZK write ceiling: ~10,000 writes/sec (best case, SSD)          ║
║  Target:           1,000,000,000 TPS                            ║
║  Gap:              100,000x THIẾU                                ║
║                                                                  ║
║  Ngay cả nếu chỉ 0.1% traffic cần coordination:                 ║
║  → 1,000,000 coordination ops/sec → vẫn THIẾU 100x             ║
╚══════════════════════════════════════════════════════════════════╝
```

### 3.2 Các Failure Mode Cụ Thể

| # | Failure Mode | Khi Nào Xảy Ra | Hậu Quả |
|---|---|---|---|
| 1 | **Leader Overload** | >10K writes/sec → leader node bottleneck | Latency spike, client timeouts, session expirations |
| 2 | **GC Storm** | Large number of watches + znodes → JVM heap exhaustion | Stop-the-world GC → tất cả clients bị đứt kết nối tạm thời |
| 3 | **Herd Effect** | Thousands of clients watch cùng 1 znode → NodeDataChanged → tất cả wake up | Thundering herd → ZK bị overwhelm bởi re-watch requests |
| 4 | **Split-Brain trên Consul/ZK** | Network partition giữa datacenters | Quorum lost → service không thể acquire lock → toàn bộ write path bị block |
| 5 | **Redlock Clock Skew** | Nếu chọn Redis Redlock → NTP drift giữa nodes | 2 processes cùng giữ lock → double processing → data corruption |
| 6 | **Consensus Latency at Scale** | Quorum ACK cần N/2+1 nodes → thêm node = chậm hơn | P99 latency tăng exponentially khi ensemble > 5 nodes |

### 3.3 Hidden Assumptions Được Phát Hiện

> [!WARNING]
> **Assumption nguy hiểm nhất**: "1 coordination operation per transaction"
> 
> Thực tế, hệ thống 1B TPS KHÔNG cần 1B coordination ops/sec. Phần lớn transactions là stateless reads được load-balanced mà KHÔNG cần ZooKeeper.
> 
> ZK chỉ cần phục vụ: service registry refresh, leader election, và critical distributed locks — thường < 10,000 ops/sec ngay cả ở quy mô 1B TPS.

### 3.4 YAGNI Violations

| Pattern | YAGNI? | Lý Do |
|---|---|---|
| ZK cho service discovery | ✅ YAGNI | Kubernetes DNS/Service Mesh đã giải quyết |
| ZK cho config management | ✅ YAGNI | Nacos/Consul/ConfigMap tốt hơn |
| ZK cho distributed lock | ⚠️ Có thể cần | Nhưng chỉ cho critical paths, Redis đủ cho phần lớn cases |
| ZK cho leader election | ⚠️ Có thể cần | Nhưng K8s Lease API / Curator đã cung cấp sẵn |

---

## 4. Agent 3 — Constraint Guardian: Đánh Giá Giới Hạn 1B TPS

### 4.1 Phân Tích Throughput Ceiling Của Từng Technology

```
Throughput Ceiling (writes/sec, single cluster):

ZooKeeper      ████░░░░░░░░░░░░░░░░   ~10,000
etcd           █████░░░░░░░░░░░░░░░░   ~15,000
Consul         █████░░░░░░░░░░░░░░░░   ~15,000
Nacos          ████████░░░░░░░░░░░░░   ~30,000
Redis          ████████████████░░░░░   ~100,000+
Oxia (sharded) ██████████████████████  ~500,000+ (scales linearly)

Target 1B TPS coordination: depends on coordination ratio
├── 100% coordination: IMPOSSIBLE with any single technology
├── 1% coordination:   10,000,000 ops/sec → Oxia or sharded Redis cluster
├── 0.1% coordination: 1,000,000 ops/sec  → Redis cluster sufficient
└── 0.01% coordination: 100,000 ops/sec   → Single Redis sufficient
```

### 4.2 Phân Tích Constraint Cho 1B TPS

| Constraint | Yêu Cầu | ZooKeeper | Giải Pháp Tối Ưu |
|---|---|---|---|
| **Latency** | P99 < 10ms (coordination) | ❌ P99 ~50-100ms | Redis (~5ms) hoặc In-process cache |
| **Throughput** | Tùy coordination ratio | ❌ Ceiling ~10K/s | Sharded Redis cluster hoặc Oxia |
| **Availability** | 99.999% (five nines) | ⚠️ 99.99% (quorum loss during election) | Multi-region Redis Sentinel + fallback |
| **Data Consistency** | Strong cho critical paths | ✅ Linearizable writes | ZK/etcd cho critical, Redis cho efficiency |
| **Horizontal Scaling** | Linear scaling | ❌ Fixed write throughput | Sharding (partition by domain/tenant) |
| **Cost** | Minimize infra | ❌ Dedicated servers | Kubernetes-native + Redis (already in stack) |

### 4.3 Tại Sao 1B TPS Thay Đổi Mọi Thứ

> [!CAUTION]
> **Ở quy mô 1 billion TPS, KHÔNG CÓ coordination service đơn lẻ nào đủ.**
> 
> Chiến lược duy nhất: **Minimize coordination** + **Partition coordination** + **Tiered consistency model**

```
The 1B TPS Golden Rule:
╔═══════════════════════════════════════════════════════════════╗
║  "Don't coordinate what you don't need to coordinate."       ║
║                                                               ║
║  1B TPS = 99.99% stateless processing + 0.01% coordination  ║
║                                                               ║
║  Coordination budget: ~100,000 ops/sec                        ║
║  ← Redis cluster handles this easily                         ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 5. Agent 4 — User Advocate: Developer Experience

### 5.1 Learning Curve Comparison

```
Learning Curve (thời gian để productive):

                Easy ←──────────────────────────→ Hard

Nacos          ██░░░░░░░░░░░░░░░░░░   ~1 ngày (Spring native)
Redis+Redisson ███░░░░░░░░░░░░░░░░░░  ~2 ngày (quen thuộc)
Consul         █████░░░░░░░░░░░░░░░░  ~3-5 ngày (nhiều concepts)
Kubernetes DNS ██████░░░░░░░░░░░░░░░  ~1 tuần (cần hiểu K8s)
ZooKeeper      █████████░░░░░░░░░░░░  ~2 tuần (ZAB, sessions, recipes)
etcd           ██████████░░░░░░░░░░░  ~2 tuần (gRPC, watchers)
Temporal       ████████████░░░░░░░░░  ~3 tuần (paradigm shift)
Oxia           ██████████████░░░░░░░  ~4+ tuần (very new, little docs)
```

### 5.2 Developer Pain Points Với ZooKeeper

| Pain Point | Mô Tả | Impact |
|---|---|---|
| **Watch re-registration** | One-time watches → phải re-register sau mỗi event (trước 3.6) | Boilerplate code, race conditions |
| **Session management** | Session timeout phải tuning cẩn thận, quá ngắn → false positives | Ephemeral nodes bị xóa sai |
| **Debugging** | Lỗi ZK thường ẩn sâu, error messages không rõ ràng | Tăng debug time |
| **Testing** | Cần embedded ZK hoặc TestContainers để test | CI/CD pipeline chậm hơn |
| **Operational** | Cần dedicated team để vận hành ZK cluster | Tăng cost, cần expertise |

### 5.3 Spring Cloud Integration Quality

```
Spring Cloud Integration Score (out of 10):

Nacos           ██████████ 10/10 — Born for Spring Cloud
Eureka          █████████░  9/10 — Netflix OSS native
Consul          ████████░░  8/10 — Spring Cloud Consul mature
ZooKeeper       ███████░░░  7/10 — Spring Cloud ZK exists but declining
Redis (Redisson)████████░░  8/10 — Spring Data Redis + Redisson
etcd            █████░░░░░  5/10 — No official Spring Cloud module
Oxia            ██░░░░░░░░  2/10 — No Spring integration exists
Temporal        ██████░░░░  6/10 — Spring Boot starter available
```

### 5.4 Nhận Xét Từ Góc Nhìn Developer

> [!NOTE]
> **Developer Experience Verdict**: Nếu đội ngũ đang dùng Spring Boot, **Nacos** cung cấp trải nghiệm tốt nhất cho service discovery + config. **Redis + Redisson** cung cấp trải nghiệm tốt nhất cho distributed locking. ZooKeeper yêu cầu expertise riêng và tăng cognitive load cho dev team.

---

## 6. Agent 5 — Integrator/Arbiter: Phán Quyết Cuối Cùng

### 6.1 Objections Review

| # | Objection (từ Agent nào) | Verdict | Rationale |
|---|---|---|---|
| 1 | ZK KHÔNG scale writes (Skeptic) | ✅ **ACCEPTED** | Confirmed: single-leader architecture, ~10K writes/sec ceiling |
| 2 | ZK vẫn best cho complex recipes (Designer) | ⚠️ **PARTIAL** | True cho HBase/Hadoop, nhưng Spring ecosystem có alternatives tốt hơn |
| 3 | Redis Redlock không an toàn (Skeptic) | ✅ **ACCEPTED** | Chỉ dùng Redis cho efficiency-critical, ZK/etcd cho correctness-critical |
| 4 | Nacos best fit Spring (User Advocate) | ✅ **ACCEPTED** | Native integration, unified platform, CP/AP flexible |
| 5 | 1B TPS cần minimize coordination (Constraint) | ✅ **ACCEPTED** | Golden rule: 99.99% stateless + tiered coordination |
| 6 | Oxia là future nhưng quá mới (Designer) | ✅ **ACCEPTED** | CNCF Sandbox, không production-ready, theo dõi nhưng chưa adopt |

### 6.2 Final Architecture Verdict

```
╔══════════════════════════════════════════════════════════════════╗
║                    🏆 PHÁN QUYẾT CUỐI CÙNG                      ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ZooKeeper KHÔNG phù hợp cho Spring ecosystem mới               ║
║  tại quy mô 1 billion TPS.                                      ║
║                                                                  ║
║  KHUYẾN NGHỊ: Chiến lược phân tầng (Tiered Strategy)            ║
║                                                                  ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │ Layer 1: Service Discovery                              │    ║
║  │ → Kubernetes DNS + Istio Service Mesh                   │    ║
║  │   (KHÔNG cần external registry)                         │    ║
║  ├─────────────────────────────────────────────────────────┤    ║
║  │ Layer 2: Configuration Management                       │    ║
║  │ → Nacos (Spring-native, CP/AP flexible)                 │    ║
║  │   HOẶC Consul (nếu cần multi-DC)                       │    ║
║  ├─────────────────────────────────────────────────────────┤    ║
║  │ Layer 3: Distributed Lock (Efficiency)                  │    ║
║  │ → Redis + Redisson (99% lock use cases)                 │    ║
║  │   ~100K+ ops/sec, P99 < 10ms                           │    ║
║  ├─────────────────────────────────────────────────────────┤    ║
║  │ Layer 4: Distributed Lock (Correctness-Critical)        │    ║
║  │ → etcd HOẶC PostgreSQL Advisory Locks                   │    ║
║  │   (financial transactions, payment dedup)               │    ║
║  ├─────────────────────────────────────────────────────────┤    ║
║  │ Layer 5: Complex Orchestration                          │    ║
║  │ → Temporal (long-running workflows, sagas)              │    ║
║  └─────────────────────────────────────────────────────────┘    ║
║                                                                  ║
║  ZooKeeper: CHỈ giữ lại nếu đang dùng HBase/Hadoop/ClickHouse  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### 6.3 Disposition: **APPROVED** (with conditions)

Điều kiện:
1. Phải benchmark coordination ratio thực tế trước khi chọn Redis cluster size
2. Critical payment paths PHẢI dùng etcd hoặc DB advisory lock, KHÔNG dùng Redis
3. Monitor Oxia (CNCF) — có thể replace etcd trong 2-3 năm tới

---

## 7. Ma Trận So Sánh Toàn Diện

### 7.1 Feature Matrix

| Tiêu Chí | ZooKeeper | etcd | Consul | Nacos | Redis (Redisson) | Temporal |
|---|---|---|---|---|---|---|
| **Consensus** | ZAB | Raft | Raft | Raft/Distro | N/A (AP) | Internal |
| **Data Model** | Hierarchical tree | Flat KV | Flat KV | KV + Service | KV + Data Structs | Workflows |
| **Write Throughput** | ~10K/s | ~15K/s | ~15K/s | ~30K/s | ~100K+/s | ~50K+/s |
| **Read Throughput** | ~100K+/s | ~50K+/s | ~50K+/s | ~100K+/s | ~500K+/s | N/A |
| **P99 Latency (write)** | 10-100ms | 5-50ms | 5-50ms | 5-30ms | 1-10ms | 10-100ms |
| **Consistency** | Sequential/Linearizable | Linearizable | Linearizable | CP/AP switchable | AP (best-effort lock) | Strong |
| **Service Discovery** | Via recipes | Manual | ✅ Built-in | ✅ Built-in | ❌ | ❌ |
| **Config Management** | Hierarchical | KV | ✅ Built-in | ✅ Built-in (best) | ❌ | ❌ |
| **Distributed Lock** | ✅ Best recipes | ✅ CAS-based | ⚠️ Session-based | ⚠️ Basic | ✅ Fast but best-effort | ✅ Via workflows |
| **Leader Election** | ✅ Best-in-class | ✅ Lease-based | ⚠️ Session-based | ⚠️ Basic | ⚠️ Via scripts | ✅ Native |
| **Multi-DC** | ❌ Manual | ❌ Manual | ✅ Native | ⚠️ Federation | ✅ Redis Enterprise | ✅ Multi-cluster |
| **Health Check** | Client-side | Client-side | ✅ Active polling | ✅ Built-in | ❌ | ✅ Activity heartbeat |
| **Spring Integration** | 7/10 | 5/10 | 8/10 | 10/10 | 8/10 | 6/10 |
| **Learning Curve** | Cao | Trung bình | Trung bình | Thấp | Thấp | Cao |
| **Operational Cost** | Cao | Thấp (K8s native) | Trung bình | Trung bình | Thấp | Trung bình |
| **Maturity** | 15+ năm | 10+ năm | 10+ năm | 7+ năm | 15+ năm | 5+ năm |
| **Horizontal Write Scale** | ❌ | ❌ | ❌ | ⚠️ Partial | ✅ Sharded | ✅ Sharded |

### 7.2 Khi Nào Chọn Gì?

```
╔═══════════════════════════════════════════════════════════════╗
║                   DECISION TREE 2026                          ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Bạn đang ở đâu?                                              ║
║  │                                                             ║
║  ├─► Spring Cloud + Kubernetes?                                ║
║  │   │                                                         ║
║  │   ├─► Service Discovery → K8s DNS + Service Mesh           ║
║  │   ├─► Config            → Nacos hoặc K8s ConfigMap         ║
║  │   ├─► Locks (fast)      → Redis + Redisson                 ║
║  │   └─► Locks (critical)  → etcd hoặc DB Advisory Lock      ║
║  │                                                             ║
║  ├─► Spring Cloud + VM/Bare Metal?                             ║
║  │   │                                                         ║
║  │   ├─► Discovery + Config → Nacos (all-in-one)              ║
║  │   ├─► Multi-DC?          → Consul                           ║
║  │   ├─► Locks (fast)       → Redis + Redisson                ║
║  │   └─► Locks (critical)   → ZooKeeper + Curator (nếu đã có)║
║  │                                                             ║
║  ├─► Big Data ecosystem (HBase/Hadoop/ClickHouse)?            ║
║  │   └─► ZooKeeper (BẮT BUỘC, không có alternative)          ║
║  │                                                             ║
║  └─► Long-running workflows + Saga?                            ║
║      └─► Temporal                                              ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 8. Mô Hình Tối Ưu 1 Billion TPS

### 8.1 Nguyên Tắc Vàng

> [!IMPORTANT]
> **"Don't coordinate what you don't need to coordinate."**
> 
> Tại 1B TPS, 99.99% operations PHẢI là stateless. Chỉ 0.01% (= ~100,000 ops/sec) cần distributed coordination. Nếu coordination ratio > 1%, hệ thống sẽ KHÔNG scale được.

### 8.2 Kiến Trúc Tổng Thể

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    1 BILLION TPS ARCHITECTURE                             │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │                     TIER 0: EDGE / CDN                          │     │
│  │  Anycast DNS → Global CDN → Edge Computing (Cloudflare Workers) │     │
│  │  Target: 400B TPS (static content, cached responses)            │     │
│  └─────────────────────────────────────────────────────────────────┘     │
│                              │                                           │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │                TIER 1: API GATEWAY LAYER                        │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │     │
│  │  │ Gateway  │  │ Gateway  │  │ Gateway  │  │ Gateway  │       │     │
│  │  │ Region A │  │ Region B │  │ Region C │  │ Region D │       │     │
│  │  │ (Envoy)  │  │ (Envoy)  │  │ (Envoy)  │  │ (Envoy)  │       │     │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │     │
│  │       │              │              │              │             │     │
│  │  Rate limit, auth, routing — stateless, horizontally scaled     │     │
│  │  Target: 500B TPS aggregate                                     │     │
│  └─────────────────────────────────────────────────────────────────┘     │
│                              │                                           │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │           TIER 2: STATELESS COMPUTE (Spring Boot)               │     │
│  │                                                                 │     │
│  │  ┌─────────────────────────────────────────────────────────┐   │     │
│  │  │  Kubernetes Cluster (per region)                         │   │     │
│  │  │                                                         │   │     │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐     × 1,000s     │   │     │
│  │  │  │ Pod     │ │ Pod     │ │ Pod     │     of pods       │   │     │
│  │  │  │ SB App  │ │ SB App  │ │ SB App  │                   │   │     │
│  │  │  │ (GraalVM│ │ (GraalVM│ │ (GraalVM│                   │   │     │
│  │  │  │ Native) │ │ Native) │ │ Native) │                   │   │     │
│  │  │  └────┬────┘ └────┬────┘ └────┬────┘                   │   │     │
│  │  │       │            │            │                        │   │     │
│  │  │  Service Mesh (Istio) — mTLS, traffic routing           │   │     │
│  │  │  Service Discovery: K8s DNS (ZERO external dependency)  │   │     │
│  │  └─────────────────────────────────────────────────────────┘   │     │
│  │                                                                 │     │
│  │  Target: 99B TPS (stateless reads + writes, auto-scaled)       │     │
│  └─────────────────────────────────────────────────────────────────┘     │
│                              │                                           │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │         TIER 3: COORDINATION LAYER (Tiered)                     │     │
│  │                                                                 │     │
│  │  ┌──────────────────────────────┐  ← 95% of coordination       │     │
│  │  │  Layer A: Redis Cluster      │     (efficiency locks)        │     │
│  │  │  • Redisson Distributed Lock │     ~100K ops/sec             │     │
│  │  │  • Rate Limiting             │     P99 < 5ms                 │     │
│  │  │  • Idempotency Keys          │                               │     │
│  │  │  • Session Cache             │                               │     │
│  │  └──────────────────────────────┘                               │     │
│  │                                                                 │     │
│  │  ┌──────────────────────────────┐  ← 4% of coordination        │     │
│  │  │  Layer B: Nacos              │     (config + discovery)      │     │
│  │  │  • Dynamic Config            │     ~30K ops/sec              │     │
│  │  │  • Feature Flags             │                               │     │
│  │  │  • Service Metadata          │                               │     │
│  │  └──────────────────────────────┘                               │     │
│  │                                                                 │     │
│  │  ┌──────────────────────────────┐  ← 1% of coordination        │     │
│  │  │  Layer C: etcd / DB Advisory │     (correctness-critical)    │     │
│  │  │  • Payment Dedup Lock        │     ~5K ops/sec               │     │
│  │  │  • Leader Election           │     Linearizable              │     │
│  │  │  • Critical State Machine    │                               │     │
│  │  └──────────────────────────────┘                               │     │
│  └─────────────────────────────────────────────────────────────────┘     │
│                              │                                           │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │          TIER 4: DATA LAYER (Sharded + CQRS)                    │     │
│  │                                                                 │     │
│  │  WRITE PATH:                    READ PATH:                      │     │
│  │  ┌──────────────┐              ┌──────────────┐                │     │
│  │  │ Kafka        │ ──async──→  │ Redis Cache   │ ← hot data    │     │
│  │  │ (KRaft mode) │              │ (L1 Cache)    │               │     │
│  │  │ Partitioned  │              └───────┬───────┘               │     │
│  │  │ Event Stream │                      │                        │     │
│  │  └──────┬───────┘              ┌───────▼───────┐               │     │
│  │         │                      │ Read Replicas │ ← warm data   │     │
│  │  ┌──────▼───────┐              │ (TiDB/CockroachDB)│           │     │
│  │  │ Write DB     │              └───────────────┘               │     │
│  │  │ (Sharded     │                                              │     │
│  │  │ PostgreSQL/  │   Serialization: Protobuf/FlatBuffers        │     │
│  │  │ TiDB)        │   (NOT JSON — 10x faster)                    │     │
│  │  └──────────────┘                                              │     │
│  │                                                                 │     │
│  │  Target: 1B TPS (sharded across 100+ DB nodes)                 │     │
│  └─────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │          TIER 5: ORCHESTRATION (Long-running)                   │     │
│  │  ┌──────────────┐                                              │     │
│  │  │ Temporal      │  • Saga orchestration                       │     │
│  │  │ (Durable      │  • Payment workflows                       │     │
│  │  │  Workflows)   │  • Order lifecycle                          │     │
│  │  └──────────────┘  • Compensation logic                       │     │
│  └─────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Tại Sao Kiến Trúc Này Scale Được 1B TPS

| Nguyên Tắc | Cách Thực Hiện |
|---|---|
| **Minimize Coordination** | 99.99% requests = stateless, chỉ 0.01% cần lock/consensus |
| **Tiered Consistency** | Fast path (Redis) cho 95% locks, Strong path (etcd) cho 5% critical |
| **Massive Sharding** | Data sharded by tenant/region → mỗi shard xử lý ~10M TPS |
| **CQRS** | Tách read (cache/replicas) và write (Kafka → DB) → scale independently |
| **Edge Computing** | 40% traffic served tại edge, giảm load cho central systems |
| **Binary Serialization** | Protobuf thay JSON → 10x faster serialization, 3x smaller payload |
| **GraalVM Native Image** | Spring Boot native → startup < 100ms, memory < 100MB/pod |
| **No Central Coordination** | K8s DNS thay ZooKeeper cho discovery → zero coordination overhead |

### 8.4 Key Technology Stack Cho 1B TPS + Spring

| Layer | Technology | Lý Do |
|---|---|---|
| **Runtime** | GraalVM Native Image + Spring Boot 3.x | Sub-100ms startup, low memory, high throughput |
| **API Gateway** | Envoy Proxy (Istio Ingress) | High-performance C++ proxy, 1M+ RPS per instance |
| **Service Mesh** | Istio | mTLS, traffic routing, observability — replaces ZK discovery |
| **Config** | Nacos 2.x | Spring-native, push-based config, CP/AP switchable |
| **Lock (fast)** | Redis 7.x + Redisson | 100K+ ops/sec, P99 < 5ms |
| **Lock (critical)** | etcd 3.5+ OR PostgreSQL Advisory Lock | Linearizable, correct under all failure modes |
| **Messaging** | Apache Kafka (KRaft) | Multi-million msgs/sec, exactly-once semantics |
| **Database** | TiDB / CockroachDB (sharded) | Distributed SQL, horizontal scaling |
| **Cache** | Redis Cluster + Local caffeine cache | Multi-level cache: L1 in-process, L2 Redis |
| **Orchestration** | Temporal | Durable workflows, saga pattern, retry logic |
| **Observability** | OpenTelemetry + Grafana Stack | Distributed tracing across 1000s of pods |
| **Serialization** | Protobuf 3 | 10x faster than JSON, language-neutral |

---

## 9. Decision Log

| # | Decision | Alternatives | Rationale |
|---|---|---|---|
| D1 | ZooKeeper **KHÔNG** phù hợp cho Spring ecosystem mới | Keep ZK, Migrate to Consul | Single-leader write ceiling, declining ecosystem, high ops cost, poor Spring DX vs alternatives |
| D2 | **Tiered coordination** thay vì single tool | Single coordination service | Không có 1 tool đáp ứng tất cả: fast + correct + scalable + easy. Phân tầng cho phép optimize theo use case |
| D3 | **Nacos** cho config + service metadata | Consul, Spring Cloud Config, ConfigMap | Best Spring integration, CP/AP switchable, unified platform, dashboard UI |
| D4 | **Redis + Redisson** cho efficiency locks | ZK Curator, etcd, Hazelcast | 10x+ throughput vs ZK, excellent Spring integration, already in most stacks, sufficient for 95% lock cases |
| D5 | **etcd** cho correctness-critical locks | ZK, PostgreSQL Advisory Lock | Lightweight, Raft-based, linearizable, already in K8s, no extra infra |
| D6 | **K8s DNS + Istio** cho service discovery | Eureka, Consul, ZK, Nacos | Zero additional infra, native to K8s, eliminates coordination overhead |
| D7 | **Temporal** cho complex orchestration | Manual saga with ZK locks, Camunda | Durable state, built-in retry, replaces brittle lock-based coordination patterns |
| D8 | **GraalVM Native Image** cho Spring Boot pods | Standard JVM | Sub-100ms startup, 10x less memory → more pods per node → higher TPS per cluster |
| D9 | **Protobuf** thay JSON | MessagePack, Avro, FlatBuffers | 10x faster than JSON, strong typing, backward compatible, widely supported |
| D10 | **Giữ ZK** CHỈ nếu dùng HBase/Hadoop/ClickHouse | Remove ZK entirely | Các systems này BẮT BUỘC ZK, không có alternative |

---

## 10. Lộ Trình Chuyển Đổi

### Phase 1: Foundation (Month 1-2)

```
[ ] Deploy Nacos cluster (3 nodes) cho config management
[ ] Setup Redis Cluster (6 nodes: 3 master + 3 replica)
[ ] Integrate Redisson với Spring Boot starter
[ ] Migrate service discovery → K8s DNS + Istio
[ ] Benchmark baseline: coordination ops/sec, P99 latency
```

### Phase 2: Migration (Month 3-4)

```
[ ] Migrate ZK-based distributed locks → Redis + Redisson
[ ] Migrate ZK-based config → Nacos
[ ] Identify correctness-critical paths → move to etcd/DB advisory lock
[ ] Migrate leader election → K8s Lease API hoặc etcd
[ ] Remove ZK dependency từ Spring Boot services (giữ ZK cho HBase nếu có)
```

### Phase 3: Optimization (Month 5-6)

```
[ ] Implement CQRS pattern cho high-write paths
[ ] Add Temporal cho saga/workflow orchestration
[ ] Convert Spring Boot → GraalVM Native Image
[ ] Switch JSON → Protobuf cho inter-service communication
[ ] Load test: target 100K → 1M → 10M TPS
```

### Phase 4: Scale (Month 7-12)

```
[ ] Shard database (TiDB/CockroachDB)
[ ] Multi-region deployment
[ ] Edge computing layer (Cloudflare Workers / AWS CloudFront Functions)
[ ] Full 1B TPS load test
[ ] Monitor Oxia maturity → evaluate as future etcd replacement
```

---

## Tài Liệu Tham Khảo

- Apache ZooKeeper Documentation: https://zookeeper.apache.org/doc/current/
- Nacos Documentation: https://nacos.io/docs/latest/
- Redisson Documentation: https://github.com/redisson/redisson/wiki
- Temporal Documentation: https://docs.temporal.io/
- Oxia GitHub: https://github.com/streamnative/oxia
- Martin Fowler — LMAX Architecture: https://martinfowler.com/articles/lmax.html
- "ZooKeeper: Wait-free coordination for Internet-scale systems" — USENIX ATC 2010
