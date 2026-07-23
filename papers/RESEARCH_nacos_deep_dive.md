# Nacos — Nghiên Cứu Chuyên Sâu

> **Ngày tạo**: 2026-07-23  
> **Phiên bản**: Nacos 2.x / 3.x (BETA)  
> **Tham chiếu**: [ANALYSIS_spring_cloud_k8s_istio_temporal_ecosystem.md](file:///home/nguyentthai96/Desktop/bigbang/research_docs/papers/ANALYSIS_spring_cloud_k8s_istio_temporal_ecosystem.md)

---

## Mục Lục

1. [Nacos Là Gì? — Bức Tranh Toàn Cảnh](#1-nacos-là-gì--bức-tranh-toàn-cảnh)
2. [Kiến Trúc Nội Bộ — Nacos Hoạt Động Như Thế Nào?](#2-kiến-trúc-nội-bộ--nacos-hoạt-động-như-thế-nào)
3. [Data Model — Namespace, Group, DataID](#3-data-model--namespace-group-dataid)
4. [Service Discovery — Cơ Chế Đăng Ký & Khám Phá Dịch Vụ](#4-service-discovery--cơ-chế-đăng-ký--khám-phá-dịch-vụ)
5. [Configuration Management — Quản Lý Cấu Hình Tập Trung](#5-configuration-management--quản-lý-cấu-hình-tập-trung)
6. [Tích Hợp Spring Boot / Spring Cloud Alibaba](#6-tích-hợp-spring-boot--spring-cloud-alibaba)
7. [Triển Khai Nacos Cluster (Docker Compose)](#7-triển-khai-nacos-cluster-docker-compose)
8. [Tính Năng Nâng Cao — Gray Release, Weight Routing, Feature Flags](#8-tính-năng-nâng-cao--gray-release-weight-routing-feature-flags)
9. [Lợi Ích Tổng Hợp — Nacos Đem Lại Gì?](#9-lợi-ích-tổng-hợp--nacos-đem-lại-gì)
10. [Best Practices & Pitfalls](#10-best-practices--pitfalls)

---

## 1. Nacos Là Gì? — Bức Tranh Toàn Cảnh

### 1.1 Định Nghĩa

**Nacos** = **Na**ming + **Co**nfiguration + **S**ervice

Là một nền tảng **all-in-one** cho microservices, cung cấp:

```
┌─────────────────────────────────────────────────────────────────┐
│                        NACOS = 3 IN 1                           │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │  ① NAMING       │  │ ② CONFIGURATION │  │ ③ SERVICE      │  │
│  │  (Discovery)    │  │  (Config Center) │  │  (Governance)  │  │
│  │                 │  │                  │  │                │  │
│  │ • Đăng ký svc   │  │ • Config tập    │  │ • Health check │  │
│  │ • Tìm kiếm svc  │  │   trung         │  │ • Weight route │  │
│  │ • DNS-based     │  │ • Hot reload     │  │ • Metadata     │  │
│  │ • gRPC-based    │  │ • Versioning     │  │ • Gray release │  │
│  │ • Health check  │  │ • Rollback       │  │ • Flow control │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
│                                                                 │
│  So sánh: Eureka chỉ có ①, Spring Cloud Config chỉ có ②        │
│           Consul có ① + ② nhưng không có UI mạnh như Nacos      │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Nacos Trong Ecosystem

| Ecosystem | Tích hợp |
|---|---|
| **Spring Cloud Alibaba** | `spring-cloud-starter-alibaba-nacos-*` — tích hợp native |
| **Dubbo** | Service registry mặc định cho Dubbo RPC framework |
| **Kubernetes** | Nacos Controller đồng bộ services giữa Nacos ↔ K8s |
| **gRPC** | gRPC service discovery native (Nacos 2.x+) |
| **Istio** | Có thể đồng bộ ServiceEntry qua MCP protocol |

### 1.3 Lịch Sử & Phát Triển

| Phiên bản | Năm | Điểm nổi bật |
|---|---|---|
| **Nacos 1.x** | 2018-2021 | HTTP long-polling, Distro protocol, Derby embedded DB |
| **Nacos 2.x** | 2021-2025 | gRPC persistent connection, JRaft (CP), plugin architecture |
| **Nacos 3.x** | 2025+ | AI Registry (MCP server discovery), distributed lock, security enhancements |

---

## 2. Kiến Trúc Nội Bộ — Nacos Hoạt Động Như Thế Nào?

### 2.1 Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────────┐
│                    NACOS SERVER ARCHITECTURE                    │
│                                                                 │
│  ┌───────────────── API Layer ──────────────────────────────┐  │
│  │  HTTP REST API (8848)  │  gRPC API (9848/9849)           │  │
│  │  • /nacos/v1/ns/*      │  • Persistent connection        │  │
│  │  • /nacos/v1/cs/*      │  • Bidirectional streaming      │  │
│  │  • Console UI (8848)   │  • Lower latency                │  │
│  └────────────┬───────────┴──────────────┬──────────────────┘  │
│               │                          │                     │
│  ┌────────────▼──────────────────────────▼──────────────────┐  │
│  │                FUNCTIONAL MODULES                         │  │
│  │  ┌──────────────────┐  ┌──────────────────┐              │  │
│  │  │ Naming Module    │  │ Config Module    │              │  │
│  │  │ (Service Disc.)  │  │ (Config Mgmt)   │              │  │
│  │  │                  │  │                  │              │  │
│  │  │ • Instance reg.  │  │ • Data publish   │              │  │
│  │  │ • Health check   │  │ • Long-poll push │              │  │
│  │  │ • Metadata mgmt  │  │ • Listener mgmt │              │  │
│  │  │ • DNS server     │  │ • Gray release   │              │  │
│  │  └────────┬─────────┘  └────────┬─────────┘              │  │
│  └───────────┼─────────────────────┼────────────────────────┘  │
│              │                     │                           │
│  ┌───────────▼─────────────────────▼────────────────────────┐  │
│  │              CONSISTENCY PROTOCOL LAYER                   │  │
│  │                                                           │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐        │  │
│  │  │  DISTRO Protocol    │  │  RAFT Protocol      │        │  │
│  │  │  (AP Model)         │  │  (CP Model)         │        │  │
│  │  │                     │  │                     │        │  │
│  │  │  → Temporary        │  │  → Persistent       │        │  │
│  │  │    instances        │  │    instances        │        │  │
│  │  │  → Gossip-like      │  │  → Config data      │        │  │
│  │  │  → Eventually       │  │  → JRaft impl       │        │  │
│  │  │    consistent       │  │  → Strongly          │        │  │
│  │  │  → Partition        │  │    consistent       │        │  │
│  │  │    tolerant         │  │  → Leader-based     │        │  │
│  │  └─────────────────────┘  └─────────────────────┘        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                    │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │              STORAGE LAYER                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │   MySQL      │  │   Derby      │  │   Memory     │  │   │
│  │  │ (Production) │  │ (Standalone) │  │  (Instance   │  │   │
│  │  │              │  │              │  │   Registry)  │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Hai Giao Thức Nhất Quán — Trái Tim Của Nacos

#### Distro Protocol (AP Model) — Cho Service Discovery

```
Kịch bản: Service A đăng ký instance mới

Client A ──register──► Nacos Node 1 (chịu trách nhiệm)
                            │
                            ├──async sync──► Nacos Node 2
                            ├──async sync──► Nacos Node 3
                            │
                            └── Trả lời Client A ngay lập tức
                                (không chờ sync xong)

Đặc điểm:
• Mỗi node "sở hữu" một phần data (consistent hashing)
• Sync bất đồng bộ → eventual consistency
• Node fail → các node khác tiếp quản
• CLIENT vẫn hoạt động khi cluster bị partition
• Dùng cho: temporary instances (services register/deregister liên tục)
```

#### Raft Protocol (CP Model) — Cho Configuration

```
Kịch bản: Admin thay đổi config trên Nacos Console

Admin ──publish config──► Nacos Leader (Raft)
                              │
                              ├── Replicate log ──► Follower 1
                              ├── Replicate log ──► Follower 2
                              │
                              ├── Quorum ACK received!
                              │
                              └── Commit & notify clients
                                  (config change pushed)

Đặc điểm:
• Leader xử lý mọi write request
• Write chỉ commit khi majority (quorum) ACK
• Strong consistency → config KHÔNG BAO GIỜ bị mất
• Dùng cho: config data, persistent instances
```

### 2.3 Long-Polling & gRPC Push — Config Push Mechanism

```
┌──────────────────────────────────────────────────────────────┐
│            CONFIG CHANGE NOTIFICATION                        │
│                                                              │
│  NACOS 1.x — HTTP Long-Polling:                              │
│                                                              │
│  Client ──GET /listener──► Nacos Server                      │
│            │                    │                            │
│            │   (server holds    │                            │
│            │    request 29.5s)  │                            │
│            │                    │                            │
│            │   Config changed!  │                            │
│            │◄── Response ───────│  ← Notify immediately     │
│            │                    │                            │
│            │── New request ────►│  ← Re-establish poll      │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  NACOS 2.x — gRPC Persistent Connection:                     │
│                                                              │
│  Client ◄═══ gRPC stream ═══► Nacos Server                   │
│            │                    │                            │
│            │   Config changed!  │                            │
│            │◄── Push event ─────│  ← Real-time push         │
│            │                    │     (sub-second latency)   │
│            │   (connection      │                            │
│            │    stays open)     │                            │
│                                                              │
│  So sánh latency:                                            │
│  • Long-polling: 1-3 giây                                    │
│  • gRPC push: < 500ms                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model — Namespace, Group, DataID

### 3.1 Cấu Trúc Phân Cấp

```
Nacos Data Model (3 tầng isolation):

┌─────────────────────────────────────────────────────────────┐
│ NACOS INSTANCE                                              │
│                                                             │
│ ┌─── Namespace: dev ──────────────────────────────────────┐ │
│ │                                                         │ │
│ │ ┌── Group: DEFAULT_GROUP ─────────────────────────────┐ │ │
│ │ │  Config DataID: application.yml                     │ │ │
│ │ │  Config DataID: order-service.yml                   │ │ │
│ │ │  Service: order-service                             │ │ │
│ │ │     ├── instance: 10.0.1.5:8080                     │ │ │
│ │ │     └── instance: 10.0.1.6:8080                     │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌── Group: PAYMENT_GROUP ─────────────────────────────┐ │ │
│ │ │  Config DataID: payment-gateway.yml                 │ │ │
│ │ │  Service: payment-service                           │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─── Namespace: staging ──────────────────────────────────┐ │
│ │  (cấu trúc tương tự, data khác hoàn toàn)              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─── Namespace: prod ─────────────────────────────────────┐ │
│ │  (cấu trúc tương tự, data khác hoàn toàn)              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Giải Thích Từng Tầng

| Tầng | Mục đích | Ví dụ | Mặc định |
|---|---|---|---|
| **Namespace** | Cách ly **môi trường** hoặc **tenant** | `dev`, `staging`, `prod`, `tenant-A` | `public` |
| **Group** | Nhóm logic trong cùng namespace | `DEFAULT_GROUP`, `PAYMENT_GROUP`, `v2` | `DEFAULT_GROUP` |
| **DataID** (Config) | Định danh **1 file config** cụ thể | `order-service.yml`, `redis.properties` | — |
| **Service Name** (Discovery) | Tên **1 dịch vụ** cụ thể | `order-service`, `payment-service` | — |

### 3.3 Cách Ánh Xạ Vào Spring Boot

```yaml
# application.yml
spring:
  cloud:
    nacos:
      # Áp dụng cho cả Discovery và Config
      server-addr: nacos-server:8848
      
      discovery:
        namespace: ${NACOS_NAMESPACE:dev}     # ← Namespace
        group: DEFAULT_GROUP                   # ← Group
        # Service name = spring.application.name
      
      config:
        namespace: ${NACOS_NAMESPACE:dev}     # ← Namespace
        group: DEFAULT_GROUP                   # ← Group  
        file-extension: yml                    # ← DataID = {app-name}.yml
        shared-configs:                        # ← Shared configs
          - data-id: common-redis.yml
            group: INFRA_GROUP
            refresh: true
```

**Config DataID Convention**: `{spring.application.name}-{spring.profiles.active}.{file-extension}`

```
Ví dụ: spring.application.name = order-service
       spring.profiles.active = prod
       file-extension = yml

→ DataID tự động: order-service-prod.yml
→ Fallback:       order-service.yml
→ Shared:         common-redis.yml (INFRA_GROUP)
```

---

## 4. Service Discovery — Cơ Chế Đăng Ký & Khám Phá Dịch Vụ

### 4.1 Luồng Hoạt Động

```
┌──────────────────────────────────────────────────────────────────┐
│                SERVICE DISCOVERY FLOW                            │
│                                                                  │
│  ① REGISTER (Startup)                                            │
│  ┌──────────────┐                    ┌──────────────┐            │
│  │ Order Service │──── register ────►│ Nacos Server │            │
│  │ instance:8080 │   (name, IP,     │              │            │
│  │               │    port, meta)   │  ┌────────┐  │            │
│  └──────────────┘                   │  │Registry│  │            │
│                                     │  │ order- │  │            │
│  ② HEARTBEAT (Running)              │  │service:│  │            │
│  ┌──────────────┐                   │  │10.0.1.5│  │            │
│  │ Order Service │◄── heartbeat ──► │  │:8080   │  │            │
│  │               │   (every 5s)     │  │        │  │            │
│  └──────────────┘                   │  │10.0.1.6│  │            │
│                                     │  │:8081   │  │            │
│  ③ DISCOVER (Call other service)    │  └────────┘  │            │
│  ┌──────────────┐                   │              │            │
│  │Payment Service│◄── query ────────│              │            │
│  │  (consumer)   │  "order-service" │              │            │
│  │               │                  │              │            │
│  │  Receives:    │                  │              │            │
│  │  [10.0.1.5:   │                  └──────────────┘            │
│  │   8080,       │                                              │
│  │   10.0.1.6:   │                                              │
│  │   8081]       │                                              │
│  │               │                                              │
│  │  → Load balance → call 10.0.1.5:8080                         │
│  └──────────────┘                                               │
│                                                                  │
│  ④ DEREGISTER (Crash/Shutdown)                                   │
│  • Graceful shutdown → gửi deregister request                    │
│  • Crash → heartbeat timeout (15s mặc định) → tự động remove    │
│  • Ephemeral instance → tự xóa khi mất kết nối                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Hai Loại Instance

| Loại | Đặc điểm | Health Check | Dùng khi |
|---|---|---|---|
| **Ephemeral** (tạm thời) | Client gửi heartbeat, tự xóa khi mất kết nối | Client-side (heartbeat) | Microservices thông thường (scale up/down liên tục) |
| **Persistent** (vĩnh viễn) | Server chủ động check health, KHÔNG tự xóa | Server-side (TCP/HTTP probe) | Database, middleware (IP cố định, ít thay đổi) |

```yaml
# Cấu hình trong application.yml
spring:
  cloud:
    nacos:
      discovery:
        ephemeral: true           # true = ephemeral (mặc định)
                                  # false = persistent
```

### 4.3 Metadata — Thêm Thông Tin Cho Instance

```yaml
spring:
  cloud:
    nacos:
      discovery:
        metadata:
          version: v2.1.0         # Phiên bản code
          region: us-east-1       # Vùng deploy
          env: canary             # Dùng cho gray release
          team: payment-team      # Team sở hữu
```

Metadata được dùng cho: weight routing, gray release, monitoring labels, custom load balancing rules.

---

## 5. Configuration Management — Quản Lý Cấu Hình Tập Trung

### 5.1 Vòng Đời Config

```
┌──────────────────────────────────────────────────────────────┐
│              CONFIG LIFECYCLE IN NACOS                        │
│                                                              │
│  ① CREATE                                                    │
│  Admin ──► Nacos Console (UI)                                │
│            hoặc API: POST /nacos/v1/cs/configs               │
│            → Lưu vào MySQL (Raft consensus)                  │
│                                                              │
│  ② DISTRIBUTE                                                │
│  Nacos Server ──push──► All subscribed clients               │
│  (Long-polling 1.x / gRPC push 2.x)                         │
│                                                              │
│  ③ UPDATE                                                    │
│  Admin ──► Sửa trên Console                                  │
│         → Nacos phát hiện MD5 hash thay đổi                  │
│         → Push tới tất cả clients đang subscribe             │
│         → Client nhận event → refresh beans                  │
│                                                              │
│  ④ ROLLBACK                                                  │
│  Admin ──► Chọn version cũ trên Console                      │
│         → 1-click rollback                                   │
│         → Push lại config cũ cho clients                     │
│                                                              │
│  ⑤ LISTEN (Client-side)                                      │
│  Client subscribe DataID + Group                             │
│  → MD5 hash so sánh mỗi lần poll/push                       │
│  → Nếu khác → pull full content → fire listener              │
│                                                              │
│  ⑥ HISTORY & AUDIT                                           │
│  Mọi thay đổi đều được lưu lịch sử (ai, lúc nào, nội dung) │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Tính Năng Config Chính

| Tính năng | Mô tả |
|---|---|
| **Hot Reload** | Thay đổi config → app nhận ngay, KHÔNG restart |
| **Versioning** | Mỗi lần sửa tạo version mới, xem diff giữa versions |
| **Rollback** | 1-click quay lại version cũ |
| **Multi-format** | YAML, Properties, JSON, XML, HTML, Text |
| **Gray Release** | Push config mới cho 1 subset instances trước |
| **Shared Config** | 1 config dùng chung cho nhiều services |
| **Config Encryption** | Mã hóa giá trị nhạy cảm (3.x) |
| **Import/Export** | Backup/restore cấu hình giữa các môi trường |

---

## 6. Tích Hợp Spring Boot / Spring Cloud Alibaba

### 6.1 Dependencies (pom.xml)

```xml
<!-- Spring Boot Parent -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.5</version>
</parent>

<!-- Spring Cloud Alibaba BOM -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>2023.0.1.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>2024.0.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <!-- Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- Nacos Service Discovery -->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    </dependency>
    
    <!-- Nacos Config Center -->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
    </dependency>
    
    <!-- LoadBalancer (thay Ribbon) -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-loadbalancer</artifactId>
    </dependency>
    
    <!-- OpenFeign (optional) -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-openfeign</artifactId>
    </dependency>
</dependencies>
```

### 6.2 application.yml Hoàn Chỉnh

```yaml
server:
  port: 8081

spring:
  application:
    name: order-service

  # ============ NACOS CONFIG ============
  config:
    import:
      - "optional:nacos:order-service.yml"          # Main config
      - "optional:nacos:common-redis.yml?group=INFRA_GROUP"  # Shared config
  
  cloud:
    nacos:
      # --- Connection ---
      server-addr: ${NACOS_ADDR:127.0.0.1:8848}
      username: ${NACOS_USER:nacos}
      password: ${NACOS_PASS:nacos}
      
      # --- Service Discovery ---
      discovery:
        namespace: ${NACOS_NAMESPACE:}            # Empty = public
        group: DEFAULT_GROUP
        ephemeral: true                            # Ephemeral instance
        weight: 1                                  # Default weight
        metadata:
          version: ${APP_VERSION:1.0.0}
          region: ${REGION:local}
      
      # --- Configuration ---
      config:
        namespace: ${NACOS_NAMESPACE:}
        group: DEFAULT_GROUP
        file-extension: yml
        refresh-enabled: true                      # Enable hot reload
        timeout: 5000                              # Config fetch timeout (ms)

# ============ LOGGING ============
logging:
  level:
    com.alibaba.cloud: INFO
    com.alibaba.nacos: WARN
```

### 6.3 Service Discovery — Gọi Service Khác

```java
// ===== Cách 1: OpenFeign (Recommended) =====
@FeignClient(name = "payment-service")    // Tên trong Nacos registry
public interface PaymentClient {
    
    @PostMapping("/api/payments")
    PaymentResponse createPayment(@RequestBody PaymentRequest request);
    
    @GetMapping("/api/payments/{id}")
    PaymentResponse getPayment(@PathVariable String id);
}

// ===== Cách 2: RestTemplate + @LoadBalanced =====
@Configuration
public class RestConfig {
    @Bean
    @LoadBalanced                           // Enable Nacos load balancing
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

@Service
public class OrderService {
    @Autowired
    private RestTemplate restTemplate;
    
    public PaymentResponse pay(String orderId, BigDecimal amount) {
        // "payment-service" → Nacos tra cứu IP:port → load balance
        return restTemplate.postForObject(
            "http://payment-service/api/payments",  // Service name, NOT IP!
            new PaymentRequest(orderId, amount),
            PaymentResponse.class
        );
    }
}

// ===== Cách 3: WebClient (Reactive) =====
@Configuration
public class WebClientConfig {
    @Bean
    @LoadBalanced
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}
```

### 6.4 Configuration — Dynamic Reload

```java
// ===== Cách 1: @RefreshScope + @Value (Spring Cloud) =====
@RestController
@RefreshScope                // Bean được recreate khi config thay đổi
@RequestMapping("/api/orders")
public class OrderController {

    @Value("${order.max-items:100}")
    private int maxItems;

    @Value("${feature.new-checkout:false}")
    private boolean newCheckoutEnabled;

    @GetMapping("/config")
    public Map<String, Object> getConfig() {
        return Map.of(
            "maxItems", maxItems,
            "newCheckoutEnabled", newCheckoutEnabled
        );
    }
}

// ===== Cách 2: @ConfigurationProperties (Recommended cho groups) =====
@Data
@Component
@RefreshScope
@ConfigurationProperties(prefix = "order")
public class OrderProperties {
    private int maxItems = 100;
    private int maxRetries = 3;
    private long timeoutMs = 5000;
    private boolean enableNotification = true;
}

// Sử dụng:
@Service
public class OrderService {
    @Autowired
    private OrderProperties props;
    
    public void process(Order order) {
        if (order.getItems().size() > props.getMaxItems()) {
            throw new TooManyItemsException();
        }
        // props.getTimeoutMs() → luôn là giá trị mới nhất từ Nacos
    }
}

// ===== Cách 3: Manual Listener (Custom logic on change) =====
@Component
public class CustomConfigListener {

    @NacosConfigListener(dataId = "order-service.yml", groupId = "DEFAULT_GROUP")
    public void onConfigChanged(String newConfig) {
        log.info("Config changed! New content:\n{}", newConfig);
        // Custom logic: reinitialize connection pool, clear cache, etc.
    }
}
```

---

## 7. Triển Khai Nacos Cluster (Docker Compose)

### 7.1 3-Node Cluster + MySQL

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ============ MySQL (Config Persistence) ============
  nacos-mysql:
    image: mysql:8.0
    container_name: nacos-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: nacos_config
      MYSQL_USER: nacos
      MYSQL_PASSWORD: nacos
    volumes:
      - mysql_data:/var/lib/mysql
      - ./sql/mysql-schema.sql:/docker-entrypoint-initdb.d/init.sql  # Nacos schema
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - nacos-net

  # ============ Nacos Node 1 ============
  nacos1:
    image: nacos/nacos-server:v2.4.3
    container_name: nacos1
    environment:
      MODE: cluster
      NACOS_SERVERS: nacos1:8848 nacos2:8848 nacos3:8848
      SPRING_DATASOURCE_PLATFORM: mysql
      MYSQL_SERVICE_HOST: nacos-mysql
      MYSQL_SERVICE_PORT: 3306
      MYSQL_SERVICE_DB_NAME: nacos_config
      MYSQL_SERVICE_USER: nacos
      MYSQL_SERVICE_PASSWORD: nacos
      JVM_XMS: 512m
      JVM_XMX: 512m
      JVM_XMN: 256m
    ports:
      - "8848:8848"     # HTTP API + Console
      - "9848:9848"     # gRPC client
      - "9849:9849"     # gRPC server (inter-node)
    depends_on:
      nacos-mysql:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8848/nacos/actuator/health"]
      interval: 15s
      timeout: 5s
      retries: 10
    networks:
      - nacos-net

  # ============ Nacos Node 2 ============
  nacos2:
    image: nacos/nacos-server:v2.4.3
    container_name: nacos2
    environment:
      MODE: cluster
      NACOS_SERVERS: nacos1:8848 nacos2:8848 nacos3:8848
      SPRING_DATASOURCE_PLATFORM: mysql
      MYSQL_SERVICE_HOST: nacos-mysql
      MYSQL_SERVICE_PORT: 3306
      MYSQL_SERVICE_DB_NAME: nacos_config
      MYSQL_SERVICE_USER: nacos
      MYSQL_SERVICE_PASSWORD: nacos
      JVM_XMS: 512m
      JVM_XMX: 512m
    ports:
      - "8849:8848"
      - "9850:9848"
    depends_on:
      nacos-mysql:
        condition: service_healthy
    networks:
      - nacos-net

  # ============ Nacos Node 3 ============
  nacos3:
    image: nacos/nacos-server:v2.4.3
    container_name: nacos3
    environment:
      MODE: cluster
      NACOS_SERVERS: nacos1:8848 nacos2:8848 nacos3:8848
      SPRING_DATASOURCE_PLATFORM: mysql
      MYSQL_SERVICE_HOST: nacos-mysql
      MYSQL_SERVICE_PORT: 3306
      MYSQL_SERVICE_DB_NAME: nacos_config
      MYSQL_SERVICE_USER: nacos
      MYSQL_SERVICE_PASSWORD: nacos
      JVM_XMS: 512m
      JVM_XMX: 512m
    ports:
      - "8850:8848"
      - "9851:9848"
    depends_on:
      nacos-mysql:
        condition: service_healthy
    networks:
      - nacos-net

  # ============ Nginx Load Balancer ============
  nacos-nginx:
    image: nginx:alpine
    container_name: nacos-nginx
    ports:
      - "80:80"         # Clients connect here
    volumes:
      - ./nginx/nacos.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - nacos1
      - nacos2
      - nacos3
    networks:
      - nacos-net

networks:
  nacos-net:
    driver: bridge

volumes:
  mysql_data:
```

### 7.2 Nginx Config

```nginx
# nginx/nacos.conf
upstream nacos_cluster {
    server nacos1:8848;
    server nacos2:8848;
    server nacos3:8848;
}

server {
    listen 80;
    
    location /nacos {
        proxy_pass http://nacos_cluster;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 7.3 Khởi Động & Kiểm Tra

```bash
# Khởi động
docker compose up -d

# Kiểm tra health
curl http://localhost:8848/nacos/actuator/health
# → {"status":"UP"}

# Mở Nacos Console
# URL: http://localhost:8848/nacos
# Login: nacos / nacos

# Kiểm tra cluster members
curl "http://localhost:8848/nacos/v1/core/cluster/nodes"
```

---

## 8. Tính Năng Nâng Cao — Gray Release, Weight Routing, Feature Flags

### 8.1 Weight Routing

```
Kịch bản: Deploy v2, nhưng chỉ muốn 10% traffic đi vào v2

Nacos Console → Service Management → order-service:
  Instance 10.0.1.5:8080 (v1): weight = 90
  Instance 10.0.1.6:8080 (v2): weight = 10

→ 90% requests → v1
→ 10% requests → v2

Nếu v2 ổn → tăng dần weight → 50/50 → 0/100 → xong canary release
```

```java
// Cấu hình NacosRule cho weight-based load balancing
@Configuration
public class LoadBalancerConfig {
    @Bean
    public IRule nacosRule() {
        return new NacosRule();  // Tự động dùng weight từ Nacos
    }
}
```

### 8.2 Gray Release cho Config

```
Kịch bản: Thay đổi config, nhưng chỉ muốn test trên 2 instances trước

Nacos Console → Configuration → order-service.yml → "Beta Release":
  Target IPs: 10.0.1.5, 10.0.1.6
  New config: order.maxItems=200

→ Chỉ 2 instances nhận config mới
→ 8 instances còn lại giữ config cũ
→ Test OK → "Stop Beta" → publish cho tất cả
```

### 8.3 Feature Flags

```yaml
# Nacos Console → order-service.yml
feature:
  new-checkout: false       # Tắt feature mới
  dark-mode: true           # Bật dark mode
  max-concurrent-orders: 50 # Giới hạn
  ab-test-variant: "B"      # A/B test
```

```java
@RestController
@RefreshScope
public class CheckoutController {

    @Value("${feature.new-checkout:false}")
    private boolean newCheckoutEnabled;

    @PostMapping("/api/checkout")
    public CheckoutResponse checkout(@RequestBody CheckoutRequest req) {
        if (newCheckoutEnabled) {
            return newCheckoutFlow(req);    // New flow
        } else {
            return legacyCheckoutFlow(req); // Legacy flow
        }
    }
}

// Đổi feature.new-checkout = true trên Nacos Console
// → Tất cả instances chuyển sang new flow NGAY LẬP TỨC
// → Không cần redeploy!
```

---

## 9. Lợi Ích Tổng Hợp — Nacos Đem Lại Gì?

### 9.1 Bảng Lợi Ích Theo Vai Trò

| Vai trò | Lợi ích | So với không dùng Nacos |
|---|---|---|
| **Developer** | Gọi service bằng tên, không hardcode IP | Phải quản lý IP lists, sửa code khi scale |
| **Developer** | Config thay đổi không cần redeploy | Phải rebuild, redeploy, restart |
| **DevOps** | Dashboard UI xem tất cả services/config | SSH vào từng server, check logs |
| **DevOps** | 1-click rollback config khi có lỗi | Phải revert code, rebuild, redeploy |
| **QA** | Gray release test feature trên subset | Deploy toàn bộ hoặc không deploy |
| **Architect** | Multi-env isolation (dev/staging/prod) | Quản lý config files riêng biệt |
| **SRE** | Real-time health dashboard | Tự build monitoring |
| **Business** | Feature flags bật/tắt tức thì | Chờ dev deploy, downtime |

### 9.2 So Sánh Trước/Sau

```
┌──────────────────────────────┬──────────────────────────────────┐
│       TRƯỚC (Không Nacos)    │       SAU (Có Nacos)             │
├──────────────────────────────┼──────────────────────────────────┤
│ Config trong file, cần       │ Config trên Nacos Console,       │
│ redeploy để thay đổi         │ thay đổi real-time               │
│                              │                                  │
│ Service gọi nhau bằng IP     │ Service gọi bằng tên,            │
│ cố định, scale = sửa config  │ tự động phát hiện instance mới   │
│                              │                                  │
│ Feature toggle = code flag   │ Feature toggle = config change   │
│ + deploy                     │ trên UI, không deploy            │
│                              │                                  │
│ Mỗi env (dev/prod) quản lý  │ Namespace cách ly hoàn toàn,     │
│ config riêng, dễ sai         │ 1 dashboard quản lý tất cả      │
│                              │                                  │
│ Service crash → manual       │ Health check tự động,            │
│ discovery lại                │ remove unhealthy instances       │
│                              │                                  │
│ Canary release = phức tạp    │ Weight routing + gray release    │
│                              │ trên UI                          │
│                              │                                  │
│ Config rollback = git revert │ 1-click rollback trên Console    │
│ + rebuild + redeploy         │                                  │
└──────────────────────────────┴──────────────────────────────────┘
```

---

## 10. Best Practices & Pitfalls

### 10.1 Best Practices

| # | Practice | Lý do |
|---|---|---|
| 1 | **Dùng Namespace cho mỗi env** (dev/staging/prod) | Cách ly hoàn toàn, tránh sai config |
| 2 | **Shared config cho infra** (Redis, DB, logging) | Thay đổi 1 chỗ, áp dụng tất cả services |
| 3 | **`@ConfigurationProperties` thay `@Value`** | Gom nhóm config, type-safe, dễ test |
| 4 | **Gray release trước khi publish** | Giảm risk config sai ảnh hưởng toàn bộ |
| 5 | **MySQL cluster cho production** | Nacos standalone MySQL = SPOF |
| 6 | **Nginx/SLB trước Nacos cluster** | Client connect 1 endpoint, HA transparent |
| 7 | **Monitor Nacos với Prometheus** | Nacos expose metrics tại `/nacos/actuator/prometheus` |
| 8 | **Backup MySQL daily** | Config data = critical business data |
| 9 | **Set `refresh-enabled: false` cho static config** | Giảm unnecessary refresh overhead |
| 10 | **Version tag config changes** | Audit trail, easy rollback |

### 10.2 Common Pitfalls

| Pitfall | Hậu quả | Giải pháp |
|---|---|---|
| Dùng cùng namespace cho dev và prod | Config prod bị ghi đè bởi dev | Tạo namespace riêng mỗi env |
| Không set `@RefreshScope` | Config thay đổi nhưng app không nhận | Luôn thêm `@RefreshScope` trên bean cần dynamic |
| Lưu sensitive data (password) không mã hóa | Security risk trên Nacos Console | Dùng Nacos config encryption hoặc Vault |
| Quá nhiều config listener | Performance degradation | Gom config, giảm số DataIDs |
| Không handle config parse error | App crash khi config format sai | Wrap config reading trong try-catch, dùng defaults |
| Standalone mode cho production | Single point of failure | Luôn dùng cluster mode (≥ 3 nodes) |
| Client connect trực tiếp 1 node | Không HA khi node đó down | Connect qua Nginx/SLB hoặc dùng `server-addr: node1:8848,node2:8848,node3:8848` |

### 10.3 Ports Cần Nhớ

| Port | Chức năng |
|---|---|
| **8848** | HTTP API + Web Console |
| **9848** | gRPC client port (= 8848 + 1000) |
| **9849** | gRPC inter-server port (= 8848 + 1001) |
| **7848** | Raft election port (= 8848 - 1000) |
