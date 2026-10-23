STUDY PLANNER — BẢN SỬA V3 (CHỈ SỬA ĐÚNG YÊU CẦU)
=================================================

Đây là bản sửa dựa trên toàn bộ ZIP Study Planner Plus ở lần trước.
Các phần lặp lại, kéo thả, Mood Tracker, chuyển ngôn ngữ,
sáng/tối, dữ liệu Supabase và bước xác nhận trước khi lưu/xóa
vẫn được giữ nguyên.

1. MENU ĐIỆN THOẠI
- Dưới 801px: thêm hai mục "Manage / Quản lý" và
  "Statistics / Thống kê" vào menu kéo từ trái.
- Header điện thoại vẫn gọn; bấm biểu tượng Danh mục để chọn.
- Menu rộng tối đa 300px hoặc 78% chiều rộng màn hình.
- Trên desktop: giữ nguyên 2 nút trên header như trước.

2. ĐẾM NGƯỢC NHIỆM VỤ
- Chỉ hiển thị ở trang Today, bên dưới "TODAY'S SCHEDULE".
- Chưa đến giờ: "Starts in... / Còn ...".
- Đã đến giờ: "In progress now / Đang diễn ra".
- Qua giờ kết thúc: "Past scheduled time / Đã quá giờ".
- Week / Month / Checklist / popup chi tiết ngày không gắn đếm ngược nữa.
- Nhiệm vụ không có giờ bắt đầu không có mốc để đếm ngược.

3. FOCUS MODE
- Giữ ba nút 25/50/90 phút.
- Thêm ô tự đặt Giờ (0–23), Phút (0–59), Giây (0–59), tối thiểu 1 giây.
- Bấm "Set time / Áp dụng" để cập nhật đồng hồ.
- Nếu đồng hồ đang chạy / đã có tiến độ: phải xác nhận trước khi đặt lại.
- Căn giữa vòng đếm, giới hạn chữ số để không tràn/lệch trên điện thoại.
- Không thêm nhạc hoặc âm thanh.

4. THÔNG BÁO RA NGOÀI MÀN HÌNH
- Dùng API Notification của trình duyệt, để hệ điều hành hiển thị
  thông báo giống kiểu thông báo ứng dụng Windows (nếu được cấp phép).
- Thông báo khi Focus Mode về 0, khi đến giờ kết thúc công việc
  đang dở, thông báo nhắc nhở/tổng kết quan trọng.
- Nhắc bắt đầu học và nhắc trước 5 phút vốn có được giữ nguyên,
  tránh tạo hai thông báo cùng một sự kiện.
- Kích hoạt trong tài khoản > "Enable device reminders / Bật nhắc nhở
  trên máy" (nút đã có) hoặc nút "Enable / Bật" trong Focus Mode.
- Nếu thông báo không hiện, kiểm tra: HTTPS, quyền thông báo của trình
  duyệt, chế độ Không làm phiền / Focus Assist của Windows và cài đặt
  thông báo cho Chrome/Edge.
- QUAN TRỌNG: WEBSITE PHẢI CÒN ĐƯỢC MỞ để JavaScript kiểm tra thời gian.
  Đóng hẳn trình duyệt, đóng tab hoặc đưa máy vào ngủ thì không bảo đảm
  thông báo đúng giờ. Muốn thông báo khi web đóng cần thiết kế web push,
  service worker và máy chủ gửi thông báo riêng (chưa nằm trong bản này).
- File mở kiểu file:// không phải môi trường phù hợp để xin quyền
  thông báo; hãy thử trên website HTTPS thật hoặc localhost.

5. PHẦN NÀO ĐƯỢC THAY ĐỔI?
- Chỉ thay đổi nội dung 2 file addon: planner-plus.js, planner-plus.css.
- 7 file còn lại từ ZIP V2 được giữ nguyên: index.html,
  studyplanner.html, shared.js, shared.css, enhancements.js,
  enhancements.css, README_NANG_CAP_V2.txt.
- README_FIX_V3.txt là tài liệu mới.
- Không thêm bảng SQL, không đổi cấu trúc Supabase, không xóa dữ liệu.
- Các quy tắc lặp / Mood / lịch sử Focus vẫn lưu localStorage trên
  trình duyệt hiện tại, như trước.

6. CÀI ĐẶT
- Sao lưu nguyên thư mục web đang dùng.
- Giải nén và chép các file trong ZIP vào cùng một thư mục hosting,
  thay hai file planner-plus.js/planner-plus.css cũ bằng bản V3.
- Giữ nguyên favicon.png hiện tại.
- Nhấn Ctrl+Shift+R để tránh cache JS/CSS cũ.
- Khi đã mở được trang, bật quyền thông báo, tự đặt Focus 00:00:05
  và bấm Start để kiểm tra cảnh báo ngoài màn hình.

7. KIỂM THỬ
- Kiểm thử bằng trình duyệt Chromium và dữ liệu Supabase giả lập:
  di chuyển menu, Manage/Statistics, Week/Checklist không có clock,
  Today có clock, custom Focus 3 giây, hoàn thành Focus có thông báo,
  kết thúc lịch có thông báo, desktop 1440px và mobile 375px.
- Không ghi hoặc đọc tài khoản Supabase thật.
