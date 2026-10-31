---
name: "garmin-report-analysis"
description: "Phân tích sâu báo cáo Garmin sau /garmin-weekly-report kèm xu hướng 4 tuần, và tra cứu định nghĩa chi tiết từng metric từ Garmin Technology khi user hỏi sâu (HRV, VO2 Max, Training Status, Load, Body Battery...)."
---

# Garmin Report Analysis

Hai việc chính:

1. **Phân tích báo cáo tuần** từ `/garmin-weekly-report`, đặt trong xu hướng 4 tuần, vì một con số đơn lẻ thường chỉ là nhiễu.
2. **Tra cứu và mô tả chi tiết một metric** khi user hỏi sâu ("HRV Status tính thế nào", "Training Readiness gồm gì", "vì sao Maintaining"). Nguồn chính thức là hai trang Garmin Technology bên dưới, không trả lời từ trí nhớ khi câu hỏi cần chi tiết.

## Nguồn tra cứu metric (bắt buộc dùng khi hỏi sâu)

- Running Science: https://www.garmin.com/en-US/garmin-technology/running-science/
- Health Science: https://www.garmin.com/en-US/garmin-technology/health-science/

Trang chi tiết nằm một cấp sâu hơn. Tiền tố running: `https://www.garmin.com/en-US/garmin-technology/running-science/physiological-measurements/` rồi thêm `vo2-max/`, `training-status/`, `training-load/`, `recovery-time/`, `training-effect/`, `lactate-threshold/`, `race-time-prediction/`, `real-time-stamina/`, `performance-condition/`, `epoc/`, `training-readiness/`, `endurance-score/`, `running-economy/`, `running-tolerance/`, `heat-and-altitude-acclimation/`. Ngoài ra có `.../running-science/running-dynamics/`. Tiền tố health: `https://www.garmin.com/en-US/garmin-technology/health-science/` rồi thêm `hrv-status/`, `sleep-tracking/`, `sleep-coach/`, `body-battery/`, `stress-tracking/`, `respiration-rate/`, `pulse-ox/`, `fitness-age/`, `intensity-minutes/`, `heart-rate-monitoring/`, `calories-burned/`. Nếu metric không nằm trong danh sách, mở trang hub để lấy danh sách link.

### Cách tra cứu

1. **Dùng trình duyệt tích hợp trước** (mở trang bằng `preview_start` hoặc `navigate`, rồi `get_page_text`). Nội dung các trang này được nạp bằng JavaScript, nên `WebFetch` thường chỉ trả về menu điều hướng. Nếu dùng `WebFetch` mà không thấy nội dung bài, chuyển sang trình duyệt. Nếu trang dài bị cắt, đọc tiếp phần sau bằng `javascript_tool` (cắt `document.querySelector('main').innerText` theo mốc tiêu đề).
2. **Không vượt qua xác minh bot.** Nếu trang hiện "Just a moment..." (Cloudflare), chờ vài giây và thử lại một lần. Vẫn bị chặn thì dừng, nói rõ với user là không mở được trang, và trả lời từ phần "Khung diễn giải nhanh" bên dưới, đánh dấu rõ đây là bản tóm tắt có sẵn, chưa đối chiếu lại trang gốc.
3. **Mô tả chi tiết bằng lời của mình**, theo thứ tự: metric đo cái gì, đầu vào và cách tính, các mức hoặc nhãn phân loại, cách diễn giải, giới hạn của metric. Sau đó gắn vào số liệu thật của user ("tuần này của bạn là X, nghĩa là ..."). Tóm tắt và diễn đạt lại, không dán nguyên đại ngữ dài từ trang. Cuối câu trả lời ghi link trang đã dùng.
4. **Câu hỏi liên quan nhiều metric** thì mở từng trang liên quan (ví dụ Training Status cần thêm VO2 Max, Training Load, HRV Status).

## Điều kiện đầu vào cho phân tích tuần

