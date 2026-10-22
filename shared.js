/* ===== CẤU HÌNH SUPABASE (dùng chung cho login.html và studyplanner.html) ===== */
const SUPABASE_URL = 'https://ebmblkxpukvghogdvypo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SgA7nza5d6yr2-FCUpsx8Q_z8CWdMfi';
// Phiên đăng nhập tự lưu trong localStorage -> lần sau vào lại không cần đăng nhập
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Toast Bootstrap: type = success | danger | info | warning */
function toast(msg, type = 'success') {
  let box = $('#tc');
  if (!box) { box = document.createElement('div'); box.id = 'tc'; box.className = 'toast-container position-fixed bottom-0 start-50 translate-middle-x p-3'; box.style.zIndex = 2000; document.body.append(box); }
  const ic = { success: 'check-circle-fill', danger: 'x-circle-fill', info: 'info-circle-fill', warning: 'exclamation-triangle-fill' }[type];
  const e = document.createElement('div');
  e.className = `toast align-items-center border-0 t-${type}`; e.setAttribute('role', 'alert');
  e.innerHTML = `<div class="d-flex"><div class="toast-body"><i class="bi bi-${ic} me-2"></i>${esc(msg)}</div><button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  box.append(e);
  e.addEventListener('hidden.bs.toast', () => e.remove());
  new bootstrap.Toast(e, { delay: 3200 }).show();
}

/* Ô mật khẩu có icon Bootstrap để xem/ẩn */
const pw = (id, label, ph = '', ac = 'current-password') =>
  `<label class="form-label small fw-semibold text-secondary" for="${id}">${label}</label>
   <div class="input-group mb-3"><input type="password" class="form-control" id="${id}" placeholder="${ph}" autocomplete="${ac}">
   <button class="btn btn-outline-secondary" type="button" data-eye="${id}" title="Hiện/ẩn mật khẩu"><i class="bi bi-eye"></i></button></div>`;
document.addEventListener('click', e => {
  const b = e.target.closest('[data-eye]'); if (!b) return;
  const i = document.getElementById(b.dataset.eye), show = i.type === 'password';
  i.type = show ? 'text' : 'password';
  b.innerHTML = `<i class="bi bi-eye${show ? '-slash' : ''}"></i>`;
});

const viErr = m => /invalid login/i.test(m) ? 'Sai email hoặc mật khẩu' : /already registered/i.test(m) ? 'Email này đã được đăng ký' : /password should be/i.test(m) ? 'Mật khẩu cần ít nhất 6 ký tự' : /rate limit/i.test(m) ? 'Thao tác quá nhanh, hãy thử lại sau ít phút' : m;
