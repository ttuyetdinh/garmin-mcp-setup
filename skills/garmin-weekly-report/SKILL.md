---
name: garmin-weekly-report
description: Tạo báo cáo tổng hợp sức khoẻ và hoạt động từ Garmin trong 7 ngày gần nhất (hoạt động/chạy bộ, giấc ngủ, stress, body battery, HRV, training readiness/status, VO2 max, SpO2, respiration, load balance, lactate threshold). Dùng CHỈ KHI user gọi rõ, ví dụ "/garmin-report", "xem báo cáo Garmin 7 ngày", "tổng hợp sức khoẻ Garmin tuần này". Không tự trigger chỉ vì nhắc đến chạy bộ/sức khoẻ chung chung — dùng trực tiếp tool Garmin liên quan cho các câu hỏi đơn lẻ đó.
---

# Garmin Weekly Report

Báo cáo sức khoẻ + hoạt động 7 ngày từ Garmin, trình bày bằng bảng markdown trong chat (không tạo file trừ khi user yêu cầu).

## Lưu ý
- **Lactate threshold bug**: nếu bộ nhớ có ghi chú `lactate_threshold_speed_mps` lệch hệ số 10, nhân 10 trước khi dùng/tính pace, không nêu việc sửa lỗi này trong report.
- **TSB**: diễn đạt là "mức sẵn sàng thi đấu/phong độ", không dùng cụm "độ tươi/mệt".
- Ngôn ngữ theo user, giữ tên chỉ số gốc tiếng Anh (HRV, VO2 Max, Body Battery...).
- Thiếu dữ liệu ở ô nào thì ghi "—", không bịa số, không bỏ hàng.

## Quy trình

**1. Khoảng ngày**: mặc định 7 ngày gần nhất (hôm nay -6 → hôm nay), đổi nếu user chỉ định khác.

**2. Gọi tool** — ưu tiên bản summary/trend nhẹ, tránh bản full trừ khi user cần đào sâu:

Theo khoảng ngày (1 lần): `get_activities_by_date`, `get_hrv_trend`, `get_vo2max_trend`, `get_respiration_trend`, `get_training_load_trend`, `get_endurance_score`, `get_lactate_threshold`.

Theo từng ngày (7 lần, hoặc 1-2 ngày gần nhất nếu chỉ số ít đổi): `get_sleep_summary`, `get_stats` (nguồn chính cho steps/HR/stress/body battery/SpO2/respiration mỗi ngày), `get_training_readiness` (1-2 ngày gần nhất), `get_training_load_balance` (1 lần, trailing-month), `get_fitnessage_data` (1 lần).

Nếu cần rút gọn, ưu tiên activities + sleep + stats trước, phần còn lại bổ sung sau.

**3. Trình bày** (bảng markdown, bỏ mục nào thiếu dữ liệu):

1. Tóm tắt nhanh (2-3 câu)
2. Hoạt động/Chạy bộ: Ngày | Loại | Quãng đường | Thời gian | Pace TB | HR TB
3. Giấc ngủ: Ngày | Tổng ngủ | Deep | REM | Light | Sleep Score
4. Stress & Body Battery: Ngày | Stress TB | Stress max | BB cao nhất | BB thấp nhất
5. Hồi phục: HRV theo ngày + baseline (chú ý lệch >10ms), Training Readiness gần nhất, Respiration trend
6. Thể lực dài hạn: VO2 Max, Endurance Score, Lactate Threshold (pace/HR), **Training Load** (bảng ATL|CTL|TSB|ACWR theo ngày — ATL=mệt cấp tính ~7 ngày, CTL=thể lực nền ~42 ngày, TSB=CTL−ATL đo phong độ, ACWR=ATL/CTL đo rủi ro chấn thương: <0.8 dưới tải, 0.8–1.3 tối ưu, >1.5 cao), kèm `training_status` nếu có; Load Balance (Aerobic Low/High/Anaerobic)
7. Khác: SpO2 trung bình, Fitness Age nếu có

Cuối cùng: 2-4 gạch đầu dòng nhận xét ngắn dựa trên số liệu thực tế, không suy diễn thêm, không phải lời khuyên y tế.

## Xuất file
Nếu user muốn lưu file, tạo .md (hoặc dùng skill `docx` nếu yêu cầu Word) với cùng nội dung.
