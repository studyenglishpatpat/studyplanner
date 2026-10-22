/* Study Planner add-on: bilingual UI, theme, status emoji, weekdays, confirmation.
   Original business logic, Supabase queries, and data structures stay untouched. */
(() => {
  'use strict';
  const KEY_LANG = 'studyplanner_language_v1';
  const KEY_THEME = 'studyplanner_theme_v1';
  const saved = key => { try { return localStorage.getItem(key) } catch { return null } };
  const persist = (key, value) => { try { localStorage.setItem(key, value) } catch { /* storage can be disabled */ } };
  let lang = saved(KEY_LANG) === 'vi' ? 'vi' : 'en'; // English is the first-visit default.
  let theme = saved(KEY_THEME) === 'dark' ? 'dark' : 'light';
  const isPlanner = !!document.getElementById('mTask');
  const ORIGINALS = new WeakMap();
  const ATTR_ORIGINALS = new WeakMap();
  const EMOJI = { todo: '📝', doing: '⏳', done: '😊', skip: '😴' };
  const STATUS = {
    todo: { vi: 'Chưa làm', en: 'To do' },
    doing: { vi: 'Đang làm', en: 'In progress' },
    done: { vi: 'Đã xong', en: 'Completed' },
    skip: { vi: 'Bỏ qua', en: 'Skipped' }
  };
  const WORDS = {
    'Lên kế hoạch học tập nhẹ nhàng, rõ ràng': 'Plan your studies, simply and clearly',
    'Đăng nhập': 'Log in', 'Tạo tài khoản': 'Sign up', 'Tên của bạn': 'Your name',
    'Mật khẩu': 'Password', 'Nhập lại mật khẩu': 'Confirm password',
    'Mật khẩu hiện tại': 'Current password', 'Mật khẩu mới': 'New password',
    'Nhập lại mật khẩu mới': 'Confirm new password', 'Tối thiểu 6 ký tự': 'At least 6 characters',
    'Hiện/ẩn mật khẩu': 'Show/hide password',
    'Nhập email và mật khẩu (tối thiểu 6 ký tự)': 'Enter an email and password (at least 6 characters)',
    'Hai mật khẩu chưa giống nhau': 'Passwords do not match', 'Đang xử lý...': 'Processing...',
    'Đã tạo tài khoản! Hãy kiểm tra email để xác nhận rồi đăng nhập.': 'Account created! Check your email to verify it, then log in.',
    'Thành công! Đang vào Study Planner...': 'Success! Opening Study Planner...',
    'Sai email hoặc mật khẩu': 'Incorrect email or password', 'Email này đã được đăng ký': 'This email is already registered',
    'Mật khẩu cần ít nhất 6 ký tự': 'Password must have at least 6 characters',
    'Thao tác quá nhanh, hãy thử lại sau ít phút': 'Too many requests. Try again in a few minutes.',
    'Về trang chủ': 'Home', 'Quản lý': 'Manage', 'Thống kê': 'Statistics',
    'Việc còn lại trong tuần': 'Remaining tasks this week', 'Thông báo': 'Notifications',
    'Tài khoản': 'Account', 'Quản lý nhóm môn': 'Manage subject groups',
    'Bật nhắc nhở trên máy': 'Enable device reminders', 'Đổi mật khẩu': 'Change password', 'Đăng xuất': 'Log out',
    'Hôm nay': 'Today', 'Tuần này': 'This week', 'Tháng này': 'This month',
    'Thêm việc học': 'Add study task', 'Sửa việc': 'Edit task',
    'Việc cần làm': 'Task', 'Nhóm môn': 'Subject group', '(có thể bỏ trống)': '(optional)',
    '— Không chọn nhóm —': '— No subject group —', 'Ngày': 'Date', 'Thứ': 'Day',
    'Bắt đầu': 'Start', 'Kết thúc': 'End', 'Ghi chú': 'Notes',
    'Xóa': 'Delete', 'Hủy': 'Cancel', 'Lưu': 'Save', 'Thêm': 'Add',
    'Thêm việc': 'Add task', 'Nhập Excel': 'Import Excel',
    'Tên nhóm mới, ví dụ: Complete IELTS': 'New group name, e.g. Complete IELTS',
    'Xóa nhóm không làm mất các việc đã gán nhóm đó.': 'Deleting a group does not delete its tasks.',
    'Chưa có nhóm nào. Nhóm môn có thể bỏ trống khi thêm việc.': 'No groups yet. The subject group is optional.',
    'Xong': 'Done', 'Nhập nhanh bằng Excel': 'Bulk import from Excel',
    'Tải file mẫu, điền các việc rồi lưu lại': 'Download the template, fill in your tasks and save it',
    'Tải file mẫu (.xlsx)': 'Download template (.xlsx)',
    'Chọn file đã điền (.xlsx, .xls, .csv)': 'Choose your completed file (.xlsx, .xls, .csv)',
    'Nhập': 'Import', 'Cập nhật': 'Update', 'Đóng': 'Close',
    'Chưa làm': 'To do', 'Đang làm': 'In progress', 'Đã xong': 'Completed', 'Bỏ qua': 'Skipped',
    'Cả ngày': 'All day', 'Đang diễn ra': 'In progress now',
    'Cần làm': 'To do', 'Còn lại': 'Remaining',
    'LỊCH HÔM NAY': "TODAY'S SCHEDULE", 'Chưa có việc nào hôm nay. Bấm “Thêm việc” hoặc “Nhập Excel” nhé ✨': 'No tasks today. Choose “Add task” or “Import Excel” ✨',
    'Hiện tại': 'Current week', 'Tổng việc': 'Total tasks', 'Tiến độ tuần': 'Weekly progress',
    'Checklist · Đánh dấu việc học': 'Checklist · Track your tasks',
    'Tất cả trạng thái': 'All statuses', 'Giờ': 'Time', 'Trạng thái': 'Status',
    'Chưa có việc nào': 'No tasks yet', 'Lịch theo tháng': 'Monthly calendar',
    'T2': 'Mon', 'T3': 'Tue', 'T4': 'Wed', 'T5': 'Thu', 'T6': 'Fri', 'T7': 'Sat', 'CN': 'Sun',
    'Bấm vào một ngày để xem chi tiết': 'Choose a date to view details',
    'Việc trong tháng': 'Monthly tasks', 'Tiến độ tháng': 'Monthly progress',
    'Ngày này chưa có việc nào ✨': 'No tasks on this date ✨',
    '7 ngày': '7 days', '30 ngày': '30 days', '90 ngày': '90 days',
    'Thống kê học tập': 'Study statistics', 'Hoàn thành': 'Completion',
    'Quá hạn': 'Overdue', 'Giờ học': 'Study hours', 'Chuỗi ngày học': 'Study streak',
    'Tỷ lệ trạng thái': 'Status breakdown', 'Mức độ học theo ngày': 'Daily activity',
    'Theo nhóm môn': 'By subject group', 'Tổng': 'Total', 'Bỏ bài & quá hạn gần đây': 'Recent skipped and overdue tasks',
    'Việc': 'Task', 'Không có việc nào bị bỏ hay quá hạn 🎉': 'No skipped or overdue tasks 🎉',
    'Chưa có việc nào trong khoảng thời gian này để thống kê.': 'No tasks in this period to analyze.',
    '— Không nhóm —': '— No group —',
    'CẦN CHÚ Ý': 'NEEDS ATTENTION',
    'HÔM NAY · tự xóa sạch khi qua ngày': 'TODAY · clears automatically tomorrow',
    'Không có thông báo mới 🎉': 'No new notifications 🎉',
    'Hoàn tác': 'Undo', 'Sửa': 'Edit',
    'Cần nhập tên việc và ngày': 'Enter a task title and date',
    'Đã cập nhật việc ✨': 'Task updated ✨', 'Đã thêm việc mới ✨': 'Task added ✨',
    'Không còn mục này để hoàn tác': 'This item is no longer available to undo',
    'Đã xóa nhóm': 'Group deleted', 'Nhóm này đã có rồi': 'This group already exists',
    'File không có dòng dữ liệu nào': 'The file contains no task rows',
    'Đã tải file mẫu': 'Template downloaded', 'Đã lưu ghi chú': 'Notes saved',
    'Trình duyệt không hỗ trợ thông báo': 'Your browser does not support notifications',
    'Đã bật nhắc nhở trên máy 🔔': 'Device reminders enabled 🔔',
    'Bạn chưa cho phép thông báo': 'Notification permission was not granted',
    'Nhập mật khẩu hiện tại và mật khẩu mới (≥ 6 ký tự)': 'Enter the current password and a new password (at least 6 characters)',
    'Mật khẩu mới nhập lại chưa khớp': 'New passwords do not match',
    'Mật khẩu mới phải khác mật khẩu cũ': 'New password must differ from your current one',
    'Mật khẩu hiện tại không đúng': 'Current password is incorrect',
    'Đã đổi mật khẩu thành công 🔐': 'Password updated successfully 🔐',
    'Sáng': 'Light', 'Tối': 'Dark'
  };
  const RULES = [
    [/^Thứ ([2-7])$/u, m => ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][+m[1]-2]],
    [/^Chủ nhật$/u, () => 'Sunday'],
    [/^Thứ ([2-7]), (.+)$/u, m => ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][+m[1]-2]+', '+m[2]],
    [/^Chủ nhật, (.+)$/u, m => 'Sunday, '+m[1]],
    [/^Chào buổi (sáng|trưa|chiều|tối), (.+)$/u, m => ({sáng:'Good morning',trưa:'Good afternoon',chiều:'Good afternoon',tối:'Good evening'})[m[1]]+', '+m[2]],
    [/^Tuần (\d{2}\/\d{2}\/\d{4} – .+)$/u, m => 'Week '+m[1]],
    [/^(\d+) việc$/u, m => m[1]+' tasks'],
    [/^(\d+)\/((?:\d+)) xong$/u, m => m[1]+'/'+m[2]+' completed'],
    [/^Cần làm (\d+)$/u, m => 'To do '+m[1]],
    [/^Đã xong (\d+)$/u, m => 'Completed '+m[1]],
    [/^Còn lại (\d+)$/u, m => 'Remaining '+m[1]],
    [/^Lịch (thứ [2-7]|chủ nhật), ngày (.+)$/iu, m => 'Schedule · '+({'chủ nhật':'Sunday','thứ 2':'Monday','thứ 3':'Tuesday','thứ 4':'Wednesday','thứ 5':'Thursday','thứ 6':'Friday','thứ 7':'Saturday'})[m[1].toLowerCase()]+', '+m[2]],
    [/^(\d+) ngày$/u, m => m[1]+' days'],
    [/^(\d+)g (\d+)p$/u, m => m[1]+'h '+m[2]+'m'],
    [/^(\d+)g$/u, m => m[1]+'h'],
    [/^(\d+) dòng hợp lệ$/u, m => m[1]+' valid rows'],
    [/^(\d+) dòng thiếu ngày\/việc sẽ bị bỏ qua$/u, m => m[1]+' rows missing date/task will be skipped'],
    [/^… và (\d+) dòng nữa$/u, m => '… and '+m[1]+' more rows'],
    [/^Nhập (\d+) việc$/u, m => 'Import '+m[1]+' tasks'],
    [/^Đã thêm nhóm “(.+)”$/u, m => 'Group “'+m[1]+'” added'],
    [/^Đã chuyển sang “(.+)”$/u, m => 'Status changed to “'+(WORDS[m[1]]||m[1])+'”'],
    [/^Đã xóa “(.+)”$/u, m => 'Deleted “'+m[1]+'”'],
    [/^Đã xóa “(.+)”. Vẫn hoàn tác được trong 🔔 suốt hôm nay\.$/u, m => 'Deleted “'+m[1]+'”. You can undo this from 🔔 today.'],
    [/^Đã khôi phục “(.+)” ✨$/u, m => 'Restored “'+m[1]+'” ✨'],
    [/^Đã nhập (\d+) việc từ Excel 📥$/u, m => 'Imported '+m[1]+' tasks from Excel 📥'],
    [/^Lỗi tải dữ liệu: (.+)$/u, m => 'Could not load data: '+m[1]],
    [/^Chưa có bảng nhóm môn — (.+)$/u, m => 'Subject groups table is missing — '+m[1]],
    [/^Không đọc được file: (.+)$/u, m => 'Could not read file: '+m[1]],
    [/^Hôm nay còn (\d+) việc chưa xong$/u, m => m[1]+' tasks remaining today'],
    [/^(\d+) việc của ngày trước chưa hoàn thành$/u, m => m[1]+' overdue tasks from previous days'],
    [/^Đã quá giờ: (.+)$/u, m => 'Overdue: '+m[1]],
    [/^Sắp tới lúc (.+)$/u, m => 'Coming up at '+m[1]],
    [/^Đến giờ rồi: (.+)$/u, m => 'Starting now: '+m[1]],
    [/^Đến giờ học rồi! ⏰$/u, m => 'Time to study! ⏰'],
    [/^Còn (\d+) phút nữa$/u, m => m[1]+' minutes to go'],
    [/^Hôm nay bạn có (\d+) việc, còn (\d+) việc chưa xong\.$/u, m => 'You have '+m[1]+' tasks today, with '+m[2]+' remaining.'],
    [/^Hôm nay chưa có việc nào, thêm kế hoạch nhé!$/u, m => 'No tasks today yet. Add your plan!'],
    [/^Bạn còn (\d+) việc của những ngày trước chưa hoàn thành\.$/u, m => 'You have '+m[1]+' unfinished tasks from previous days.'],
    [/^Việc kế tiếp hôm nay$/u, m => 'Next task today'],
    [/^Chào buổi (sáng|trưa|chiều|tối), (.+)! 👋$/u, m => ({sáng:'Good morning',trưa:'Good afternoon',chiều:'Good afternoon',tối:'Good evening'})[m[1]]+', '+m[2]+'! 👋'],
    [/^Đến giờ học rồi!$/u, m => 'Time to study!'],
    [/^\/(.+)$/u, m => '/ '+(WORDS[m[1].trim()]||m[1])],
  ];
  function enText(value) {
    const raw = String(value), core = raw.trim();
    if (!core) return raw;
    let translated = WORDS[core];
    if (translated === undefined) {
      for (const [regex, fn] of RULES) { const match = core.match(regex); if (match) { translated = fn(match); break } }
    }
    if (translated === undefined) return raw;
    const i = raw.indexOf(core);
    return raw.slice(0,i) + translated + raw.slice(i+core.length);
  }
  function excluded(node) {
    const el = node.parentElement;
    // User-written text, subject names and task descriptions must never be translated.
    return !el || !!el.closest('.sbj, #uName, #uMail, #sList .sbj, .wc b, .rw .tt b, .dc .fw-semibold, .note-i .user-content, .st option, [data-act="flt"] option, #tc .user-content, .sp-preferences, .sp-confirm-overlay');
  }
  function visitText(node) {
    if (excluded(node)) return;
    let source = ORIGINALS.get(node);
    const current = node.nodeValue;
    if (source === undefined || (current !== source && current !== enText(source))) {
      source = current;
      ORIGINALS.set(node, source);
    }
    const desired = lang === 'en' ? enText(source) : source;
    if (node.nodeValue !== desired) node.nodeValue = desired;
  }
  function visitAttrs(el) {
    if (el.closest('.sp-confirm-overlay, .sp-preferences')) return;
    let attrs = ATTR_ORIGINALS.get(el);
    if (!attrs) { attrs = {}; ATTR_ORIGINALS.set(el, attrs) }
    for (const k of ['title','placeholder','aria-label','alt']) {
      if (!el.hasAttribute(k)) continue;
      const cur = el.getAttribute(k);
      if (!(k in attrs) || (cur !== attrs[k] && cur !== enText(attrs[k]))) attrs[k] = cur;
      const target = lang === 'en' ? enText(attrs[k]) : attrs[k];
      if (cur !== target) el.setAttribute(k, target);
    }
  }
  function scan(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) return visitText(root);
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    visitAttrs(root);
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      if (n.nodeType === Node.TEXT_NODE) visitText(n);
      else visitAttrs(n);
    }
  }
  function statusEmojis() {
    document.querySelectorAll('select[data-act="st"], select[data-act="flt"]').forEach(select => {
      for (const opt of select.options) {
        if (!STATUS[opt.value]) continue;
        const value = `${EMOJI[opt.value]} ${STATUS[opt.value][lang]}`;
        if (opt.textContent !== value) opt.textContent = value;
      }
    });
    document.querySelectorAll('.mgrid ~ .d-flex .todo, .mgrid ~ .d-flex .doing, .mgrid ~ .d-flex .done, .mgrid ~ .d-flex .skip').forEach(el => {
      const key = Object.keys(STATUS).find(k => el.classList.contains(k));
      if (!key) return;
      let span = el.querySelector('.sp-status-emoji');
      if (!span) { span = document.createElement('span'); span.className = 'sp-status-emoji'; el.insertBefore(span, el.firstChild) }
      if (span.textContent !== EMOJI[key]) span.textContent = EMOJI[key];
    });
  }
  function weekday() {
    const field = document.getElementById('fDate');
    if (!field) return;
    let info = document.getElementById('spWeekday');
    if (!info) {
      info = document.createElement('small'); info.id = 'spWeekday'; info.className = 'sp-weekday';
      info.setAttribute('aria-live','polite'); field.insertAdjacentElement('afterend',info);
    }
    if (!field.value) { if (info.textContent) info.textContent = ''; return }
    const [y, m, d] = field.value.split('-').map(Number);
    const dt = new Date(y,m-1,d);
    if (Number.isNaN(dt.getTime())) { info.textContent=''; return }
    const displayDay = dt.toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', { weekday:'long' });
    if (info.textContent !== displayDay) info.textContent = displayDay;
  }
  function updateCharts() {
    if (!isPlanner || typeof S === 'undefined' || !Array.isArray(S.ch)) return;
    for (const chart of S.ch) {
      if (!chart) continue;
      const colors = theme === 'dark' ? '#d1c8df' : '#8a84a3';
      if (chart.options.plugins?.legend?.labels) chart.options.plugins.legend.labels.color = colors;
      else if (chart.options.plugins?.legend) chart.options.plugins.legend.labels = {color:colors};
      for (const ax of Object.values(chart.options.scales || {})) {
        if (ax.ticks) ax.ticks.color = colors;
        if (ax.grid) ax.grid.color = theme === 'dark' ? '#514762' : 'rgba(0,0,0,.08)';
      }
      if (chart.canvas.id === 'cStatus') chart.data.labels = Object.keys(STATUS).map(k => `${EMOJI[k]} ${STATUS[k][lang]}`);
      else if (chart.canvas.id === 'cDay') chart.data.datasets.forEach((ds,i) => { const k = Object.keys(STATUS)[i]; if(k) ds.label = `${EMOJI[k]} ${STATUS[k][lang]}` });
      chart.update('none');
    }
  }
  let scheduled = false, applying = false;
  function refresh() {
    if (applying) return;
    applying = true;
    try {
      scan(document.body);
      statusEmojis(); weekday(); updateCharts();
      document.documentElement.lang = lang;
      if (!isPlanner) document.title = lang === 'en' ? 'Log in · Study Planner' : 'Đăng nhập · Study Planner';
    } finally { applying = false }
  }
  function scheduleRefresh() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; refresh() });
  }
  const flagSvg = k => k === 'vi' ? `<svg role="img" aria-label="Vietnam" viewBox="0 0 32 32"><defs><clipPath id="spvnclip"><circle cx="16" cy="16" r="16"/></clipPath></defs><g clip-path="url(#spvnclip)"><path fill="#da251d" d="M0 0h32v32H0z"/><path fill="#ffec32" d="m16 7.2 2.7 6.1 6.6.6-5 4.4 1.5 6.5-5.8-3.5-5.8 3.5 1.5-6.5-5-4.4 6.6-.6Z"/></g></svg>` : `<svg role="img" aria-label="English" viewBox="0 0 32 32"><defs><clipPath id="spukclip"><circle cx="16" cy="16" r="16"/></clipPath></defs><g clip-path="url(#spukclip)"><path fill="#173c84" d="M0 0h32v32H0z"/><path stroke="#fff" stroke-width="7" d="m-3 -3 38 38m0-38L-3 35"/><path stroke="#c62f45" stroke-width="3" d="m-3 -3 38 38m0-38L-3 35"/><path stroke="#fff" stroke-width="11" d="M16-2v36M-2 16h36"/><path stroke="#c62f45" stroke-width="5" d="M16-2v36M-2 16h36"/></g></svg>`;
  function createPrefs() {
    const wrapper = document.createElement('div');
    wrapper.className = 'sp-preferences'+(isPlanner ? '' : ' sp-login-preferences');
    wrapper.innerHTML = `<button type="button" class="sp-pref-btn sp-theme" aria-label="Toggle light/dark theme"></button><button type="button" class="sp-pref-btn sp-flag" aria-label="Switch language"></button>`;
    if (isPlanner) document.querySelector('nav.glass .d-flex.align-items-center.gap-2')?.prepend(wrapper);
    else document.body.append(wrapper);
    const themeBtn = wrapper.querySelector('.sp-theme'), langBtn = wrapper.querySelector('.sp-flag');
    const updateBtns = () => {
      themeBtn.innerHTML = `<i class="bi bi-${theme === 'dark' ? 'sun-fill':'moon-stars-fill'}"></i>`;
      themeBtn.title = lang === 'en' ? (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : (theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối');
      themeBtn.setAttribute('aria-label',themeBtn.title);
      langBtn.innerHTML = flagSvg(lang);
      langBtn.title = lang === 'en' ? 'English · switch to Tiếng Việt' : 'Tiếng Việt · switch to English';
      langBtn.setAttribute('aria-label',langBtn.title);
    };
    themeBtn.addEventListener('click', () => { theme = theme === 'dark' ? 'light':'dark'; persist(KEY_THEME,theme); document.documentElement.dataset.spTheme = theme; updateBtns(); updateCharts() });
    langBtn.addEventListener('click', () => { lang = lang === 'en' ? 'vi':'en'; persist(KEY_LANG,lang); updateBtns(); refresh() });
    updateBtns();
  }
  document.documentElement.dataset.spTheme = theme;
  createPrefs();
  document.getElementById('fDate')?.addEventListener('input', weekday);
  document.getElementById('fDate')?.addEventListener('change', weekday);
  const observer = new MutationObserver(scheduleRefresh);
  observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  refresh();

  // Confirmation is an added capture-phase guard. Only an explicitly approved event
  // reaches the original listeners. Nothing in the database implementation changes.
  if (!isPlanner) return;
  let confirmOpen = false;
  const allowClicks = new WeakSet();
  const allowChanges = new WeakSet();
  const msg = (en, vi) => lang === 'en' ? en : vi;
  function confirmAction(title, detail, danger = false) {
    if (confirmOpen) return Promise.resolve(false);
    confirmOpen = true;
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'sp-confirm-overlay';
      overlay.innerHTML = `<div class="sp-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="spQuestion" aria-describedby="spDetail">
        <div class="sp-confirm-icon${danger?' sp-danger':''}"><i class="bi bi-${danger?'exclamation-triangle':'question-circle'}"></i></div>
        <h3 id="spQuestion"></h3><p id="spDetail"></p><div class="sp-confirm-actions"><button class="sp-cancel" type="button"></button><button class="sp-accept${danger?' sp-danger':''}" type="button"></button></div>
        </div><span class="modal show" aria-hidden="true" style="display:none"></span>`;
      overlay.querySelector('#spQuestion').textContent = title;
      overlay.querySelector('#spDetail').textContent = detail;
      overlay.querySelector('.sp-cancel').textContent = msg('Cancel','Hủy');
      overlay.querySelector('.sp-accept').textContent = danger ? msg('Yes, delete','Đồng ý xóa') : msg('Confirm','Xác nhận');
      document.body.append(overlay);
      const cancel = overlay.querySelector('.sp-cancel'), yes = overlay.querySelector('.sp-accept');
      const originalFocus = document.activeElement;
      const finish = decision => {
        overlay.remove(); document.removeEventListener('keydown', onKey, true);
        confirmOpen = false;
        if (originalFocus?.isConnected) originalFocus.focus();
        resolve(decision);
      };
      const onKey = e => {
        if (e.key === 'Escape') { e.preventDefault();e.stopImmediatePropagation();finish(false) }
        if (e.key === 'Tab') {
          const next = document.activeElement === cancel ? yes : cancel;
          e.preventDefault();next.focus();
        }
      };
      document.addEventListener('keydown',onKey,true);
      cancel.onclick=()=>finish(false); yes.onclick=()=>finish(true);
      cancel.focus();
    });
  }
  // Public confirmation hook for optional, separately loaded planner modules.
  window.spConfirm = confirmAction;
  const detailFor = (action,id) => {
    const task = (typeof S !== 'undefined' && S.tasks || []).find(x=>String(x.id)===String(id));
    if (action === 'save') {
      const isEdit = !!S.m?.id;
      return {
        title: isEdit ? msg('Confirm changes?','Xác nhận chỉnh sửa?') : msg('Save this task?','Xác nhận lưu việc?'),
        detail: msg(isEdit?'Save changes to this task?':'Add this task to your planner?',isEdit?'Bạn chắc chắn muốn lưu những thay đổi của công việc này?':'Bạn chắc chắn muốn thêm công việc này vào kế hoạch?')+((document.getElementById('spRepeatKind')?.value||'none')!=='none'?msg('\nRepeating occurrences for the next 8 weeks will also be created.','\nCác buổi lặp lại trong 8 tuần tới cũng sẽ được tạo.'):'')+'\n'+(document.getElementById('fTitle')?.value.trim()||''),
        danger:false
      };
    }
    if (action==='del'||action==='rm') {
      const t = action==='del' ? S.tasks.find(x=>String(x.id)===String(S.m?.id)) : task;
      return {title:msg('Delete this task?','Xác nhận xóa việc?'),detail:msg('This task will be deleted. You can still undo it from notifications today.','Công việc này sẽ bị xóa. Bạn vẫn có thể hoàn tác từ thông báo trong hôm nay.')+'\n'+(t?.title||''),danger:true};
    }
    if (action==='subdel') return {title:msg('Delete subject group?','Xác nhận xóa nhóm môn?'),detail:msg('The group will be removed. Existing tasks stay intact.','Nhóm môn sẽ bị xóa, nhưng những công việc đã tạo vẫn được giữ nguyên.'),danger:true};
    if (action==='subadd') return {title:msg('Add subject group?','Xác nhận thêm nhóm môn?'),detail:document.getElementById('sNew')?.value.trim()||'',danger:false};
    if (action==='impgo') return {title:msg('Import these tasks?','Xác nhận nhập danh sách việc?'),detail:msg('These tasks will be added to your planner.','Các công việc trong file Excel sẽ được thêm vào kế hoạch học tập.'),danger:false};
    if (action==='pwsave') return {title:msg('Change your password?','Xác nhận đổi mật khẩu?'),detail:msg('Your account password will be updated.','Mật khẩu tài khoản sẽ được cập nhật.'),danger:false};
    return null;
  };
  document.addEventListener('click', async e => {
    const btn=e.target.closest('[data-act]');
    if(!btn) return;
    const action=btn.dataset.act;
    if(!['save','del','rm','subdel','subadd','impgo','pwsave'].includes(action)) return;
    if(allowClicks.has(btn)){allowClicks.delete(btn);return}
    // Let the original form validation display its own error without a confirmation.
    if(action==='save' && (!document.getElementById('fTitle').value.trim() || !document.getElementById('fDate').value)) return;
    if(action==='subadd' && !document.getElementById('sNew').value.trim()) return;
    if(action==='impgo' && btn.disabled) return;
    e.preventDefault();e.stopImmediatePropagation();
    const info=detailFor(action,btn.dataset.id);
    if(info && await confirmAction(info.title,info.detail,info.danger)) {
      if(btn.isConnected){allowClicks.add(btn);btn.click()}
    }
  },true);
  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter'||e.target.id!=='sNew'||!e.target.value.trim()) return;
    e.preventDefault();e.stopImmediatePropagation();
    document.querySelector('[data-act="subadd"]')?.click();
  },true);
  document.addEventListener('change',async e=>{
    const el=e.target.closest('[data-act="st"],[data-act="note"]');
    if(!el||allowChanges.has(el)){if(el) allowChanges.delete(el);return}
    const task=S.tasks.find(x=>String(x.id)===String(el.dataset.id));
    if(!task)return;
    const isStatus=el.dataset.act==='st';
    const previous=isStatus?task.status:(task.note||'');
    const proposed=el.value;
    if(previous===proposed)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(isStatus)el.value=previous;
    const title=isStatus ? msg('Change task status?','Xác nhận đổi trạng thái?') : msg('Save edited notes?','Xác nhận lưu ghi chú?');
    const text=isStatus ? msg(`Change “${task.title}” to “${STATUS[proposed]?.en||proposed}”?`,`Đổi trạng thái “${task.title}” thành “${STATUS[proposed]?.vi||proposed}”?`) : msg(`Save the edited notes for “${task.title}”?`,`Lưu ghi chú vừa chỉnh sửa cho “${task.title}”?`);
    if(await confirmAction(title,text)) {
      if(el.isConnected){el.value=proposed;allowChanges.add(el);el.dispatchEvent(new Event('change',{bubbles:true}))}
    }else el.value=previous;
  },true);
})();
