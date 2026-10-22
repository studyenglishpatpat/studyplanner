/* ===== CẤU HÌNH SUPABASE (dùng chung cho login.html và studyplanner.html) ===== */
const SUPABASE_URL = 'https://ebmblkxpukvghogdvypo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SgA7nza5d6yr2-FCUpsx8Q_z8CWdMfi';
// Phiên đăng nhập tự lưu trong localStorage -> lần sau vào lại không cần đăng nhập
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Toast Bootstrap: trượt mượt từ mép phải vào, tự tắt sau 5s (rê chuột vào để giữ lại)
   type = success | danger | info | warning | reminder
   o = { title, delay (ms, mặc định 5000), action: { label, fn } }  */
function toast(msg, type = 'success', o = {}) {
  let box = $('#tc');
  if (!box) { box = document.createElement('div'); box.id = 'tc'; box.className = 'toast-container position-fixed top-0 end-0 p-3'; box.style.zIndex = 2000; document.body.append(box); }
  const ic = { success: 'check-circle-fill', danger: 'x-circle-fill', info: 'info-circle-fill', warning: 'exclamation-triangle-fill', reminder: 'bell-fill' }[type];
  const e = document.createElement('div');
  e.className = `toast border-0 t-${type}`; e.setAttribute('role', 'alert');
  e.innerHTML = `<div class="d-flex align-items-start"><div class="toast-body flex-grow-1"><i class="bi bi-${ic} me-2"></i>${o.title ? `<b>${esc(o.title)}</b><br>` : ''}${esc(msg)}${o.action ? `<div class="mt-2"><button type="button" class="btn btn-sm btn-light rounded-pill fw-semibold" data-ta>${esc(o.action.label)}</button></div>` : ''}</div><button type="button" class="btn-close m-2" data-x></button></div>`;
  box.append(e);
  const t = new bootstrap.Toast(e, { animation: false, autohide: false });
  let timer;
  const close = () => {
    clearTimeout(timer); if (e.classList.contains('out')) return;
    e.style.setProperty('--h', e.offsetHeight + 'px'); e.classList.add('out');
    e.addEventListener('animationend', () => { t.hide(); e.remove(); }, { once: true });
  };
  const arm = ms => { clearTimeout(timer); timer = setTimeout(close, ms); };
  e.querySelector('[data-x]').onclick = close;
  if (o.action) e.querySelector('[data-ta]').onclick = () => { close(); o.action.fn(); };
  e.addEventListener('mouseenter', () => clearTimeout(timer));
  e.addEventListener('mouseleave', () => arm(2000));
  t.show(); arm(o.delay ?? 5000); return t;
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