Báo cáo `/garmin-weekly-report` phải có sẵn trong cuộc trò chuyện, dùng nó làm dữ liệu "tuần này" và không gọi lại các tool đã có số liệu. Nếu chưa có, chạy skill `garmin-weekly-report` trước.

## Quy trình phân tích tuần

**1. Lấy xu hướng 4 tuần** (28 ngày kết thúc hôm nay, chia 4 tuần, W0 là tuần của báo cáo). Gọi song song, ưu tiên bản summary/trend:

- `get_activities_by_date` (28 ngày, phân trang nếu `has_more`): số buổi chạy, km, thời gian, HR TB mỗi tuần.
- `get_sleep_summary_range` (28 đêm): giờ ngủ, Sleep Score, HRV đêm.
- `get_hrv_trend` (28 ngày, tối đa 30): HRV theo ngày, weekly average, status.
- `get_training_load_trend` (28 ngày): ATL, CTL, ACWR, training status.
- `get_vo2max_trend`, `get_endurance_score` (28 ngày).
- `get_stats_range` (28 ngày): số bước, calo.
- `get_respiration_trend` (28 ngày).
- `get_race_predictions` và `get_running_tolerance_trend` nếu user chạy bộ đều.

Tool lỗi hoặc thiếu dữ liệu thì ghi "thiếu dữ liệu" ở ô đó và nói rõ trong nhận định. Không nội suy.

**2. Tổng hợp theo tuần**, phân tích theo ba tầng Recovery, Load, Fitness, rồi tìm liên hệ chéo giữa các tầng (ví dụ HRV tụt sau buổi chạy nặng, Sleep Score thấp kéo Training Readiness xuống). Khi cần định nghĩa chi tiết cho một kết luận, mở trang Garmin tương ứng theo phần "Cách tra cứu".

**3. Đối chiếu mục tiêu.** Nếu bộ nhớ của user có mục tiêu thi đấu (ví dụ half marathon), so VO2 Max, Endurance Score, lactate threshold và race predictions với mục tiêu đó. Không có thì bỏ qua.

## Khung diễn giải nhanh (tóm tắt từ các trang Garmin, dùng khi chưa cần đi sâu)

- **HRV Status.** Garmin so trung bình 7 ngày của HRV đêm với khoảng baseline cá nhân, nên một đêm thấp không tự nó là tín hiệu. Chỉ cảnh báo khi status khác BALANCED hoặc weekly average giảm nhiều ngày liên tiếp. Baseline cần khoảng 3 tuần đeo đêm.
- **Sleep Score (0 đến 100).** Thời lượng so với khuyến nghị theo tuổi, kiến trúc giấc ngủ, stress từ HRV, số lần thức trên 5 phút, tổng thời gian thức. Xem xu hướng nhiều đêm.
- **Stress (0 đến 100).** Ước tính từ HR và HRV. Dưới 25 là nghỉ, trên 25 là giao cảm trội. Không đo trong lúc tập.
- **Body Battery.** Sạc chủ yếu khi ngủ, bị rút bởi vận động và stress. Đỉnh trong ngày phản ánh chất lượng sạc đêm trước.
- **Training Readiness.** Poor đến prime. Yếu tố chính là Sleep Score và Recovery Time, thêm Acute Load, HRV Status, Sleep History, Stress History (3 ngày thức gần nhất). Cao nhất lúc thức dậy, giảm sau buổi tập là bình thường. Không dự đoán kết quả thi đấu.
- **Recovery Time.** Buổi nặng (Training Effect từ 3.0) nên chờ đến khi recovery về xanh. Ngủ kém và stress cao kéo dài, ngủ tốt rút ngắn.
- **Acute Load, ACWR.** Acute load hết ảnh hưởng sau khoảng 10 ngày, chuẩn hóa về cửa sổ 7 ngày. ACWR dưới 0.8 là dưới tải, 0.8 đến 1.3 tối ưu, trên 1.5 là cao. TSB diễn đạt là "mức sẵn sàng thi đấu/phong độ", không dùng cụm "độ tươi/mệt".
- **Load Focus (4 tuần).** Anaerobic (sprint interval), High Aerobic (tempo), Low Aerobic (chạy dài chậm). Phản hồi Shortage, Balanced, Focus, và Below/Over Targets cho tổng tải.
- **Training Status.** Peaking, Productive, Maintaining, Strained, Unproductive, Overreaching, Recovery, Detraining. Diễn giải xu hướng VO2 Max cùng tải và HRV, cần ít nhất một buổi chạy ngoài trời mỗi tuần.
- **VO2 Max.** Ước tính từ pace so với nỗ lực tim mạch. Thay đổi dưới 0.5 ngắn hạn là nhiễu, xem xu hướng 4 đến 6 tuần. Nóng ẩm, độ cao có thể kéo xuống tạm thời.
- **Endurance Score.** VO2 Max làm nền, cộng lịch sử 2 đến 3 tháng và 2 tuần gần nhất, buổi dài được tính trọng số cao, mọi hoạt động có HR đều đóng góp.
- **Lactate Threshold.** Mức nỗ lực mà trên đó mệt mỏi tích lũy nhanh. Biểu diễn bằng pace, LTHR, power. LTHR là ranh giới zone 4 và zone 5 khi cài zone theo %LTHR. Nếu pace lệch hệ số 10 so với ghi chú trong bộ nhớ, nhân 10 trước khi dùng, không nhắc việc sửa lỗi này.
- **Running Tolerance.** Impact load quy ra km tương đương. Acute impact load vượt tolerance là trạng thái cảnh báo, tolerance điều chỉnh đầu mỗi tuần.
- **Fitness Age, Respiration Rate, SpO2, Race Time Prediction.** Chưa có tóm tắt sẵn. Khi cần thì tra trang Garmin; nếu không mở được, chỉ nêu số liệu và xu hướng, không bịa nguyên lý tính toán.

