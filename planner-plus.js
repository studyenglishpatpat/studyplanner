/* STUDY PLANNER PLUS — optional add-on. Base tasks/auth/UI remain untouched.
   V8: Bootstrap task icon picker, synchronized through existing V7 Supabase taskstyles rows. */
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
  // Appearance is stored per task in a secure Supabase companion table.
  // Missing color/priority still means the exact original task appearance.
  const PALETTE = [
    ['rose','#D78FAB','Rose','Hồng'], ['coral','#D99588','Coral','San hô'],
    ['apricot','#DFA873','Apricot','Cam đào'], ['honey','#C7B16C','Honey','Vàng mật'],
    ['sage','#8DB89C','Sage','Xanh lá'], ['mint','#74B5AC','Mint','Xanh bạc hà'],
    ['sky','#84A9D2','Sky','Xanh trời'], ['lilac','#A396D3','Lilac','Tím nhạt'],
    ['orchid','#BF92BE','Orchid','Tím hồng']
  ];
  const PALETTE_MAP = new Map(PALETTE.map(([id,hex])=>[id,hex]));
  // Curated Bootstrap Icons 1.11.3 names (no icon upload, library or extra API).
  // Named groups keep the picker searchable while leaving the task form compact.
  const ICON_GROUPS = [
    {id:'study',en:'Study',vi:'Học tập',tags:'học bài sách bài tập ngoại ngữ trường học khóa học',names:`book book-fill book-half book-history bookmark bookmark-fill bookmark-check bookmark-star journal journal-bookmark journal-code journal-text journal-richtext mortarboard mortarboard-fill pencil pencil-fill pencil-square pen pen-fill highlighter eraser rulers backpack backpack-fill calculator type translate alphabet-uppercase clipboard clipboard-check clipboard2-check clipboard2-data file-earmark-text file-earmark-pdf file-earmark-spreadsheet file-earmark-code file-earmark-image folder folder2-open lightbulb lightbulb-fill award award-fill trophy trophy-fill patch-check patch-check-fill graph-up-arrow diagram-3 stack`.split(' ')},
    {id:'work',en:'Planning',vi:'Kế hoạch',tags:'việc cần làm lịch họp deadline thời gian nhắc nhở',names:`calendar calendar-check calendar-event calendar-week calendar2-week calendar2-check calendar-date calendar-range calendar3 clock clock-history alarm stopwatch hourglass hourglass-split check-circle check2-circle check2-square list-check list-task kanban columns-gap boxes inboxes archive flag flag-fill star star-fill sticky sticky-fill clipboard-data folder-check folder-plus file-check file-earmark-check pin pin-angle pin-angle-fill bell bell-fill megaphone chat-dots chat-square-text send envelope envelope-open printer download upload cloud-arrow-up cloud-check database table sort-down funnel filters`.split(' ')},
    {id:'creative',en:'Creative & Tech',vi:'Sáng tạo & Công nghệ',tags:'thiết kế code âm nhạc hình ảnh máy tính công nghệ',names:`palette brush brush-fill paint-bucket eyedropper camera camera-fill camera-video images image image-fill music-note music-note-beamed music-player headphones mic mic-fill film play-circle play-circle-fill pause-circle volume-up speaker vinyl disc boombox controller joystick code code-slash terminal terminal-fill braces bug git github cpu motherboard memory mouse keyboard laptop pc-display tablet phone wifi bluetooth robot lightning lightning-charge`.split(' ')},
    {id:'life',en:'Daily Life',vi:'Đời sống',tags:'gia đình nhà cửa mua sắm sinh hoạt du lịch đi chơi thời tiết',names:`house house-fill heart heart-fill gift gift-fill cake balloon cup-hot cup-hot-fill cup-straw basket bag bag-fill cart wallet credit-card cash piggy-bank coin currency-dollar bicycle car-front bus-front train-front airplane airplane-engines geo-alt geo-alt-fill map compass signpost suitcase umbrella umbrella-fill sun moon stars cloud-sun cloud-moon cloud-rain cloud-snow snow thermometer wind droplet water flower1 flower2 flower3 tree tree-fill recycle globe globe-americas`.split(' ')},
    {id:'wellness',en:'Health & Mood',vi:'Sức khỏe & Cảm xúc',tags:'chạy bộ thể dục thể thao tâm trạng sức khỏe ngủ nghỉ',names:`person person-fill people people-fill person-walking person-running person-arms-up activity heart-pulse heart-pulse-fill bandaid capsule prescription2 hospital h-square cross cross-circle fire speedometer yin-yang emoji-smile emoji-laughing emoji-frown emoji-heart-eyes emoji-sunglasses emoji-neutral emoji-wink emoji-smile-upside-down emoji-angry emoji-dizzy emoji-expressionless emoji-kiss emoji-tear emoji-surprise emoji-grimace emoji-smile-fill emoji-laughing-fill emoji-frown-fill`.split(' ')},
    {id:'symbols',en:'Symbols',vi:'Biểu tượng',tags:'ưu tiên mục tiêu dấu hiệu công cụ công việc',names:`arrow-repeat arrow-clockwise arrow-through-heart arrow-left-right arrow-up-right-circle plus-circle plus-circle-fill dash-circle x-circle question-circle info-circle exclamation-circle shield-check shield-fill-check lock unlock key gear gear-fill sliders toggles toggle-on toggle-off qr-code link-45deg paperclip bookmark-heart tags tags-fill magic gem diamond diamond-fill circle circle-fill square square-fill triangle triangle-fill hexagon hexagon-fill bullseye target`.split(' ')}
  ];
  const ICONS = [...new Set(ICON_GROUPS.flatMap(g=>g.names))];
  const ICON_SET = new Set(ICONS);
  const normalizeSearch = x => String(x||'').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const ICON_SEARCH_POOL = ICON_GROUPS.flatMap(g=>g.names.map(name=>({name,groupId:g.id,groupLabel:`${g.en} ${g.vi}`,search:normalizeSearch([name,g.tags,g.en,g.vi,name.replace(/-/g,' ')].join(' '))})));
  const TODAY_BG_ICONS = ['stars','bookmark-heart','book','journal-bookmark','palette','lightbulb','calendar-event','pencil-square','balloon-heart','heart','flower1','flower2','gem','cloud-sun','moon-stars'];
  // Validation is intentional: never interpolate arbitrary cloud-stored text as a CSS class.
  const cleanStyle = v => ({color:PALETTE_MAP.has(v?.color)?v.color:'',priority:!!v?.priority,icon:ICON_SET.has(v?.icon)?v.icon:''});
  let taskStyles={}, styleDraft={color:'',priority:false,icon:''}, preservedStyleDraft=null, pendingStyleSave=null;
  let iconPickerGroup='all',iconPickerQuery='',iconPickerReturnFocus=null;
  function saveTaskStyles(id){put('taskstyles',taskStyles);if(id!=null)stageCloud('taskstyles',String(id),cleanStyle(taskStyles[String(id)]))}
  function styleFor(id){return cleanStyle(taskStyles[String(id)])}
  function setStyle(id,appearance){
    if(id==null)return;
    const cfg=cleanStyle(appearance);
    if(cfg.color||cfg.priority||cfg.icon)taskStyles[String(id)]=cfg;
    else delete taskStyles[String(id)];
    saveTaskStyles(id);
  }

  let currentUser=null, generating=false, generateQueued=false, dragging=null;
  const defaultFocus = () => ({duration:1500,elapsed:0,running:false,startedAt:0,taskId:'',sessions:[]});
  function hydrateUser() {
    if (!S.user) return false;
    if (currentUser !== S.user.id) {
      currentUser=S.user.id; rules=get('rules',[]); moods=get('moods',{});focus={...defaultFocus(),...get('focus',defaultFocus())}; taskStyles=get('taskstyles',{});
      resetCloudState();
      queueMicrotask(()=>{ if(S.user?.id===currentUser) void initializeCloud(); });
    }
    return true;
  }
  function saveRules(rule){put('rules',rules);if(rule)stageCloud('rules',String(rule.id),rule)}
  function saveMood(date){put('moods',moods);if(date)stageCloud('moods',date,moods[date])}
  function saveFocus(){put('focus',focus);stageCloud('focus','current',focus)}
  /* Cloud Sync V7: secure per-user records rather than overwriting one large
     JSON object. Local storage is a backup/migration source, not source of truth.
     No service role key is ever shipped to the browser. */
  const CLOUD_TABLE='sp_sync_items';
  let cloudReady=false,cloudLoading=false,cloudErrorShown=false,cloudWriteTimer=null;
  let cloudFlushing=false,cloudPulling=false,lastPull=0,lastTaskPull=0;
  const cloudPending=new Map();
  const cloudKey=(category,key)=>`${category}\u0000${key}`;
  function cloneData(x){return JSON.parse(JSON.stringify(x))}
  function resetCloudState(){
    cloudReady=false;cloudLoading=false;cloudErrorShown=false;lastPull=0;lastTaskPull=0;
    cloudPending.clear();
    if(cloudWriteTimer){clearTimeout(cloudWriteTimer);cloudWriteTimer=null}
  }
  function stageCloud(category,key,payload){
    if(!S.user)return;
    const row={user_id:S.user.id,category,item_key:String(key),payload:cloneData(payload||{})};
    cloudPending.set(cloudKey(category,row.item_key),row);
    if(cloudReady)planCloudFlush();
  }
  function planCloudFlush(){
    if(cloudWriteTimer)return;
    cloudWriteTimer=setTimeout(()=>{cloudWriteTimer=null;void flushCloud()},140);
  }
  async function flushCloud(){
    if(!cloudReady||cloudFlushing||!cloudPending.size||!S.user)return;
    cloudFlushing=true;
    try{
      const rows=[...cloudPending.values()].slice(0,100);
      const {error}=await sb.from(CLOUD_TABLE).upsert(rows,{onConflict:'user_id,category,item_key'});
      if(error)throw error;
      for(const row of rows){
        const key=cloudKey(row.category,row.item_key);
        if(cloudPending.get(key)===row)cloudPending.delete(key);
      }
      if(cloudPending.size)planCloudFlush();
    }catch(err){
      console.warn('[Study Planner] Cloud write:',err);
      if(!cloudErrorShown){cloudErrorShown=true;toast(tr('Cloud save failed. Changes are kept in this browser; check connection/SQL.','Không lưu được lên đám mây. Dữ liệu vẫn còn trên máy; kiểm tra mạng/SQL.'),'warning',{delay:10000})}
    }finally{cloudFlushing=false}
  }
  async function allCloudRows(){
    const result=[];
    for(let start=0;start<100000;start+=500){
      const {data,error}=await sb.from(CLOUD_TABLE).select('category,item_key,payload')
        .eq('user_id',S.user.id).in('category',['rules','moods','focus','taskstyles'])
        .order('category').order('item_key').range(start,start+499);
      if(error)throw error;
      result.push(...(data||[]));if(!data||data.length<500)break;
    }
    return result;
  }
  // Import pre-V7 local preferences only once per browser/account, never
  // overwriting an existing cloud row. Keep original localStorage as backup.
  async function importOldLocalData(){
    const flag=`studyplanner_cloud_v7_imported_${S.user.id}`;
    if(localStorage.getItem(flag)==='yes')return;
    const rows=[];const user_id=S.user.id;
    const push=(category,key,value)=>rows.push({user_id,category,item_key:String(key),payload:cloneData(value)});
    for(const rule of get('rules',[]))if(rule?.id)push('rules',rule.id,rule);
    for(const [date,value] of Object.entries(get('moods',{})))if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&value)push('moods',date,value);
    const f=get('focus',null);if(f)push('focus','current',f);
    for(const [id,value] of Object.entries(get('taskstyles',{})))if(value)push('taskstyles',id,cleanStyle(value));
    for(let i=0;i<rows.length;i+=100){
      const {error}=await sb.from(CLOUD_TABLE).upsert(rows.slice(i,i+100),{
        onConflict:'user_id,category,item_key',ignoreDuplicates:true
      });
      if(error)throw error;
    }
    localStorage.setItem(flag,'yes');
  }
  function applyCloudRows(rows){
    const serverRules=[],serverMoods={},serverStyles={};let serverFocus=null;
    for(const row of rows){
      if(row.category==='rules'&&row.payload?.id)serverRules.push(row.payload);
      if(row.category==='moods')serverMoods[row.item_key]=row.payload;
      if(row.category==='taskstyles'){
        const style=cleanStyle(row.payload);
        if(style.color||style.priority||style.icon)serverStyles[row.item_key]=style;
      }
      if(row.category==='focus'&&row.item_key==='current')serverFocus=row.payload;
    }
    // Never wipe an unsent local edit if a poll races with a save.
    for(const row of cloudPending.values()){
      if(row.category==='rules'){
        const i=serverRules.findIndex(r=>r.id===row.item_key);
        if(i>=0)serverRules[i]=row.payload;else serverRules.push(row.payload);
      }
      if(row.category==='moods')serverMoods[row.item_key]=row.payload;
      if(row.category==='focus')serverFocus=row.payload;
      if(row.category==='taskstyles'){
        const style=cleanStyle(row.payload);
        if(style.color||style.priority||style.icon)serverStyles[row.item_key]=style;
        else delete serverStyles[row.item_key];
      }
    }
    const previous=JSON.stringify([rules,moods,focus,taskStyles]);
    rules=serverRules;moods=serverMoods;focus={...defaultFocus(),...(serverFocus||{})};taskStyles=serverStyles;
    put('rules',rules);put('moods',moods);put('focus',focus);put('taskstyles',taskStyles);
    return previous!==JSON.stringify([rules,moods,focus,taskStyles]);
  }
  async function initializeCloud(){
    if(cloudReady||cloudLoading||!S.user)return;
    cloudLoading=true;const user=S.user.id;
    try{
      await importOldLocalData();
      if(!S.user||S.user.id!==user)return;
      const changed=applyCloudRows(await allCloudRows());
      cloudReady=true;lastPull=Date.now();cloudErrorShown=false;
      planCloudFlush();queueGeneration();
      if(changed&&S.tab!=='focus'&&!document.querySelector('.modal.show'))refreshCurrent(true);
      else if(changed&&['focus','mood'].includes(S.tab))refreshCurrent(true);
      console.info('[Study Planner] Cloud Sync ready');
    }catch(err){
      console.warn('[Study Planner] Cloud initialization:',err);
      if(!cloudErrorShown){cloudErrorShown=true;toast(tr('Cloud Sync is not active. Run SQL_SETUP_V7.sql in Supabase first.','Chưa bật đồng bộ. Hãy chạy SQL_SETUP_V7.sql trong Supabase trước.'),'warning',{delay:11000})}
    }finally{cloudLoading=false}
  }
  async function pullCloud(){
    if(!S.user||!cloudReady||cloudPulling||cloudLoading||cloudFlushing||document.hidden)return;
    if(document.querySelector('.modal.show')||document.getElementById('spRulesModal'))return;
    const active=document.activeElement;
    if(active?.matches?.('input,textarea,[contenteditable]'))return;
    cloudPulling=true;
    try{
      const changed=applyCloudRows(await allCloudRows());
      lastPull=Date.now();
      // Ordinary tasks already use Supabase. Poll only to pick up changes from
      // other devices; never destroy the currently edited form or scroll state.
      let tasksChanged=false;
      if(Date.now()-lastTaskPull>18000){
        const old=JSON.stringify(S.tasks);await baseLoad();
        tasksChanged=JSON.stringify(S.tasks)!==old;lastTaskPull=Date.now();
      }
      if(changed||tasksChanged){
        if(S.tab==='mood'&&moodDraft?.date===asIso(new Date())&&
           $p('#spMoodNote')?.value!==moodDraft.note){
          // Don't erase unsaved user text while a background refresh is running.
          moodDraft.note=$p('#spMoodNote').value;
          return;
        }
        refreshCurrent(true);
      }
      if(cloudPending.size)planCloudFlush();
    }catch(err){console.warn('[Study Planner] Background sync:',err)}
    finally{cloudPulling=false}
  }
  // Periodic synchronization works without enabling Realtime replication.
  // On returning to the tab, refresh sooner if enough time has elapsed.
  setInterval(()=>{
    if(!S.user)return;
    if(!cloudReady){if(!cloudLoading)void initializeCloud();return}
    if(Date.now()-lastPull>22000)void pullCloud();
    if(cloudPending.size&&!cloudFlushing)planCloudFlush();
  },12000);
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&cloudReady&&Date.now()-lastPull>5000)void pullCloud();
  });
  // Desktop alerts require HTTPS/localhost, a user-granted permission and OS
  // notifications enabled. They are NOT push: keep this page open for reminders.
  // A small, notification-only service worker is attempted first. Unlike the
  // legacy Notification constructor, showNotification works across more devices.
  // Its scope is isolated so it never intercepts the planner's requests/pages.
  let workerPromise=null;
  function notificationWorker(){
    if(!('serviceWorker' in navigator)||!window.isSecureContext)return Promise.resolve(null);
    if(!workerPromise)workerPromise=navigator.serviceWorker.register('./sp-notify-sw.js',{scope:'./sp-notify-only/'})
      .then(reg=>reg).catch(err=>{console.warn('[Study Planner] Notification worker unavailable:',err);return null});
    return workerPromise;
  }
  async function nativeAlert(title,body,tag){
    if(!window.isSecureContext||!('Notification' in window)||Notification.permission!=='granted')return false;
    const opts={body:String(body||''),icon:'favicon.png',tag:tag||undefined};
    try{
      const reg=await notificationWorker();
      if(reg&&typeof reg.showNotification==='function'){
        await reg.showNotification(String(title),opts);return true;
      }
    }catch(err){console.warn('[Study Planner] Worker alert failed:',err)}
    try{
      const n=new Notification(String(title),opts);
      n.onclick=()=>{window.focus();n.close()};return true;
    }catch(err){console.warn('[Study Planner] Device alert unavailable:',err);return false}
  }
  function notificationIssue(){
    if(!window.isSecureContext)return tr('Open your website via HTTPS (or localhost).','Hãy mở web qua HTTPS (hoặc localhost).');
    if(!('Notification' in window))return tr('This browser does not support system notifications.','Trình duyệt này không hỗ trợ thông báo hệ thống.');
    if(Notification.permission==='denied')return tr('Notifications are blocked. Allow them in the browser site settings.','Trình duyệt đang chặn thông báo. Hãy cho phép trong cài đặt trang web.');
    if(Notification.permission!=='granted')return tr('Please allow notifications for this website.','Hãy cho phép thông báo cho trang web này.');
    return '';
  }
  async function requestNativeAlerts(){
    const issue=notificationIssue();
    if(issue&&(!window.isSecureContext||!('Notification' in window)||Notification.permission==='denied')){
      toast(issue,'warning',{delay:9000});return;
    }
    try{
      // Only request permission as part of a real button click.
      const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
      if(permission!=='granted'){
        toast(notificationIssue()||tr('Notification permission was not granted.','Chưa cấp quyền thông báo.'),'warning',{delay:9000});return;
      }
      const ok=await nativeAlert(tr('Study Planner – test notification 🔔','Study Planner – thông báo thử 🔔'),
        tr('If you can see this on your desktop, reminders are ready.','Nếu bạn thấy thông báo trên màn hình, chức năng nhắc nhở đã sẵn sàng.'),
        'sp-permission-test');
      toast(ok?tr('Test notification sent. Check Windows notifications.','Đã gửi thông báo thử. Hãy xem khu vực thông báo Windows.'):
        tr('The browser could not display a notification. Check site and Windows notification settings.','Trình duyệt chưa hiển thị được thông báo. Hãy kiểm tra quyền của trang và cài đặt Windows.'),ok?'success':'warning',{delay:9000});
      if(S.tab==='focus')refreshCurrent(true);
    }catch(err){console.warn('[Study Planner] Notification permission:',err);
      toast(tr('Could not enable notifications. Check your browser settings.','Không bật được thông báo. Hãy kiểm tra cài đặt trình duyệt.'),'warning',{delay:9000})}
  }
  function testNativeAlerts(){
    if(notificationIssue()){toast(notificationIssue(),'warning',{delay:9000});return}
    void nativeAlert(tr('Study Planner – test notification 🔔','Study Planner – thông báo thử 🔔'),
      tr('This is a test notification from your study planner.','Đây là thông báo thử từ lịch học cá nhân.'),'sp-manual-test-'+Date.now())
      .then(ok=>toast(ok?tr('Test notification sent.','Đã gửi thông báo thử.'):
        tr('Could not send the test. Check Windows/Chrome notifications.','Không gửi được thông báo. Hãy kiểm tra thông báo Windows/Chrome.'),ok?'success':'warning'));
  }
  // V6: gentle, harmonic chimes composed with Web Audio (no downloads or paid API).
  // The start is a bright ascending four-note motif; the finish plays a longer
  // resolving phrase twice. Audio output is subject to device/browser volume.
  let focusAudio=null;
  function focusChime(kind){
    try{
      const Context=window.AudioContext||window.webkitAudioContext;
      if(!Context)return;
      if(!focusAudio)focusAudio=new Context();
      if(focusAudio.state==='suspended')void focusAudio.resume().catch(()=>{});
      const ctx=focusAudio, start=ctx.currentTime+.045, ending=kind==='finish';
      const compressor=ctx.createDynamicsCompressor();
      compressor.threshold.value=-16;compressor.knee.value=18;
      compressor.ratio.value=3;compressor.attack.value=.006;compressor.release.value=.24;
      compressor.connect(ctx.destination);
      const bell=(frequency,at,duration,level=.18)=>{
        // Rich bell-like overtones with separate envelopes, never distorted square waves.
        [1,2,3].forEach((harmonic,index)=>{
          const osc=ctx.createOscillator(),gain=ctx.createGain();
          osc.type=index===0?'sine':'triangle';
          osc.frequency.setValueAtTime(frequency*harmonic,at);
          const amp=level*[1,.21,.07][index];
          const attack=.025,release=Math.min(duration-.04,index===0?.42:.22);
          gain.gain.setValueAtTime(.0001,at);
          gain.gain.exponentialRampToValueAtTime(amp,at+attack);
          gain.gain.exponentialRampToValueAtTime(amp*.48,at+Math.max(attack+.03,duration-release));
          gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
          osc.connect(gain);gain.connect(compressor);
          osc.start(at);osc.stop(at+duration+.02);
        });
      };
      if(ending){
        const melody=[783.99,659.25,523.25,659.25,587.33,523.25];
        for(let round=0;round<2;round++){
          melody.forEach((hz,i)=>bell(hz,start+round*2.75+i*.42,i===5?.83:.56,i===5?.20:.145));
        }
        // Closing soft major chord makes the end distinguishable from the start.
        [523.25,659.25,783.99].forEach((hz,i)=>bell(hz,start+5.46+i*.045,1.18,.11));
      }else{
        [523.25,659.25,783.99,1046.5].forEach((hz,i)=>bell(hz,start+i*.24,i===3?.73:.42,i===3?.19:.15));
      }
    }catch(err){console.warn('[Study Planner] Focus chime unavailable:',err)}
  }
  // Original check() already posts desktop reminders at task start / 5 min before.
  // Extend only the other important in-app reminders, avoiding duplicate popups.
  if(typeof window.notify==='function'){
    const originalNotify=window.notify;
    window.notify=function(message,type='info',options={}){
      const result=originalNotify.call(this,message,type,options);
      const title=String(options?.title||'');
      const isOriginalAlarm=/^Đến giờ học rồi!|^Còn \d+ phút nữa/u.test(title);
      const useful=(type==='warning'||type==='danger'||type==='reminder'||(type==='info'&&title==='Việc kế tiếp hôm nay'));
      if(useful&&!isOriginalAlarm&&!options?.desktopSkip)
        nativeAlert(title||tr('Study Planner reminder','Nhắc nhở Study Planner'),message,'sp-event-'+type+'-'+title);
      return result;
    };
  }
  function checkSessionEnds(){
    if(!S.user)return;
    const now=Date.now(),today=asIso(new Date());
    for(const t of S.tasks){
      if(t.date!==today||!t.t_end||!['todo','doing'].includes(t.status))continue;
      const hhmm=String(t.t_end).split(':').map(Number);
      if(hhmm.length<2||!hhmm.every(Number.isFinite))continue;
      const start=parseDate(t.date);start.setHours(hhmm[0],hhmm[1],0,0);
      const ended=start.getTime();
      if(now<ended||now-ended>10*60*1000)continue;
      const key=`plus:end:${t.id}:${t.date}:${t.t_end}`;
      dayRoll();if(S.fired.has(key))continue;
      S.fired.add(key);saveLog();
      const title=tr('Scheduled time finished ⏰','Đã hết giờ theo lịch ⏰');
      notify(`${t.title} (${t.t_end})`,'reminder',{title,desktopSkip:true});
      nativeAlert(title,t.title,'sp-task-end-'+t.id+'-'+t.date);
    }
  }
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
    if (!hydrateUser() || !cloudReady || generating || !rules.some(r=>r.active)) return;
    generating=true;
    try {
      const today=asIso(new Date());
      let created=0;
      for (const rule of rules) {
        if (!rule.active) continue;
        const start=rule.start>today?rule.start:today;
        const horizon=asIso(shift(parseDate(start),55));
        if (rule.until && start>rule.until) continue;
        // Reconcile prior occurrences from Supabase before generating new ones.
        const {data:existing,error:existingError}=await sb.from('tasks').select('id,date').eq('sp_repeat_rule_id',rule.id);
        if(existingError)throw existingError;
        rule.generated=rule.generated||{};
        for(const t of existing||[])rule.generated[t.date]=t.id;
        const rows=[], days=[];
        for (let dt=parseDate(start);asIso(dt)<=horizon;dt=shift(dt,1)) {
          const d=asIso(dt);
          if (!applies(rule,d) || Object.prototype.hasOwnProperty.call(rule.generated||{},d)) continue;
          days.push(d); rows.push({title:rule.title,subject:rule.subject,date:d,t_start:rule.t_start||null,t_end:rule.t_end||null,note:rule.note||'',status:'todo',sp_repeat_rule_id:rule.id});
          if (rows.length>=60) break;
        }
        // Each day is persisted as an ordinary task, so the existing calendar,
        // checklist, statistics and backups continue to work without new SQL.
        if (rows.length) {
          // A UNIQUE index on (sp_repeat_rule_id,date) ensures exactly one
          // task per recurrence/day even if two devices generate together.
          const {data,error}=await sb.from('tasks').upsert(rows,{
            onConflict:'sp_repeat_rule_id,date',ignoreDuplicates:true
          }).select('id,date');
          if (error) throw error;
          rule.generated=rule.generated||{};
          for(const row of data||[]){
            rule.generated[row.date]=row.id;
            if(rule.appearance)setStyle(row.id,rule.appearance);
          }
          saveRules(rule); created+=(data||[]).length;
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
    if(hydrateUser()){
      // Only commit appearance after a successful task reload. The original
      // save/confirmation handlers still own the database transaction.
      if(pendingStyleSave && Date.now()-pendingStyleSave.at<30000){
        const p=pendingStyleSave;
        const match=t=>t&&t.title===p.form.title&&t.date===p.form.date&&
          (t.t_start||'')===(p.form.t_start||'');
        const record=p.id ? S.tasks.find(t=>String(t.id)===String(p.id)) :
          S.tasks.find(t=>!p.known.has(String(t.id))&&match(t));
        if(record&&match(record)){setStyle(record.id,p.appearance);pendingStyleSave=null}
      }else pendingStyleSave=null;
      if(rules.some(x=>x.active))queueGeneration();
    }
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
    // On phones, show ONLY Statistics in the drawer. The Manage control
    // stays on the original desktop header, exactly as before.
    list.querySelector('[data-plus-hn="manage"]')?.remove();
    for (const [id,icon,en,vi] of [
      ['stats','bar-chart-line-fill','Statistics','Thống kê']
    ]) {
      let item=list.querySelector(`[data-plus-hn="${id}"]`);
      if(!item){
        item=document.createElement('button');item.type='button';
        item.className='nav-link sp-mobile-only sp-mobile-destination';
        item.dataset.plusHn=id;list.append(item);
      }
      item.innerHTML=`<i class="bi bi-${icon}"></i><span>${tr(en,vi)}</span>`;
      item.classList.toggle('active',S.tab==='stats');
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
    const dest=e.target.closest('[data-plus-hn]');
    if(dest){
      e.preventDefault();e.stopImmediatePropagation();
      S.tab=dest.dataset.plusHn==='stats'?'stats':(S.last==='stats'?'today':S.last);
      toggleMenu(false);refreshCurrent(true);window.scrollTo(0,0);return;
    }
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
    renderStyleForm(m);
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
  function renderStyleForm(task){
    const existing=task?.id?styleFor(task.id):{color:'',priority:false,icon:''};
    styleDraft=preservedStyleDraft&&S.draft===task?{...preservedStyleDraft}:{...existing};
    preservedStyleDraft=null;
    let panel=$p('#spTaskStyle');
    if(!panel){panel=document.createElement('section');panel.id='spTaskStyle';panel.className='sp-task-style';}
    // Place appearance LAST, after recurrence controls and all original task fields.
    $p('#mTask .modal-body')?.append(panel);
    const buttons=[['',null,tr('Default','Mặc định')],...PALETTE.map(([id,hex,en,vi])=>[id,hex,tr(en,vi)])];
    panel.innerHTML=`<div class="sp-task-style-heading"><i class="bi bi-palette me-1"></i>${tr('Task color','Màu công việc')} <small>${tr('(optional)','(không bắt buộc)')}</small></div>
      <div class="sp-color-options" role="group" aria-label="${tr('Task color options','Các màu công việc')}">
      ${buttons.map(([id,hex,name])=>`<button type="button" class="sp-color-option ${id?'':'sp-color-default'} ${styleDraft.color===id?'selected':''}" style="${hex?'--sp-swatch:'+hex+';':''}" data-plus="style-color" data-id="${id}" aria-pressed="${styleDraft.color===id}" aria-label="${safe(name)}" title="${safe(name)}"><i class="bi bi-check-lg"></i></button>`).join('')}</div>
      <div class="sp-task-quick-actions">
        <button type="button" id="spPriorityToggle" class="sp-priority-toggle ${styleDraft.priority?'selected':''}" data-plus="style-priority" aria-pressed="${styleDraft.priority}"><i class="bi bi-${styleDraft.priority?'star-fill':'star'}"></i><span>${tr('Priority','Ưu tiên')}</span></button>
        <button type="button" id="spIconToggle" class="sp-icon-toggle ${styleDraft.icon?'selected':''}" data-plus="icon-open" aria-haspopup="dialog" title="${tr('Choose a Bootstrap icon for this task','Chọn biểu tượng Bootstrap cho công việc')}"><i class="bi bi-${styleDraft.icon||'grid-3x3-gap'} sp-icon-preview"></i><span>${tr('Task icon','Biểu tượng')}</span><i class="bi bi-chevron-down sp-icon-chevron"></i></button>
      </div>`;
  }
  function refreshStyleForm(){
    $p('#spTaskStyle')?.querySelectorAll('[data-plus="style-color"]').forEach(b=>{
      const selected=b.dataset.id===styleDraft.color;
      b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));
    });
    const star=$p('#spPriorityToggle');if(star){
      star.classList.toggle('selected',styleDraft.priority);
      star.setAttribute('aria-pressed',String(styleDraft.priority));
      star.querySelector('i').className='bi bi-'+(styleDraft.priority?'star-fill':'star');
    }
    const iconBtn=$p('#spIconToggle');if(iconBtn){
      iconBtn.classList.toggle('selected',!!styleDraft.icon);
      iconBtn.querySelector('.sp-icon-preview').className='bi bi-'+(styleDraft.icon||'grid-3x3-gap')+' sp-icon-preview';
      iconBtn.setAttribute('aria-label',styleDraft.icon?tr('Selected icon: ','Biểu tượng đã chọn: ')+styleDraft.icon:tr('Choose task icon','Chọn biểu tượng'));
    }
  }
  // Picker lives in an overlay so the Add/Edit form gains no additional height.
  // The selection changes the form draft only; the existing Save + confirmation
  // flow performs the actual Supabase write through the V7 taskstyles category.
  function closeIconPicker(){
    $p('#spIconPicker')?.remove();
    if(iconPickerReturnFocus?.isConnected)iconPickerReturnFocus.focus({preventScroll:true});
    iconPickerReturnFocus=null;
  }
  function iconPickerTiles(){
    const box=$p('#spIconResults'),count=$p('#spIconCount');if(!box)return;
    const words=normalizeSearch(iconPickerQuery);
    const matches=ICON_SEARCH_POOL
      .filter(x=>iconPickerGroup==='all'||x.groupId===iconPickerGroup)
      .filter(x=>!words||x.search.includes(words));
    if(count)count.textContent=(locale()==='vi'?`${matches.length} / ${ICONS.length} biểu tượng`:`${matches.length} / ${ICONS.length} icons`);
    box.innerHTML=matches.length?matches.map(x=>`<button type="button" class="sp-icon-tile ${x.name===styleDraft.icon?'selected':''}" data-plus="icon-select" data-id="${x.name}" aria-pressed="${x.name===styleDraft.icon}" aria-label="${x.name.replace(/-/g,' ')}" title="${x.name.replace(/-/g,' ')}"><i class="bi bi-${x.name}" aria-hidden="true"></i><span>${x.name.replace(/-/g,' ')}</span></button>`).join('')
      :`<p class="sp-icon-empty">${tr('No matching icons. Try another keyword.','Không tìm thấy biểu tượng. Hãy thử từ khóa khác.')}</p>`;
    $p('#spIconCategories')?.querySelectorAll('button').forEach(b=>{
      b.classList.toggle('active',b.dataset.id===iconPickerGroup);
      b.setAttribute('aria-pressed',String(b.dataset.id===iconPickerGroup));
    });
  }
  function openIconPicker(){
    if(!$p('#spTaskStyle'))return;
    closeIconPicker();iconPickerReturnFocus=$p('#spIconToggle');
    iconPickerGroup='all';iconPickerQuery='';
    const overlay=document.createElement('div');overlay.id='spIconPicker';overlay.className='sp-icon-overlay';
    overlay.innerHTML=`<section class="sp-icon-dialog" role="dialog" aria-modal="true" aria-labelledby="spIconPickerTitle">
      <div class="sp-icon-header"><div><h5 id="spIconPickerTitle"><i class="bi bi-grid-3x3-gap me-2"></i>${tr('Choose a task icon','Chọn biểu tượng công việc')}</h5><small>${tr('Bootstrap Icons · synced to your account','Bootstrap Icons · đồng bộ theo tài khoản')}</small></div><button type="button" class="sp-icon-close" data-plus="icon-close" aria-label="${tr('Close','Đóng')}"><i class="bi bi-x-lg"></i></button></div>
      <label class="sp-icon-search"><i class="bi bi-search"></i><input id="spIconSearch" type="search" autocomplete="off" placeholder="${tr('Search e.g. book, heart, music…','Tìm sách, trái tim, âm nhạc…')}" aria-label="${tr('Search icons','Tìm biểu tượng')}"></label>
      <div id="spIconCategories" class="sp-icon-categories" role="group" aria-label="${tr('Icon categories','Nhóm biểu tượng')}">
        ${[{id:'all',en:'All',vi:'Tất cả'},...ICON_GROUPS].map(g=>`<button type="button" data-plus="icon-category" data-id="${g.id}" aria-pressed="${g.id==='all'}">${locale()==='vi'?g.vi:g.en}</button>`).join('')}
      </div>
      <div class="sp-icon-count" id="spIconCount"></div>
      <div class="sp-icon-results" id="spIconResults" role="group" aria-label="${tr('Available icons','Biểu tượng có sẵn')}"></div>
      <div class="sp-icon-footer"><button type="button" class="btn btn-soft btn-sm" data-plus="icon-clear"><i class="bi bi-slash-circle me-1"></i>${tr('No icon','Không dùng icon')}</button><button type="button" class="btn btn-main btn-sm" data-plus="icon-close">${tr('Done','Xong')}</button></div>
    </section>`;
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeIconPicker()});
    document.body.append(overlay);
    const input=$p('#spIconSearch');
    const syncSearch=()=>{iconPickerQuery=input?.value||'';iconPickerTiles();};
    ['input','search','change','keyup','compositionend'].forEach(type=>input?.addEventListener(type,syncSearch));
    input?.addEventListener('keydown',ev=>ev.stopPropagation());
    iconPickerTiles();input?.focus();
  }
  document.addEventListener('input',e=>{
    if(e.target?.id==='spIconSearch'){iconPickerQuery=e.target.value;iconPickerTiles()}
  });
  document.addEventListener('search',e=>{
    if(e.target?.id==='spIconSearch'){iconPickerQuery=e.target.value;iconPickerTiles()}
  },true);
  document.addEventListener('keydown',e=>{
    if(!$p('#spIconPicker'))return;
    if(e.key==='Escape'){e.stopPropagation();e.preventDefault();closeIconPicker()}
    if(e.key==='Tab'){
      const elements=[...document.querySelectorAll('#spIconPicker button:not(:disabled),#spIconPicker input:not(:disabled)')]
        .filter(b=>b.getClientRects().length);
      const first=elements[0],last=elements.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
    }
  },true);
  $p('#mTask')?.addEventListener('hidden.bs.modal',closeIconPicker);
  // Capture only an approved Save click; enhancements.js owns confirmation.
  // This also covers repeated tasks, which the Plus handler saves separately.
  document.addEventListener('click',e=>{
    const save=e.target.closest('[data-act="save"]');if(!save||!S.m)return;
    const form=readForm();if(!form.title||!form.date)return;
    pendingStyleSave={at:Date.now(),id:form.id||null,form,
      appearance:cleanStyle(styleDraft),known:new Set(S.tasks.map(t=>String(t.id)))};
  },true);
  // Keep appearance choices when temporarily opening the subject-group editor.
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-act="subs"][data-from="task"]'))preservedStyleDraft={...styleDraft};
  },true);
  function repeatChoice(){
    const kind=$p('#spRepeatKind')?.value;
    if(!kind||kind==='none')return null;
    return {kind,days:[...document.querySelectorAll('#spRepeatDays input:checked')].map(x=>+x.value),until:$p('#spRepeatUntil')?.value||''};
  }
  async function saveWithRecurrence() {
    if(!cloudReady){toast(tr('Cloud Sync is not ready. Please apply the SQL migration and reload.','Chưa kết nối đồng bộ. Hãy chạy SQL rồi tải lại trang.'),'warning');return true}
    const choice=repeatChoice();if(!choice)return false;
    const t=readForm();
    if(!t.title||!t.date)return false;
    if(choice.kind==='weekly'&&!choice.days.length){toast(tr('Choose at least one weekday','Hãy chọn ít nhất một thứ'),'warning');return true}
    if(choice.until&&choice.until<t.date){toast(tr('End date must be after the start date','Ngày kết thúc phải sau ngày bắt đầu'),'warning');return true}
    const {id,...fields}=t;
    const ruleId='repeat_'+Date.now()+'_'+Math.random().toString(36).slice(2,12);
    fields.sp_repeat_rule_id=ruleId;
    let baseId=id;
    try {
      let result;
      if(id){result=await sb.from('tasks').update(fields).eq('id',id).select('id').single()}
      else result=await sb.from('tasks').insert(fields).select('id').single();
      if(result.error)throw result.error;
      baseId=result.data?.id||id;
      setStyle(baseId,cleanStyle(styleDraft));
      pendingStyleSave=null;
      const rule={id:ruleId,...fields,start:t.date,kind:choice.kind,days:choice.days,until:choice.until,active:true,appearance:cleanStyle(styleDraft),generated:{[t.date]:baseId}};
      rules.push(rule);saveRules(rule);
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
    focusChime('finish');
    void nativeAlert(tr('Focus timer finished ⏰','Đồng hồ tập trung đã hết giờ ⏰'),
      tr('Your focus session is complete. Great work!','Bạn đã hoàn thành phiên tập trung. Giỏi lắm!'),
      'sp-focus-finished-'+Date.now());
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
    <div class="sp-focus-custom"><span class="sp-plus-mut sp-custom-title">${tr('Set any duration','Tự đặt thời lượng')}</span>
      <div class="sp-custom-fields"><label for="spFocusHours">${tr('Hours','Giờ')}<input id="spFocusHours" type="number" inputmode="numeric" min="0" max="23" step="1" value="${Math.floor(focus.duration/3600)}"></label>
      <label for="spFocusMinutes">${tr('Minutes','Phút')}<input id="spFocusMinutes" type="number" inputmode="numeric" min="0" max="59" step="1" value="${Math.floor(focus.duration%3600/60)}"></label>
      <label for="spFocusSeconds">${tr('Seconds','Giây')}<input id="spFocusSeconds" type="number" inputmode="numeric" min="0" max="59" step="1" value="${focus.duration%60}"></label></div>
      <button type="button" class="btn btn-soft sp-apply-duration" data-plus="custom-duration">${tr('Set time','Áp dụng')}</button>
    </div>
    <div class="sp-focus-controls"><button class="btn btn-main px-4" data-plus="focus-toggle" id="spFocusToggle">${focus.running?tr('Pause','Tạm dừng'):focus.elapsed?tr('Resume','Tiếp tục'):tr('Start focus','Bắt đầu')}</button><button class="btn btn-soft" data-plus="focus-reset">${tr('Reset','Đặt lại')}</button><button class="btn btn-soft" data-plus="focus-finish">${tr('Finish','Kết thúc')}</button></div></div>
    <div class="sp-focus-card"><h6 class="fw-bold mb-3">${tr('Current task','Công việc đang tập trung')}</h6><select class="form-select mb-3" id="spFocusTask"><option value="">${tr('No linked task','Không gắn với việc cụ thể')}</option>${options.map(t=>`<option value="${safe(t.id)}" ${String(t.id)===String(focus.taskId)?'selected':''}>${safe(t.date+' · '+t.title)}</option>`).join('')}</select>
    <p class="sp-plus-mut">${tr('The timer records real focus time. Finishing a session does not automatically mark a task completed.','Đồng hồ ghi nhận thời gian thực tế. Kết thúc phiên không tự đánh dấu hoàn thành công việc.')}</p>
    <div class="sp-notification-setting"><i class="bi bi-bell me-2"></i><span>${notificationIssue()||tr('Desktop notification permission granted','Đã cấp quyền thông báo từ trình duyệt')}</span>${('Notification' in window&&Notification.permission==='granted')?`<button type="button" class="btn btn-soft btn-sm" data-plus="native-test">${tr('Test alert','Thử thông báo')}</button>`:`<button type="button" class="btn btn-soft btn-sm" data-plus="native-permission">${tr('Enable & test','Bật và thử')}</button>`}</div>
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
    const approved=await dialog(tr('Copy this task?','Sao chép công việc?'),
      `${t.title}\n${t.date} → ${to}\n${tr('The original stays on its current date.','Công việc cũ vẫn giữ nguyên ngày ban đầu.')}`);
    if(!approved)return;
    try{
      // INSERT a new task, NEVER update/delete the original task or its repeat rule.
      const copied={title:t.title,subject:t.subject||'',date:to,
        t_start:t.t_start||null,t_end:t.t_end||null,note:t.note||'',status:'todo'};
      const {data,error}=await sb.from('tasks').insert(copied).select('id').single();
      if(error)throw error;
      if(data?.id!=null)setStyle(data.id,styleFor(t.id));
      await baseLoad();refreshCurrent(true);
      toast(tr('Task copied! Original kept ✨','Đã sao chép! Lịch gốc vẫn còn ✨'),'success');
    }catch(err){toast(err.message,'danger')}
  }
  function movePrompt(id){
    const t=S.tasks.find(x=>String(x.id)===String(id));if(!t)return;
    const shell=document.createElement('div');shell.className='sp-move-pop';shell.id='spMoveModal';
    shell.innerHTML=`<div class="sp-move-dialog" role="dialog" aria-modal="true" aria-labelledby="spMoveTitle"><h5 id="spMoveTitle">${tr('Copy task to another date','Sao chép việc sang ngày khác')}</h5><p class="sp-plus-mut">${safe(t.title)}<br>${tr('The original task stays in place.','Giữ nguyên công việc ở ngày cũ.')}</p><label class="form-label" for="spMoveDate">${tr('New date','Ngày mới')}</label><input type="date" id="spMoveDate" class="form-control" value="${safe(t.date)}"><div class="d-flex gap-2 justify-content-end mt-3"><button class="btn btn-soft" data-plus="move-cancel">${tr('Cancel','Hủy')}</button><button class="btn btn-main" data-plus="move-apply" data-id="${safe(id)}">${tr('Continue','Tiếp tục')}</button></div></div>`;
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
  const hashKey = input => [...String(input||'0')].reduce((n,ch)=>((n*33)+ch.charCodeAt(0))>>>0,5381);
  function ensureTodayBackdrop(node,t,hex){
    if(S.tab!=='today'||!node.classList.contains('rw')||!t)return;
    node.classList.add('sp-decorated-today');
    node.style.setProperty('--sp-bg-accent',hex||'#cbbbe9');
    let mark=node.querySelector(':scope > .sp-task-watermark');
    if(!mark){
      mark=document.createElement('i');
      mark.className='sp-task-watermark';
      mark.setAttribute('aria-hidden','true');
      node.append(mark);
    }
    const chosen=TODAY_BG_ICONS[hashKey(t.id||t.title)%TODAY_BG_ICONS.length];
    mark.className='bi bi-'+chosen+' sp-task-watermark';
  }
  function decorateAppearance(node,t,titleTarget){
    if(!node||!t)return;
    const appearance=styleFor(t.id),hex=PALETTE_MAP.get(appearance.color);
    if(hex){node.classList.add('sp-custom-task');node.style.setProperty('--sp-task-accent',hex)}
    ensureTodayBackdrop(node,t,hex);
    if(appearance.priority){
      node.classList.add('sp-priority-task');
      if(titleTarget&&!titleTarget.querySelector('.sp-priority-mark')){
        const star=document.createElement('i');star.className='bi bi-star-fill sp-priority-mark';
        star.title=tr('Priority task','Việc ưu tiên');star.setAttribute('aria-label',star.title);
        titleTarget.prepend(star);
      }
    }
    if(appearance.icon&&titleTarget&&!titleTarget.querySelector('.sp-task-icon')){
      const icon=document.createElement('i');
      icon.className='bi bi-'+appearance.icon+' sp-task-icon';
      icon.title=tr('Task icon: ','Biểu tượng: ')+appearance.icon.replace(/-/g,' ');
      icon.setAttribute('aria-hidden','true');
      titleTarget.prepend(icon);
    }
  }
  function decorateTasks(){
    const view=$p('#view');if(!view)return;
    view.querySelectorAll('.rw').forEach(node=>{
      const t=S.tasks.find(x=>String(x.id)===String(node.querySelector('.tt[data-id]')?.dataset.id));
      const target=node.querySelector('.tt');
      decorateAppearance(node,t,target);
      if(t&&S.tab==='today'&&t.date===asIso(new Date())){
        mountClock(t,target);if(t.t_start)node.classList.add('sp-has-clock');
      }
    });
    view.querySelectorAll('.wc').forEach(node=>{
      const t=S.tasks.find(x=>String(x.id)===String(node.querySelector('[data-act="st"]')?.dataset.id));
      if(!t)return;
      decorateAppearance(node,t,node.querySelector('b[data-act="edit"]'));
      // Countdown belongs ONLY to Today's Schedule. Week view keeps its existing display.
      if(!node.querySelector('.sp-week-tools')){
        const tools=document.createElement('div');tools.className='sp-week-tools';
        tools.innerHTML=`<button type="button" data-plus="move" data-id="${safe(t.id)}" title="${tr('Copy to another date','Sao chép sang ngày khác')}"><i class="bi bi-calendar-event"></i></button><button type="button" class="sp-drag-handle" data-sp-drag="${safe(t.id)}" title="${tr('Drag to copy to another day','Kéo để sao chép sang ngày khác')}"><i class="bi bi-grip-vertical"></i></button>`;
        node.append(tools);
      }
    });
    const weekCols=view.querySelectorAll('.col7');
    weekCols.forEach((col,i)=>col.dataset.spDropdate=asIso(shift(S.ws,i)));
    view.querySelectorAll('.mc[data-act="day"]').forEach(el=>{
      el.dataset.spDropdate=el.dataset.id;
      // Month cells contain ONLY the original date number and status dots.
      // Reuse the existing dots as drag handles; no task titles are inserted.
      el.querySelectorAll('.sp-month-chip').forEach(chip=>chip.remove());
      const items=day(el.dataset.id).slice(0,6);
      el.querySelectorAll('.dots .dot').forEach((dot,i)=>{
        const t=items[i];if(!t)return;
        dot.dataset.spDrag=String(t.id);
        dot.title=tr('Drag task: ','Kéo công việc: ')+t.title;
        dot.classList.add('sp-drag-handle');
        const a=styleFor(t.id),hex=PALETTE_MAP.get(a.color);
        if(hex){dot.style.setProperty('--sp-task-accent',hex);dot.classList.add('sp-custom-dot')}
        if(a.priority){dot.classList.add('sp-priority-dot');dot.title+=' ★'}
      });
    });
    if(S.tab==='list')view.querySelectorAll('.table tbody tr').forEach(node=>{
      const id=node.querySelector('[data-act="st"]')?.dataset.id;
      const t=S.tasks.find(x=>String(x.id)===String(id));
      decorateAppearance(node,t,node.querySelector('.tt[data-act="edit"]'));
    });
    tickTaskClocks();
  }
  function decorateDay(){
    $p('#dBody')?.querySelectorAll('.dc').forEach(node=>{
      const id=node.querySelector('[data-act="st"]')?.dataset.id;
      const t=S.tasks.find(x=>String(x.id)===String(id));if(!t)return;
      decorateAppearance(node,t,node.querySelector('.fw-semibold'));
      // Keep detailed day cards untouched: no countdown outside Today.
      if(!node.querySelector('[data-plus="move"]')){
        const btn=document.createElement('button');btn.type='button';btn.className='btn btn-sm btn-soft sp-move-small ms-2';btn.dataset.plus='move';btn.dataset.id=id;
        btn.innerHTML=`<i class="bi bi-calendar-event me-1"></i>${tr('Copy task','Sao chép việc')}`;
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
  // V5: The base planner rerenders every 30 seconds and after saving a task.
  // Remember horizontal/vertical scroll before it replaces the view so Week
  // (especially Sunday) and Checklist do not jump back to their first columns.
  let lastRenderedTab=null;
  const tabScroll=new Map();
  function captureViewScroll(){
    const root=$p('#view');
    return {week:root?.querySelector('.week')?.scrollLeft||0,
      list:root?.querySelector('.table-responsive')?.scrollLeft||0,
      y:window.scrollY||document.scrollingElement?.scrollTop||0};
  }
  function restoreViewScroll(position,vertical){
    if(!position)return;
    const root=$p('#view');
    const week=root?.querySelector('.week');
    const list=root?.querySelector('.table-responsive');
    if(week)week.scrollLeft=position.week;
    if(list)list.scrollLeft=position.list;
    if(vertical && document.scrollingElement)document.scrollingElement.scrollTop=position.y;
  }
  function compactMobileChart(){
    if(S.tab!=='stats'||window.innerWidth>800||!Array.isArray(S.ch))return;
    const chart=S.ch.find(c=>c?.canvas?.id==='cStatus');
    if(!chart)return;
    // More vertical space and tighter, readable legend on narrow viewports.
    const legend=chart.options.plugins?.legend;
    if(legend){
      legend.position='bottom';
      legend.labels={...legend.labels,boxWidth:12,boxHeight:12,padding:10,font:{size:11}};
    }
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    chart.options.animation=reduced?false:{duration:1050,easing:'easeOutCubic'};
    chart.resize();
    // V5 disabled animation entirely on mobile. Defer one frame so the
    // enhancement translation pass cannot cancel the initial doughnut sweep.
    requestAnimationFrame(()=>{
      if(!S.ch.includes(chart)||!chart.canvas?.isConnected)return;
      if(!reduced)chart.reset();
      chart.update(reduced?'none':undefined);
    });
  }
  function refreshCurrent(force){
    if(force)delete $p('#view')?.dataset.spPlusTab;
    window.render();
  }
  window.render=function(...args){
    hydrateUser();buildNav();
    // DOM still belongs to the previously rendered tab at this point.
    if(lastRenderedTab)tabScroll.set(lastRenderedTab,captureViewScroll());
    const staying=lastRenderedTab===S.tab;
    const restore=staying?tabScroll.get(S.tab):null;
    const view=$p('#view');
    if(S.tab==='focus'||S.tab==='mood'){
      if(view.dataset.spPlusTab!==S.tab){
        originalRender.apply(this,args);
        view.dataset.spPlusTab=S.tab;
        view.innerHTML=S.tab==='focus'?focusView():moodView();
      }else head();
      buildNav();tickFocus();
    }else{
      delete view.dataset.spPlusTab;
      originalRender.apply(this,args);
      buildNav();decorateTasks();
      compactMobileChart();
    }
    lastRenderedTab=S.tab;
    // Restore now (before paint), then once again after browser layout settles.
    if(restore){
      restoreViewScroll(restore,true);
      const restoredTab=S.tab;
      requestAnimationFrame(()=>{if(S.tab===restoredTab&&lastRenderedTab===restoredTab)restoreViewScroll(restore,true)});
    }
  };
  function saveMoodDraft(){
    if(!moodDraft?.mood){toast(tr('Please choose a mood','Hãy chọn cảm xúc của bạn'),'warning');return}
    const text=$p('#spMoodNote')?.value.trim()||'';
    void (async()=>{
      if(!await dialog(tr('Save your mood?','Xác nhận lưu cảm xúc?'),tr('Record how you felt today?','Lưu lại cảm xúc hôm nay?')))return;
      moods[moodDraft.date]={mood:moodDraft.mood,note:text};saveMood(moodDraft.date);refreshCurrent(true);
      toast(tr('Mood saved 🌷','Đã lưu cảm xúc 🌷'),'success');
    })();
  }
  async function stopRule(id){
    const rule=rules.find(x=>x.id===id);if(!rule)return;
    const question=rule.active?tr('Stop this schedule?','Dừng lịch lặp lại này?'):tr('Resume this schedule?','Tiếp tục lịch lặp lại?');
    const yes=await dialog(question,tr('Existing tasks will not be deleted.','Các công việc đã tạo sẽ không bị xóa.'));
    if(!yes)return;
    rule.active=!rule.active;saveRules(rule);showRules();
    if(rule.active)queueGeneration();
  }
  // Use one delegated handler to survive existing view rerenders.
  document.addEventListener('click',async e=>{
    const el=e.target.closest('[data-plus]');if(!el)return;
    const a=el.dataset.plus,id=el.dataset.id;
    if(a==='style-color'){styleDraft.color=PALETTE_MAP.has(id)?id:'';refreshStyleForm();return}
    if(a==='style-priority'){styleDraft.priority=!styleDraft.priority;refreshStyleForm();return}
    if(a==='icon-open'){openIconPicker();return}
    if(a==='icon-close'){closeIconPicker();return}
    if(a==='icon-clear'){styleDraft.icon='';refreshStyleForm();closeIconPicker();return}
    if(a==='icon-select'){styleDraft.icon=ICON_SET.has(id)?id:'';refreshStyleForm();closeIconPicker();return}
    if(a==='icon-category'){iconPickerGroup=id==='all'||ICON_GROUPS.some(g=>g.id===id)?id:'all';iconPickerTiles();return}
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
    if(a==='native-permission'){void requestNativeAlerts();return}
    if(a==='native-test'){testNativeAlerts();return}
    if(a==='custom-duration'){
      const ids=['spFocusHours','spFocusMinutes','spFocusSeconds'];
      const fields=ids.map(id=>$p('#'+id));
      const values=fields.map(field=>Number(field?.value));
      const limits=[23,59,59];
      if(fields.some((field,i)=>!field||field.value.trim()===''||!Number.isInteger(values[i])||values[i]<0||values[i]>limits[i])){
        toast(tr('Enter valid hours (0–23), minutes (0–59) and seconds (0–59).','Nhập giờ (0–23), phút và giây (0–59) hợp lệ.'),'warning');return;
      }
      const duration=values[0]*3600+values[1]*60+values[2];
      if(duration<1){toast(tr('Please set at least one second.','Cần đặt tối thiểu 1 giây.'),'warning');return}
      if(focus.running||focus.elapsed){
        if(!await dialog(tr('Change focus duration?','Đổi thời lượng tập trung?'),tr('Changing the timer will reset current progress.','Đổi thời lượng sẽ xóa tiến độ đang đếm.')))return;
      }
      focus.duration=duration;focus.elapsed=0;focus.running=false;focus.startedAt=0;
      saveFocus();refreshCurrent(true);return;
    }
    if(a==='preset'){
      const n=Number(id);if(focus.running||focus.elapsed){
        if(!await dialog(tr('Reset this session?','Đặt lại phiên đang học?'),tr('Progress on the current timer will be cleared.','Tiến độ đồng hồ hiện tại sẽ được xóa.')))return;
      }
      focus.duration=n*60;focus.elapsed=0;focus.running=false;focus.startedAt=0;saveFocus();refreshCurrent(true);return;
    }
    if(a==='focus-toggle'){
      finishIfElapsed();if(focus.running){focus.elapsed=focusElapsed();focus.running=false;focus.startedAt=0}
      else{if(focus.elapsed>=focus.duration)focus.elapsed=0;focusChime('start');focus.running=true;focus.startedAt=Date.now()}
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
  // Reuse the existing account notification setting without modifying HTML.
  document.addEventListener('click',e=>{
    if(!e.target.closest('[data-act="perm"]'))return;
    e.preventDefault();e.stopImmediatePropagation();
    void requestNativeAlerts();
  },true);
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
  setInterval(()=>{if(!hydrateUser())return;finishIfElapsed();tickFocus();tickTaskClocks();checkSessionEnds()},1000);
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&hydrateUser()){finishIfElapsed();tickFocus();tickTaskClocks();checkSessionEnds()}
  });
  hydrateUser();buildNav();
  if(S.user){refreshCurrent(true);queueGeneration()}
})();
