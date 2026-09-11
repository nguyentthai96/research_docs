# 🔆 Nghiên Cứu Hệ Thống Năng Lượng Mặt Trời Cho Hộ Gia Đình & Phòng Trọ

> Ngày nghiên cứu: 11/09/2026  
> Mục tiêu: Tiết kiệm chi phí điện hàng tháng 2-3 triệu VNĐ cho gia đình + vài phòng trọ

---

## 1. Phân Tích Nhu Cầu Điện Hiện Tại

### 1.1 Bảng giá điện sinh hoạt EVN (áp dụng từ 10/05/2025)

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

### 1.2 Ước tính sản lượng tiêu thụ

| Hóa đơn/tháng | Ước tính kWh/tháng | Ước tính kWh/ngày |
|---:|---:|---:|
| 2.000.000đ | ~600 – 700 kWh | ~20 – 23 kWh |
| 2.500.000đ | ~750 – 900 kWh | ~25 – 30 kWh |
| 3.000.000đ | ~900 – 1.100 kWh | ~30 – 37 kWh |

### 1.3 Thiết bị tiêu thụ điện phổ biến (gia đình + phòng trọ)

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

## 2. Loại Hệ Thống & Khuyến Nghị

### 2.1 So sánh 3 loại hệ thống

| Tiêu chí | On-grid (Hòa lưới) | Hybrid (Hòa lưới + Lưu trữ) | Off-grid (Độc lập) |
|:---|:---|:---|:---|
| **Chi phí** | ⭐ Thấp nhất | ⚡ Trung bình - Cao | 💰 Cao nhất |
| **Hoạt động khi mất điện** | ❌ Không | ✅ Có | ✅ Có |
| **Dùng điện ban đêm** | ❌ Lấy từ lưới | ✅ Lấy từ pin lưu trữ | ✅ Lấy từ pin |
| **Bán điện dư** | ✅ Có (qua lưới) | ✅ Có (linh hoạt) | ❌ Không |
| **Hoàn vốn** | 3-4 năm | 5-7 năm | 8-10 năm |
| **Phù hợp** | Dùng nhiều ban ngày | Cần dự phòng + ban đêm | Vùng sâu, không có lưới |

### 2.2 Khuyến nghị cho trường hợp của bạn

> [!TIP]
> **Phương án khuyến nghị: Hybrid 5-6 kWp + Pin lưu trữ 5-10 kWh**
> 
> Lý do:
> - Phòng trọ dùng điều hòa ban đêm → cần pin lưu trữ
> - Gia đình + phòng trọ cần điện ổn định → backup khi mất điện
> - Có thể bán điện dư lên lưới (tối đa 50% theo NĐ 243/2026)
> - Linh hoạt mở rộng thêm pin trong tương lai

---

## 3. Thiết Kế Hệ Thống Chi Tiết

### 3.1 Phương Án A – Tiết kiệm (Hybrid 5kWp + 5kWh)

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

### 3.2 Phương Án B – Tối ưu (Hybrid 6kWp + 10kWh)

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

## 4. So Sánh Thiết Bị Chính

### 4.1 Tấm Pin Mặt Trời (Tier 1)

| Thương hiệu | Công nghệ | Công suất | Hiệu suất | Giá/tấm | BH sản phẩm | BH hiệu suất | Đánh giá |
|:---|:---|:---|:---|---:|:---|:---|:---|
| **Jinko Solar** | N-type TOPCon (Tiger Neo) | 575-600W | ~22.5-24% | 2.500-3.200k | 12 năm | 30 năm (≥87.4%) | ⭐ Giá tốt nhất, phổ biến nhất VN |
| **JA Solar** | N-type TOPCon (DeepBlue 4.0) | 575-600W | ~22.4-22.9% | 2.800-3.500k | 12 năm | 30 năm (≥87.4%) | ⭐ Cân bằng chất lượng-giá |
| **LONGi Solar** | HPBC / N-type TOPCon (Hi-MO) | 580-600W | ~22.5-24%+ | 3.200-4.100k | 12-15 năm | 30 năm (≥87.4%) | ⭐ Hiệu suất đỉnh, thẩm mỹ cao |
| **Canadian Solar** | N-type TOPCon | 580-610W | ~22.4-23% | 3.000-3.600k | 15 năm | 30 năm (≥87.4%) | ⭐ Bền nhất, giá cao hơn |

