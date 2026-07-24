# Apache Kafka — Nghiên Cứu Từ Zero Đến Nâng Cao

> **Mục tiêu**: Tài liệu nghiên cứu toàn diện về Apache Kafka — từ khái niệm cơ bản đến kiến trúc nội bộ,
> thuật ngữ chuyên sâu, design patterns, và triển khai production-ready.
>
> **Ngày tạo**: 2026-07-24
> **Phiên bản Kafka**: 4.x (KRaft mode, ZooKeeper đã bị loại bỏ hoàn toàn)

---

## Mục Lục

1. [Kafka Là Gì? — Bản Chất & Triết Lý](#1-kafka-là-gì--bản-chất--triết-lý)
2. [Thuật Ngữ Chuyên Sâu — Glossary](#2-thuật-ngữ-chuyên-sâu--glossary)
3. [Kiến Trúc Nội Bộ — Deep Dive](#3-kiến-trúc-nội-bộ--deep-dive)
4. [Producer — Chi Tiết & Tối Ưu](#4-producer--chi-tiết--tối-ưu)
5. [Consumer & Consumer Group — Deep Dive](#5-consumer--consumer-group--deep-dive)
6. [Delivery Semantics — At-Least-Once, At-Most-Once, Exactly-Once](#6-delivery-semantics--at-least-once-at-most-once-exactly-once)
7. [KRaft Mode — Kiến Trúc Mới (Kafka 4.x)](#7-kraft-mode--kiến-trúc-mới-kafka-4x)
8. [Storage Engine — Log, Segment, Index](#8-storage-engine--log-segment-index)
9. [Design Patterns Với Kafka](#9-design-patterns-với-kafka)
10. [Kafka Ecosystem — Streams, Connect, Schema Registry](#10-kafka-ecosystem--streams-connect-schema-registry)
11. [Performance Tuning — Production Configuration](#11-performance-tuning--production-configuration)
12. [Monitoring & Operations](#12-monitoring--operations)
13. [So Sánh Với Các Hệ Thống Khác](#13-so-sánh-với-các-hệ-thống-khác)
14. [Anti-Patterns & Bài Học Thực Tế](#14-anti-patterns--bài-học-thực-tế)

---

## 1. Kafka Là Gì? — Bản Chất & Triết Lý

### 1.1 Định Nghĩa

Apache Kafka là một **distributed event streaming platform** — KHÔNG phải message queue truyền thống.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KAFKA = DISTRIBUTED COMMIT LOG                    │
│                                                                      │
│  Triết lý cốt lõi:                                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  "Mọi thứ là một STREAM OF EVENTS"                          │   │
│  │                                                              │   │
│  │  Event = Fact đã xảy ra (immutable, append-only)            │   │
│  │  Log    = Chuỗi events theo thứ tự thời gian               │   │
│  │  Topic  = Tên gọi cho một stream of events                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Kafka KHÔNG giống RabbitMQ/ActiveMQ:                               │
│  ┌─────────────────────────┬──────────────────────────────────┐     │
│  │ Message Queue           │ Kafka                            │     │
│  ├─────────────────────────┼──────────────────────────────────┤     │
│  │ Message bị xóa sau     │ Message được GIỮ LẠI (retention)│     │
│  │ khi consume             │                                  │     │
│  │                         │                                  │     │
│  │ 1 message → 1 consumer │ 1 message → N consumers         │     │
│  │ (point-to-point)        │ (pub-sub + replay)              │     │
│  │                         │                                  │     │
│  │ Smart broker,           │ Dumb broker,                    │     │
│  │ dumb consumer           │ smart consumer                  │     │
│  │                         │                                  │     │
│  │ Push model              │ Pull model                      │     │
│  └─────────────────────────┴──────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Tại Sao Kafka?

```
USE CASES CHÍNH:

1. EVENT STREAMING
   App A ──event──► Kafka ──event──► App B, C, D, E
   (Decouple producers & consumers)

2. DATA INTEGRATION (CDC)
   Database ──changes──► Kafka ──► Data Warehouse
                                ──► Search Index
                                ──► Cache

3. STREAM PROCESSING
   Raw events ──► Kafka Streams/Flink ──► Enriched events

4. ACTIVITY TRACKING
   User clicks ──► Kafka ──► Analytics Pipeline

5. LOG AGGREGATION
   Server logs ──► Kafka ──► ELK Stack / Splunk

6. METRICS & MONITORING
   System metrics ──► Kafka ──► Prometheus / Grafana
```

### 1.3 Kafka Trong Bức Tranh System Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM DESIGN CONTEXT                              │
│                                                                              │
│  ┌──────────┐     ┌──────────┐     ┌──────────────────────────────────┐     │
│  │ Mobile   │     │ Web App  │     │ Microservices                    │     │
│  │ App      │     │          │     │ (Order, Payment, Inventory, ...) │     │
│  └────┬─────┘     └────┬─────┘     └──────────┬───────────────────────┘     │
│       │                │                       │                             │
│       └────────────────┼───────────────────────┘                             │
│                        │                                                     │
│                        ▼                                                     │
│               ┌────────────────┐                                            │
│               │   API Gateway  │                                            │
│               └────────┬───────┘                                            │
│                        │                                                     │
│                        ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                    APACHE KAFKA CLUSTER                          │        │
│  │                                                                  │        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │        │
│  │  │ Topic:      │  │ Topic:      │  │ Topic:      │            │        │
│  │  │ orders      │  │ payments    │  │ inventory   │            │        │
│  │  │ (6 parts)   │  │ (3 parts)   │  │ (3 parts)   │            │        │
│  │  └─────────────┘  └─────────────┘  └─────────────┘            │        │
│  │                                                                  │        │
│  │  Broker 1          Broker 2          Broker 3                   │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                        │                                                     │
│           ┌────────────┼────────────────────┐                               │
│           ▼            ▼                    ▼                                │
│  ┌────────────┐ ┌────────────┐    ┌────────────────┐                       │
│  │ Kafka      │ │ Kafka      │    │ Stream         │                       │
│  │ Connect    │ │ Streams    │    │ Processing     │                       │
│  │ (CDC→DW)   │ │ (Enrich)   │    │ (Flink)        │                       │
│  └────────────┘ └────────────┘    └────────────────┘                       │
│       │                                    │                                │
│       ▼                                    ▼                                │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Data    │  │ Elastic  │  │ Redis    │  │ Grafana  │                   │
│  │ Lake    │  │ Search   │  │ Cache    │  │ Metrics  │                   │
│  └─────────┘  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Thuật Ngữ Chuyên Sâu — Glossary

### 2.1 Core Concepts

| Thuật ngữ | Giải thích | Tương tự |
|---|---|---|
| **Broker** | Server process trong Kafka cluster, lưu trữ và phục vụ data | Database server |
| **Cluster** | Tập hợp nhiều Brokers hoạt động cùng nhau | Database cluster |
| **Topic** | Tên gọi logic cho một stream of events. KHÔNG phải queue | Database table (conceptually) |
| **Partition** | Đơn vị parallelism — topic được chia thành N partitions | Table shard |
| **Offset** | Số thứ tự (monotonic increasing) của message trong partition | Auto-increment ID |
| **Record / Message / Event** | Đơn vị dữ liệu: Key + Value + Headers + Timestamp | Row trong table |
| **Segment** | File vật lý trên disk chứa một phần data của partition | Data file |
| **Log** | Append-only sequence of records trong partition | Write-ahead log |

### 2.2 Producer Concepts

| Thuật ngữ | Giải thích |
|---|---|
| **Producer** | Client gửi records vào Kafka topics |
| **Partitioner** | Logic quyết định record đi vào partition nào (default: murmur2 hash of key) |
| **Batch** | Nhóm records gửi chung 1 lần để tối ưu throughput |
| **acks** | Acknowledgment level: 0 (fire-forget), 1 (leader only), all (tất cả ISR) |
| **Idempotent Producer** | Producer có PID + Sequence Number, broker deduplicate tự động |
| **Transactional Producer** | Producer gửi messages vào nhiều partitions atomically |
| **Linger** | Thời gian chờ để gom batch trước khi gửi (linger.ms) |
| **Compression** | Nén data: none, gzip, snappy, lz4, zstd |
| **Record Accumulator** | Buffer trong producer, gom records thành batches |
| **Sender Thread** | Background thread gửi batches từ accumulator đến broker |

### 2.3 Consumer Concepts

| Thuật ngữ | Giải thích |
|---|---|
| **Consumer** | Client đọc records từ Kafka topics |
| **Consumer Group** | Nhóm consumers cùng group.id, mỗi partition chỉ assigned cho 1 consumer |
| **Group Coordinator** | Broker đặc biệt quản lý consumer group (heartbeat, assignment) |
| **Rebalance** | Quá trình phân phối lại partitions khi consumer join/leave group |
| **Partition Assignment Strategy** | Thuật toán gán partition: Range, RoundRobin, Sticky, Cooperative Sticky |
| **Committed Offset** | Offset cuối cùng đã xử lý thành công (lưu trong __consumer_offsets) |
| **Lag** | Khoảng cách giữa latest offset và committed offset (= số message chưa xử lý) |
| **Poll Loop** | Vòng lặp chính: consumer.poll() → process → commit |
| **Auto Commit** | Tự động commit offset theo interval (enable.auto.commit=true) — RỦI RO |
| **Session Timeout** | Thời gian max không heartbeat trước khi consumer bị coi là dead |

### 2.4 Replication & Durability

| Thuật ngữ | Giải thích |
|---|---|
| **Replication Factor (RF)** | Số bản sao của mỗi partition (thường = 3) |
| **Leader Replica** | Bản sao chính, xử lý tất cả reads/writes |
| **Follower Replica** | Bản sao phụ, pull data từ leader để đồng bộ |
| **ISR (In-Sync Replicas)** | Tập followers đã catch up với leader (trong replica.lag.time.max.ms) |
| **OSR (Out-of-Sync Replicas)** | Followers bị tụt lại, KHÔNG còn trong ISR |
| **High Watermark (HW)** | Offset cao nhất đã được replicate đến TẤT CẢ ISR members |
| **Log End Offset (LEO)** | Offset cao nhất trong log của mỗi replica |
| **Unclean Leader Election** | Cho phép OSR member trở thành leader (mất data!) |
| **min.insync.replicas** | Số ISR tối thiểu để producer acks=all thành công |
| **Preferred Leader** | Broker "ưu tiên" làm leader cho partition (load balancing) |

### 2.5 KRaft & Cluster Management

| Thuật ngữ | Giải thích |
|---|---|
| **KRaft** | Kafka Raft — consensus protocol thay thế ZooKeeper |
| **Controller** | Broker (hoặc dedicated node) quản lý metadata cluster |
| **Controller Quorum** | Nhóm controllers bầu cử leader bằng Raft consensus |
| **Active Controller** | Controller đang active, xử lý metadata changes |
| **__cluster_metadata** | Internal topic chứa metadata (thay thế ZooKeeper znodes) |
| **Epoch** | Version number cho leader election (tránh split-brain) |
| **Broker Registration** | Broker đăng ký với controller khi join cluster |

### 2.6 Storage & Retention

| Thuật ngữ | Giải thích |
|---|---|
| **Log Segment** | File .log chứa records, rotate khi đầy (segment.bytes) |
| **Index File** | File .index mapping offset → position trong segment file |
| **Timeindex File** | File .timeindex mapping timestamp → offset |
| **Log Compaction** | Giữ lại record MỚI NHẤT cho mỗi key (delete mode vs compact mode) |
| **Tombstone** | Record với value = null, đánh dấu key đã bị xóa |
| **Retention** | Chính sách giữ data: by time (retention.ms) hoặc by size (retention.bytes) |
| **Tiered Storage** | Offload old segments đến object storage (S3/GCS/Azure Blob) |
| **Log Cleaner** | Background thread thực hiện log compaction |

### 2.7 Advanced / Design System Terms

| Thuật ngữ | Giải thích |
|---|---|
| **Backpressure** | Consumer xử lý chậm hơn producer → lag tăng |
| **Consumer Lag** | Metric quan trọng nhất: = (Latest Offset) - (Committed Offset) |
| **Dead Letter Queue (DLQ)** | Topic đặc biệt chứa messages xử lý thất bại |
| **Poison Pill** | Message không thể deserialize/parse → block consumer |
| **Fan-out** | 1 event → nhiều consumer groups xử lý khác nhau |
| **Fan-in** | Nhiều producers → 1 topic → aggregation |
| **Event Replay** | Đọc lại events từ đầu (seek to beginning) |
| **Exactly-Once Semantics (EOS)** | Đảm bảo mỗi message xử lý ĐÚNG 1 LẦN |
| **Transactional Outbox** | Pattern: write event to DB outbox table → CDC → Kafka |
| **Change Data Capture (CDC)** | Capture database changes (WAL/binlog) → Kafka events |
| **Schema Registry** | Service quản lý schema (Avro/Protobuf/JSON Schema) |
| **Schema Evolution** | Thay đổi schema mà không break consumers |
| **Cooperative Rebalance** | Rebalance không gây "stop-the-world" downtime |
| **Static Group Membership** | Consumer với group.instance.id cố định, giảm rebalance |

---

## 3. Kiến Trúc Nội Bộ — Deep Dive

### 3.1 Tổng Quan Cluster

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        KAFKA CLUSTER ARCHITECTURE                        │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    CONTROLLER QUORUM (KRaft)                     │    │
│  │                                                                  │    │
│  │  ┌───────────┐   ┌───────────┐   ┌───────────┐                 │    │
│  │  │Controller │   │Controller │   │Controller │                 │    │
│  │  │  Node 1   │   │  Node 2   │   │  Node 3   │                 │    │
│  │  │ (ACTIVE)  │   │(FOLLOWER) │   │(FOLLOWER) │                 │    │
│  │  └─────┬─────┘   └─────┬─────┘   └─────┬─────┘                 │    │
│  │        │               │               │                        │    │
│  │        └───────────────┼───────────────┘                        │    │
│  │                        │                                         │    │
│  │              __cluster_metadata topic                            │    │
│  │              (Raft replicated log)                               │    │
│  └────────────────────────┬────────────────────────────────────────┘    │
│                           │                                             │
│              ┌────────────┼────────────┐                               │
│              │            │            │                                │
│              ▼            ▼            ▼                                │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                │
│  │   Broker 1    │ │   Broker 2    │ │   Broker 3    │                │
│  │               │ │               │ │               │                │
│  │ ┌───────────┐ │ │ ┌───────────┐ │ │ ┌───────────┐ │                │
│  │ │ orders    │ │ │ │ orders    │ │ │ │ orders    │ │                │
│  │ │ P0(L)     │ │ │ │ P0(F)    │ │ │ │ P1(L)     │ │                │
│  │ │ P1(F)     │ │ │ │ P2(L)    │ │ │ │ P2(F)     │ │                │
│  │ └───────────┘ │ │ └───────────┘ │ │ └───────────┘ │                │
│  │               │ │               │ │               │                │
│  │ ┌───────────┐ │ │ ┌───────────┐ │ │ ┌───────────┐ │                │
│  │ │ payments  │ │ │ │ payments  │ │ │ │ payments  │ │                │
│  │ │ P0(F)     │ │ │ │ P0(L)    │ │ │ │ P1(L)     │ │                │
│  │ │ P1(F)     │ │ │ │           │ │ │ │           │ │                │
│  │ └───────────┘ │ │ └───────────┘ │ │ └───────────┘ │                │
│  │               │ │               │ │               │                │
│  │  (L) = Leader │ │               │ │               │                │
│  │  (F) = Follow │ │               │ │               │                │
│  └───────────────┘ └───────────────┘ └───────────────┘                │
│                                                                          │
│  Legend:                                                                │
│  • Topic "orders": 3 partitions, RF=3 → 9 replicas across 3 brokers   │
│  • Topic "payments": 2 partitions, RF=2 → 4 replicas                  │
│  • Mỗi partition có ĐÚNG 1 Leader, xử lý ALL reads/writes             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 ISR — In-Sync Replicas (Chi Tiết)

```
ISR LÀ GÌ?

ISR = Tập hợp các replicas "đã bắt kịp" leader.
Một message chỉ được coi là "COMMITTED" khi TẤT CẢ ISR members đã write.

═══ TRƯỜNG HỢP BÌNH THƯỜNG ═══

  Leader (Broker 1)         Follower (Broker 2)     Follower (Broker 3)
  ┌──────────────────┐      ┌──────────────────┐    ┌──────────────────┐
  │ offset 0: msg_a  │      │ offset 0: msg_a  │    │ offset 0: msg_a  │
  │ offset 1: msg_b  │      │ offset 1: msg_b  │    │ offset 1: msg_b  │
  │ offset 2: msg_c  │      │ offset 2: msg_c  │    │ offset 2: msg_c  │
  │ offset 3: msg_d  │ ◄──  │ offset 3: msg_d  │    │ offset 3: msg_d  │
  └──────────────────┘      └──────────────────┘    └──────────────────┘
  LEO = 4                   LEO = 4                  LEO = 4
  HW = 4                    HW = 4                   HW = 4

  ISR = {Broker1, Broker2, Broker3}   ← TẤT CẢ in-sync
  Committed = offset 0→3              ← Consumer có thể đọc

═══ KHI FOLLOWER BỊ TỤT ═══

  Leader (Broker 1)         Follower (Broker 2)     Follower (Broker 3)
  ┌──────────────────┐      ┌──────────────────┐    ┌──────────────────┐
  │ offset 0: msg_a  │      │ offset 0: msg_a  │    │ offset 0: msg_a  │
  │ offset 1: msg_b  │      │ offset 1: msg_b  │    │ offset 1: msg_b  │
  │ offset 2: msg_c  │      │ offset 2: msg_c  │    │                  │
  │ offset 3: msg_d  │      │ offset 3: msg_d  │    │  ← LAGGING!      │
  │ offset 4: msg_e  │      │                  │    │                  │
  └──────────────────┘      └──────────────────┘    └──────────────────┘
  LEO = 5                   LEO = 4                  LEO = 2

  Nếu Broker 3 lag > replica.lag.time.max.ms (default 30s):
  ISR = {Broker1, Broker2}            ← Broker3 bị LOẠI khỏi ISR
  HW = 4                              ← Chỉ commit đến offset mà TẤT CẢ ISR đã nhận

═══ LEADER FAILOVER ═══

  Broker 1 CRASH!

  Controller phát hiện → chọn leader mới TỪ ISR:
  • Broker 2 (LEO=4) → trở thành Leader mới
  • Broker 3 (LEO=2) → KHÔNG được chọn (trong OSR)

  KẾT QUẢ: Không mất data! (vì leader mới có tất cả committed messages)

═══ UNCLEAN LEADER ELECTION ═══

  Nếu tất cả ISR members đều die, chỉ còn Broker 3 (OSR, LEO=2):

  unclean.leader.election.enable=true:
    → Broker 3 trở thành leader
    → MẤT DATA: offset 2, 3 BIẾN MẤT!
    → Availability > Durability

  unclean.leader.election.enable=false (RECOMMENDED):
    → Partition UNAVAILABLE cho đến khi ISR member recover
    → Durability > Availability
```

### 3.3 min.insync.replicas — Guard Cho Durability

```
CẤU HÌNH QUAN TRỌNG:

  Replication Factor = 3
  min.insync.replicas = 2

  Khi producer gửi acks=all:
  ┌─────────────────────────────────────────────────────────────┐
  │ ISR = {B1, B2, B3}  →  3 >= 2  →  WRITE THÀNH CÔNG        │
  │ ISR = {B1, B2}      →  2 >= 2  →  WRITE THÀNH CÔNG        │
  │ ISR = {B1}          →  1 < 2   →  WRITE BỊ REJECT!        │
  │                         NotEnoughReplicasException          │
  └─────────────────────────────────────────────────────────────┘

  ═══ KHUYẾN NGHỊ PRODUCTION ═══

  ┌─────────────────────────────────────┐
  │ replication.factor = 3              │
  │ min.insync.replicas = 2             │
  │ acks = all                          │
  │ enable.idempotence = true           │
  │ unclean.leader.election = false     │
  │                                     │
  │ → Chịu được 1 broker failure       │
  │ → Không mất data                   │
  │ → Không duplicate                  │
  └─────────────────────────────────────┘
```

---

## 4. Producer — Chi Tiết & Tối Ưu

### 4.1 Luồng Gửi Message Nội Bộ

```
  APPLICATION THREAD                              SENDER THREAD (Background)
  ┌──────────────────────────────────────┐       ┌─────────────────────────┐
  │                                      │       │                         │
  │  producer.send(record)               │       │                         │
  │       │                              │       │                         │
  │       ▼                              │       │                         │
  │  ┌──────────┐                        │       │                         │
  │  │Serializer│ Key + Value → bytes    │       │                         │
  │  └────┬─────┘                        │       │                         │
  │       │                              │       │                         │
  │       ▼                              │       │                         │
  │  ┌────────────┐                      │       │                         │
  │  │Partitioner │ → Chọn partition     │       │                         │
  │  │            │   (by key hash)      │       │                         │
  │  └────┬───────┘                      │       │                         │
  │       │                              │       │                         │
  │       ▼                              │       │                         │
  │  ┌────────────────────────────┐      │       │                         │
  │  │   Record Accumulator      │      │       │                         │
  │  │                            │      │       │                         │
  │  │  ┌─────────┐ ┌─────────┐  │      │       │  ┌──────────────────┐  │
  │  │  │ Batch   │ │ Batch   │  │ ────────────► │  │  Network I/O     │  │
  │  │  │ Topic-P0│ │ Topic-P1│  │      │       │  │  Send to Broker  │  │
  │  │  │ [r1,r2] │ │ [r3]    │  │      │       │  │                  │  │
  │  │  └─────────┘ └─────────┘  │      │       │  │  Wait for acks   │  │
  │  │                            │      │       │  │  Handle retry    │  │
  │  │  Gom batch khi:            │      │       │  └──────────────────┘  │
  │  │  • batch.size đầy          │      │       │                         │
  │  │  • linger.ms hết           │      │       │                         │
  │  └────────────────────────────┘      │       │                         │
  └──────────────────────────────────────┘       └─────────────────────────┘
```

### 4.2 Partitioning Strategy

```java
// ═══ PARTITIONING — Record đi vào partition nào? ═══

// CASE 1: Key != null → Hash partitioning (đảm bảo ordering by key)
producer.send(new ProducerRecord<>("orders",
    "customer-123",           // Key: customer ID
    orderEventJson));         // → LUÔN đi vào cùng 1 partition
                              // → Ordering GUARANTEED cho customer-123

// CASE 2: Key == null → Round-robin (hoặc Sticky Partitioner)
producer.send(new ProducerRecord<>("logs",
    null,                     // No key
    logMessage));             // → Round-robin across partitions
                              // → Maximize throughput, NO ordering guarantee

// CASE 3: Custom Partitioner
public class GeoPartitioner implements Partitioner {
    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                         Object value, byte[] valueBytes, Cluster cluster) {
        String region = extractRegion((String) key);
        int numPartitions = cluster.partitionCountForTopic(topic);

        // VN traffic → partition 0-2, US → 3-5, EU → 6-8
        return switch (region) {
            case "VN" -> Math.abs(key.hashCode()) % 3;
            case "US" -> 3 + Math.abs(key.hashCode()) % 3;
            case "EU" -> 6 + Math.abs(key.hashCode()) % 3;
            default   -> Math.abs(key.hashCode()) % numPartitions;
        };
    }
}
```

### 4.3 Idempotent Producer — Chống Duplicate

```
═══ VẤN ĐỀ: Duplicate khi retry ═══

  Producer                    Broker
  ┌──────┐                   ┌──────┐
  │      │ ── send msg_A ──► │      │  Broker write thành công
  │      │                   │      │
  │      │ ◄── ACK ──────── │      │  ACK bị mất (network issue!)
  │      │                   │      │
  │      │ ── retry msg_A ─► │      │  Broker write LẦN NỮA!
  │      │                   │      │
  │      │ ◄── ACK ──────── │      │  msg_A bị DUPLICATE!
  └──────┘                   └──────┘

═══ GIẢI PHÁP: Idempotent Producer ═══

  enable.idempotence=true

  Producer                    Broker
  ┌──────┐                   ┌──────┐
  │ PID=5│                   │      │
  │ Seq=0│ ── send msg_A ──► │      │  Broker: PID=5, Seq=0 → WRITE
  │      │   (PID=5, Seq=0)  │      │
  │      │                   │      │
  │      │ ◄── ACK (lost) ── │      │
  │      │                   │      │
  │ Seq=0│ ── retry msg_A ─► │      │  Broker: PID=5, Seq=0 đã có!
  │      │   (PID=5, Seq=0)  │      │  → DISCARD (duplicate)
  │      │                   │      │
  │      │ ◄── ACK ──────── │      │  Không duplicate!
  └──────┘                   └──────┘

  Cơ chế:
  • Producer được gán PID (Producer ID) unique
  • Mỗi message có Sequence Number (per partition)
  • Broker tracking: {PID, Partition} → last Seq
  • Nếu Seq <= last Seq → REJECT (duplicate)
  • Nếu Seq > last Seq + 1 → OUT OF ORDER (reject)
```

### 4.4 Transactional Producer — Atomic Multi-Partition Writes

```java
// ═══ TRANSACTIONAL PRODUCER ═══

Properties props = new Properties();
props.put("bootstrap.servers", "broker1:9092,broker2:9092");
props.put("transactional.id", "order-processor-1");  // BẮT BUỘC
props.put("enable.idempotence", "true");               // Tự động bật

KafkaProducer<String, String> producer = new KafkaProducer<>(props);

// Bước 1: Init transactions (gọi 1 lần duy nhất)
producer.initTransactions();

try {
    // Bước 2: Begin transaction
    producer.beginTransaction();

    // Bước 3: Gửi messages đến NHIỀU topics/partitions
    producer.send(new ProducerRecord<>("orders", orderId, orderJson));
    producer.send(new ProducerRecord<>("payments", orderId, paymentJson));
    producer.send(new ProducerRecord<>("inventory", orderId, stockJson));

    // Bước 4: Commit consumer offset TRONG CÙNG transaction
    producer.sendOffsetsToTransaction(
        Map.of(new TopicPartition("input-events", 0),
               new OffsetAndMetadata(inputOffset + 1)),
        consumerGroupId);

    // Bước 5: Commit tất cả cùng lúc (ATOMIC)
    producer.commitTransaction();
    // → Tất cả 3 messages + offset commit thành công HOẶC không cái nào thành công

} catch (ProducerFencedException | OutOfOrderSequenceException e) {
    // Fatal — không thể recover
    producer.close();
} catch (KafkaException e) {
    // Abort transaction → tất cả messages bị rollback
    producer.abortTransaction();
}
```

```
═══ TRANSACTION FLOW NỘI BỘ ═══

  Producer                   Transaction         Broker           Broker
  (txn.id=T1)                Coordinator         (partition 0)    (partition 1)
  ┌─────────┐               ┌──────────┐        ┌──────────┐    ┌──────────┐
  │         │               │          │        │          │    │          │
  │ begin   │──────────────►│ T1:BEGIN │        │          │    │          │
  │         │               │          │        │          │    │          │
  │ send(P0)│──────────────────────────────────►│ msg (T1) │    │          │
  │         │               │ register │        │ (uncommit│    │          │
  │         │               │ P0       │        │  ted)    │    │          │
  │         │               │          │        │          │    │          │
  │ send(P1)│──────────────────────────────────────────────────►│ msg (T1) │
  │         │               │ register │        │          │    │ (uncommit│
  │         │               │ P1       │        │          │    │  ted)    │
  │         │               │          │        │          │    │          │
  │ commit  │──────────────►│ PREPARE  │        │          │    │          │
  │         │               │ COMMIT   │        │          │    │          │
  │         │               │          │        │          │    │          │
  │         │               │──COMMIT MARKER───►│ ✓ visible│    │          │
  │         │               │──COMMIT MARKER───────────────────►│ ✓ visible│
  │         │               │          │        │          │    │          │
  │         │               │ T1:DONE  │        │          │    │          │
  └─────────┘               └──────────┘        └──────────┘    └──────────┘

  Consumer (isolation.level=read_committed):
  → Chỉ đọc messages CÓ COMMIT MARKER
  → Messages chưa commit → INVISIBLE
```

---

## 5. Consumer & Consumer Group — Deep Dive

### 5.1 Consumer Group Mechanics

```
═══ CONSUMER GROUP — QUY TẮC VÀNG ═══

  Mỗi partition CHÍNH XÁC assigned cho 1 consumer trong group.
  Mỗi consumer có thể assigned 0 đến N partitions.

  Topic "orders" (6 partitions)

  TRƯỜNG HỢP 1: 3 consumers
  ┌──────────┬──────────┬──────────┐
  │Consumer 1│Consumer 2│Consumer 3│
  │ P0, P1   │ P2, P3   │ P4, P5   │    ← Balanced
  └──────────┴──────────┴──────────┘

  TRƯỜNG HỢP 2: 6 consumers (optimal)
  ┌────┬────┬────┬────┬────┬────┐
  │ C1 │ C2 │ C3 │ C4 │ C5 │ C6 │
  │ P0 │ P1 │ P2 │ P3 │ P4 │ P5 │      ← 1:1 mapping, max parallelism
  └────┴────┴────┴────┴────┴────┘

  TRƯỜNG HỢP 3: 8 consumers (>6 partitions!)
  ┌────┬────┬────┬────┬────┬────┬────┬────┐
  │ C1 │ C2 │ C3 │ C4 │ C5 │ C6 │ C7 │ C8 │
  │ P0 │ P1 │ P2 │ P3 │ P4 │ P5 │IDLE│IDLE│  ← 2 consumers LÃNG PHÍ!
  └────┴────┴────┴────┴────┴────┴────┴────┘

  ⚠️ Số consumers > số partitions → consumers thừa bị idle!
  → Muốn tăng parallelism → PHẢI tăng partitions trước!

═══ FAN-OUT: Nhiều Consumer Groups ═══

  Topic "orders" (3 partitions)

  Consumer Group "analytics"          Consumer Group "billing"
  ┌────┬────┬────┐                    ┌────┬────┬────┐
  │ C1 │ C2 │ C3 │                    │ C1 │ C2 │ C3 │
  │ P0 │ P1 │ P2 │                    │ P0 │ P1 │ P2 │
  └────┴────┴────┘                    └────┴────┴────┘

  → Mỗi group NHẬN TẤT CẢ messages (independent consumption)
  → "analytics" group xử lý cho dashboard
  → "billing" group xử lý cho thanh toán
  → CÙNG messages, KHÁC use case
```

### 5.2 Rebalancing — Protocol Chi Tiết

```
═══ REBALANCE XẢY RA KHI ═══

1. Consumer mới JOIN group
2. Consumer LEAVE group (crash hoặc shutdown)
3. Consumer bị coi là DEAD (session.timeout.ms hết)
4. Topic thay đổi (thêm partitions)

═══ EAGER REBALANCE (Legacy — Stop-the-World) ═══

  Trước rebalance:            Trong rebalance:           Sau rebalance:
  C1: P0, P1                  C1: ∅  ← TẤT CẢ           C1: P0
  C2: P2, P3                  C2: ∅     bị REVOKE!       C2: P1, P2
  (C3 joins)                  C3: ∅                       C3: P3

  Vấn đề: TOÀN BỘ consumers ngừng xử lý trong rebalance!
  → Downtime = rebalance time (có thể nhiều giây)

═══ COOPERATIVE STICKY REBALANCE (Modern — Incremental) ═══

  Trước rebalance:            Rebalance #1:              Rebalance #2:
  C1: P0, P1                  C1: P0, P1  ← GIỮ NGUYÊN  C1: P0
  C2: P2, P3                  C2: P2, P3  ← GIỮ NGUYÊN  C2: P2, P3
  (C3 joins)                  C3: ∅       ← CHỜ          C3: P1  ← NHẬN P1

  Chỉ partition CẦN di chuyển mới bị revoke!
  → Downtime gần = 0 cho các consumers không bị ảnh hưởng!

  Cấu hình:
  partition.assignment.strategy=
    org.apache.kafka.clients.consumer.CooperativeStickyAssignor

═══ STATIC GROUP MEMBERSHIP (Giảm rebalance) ═══

  Khi consumer restart (rolling deployment):

  Không có static membership:
  Consumer die → rebalance → consumer rejoin → rebalance LẦN NỮA

  Có static membership:
  Consumer die → chờ session.timeout.ms
  Consumer rejoin VỚI CÙNG group.instance.id → KHÔNG rebalance!

  props.put("group.instance.id", "consumer-host-1");
  props.put("session.timeout.ms", "30000");  // 30s grace period
```

### 5.3 Offset Management — Manual vs Auto

```java
// ═══ AUTO COMMIT (Default — NGUY HIỂM!) ═══

props.put("enable.auto.commit", "true");
props.put("auto.commit.interval.ms", "5000");  // Commit mỗi 5s

// Vấn đề:
// 1. Consumer poll() → nhận 100 messages
// 2. Xử lý 50 messages
// 3. Auto-commit xảy ra → commit offset = 100
// 4. Consumer CRASH!
// 5. Consumer mới bắt đầu từ offset 100
// → 50 messages BỊ MẤT (đã commit nhưng chưa xử lý)!

// ═══ MANUAL COMMIT — AT-LEAST-ONCE (Khuyến nghị) ═══

props.put("enable.auto.commit", "false");

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));

    for (ConsumerRecord<String, String> record : records) {
        // 1. Xử lý TRƯỚC
        processRecord(record);  // ← Phải idempotent!
    }

    // 2. Commit SAU khi xử lý xong
    consumer.commitSync();  // hoặc commitAsync()

    // Nếu crash sau process nhưng trước commit:
    // → Message sẽ bị xử lý LẠI (at-least-once)
    // → VÌ VẬY processRecord() phải IDEMPOTENT!
}

// ═══ MANUAL COMMIT PER PARTITION — Fine-grained control ═══

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));

    for (TopicPartition partition : records.partitions()) {
        List<ConsumerRecord<String, String>> partRecords = records.records(partition);

        for (ConsumerRecord<String, String> record : partRecords) {
            processRecord(record);
        }

        // Commit offset cho TỪNG partition riêng lẻ
        long lastOffset = partRecords.get(partRecords.size() - 1).offset();
        consumer.commitSync(Map.of(
            partition,
            new OffsetAndMetadata(lastOffset + 1)  // +1 = next offset to read
        ));
    }
}
```

---

## 6. Delivery Semantics — At-Least-Once, At-Most-Once, Exactly-Once

### 6.1 Ba Loại Guarantee

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     DELIVERY SEMANTICS COMPARISON                        │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  AT-MOST-ONCE (May lose messages)                                │   │
│  │                                                                  │   │
│  │  Producer: acks=0                                                │   │
│  │  Consumer: commit BEFORE processing                              │   │
│  │                                                                  │   │
│  │  Message flow: send → forget (no retry)                         │   │
│  │  Risk: Message lost if broker crash                             │   │
│  │  Use case: Metrics, logs (loss acceptable)                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  AT-LEAST-ONCE (May duplicate messages) ← DEFAULT               │   │
│  │                                                                  │   │
│  │  Producer: acks=all, retries=MAX                                │   │
│  │  Consumer: commit AFTER processing                              │   │
│  │                                                                  │   │
│  │  Message flow: send → wait ack → retry if fail                  │   │
│  │  Risk: Duplicate if ack lost (retry produces again)             │   │
│  │  Use case: Most applications (with idempotent consumers)        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  EXACTLY-ONCE (Each message processed exactly once)              │   │
│  │                                                                  │   │
│  │  Producer: enable.idempotence=true + transactional.id           │   │
│  │  Consumer: isolation.level=read_committed                       │   │
│  │  Offsets: committed WITHIN transaction                          │   │
│  │                                                                  │   │
│  │  Message flow: read → process → write + commit offset           │   │
│  │                 (all in ONE ATOMIC TRANSACTION)                  │   │
│  │  Risk: None (if properly configured)                            │   │
│  │  Use case: Financial, billing, critical data pipelines          │   │
│  │                                                                  │   │
│  │  ⚠️ COST: Higher latency, lower throughput                     │   │
│  │     Chỉ dùng khi THẬT SỰ cần!                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ╔══════════════════════════════════════════════════════════════════╗   │
│  ║  KHUYẾN NGHỊ: Dùng AT-LEAST-ONCE + IDEMPOTENT CONSUMERS       ║   │
│  ║  → Đơn giản hơn EOS, hiệu năng tốt hơn                       ║   │
│  ║  → Consumer tự xử lý duplicate (bằng unique ID)               ║   │
│  ╚══════════════════════════════════════════════════════════════════╝   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Exactly-Once End-to-End Flow

```
═══ EOS: Read-Process-Write Pattern ═══

  Input Topic              Consumer/Producer              Output Topic
  ┌──────────┐            ┌───────────────────┐          ┌──────────┐
  │ offset 5 │            │                   │          │          │
  │ offset 6 │──────────►│ 1. poll() msg #6  │          │          │
  │ offset 7 │            │ 2. process(msg)   │          │          │
  │          │            │ 3. beginTxn()     │          │          │
  │          │            │ 4. send(result)   │──────────►│ result_6 │
  │          │            │ 5. commitOffset(7)│          │          │
  │          │            │ 6. commitTxn()    │          │          │
  │          │            │                   │          │          │
  │          │            │ ═══ ALL ATOMIC ══ │          │          │
  └──────────┘            └───────────────────┘          └──────────┘

  __consumer_offsets                          __transaction_state
  ┌──────────────────┐                       ┌──────────────────┐
  │ group: my-app    │                       │ txn.id: proc-1   │
  │ topic: input     │                       │ status: COMMITTED│
  │ partition: 0     │                       │ partitions: [..] │
  │ offset: 7        │ ← committed           │                  │
  └──────────────────┘  atomically           └──────────────────┘
```

---

## 7. KRaft Mode — Kiến Trúc Mới (Kafka 4.x)

### 7.1 ZooKeeper vs KRaft

```
═══ TRƯỚC (ZooKeeper Mode) ═══

  ┌─────────────┐     ┌─────────────┐
  │  ZooKeeper  │     │  ZooKeeper  │
  │  Node 1     │────│  Node 2     │
  └──────┬──────┘     └──────┬──────┘
         │                   │
    ┌────┴───────────────────┴────┐
    │     EXTERNAL DEPENDENCY     │
    │   (Separate cluster!)       │
    │   • Broker registration     │
    │   • Controller election     │
    │   • Topic metadata          │
    │   • ACLs                    │
    └────┬───────────────────┬────┘
         │                   │
  ┌──────┴──────┐     ┌─────┴───────┐
  │  Kafka      │     │  Kafka      │
  │  Broker 1   │     │  Broker 2   │
  └─────────────┘     └─────────────┘

  Vấn đề:
  • 2 cluster cần vận hành (ZK + Kafka)
  • ZK = bottleneck cho metadata operations
  • Controller failover = 30s+ (phải đọc lại từ ZK)
  • Giới hạn ~200K partitions per cluster

═══ SAU (KRaft Mode — Kafka 4.x) ═══

  ┌─────────────────────────────────────────────────────────┐
  │                    KAFKA CLUSTER ONLY                     │
  │                                                          │
  │  Controller Quorum (Raft consensus):                     │
  │  ┌───────────┐  ┌───────────┐  ┌───────────┐           │
  │  │Controller │  │Controller │  │Controller │           │
  │  │ (LEADER)  │  │(FOLLOWER) │  │(FOLLOWER) │           │
  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘           │
  │        │               │               │                 │
  │        └───────────────┼───────────────┘                 │
  │                        │                                  │
  │              __cluster_metadata                           │
  │              (Internal Raft log)                          │
  │                        │                                  │
  │              ┌─────────┼─────────┐                       │
  │              │         │         │                        │
  │              ▼         ▼         ▼                        │
  │         Broker 1  Broker 2  Broker 3                     │
  │                                                          │
  └─────────────────────────────────────────────────────────┘

  Lợi ích:
  • 1 cluster duy nhất (không cần ZK)
  • Controller failover = milliseconds
  • Hỗ trợ TRIỆU partitions per cluster
  • Operational simplicity (1 hệ thống)
  • Faster metadata propagation

  Deployment modes:
  1. Combined mode: Controller + Broker trên cùng node (small clusters)
  2. Isolated mode: Controller riêng, Broker riêng (production, large clusters)
```

### 7.2 KRaft Metadata Flow

```
═══ VÍ DỤ: Tạo Topic Mới ═══

  Admin Client           Active Controller         Brokers
  ┌──────────┐          ┌──────────────────┐      ┌──────────┐
  │          │          │                  │      │          │
  │ CREATE   │─────────►│ Validate request │      │          │
  │ TOPIC    │          │                  │      │          │
  │ "orders" │          │ Write to         │      │          │
  │ parts=3  │          │ __cluster_meta   │      │          │
  │ rf=3     │          │                  │      │          │
  │          │          │ Raft replicate   │      │          │
  │          │          │ to followers     │      │          │
  │          │          │                  │      │          │
  │          │          │ Committed!       │      │          │
  │          │          │                  │      │          │
  │          │          │ Push metadata    │─────►│ Create   │
  │          │          │ update to        │      │ partition│
  │          │          │ ALL brokers      │      │ dirs     │
  │          │          │                  │      │          │
  │          │◄─────────│ Response: OK     │      │ Ready!   │
  └──────────┘          └──────────────────┘      └──────────┘
```

---

## 8. Storage Engine — Log, Segment, Index

### 8.1 Cấu Trúc File Trên Disk

```
/kafka-logs/
└── orders-0/                           ← Partition 0 của topic "orders"
    ├── 00000000000000000000.log        ← Segment file (chứa records)
    ├── 00000000000000000000.index      ← Offset index
    ├── 00000000000000000000.timeindex  ← Timestamp index
    ├── 00000000000000367892.log        ← Segment mới (tên = base offset)
    ├── 00000000000000367892.index
    ├── 00000000000000367892.timeindex
    ├── 00000000000000735784.log        ← Active segment (đang write)
    ├── 00000000000000735784.index
    ├── 00000000000000735784.timeindex
    └── leader-epoch-checkpoint          ← Leader epoch tracking

═══ SEGMENT ROTATION ═══

  Segment mới tạo khi:
  • segment.bytes (default 1GB) đầy
  • segment.ms (default 7 days) hết
  • Index file đầy

═══ OFFSET INDEX — Tìm message nhanh ═══

  Index file (sparse index, mỗi 4KB data):
  ┌─────────────────────────────────┐
  │ Offset     │  Position (bytes)  │
  ├─────────────────────────────────┤
  │ 0          │  0                 │
  │ 15         │  4096              │
  │ 30         │  8192              │
  │ 45         │  12288             │
  │ ...        │  ...               │
  └─────────────────────────────────┘

  Tìm offset 23:
  1. Binary search index → offset 15 (position 4096)
  2. Linear scan từ position 4096 → tìm offset 23
  → O(log N) + small linear scan = CỰC NHANH!
```

### 8.2 Log Compaction

```
═══ DELETE RETENTION (Default) ═══

  Giữ messages theo thời gian hoặc size:
  retention.ms = 604800000 (7 days)
  retention.bytes = -1 (unlimited)

  Timeline:
  ├──────── 7 days ago ──────── today ──────────►
  │        DELETED               RETAINED         │

═══ LOG COMPACTION ═══

  cleanup.policy=compact

  Giữ LẠI record MỚI NHẤT cho MỖI KEY.
  Dùng cho: CDC, state store, configuration.

  TRƯỚC compaction:                    SAU compaction:
  ┌───────┬───────┬────────┐          ┌───────┬───────┬────────┐
  │Offset │ Key   │ Value  │          │Offset │ Key   │ Value  │
  ├───────┼───────┼────────┤          ├───────┼───────┼────────┤
  │ 0     │ K1    │ V1_old │          │ 3     │ K1    │ V1_new │ ← KEPT
  │ 1     │ K2    │ V2_old │          │ 4     │ K2    │ V2_new │ ← KEPT
  │ 2     │ K3    │ V3     │          │ 2     │ K3    │ V3     │ ← KEPT
  │ 3     │ K1    │ V1_new │          │ 5     │ K4    │ null   │ ← TOMBSTONE
  │ 4     │ K2    │ V2_new │          └───────┴───────┴────────┘
  │ 5     │ K4    │ null   │ ← tombstone
  └───────┴───────┴────────┘

  K1: chỉ giữ V1_new (offset 3)
  K2: chỉ giữ V2_new (offset 4)
  K4: tombstone (sẽ bị xóa sau delete.retention.ms)

  Use cases:
  • __consumer_offsets topic (compact) — giữ latest offset per group
  • CDC snapshot — giữ latest state per row
  • KTable trong Kafka Streams — changelog topic
```

### 8.3 Tiered Storage (Kafka 4.x)

```
═══ TIERED STORAGE ═══

  Vấn đề: Giữ data 30 ngày trên local disk = TỐN KÉM!
  Giải pháp: Hot data trên local SSD, cold data trên S3/GCS

  ┌─────────────────────────────────────────────────┐
  │              BROKER LOCAL STORAGE                 │
  │              (SSD, high IOPS)                     │
  │                                                   │
  │  Hot Segments:                                    │
  │  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
  │  │Segment  │ │Segment  │ │Segment  │            │
  │  │ Day -2  │ │ Day -1  │ │ Today   │ ← ACTIVE  │
  │  └─────────┘ └─────────┘ └─────────┘            │
  │                                                   │
  │  local.retention.ms = 2 days                     │
  └───────────────────┬───────────────────────────────┘
                      │ Offload older segments
                      ▼
  ┌─────────────────────────────────────────────────┐
  │              REMOTE STORAGE                       │
  │              (S3 / GCS / Azure Blob)              │
  │              (cheap, unlimited)                   │
  │                                                   │
  │  Cold Segments:                                   │
  │  ┌─────────┐ ┌─────────┐ ... ┌─────────┐       │
  │  │Segment  │ │Segment  │     │Segment  │       │
  │  │ Day -30 │ │ Day -29 │     │ Day -3  │       │
  │  └─────────┘ └─────────┘     └─────────┘       │
  │                                                   │
  │  retention.ms = 30 days (total retention)        │
  └─────────────────────────────────────────────────┘

  Consumer đọc offset cũ → broker fetch từ remote storage
  Consumer đọc offset mới → broker serve từ local disk

  Lợi ích:
  • Giảm 80-90% storage cost
  • Giữ data lâu hơn (months/years) mà không tốn SSD
  • Independent scaling: compute vs storage
```

---

## 9. Design Patterns Với Kafka

### 9.1 Event-Driven Architecture

```
═══ PATTERN 1: EVENT NOTIFICATION ═══

  Producer chỉ gửi "thông báo" + ID, consumer tự fetch details.

  Order Service                    Notification Service
  ┌──────────┐   OrderCreated     ┌──────────────┐
  │          │──{orderId: 123}──►│              │
  │          │   (event nhỏ)      │ fetch order  │
  │          │                    │ details via  │
  │          │◄─── GET /order/123─│ REST API     │
  │          │                    │              │
  │          │──── response ─────►│ send email   │
  └──────────┘                    └──────────────┘

  Pros: Event size nhỏ, API evolve independent
  Cons: Coupling, additional API call, consumer cần online

═══ PATTERN 2: EVENT-CARRIED STATE TRANSFER ═══

  Producer gửi TOÀN BỘ data cần thiết trong event.

  Order Service                    Analytics Service
  ┌──────────┐   OrderCreated     ┌──────────────┐
  │          │──{                 │              │
  │          │   orderId: 123,   │  ĐỦ DATA     │
  │          │   customer: {...},│  để xử lý    │
  │          │   items: [...],   │  KHÔNG cần   │
  │          │   total: 99.99    │  gọi API     │
  │          │  }                 │              │
  └──────────┘                    └──────────────┘

  Pros: Consumer tự chủ, no API dependency, offline-capable
  Cons: Event size lớn, data redundancy

═══ PATTERN 3: EVENT SOURCING ═══

  KHÔNG lưu current state. Lưu SEQUENCE OF EVENTS.
  State = replay(all events)

  Account Events Log:
  ┌──────┬────────────────────┬────────┐
  │ #    │ Event              │ Amount │
  ├──────┼────────────────────┼────────┤
  │ 1    │ AccountOpened      │ 0      │
  │ 2    │ MoneyDeposited     │ +1000  │
  │ 3    │ MoneyWithdrawn     │ -300   │
  │ 4    │ MoneyDeposited     │ +500   │
  │ 5    │ MoneyWithdrawn     │ -200   │
  └──────┴────────────────────┴────────┘

  Current Balance = 0 + 1000 - 300 + 500 - 200 = $1000

  Kafka = perfect Event Store:
  • Append-only ✓
  • Immutable ✓
  • Ordered ✓
  • Replayable ✓
  • Durable ✓
```

### 9.2 Transactional Outbox Pattern

```
═══ VẤN ĐỀ: DUAL WRITE ═══

  Order Service
  ┌──────────────────────────────────────────┐
  │                                          │
  │  1. Save order to DATABASE     ← ✅ OK   │
  │  2. Send event to KAFKA        ← ❌ FAIL │
  │                                          │
  │  → Database có order, nhưng Kafka KHÔNG! │
  │  → Downstream services KHÔNG biết order  │
  │  → DATA INCONSISTENCY!                  │
  └──────────────────────────────────────────┘

═══ GIẢI PHÁP: TRANSACTIONAL OUTBOX ═══

  ┌──────────────────────────────────────────────────────────────┐
  │  Order Service                                                │
  │                                                               │
  │  @Transactional  ← CÙNG 1 database transaction              │
  │  void createOrder(request) {                                 │
  │      Order order = orderRepo.save(new Order(...));           │
  │      outboxRepo.save(new OutboxEvent(                        │
  │          "orders",           // topic                        │
  │          order.getId(),      // key                          │
  │          toJson(order)));    // value                        │
  │  }                                                           │
  │                                                               │
  │  ┌──────────────────┐   ┌───────────────────┐               │
  │  │ orders table     │   │ outbox table      │               │
  │  │                  │   │                   │               │
  │  │ id | status | .. │   │ id | topic | key  │               │
  │  │ 123| PENDING|    │   │ 1  |orders |123  │               │
  │  └──────────────────┘   │    | payload|json │               │
  │                         └─────────┬─────────┘               │
  │                                   │                          │
  └───────────────────────────────────┼──────────────────────────┘
                                      │
                          ┌───────────┴───────────┐
                          │                       │
                     Option A:                Option B:
                     Polling                  CDC (Debezium)
                          │                       │
                          ▼                       ▼
              ┌───────────────────┐   ┌───────────────────┐
              │ @Scheduled        │   │ Debezium          │
              │ SELECT * FROM     │   │ Connector         │
              │ outbox            │   │                   │
              │ WHERE sent=false  │   │ Read DB WAL       │
              │ FOR UPDATE        │   │ (binlog/WAL)      │
              │ SKIP LOCKED       │   │                   │
              │                   │   │ Zero-code!        │
              │ → send to Kafka   │   │ → send to Kafka   │
              │ → mark as sent   │   │                   │
              └───────────────────┘   └───────────────────┘
                                              │
                                              ▼
                                      ┌──────────────┐
                                      │    KAFKA      │
                                      │ Topic: orders │
                                      └──────────────┘
```

### 9.3 CQRS với Kafka

```
═══ CQRS: Command Query Responsibility Segregation ═══

  ┌─────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │  WRITE SIDE (Commands)              READ SIDE (Queries)         │
  │  ┌──────────────────┐              ┌──────────────────┐        │
  │  │  Command Handler │              │  Query Handler   │        │
  │  │                  │              │                  │        │
  │  │  CreateOrder     │              │  GetOrderById    │        │
  │  │  UpdateOrder     │              │  SearchOrders    │        │
  │  │  CancelOrder     │              │  GetOrderStats   │        │
  │  └────────┬─────────┘              └────────┬─────────┘        │
  │           │                                 │                   │
  │           ▼                                 ▼                   │
  │  ┌──────────────────┐              ┌──────────────────┐        │
  │  │  Write Database  │              │  Read Database   │        │
  │  │  (PostgreSQL)    │              │  (Elasticsearch) │        │
  │  │  Normalized      │              │  (Redis Cache)   │        │
  │  │  Strong consist. │              │  Denormalized    │        │
  │  └────────┬─────────┘              │  Fast queries    │        │
  │           │                        └────────▲─────────┘        │
  │           │ Outbox/CDC                      │                   │
  │           ▼                                 │                   │
  │  ┌──────────────────────────────────────────┤                  │
  │  │              KAFKA                       │                  │
  │  │  Topic: order-events                     │                  │
  │  │                                          │                  │
  │  │  Event consumers project →               │                  │
  │  │  into read-optimized stores  ────────────┘                  │
  │  └──────────────────────────────────────────┘                  │
  │                                                                  │
  │  Eventual Consistency: Write → Event → Project → Read (ms delay)│
  └─────────────────────────────────────────────────────────────────┘
```

---

## 10. Kafka Ecosystem — Streams, Connect, Schema Registry

### 10.1 Kafka Connect

```
═══ KAFKA CONNECT — Data Integration Framework ═══

  Mục đích: Di chuyển data VÀO và RA Kafka, KHÔNG CẦN viết code.

  ┌──────────┐     ┌───────────────────────────────┐     ┌──────────┐
  │          │     │       KAFKA CONNECT            │     │          │
  │ Sources  │     │                               │     │  Sinks   │
  │          │     │  ┌──────────┐  ┌──────────┐  │     │          │
  │ Postgres │────►│  │ Source   │  │  Sink    │  │────►│ Elastic  │
  │ MySQL    │     │  │ Connectors│  │Connectors│  │     │ S3       │
  │ MongoDB  │     │  │          │  │          │  │     │ Snowflake│
  │ Files    │     │  │ Debezium │  │ JDBC     │  │     │ Redis    │
  │ APIs     │     │  │ JDBC     │  │ S3       │  │     │ HDFS     │
  │          │     │  │ MQ       │  │ ES       │  │     │          │
  │          │     │  └────┬─────┘  └────┬─────┘  │     │          │
  └──────────┘     │       │             │        │     └──────────┘
                   │       ▼             ▼        │
                   │  ┌──────────────────────┐    │
                   │  │     KAFKA TOPICS      │    │
                   │  └──────────────────────┘    │
                   │                               │
                   │  SMTs (Simple Message         │
                   │   Transforms):                │
                   │  • InsertField                │
                   │  • ReplaceField               │
                   │  • TimestampRouter            │
                   │  • RegexRouter                │
                   └───────────────────────────────┘

  Modes:
  • Standalone: 1 worker process (dev/test)
  • Distributed: N workers, auto-balancing (production)
```

### 10.2 Kafka Streams

```
═══ KAFKA STREAMS — Stream Processing Library ═══

  Không phải cluster riêng! Là LIBRARY trong Java/Kotlin app.

  ┌──────────────────────────────────────────────────────────────┐
  │  YOUR APPLICATION (Microservice)                              │
  │                                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Kafka Streams Library                                │    │
  │  │                                                       │    │
  │  │  StreamsBuilder builder = new StreamsBuilder();      │    │
  │  │                                                       │    │
  │  │  // Read from input topic                            │    │
  │  │  KStream<String, Order> orders =                     │    │
  │  │      builder.stream("orders");                       │    │
  │  │                                                       │    │
  │  │  // Transform                                         │    │
  │  │  KStream<String, EnrichedOrder> enriched = orders    │    │
  │  │      .filter((k, v) -> v.getTotal() > 100)           │    │
  │  │      .mapValues(order -> enrich(order))              │    │
  │  │      .peek((k, v) -> log.info("Processing: {}", k));│    │
  │  │                                                       │    │
  │  │  // Write to output topic                            │    │
  │  │  enriched.to("enriched-orders");                     │    │
  │  │                                                       │    │
  │  │  // Stateful: Aggregation                            │    │
  │  │  KTable<String, Long> orderCounts = orders           │    │
  │  │      .groupByKey()                                    │    │
  │  │      .count();  // ← State stored in RocksDB!       │    │
  │  │                                                       │    │
  │  │  // Windowed aggregation                             │    │
  │  │  KTable<Windowed<String>, Long> hourlyCounts =       │    │
  │  │      orders                                           │    │
  │  │      .groupByKey()                                    │    │
  │  │      .windowedBy(TimeWindows.ofSizeWithNoGrace(      │    │
  │  │          Duration.ofHours(1)))                        │    │
  │  │      .count();                                        │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                               │
  │  State Store:                                                │
  │  ┌──────────────────────────────────────────┐               │
  │  │ RocksDB (embedded, on-disk)              │               │
  │  │ Backed by changelog topic in Kafka       │               │
  │  │ → Fault-tolerant state!                  │               │
  │  └──────────────────────────────────────────┘               │
  └──────────────────────────────────────────────────────────────┘
```

### 10.3 Schema Registry

```
═══ SCHEMA REGISTRY — Contract Enforcement ═══

  Vấn đề: Producer thay đổi schema → Consumer bị CRASH!

  Giải pháp: Schema Registry = "Type system" cho Kafka

  Producer                Schema Registry           Consumer
  ┌──────────┐           ┌──────────────┐          ┌──────────┐
  │          │           │              │          │          │
  │ Serialize│──schema──►│ Check compat │          │          │
  │ with     │           │              │          │          │
  │ schema   │◄──ID=42───│ Store schema │          │          │
  │ v2       │           │ Return ID    │          │          │
  │          │           │              │          │          │
  │ Send:    │           │              │          │          │
  │ [ID=42]  │─────────────────────────────────────►│          │
  │ [data]   │           │              │          │ Get      │
  │          │           │              │◄─────────│ schema   │
  │          │           │              │──────────►│ by ID=42 │
  │          │           │              │          │          │
  │          │           │              │          │ Deserial │
  │          │           │              │          │ with v2  │
  └──────────┘           └──────────────┘          └──────────┘

  Compatibility Modes:
  ┌──────────────────────────────────────────────────────────┐
  │ BACKWARD: New schema can READ old data                   │
  │           (add field with default, delete field)         │
  │                                                          │
  │ FORWARD:  Old schema can READ new data                   │
  │           (delete field, add field with default)         │
  │                                                          │
  │ FULL:     Both backward AND forward compatible           │
  │           (RECOMMENDED for production)                   │
  │                                                          │
  │ NONE:     No compatibility check (DANGEROUS!)            │
  └──────────────────────────────────────────────────────────┘
```

### 10.4 So Sánh: Kafka Streams vs Flink

```
┌──────────────────┬─────────────────────────┬─────────────────────────┐
│ Feature          │ Kafka Streams           │ Apache Flink            │
├──────────────────┼─────────────────────────┼─────────────────────────┤
│ Architecture     │ Library (embedded)      │ Cluster (JobManager +   │
│                  │                         │ TaskManagers)           │
│                  │                         │                         │
│ Deployment       │ As your microservice    │ Separate cluster        │
│                  │ (Docker, K8s, JAR)      │ (YARN, K8s, standalone) │
│                  │                         │                         │
│ State            │ RocksDB + changelog     │ RocksDB + checkpoints   │
│                  │ topics in Kafka         │ (S3/HDFS)               │
│                  │                         │                         │
│ Source/Sink      │ Kafka ONLY              │ Kafka, Kinesis, JDBC,   │
│                  │                         │ Files, Pulsar, ...      │
│                  │                         │                         │
│ Windowing        │ Basic (tumbling,        │ Advanced (custom        │
│                  │ hopping, session)       │ triggers, watermarks,   │
│                  │                         │ late data handling)     │
│                  │                         │                         │
│ Exactly-Once     │ Native (Kafka txn)      │ Native (checkpoints)    │
│                  │                         │                         │
│ Scaling          │ Scale app instances     │ Scale TaskManagers      │
│                  │                         │                         │
│ Learning Curve   │ Low (just Java code)    │ High (new paradigm)     │
│                  │                         │                         │
│ Best For         │ Kafka-native, simple    │ Complex CEP, multi-     │
│                  │ transformations,        │ source, high-volume     │
│                  │ microservice            │ analytics               │
└──────────────────┴─────────────────────────┴─────────────────────────┘

QUYẾT ĐỊNH:
  "Chỉ cần Kafka + đơn giản"        → Kafka Streams
  "Multi-source, complex processing" → Flink
  "Chỉ di chuyển data"              → Kafka Connect
```

---

## 11. Performance Tuning — Production Configuration

### 11.1 Producer Tuning Matrix

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRODUCER TUNING MATRIX                                │
│                                                                          │
│  ┌──────────────┬────────────────┬────────────────┬─────────────────┐  │
│  │ Parameter    │ HIGH THROUGHPUT│ LOW LATENCY    │ HIGH DURABILITY │  │
│  ├──────────────┼────────────────┼────────────────┼─────────────────┤  │
│  │ acks         │ 1              │ 1              │ all             │  │
│  │ batch.size   │ 128KB - 256KB  │ 16KB (default) │ 16KB            │  │
│  │ linger.ms    │ 10 - 50ms      │ 0ms            │ 5ms             │  │
│  │ compression  │ lz4 / zstd     │ none           │ lz4             │  │
│  │ buffer.memory│ 64MB - 128MB   │ 32MB (default) │ 32MB            │  │
│  │ retries      │ MAX_INT        │ MAX_INT        │ MAX_INT         │  │
│  │ idempotence  │ true           │ true           │ true            │  │
│  │ max.in.flight│ 5              │ 5              │ 5 (with idemp.) │  │
│  └──────────────┴────────────────┴────────────────┴─────────────────┘  │
│                                                                          │
│  ═══ GIẢI THÍCH batch.size + linger.ms ═══                             │
│                                                                          │
│  batch.size = 64KB, linger.ms = 20ms                                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                                                                │    │
│  │  Record 1 ─► [batch: 4KB]  ← chưa đầy, chờ linger           │    │
│  │  Record 2 ─► [batch: 8KB]  ← chưa đầy, chờ linger           │    │
│  │  Record 3 ─► [batch: 12KB] ← chưa đầy, chờ linger           │    │
│  │  ...                                                          │    │
│  │  Record N ─► [batch: 64KB] ← ĐẦY! → gửi ngay (dù chưa hết │    │
│  │                                        linger time)           │    │
│  │  HOẶC:                                                        │    │
│  │  Record 5 ─► [batch: 20KB] ← chưa đầy                       │    │
│  │     ... 20ms passed ...                                       │    │
│  │  → LINGER HẾT! → gửi batch 20KB (dù chưa đầy)              │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  KEY INSIGHT:                                                           │
│  batch.size = trigger khi ĐẦY (bytes)                                  │
│  linger.ms  = trigger khi HẾT GIỜ                                      │
│  Cái nào đến TRƯỚC → gửi!                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Consumer Tuning

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONSUMER TUNING                                       │
│                                                                          │
│  ┌──────────────────────┬────────────────────────────────────────────┐  │
│  │ Parameter            │ Recommendation                            │  │
│  ├──────────────────────┼────────────────────────────────────────────┤  │
│  │ fetch.min.bytes      │ 1 (default) → tăng nếu muốn throughput   │  │
│  │ fetch.max.wait.ms    │ 500ms (default) → broker chờ lâu hơn     │  │
│  │ max.poll.records     │ 500 (default) → giảm nếu processing lâu  │  │
│  │ max.poll.interval.ms │ 300000 (5min) → tăng nếu processing lâu  │  │
│  │ session.timeout.ms   │ 45000 → thời gian heartbeat timeout      │  │
│  │ heartbeat.interval.ms│ 15000 → 1/3 session.timeout.ms           │  │
│  │ auto.offset.reset    │ earliest / latest (tùy use case)         │  │
│  │ enable.auto.commit   │ false (MANUAL commit!)                   │  │
│  │ isolation.level      │ read_committed (nếu dùng EOS)            │  │
│  └──────────────────────┴────────────────────────────────────────────┘  │
│                                                                          │
│  ⚠️ QUAN TRỌNG: max.poll.interval.ms                                   │
│                                                                          │
│  Nếu consumer mất > max.poll.interval.ms giữa 2 lần poll():           │
│  → Consumer bị coi là DEAD → REBALANCE!                                │
│                                                                          │
│  ┌──────────────────────────────────────────────────────┐              │
│  │  poll()                                              │              │
│  │    │                                                 │              │
│  │    ├── process 500 records (takes 6 minutes!)       │              │
│  │    │                                                 │              │
│  │    ├── max.poll.interval.ms = 5 min ← EXCEEDED!     │              │
│  │    │                                                 │              │
│  │    └── → Consumer kicked from group!                │              │
│  │         → Rebalance triggered!                      │              │
│  │         → Messages processed AGAIN (duplicate!)     │              │
│  └──────────────────────────────────────────────────────┘              │
│                                                                          │
│  Fix:                                                                   │
│  1. Giảm max.poll.records (ít messages hơn per poll)                   │
│  2. Tăng max.poll.interval.ms                                          │
│  3. Process nhanh hơn (async, batch processing)                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 11.3 Broker Tuning

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BROKER TUNING (Production)                            │
│                                                                          │
│  ═══ NETWORK & I/O ═══                                                  │
│  num.network.threads = 8          # Threads xử lý network requests     │
│  num.io.threads = 16              # Threads xử lý disk I/O             │
│  socket.send.buffer.bytes = 102400                                      │
│  socket.receive.buffer.bytes = 102400                                   │
│  socket.request.max.bytes = 104857600  # 100MB max request             │
│                                                                          │
│  ═══ LOG / STORAGE ═══                                                  │
│  log.dirs = /data/kafka1,/data/kafka2  # Multiple dirs = multiple disks│
│  log.segment.bytes = 1073741824       # 1GB per segment                │
│  log.retention.hours = 168            # 7 days retention               │
│  log.retention.check.interval.ms = 300000  # Check every 5 min        │
│                                                                          │
│  ═══ REPLICATION ═══                                                    │
│  default.replication.factor = 3                                         │
│  min.insync.replicas = 2                                                │
│  unclean.leader.election.enable = false                                 │
│  replica.lag.time.max.ms = 30000      # 30s before removing from ISR   │
│                                                                          │
│  ═══ PERFORMANCE ═══                                                    │
│  num.partitions = 6                   # Default partitions per topic    │
│  message.max.bytes = 1048576          # 1MB max message size           │
│  compression.type = producer          # Use producer's compression     │
│                                                                          │
│  ═══ HARDWARE RECOMMENDATIONS ═══                                       │
│  ┌──────────────────────────────────────────────────────┐              │
│  │ CPU:     16+ cores (for compression + networking)    │              │
│  │ RAM:     64GB+ (OS page cache = KEY to performance!) │              │
│  │ Disk:    SSD (NVMe preferred), JBOD configuration   │              │
│  │ Network: 10Gbps+                                     │              │
│  │ JVM:     -Xmx6g -Xms6g (Kafka uses page cache, not │              │
│  │          heap — keep heap small!)                    │              │
│  └──────────────────────────────────────────────────────┘              │
│                                                                          │
│  KEY INSIGHT: Kafka performance = PAGE CACHE performance               │
│  → Nhiều RAM = nhiều data cached bởi OS                                │
│  → Consumer đọc recent data = read từ cache (no disk I/O!)            │
│  → JVM heap KHÔNG cần lớn (6-8GB đủ)                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Monitoring & Operations

### 12.1 Key Metrics

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TOP KAFKA METRICS TO MONITOR                          │
│                                                                          │
│  ═══ #1 CONSUMER LAG (Quan trọng nhất!) ═══                            │
│                                                                          │
│  Consumer Lag = Latest Offset - Committed Offset                        │
│                                                                          │
│  Latest Offset:    100                                                  │
│  Committed Offset: 85                                                   │
│  LAG = 15 messages ← Consumer đang tụt 15 messages!                    │
│                                                                          │
│  Alert thresholds:                                                      │
│  • lag < 100       → ✅ Healthy                                         │
│  • 100 < lag < 1K  → ⚠️ Warning (processing slow)                      │
│  • lag > 1K        → 🔴 Critical (consumer overwhelmed)                 │
│  • lag INCREASING  → 🚨 Emergency (consumer can't keep up!)            │
│                                                                          │
│  ═══ BROKER METRICS ═══                                                 │
│  ┌────────────────────────────┬──────────────────────────────────┐     │
│  │ Metric                    │ Alert When                       │     │
│  ├────────────────────────────┼──────────────────────────────────┤     │
│  │ UnderReplicatedPartitions │ > 0 (replica falling behind)     │     │
│  │ IsrShrinks / IsrExpands   │ Frequent changes (instability)  │     │
│  │ ActiveControllerCount     │ != 1 (split brain!)              │     │
│  │ OfflinePartitionsCount    │ > 0 (data unavailable!)         │     │
│  │ RequestHandlerAvgIdlePerc │ < 0.3 (broker overloaded)       │     │
│  │ NetworkProcessorAvgIdle   │ < 0.3 (network threads busy)   │     │
│  │ BytesInPerSec             │ Spike detection                 │     │
│  │ BytesOutPerSec            │ Spike detection                 │     │
│  │ LogFlushRateAndTimeMs     │ p99 > 100ms (disk bottleneck)   │     │
│  └────────────────────────────┴──────────────────────────────────┘     │
│                                                                          │
│  ═══ PRODUCER METRICS ═══                                               │
│  • record-send-rate           → Messages/second                        │
│  • record-error-rate          → Should be 0                            │
│  • request-latency-avg       → p99 latency                            │
│  • record-queue-time-avg     → Time in buffer (batching delay)         │
│  • batch-size-avg            → Actual batch size (tuning indicator)    │
│                                                                          │
│  ═══ CONSUMER METRICS ═══                                               │
│  • records-consumed-rate     → Consumption speed                       │
│  • records-lag-max           → Max lag across partitions               │
│  • commit-latency-avg       → Offset commit speed                     │
│  • rebalance-latency-total  → Total rebalance downtime                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 13. So Sánh Với Các Hệ Thống Khác

```
┌─────────────────┬─────────────┬─────────────┬────────────┬────────────┐
│ Feature         │ Kafka       │ RabbitMQ    │ Pulsar     │ AWS SQS    │
├─────────────────┼─────────────┼─────────────┼────────────┼────────────┤
│ Model           │ Log-based   │ Queue-based │ Log-based  │ Queue      │
│                 │ Pub-Sub     │ + Pub-Sub   │ Pub-Sub    │            │
│                 │             │             │            │            │
│ Ordering        │ Per         │ Per queue   │ Per        │ FIFO       │
│                 │ partition   │ (FIFO)      │ partition  │ (optional) │
│                 │             │             │            │            │
│ Retention       │ Configurable│ Until       │ Configur.  │ 14 days    │
│                 │ (days/size) │ consumed    │ + tiered   │ max        │
│                 │             │             │            │            │
│ Replay          │ ✅ Yes      │ ❌ No       │ ✅ Yes     │ ❌ No      │
│                 │             │             │            │            │
│ Throughput      │ Millions/s  │ 10K-100K/s  │ Millions/s │ Moderate   │
│                 │             │             │            │            │
│ Latency         │ ms (batch)  │ μs-ms       │ ms         │ 10-100ms   │
│                 │             │             │            │            │
│ Consumer Model  │ Pull        │ Push/Pull   │ Pull       │ Pull       │
│                 │             │             │            │            │
│ Ecosystem       │ Massive     │ Moderate    │ Growing    │ AWS only   │
│                 │ (Streams,   │             │            │            │
│                 │  Connect,   │             │            │            │
│                 │  ksqlDB)    │             │            │            │
│                 │             │             │            │            │
│ Operations      │ Complex     │ Simple      │ Complex    │ Managed    │
│                 │ (self-host) │             │            │ (no ops)   │
│                 │             │             │            │            │
│ Best For        │ Event       │ Task queues │ Multi-     │ Simple     │
│                 │ streaming,  │ RPC,        │ tenant,    │ decouple   │
│                 │ data        │ Simple      │ geo-       │            │
│                 │ pipelines   │ messaging   │ replication│            │
└─────────────────┴─────────────┴─────────────┴────────────┴────────────┘

KHI NÀO CHỌN KAFKA:
✅ Event streaming & data pipelines
✅ Cần replay/reprocess events
✅ High throughput (>100K msgs/sec)
✅ Multiple consumers cho cùng data
✅ Log aggregation
✅ CDC (Change Data Capture)

KHI NÀO KHÔNG CHỌN KAFKA:
❌ Simple task queue (dùng RabbitMQ/SQS)
❌ Request-reply pattern (dùng RabbitMQ)
❌ Low volume, simple use case (overhead quá lớn)
❌ Muốn managed service dễ (dùng SQS/SNS)
❌ Message routing phức tạp (dùng RabbitMQ exchanges)
```

---

## 14. Anti-Patterns & Bài Học Thực Tế

### 14.1 Anti-Patterns

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         KAFKA ANTI-PATTERNS                              │
│                                                                          │
│  ❌ #1: Quá nhiều Partitions                                            │
│  ─────────────────────────────────────                                  │
│  Topic với 1000 partitions nhưng chỉ có 3 consumers                    │
│  → 997 partitions IDLE → waste memory & metadata                       │
│  → Rule: partitions = 2-3x expected max consumers                      │
│                                                                          │
│  ❌ #2: Message quá lớn                                                  │
│  ──────────────────────────                                             │
│  Gửi 10MB messages (images, videos, files)                             │
│  → Kafka tối ưu cho messages < 1MB                                      │
│  → Fix: Gửi URL/reference, store blob trong S3/MinIO                   │
│                                                                          │
│  ❌ #3: Dùng Kafka làm Database                                         │
│  ───────────────────────────────                                        │
│  Query messages by arbitrary fields                                     │
│  → Kafka KHÔNG hỗ trợ query by field (chỉ by offset)                  │
│  → Fix: Project events vào database/search engine (CQRS)              │
│                                                                          │
│  ❌ #4: Auto-commit offsets                                              │
│  ─────────────────────────────                                          │
│  enable.auto.commit=true + async processing                            │
│  → Message committed TRƯỚC khi xử lý xong                             │
│  → Crash → message MẤT!                                                │
│  → Fix: Manual commit SAU khi xử lý                                   │
│                                                                          │
│  ❌ #5: Không có Dead Letter Queue                                       │
│  ─────────────────────────────────                                      │
│  Consumer gặp bad message → retry vô hạn → BLOCK partition            │
│  → Fix: Retry N lần → move to DLQ topic → alert                       │
│                                                                          │
│  ❌ #6: Key chọn sai → Hot Partition                                    │
│  ───────────────────────────────────                                    │
│  Key = "country" (90% traffic = "US")                                  │
│  → 90% messages vào 1 partition → 1 consumer quá tải                   │
│  → Fix: Composite key (country + userId) hoặc custom partitioner      │
│                                                                          │
│  ❌ #7: Dual Write (không dùng Outbox)                                   │
│  ───────────────────────────────────                                    │
│  Save to DB + Send to Kafka trong 2 operations riêng                   │
│  → 1 thành công, 1 thất bại → Inconsistency!                          │
│  → Fix: Transactional Outbox + CDC (Debezium)                          │
│                                                                          │
│  ❌ #8: Không có Schema Registry                                         │
│  ──────────────────────────────                                         │
│  Producer thay đổi JSON format → Consumer crash!                       │
│  → Fix: Schema Registry + Avro/Protobuf + compatibility checks        │
│                                                                          │
│  ❌ #9: Không monitoring Consumer Lag                                    │
│  ─────────────────────────────────                                      │
│  Consumer lag tăng dần → không ai biết → data pipeline delay hàng giờ  │
│  → Fix: Monitor lag, alert khi > threshold                             │
│                                                                          │
│  ❌ #10: Rebalance storms                                                │
│  ─────────────────────────                                              │
│  Consumer chậm → bị kick → rebalance → other consumers chậm           │
│  → bị kick → rebalance LOOP!                                           │
│  → Fix: Cooperative Sticky Assignor + Static Group Membership          │
│          + tune max.poll.interval.ms                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 14.2 Production Checklist

```
═══ KAFKA PRODUCTION READINESS CHECKLIST ═══

□ BROKER
  □ KRaft mode (Kafka 4.x, no ZooKeeper)
  □ 3+ broker cluster (minimum)
  □ Isolated controller quorum (large clusters)
  □ SSD storage, JBOD configuration
  □ JVM heap = 6-8GB, let OS handle page cache
  □ ulimit -n = 100000 (file descriptors)
  □ vm.swappiness = 1 (minimize swap)

□ TOPICS
  □ replication.factor >= 3
  □ min.insync.replicas = 2
  □ unclean.leader.election.enable = false
  □ Partition count = planned for max parallelism
  □ Retention policy configured per topic
  □ Schema registered in Schema Registry

□ PRODUCER
  □ enable.idempotence = true
  □ acks = all
  □ Compression enabled (lz4 recommended)
  □ Serializer configured (Avro/Protobuf preferred)
  □ Error handling + DLQ configured
  □ Transactional outbox for dual-write scenarios

□ CONSUMER
  □ enable.auto.commit = false
  □ Manual offset commit after processing
  □ Idempotent processing logic
  □ CooperativeStickyAssignor
  □ Static group membership for rolling deployments
  □ DLQ for poison pill handling
  □ max.poll.records tuned for processing time

□ MONITORING
  □ Consumer lag monitoring + alerting
  □ Under-replicated partitions alerting
  □ Broker metrics exported (JMX → Prometheus)
  □ Active controller count = exactly 1
  □ Disk usage monitoring
  □ Network throughput monitoring

□ SECURITY
  □ TLS encryption (in-transit)
  □ SASL authentication
  □ ACLs configured per topic
  □ Encryption at rest (if required)

□ DISASTER RECOVERY
  □ Cross-datacenter replication (MirrorMaker 2)
  □ Backup strategy for critical topics
  □ Recovery runbook documented
  □ Failover tested
```

---

## Tổng Kết — Key Takeaways

| # | Insight |
|---|---|
| 1 | **Kafka ≠ Message Queue**. Kafka là distributed commit log. Messages KHÔNG bị xóa sau khi consume |
| 2 | **Partition = đơn vị parallelism**. Muốn scale consumers → PHẢI tăng partitions trước |
| 3 | **Ordering chỉ đảm bảo TRONG 1 partition**. Dùng Key để route related messages vào cùng partition |
| 4 | **ISR = trái tim của durability**. RF=3, min.insync.replicas=2, acks=all = golden config |
| 5 | **Consumer Lag là metric #1**. Monitor lag = monitor health toàn bộ pipeline |
| 6 | **Manual offset commit**. Auto-commit = data loss risk. LUÔN commit SAU khi xử lý |
| 7 | **Idempotency là foundation**. Dù at-least-once hay exactly-once, consumer PHẢI idempotent |
| 8 | **KRaft mode (Kafka 4.x)** = no ZooKeeper, faster failover, triệu partitions |
| 9 | **Transactional Outbox** giải quyết dual-write problem. KHÔNG bao giờ write DB + Kafka riêng lẻ |
| 10 | **Kafka Streams ≠ Kafka Connect ≠ Flink**. Mỗi tool cho mục đích khác nhau |
| 11 | **Page Cache = secret weapon**. Kafka dùng OS page cache, KHÔNG dùng JVM heap cho data |
| 12 | **Schema Registry** là bắt buộc cho production. Không có = breaking changes sẽ xảy ra |

