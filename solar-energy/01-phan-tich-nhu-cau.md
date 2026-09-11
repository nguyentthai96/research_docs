# 01 — Phân Tích Nhu Cầu Điện Hiện Tại

> [← Quay lại mục lục](./README.md) | [Tiếp: Thiết Kế Hệ Thống →](./02-thiet-ke-he-thong.md)

---

## 1.1 Bảng Giá Điện Sinh Hoạt EVN (áp dụng từ 10/05/2025)

| Bậc | Mức sử dụng | Giá (đ/kWh) | Ghi chú |
|:---:|:---|---:|:---|
| 1 | 0 – 50 kWh | 1.984 | Giá thấp nhất |
| 2 | 51 – 100 kWh | 2.050 | |
| 3 | 101 – 200 kWh | 2.380 | |
| 4 | 201 – 300 kWh | 2.998 | Bậc "đau ví" bắt đầu |
| 5 | 301 – 400 kWh | 3.350 | |
| 6 | 401 kWh trở lên | 3.460 | Giá cao nhất |

> [!NOTE]
> Giá trên **chưa bao gồm VAT 8%**. Với hóa đơn 2-3 triệu/tháng, gia đình bạn đang tiêu thụ khoảng **600 – 1.100 kWh/tháng** và phần lớn rơi vào bậc 4-5-6 (giá cao).

---

## 1.2 Ước Tính Sản Lượng Tiêu Thụ

| Hóa đơn/tháng | Ước tính kWh/tháng | Ước tính kWh/ngày |
|---:|---:|---:|
| 2.000.000đ | ~600 – 700 kWh | ~20 – 23 kWh |
| 2.500.000đ | ~750 – 900 kWh | ~25 – 30 kWh |
| 3.000.000đ | ~900 – 1.100 kWh | ~30 – 37 kWh |

---

## 1.3 Thiết Bị Tiêu Thụ Điện Phổ Biến (Gia Đình + Phòng Trọ)

| Thiết bị | Công suất | Giờ dùng/ngày | kWh/ngày |
|:---|---:|---:|---:|
| Điều hòa 1HP (mỗi phòng) | 750W | 8h | 6.0 |
| Quạt điện (mỗi phòng) | 60W | 10h | 0.6 |
| Tủ lạnh | 100W | 24h | 1.2 |
| Máy giặt | 500W | 1h | 0.5 |
| Đèn LED (tổng) | 100W | 6h | 0.6 |
| Bơm nước | 750W | 0.5h | 0.4 |
| TV | 80W | 5h | 0.4 |
| Nồi cơm điện | 700W | 1h | 0.7 |
| Bình nóng lạnh | 2500W | 0.5h | 1.25 |

> [!IMPORTANT]
> **Điều hòa là "thủ phạm" chính** ngốn điện. Với 3-4 phòng trọ + gia đình chạy điều hòa, dễ dàng vượt 25-30 kWh/ngày.

---

## 1.4 Phân Tích Cơ Cấu Chi Phí Điện

Với hóa đơn **2.5 triệu/tháng** (~800 kWh), cơ cấu chi phí theo bậc:

```
Bậc 6 (401-800 kWh): 400 × 3.460 = 1.384.000đ ███████████████ 55%
Bậc 5 (301-400 kWh): 100 × 3.350 =   335.000đ ████            13%
Bậc 4 (201-300 kWh): 100 × 2.998 =   299.800đ ███             12%
Bậc 3 (101-200 kWh): 100 × 2.380 =   238.000đ ███             10%
Bậc 2 (51-100 kWh):   50 × 2.050 =   102.500đ █                4%
Bậc 1 (0-50 kWh):     50 × 1.984 =    99.200đ █                4%
                                    ──────────
                              Tổng: 2.458.500đ + 8% VAT ≈ 2.655.000đ
```

> [!TIP]
> **Insight quan trọng:** 55% tiền điện nằm ở bậc 6 (giá cao nhất). Điện mặt trời giúp "cắt" phần bậc cao này trước, mang lại hiệu quả tiết kiệm lớn nhất.

---

> [← Quay lại mục lục](./README.md) | [Tiếp: Thiết Kế Hệ Thống →](./02-thiet-ke-he-thong.md)
