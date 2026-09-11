# 02 — Thiết Kế Hệ Thống

> [← Phân Tích Nhu Cầu](./01-phan-tich-nhu-cau.md) | [Tiếp: So Sánh Thiết Bị →](./03-so-sanh-thiet-bi.md)

---

## 2.1 So Sánh 3 Loại Hệ Thống

| Tiêu chí | On-grid (Hòa lưới) | Hybrid (Hòa lưới + Lưu trữ) | Off-grid (Độc lập) |
|:---|:---|:---|:---|
| **Chi phí** | ⭐ Thấp nhất | ⚡ Trung bình - Cao | 💰 Cao nhất |
| **Hoạt động khi mất điện** | ❌ Không | ✅ Có | ✅ Có |
| **Dùng điện ban đêm** | ❌ Lấy từ lưới | ✅ Lấy từ pin lưu trữ | ✅ Lấy từ pin |
| **Bán điện dư** | ✅ Có (qua lưới) | ✅ Có (linh hoạt) | ❌ Không |
| **Hoàn vốn** | 3-4 năm | 5-7 năm | 8-10 năm |
| **Phù hợp** | Dùng nhiều ban ngày | Cần dự phòng + ban đêm | Vùng sâu, không có lưới |

---

## 2.2 Khuyến Nghị

> [!TIP]
> **Phương án khuyến nghị: Hybrid 5-6 kWp + Pin lưu trữ 5-10 kWh**
> 
> Lý do:
> - Phòng trọ dùng điều hòa ban đêm → cần pin lưu trữ
> - Gia đình + phòng trọ cần điện ổn định → backup khi mất điện
> - Có thể bán điện dư lên lưới (tối đa 50% theo NĐ 243/2026)
> - Linh hoạt mở rộng thêm pin trong tương lai

---

## 2.3 Phương Án A — Tiết Kiệm (Hybrid 5kWp + 5kWh)

Phù hợp hóa đơn **~2 triệu/tháng** (gia đình + 2-3 phòng trọ nhỏ)

```
┌─────────────────────────────────────────────────────────┐
│                    SƠ ĐỒ HỆ THỐNG                       │
│                                                          │
│   ☀️ 9 tấm pin 580W          ┌──────────────┐           │
│   (Tổng: 5.22 kWp)      ────▶│  Inverter    │           │
│                               │  Hybrid 5kW  │           │
│   🔋 Pin Lithium LiFePO4 ◀──▶│  (Deye/      │──▶ 🏠 Tải│
│   5kWh (Pylontech US5000C)    │   Sungrow)   │    tiêu  │
│                               │              │──▶ 🔌 Lưới│
│                               └──────────────┘    EVN   │
└─────────────────────────────────────────────────────────┘
```

**Thành phần & Chi phí ước tính:**

| STT | Thiết bị | Thông số | Số lượng | Đơn giá | Thành tiền |
|:---:|:---|:---|:---:|---:|---:|
| 1 | Tấm pin Jinko N-type TOPCon | 580W | 9 tấm | 2.800.000 | 25.200.000 |
| 2 | Inverter Hybrid Deye SUN-5K-SG04LP1 | 5kW, 1 pha | 1 bộ | 22.000.000 | 22.000.000 |
| 3 | Pin lưu trữ Pylontech US5000C | 4.8kWh LiFePO4 | 1 bộ | 20.000.000 | 20.000.000 |
| 4 | Khung giá đỡ nhôm + inox | Mái tôn/bê tông | 1 bộ | 5.000.000 | 5.000.000 |
| 5 | Dây cáp DC + AC + phụ kiện | MC4, DC breaker, AC breaker | 1 bộ | 4.000.000 | 4.000.000 |
| 6 | Tủ điện, CB chống dòng rò | RCBO, MCB, SPD | 1 bộ | 3.000.000 | 3.000.000 |
| 7 | Nhân công lắp đặt + thủ tục | Trọn gói | 1 | 6.000.000 | 6.000.000 |
| | | | | **TỔNG** | **~85.000.000** |

---

## 2.4 Phương Án B — Tối Ưu (Hybrid 6kWp + 10kWh)

Phù hợp hóa đơn **~3 triệu/tháng** (gia đình + 3-5 phòng trọ có điều hòa)

```
┌─────────────────────────────────────────────────────────┐
│                    SƠ ĐỒ HỆ THỐNG                       │
│                                                          │
│   ☀️ 10 tấm pin 600W         ┌──────────────┐           │
│   (Tổng: 6 kWp)         ────▶│  Inverter    │           │
│                               │  Hybrid 6kW  │           │
│   🔋 Pin Lithium LiFePO4 ◀──▶│  (Sungrow/   │──▶ 🏠 Tải│
│   10kWh (2x Pylontech)       │   Deye)      │    tiêu  │
│                               │              │──▶ 🔌 Lưới│
│                               └──────────────┘    EVN   │
└─────────────────────────────────────────────────────────┘
```

**Thành phần & Chi phí ước tính:**

| STT | Thiết bị | Thông số | Số lượng | Đơn giá | Thành tiền |
|:---:|:---|:---|:---:|---:|---:|
| 1 | Tấm pin JA Solar N-type TOPCon | 600W | 10 tấm | 3.200.000 | 32.000.000 |
| 2 | Inverter Hybrid Sungrow SH6.0RS | 6kW, 1 pha | 1 bộ | 28.000.000 | 28.000.000 |
| 3 | Pin lưu trữ Pylontech US5000C | 4.8kWh LiFePO4 | 2 bộ | 20.000.000 | 40.000.000 |
| 4 | Khung giá đỡ nhôm + inox | Mái tôn/bê tông | 1 bộ | 6.000.000 | 6.000.000 |
| 5 | Dây cáp DC + AC + phụ kiện | MC4, DC breaker, AC breaker | 1 bộ | 5.000.000 | 5.000.000 |
| 6 | Tủ điện, CB chống dòng rò | RCBO, MCB, SPD | 1 bộ | 3.500.000 | 3.500.000 |
| 7 | Nhân công lắp đặt + thủ tục | Trọn gói | 1 | 7.500.000 | 7.500.000 |
| | | | | **TỔNG** | **~122.000.000** |

---

> [← Phân Tích Nhu Cầu](./01-phan-tich-nhu-cau.md) | [Tiếp: So Sánh Thiết Bị →](./03-so-sanh-thiet-bi.md)