#### 🔍 Phân tích chi tiết LONGi Solar vs Các hãng khác

| Tiêu chí | LONGi Solar | Jinko Solar | JA Solar | Canadian Solar |
|:---|:---|:---|:---|:---|
| **Thế mạnh** | Hiệu suất đỉnh, thẩm mỹ cao (không busbar mặt trước) | Quy mô lớn nhất, giá tốt nhất | Cân bằng giá-chất lượng tốt nhất | Bền bỉ, dự án lớn |
| **Công nghệ nổi bật** | HPBC 2.0 (Back-contact), Hi-MO 9 | Tiger Neo N-type TOPCon | DeepBlue 4.0 Pro | HiKu7 N-type |
| **Phù hợp** | Mái nhà diện tích hạn chế, biệt thự, cao cấp | Mọi nhu cầu, đặc biệt tối ưu chi phí | Hộ gia đình, doanh nghiệp vừa | Dự án công nghiệp, quy mô lớn |
| **Hệ số nhiệt độ** | Rất tốt (-0.29%/°C) | Tốt (-0.30%/°C) | Tốt (-0.30%/°C) | Tốt (-0.30%/°C) |
| **Độ suy hao năm đầu** | ~1% | ~1% | ~1% | ~1% |
| **Suy hao hàng năm** | ~0.4% | ~0.4% | ~0.4% | ~0.4% |
| **Phân phối tại VN** | Tốt (có nhà máy tại VN) | Rất tốt (nhà máy tại VN) | Tốt | Trung bình |
| **Giá so sánh** | 💰💰💰 Cao nhất | 💰 Thấp nhất | 💰💰 Trung bình | 💰💰 Trung bình-cao |

#### ⚡ LONGi Solar — Ưu & Nhược Điểm Chi Tiết

**✅ Ưu điểm:**
- **Hiệu suất chuyển đổi cao nhất** trong 4 hãng (~22.5-24%+), đặc biệt dòng Hi-MO 9 HPBC 2.0
- **Thiết kế thẩm mỹ** — dòng HPBC không có thanh busbar mặt trước, trông rất đẹp trên mái nhà
- **Tối ưu diện tích** — cùng 1m² mái, LONGi tạo ra nhiều điện hơn → phù hợp mái nhà nhỏ
- **Hệ số nhiệt độ tốt** — hoạt động hiệu quả trong khí hậu nóng ẩm ĐBSCL/Đồng Tháp
- **Nhà máy sản xuất tại Việt Nam** — đảm bảo nguồn cung và hỗ trợ bảo hành
- **Dẫn đầu R&D** — LONGi liên tục phá kỷ lục hiệu suất pin mặt trời thế giới

**❌ Nhược điểm:**
- **Giá cao hơn 15-30%** so với Jinko cùng công suất (3.200-4.100k vs 2.500-3.200k/tấm)
- **Thời gian hoàn vốn dài hơn** — giá đầu tư cao hơn nhưng sản lượng chỉ nhỉnh hơn ~3-5%
- **Dòng HPBC mới** — ít dữ liệu vận hành thực tế dài hạn so với TOPCon đã được kiểm chứng rộng rãi
- **Hàng giả/nhái tràn lan** — do thương hiệu nổi tiếng, cần mua đúng đại lý ủy quyền

