# Apache ZooKeeper — Nghiên Cứu Tổng Hợp

> **Ngày tạo**: 2026-07-22  
> **Phiên bản ZooKeeper hiện tại**: 3.9.x  
> **Trạng thái**: Mature, vẫn là thành phần cốt lõi cho HBase/Hadoop/ClickHouse; Kafka đã chuyển sang KRaft

---

## Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Kiến Trúc Tổng Thể](#2-kiến-trúc-tổng-thể)
3. [Data Model — Znodes](#3-data-model--znodes)
4. [Sessions & Watches](#4-sessions--watches)
5. [ZAB Protocol — Cốt Lõi Consensus](#5-zab-protocol--cốt-lõi-consensus)
6. [Recipes — Các Pattern Phân Tán](#6-recipes--các-pattern-phân-tán)
7. [Real-World Use Cases](#7-real-world-use-cases)
8. [Production Best Practices](#8-production-best-practices)
9. [So Sánh: ZooKeeper vs etcd vs Consul](#9-so-sánh-zookeeper-vs-etcd-vs-consul)
10. [Xu Hướng & Tương Lai](#10-xu-hướng--tương-lai)
11. [Tài Liệu Tham Khảo](#11-tài-liệu-tham-khảo)

---

## 1. Tổng Quan

**Apache ZooKeeper** là một dịch vụ phối hợp phân tán (distributed coordination service), cung cấp các primitive đáng tin cậy cho:

- **Configuration Management** — lưu trữ cấu hình tập trung
- **Naming / Service Discovery** — đăng ký và tìm kiếm dịch vụ
- **Distributed Synchronization** — lock, barrier, queue
- **Group Membership** — theo dõi node nào đang active

ZooKeeper được phát triển tại Yahoo! Research, trở thành Apache Top-Level Project, và là **backbone** cho rất nhiều hệ thống phân tán lớn (Kafka, HBase, Hadoop HDFS HA, ClickHouse, Solr...).

### Đặc Điểm Chính

| Đặc điểm | Mô tả |
|---|---|
| **Consistency Model** | Sequential Consistency (linearizable writes, sequential reads) |
| **Fault Tolerance** | Chịu được `(n-1)/2` node fail trong cluster `n` nodes |
| **Performance** | Reads cực nhanh (served từ local replica), writes chậm hơn (cần quorum) |
| **Ngôn ngữ** | Java (core), client libraries cho C, Python, Go... |
| **License** | Apache License 2.0 |

---

## 2. Kiến Trúc Tổng Thể

### 2.1 Replicated State Machine

ZooKeeper hoạt động như một **replicated state machine**: mọi server trong cluster (gọi là **ensemble**) giữ một bản sao đầy đủ của state trong bộ nhớ.

```
┌─────────────────────────────────────────────────────┐
│                    ZooKeeper Ensemble                │
│                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐       │
│  │  Server 1│    │  Server 2│    │  Server 3│       │
│  │ (Leader) │◄──►│(Follower)│◄──►│(Follower)│       │
│  │          │    │          │    │          │       │
│  │ In-Memory│    │ In-Memory│    │ In-Memory│       │
│  │  ZNode   │    │  ZNode   │    │  ZNode   │       │
│  │   Tree   │    │   Tree   │    │   Tree   │       │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘       │
│       │               │               │             │
│  ┌────┴─────┐    ┌────┴─────┐    ┌────┴─────┐       │
│  │ TxnLog + │    │ TxnLog + │    │ TxnLog + │       │
│  │ Snapshot  │    │ Snapshot  │    │ Snapshot  │       │
│  │  (Disk)  │    │  (Disk)  │    │  (Disk)  │       │
│  └──────────┘    └──────────┘    └──────────┘       │
│                                                     │
└─────────────────────────────────────────────────────┘
         ▲              ▲              ▲
         │              │              │
    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
    │ Client  │    │ Client  │    │ Client  │
    │   A     │    │   B     │    │   C     │
    └─────────┘    └─────────┘    └─────────┘
```

### 2.2 Các Vai Trò Server

| Vai trò | Mô tả |
|---|---|
| **Leader** | Xử lý **tất cả write requests**, gán ZXID, broadcast qua ZAB |
| **Follower** | Nhận proposals từ Leader, vote (ACK), serve **read requests** từ local state |
| **Observer** | Giống Follower nhưng **không vote** — dùng để scale read mà không ảnh hưởng write latency |

### 2.3 Quorum

- Ensemble `2n + 1` nodes → cần quorum `n + 1` để hoạt động
- **3 nodes**: chịu 1 fail, **5 nodes**: chịu 2 fail, **7 nodes**: chịu 3 fail
- Luôn deploy **số lẻ** nodes (thêm 1 node chẵn không tăng fault tolerance nhưng tăng latency)

---

## 3. Data Model — Znodes

### 3.1 Hierarchical Namespace

ZooKeeper tổ chức data dạng **cây phân cấp** (giống filesystem), mỗi node gọi là **znode**:

```
/
├── /app1
│   ├── /app1/config        → {"db_host": "10.0.1.5", "port": 3306}
│   ├── /app1/leader        → "server-3"
│   └── /app1/members
│       ├── /app1/members/server-1  (ephemeral)
│       ├── /app1/members/server-2  (ephemeral)
│       └── /app1/members/server-3  (ephemeral)
├── /locks
│   └── /locks/resource-X
│       ├── /locks/resource-X/lock-0000000001  (ephemeral sequential)
│       └── /locks/resource-X/lock-0000000002  (ephemeral sequential)
└── /queues
```

### 3.2 Loại Znodes

| Loại | Đặc điểm | Use Case |
|---|---|---|
| **Persistent** | Tồn tại cho đến khi bị xóa rõ ràng | Configuration, metadata |
| **Ephemeral** | Tự động xóa khi session client kết thúc | Service registration, group membership |
| **Sequential** | ZK tự động thêm counter tăng dần vào path | Leader election, distributed lock, queue |
| **Persistent Sequential** | Persistent + counter | Ordered task queue |
| **Ephemeral Sequential** | Ephemeral + counter | Lock, leader election |
| **Container** (3.6+) | Tự xóa khi không còn children | Lock/leader election parent nodes |
| **TTL** (3.6+) | Tự xóa sau thời gian timeout | Temporary config, cache |

### 3.3 Stat Structure

Mỗi znode có metadata:

```
czxid          = 0x100000002     # ZXID khi tạo
mzxid          = 0x100000005     # ZXID khi sửa lần cuối
pzxid          = 0x100000008     # ZXID khi children thay đổi lần cuối
ctime          = 1705123456000   # Timestamp tạo
mtime          = 1705234567000   # Timestamp sửa
version        = 3               # Số lần data thay đổi
cversion       = 5               # Số lần children thay đổi
aversion       = 0               # Số lần ACL thay đổi
ephemeralOwner = 0x0             # Session ID (0 nếu persistent)
dataLength     = 42              # Kích thước data (bytes)
numChildren    = 3               # Số children
```

### 3.4 Giới Hạn Quan Trọng

| Giới hạn | Giá trị |
|---|---|
| **Data size per znode** | Mặc định **1 MB** (có thể cấu hình nhưng không nên tăng) |
| **Path length** | Không giới hạn chính thức, nhưng nên giữ ngắn |
| **Số children** | Không giới hạn, nhưng quá nhiều sẽ chậm khi `getChildren()` |
| **Tổng data** | Phải fit trong **RAM** — ZK giữ toàn bộ tree trong memory |

> ⚠️ **ZooKeeper KHÔNG phải là database hay file system!** Chỉ nên lưu metadata nhỏ (KBs), KHÔNG lưu data lớn.

---

## 4. Sessions & Watches

### 4.1 Sessions

```
Client                              ZK Ensemble
  │                                      │
  │──── Connect (sessionTimeout=30s) ────►│
  │                                      │
  │◄─── Session ID + negotiated timeout ─│
  │                                      │
  │◄──── Heartbeat (tickTime=2s) ───────►│  ← keepalive
  │◄──── Heartbeat ────────────────────►│
  │                                      │
  │      (server fails)                  │
  │──── Reconnect to another server ────►│  ← session preserved!
  │                                      │
  │      (client crash / timeout)        │
  │      Session EXPIRED                 │  ← ephemeral nodes deleted
```

**Session lifecycle**: `CONNECTING` → `CONNECTED` → `CONNECTED` (reconnect to different server) → `EXPIRED` (if timeout exceeded)

- **Session timeout**: thường 2-20x `tickTime` (mặc định `tickTime` = 2000ms)
- Khi client reconnect sang server khác, session được **giữ nguyên** (cùng session ID, ephemeral nodes vẫn tồn tại)
- Khi session timeout → tất cả **ephemeral nodes** của session bị xóa

### 4.2 Watches

Watches cho phép client nhận **notification** khi znode thay đổi mà không cần polling:

```
Client A                    ZooKeeper                 Client B
   │                           │                          │
   │── getData(/config, watch)─►│                          │
   │◄─ data + set watch ───────│                          │
   │                           │                          │
   │                           │◄── setData(/config) ─────│
   │                           │                          │
   │◄── WatchEvent:            │                          │
   │    NodeDataChanged        │                          │
   │    path=/config           │                          │
   │                           │                          │
   │  (watch consumed!)        │                          │
   │── getData(/config, watch)─►│  ← phải set lại watch   │
```

**Đặc điểm Watch**:
- **One-time trigger**: Watch bị xóa sau khi fire 1 lần → phải re-register
- **Ordered**: Watch events được deliver theo thứ tự FIFO
- **Types**: `NodeCreated`, `NodeDeleted`, `NodeDataChanged`, `NodeChildrenChanged`
- **Persistent Watches** (3.6+): Không bị xóa sau khi fire — giải quyết vấn đề re-register

| Operation | Watch được trigger bởi |
|---|---|
| `exists()` | Node created, deleted, data changed |
| `getData()` | Node data changed, node deleted |
| `getChildren()` | Child created, child deleted |

---

## 5. ZAB Protocol — Cốt Lõi Consensus

### 5.1 Tổng Quan ZAB

**ZooKeeper Atomic Broadcast (ZAB)** là giao thức consensus được thiết kế **riêng** cho ZooKeeper. Khác với Paxos/Raft ở chỗ ZAB tối ưu cho **primary-backup** model với **total order broadcast**.

### 5.2 ZXID — Transaction ID

```
ZXID (64-bit):
┌────────────────────────┬────────────────────────┐
│      Epoch (32-bit)    │    Counter (32-bit)    │
│   (leader thế hệ nào) │  (thứ tự transaction)  │
└────────────────────────┴────────────────────────┘

Ví dụ: 0x00000003_0000002A
         epoch=3     counter=42
```

- **Epoch** tăng mỗi khi có leader mới
- **Counter** tăng monotonically trong cùng epoch
- Đảm bảo **total ordering** toàn cục cho tất cả transactions

### 5.3 Hai Pha Hoạt Động

#### Phase 1: Leader Election & Recovery

```
Trigger: Cluster khởi động HOẶC leader crash

  Server 1      Server 2      Server 3
     │              │              │
     │◄──── Vote ──►│◄──── Vote ──►│   Mỗi server vote cho
     │   (myid,     │   (myid,     │   server có ZXID cao nhất
     │    zxid)     │    zxid)     │
     │              │              │
     ├──────────────┤              │
     │   Quorum đạt │              │
     │   → Server 2 │              │
     │   = LEADER   │              │
     │              │              │
     │◄── Sync ─────│──── Sync ───►│   Followers sync state
     │   (missing   │              │   với leader mới
     │    txns)     │              │
     │              │              │
     │   READY      │   READY      │   READY
```

**Quy tắc election**: Server với **ZXID cao nhất** được ưu tiên → đảm bảo leader có state mới nhất.

#### Phase 2: Atomic Broadcast (Steady State)

```
Client         Leader          Follower 1      Follower 2
  │               │                │                │
  │── write() ───►│                │                │
  │               │                │                │
  │               │── PROPOSAL ───►│                │
  │               │   (zxid=X)    │── PROPOSAL ───►│
  │               │                │   (zxid=X)    │
  │               │                │                │
  │               │◄──── ACK ─────│                │
  │               │◄──────────────┼──── ACK ──────│
  │               │                │                │
  │               │  Quorum ACKs!  │                │
  │               │                │                │
  │               │── COMMIT ─────►│                │
  │               │── COMMIT ──────┼──────────────►│
  │               │                │                │
  │◄── success ──│                │                │
```

### 5.4 Đảm Bảo Của ZAB

| Guarantee | Mô tả |
|---|---|
| **Total Order** | Tất cả servers xử lý transactions **cùng thứ tự** |
| **Atomicity** | Transaction hoặc được commit trên quorum, hoặc bị hủy |
| **Reliability** | Transaction đã commit sẽ **không bao giờ bị mất** |
| **FIFO** | Sử dụng TCP → messages giữa peers luôn đúng thứ tự |
| **Causal Order** | Nếu txn A xảy ra trước txn B → A commit trước B |

### 5.5 ZAB vs Raft vs Paxos

| Khía cạnh | ZAB | Raft | Paxos |
|---|---|---|---|
| **Mục đích** | Primary-backup replication | Consensus cho replicated log | General consensus |
| **Leader** | Bắt buộc | Bắt buộc | Không bắt buộc (Multi-Paxos có) |
| **Recovery** | Leader phải có state mới nhất | Log matching | Phức tạp |
| **Ordering** | Total order broadcast | Log-based ordering | Không đảm bảo order mặc định |
| **Phức tạp** | Trung bình | Đơn giản nhất | Phức tạp nhất |

---

## 6. Recipes — Các Pattern Phân Tán

### 6.1 Distributed Lock

```
Algorithm: Lock sử dụng Ephemeral Sequential Znodes

1. Client tạo: /locks/resource-X/lock-  (ephemeral sequential)
   → ZK tạo: /locks/resource-X/lock-0000000007

2. Client gọi getChildren(/locks/resource-X)
   → Danh sách: [lock-0000000005, lock-0000000006, lock-0000000007]

3. Nếu node của mình có sequence THẤP NHẤT → ĐÃ GIỮ LOCK ✓
   Nếu không → watch node có sequence NGAY TRƯỚC mình
   (lock-0000000007 watch lock-0000000006)

4. Khi node trước bị xóa → check lại → nếu thấp nhất → giữ lock

5. Khi xong → xóa node → client tiếp theo nhận watch → giữ lock
```

> 💡 **Watch predecessor** thay vì watch parent → tránh **herd effect** (tất cả clients bị đánh thức cùng lúc)

### 6.2 Leader Election

```
Tương tự Distributed Lock:

1. Mỗi candidate tạo: /election/candidate-  (ephemeral sequential)
2. Node có sequence THẤP NHẤT = LEADER
3. Các node khác watch node ngay trước mình
4. Leader crash → ephemeral node bị xóa → node kế tiếp thành leader

Ưu điểm:
- Tự động failover khi leader crash (ephemeral node tự xóa)
- Ordered succession (không phải election lại toàn bộ)
- Không split-brain (quorum guarantee)
```

### 6.3 Distributed Barrier

```
Double Barrier — đồng bộ N processes:

ENTER:
1. Mỗi process tạo /barrier/process-X (ephemeral)
2. getChildren(/barrier) → count
3. Nếu count < N → watch /barrier, chờ
4. Nếu count == N → tất cả tiến hành

EXIT:
1. Mỗi process xóa /barrier/process-X khi xong
2. getChildren(/barrier) → count
3. Nếu count > 0 → watch /barrier, chờ
4. Nếu count == 0 → barrier hoàn thành
```

### 6.4 Distributed Queue (FIFO)

```
Producer:
  create(/queue/task-, data, PERSISTENT_SEQUENTIAL)
  → /queue/task-0000000001
  → /queue/task-0000000002

Consumer:
  1. getChildren(/queue) → sort by sequence
  2. Lấy node có sequence thấp nhất
  3. getData() → xử lý
  4. delete() node đã xử lý
```

### 6.5 Apache Curator — High-Level Recipes

**Đừng implement recipes từ scratch!** Dùng **Apache Curator** — thư viện chính thức cung cấp production-ready implementations:

| Curator Recipe | Class |
|---|---|
| Leader Election | `LeaderSelector`, `LeaderLatch` |
| Distributed Lock | `InterProcessMutex`, `InterProcessSemaphoreMutex` |
| Barrier | `DistributedBarrier`, `DistributedDoubleBarrier` |
| Queue | `DistributedQueue`, `DistributedPriorityQueue` |
| Cache | `PathChildrenCache`, `TreeCache`, `NodeCache` |
| Service Discovery | `ServiceDiscovery` |

---

## 7. Real-World Use Cases

### 7.1 Apache Kafka (Legacy → KRaft)

| Chức năng ZK trong Kafka (Legacy) | Trạng thái 2026 |
|---|---|
| Broker registration & discovery | ❌ Thay bằng KRaft |
| Controller election | ❌ Thay bằng KRaft |
| Topic/partition metadata | ❌ Thay bằng KRaft |
| ISR (In-Sync Replicas) management | ❌ Thay bằng KRaft |
| Consumer group offsets | ❌ Đã chuyển sang __consumer_offsets từ lâu |

> ⚠️ **Kafka 4.0+ không còn hỗ trợ ZooKeeper mode.** Mọi deployment mới phải dùng KRaft.

### 7.2 Apache HBase

- **Region assignment**: ZK quản lý việc gán regions cho RegionServers
- **Master election**: Active/Standby HMaster dùng ZK leader election
- **hbase:meta location**: Lưu vị trí meta table trong ZK
- **Failure detection**: Ephemeral nodes để phát hiện RegionServer crash

### 7.3 Apache Hadoop HDFS

- **NameNode HA**: Active/Standby NameNode failover qua ZK
- **ZKFC (ZK Failover Controller)**: Monitor health, trigger failover
- **Fencing**: ZK đảm bảo không có split-brain giữa 2 NameNodes

### 7.4 ClickHouse

- **Data replication**: ZK (hoặc ClickHouse Keeper) phối hợp replication giữa các nodes
- **Distributed DDL**: `ALTER`, `CREATE` trên cluster thông qua ZK
- **Multi-master writes**: Nhiều nodes có thể nhận write, ZK đảm bảo consistency

### 7.5 Các Hệ Thống Khác

| Hệ thống | Vai trò của ZooKeeper |
|---|---|
| **Apache Solr/SolrCloud** | Cluster coordination, shard management |
| **Apache Storm** | Nimbus HA, worker assignment |
| **Apache Druid** | Coordinator election, segment management |
| **Apache Pulsar** | Metadata store (đang chuyển sang Oxia) |
| **Neo4j Causal Clustering** | Cluster discovery, routing |

---

## 8. Production Best Practices

### 8.1 Cluster Setup

```
Khuyến nghị:
┌──────────────┬─────────────────────────────────────┐
│ Quy mô       │ Cấu hình                            │
├──────────────┼─────────────────────────────────────┤
│ Dev/Test     │ 1 node (standalone) hoặc 3 nodes    │
│ Production   │ 3 hoặc 5 nodes                      │
│ Large-scale  │ 5 nodes + Observers để scale reads   │
│ Tối đa hợp lý│ 7 nodes (nhiều hơn → latency tăng)  │
└──────────────┴─────────────────────────────────────┘
```

**Rules**:
- ✅ Luôn dùng **số lẻ** nodes
- ✅ Deploy trên **máy/rack khác nhau** (tránh single point of failure)
- ✅ Dùng **dedicated servers** — KHÔNG co-locate với Kafka broker / database
- ✅ Dùng **Observer** nodes nếu cần scale read mà không muốn tăng write latency

### 8.2 Hardware & Disk I/O

```properties
# zoo.cfg - Tách dataDir và dataLogDir
dataDir=/zk/data              # snapshots
dataLogDir=/zk/txnlog         # transaction logs ← ĐẶT TRÊN SSD RIÊNG!

# Transaction log trên disk riêng, tốt nhất là SSD/NVMe
# Đây là thành phần critical nhất cho performance
```

| Resource | Khuyến nghị |
|---|---|
| **CPU** | 2-4 cores đủ cho hầu hết workloads |
| **RAM** | ≥ 4GB heap, tổng RAM phải >> heap size (tránh swap) |
| **Disk** | SSD/NVMe cho transaction log, HDD OK cho snapshots |
| **Network** | Low-latency giữa các ZK nodes, tránh cross-DC |

### 8.3 Configuration Tuning

```properties
# zoo.cfg
tickTime=2000                 # Đơn vị thời gian cơ bản (ms)
initLimit=10                  # tickTime * initLimit = thời gian follower connect leader
syncLimit=5                   # tickTime * syncLimit = thời gian follower sync với leader

# Session timeout range
minSessionTimeout=4000        # 2 * tickTime
maxSessionTimeout=40000       # 20 * tickTime

# Snapshot auto-purge (QUAN TRỌNG - tránh đầy disk!)
autopurge.snapRetainCount=5   # Giữ 5 snapshots gần nhất
autopurge.purgeInterval=24    # Purge mỗi 24 giờ

# JVM settings
JVMFLAGS="-Xms2g -Xmx2g -XX:+UseG1GC"
# KHÔNG để swap! Dùng: sysctl vm.swappiness=1
```

### 8.4 Monitoring

**Four Letter Words** (telnet/nc commands):

```bash
# Kiểm tra server đang chạy
echo ruok | nc localhost 2181       # → "imok"

# Thông tin chi tiết
echo stat | nc localhost 2181       # connections, latency, mode
echo mntr | nc localhost 2181       # metrics dạng key=value
echo envi | nc localhost 2181       # environment info
echo cons | nc localhost 2181       # connection details
echo wchs | nc localhost 2181       # watch summary
```

**Metrics quan trọng cần monitor**:

| Metric | Warning threshold |
|---|---|
| `zk_avg_latency` | > 10ms |
| `zk_outstanding_requests` | > 10 (sustained) |
| `zk_znode_count` | Tăng bất thường |
| `zk_watch_count` | > 10,000 |
| `zk_open_file_descriptor_count` | Gần ulimit |
| `zk_max_file_descriptor_count` | Đảm bảo đủ cao (≥ 65535) |
| `zk_followers` / `zk_synced_followers` | Phải = expected count |
| P99 disk write latency | > 50ms |

### 8.5 Security

```properties
# Bật SASL authentication
authProvider.1=org.apache.zookeeper.server.auth.SASLAuthenticationProvider
requireClientAuthScheme=sasl

# TLS
ssl.keyStore.location=/path/to/keystore.jks
ssl.keyStore.password=changeit
ssl.trustStore.location=/path/to/truststore.jks
secureClientPort=2281

# ACL — luôn set ACL trên znodes production
# world:anyone:r     (read-only cho anonymous)
# sasl:kafka:cdrwa   (full access cho kafka user)
```

---

## 9. So Sánh: ZooKeeper vs etcd vs Consul

### 9.1 Bảng So Sánh Tổng Quát

| Tiêu chí | ZooKeeper | etcd | Consul |
|---|---|---|---|
| **Consensus** | ZAB | Raft | Raft |
| **Data Model** | Hierarchical tree (znodes) | Flat key-value | Flat key-value |
| **API** | Java/C client libs, TCP | gRPC + HTTP REST | HTTP REST + DNS |
| **Watch** | One-time (persistent từ 3.6) | Streaming watches | Long polling / blocking queries |
| **Consistency** | Sequential (linearizable writes) | Linearizable | Linearizable (default eventual cho reads) |
| **Viết bằng** | Java | Go | Go |
| **Service Discovery** | Manual (recipes) | Manual | **Built-in** (health checks, DNS) |
| **Multi-DC** | Không native | Không native | **Built-in** |
| **Service Mesh** | Không | Không | **Consul Connect** |
| **Maturity** | 15+ năm, cực stable | 10+ năm, CNCF graduated | 10+ năm, HashiCorp |
| **Best For** | Big Data ecosystem | Kubernetes | Microservices / Service Mesh |

### 9.2 Khi Nào Chọn Cái Nào?

```
Câu hỏi quyết định:

1. Bạn dùng Hadoop / HBase / ClickHouse?
   → ZooKeeper (bắt buộc)

2. Bạn dùng Kubernetes?
   → etcd (đã tích hợp sẵn)

3. Bạn cần service discovery + health checking?
   → Consul

4. Bạn cần distributed locking phức tạp?
   → ZooKeeper (best recipes) hoặc etcd

5. Bạn cần multi-datacenter?
   → Consul (native support)

6. Bạn muốn đơn giản, lightweight?
   → etcd (nhỏ gọn, API hiện đại)
```

---

## 10. Xu Hướng & Tương Lai

### 10.1 Sự Suy Giảm Vai Trò

- **Kafka**: Đã hoàn toàn loại bỏ ZooKeeper dependency (KRaft từ Kafka 4.0)
- **Pulsar**: Đang chuyển sang **Oxia** (CNCF incubating) — metadata store mới, scale 10x hơn ZK
- **Modern apps**: Xu hướng dùng Kubernetes-native primitives (ConfigMap, CRD) thay ZK

### 10.2 ZooKeeper Vẫn Quan Trọng Khi

- Cần **hierarchical data model** + **ephemeral nodes** + **sequential nodes** → không ai thay thế tốt hơn cho complex coordination recipes
- HBase, Hadoop, ClickHouse, Solr → **không có replacement** trong tương lai gần
- Hệ thống legacy lớn → chi phí migration rất cao

### 10.3 Các Alternative Đáng Chú Ý

| Tool | Đặc điểm |
|---|---|
| **etcd** | Lightweight, Go, Raft, gRPC — backbone của K8s |
| **Consul** | Full-featured service mesh, multi-DC, health checks |
| **Oxia** | CNCF, sharded metadata store, designed for massive scale |
| **ClickHouse Keeper** | Drop-in ZK replacement tối ưu cho ClickHouse |
| **KRaft** | Kafka-specific, internal Raft-based metadata |

---

## 11. Tài Liệu Tham Khảo

### Official Documentation
- Apache ZooKeeper Documentation: https://zookeeper.apache.org/doc/current/
- ZooKeeper Programmer's Guide: https://zookeeper.apache.org/doc/current/zookeeperProgrammersGuide.html
- ZAB Paper: "Zab: High-performance broadcast for primary-backup systems" (Junqueira, Reed, Serafini)

### Key Resources
- Apache Curator: https://curator.apache.org/
- System Design Handbook — ZooKeeper: https://systemdesignhandbook.com
- ZooKeeper Recipes: https://zookeeper.apache.org/doc/current/recipes.html

### Related Papers
- "ZooKeeper: Wait-free coordination for Internet-scale systems" (Hunt, Konar, Junqueira, Reed — USENIX ATC 2010)
- "A simple totally ordered broadcast protocol" (Reed, Junqueira — LADIS 2008)
