# System Scaling & Performance Engineering Guide

> **Tài liệu nghiên cứu toàn diện** về đánh giá hiệu năng hệ thống, các chỉ số đo lường, và chiến lược scale cho từng mốc người dùng.

---

## Mục Lục

1. [Các Chỉ Số Đo Lường Hiệu Năng (Performance Metrics)](#1-các-chỉ-số-đo-lường-hiệu-năng)
2. [Latency Percentiles — P50, P95, P99, P99.9](#2-latency-percentiles)
3. [Benchmark — Thế Nào Là "Tốt"?](#3-benchmark--thế-nào-là-tốt)
4. [Scaling Roadmap Theo Số Lượng User](#4-scaling-roadmap-theo-số-lượng-user)
5. [Chiến Lược Tối Ưu Cụ Thể](#5-chiến-lược-tối-ưu-cụ-thể)
6. [Công Cụ Đo Lường & Monitoring](#6-công-cụ-đo-lường--monitoring)
7. [Case Studies Thực Tế](#7-case-studies-thực-tế)
8. [Checklist Đánh Giá Hệ Thống](#8-checklist-đánh-giá-hệ-thống)

---

## 1. Các Chỉ Số Đo Lường Hiệu Năng

### 1.1 Throughput Metrics (Thông Lượng)

| Metric | Tên đầy đủ | Ý nghĩa | Ví dụ |
|--------|-------------|----------|-------|
| **TPS** | Transactions Per Second | Số giao dịch hoàn chỉnh/giây | Chuyển tiền banking: 5,000 TPS |
| **QPS** | Queries Per Second | Số truy vấn DB/giây | MySQL read: 50,000 QPS |
| **RPS** | Requests Per Second | Số HTTP request/giây | API gateway: 100,000 RPS |
| **OPS** | Operations Per Second | Số thao tác/giây (generic) | Redis: 100,000+ OPS |
| **IOPS** | I/O Operations Per Second | Thao tác đọc/ghi disk/giây | SSD: 50,000-100,000 IOPS |
| **MPS** | Messages Per Second | Tin nhắn qua message queue/giây | Kafka: 1,000,000+ MPS |

#### Phân biệt TPS vs RPS vs QPS

```
User Request (1 RPS)
  └── API Gateway
       └── Service A
            ├── DB Query 1 (1 QPS)
            ├── DB Query 2 (1 QPS)  
            ├── Cache Read  (1 OPS)
            └── DB Write    (1 QPS)  ← Cả flow = 1 TPS (1 transaction)

=> 1 RPS có thể tạo ra 3 QPS + 1 OPS, nhưng chỉ 1 TPS
```

> [!IMPORTANT]
> **TPS** thường là metric quan trọng nhất vì nó đo end-to-end business transaction, không chỉ đơn lẻ DB query hay HTTP request.

### 1.2 Latency Metrics (Độ Trễ)

| Metric | Ý nghĩa |
|--------|----------|
| **Response Time** | Tổng thời gian từ lúc gửi request đến nhận response |
| **TTFB** (Time To First Byte) | Thời gian đến byte đầu tiên |
| **Processing Time** | Thời gian server xử lý (không tính network) |
| **Queue Wait Time** | Thời gian request chờ trong hàng đợi |
| **RTT** (Round Trip Time) | Thời gian đi-về qua network |

### 1.3 Availability & Reliability

| Metric | Ý nghĩa | Downtime/năm |
|--------|----------|--------------|
| **99%** (Two 9s) | Acceptable | 3.65 ngày |
| **99.9%** (Three 9s) | Production grade | 8.76 giờ |
| **99.95%** | High availability | 4.38 giờ |
| **99.99%** (Four 9s) | Enterprise grade | 52.6 phút |
| **99.999%** (Five 9s) | Mission critical | 5.26 phút |

### 1.4 Resource Utilization

| Metric | Ngưỡng an toàn | Ngưỡng cảnh báo | Ngưỡng nguy hiểm |
|--------|----------------|------------------|-------------------|
| **CPU Usage** | < 60% | 60-80% | > 80% |
| **Memory Usage** | < 70% | 70-85% | > 85% |
| **Disk I/O** | < 60% | 60-80% | > 80% |
| **Network Bandwidth** | < 50% | 50-70% | > 70% |
| **Connection Pool** | < 60% | 60-80% | > 80% |

### 1.5 Error Metrics

| Metric | Ý nghĩa | Ngưỡng chấp nhận |
|--------|----------|-------------------|
| **Error Rate** | % request lỗi | < 0.1% (production) |
| **5xx Rate** | % server error | < 0.01% |
| **Timeout Rate** | % request timeout | < 0.5% |
| **Retry Rate** | % request phải retry | < 5% |

---

## 2. Latency Percentiles

### 2.1 Percentile Là Gì?

Percentile (phân vị) cho biết **% request có latency ≤ giá trị đó**.

```
Ví dụ: 1000 requests, sắp xếp latency từ thấp → cao

Request thứ 500  → P50  (Median)   = 120ms  → 50% request ≤ 120ms
Request thứ 950  → P95             = 350ms  → 95% request ≤ 350ms  
Request thứ 990  → P99             = 800ms  → 99% request ≤ 800ms
Request thứ 999  → P99.9           = 2000ms → 99.9% request ≤ 2000ms
```

### 2.2 Tại Sao Không Dùng Average?

> [!WARNING]
> **Average (trung bình) là chỉ số ĐÁNH LỪA!** Nó che giấu các outlier nghiêm trọng.

```
Ví dụ: 10 requests với latency:
[50, 55, 60, 65, 70, 75, 80, 85, 90, 5000] ms

Average = 563ms     ← Trông "ổn" nhưng...
P50     = 70ms      ← Phần lớn user OK
P99     = 5000ms    ← 1% user chờ 5 GIÂY! 
P99.9   = 5000ms    ← Worst case cũng 5 giây

→ Average che giấu việc 1% user có trải nghiệm kinh khủng
```

### 2.3 Ý Nghĩa Từng Percentile

```
┌──────────────────────────────────────────────────────────────────┐
│                    LATENCY DISTRIBUTION                         │
│                                                                  │
│  ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ←────── P50 ──────→                                             │
│  "Typical user experience"                                       │
│  50% user có latency ≤ giá trị này                              │
│                                                                  │
│  ████████████████████████████████████████████████░░░░░░░░░░░░░░ │
│  ←──────────────── P95 ────────────────→                         │
│  "Hầu hết user"                                                 │
│  Chỉ 5% user bị chậm hơn                                       │
│                                                                  │
│  ████████████████████████████████████████████████████████████░░░ │
│  ←──────────────────────── P99 ────────────────────────→         │
│  "Gần như tất cả"                                                │
│  Chỉ 1% user bị chậm hơn → QUAN TRỌNG nếu scale lớn           │
│                                                                  │
│  ██████████████████████████████████████████████████████████████░ │
│  ←────────────────────────── P99.9 ──────────────────────────→  │
│  "Extreme tail"                                                  │
│  1/1000 request — với 1M user = 1000 user bị ảnh hưởng         │
└──────────────────────────────────────────────────────────────────┘
```

| Percentile | Ý nghĩa thực tế | Khi nào quan tâm? |
|------------|------------------|---------------------|
| **P50** | Trải nghiệm của user "trung bình" | Luôn luôn — baseline metric |
| **P75** | 3/4 user experience | Useful cho capacity planning |
| **P90** | 9/10 user OK | SLA tier thường dùng |
| **P95** | 19/20 user OK | **SLA phổ biến nhất** |
| **P99** | 99/100 user OK | **Critical cho hệ thống lớn** |
| **P99.9** | 999/1000 user OK | Ultra-critical (banking, trading) |
| **P99.99** | 9999/10000 user OK | Google/AWS internal SLOs |

### 2.4 Impact Thực Tế Của P99 Với Scale

```
                    P99 = 2 giây, với các mốc user:

┌─────────────┬──────────────┬──────────────────────────────┐
│ Total Users │ 1% bị P99    │ Impact                       │
├─────────────┼──────────────┼──────────────────────────────┤
│ 10,000      │ 100 users    │ Ít ai để ý                   │
│ 100,000     │ 1,000 users  │ Bắt đầu có complaint         │
│ 1,000,000   │ 10,000 users │ Social media backlash        │
│ 10,000,000  │ 100,000 users│ Mất doanh thu đáng kể       │
│ 1,000,000,000│10M users    │ Thảm họa                    │
└─────────────┴──────────────┴──────────────────────────────┘
```

> [!TIP]
> **Amazon phát hiện: Mỗi 100ms latency tăng thêm = giảm 1% doanh thu.**
> Google phát hiện: Tăng 500ms load time = giảm 20% traffic.

---

## 3. Benchmark — Thế Nào Là "Tốt"?

### 3.1 Latency Benchmarks Theo Loại Hệ Thống

#### Web Application (REST API)

| Percentile | Excellent | Good | Acceptable | Poor |
|------------|-----------|------|------------|------|
| **P50** | < 50ms | < 100ms | < 200ms | > 200ms |
| **P95** | < 200ms | < 500ms | < 1s | > 1s |
| **P99** | < 500ms | < 1s | < 2s | > 2s |
| **P99.9** | < 1s | < 2s | < 5s | > 5s |

#### E-Commerce / Checkout

| Percentile | Excellent | Good | Acceptable | Poor |
|------------|-----------|------|------------|------|
| **P50** | < 100ms | < 200ms | < 500ms | > 500ms |
| **P95** | < 300ms | < 800ms | < 1.5s | > 1.5s |
| **P99** | < 800ms | < 2s | < 3s | > 3s |

#### Banking / Financial Transaction

| Percentile | Excellent | Good | Acceptable | Poor |
|------------|-----------|------|------------|------|
| **P50** | < 100ms | < 200ms | < 500ms | > 500ms |
| **P95** | < 200ms | < 500ms | < 1s | > 1s |
| **P99** | < 500ms | < 1s | < 2s | > 2s |
| **P99.9** | < 1s | < 2s | < 3s | > 3s |

#### Real-time Systems (Chat, Gaming)

| Percentile | Excellent | Good | Acceptable | Poor |
|------------|-----------|------|------------|------|
| **P50** | < 20ms | < 50ms | < 100ms | > 100ms |
| **P95** | < 50ms | < 100ms | < 200ms | > 200ms |
| **P99** | < 100ms | < 200ms | < 500ms | > 500ms |

#### Search Engine

| Percentile | Excellent | Good | Acceptable | Poor |
|------------|-----------|------|------------|------|
| **P50** | < 50ms | < 100ms | < 200ms | > 200ms |
| **P95** | < 200ms | < 500ms | < 1s | > 1s |
| **P99** | < 500ms | < 1s | < 2s | > 2s |

### 3.2 Throughput Benchmarks Theo Component

| Component | Low | Medium | High | Ultra |
|-----------|-----|--------|------|-------|
| **Nginx** (RPS) | 10K | 50K | 100K+ | 500K+ |
| **Node.js** (RPS) | 5K | 15K | 30K | 50K+ |
| **Spring Boot** (RPS) | 3K | 10K | 30K | 50K+ |
| **Go net/http** (RPS) | 20K | 50K | 100K+ | 500K+ |
| **PostgreSQL** (QPS) | 5K | 20K | 50K | 100K+ |
| **MySQL** (QPS) | 5K | 30K | 80K | 150K+ |
| **Redis** (OPS) | 50K | 100K | 300K | 1M+ |
| **Kafka** (MPS) | 100K | 500K | 1M | 10M+ |
| **MongoDB** (OPS) | 10K | 50K | 100K | 500K+ |
| **Elasticsearch** (QPS) | 1K | 5K | 20K | 50K+ |

> [!NOTE]
> Các con số trên là **single-instance benchmark** trên hardware tốt. Thực tế phụ thuộc vào: complexity of query, payload size, network latency, hardware specs.

### 3.3 Latency Reference — Các Con Số Mà Engineer Nên Thuộc Lòng

```
╔══════════════════════════════════════════════════════════════╗
║          LATENCY NUMBERS EVERY ENGINEER SHOULD KNOW         ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  L1 cache reference ......................... 0.5  ns        ║
║  Branch mispredict .......................... 5    ns        ║
║  L2 cache reference ......................... 7    ns        ║
║  Mutex lock/unlock .......................... 25   ns        ║
║  Main memory reference ...................... 100  ns        ║
║  Compress 1K bytes with Zippy ............... 3    µs        ║
║  Send 1K bytes over 1 Gbps network ......... 10   µs        ║
║  Read 4K randomly from SSD .................. 150  µs        ║
║  Read 1 MB sequentially from memory ......... 250  µs        ║
║  Round trip within same datacenter .......... 500  µs        ║
║  Read 1 MB sequentially from SSD ............ 1    ms        ║
║  HDD seek .................................. 10   ms        ║
║  Read 1 MB sequentially from HDD ........... 20   ms        ║
║  Send packet CA → Netherlands → CA ......... 150  ms        ║
║                                                              ║
║  Redis GET .................................. 0.1  ms        ║
║  Simple DB query (indexed) .................. 1-5  ms        ║
║  Complex DB query (join/aggregate) .......... 10-100 ms     ║
║  External API call (same region) ............ 10-50 ms      ║
║  External API call (cross-region) ........... 50-300 ms     ║
║  DNS lookup ................................. 20-120 ms     ║
║  TLS handshake .............................. 50-150 ms     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 4. Scaling Roadmap Theo Số Lượng User

### 4.1 Tổng Quan Các Mốc

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      SCALING JOURNEY                                     │
│                                                                          │
│  500K ──→ 1M ──→ 10M ──→ 100M ──→ 1B                                  │
│   │        │       │        │       │                                    │
│   │        │       │        │       └─ Global multi-region              │
│   │        │       │        │          Edge computing                    │
│   │        │       │        │          Custom infrastructure            │
│   │        │       │        │                                            │
│   │        │       │        └─ Microservices mature                     │
│   │        │       │           Multi-region active-active               │
│   │        │       │           Advanced data partitioning               │
│   │        │       │                                                     │
│   │        │       └─ Microservices migration                           │
│   │        │          Database sharding                                  │
│   │        │          Dedicated cache layer                              │
│   │        │          CDN + Edge                                         │
│   │        │                                                             │
│   │        └─ Read replicas                                              │
│   │           Message queue                                              │
│   │           Horizontal scaling                                         │
│   │                                                                      │
│   └─ Vertical scale + basic optimizations                               │
│      Connection pooling                                                  │
│      Basic caching (Redis)                                               │
│      Load balancer                                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 4.2 Mốc 500,000 Users

#### Yêu Cầu Hiệu Năng

| Metric | Target | Giải thích |
|--------|--------|------------|
| **DAU** (Daily Active Users) | ~50K-150K | ~10-30% tổng user |
| **Concurrent Users** | ~5K-15K | ~10% DAU peak |
| **RPS (peak)** | 1,000-5,000 | Mỗi user ~5-10 request/session |
| **TPS** | 100-500 | ~10% RPS là write transaction |
| **P50 Latency** | < 100ms | |
| **P99 Latency** | < 1s | |
| **Availability** | 99.9% | 8.7h downtime/năm |

#### Kiến Trúc Đề Xuất

```
                    ┌─────────────┐
                    │   CDN       │   (Static assets)
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │ Load        │   (Nginx / ALB)
                    │ Balancer    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴─────┐┌────┴────┐┌─────┴─────┐
        │ App       ││ App     ││ App       │  2-4 instances
        │ Server 1  ││ Server 2││ Server 3  │  (Monolith OK)
        └─────┬─────┘└────┬────┘└─────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              │                         │
        ┌─────┴─────┐           ┌──────┴──────┐
        │  Redis    │           │  Database   │
        │  Cache    │           │  (Primary + │
        │  Cluster  │           │   1 Replica)│
        └───────────┘           └─────────────┘
```

#### Chiến Lược Cụ Thể

1. **Monolith vẫn OK** — chưa cần microservices
2. **Vertical scaling first** — upgrade lên máy mạnh hơn
3. **Horizontal scaling** — 2-4 app server instances
4. **Database**: Primary + 1-2 Read Replicas
5. **Caching**: Redis cho hot data, session store
6. **CDN**: Cloudflare/CloudFront cho static assets
7. **Connection Pooling**: HikariCP, PgBouncer

#### Estimated Infrastructure Cost

| Component | Spec | Monthly Cost (AWS) |
|-----------|------|-------------------|
| App Servers (3x) | c5.2xlarge | ~$750 |
| RDS Primary | r5.2xlarge | ~$600 |
| RDS Replica (1x) | r5.xlarge | ~$300 |
| ElastiCache Redis | r5.large cluster | ~$200 |
| ALB | Standard | ~$50 |
| CDN (CloudFront) | 1TB transfer | ~$85 |
| **Total** | | **~$2,000/month** |

---

### 4.3 Mốc 1,000,000 Users (1M)

#### Yêu Cầu Hiệu Năng

| Metric | Target | Giải thích |
|--------|--------|------------|
| **DAU** | ~100K-300K | |
| **Concurrent Users** | ~10K-30K | |
| **RPS (peak)** | 5,000-15,000 | |
| **TPS** | 500-2,000 | |
| **QPS (DB)** | 10,000-50,000 | |
| **P50 Latency** | < 80ms | |
| **P95 Latency** | < 300ms | |
| **P99 Latency** | < 800ms | |
| **Availability** | 99.95% | 4.4h downtime/năm |

#### Kiến Trúc Đề Xuất

```
                         ┌─────────┐
                         │  CDN    │
                         └────┬────┘
                              │
                    ┌─────────┴─────────┐
                    │  Load Balancer    │  (L7 - Nginx/HAProxy/ALB)
                    │  + Rate Limiting  │
                    └─────────┬─────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
     ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐
     │ App Server  │  │ App Server  │  │ App Server  │  4-8 instances
     │ (Auto Scale)│  │ (Auto Scale)│  │ (Auto Scale)│
     └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
   ┌──────┴──────┐    ┌──────┴──────┐    ┌───────┴───────┐
   │   Redis     │    │  Message    │    │   Database    │
   │   Cluster   │    │  Queue      │    │   Cluster     │
   │ (3 nodes)   │    │ (RabbitMQ/  │    │ (Primary +   │
   │             │    │  Kafka)     │    │  2-3 Replicas)│
   └─────────────┘    └─────────────┘    └───────────────┘
```

#### Những Gì Thay Đổi So Với 500K

| Aspect | 500K | 1M |
|--------|------|----|
| **App Servers** | 2-4 cố định | 4-8 + Auto Scaling |
| **Database** | Primary + 1 Replica | Primary + 2-3 Replicas |
| **Cache** | Single Redis | Redis Cluster (3+ nodes) |
| **Message Queue** | Không có / đơn giản | RabbitMQ hoặc Kafka |
| **Background Jobs** | Cron jobs | Dedicated worker pool |
| **Monitoring** | Basic (CloudWatch) | APM (Datadog/NewRelic) |
| **Search** | DB LIKE queries | Elasticsearch cluster |
| **File Storage** | Local / single S3 | S3 + CDN distribution |

#### Key Actions

1. **Tách Read/Write traffic** — Command Query Separation
2. **Async processing** — Mọi thứ không cần response ngay → message queue
3. **Cache strategy nâng cao**: Cache-aside, Write-through, TTL tuning
4. **Database indexing audit** — EXPLAIN ANALYZE mọi slow query
5. **Auto Scaling Groups** — scale theo CPU/RPS metrics
6. **Rate Limiting** — Protect against abuse
7. **Connection pooling optimization** — Tune pool sizes

---

### 4.4 Mốc 10,000,000 Users (10M)

#### Yêu Cầu Hiệu Năng

| Metric | Target | Giải thích |
|--------|--------|------------|
| **DAU** | ~1M-3M | |
| **Concurrent Users** | ~100K-300K | |
| **RPS (peak)** | 50,000-150,000 | |
| **TPS** | 5,000-20,000 | |
| **QPS (DB total)** | 100,000-500,000 | Across all DB instances |
| **P50 Latency** | < 50ms | |
| **P95 Latency** | < 200ms | |
| **P99 Latency** | < 500ms | |
| **P99.9 Latency** | < 2s | |
| **Availability** | 99.99% | 52 phút downtime/năm |
| **Data volume** | 10-100 TB | |
| **Bandwidth** | 10-100 Gbps peak | |

#### Kiến Trúc Đề Xuất — Microservices

```
                           ┌──────────┐
                      ┌────┤   CDN    ├────┐
                      │    │ (Multi-  │    │
                      │    │  PoP)    │    │
                      │    └──────────┘    │
                      │                    │
               ┌──────┴──────┐      ┌─────┴──────┐
               │ API Gateway │      │  Web App   │
               │ (Kong/AWS)  │      │  (SSR/SPA) │
               └──────┬──────┘      └────────────┘
                      │
        ┌─────────────┼──────────────┐
        │             │              │
   ┌────┴────┐  ┌─────┴─────┐  ┌────┴────┐
   │ User    │  │ Order     │  │ Payment │    ← Microservices
   │ Service │  │ Service   │  │ Service │
   │ (8-15   │  │ (8-15     │  │ (5-10   │
   │  pods)  │  │  pods)    │  │  pods)  │
   └────┬────┘  └─────┬─────┘  └────┬────┘
        │             │              │
   ┌────┴────┐  ┌─────┴─────┐  ┌────┴────┐
   │User DB  │  │ Order DB  │  │Pay DB   │    ← Database per Service
   │(Sharded)│  │ (Sharded) │  │(HA)     │
   └─────────┘  └───────────┘  └─────────┘
        │             │              │
        └─────────────┼──────────────┘
                      │
        ┌─────────────┼──────────────┐
        │             │              │
   ┌────┴────┐  ┌─────┴─────┐  ┌────┴────┐
   │ Redis   │  │   Kafka   │  │ Elastic │    ← Shared Infrastructure
   │ Cluster │  │  Cluster  │  │ Search  │
   │(6 nodes)│  │(6 brokers)│  │(5 nodes)│
   └─────────┘  └───────────┘  └─────────┘
```

#### Database Sharding Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    USER DATABASE SHARDING                     │
│                                                               │
│  Shard Key: user_id % N (N = number of shards)               │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Shard 0  │  │ Shard 1  │  │ Shard 2  │  │ Shard 3  │    │
│  │ user_id  │  │ user_id  │  │ user_id  │  │ user_id  │    │
│  │ % 4 == 0 │  │ % 4 == 1 │  │ % 4 == 2 │  │ % 4 == 3 │    │
│  │          │  │          │  │          │  │          │    │
│  │ 2.5M     │  │ 2.5M     │  │ 2.5M     │  │ 2.5M     │    │
│  │ users    │  │ users    │  │ users    │  │ users    │    │
│  │          │  │          │  │          │  │          │    │
│  │ Primary  │  │ Primary  │  │ Primary  │  │ Primary  │    │
│  │ +2 Repl. │  │ +2 Repl. │  │ +2 Repl. │  │ +2 Repl. │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│  Total: 10M users ÷ 4 shards = 2.5M users/shard             │
│  Each shard: ~2.5TB data, ~25K QPS                           │
└─────────────────────────────────────────────────────────────┘
```

#### Key Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| **Monolith → Microservices** | Migrate gradually | Independent scaling, team autonomy |
| **Database per service** | Yes | Loose coupling, independent scaling |
| **Sharding** | Horizontal by user_id | Even distribution, locality |
| **Message Queue** | Kafka | High throughput, event sourcing |
| **Service Mesh** | Istio/Linkerd | Observability, traffic control |
| **Container Orchestration** | Kubernetes | Auto-scaling, self-healing |
| **CI/CD** | GitOps (ArgoCD) | Declarative, auditable deploys |

#### Caching Architecture (Multi-Layer)

```
┌────────────────────────────────────────────────────────┐
│                  MULTI-LAYER CACHE                      │
│                                                         │
│  Layer 1: Browser Cache        (ms)     Hit Rate: 60%  │
│     ↓ miss                                              │
│  Layer 2: CDN Edge Cache       (1-5ms)  Hit Rate: 85%  │
│     ↓ miss                                              │
│  Layer 3: API Gateway Cache    (1-2ms)  Hit Rate: 70%  │
│     ↓ miss                                              │
│  Layer 4: Application Cache    (< 1ms)  Hit Rate: 90%  │
│           (In-process: Caffeine/Guava)                  │
│     ↓ miss                                              │
│  Layer 5: Distributed Cache    (1-3ms)  Hit Rate: 95%  │
│           (Redis Cluster)                               │
│     ↓ miss                                              │
│  Layer 6: Database             (5-50ms)                 │
│           (with query cache)                            │
│                                                         │
│  Overall Cache Hit Rate Target: > 95%                   │
│  DB actually hit: < 5% of total requests               │
└────────────────────────────────────────────────────────┘
```

---

### 4.5 Mốc 1,000,000,000 Users (1B)

> [!CAUTION]
> Chỉ một vài công ty trên thế giới đạt được mốc này: Google, Facebook, WhatsApp, YouTube, WeChat, Instagram. Đây là **engineering ở level hoàn toàn khác**.

#### Yêu Cầu Hiệu Năng

| Metric | Target | Giải thích |
|--------|--------|------------|
| **DAU** | ~200M-500M | |
| **Concurrent Users** | ~10M-50M | |
| **RPS (peak)** | 5M-50M+ | |
| **TPS** | 500K-5M+ | |
| **P50 Latency** | < 30ms | |
| **P95 Latency** | < 100ms | |
| **P99 Latency** | < 300ms | |
| **P99.9 Latency** | < 1s | |
| **Availability** | 99.999% | 5 phút downtime/năm |
| **Data volume** | Petabytes | |
| **Bandwidth** | Terabits/s | |

#### Kiến Trúc — Global Distributed

```
                        ┌──────────────┐
                        │  Global DNS  │
                        │  (GeoDNS /   │
                        │  Anycast)    │
                        └──────┬───────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
   ┌──────┴──────┐     ┌──────┴──────┐     ┌──────┴──────┐
   │  Region:    │     │  Region:    │     │  Region:    │
   │  US-East    │     │  EU-West    │     │  Asia-SE    │
   │             │     │             │     │             │
   │ ┌────────┐  │     │ ┌────────┐  │     │ ┌────────┐  │
   │ │Edge/CDN│  │     │ │Edge/CDN│  │     │ │Edge/CDN│  │
   │ └───┬────┘  │     │ └───┬────┘  │     │ └───┬────┘  │
   │     │       │     │     │       │     │     │       │
   │ ┌───┴────┐  │     │ ┌───┴────┐  │     │ ┌───┴────┐  │
   │ │API GW  │  │     │ │API GW  │  │     │ │API GW  │  │
   │ └───┬────┘  │     │ └───┬────┘  │     │ └───┬────┘  │
   │     │       │     │     │       │     │     │       │
   │ ┌───┴────┐  │     │ ┌───┴────┐  │     │ ┌───┴────┐  │
   │ │K8s     │  │     │ │K8s     │  │     │ │K8s     │  │
   │ │Cluster │  │     │ │Cluster │  │     │ │Cluster │  │
   │ │(1000s  │  │     │ │(1000s  │  │     │ │(1000s  │  │
   │ │ pods)  │  │     │ │ pods)  │  │     │ │ pods)  │  │
   │ └───┬────┘  │     │ └───┬────┘  │     │ └───┬────┘  │
   │     │       │     │     │       │     │     │       │
   │ ┌───┴────┐  │     │ ┌───┴────┐  │     │ ┌───┴────┐  │
   │ │Data    │  │     │ │Data    │  │     │ │Data    │  │
   │ │Layer   │◄─┼─────┼─┤Layer   │◄─┼─────┼─┤Layer   │  │
   │ │(Shard  │──┼─────┼─►(Shard  │──┼─────┼─►(Shard  │  │
   │ │+Replica│  │     │ │+Replica│  │     │ │+Replica│  │
   │ │ pool)  │  │     │ │ pool)  │  │     │ │ pool)  │  │
   │ └────────┘  │     │ └────────┘  │     │ └────────┘  │
   └─────────────┘     └─────────────┘     └─────────────┘
        Cross-region replication (async)
```

#### 1B Scale — Đặc Thù Kỹ Thuật

| Aspect | Approach |
|--------|----------|
| **Data Storage** | Custom distributed DB (Google Spanner, CockroachDB, TiDB) hoặc Cassandra/ScyllaDB |
| **Caching** | Multi-layer: Local → Regional → Global. Custom cache invalidation |
| **Message Queue** | Kafka clusters với hàng nghìn partitions |
| **Search** | Custom search infrastructure (không đủ dùng Elasticsearch vanilla) |
| **DNS** | GeoDNS + Anycast cho global routing |
| **CDN** | Multi-CDN strategy hoặc build own CDN |
| **Networking** | Custom protocols (QUIC, custom TCP), own backbone network |
| **Monitoring** | Custom observability platform (Prometheus không đủ) |
| **Deployment** | Canary releases, feature flags, gradual rollouts |
| **Team** | 100-1000+ engineers, dedicated platform teams |

---

### 4.6 Bảng So Sánh Tổng Hợp Các Mốc

| Aspect | 500K | 1M | 10M | 100M | 1B |
|--------|------|-----|------|------|-----|
| **Architecture** | Monolith | Modular Monolith | Microservices | Distributed Microservices | Global Distributed |
| **App Servers** | 2-4 | 4-8 | 20-100 pods | 500-2000 pods | 10,000+ pods |
| **DB Strategy** | Primary+Replica | Primary+Multi-Replica | Sharded (4-16) | Sharded (50-200) | Custom distributed |
| **Cache** | Single Redis | Redis Cluster | Multi-layer | Regional cache clusters | Global cache mesh |
| **Message Queue** | Optional | RabbitMQ | Kafka | Kafka (large) | Kafka (massive) + custom |
| **CDN** | Basic | Standard | Multi-PoP | Multi-CDN | Own CDN |
| **Monitoring** | CloudWatch | Datadog/NewRelic | Prometheus+Grafana | Custom + Prometheus | Fully custom |
| **Peak RPS** | 1K-5K | 5K-15K | 50K-150K | 500K-5M | 5M-50M+ |
| **Target P99** | < 1s | < 800ms | < 500ms | < 300ms | < 300ms |
| **Team Size** | 3-10 | 10-30 | 30-100 | 100-500 | 500-5000+ |
| **Monthly Cost** | $2K-5K | $5K-20K | $50K-200K | $500K-5M | $10M-100M+ |
| **Availability** | 99.9% | 99.95% | 99.99% | 99.99% | 99.999% |

---

## 5. Chiến Lược Tối Ưu Cụ Thể

### 5.1 Database Optimization

#### Query Optimization

```sql
-- ❌ BAD: Full table scan
SELECT * FROM users WHERE email LIKE '%@gmail.com';

-- ✅ GOOD: Indexed lookup  
SELECT id, name, email FROM users WHERE email = 'user@gmail.com';

-- ❌ BAD: N+1 query problem
-- Application code:
-- for user in users:
--     orders = SELECT * FROM orders WHERE user_id = user.id

-- ✅ GOOD: Batch query
SELECT u.*, o.* FROM users u 
LEFT JOIN orders o ON u.id = o.user_id 
WHERE u.id IN (1, 2, 3, 4, 5);
```

#### Indexing Strategy

```sql
-- Composite index cho common query patterns
CREATE INDEX idx_orders_user_status_date 
ON orders (user_id, status, created_at DESC);

-- Partial index cho hot data
CREATE INDEX idx_orders_pending 
ON orders (created_at) 
WHERE status = 'PENDING';

-- Covering index (Index-only scan)
CREATE INDEX idx_users_email_name 
ON users (email) INCLUDE (name, phone);
```

#### Connection Pooling Sizing

```
Optimal Pool Size = (Core Count * 2) + Effective Spindle Count

Ví dụ: Server 8 cores, SSD (spindle = 1)
→ Pool Size = (8 * 2) + 1 = 17 connections

Nguyên tắc:
- Quá ít connections → requests queue up → latency tăng
- Quá nhiều connections → context switching → throughput giảm
- Sweet spot thường 10-30 connections per app instance
```

### 5.2 Caching Patterns

#### Cache-Aside (Lazy Loading)

```python
def get_user(user_id):
    # 1. Check cache first
    cached = redis.get(f"user:{user_id}")
    if cached:
        return deserialize(cached)
    
    # 2. Cache miss → query DB
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)
    
    # 3. Populate cache
    redis.setex(f"user:{user_id}", TTL_5_MIN, serialize(user))
    
    return user
```

#### Write-Through

```python
def update_user(user_id, data):
    # 1. Update DB
    db.execute("UPDATE users SET ... WHERE id = ?", user_id)
    
    # 2. Update cache synchronously
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)
    redis.setex(f"user:{user_id}", TTL_5_MIN, serialize(user))
    
    return user
```

#### Cache Stampede Prevention

```python
def get_with_lock(key, ttl, fetch_fn):
    value = redis.get(key)
    if value:
        return value
    
    # Distributed lock to prevent stampede
    lock_key = f"lock:{key}"
    if redis.set(lock_key, "1", nx=True, ex=10):  # 10s lock
        try:
            value = fetch_fn()
            redis.setex(key, ttl, value)
            return value
        finally:
            redis.delete(lock_key)
    else:
        # Another process is fetching, wait briefly
        time.sleep(0.1)
        return redis.get(key) or fetch_fn()
```

### 5.3 Async Processing Patterns

#### Event-Driven Architecture

```
Synchronous Path (fast, < 100ms):
┌────────┐    ┌──────────┐    ┌────────┐
│ Client │───►│ API      │───►│ Redis  │──► Response
│        │    │ Server   │    │ Cache  │
└────────┘    └────┬─────┘    └────────┘
                   │
                   │ Publish event (async)
                   ▼
              ┌──────────┐
              │  Kafka   │
              │  Topic   │
              └────┬─────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌────────┐
   │Worker 1│ │Worker 2│ │Worker 3│  ← Background processing
   │DB Write│ │ Email  │ │Analytics│
   └────────┘ └────────┘ └────────┘
```

### 5.4 Rate Limiting Strategies

#### Token Bucket Algorithm

```
Configuration per user tier:

┌────────────────┬──────────┬───────────┬──────────────┐
│ User Tier      │ Rate     │ Burst     │ Window       │
├────────────────┼──────────┼───────────┼──────────────┤
│ Free           │ 100/min  │ 20/sec    │ 1 minute     │
│ Basic          │ 500/min  │ 50/sec    │ 1 minute     │
│ Premium        │ 2000/min │ 200/sec   │ 1 minute     │
│ Enterprise     │ 10000/min│ 1000/sec  │ 1 minute     │
└────────────────┴──────────┴───────────┴──────────────┘
```

### 5.5 Load Balancing Strategies

| Algorithm | Best For | Drawback |
|-----------|----------|----------|
| **Round Robin** | Homogeneous servers | Ignores server load |
| **Weighted Round Robin** | Mixed hardware | Static weights |
| **Least Connections** | Varying request duration | More overhead |
| **IP Hash** | Session affinity | Uneven distribution |
| **Consistent Hashing** | Cache/DB routing | Complex implementation |
| **Random with 2 Choices** | Large clusters | Slightly random |

### 5.6 Circuit Breaker Pattern

```
States:
┌────────┐  Failure threshold  ┌────────┐  Timeout  ┌───────────┐
│ CLOSED │ ────────────────── ►│  OPEN  │ ────────►│ HALF-OPEN │
│(normal)│                     │(reject │           │ (test 1   │
│        │◄────────────────────│ all)   │◄──────── │  request) │
│        │  Success in         │        │  Failure  │           │
│        │  half-open          │        │           │           │
└────────┘                     └────────┘           └───────────┘

Thresholds:
- Failure threshold: 5 failures in 60 seconds → OPEN
- Open duration: 30 seconds → HALF-OPEN
- Half-open: 1 test request → success = CLOSED, fail = OPEN
```

---

## 6. Công Cụ Đo Lường & Monitoring

### 6.1 Load Testing Tools

| Tool | Language | Protocol | Best For |
|------|----------|----------|----------|
| **k6** | JavaScript | HTTP, WebSocket, gRPC | Modern, developer-friendly |
| **JMeter** | Java | HTTP, JDBC, JMS | Enterprise, complex scenarios |
| **Gatling** | Scala | HTTP, WebSocket | High-performance, CI/CD |
| **Locust** | Python | HTTP, custom | Easy scripting |
| **wrk/wrk2** | C | HTTP | Raw throughput testing |
| **hey** | Go | HTTP | Quick benchmarks |
| **vegeta** | Go | HTTP | Constant rate testing |

#### k6 Example Script

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const latencyP95 = new Trend('latency_p95');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 1000 },  // Sustained load
    { duration: '2m', target: 2000 },  // Peak load
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(50)<100', 'p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.01'],  // Error rate < 1%
  },
};

export default function () {
  const res = http.get('https://api.example.com/users/me');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'latency < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(res.status !== 200);
  latencyP95.add(res.timings.duration);
  
  sleep(1);
}
```

### 6.2 Monitoring Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY STACK                        │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Metrics   │  │   Logging   │  │   Tracing   │          │
│  │             │  │             │  │             │          │
│  │ Prometheus  │  │ ELK Stack   │  │ Jaeger /    │          │
│  │ + Grafana   │  │ (Elastic,   │  │ Zipkin /    │          │
│  │             │  │  Logstash,  │  │ Tempo       │          │
│  │ OR          │  │  Kibana)    │  │             │          │
│  │             │  │             │  │ OR          │          │
│  │ Datadog     │  │ OR          │  │             │          │
│  │ NewRelic    │  │ Loki +      │  │ Datadog APM │          │
│  │             │  │ Grafana     │  │             │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          │                                    │
│                   ┌──────┴──────┐                             │
│                   │  Alerting   │                             │
│                   │ PagerDuty / │                             │
│                   │ OpsGenie    │                             │
│                   └─────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Key Dashboards Cần Có

#### RED Method (cho Services)

| Metric | Ý nghĩa | Alert Threshold |
|--------|----------|-----------------|
| **R**ate | Request rate (RPS) | Đột biến ±50% so với baseline |
| **E**rrors | Error rate (%) | > 1% |
| **D**uration | Latency (P50, P95, P99) | P99 > SLA threshold |

#### USE Method (cho Resources)

| Metric | Ý nghĩa | Alert Threshold |
|--------|----------|-----------------|
| **U**tilization | % resource đang dùng | > 80% |
| **S**aturation | Queue length / waiting | > 0 (ideally) |
| **E**rrors | Error count | > 0 |

---

## 7. Case Studies Thực Tế

### 7.1 Netflix (~230M subscribers)

| Aspect | Detail |
|--------|--------|
| **Peak RPS** | ~20M RPS (API) |
| **P99 Latency** | < 200ms (streaming API) |
| **Architecture** | Microservices (~1000+ services) |
| **Database** | Cassandra (data), MySQL (billing), EVCache (caching) |
| **Cache Hit Rate** | > 99% (EVCache) |
| **CDN** | Open Connect (own CDN, ~1000 servers globally) |
| **Message Queue** | Apache Kafka |
| **Key Innovation** | Chaos Engineering (Chaos Monkey) |

### 7.2 Discord (~200M MAU)

| Aspect | Detail |
|--------|--------|
| **Concurrent Users** | ~10M+ |
| **Messages/day** | Billions |
| **P99 API Latency** | < 100ms |
| **Architecture** | Elixir (chat) + Python + Rust |
| **Database** | Cassandra → ScyllaDB (migration 2023) |
| **Message Queue** | Custom (based on BEAM/OTP) |
| **Key Innovation** | Hot/cold data separation, ScyllaDB migration |

### 7.3 Shopify (Peak ~$7.5B GMV in BFCM 2023)

| Aspect | Detail |
|--------|--------|
| **Peak RPS** | ~80K RPS (checkout) |
| **Peak Orders/min** | ~58K |
| **P50 Latency** | < 50ms |
| **Architecture** | Ruby on Rails (modular monolith) + Edge compute |
| **Database** | MySQL (vitess-sharded) |
| **Key Innovation** | Monolith-at-scale, Vitess for MySQL sharding |

### 7.4 WhatsApp (2B+ users)

| Aspect | Detail |
|--------|--------|
| **Messages/day** | 100B+ |
| **Concurrent connections** | Hundreds of millions |
| **Servers at early scale** | ~50 engineers, ~1000 servers |
| **Architecture** | Erlang/BEAM |
| **Database** | Mnesia (Erlang native) + custom |
| **Key Innovation** | Extreme efficiency per engineer |

---

## 8. Checklist Đánh Giá Hệ Thống

### 8.1 Performance Assessment Checklist

```
□ BASELINE METRICS
  □ Đã đo P50, P95, P99, P99.9 latency cho tất cả critical APIs?
  □ Đã biết peak RPS/TPS hiện tại?
  □ Đã biết throughput bottleneck ở đâu?
  □ Đã có baseline cho error rate?

□ DATABASE
  □ Đã chạy EXPLAIN ANALYZE cho top 20 slow queries?
  □ Index coverage > 95% cho common queries?
  □ Connection pool size đã optimize?
  □ Read/Write ratio đã đo? (thường 80:20 hoặc 90:10)
  □ Có query timeout setting?

□ CACHING
  □ Cache hit rate > 90%?
  □ Cache invalidation strategy rõ ràng?
  □ Có cache stampede prevention?
  □ TTL values đã tune?

□ APPLICATION
  □ Không có N+1 query?
  □ Heavy operations đã async?
  □ Connection pooling cho external services?
  □ Circuit breaker cho downstream dependencies?
  □ Timeout settings cho mọi external call?

□ INFRASTRUCTURE
  □ Auto-scaling configured?
  □ Health checks hoạt động?
  □ Load balancer algorithm phù hợp?
  □ CDN cho static assets?
  □ Multi-AZ deployment?

□ MONITORING
  □ RED metrics dashboards?
  □ USE metrics cho resources?
  □ Alerting rules cho SLA violations?
  □ Distributed tracing enabled?
  □ Log aggregation hoạt động?

□ TESTING
  □ Load test đã chạy? (k6/Gatling/JMeter)
  □ Stress test — tìm breaking point?
  □ Soak test — chạy dài hạn tìm memory leak?
  □ Spike test — sudden traffic surge?
  □ Chaos testing — kill instances?
```

### 8.2 Scaling Decision Matrix

```
Khi nào nên làm gì:

IF response_time tăng BUT throughput vẫn OK
  → Optimize code/queries, add caching

IF throughput đạt giới hạn trên SINGLE instance
  → Horizontal scaling (thêm instances)

IF database là bottleneck (CPU > 80% hoặc connections max)
  → Read replicas (nếu read-heavy)
  → Vertical scale DB (nếu write-heavy)
  → Sharding (nếu cả hai đã max)

IF intermittent latency spikes
  → Check GC pauses (Java/Go)
  → Check noisy neighbors (shared hosting)
  → Check connection pool exhaustion

IF error rate tăng khi traffic tăng
  → Rate limiting
  → Circuit breaker
  → Auto-scaling rules
  → Queue-based load leveling
```

### 8.3 Capacity Planning Formula

```
Required Capacity = Peak_RPS × Safety_Factor × Growth_Factor

Ví dụ: 
- Current Peak RPS: 5,000
- Safety Factor: 2x (để handle spikes)
- Growth Factor: 1.5x (dự kiến tăng 50% trong 6 tháng)

Required = 5,000 × 2 × 1.5 = 15,000 RPS

Nếu mỗi server handle 3,000 RPS:
→ Cần ít nhất 5 servers (15,000 ÷ 3,000)
→ Thêm 1-2 server cho HA = 6-7 servers
```

---

## Phụ Lục: Quick Reference Card

### Latency Targets Quick Reference

| Scale | P50 | P95 | P99 | P99.9 |
|-------|-----|-----|-----|-------|
| 500K users | < 100ms | < 400ms | < 1s | < 3s |
| 1M users | < 80ms | < 300ms | < 800ms | < 2s |
| 10M users | < 50ms | < 200ms | < 500ms | < 2s |
| 100M users | < 30ms | < 100ms | < 300ms | < 1s |
| 1B users | < 30ms | < 100ms | < 300ms | < 1s |

### Throughput Quick Reference

| Scale | Peak RPS | Peak TPS | Required Instances* |
|-------|----------|----------|---------------------|
| 500K | 1K-5K | 100-500 | 2-4 |
| 1M | 5K-15K | 500-2K | 4-8 |
| 10M | 50K-150K | 5K-20K | 20-100 |
| 100M | 500K-5M | 50K-500K | 500-2000 |
| 1B | 5M-50M+ | 500K-5M+ | 10,000+ |

*Instances = app server pods/containers, con số thực tế phụ thuộc vào complexity

### The Four Golden Signals (Google SRE)

1. **Latency** — Thời gian xử lý request (phân biệt success vs error latency)
2. **Traffic** — Lượng demand vào hệ thống (RPS, sessions/s)
3. **Errors** — Tỉ lệ request thất bại
4. **Saturation** — Mức độ "đầy" của hệ thống (CPU, memory, I/O)

---

> **Last updated**: September 2026
> **Author**: System Performance Research
> **References**: Google SRE Book, AWS Well-Architected Framework, Martin Kleppmann - Designing Data-Intensive Applications