> [!IMPORTANT]
> **Khuyến nghị theo từng trường hợp:**
> 
> | Nhu cầu | Thương hiệu nên chọn | Lý do |
> |:---|:---|:---|
> | **Ngân sách hạn chế** | **Jinko Solar** | Giá tốt nhất, hoàn vốn nhanh nhất |
> | **Cân bằng giá-chất lượng** | **JA Solar** | Đầu tư thông minh, tỉ lệ lỗi thấp |
> | **Mái nhà nhỏ, cần tối đa công suất** | **LONGi Solar** | Hiệu suất/m² cao nhất |
> | **Yêu cầu thẩm mỹ cao (biệt thự)** | **LONGi Solar** (dòng HPBC) | Thiết kế đẹp, không busbar |
> | **Dự án lâu dài, ưu tiên bền** | **Canadian Solar** | Bảo hành sản phẩm 15 năm |
> | **Cho gia đình + phòng trọ (như bạn)** | **Jinko** hoặc **JA Solar** | Tối ưu chi phí, hoàn vốn 4-5 năm |

> [!WARNING]
> **Cảnh báo hàng giả:** Cả LONGi và Jinko đều bị làm giả nhiều tại VN. **Bắt buộc:**
> 1. Mua từ đại lý ủy quyền chính hãng
> 2. Yêu cầu CO/CQ đầy đủ
> 3. Kiểm tra mã serial trên website hãng
> 4. Kích hoạt bảo hành điện tử chính hãng


### 4.2 Inverter Hybrid

| Thương hiệu | Model | Công suất | Giá | Ưu điểm | Nhược điểm |
|:---|:---|:---|---:|:---|:---|
| **Deye** | SUN-5K-SG04LP1 | 5kW | ~22 triệu | Tương thích đa pin, linh hoạt, giá tốt | Phần mềm không bằng Huawei |
| **Sungrow** | SH5.0/6.0RS | 5-6kW | ~25-30 triệu | Ổn định cao, bảo hành tốt, bankable | Giá cao hơn Deye |
| **Huawei** | SUN2000L-5KTL | 5kW | ~28-35 triệu | AI thông minh, app đẹp, giám sát chi tiết | Phụ thuộc hệ sinh thái, giá cao |

> [!TIP]
> **Khuyến nghị:** **Deye** cho ngân sách tối ưu, **Sungrow** nếu ưu tiên bền bỉ lâu dài.

### 4.3 Pin Lưu Trữ LiFePO4

| Thương hiệu | Model | Dung lượng | Giá | Chu kỳ sạc/xả | Tuổi thọ | DoD |
|:---|:---|:---|---:|:---|:---|:---|
| **Pylontech** | US5000C | 4.8kWh | ~17-22 triệu | >6.000 | 15 năm | 95% |
| **Pylontech** | UF5000 | 4.8kWh | ~20-25 triệu | >6.000 | 15 năm | 95% |
| **Lithium Valley** | LV5048 | 5kWh | ~18-23 triệu | >6.000 | 15 năm | 90% |

> [!TIP]
> **Khuyến nghị:** **Pylontech US5000C** — phổ biến nhất, tương thích rộng rãi, dạng module dễ mở rộng.

---

## 5. Tính Toán Hoàn Vốn

### 5.1 Phương Án A (Hybrid 5kWp + 5kWh — ~85 triệu)

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

### 5.2 Phương Án B (Hybrid 6kWp + 10kWh — ~122 triệu)

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

### 5.3 Biểu đồ lợi ích tích lũy

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

## 6. Quy Định Pháp Lý (Cập nhật 09/2026)

### 6.1 Nghị định 58/2025 & sửa đổi NĐ 243/2026

| Nội dung | Quy định |
|:---|:---|
| **Công suất hộ gia đình** | Dưới 100 kWp → thủ tục đơn giản |
| **Tỷ lệ bán điện dư** | Tối đa **50%** sản lượng (tăng từ 20%) |
| **Thỏa thuận đặc biệt** | Có thể >50% nếu lưới đủ khả năng (đến 2030) |
| **Đăng ký kinh doanh** | Hộ gia đình bán dư **không cần** đăng ký hộ KD |
| **Nơi đăng ký** | UBND phường/xã (đã phân cấp) |
| **Vùng đặc biệt** | Miền núi, biên giới, hải đảo: bán được **100%** |

