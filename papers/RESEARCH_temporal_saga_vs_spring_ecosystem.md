# Temporal Saga & Spring Ecosystem — Nghiên Cứu Chuyên Sâu

> **Ngày tạo**: 2026-07-24  
> **Mục đích**: Phân tích sâu Temporal Saga pattern, kiến trúc nội bộ, và so sánh với các giải pháp tương đương trong hệ sinh thái Spring  
> **Tham chiếu**: [ARCHITECTURE_microservice_1M_TPS_multi_domain.md](file:///home/nguyentthai96/Desktop/bigbang/research_docs/papers/ARCHITECTURE_microservice_1M_TPS_multi_domain.md), [ANALYSIS_spring_cloud_k8s_istio_temporal_ecosystem.md](file:///home/nguyentthai96/Desktop/bigbang/research_docs/papers/ANALYSIS_spring_cloud_k8s_istio_temporal_ecosystem.md)

---

## Mục Lục

1. [Saga Pattern — Bản Chất & Tại Sao Cần](#1-saga-pattern--bản-chất--tại-sao-cần)
2. [Temporal — Kiến Trúc Nội Bộ Deep Dive](#2-temporal--kiến-trúc-nội-bộ-deep-dive)
3. [Temporal Saga — Implementation Chi Tiết](#3-temporal-saga--implementation-chi-tiết)
4. [Spring Ecosystem — Các Giải Pháp Tương Đương](#4-spring-ecosystem--các-giải-pháp-tương-đương)
5. [So Sánh Toàn Diện — Decision Matrix](#5-so-sánh-toàn-diện--decision-matrix)
6. [Khi Nào Chọn Giải Pháp Nào?](#6-khi-nào-chọn-giải-pháp-nào)
7. [Production Patterns & Anti-Patterns](#7-production-patterns--anti-patterns)

---

## 1. Saga Pattern — Bản Chất & Tại Sao Cần

### 1.1 Vấn Đề Gốc: Distributed Transaction

```
MONOLITH (Đơn giản):
┌──────────────────────────────────────────┐
│  @Transactional                           │
│  ├── bookingRepo.save(booking)           │ ← 1 database
│  ├── paymentRepo.save(payment)           │ ← cùng transaction
│  ├── loyaltyRepo.addPoints(points)       │ ← rollback toàn bộ nếu fail
│  └── COMMIT (hoặc ROLLBACK tất cả)       │
└──────────────────────────────────────────┘
✅ ACID đảm bảo: hoặc tất cả thành công, hoặc tất cả rollback

MICROSERVICES (Phức tạp):
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Booking  │───►│ Payment  │───►│ Loyalty  │───►│  Notif   │
│ Service  │    │ Service  │    │ Service  │    │ Service  │
│          │    │          │    │          │    │          │
│ DB-1     │    │ DB-2     │    │ DB-3     │    │ DB-4     │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     ✅              ✅              ❌ FAIL         ???
  reserved          charged        points fail     chưa gửi

❓ Payment đã charge thật $100 nhưng Loyalty fail
   → Không thể rollback DB-2 từ DB-3!
   → Hệ thống ở trạng thái INCONSISTENT
```

### 1.2 Tại Sao KHÔNG Dùng 2PC (Two-Phase Commit)?

| Tiêu chí | 2PC | Saga |
|---|---|---|
| **Availability** | ❌ Blocking — coordinator fail = lock tất cả | ✅ Non-blocking, each step independent |
| **Performance** | ❌ Lock tất cả resources suốt quá trình | ✅ Mỗi service lock local, ngắn |
| **Scalability** | ❌ Không scale — tất cả phải "vote" cùng lúc | ✅ Scale từng service độc lập |
| **Latency** | ❌ 2 round-trips (prepare + commit) | ✅ Pipeline, không blocking |
| **Heterogeneous** | ❌ Yêu cầu tất cả DB hỗ trợ XA | ✅ Mỗi service dùng DB khác nhau |
| **Trade-off** | Strong consistency nhưng fragile | Eventual consistency nhưng resilient |

### 1.3 Saga Pattern: 2 Kiểu Triển Khai

```
═══════════════════════════════════════════════════════════════
CHOREOGRAPHY (Event-Driven, Decentralized)
═══════════════════════════════════════════════════════════════

  ┌────────┐  BookingCreated  ┌────────┐  PaymentCharged  ┌────────┐
  │Booking │ ───────event───► │Payment │ ───────event───► │Loyalty │
  │Service │                  │Service │                  │Service │
  └────┬───┘                  └────┬───┘                  └────┬───┘
       │                           │                           │
       │◄── PaymentFailed ────────┘                           │
       │    (compensate: cancel)                               │
       │                                                       │
       │◄── LoyaltyFailed ───────────────────────────────────┘
            (compensate: refund + cancel)

  Ưu điểm: Loosely coupled, không single point of failure
  Nhược điểm: Khó debug, "event spaghetti" khi >5 services
              Không có cái nhìn tổng thể flow

═══════════════════════════════════════════════════════════════
ORCHESTRATION (Central Coordinator)
═══════════════════════════════════════════════════════════════

                    ┌──────────────────┐
                    │   ORCHESTRATOR   │
                    │   (Saga Manager) │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    Step 1: Reserve     Step 2: Charge      Step 3: Add Points
         │                   │                   │
    ┌────▼───┐          ┌────▼───┐          ┌────▼───┐
    │Booking │          │Payment │          │Loyalty │
    │Service │          │Service │          │Service │
    └────────┘          └────────┘          └────────┘
         │                   │                   │
    Comp: Cancel        Comp: Refund        Comp: Remove Points
         │                   │                   │
         └───────────────────┴───────────────────┘
                    Nếu Step 3 fail →
                    Orchestrator gọi Comp 2, rồi Comp 1

  Ưu điểm: Flow rõ ràng, dễ debug, dễ monitor
  Nhược điểm: Single point of failure (nếu orchestrator crash)
              Tighter coupling
```

---

## 2. Temporal — Kiến Trúc Nội Bộ Deep Dive

### 2.1 Tại Sao Temporal Đặc Biệt: "Durable Execution"

```
VẤN ĐỀ CỐT LÕI mà Temporal giải quyết:

  Traditional Code:
  ┌────────────────────────────────────────────────────────┐
  │  public void processOrder(Order order) {                │
  │      payment = paymentService.charge(order);  // ← OK   │
  │      inventory = inventoryService.reserve();  // ← OK   │
  │      // ⚡ SERVER CRASH TẠI ĐÂY ⚡                      │
  │      shipping = shippingService.create();     // ← ???   │
  │  }                                                      │
  │                                                          │
  │  → Payment đã charge, inventory đã reserve               │
  │  → Nhưng shipping chưa tạo                               │
  │  → Server restart → KHÔNG biết đang ở step nào           │
  │  → Phải "đoán" trạng thái → DATA INCONSISTENCY           │
  └────────────────────────────────────────────────────────┘

  Temporal Durable Execution:
  ┌────────────────────────────────────────────────────────┐
  │  CODE Y HỆT, nhưng Temporal đảm bảo:                    │
  │                                                          │
  │  1. Mỗi Activity result được GHI LẠI (Event History)    │
  │  2. Server crash → Worker mới pick up workflow           │
  │  3. REPLAY: chạy lại code từ đầu                         │
  │     → Gặp Activity đã hoàn thành → LẤY KẾT QUẢ CŨ      │
  │     → Không gọi lại paymentService.charge()!             │
  │  4. Tiếp tục từ ĐÚNG step bị gián đoạn                  │
  │                                                          │
  │  → KHÔNG CẦN custom state machine                        │
  │  → KHÔNG CẦN checkpoint logic                            │
  │  → Code viết tuần tự, Temporal lo phần còn lại           │
  └────────────────────────────────────────────────────────┘
```

### 2.2 Kiến Trúc Temporal Server

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TEMPORAL SERVER ARCHITECTURE                       │
│                                                                       │
│  ┌─────────── Temporal Server Cluster ─────────────────────────────┐ │
│  │                                                                   │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │ │
│  │  │  Frontend     │  │   History    │  │  Matching    │          │ │
│  │  │  Service      │  │   Service   │  │  Service     │          │ │
│  │  │              │  │              │  │              │          │ │
│  │  │ • gRPC API   │  │ • Workflow   │  │ • Task Queue │          │ │
│  │  │ • Rate limit │  │   state mgmt │  │   management │          │ │
│  │  │ • Auth       │  │ • Event hist │  │ • Task       │          │ │
│  │  │ • Request    │  │   replay     │  │   dispatch   │          │ │
│  │  │   routing    │  │ • Timer mgmt │  │ • Worker     │          │ │
│  │  │              │  │ • Mutable    │  │   matching   │          │ │
│  │  │              │  │   state      │  │              │          │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │ │
│  │         │                  │                  │                  │ │
│  │         └──────────────────┴──────────────────┘                  │ │
│  │                         │                                        │ │
│  │              ┌──────────▼──────────┐                             │ │
│  │              │   Persistence       │                             │ │
│  │              │   (PostgreSQL /     │                             │ │
│  │              │    Cassandra /      │                             │ │
│  │              │    MySQL)           │                             │ │
│  │              └─────────────────────┘                             │ │
│  │                                                                   │ │
│  │  ┌──────────────┐                                                │ │
│  │  │  Worker       │  (Optional — only for system workflows)       │ │
│  │  │  Service      │  • Archival, cleanup, replication             │ │
│  │  └──────────────┘                                                │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                         │ gRPC                                        │
│  ┌──────────────────────▼────────────────────────────────────────────┐│
│  │           APPLICATION WORKERS (Your Code)                         ││
│  │                                                                    ││
│  │  ┌──────────────────┐  ┌──────────────────┐                      ││
│  │  │ Workflow Worker   │  │ Activity Worker   │                      ││
│  │  │                  │  │                  │                      ││
│  │  │ • Polls Workflow │  │ • Polls Activity │                      ││
│  │  │   Task Queue     │  │   Task Queue     │                      ││
│  │  │ • Executes       │  │ • Executes       │                      ││
│  │  │   Workflow code  │  │   Activity code  │                      ││
│  │  │ • Emits Commands │  │ • Returns result │                      ││
│  │  │ • DETERMINISTIC! │  │ • Side effects   │                      ││
│  │  │                  │  │   OK here        │                      ││
│  │  └──────────────────┘  └──────────────────┘                      ││
│  └────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

**Vai trò từng component:**

| Component | Vai trò | Scalability |
|---|---|---|
| **Frontend Service** | API gateway cho Temporal. Nhận requests từ clients/workers, rate limiting, routing | Stateless, scale horizontally |
| **History Service** | Trái tim của Temporal. Quản lý workflow state, event history, mutable state, timers. Mỗi workflow "thuộc về" 1 history shard | Sharded by workflow ID |
| **Matching Service** | Quản lý task queues. Khi workflow cần chạy activity → đưa task vào queue → worker poll | Stateless, scale horizontally |
| **Worker Service** | Internal workflows (archival, replication). KHÔNG phải application workers | Stateless |
| **Persistence** | Lưu event history, workflow state, visibility data | PostgreSQL/Cassandra/MySQL |

### 2.3 Event History & Replay — Cơ Chế "Thần Kỳ"

```
═══ HAPPY PATH: Order Workflow chạy bình thường ═══

Timeline:
t=0s   WorkflowExecutionStarted(input: OrderRequest)
t=0s   WorkflowTaskScheduled
t=0s   WorkflowTaskStarted
t=0s   WorkflowTaskCompleted
       → Commands: [ScheduleActivityTask("chargePayment")]

t=0.1s ActivityTaskScheduled(chargePayment)
t=0.2s ActivityTaskStarted(chargePayment, worker-1)
t=1.5s ActivityTaskCompleted(chargePayment, result: PaymentResult{txId: "pay-123"})

t=1.5s WorkflowTaskScheduled
t=1.5s WorkflowTaskStarted
t=1.5s WorkflowTaskCompleted
       → Commands: [ScheduleActivityTask("reserveInventory")]

t=1.6s ActivityTaskScheduled(reserveInventory)
t=1.7s ActivityTaskStarted(reserveInventory, worker-2)
t=2.0s ActivityTaskCompleted(reserveInventory, result: ReservationId("res-456"))

...

EVENT HISTORY (append-only log):
┌────┬──────────────────────────────────────┬──────────┐
│ #  │ Event                                │ Time     │
├────┼──────────────────────────────────────┼──────────┤
│ 1  │ WorkflowExecutionStarted             │ t=0.0s   │
│ 2  │ WorkflowTaskScheduled                │ t=0.0s   │
│ 3  │ WorkflowTaskStarted                  │ t=0.0s   │
│ 4  │ WorkflowTaskCompleted                │ t=0.0s   │
│ 5  │ ActivityTaskScheduled(charge)        │ t=0.1s   │
│ 6  │ ActivityTaskStarted(charge)          │ t=0.2s   │
│ 7  │ ActivityTaskCompleted(charge, ✅)    │ t=1.5s   │
│ 8  │ WorkflowTaskScheduled                │ t=1.5s   │
│ 9  │ WorkflowTaskStarted                  │ t=1.5s   │
│ 10 │ WorkflowTaskCompleted                │ t=1.5s   │
│ 11 │ ActivityTaskScheduled(reserve)       │ t=1.6s   │
│ 12 │ ActivityTaskStarted(reserve)         │ t=1.7s   │
│ 13 │ ActivityTaskCompleted(reserve, ✅)   │ t=2.0s   │
│ .. │ ...                                  │ ...      │
└────┴──────────────────────────────────────┴──────────┘

═══ CRASH + REPLAY: Worker crash sau event #7 ═══

1. Worker-1 crash!
2. Temporal Server phát hiện (heartbeat timeout)
3. Worker-2 (mới) pick up workflow task
4. Worker-2 nhận TOÀN BỘ Event History (#1 → #7)
5. Worker-2 chạy lại Workflow code từ đầu:

   public OrderResult processOrder(OrderRequest request) {
       // ← Code chạy lại từ đây
       PaymentResult payment = paymentActivity.charge(request);
       // ↑ Gặp ActivityTaskCompleted trong history
       // ↑ KHÔNG gọi paymentService thật!
       // ↑ Trả về result từ event #7: PaymentResult{txId: "pay-123"}
       
       inventoryActivity.reserve(request.getItems());
       // ↑ KHÔNG có trong history → đây là step MỚI
       // ↑ Temporal schedule Activity Task thật → worker thực thi
       
       ...
   }

KẾT QUẢ: Workflow tiếp tục chính xác từ nơi bị gián đoạn!
          Payment KHÔNG bị charge lần 2!
```

### 2.4 Quy Tắc Determinism — Tại Sao Quan Trọng

```
WORKFLOW CODE phải DETERMINISTIC vì cơ chế Replay:

✅ ĐƯỢC PHÉP trong Workflow:
  • Control flow thông thường (if/else, for, while)
  • Gọi Activity (side effects nằm trong Activity)
  • Workflow.sleep() (Temporal timer, không phải Thread.sleep)
  • Workflow.currentTimeMillis() (replay-safe time)
  • Workflow.newRandom() (replay-safe random)
  • Signal/Query handling
  • Child workflows

❌ KHÔNG ĐƯỢC trong Workflow:
  • Thread.sleep() → dùng Workflow.sleep()
  • new Date() / Instant.now() → dùng Workflow.currentTimeMillis()
  • Math.random() → dùng Workflow.newRandom()
  • Network calls (HTTP, gRPC) → đưa vào Activity
  • Database queries → đưa vào Activity
  • File I/O → đưa vào Activity
  • Global mutable state
  • Non-deterministic libraries

TẠI SAO?

  Lần chạy 1:  code → if (Math.random() > 0.5) → TRUE  → charge()
  Lần replay:  code → if (Math.random() > 0.5) → FALSE → skip charge()
  
  → Replay tạo ra path KHÁC history → NON-DETERMINISM ERROR!
  → Temporal SDK detect mismatch → workflow STUCK

  Giải pháp: Mọi side effect phải nằm trong Activity
             Activity result được lưu trong Event History
             Replay lấy result từ history, KHÔNG chạy lại Activity
```

---

## 3. Temporal Saga — Implementation Chi Tiết

### 3.1 Saga Helper Class (Built-in Pattern)

```java
// Temporal Java SDK cung cấp Saga helper class
import io.temporal.workflow.Saga;

@WorkflowInterface
public interface OrderSagaWorkflow {
    @WorkflowMethod
    OrderResult processOrder(OrderRequest request);
}

public class OrderSagaWorkflowImpl implements OrderSagaWorkflow {

    // Activity stubs với retry policy
    private final PaymentActivity paymentAct = Workflow.newActivityStub(
        PaymentActivity.class,
        ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofSeconds(30))
            .setRetryOptions(RetryOptions.newBuilder()
                .setInitialInterval(Duration.ofSeconds(1))
                .setBackoffCoefficient(2.0)
                .setMaximumAttempts(3)
                .setDoNotRetry(
                    InsufficientFundsException.class.getName(),  // Business error → skip retry
                    InvalidCardException.class.getName()
                )
                .build())
            .build()
    );

    private final InventoryActivity inventoryAct = Workflow.newActivityStub(
        InventoryActivity.class,
        ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofSeconds(10))
            .build()
    );

    private final ShippingActivity shippingAct = Workflow.newActivityStub(
        ShippingActivity.class,
        ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofMinutes(5))
            .build()
    );

    @Override
    public OrderResult processOrder(OrderRequest request) {
        // ═══ TEMPORAL SAGA HELPER ═══
        Saga saga = new Saga(new Saga.Options.Builder()
            .setParallelCompensation(false)   // Compensate tuần tự (reverse order)
            .setContinueWithError(true)        // Tiếp tục compensate dù 1 comp fail
            .build());

        try {
            // Step 1: Charge payment
            PaymentResult payment = paymentAct.charge(request.getPaymentInfo());
            saga.addCompensation(paymentAct::refund, payment.getTransactionId());
            // ↑ Đăng ký compensation NGAY SAU KHI step thành công

            // Step 2: Reserve inventory
            String reservationId = inventoryAct.reserve(request.getItems());
            saga.addCompensation(inventoryAct::release, reservationId);

            // Step 3: Create shipment
            ShipmentResult shipment = shippingAct.createShipment(
                request.getAddress(), request.getItems());
            saga.addCompensation(shippingAct::cancelShipment, shipment.getShipmentId());

            return OrderResult.success(payment, shipment);

        } catch (ActivityFailure e) {
            // ═══ COMPENSATION: Chạy TẤT CẢ compensation đã đăng ký ═══
            // Thứ tự: ngược lại (LIFO)
            // Step 3 fail → comp(step 2) → comp(step 1)
            saga.compensate();
            throw ApplicationFailure.newFailure(
                "Order processing failed: " + e.getMessage(),
                "ORDER_FAILED"
            );
        }
    }
}
```

### 3.2 Flow Chi Tiết: Happy Path vs Compensation

```
═══ HAPPY PATH ═══

  processOrder(request)
       │
       ▼
  [1] paymentAct.charge()         → SUCCESS → PaymentResult{txId: "pay-123"}
       │                            saga.addCompensation(refund, "pay-123")
       ▼
  [2] inventoryAct.reserve()      → SUCCESS → reservationId: "res-456"
       │                            saga.addCompensation(release, "res-456")
       ▼
  [3] shippingAct.createShipment() → SUCCESS → ShipmentResult{id: "ship-789"}
       │                            saga.addCompensation(cancel, "ship-789")
       ▼
  return OrderResult.success()    ← DONE ✅


═══ FAILURE + COMPENSATION ═══

  processOrder(request)
       │
       ▼
  [1] paymentAct.charge()         → SUCCESS → "pay-123"
       │                            saga.addCompensation(refund, "pay-123")
       ▼
  [2] inventoryAct.reserve()      → SUCCESS → "res-456"
       │                            saga.addCompensation(release, "res-456")
       ▼
  [3] shippingAct.createShipment() → ❌ FAILED (out of stock at warehouse)
       │
       ▼ catch (ActivityFailure)
       │
  saga.compensate()
       │
       ├── [comp-2] inventoryAct.release("res-456")    ← Reverse order!
       │
       └── [comp-1] paymentAct.refund("pay-123")       ← $100 refunded
       │
       ▼
  throw ORDER_FAILED              ← Client gets error, but state is CONSISTENT


═══ COMPENSATION CŨNG FAIL? ═══

  [comp-1] paymentAct.refund("pay-123")  → ❌ FAILED (Stripe timeout)
       │
       ▼ setContinueWithError(true)
       │ → Log error, nhưng TIẾP TỤC compensate các step khác
       │ → Temporal auto-retry refund theo retry policy
       │ → Nếu tất cả retry fail → workflow stuck → ALERT → manual intervention
```

### 3.3 Advanced Patterns: Parallel Activities, Signals, Timers

```java
// ═══ PATTERN 1: Parallel Activities ═══
public class ParallelOrderWorkflowImpl implements OrderWorkflow {
    @Override
    public OrderResult processOrder(OrderRequest request) {
        // Chạy song song: check credit + check inventory
        Promise<CreditResult> creditCheck = Async.function(
            creditAct::checkCredit, request.getCustomerId());
        Promise<InventoryResult> stockCheck = Async.function(
            inventoryAct::checkStock, request.getItems());

        // Wait cả 2 hoàn thành
        CreditResult credit = creditCheck.get();
        InventoryResult stock = stockCheck.get();

        if (!credit.isApproved() || !stock.isAvailable()) {
            return OrderResult.rejected("Pre-check failed");
        }
        // Continue with saga...
    }
}

// ═══ PATTERN 2: Human-in-the-Loop (Signals) ═══
@WorkflowInterface
public interface ApprovalWorkflow {
    @WorkflowMethod
    ApprovalResult processHighValueOrder(OrderRequest request);
    
    @SignalMethod
    void approveOrder(String approverName);
    
    @SignalMethod
    void rejectOrder(String reason);
    
    @QueryMethod
    String getStatus();
}

public class ApprovalWorkflowImpl implements ApprovalWorkflow {
    private boolean approved = false;
    private boolean rejected = false;
    private String status = "PENDING_APPROVAL";

    @Override
    public ApprovalResult processHighValueOrder(OrderRequest request) {
        // Step 1: Auto-check
        riskAct.performRiskCheck(request);
        
        // Step 2: Send notification to manager
        notifAct.sendApprovalRequest(request, request.getManagerEmail());
        
        // Step 3: WAIT for human approval (up to 72 hours!)
        // → Temporal handles this natively
        // → No cron job, no polling, no database flag
        boolean signalReceived = Workflow.await(
            Duration.ofHours(72),
            () -> approved || rejected
        );
        
        if (!signalReceived) {
            return ApprovalResult.timeout("No response in 72 hours");
        }
        
        if (rejected) {
            return ApprovalResult.rejected("Manager rejected");
        }
        
        // Step 4: Process approved order (Saga continues...)
        return processApprovedOrder(request);
    }

    @Override
    public void approveOrder(String approverName) {
        this.approved = true;
        this.status = "APPROVED by " + approverName;
    }

    @Override
    public String getStatus() {
        return this.status;
    }
}

// ═══ PATTERN 3: Scheduled Workflows (Cron) ═══
// Thay thế @Scheduled + leader election
ScheduleClient scheduleClient = ScheduleClient.newInstance(service);

Schedule schedule = Schedule.newBuilder()
    .setAction(ScheduleActionStartWorkflow.newBuilder()
        .setWorkflowType(DailyReportWorkflow.class)
        .setTaskQueue("reporting-queue")
        .build())
    .setSpec(ScheduleSpec.newBuilder()
        .addCronString("0 9 * * MON-FRI")    // 9 AM weekdays
        .setTimezone("Asia/Ho_Chi_Minh")       // Timezone-aware!
        .build())
    .build();

scheduleClient.createSchedule("daily-report-vn", schedule,
    ScheduleOptions.newBuilder().build());
```

### 3.4 Temporal Web UI — Observability

```
Temporal Web UI cung cấp:

┌─────────────────────────────────────────────────────────────────────┐
│  TEMPORAL WEB UI                                                     │
│                                                                       │
│  ┌─── Workflow List ──────────────────────────────────────────────┐  │
│  │ ID                    │ Type          │ Status   │ Start      │  │
│  │ order-2026-001        │ OrderSaga     │ ✅ Done  │ 10:30:00   │  │
│  │ order-2026-002        │ OrderSaga     │ 🔄 Running│ 10:31:00  │  │
│  │ order-2026-003        │ OrderSaga     │ ❌ Failed │ 10:31:30  │  │
│  │ approval-hv-001       │ ApprovalFlow  │ ⏳ Waiting│ 09:00:00  │  │
│  └───────────────────────┴───────────────┴──────────┴────────────┘  │
│                                                                       │
│  ┌─── Workflow Detail: order-2026-003 ────────────────────────────┐  │
│  │                                                                  │  │
│  │  Input: { customerId: "C-123", amount: 500, items: [...] }      │  │
│  │                                                                  │  │
│  │  Event History:                                                  │  │
│  │  ├── #1 WorkflowExecutionStarted                 10:31:30       │  │
│  │  ├── #5 ActivityTaskScheduled(chargePayment)     10:31:30       │  │
│  │  ├── #7 ActivityTaskCompleted(chargePayment)     10:31:32       │  │
│  │  │       Result: { txId: "pay-123", amount: 500 }               │  │
│  │  ├── #11 ActivityTaskScheduled(reserveInventory) 10:31:32       │  │
│  │  ├── #13 ActivityTaskFailed(reserveInventory)    10:31:35       │  │
│  │  │       Error: "OUT_OF_STOCK: Item SKU-456"                    │  │
│  │  ├── #15 ActivityTaskScheduled(refundPayment)    10:31:35       │  │
│  │  │       ← COMPENSATION started                                │  │
│  │  ├── #17 ActivityTaskCompleted(refundPayment)    10:31:37       │  │
│  │  │       Result: { refundId: "ref-789" }                        │  │
│  │  └── #18 WorkflowExecutionFailed                 10:31:37       │  │
│  │           Error: "ORDER_FAILED: OUT_OF_STOCK"                   │  │
│  │                                                                  │  │
│  │  ⏱ Total Duration: 7 seconds                                    │  │
│  │  📊 Activities: 2 completed, 1 failed, 1 compensation           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  → Có thể xem INPUT/OUTPUT của MỖI activity                         │
│  → Có thể REPLAY workflow để debug                                    │
│  → Có thể TERMINATE hoặc SIGNAL workflow đang chạy                   │
│  → Có thể RESET workflow về bất kỳ event nào                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Spring Ecosystem — Các Giải Pháp Tương Đương

### 4.1 Tổng Quan Các Giải Pháp

```
┌─────────────────────────────────────────────────────────────────────┐
│          SPRING ECOSYSTEM — SAGA / DISTRIBUTED TRANSACTION          │
│                                                                     │
│  ┌───── Code-First (Developer-Oriented) ─────────────────────────┐ │
│  │                                                                 │ │
│  │  [1] Manual Saga (Spring Boot + Kafka)                         │ │
│  │      → Tự code orchestrator, state machine, compensation       │ │
│  │      → Flexibility cao nhất, effort cao nhất                    │ │
│  │                                                                 │ │
│  │  [2] Spring Statemachine                                       │ │
│  │      → State machine framework cho orchestrator                │ │
│  │      → Quản lý trạng thái saga rõ ràng                         │ │
│  │                                                                 │ │
│  │  [3] Eventuate Tram Sagas (Chris Richardson)                   │ │
│  │      → Saga framework chuyên dụng, DSL-based                  │ │
│  │      → Transactional Outbox built-in                           │ │
│  │                                                                 │ │
│  │  [4] Axon Framework                                            │ │
│  │      → DDD + CQRS + Event Sourcing + Saga                     │ │
│  │      → Full-featured nhưng opinionated                         │ │
│  │                                                                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───── BPMN-Based (Business Process) ───────────────────────────┐ │
│  │                                                                 │ │
│  │  [5] Camunda / Zeebe                                           │ │
│  │      → BPMN 2.0, visual modeling                               │ │
│  │      → Bridge business ↔ IT                                    │ │
│  │                                                                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───── Modular Monolith ─────────────────────────────────────────┐ │
│  │                                                                 │ │
│  │  [6] Spring Modulith                                           │ │
│  │      → Module boundaries trong monolith                        │ │
│  │      → Application events (NOT distributed)                    │ │
│  │      → Stepping stone → microservices                          │ │
│  │                                                                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 [Giải Pháp 1] Manual Saga — Spring Boot + Kafka

```java
// Tự implement Saga Orchestrator bằng Spring Boot
// → KHÔNG dùng framework bên ngoài

// ═══ SAGA ORCHESTRATOR ═══
@Service
public class OrderSagaOrchestrator {
    @Autowired private KafkaTemplate<String, Object> kafka;
    @Autowired private SagaStateRepository sagaStateRepo;

    @Transactional  // Outbox pattern
    public void startSaga(OrderRequest request) {
        // 1. Create saga state
        SagaState saga = SagaState.builder()
            .sagaId(UUID.randomUUID().toString())
            .orderId(request.getOrderId())
            .currentStep("PAYMENT_PENDING")
            .status(SagaStatus.STARTED)
            .data(JsonUtil.toJson(request))
            .build();
        sagaStateRepo.save(saga);

        // 2. Send command to Payment Service
        kafka.send("payment-commands",
            new ChargePaymentCommand(saga.getSagaId(), request.getPaymentInfo()));
    }

    // ═══ EVENT HANDLERS — React to responses ═══
    @KafkaListener(topics = "payment-events")
    public void onPaymentEvent(PaymentEvent event) {
        SagaState saga = sagaStateRepo.findById(event.getSagaId()).orElseThrow();

        switch (event.getType()) {
            case PAYMENT_CHARGED:
                saga.setCurrentStep("INVENTORY_PENDING");
                saga.setPaymentTxId(event.getTransactionId());
                sagaStateRepo.save(saga);
                // Next step
                kafka.send("inventory-commands",
                    new ReserveInventoryCommand(saga.getSagaId(), saga.getItems()));
                break;

            case PAYMENT_FAILED:
                saga.setStatus(SagaStatus.FAILED);
                saga.setCurrentStep("CANCELLED");
                sagaStateRepo.save(saga);
                // No compensation needed (payment was step 1)
                break;
        }
    }

    @KafkaListener(topics = "inventory-events")
    public void onInventoryEvent(InventoryEvent event) {
        SagaState saga = sagaStateRepo.findById(event.getSagaId()).orElseThrow();

        switch (event.getType()) {
            case INVENTORY_RESERVED:
                saga.setCurrentStep("COMPLETED");
                saga.setStatus(SagaStatus.COMPLETED);
                sagaStateRepo.save(saga);
                break;

            case INVENTORY_FAILED:
                // ═══ COMPENSATION ═══
                saga.setCurrentStep("COMPENSATING_PAYMENT");
                saga.setStatus(SagaStatus.COMPENSATING);
                sagaStateRepo.save(saga);
                // Refund payment
                kafka.send("payment-commands",
                    new RefundPaymentCommand(saga.getSagaId(), saga.getPaymentTxId()));
                break;
        }
    }

    @KafkaListener(topics = "payment-compensation-events")
    public void onPaymentCompensation(PaymentCompensationEvent event) {
        SagaState saga = sagaStateRepo.findById(event.getSagaId()).orElseThrow();
        saga.setCurrentStep("FULLY_COMPENSATED");
        saga.setStatus(SagaStatus.COMPENSATED);
        sagaStateRepo.save(saga);
    }
}

// ═══ SAGA STATE TABLE ═══
// CREATE TABLE saga_states (
//   saga_id       VARCHAR(36) PRIMARY KEY,
//   order_id      VARCHAR(36),
//   current_step  VARCHAR(50),
//   status        VARCHAR(20),   -- STARTED, COMPENSATING, COMPLETED, COMPENSATED, FAILED
//   payment_tx_id VARCHAR(100),
//   data          JSONB,
//   created_at    TIMESTAMPTZ,
//   updated_at    TIMESTAMPTZ
// );
```

**Đánh giá Manual Saga:**
```
✅ Ưu điểm:
   • Full control — customize mọi thứ
   • Không dependency bên ngoài (ngoài Kafka)
   • Team quen Spring Boot → dễ bắt đầu

❌ Nhược điểm:
   • 200-500 dòng boilerplate cho MỖI saga
   • Tự handle retry, timeout, dead letter
   • Tự handle idempotency (duplicate events)
   • Tự build monitoring/visibility
   • Debug = nightmare (trace events qua Kafka)
   • State machine phức tạp khi >5 steps
   • Race conditions khi concurrent events
```

### 4.3 [Giải Pháp 2] Spring Statemachine

```java
// Spring Statemachine — Quản lý state transitions của Saga

// ═══ STATE & EVENT DEFINITIONS ═══
public enum SagaStates {
    INITIAL,
    PAYMENT_PENDING,
    PAYMENT_COMPLETED,
    INVENTORY_PENDING,
    INVENTORY_COMPLETED,
    SHIPPING_PENDING,
    ORDER_COMPLETED,
    COMPENSATING_SHIPPING,
    COMPENSATING_INVENTORY,
    COMPENSATING_PAYMENT,
    ORDER_FAILED
}

public enum SagaEvents {
    START_ORDER,
    PAYMENT_SUCCESS, PAYMENT_FAILED,
    INVENTORY_SUCCESS, INVENTORY_FAILED,
    SHIPPING_SUCCESS, SHIPPING_FAILED,
    COMPENSATION_DONE
}

// ═══ STATE MACHINE CONFIG ═══
@Configuration
@EnableStateMachineFactory
public class OrderSagaStateMachineConfig
        extends StateMachineConfigurerAdapter<SagaStates, SagaEvents> {

    @Override
    public void configure(StateMachineStateConfigurer<SagaStates, SagaEvents> states)
            throws Exception {
        states.withStates()
            .initial(SagaStates.INITIAL)
            .state(SagaStates.PAYMENT_PENDING)
            .state(SagaStates.INVENTORY_PENDING)
            .state(SagaStates.SHIPPING_PENDING)
            .end(SagaStates.ORDER_COMPLETED)
            .end(SagaStates.ORDER_FAILED);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<SagaStates, SagaEvents> transitions)
            throws Exception {
        transitions
            // Happy path
            .withExternal().source(INITIAL).target(PAYMENT_PENDING)
                .event(START_ORDER).action(chargePaymentAction())
            .and()
            .withExternal().source(PAYMENT_PENDING).target(INVENTORY_PENDING)
                .event(PAYMENT_SUCCESS).action(reserveInventoryAction())
            .and()
            .withExternal().source(INVENTORY_PENDING).target(SHIPPING_PENDING)
                .event(INVENTORY_SUCCESS).action(createShipmentAction())
            .and()
            .withExternal().source(SHIPPING_PENDING).target(ORDER_COMPLETED)
                .event(SHIPPING_SUCCESS)

            // Compensation path
            .and()
            .withExternal().source(PAYMENT_PENDING).target(ORDER_FAILED)
                .event(PAYMENT_FAILED)
            .and()
            .withExternal().source(INVENTORY_PENDING).target(COMPENSATING_PAYMENT)
                .event(INVENTORY_FAILED).action(refundPaymentAction())
            .and()
            .withExternal().source(SHIPPING_PENDING).target(COMPENSATING_INVENTORY)
                .event(SHIPPING_FAILED).action(releaseInventoryAction())
            .and()
            .withExternal().source(COMPENSATING_INVENTORY).target(COMPENSATING_PAYMENT)
                .event(COMPENSATION_DONE).action(refundPaymentAction())
            .and()
            .withExternal().source(COMPENSATING_PAYMENT).target(ORDER_FAILED)
                .event(COMPENSATION_DONE);
    }
}
```

```
STATE DIAGRAM:

  ┌─────────┐  START    ┌─────────────┐  PAY_OK   ┌──────────────┐
  │ INITIAL │─────────►│PAY_PENDING  │──────────►│INV_PENDING   │
  └─────────┘          └──────┬──────┘          └──────┬───────┘
                              │ PAY_FAIL                │
                              ▼                         │ INV_OK
                       ┌──────────┐                     ▼
                       │ FAILED   │           ┌──────────────┐
                       └──────────┘           │SHIP_PENDING  │
                              ▲               └──────┬───────┘
                              │ COMP_DONE             │ SHIP_OK
                       ┌──────┴──────┐               ▼
                       │COMP_PAYMENT │        ┌──────────────┐
                       └──────┬──────┘        │ COMPLETED    │
                              ▲ COMP_DONE     └──────────────┘
                       ┌──────┴──────┐
                       │COMP_INVNTRY │ ◄── SHIP_FAIL / INV_FAIL
                       └─────────────┘
```

**Đánh giá Spring Statemachine:**
```
✅ Ưu điểm:
   • State transitions rõ ràng, visual
   • Spring ecosystem native
   • Persist state (Redis, JPA, MongoDB)
   • Guards (conditional transitions)

❌ Nhược điểm:
   • Chỉ là state machine, KHÔNG phải durable execution
   • Không auto-retry activities
   • Không distributed by default (cần thêm persistence)
   • Không có timeline/history UI
   • Boilerplate config cho state machine vẫn nhiều
   • Worker crash → phải tự recover
```

### 4.4 [Giải Pháp 3] Eventuate Tram Sagas

```java
// Eventuate Tram — Saga framework chuyên dụng của Chris Richardson
// (Tác giả "Microservices Patterns")

// ═══ POM DEPENDENCY ═══
// <dependency>
//     <groupId>io.eventuate.tram.sagas</groupId>
//     <artifactId>eventuate-tram-sagas-spring-boot-starter</artifactId>
//     <version>0.24.0</version>
// </dependency>

// ═══ SAGA DEFINITION (DSL) ═══
@Component
public class CreateOrderSaga implements SimpleSaga<CreateOrderSagaData> {

    private final SagaDefinition<CreateOrderSagaData> sagaDefinition;

    public CreateOrderSaga(/* inject services */) {
        this.sagaDefinition = step()
            // Step 1: Reserve order
            .invokeLocal(this::createOrder)
            .withCompensation(this::rejectOrder)

            // Step 2: Verify customer credit
            .step()
            .invokeParticipant(this::verifyCustomerCredit)
            .onReply(CustomerCreditReserved.class, this::handleCreditReserved)
            .withCompensation(this::releaseCreditReservation)

            // Step 3: Charge payment
            .step()
            .invokeParticipant(this::chargePayment)
            .onReply(PaymentCharged.class, this::handlePaymentCharged)
            .withCompensation(this::refundPayment)

            // Step 4: Approve order (local — no compensation needed)
            .step()
            .invokeLocal(this::approveOrder)

            .build();
    }

    @Override
    public SagaDefinition<CreateOrderSagaData> getSagaDefinition() {
        return sagaDefinition;
    }

    // ═══ STEP IMPLEMENTATIONS ═══
    private void createOrder(CreateOrderSagaData data) {
        // Local transaction — create order with PENDING status
        Order order = orderRepository.save(Order.create(data));
        data.setOrderId(order.getId());
    }

    private CommandWithDestination verifyCustomerCredit(CreateOrderSagaData data) {
        // Send command to Customer Service via messaging
        return send(new VerifyCreditCommand(data.getCustomerId(), data.getAmount()))
            .to("customer-service")
            .build();
    }

    private void handleCreditReserved(CreateOrderSagaData data,
                                       CustomerCreditReserved reply) {
        data.setCreditReservationId(reply.getReservationId());
    }

    // ═══ COMPENSATION IMPLEMENTATIONS ═══
    private void rejectOrder(CreateOrderSagaData data) {
        orderRepository.findById(data.getOrderId())
            .ifPresent(order -> {
                order.setStatus(OrderStatus.REJECTED);
                orderRepository.save(order);
            });
    }

    private CommandWithDestination releaseCreditReservation(CreateOrderSagaData data) {
        return send(new ReleaseCreditCommand(data.getCreditReservationId()))
            .to("customer-service")
            .build();
    }

    private CommandWithDestination refundPayment(CreateOrderSagaData data) {
        return send(new RefundPaymentCommand(data.getPaymentTxId()))
            .to("payment-service")
            .build();
    }
}

// ═══ SAGA DATA (State container) ═══
@Data
public class CreateOrderSagaData {
    private String orderId;
    private String customerId;
    private BigDecimal amount;
    private List<OrderItem> items;
    private String creditReservationId;
    private String paymentTxId;
}

// ═══ USAGE — Trigger saga ═══
@Service
public class OrderService {
    @Autowired private SagaInstanceFactory sagaInstanceFactory;
    @Autowired private CreateOrderSaga createOrderSaga;

    public String createOrder(CreateOrderRequest request) {
        CreateOrderSagaData data = new CreateOrderSagaData(request);
        sagaInstanceFactory.create(createOrderSaga, data);
        return data.getOrderId();
    }
}
```

**Đánh giá Eventuate Tram:**
```
✅ Ưu điểm:
   • DSL rõ ràng: step → compensation chain
   • Transactional Outbox built-in (dual write protection)
   • Chris Richardson — author of the pattern
   • CDC support (Debezium integration)
   • Saga state tự persist
   • Spring Boot native

❌ Nhược điểm:
   • Community nhỏ hơn Temporal
   • Không có built-in UI (phải tự build monitoring)
   • Chỉ cho Java/Spring (không polyglot)
   • Learning curve: phải hiểu messaging infra
   • Không support long-running workflows (days/weeks)
   • Retry policy hạn chế hơn Temporal
```

### 4.5 [Giải Pháp 4] Axon Framework

```java
// Axon Framework — DDD + CQRS + Event Sourcing + Saga

// ═══ POM ═══
// <dependency>
//     <groupId>org.axonframework</groupId>
//     <artifactId>axon-spring-boot-starter</artifactId>
//     <version>4.10.0</version>
// </dependency>

// ═══ SAGA ═══
@Saga  // Axon annotation — lifecycle managed by framework
public class OrderSaga {

    @Autowired
    private transient CommandGateway commandGateway;

    private String orderId;
    private String paymentId;

    // ═══ SAGA START ═══
    @StartSaga
    @SagaEventHandler(associationProperty = "orderId")
    public void on(OrderCreatedEvent event) {
        this.orderId = event.getOrderId();

        // Step 1: Command → Payment Service
        commandGateway.send(new ChargePaymentCommand(
            UUID.randomUUID().toString(),
            event.getOrderId(),
            event.getAmount()
        ));
    }

    // ═══ STEP 2: Payment response ═══
    @SagaEventHandler(associationProperty = "orderId")
    public void on(PaymentChargedEvent event) {
        this.paymentId = event.getPaymentId();

        // Step 2 success → Step 3: Reserve inventory
        commandGateway.send(new ReserveInventoryCommand(
            event.getOrderId(),
            event.getItems()
        ));
    }

    @SagaEventHandler(associationProperty = "orderId")
    public void on(PaymentFailedEvent event) {
        // Step 2 failed → Compensate: reject order
        commandGateway.send(new RejectOrderCommand(orderId, event.getReason()));
    }

    // ═══ STEP 3: Inventory response ═══
    @SagaEventHandler(associationProperty = "orderId")
    public void on(InventoryReservedEvent event) {
        // All steps done → confirm order
        commandGateway.send(new ConfirmOrderCommand(orderId));
    }

    @SagaEventHandler(associationProperty = "orderId")
    public void on(InventoryReservationFailedEvent event) {
        // Step 3 failed → Compensate: refund payment
        commandGateway.send(new RefundPaymentCommand(paymentId));
    }

    // ═══ COMPENSATION HANDLERS ═══
    @SagaEventHandler(associationProperty = "orderId")
    public void on(PaymentRefundedEvent event) {
        // After refund → reject order
        commandGateway.send(new RejectOrderCommand(orderId, "Inventory unavailable"));
    }

    @EndSaga
    @SagaEventHandler(associationProperty = "orderId")
    public void on(OrderConfirmedEvent event) {
        // Saga completed successfully
    }

    @EndSaga
    @SagaEventHandler(associationProperty = "orderId")
    public void on(OrderRejectedEvent event) {
        // Saga completed with compensation
    }
}
```

**Đánh giá Axon Framework:**
```
✅ Ưu điểm:
   • Full DDD ecosystem: Aggregate, Command, Event, Saga
   • Event Sourcing built-in → audit trail tự nhiên
   • CQRS native support
   • Axon Server: distributed message routing, event store
   • Axon Server UI: workflow monitoring
   • Active community, enterprise support

❌ Nhược điểm:
   • Rất opinionated — phải follow Axon way
   • Learning curve CAO (DDD + CQRS + ES + Saga)
   • Lock-in: khó migrate ra khỏi Axon
   • Saga dạng reactive (event-driven), không phải code tuần tự
   • Axon Server license (enterprise features)
   • Performance overhead với Event Sourcing
```

### 4.6 [Giải Pháp 5] Camunda / Zeebe

```java
// Camunda 8 (Zeebe engine) — BPMN-based orchestration

// ═══ POM ═══
// <dependency>
//     <groupId>io.camunda</groupId>
//     <artifactId>spring-boot-starter-camunda-sdk</artifactId>
//     <version>8.6.0</version>
// </dependency>

// ═══ BPMN Process (XML — thường thiết kế bằng Camunda Modeler) ═══
// order-saga.bpmn — Visual BPMN diagram defines:
//   Start → ChargePayment → ReserveInventory → CreateShipment → End
//          ↓ (error)         ↓ (error)          ↓ (error)
//          End               RefundPayment       ReleaseInventory
//                            → End               → RefundPayment → End

// ═══ JOB WORKERS (Activity implementations) ═══
@Component
public class PaymentJobWorker {

    @JobWorker(type = "charge-payment")
    public Map<String, Object> chargePayment(
            @Variable String orderId,
            @Variable BigDecimal amount,
            @Variable String currency) {

        PaymentResult result = paymentGateway.charge(orderId, amount, currency);

        return Map.of(
            "paymentTxId", result.getTransactionId(),
            "paymentStatus", result.getStatus().name()
        );
    }

    @JobWorker(type = "refund-payment")
    public void refundPayment(@Variable String paymentTxId) {
        paymentGateway.refund(paymentTxId);
    }
}

@Component
public class InventoryJobWorker {

    @JobWorker(type = "reserve-inventory")
    public Map<String, Object> reserveInventory(
            @Variable String orderId,
            @Variable List<String> itemIds) {

        String reservationId = inventoryService.reserve(orderId, itemIds);
        return Map.of("reservationId", reservationId);
    }

    @JobWorker(type = "release-inventory")
    public void releaseInventory(@Variable String reservationId) {
        inventoryService.release(reservationId);
    }
}

// ═══ START PROCESS ═══
@Service
public class OrderService {
    @Autowired private ZeebeClient zeebeClient;

    public String createOrder(OrderRequest request) {
        ProcessInstanceEvent process = zeebeClient.newCreateInstanceCommand()
            .bpmnProcessId("order-saga")
            .latestVersion()
            .variables(Map.of(
                "orderId", request.getOrderId(),
                "amount", request.getAmount(),
                "items", request.getItems()
            ))
            .send()
            .join();

        return String.valueOf(process.getProcessInstanceKey());
    }
}
```

**Đánh giá Camunda/Zeebe:**
```
✅ Ưu điểm:
   • BPMN 2.0 standard — visual process modeling
   • Business ↔ IT alignment (cùng xem 1 diagram)
   • Compensation built-in (BPMN compensation events)
   • Operate UI: process monitoring, incident management
   • Multi-language support (Java, Go, C#, Python)
   • Zeebe: cloud-native, horizontally scalable

❌ Nhược điểm:
   • BPMN learning curve (cho developers)
   • XML-based process definitions (code + XML dual maintenance)
   • Heavier infrastructure (Zeebe cluster + Elasticsearch)
   • License model changed (Camunda 8 SaaS pricing)
   • Over-engineering cho simple flows
```

### 4.7 [Giải Pháp 6] Spring Modulith

```java
// Spring Modulith — Module boundaries TRONG monolith
// KHÔNG phải distributed saga, nhưng giải quyết vấn đề tương tự
// ở scale nhỏ hơn (cùng JVM, cùng database)

// ═══ MODULE STRUCTURE ═══
// com.example.shop/
// ├── order/          ← Bounded context
// │   ├── Order.java
// │   ├── OrderService.java
// │   └── OrderCompleted.java (Application Event)
// ├── payment/        ← Bounded context
// │   ├── Payment.java
// │   └── PaymentService.java
// └── inventory/      ← Bounded context
//     ├── Stock.java
//     └── InventoryService.java

// ═══ EVENT-DRIVEN WITHIN MONOLITH ═══
@Service
@Transactional
public class OrderService {
    @Autowired private ApplicationEventPublisher events;
    @Autowired private OrderRepository orderRepo;

    public Order createOrder(CreateOrderRequest request) {
        Order order = Order.create(request);
        orderRepo.save(order);

        // Publish application event (WITHIN same JVM)
        events.publishEvent(new OrderCreatedEvent(
            order.getId(), order.getAmount(), order.getItems()));

        return order;
    }
}

// ═══ ASYNC LISTENER (same JVM, different module) ═══
@Service
public class PaymentEventListener {

    @Autowired private PaymentService paymentService;

    @ApplicationModuleListener  // Spring Modulith annotation
    // OR: @TransactionalEventListener(phase = AFTER_COMMIT)
    public void onOrderCreated(OrderCreatedEvent event) {
        paymentService.processPayment(event.getOrderId(), event.getAmount());
    }
}

// ═══ SPRING MODULITH BENEFITS ═══
// 1. Module boundary enforcement (compile-time checks)
// 2. Event publication log (for debugging)
// 3. Easy migration path to microservices
//    → Replace ApplicationEvent with Kafka/RabbitMQ later
// 4. @Async event processing
// 5. Transactional event listeners (AFTER_COMMIT)
```

**Đánh giá Spring Modulith:**
```
✅ Ưu điểm:
   • Zero infrastructure overhead
   • Spring native (ApplicationEvent)
   • Module boundary verification
   • Easy migration to microservices later
   • Simple mental model
   • @Transactional works normally (same DB)

❌ Nhược điểm:
   • KHÔNG phải distributed saga (cùng JVM/DB)
   • KHÔNG có compensation mechanism built-in
   • KHÔNG scale independently
   • Khi cần distribute → phải re-architect
   • Chỉ phù hợp cho Modular Monolith stage
```

---

## 5. So Sánh Toàn Diện — Decision Matrix

### 5.1 Feature Matrix

```
┌────────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Feature                │ Temporal │ Manual   │ Spring   │ Eventuate│ Axon     │ Camunda  │ Spring   │
│                        │          │ Saga+    │ State    │ Tram     │ Framework│ /Zeebe   │ Modulith │
│                        │          │ Kafka    │ Machine  │          │          │          │          │
├────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Distributed Saga       │    ✅    │    ✅    │    ⚠️    │    ✅    │    ✅    │    ✅    │    ❌    │
│ Durable Execution      │    ✅    │    ❌    │    ❌    │    ❌    │    ⚠️    │    ✅    │    ❌    │
│ Auto Retry/Timeout     │    ✅    │    ❌    │    ❌    │    ⚠️    │    ⚠️    │    ✅    │    ❌    │
│ Compensation           │    ✅    │    ✅    │    ✅    │    ✅    │    ✅    │    ✅    │    ❌    │
│ Built-in UI            │    ✅    │    ❌    │    ❌    │    ❌    │    ✅¹   │    ✅    │    ❌    │
│ Long-running (days+)   │    ✅    │    ❌    │    ❌    │    ❌    │    ⚠️    │    ✅    │    ❌    │
│ Human-in-the-Loop      │    ✅    │    ❌    │    ❌    │    ❌    │    ❌    │    ✅    │    ❌    │
│ Scheduled Workflows    │    ✅    │    ❌    │    ❌    │    ❌    │    ❌    │    ✅    │    ❌    │
│ Event Sourcing         │    ❌    │    ❌    │    ❌    │    ❌    │    ✅    │    ❌    │    ❌    │
│ CQRS                   │    ❌    │    ❌    │    ❌    │    ❌    │    ✅    │    ❌    │    ❌    │
│ BPMN Visual            │    ❌    │    ❌    │    ⚠️    │    ❌    │    ❌    │    ✅    │    ❌    │
│ Zero Infra Overhead    │    ❌    │    ❌    │    ✅    │    ❌    │    ⚠️    │    ❌    │    ✅    │
│ Polyglot               │    ✅    │    ❌    │    ❌    │    ❌    │    ❌    │    ✅    │    ❌    │
│ Code-First             │    ✅    │    ✅    │    ✅    │    ✅    │    ✅    │    ❌²   │    ✅    │
│ Spring Integration     │    ✅    │    ✅    │    ✅    │    ✅    │    ✅    │    ✅    │    ✅    │
│ Testing                │    ✅³   │    ⚠️    │    ✅    │    ⚠️    │    ✅    │    ⚠️    │    ✅    │
│ Community (2026)       │    🔥    │    N/A   │    ⚠️    │    ⚠️    │    ✅    │    ✅    │    🔥    │
└────────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

¹ Axon Server Dashboard (enterprise license)
² Camunda: BPMN-first, code là worker implementation
³ Temporal: Test framework cho workflow unit testing
```

### 5.2 Complexity vs Capability Trade-off

```
                          CAPABILITY
                              ▲
                              │
                    Temporal  │  ████████████████████
                              │  ████████████████████
                              │
                    Camunda   │  ██████████████████
                              │  ██████████████████
                              │
                    Axon      │  ████████████████
                              │  ████████████████
                              │
                    Eventuate │  ████████████
                              │  ████████████
                              │
                    Manual    │  ██████████
                    Saga      │  ██████████
                              │
                    State     │  ████████
                    Machine   │  ████████
                              │
                    Modulith  │  ████
                              │  ████
                              └──────────────────────────► COMPLEXITY
                    Low       Medium      High        Very High

                    ← Infrastructure Overhead →
                    ← Learning Curve →
                    ← Team Investment →
```

### 5.3 Cost Analysis

| Giải pháp | Infra Cost | Dev Cost (Initial) | Dev Cost (Maintain) | Total Cost |
|---|---|---|---|---|
| **Spring Modulith** | $0 | Low | Low | 💚 Lowest |
| **Manual Saga** | Kafka only | Medium | **Very High** | 🟡 Hidden cost |
| **Spring Statemachine** | $0 | Medium | Medium | 💚 Low |
| **Eventuate Tram** | Kafka + CDC | Medium | Medium | 🟡 Medium |
| **Temporal** | Temporal cluster | Medium | **Low** | 💚 Low long-term |
| **Axon Framework** | Axon Server | High | Medium | 🟡 Medium |
| **Camunda/Zeebe** | Zeebe + ES | High | Medium | 🔴 High |

> **Insight**: Manual Saga có initial cost thấp nhưng maintenance cost RẤT CAO. Temporal ngược lại: initial investment cho cluster, nhưng mỗi saga mới chỉ cần viết business logic.

---

## 6. Khi Nào Chọn Giải Pháp Nào?

### 6.1 Decision Tree

```
START: Bạn cần distributed transaction / saga?
  │
  ├── Chưa, đang monolith
  │   └── ✅ Spring Modulith
  │       → Module boundaries + ApplicationEvent
  │       → Chuẩn bị sẵn cho microservices later
  │
  ├── Có, nhưng flow đơn giản (2-3 steps)
  │   ├── Team đã có Kafka?
  │   │   └── ✅ Manual Saga (Spring + Kafka)
  │   │       → Tự code, full control
  │   │
  │   └── Không có message broker?
  │       └── ✅ Spring Statemachine
  │           → State machine trong application
  │
  ├── Có, flow phức tạp (>3 steps, compensation)
  │   ├── Team dùng DDD + Event Sourcing?
  │   │   └── ✅ Axon Framework
  │   │       → Full DDD ecosystem
  │   │
  │   ├── Cần BPMN visual cho business stakeholders?
  │   │   └── ✅ Camunda / Zeebe
  │   │       → Bridge business ↔ IT
  │   │
  │   ├── Cần long-running (days/weeks/months)?
  │   │   └── ✅ Temporal
  │   │       → Durable execution, built-in timers
  │   │
  │   └── Cần reliable orchestration + code-first?
  │       └── ✅ Temporal
  │           → Industry standard 2026
  │
  └── Có, cần tất cả: DDD + Saga + Long-running
      └── ✅ Temporal + Domain Events (Kafka)
          → Temporal cho orchestration
          → Kafka cho event-driven decoupling
          → Best of both worlds
```

### 6.2 Recommendations Theo Context

| Context | Recommendation | Lý do |
|---|---|---|
| **Startup MVP** | Spring Modulith → Manual Saga | Bắt đầu monolith, extract khi cần |
| **Mid-size (5-20 services)** | **Temporal** | Complexity tăng → cần durable execution |
| **Enterprise (regulated)** | Camunda + Temporal | BPMN cho audit, Temporal cho tech flows |
| **DDD-heavy team** | Axon Framework | Ecosystem phù hợp nhất |
| **Existing Spring Cloud** | Eventuate Tram | Ít thay đổi architecture |
| **Polyglot (Java + Go + Python)** | Temporal | Multi-language SDK |
| **Budget constrained** | Manual Saga + Spring SM | Không thêm infra |

---

## 7. Production Patterns & Anti-Patterns

### 7.1 Best Practices

```
═══ [1] IDEMPOTENCY — Quy tắc vàng ═══

  Mọi Activity / Saga step PHẢI idempotent vì:
  → Temporal retry
  → Kafka redelivery
  → Network duplicate

  Pattern: Idempotency Key
  ┌────────────────────────────────────────────────────┐
  │  paymentService.charge(idempotencyKey, amount)     │
  │                                                    │
  │  // Implementation:                                │
  │  if (exists(idempotencyKey)) return cached_result; │
  │  result = doCharge(amount);                        │
  │  store(idempotencyKey, result);                    │
  │  return result;                                    │
  └────────────────────────────────────────────────────┘

═══ [2] COMPENSATION DESIGN — "Semantic Undo" ═══

  ❌ KHÔNG PHẢI database rollback:
     DELETE FROM orders WHERE id = ?
     
  ✅ Business-level undo:
     INSERT INTO orders (id, status) VALUES (?, 'CANCELLED')
     INSERT INTO refunds (order_id, amount) VALUES (?, ?)
     
  → Compensation tạo RECORD MỚI, không xóa record cũ
  → Audit trail preserved

═══ [3] TIMEOUT STRATEGY ═══

  Per-Activity timeout (không 1 size fits all):
  
  │ Activity            │ Start-to-Close │ Schedule-to-Start │ Heartbeat │
  │─────────────────────│────────────────│───────────────────│───────────│
  │ chargePayment       │ 30s            │ 10s               │ N/A       │
  │ reserveInventory    │ 10s            │ 5s                │ N/A       │
  │ createShipment      │ 5min           │ 30s               │ 30s       │
  │ generateReport      │ 1hour          │ 5min              │ 5min      │
  │ waitForApproval     │ 72hours        │ N/A               │ N/A       │

═══ [4] VERSIONING WORKFLOWS ═══

  // Temporal: Workflow code THAY ĐỔI → running workflows có thể break
  // Solution: Patched workflow

  @Override
  public OrderResult processOrder(OrderRequest request) {
      PaymentResult payment = paymentAct.charge(request);

      if (Workflow.getVersion("add-fraud-check", Workflow.DEFAULT_VERSION, 1) >= 1) {
          // Version 1: Added fraud check (new workflows only)
          fraudCheckAct.check(request);
      }

      inventoryAct.reserve(request.getItems());
      return OrderResult.success(payment);
  }
```

### 7.2 Anti-Patterns

```
═══ ❌ ANTI-PATTERN 1: Non-Idempotent Activities ═══

  // BAD: Charge customer again on retry!
  public PaymentResult charge(PaymentInfo info) {
      return stripe.charges.create(info);  // No idempotency key!
  }

  // GOOD: Idempotent with key
  public PaymentResult charge(PaymentInfo info) {
      return stripe.charges.create(info, 
          RequestOptions.builder()
              .setIdempotencyKey(info.getOrderId())
              .build());
  }

═══ ❌ ANTI-PATTERN 2: Non-deterministic Workflow ═══

  // BAD: Using system time in workflow
  if (Instant.now().isAfter(deadline)) { ... }

  // GOOD: Using Temporal time
  if (Workflow.currentTimeMillis() > deadlineMs) { ... }

═══ ❌ ANTI-PATTERN 3: Long Event History ═══

  // BAD: Workflow chạy mãi mãi, history grows unbounded
  while (true) {
      processItem(queue.poll());
  }
  // → History grows to millions of events → OOM, slow replay

  // GOOD: Continue-As-New (reset history)
  while (queue.hasItems()) {
      if (Workflow.getInfo().getHistoryLength() > 10_000) {
          Workflow.continueAsNew(remainingItems);  // ← Reset history!
          return;
      }
      processItem(queue.poll());
  }

═══ ❌ ANTI-PATTERN 4: Mixing Orchestration + Choreography ═══

  // BAD: Temporal workflow + random Kafka events that bypass orchestrator
  // → Split brain: Temporal thinks step is pending, but Kafka already compensated

  // GOOD: Temporal là SINGLE SOURCE OF TRUTH cho workflow state
  // → Kafka chỉ dùng cho event notification (not workflow control)
```

### 7.3 Monitoring & Alerting

```
┌─────────────────────────────────────────────────────────────────┐
│  SAGA MONITORING CHECKLIST                                       │
│                                                                   │
│  Metrics (Prometheus):                                           │
│  ├── temporal_workflow_completed_total{type="OrderSaga"}         │
│  ├── temporal_workflow_failed_total{type="OrderSaga"}            │
│  ├── temporal_workflow_execution_duration_seconds                │
│  ├── temporal_activity_execution_failed_total                    │
│  ├── saga_compensation_triggered_total                           │
│  └── saga_stuck_workflows (custom: running > 1 hour)            │
│                                                                   │
│  Alerts (Grafana):                                               │
│  ├── 🔴 CRITICAL: Compensation failure rate > 1%                │
│  ├── 🟡 WARNING:  Saga duration > 5min (normally 30s)           │
│  ├── 🟡 WARNING:  Stuck workflows > 0                           │
│  ├── 🔴 CRITICAL: Worker not picking up tasks > 2min            │
│  └── 🟡 WARNING:  Event history size > 50K events               │
│                                                                   │
│  Dashboards:                                                     │
│  ├── Saga Success Rate (per type, per hour)                      │
│  ├── Compensation Rate (trending up = problem)                   │
│  ├── Activity Duration Percentiles (p50, p95, p99)               │
│  ├── Worker Health (task poll latency, active workers)            │
│  └── Temporal Server Health (persistence latency, queue depth)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tóm Tắt

### Bản Đồ Giải Pháp

```
                         DISTRIBUTED
                              ▲
                              │
  Axon ─────────────────── Temporal ──────────────── Camunda
  (DDD+ES+CQRS)           (Durable Execution)      (BPMN Visual)
                              │
                              │
  Eventuate Tram ─────── Manual Saga ──────── Spring Statemachine
  (Saga Framework)       (DIY Spring+Kafka)  (State Transitions)
                              │
                              │
                       Spring Modulith
                    (Modular Monolith)
                              │
                          MONOLITH
```

### Key Takeaways

| # | Insight |
|---|---|
| 1 | **Temporal = Industry Standard 2026** cho complex orchestration. Code tuần tự, Temporal lo distributed complexity |
| 2 | **Spring Modulith** là starting point tốt nhất. Evolve to distributed saga khi thật sự cần |
| 3 | **Manual Saga** có hidden cost RẤT CAO. Maintenance, debugging, và edge cases ăn mòn team |
| 4 | **Axon Framework** chỉ chọn khi team ĐÃ commit DDD + Event Sourcing |
| 5 | **Camunda** chọn khi cần BPMN cho regulated industries hoặc business stakeholder involvement |
| 6 | **Eventuate Tram** là middle ground: structured hơn Manual Saga, nhẹ hơn Temporal |
| 7 | Mọi giải pháp đều YÊU CẦU **idempotency** — đây là foundation, không phải optional |
| 8 | **Temporal + Kafka** = best combo: Temporal cho orchestration, Kafka cho event-driven decoupling |

