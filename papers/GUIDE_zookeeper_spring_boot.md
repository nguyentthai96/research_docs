# Hướng Dẫn Triển Khai ZooKeeper với Spring Boot

> **Ngày tạo**: 2026-07-22  
> **Tham chiếu**: [RESEARCH_apache_zookeeper.md](file:///home/nguyentthai96/Desktop/bigbang/research_docs/papers/RESEARCH_apache_zookeeper.md)  
> **Stack**: Spring Boot 3.x + Spring Cloud 2024/2025 + Apache Curator 5.x + ZooKeeper 3.8+

---

## Mục Lục

1. [Ý Nghĩa Ngữ Cảnh Triển Khai — Khi Nào Cần ZooKeeper?](#1-ý-nghĩa-ngữ-cảnh-triển-khai--khi-nào-cần-zookeeper)
2. [Kiến Trúc Tổng Thể](#2-kiến-trúc-tổng-thể)
3. [Thiết Lập ZooKeeper Cluster (Docker Compose)](#3-thiết-lập-zookeeper-cluster-docker-compose)
4. [Tích Hợp #1: Service Discovery](#4-tích-hợp-1-service-discovery)
5. [Tích Hợp #2: Distributed Configuration](#5-tích-hợp-2-distributed-configuration)
6. [Tích Hợp #3: Distributed Lock (Apache Curator)](#6-tích-hợp-3-distributed-lock-apache-curator)
7. [Tích Hợp #4: Leader Election](#7-tích-hợp-4-leader-election)
8. [Tổng Hợp: Project Mẫu Hoàn Chỉnh](#8-tổng-hợp-project-mẫu-hoàn-chỉnh)
9. [Production Checklist](#9-production-checklist)
10. [So Sánh: ZooKeeper vs Eureka vs Consul](#10-so-sánh-zookeeper-vs-eureka-vs-consul)

---

## 1. Ý Nghĩa Ngữ Cảnh Triển Khai — Khi Nào Cần ZooKeeper?

### 1.1 Bài Toán Cốt Lõi

Trong hệ thống microservices, bạn gặp các **bài toán phân tán** mà một ứng dụng đơn lẻ không có:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CÁC BÀI TOÁN PHÂN TÁN                       │
│                                                                 │
│  ❓ Service A muốn gọi Service B → B đang chạy ở đâu?          │
│     → SERVICE DISCOVERY                                         │
│                                                                 │
│  ❓ 10 instances cùng service → ai xử lý task critical?         │
│     → LEADER ELECTION                                           │
│                                                                 │
│  ❓ 5 instances cùng ghi database → race condition?              │
│     → DISTRIBUTED LOCK                                          │
│                                                                 │
│  ❓ Thay đổi config → phải restart tất cả instances?             │
│     → DISTRIBUTED CONFIGURATION                                 │
│                                                                 │
│  ❓ Service crash → hệ thống biết và phản ứng thế nào?           │
│     → HEALTH MONITORING / GROUP MEMBERSHIP                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**ZooKeeper giải quyết TẤT CẢ các bài toán trên** thông qua data model đơn giản (znodes + watches + ephemeral nodes).

### 1.2 Khi Nào NÊN Dùng ZooKeeper + Spring Boot?

| Ngữ cảnh | Nên dùng? | Giải thích |
|---|---|---|
| Hệ thống đã dùng Kafka (legacy ZK mode), HBase, Hadoop | ✅ **Rất nên** | ZK đã có sẵn trong infra, tận dụng luôn |
| Cần distributed lock phức tạp (reentrant, read-write) | ✅ **Rất nên** | Curator recipes mạnh nhất trong lĩnh vực này |
| Cần strong consistency cho config/metadata | ✅ **Nên** | ZK đảm bảo linearizable writes |
| Cần leader election cho scheduled tasks | ✅ **Nên** | Ephemeral + sequential znodes = tự động failover |
| Microservices đơn giản, chỉ cần service discovery | ⚠️ **Cân nhắc** | Eureka đơn giản hơn, Consul feature-rich hơn |
| Đã deploy trên Kubernetes | ❌ **Không nên** | K8s có sẵn service discovery + ConfigMap |
| Chỉ cần event-driven messaging | ❌ **Không nên** | Dùng Kafka/RabbitMQ thay thế |

### 1.3 Tại Sao Chọn ZooKeeper Thay Vì Eureka/Consul?

```
Decision Tree:

Bạn cần gì?
│
├─► Chỉ Service Discovery đơn giản?
│   └─► Eureka (đơn giản nhất, AP model)
│
├─► Service Discovery + Config + Health Check + Multi-DC?
│   └─► Consul (all-in-one, modern API)
│
├─► Distributed Lock + Leader Election + Strong Consistency?
│   └─► ZooKeeper (best-in-class coordination)
│       ↑ BẠN Ở ĐÂY
│
└─► Kubernetes-native?
    └─► Không cần external service registry
```

### 1.4 Ngữ Cảnh Thực Tế

**Scenario 1: Payment Service — Tránh Double Processing**
```
Vấn đề: 3 instances Payment Service đều nhận cùng 1 payment event
         → Nếu không lock → trừ tiền 3 lần!

Giải pháp: ZooKeeper Distributed Lock
         → Chỉ 1 instance giữ lock "/locks/payment/{orderId}"
         → 2 instances còn lại chờ hoặc skip
```

**Scenario 2: Report Generator — Chỉ 1 Instance Chạy Cron**
```
Vấn đề: 5 instances đều có @Scheduled → cùng generate report 5 lần

Giải pháp: ZooKeeper Leader Election
         → Chỉ leader instance chạy @Scheduled
         → Leader crash → instance khác tự động thay thế
```

**Scenario 3: Feature Toggle — Thay Đổi Config Realtime**
```
Vấn đề: Muốn bật/tắt feature flag → phải redeploy?

Giải pháp: ZooKeeper Distributed Config
         → Lưu config trong znode "/config/app/feature-flags"
         → Watch → tất cả instances nhận thay đổi ngay lập tức
```

---

## 2. Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│                    MICROSERVICES PLATFORM                    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Order Svc   │  │ Payment Svc  │  │ Inventory Svc│       │
│  │ (Spring Boot)│  │ (Spring Boot)│  │ (Spring Boot)│       │
│  │              │  │              │  │              │       │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │       │
│  │ │ SC-ZK    │ │  │ │ SC-ZK    │ │  │ │ SC-ZK    │ │       │
│  │ │ Discovery│ │  │ │ Discovery│ │  │ │ Discovery│ │       │
│  │ ├──────────┤ │  │ ├──────────┤ │  │ ├──────────┤ │       │
│  │ │ SC-ZK    │ │  │ │ Curator  │ │  │ │ SC-ZK    │ │       │
│  │ │ Config   │ │  │ │ Lock     │ │  │ │ Config   │ │       │
│  │ ├──────────┤ │  │ ├──────────┤ │  │ └──────────┘ │       │
│  │ │ Curator  │ │  │ │ Curator  │ │  │              │       │
│  │ │ Leader   │ │  │ │ Leader   │ │  │              │       │
│  │ └──────────┘ │  │ └──────────┘ │  │              │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│                    ┌──────▼──────┐                           │
│                    │  ZooKeeper  │                           │
│                    │  Ensemble   │                           │
│                    │ ┌───┬───┬─┐ │                           │
│                    │ │ZK1│ZK2│ZK3│                           │
│                    │ └───┴───┴─┘ │                           │
│                    └─────────────┘                           │
│                                                             │
│  ZNode Tree:                                                │
│  /                                                          │
│  ├── /services                     ← Service Discovery      │
│  │   ├── /order-service                                     │
│  │   │   ├── /instance-001  (ephemeral)                     │
│  │   │   └── /instance-002  (ephemeral)                     │
│  │   ├── /payment-service                                   │
│  │   └── /inventory-service                                 │
│  ├── /config                       ← Distributed Config     │
│  │   ├── /order-service                                     │
│  │   │   └── data: "max.retries=3, timeout=5000"            │
│  │   └── /application              ← shared config          │
│  ├── /locks                        ← Distributed Locks      │
│  │   └── /payment/{orderId}                                 │
│  └── /leader-election              ← Leader Election        │
│      └── /report-generator                                  │
│          ├── /candidate-0000000001 (ephemeral sequential)    │
│          └── /candidate-0000000002 (ephemeral sequential)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Thiết Lập ZooKeeper Cluster (Docker Compose)

### 3.1 Single Node — Development

```yaml
# docker-compose-dev.yml
version: '3.8'

services:
  zookeeper:
    image: zookeeper:3.9
    container_name: zookeeper-dev
    ports:
      - "2181:2181"
      - "8080:8080"    # AdminServer (metrics, health)
    environment:
      ZOO_MY_ID: 1
      ZOO_TICK_TIME: 2000
    volumes:
      - zk_data:/data
      - zk_datalog:/datalog
    networks:
      - dev-net

networks:
  dev-net:
    driver: bridge

volumes:
  zk_data:
  zk_datalog:
```

### 3.2 3-Node Cluster — Staging/Production

```yaml
# docker-compose-cluster.yml
version: '3.8'

services:
  zk1:
    image: zookeeper:3.9
    container_name: zk1
    ports:
      - "2181:2181"
    environment:
      ZOO_MY_ID: 1
      ZOO_SERVERS: server.1=zk1:2888:3888;2181 server.2=zk2:2888:3888;2181 server.3=zk3:2888:3888;2181
      ZOO_TICK_TIME: 2000
      ZOO_INIT_LIMIT: 10
      ZOO_SYNC_LIMIT: 5
      ZOO_AUTOPURGE_SNAP_RETAIN_COUNT: 5
      ZOO_AUTOPURGE_PURGE_INTERVAL: 24
    volumes:
      - zk1_data:/data
      - zk1_datalog:/datalog
    networks:
      - zk-net

  zk2:
    image: zookeeper:3.9
    container_name: zk2
    ports:
      - "2182:2181"
    environment:
      ZOO_MY_ID: 2
      ZOO_SERVERS: server.1=zk1:2888:3888;2181 server.2=zk2:2888:3888;2181 server.3=zk3:2888:3888;2181
      ZOO_TICK_TIME: 2000
      ZOO_INIT_LIMIT: 10
      ZOO_SYNC_LIMIT: 5
    volumes:
      - zk2_data:/data
      - zk2_datalog:/datalog
    networks:
      - zk-net

  zk3:
    image: zookeeper:3.9
    container_name: zk3
    ports:
      - "2183:2181"
    environment:
      ZOO_MY_ID: 3
      ZOO_SERVERS: server.1=zk1:2888:3888;2181 server.2=zk2:2888:3888;2181 server.3=zk3:2888:3888;2181
      ZOO_TICK_TIME: 2000
      ZOO_INIT_LIMIT: 10
      ZOO_SYNC_LIMIT: 5
    volumes:
      - zk3_data:/data
      - zk3_datalog:/datalog
    networks:
      - zk-net

networks:
  zk-net:
    driver: bridge

volumes:
  zk1_data:
  zk1_datalog:
  zk2_data:
  zk2_datalog:
  zk3_data:
  zk3_datalog:
```

### 3.3 Kiểm Tra Cluster

```bash
# Kiểm tra trạng thái mỗi node
echo ruok | nc localhost 2181    # → imok
echo ruok | nc localhost 2182    # → imok
echo ruok | nc localhost 2183    # → imok

# Xem mode (leader/follower)
echo stat | nc localhost 2181 | grep Mode
echo stat | nc localhost 2182 | grep Mode
echo stat | nc localhost 2183 | grep Mode

# Kết nối bằng zkCli
docker exec -it zk1 zkCli.sh -server localhost:2181
```

---

## 4. Tích Hợp #1: Service Discovery

### 4.1 Ý Nghĩa

```
TRƯỚC (hardcode):                    SAU (ZooKeeper Discovery):
                                     
Order Service                        Order Service
  → http://10.0.1.5:8080/pay           → "payment-service" 
  (IP cố định, nếu đổi → sửa code)       ↓ ZK lookup
                                       → http://10.0.1.5:8080/pay
                                       → http://10.0.1.6:8080/pay  (load balanced)
                                       → http://10.0.1.7:8080/pay
```

Service Discovery = **các service tự đăng ký mình vào ZooKeeper**, các service khác **tra cứu** để tìm địa chỉ.

### 4.2 Dependencies (pom.xml)

```xml
<!-- Spring Boot Parent -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.5</version>
</parent>

<!-- Spring Cloud BOM -->
<dependencyManagement>
    <dependencies>
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
    
    <!-- ZooKeeper Service Discovery -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-zookeeper-discovery</artifactId>
    </dependency>
    
    <!-- OpenFeign (optional - declarative REST client) -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-openfeign</artifactId>
    </dependency>
    
    <!-- LoadBalancer -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-loadbalancer</artifactId>
    </dependency>
</dependencies>
```

### 4.3 Configuration (application.yml)

```yaml
# --- Service A: Order Service ---
server:
  port: 8081

spring:
  application:
    name: order-service    # ← Tên này sẽ đăng ký vào ZooKeeper
  cloud:
    zookeeper:
      connect-string: localhost:2181       # Dev: single node
      # connect-string: zk1:2181,zk2:2181,zk3:2181  # Prod: cluster
      discovery:
        enabled: true
        root: /services                    # Root znode cho service registry
        instance-host: ${HOST:localhost}    # Host advertised cho các service khác
```

### 4.4 Main Application

```java
package com.example.orderservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient    // ← Đăng ký service vào ZooKeeper
@EnableFeignClients       // ← Cho phép dùng Feign client
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
```

### 4.5 Gọi Service Khác Qua Feign

```java
// Feign Client — gọi Payment Service qua tên, KHÔNG cần IP
@FeignClient(name = "payment-service")  // ← Tên đăng ký trong ZooKeeper
public interface PaymentServiceClient {

    @PostMapping("/api/payments")
    PaymentResponse createPayment(@RequestBody PaymentRequest request);

    @GetMapping("/api/payments/{id}")
    PaymentResponse getPayment(@PathVariable String id);
}

// Sử dụng trong Controller
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private PaymentServiceClient paymentClient;

    @PostMapping
    public OrderResponse createOrder(@RequestBody OrderRequest request) {
        // Feign tự động:
        // 1. Tra cứu "payment-service" trong ZooKeeper
        // 2. Load balance giữa các instances
        // 3. Gọi HTTP request
        PaymentResponse payment = paymentClient.createPayment(
            new PaymentRequest(request.getOrderId(), request.getAmount())
        );
        
        return new OrderResponse(request.getOrderId(), payment.getStatus());
    }
}
```

### 4.6 Xem Service Đã Đăng Ký

```bash
# Dùng zkCli kiểm tra
docker exec -it zk1 zkCli.sh

# Liệt kê services
ls /services
# → [order-service, payment-service, inventory-service]

# Xem instances của order-service
ls /services/order-service
# → [instance-id-xxxx-xxxx]

# Xem chi tiết instance
get /services/order-service/instance-id-xxxx-xxxx
# → {"name":"order-service","address":"10.0.1.5","port":8081,...}
```

---

## 5. Tích Hợp #2: Distributed Configuration

### 5.1 Ý Nghĩa

```
TRƯỚC (application.yml cố định):     SAU (ZooKeeper Config):

max.retries=3                        ZK: /config/order-service/max.retries = 5
(muốn đổi → rebuild, redeploy)      → Thay đổi trong ZK
                                     → TẤT CẢ instances nhận giá trị mới
                                     → KHÔNG cần restart
```

### 5.2 Dependencies

```xml
<!-- Thêm vào pom.xml -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-zookeeper-config</artifactId>
</dependency>
```

### 5.3 Configuration

```yaml
# application.yml
spring:
  application:
    name: order-service
  config:
    import: "zookeeper:"    # ← Spring Boot 3.x style (thay bootstrap.yml)
  cloud:
    zookeeper:
      connect-string: localhost:2181
      config:
        enabled: true
        root: /config                         # Root znode cho config
        default-context: application           # Shared config cho tất cả services
        profile-separator: ','
```

### 5.4 Tạo Config Trong ZooKeeper

```bash
# Dùng zkCli
docker exec -it zk1 zkCli.sh

# Config riêng cho order-service
create /config ""
create /config/order-service ""
create /config/order-service/max.retries "5"
create /config/order-service/payment.timeout "3000"
create /config/order-service/feature.new-checkout "true"

# Config chung cho TẤT CẢ services
create /config/application ""
create /config/application/logging.level "INFO"
create /config/application/cors.allowed-origins "https://myapp.com"
```

### 5.5 Đọc Config Trong Spring Boot

```java
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    // Tự động bind từ ZooKeeper znode
    @Value("${max.retries:3}")
    private int maxRetries;

    @Value("${payment.timeout:5000}")
    private long paymentTimeout;

    @Value("${feature.new-checkout:false}")
    private boolean newCheckoutEnabled;

    @GetMapping("/config")
    public Map<String, Object> getConfig() {
        return Map.of(
            "maxRetries", maxRetries,
            "paymentTimeout", paymentTimeout,
            "newCheckoutEnabled", newCheckoutEnabled
        );
    }
}
```

### 5.6 Dynamic Refresh (Không Restart)

```java
// Dùng @RefreshScope để enable hot-reload
@RestController
@RefreshScope    // ← Khi config thay đổi, bean này được recreate
@RequestMapping("/api/orders")
public class OrderController {

    @Value("${feature.new-checkout:false}")
    private boolean newCheckoutEnabled;
    
    // ...
}

// Thay đổi config trong ZK:
// set /config/order-service/feature.new-checkout "false"
// → Spring nhận watch event → refresh bean → giá trị cập nhật!
```

---

## 6. Tích Hợp #3: Distributed Lock (Apache Curator)

### 6.1 Ý Nghĩa

```
TRƯỚC (không lock):                   SAU (ZooKeeper Lock):

Instance 1: processPayment(order-123)  Instance 1: acquire lock(/locks/pay/order-123)
Instance 2: processPayment(order-123)              → GOT LOCK → process → release
Instance 3: processPayment(order-123)  Instance 2: acquire lock → WAITING...
→ TRỪU TIỀN 3 LẦN! 💀                Instance 3: acquire lock → WAITING...
                                       → CHỈ XỬ LÝ 1 LẦN ✅
```

### 6.2 Dependencies

```xml
<!-- Apache Curator -->
<dependency>
    <groupId>org.apache.curator</groupId>
    <artifactId>curator-recipes</artifactId>
    <version>5.7.1</version>
</dependency>
<dependency>
    <groupId>org.apache.curator</groupId>
    <artifactId>curator-framework</artifactId>
    <version>5.7.1</version>
</dependency>
```

### 6.3 CuratorFramework Bean

```java
package com.example.config;

import org.apache.curator.framework.CuratorFramework;
import org.apache.curator.framework.CuratorFrameworkFactory;
import org.apache.curator.retry.ExponentialBackoffRetry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ZooKeeperConfig {

    @Value("${spring.cloud.zookeeper.connect-string:localhost:2181}")
    private String connectString;

    @Bean(initMethod = "start", destroyMethod = "close")
    public CuratorFramework curatorFramework() {
        return CuratorFrameworkFactory.builder()
                .connectString(connectString)
                .sessionTimeoutMs(30000)          // 30s session timeout
                .connectionTimeoutMs(15000)       // 15s connection timeout
                .retryPolicy(new ExponentialBackoffRetry(
                        1000,   // baseSleepTimeMs
                        5,      // maxRetries
                        5000    // maxSleepMs
                ))
                .namespace("myapp")               // Tất cả paths sẽ prefix /myapp/
                .build();
    }
}
```

### 6.4 Distributed Lock Service

```java
package com.example.lock;

import org.apache.curator.framework.CuratorFramework;
import org.apache.curator.framework.recipes.locks.InterProcessMutex;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Service
public class DistributedLockService {

    private static final Logger log = LoggerFactory.getLogger(DistributedLockService.class);
    
    private final CuratorFramework curator;

    public DistributedLockService(CuratorFramework curator) {
        this.curator = curator;
    }

    /**
     * Thực thi task với distributed lock.
     *
     * @param lockPath  Path trong ZooKeeper (ví dụ: /locks/payment/order-123)
     * @param timeout   Thời gian chờ acquire lock
     * @param unit      Đơn vị thời gian
     * @param task      Task cần thực thi
     * @return Kết quả từ task, hoặc null nếu không acquire được lock
     */
    public <T> T executeWithLock(String lockPath, long timeout, TimeUnit unit, 
                                  Supplier<T> task) {
        InterProcessMutex lock = new InterProcessMutex(curator, lockPath);
        
        try {
            log.info("Attempting to acquire lock: {}", lockPath);
            
            if (lock.acquire(timeout, unit)) {
                try {
                    log.info("Lock acquired: {}", lockPath);
                    return task.get();
                } finally {
                    lock.release();
                    log.info("Lock released: {}", lockPath);
                }
            } else {
                log.warn("Failed to acquire lock within timeout: {}", lockPath);
                return null;
            }
        } catch (Exception e) {
            log.error("Error during locked execution: {}", lockPath, e);
            throw new RuntimeException("Lock execution failed", e);
        }
    }

    /**
     * Overload cho void tasks.
     */
    public boolean executeWithLock(String lockPath, long timeout, TimeUnit unit, 
                                    Runnable task) {
        Boolean result = executeWithLock(lockPath, timeout, unit, () -> {
            task.run();
            return true;
        });
        return result != null;
    }
}
```

### 6.5 Sử Dụng Trong Payment Service

```java
@Service
public class PaymentService {

    private final DistributedLockService lockService;
    private final PaymentRepository paymentRepository;

    public PaymentService(DistributedLockService lockService,
                          PaymentRepository paymentRepository) {
        this.lockService = lockService;
        this.paymentRepository = paymentRepository;
    }

    public PaymentResult processPayment(String orderId, BigDecimal amount) {
        String lockPath = "/locks/payment/" + orderId;

        PaymentResult result = lockService.executeWithLock(
            lockPath, 
            10, TimeUnit.SECONDS,    // Chờ tối đa 10s
            () -> {
                // === CRITICAL SECTION — chỉ 1 instance chạy đoạn này ===
                
                // Check idempotency
                if (paymentRepository.existsByOrderId(orderId)) {
                    return PaymentResult.alreadyProcessed(orderId);
                }
                
                // Process payment
                Payment payment = new Payment(orderId, amount);
                payment.setStatus("COMPLETED");
                paymentRepository.save(payment);
                
                return PaymentResult.success(payment);
            }
        );

        if (result == null) {
            throw new PaymentException("Could not acquire lock for order: " + orderId);
        }
        
        return result;
    }
}
```

---

## 7. Tích Hợp #4: Leader Election

### 7.1 Ý Nghĩa

```
5 instances Report Service, tất cả có @Scheduled chạy lúc 2:00 AM:

TRƯỚC (không leader election):        SAU (ZooKeeper Leader Election):

Instance 1: ✅ generate report        Instance 1 (LEADER): ✅ generate report
Instance 2: ✅ generate report        Instance 2 (follower): ⏳ standby
Instance 3: ✅ generate report        Instance 3 (follower): ⏳ standby
Instance 4: ✅ generate report        Instance 4 (follower): ⏳ standby
Instance 5: ✅ generate report        Instance 5 (follower): ⏳ standby
→ 5 báo cáo trùng lặp! 💀           → 1 báo cáo duy nhất ✅

                                       Instance 1 crash → Instance 2 tự động
                                       thành LEADER → tiếp tục chạy
```

### 7.2 Leader Election Service

```java
package com.example.leader;

import org.apache.curator.framework.CuratorFramework;
import org.apache.curator.framework.recipes.leader.LeaderSelector;
import org.apache.curator.framework.recipes.leader.LeaderSelectorListenerAdapter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class LeaderElectionService extends LeaderSelectorListenerAdapter {

    private static final Logger log = LoggerFactory.getLogger(LeaderElectionService.class);
    private static final String LEADER_PATH = "/leader-election/report-generator";

    private final CuratorFramework curator;
    private final LeaderSelector leaderSelector;
    private final AtomicBoolean isLeader = new AtomicBoolean(false);

    public LeaderElectionService(CuratorFramework curator) {
        this.curator = curator;
        this.leaderSelector = new LeaderSelector(curator, LEADER_PATH, this);
        this.leaderSelector.autoRequeue(); // Tự động tham gia election lại khi mất leader
    }

    @PostConstruct
    public void start() {
        log.info("Starting leader election participation...");
        leaderSelector.start();
    }

    @PreDestroy
    public void stop() {
        log.info("Stopping leader election participation...");
        leaderSelector.close();
    }

    @Override
    public void takeLeadership(CuratorFramework client) throws Exception {
        // Method này được gọi khi instance NÀY trở thành LEADER
        log.info("🎯 THIS INSTANCE IS NOW THE LEADER!");
        isLeader.set(true);

        try {
            // Giữ leadership cho đến khi bị interrupt hoặc connection lost
            // Trong thực tế, bạn sẽ chạy logic ở đây hoặc dùng isLeader flag
            while (true) {
                Thread.sleep(5000);
                log.debug("Still the leader...");
            }
        } catch (InterruptedException e) {
            log.info("Leadership interrupted — stepping down");
            Thread.currentThread().interrupt();
        } finally {
            isLeader.set(false);
            log.info("No longer the leader");
        }
    }

    /**
     * Kiểm tra instance hiện tại có phải leader không.
     */
    public boolean isLeader() {
        return isLeader.get();
    }
}
```

### 7.3 Conditional Scheduled Task

```java
@Component
public class ReportScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReportScheduler.class);

    private final LeaderElectionService leaderElection;
    private final ReportService reportService;

    public ReportScheduler(LeaderElectionService leaderElection,
                           ReportService reportService) {
        this.leaderElection = leaderElection;
        this.reportService = reportService;
    }

    @Scheduled(cron = "0 0 2 * * ?")  // Mỗi ngày lúc 2:00 AM
    public void generateDailyReport() {
        if (!leaderElection.isLeader()) {
            log.debug("Not the leader — skipping report generation");
            return;
        }

        log.info("Leader executing daily report generation...");
        try {
            reportService.generateDailyReport();
            log.info("Daily report generated successfully");
        } catch (Exception e) {
            log.error("Failed to generate daily report", e);
        }
    }
}
```

### 7.4 Alternative: Spring Integration LeaderInitiator

```java
// Cách Spring-idiomatic hơn (không cần tự code LeaderSelector)
@Configuration
public class LeaderConfig {

    @Bean
    public LeaderInitiatorFactoryBean leaderInitiator(CuratorFramework curator) {
        return new LeaderInitiatorFactoryBean()
                .setClient(curator)
                .setPath("/leader-election/report-generator");
    }

    // Listen leader events
    @EventListener
    public void onLeaderGranted(OnGrantedEvent event) {
        log.info("Leadership GRANTED: {}", event.getRole());
        // Bắt đầu chạy scheduled tasks
    }

    @EventListener
    public void onLeaderRevoked(OnRevokedEvent event) {
        log.info("Leadership REVOKED: {}", event.getRole());
        // Dừng scheduled tasks
    }
}
```

---

## 8. Tổng Hợp: Project Mẫu Hoàn Chỉnh

### 8.1 Cấu Trúc Thư Mục

```
order-service/
├── pom.xml
├── docker-compose.yml
├── src/main/java/com/example/orderservice/
│   ├── OrderServiceApplication.java
│   ├── config/
│   │   └── ZooKeeperConfig.java           # CuratorFramework bean
│   ├── controller/
│   │   └── OrderController.java
│   ├── service/
│   │   ├── OrderService.java
│   │   └── PaymentService.java
│   ├── feign/
│   │   └── PaymentServiceClient.java      # Feign client (discovery)
│   ├── lock/
│   │   └── DistributedLockService.java    # Curator lock wrapper
│   └── leader/
│       ├── LeaderElectionService.java     # Leader election
│       └── ReportScheduler.java           # Conditional scheduling
└── src/main/resources/
    └── application.yml
```

### 8.2 application.yml Hoàn Chỉnh

```yaml
server:
  port: 8081

spring:
  application:
    name: order-service

  # === ZooKeeper Config Import (Spring Boot 3.x) ===
  config:
    import: "optional:zookeeper:"   # 'optional:' → không fail nếu ZK down

  cloud:
    zookeeper:
      connect-string: ${ZK_CONNECT_STRING:localhost:2181}
      
      # --- Service Discovery ---
      discovery:
        enabled: true
        root: /services
        register: true                # Tự đăng ký service
        instance-host: ${HOST:localhost}
      
      # --- Distributed Config ---
      config:
        enabled: true
        root: /config
        default-context: application  # Shared config path
        profile-separator: ','

# === Logging ===
logging:
  level:
    org.apache.curator: WARN
    org.apache.zookeeper: WARN
    com.example: DEBUG

# === Actuator (health check) ===
management:
  endpoints:
    web:
      exposure:
        include: health,info,refresh
  health:
    zookeeper:
      enabled: true                  # ZK health indicator
```

### 8.3 docker-compose.yml Hoàn Chỉnh

```yaml
version: '3.8'

services:
  # --- ZooKeeper Cluster ---
  zk1:
    image: zookeeper:3.9
    environment:
      ZOO_MY_ID: 1
      ZOO_SERVERS: server.1=zk1:2888:3888;2181 server.2=zk2:2888:3888;2181 server.3=zk3:2888:3888;2181
    volumes:
      - zk1_data:/data
      - zk1_datalog:/datalog
    networks:
      - app-net

  zk2:
    image: zookeeper:3.9
    environment:
      ZOO_MY_ID: 2
      ZOO_SERVERS: server.1=zk1:2888:3888;2181 server.2=zk2:2888:3888;2181 server.3=zk3:2888:3888;2181
    volumes:
      - zk2_data:/data
      - zk2_datalog:/datalog
    networks:
      - app-net

  zk3:
    image: zookeeper:3.9
    environment:
      ZOO_MY_ID: 3
      ZOO_SERVERS: server.1=zk1:2888:3888;2181 server.2=zk2:2888:3888;2181 server.3=zk3:2888:3888;2181
    volumes:
      - zk3_data:/data
      - zk3_datalog:/datalog
    networks:
      - app-net

  # --- Order Service (2 instances) ---
  order-service-1:
    build: .
    ports:
      - "8081:8081"
    environment:
      ZK_CONNECT_STRING: zk1:2181,zk2:2181,zk3:2181
      HOST: order-service-1
      SERVER_PORT: 8081
    depends_on:
      - zk1
      - zk2
      - zk3
    networks:
      - app-net

  order-service-2:
    build: .
    ports:
      - "8082:8081"
    environment:
      ZK_CONNECT_STRING: zk1:2181,zk2:2181,zk3:2181
      HOST: order-service-2
      SERVER_PORT: 8081
    depends_on:
      - zk1
      - zk2
      - zk3
    networks:
      - app-net

networks:
  app-net:
    driver: bridge

volumes:
  zk1_data:
  zk1_datalog:
  zk2_data:
  zk2_datalog:
  zk3_data:
  zk3_datalog:
```

---

## 9. Production Checklist

### 9.1 ZooKeeper Cluster

| # | Hạng mục | Trạng thái |
|---|---|---|
| 1 | Deploy 3 hoặc 5 nodes (số lẻ) | ☐ |
| 2 | Mỗi node trên máy/rack riêng | ☐ |
| 3 | SSD cho `dataLogDir` (transaction log) | ☐ |
| 4 | `autopurge` đã bật (tránh đầy disk) | ☐ |
| 5 | `vm.swappiness=1` trên mỗi server | ☐ |
| 6 | Ulimit `nofile` ≥ 65535 | ☐ |
| 7 | Monitoring (Prometheus/Grafana hoặc 4-letter-words) | ☐ |
| 8 | SASL + TLS đã cấu hình | ☐ |
| 9 | ACL cho tất cả znodes production | ☐ |
| 10 | Backup strategy cho snapshots | ☐ |

### 9.2 Spring Boot Application

| # | Hạng mục | Trạng thái |
|---|---|---|
| 1 | `connect-string` sử dụng tất cả ZK nodes | ☐ |
| 2 | `RetryPolicy` đã cấu hình (ExponentialBackoff) | ☐ |
| 3 | Lock timeout hợp lý (không quá ngắn/dài) | ☐ |
| 4 | Graceful shutdown xử lý lock release | ☐ |
| 5 | Health endpoint `/actuator/health` check ZK | ☐ |
| 6 | `optional:zookeeper:` trong config import (graceful degradation) | ☐ |
| 7 | Idempotency trong critical sections (lock + double-check) | ☐ |
| 8 | Logging cho lock acquire/release events | ☐ |
| 9 | Circuit breaker cho ZK-dependent operations | ☐ |
| 10 | Load test với simulated ZK failure | ☐ |

### 9.3 Common Pitfalls

| Lỗi thường gặp | Hậu quả | Giải pháp |
|---|---|---|
| Không set lock timeout | Thread block vĩnh viễn | Luôn dùng `lock.acquire(timeout, unit)` |
| Session timeout quá ngắn | Ephemeral nodes bị xóa sai → mất lock | Tối thiểu `2 * tickTime` |
| Không handle `ConnectionLossException` | App crash khi ZK tạm mất kết nối | Dùng Curator retry policy |
| Lưu data lớn trong znode | ZK chậm, OOM | Chỉ lưu metadata (< 1KB/znode) |
| Quá nhiều watches | ZK server bị quá tải | Gom watches, dùng PathChildrenCache |
| Không `autoRequeue()` trong LeaderSelector | Instance không tự tham gia election lại | Luôn gọi `autoRequeue()` |

---

## 10. So Sánh: ZooKeeper vs Eureka vs Consul

```
┌─────────────────────────────────────────────────────────────────┐
│                        QUYẾT ĐỊNH NÊN DÙNG GÌ?                 │
│                                                                 │
│  ┌───────────────────┐                                          │
│  │ Bạn cần gì?       │                                          │
│  └────────┬──────────┘                                          │
│           │                                                     │
│     ┌─────▼──────┐     ┌──────────────────────────────────────┐ │
│     │ Chỉ Service│ YES │ Netflix Eureka                       │ │
│     │ Discovery? ├────►│ • Đơn giản nhất                      │ │
│     │            │     │ • AP model (availability > consistency│ │
│     └─────┬──────┘     │ • Tích hợp sâu Spring Cloud          │ │
│           │ NO         └──────────────────────────────────────┘ │
│     ┌─────▼──────┐     ┌──────────────────────────────────────┐ │
│     │ Discovery +│ YES │ HashiCorp Consul                     │ │
│     │ Config +   ├────►│ • All-in-one solution                │ │
│     │ Health +   │     │ • Multi-DC native                    │ │
│     │ Multi-DC?  │     │ • Service mesh (Consul Connect)      │ │
│     └─────┬──────┘     │ • Modern REST/DNS API                │ │
│           │ NO         └──────────────────────────────────────┘ │
│     ┌─────▼──────┐     ┌──────────────────────────────────────┐ │
│     │ Distributed│ YES │ Apache ZooKeeper + Curator            │ │
│     │ Lock +     ├────►│ • Best-in-class coordination          │ │
│     │ Leader +   │     │ • Strong consistency (CP model)       │ │
│     │ Complex    │     │ • Hierarchical data model             │ │
│     │ Coordina-  │     │ • Mature, battle-tested               │ │
│     │ tion?      │     │ • Đã có trong Big Data infra          │ │
│     └─────┬──────┘     └──────────────────────────────────────┘ │
│           │ NO                                                  │
│     ┌─────▼──────┐     ┌──────────────────────────────────────┐ │
│     │ Kubernetes?│ YES │ Không cần external service registry   │ │
│     │            ├────►│ • K8s Services + DNS                  │ │
│     │            │     │ • ConfigMap / Secrets                  │ │
│     └────────────┘     │ • etcd (đã tích hợp)                  │ │
│                        └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

| Tiêu chí | Eureka | Consul | ZooKeeper |
|---|---|---|---|
| **CAP** | AP | CP | CP |
| **Service Discovery** | ✅ Core | ✅ Core | ✅ Via recipes |
| **Config Management** | ❌ External | ✅ Built-in KV | ✅ Hierarchical |
| **Distributed Lock** | ❌ | ⚠️ Sessions-based | ✅ Curator recipes |
| **Leader Election** | ❌ | ⚠️ Sessions-based | ✅ Curator recipes |
| **Health Checks** | Heartbeat | Active polling | Client-side |
| **Multi-DC** | ❌ | ✅ Native | ⚠️ Manual |
| **Learning Curve** | Thấp | Trung bình | Cao |
| **Spring Integration** | Rất tốt | Tốt | Tốt |
| **Operational Complexity** | Thấp | Trung bình | Cao |
