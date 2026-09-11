# 04 — Tính Toán Hoàn Vốn

> [← So Sánh Thiết Bị](./03-so-sanh-thiet-bi.md) | [Tiếp: Quy Định Pháp Lý →](./05-quy-dinh-phap-ly.md)

---

## 4.1 Phương Án A (Hybrid 5kWp + 5kWh — ~85 triệu)

```
📊 DỮ LIỆU ĐẦU VÀO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Công suất hệ thống:         5.22 kWp
• Sản lượng trung bình/ngày:  ~20-22 kWh (4h nắng đỉnh)
• Sản lượng trung bình/tháng: ~600-660 kWh
• Sản lượng trung bình/năm:   ~7.200-7.920 kWh
• Tỷ lệ tự tiêu thụ:         ~80% (có pin lưu trữ)
• Giá điện trung bình tiết kiệm: ~2.800 đ/kWh (bậc 3-5)

📈 TÍNH TOÁN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Điện tự dùng/năm:   7.560 kWh × 80% = 6.048 kWh
• Tiền tiết kiệm/năm: 6.048 × 2.800   = 16.934.400 đ
• Điện bán dư/năm:    7.560 × 20% × 671đ = ~1.014.000 đ*
• Tổng lợi ích/năm:                     ≈ 17.950.000 đ

⏱️ THỜI GIAN HOÀN VỐN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  85.000.000 ÷ 17.950.000 ≈ 4.7 năm
```

---

## 4.2 Phương Án B (Hybrid 6kWp + 10kWh — ~122 triệu)

```
📊 DỮ LIỆU ĐẦU VÀO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Công suất hệ thống:         6 kWp
• Sản lượng trung bình/ngày:  ~24-26 kWh (4h nắng đỉnh)
• Sản lượng trung bình/tháng: ~720-780 kWh
• Sản lượng trung bình/năm:   ~8.640-9.360 kWh
• Tỷ lệ tự tiêu thụ:         ~85% (pin 10kWh lớn hơn)
• Giá điện trung bình tiết kiệm: ~3.000 đ/kWh (bậc 4-6)

📈 TÍNH TOÁN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Điện tự dùng/năm:   9.000 kWh × 85% = 7.650 kWh
• Tiền tiết kiệm/năm: 7.650 × 3.000   = 22.950.000 đ
• Điện bán dư/năm:    9.000 × 15% × 671đ = ~906.000 đ*
• Tổng lợi ích/năm:                     ≈ 23.856.000 đ

⏱️ THỜI GIAN HOÀN VỐN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  122.000.000 ÷ 23.856.000 ≈ 5.1 năm
```

> [!NOTE]
> *Giá bán điện dư cho EVN hiện tại rất thấp (~671 đ/kWh theo giá tránh được). Chiến lược tốt nhất là **tự tiêu thụ tối đa**, dùng pin lưu trữ thay vì bán dư.

---

## 4.3 Biểu Đồ Lợi Ích Tích Lũy

```
Triệu VNĐ
  300 ┤
      │                                           ╱ PA-B
  250 ┤                                       ╱ ╱
      │                                   ╱ ╱
  200 ┤                               ╱ ╱
      │                        ╱  ╱ ╱  PA-A
  150 ┤                    ╱ ╱ ╱
      │               ╱ ╱ ╱
  100 ┤─ ─ ─ ─ ╱ ╱ ╱─────── Hoàn vốn PA-B (~5.1 năm)
      │     ╱ ╱ ╱
   50 ┤─╱ ╱─────────────────── Hoàn vốn PA-A (~4.7 năm)
      │╱
    0 ┼──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬── Năm
      0  1  2  3  4  5  6  7  8  9  10 15 20
      
  ★ Sau 20 năm: PA-A tiết kiệm ~274 triệu | PA-B tiết kiệm ~355 triệu
```

---

## 4.4 Công Thức Tính Nhanh

> **Thời gian hoàn vốn (năm) = Tổng chi phí đầu tư ÷ Lợi ích tài chính hàng năm**

Trong đó:
- **Tổng chi phí đầu tư** = tấm pin + inverter + pin lưu trữ + khung + phụ kiện + nhân công
- **Lợi ích tài chính hàng năm** = (Điện tự dùng × Giá điện bậc cao) + (Điện bán dư × 671đ)

---

> [← So Sánh Thiết Bị](./03-so-sanh-thiet-bi.md) | [Tiếp: Quy Định Pháp Lý →](./05-quy-dinh-phap-ly.md)
