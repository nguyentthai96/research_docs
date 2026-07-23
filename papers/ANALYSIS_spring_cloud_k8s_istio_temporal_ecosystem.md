# Phân Tích Hệ Sinh Thái: Spring Cloud + K8s/Istio + Temporal + Redis

> **Ngày tạo**: 2026-07-23  
> **Mục đích**: Phân tích overlap, vai trò, cách kết hợp hiệu quả  
> **Tham chiếu**: [RESEARCH_apache_zookeeper.md](file:///home/nguyentthai96/Desktop/bigbang/research_docs/papers/RESEARCH_apache_zookeeper.md), [GUIDE_zookeeper_spring_boot.md](file:///home/nguyentthai96/Desktop/bigbang/research_docs/papers/GUIDE_zookeeper_spring_boot.md)

---

## Mục Lục

1. [Bản Đồ Tổng Quan — Ai Làm Gì?](#1-bản-đồ-tổng-quan--ai-làm-gì)
2. [Phân Tích Overlap Giữa Các Thành Phần](#2-phân-tích-overlap-giữa-các-thành-phần)
3. [So Sánh Chi Tiết: Nacos vs Eureka vs Consul](#3-so-sánh-chi-tiết-nacos-vs-eureka-vs-consul)
4. [Config: Spring Cloud Config vs K8s ConfigMap vs Nacos Config](#4-config-spring-cloud-config-vs-k8s-configmap-vs-nacos-config)
5. [Redis — Vai Trò Thực Sự (Không Overlap)](#5-redis--vai-trò-thực-sự-không-overlap)
6. [Triển Khai Trên K8s + Istio Service Mesh](#6-triển-khai-trên-k8s--istio-service-mesh)
7. [Kết Hợp Temporal — Workflow Orchestration](#7-kết-hợp-temporal--workflow-orchestration)
8. [Kiến Trúc Đề Xuất Hoàn Chỉnh](#8-kiến-trúc-đề-xuất-hoàn-chỉnh)
9. [Lộ Trình Triển Khai](#9-lộ-trình-triển-khai)

---

## 1. Bản Đồ Tổng Quan — Ai Làm Gì?

### 1.1 Ma Trận Chức Năng

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     CHỨC NĂNG vs CÔNG NGHỆ                                  │
│                                                                              │
│  Chức năng             │ Nacos │ Eureka│Consul│ Redis │K8s/Istio│ Temporal  │
│  ──────────────────────┼───────┼───────┼──────┼───────┼─────────┼────────── │
│  Service Discovery     │  ✅   │  ✅   │  ✅  │  ⚠️¹  │   ✅    │    ❌     │
│  Config Management     │  ✅   │  ❌   │  ✅  │  ⚠️²  │   ✅³   │    ❌     │
│  Load Balancing        │  ✅   │  ✅⁴  │  ✅  │  ❌   │   ✅    │    ❌     │
│  Health Check          │  ✅   │  ✅⁵  │  ✅  │  ❌   │   ✅    │    ❌     │
│  Distributed Lock      │  ❌   │  ❌   │  ⚠️  │  ✅   │   ❌    │    ❌     │
│  Caching               │  ❌   │  ❌   │  ❌  │  ✅   │   ❌    │    ❌     │
│  Rate Limiting         │  ❌   │  ❌   │  ✅⁶ │  ✅   │   ✅    │    ❌     │
│  Service Mesh (mTLS)   │  ❌   │  ❌   │  ✅⁷ │  ❌   │   ✅    │    ❌     │
│  Traffic Management    │  ⚠️   │  ❌   │  ✅  │  ❌   │   ✅    │    ❌     │
│  Circuit Breaker       │  ❌   │  ❌   │  ❌  │  ❌   │   ✅    │    ✅⁸    │
│  Workflow Orchestration│  ❌   │  ❌   │  ❌  │  ❌   │   ❌    │    ✅     │
│  Saga/Compensation     │  ❌   │  ❌   │  ❌  │  ❌   │   ❌    │    ✅     │
│  Session Store         │  ❌   │  ❌   │  ❌  │  ✅   │   ❌    │    ❌     │
│  Pub/Sub Messaging     │  ❌   │  ❌   │  ❌  │  ✅   │   ❌    │    ❌     │
│                                                                              │
│  ¹ DIY approach, không production-ready                                      │
│  ² Runtime config nhanh, nhưng thiếu governance                              │
│  ³ ConfigMap/Secret, không dynamic refresh native                            │
│  ⁴ Qua Spring Cloud LoadBalancer (client-side)                               │
│  ⁵ Passive heartbeat only                                                    │
│  ⁶ Via Consul intentions                                                     │
│  ⁷ Consul Connect                                                           │
│  ⁸ Temporal tự retry/timeout, thay circuit breaker truyền thống              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Phân Loại Theo Tầng

```
┌─────────────────────────────────────────────────────────────┐
│                    KIẾN TRÚC PHÂN TẦNG                      │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TẦNG 5: WORKFLOW ORCHESTRATION                        │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ Temporal                                        │   │  │
│  │ │ • Saga pattern, long-running workflows          │   │  │
│  │ │ • Distributed transactions, compensation        │   │  │
│  │ │ • Human-in-the-loop, scheduled workflows        │   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TẦNG 4: APPLICATION PERFORMANCE                       │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ Redis                                           │   │  │
│  │ │ • Cache, Session, Rate Limiting                 │   │  │
│  │ │ • Distributed Lock, Pub/Sub                     │   │  │
│  │ │ • Real-time counters, leaderboard               │   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TẦNG 3: SERVICE GOVERNANCE                            │  │
│  │ ┌────────────┐  ┌────────────┐  ┌────────────┐       │  │
│  │ │   Nacos    │  │  Eureka    │  │  Consul    │       │  │
│  │ │ Discovery  │  │ Discovery  │  │ Discovery  │       │  │
│  │ │ + Config   │  │ (only)     │  │ + Config   │       │  │
│  │ └────────────┘  └────────────┘  │ + Mesh     │       │  │
│  │     ↑ CHỌN 1 TRONG 3 ↑         └────────────┘       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TẦNG 2: INFRASTRUCTURE NETWORKING                     │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ Kubernetes + Istio Service Mesh                 │   │  │
│  │ │ • K8s DNS (CoreDNS) — service discovery         │   │  │
│  │ │ • Istio — mTLS, traffic routing, observability  │   │  │
│  │ │ • ConfigMap/Secret — basic config               │   │  │
│  │ │ • HPA — auto-scaling                            │   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TẦNG 1: SPRING BOOT APPLICATION                       │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ Spring Boot 3.x + Spring Cloud                  │   │  │
│  │ │ • Business logic, REST APIs                     │   │  │
│  │ │ • spring-cloud-kubernetes (bridge)               │   │  │
│  │ │ • Resilience4j (app-level circuit breaker)      │   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Phân Tích Overlap Giữa Các Thành Phần

### 2.1 Overlap Map

```
                    SERVICE DISCOVERY
                   ╱       |        ╲
                Nacos    Eureka    Consul
                  |                  |
                  |    K8s DNS       |
                  |   + Istio        |
                  |      |           |
                  └──────┼───────────┘
                    ⚠️ OVERLAP ZONE
                    (Chọn 1, không dùng nhiều)

                    CONFIG MANAGEMENT
                   ╱       |        ╲
             Nacos      Spring     K8s
             Config    Cloud Cfg  ConfigMap
                  |                  |
                  └──────────────────┘
                    ⚠️ OVERLAP ZONE
                    (Chọn 1 chiến lược)

                    LOAD BALANCING
                   ╱                ╲
             Spring Cloud         Istio
             LoadBalancer        Envoy Proxy
                  |                  |
                  └──────────────────┘
                    ⚠️ OVERLAP ZONE
                    (Trên K8s → dùng Istio)

                    CIRCUIT BREAKER / RESILIENCE
                   ╱                ╲
             Resilience4j          Istio
             (app-level)         (infra-level)
                  |                  |
                  └──────────────────┘
                    ✅ BỔ SUNG (dùng cả 2)

                    DISTRIBUTED LOCK
                         |
                       Redis
                    (KHÔNG OVERLAP — duy nhất)

                    WORKFLOW / SAGA
                         |
                      Temporal
                    (KHÔNG OVERLAP — duy nhất)
```

### 2.2 Phân Tích Chi Tiết Từng Overlap

| Overlap | Thành phần | Phán quyết |
|---|---|---|
| **Service Discovery** | Nacos/Eureka/Consul **vs** K8s DNS + Istio | 🔴 **Chỉ chọn 1 phía**. Trên K8s → dùng K8s DNS + Istio. Không cần Eureka/Nacos cho discovery |
| **Config Management** | Nacos Config **vs** Spring Cloud Config **vs** K8s ConfigMap | 🟡 **Tùy nhu cầu** (xem Section 4) |
| **Load Balancing** | Spring Cloud LoadBalancer **vs** Istio Envoy | 🔴 **Trên K8s/Istio → bỏ SC LoadBalancer**. "Double routing" gây conflict |
| **Circuit Breaker** | Resilience4j **vs** Istio | 🟢 **Dùng cả 2**: Istio cho infra-level, Resilience4j cho business-level fallback |
| **Health Check** | Spring Actuator **vs** K8s Probes **vs** Nacos/Consul | 🟢 **Bổ sung**: Actuator expose → K8s liveness/readiness probe consume |
| **mTLS / Security** | Consul Connect **vs** Istio | 🔴 **Chọn 1**: Trên K8s → Istio. Standalone → Consul |
| **Rate Limiting** | Redis **vs** Istio | 🟢 **Dùng cả 2**: Istio cho global rate limit, Redis cho app-level custom logic |

### 2.3 Kết Luận Overlap

> **Quy tắc vàng khi deploy trên K8s + Istio:**
> 
> Istio **thay thế** Eureka/Nacos/Consul cho: Service Discovery, Load Balancing, mTLS, Circuit Breaker (infra-level).  
> Giữ lại: **Nacos (hoặc ConfigMap) cho Config**, **Redis cho Cache/Lock**, **Temporal cho Workflow**, **Resilience4j cho app-level fallback**.

---

## 3. So Sánh Chi Tiết: Nacos vs Eureka vs Consul

### 3.1 Bảng So Sánh Toàn Diện

| Tiêu chí | Nacos | Eureka | Consul |
|---|---|---|---|
| **CAP Model** | AP hoặc CP (tuỳ chọn) | AP (availability-first) | CP (consistency-first, Raft) |
| **Service Discovery** | ✅ Client + DNS | ✅ Client-based | ✅ Client + DNS + Catalog |
| **Config Center** | ✅ Built-in (UI, versioning, rollback) | ❌ Cần thêm Spring Cloud Config | ✅ KV Store |
| **Health Check** | Active + Client heartbeat | Passive heartbeat only | Active polling (HTTP/TCP/script) |
| **Multi-DC** | ✅ Cluster sync | ❌ Không native | ✅ Native WAN federation |
| **Dashboard/UI** | ✅ Full-featured | ❌ Basic | ✅ Full-featured |
| **Viết bằng** | Java | Java | Go |
| **Persistence** | MySQL/Derby | In-memory | Raft (self-contained) |
| **Spring Integration** | spring-cloud-alibaba | spring-cloud-netflix | spring-cloud-consul |
| **K8s Integration** | Tốt (có operator) | Kém | Rất tốt (Helm, CRDs) |
| **Learning Curve** | Trung bình | Thấp | Trung bình-Cao |
| **Community (2026)** | 🔥 Rất active (Alibaba) | ⚠️ Suy giảm | ✅ Stable (HashiCorp) |
| **Best for** | Spring Cloud Alibaba, all-in-one | Simple Java-only apps | Polyglot, multi-DC, service mesh |

### 3.2 Khi Nào Chọn Cái Nào?

```
┌──────────────────────────────────────────────────────────┐
│                    DECISION TREE                          │
│                                                          │
│  Bạn deploy trên K8s + Istio?                            │
│  ├─ YES → KHÔNG cần Nacos/Eureka/Consul cho Discovery    │
│  │        K8s DNS + Istio đã đủ                          │
│  │        Chỉ cần config center:                         │
│  │        ├─ Simple → K8s ConfigMap                      │
│  │        ├─ Dynamic + UI → Nacos Config                 │
│  │        └─ GitOps → Spring Cloud Config                │
│  │                                                       │
│  └─ NO (VM / bare-metal / hybrid)                        │
│     ├─ Java-only, đơn giản → Eureka                      │
│     ├─ Java ecosystem, cần config center → Nacos         │
│     ├─ Polyglot, multi-DC → Consul                       │
│     └─ Cần service mesh (không K8s) → Consul Connect     │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Config: Spring Cloud Config vs K8s ConfigMap vs Nacos Config

### 4.1 So Sánh Cốt Lõi

| Tiêu chí | Spring Cloud Config | K8s ConfigMap | Nacos Config |
|---|---|---|---|
| **Triết lý** | Git-centric, server-based | Infrastructure-as-Code | Dedicated config platform |
| **Lưu trữ** | Git repository | etcd (K8s internal) | MySQL/Derby |
| **UI** | ❌ (dùng Git UI) | ❌ (kubectl/lens) | ✅ Web Console |
| **Versioning** | ✅ Git history | ✅ K8s resource version | ✅ Built-in |
| **Rollback** | ✅ Git revert | ✅ kubectl rollout | ✅ 1-click UI |
| **Multi-env** | ✅ Git branches/profiles | ✅ Namespace-based | ✅ Namespace + Group |
| **Encryption** | ✅ (symmetric/asymmetric) | ⚠️ (Secret, base64 only) | ⚠️ (limited) |
| **Audit Trail** | ✅ Git log | ✅ K8s audit log | ✅ Built-in |

### 4.2 Dynamic Refresh (Hot Reload) — Điểm Khác Biệt Quan Trọng

```
┌───────────────────────────────────────────────────────────────────┐
│              HOT RELOAD COMPARISON                                │
│                                                                   │
│  SPRING CLOUD CONFIG:                                             │
│  ┌──────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐        │
│  │ Git  │───►│ Config   │───►│ Spring   │───►│ @Refresh │        │
│  │Commit│    │ Server   │    │Cloud Bus │    │ Scope    │        │
│  └──────┘    └──────────┘    │(Kafka/   │    │ beans    │        │
│                              │RabbitMQ) │    │ reload   │        │
│                              └──────────┘    └──────────┘        │
│  Cần: Git + Config Server + Message Broker                       │
│  Latency: 5-30 giây                                              │
│                                                                   │
│  ─────────────────────────────────────────────────────────────    │
│                                                                   │
│  K8s CONFIGMAP:                                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                    │
│  │ kubectl  │───►│ ConfigMap│───►│ Kubelet  │                    │
│  │ apply    │    │ updated  │    │ sync     │                    │
│  └──────────┘    └──────────┘    │ (30-60s) │                    │
│                                  └────┬─────┘                    │
│                              ┌────────▼────────┐                 │
│                              │ File changed     │                 │
│                              │ → App must watch │                 │
│                              │   OR pod restart │                 │
│                              └─────────────────┘                 │
│  Cần: kubectl + Reloader/Watcher (hoặc pod restart)              │
│  Latency: 30-120 giây                                            │
│                                                                   │
│  ─────────────────────────────────────────────────────────────    │
│                                                                   │
│  NACOS CONFIG:                                                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                    │
│  │ Nacos    │───►│ Long-    │───►│ Spring   │                    │
│  │ Console  │    │ Polling  │    │ Context  │                    │
│  │ (UI)     │    │ Push     │    │ Refresh  │                    │
│  └──────────┘    └──────────┘    └──────────┘                    │
│  Cần: Nacos cluster only                                         │
│  Latency: 1-3 giây ← NHANH NHẤT                                │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### 4.3 Khuyến Nghị Chọn Config

| Scenario | Khuyến nghị | Lý do |
|---|---|---|
| K8s-native, simple config | **K8s ConfigMap** + Stakater Reloader | Không thêm infra, native |
| Cần hot-reload nhanh + UI | **Nacos Config** | Long-polling push, 1-3s latency |
| GitOps workflow, audit trail | **Spring Cloud Config** | Git history = audit trail |
| Sensitive secrets | **K8s Secret** + **Vault** | ConfigMap/Nacos không đủ bảo mật |
| Hybrid (K8s + VM) | **Nacos Config** | Hoạt động cả trong và ngoài K8s |

---

## 5. Redis — Vai Trò Thực Sự (Không Overlap)

### 5.1 Redis KHÔNG Cạnh Tranh Với Nacos/Eureka/Consul

```
┌─────────────────────────────────────────────────────────┐
│                    REDIS vs THE REST                     │
│                                                         │
│  Nacos/Eureka/Consul = "CONTROL PLANE"                  │
│  (Quản lý: service ở đâu, config là gì)                │
│                                                         │
│  Redis = "DATA PLANE PERFORMANCE"                       │
│  (Tăng tốc: cache, lock, session, rate limit)           │
│                                                         │
│  ⚠️ KHÔNG thay thế lẫn nhau!                            │
│  → Nacos biết service nào sống ở đâu                    │
│  → Redis giúp service đó chạy nhanh hơn                │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Vai Trò Cụ Thể Của Redis Trong Stack

| Vai trò | Mô tả | Ví dụ |
|---|---|---|
| **Distributed Cache** | Cache database queries, API responses | Cache user profile 5 phút |
| **Session Store** | Chia sẻ session giữa instances | Spring Session + Redis |
| **Distributed Lock** | Mutex cho critical sections | Redisson `RLock` cho payment |
| **Rate Limiting** | Giới hạn request/s per user | Sliding window counter |
| **Pub/Sub** | Event notification nhẹ | Cache invalidation broadcast |
| **Job Queue** | Lightweight task queue | Bull/BullMQ (Node.js), Spring |
| **Real-time Counter** | Atomic increment/decrement | View count, like count |
| **Leaderboard** | Sorted sets | Gaming rank, top products |

### 5.3 Spring Boot + Redis Config

```yaml
# application.yml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: 6379
      password: ${REDIS_PASSWORD:}
      lettuce:
        pool:
          max-active: 16
          max-idle: 8
  session:
    store-type: redis         # Session store
  cache:
    type: redis               # Cache store
```

---

## 6. Triển Khai Trên K8s + Istio Service Mesh

### 6.1 Kiến Trúc K8s + Istio + Spring Boot

```
┌─────────────────────────────────────────────────────────────────────┐
│                      KUBERNETES CLUSTER                             │
│                                                                     │
│  ┌────────────────────── ISTIO MESH ──────────────────────────┐    │
│  │                                                             │    │
│  │  ┌─── Pod: Order Service ──────┐  ┌── Pod: Payment Svc ──┐│    │
│  │  │ ┌──────────┐ ┌────────────┐ │  │ ┌──────────┐ ┌─────┐ ││    │
│  │  │ │ Spring   │ │ Istio      │ │  │ │ Spring   │ │Istio│ ││    │
│  │  │ │ Boot App │◄┤ Envoy      │◄┼──┼─┤ Boot App │◄┤Envoy│ ││    │
│  │  │ │          │ │ Sidecar    │ │  │ │          │ │Proxy│ ││    │
│  │  │ └──────────┘ └────────────┘ │  │ └──────────┘ └─────┘ ││    │
│  │  └─────────────────────────────┘  └───────────────────────┘│    │
│  │                                                             │    │
│  │  Istio cung cấp TUYẾN TÍNH (transparent):                  │    │
│  │  • Service Discovery (K8s DNS)                              │    │
│  │  • Load Balancing (round-robin, least-conn, random)         │    │
│  │  • mTLS (auto encryption giữa services)                     │    │
│  │  • Circuit Breaker (connection pool limits)                  │    │
│  │  • Retry Policy (auto retry on 5xx)                          │    │
│  │  • Rate Limiting (global/local)                              │    │
│  │  • Traffic Splitting (canary, A/B testing)                   │    │
│  │  • Observability (traces, metrics, access logs)              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌────────────── NGOÀI MESH ─────────────────────────────────┐     │
│  │                                                            │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │     │
│  │  │  Redis   │  │ Temporal │  │  Nacos   │  │PostgreSQL│  │     │
│  │  │ Cluster  │  │ Cluster  │  │ (Config) │  │          │  │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │     │
│  │                                                            │     │
│  └────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Spring Cloud Trên K8s: Những Gì CẦN và KHÔNG CẦN

| Spring Cloud Component | Trên K8s + Istio | Thay thế bằng |
|---|---|---|
| Eureka / Nacos Discovery | ❌ **BỎ** | K8s Service + DNS |
| Spring Cloud LoadBalancer | ❌ **BỎ** | Istio Envoy |
| Spring Cloud Gateway | ✅ **GIỮ** hoặc thay Istio Gateway | Tuỳ nhu cầu |
| Resilience4j | ✅ **GIỮ** (app-level fallback) | Bổ sung Istio |
| Spring Cloud Config | ⚠️ **TUỲ** | K8s ConfigMap hoặc Nacos |
| Spring Cloud Sleuth/Zipkin | ❌ **BỎ** | Istio + Jaeger/Tempo |
| Micrometer | ✅ **GIỮ** | Export to Prometheus |

### 6.3 Cấu Hình Spring Boot Cho K8s + Istio

```yaml
# application.yml - K8s + Istio mode
spring:
  application:
    name: order-service
  
  # KHÔNG dùng Eureka/Nacos discovery
  cloud:
    discovery:
      enabled: false
    loadbalancer:
      enabled: false      # Istio xử lý load balancing
  
  # Config từ K8s ConfigMap hoặc Nacos
  config:
    import: "optional:configmap:order-service-config"
    # HOẶC: import: "optional:nacos:"

# Gọi service khác qua K8s DNS name (Istio intercept tự động)
# KHÔNG cần @FeignClient(name = "payment-service")
# Thay bằng: http://payment-service.default.svc.cluster.local:8080

# Actuator cho K8s probes
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  health:
    probes:
      enabled: true       # Expose liveness + readiness probes

server:
  port: 8080
```

### 6.4 Kubernetes Manifests

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  labels:
    app: order-service
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
        version: v1
      annotations:
        sidecar.istio.io/inject: "true"   # ← Istio sidecar injection
    spec:
      containers:
        - name: order-service
          image: myregistry/order-service:1.0.0
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "k8s"
            - name: REDIS_HOST
              value: "redis-cluster.infra.svc.cluster.local"
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 5
          resources:
            requests:
              cpu: 500m
              memory: 512Mi
            limits:
              cpu: 1000m
              memory: 1Gi
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: order-service           # ← Tên DNS: order-service.default.svc.cluster.local
spec:
  selector:
    app: order-service
  ports:
    - port: 8080
      targetPort: 8080
```

### 6.5 Istio Traffic Management

```yaml
# virtual-service.yaml — Canary deployment
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
    - order-service
  http:
    - route:
        - destination:
            host: order-service
            subset: v1
          weight: 90              # 90% traffic → v1
        - destination:
            host: order-service
            subset: v2
          weight: 10              # 10% traffic → v2 (canary)
      retries:
        attempts: 3
        perTryTimeout: 2s
---
# destination-rule.yaml — Circuit Breaker + Load Balancing
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: order-service
spec:
  host: order-service
  trafficPolicy:
    loadBalancer:
      simple: LEAST_REQUEST       # Istio load balancing
    connectionPool:
      http:
        h2UpgradePolicy: DEFAULT
        maxRequestsPerConnection: 100
    outlierDetection:             # Circuit Breaker
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
```

---

## 7. Kết Hợp Temporal — Workflow Orchestration

### 7.1 Temporal Giải Quyết Vấn Đề Gì?

```
VẤN ĐỀ: Order flow phức tạp, cross-service

  Order Service → Payment Service → Inventory Service → Shipping Service
       ↓                ↓                  ↓                  ↓
    Create order     Charge card       Reserve stock        Create shipment
       ↓                ↓                  ↓                  ↓
   (nếu fail?)     (nếu fail?)        (nếu fail?)         (nếu fail?)
    Rollback all    Refund card       Release stock        Cancel shipment

TRƯỚC (Manual Saga — Spring Cloud):
  → Tự code state machine
  → Tự handle retry, timeout, dead letter queue
  → Tự code compensation logic
  → 500+ dòng boilerplate code
  → Debug = nightmare (trace events qua 4 services)

SAU (Temporal):
  → Viết code tuần tự như single-service
  → Temporal tự handle retry, timeout, state persistence
  → Compensation = code thông thường
  → UI để track mọi workflow
  → Code sạch, dễ đọc, dễ test
```

### 7.2 Temporal Architecture Trên K8s

```
┌─────────────────────────────────────────────────────────────┐
│                   KUBERNETES CLUSTER                        │
│                                                             │
│  ┌──── Temporal Cluster (Helm) ─────────────────────────┐  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │  │
│  │  │ Frontend │ │ History  │ │ Matching │ │ Worker  │ │  │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service │ │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │  │
│  │       └─────────────┴─────────────┴────────────┘      │  │
│  │                        │                               │  │
│  │                 ┌──────▼──────┐                        │  │
│  │                 │ PostgreSQL  │ (hoặc Cassandra)       │  │
│  │                 │ (state DB)  │                        │  │
│  │                 └─────────────┘                        │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │ gRPC                            │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │  Spring Boot Workers (trong Istio mesh)               │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │  │
│  │  │ Order Worker │ │Payment Worker│ │ Ship Worker  │  │  │
│  │  │ (Workflow +  │ │ (Activities) │ │ (Activities) │  │  │
│  │  │  Activities) │ │              │ │              │  │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Spring Boot + Temporal Implementation

```xml
<!-- pom.xml -->
<dependency>
    <groupId>io.temporal</groupId>
    <artifactId>temporal-spring-boot-starter</artifactId>
    <version>1.26.0</version>
</dependency>
```

```yaml
# application.yml
spring:
  temporal:
    connection:
      target: temporal-frontend.temporal.svc.cluster.local:7233  # K8s DNS
    namespace: default
    workers:
      - task-queue: order-processing
        workflow-classes:
          - com.example.workflow.OrderWorkflowImpl
        activity-classes:
          - com.example.activity.PaymentActivityImpl
          - com.example.activity.InventoryActivityImpl
          - com.example.activity.ShippingActivityImpl
```

```java
// === Workflow Interface ===
@WorkflowInterface
public interface OrderWorkflow {
    @WorkflowMethod
    OrderResult processOrder(OrderRequest request);
}

// === Workflow Implementation ===
public class OrderWorkflowImpl implements OrderWorkflow {

    // Activity stubs — Temporal handle retry/timeout tự động
    private final PaymentActivity paymentActivity = Workflow.newActivityStub(
        PaymentActivity.class,
        ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofSeconds(30))
            .setRetryOptions(RetryOptions.newBuilder()
                .setMaximumAttempts(3)
                .build())
            .build()
    );

    private final InventoryActivity inventoryActivity = Workflow.newActivityStub(
        InventoryActivity.class,
        ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofSeconds(10))
            .build()
    );

    private final ShippingActivity shippingActivity = Workflow.newActivityStub(
        ShippingActivity.class,
        ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofMinutes(5))
            .build()
    );

    @Override
    public OrderResult processOrder(OrderRequest request) {
        // Viết CODE TUẦN TỰ — Temporal biến thành distributed saga tự động!
        
        // Step 1: Charge payment
        PaymentResult payment = paymentActivity.charge(request.getPaymentInfo());
        
        try {
            // Step 2: Reserve inventory
            inventoryActivity.reserve(request.getItems());
            
            try {
                // Step 3: Create shipment
                ShipmentResult shipment = shippingActivity.createShipment(
                    request.getAddress(), request.getItems()
                );
                
                return OrderResult.success(payment, shipment);
                
            } catch (Exception e) {
                // Compensation: release inventory
                inventoryActivity.release(request.getItems());
                throw e;
            }
        } catch (Exception e) {
            // Compensation: refund payment
            paymentActivity.refund(payment.getTransactionId());
            return OrderResult.failed(e.getMessage());
        }
    }
}

// === Activity Interface ===
@ActivityInterface
public interface PaymentActivity {
    @ActivityMethod
    PaymentResult charge(PaymentInfo info);
    
    @ActivityMethod
    void refund(String transactionId);
}

// === Activity Implementation (Spring Bean) ===
@Component
public class PaymentActivityImpl implements PaymentActivity {
    
    @Autowired
    private PaymentGateway paymentGateway;
    
    @Override
    public PaymentResult charge(PaymentInfo info) {
        // Gọi payment gateway thật — Temporal auto-retry nếu fail
        return paymentGateway.charge(info);
    }
    
    @Override
    public void refund(String transactionId) {
        paymentGateway.refund(transactionId);
    }
}
```

### 7.4 Temporal vs Các Giải Pháp Khác

| Tiêu chí | Temporal | Spring Cloud (Manual Saga) | Kafka Event Choreography |
|---|---|---|---|
| **Code Complexity** | Thấp (tuần tự) | Cao (state machine) | Rất cao (distributed events) |
| **State Visibility** | ✅ UI built-in | ❌ Tự implement | ❌ Trace qua nhiều topics |
| **Retry/Timeout** | ✅ Tự động, configurable | ⚠️ Tự code | ⚠️ Tự code |
| **Compensation** | ✅ Code thường (try/catch) | ⚠️ Tự implement rollback | ⚠️ Compensating events |
| **Long-running** | ✅ Ngày/tuần/tháng | ❌ Khó | ❌ Rất khó |
| **Testing** | ✅ Unit test bình thường | ⚠️ Integration test phức tạp | ❌ Rất khó test |
| **Infra Overhead** | ⚠️ Cần Temporal cluster | ✅ Không thêm infra | ⚠️ Cần Kafka cluster |
| **Best For** | Complex business flows | Simple 2-3 step flows | Event-driven, async decoupling |

---

## 8. Kiến Trúc Đề Xuất Hoàn Chỉnh

### 8.1 "Golden Stack" — Kết Hợp Tối Ưu

```
┌─────────────────────────────────────────────────────────────────────┐
│              PRODUCTION-READY MICROSERVICES STACK                   │
│                                                                     │
│  LAYER 5: WORKFLOW ─────────────────────────────────────────────   │
│  │ Temporal                                                    │   │
│  │ → Order processing, payment saga, user onboarding           │   │
│  │ → Scheduled jobs thay @Scheduled + leader election          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LAYER 4: PERFORMANCE ──────────────────────────────────────────   │
│  │ Redis Cluster                                               │   │
│  │ → Cache (hot data), Session store                           │   │
│  │ → Distributed lock (Redisson), Rate limiting                │   │
│  │ → Real-time counters, Pub/Sub                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LAYER 3: CONFIG ───────────────────────────────────────────────   │
│  │ Nacos Config (hoặc K8s ConfigMap + Reloader)                │   │
│  │ → Dynamic config, feature flags, hot reload                 │   │
│  │ → Multi-environment (dev/staging/prod)                      │   │
│  │ K8s Secret + HashiCorp Vault                                │   │
│  │ → Sensitive secrets (DB password, API keys)                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LAYER 2: NETWORKING ───────────────────────────────────────────   │
│  │ Kubernetes + Istio Service Mesh                             │   │
│  │ → Service Discovery (K8s DNS — thay Eureka/Nacos discovery) │   │
│  │ → Load Balancing (Envoy — thay Spring Cloud LB)             │   │
│  │ → mTLS (auto — thay manual SSL)                             │   │
│  │ → Circuit Breaker (outlier detection)                        │   │
│  │ → Traffic Management (canary, A/B, blue-green)              │   │
│  │ → Observability (Jaeger traces, Prometheus metrics)         │   │
│  │ Istio Gateway (thay Spring Cloud Gateway cho external)      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LAYER 1: APPLICATION ──────────────────────────────────────────   │
│  │ Spring Boot 3.x                                             │   │
│  │ → Business logic, REST APIs                                 │   │
│  │ → spring-cloud-kubernetes (ConfigMap binding)               │   │
│  │ → Resilience4j (app-level fallback logic)                   │   │
│  │ → Micrometer (metrics export to Prometheus)                 │   │
│  │ → Spring Data (JPA/MongoDB/Redis)                           │   │
│  │ → temporal-spring-boot-starter                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ❌ LOẠI BỎ (redundant trên K8s + Istio):                          │
│  • Eureka / Nacos Discovery / Consul Discovery                     │
│  • Spring Cloud LoadBalancer / Ribbon                               │
│  • Spring Cloud Sleuth (thay bằng Istio tracing)                    │
│  • Netflix Zuul (thay bằng Istio Gateway)                           │
│  • Netflix Hystrix (thay bằng Istio + Resilience4j)                │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Mỗi Thành Phần Đóng Góp Gì?

| Thành phần | Đóng góp chính | Không thể thay thế bởi |
|---|---|---|
| **K8s** | Container orchestration, scaling, self-healing | Không gì thay |
| **Istio** | mTLS, traffic routing, observability, LB | Spring Cloud (partial) |
| **Redis** | Sub-ms cache, distributed lock, session | Không gì thay |
| **Temporal** | Durable workflow, saga, long-running process | Manual saga (kém xa) |
| **Nacos Config** | Dynamic config + UI + hot reload | K8s ConfigMap (basic) |
| **Spring Boot** | Business logic, DI, ecosystem | Không gì thay |
| **Resilience4j** | App-level fallback khi business logic fail | Istio (infra-level only) |

---

## 9. Lộ Trình Triển Khai

### Phase 1: Foundation (Tuần 1-2)

```
□ Setup K8s cluster (EKS/GKE/AKS hoặc local minikube)
□ Install Istio (istioctl install --set profile=demo)
□ Deploy Redis cluster (Helm: bitnami/redis)
□ Setup PostgreSQL (cho Temporal)
□ Verify: kubectl, istioctl, redis-cli working
```

### Phase 2: First Service (Tuần 3-4)

```
□ Create Spring Boot service (order-service)
□ Remove Spring Cloud Discovery dependencies
□ Configure K8s Deployment + Service + Istio injection
□ Setup Actuator health probes (liveness/readiness)
□ Test: service-to-service call via K8s DNS
□ Test: Istio traffic management (VirtualService)
```

### Phase 3: Config & Redis (Tuần 5-6)

```
□ Setup Nacos Config (hoặc K8s ConfigMap + Reloader)
□ Configure Spring Boot to read from config source
□ Test: dynamic config refresh without restart
□ Integrate Redis (Spring Data Redis)
□ Implement: caching, session store, rate limiting
□ Test: distributed lock với Redisson
```

### Phase 4: Temporal (Tuần 7-8)

```
□ Deploy Temporal cluster (Helm: temporalio/temporal)
□ Add temporal-spring-boot-starter to services
□ Implement first workflow (e.g., order processing saga)
□ Test: workflow retry, compensation, timeout
□ Deploy Temporal Web UI
□ Test: long-running workflow (simulated delay)
```

### Phase 5: Observability & Hardening (Tuần 9-10)

```
□ Setup Prometheus + Grafana (Helm: kube-prometheus-stack)
□ Configure Istio → Jaeger/Tempo tracing
□ Setup dashboards: service latency, error rate, throughput
□ Implement Resilience4j fallbacks cho critical paths
□ Load test với k6/Gatling
□ Chaos testing: kill pods, network partitions
```