### 6.2 Quy định cho phòng trọ

> [!IMPORTANT]
> **Đối với nhà trọ cho thuê:**
> - Cứ 4 người thuê = 1 hộ sử dụng điện (để tính bậc thang)
> - Chủ nhà phải kê khai đầy đủ số người ở với điện lực
> - Nếu không kê khai → EVN có thể tính bậc 3 cho toàn bộ sản lượng
> - Lắp điện mặt trời giúp **giảm sản lượng lấy từ lưới**, từ đó **giảm bậc thang** ➜ tiết kiệm kép

### 6.3 Hướng Dẫn Đăng Ký Bán Điện Dư Tại Tỉnh Đồng Tháp

#### 📋 Thông tin liên hệ Điện lực Đồng Tháp

| Thông tin | Chi tiết |
|:---|:---|
| **Đơn vị** | Công ty Điện lực Đồng Tháp (thuộc EVNSPC) |
| **Trụ sở** | Số 248, đường Lê Đại Hành, Phường Mỹ Trà, TP. Cao Lãnh, tỉnh Đồng Tháp |
| **Website** | [pcdongthap.evnspc.vn](https://pcdongthap.evnspc.vn/) |
| **Tổng đài CSKH** | **1900 1006** hoặc **1900 9000** |
| **App CSKH** | Ứng dụng Chăm sóc khách hàng EVN (trên App Store / Google Play) |

#### 🔄 Quy trình 5 bước đăng ký bán điện dư (theo NĐ 243/2026)

```
╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 1: THÔNG BÁO LẮP ĐẶT (Trước khi thi công)          ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │ • Gửi Thông báo theo Mẫu số 01 đến UBND xã/phường │    ║
║  │   nơi lắp đặt hệ thống                             │    ║
║  │ • Hình thức: Trực tiếp / Cổng Dịch vụ công QG /    │    ║
║  │   App VNeID                                         │    ║
║  │ • Miễn thông báo nếu công suất < 1 kWp             │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                          ▼                                   ║
║  BƯỚC 2: LẮP ĐẶT HỆ THỐNG                                 ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │ • Chọn nhà thầu EPC uy tín                         │    ║
║  │ • Lắp đặt đúng tiêu chuẩn an toàn kỹ thuật        │    ║
║  │ • Đảm bảo CO/CQ đầy đủ cho tấm pin + inverter     │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                          ▼                                   ║
║  BƯỚC 3: NỘP HỒ SƠ ĐỀ NGHỊ BÁN ĐIỆN DƯ                   ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │ • Nộp hồ sơ tại Điện lực huyện/TP hoặc qua App    │    ║
║  │ • Điện lực kiểm tra hồ sơ (5-10 ngày làm việc)    │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                          ▼                                   ║
║  BƯỚC 4: NGHIỆM THU & LẮP CÔNG TƠ 2 CHIỀU                 ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │ • Điện lực cử nhân viên kiểm tra thực tế           │    ║
║  │ • Nghiệm thu hệ thống đo đếm, giám sát, điều khiển│    ║
║  │ • Lắp công tơ đo đếm 2 chiều (điện lực cung cấp)  │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                          ▼                                   ║
║  BƯỚC 5: KÝ HỢP ĐỒNG MUA BÁN ĐIỆN                         ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │ • Ký Hợp đồng mua bán điện dư với Điện lực ĐT     │    ║
║  │ • Bắt đầu bán điện dư lên lưới (tối đa 50%)       │    ║
║  │ • Thanh toán hàng tháng qua tài khoản ngân hàng    │    ║
║  └─────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════╝
```

#### 📂 Hồ sơ cần chuẩn bị

**A. Hồ sơ thông báo lắp đặt (nộp UBND xã/phường):**

| STT | Tài liệu | Ghi chú |
|:---:|:---|:---|
| 1 | Thông báo theo **Mẫu số 01** (kèm NĐ 58/2025) | Tải tại Cổng DVC Quốc gia |
| 2 | CMND/CCCD chủ nhà (bản sao) | Có công chứng hoặc bản chính để đối chiếu |
| 3 | Giấy chứng nhận quyền sở hữu nhà / Sổ đỏ (bản sao) | Chứng minh quyền sở hữu mái nhà |
| 4 | Sơ đồ bố trí tấm pin trên mái nhà | Nhà thầu cung cấp |

**B. Hồ sơ đề nghị bán điện dư (nộp Điện lực Đồng Tháp):**

| STT | Tài liệu | Ghi chú |
|:---:|:---|:---|
| 1 | Giấy đề nghị mua bán điện | Theo mẫu của Điện lực |
| 2 | Bản xác nhận đã thông báo UBND xã | Từ bước 1 |
| 3 | Hồ sơ kỹ thuật hệ thống | Sơ đồ nguyên lý, sơ đồ đấu nối |
| 4 | CO/CQ tấm pin mặt trời | Chứng nhận xuất xứ + chất lượng |
| 5 | CO/CQ inverter | Chứng nhận xuất xứ + chất lượng |
| 6 | Biên bản thí nghiệm hệ thống | Do nhà thầu thực hiện |
| 7 | Giấy tờ nhà đất (bản sao) | Sổ đỏ/Sổ hồng |
| 8 | CMND/CCCD + Hợp đồng mua điện hiện tại | Mã khách hàng EVN |

> [!TIP]
> **Mẹo thực tế cho Đồng Tháp:**
> - Gọi **1900 1006** trước để hỏi nhân viên CSKH về hồ sơ cụ thể tại khu vực của bạn (mỗi điện lực huyện có thể yêu cầu thêm/bớt giấy tờ)
> - Nên nhờ **nhà thầu EPC** hỗ trợ làm hồ sơ — đa số nhà thầu uy tín sẽ lo trọn gói thủ tục này miễn phí
> - Kiểm tra trên **App CSKH EVN** xem đã có chức năng "Đăng ký bán sản lượng điện dư" chưa → nếu có thì đăng ký trực tuyến nhanh hơn
> - Đồng Tháp nằm trong vùng **ĐBSCL nắng tốt** (~4.2-4.5 giờ nắng đỉnh/ngày), rất thuận lợi cho điện mặt trời

#### ⏱️ Thời gian dự kiến toàn bộ quy trình

| Bước | Nội dung | Thời gian |
|:---:|:---|:---|
| 1 | Thông báo UBND xã/phường | 1-3 ngày |
| 2 | Lắp đặt hệ thống | 3-7 ngày |
| 3 | Nộp hồ sơ & Điện lực xử lý | 5-15 ngày làm việc |
| 4 | Nghiệm thu & lắp công tơ 2 chiều | 5-10 ngày làm việc |
| 5 | Ký hợp đồng & bắt đầu bán | 3-5 ngày làm việc |
| | **Tổng cộng (ước tính)** | **~3-6 tuần** |

> [!WARNING]
> **Lưu ý quan trọng:**
> - NĐ 243/2026 mới có hiệu lực từ 26/06/2026, một số Điện lực huyện ở Đồng Tháp có thể đang trong giai đoạn triển khai đồng bộ
> - Giá mua điện dư của EVN hiện rất thấp (~671 đ/kWh theo giá tránh được) → **ưu tiên tự tiêu thụ** vẫn là chiến lược tối ưu nhất
> - Nếu muốn bán >50% sản lượng, phải thỏa thuận riêng với Điện lực và phụ thuộc vào khả năng tiếp nhận của lưới điện khu vực

#### 📍 Các Điện lực huyện/thành phố tại Đồng Tháp

| STT | Đơn vị | Khu vực phục vụ |
|:---:|:---|:---|
| 1 | Điện lực TP. Cao Lãnh | TP. Cao Lãnh |
| 2 | Điện lực TP. Sa Đéc | TP. Sa Đéc |
| 3 | Điện lực TP. Hồng Ngự | TP. Hồng Ngự |
| 4 | Điện lực huyện Cao Lãnh | Huyện Cao Lãnh |
| 5 | Điện lực huyện Tháp Mười | Huyện Tháp Mười |
| 6 | Điện lực huyện Thanh Bình | Huyện Thanh Bình |
| 7 | Điện lực huyện Lấp Vò | Huyện Lấp Vò |
| 8 | Điện lực huyện Lai Vung | Huyện Lai Vung |
| 9 | Điện lực huyện Châu Thành | Huyện Châu Thành |
| 10 | Điện lực huyện Tam Nông | Huyện Tam Nông |
| 11 | Điện lực huyện Tân Hồng | Huyện Tân Hồng |

> Liên hệ Điện lực huyện/TP gần nhất để được khảo sát miễn phí khả năng tiếp nhận lưới điện tại khu vực nhà bạn.

---

## 7. Lộ Trình Triển Khai

### Giai đoạn 1: Chuẩn bị (1-2 tuần)

```
☐ Thu thập hóa đơn điện 6 tháng gần nhất
☐ Liệt kê tất cả thiết bị điện (gia đình + phòng trọ)
☐ Đo diện tích mái nhà khả dụng
☐ Xác định hướng mái (tốt nhất: hướng Nam hoặc Đông Nam)
☐ Kiểm tra độ che bóng (cây, nhà lân cận)
☐ Liên hệ 3-5 đơn vị lắp đặt để lấy báo giá so sánh
```

### Giai đoạn 2: Chọn nhà thầu & Thiết kế (1-2 tuần)

```
☐ So sánh báo giá và phương án kỹ thuật
☐ Kiểm tra chứng chỉ, giấy phép nhà thầu
☐ Xác nhận bảo hành (sản phẩm + lắp đặt)
☐ Ký hợp đồng (chú ý: tiến độ, phạt, bảo hành)
☐ Thông báo UBND phường/xã
```

### Giai đoạn 3: Thi công & Đấu nối (3-7 ngày)

```
☐ Lắp khung giá đỡ trên mái
☐ Lắp tấm pin & hệ thống dây dẫn DC
☐ Lắp inverter & pin lưu trữ
☐ Lắp tủ điện, CB bảo vệ, đồng hồ đo đếm
☐ Đấu nối hệ thống & test vận hành
☐ Liên hệ EVN lắp công tơ 2 chiều (nếu bán dư)
```

### Giai đoạn 4: Vận hành & Bảo trì

```
☐ Giám sát sản lượng qua app (Deye/Sungrow)
☐ Vệ sinh tấm pin: 3-6 tháng/lần (nước sạch, không xà phòng)
☐ Kiểm tra dây dẫn, cầu dao: 1 năm/lần
☐ Tối ưu hóa thói quen dùng điện (dùng nhiều ban ngày)
```

---

## 8. Mẹo Tối Ưu Hóa Hiệu Quả

### 8.1 Dịch chuyển tải về ban ngày ☀️

| Thiết bị | Giờ dùng trước | Chuyển sang | Lý do |
|:---|:---|:---|:---|
| Máy giặt | Tối/đêm | 9h-14h | Dùng điện mặt trời miễn phí |
| Máy bơm nước | Sáng sớm | 10h-15h | Peak sản lượng pin |
| Bình nóng lạnh | Tối | 11h-14h | Tấm pin dư thừa công suất |
| Sạc xe máy điện | Đêm | 10h-16h | Tận dụng điện mặt trời |

### 8.2 Chiến lược sử dụng pin lưu trữ

```
    Sản lượng pin          Tải tiêu thụ
    ☀️ ☀️ ☀️                🏠 🏠 🏠
    │     ╱╲               │
    │   ╱    ╲             │  ╱──╲    ╱──╲
    │ ╱        ╲           │╱      ╲╱      ╲
    ╱            ╲         │                  ╲
   ─┼──┼──┼──┼──┼──┼─     ─┼──┼──┼──┼──┼──┼──
    5  8  12 15 18 20       5  8  12 15 18  22

  Chiến lược:
  ✅ 6h-17h:  Dùng điện mặt trời trực tiếp → DƯ thì sạc pin
  ✅ 17h-22h: Xả pin lưu trữ cho tải buổi tối (điều hòa, TV...)
  ✅ 22h-6h:  Tải thấp → pin đủ cung cấp (tủ lạnh, quạt)
  ✅ Khi dư thừa: Bán lên lưới EVN (tối đa 50%)
```

---

## 9. Rủi Ro & Giải Pháp

| Rủi ro | Mức độ | Giải pháp |
|:---|:---:|:---|
| Thời tiết xấu kéo dài | ⚠️ Trung bình | Pin lưu trữ + điện lưới backup |
| Pin lưu trữ giảm dung lượng | ⚠️ Trung bình | Chọn LiFePO4 bảo hành 10+ năm, DoD 95% |
| Hỏng inverter | ⚡ Thấp | Bảo hành 5-10 năm, chọn hãng uy tín |
| Thay đổi chính sách | ⚠️ Trung bình | Ưu tiên tự tiêu thụ, không phụ thuộc bán dư |
| Nhà thầu không uy tín | 🔴 Cao | Chọn EPC có track record, hợp đồng rõ ràng |
| Mái nhà không đủ diện tích | ⚡ Thấp | 10 tấm cần ~25m² mái, đo kỹ trước |

---

## 10. Tổng Kết & Khuyến Nghị

### So sánh 2 phương án

| | Phương Án A | Phương Án B |
|:---|:---|:---|
| **Công suất** | 5.22 kWp | 6 kWp |
| **Pin lưu trữ** | 5 kWh | 10 kWh |
| **Chi phí** | ~85 triệu | ~122 triệu |
| **Tiết kiệm/năm** | ~18 triệu | ~24 triệu |
| **Hoàn vốn** | ~4.7 năm | ~5.1 năm |
| **Tiết kiệm sau 20 năm** | ~274 triệu | ~355 triệu |
| **Phù hợp** | 2 triệu/tháng, 2-3 phòng trọ | 3 triệu/tháng, 3-5 phòng trọ |

> [!IMPORTANT]
> ### Khuyến nghị cuối cùng
> 
> 1. **Nếu ngân sách hạn chế**: Bắt đầu với **Phương Án A** (~85 triệu), sau 1-2 năm mở rộng thêm pin lưu trữ
> 2. **Nếu đầu tư dài hạn**: Chọn **Phương Án B** (~122 triệu), tối ưu hơn cho gia đình + nhiều phòng trọ
> 3. **Chiến lược giai đoạn**: Có thể lắp On-grid trước (~50-60 triệu), thêm pin sau → giảm áp lực tài chính
> 4. **Quan trọng nhất**: Chọn nhà thầu EPC uy tín, có bảo hành rõ ràng và hỗ trợ kỹ thuật dài hạn

---

## Phụ Lục: Danh Sách Nhà Cung Cấp Uy Tín Tham Khảo

| Đơn vị | Website | Ghi chú |
|:---|:---|:---|
| DAT Solar | datsolar.com | Lớn nhất miền Nam |
| DHC Solar | dhcsolar.com | Phân phối chính hãng |
| Vietnam Solar | vietnamsolar.vn | Nhiều gói hộ gia đình |
| Pro Solar | prosolar.vn | Tư vấn kỹ |
| Sunny Solar | sunnysolar.vn | Đa dạng phương án |

> [!CAUTION]
> **Lưu ý:** Giá cả trong tài liệu này là giá **tham khảo thị trường tại thời điểm 09/2026**. Giá thực tế có thể thay đổi tùy khu vực, thời điểm mua và đơn vị cung cấp. Hãy lấy ít nhất 3 báo giá để so sánh trước khi quyết định.
