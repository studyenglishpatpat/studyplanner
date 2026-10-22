STUDY PLANNER PLUS – NÂNG CẤP LỊCH CÁ NHÂN
========================================

Phiên bản: 23/10/2026

1. CÁC FILE
- index.html               : trang đăng nhập (giữ nguyên bản đã nâng cấp EN/VI)
- studyplanner.html        : trang quản lý (chỉ thêm 2 dòng tải module mới)
- shared.js / shared.css   : giữ nguyên 100% file gốc
- enhancements.js / .css  : tính năng EN/VI, sáng/tối, emoji, xác nhận
- planner-plus.js / .css   : module mới, tách biệt logic gốc

Nếu đang có favicon.png, tiếp tục giữ nguyên (không kèm trong file ZIP).

2. ĐÃ THÊM
A. Công việc lặp lại: Trong Thêm/Sửa việc, dưới Ghi chú có phần
   "Repeat this task" để chọn mỗi ngày / thứ 2–6 / chọn các thứ.
   Có thể chọn ngày kết thúc. Bấm Lưu > Xác nhận. Những buổi tương lai
   gần 8 tuần được tạo như những công việc bình thường, nên chúng hiển thị
   trong Hôm nay, Tuần này, Tháng này, Checklist và Thống kê như trước.
   Mở lại website sẽ bổ sung các buổi tương lai của 8 tuần tiếp theo.
   Nút "Manage repeat schedules" cho phép dừng/tiếp tục lịch.
   Dừng không xóa những buổi đã tạo. Xóa/sửa một buổi riêng không sửa
   toàn bộ các buổi còn lại.

B. Focus Mode: Mục mới ngay sau Checklist trong danh mục. Chọn nhiệm vụ,
   thời lượng 25/50/90 phút, bắt đầu/tạm dừng/tiếp tục/kết thúc. Đồng hồ
   dựa vào thời gian thực, chuyển qua tab khác rồi quay lại không chạy sai.
   Kết thúc phiên không tự đổi trạng thái công việc. Có tóm tắt thời gian
   tập trung trong 7 ngày gần đây.

C. Kéo thả lịch: Trong Tuần này, nắm icon chấm dọc trên thẻ việc và kéo
   sang cột ngày khác. Trong Tháng này, có thể kéo tên việc ngắn sang ô
   ngày khác. Điện thoại hỗ trợ kéo qua điểm nắm (ấn giữ ngắn), đồng thời
   có nút đổi ngày để sử dụng khi kéo khó vì màn hình hẹp. Mọi lần chuyển
   ngày đều được hỏi xác nhận TRƯỚC KHI cập nhật Supabase.

D. Mood Tracker: Mục mới sau Focus Mode. Chọn một trong năm tâm trạng,
   ghi chú tùy ý, xác nhận mới lưu. Xem lại 28 ngày gần đây.

E. Đếm ngược: Hiện ở các nhiệm vụ CÓ GIỜ BẮT ĐẦU (Hôm nay, Tuần này,
   Checklist, chi tiết lịch tháng). Trước giờ bắt đầu: "Starts in/Còn";
   từ lúc bắt đầu tới lúc kết thúc: "In progress now/Đang diễn ra";
   quá giờ: "Past scheduled time/Đã quá giờ". Với công việc không có
   giờ, hiển thị Cả ngày như cũ và không tạo mốc giờ giả.

F. Mobile menu: <=800px chỉ hiển thị nút Danh mục trên header, ấn mở
   drawer từ trái, rộng tối đa 300px/78% màn hình. Các mục theo thứ tự:
   Hôm nay > Tuần này > Tháng này > Checklist > Focus Mode > Mood Tracker.
   >=801px vẫn dùng sidebar cố định như trước. Chế độ tối/tiếng Anh-Việt
   vẫn hoạt động.

3. QUAN TRỌNG VỀ ĐỒNG BỘ
Để không phải tạo thêm bảng SQL hay thay đổi schema Supabase của bạn:
- Mọi nhiệm vụ (kể cả các buổi lặp được sinh ra) vẫn được lưu ở bảng
  'tasks' trên Supabase, nên đăng nhập thiết bị khác vẫn thấy các việc.
- CẤU HÌNH LẶP, NHẬT KÝ CẢM XÚC và LỊCH SỬ FOCUS được lưu trong
  localStorage của đúng trình duyệt/tài khoản, CHƯA đồng bộ giữa các máy.
  Nếu bạn xóa dữ liệu trình duyệt hoặc đổi máy, các thông tin này không
  theo sang thiết bị mới; các nhiệm vụ đã tạo trên Supabase vẫn còn.
- KHÔNG tạo lại một quy tắc lặp tương tự trên máy khác, vì có thể làm
  trùng lịch. Nếu muốn cả 3 mục này đồng bộ nhiều thiết bị, cần thiết kế
  thêm bảng bảo mật Supabase với chính sách RLS và migration riêng.
- Tạo việc lặp xảy ra khi bạn bấm lưu xác nhận hoặc mở lại web, không
  phải tác vụ chạy liên tục trên máy chủ khi website đang đóng.

4. CÀI ĐẶT
- Sao lưu thư mục website gốc trước.
- Giải nén ZIP và chép TẤT CẢ file vào cùng thư mục hosting hiện tại.
- Không xóa favicon.png hoặc các hình ảnh sẵn có.
- Refresh mạnh trang để tránh file CSS/JS cũ trong bộ nhớ đệm.
- KHÔNG cần chạy SQL mới.
- Nếu hosting yêu cầu trang đầu là index.html, file này đã chuẩn tên.

5. PHẠM VI MÃ NGUỒN
- shared.js / shared.css không chỉnh sửa từng byte.
- Logic Supabase gốc, thống kê, Excel, auth, thông báo giữ nguyên.
- studyplanner.html chỉ thêm link planner-plus.css / script planner-plus.js.
- enhancements.js chỉ xuất ra hàm xác nhận cho plugin và thêm thông báo
  về các buổi lặp trong hộp xác nhận lưu (không thay đổi phương thức lưu gốc).
- Các tính năng mới được viết trong planner-plus.js, planner-plus.css.

6. KIỂM TRA
Đã kiểm thử bằng trình duyệt tự động với dữ liệu Supabase giả lập:
- Giao diện menu trên điện thoại; chuyển giữa các mục.
- Focus Mode đếm ngược theo giây.
- Mood Tracker yêu cầu xác nhận và lưu theo tài khoản.
- Đổi ngày có xác nhận, các buổi lặp được tạo theo tần suất.
- Thao tác không gây lỗi JavaScript trong các tình huống đã thử.
Chưa kiểm thử ghi dữ liệu vào cơ sở dữ liệu Supabase thật của bạn.
