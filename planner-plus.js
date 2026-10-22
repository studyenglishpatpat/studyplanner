/* STUDY PLANNER PLUS — optional add-on. No edits to the original task, auth,
   import or statistics functions. Recurrence/mood/focus preferences are saved
   on this browser for the current user; generated tasks remain in Supabase. */
(() => {
  'use strict';
  if (!document.getElementById('mTask') || typeof S === 'undefined') return;
  const $p = sel => document.querySelector(sel);
  const pa = n => String(n).padStart(2, '0');
  const locale = () => localStorage.getItem('studyplanner_language_v1') === 'vi' ? 'vi' : 'en';
  const tr = (en, vi) => locale() === 'vi' ? vi : en;
  const asIso = d => `${d.getFullYear()}-${pa(d.getMonth()+1)}-${pa(d.getDate())}`;
  const parseDate = s => { const [y,m,d] = s.split('-').map(Number);return new Date(y,m-1,d); };
  const shift = (d,n) => { const t=new Date(d); t.setDate(t.getDate()+n); return t; };
  const safe = s => esc(s ?? '');
  const userKey = part => `studyplanner_plus_v2_${part}_${S.user?.id||'guest'}`;
  function get(part, fallback) { try { const v=JSON.parse(localStorage.getItem(userKey(part)));return v ?? fallback } catch {return fallback} }
  function put(part, data) { try {localStorage.setItem(userKey(part), JSON.stringify(data))} catch {toast(tr('Browser storage unavailable','Không thể lưu vào trình duyệt'), 'warning')} }
  const dialog = (title, detail, danger=false) => typeof window.spConfirm === 'function' ? window.spConfirm(title,detail,danger) : Promise.resolve(window.confirm(`${title}\n${detail}`));
  const EXTRAS = {focus:{en:'Focus Mode',vi:'Tập trung',icon:'stopwatch'},mood:{en:'Mood Tracker',vi:'Cảm xúc',icon:'emoji-smile'}};
  TABS.focus = 'Focus Mode'; TABS.mood = 'Mood Tracker';
  let rules=[], moods={}, focus={}, moodDraft=null, changed=false, menuOpen=false;
  let currentUser=null, generating=false, generateQueued=false, dragging=null;
  const defaultFocus = () => ({duration:1500,elapsed:0,running:false,startedAt:0,taskId:'',sessions:[]});
  function hydrateUser() {
    if (!S.user) return false;
    if (currentUser !== S.user.id) {
      currentUser=S.user.id; rules=get('rules',[]); moods=get('moods',{});focus={...defaultFocus(),...get('focus',defaultFocus())};
    }
    return true;
  }
  function saveRules(){put('rules',rules)}
  function saveMood(){put('moods',moods)}
  function saveFocus(){put('focus',focus)}
  function labelDay(day) {return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day]}
  function labelDayVi(day) {return ['CN','T2','T3','T4','T5','T6','T7'][day]}
  const weekName = x=> locale()==='en'?labelDay(x):labelDayVi(x);
  const weekdays = [1,2,3,4,5,6,0];
  const frequencyText = rule => {
    if(rule.kind==='daily') return tr('Every day','Hằng ngày');
    if(rule.kind==='weekdays') return tr('Mon–Fri','Thứ 2–6');
    return (rule.days||[]).map(weekName).join(', ');
  };
  function applies(rule,d) {
    if (!rule.active || d<rule.start || (rule.until && d>rule.until)) return false;
    const wd=parseDate(d).getDay();
    return rule.kind==='daily' || (rule.kind==='weekdays' && wd>=1 && wd<=5) || (rule.kind==='weekly' && rule.days.includes(wd));
  }
  async function generateUpcoming() {
    if (!hydrateUser() || generating || !rules.some(r=>r.active)) return;
    generating=true;
    try {
      const today=asIso(new Date());
      let created=0;
      for (const rule of rules) {
        if (!rule.active) continue;
        const start=rule.start>today?rule.start:today;
        const horizon=asIso(shift(parseDate(start),55));
        if (rule.until && start>rule.until) continue;
        const rows=[], days=[];
        for (let dt=parseDate(start);asIso(dt)<=horizon;dt=shift(dt,1)) {
          const d=asIso(dt);
          if (!applies(rule,d) || Object.prototype.hasOwnProperty.call(rule.generated||{},d)) continue;
          days.push(d); rows.push({title:rule.title,subject:rule.subject,date:d,t_start:rule.t_start||null,t_end:rule.t_end||null,note:rule.note||'',status:'todo'});
          if (rows.length>=60) break;
        }
        // Each day is persisted as an ordinary task, so the existing calendar,
        // checklist, statistics and backups continue to work without new SQL.
        if (rows.length) {
          const {data,error}=await sb.from('tasks').insert(rows).select('id,date');
          if (error) throw error;
          rule.generated=rule.generated||{};
          for(const row of data||[]) rule.generated[row.date]=row.id;
          saveRules(); created+=(data||[]).length;
        }
      }
      if(created) {
        const {data,error}=await sb.from('tasks').select('*');
        if(!error){S.tasks=data.sort((a,b)=>(a.date+(a.t_start||'')).localeCompare(b.date+(b.t_start||'')));refreshCurrent(true)}
      }
    } catch(err) {
      console.warn('[Study Planner Plus] Recurrence:',err);
      if (S.user) toast(tr('Could not create repeating tasks: ','Không tạo được việc lặp lại: ')+err.message,'warning');
    } finally {generating=false}
  }
  function queueGeneration(){
    if(generateQueued)return;
    generateQueued=true;
    setTimeout(()=>{generateQueued=false;void generateUpcoming()},100);
  }
  // We DO NOT call base load again from the recurrence generator; this avoids
  // cascades, and all original Supabase queries remain untouched.
  const baseLoad = window.load;
  if(typeof baseLoad==='function') window.load=async function(...args){
    const result=await baseLoad.apply(this,args);
    if(hydrateUser() && rules.some(x=>x.active)) queueGeneration();
    return result;
  };
  /* Navigation: retain the existing desktop sidebar. Only <=800px uses a drawer. */
  function buildNav() {
    const side=$p('.side'), list=side?.querySelector('.nav'), checklist=list?.querySelector('[data-tab="list"]');
    if (!list||!checklist) return;
    let anchor=checklist;
    for(const [id,cfg] of Object.entries(EXTRAS)) {
      let btn=list.querySelector(`[data-plus-tab="${id}"]`);
      if(!btn){btn=document.createElement('button');btn.type='button';btn.className='nav-link sp-side-extra';btn.dataset.plusTab=id;anchor.insertAdjacentElement('afterend',btn)}
      btn.innerHTML=`<i class="bi bi-${cfg.icon}"></i><span>${cfg[locale()]}</span>`;
      btn.classList.toggle('active',S.tab===id);
      anchor=btn;
    }
    if(!side.querySelector('.sp-side-header')) {
      const head=document.createElement('div');head.className='sp-side-header';head.innerHTML='<span>✦ STUDY PLANNER</span><button type="button" data-plus-close aria-label="Close menu"><i class="bi bi-x-lg"></i></button>';
      side.insertBefore(head,side.firstChild);
    }
    if (!$p('.sp-menu-toggle')){
      const menu=document.createElement('button');menu.type='button';menu.className='sp-menu-toggle';menu.setAttribute('aria-controls','sp-side-menu');menu.setAttribute('aria-expanded','false');menu.innerHTML='<i class="bi bi-list fs-5"></i>';
      $p('nav.glass .hnav')?.prepend(menu);
    }
    side.id='sp-side-menu';
    if(!$p('.sp-menu-scrim')){const scrim=document.createElement('div');scrim.className='sp-menu-scrim';document.body.append(scrim);scrim.addEventListener('click',()=>toggleMenu(false))}
    updateMenuLabel();
  }
  function updateMenuLabel(){
    const btn=$p('.sp-menu-toggle');if(!btn)return;
    btn.title=tr('Menu','Danh mục');btn.setAttribute('aria-label',btn.title);
    btn.setAttribute('aria-expanded',String(menuOpen));
    const head=$p('.sp-side-header span');if(head)head.textContent=tr('✦ MENU','✦ DANH MỤC');
  }
  function toggleMenu(open){
    menuOpen=!!open;
    $p('.side')?.classList.toggle('sp-menu-open',menuOpen);
    $p('.sp-menu-scrim')?.classList.toggle('open',menuOpen);
    document.body.classList.toggle('sp-drawer-active',menuOpen);
    updateMenuLabel();
  }
  function isSmall(){return window.matchMedia('(max-width: 800px)').matches}
  document.addEventListener('click',e=>{
    if(e.target.closest('.sp-menu-toggle')){toggleMenu(!menuOpen);return}
    if(e.target.closest('[data-plus-close]')){toggleMenu(false);return}
    const n=e.target.closest('[data-plus-tab]');
    if(n){e.preventDefault();e.stopImmediatePropagation();S.tab=n.dataset.plusTab;S.last=S.tab;toggleMenu(false);refreshCurrent(true);window.scrollTo(0,0);return}
    if(e.target.closest('[data-tab],[data-hn],[data-act="home"],[data-act="cal"]')&&menuOpen)toggleMenu(false);
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuOpen)toggleMenu(false)});
  window.addEventListener('resize',()=>{if(!isSmall()&&menuOpen)toggleMenu(false)});
  /* Existing task modal: an independent recurrence block below the original fields. */
  const baseOpenTask=window.openTask;
  if(typeof baseOpenTask==='function')window.openTask=function(m){
    baseOpenTask(m);
    renderRepeatForm(m);
  };
  function renderRepeatForm(task) {
    let block=$p('#spRepeat');
    if(!block){block=document.createElement('div');block.id='spRepeat';block.className='sp-rpt-panel';$p('#mTask .modal-body')?.append(block)}
    const belongs=rules.find(r=>Object.values(r.generated||{}).some(v=>String(v)===String(task.id)));
    const defDay=(task.date?parseDate(task.date):new Date()).getDay();
    block.innerHTML=belongs?
      `<div class="d-flex align-items-center gap-2"><i class="bi bi-arrow-repeat text-pu"></i><b>${tr('Part of a repeating schedule','Thuộc một lịch lặp lại')}</b></div>
       <div class="sp-rpt-hint">${tr('Editing this task changes only this occurrence. Future tasks keep their own schedule.','Chỉnh sửa việc này chỉ ảnh hưởng buổi này. Những buổi tiếp theo giữ nguyên lịch.')}</div>
       <button type="button" class="btn btn-soft btn-sm mt-2" data-plus="rules">${tr('Manage repeat schedules','Quản lý lịch lặp lại')}</button>`:
      `<label class="form-label fw-semibold small mb-1" for="spRepeatKind"><i class="bi bi-arrow-repeat me-1"></i>${tr('Repeat this task','Lặp lại công việc')}</label>
       <select class="form-select form-select-sm" id="spRepeatKind"><option value="none">${tr('Does not repeat','Không lặp lại')}</option><option value="daily">${tr('Every day','Hằng ngày')}</option><option value="weekdays">${tr('Weekdays (Mon–Fri)','Các ngày trong tuần (T2–T6)')}</option><option value="weekly">${tr('Choose weekdays','Chọn thứ trong tuần')}</option></select>
       <div id="spRepeatOptions" hidden><div class="sp-rpt-weekdays" id="spRepeatDays">${weekdays.map(w=>`<label class="sp-rpt-day"><input type="checkbox" value="${w}" ${w===defDay?'checked':''}><span>${weekName(w)}</span></label>`).join('')}</div>
       <label class="form-label small fw-semibold mt-2" for="spRepeatUntil">${tr('Repeat until (optional)','Lặp đến ngày (có thể bỏ trống)')}</label><input type="date" id="spRepeatUntil" class="form-control form-control-sm" min="${task.date||asIso(new Date())}">
       <div class="sp-rpt-hint">${tr('Upcoming occurrences are generated automatically over the next 8 weeks. You can edit each separately.','Các buổi trong 8 tuần tới tự được tạo. Bạn có thể sửa riêng từng buổi.')}</div></div>
       <div class="sp-rpt-tools"><button type="button" class="btn btn-soft btn-sm" data-plus="rules"><i class="bi bi-list-ul me-1"></i>${tr('Manage repeat schedules','Quản lý lịch lặp lại')}</button></div>`;
    $p('#spRepeatKind')?.addEventListener('change',e=>{
      $p('#spRepeatOptions').hidden=e.target.value==='none';
      $p('#spRepeatDays').hidden=e.target.value!=='weekly';
    });
  }
  function repeatChoice(){
    const kind=$p('#spRepeatKind')?.value;
    if(!kind||kind==='none')return null;
    return {kind,days:[...document.querySelectorAll('#spRepeatDays input:checked')].map(x=>+x.value),until:$p('#spRepeatUntil')?.value||''};
  }
  async function saveWithRecurrence() {
    const choice=repeatChoice();if(!choice)return false;
    const t=readForm();
    if(!t.title||!t.date)return false;
    if(choice.kind==='weekly'&&!choice.days.length){toast(tr('Choose at least one weekday','Hãy chọn ít nhất một thứ'),'warning');return true}
    if(choice.until&&choice.until<t.date){toast(tr('End date must be after the start date','Ngày kết thúc phải sau ngày bắt đầu'),'warning');return true}
    const {id,...fields}=t;
    let baseId=id;
    try {
      let result;
      if(id){result=await sb.from('tasks').update(fields).eq('id',id).select('id').single()}
      else result=await sb.from('tasks').insert(fields).select('id').single();
      if(result.error)throw result.error;
      baseId=result.data?.id||id;
      const rule={id:'repeat_'+Date.now()+'_'+Math.random().toString(36).slice(2,9),...fields,start:t.date,kind:choice.kind,days:choice.days,until:choice.until,active:true,generated:{[t.date]:baseId}};
      rules.push(rule);saveRules();
      mTask.hide();await baseLoad();refreshCurrent(true);queueGeneration();
      toast(tr('Recurring schedule saved ✨','Đã lưu lịch lặp lại ✨'),'success');
    }catch(err){toast(err.message,'danger')}
    return true;
  }
  // Capture-phase handling happens after the previous add-on's confirmation guard.
  // The previous add-on always confirms before this handler writes to Supabase.
  document.addEventListener('click',async e=>{
    const save=e.target.closest('[data-act="save"]');
    if(!save||!repeatChoice())return;
    e.preventDefault();e.stopImmediatePropagation();
    await saveWithRecurrence();
  },true);
  function showRules() {
    hydrateUser();
    let shell=$p('#spRulesModal');
    if(!shell){shell=document.createElement('div');shell.className='sp-move-pop';shell.id='spRulesModal';document.body.append(shell)}
    shell.innerHTML=`<div class="sp-move-dialog sp-rules-modal" role="dialog" aria-modal="true" aria-labelledby="spRulesHeading"><div class="d-flex align-items-start justify-content-between mb-2"><h5 id="spRulesHeading">${tr('Repeat schedules','Lịch lặp lại')}</h5><button type="button" class="btn-close" data-plus="rules-close"></button></div>
    ${rules.length?rules.map(r=>`<div class="sp-rules-item"><div class="min-w-0"><b>${safe(r.title)}</b><small>${frequencyText(r)} · ${r.start}${r.until?' → '+r.until:''}</small><small>${r.active?tr('Active','Đang hoạt động'):tr('Paused','Đã dừng')}</small></div><button type="button" class="btn btn-sm ${r.active?'btn-del':'btn-soft'}" data-plus="rule-toggle" data-id="${safe(r.id)}">${r.active?tr('Stop','Dừng'):tr('Resume','Tiếp tục')}</button></div>`).join(''):`<p class="sp-plus-mut">${tr('No recurring schedules yet.','Bạn chưa tạo lịch lặp lại.')}</p>`}
    <small class="sp-plus-mut d-block mt-2">${tr('Stopping prevents NEW future occurrences. Tasks already created stay in the calendar.','Dừng lặp chỉ ngừng tạo buổi MỚI. Các việc đã tạo vẫn nằm trong lịch.')}</small>
    <button class="btn btn-soft mt-3 w-100" type="button" data-plus="rules-close">${tr('Close','Đóng')}</button></div>`;
  }
  /* Focus Mode: wall-clock based, so leaving the page and returning resumes accurately. */
  const focusElapsed=()=>Math.min(focus.duration,focus.elapsed+(focus.running?Math.max(0,(Date.now()-focus.startedAt)/1000):0));
  function finishIfElapsed(){
    if(!hydrateUser()||!focus.running||focusElapsed()<focus.duration)return;
    focus.elapsed=focus.duration;focus.running=false;focus.startedAt=0;
    focus.sessions.unshift({at:new Date().toISOString(),minutes:Math.round(focus.duration/60),taskId:focus.taskId||''});
    focus.sessions=focus.sessions.slice(0,400);saveFocus();
    toast(tr('Focus session completed! 🌸','Đã hoàn thành phiên tập trung! 🌸'),'success');
    if(S.tab==='focus')refreshCurrent(true);
  }
  function formatClock(secs){const s=Math.max(0,Math.ceil(secs));return `${pa(Math.floor(s/3600))}:${pa(Math.floor((s%3600)/60))}:${pa(s%60)}`}
  function focusView() {
    hydrateUser();finishIfElapsed();
    const options=S.tasks.filter(x=>x.status==='todo'||x.status==='doing').filter(x=>x.date>=asIso(shift(new Date(),-1))).slice(0,150);
    const n=focus.sessions.filter(x=>x.at.slice(0,10)>=asIso(shift(new Date(),-6)));
    return `<div class="sp-plus-shell"><div class="sp-plus-title"><div><h4>⏱️ ${tr('Focus Mode','Chế độ tập trung')}</h4><div class="sp-plus-mut">${tr('One task at a time. You can do this!','Tập trung từng việc một nhé!')}</div></div></div>
    <div class="sp-focus-grid"><div class="sp-focus-card text-center"><div class="sp-plus-mut">${tr('YOUR FOCUS TIMER','ĐỒNG HỒ TẬP TRUNG')}</div><div class="sp-focus-clock" id="spFocusClock"><div class="sp-focus-clock-inner"><div class="sp-focus-digits" id="spFocusDigits">${formatClock(focus.duration-focusElapsed())}</div><div class="sp-focus-session" id="spFocusState">${tr('Ready when you are 🌸','Sẵn sàng rồi 🌸')}</div></div></div>
    <div class="sp-focus-controls mb-3">${[25,50,90].map(n=>`<button class="sp-focus-preset ${focus.duration===n*60?'active':''}" data-plus="preset" data-id="${n}">${n} min</button>`).join('')}</div>
    <div class="sp-focus-controls"><button class="btn btn-main px-4" data-plus="focus-toggle" id="spFocusToggle">${focus.running?tr('Pause','Tạm dừng'):focus.elapsed?tr('Resume','Tiếp tục'):tr('Start focus','Bắt đầu')}</button><button class="btn btn-soft" data-plus="focus-reset">${tr('Reset','Đặt lại')}</button><button class="btn btn-soft" data-plus="focus-finish">${tr('Finish','Kết thúc')}</button></div></div>
    <div class="sp-focus-card"><h6 class="fw-bold mb-3">${tr('Current task','Công việc đang tập trung')}</h6><select class="form-select mb-3" id="spFocusTask"><option value="">${tr('No linked task','Không gắn với việc cụ thể')}</option>${options.map(t=>`<option value="${safe(t.id)}" ${String(t.id)===String(focus.taskId)?'selected':''}>${safe(t.date+' · '+t.title)}</option>`).join('')}</select>
    <p class="sp-plus-mut">${tr('The timer records real focus time. Finishing a session does not automatically mark a task completed.','Đồng hồ ghi nhận thời gian thực tế. Kết thúc phiên không tự đánh dấu hoàn thành công việc.')}</p>
    <div class="stat s2 text-start mt-3"><small>${tr('Focus time, past 7 days','Thời gian tập trung, 7 ngày gần đây')}</small><b>${n.reduce((s,x)=>s+x.minutes,0)} <span style="font-size:15px">min</span></b></div>
    <div class="stat s1 text-start mt-3"><small>${tr('Completed sessions, past 7 days','Số phiên hoàn thành, 7 ngày gần đây')}</small><b>${n.length}</b></div></div></div></div>`;
  }
  function tickFocus() {
    if(S.tab!=='focus')return;
    const done=Math.max(0,focus.duration-focusElapsed()),ring=$p('#spFocusClock');
    if(ring)ring.style.setProperty('--sp-progress',`${Math.min(100,Math.round(focusElapsed()/focus.duration*100))}%`);
    if($p('#spFocusDigits'))$p('#spFocusDigits').textContent=formatClock(done);
    if($p('#spFocusState'))$p('#spFocusState').textContent=focus.running?tr('Stay focused 🌱','Đang tập trung 🌱'):focus.elapsed?tr('Paused','Đang tạm dừng'):tr('Ready when you are 🌸','Sẵn sàng rồi 🌸');
    if($p('#spFocusToggle'))$p('#spFocusToggle').textContent=focus.running?tr('Pause','Tạm dừng'):focus.elapsed?tr('Resume','Tiếp tục'):tr('Start focus','Bắt đầu');
  }
  /* Mood diary: per-user local browser storage, no existing table changes. */
  const MOODS=[['great','🤩','Great','Tuyệt vời'],['good','😊','Good','Vui vẻ'],['okay','😐','Okay','Bình thường'],['tired','😴','Tired','Mệt'],['hard','😔','Hard','Không ổn']];
  function moodView(){
    hydrateUser();const today=asIso(new Date());
    moodDraft=moodDraft?.date===today?{...moodDraft}:{date:today,mood:moods[today]?.mood||'',note:moods[today]?.note||''};
    const days=Array.from({length:28},(_,i)=>asIso(shift(new Date(),i-27)));
    const recorded=days.map(d=>moods[d]).filter(Boolean);
    return `<div class="sp-plus-shell"><div class="sp-plus-title"><div><h4>🌷 ${tr('Mood Tracker','Nhật ký cảm xúc')}</h4><div class="sp-plus-mut">${tr('Check in with yourself, one day at a time.','Ghi lại cảm xúc từng ngày, thật nhẹ nhàng.')}</div></div></div>
    <div class="sp-mood-card mb-3"><h6 class="fw-bold">${tr('How are you feeling today?','Hôm nay bạn cảm thấy thế nào?')}</h6><div class="sp-plus-mut mb-3">${today}</div>
    <div class="sp-mood-choices">${MOODS.map(([id,emoji,en,vi])=>`<button type="button" class="sp-mood-choice ${moodDraft.mood===id?'active':''}" data-plus="mood-pick" data-id="${id}"><span>${emoji}</span>${locale()==='vi'?vi:en}</button>`).join('')}</div>
    <label class="form-label mt-3 fw-semibold" for="spMoodNote">${tr('A little note (optional)','Ghi chú một chút (không bắt buộc)')}</label><textarea class="form-control" id="spMoodNote" rows="3" maxlength="500" placeholder="${tr('What made today special?','Điều gì khiến hôm nay đặc biệt?')}">${safe(moodDraft.note)}</textarea>
    <button class="btn btn-main mt-3" data-plus="mood-save"><i class="bi bi-heart-fill me-1"></i>${tr('Save today’s mood','Lưu cảm xúc hôm nay')}</button></div>
    <div class="sp-mood-card"><h6 class="fw-bold">${tr('Last 28 days','28 ngày gần đây')}</h6><div class="sp-mood-days">${days.map(d=>`<div class="sp-mood-day" title="${safe((moods[d]?.note||'').slice(0,150))}"><span>${d.slice(5)}</span><strong>${MOODS.find(x=>x[0]===moods[d]?.mood)?.[1]||'·'}</strong></div>`).join('')}</div><div class="sp-plus-mut mt-3">${recorded.length} ${tr('days recorded','ngày đã ghi chép')}</div></div></div>`;
  }
  async function changeDate(id,to){
    hydrateUser();const t=S.tasks.find(x=>String(x.id)===String(id));
    if(!t||!to||to===t.date)return;
    const approved=await dialog(tr('Move this task?','Chuyển ngày công việc?'),`${t.title}\n${t.date} → ${to}`);
    if(!approved)return;
    try{
      const {error}=await sb.from('tasks').update({date:to}).eq('id',t.id);if(error)throw error;
      const rule=rules.find(r=>Object.values(r.generated||{}).some(v=>String(v)===String(id)));
      // A moved occurrence remains an exception to its repeating schedule.
      if(rule){const k=Object.keys(rule.generated).find(k=>String(rule.generated[k])===String(id));if(k){rule.generated[k]=id;saveRules()}}
      await baseLoad();refreshCurrent(true);
      toast(tr('Task moved successfully ✨','Đã chuyển lịch thành công ✨'),'success');
    }catch(err){toast(err.message,'danger')}
  }
  function movePrompt(id){
    const t=S.tasks.find(x=>String(x.id)===String(id));if(!t)return;
    const shell=document.createElement('div');shell.className='sp-move-pop';shell.id='spMoveModal';
    shell.innerHTML=`<div class="sp-move-dialog" role="dialog" aria-modal="true" aria-labelledby="spMoveTitle"><h5 id="spMoveTitle">${tr('Move task to another date','Chuyển việc sang ngày khác')}</h5><p class="sp-plus-mut">${safe(t.title)}</p><label class="form-label" for="spMoveDate">${tr('New date','Ngày mới')}</label><input type="date" id="spMoveDate" class="form-control" value="${safe(t.date)}"><div class="d-flex gap-2 justify-content-end mt-3"><button class="btn btn-soft" data-plus="move-cancel">${tr('Cancel','Hủy')}</button><button class="btn btn-main" data-plus="move-apply" data-id="${safe(id)}">${tr('Continue','Tiếp tục')}</button></div></div>`;
    document.body.append(shell);$p('#spMoveDate')?.focus();
  }
  /* Render hooks decorate the existing views instead of replacing the original
     calendar/weekly/checklist implementations. */
  function mountClock(t,target){
    if(!t?.t_start||!target)return;
    let el=target.querySelector(':scope > .sp-activity');
    if(!el){el=document.createElement('span');el.className='sp-activity';target.append(el)}
    el.dataset.spClock=String(t.id);
  }
  function decorateTasks(){
    const view=$p('#view');if(!view)return;
    view.querySelectorAll('.rw').forEach(node=>{
      const t=S.tasks.find(x=>String(x.id)===String(node.querySelector('.tt[data-id]')?.dataset.id));
      const target=node.querySelector('.tt');if(t){mountClock(t,target);if(t.t_start)node.classList.add('sp-has-clock')}
    });
    view.querySelectorAll('.wc').forEach(node=>{
      const t=S.tasks.find(x=>String(x.id)===String(node.querySelector('[data-act="st"]')?.dataset.id));
      if(!t)return;
      mountClock(t,node);
      if(!node.querySelector('.sp-week-tools')){
        const tools=document.createElement('div');tools.className='sp-week-tools';
        tools.innerHTML=`<button type="button" data-plus="move" data-id="${safe(t.id)}" title="${tr('Choose another date','Chọn ngày khác')}"><i class="bi bi-calendar-event"></i></button><button type="button" class="sp-drag-handle" data-sp-drag="${safe(t.id)}" title="${tr('Drag to another day','Kéo sang ngày khác')}"><i class="bi bi-grip-vertical"></i></button>`;
        node.append(tools);
      }
    });
    view.querySelectorAll('tbody tr').forEach(row=>{
      const t=S.tasks.find(x=>String(x.id)===String(row.querySelector('[data-act="st"]')?.dataset.id));
      if(!t)return;
      const cell=row.querySelector('td:nth-child(3)');
      if(cell)mountClock(t,cell);
    });
    const weekCols=view.querySelectorAll('.col7');
    weekCols.forEach((col,i)=>col.dataset.spDropdate=asIso(shift(S.ws,i)));
    view.querySelectorAll('.mc[data-act="day"]').forEach(el=>{
      if(el.dataset.spMonthAdded)return;
      el.dataset.spDropdate=el.dataset.id;el.dataset.spMonthAdded='1';
      const items=day(el.dataset.id).slice(0,2);
      for(const t of items){const chip=document.createElement('span');chip.className='sp-month-chip sp-drag-handle';chip.dataset.spDrag=String(t.id);chip.title=tr('Drag to another date: ','Kéo sang ngày khác: ')+t.title;chip.textContent=t.title;el.append(chip)}
    });
    tickTaskClocks();
  }
  function decorateDay(){
    $p('#dBody')?.querySelectorAll('.dc').forEach(node=>{
      const id=node.querySelector('[data-act="st"]')?.dataset.id;
      const t=S.tasks.find(x=>String(x.id)===String(id));if(!t)return;
      const header=node.querySelector('.d-flex');if(header)mountClock(t,header);
      if(!node.querySelector('[data-plus="move"]')){
        const btn=document.createElement('button');btn.type='button';btn.className='btn btn-sm btn-soft sp-move-small ms-2';btn.dataset.plus='move';btn.dataset.id=id;
        btn.innerHTML=`<i class="bi bi-calendar-event me-1"></i>${tr('Move date','Đổi ngày')}`;
        node.querySelector('.text-end')?.prepend(btn);
      }
    });
    tickTaskClocks();
  }
  function clockState(t){
    if(!t?.t_start)return null;
    if(t.status==='done')return ['sp-finish',tr('Completed','Đã hoàn thành')];
    if(t.status==='skip')return ['sp-finish',tr('Skipped','Đã bỏ qua')];
    const [h,m]=String(t.t_start).split(':').map(Number), b=parseDate(t.date);b.setHours(h||0,m||0,0,0);
    const now=Date.now();if(now<b.getTime()){
      let seconds=Math.ceil((b.getTime()-now)/1000),days=Math.floor(seconds/86400);seconds%=86400;
      const hms=`${pa(Math.floor(seconds/3600))}:${pa(Math.floor((seconds%3600)/60))}:${pa(seconds%60)}`;
      return ['sp-soon',tr('Starts in ','Còn ')+(days?days+tr('d ',' ngày '):'')+hms];
    }
    let endTime=0;
    if(t.t_end){const [eh,em]=String(t.t_end).split(':').map(Number);const e=parseDate(t.date);e.setHours(eh||0,em||0,0,0);if(e<=b)e.setDate(e.getDate()+1);endTime=e.getTime()}
    else {const e=parseDate(t.date);e.setHours(23,59,59,999);endTime=e.getTime()}
    return now<endTime?['sp-live',tr('In progress now','Đang diễn ra')]:['sp-late',tr('Past scheduled time','Đã quá giờ')];
  }
  function tickTaskClocks(){
    document.querySelectorAll('.sp-activity[data-sp-clock]').forEach(el=>{
      const t=S.tasks.find(x=>String(x.id)===el.dataset.spClock);const state=clockState(t);
      if(!state){el.remove();return}
      el.className='sp-activity '+state[0];if(el.textContent!==state[1])el.textContent=state[1];
    });
  }
  const originalRender=window.render;
  function refreshCurrent(force){
    if(force)delete $p('#view')?.dataset.spPlusTab;
    window.render();
  }
  window.render=function(...args){
    hydrateUser();buildNav();
    const view=$p('#view');
    if(S.tab==='focus'||S.tab==='mood'){
      if(view.dataset.spPlusTab!==S.tab){
        originalRender.apply(this,args);
        view.dataset.spPlusTab=S.tab;
        view.innerHTML=S.tab==='focus'?focusView():moodView();
      } else head();
      buildNav();tickFocus();
    }else{
      delete view.dataset.spPlusTab;
      originalRender.apply(this,args);
      buildNav();decorateTasks();
    }
  };
  function saveMoodDraft(){
    if(!moodDraft?.mood){toast(tr('Please choose a mood','Hãy chọn cảm xúc của bạn'),'warning');return}
    const text=$p('#spMoodNote')?.value.trim()||'';
    void (async()=>{
      if(!await dialog(tr('Save your mood?','Xác nhận lưu cảm xúc?'),tr('Record how you felt today?','Lưu lại cảm xúc hôm nay?')))return;
      moods[moodDraft.date]={mood:moodDraft.mood,note:text};saveMood();refreshCurrent(true);
      toast(tr('Mood saved 🌷','Đã lưu cảm xúc 🌷'),'success');
    })();
  }
  async function stopRule(id){
    const rule=rules.find(x=>x.id===id);if(!rule)return;
    const question=rule.active?tr('Stop this schedule?','Dừng lịch lặp lại này?'):tr('Resume this schedule?','Tiếp tục lịch lặp lại?');
    const yes=await dialog(question,tr('Existing tasks will not be deleted.','Các công việc đã tạo sẽ không bị xóa.'));
    if(!yes)return;
    rule.active=!rule.active;saveRules();showRules();
    if(rule.active)queueGeneration();
  }
  // Use one delegated handler to survive existing view rerenders.
  document.addEventListener('click',async e=>{
    const el=e.target.closest('[data-plus]');if(!el)return;
    const a=el.dataset.plus,id=el.dataset.id;
    if(a==='rules'){showRules();return}
    if(a==='rules-close'){ $p('#spRulesModal')?.remove();return }
    if(a==='rule-toggle'){await stopRule(id);return}
    if(a==='move'){movePrompt(id);return}
    if(a==='move-cancel'){$p('#spMoveModal')?.remove();return}
    if(a==='move-apply'){
      const dt=$p('#spMoveDate')?.value;$p('#spMoveModal')?.remove();await changeDate(id,dt);return;
    }
    if(a==='mood-pick'){
      if(!moodDraft)return;
      moodDraft.mood=id;
      document.querySelectorAll('.sp-mood-choice').forEach(c=>c.classList.toggle('active',c.dataset.id===id));return;
    }
    if(a==='mood-save'){saveMoodDraft();return}
    if(a==='preset'){
      const n=Number(id);if(focus.running||focus.elapsed){
        if(!await dialog(tr('Reset this session?','Đặt lại phiên đang học?'),tr('Progress on the current timer will be cleared.','Tiến độ đồng hồ hiện tại sẽ được xóa.')))return;
      }
      focus.duration=n*60;focus.elapsed=0;focus.running=false;focus.startedAt=0;saveFocus();refreshCurrent(true);return;
    }
    if(a==='focus-toggle'){
      finishIfElapsed();if(focus.running){focus.elapsed=focusElapsed();focus.running=false;focus.startedAt=0}
      else{if(focus.elapsed>=focus.duration)focus.elapsed=0;focus.running=true;focus.startedAt=Date.now()}
      saveFocus();tickFocus();return;
    }
    if(a==='focus-reset'){
      if(focus.running||focus.elapsed){if(!await dialog(tr('Reset focus timer?','Đặt lại đồng hồ?'),tr('Unsaved progress will be cleared.','Tiến độ chưa hoàn thành sẽ bị xóa.')))return}
      focus.elapsed=0;focus.running=false;focus.startedAt=0;saveFocus();refreshCurrent(true);return;
    }
    if(a==='focus-finish'){
      if(!focusElapsed())return;
      if(!await dialog(tr('Finish this focus session?','Kết thúc phiên tập trung?'),tr('Record elapsed focus time and stop the timer?','Ghi nhận thời gian đã tập trung và dừng đồng hồ?')))return;
      const seconds=focusElapsed();focus.running=false;focus.elapsed=0;focus.startedAt=0;
      if(seconds>=60){focus.sessions.unshift({at:new Date().toISOString(),minutes:Math.max(1,Math.round(seconds/60)),taskId:focus.taskId});focus.sessions=focus.sessions.slice(0,400)}
      saveFocus();refreshCurrent(true);toast(tr('Focus time recorded','Đã ghi nhận thời gian tập trung'));return;
    }
  });
  document.addEventListener('change',e=>{
    if(e.target.id==='spFocusTask'){focus.taskId=e.target.value;saveFocus()}
  });
  // Pointer drag/drop: handle works with mouse or touch. On narrow screens,
  // the accessible 'change date' action remains available if scrolling is easier.
  let prepared=null,suppressClick=0;
  function dragTarget(x,y){return document.elementFromPoint(x,y)?.closest('[data-sp-dropdate]')||null}
  function cleanupDrag(){
    if(dragging?.target)dragging.target.classList.remove('sp-drag-over');
    dragging?.ghost?.remove();dragging=null;prepared=null;
  }
  document.addEventListener('pointerdown',e=>{
    const grip=e.target.closest('[data-sp-drag]');if(!grip||e.button!==0)return;
    const id=grip.dataset.spDrag,t=S.tasks.find(x=>String(x.id)===String(id));if(!t)return;
    prepared={id,x:e.clientX,y:e.clientY,pointer:e.pointerId,start:Date.now(),pointerType:e.pointerType,ready:e.pointerType!=='touch'};
  },true);
  document.addEventListener('pointermove',e=>{
    if(!prepared||e.pointerId!==prepared.pointer)return;
    const delta=Math.hypot(e.clientX-prepared.x,e.clientY-prepared.y);
    if(!dragging){
      if(prepared.pointerType==='touch'&&Date.now()-prepared.start<280){if(delta>12)prepared=null;return}
      if(delta<6&&prepared.pointerType!=='touch')return;
      const t=S.tasks.find(x=>String(x.id)===String(prepared.id));if(!t)return;
      const ghost=document.createElement('div');ghost.className='sp-drag-ghost';ghost.textContent=t.title;document.body.append(ghost);
      dragging={id:prepared.id,ghost,target:null};
    }
    if(e.cancelable)e.preventDefault();
    dragging.ghost.style.left=`${e.clientX}px`;dragging.ghost.style.top=`${e.clientY}px`;
    const target=dragTarget(e.clientX,e.clientY);
    if(target!==dragging.target){dragging.target?.classList.remove('sp-drag-over');dragging.target=target;target?.classList.add('sp-drag-over')}
  },{capture:true,passive:false});
  document.addEventListener('pointerup',e=>{
    if(!prepared||e.pointerId!==prepared.pointer)return;
    if(!dragging){prepared=null;return}
    const id=dragging.id,to=dragTarget(e.clientX,e.clientY)?.dataset.spDropdate;
    cleanupDrag();
    suppressClick=Date.now()+500;e.preventDefault();e.stopImmediatePropagation();
    if(to)void changeDate(id,to)
  },true);
  document.addEventListener('pointercancel',cleanupDrag,true);
  document.addEventListener('click',e=>{if(Date.now()<suppressClick&&e.target.closest('[data-sp-drag],[data-sp-dropdate]')){e.preventDefault();e.stopImmediatePropagation();suppressClick=0}},true);
  // Language changes are performed by the pre-existing add-on; re-render just
  // these new controls when its flag changes. Other user-entered data stay intact.
  document.addEventListener('click',e=>{
    if(!e.target.closest('.sp-flag'))return;
    queueMicrotask(()=>{
      TABS.focus=EXTRAS.focus[locale()];TABS.mood=EXTRAS.mood[locale()];
      // Preserve unfinished mood note while toggling the display language.
      if(S.tab==='mood'&&moodDraft&&$p('#spMoodNote'))moodDraft.note=$p('#spMoodNote').value;
      if(S.tab==='focus'||S.tab==='mood')refreshCurrent(true);
      buildNav();tickTaskClocks();updateMenuLabel();
      if($p('#spRepeat')&&S.m)renderRepeatForm(S.m);
    });
  });
  const updateExtras=()=>{
    if($p('#mDay')?.classList.contains('show'))decorateDay();
  };
  let pending=false;
  new MutationObserver(()=>{
    if(pending)return;pending=true;
    queueMicrotask(()=>{pending=false;updateExtras()});
  }).observe($p('#mDay'),{childList:true,subtree:true});
  // Run once every second WITHOUT rerendering the entire page.
  setInterval(()=>{if(!hydrateUser())return;finishIfElapsed();tickFocus();tickTaskClocks()},1000);
  hydrateUser();buildNav();
  if(S.user){refreshCurrent(true);queueGeneration()}
})();
