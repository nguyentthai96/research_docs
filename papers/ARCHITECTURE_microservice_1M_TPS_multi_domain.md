# Kiến Trúc Microservice Toàn Diện — 1M TPS, Multi-Domain, 100M+ Records

> **Ngày tạo**: 2026-07-24  
> **Mục đích**: Thiết kế kiến trúc end-to-end cho hệ thống đa domain (Booking, Loyalty, Customer, Payment)  
> **Tham chiếu**: [ANALYSIS_spring_cloud_k8s_istio_temporal_ecosystem.md](file:///home/nguyentthai96/Desktop/bigbang/research_docs/papers/ANALYSIS_spring_cloud_k8s_istio_temporal_ecosystem.md), [RESEARCH_nacos_deep_dive.md](file:///home/nguyentthai96/Desktop/bigbang/research_docs/papers/RESEARCH_nacos_deep_dive.md)

---

## Mục Lục

1. [Tổng Quan Kiến Trúc — Big Picture](#1-tổng-quan-kiến-trúc--big-picture)
2. [Multi-Domain DDD — Bounded Contexts & Provider Pattern](#2-multi-domain-ddd--bounded-contexts--provider-pattern)
3. [Data Architecture — CQRS, Event Sourcing, Outbox](#3-data-architecture--cqrs-event-sourcing-outbox)
4. [Sharding & Partitioning — 100M+ Records](#4-sharding--partitioning--100m-records)
5. [Pagination Tối Ưu — Cursor-Based & Partition-Aware](#5-pagination-tối-ưu--cursor-based--partition-aware)
6. [Cache Strategy — Multi-Level L1/L2](#6-cache-strategy--multi-level-l1l2)
7. [Business Modules — Repository, Unit of Work, CRUD](#7-business-modules--repository-unit-of-work-crud)
8. [Distributed Tracing — Request/Response Full Pipeline](#8-distributed-tracing--requestresponse-full-pipeline)
9. [Resilience & Security — Gateway, Circuit Breaker, Idempotency](#9-resilience--security--gateway-circuit-breaker-idempotency)
10. [Workflow Orchestration — Temporal Saga](#10-workflow-orchestration--temporal-saga)
11. [Infrastructure Stack & Observability](#11-infrastructure-stack--observability)
12. [Checklist Thiết Kế Đầy Đủ](#12-checklist-thiết-kế-đầy-đủ)

---

## 1. Tổng Quan Kiến Trúc — Big Picture

### 1.1 Kiến Trúc Phân Tầng

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SYSTEM ARCHITECTURE — 1M TPS                      │
│                                                                             │
│  ┌── LAYER 7: CLIENTS ────────────────────────────────────────────────────┐ │
│  │  Web App (React/Vue)  │  Mobile App (iOS/Android)  │  Partner APIs     │ │
│  └────────────────────────────────────┬───────────────────────────────────┘ │
│                                       │                                     │
│  ┌── LAYER 6: EDGE / GATEWAY ────────▼───────────────────────────────────┐ │
│  │  CDN (CloudFront/Akamai)                                              │ │
│  │  → Static assets, geo-routing                                         │ │
│  │                                                                        │ │
│  │  API Gateway (Istio Gateway / Kong / Spring Cloud Gateway)             │ │
│  │  → Auth (JWT/OAuth2), Rate Limiting, SSL Termination                  │ │
│  │  → Request routing, A/B testing, Canary                               │ │
│  └────────────────────────────────────┬──────────────────────────────────┘ │
│                                       │                                     │
│  ┌── LAYER 5: SERVICE MESH ──────────▼───────────────────────────────────┐ │
│  │  Istio + Envoy Sidecar                                                │ │
│  │  → mTLS, Load Balancing, Circuit Breaker, Traffic Management          │ │
│  │  → Distributed Tracing (OpenTelemetry → Jaeger)                       │ │
│  └────────────────────────────────────┬──────────────────────────────────┘ │
│                                       │                                     │
│  ┌── LAYER 4: DOMAIN SERVICES ───────▼───────────────────────────────────┐ │
│  │                                                                        │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │ │
│  │  │ Booking  │ │ Payment  │ │ Customer │ │ Loyalty  │ │Notification│  │ │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │ │  Service   │  │ │
│  │  │          │ │          │ │          │ │          │ │            │  │ │
│  │  │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │ ┌────────┐ │  │ │
│  │  │ │Domain│ │ │ │Domain│ │ │ │Domain│ │ │ │Domain│ │ │ │Domain  │ │  │ │
│  │  │ │Model │ │ │ │Model │ │ │ │Model │ │ │ │Model │ │ │ │Model   │ │  │ │
│  │  │ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │ └────────┘ │  │ │
│  │  │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │ ┌────────┐ │  │ │
│  │  │ │Provid│ │ │ │Provid│ │ │ │Provid│ │ │ │Provid│ │ │ │Provider│ │  │ │
│  │  │ │er SPI│ │ │ │er SPI│ │ │ │er SPI│ │ │ │er SPI│ │ │ │SPI     │ │  │ │
│  │  │ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │ └────────┘ │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────┘  │ │
│  └────────────────────────────────────┬──────────────────────────────────┘ │
│                                       │                                     │
│  ┌── LAYER 3: EVENT BACKBONE ────────▼───────────────────────────────────┐ │
│  │  Apache Kafka (Event Streaming)                                       │ │
│  │  → Domain Events, CQRS Projections, Saga Coordination                 │ │
│  │  → Schema Registry (Avro/Protobuf)                                    │ │
│  │                                                                        │ │
│  │  Temporal (Workflow Orchestration)                                     │ │
│  │  → Long-running Sagas, Compensation, Scheduled Jobs                   │ │
│  └────────────────────────────────────┬──────────────────────────────────┘ │
│                                       │                                     │
│  ┌── LAYER 2: DATA TIER ────────────▼───────────────────────────────────┐ │
│  │                                                                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │ │
│  │  │ PostgreSQL  │  │ MongoDB     │  │ Redis       │  │Elasticsearch│ │ │
│  │  │ (Citus)     │  │ (Document)  │  │ Cluster     │  │ (Search)    │ │ │
│  │  │             │  │             │  │             │  │             │ │ │
│  │  │ Write Model │  │ Event Store │  │ L2 Cache    │  │ Read Model  │ │ │
│  │  │ + Sharding  │  │ + Audit Log │  │ + Session   │  │ + Full-text │ │ │
│  │  │ + Partition │  │             │  │ + Rate Limit│  │ + Analytics │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌── LAYER 1: INFRASTRUCTURE ────────────────────────────────────────────┐ │
│  │  Kubernetes (EKS/GKE/AKS)  │  Istio  │  Prometheus  │  Grafana       │ │
│  │  Nacos (Config)  │  Vault (Secrets)  │  Jaeger (Tracing)              │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Các Nguyên Tắc Thiết Kế

| # | Nguyên tắc | Lý do |
|---|---|---|
| 1 | **Database-per-Service** | Loại bỏ shared DB bottleneck, independent scaling |
| 2 | **Event-Driven First** | Async decoupling, buffer traffic spikes qua Kafka |
| 3 | **CQRS** | Scale read/write independently, optimize mỗi path |
| 4 | **Stateless Services** | Horizontal scaling không giới hạn |
| 5 | **Provider SPI Pattern** | Mỗi domain có thể custom implementation |
| 6 | **Eventual Consistency** | Chấp nhận slight delay để đổi lấy throughput |
| 7 | **Idempotent Operations** | An toàn khi retry trong hệ phân tán |
| 8 | **Defense in Depth** | Security ở mọi tầng (Gateway → Mesh → Service) |

---

## 2. Multi-Domain DDD — Bounded Contexts & Provider Pattern

### 2.1 Domain Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BOUNDED CONTEXT MAP                              │
│                                                                     │
│  ┌─── CORE DOMAIN ─────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  ┌──────────────────┐         ┌──────────────────┐          │   │
│  │  │  BOOKING CONTEXT │◄─event─►│ PAYMENT CONTEXT  │          │   │
│  │  │                  │         │                  │          │   │
│  │  │ • Reservation    │         │ • Transaction    │          │   │
│  │  │ • Availability   │         │ • Refund         │          │   │
│  │  │ • Schedule       │         │ • Settlement     │          │   │
│  │  │ • Pricing        │         │ • Gateway SPI    │          │   │
│  │  └────────┬─────────┘         └────────┬─────────┘          │   │
│  │           │ event                      │ event              │   │
│  └───────────┼────────────────────────────┼────────────────────┘   │
│              │                            │                        │
│  ┌───────────▼────────────────────────────▼────────────────────┐   │
│  │                                                              │   │
│  │  ┌──────────────────┐         ┌──────────────────┐          │   │
│  │  │ CUSTOMER CONTEXT │◄─event─►│ LOYALTY CONTEXT  │          │   │
│  │  │                  │         │                  │          │   │
│  │  │ • Profile        │         │ • Points         │          │   │
│  │  │ • Auth/Identity  │         │ • Tier/Status    │          │   │
│  │  │ • Preferences    │         │ • Rewards        │          │   │
│  │  │ • Address        │         │ • Campaigns      │          │   │
│  │  └──────────────────┘         └──────────────────┘          │   │
│  │                                                              │   │
│  │  ┌──────────────────┐         ┌──────────────────┐          │   │
│  │  │NOTIFICATION CTX  │         │ REPORTING CTX    │          │   │
│  │  │                  │         │                  │          │   │
│  │  │ • Email/SMS/Push │         │ • Analytics      │          │   │
│  │  │ • Template       │         │ • Dashboard      │          │   │
│  │  │ • Channel SPI    │         │ • Export         │          │   │
│  │  └──────────────────┘         └──────────────────┘          │   │
│  │                                                              │   │
│  │  SUPPORTING DOMAINS                                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Provider SPI Pattern — Modular Custom Per Domain

```
Vấn đề: Payment Service cần hỗ trợ nhiều payment gateway 
         (Stripe, VNPay, MoMo, PayPal...) mà không sửa core logic

Giải pháp: Service Provider Interface (SPI) Pattern
```

```java
// ═══════ CORE MODULE (payment-core) ═══════

// Provider Interface — Contract
public interface PaymentProvider {
    String getProviderName();
    PaymentResult charge(ChargeRequest request);
    RefundResult refund(RefundRequest request);
    PaymentStatus checkStatus(String transactionId);
    boolean supports(String currency, String region);
}

// Provider Registry — Runtime resolution
@Component
public class PaymentProviderRegistry {
    private final Map<String, PaymentProvider> providers;

    public PaymentProviderRegistry(List<PaymentProvider> providerList) {
        this.providers = providerList.stream()
            .collect(Collectors.toMap(PaymentProvider::getProviderName, p -> p));
    }

    public PaymentProvider resolve(String currency, String region) {
        return providers.values().stream()
            .filter(p -> p.supports(currency, region))
            .findFirst()
            .orElseThrow(() -> new NoProviderException(currency, region));
    }
}

// Domain Service — Uses provider transparently
@Service
public class PaymentDomainService {
    @Autowired private PaymentProviderRegistry registry;
    @Autowired private TransactionRepository txRepo;

    @Transactional
    public PaymentResult processPayment(PaymentCommand cmd) {
        // 1. Resolve provider
        PaymentProvider provider = registry.resolve(cmd.getCurrency(), cmd.getRegion());
        
        // 2. Create transaction record (idempotent)
        Transaction tx = txRepo.findByIdempotencyKey(cmd.getIdempotencyKey())
            .orElse(Transaction.create(cmd));
        
        if (tx.isCompleted()) return tx.toResult();  // Idempotent return
        
        // 3. Charge via provider
        PaymentResult result = provider.charge(cmd.toChargeRequest());
        
        // 4. Update + emit event
        tx.markCompleted(result);
        txRepo.save(tx);
        
        return result;
    }
}

// ═══════ PROVIDER MODULE (payment-stripe) ═══════
@Component
public class StripePaymentProvider implements PaymentProvider {
    @Override public String getProviderName() { return "stripe"; }
    
    @Override
    public boolean supports(String currency, String region) {
        return Set.of("USD", "EUR", "GBP").contains(currency);
    }
    
    @Override
    public PaymentResult charge(ChargeRequest request) {
        // Stripe SDK call
        PaymentIntent intent = PaymentIntent.create(/* params */);
        return PaymentResult.from(intent);
    }
    // ...
}

// ═══════ PROVIDER MODULE (payment-vnpay) ═══════
@Component
public class VNPayPaymentProvider implements PaymentProvider {
    @Override public String getProviderName() { return "vnpay"; }
    
    @Override
    public boolean supports(String currency, String region) {
        return "VND".equals(currency) && "VN".equals(region);
    }
    // ...
}
```

```
Module structure:
├── payment-core/           ← Domain model, interfaces, domain services
│   ├── domain/
│   ├── spi/                ← PaymentProvider interface
│   └── service/
├── payment-stripe/         ← Stripe implementation
├── payment-vnpay/          ← VNPay implementation  
├── payment-momo/           ← MoMo implementation
└── payment-app/            ← Spring Boot app, wires everything
    └── depends on: core + desired providers
```

### 2.3 Tương Tự Cho Các Domain Khác

| Domain | Provider SPI | Implementations |
|---|---|---|
| **Booking** | `BookingChannelProvider` | `AirlineProvider`, `HotelProvider`, `ActivityProvider` |
| **Payment** | `PaymentProvider` | `StripeProvider`, `VNPayProvider`, `MoMoProvider` |
| **Notification** | `NotificationChannelProvider` | `EmailProvider (SES)`, `SMSProvider (Twilio)`, `PushProvider (FCM)` |
| **Loyalty** | `PointsCalculationProvider` | `StandardCalculator`, `PremiumCalculator`, `PartnerCalculator` |
| **Customer** | `IdentityProvider` | `InternalAuth`, `OAuth2Provider`, `SAMLProvider` |

---

## 3. Data Architecture — CQRS, Event Sourcing, Outbox

### 3.1 CQRS Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CQRS ARCHITECTURE                                │
│                                                                     │
│  CLIENT REQUEST                                                     │
│       │                                                             │
│       ├──── Write (POST/PUT/DELETE) ──────────────────────────┐     │
│       │                                                       │     │
│       │     ┌──────────────────────────────────────────────┐  │     │
│       │     │           COMMAND SIDE (Write)               │  │     │
│       │     │                                              │  │     │
│       │     │  ┌──────────┐  ┌──────────┐  ┌───────────┐  │  │     │
│       │     │  │ Command  │─►│ Domain   │─►│PostgreSQL │  │  │     │
│       │     │  │ Handler  │  │ Service  │  │ (Write DB)│  │  │     │
│       │     │  └──────────┘  └────┬─────┘  └───────────┘  │  │     │
│       │     │                     │                        │  │     │
│       │     │              ┌──────▼──────┐                 │  │     │
│       │     │              │   Outbox    │                 │  │     │
│       │     │              │   Table     │                 │  │     │
│       │     │              └──────┬──────┘                 │  │     │
│       │     └─────────────────────┼────────────────────────┘  │     │
│       │                           │                           │     │
│       │                    ┌──────▼──────┐                    │     │
│       │                    │   Kafka     │                    │     │
│       │                    │  (Events)   │                    │     │
│       │                    └──────┬──────┘                    │     │
│       │                           │                           │     │
│       │     ┌─────────────────────▼───────────────────────┐  │     │
│       │     │           QUERY SIDE (Read)                  │  │     │
│       │     │                                              │  │     │
│       │     │  ┌──────────┐  ┌──────────────────────────┐  │  │     │
│       │     │  │Projection│  │  Read-Optimized Stores    │  │  │     │
│       │     │  │ Workers  │─►│  • Elasticsearch (search) │  │  │     │
│       │     │  └──────────┘  │  • Redis (cache/counter)  │  │  │     │
│       │     │                │  • Materialized Views     │  │  │     │
│       │     │                └──────────────────────────┘  │  │     │
│       │     └──────────────────────────────────────────────┘  │     │
│       │                                                       │     │
│       └──── Read (GET) ──────────────────────────────────────┘     │
│              │                                                      │
│              └──► Query Handler ──► Read Store ──► Response          │
│                   (bypass Write DB entirely!)                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Transactional Outbox Pattern

```java
// Đảm bảo atomicity: save entity + publish event trong 1 transaction

@Service
public class BookingCommandService {
    @Autowired private BookingRepository bookingRepo;
    @Autowired private OutboxRepository outboxRepo;

    @Transactional  // Cả 2 save trong 1 DB transaction
    public BookingResponse createBooking(CreateBookingCommand cmd) {
        // 1. Domain logic
        Booking booking = Booking.create(cmd);
        bookingRepo.save(booking);

        // 2. Write event to Outbox table (same DB, same transaction!)
        OutboxEvent event = OutboxEvent.builder()
            .aggregateType("Booking")
            .aggregateId(booking.getId())
            .eventType("BookingCreated")
            .payload(JsonUtil.toJson(new BookingCreatedEvent(booking)))
            .build();
        outboxRepo.save(event);

        // 3. Return — Debezium CDC sẽ đọc outbox → publish lên Kafka
        return booking.toResponse();
    }
}

// Outbox table schema:
// CREATE TABLE outbox_events (
//   id            UUID PRIMARY KEY,
//   aggregate_type VARCHAR(100),
//   aggregate_id   VARCHAR(100),
//   event_type     VARCHAR(100),
//   payload        JSONB,
//   created_at     TIMESTAMPTZ DEFAULT NOW(),
//   published      BOOLEAN DEFAULT FALSE
// );
```

### 3.3 Domain Events Flow

```
BookingCreated ──► Kafka ──┬──► Payment Service (charge)
                           ├──► Notification Service (confirm email)
                           └──► Reporting Service (update dashboard)

PaymentSucceeded ──► Kafka ──┬──► Booking Service (confirm booking)
                             ├──► Loyalty Service (add points)
                             └──► Notification Service (receipt email)

PaymentFailed ──► Kafka ──┬──► Booking Service (cancel/hold)
                          └──► Notification Service (failure alert)
```

---

## 4. Sharding & Partitioning — 100M+ Records

### 4.1 Chiến Lược Phân Tầng

```
┌─────────────────────────────────────────────────────────────┐
│              DATA SCALING STRATEGY                          │
│                                                             │
│  LEVEL 1: VERTICAL OPTIMIZATION (0-10M records)            │
│  ├── Proper indexing (composite, partial, covering)         │
│  ├── Query optimization (EXPLAIN ANALYZE)                   │
│  ├── Connection pooling (HikariCP, PgBouncer)               │
│  └── Read replicas                                          │
│                                                             │
│  LEVEL 2: TABLE PARTITIONING (10M-100M records)             │
│  ├── PostgreSQL native RANGE partitioning (by date)         │
│  ├── LIST partitioning (by region/status)                   │
│  └── Partition pruning trong queries                        │
│                                                             │
│  LEVEL 3: DATABASE SHARDING (100M+ records)                 │
│  ├── Citus (PostgreSQL extension) — shard by tenant_id      │
│  ├── Application-level sharding (shard router)              │
│  └── Vitess (for MySQL) hoặc custom                        │
│                                                             │
│  LEVEL 4: POLYGLOT PERSISTENCE (1B+ records)                │
│  ├── Hot data → Redis                                       │
│  ├── Search → Elasticsearch                                 │
│  ├── Analytics → ClickHouse / BigQuery                      │
│  └── Archive → S3 / Parquet                                 │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 PostgreSQL Partitioning (100M bookings)

```sql
-- ═══ RANGE PARTITION BY TIME ═══
CREATE TABLE bookings (
    id              UUID NOT NULL,
    tenant_id       UUID NOT NULL,
    customer_id     UUID NOT NULL,
    booking_date    TIMESTAMPTZ NOT NULL,
    status          VARCHAR(20) NOT NULL,
    total_amount    DECIMAL(15,2),
    currency        VARCHAR(3),
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, booking_date)  -- partition key MUST be in PK
) PARTITION BY RANGE (booking_date);

-- Monthly partitions
CREATE TABLE bookings_2026_01 PARTITION OF bookings
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE bookings_2026_02 PARTITION OF bookings
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- ... auto-create via pg_partman or cron

-- ═══ Composite Index cho Keyset Pagination ═══
CREATE INDEX idx_bookings_tenant_date 
    ON bookings (tenant_id, booking_date DESC, id DESC);

CREATE INDEX idx_bookings_customer_date 
    ON bookings (customer_id, booking_date DESC, id DESC);

-- ═══ Partial Index (chỉ index active records) ═══
CREATE INDEX idx_bookings_active 
    ON bookings (tenant_id, booking_date DESC)
    WHERE status NOT IN ('CANCELLED', 'ARCHIVED');
```

### 4.3 Citus Sharding (Multi-tenant, billions of records)

```sql
-- Citus: Shard by tenant_id across nodes
SELECT create_distributed_table('bookings', 'tenant_id');
SELECT create_distributed_table('payments', 'tenant_id');
SELECT create_distributed_table('customers', 'tenant_id');

-- Reference tables (replicated to all nodes)
SELECT create_reference_table('currencies');
SELECT create_reference_table('booking_types');
SELECT create_reference_table('regions');

-- Co-located tables (same tenant data on same shard)
-- → JOIN giữa bookings và payments KHÔNG cần cross-shard!
```

```
Cluster topology:

┌─────────────┐
│ Coordinator │ ← Query routing, planning
└──────┬──────┘
       │
 ┌─────┼─────┬─────────┐
 │     │     │         │
 ▼     ▼     ▼         ▼
┌────┐┌────┐┌────┐ ┌────┐
│Wk 1││Wk 2││Wk 3│ │Wk 4│  ← Worker nodes
│    ││    ││    │ │    │
│T1,5││T2,6││T3,7│ │T4,8│  ← Tenant shards
└────┘└────┘└────┘ └────┘
```

---

## 5. Pagination Tối Ưu — Cursor-Based & Partition-Aware

### 5.1 Tại Sao OFFSET Thất Bại

```
OFFSET/LIMIT:  SELECT * FROM bookings ORDER BY created_at LIMIT 20 OFFSET 5000000
               → PostgreSQL phải scan QUA 5 triệu rows rồi bỏ đi!
               → Page 1: 2ms, Page 1000: 200ms, Page 100000: 20 GIÂY

Keyset/Cursor: SELECT * FROM bookings 
               WHERE (created_at, id) < ($last_date, $last_id) 
               ORDER BY created_at DESC, id DESC LIMIT 20
               → LUÔN LUÔN sử dụng index seek
               → Page 1: 2ms, Page 100000: 2ms (CONSTANT!)
```

### 5.2 Cursor-Based Pagination Implementation

```java
// ═══ DTO ═══
@Data
public class CursorPageRequest {
    private String cursor;          // Encoded cursor (base64)
    private int size = 20;          // Page size
    private String sortField = "createdAt";
    private SortDirection direction = SortDirection.DESC;
}

@Data
public class CursorPage<T> {
    private List<T> items;
    private String nextCursor;      // null = last page
    private String prevCursor;
    private boolean hasMore;
    private long totalEstimate;     // Approximate count (không COUNT(*))
}

// ═══ Cursor Codec ═══
public class CursorCodec {
    // Cursor = Base64(JSON{sortValue, id})
    public static String encode(Instant sortValue, UUID id) {
        String json = String.format("{\"sv\":\"%s\",\"id\":\"%s\"}", 
            sortValue.toString(), id.toString());
        return Base64.getUrlEncoder().encodeToString(json.getBytes());
    }
    
    public static CursorData decode(String cursor) {
        byte[] bytes = Base64.getUrlDecoder().decode(cursor);
        // Parse JSON → CursorData{sortValue, id}
        return JsonUtil.parse(new String(bytes), CursorData.class);
    }
}

// ═══ Repository (Native Query) ═══
@Repository
public class BookingCursorRepository {
    @Autowired private JdbcTemplate jdbc;

    public CursorPage<Booking> findByTenant(
            UUID tenantId, CursorPageRequest request) {
        
        StringBuilder sql = new StringBuilder(
            "SELECT * FROM bookings WHERE tenant_id = ?");
        List<Object> params = new ArrayList<>();
        params.add(tenantId);

        // Apply cursor (keyset condition)
        if (request.getCursor() != null) {
            CursorData cursor = CursorCodec.decode(request.getCursor());
            sql.append(" AND (created_at, id) < (?, ?)");
            params.add(cursor.getSortValue());
            params.add(cursor.getId());
        }

        sql.append(" ORDER BY created_at DESC, id DESC");
        sql.append(" LIMIT ?");
        params.add(request.getSize() + 1);  // Fetch 1 extra to detect hasMore

        List<Booking> results = jdbc.query(sql.toString(), 
            params.toArray(), bookingRowMapper);

        boolean hasMore = results.size() > request.getSize();
        if (hasMore) results.remove(results.size() - 1);

        String nextCursor = null;
        if (hasMore && !results.isEmpty()) {
            Booking last = results.get(results.size() - 1);
            nextCursor = CursorCodec.encode(last.getCreatedAt(), last.getId());
        }

        // Approximate count (FAST — không COUNT(*))
        long estimate = getEstimatedCount(tenantId);

        return new CursorPage<>(results, nextCursor, null, hasMore, estimate);
    }
    
    private long getEstimatedCount(UUID tenantId) {
        // Use pg statistics (instant, ~95% accurate)
        return jdbc.queryForObject(
            "SELECT reltuples::bigint FROM pg_class WHERE relname = 'bookings'",
            Long.class);
    }
}
```

### 5.3 Partition-Aware Pagination

```sql
-- Khi query LUÔN LUÔN thêm partition key để enable pruning

-- ❌ BAD: Full scan tất cả partitions
SELECT * FROM bookings 
WHERE customer_id = '123' 
ORDER BY booking_date DESC LIMIT 20;

-- ✅ GOOD: Chỉ scan partition tháng hiện tại
SELECT * FROM bookings 
WHERE customer_id = '123' 
  AND booking_date >= '2026-07-01'    -- Partition pruning!
  AND booking_date < '2026-08-01'
ORDER BY booking_date DESC, id DESC LIMIT 20;

-- ✅ BETTER: Keyset + Partition-aware
SELECT * FROM bookings 
WHERE customer_id = '123' 
  AND booking_date >= '2026-07-01'
  AND booking_date < '2026-08-01'
  AND (booking_date, id) < ($last_date, $last_id)   -- Cursor
ORDER BY booking_date DESC, id DESC 
LIMIT 20;
```

---

## 6. Cache Strategy — Multi-Level L1/L2

### 6.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              MULTI-LEVEL CACHE ARCHITECTURE                 │
│                                                             │
│  Request → ┌───────────┐  HIT → Return (< 1μs)             │
│            │ L1: LOCAL  │  Caffeine (JVM heap)              │
│            │ (per-pod)  │  TTL: 30s, Max: 10K entries       │
│            └─────┬──────┘                                   │
│                  │ MISS                                     │
│                  ▼                                          │
│            ┌───────────┐  HIT → Return + backfill L1 (<1ms) │
│            │ L2: REDIS  │  Redis Cluster                    │
│            │ (shared)   │  TTL: 5-15min                     │
│            └─────┬──────┘                                   │
│                  │ MISS                                     │
│                  ▼                                          │
│            ┌───────────┐  → Return + backfill L2 + L1       │
│            │ DATABASE   │  PostgreSQL                       │
│            │            │  Latency: 5-50ms                  │
│            └────────────┘                                   │
│                                                             │
│  INVALIDATION:                                              │
│  Write → DB → Outbox → Kafka → Cache Invalidation Consumer  │
│          → Publish Redis message → All pods clear L1        │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Spring Boot Implementation

```java
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisFactory) {
        // L1: Caffeine (local)
        CaffeineCacheManager l1 = new CaffeineCacheManager();
        l1.setCaffeine(Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofSeconds(30))
            .recordStats());

        // L2: Redis (distributed)
        RedisCacheManager l2 = RedisCacheManager.builder(redisFactory)
            .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .serializeValuesWith(
                    SerializationPair.fromSerializer(
                        new GenericJackson2JsonRedisSerializer())))
            .build();

        // Composite: L1 first, then L2
        return new CompositeCacheManager(l1, l2);
    }
}

// Usage — transparent caching
@Service
public class CustomerService {
    @Autowired private CustomerRepository repo;

    @Cacheable(value = "customers", key = "#customerId")
    public CustomerDTO getCustomer(UUID customerId) {
        return repo.findById(customerId)
            .map(CustomerDTO::from)
            .orElseThrow();
    }

    @CacheEvict(value = "customers", key = "#customerId")
    @Transactional
    public void updateCustomer(UUID customerId, UpdateCustomerCmd cmd) {
        // Update DB → @CacheEvict clears both L1 and L2
        Customer customer = repo.findById(customerId).orElseThrow();
        customer.update(cmd);
        repo.save(customer);
    }
}
```

### 6.3 Cache Cho Từng Domain

| Domain | Data cached | TTL | Strategy |
|---|---|---|---|
| **Customer** | Profile, preferences | 10 min | Cache-aside, evict on update |
| **Booking** | Availability slots | 30 sec | Short TTL, near-real-time |
| **Payment** | Exchange rates | 5 min | Scheduled refresh |
| **Loyalty** | Points balance, tier | 2 min | Cache-aside, event-driven evict |
| **Config** | Feature flags, pricing rules | 1 min | Nacos push + local cache |

---

## 7. Business Modules — Repository, Unit of Work, CRUD

### 7.1 Module Structure Per Domain

```
booking-service/
├── domain/                       ← Pure domain (no framework dependency)
│   ├── model/
│   │   ├── Booking.java          ← Aggregate Root
│   │   ├── BookingItem.java      ← Entity
│   │   ├── BookingStatus.java    ← Value Object (enum)
│   │   └── Money.java            ← Value Object
│   ├── event/
│   │   ├── BookingCreated.java   ← Domain Event
│   │   └── BookingCancelled.java
│   ├── repository/
│   │   └── BookingRepository.java  ← Interface (port)
│   └── service/
│       └── BookingDomainService.java  ← Domain logic
│
├── application/                   ← Use cases, orchestration
│   ├── command/
│   │   ├── CreateBookingCommand.java
│   │   └── CreateBookingHandler.java   ← Command Handler
│   ├── query/
│   │   ├── GetBookingQuery.java
│   │   └── GetBookingHandler.java      ← Query Handler
│   └── dto/
│       ├── BookingResponse.java
│       └── BookingListResponse.java
│
├── infrastructure/                ← Framework-specific implementations
│   ├── persistence/
│   │   ├── JpaBookingRepository.java   ← Repository impl (adapter)
│   │   ├── BookingEntity.java          ← JPA Entity
│   │   └── BookingMapper.java          ← Entity ↔ Domain mapping
│   ├── messaging/
│   │   ├── KafkaEventPublisher.java
│   │   └── BookingEventConsumer.java
│   ├── cache/
│   │   └── CachedBookingQueryService.java
│   └── provider/                  ← SPI implementations
│       ├── AirlineBookingProvider.java
│       └── HotelBookingProvider.java
│
└── api/                           ← REST controllers
    ├── BookingCommandController.java   ← POST/PUT/DELETE
    └── BookingQueryController.java     ← GET (reads from Read Model)
```

### 7.2 Unit of Work (JPA/Hibernate Built-in)

```java
// Trong Spring Boot + JPA, EntityManager = Unit of Work
// @Transactional = commit/rollback boundary

@Service
@Transactional  // Unit of Work boundary
public class BookingCommandHandler {
    @Autowired private BookingRepository bookingRepo;
    @Autowired private OutboxRepository outboxRepo;

    public BookingResponse handle(CreateBookingCommand cmd) {
        // 1. All operations tracked by EntityManager
        Booking booking = Booking.create(cmd);
        bookingRepo.save(booking);              // tracked, not committed yet

        // 2. Outbox event (same transaction)
        outboxRepo.save(OutboxEvent.of(booking.domainEvents()));

        // 3. @Transactional ends → EntityManager flush → single DB commit
        //    → Both booking AND outbox event committed atomically
        return BookingResponse.from(booking);
    }
    // If ANY exception → automatic rollback of everything
}
```

---

## 8. Distributed Tracing — Request/Response Full Pipeline

### 8.1 Tracing Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│              FULL TRACING PIPELINE                                  │
│                                                                     │
│  Client Request                                                     │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │  Headers: X-Request-ID: abc-123                         │       │
│  │           traceparent: 00-<trace-id>-<span-id>-01       │       │
│  └─────────────────┬───────────────────────────────────────┘       │
│                    │                                                │
│  ┌─────────────────▼───────────────────────────────────────────┐   │
│  │  API Gateway (span: gateway)                                │   │
│  │  → Log: traceId={trace-id} spanId={span-1} method=POST     │   │
│  │  → Add: X-Correlation-ID, X-Tenant-ID to baggage           │   │
│  └─────────────────┬───────────────────────────────────────────┘   │
│                    │ (W3C Trace Context propagated)                 │
│  ┌─────────────────▼───────────────────────────────────────────┐   │
│  │  Booking Service (span: booking-create)                     │   │
│  │  → Log: traceId={trace-id} spanId={span-2} action=create   │   │
│  │  → Child span: db-query (PostgreSQL)                        │   │
│  │  → Child span: cache-check (Redis)                          │   │
│  │  → Child span: kafka-produce (event publish)                │   │
│  └─────────────────┬───────────────────────────────────────────┘   │
│                    │ (Kafka header propagation)                     │
│  ┌─────────────────▼───────────────────────────────────────────┐   │
│  │  Payment Service (span: payment-charge)                     │   │
│  │  → Log: traceId={trace-id} spanId={span-3} provider=stripe │   │
│  │  → Child span: stripe-api-call (external)                   │   │
│  └─────────────────┬───────────────────────────────────────────┘   │
│                    │                                                │
│  ┌─────────────────▼───────────────────────────────────────────┐   │
│  │  OpenTelemetry Collector                                    │   │
│  │  → Receive all spans                                       │   │
│  │  → Process: sampling, enrichment, filtering                 │   │
│  │  → Export to:                                               │   │
│  │    ├── Jaeger (trace visualization)                         │   │
│  │    ├── Prometheus (metrics from traces)                     │   │
│  │    └── Loki (correlated logs)                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  JAEGER UI: Full request timeline with latency breakdown            │
│  ├── gateway          [2ms]                                        │
│  ├── booking-create   [15ms]                                       │
│  │   ├── cache-check  [0.5ms]                                      │
│  │   ├── db-query     [8ms]                                        │
│  │   └── kafka-pub    [3ms]                                        │
│  └── payment-charge   [250ms]                                      │
│      └── stripe-api   [230ms]                                      │
│  TOTAL: 267ms                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Spring Boot Config

```yaml
# application.yml
management:
  tracing:
    sampling:
      probability: 0.1            # 10% sampling in production
  otlp:
    tracing:
      endpoint: http://otel-collector:4318/v1/traces

logging:
  pattern:
    level: "%5p [${spring.application.name},%X{traceId},%X{spanId}]"
    # Output: INFO [booking-service,abc123def,span456] Booking created
```

---

## 9. Resilience & Security — Gateway, Circuit Breaker, Idempotency

### 9.1 Defense-in-Depth Layers

```
Layer 1: CDN           → DDoS protection, geo-filtering
Layer 2: API Gateway   → Auth, rate limit, input validation
Layer 3: Service Mesh  → mTLS, circuit breaker, retry
Layer 4: Application   → Business validation, idempotency
Layer 5: Database      → Row-level security, encryption at rest
```

### 9.2 Idempotency Key Pattern

```java
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            @RequestBody PaymentRequest request) {
        
        // Check idempotency store (Redis with TTL)
        Optional<PaymentResponse> existing = 
            idempotencyStore.get(idempotencyKey);
        
        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get());  // Same response!
        }
        
        // Process payment
        PaymentResponse response = paymentService.process(request);
        
        // Store result with TTL (24h)
        idempotencyStore.put(idempotencyKey, response, Duration.ofHours(24));
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
```

---

## 10. Workflow Orchestration — Temporal Saga

### 10.1 Booking Saga

```java
// Booking Flow: Create → Pay → Earn Points → Notify

@WorkflowInterface
public interface BookingSagaWorkflow {
    @WorkflowMethod
    BookingResult processBooking(BookingRequest request);
}

public class BookingSagaWorkflowImpl implements BookingSagaWorkflow {
    
    private final BookingActivity bookingAct = /* stub */;
    private final PaymentActivity paymentAct = /* stub */;
    private final LoyaltyActivity loyaltyAct = /* stub */;
    private final NotificationActivity notifAct = /* stub */;

    @Override
    public BookingResult processBooking(BookingRequest request) {
        // Step 1: Reserve booking
        String bookingId = bookingAct.reserve(request);
        
        try {
            // Step 2: Process payment
            String paymentId = paymentAct.charge(request.getPayment());
            
            try {
                // Step 3: Award loyalty points (non-critical, can fail)
                Workflow.newDetachedCancellationScope(() ->
                    loyaltyAct.awardPoints(request.getCustomerId(), 
                                           request.getAmount()));
                
                // Step 4: Confirm booking
                bookingAct.confirm(bookingId, paymentId);
                
                // Step 5: Send confirmation (async, fire-and-forget)
                notifAct.sendConfirmation(bookingId, request.getCustomerId());
                
                return BookingResult.success(bookingId, paymentId);
                
            } catch (Exception e) {
                // Compensate: refund payment
                paymentAct.refund(paymentId);
                throw e;
            }
        } catch (Exception e) {
            // Compensate: release reservation
            bookingAct.cancel(bookingId, e.getMessage());
            return BookingResult.failed(bookingId, e.getMessage());
        }
    }
}
```

---

## 11. Infrastructure Stack & Observability

### 11.1 Complete Tech Stack

| Layer | Component | Technology | Purpose |
|---|---|---|---|
| **Edge** | CDN | CloudFront/Cloudflare | Static assets, DDoS |
| **Edge** | API Gateway | Istio Gateway / Kong | Auth, rate limit, routing |
| **Mesh** | Service Mesh | Istio + Envoy | mTLS, LB, circuit breaker |
| **App** | Framework | Spring Boot 3.x | Business logic |
| **App** | Communication | gRPC (internal), REST (external) | Service-to-service |
| **Event** | Streaming | Apache Kafka | Event backbone |
| **Event** | Schema | Confluent Schema Registry | Event schema governance |
| **Workflow** | Orchestration | Temporal | Sagas, long-running flows |
| **Data** | Write DB | PostgreSQL + Citus | Sharded OLTP |
| **Data** | Read DB | Elasticsearch | Search, analytics |
| **Data** | Cache | Redis Cluster | L2 cache, session, lock |
| **Data** | Event Store | MongoDB (or Kafka) | Event sourcing log |
| **Config** | Config Center | Nacos / K8s ConfigMap | Dynamic config, feature flags |
| **Config** | Secrets | HashiCorp Vault | Passwords, API keys |
| **Observe** | Metrics | Prometheus + Grafana | System metrics, alerts |
| **Observe** | Tracing | OpenTelemetry → Jaeger | Distributed tracing |
| **Observe** | Logging | Loki / ELK Stack | Centralized logs |
| **Infra** | Container | Kubernetes (EKS/GKE) | Orchestration |
| **Infra** | CI/CD | GitHub Actions + ArgoCD | GitOps deployment |
| **Infra** | CDC | Debezium | Outbox → Kafka bridge |

---

## 12. Checklist Thiết Kế Đầy Đủ

### 12.1 Architecture Checklist

| # | Category | Item | Status |
|---|---|---|---|
| **1** | **DDD** | Bounded contexts defined | ☐ |
| **2** | **DDD** | Ubiquitous language documented | ☐ |
| **3** | **DDD** | Context mapping (ACL, Open Host) | ☐ |
| **4** | **DDD** | Aggregate boundaries verified | ☐ |
| **5** | **Provider** | SPI interfaces per domain | ☐ |
| **6** | **Provider** | Provider registry & resolution | ☐ |
| **7** | **Data** | Database-per-service enforced | ☐ |
| **8** | **Data** | CQRS read/write separation | ☐ |
| **9** | **Data** | Outbox pattern for event atomicity | ☐ |
| **10** | **Data** | Event schema versioning | ☐ |
| **11** | **Scale** | Table partitioning (100M+) | ☐ |
| **12** | **Scale** | Sharding strategy (Citus/tenant_id) | ☐ |
| **13** | **Scale** | Cursor-based pagination | ☐ |
| **14** | **Scale** | No COUNT(*) on large tables | ☐ |
| **15** | **Cache** | L1 (Caffeine) + L2 (Redis) | ☐ |
| **16** | **Cache** | Cache invalidation strategy | ☐ |
| **17** | **Cache** | Cache-aside pattern per domain | ☐ |
| **18** | **Trace** | OpenTelemetry instrumentation | ☐ |
| **19** | **Trace** | Correlation ID propagation | ☐ |
| **20** | **Trace** | Log-trace correlation (MDC) | ☐ |
| **21** | **Resil** | Circuit breaker (Istio + Resilience4j) | ☐ |
| **22** | **Resil** | Retry with exponential backoff | ☐ |
| **23** | **Resil** | Bulkhead (thread pool isolation) | ☐ |
| **24** | **Resil** | Rate limiting (Gateway + Redis) | ☐ |
| **25** | **Resil** | Idempotency keys (POST/PUT) | ☐ |
| **26** | **Security** | JWT/OAuth2 at Gateway | ☐ |
| **27** | **Security** | mTLS between services (Istio) | ☐ |
| **28** | **Security** | Secrets in Vault (not env vars) | ☐ |
| **29** | **Security** | Input validation (API level) | ☐ |
| **30** | **Workflow** | Temporal for complex sagas | ☐ |
| **31** | **Workflow** | Compensation logic per step | ☐ |
| **32** | **Workflow** | Scheduled jobs via Temporal | ☐ |
| **33** | **Config** | Nacos/ConfigMap dynamic refresh | ☐ |
| **34** | **Config** | Feature flags (no-deploy toggle) | ☐ |
| **35** | **Observe** | Prometheus metrics + alerts | ☐ |
| **36** | **Observe** | Grafana dashboards per domain | ☐ |
| **37** | **Observe** | SLO/SLA monitoring | ☐ |
| **38** | **Deploy** | GitOps with ArgoCD | ☐ |
| **39** | **Deploy** | Canary/Blue-Green deployment | ☐ |
| **40** | **Test** | Contract testing (Pact) | ☐ |
| **41** | **Test** | Chaos engineering (kill pods) | ☐ |
| **42** | **Test** | Load testing (k6/Gatling, target 1M TPS) | ☐ |

### 12.2 Các Vấn Đề Thường Bị Bỏ Sót — Chi Tiết

> **Tại sao section này quan trọng?**  
> Trong thực tế, hệ thống microservice thường fail không phải vì thiếu feature chính, mà vì bỏ sót các vấn đề "edge case" bên dưới. Mỗi mục sau đây đều là bài học từ production.

| # | Vấn đề | Tại sao quan trọng | Giải pháp |
|---|---|---|---|
| 1 | **Data migration strategy** | Schema evolve theo thời gian | Flyway/Liquibase + backward-compatible changes |
| 2 | **Dead letter queue (DLQ)** | Events fail → mất data | Kafka DLQ + retry topic + alerting |
| 3 | **Tenant isolation** | Noisy neighbor problem | Citus shard isolation, resource quotas |
| 4 | **Time zone handling** | Booking across time zones | Store UTC, convert at presentation layer |
| 5 | **Audit trail** | Compliance (PCI-DSS, GDPR) | Event sourcing = built-in audit |
| 6 | **Data retention** | Storage cost grows unbounded | Partition-based archival → S3/Glacier |
| 7 | **API versioning** | Breaking changes break clients | URI versioning (/v1/, /v2/) + header negotiation |
| 8 | **Distributed lock contention** | Hot keys in Redis lock | Redisson fair lock + lock timeout |
| 9 | **Connection pool exhaustion** | Under load → DB connections saturate | HikariCP tuning + PgBouncer |
| 10 | **Event ordering** | Out-of-order events corrupt state | Kafka partition key = aggregate_id |
| 11 | **Schema evolution** | Old consumers break on new events | Avro + Schema Registry + backward compat |
| 12 | **Graceful shutdown** | In-flight requests lost during deploy | K8s preStop hook + Spring shutdown hooks |
| 13 | **Multi-currency** | Floating point errors in money | Use `BigDecimal` + store as integer cents |
| 14 | **Timezone-aware scheduling** | Cron jobs at wrong times | Temporal schedules with timezone support |
| 15 | **Read-your-writes** | User creates then immediately reads → stale | Synchronous read from write DB for creator |

---

#### ① Data Migration Strategy

**Vấn đề**: Schema database thay đổi liên tục khi phát triển feature mới. Migration sai → break production data hoặc gây downtime.

```
┌─────────────────────────────────────────────────────────────┐
│  MIGRATION WORKFLOW                                         │
│                                                             │
│  Code change → Flyway migration script → CI validation      │
│                                                             │
│  Quy tắc Backward-Compatible:                               │
│  ✅ ADD column (nullable hoặc default)                      │
│  ✅ ADD index                                                │
│  ❌ RENAME column → thay bằng ADD new + copy + DROP old     │
│  ❌ DROP column → chỉ drop SAU KHI không code nào dùng      │
│  ❌ CHANGE type → thay bằng ADD new column + migrate data   │
│                                                             │
│  Deploy flow: Migration chạy TRƯỚC khi code deploy          │
│  → Old code vẫn chạy được với new schema                    │
│  → New code deploy → bắt đầu dùng new columns              │
│  → Cleanup migration (drop old) chạy SAU vài ngày           │
└─────────────────────────────────────────────────────────────┘
```

```java
// Flyway naming: V{version}__{description}.sql
// V1__create_bookings.sql
// V2__add_booking_metadata_column.sql
// V3__backfill_metadata.sql (data migration)
```

---

#### ② Dead Letter Queue (DLQ)

**Vấn đề**: Kafka consumer gặp lỗi khi xử lý event (poison message, logic error, downstream timeout) → event bị mất hoặc block cả queue.

```
┌─────────────────────────────────────────────────────────────────┐
│  DLQ PIPELINE                                                   │
│                                                                 │
│  Main Topic: booking-events                                     │
│       │                                                         │
│       ▼                                                         │
│  Consumer: BookingEventHandler                                  │
│       │                                                         │
│       ├─── Success → commit offset → done                       │
│       │                                                         │
│       └─── Failure (3 retries) ──► Retry Topic                  │
│                                     booking-events-retry        │
│                                         │                       │
│                                         ├── Success → done      │
│                                         │                       │
│                                         └── Failure (3 more)    │
│                                              │                  │
│                                              ▼                  │
│                                     Dead Letter Topic            │
│                                     booking-events-dlq           │
│                                         │                       │
│                                         ├── Alert (PagerDuty)   │
│                                         ├── Dashboard (Grafana)  │
│                                         └── Manual replay tool   │
└─────────────────────────────────────────────────────────────────┘
```

```java
// Spring Kafka DLQ config
@Configuration
public class KafkaConsumerConfig {
    @Bean
    public DefaultErrorHandler errorHandler(KafkaTemplate<String, String> template) {
        // Retry 3 lần, backoff 1s → 2s → 4s
        var backoff = new ExponentialBackOff(1000L, 2.0);
        backoff.setMaxElapsedTime(30000L);

        // Sau 3 retries → gửi vào DLQ topic
        var recoverer = new DeadLetterPublishingRecoverer(template,
            (record, ex) -> new TopicPartition(
                record.topic() + "-dlq", record.partition()));

        return new DefaultErrorHandler(recoverer, backoff);
    }
}
```

---

#### ③ Tenant Isolation (Noisy Neighbor)

**Vấn đề**: Tenant A chạy report nặng → CPU/IO spike → Tenant B, C bị ảnh hưởng performance.

| Tầng | Isolation Strategy |
|---|---|
| **Database** | Citus: isolate large tenant vào dedicated shard/worker node |
| **Application** | Rate limiting per tenant (Redis sliding window) |
| **K8s** | ResourceQuota per namespace (nếu namespace-per-tenant) |
| **Kafka** | Separate consumer groups per tier (premium vs standard) |
| **Cache** | Redis key prefix per tenant, TTL policy per tier |

```sql
-- Citus: Isolate noisy tenant to dedicated node
SELECT isolate_tenant_to_new_shard('bookings', 'tenant-id-abc-heavy');
SELECT citus_move_shard_placement(shard_id, 'worker-1', 'worker-dedicated');
```

---

#### ④ Time Zone Handling

**Vấn đề**: Booking tại timezone +7 (Hà Nội), thanh toán tại timezone -5 (New York). Hiển thị sai giờ → khách hàng complain.

```
QUY TẮC VÀNG:
• Store:   LUÔN LUÔN lưu UTC (TIMESTAMPTZ)
• Process: LUÔN LUÔN xử lý bằng UTC
• Display: Convert sang timezone của USER ở presentation layer

Database:     2026-07-24T04:22:00Z          (UTC)
API Response: 2026-07-24T04:22:00Z          (UTC — client tự convert)
UI Vietnam:   2026-07-24 11:22:00 (GMT+7)   (frontend convert)
UI New York:  2026-07-24 00:22:00 (EDT)      (frontend convert)
```

```java
// Entity — always TIMESTAMPTZ
@Column(columnDefinition = "TIMESTAMPTZ")
private Instant createdAt = Instant.now();  // ← Instant, NOT LocalDateTime

// API Response — ISO-8601 UTC
@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
private Instant bookingDate;

// Frontend (JavaScript) — display in user timezone
// new Date(utcString).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
```

---

#### ⑤ Audit Trail & Compliance

**Vấn đề**: PCI-DSS (payment data), GDPR (personal data) yêu cầu biết AI đã truy cập/thay đổi data GÌ, KHI NÀO, BỞI AI.

```java
// Tự động audit mọi thay đổi entity
@Entity
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditableEntity {
    @CreatedBy    private String createdBy;
    @CreatedDate  private Instant createdAt;
    @LastModifiedBy    private String modifiedBy;
    @LastModifiedDate  private Instant modifiedAt;
}
```

| Compliance | Yêu cầu | Implementation |
|---|---|---|
| **PCI-DSS** | Không lưu card number, encrypt sensitive data | Tokenization (Stripe tokens), field-level encryption |
| **GDPR** | Right to erasure, data portability | Soft delete + anonymize PII, export endpoint |
| **SOX** | Financial audit trail | Event sourcing + immutable logs |

---

#### ⑥ Data Retention & Archival

**Vấn đề**: 100M bookings/năm × 5 năm = 500M records. Storage cost tăng, query chậm, backup lớn.

```
┌─────────────────────────────────────────────────────────────┐
│  DATA LIFECYCLE                                             │
│                                                             │
│  HOT  (0-3 tháng)   → PostgreSQL (SSD, full index)         │
│  WARM (3-12 tháng)  → PostgreSQL (partition, partial idx)   │
│  COLD (1-3 năm)     → S3 + Parquet (query via Athena)      │
│  ARCHIVE (>3 năm)   → S3 Glacier (compliance retention)    │
│                                                             │
│  Implementation: Partition-based archival                   │
│  • Monthly partitions: bookings_2026_01, bookings_2026_02   │
│  • Cron job: DETACH partition cũ → export Parquet → S3      │
│  • DROP partition sau khi confirm S3 upload                 │
└─────────────────────────────────────────────────────────────┘
```

```sql
-- Detach and archive old partition
ALTER TABLE bookings DETACH PARTITION bookings_2024_01;
COPY bookings_2024_01 TO '/tmp/bookings_2024_01.csv' WITH CSV;
-- → Upload to S3 → convert Parquet → DROP TABLE bookings_2024_01
```

---

#### ⑦ API Versioning

**Vấn đề**: Thay đổi API response format → mobile app cũ crash, partner integration break.

```
Chiến lược: URI Versioning + Sunset Header

GET /api/v1/bookings/123     ← Current stable
GET /api/v2/bookings/123     ← New version (breaking changes)

Response headers:
  Sunset: Sat, 01 Jan 2027 00:00:00 GMT     ← v1 sẽ bị retire
  Deprecation: true
  Link: </api/v2/bookings>; rel="successor-version"

Quy tắc:
• v1 và v2 PHẢI chạy song song ít nhất 6 tháng
• Monitor v1 traffic → khi < 1% → announce sunset
• Controller layer khác nhau, Service layer dùng chung
```

```java
// Separate controllers per version
@RestController @RequestMapping("/api/v1/bookings")
public class BookingV1Controller { /* Returns BookingResponseV1 */ }

@RestController @RequestMapping("/api/v2/bookings")
public class BookingV2Controller { /* Returns BookingResponseV2 with metadata */ }
```

---

#### ⑧ Distributed Lock Contention

**Vấn đề**: Payment processing dùng Redis lock trên `payment:{orderId}`. Traffic cao → nhiều requests cạnh tranh cùng lock → timeout, retry storm.

```java
// Redisson Fair Lock — FIFO ordering, tránh starvation
@Service
public class PaymentLockService {
    @Autowired private RedissonClient redisson;

    public PaymentResult processWithLock(String orderId, Supplier<PaymentResult> action) {
        RLock lock = redisson.getFairLock("payment:" + orderId);
        try {
            // Wait tối đa 5s để acquire, tự release sau 30s (anti-deadlock)
            boolean acquired = lock.tryLock(5, 30, TimeUnit.SECONDS);
            if (!acquired) {
                throw new LockAcquisitionException("Cannot acquire lock: " + orderId);
            }
            return action.get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new LockAcquisitionException("Interrupted", e);
        } finally {
            if (lock.isHeldByCurrentThread()) lock.unlock();
        }
    }
}
```

---

#### ⑨ Connection Pool Exhaustion

**Vấn đề**: Mỗi pod Spring Boot mở 10 conns × 50 pods = 500 connections. PostgreSQL `max_connections=200` → connection refused.

```
┌─────────────────────────────────────────────────────────────┐
│  CONNECTION POOLING STRATEGY                                │
│                                                             │
│  50 pods × HikariCP(5 conns) ──► PgBouncer ──► PostgreSQL   │
│                                                             │
│  Không PgBouncer: 50 × 5 = 250 direct conns → QUÁ!         │
│  Có PgBouncer:    50 × 5 → PgBouncer → 50 real conns       │
│  → PostgreSQL chỉ thấy 50 connections                       │
└─────────────────────────────────────────────────────────────┘
```

```yaml
# application.yml — HikariCP tuning
spring:
  datasource:
    hikari:
      minimum-idle: 2              # Giảm từ default 10
      maximum-pool-size: 5         # Giảm từ default 10
      connection-timeout: 3000     # Fail fast (3s)
      idle-timeout: 300000         # 5 min idle → release
      max-lifetime: 1800000        # 30 min → recycle
      leak-detection-threshold: 60000  # Alert nếu connection > 60s
```

---

#### ⑩ Event Ordering

**Vấn đề**: `BookingCreated` và `BookingCancelled` events cho cùng booking. Consumer nhận `Cancelled` trước `Created` → state sai.

```
QUY TẮC: Cùng aggregate → cùng Kafka partition → đảm bảo ordering

Producer key = aggregateId (bookingId)
→ Kafka hash(key) % numPartitions = partition number
→ Cùng bookingId luôn vào cùng partition = strict FIFO

BookingCreated(booking-123)   → Partition 5, Offset 100
BookingUpdated(booking-123)   → Partition 5, Offset 101
BookingCancelled(booking-123) → Partition 5, Offset 102
→ Consumer đọc: 100 → 101 → 102 (đúng thứ tự!)
```

```java
// Producer — key = aggregateId → same partition
kafkaTemplate.send("booking-events",
    booking.getId().toString(),     // ← KEY = bookingId
    bookingCreatedEvent);
```

---

#### ⑪ Schema Evolution

**Vấn đề**: Event `BookingCreated` v1 có 5 fields. Version mới thêm `loyaltyTier`. Consumer cũ nhận event mới → deserialize fail → crash.

```
Schema Registry + Backward Compatibility

v1: { bookingId, customerId, amount, currency, status }
v2: { bookingId, customerId, amount, currency, status, loyaltyTier? }
                                                        ↑ optional field

Quy tắc Backward Compatible:
✅ ADD optional field (có default value)
✅ ADD new event type
❌ REMOVE required field
❌ RENAME field
❌ CHANGE field type

Consumer cũ đọc v2 event → bỏ qua field mới → vẫn hoạt động!
Consumer mới đọc v1 event → loyaltyTier = null → handle gracefully
```

---

#### ⑫ Graceful Shutdown

**Vấn đề**: K8s rolling update → Pod bị terminate → in-flight HTTP requests bị drop → 500 errors.

```yaml
# K8s Deployment
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 60
      containers:
        - name: booking-service
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 10"]
                # Wait 10s cho Istio/Ingress remove endpoint
```

```yaml
# application.yml
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
```

```
Timeline khi pod terminate:
t=0s   K8s sends preStop → sleep 10s (Istio removes endpoint)
t=10s  K8s sends SIGTERM → Spring stops accepting NEW requests
t=10-40s  Spring waits for IN-FLIGHT requests (30s timeout)
t=40s  Spring shutdown complete → Pod terminated
t=60s  K8s force kill (terminationGracePeriodSeconds)
```

---

#### ⑬ Multi-Currency

**Vấn đề**: `double amount = 0.1 + 0.2` → `0.30000000000000004`. Tính sai tiền → tài chính lỗ.

```java
// ❌ NEVER use double/float for money
double price = 0.1 + 0.2;  // → 0.30000000000000004

// ✅ BETTER: Store as integer cents (smallest unit)
// $10.99 → store as 1099 (integer)
// ¥1000  → store as 1000 (integer, no decimals)

@Entity
public class Payment {
    @Column(name = "amount_cents")
    private long amountCents;       // 1099 = $10.99

    @Column(length = 3)
    private String currency;        // "USD", "VND", "JPY"
}

// Value Object
public record Money(long amountCents, String currency) {
    public Money add(Money other) {
        if (!this.currency.equals(other.currency))
            throw new CurrencyMismatchException();
        return new Money(this.amountCents + other.amountCents, this.currency);
    }
    public BigDecimal toDecimal() {
        int decimals = CurrencyUtil.getDecimals(currency); // USD=2, JPY=0
        return BigDecimal.valueOf(amountCents, decimals);
    }
}
```

---

#### ⑭ Timezone-Aware Scheduling

**Vấn đề**: `@Scheduled(cron = "0 0 9 * * *")` chạy 9 AM theo timezone SERVER, không phải timezone business.

```java
// ❌ Spring @Scheduled — server timezone dependent
@Scheduled(cron = "0 0 9 * * *")  // 9 AM server time — SAI khi multi-region

// ✅ Temporal Scheduled Workflow — timezone-aware
ScheduleOptions options = ScheduleOptions.newBuilder()
    .setScheduleSpec(ScheduleSpec.newBuilder()
        .addCronString("0 9 * * MON-FRI")
        .setTimezone("Asia/Ho_Chi_Minh")       // ← Explicit timezone!
        .build())
    .build();

scheduleClient.createSchedule("daily-report-vn", schedule, options);
// Server ở US: job chạy 10 PM US = 9 AM VN → LUÔN ĐÚNG!
```

---

#### ⑮ Read-Your-Writes Consistency

**Vấn đề**: User tạo booking (write → PostgreSQL) → redirect sang "My Bookings" (read → Elasticsearch) → Booking chưa xuất hiện (event chưa kịp project).

```
┌─────────────────────────────────────────────────────────────┐
│  READ-YOUR-WRITES PATTERN                                   │
│                                                             │
│  Chiến lược 1: "Write-Through Read"                         │
│  POST /bookings → Write DB → response                       │
│  GET /bookings/mine → nếu CREATOR → đọc từ Write DB         │
│                       nếu VIEWER  → đọc từ Read Model       │
│                                                             │
│  Chiến lược 2: "Causal Consistency Token"                   │
│  POST → response header: X-Version: 42                      │
│  GET  → header: X-After-Version: 42                         │
│  → Read Model: đã process event ≥ 42? → yes: serve          │
│  → Chưa → wait 2s hoặc fallback Write DB                    │
│                                                             │
│  Chiến lược 3: "Optimistic UI"                              │
│  POST → Frontend ngay lập tức hiện booking từ response       │
│  → Background: Read Model eventually catches up              │
│  → Lần refresh tiếp: data đã consistent                     │
└─────────────────────────────────────────────────────────────┘
```

```java
@GetMapping("/api/bookings/mine")
public List<BookingResponse> getMyBookings(
        @RequestHeader(value = "X-Created-After", required = false) Instant createdAfter,
        @AuthenticationPrincipal User user) {

    if (createdAfter != null
            && createdAfter.isAfter(Instant.now().minus(Duration.ofSeconds(10)))) {
        // User vừa tạo < 10s → đọc từ Write DB
        return bookingWriteRepo.findByCustomerId(user.getId());
    }
    // Normal → đọc từ Read Model (Elasticsearch)
    return bookingReadService.findByCustomerId(user.getId());
}
```

---

### 12.3 Tóm Tắt 12 Chủ Đề Chính

| # | Chủ đề | Nội dung chính |
|---|---|---|
| 1 | **Big Picture** | 7-layer architecture (Client → CDN → Gateway → Mesh → Services → Events → Data) |
| 2 | **Multi-Domain DDD** | 6 bounded contexts (Booking, Payment, Customer, Loyalty, Notification, Reporting) |
| 3 | **Provider SPI Pattern** | Interface `PaymentProvider` → implementations (Stripe, VNPay, MoMo) — plug & play per domain |
| 4 | **CQRS + Event Sourcing** | Write → PostgreSQL, Read → Elasticsearch/Redis, Events → Kafka |
| 5 | **Transactional Outbox** | Atomicity: entity save + event publish trong 1 DB transaction, CDC via Debezium |
| 6 | **Sharding (100M+)** | PostgreSQL RANGE partition (by date) + Citus shard (by tenant_id) |
| 7 | **Cursor Pagination** | Keyset-based (constant O(1) performance), encode cursor = Base64(sortValue + id) |
| 8 | **Multi-Level Cache** | L1: Caffeine (JVM, 30s TTL) → L2: Redis (distributed, 10min TTL) → DB |
| 9 | **Unit of Work** | JPA/Hibernate EntityManager = built-in UoW, `@Transactional` = boundary |
| 10 | **Distributed Tracing** | OpenTelemetry → Collector → Jaeger, `traceId` in logs via MDC |
| 11 | **Resilience** | Idempotency keys, Circuit breaker (Istio+Resilience4j), Bulkhead, Rate limiting |
| 12 | **Temporal Saga** | Booking flow: Reserve → Charge → Award Points → Confirm, with compensation |
| ①	| Data Migration	| Flyway workflow, backward-compatible rules |
| ②	| DLQ	| Main → Retry → DLQ pipeline diagram + Spring Kafka config |
| ③	| Tenant Isolation	| Citus isolate + multi-layer strategy table |
| ④	| Timezone	| QUY TẮC VÀNG: Store UTC, Display local + Instant code |
| ⑤	| Audit Trail	| AuditableEntity + PCI-DSS/GDPR/SOX table |
| ⑥	| Data Retention	| HOT/WARM/COLD/ARCHIVE lifecycle + partition detach SQL |
| ⑦	| API Versioning	| URI versioning + Sunset header + dual controllers |
| ⑧	| Distributed Lock	| Redisson Fair Lock code + anti-deadlock pattern |
| ⑨	| Connection Pool	| PgBouncer diagram + HikariCP tuning YAML |
| ⑩	| Event Ordering	| Kafka partition key = aggregateId explanation |
| ⑪	| Schema Evolution	| Backward compatibility rules + Avro |
| ⑫	| Graceful Shutdown	| K8s preStop + Spring lifecycle timeline |
| ⑬	| Multi-Currency	| Money value object + integer cents pattern |
| ⑭	| Timezone Scheduling	| Temporal vs @Scheduled comparison |
| ⑮	| Read-Your-Writes	| 3 chiến lược + implementation code |