## Định dạng đầu ra của phân tích tuần

Ngôn ngữ theo user, giữ tên chỉ số gốc tiếng Anh. Không dùng em-dash, dùng dấu chấm hoặc dấu phẩy. Không tạo file trừ khi user yêu cầu.

1. **Kết luận** (3 câu): tuần này tốt hay cần điều chỉnh, và điểm quan trọng nhất.
2. **Xu hướng 4 tuần** (bảng): Tuần | Số buổi chạy | Tổng km | HR TB | HRV TB | Sleep (giờ, score) | Stress TB | ATL cuối tuần | CTL | VO2 Max. Bỏ cột thiếu dữ liệu.
3. **Phân tích** (bảng cho từng tầng Recovery, Load, Fitness): Tín hiệu | Garmin định nghĩa thế nào | Ý nghĩa với bạn. Mỗi kết luận gắn với số liệu và một định nghĩa.
4. **Liên hệ chéo**: 1 đến 3 mẫu hình lặp lại, nêu là giả thuyết từ số liệu, không phải nguyên nhân chắc chắn.
5. **Gợi ý tuần tới** (2 đến 4 gạch đầu dòng): số buổi và loại buổi (easy, tempo, long run) gắn với Load Focus, Training Readiness và mục tiêu nếu có.

Kết thúc bằng một câu nói rõ đây là gợi ý tập luyện dựa trên số liệu thiết bị, không phải lời khuyên y tế.

## Nguyên tắc

- Phân biệt nhiễu và xu hướng. Một điểm dữ liệu lệch chỉ đáng nhắc khi lặp lại hoặc khớp với tín hiệu khác.
- Ngày hiện tại thường là dữ liệu một phần (steps, Body Battery, stress), không tính vào trung bình tuần nếu chưa trọn ngày.
- Dưới 3 buổi chạy trong 4 tuần thì VO2 Max và Training Status kém tin cậy, nói rõ điều đó.
- Không chẩn đoán bệnh. Nếu số liệu bất thường kéo dài (HRV unbalanced nhiều ngày, nhịp thở nghỉ tăng, SpO2 thấp lặp lại), khuyên theo dõi cảm giác thực tế và tham khảo chuyên gia y tế nếu có triệu chứng.