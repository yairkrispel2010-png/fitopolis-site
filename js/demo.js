/* ═══ הדמו האינטראקטיבי — העתק נאמן של שני הממשקים (לפי מפרטי הקוד + ביקורת נאמנות, 09/09/2026)
   מצב אחד משותף (S) לכל הטלפונים בדף: מה שהמתאמן מסמן — המאמן רואה, ולהפך.
   כל המחרוזות, הסדר והמידות — מהאפליקציה עצמה. ═══ */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;   // במסך מגע הגליל הפנימי סגור לאצבע

  /* ── נתוני הדמו (mock_data.dart / trainee_mock.dart / menu_mock.dart) ── */
  var CLIENTS = [
    { id: 'or',     name: 'אור בן דוד',  ini: 'אב', c: 'green',  goal: 'מסה',      since: '15/01/2025', pic: 'or' },
    { id: 'daniel', name: 'דניאל כהן',   ini: 'דכ', c: 'blue',   goal: 'חיטוב',    since: '15/10/2025', pic: 'daniel' },
    { id: 'yossi',  name: 'יוסי מזרחי',  ini: 'ימ', c: 'purple', goal: 'מסה',      since: '10/02/2025', pic: 'yossi' },
    { id: 'michal', name: 'מיכל לוי',    ini: 'מל', c: 'amber',  goal: 'לא הוגדר', since: '20/04/2025', pic: 'michal' },
    { id: 'ron',    name: 'רון גולדברג', ini: 'רג', c: 'amber',  goal: 'חיטוב',    since: '15/05/2025', pic: 'ron' },
    { id: 'shira',  name: 'שירה כהן',    ini: 'שכ', c: 'green',  goal: 'סטטי',     since: '05/09/2026', pic: 'shira' }
  ];
  function client(id) { for (var i = 0; i < CLIENTS.length; i++) if (CLIENTS[i].id === id) return CLIENTS[i]; return CLIENTS[1]; }
  var MEETINGS = {                                                  // פגישות המאמן (mock_data) — לגיליון "לפרטי הפגישה"
    michal: { cl: 'michal', dd: '14', mon: 'ספט׳', date: '14/09/2026', topic: 'לקיחת מידות + תמונות', time: '17:30', dur: 45, platform: 'פרונטלי', place: 'הרצליה פיתוח', synced: true },
    yossi:  { cl: 'yossi',  dd: '20', mon: 'ספט׳', date: '20/09/2026', topic: 'עדכון תוכנית אימון', time: '11:00', dur: 30, platform: 'טלפון' },
    daniel: { cl: 'daniel', dd: '21', mon: 'ספט׳', date: '21/09/2026', topic: 'בדיקת התקדמות + עדכון תפריט', time: '10:00', dur: 60, platform: 'טלפון' },
    danielrec: { cl: 'daniel', dd: '14', mon: 'ספט׳', date: '14/09/2026', topic: 'פגישת מעקב', time: '10:00', dur: 30, platform: 'טלפון', footer: 'פגישה קבועה, כל שבוע. יש עוד 8 כאלה ביומן.' },
    orh:    { cl: 'or',     dd: '26', mon: 'אוג׳', date: '26/08/2026', topic: 'בדיקת התקדמות חודשית', time: '09:00', dur: 45, platform: 'טלפון', past: true },
    danielh:{ cl: 'daniel', dd: '10', mon: 'אוג׳', date: '10/08/2026', topic: 'מדידות + עדכון תפריט', time: '10:00', dur: 60, platform: 'טלפון', past: true }
  };
  var trainerPresets = ['עדכנתי לך את התפריט — תיכנס לטאב תזונה', 'תזכור לעדכן משקל היום', 'כל הכבוד על השבוע 💪'];
  var traineePresets = ['תודה! הבנתי את ההנחיות 💪', 'סיימתי את הצהריים, היה טעים', 'אפשר להזיז את הפגישה לשבוע הבא?'];
  var WEIGHTS = [79.0, 78.4, 77.9, 77.3, 76.8];                       // שקילה שבועית, כמו שהמאמן ביקש
  var WDATES = ['05/08', '12/08', '19/08', '26/08', '02/09'];
  // פריט מזון: [שם, גרם, חלבון, פחמימה, שומן, קלוריות]; קבוצת "בחר אחד" מציגה טווח עד שבוחרים
  function meal(name, time, groups) { return { name: name, time: time, eaten: false, groups: groups }; }
  function grp(type, rule, items, free) { return { type: type, rule: rule, free: !!free, items: items }; }
  function initial() {
    return {
      chat: [
        { from: 'trainer', text: 'היי דניאל, איך הולך השבוע?', time: '11:10' },
        { from: 'trainee', text: 'בסדר גמור, רק פספסתי את האימון של שלישי', time: '11:25' },
        { from: 'trainer', card: true, time: '13:55' }                       // הצעת פגישה מהמאמן — ממתינה לתשובת המתאמן
      ],
      unreadByTrainee: 1, unreadByTrainer: 1, ronUnread: 1,
      meals: [
        meal('ארוחת בוקר', '07:30–08:30', [
          grp('חלבון', 'בחר אחד:', [['מעדן חלבון', 150, 15, 10, 3, 130], ['טונה במים', 150, 30, 0, 2, 140], ['חביתה מ־3 ביצים', 150, 20, 1, 16, 230], ['גבינה לבנה 5%', 150, 17, 5, 7, 150]]),
          grp('פחמימה', 'בחר אחד:', [['פרכיות אורז', 70, 5, 55, 2, 260], ['לחמנייה ללא גלוטן', 100, 6, 50, 4, 260]]),
          grp('ירקות', 'חופשי — כמה שבא לך:', [['סלט ירקות', 0, 0, 0, 0, 0]], true)]),
        meal('ביניים בוקר', '10:30–11:00', [
          grp('חלבון', 'בחר אחד:', [['מעדן חלבון', 150, 15, 10, 3, 130], ['משקה חלבון', 250, 25, 12, 4, 190]]),
          grp('פחמימה', 'בחר אחד:', [['פרכיות אורז', 40, 3, 32, 1, 150]])]),
        meal('צהריים', '12:30–13:30', [
          grp('חלבון', 'בחר אחד:', [['חזה עוף', 150, 45, 0, 5, 240], ['פרגית', 120, 30, 0, 12, 240], ['דג מושט', 180, 38, 0, 6, 210], ['בשר טחון רזה 5%', 150, 32, 0, 8, 210]]),
          grp('פחמימה', 'בחר אחד:', [['אורז מבושל', 200, 5, 56, 1, 260], ['פסטה ללא גלוטן', 180, 6, 55, 2, 265], ['תפוח אדמה מבושל', 220, 4, 40, 0, 180], ['בטטה אפויה', 220, 4, 46, 0, 200]]),
          grp('ירקות', 'חופשי — כמה שבא לך:', [['סלט ירקות', 0, 0, 0, 0, 0]], true)]),
        meal('ביניים אחר הצהריים', '16:00–16:30', [
          grp('חלבון', 'בחר אחד:', [['מעדן חלבון', 150, 15, 10, 3, 130], ['משקה חלבון', 250, 25, 12, 4, 190]]),
          grp('פחמימה', 'בחר אחד:', [['פרי (תפוח/בננה/אגס)', 150, 1, 22, 0, 90]])]),
        meal('ערב', '19:00–20:00', [
          grp('חלבון', 'בחר אחד:', [['קציצות עוף/בשר אפויות', 150, 30, 5, 12, 250], ['שניצל אפוי', 150, 32, 12, 9, 260], ['נקניקיות עוף', 140, 24, 3, 14, 240]]),
          grp('פחמימה', 'בחר אחד:', [['אורז מבושל', 200, 5, 56, 1, 260], ['פסטה ללא גלוטן', 180, 6, 55, 2, 265], ['בטטה אפויה', 220, 4, 46, 0, 200]]),
          grp('ירקות', 'חופשי — כמה שבא לך:', [['ירקות מוקפצים', 0, 0, 0, 0, 0]], true)])
      ],
      choice: {},                          // 'ארוחה:קבוצה' → אינדקס האפשרות שנבחרה
      exercises: [
        { name: 'לחיצת חזה במוט', sets: '4 סטים · 8–12 חזרות', prev: 60, w: 60 },
        { name: 'לחיצת כתפיים',   sets: '4 סטים · 8–12 חזרות', prev: 30, w: 30 },
        { name: 'פרפר בכבלים',    sets: '3 סטים · 12–15 חזרות', prev: 15, w: 15 },
        { name: 'פלאנק',          sets: '3 סטים · 45 שנ׳',      prev: 0,  w: null }
      ],
      workoutDone: false, aerobic: 0,
      weightLogged: false, weight: 76.8,
      proposalApproved: false, attendance: false, traineeRequestSent: false,
      ronPending: true, danielPaid: false, calendarSynced: false
    };
  }
  var S = initial();
  S.meals[0].eaten = true;

  /* ── עזרים ─────────────────────────────────────────────────────────── */
  function icon(id, cls) { return '<svg class="' + (cls || 'ic') + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function now() { var d = new Date(); return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }
  // דיוקן כשיש (כמו תמונת אווטאר באפליקציה), ראשי תיבות כשאין — בדיוק ההתנהגות של ClientAvatar
  function av(c, ini, size, ring, extra, pic) {
    var inner = pic ? '<svg class="k-face" viewBox="0 0 100 100" aria-hidden="true"><use href="#a-' + pic + '"/></svg>' : ini;
    return '<span class="k-av' + (ring ? ' ring-' + ring : ' noring') + (pic ? ' pic' : '') + (extra ? ' ' + extra : '') + '" style="--s:' + size + 'px"><i class="av-' + c + '">' + inner + '</i></span>';
  }
  function cav(cl, size, ring) { return av(cl.c, cl.ini, size, ring, null, cl.pic); }
  function nextMeal() { for (var i = 0; i < S.meals.length; i++) if (!S.meals[i].eaten) return S.meals[i]; return null; }
  function lastEaten() { for (var i = S.meals.length - 1; i >= 0; i--) if (S.meals[i].eaten) return S.meals[i]; return null; }
  function danielReasons() { return S.weightLogged ? [] : ['אין עדכון משקל השבוע']; }   // סיבה אחת, כדי שעדכון משקל בטלפון של המתאמן יוריד אותו מהרשימה אצל המאמן
  function needsCount() { return (danielReasons().length ? 1 : 0) + 1; }
  function clientReasons(id) { return id === 'daniel' ? danielReasons() : id === 'ron' ? ['נדרשים היקפים'] : []; }
  function unreadTotal() { return S.unreadByTrainer + S.ronUnread; }
  function requestsCount() { return 1 + (S.ronPending ? 1 : 0) + (S.traineeRequestSent ? 1 : 0); }   // 1 = ההצעה החלופית של שירה, שממתינה תמיד
  function lastTrainerText() { for (var i = S.chat.length - 1; i >= 0; i--) if (S.chat[i].from === 'trainer') return S.chat[i].card ? 'תיאום פגישה · בדיקת התקדמות' : S.chat[i].text; return ''; }
  function lastDanielPreview() { var m = S.chat[S.chat.length - 1]; return m.card ? 'תיאום פגישה · ' + (S.proposalApproved ? 'אושרה ✓' : 'ממתין לאישור המתאמן') : m.text; }
  // מאקרו של ארוחה: קבוצה שנענתה — ערך הנבחרת; אחרת אמצע הטווח בין האפשרויות (trainee.dart)
  function mealMacros(m) {
    var mi = S.meals.indexOf(m), t = { p: 0, c: 0, f: 0, klo: 0, khi: 0, open: false };
    m.groups.forEach(function (g, gi) {
      if (!g.items.length) return;
      var ch = S.choice[mi + ':' + gi];
      if (g.free || g.items.length === 1 || ch !== undefined) { var it = g.items[ch === undefined ? 0 : ch]; t.p += it[2]; t.c += it[3]; t.f += it[4]; t.klo += it[5]; t.khi += it[5]; return; }
      var ks = g.items.map(function (x) { return x[5]; }), lo = Math.min.apply(null, ks), hi = Math.max.apply(null, ks);
      t.p += Math.round(avg(g.items, 2)); t.c += Math.round(avg(g.items, 3)); t.f += Math.round(avg(g.items, 4)); t.klo += lo; t.khi += hi; t.open = true;
    });
    t.k = Math.round((t.klo + t.khi) / 2);
    return t;
  }
  function avg(items, i) { return items.reduce(function (a, x) { return a + x[i]; }, 0) / items.length; }
  function kcalText(m) { var t = mealMacros(m); return t.open ? t.klo + '–' + t.khi + ' קלוריות' : t.k + ' קלוריות'; }

  /* ── אטומים משותפים ────────────────────────────────────────────────── */
  function screenTitle(t) { return '<div class="k-stitle"><i></i><span>' + t + '</span><i></i></div>'; }
  function sectionTitle(t) { return '<div class="k-sec"><i></i><span>' + t + '</span><i></i></div>'; }
  function groupHeading(t) { return '<div class="k-ghead"><span>' + t + '</span><b></b></div>'; }
  function panelTitle(t) { return '<div class="k-ptitle">' + t + '</div>'; }
  // כרטיס לחיץ = div עם role=button (לא <button>, כי בתוכו יושבים כפתורים משלו — כמו GestureDetector באפליקציה)
  function card(inner, cls, act) { return '<div class="k-card' + (cls ? ' ' + cls : '') + '"' + (act ? ' role="button" tabindex="0" data-act="' + act + '"' : '') + '>' + inner + '</div>'; }
  function primary(label, act, voice, ic, cls) { return '<button class="k-primary v-' + (voice || 'coach') + (cls ? ' ' + cls : '') + '" data-act="' + act + '">' + (ic ? icon(ic, 'bi') : '') + label + '</button>'; }
  function secondary(label, act, voice, ic, cls) { return '<button class="k-secondary' + (voice ? ' v-' + voice : '') + (cls ? ' ' + cls : '') + '" data-act="' + act + '">' + (ic ? icon(ic, 'bi') : '') + label + '</button>'; }
  function badge(text, style, ic) { return '<span class="k-badge ' + style + '">' + (ic ? icon(ic, 'bi') : '') + text + '</span>'; }
  function pill(label, ic, act) { return '<button class="k-opens" data-act="' + act + '">' + icon(ic, 'bi') + label + '</button>'; }
  function inline(label, value, style) { return '<span class="k-inline"><span class="l">' + label + ':</span><b' + (style ? ' class="' + style + '"' : '') + '>' + value + '</b></span>'; }
  function factPair(a, b) { return '<div class="k-facts">' + a + (b || '') + '</div>'; }
  function heading(topic) { return '<div class="k-heading"><span class="l">נושא:</span><span class="t">' + topic + '</span></div>'; }
  function statusTag(text, color) { return '<span class="k-stag c-' + color + '">' + text + '</span>'; }
  function dateBadge(dd, mon) { return '<span class="k-date"><b>' + dd + '</b><small>' + mon + '</small></span>'; }
  function filterToggle(label, act, voice) { return '<div class="k-filterwrap"><button class="k-filter v-' + (voice || 'coach') + '" data-act="' + act + '"><span>' + label + '</span>' + icon('swap', 'bi') + '</button></div>'; }
  function search(hint) { return '<div class="k-search">' + icon('search', 'bi') + '<span>' + hint + '</span></div>'; }
  function catBar(items, active, prefix, open, voice) {
    return '<div class="k-catbar' + (open ? ' is-open' : '') + '">' + items.map(function (it) {
      var on = it[0] === active;
      return '<button class="k-cat' + (on ? ' on v-' + (it[3] || voice || 'coach') : '') + '" data-act="' + prefix + ':' + it[0] + '">' + icon(it[1], 'bi') + (on ? '<span>' + it[2] + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function macroCells(m) {
    var t = mealMacros(m);
    return '<div class="k-macros">' + [['חלבון', t.p, 'גרם'], ['פחמימה', t.c, 'גרם'], ['שומן', t.f, 'גרם'], ['קלוריות', t.k, '']].map(function (x) {
      return '<span class="cell"><small>' + x[0] + '</small><b>' + x[1] + (x[2] ? '<i>' + x[2] + '</i>' : '') + '</b></span>';
    }).join('') + '</div>';
  }
  function sources(meal, mi) {
    return '<div class="k-sources">' + meal.groups.map(function (g, gi) {
      var key = mi + ':' + gi, chosen = S.choice[key], choosable = !g.free && g.items.length > 1;
      return '<div class="grp"><div class="gh"><b>' + g.type + ' · </b><span>' + g.rule + '</span></div>' +
        g.items.map(function (it, ii) {
          var mark = (g.free || g.items.length === 1) ? '• ' : (chosen === ii ? '✓ ' : '○ ');
          var dim = choosable && chosen !== undefined && chosen !== ii;
          var txt = mark + it[0] + (g.free ? '' : ' · ' + it[1] + ' גרם');
          return choosable ? '<button class="src' + (chosen === ii ? ' picked' : '') + (dim ? ' dim' : '') + '" data-act="choose:' + mi + ':' + gi + ':' + ii + '">' + txt + '</button>' : '<span class="src">' + txt + '</span>';
        }).join('') + '</div>';
    }).join('') + '</div>';
  }
  // LineChart: קו חלק, מילוי 12%, נקודות (האחרונה גדולה), ועד 4 תוויות תאריך ברצועה של 18
  function chart(vals, color, h, dates) {
    var W = 240, H = h, pad = 10, n = vals.length, min = Math.min.apply(null, vals), max = Math.max.apply(null, vals), span = (max - min) || 1;
    var strip = dates ? 18 : 0;
    var P = vals.map(function (v, i) { return [pad + (W - 2 * pad) * i / (n - 1), pad + (H - 2 * pad) * (1 - (v - min) / span)]; });
    var d = 'M' + P[0][0].toFixed(1) + ',' + P[0][1].toFixed(1);
    for (var i = 1; i < n; i++) { var a = P[i - 1], b = P[i], cx = (a[0] + b[0]) / 2; d += ' C' + cx.toFixed(1) + ',' + a[1].toFixed(1) + ' ' + cx.toFixed(1) + ',' + b[1].toFixed(1) + ' ' + b[0].toFixed(1) + ',' + b[1].toFixed(1); }
    var fill = d + ' L' + P[n - 1][0].toFixed(1) + ',' + (H - pad) + ' L' + P[0][0].toFixed(1) + ',' + (H - pad) + ' Z';
    var dots = '';
    P.forEach(function (p, i) { var last = i === n - 1, r = last ? 5 : (n > 20 ? 2.2 : 3); dots += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + r + '" fill="' + color + '"/><circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (r * 0.45).toFixed(1) + '" fill="#FFFFFF"/>'; });
    var labels = '';
    if (dates) dates.forEach(function (t, i) { var x = pad + (W - 2 * pad) * i / (dates.length - 1); labels += '<text x="' + x.toFixed(1) + '" y="' + (H + 13) + '" font-size="10" fill="#5C6B75" text-anchor="' + (i === 0 ? 'start' : i === dates.length - 1 ? 'end' : 'middle') + '" font-family="Rubik, Arial, sans-serif">' + t + '</text>'; });
    return '<svg class="k-chart" viewBox="0 0 ' + W + ' ' + (H + strip) + '" style="--h:' + (H + strip) + 'px" aria-hidden="true"><path d="' + fill + '" fill="' + color + '" fill-opacity="0.12" stroke="none"/><path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' + dots + labels + '</svg>';
  }
  function rangePicker(opts, active, prefix) { return '<div class="k-range">' + opts.map(function (o) { return '<button class="' + (o === active ? 'on' : '') + '" data-act="' + prefix + ':' + o + '">' + o + '</button>'; }).join('') + '</div>'; }
  function segPills(opts, active, prefix) { return '<div class="k-seg">' + opts.map(function (o) { return '<button class="' + (o[0] === active ? 'on' : '') + '" data-act="' + prefix + ':' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
  // מסילת הווריאציות (progress_carousel _VariationRail): חץ למעלה, נקודה לכל ווריאציה, חץ למטה
  function rail(count, active, prefix) {
    var s = '<div class="k-rail"><button class="arr' + (active === 0 ? ' end' : '') + '" data-act="' + prefix + ':' + (active - 1) + '" aria-label="התצוגה הקודמת">' + icon('expand', 'bi up') + '</button>';
    for (var i = 0; i < count; i++) s += '<button class="dot' + (i === active ? ' on' : '') + '" data-act="' + prefix + ':' + i + '" aria-label="תצוגה ' + (i + 1) + '"><i></i></button>';
    return s + '<button class="arr' + (active === count - 1 ? ' end' : '') + '" data-act="' + prefix + ':' + (active + 1) + '" aria-label="התצוגה הבאה">' + icon('expand', 'bi') + '</button></div>';
  }
  // עמוד קטגוריה בקרוסלה: כותרת ווריאציה (+ מסילה כשיש יותר מאחת), מספר גדול, "מ-", גרף, פוטר
  var PANES = {
    weight: [{ name: 'משקל גוף', hint: 'המשקל שאתה מזין בעצמך, לאורך הטווח שבחרת', big: function () { return (S.weightLogged ? '76.5' : '76.8') + ' ק"ג'; }, from: 'מ-79.0 ק"ג', vals: function () { return WEIGHTS.concat(S.weightLogged ? [76.5] : []); }, color: '#F07C1A', dates: WDATES, ranges: ['חודש', 'שבועיים', 'שבוע'], weightBtn: true }],
    measures: [
      { name: 'מותן', hint: 'ההיקפים שהמאמן מודד לך — מדד אחד בכל פעם', big: '83.5 ס"מ', from: 'מ-85.0 ס"מ', vals: [85.0, 84.7, 84.4, 84.1, 83.8, 83.5], color: '#12939D', dates: ['30/06', '21/07', '11/08', '01/09'], ranges: ['חודש', 'חודשיים', 'שלושה'] },
      { name: 'ירך', hint: 'ההיקפים שהמאמן מודד לך — מדד אחד בכל פעם', big: '58.8 ס"מ', from: 'מ-59.6 ס"מ', vals: [59.6, 59.4, 59.2, 59.0, 58.8], color: '#12939D', dates: ['14/07', '28/07', '18/08', '01/09'], ranges: ['חודש', 'חודשיים', 'שלושה'] }],
    strength: [
      { name: 'מדד התקדמות', hint: 'כמה התחזקת מאז ההתחלה (0 = נקודת ההתחלה)', big: '+18%', from: 'מ-0%', vals: [0, 3, 5, 4, 8, 11, 10, 14, 15, 18], color: '#F07C1A', dates: ['12/07', '30/07', '17/08', '03/09'], ranges: ['חודש', 'שבועיים', 'שבוע'] },
      { name: 'התקדמות בנפח', hint: 'סך העומס: סטים × חזרות × משקל, בכל התרגילים', big: '4860 ק"ג', from: 'מ-3900 ק"ג', vals: [3900, 4100, 4050, 4300, 4500, 4480, 4700, 4860], color: '#F07C1A', dates: ['12/07', '30/07', '17/08', '03/09'], ranges: ['חודש', 'שבועיים', 'שבוע'], foot: 'לא המשקל שעל המוט. תרגילי משקל גוף וקרדיו (0 ק"ג) לא נספרים' },
      { name: 'תרגיל ספציפי', hint: 'המשקל שהרמת ב"לחיצת חזה במוט" לאורך זמן', big: '60.0 ק"ג', from: 'מ-50.0 ק"ג', vals: [50, 52.5, 52.5, 55, 55, 57.5, 60], color: '#F07C1A', dates: ['12/07', '30/07', '17/08', '03/09'], ranges: ['חודש', 'שבועיים', 'שבוע'], exercise: 'לחיצת חזה במוט' },
      { name: 'משך אימון', hint: 'כמה זמן לוקח לך אימון, מהתחלה ועד סוף.', empty: ['timer', 'עדיין אין נתוני משך', 'המשך נשמר בסיום כל אימון, מהיום — אחרי שני אימונים תראה כאן גרף'] }]
  };
  function pane(cat, ph, key) {
    var list = PANES[cat], vi = Math.max(0, Math.min(list.length - 1, ph[key] || 0)), v = list[vi], multi = list.length > 1;
    var head = '<div class="k-varhead' + (multi ? ' withrail' : '') + '"><div class="txt"><b>' + v.name + '</b><small>' + v.hint + '</small>' + (multi ? '<span class="railhint">החצים והנקודות מחליפים תצוגה</span>' : '') + '</div>' + (multi ? rail(list.length, vi, key) : '') + '</div>';
    var body;
    if (v.empty) body = '<div class="k-empty compact stack">' + icon(v.empty[0], 'bi v-faint') + '<b>' + v.empty[1] + '</b><p>' + v.empty[2] + '</p></div>';
    else body = '<div class="k-bignum"><b>' + (typeof v.big === 'function' ? v.big() : v.big) + '</b><span>נוכחי</span></div><div class="k-from">' + v.from + '</div>' + chart(typeof v.vals === 'function' ? v.vals() : v.vals, v.color, 150, v.dates) +
      rangePicker(v.ranges, v.ranges[0], 'noop') + (v.exercise ? '<div class="k-labeled"><small>תרגיל</small><span class="k-fieldbox">' + v.exercise + '</span></div>' : '') +
      (v.weightBtn && !S.weightLogged ? '<button class="k-primary v-trainee" data-act="weight">' + icon('plus', 'bi') + 'הזנת משקל</button>' : '') + (v.foot ? '<p class="k-varfoot">' + v.foot + '</p>' : '');
    return card(head + body, 'pane');
  }
  var FOOTNOTE = '<p class="k-footnote">הגרפים נבנים מהנתונים שמוזנים — שלך ושל המאמן. ככל שמזינים יותר, הם ברורים ומדויקים יותר.</p>';

  /* ── כרטיסי פגישה (meeting_card.dart) ─────────────────────────────── */
  function clientHeader(cl, dd, mon) { return '<div class="k-chead">' + cav(cl, 44, 'trainee') + '<b>' + cl.name + '</b>' + dateBadge(dd, mon) + '</div>'; }
  function meetingCard(id, opts) {
    var m = MEETINGS[id], cl = client(m.cl); opts = opts || {};
    var act = opts.act || 'sheet:tmeeting:' + id;
    return card(clientHeader(cl, m.dd, m.mon) +
      (opts.tags && opts.tags.length ? '<div class="k-tags">' + opts.tags.map(function (t) { return '<span class="k-ctag ' + t[1] + '">' + t[0] + '</span>'; }).join('') + '</div>' : '') +
      heading(m.topic) + factPair(inline('שעה', m.time), inline('משך', m.dur + ' דקות')) +
      '<div class="k-center">' + inline('פלטפורמה', m.platform) + '</div>' + (m.place ? '<div class="k-center">' + inline('מיקום', m.place) + '</div>' : '') +
      '<div class="k-center">' + pill('לפרטי הפגישה', 'event-note', act) + '</div>' +
      (m.footer ? '<div class="k-footer">' + icon('repeat', 'bi v-coach') + '<span>' + m.footer + '</span></div>' : ''), 'meeting', act);
  }
  function requestCard(r) {
    return card(clientHeader(r.cl, r.dd, r.mon) + '<div class="k-tags">' + statusTag(r.status, r.color) + '</div>' + heading(r.topic) +
      factPair(inline('שעה', r.time), inline('משך', r.dur + ' דקות')) + '<div class="k-center">' + inline('פלטפורמה', r.platform) + '</div>' +
      (r.place ? '<div class="k-center">' + inline('מיקום', r.place) + '</div>' : '') + '<div class="k-received">התקבלה: ' + r.received + '</div>' +
      '<div class="k-center">' + pill('לפרטי הפגישה', 'event-note', r.act || 'sheet:coord') + '</div>', 'request', r.act || 'sheet:coord');
  }
  function timeline(rows) { return '<div class="k-gap20"></div>' + sectionTitle('היסטוריית פעולות') + '<div class="k-tline">' + rows.map(function (r) { return '<div class="row v-' + r[0] + '">' + icon(r[1], 'bi') + '<span class="col"><b>' + r[2] + '</b><small>' + r[3] + '</small></span></div>'; }).join('') + '</div>'; }

  /* ── ממשק המאמן ────────────────────────────────────────────────────── */
  /* ── תאריכים יחסיים להיום, כמו באפליקציה — ההדגמה לא מזדקנת ── */
  var DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  var DAYL = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  var MONS = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
  var MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function dayAt(off) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + off); return d; }
  function dm(off) { var d = dayAt(off); return two(d.getDate()) + '/' + two(d.getMonth() + 1); }
  function dmy(off) { return dm(off) + '/' + dayAt(off).getFullYear(); }
  function wd(off) { return DAYS[dayAt(off).getDay()]; }
  function monOf(off) { return MONS[dayAt(off).getMonth()]; }
  function dnum(off) { return String(dayAt(off).getDate()); }
  function monthYear() { var d = new Date(); return MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function greet() { var h = new Date().getHours(); return h >= 5 && h < 12 ? 'בוקר טוב' : h >= 12 && h < 17 ? 'צהריים טובים' : h >= 17 && h < 23 ? 'ערב טוב' : 'שלום'; }
  function waitLine() { var h = new Date().getHours(); return h < 12 ? 'מה מחכה לך היום' : h < 17 ? 'מה עוד מחכה לך היום' : 'מה נשאר להיום'; }
  // הפגישות של הדמו — יום יחסי להיום
  (function () { var off = { michal: 2, yossi: 3, daniel: 4, danielrec: 1, orh: -32, danielh: -17 };
    Object.keys(off).forEach(function (k) { var m = MEETINGS[k]; if (!m) return; m.off = off[k]; m.dd = dnum(off[k]); m.mon = monOf(off[k]); m.date = dmy(off[k]); m.wd = wd(off[k]); }); })();

  /* ── הרכיבים העדכניים (n-*) ── */
  function face(cl, badgeIcon, badgeVoice) {
    return '<span class="n-face">' + av(cl.c, cl.ini, 34, 'trainee', 'tight', cl.pic) + (badgeIcon ? '<span class="n-badge ' + (badgeVoice || 'v-coach') + '">' + icon(badgeIcon, 'bi') + '</span>' : '') + '</span>';
  }
  function personRow(cl, o) {
    return '<button class="n-row" data-act="' + (o.act || 'noop') + '">' + face(cl, o.badge, o.badgeVoice) +
      '<span class="txt"><span class="nm"><b>' + cl.name + '</b>' + (o.meta ? '<small>' + o.meta + '</small>' : '') + (o.count ? '<i class="n-cpill' + (o.countCoach ? ' coach' : '') + '">' + o.count + '</i>' : '') + '</span>' +
      (o.lines || []).map(function (l) { return '<span class="ln' + (o.clamp ? ' two' : '') + '">' + l + '</span>'; }).join('') +
      (o.whys || []).map(function (w) { return '<span class="why">' + w + '</span>'; }).join('') + '</span>' + icon('chev-l', 'bi chev') + '</button>';
  }
  function door(ic, label, act, more) { return '<button class="n-door" data-act="' + act + '">' + icon(ic, 'bi') + '<span class="lbl">' + label + (more ? '<i> · ' + more + '</i>' : '') + '</span>' + icon('chev-l', 'bi chev') + '</button>'; }
  function counter(tiles, sel, prefix, trainee) {
    return '<div class="n-count' + (trainee ? ' trainee' : '') + '">' + tiles.map(function (t) {
      return '<button class="n-tile' + (t[0] === sel ? ' on' : '') + '" data-act="' + prefix + ':' + t[0] + '"' + (t[3] ? ' aria-label="' + t[3] + '"' : '') + '>' + (t[4] ? '<span class="done">' + icon('check', 'bi') + '</span>' : '') + '<span class="num">' + t[1] + '</span><span class="lbl">' + t[2] + '</span></button>';
    }).join('') + '</div>';
  }
  function seg(opts, sel, prefix) { return '<div class="n-seg">' + opts.map(function (o) { return '<button class="' + (o[0] === sel ? 'on' : '') + '" data-act="' + prefix + ':' + o[0] + '">' + o[1] + ' <b>' + o[2] + '</b></button>'; }).join('') + '</div>'; }
  function tag(text, cls) { return '<span class="n-tag' + (cls ? ' ' + cls : '') + '"><span class="t">' + text + '</span></span>'; }
  function opens(label, ic, act) { return '<div class="n-center"><button class="n-opens" data-act="' + act + '">' + icon(ic, 'bi') + label + '</button></div>'; }
  function facts(cells, cols) { return '<div class="n-facts cols' + (cols || 2) + '">' + cells.map(function (c) { return '<span><small>' + c[0] + '</small><b' + (c[2] ? ' class="' + c[2] + '"' : '') + '>' + c[1] + '</b></span>'; }).join('') + '</div>'; }
  function bigAv(cl, size, ring) { return av(cl.c, cl.ini, size, ring || 'trainee', null, cl.pic); }
  function chipDate(d, w, small) { return '<span class="n-dchip' + (small ? ' sm' : '') + '"><b>' + d + '</b><small>' + w + '</small></span>'; }
  function meetingCard2(id, o) {
    var m = MEETINGS[id], cl = client(m.cl); o = o || {};
    var cells = [['שעה', m.time], ['משך', m.dur + ' דקות'], ['פלטפורמה', m.platform]];
    if (m.place) cells.push(['מיקום', m.place]);
    return '<div class="n-card" role="button" tabindex="0" data-act="' + (o.act || 'sheet:tmeeting:' + id) + '"><div class="n-mhead">' + bigAv(cl, 44) + '<span class="name">' + cl.name + '</span>' + chipDate(m.dd, m.mon, true) + '</div>' +
      (o.tags ? '<div class="n-gap12"></div><div class="n-center">' + o.tags + '</div>' : '') +
      '<div class="n-topic">' + m.topic + '</div>' + facts(cells, m.place ? 2 : 3) + '<div class="n-gap16"></div>' + opens('לפרטי הפגישה', 'event-note', o.act || 'sheet:tmeeting:' + id) +
      (m.footer ? '<div class="k-footer">' + icon('repeat', 'bi v-coach') + '<span>' + m.footer + '</span></div>' : '') + '</div>';
  }
  function requestCard2(r) {
    var cells = [['שעה', r.time], ['משך', r.dur + ' דקות'], ['פלטפורמה', r.platform]];
    if (r.place) cells.push(['מיקום', r.place]);
    return '<div class="n-card" role="button" tabindex="0" data-act="' + (r.act || 'sheet:coord') + '"><div class="n-mhead">' + bigAv(r.cl, 44) + '<span class="name">' + r.cl.name + '</span>' + chipDate(dnum(r.off), monOf(r.off), true) + '</div>' +
      '<div class="n-gap12"></div><div class="n-center">' + tag(r.status, r.cls || 'big') + '</div><div class="n-topic">' + r.topic + '</div>' + facts(cells, r.place ? 2 : 3) +
      '<p class="n-month" style="margin:calc(14px * var(--k)) 0 calc(10px * var(--k))">התקבלה: ' + r.received + '</p>' + opens('לפרטי הפגישה', 'event-note', r.act || 'sheet:coord') + '</div>';
  }
  function clientCard(cl, extra, act) {
    var reasons = clientReasons(cl.id);
    var t = reasons.length ? tag(reasons[0] + (reasons.length > 1 ? ' +' + (reasons.length - 1) : '')) : tag('הכל תקין ✓', 'ok');
    return '<div class="n-card" role="button" tabindex="0" data-act="' + (act || 'noop') + '"><div class="n-ctop">' + bigAv(cl, 46) + '<span class="name">' + cl.name + '</span>' + (extra && extra.tag !== undefined ? extra.tag : t) + '</div>' + (extra && extra.body ? extra.body : '') + '</div>';
  }

  /* ── ממשק המאמן ────────────────────────────────────────────────────── */
  var trainer = {
    tabs: [['home', 'home', 'בית'], ['clients', 'people', 'לקוחות'], ['chat', 'chat', "צ'אט"], ['meetings', 'calendar', 'פגישות'], ['payments', 'card', 'תשלום']],
    topbar: function (ph) {
      if (ph.screen === 'profile' || ph.screen === 'thread') return '';        // שכבת-על מסך מלא — בלי סרגל עליון
      return '<span class="k-wm" dir="ltr">' + wordmark() + '</span>' +
        '<button class="k-tbtn" aria-label="התראות">' + icon('bell', 'bi v-coach') + (unreadTotal() || requestsCount() ? '<i class="k-dot"></i>' : '') + '</button>' +
        '<button class="k-tbtn" data-act="flip" aria-label="מעבר לממשק המתאמן">' + icon('swap', 'bi v-system') + '</button>' +
        (ph.screen === 'meetings' ? '<button class="k-tbtn" aria-label="הגדרות">' + icon('settings', 'bi v-system') + '</button>' : '') +
        '<span class="k-me ring-coach pic" aria-hidden="true"><i><svg class="k-face" viewBox="0 0 100 100"><use href="#a-yoav"/></svg></i></span>';
    },
    screens: {
      home: function (ph) {
        var reqRows = [], msgRows = [], needRows = [];
        if (S.ronPending) reqRows.push(personRow(client('ron'), { badge: 'event-ok', badgeVoice: 'v-attention', meta: 'אתמול', lines: [wd(1) + ' ' + dm(1) + ' · <b>08:30</b> · 30 דק׳', 'טלפון · עדכון תוכנית אימונים'], act: 'sheet:coord' }));
        reqRows.push(personRow(client('shira'), { badge: 'event-ok', badgeVoice: 'v-attention', meta: 'אתמול', lines: [wd(5) + ' ' + dm(5) + ' · <b>11:00</b> · 60 דק׳', 'פרונטלי · פגישת היכרות + מדידות'], act: 'mcat:requests' }));
        if (S.traineeRequestSent) reqRows.push(personRow(client('daniel'), { badge: 'event-ok', badgeVoice: 'v-trainee', meta: now(), lines: [wd(2) + ' ' + dm(2) + ' · <b>18:00</b> · 30 דק׳', 'טלפון · עדכון תפריט'], act: 'sheet:coord2' }));
        if (S.unreadByTrainer) msgRows.push(personRow(client('daniel'), { meta: S.chat[S.chat.length - 1].time, count: S.unreadByTrainer, lines: [esc(lastDanielPreview())], clamp: true, act: 'go:thread' }));
        if (S.ronUnread) msgRows.push(personRow(client('ron'), { meta: 'אתמול', count: S.ronUnread, lines: ['תיאום פגישה · ' + (S.ronPending ? 'ממתין לאישורך' : 'אושרה ✓')], clamp: true, act: 'go:chat' }));
        if (danielReasons().length) needRows.push(personRow(client('daniel'), { whys: danielReasons(), act: 'go:profile' }));
        needRows.push(personRow(client('ron'), { whys: clientReasons('ron'), act: 'noop' }));
        var tiles = [];
        if (reqRows.length) tiles.push(['req', reqRows.length, reqRows.length === 1 ? 'בקשה' : 'בקשות']);
        if (msgRows.length) tiles.push(['msg', unreadTotal(), unreadTotal() === 1 ? 'הודעה' : 'הודעות']);
        if (needRows.length) tiles.push(['need', needRows.length, 'נדרש טיפול']);
        var sel = ph.homeTile;
        if (!tiles.some(function (t) { return t[0] === sel; })) sel = tiles.length ? tiles[0][0] : null;
        var card = '';
        if (sel === 'req') card = '<div class="n-ocard"><div class="n-ocard-h">' + icon('inbox', 'bi v-attention') + '<b>בקשות פגישה</b></div><div class="n-rows">' + reqRows.slice(0, 4).join('') + '</div>' + door('inbox', 'לכל הבקשות', 'mcat:requests') + '</div>';
        if (sel === 'msg') card = '<div class="n-ocard"><div class="n-ocard-h">' + icon('chat', 'bi v-trainee') + '<b>הודעות</b></div><div class="n-rows">' + msgRows.join('') + '</div>' + door('chat', "לכל הצ'אטים", 'go:chat') + '</div>';
        if (sel === 'need') card = '<div class="n-ocard"><div class="n-ocard-h">' + icon('priority', 'bi v-attention') + '<b>נדרש טיפול</b></div><div class="n-rows">' + needRows.join('') + '</div>' + door('people', 'לכולם', 'go:clients:needs') + '</div>';
        var up = ['michal', 'yossi', 'daniel'].map(function (k) {
          var m = MEETINGS[k];
          return personRow(client(m.cl), { badge: 'event', badgeVoice: 'v-coach', lines: [m.wd + ' ' + dm(m.off) + ' · <b>' + m.time + '</b> · ' + m.dur + ' דק׳', m.platform + (m.place ? ' · ' + m.place : '')], act: 'sheet:tmeeting:' + k });
        }).join('');
        return '<div class="n-greet"><h2>' + greet() + ', יואב</h2><p>' + (tiles.length ? waitLine() : 'כרגע אף אחד לא מחכה לך') + '</p></div>' +
          (tiles.length ? counter(tiles, sel, 'htile') : '') + card +
          '<h3 class="n-sech">הפגישות הקרובות</h3><div class="n-rest">' + up + door('calendar', 'לכל הפגישות', 'go:meetings') + '</div>';
      },
      clients: function (ph) {
        var needsOnly = !!ph.clientsNeeds, nNeeds = CLIENTS.filter(function (c) { return clientReasons(c.id).length; }).length;
        var list = CLIENTS.filter(function (cl) { return !needsOnly || clientReasons(cl.id).length; }).map(function (cl) {
          var mk = cl.id === 'daniel' ? 'daniel' : cl.id === 'michal' ? 'michal' : cl.id === 'yossi' ? 'yossi' : null, m = mk && MEETINGS[mk];
          var body = m ? '<div class="n-mini"><div class="row">' + chipDate(m.dd, m.wd) + '<span class="col"><small>פגישה קרובה</small><b>' + m.topic + '</b></span></div><i class="sep"></i>' + opens('לפרטי הפגישה', 'event-note', cl.id === 'daniel' ? 'go:profile:connection' : 'sheet:tmeeting:' + mk) + '</div>' : '';
          return clientCard(cl, { body: body }, cl.id === 'daniel' ? 'go:profile' : 'noop');
        }).join('');
        return screenTitle('לקוחות') + '<div class="k-gap8"></div>' + search('חפש לפי שם...') +
          '<div class="n-segrow">' + seg([['needs', 'נדרש טיפול', nNeeds], ['all', 'כולם', CLIENTS.length]], needsOnly ? 'needs' : 'all', 'cseg') + '<button class="n-arch" aria-label="ארכיון">' + icon('archive', 'bi') + '</button></div>' + list;
      },
      profile: function (ph) {
        var cl = client('daniel'), reasons = danielReasons(), tab = ph.profileTab || 'progress';
        var head = '<div class="n-phead"><button class="back" data-act="go:clients" aria-label="חזרה">' + icon('arrow', 'bi') + '</button><b>' + cl.name + '</b><button class="n-edit" data-act="noop">' + icon('edit', 'bi') + 'עריכה</button></div>';
        var hero = '<div class="n-hero"><div class="who">' + bigAv(cl, 92) + facts([['גיל', '28 שנה'], ['גובה', '180 ס"מ'], ['משקל', (S.weightLogged ? '76.5' : '76.8') + ' ק"ג'], ['מאז', cl.since]], 2) + '</div>' +
          '<div class="n-tbox"><div class="pan"><b>מוגדר:</b><span class="it">מזין ארוחות' + icon('check', 'bi') + '</span><span class="it">מזין אימונים' + icon('check', 'bi') + '</span></div>' +
          '<div class="pan"><b>סטטוס:</b><span class="it">' + (reasons.length ? tag('נדרש טיפול') : tag('הכל תקין ✓', 'ok')) + '</span><span class="it"><span class="lbl">תפריט:</span><span class="n-goalpill">חיטוב</span></span></div></div></div>';
        var alert = reasons.length ? '<div class="n-alert">' + reasons.map(function (r) { return '<div class="r"><span>' + r + '</span><button data-act="go:thread">' + "לצ'אט" + icon('chev-l', 'bi') + '</button></div>'; }).join('') + '</div>' : '';
        var tabs = '<div class="n-tabs">' + [['progress', 'מעקב'], ['connection', 'יצירת קשר'], ['payments', 'תשלומים']].map(function (t) { return '<button class="' + (t[0] === tab ? 'on' : '') + '" data-act="ptab:' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
        var body = '';
        if (tab === 'progress') {
          var todayIdx = dayAt(0).getDay();
          var vine = '<div class="n-vine">' + DAYL.map(function (d, i) {
            var g = '';
            if (i < todayIdx) g = ['eat', 'eat', 'eat', i % 3 === 1 ? 'miss' : 'eat', 'eat'].map(function (s) { return '<i class="g ' + s + '">' + (s === 'eat' ? icon('check', 'bi') : '') + '</i>'; }).join('');
            else if (i === todayIdx) { var nextSet = false; g = S.meals.map(function (m) { var s = m.eaten ? 'eat' : (!nextSet ? (nextSet = true, 'next') : 'later'); return '<i class="g ' + s + '">' + (s === 'eat' ? icon('check', 'bi') : '') + '</i>'; }).join(''); }
            else g = '<i class="g fut"></i><i class="g fut"></i><i class="g fut"></i><i class="g fut"></i><i class="g fut"></i>';
            return '<span class="day' + (i === todayIdx ? ' today' : '') + '"><b>' + d + '</b><i class="knot"></i><span class="stem">' + g + '</span></span>';
          }).join('') + '</div>';
          var eatenToday = S.meals.filter(function (m) { return m.eaten; }).length;
          body = '<h3 class="n-psec">תזונה</h3><div class="n-pcard"><div class="first">2000 קלוריות ליום</div>' + vine + '<div class="sum"><b>' + eatenToday + '</b><span>מתוך ' + S.meals.length + ' ארוחות היום</span></div><button class="more" data-act="noop">עוד' + icon('expand', 'bi') + '</button></div>' +
            '<h3 class="n-psec later">משקל</h3><div class="k-infobox">' + chart(WEIGHTS.concat(S.weightLogged ? [76.5] : []), '#F07C1A', 120, WDATES) + rangePicker(['חודש', 'שבועיים', 'שבוע'], 'חודש', 'noop') +
              '<div class="k-curw" role="button" tabindex="0" data-act="noop"><small>משקל נוכחי</small><b>' + (S.weightLogged ? '76.5' : '76.8') + ' ק"ג</b></div>' + secondary('היסטוריית המשקל', 'noop', null, 'history', 'joined') + '</div>' +
            '<h3 class="n-psec later">הערות</h3><div class="k-infobox"><div class="k-noteshead"><small>הערות קבועות</small><button class="k-textlink" data-act="noop">' + icon('edit', 'bi') + 'ערוך</button></div><p class="k-notes">אלרגיה לאגוזים. אימונים ביתיים בלבד. פגישות בטלפון בלבד.</p></div>';
        } else if (tab === 'connection') {
          body = (S.traineeRequestSent ? '<h3 class="n-psec">בקשות</h3>' + requestCard2({ cl: cl, off: 2, status: 'ממתין לאישורך', topic: 'עדכון תפריט', time: '18:00', dur: 30, platform: 'טלפון', received: dm(0) + ' · ' + now(), act: 'sheet:coord2' }) : '') +
            '<h3 class="n-psec">פגישה קרובה</h3>' + meetingCard2('daniel', { tags: S.attendance ? tag('אישר הגעה ✓', 'ok') : '' }) +
            '<h3 class="n-psec later">פגישה חוזרת</h3><div class="k-infobox"><div class="k-row-ic">' + icon('repeat', 'bi v-coach') + '<b>כל שבוע · ' + MEETINGS.danielrec.wd + ' · 10:00 · טלפון</b></div></div>' +
            '<h3 class="n-psec later">תזכורת קצרה</h3><div class="k-infobox"><small class="k-hint center">הערה פרטית שלך על הלקוח. המתאמן לא רואה אותה.</small><p class="k-center">לוודא עדכון משקל לפני הפגישה</p></div>';
        } else {
          body = '<h3 class="n-psec">מבנה תשלום</h3><div class="n-card">' + facts([['סכום תשלום', '800 ₪'], ['מועד התשלום', '15/' + two(dayAt(0).getMonth() + 1) + '/' + dayAt(0).getFullYear()], ['שולם', S.danielPaid ? '800 ₪' : '0 ₪'], ['חוב מחודשים קודמים', '0 ₪']], 2) +
            '<div class="n-gap16"></div><div class="n-center">' + (S.danielPaid ? tag('שולם ✓', 'paid') : tag('טרם שולם', 'quiet')) + '</div>' +
            (S.danielPaid ? '' : '<div class="n-gap16"></div>' + '<button class="n-big coach" data-act="sheet:pay">' + icon('receipt', 'bi') + 'רשום תשלום</button>') + '</div>' +
            secondary('היסטוריית תשלומים (11)', 'noop', null, 'history');
        }
        return '<div class="k-profile">' + head + hero + alert + tabs + '<div class="n-ppanel">' + body + '</div></div>';
      },
      chat: function (ph) {
        var rows = [
          { cl: client('daniel'), pv: lastDanielPreview(), t: S.chat[S.chat.length - 1].time, n: S.unreadByTrainer, online: true, act: 'go:thread' },
          { cl: client('ron'), pv: 'תיאום פגישה · ' + (S.ronPending ? 'ממתין לאישורך' : 'אושרה ✓'), t: 'אתמול', n: S.ronUnread },
          { cl: client('or'), pv: 'סיימתי את האימון של היום, היה קשה 😅', t: 'אתמול', n: 0 },
          { cl: client('michal'), pv: 'אישרתי את הפגישה ליום ' + MEETINGS.michal.wd + ' 👍', t: '09:12', n: 0 },
          { cl: client('shira'), pv: 'תיאום פגישה · הצעת חלופית - ממתין לאישור', t: 'אתמול', n: 0 }
        ];
        var unreadOnly = ph.chatSeg === 'unread', nUnread = rows.filter(function (r) { return r.n; }).length;
        return screenTitle("צ'אט") + '<div class="k-gap8"></div>' + '<div class="n-segrow">' + seg([['all', 'הכל', rows.length], ['unread', 'לא נקראו', nUnread]], unreadOnly ? 'unread' : 'all', 'chatseg') + '</div>' +
          rows.filter(function (r) { return !unreadOnly || r.n; }).map(function (r) {
            return '<div class="n-card n-chatrow" role="button" tabindex="0" data-act="' + (r.act || 'noop') + '"><span class="avw">' + bigAv(r.cl, 46) + (r.online ? '<i class="online"></i>' : '') + '</span><span class="txt"><b>' + r.cl.name + '</b><span>' + esc(r.pv) + '</span></span><span class="meta"><time>' + r.t + '</time>' + (r.n ? '<i class="n-cpill coach">' + r.n + '</i>' : '') + '</span></div>';
          }).join('');
      },
      thread: function (ph) {
        var preset = trainerPresets[ph.presetIdx % trainerPresets.length];
        return '<div class="n-chead"><button class="back" data-act="go:chat" aria-label="חזרה">' + icon('arrow', 'bi') + '</button><button class="who" data-act="go:profile" style="display:flex;align-items:center;gap:calc(12px * var(--k));flex:1">' + av(client('daniel').c, client('daniel').ini, 40, 'trainee', null, 'daniel') + '<span class="col"><b>דניאל כהן</b><small>מחובר עכשיו</small></span></button></div>' +
          '<div class="k-bubbles">' + S.chat.map(function (m) { return bubble(m, 'trainer'); }).join('') + '</div>' +
          '<div class="n-composer"><span class="field"><span>' + esc(preset) + '</span>' + icon('photo', 'bi') + '</span><button class="send" data-act="send:trainer" aria-label="שלח">' + icon('send', 'bi') + '</button></div>';
      },
      meetings: function (ph) {
        var cat = ph.meetCat || 'upcoming', open = !!ph.catOpen;
        var bar = '<div class="n-catwrap">' + catBar([['upcoming', 'event', 'נקבעו'], ['requests', 'inbox', 'בקשות'], ['history', 'history', 'היסטוריה']], cat, 'mcat', open) + '</div>';
        var body = '';
        if (cat === 'upcoming') {
          body = sectionTitle('קרובות — לפי הסדר') + meetingCard2('michal') + meetingCard2('yossi') + meetingCard2('daniel', { tags: S.attendance ? tag('אישר הגעה ✓', 'ok') : '' }) +
            '<div class="k-gap8"></div>' + sectionTitle('פגישות קבועות') + meetingCard2('danielrec');
        } else if (cat === 'requests') {
          var f = ph.reqFilter || 'trainees';
          body = '<div class="n-segrow">' + seg([['trainees', 'בקשות מתאמנים', requestsCount()], ['mine', 'בקשות שלי', 1]], f, 'mseg') + '</div>' +
            (f === 'trainees'
              ? (S.traineeRequestSent ? requestCard2({ cl: client('daniel'), off: 2, status: 'ממתין לאישורך', topic: 'עדכון תפריט', time: '18:00', dur: 30, platform: 'טלפון', received: dm(0) + ' · ' + now(), act: 'sheet:coord2' }) : '') +
                (S.ronPending ? requestCard2({ cl: client('ron'), off: 1, status: 'ממתין לאישורך', topic: 'עדכון תוכנית אימונים', time: '08:30', dur: 30, platform: 'טלפון', received: dm(-1) + ' · 09:40' }) : '') +
                requestCard2({ cl: client('shira'), off: 5, status: 'הצעת חלופית - ממתין לאישורך', topic: 'פגישת היכרות + מדידות ראשוניות', time: '11:00', dur: 60, platform: 'פרונטלי', place: 'הסטודיו, רחוב הרצל 5', received: dm(-1) + ' · 14:20', act: 'noop' })
              : requestCard2({ cl: client('daniel'), off: 3, status: S.proposalApproved ? 'אושרה ✓' : 'ממתין לאישור המתאמן', cls: S.proposalApproved ? 'ok' : 'big', topic: 'בדיקת התקדמות', time: '17:30', dur: 45, platform: 'טלפון', received: dm(0) + ' · 13:55', act: 'noop' }));
        } else {
          body = search('חפש לפי שם...') + meetingCard2('orh', { tags: tag('התקיימה', 'ok'), act: 'noop' }) + meetingCard2('danielh', { tags: tag('התקיימה', 'ok'), act: 'noop' });
        }
        return screenTitle('פגישות') + '<div class="k-gap8"></div>' + bar + body;
      },
      payments: function (ph) {
        var cat = ph.payCat || 'month', open = !!ph.catOpen;
        var bar = '<div class="n-catwrap">' + catBar([['month', 'payments', 'החודש'], ['history', 'history', 'תשלומים אחרונים']], cat, 'pcat', open) + '</div>';
        var due = '15/' + two(dayAt(0).getMonth() + 1) + '/' + dayAt(0).getFullYear();
        var P = {
          or: ['טרם שולם', 'quiet', '800 ₪', '0 ₪', '0 ₪'], daniel: S.danielPaid ? ['שולם ✓', 'paid', '800 ₪', '800 ₪', '0 ₪'] : ['טרם שולם', 'quiet', '800 ₪', '0 ₪', '0 ₪'],
          yossi: ['באיחור', 'bad', '650 ₪', '0 ₪', '650 ₪'], ron: ['טרם שולם', 'quiet', '700 ₪', '0 ₪', '0 ₪'], michal: null, shira: null };
        var body;
        if (cat === 'month') {
          var unpaid = CLIENTS.filter(function (c) { var p = P[c.id]; return p && p[1] !== 'paid'; }).length, onlyUnpaid = ph.paySeg !== 'all';
          body = '<p class="n-month">' + monthYear() + '</p>' + search('חפש לפי שם...') + '<div class="n-segrow">' + seg([['unpaid', 'לא שילמו', unpaid], ['all', 'כולם', CLIENTS.length]], onlyUnpaid ? 'unpaid' : 'all', 'payseg') + '</div>' +
            CLIENTS.filter(function (c) { var p = P[c.id]; return !onlyUnpaid || (p && p[1] !== 'paid'); }).map(function (cl) {
              var p = P[cl.id], act = cl.id === 'daniel' ? 'go:profile:payments' : 'noop';
              if (!p) return clientCard(cl, { tag: tag('לא הוגדר עדיין', 'quiet'), body: '<div class="n-gap16"></div>' + opens('הגדרת תשלום', 'edit', act) }, act);
              return clientCard(cl, { tag: tag(p[0], p[1]), body: '<div class="n-gap16"></div>' + facts([['סכום תשלום', p[2]], ['מועד התשלום', due], ['שולם', p[3]], ['חוב מחודשים קודמים', p[4], p[4] !== '0 ₪' ? 'neg' : '']], 2) + '<div class="n-gap16"></div>' + opens('לתשלומי הלקוח', 'payments', act) }, act);
            }).join('');
        } else {
          body = '<p class="n-month">כל התשלומים שנרשמו, מהאחרון</p>' + search('חפש לפי שם...') +
            (S.danielPaid ? clientCard(client('daniel'), { tag: tag('שולם ✓', 'paid'), body: '<div class="n-gap16"></div>' + facts([['אמצעי תשלום', 'ביט'], ['לאיזה חודש', monthYear()]], 2) }, 'noop') : '') +
            clientCard(client('or'), { tag: tag('שולם ✓', 'paid'), body: '<div class="n-gap16"></div>' + facts([['אמצעי תשלום', 'העברה בנקאית'], ['לאיזה חודש', MONTHS[dayAt(-31).getMonth()] + ' ' + dayAt(-31).getFullYear()]], 2) }, 'noop');
        }
        return screenTitle('תשלומים') + '<div class="k-gap8"></div>' + bar + body;
      }
    }
  };

  /* ── ממשק המתאמן ───────────────────────────────────────────────────── */
  function mealOpenBody(m) {
    var mi = S.meals.indexOf(m);
    var parts = m.groups.map(function (g, gi) {
      var choosable = !g.free && g.items.length > 1, chosen = S.choice[mi + ':' + gi];
      if (!choosable) return '<p class="n-free"><b>' + g.type + ' · </b>' + (g.free ? 'חופשי — כמה שבא לך' + (g.items[0][0] !== 'סלט ירקות' ? ': ' + g.items[0][0] : '') : g.items[0][0] + ' ' + g.items[0][1] + ' גרם') + '</p>';
      var n = g.items.length <= 3 ? g.items.length : 2;
      return '<div class="n-ghead">' + g.type + ' · בחר אחד</div><div class="n-opts' + (chosen !== undefined ? ' picked' : '') + '" style="--n:' + n + '">' + g.items.map(function (it, ii) {
        return '<button class="n-opt' + (chosen === ii ? ' on' : '') + '" data-act="choose:' + mi + ':' + gi + ':' + ii + '">' + (chosen === ii ? icon('check', 'bi ck') : '') + '<b>' + it[0] + '</b><small>' + it[1] + ' גרם</small></button>';
      }).join('') + '</div>';
    }).join('');
    var t = mealMacros(m);
    var macros = '<div class="n-macros">' + [['חלבון', t.p, 'גרם'], ['פחמימה', t.c, 'גרם'], ['שומן', t.f, 'גרם'], ['קלוריות', t.k, '']].map(function (x) { return '<span class="m"><small>' + x[0] + '</small><b>' + x[1] + (x[2] ? ' <i>' + x[2] + '</i>' : '') + '</b></span>'; }).join('') + '</div>';
    return { parts: parts, macros: macros };
  }
  function mealLate(m) { var end = m.time.split('–')[1]; if (!end) return ''; var hm = end.split(':'), d = new Date(), e = new Date(); e.setHours(+hm[0], +hm[1], 0, 0); return d > e ? '<p class="n-late">הזמן המומלץ עבר ב-' + end + ' — אפשר לסמן גם עכשיו.</p>' : ''; }
  function shelf(ic, voice, title, line, act, extra) { return '<button class="n-shelf" data-act="' + act + '"><span class="lead">' + icon(ic, 'bi ' + voice) + '</span><span class="txt"><b>' + title + '</b>' + (line ? '<span>' + line + '</span>' : '') + '</span>' + (extra || '') + icon('expand', 'bi chev') + '</button>'; }

  var trainee = {
    tabs: [['today', 'today', 'בית'], ['nutrition', 'restaurant', 'תזונה'], ['workouts', 'fitness', 'אימונים'], ['meetings', 'calendar', 'פגישות'], ['chat', 'chat', "צ'אט"]],
    topbar: function (ph) {
      if (ph.screen === 'chat' || ph.screen === 'workout') return '';
      return '<span class="k-wm" dir="ltr">' + wordmark() + '</span>' +
        '<button class="k-tbtn" aria-label="התראות">' + icon('bell', 'bi v-trainee') + (S.unreadByTrainee || !S.proposalApproved ? '<i class="k-dot"></i>' : '') + '</button>' +
        '<button class="k-tbtn" data-act="flip" aria-label="מעבר לממשק המאמן">' + icon('swap', 'bi v-system') + '</button>' +
        (/nutrition|workouts|meetings/.test(ph.screen) ? '<button class="k-tbtn" aria-label="הגדרות">' + icon('settings', 'bi v-system') + '</button>' : '') +
        '<span class="k-me ring-trainee pic" aria-hidden="true"><i><svg class="k-face" viewBox="0 0 100 100"><use href="#a-daniel"/></svg></i></span>';
    },
    screens: {
      today: function (ph) {
        var eaten = S.meals.filter(function (m) { return m.eaten; }).length, total = S.meals.length, nm = nextMeal();
        var sel = ph.tTile || 'meals';
        var tiles = [['meals', eaten + '<small>/' + total + '</small>', 'ארוחות היום', null, eaten === total], ['workouts', (S.workoutDone ? 1 : 0) + '<small>/3</small>', 'אימונים השבוע'], ['weight', '<i>ק"ג</i>' + (S.weightLogged ? '76.5' : '76.8'), 'משקל', null, S.weightLogged]];
        var out = '';
        if (S.unreadByTrainee) out += shelf('campaign', 'v-coach', 'הודעה מהמאמן', esc(lastTrainerText()), 'go:chat', '<i class="n-cpill coach">' + S.unreadByTrainee + '</i>');
        // הארוחה
        if (sel === 'meals') {
          if (nm) { var b = mealOpenBody(nm); out += '<div class="n-open"><div class="n-slbl">' + icon('restaurant', 'bi v-coach') + 'הארוחה הבאה</div><div class="n-mrow"><b>' + nm.name + '</b><span class="n-tchip">' + icon('schedule', 'bi v-coach') + nm.time + '</span></div>' + mealLate(nm) + b.parts + '<button class="n-eat" data-act="eatnext">' + icon('check-circle', 'bi') + 'סמן שאכלת</button>' + b.macros + door('restaurant', 'לתפריט המלא', 'go:nutrition') + '</div>'; }
          else out += '<div class="n-open nofoot"><div class="n-slbl">' + icon('restaurant', 'bi v-coach') + 'הארוחות של היום</div><p class="n-late" style="font-size:calc(15px * var(--k));color:var(--ink)">סיימת את כל הארוחות של היום. הארוחה הבאה תהיה מחר.</p>' + door('restaurant', 'לתפריט המלא', 'go:nutrition') + '</div>';
        } else out += shelf('restaurant', 'v-coach', nm ? nm.name : 'הארוחות של היום', nm ? 'הארוחה הבאה · ' + nm.time : 'סיימת את כל הארוחות של היום', 'ttile:meals');
        // האימון
        var woName = S.workoutDone ? 'אימון C – רגליים' : 'אימון A – חזה + כתפיים', woLine = 'המאמן קבע: ' + wd(-1) + ' עד ' + wd(1);
        if (sel === 'workouts') out += '<div class="n-open nofoot"><div class="n-slbl">' + icon('fitness', 'bi v-coach') + 'האימון הבא</div><div class="n-mrow"><b>' + woName + '</b></div><p class="n-late">' + (S.workoutDone ? 'השלמת את האימון היום ✓' : woLine) + '</p><div class="n-gap16"></div>' + (S.workoutDone ? '' : '<button class="n-big" data-act="go:workout">' + icon('play', 'bi') + 'התחל אימון</button>') + '</div>';
        else out += shelf('fitness', 'v-coach', woName, S.workoutDone ? 'השלמת את האימון היום ✓' : woLine, 'ttile:workouts');
        // השקילה
        if (!S.weightLogged) {
          if (sel === 'weight') out += '<div class="n-open nofoot"><div class="n-slbl">' + icon('weight', 'bi v-attention') + 'שקילה</div><div class="n-mrow"><b>מחכה מאתמול</b></div><p class="n-late">המאמן שלך ביקש שקילה פעם בשבוע.</p><div class="n-gap16"></div><button class="n-big" data-act="weight">' + icon('weight', 'bi') + 'הזנת משקל</button></div>';
          else out += shelf('weight', 'v-attention', 'שקילה', 'מחכה מאתמול', 'ttile:weight');
        }
        var prows = '<div class="n-prows">' + [['weight', 'משקל גוף', (S.weightLogged ? '76.5' : '76.8') + ' ק"ג', 'ttile:weight'], ['chart', 'היקפים', 'מותן 83.5 ס"מ', 'go:nutrition'], ['fitness', 'כוח', '+18%', 'go:workouts']].map(function (r) {
          return '<button class="n-prow" data-act="' + r[3] + '">' + icon(r[0], 'bi') + '<b>' + r[1] + '</b><span>' + r[2] + '</span>' + icon('chev-l', 'bi chev') + '</button>';
        }).join('') + '</div>';
        return '<div class="n-greet"><h2>' + greet() + ', דניאל</h2><p>' + waitLine() + '</p></div>' + counter(tiles, sel, 'ttile', true) + out +
          '<h3 class="n-sech" style="margin-top:calc(22px * var(--k))">מעקב התקדמות</h3>' + prows + '<p class="n-fnote">הגרפים נבנים מהנתונים שמוזנים — שלך ושל המאמן. ככל שמזינים יותר, הם ברורים ומדויקים יותר.</p>';
      },
      nutrition: function (ph) {
        var nm = nextMeal(), next;
        if (nm) { var b = mealOpenBody(nm); next = '<div class="n-card" style="padding:calc(16px * var(--k))"><div class="n-mrow" style="margin:0"><b style="font-size:calc(20px * var(--k))">' + nm.name + '</b></div><p class="n-whenl">מתי כדאי לאכול: ' + nm.time + '</p><div class="n-gap8"></div>' + b.parts + '<div class="n-hr"></div>' + b.macros.replace('n-macros', 'n-macros" style="margin-top:0') + '<button class="n-eat" data-act="eatnext" style="margin-top:calc(16px * var(--k))">' + icon('check-circle', 'bi') + 'סמן שאכלת</button></div>'; }
        else next = '<div class="n-card"><div class="k-celebrate"><span class="big">' + icon('check', 'bi') + '</span><b>סיימת את כל הארוחות של היום! הארוחה הבאה תהיה מחר.</b></div></div>';
        var tiles = S.meals.map(function (m, i) {
          var open = ph.openMeal === i;
          return '<div class="k-tile' + (open ? ' open' : '') + '"><button class="head" data-act="xm:' + i + '"><span class="col"><b>' + m.name + '</b><small>' + kcalText(m) + ' · ' + m.time + '</small></span>' + (m.eaten ? icon('check-circle-fill', 'bi v-trainee') : '') + icon('expand', 'bi v-faint chev') + '</button>' +
            (open ? '<div class="body"><i class="k-div"></i>' + sources(m, i) + (m.eaten ? '<div class="k-eatrow"><span class="eaten">' + icon('check-circle-fill', 'bi') + 'נאכל</span><button class="undo" data-act="uneat:' + i + '">הורד סימון</button></div>' : '<button class="k-eatctl" data-act="eat:' + i + '">סמן שאכלת</button>') + '</div>' : '') + '</div>';
        }).join('');
        return screenTitle('תזונה') + '<p class="n-goal">חיטוב · 2000 קלוריות</p>' + sectionTitle('הארוחה הבאה') + next +
          '<div class="k-gap8"></div>' + sectionTitle('היקפים') + pane('measures', ph, 'var_measures') + FOOTNOTE +
          '<div class="k-gap20"></div>' + sectionTitle('התפריט המלא') + '<p class="k-dayname">יום רגיל</p>' + tiles;
      },
      workouts: function (ph) {
        var nextName = S.workoutDone ? 'אימון C – רגליים' : 'אימון A – חזה + כתפיים', nextMin = S.workoutDone ? 62 : 58;
        var next = sectionTitle('האימון הבא') + '<div class="n-card" style="padding:calc(16px * var(--k));margin-bottom:0"><div class="n-wo">' + icon('fitness', 'bi') + '<span><b>' + nextName + '</b><small>לקח ' + nextMin + ' דקות בפעם הקודמת שביצעת אימון זה</small></span></div><div class="n-gap16"></div>' +
          (S.workoutDone ? '<div class="k-donebar">' + icon('check-circle-fill', 'bi v-trainee') + 'השלמת את האימון היום</div>' : '<button class="n-big" data-act="go:workout">' + icon('play', 'bi') + 'התחל אימון</button>') + '</div>';
        var left = 3 - S.aerobic;
        var cardio = '<div class="n-cardio"><span class="ic">' + icon('run', 'bi') + '</span><span class="txt"><b>' + (left ? 'אירובי: נשארו ' + left + ' השבוע' : 'סיימת את האירובי השבוע ✓') + '</b><small>ריצה · 30 דק׳ בכל פעם</small><span class="n-dashes">' + [0, 1, 2].map(function (i) { return '<i' + (i < S.aerobic ? ' class="on"' : '') + '></i>'; }).join('') + '</span></span>' +
          (left ? '<button data-act="sheet:aerobic">סמן שביצעת</button>' : '<button data-act="aerundo" style="background:var(--cardAlt);color:var(--ink)">הורד סימון</button>') + '</div>';
        var WOS = [['אימון A – חזה + כתפיים', '4 תרגילים', S.workoutDone, [['לחיצת חזה במוט', '4 סטים · 8–12 חזרות'], ['לחיצת כתפיים', '4 סטים · 8–12 חזרות'], ['פרפר בכבלים', '3 סטים · 12–15 חזרות'], ['פלאנק', '3 סטים · 45 שנ׳']]],
          ['אימון B – גב + זרועות', '3 תרגילים', true, [['מתח', '4 סטים · 6–10 חזרות'], ['חתירה בהרכנה', '4 סטים · 8–12 חזרות'], ['כפיפת מרפק', '3 סטים · 10–12 חזרות']]],
          ['אימון C – רגליים', '3 תרגילים', false, [['סקוואט', '5 סטים · 6–10 חזרות'], ['לחיצת רגליים', '4 סטים · 10–12 חזרות'], ['כפיפת ברך', '3 סטים · 12–15 חזרות']]]];
        var list = WOS.map(function (w, i) {
          var open = ph.openWo === i;
          return '<div class="k-tile' + (open ? ' open' : '') + '"><button class="head" data-act="xw:' + i + '"><span class="col"><b class="fd">' + w[0] + '</b><small>' + w[1] + '</small></span>' + (w[2] ? '<span class="k-donechip">' + icon('check-circle-fill', 'bi v-trainee') + 'בוצע השבוע</span>' : '') + icon('expand', 'bi v-faint chev') + '</button>' +
            (open ? '<div class="body"><i class="k-div"></i>' + w[3].map(function (e) { return '<div class="k-exrow">' + icon('chev-l', 'bi v-faint') + '<span>' + e[0] + '</span><small>' + e[1] + '</small></div>'; }).join('') + '<div class="k-gap8"></div>' +
              (w[2] ? '<div class="k-donebar">' + icon('check-circle-fill', 'bi v-trainee') + 'בוצע השבוע</div>' : '<button class="n-big" data-act="' + (i === 0 ? 'go:workout' : 'noop') + '">' + icon('play', 'bi') + 'התחל אימון</button>') + '</div>' : '') + '</div>';
        }).join('');
        return screenTitle('אימונים') + '<div class="k-gap12"></div>' + next + cardio + sectionTitle('התקדמות כוח') + pane('strength', ph, 'var_strength') + FOOTNOTE +
          '<div class="k-gap20"></div>' + sectionTitle('האימונים שלי') + list;
      },
      workout: function (ph) {
        return '<div class="k-ahead"><button class="k-iconbtn" data-act="go:workouts" aria-label="חזרה">' + icon('back', 'bi') + '</button><b>אימון A – חזה + כתפיים</b><span class="k-timer">' + icon('timer', 'bi') + '07:12</span></div>' +
          '<div class="k-body16">' + S.exercises.map(function (e, i) {
            return '<div class="k-excard"><b>' + e.name + '</b><small>' + e.sets + '</small>' + (e.prev ? '<span class="prev">פעם קודמת: ' + e.prev + ' ק"ג</span>' : '') +
              '<button class="k-field num' + (ph.focusEx === i ? ' focus' : '') + '" data-act="set:' + i + '" aria-label="משקל"><small>משקל</small><b>' + (e.w === null ? '' : e.w) + '</b><i>ק"ג</i></button></div>';
          }).join('') +
          '<div class="k-note"><small>הערה לעצמי</small><span class="k-fieldbox">כתוב הערה...</span></div><div class="k-note"><small>הערה למאמן</small><span class="k-fieldbox">כתוב הערה...</span></div>' +
          '<button class="n-big" data-act="finish">' + icon('check-circle', 'bi') + 'סיים אימון</button></div>';
      },
      meetings: function (ph) {
        var cat = ph.tMeetCat || 'upcoming', open = !!ph.catOpen;
        var bar = '<div class="n-catwrap">' + catBar([['upcoming', 'event', 'קרובות'], ['history', 'history', 'היסטוריה']], cat, 'ncat', open, 'trainee') + '</div>';
        var banner = S.traineeRequestSent ? card('<div class="k-row-ic top">' + icon('info', 'bi v-coach') + '<span>יש לך כבר בקשת פגישה פתוחה — אפשר לפתוח בקשה חדשה אחרי שהמאמן יענה עליה</span></div>', 'block' + (ph.pulse ? ' pulse' : '')) : '';
        var body;
        if (cat === 'upcoming') {
          var m21 = MEETINGS.daniel, m13 = { off: 3, time: '17:30', dur: 45 };
          var req = (S.proposalApproved ? '' : '<div class="n-card n-req" style="padding:calc(16px * var(--k))">' + tag('ממתין לאישורך', 'big') + '<div class="n-topic" style="margin-top:calc(8px * var(--k))">בדיקת התקדמות</div>' + facts([['תאריך', dmy(m13.off)], ['שעה', m13.time], ['משך', m13.dur + ' דקות'], ['פלטפורמה', 'טלפון']], 2) +
              '<div class="n-gap16"></div>' + opens('לפרטי הפגישה', 'event-note', 'noop') + '<div class="n-acts"><div class="row"><button class="n-ok" data-act="approve">אישור</button><button class="n-no" data-act="noop">דחייה</button></div><button class="n-no" data-act="noop">' + icon('edit-cal', 'bi') + 'הצע פגישה חלופית</button></div></div>') +
            (S.traineeRequestSent ? '<div class="n-card n-req" style="padding:calc(16px * var(--k))">' + tag('ממתין לאישור המאמן', 'big') + '<div class="n-topic" style="margin-top:calc(8px * var(--k))">עדכון תפריט</div>' + facts([['תאריך', dmy(2)], ['שעה', '18:00'], ['משך', '30 דקות'], ['פלטפורמה', 'טלפון']], 2) + '<div class="n-gap16"></div>' + opens('לפרטי הפגישה', 'event-note', 'noop') + '<div class="n-acts"><button class="n-no" data-act="noop">' + icon('close', 'bi') + 'בטל</button></div></div>' : '');
          var soon = function (topic, off, time, dur) { return '<div class="n-soon" role="button" tabindex="0" data-act="sheet:meeting"><div class="n-topic" style="margin:0">' + topic + '</div>' + facts([['תאריך', dmy(off)], ['שעה', time], ['משך', dur + ' דקות'], ['פלטפורמה', 'טלפון']], 2) + (S.attendance ? '<p class="k-center good">אישרת שאתה מגיע ✓</p>' : '') + '<div class="n-gap16"></div>' + opens('לפרטי הפגישה', 'event-note', 'sheet:meeting') + '</div>'; };
          body = banner + (req ? sectionTitle('בקשות פתוחות') + req : '') + sectionTitle('הפגישה הקרובה') +
            (S.proposalApproved ? soon('בדיקת התקדמות', m13.off, m13.time, m13.dur) : soon(m21.topic, m21.off, m21.time, m21.dur)) +
            '<div class="k-gap20"></div>' + sectionTitle('פגישה קבועה') + '<div class="n-card" style="padding:calc(16px * var(--k))"><div class="n-topic" style="margin:0">פגישת מעקב</div>' + facts([['יום', MEETINGS.danielrec.wd], ['שעה', '10:00'], ['משך', '30 דקות'], ['פלטפורמה', 'טלפון']], 2) + '<div class="n-gap12"></div><p class="k-center muted">פגישה קבועה, כל שבוע. יש עוד 8 כאלה ביומן שלך.</p></div>';
        } else {
          body = banner + '<div class="n-card" style="padding:calc(16px * var(--k))"><div class="n-center">' + tag('התקיימה', 'ok') + '</div><div class="n-topic">מדידות + עדכון תפריט</div>' + facts([['תאריך', dmy(-17)], ['שעה', '10:00'], ['משך', '60 דקות'], ['פלטפורמה', 'טלפון']], 2) + '</div>';
        }
        return screenTitle('פגישות') + '<div class="k-gap8"></div>' + bar + body;
      },
      chat: function (ph) {
        var preset = traineePresets[ph.presetIdx % traineePresets.length];
        return '<button class="n-chead" data-act="noopcoach"><span class="k-av ring-coach pic" style="--s:44px"><i class="av-green"><svg class="k-face" viewBox="0 0 100 100"><use href="#a-yoav"/></svg></i></span><span class="col"><b>יואב</b><small>שיחה ישירה עם המאמן</small></span></button>' +
          '<div class="k-bubbles' + (ph.typing ? '' : ' navpad') + '">' + S.chat.map(function (m) { return bubble(m, 'trainee'); }).join('') + '</div>' +
          (ph.typing ? '<div class="n-composer"><span class="field"><span>' + esc(preset) + '</span>' + icon('photo', 'bi') + '</span><button class="send v-trainee" data-act="send:trainee" aria-label="שלח">' + icon('send', 'bi') + '</button><button class="apps" data-act="typingoff" aria-label="הצג ניווט">' + icon('apps', 'bi') + '</button></div>' : '');
      }
    }
  };

  function bubble(m, viewer) {
    var mine = m.from === viewer;
    if (m.card) {
      var st = S.proposalApproved ? ['אושרה ✓', 'ok'] : viewer === 'trainer' ? ['ממתין לאישור המתאמן', 'big'] : ['ממתין לאישורך', 'big'];
      var actions = '';
      if (viewer === 'trainee' && !S.proposalApproved) actions = '<div class="n-acts"><div class="row"><button class="n-ok" data-act="approve">אישור</button><button class="n-no" data-act="noop">דחייה</button></div><button class="n-no" data-act="noop">' + icon('edit-cal', 'bi') + 'הצע פגישה חלופית</button></div>';
      else if (S.proposalApproved && !S.calendarSynced) actions = '<div class="n-acts"><button class="n-no' + (viewer === 'trainer' ? ' coach' : '') + '" data-act="calsync">' + icon('calendar-today', 'bi') + 'הוסף ליומן</button></div>';
      return '<div class="k-bub cardwrap ' + (mine ? 'mine' : 'theirs') + ' from-' + m.from + '"><div class="n-coord"><div class="t">' + icon('event', 'bi') + 'תיאום פגישה</div><div class="n-topic">בדיקת התקדמות</div><div class="n-gap8"></div><div class="n-center">' + tag(st[0], st[1]) + '</div>' +
        facts([['תאריך', dmy(3)], ['שעה', '17:30'], ['משך', '45 דקות'], ['פלטפורמה', 'טלפון']], 2) + actions + '<small class="stamp">' + m.time + '</small></div></div>';
    }
    var tick = m.from === 'trainee' ? '<span class="tick">' + icon('check', 'bi') + '</span>' : '';
    return '<div class="k-bub ' + (mine ? 'mine' : 'theirs') + ' from-' + m.from + '"><span>' + esc(m.text) + '</span><time>' + (m.from === 'trainee' ? '<span class="tick">' + m.time + icon('check', 'bi') + '</span>' : m.time) + '</time></div>';
  }
  function wordmark() {
    return '<b class="fit">FIT</b><svg class="o" viewBox="0 0 100 100" aria-hidden="true"><path d="M47 9.61A40.5 40.5 0 0 0 47 90.39L47 73.31A23.5 23.5 0 0 1 47 26.69Z" fill="#F07C1A"/><path d="M53 9.61A40.5 40.5 0 0 1 53 90.39L53 73.31A23.5 23.5 0 0 0 53 26.69Z" fill="#12939D"/></svg><b class="polis">POLIS</b>';
  }
  function navHtml(app, ph) {
    return app.tabs.map(function (t) {
      var on = ph.screen === t[0] || (ph.side === 'trainer' && ph.screen === 'thread' && t[0] === 'chat') || (ph.side === 'trainer' && ph.screen === 'profile' && t[0] === 'clients');
      var badge = (ph.side === 'trainee' && t[0] === 'chat' && S.unreadByTrainee) ? '<i class="k-tabbadge">' + S.unreadByTrainee + '</i>' : '';
      return '<button class="dp-tab' + (on ? ' is-on' : '') + '" role="tab" aria-selected="' + on + '"' + (on || ph.navOpen ? '' : ' tabindex="-1" aria-hidden="true"') + ' data-act="tab:' + t[0] + '"><span class="ico">' + icon(t[1]) + badge + '</span><b>' + t[2] + '</b></button>';
    }).join('');
  }

  /* ── FAB ליד הבר ───────────────────────────────────────────────────── */
  function fabSpec(ph) {
    var t = ph.screen;
    if (ph.side === 'trainer') {
      if (t === 'home' || t === 'profile' || t === 'thread') return null;
      if (t === 'meetings') return { icon: 'plus', cls: 'v-coach', act: 'sheet:newMeeting', label: 'פגישה חדשה' };
      if (t === 'chat') return { icon: 'plus', cls: 'v-coach', act: 'sheet:newChat', label: 'שיחה חדשה' };
      return { icon: 'plus', cls: 'v-coach', act: 'sheet:addClient', label: 'הוסף לקוח' };
    }
    if (t === 'workout') return null;
    if (t === 'chat') return ph.typing ? null : { icon: 'keyboard', cls: 'small', act: 'typing', label: 'מצב הקלדה' };
    if (t === 'today') {
      if (!S.weightLogged) return { icon: 'weight', cls: 'v-trainee', act: 'weight', label: 'הזנת משקל' };
      if (nextMeal()) return { icon: 'check', cls: 'v-trainee', act: 'eatnext', label: 'סמן שאכלת' };
      return null;
    }
    if (t === 'nutrition') return nextMeal() ? { icon: 'check', cls: 'v-trainee', act: 'eatnext', label: 'סמן שאכלת' } : { icon: 'minus', cls: 'v-trainee', act: 'uneatlast', label: 'הורד סימון' };
    if (t === 'workouts') return S.workoutDone ? null : { icon: 'play', cls: 'v-trainee', act: 'go:workout', label: 'התחל אימון' };
    if (t === 'meetings') return S.traineeRequestSent ? { icon: 'event-note', cls: 'v-trainee disabled', act: 'pulse', label: 'בקשת פגישה — חסום' } : { icon: 'event-note', cls: 'v-trainee', act: 'sheet:request', label: 'בקשת פגישה' };
    return null;
  }

  /* ── גיליונות ──────────────────────────────────────────────────────── */
  function formSheet(title, body, centered) {
    return '<div class="k-form' + (centered ? ' center' : '') + '"><i class="handle"></i><div class="ttl"><b>' + title + '</b><button class="x" data-act="sheetclose" aria-label="סגור">' + icon('close', 'bi') + '</button></div><i class="k-div"></i><div class="fbody">' + body + '</div></div>';
  }
  function labeled(label, value, ph) { return '<div class="k-labeled"><small>' + label + '</small><span class="k-fieldbox' + (value ? '' : ' ph') + '">' + (value || ph) + '</span></div>'; }
  function pickerRow(title, value, ic) { return '<div class="k-picker"><span class="col"><b>' + title + '</b><small>' + value + '</small></span>' + icon(ic, 'bi v-muted') + '</div>'; }
  function confirmCheck(title, detail) { return '<div class="k-confirm"><span class="ring">' + icon('check', 'bi') + '</span><b>' + title + '</b>' + (detail ? '<small>' + detail + '</small>' : '') + '</div>'; }
  function sheetHtml(kind, ph) {
    if (kind === 'weight') return formSheet('הזנת משקל', ph.saved ? confirmCheck('המשקל נשמר', '76.5 ק"ג') + '<p class="k-hint center">אפשר לערוך את המשקל של היום עד סוף היום — בהיסטוריית המשקל, דרך החשבון שלי</p>'
      : '<div class="k-explain"><b>המאמן שלך ביקש שקילה פעם בשבוע</b><small>עדכן את המשקל שלך פעם בשבוע כדי שהמעקב יהיה מדויק</small><small>אפשר לערוך את המשקל של היום עד סוף היום — בהיסטוריית המשקל, דרך החשבון שלי</small></div>' +
        '<div class="k-field wide"><small>משקל (ק"ג)</small><b dir="ltr">76.5</b><i>ק"ג</i></div>' + primary('שמור', 'weightsave', 'trainee'), true);
    if (kind === 'request') return formSheet('בקשת פגישה', ph.saved ? confirmCheck('הבקשה נשלחה למאמן', '')
      : pickerRow('תאריך', '16/09/2026', 'calendar-today') + '<div class="k-avail">' + icon('event-busy', 'bi v-coach') + '<b>אפשר לבחור רק ימים שהמאמן הגדיר בהם זמינות — שאר הימים חסומים בלוח.</b></div>' + pickerRow('שעה', '18:00', 'schedule') +
        labeled('נושא (חובה)', 'עדכון תפריט', 'על מה תרצה לדבר?') + '<div class="k-two">' + labeled('פלטפורמה', 'טלפון', '') + labeled('משך הפגישה', '30 דקות', '') + '</div>' + primary('שלח בקשה', 'requestsend', 'trainee'));
    if (kind === 'aerobic') return '<div class="k-detsheet bg"><b class="ttl">כמה עשית?</b>' + labeled('אירובי', '30 דק׳', '') + primary('סמן שביצעת', 'aerosave', 'ink') + '</div>';
    if (kind === 'meeting') return '<div class="k-detsheet"><b class="ttl">פרטי הפגישה</b>' + heading('בדיקת התקדמות + עדכון תפריט') + factPair(inline('תאריך', '21/09/2026'), inline('שעה', '10:00')) + factPair(inline('משך', '60 דקות'), inline('פלטפורמה', 'טלפון')) +
      '<div class="k-calrow">' + icon(S.calendarSynced ? 'event-ok' : 'event-busy', 'bi ' + (S.calendarSynced ? 'v-positive' : 'v-negative')) + inline('יומן', S.calendarSynced ? 'מסונכרן ✓' : 'לא מסונכרן') + '</div>' + (S.calendarSynced ? '' : secondary('הוסף ליומן', 'calsync', 'trainee', 'calendar-today')) +
      (S.attendance ? '<p class="k-center good">אישרת שאתה מגיע ✓</p><div class="k-attend"><button class="k-textbtn muted" data-act="unconfirm">' + icon('undo', 'bi') + 'ביטול האישור</button></div>' : '<div class="k-attend"><button class="k-textbtn good" data-act="confirm">' + icon('check-circle', 'bi') + 'אני בוודאות מגיע</button><button class="k-textbtn bad" data-act="sheetclose">' + icon('event-busy', 'bi') + 'לא אוכל להגיע</button></div>') +
      timeline([['coach', 'event', 'התיאום נפתח ע"י המאמן', '26/08/2026 · 14:02'], ['trainee', 'check-circle', 'אושרה ע"י המתאמן', '26/08/2026 · 18:40']].concat(S.attendance ? [['trainee', 'check-circle', 'המתאמן אישר סופית הגעה', 'היום · ' + now()]] : [])) + '</div>';
    if (kind === 'tmeeting') {
      var m = MEETINGS[ph.sheetArg] || MEETINGS.michal;
      return '<div class="k-detsheet">' + heading(m.topic) + factPair(inline('תאריך', m.date), inline('שעה', m.time)) + factPair(inline('משך', m.dur + ' דקות'), inline('פלטפורמה', m.platform)) + (m.place ? '<div class="k-center">' + inline('מיקום', m.place) + '</div>' : '') +
        (m.past ? '' : '<i class="k-div"></i><div class="k-calrow">' + icon(m.synced ? 'event-ok' : 'event-busy', 'bi ' + (m.synced ? 'v-positive' : 'v-negative')) + inline('יומן', m.synced ? 'מסונכרן ✓' : 'לא מסונכרן') + '</div>' + (m.synced ? '' : secondary('הוסף ליומן', 'sheetdone:הפגישה נוספה ליומן', null, 'calendar-today')) +
          '<i class="k-div"></i>' + primary('פתח פרופיל ←', m.cl === 'daniel' ? 'go:profile:connection' : 'noop', 'coach') + '<button class="k-secondary v-negative" data-act="sheetclose">' + icon('event-busy', 'bi') + 'בטל פגישה</button>') +
        '<i class="k-div"></i><p class="k-center muted">הפגישה נקבעה ישירות — לא קדמה לה בקשה</p></div>';
    }
    if (kind === 'coord') return '<div class="k-detsheet"><b class="ttl">פרטי תיאום</b>' + heading('עדכון תוכנית אימונים') + '<div class="k-tags">' + statusTag('ממתין לאישורך', 'coach') + '</div>' + factPair(inline('תאריך', '17/09/2026'), inline('שעה', '08:30')) + factPair(inline('משך', '30 דקות'), inline('פלטפורמה', 'טלפון')) +
      '<p class="k-center muted">נפתח על ידי: רון גולדברג ב-08/09/2026</p><div class="k-actions"><div class="row">' + primary('אישור', 'ronapprove', 'coach') + secondary('דחייה', 'sheetclose') + '</div>' + secondary('הצע פגישה חלופית', 'sheetclose', null, 'edit-cal') + secondary("לצ'אט", 'sheetclose', null, 'chat') + '</div>' +
      timeline([['trainee', 'event', 'התיאום נפתח ע"י המתאמן', '08/09/2026 · 09:40']]) + '</div>';
    if (kind === 'coord2') return '<div class="k-detsheet"><b class="ttl">פרטי תיאום</b>' + heading('עדכון תפריט') + '<div class="k-tags">' + statusTag('ממתין לאישורך', 'coach') + '</div>' + factPair(inline('תאריך', '16/09/2026'), inline('שעה', '18:00')) + factPair(inline('משך', '30 דקות'), inline('פלטפורמה', 'טלפון')) +
      '<p class="k-center muted">נפתח על ידי: דניאל כהן ב-09/09/2026</p><div class="k-actions"><div class="row">' + primary('אישור', 'sheetdone:הפגישה אושרה ✓', 'coach') + secondary('דחייה', 'sheetclose') + '</div>' + secondary('הצע פגישה חלופית', 'sheetclose', null, 'edit-cal') + secondary("לצ'אט", 'go:thread', null, 'chat') + '</div>' +
      timeline([['trainee', 'event', 'התיאום נפתח ע"י המתאמן', '09/09/2026 · ' + now()]]) + '</div>';
    if (kind === 'addClient') return formSheet('הוספת לקוח חדש', labeled('שם מלא', 'נועה ברק', '') + labeled('תאריך תחילת ליווי', '09/09/2026', '') + primary('שמירה', 'sheetdone:נועה נוספה — עכשיו עורך הלקוח', 'coach'));
    if (kind === 'newMeeting') return formSheet('שליחת הצעת פגישה', '<p class="k-lblp">בחר לקוח:</p>' + CLIENTS.map(function (cl) { return '<button class="k-pick" data-act="sheetdone:ההצעה נשלחה ל' + cl.name.split(' ')[0] + '">' + cav(cl, 40, 'trainee') + '<b>' + cl.name + '</b>' + icon('chev-l', 'bi v-faint') + '</button>'; }).join(''));
    if (kind === 'newChat') return formSheet('שיחה חדשה', '<p class="k-lblp">בחר לקוח:</p><button class="k-pick" data-act="sheetdone:נפתחה שיחה עם יוסי">' + cav(client('yossi'), 40, 'trainee') + '<b>יוסי מזרחי</b>' + icon('chev-l', 'bi v-faint') + '</button>');
    if (kind === 'pay') return formSheet('רישום תשלום חדש', labeled('אמצעי תשלום', 'ביט', '') + labeled('לאיזה חודש', 'ספטמבר 2026 (החודש)', '') + labeled('תאריך תשלום (אופציונלי)', '09/09/2026', '') + primary('שמור', 'paysave', 'coach'));
    return '';
  }

  /* ── רינדור ──────────────────────────────────────────────────────── */
  var phones = [];
  function render(ph) {
    var app = ph.side === 'trainer' ? trainer : trainee;
    var f0 = fabSpec(ph), sig = ph.side + '|' + ph.screen + '|' + (ph.navOpen ? 1 : 0) + '|' + (f0 ? f0.cls : '-') + '|' + (ph.typing ? 1 : 0);
    var before = sig === ph._navSig ? null : flipStart(ph);   // נמדד כאן, כשהפריסה הישנה עדיין תקפה — אחרי כתיבת העמוד זו מדידה יקרה
    ph._navSig = sig;
    var screenFn = app.screens[ph.screen] || app.screens[app.tabs[0][0]];
    var top = app.topbar(ph);
    if (ph._top !== top) { ph.topbar.innerHTML = top; ph._top = top; }
    ph.topbar.hidden = !top;
    var full = ph.screen === 'chat' && ph.side === 'trainee' || ph.screen === 'thread' || ph.screen === 'workout' || ph.screen === 'profile';
    var page = '<div class="k-page' + (full ? ' full' : '') + (ph.side === 'trainer' ? ' trainer' : '') + '">' + screenFn(ph) + '</div>';
    if (ph._page !== page) { ph.stage.innerHTML = page; ph._page = page; ph.stage.scrollTop = ph.scrollTop || 0; }   // כתיבה ל-DOM רק כשמשהו השתנה — הלחיצה הראשונה על טאב רק פותחת את הבר
    syncNav(ph, app, before);
    var sHtml = ph.sheetKind ? sheetHtml(ph.sheetKind, ph) : '';
    ph.sheet.hidden = !ph.sheetKind;
    if (ph._sheet !== sHtml) { ph.sheet.innerHTML = sHtml; ph._sheet = sHtml; }   // גיליון פתוח לא נכנס מחדש בכל נגיעה
    var scls = 'dp-sheet' + (ph.sheetKind ? ' kind-' + ph.sheetKind : '');
    if (ph.sheet.className !== scls) ph.sheet.className = scls;
    if (ph.hint) { toast(ph, ph.hint); ph.hint = null; }
    if (ph.pulse) { clearTimeout(ph.pulseT); ph.pulseT = setTimeout(function () { ph.pulse = false; ph._page = null; var b = ph.stage.querySelector('.k-card.block'); if (b) b.classList.remove('pulse'); }, 1100); }
    var lab = ph.root.parentNode.querySelector('.flip-btn');
    if (lab) lab.querySelector('span').textContent = ph.side === 'trainer' ? 'לממשק המתאמן' : 'לממשק המאמן';
    ph.root.setAttribute('data-side', ph.side);
    ph.root.setAttribute('aria-label', 'הדגמה אינטראקטיבית של ' + (ph.side === 'trainer' ? 'ממשק המאמן' : 'ממשק המתאמן') + ' — כל כפתור לחיץ');
    syncMore(ph);
  }
  // הכפתור מופיע רק כשבאמת יש עוד מה לראות, ומתהפך לחזרה למעלה בסוף המסך
  function syncMore(ph) {
    if (!ph.more || !coarse) return;
    var el = ph.stage, max = el.scrollHeight - el.clientHeight;
    var show = max > 24 && !ph.root.classList.contains('is-idle');
    if (ph.more.hidden === show) ph.more.hidden = !show;
    if (show) {
      var up = el.scrollTop > max - 24;
      ph.more.classList.toggle('up', up);
      var lab = ph.more.querySelector('span'), t = up ? 'חזרה למעלה' : 'גלילה במסך';
      if (lab && lab.textContent !== t) lab.textContent = t;
    }
  }
  function renderAll() { phones.forEach(render); }
  // הבר וה-FAB הם צמתים קבועים: מעדכנים מחלקות במקום לבנות מחדש, כדי שמעברי ה-CSS (גלולה, שקיפות הטאבים, הכפתור) ירוצו
  function tabOn(ph, id) { return ph.screen === id || (ph.side === 'trainer' && ph.screen === 'thread' && id === 'chat') || (ph.side === 'trainer' && ph.screen === 'profile' && id === 'clients'); }
  // הגלולה משנה רוחב וגובה כשהיא עוברת טאב, וזה מזיז את כל האייקונים שאחריה. מעבר CSS על
  // width/padding היה מחשב פריסה מחדש בכל פריים — וזה מה שריצד. במקום זה: מודדים לפני, נותנים
  // לפריסה לנחות מיד, מודדים אחרי, ומנפישים את ההפרש ב-translate — תנועה שלא נוגעת בפריסה בכלל.
  function flipStart(ph) {
    if (reduceMotion || ph.root.classList.contains('no-anim') || !ph.nav.animate) return null;
    var els = [ph.nav].concat([].slice.call(ph.nav.children));          // גם הבר עצמו: החלפת ה-FAB מזיזה אותו בתוך העטיפה
    var fab = ph.navwrap.querySelector('.dp-fab:not(.is-gone)');
    if (fab) els.push(fab);
    return els.map(function (el) { return [el, el.offsetLeft, el.offsetTop]; });
  }
  function flipEnd(before) {
    if (!before) return;
    for (var i = 0; i < before.length; i++) {
      var el = before[i][0], dx = before[i][1] - el.offsetLeft, dy = before[i][2] - el.offsetTop;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      if (!el.isConnected) continue;                                    // ה-FAB הישן כבר הוסר
      el.animate([{ translate: dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px' }, { translate: '0px 0px' }],
        { duration: 320, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
    }
  }
  function syncNav(ph, app, before) {
    var rebuild = ph.nav.getAttribute('data-side') !== ph.side || ph.nav.children.length !== app.tabs.length;
    if (rebuild) before = null;
    if (rebuild) { ph.nav.innerHTML = navHtml(app, ph); ph.nav.setAttribute('data-side', ph.side); }
    else app.tabs.forEach(function (t, i) {
      var el = ph.nav.children[i], on = tabOn(ph, t[0]), reach = on || ph.navOpen;
      el.classList.toggle('is-on', on);
      if (el.getAttribute('aria-selected') !== String(on)) el.setAttribute('aria-selected', on);   // כתיבה של אותו ערך היא עדיין שינוי DOM
      if (reach) { if (el.hasAttribute('tabindex')) { el.removeAttribute('tabindex'); el.removeAttribute('aria-hidden'); } }
      else if (!el.hasAttribute('tabindex')) { el.setAttribute('tabindex', '-1'); el.setAttribute('aria-hidden', 'true'); }
      var n = (ph.side === 'trainee' && t[0] === 'chat') ? S.unreadByTrainee : 0, b = el.querySelector('.k-tabbadge');
      if (n && !b) el.querySelector('.ico').insertAdjacentHTML('beforeend', '<i class="k-tabbadge">' + n + '</i>');
      else if (n && b) b.textContent = n;
      else if (!n && b) b.remove();
    });
    ph.nav.classList.toggle('is-open', !!ph.navOpen);
    var fab = fabSpec(ph), el = ph.navwrap.querySelector('.dp-fab:not(.is-gone)');
    if (fab) {
      if (!el) {
        ph.navwrap.insertAdjacentHTML('beforeend', '<button class="dp-fab ' + fab.cls + ' is-new" data-act="' + fab.act + '" aria-label="' + fab.label + '" title="' + fab.label + '">' + icon(fab.icon, 'bi') + '</button>');
        var nel = ph.navwrap.lastElementChild; requestAnimationFrame(function () { requestAnimationFrame(function () { nel.classList.remove('is-new'); }); });
      } else {
        el.className = 'dp-fab ' + fab.cls; el.setAttribute('data-act', fab.act); el.setAttribute('aria-label', fab.label); el.setAttribute('title', fab.label);
        var use = el.querySelector('use'); if (use && use.getAttribute('href') !== '#i-' + fab.icon) use.setAttribute('href', '#i-' + fab.icon);
      }
    } else if (el) { el.classList.add('is-gone'); el.removeAttribute('data-act'); setTimeout(function () { el.remove(); }, 280); }
    ph.navwrap.classList.toggle('is-open', !!ph.navOpen);
    ph.navwrap.classList.toggle('is-hidden', (ph.side === 'trainee' && ph.screen === 'chat' && !!ph.typing) || ph.screen === 'workout' || ph.screen === 'thread' || ph.screen === 'profile');
    fitNav(ph);
    flipEnd(before);                                                    // בסוף — אחרי שהפריסה הסופית כבר ידועה
  }
  // רינדור בלי מעברים (לידה, והחלפת הצד באמצע הסיבוב) — המצב החדש מופיע כבר במקומו, בלי שהגלולה תזחל בזמן שהטלפון מסתובב
  function quiet(ph, fn) {
    ph.root.classList.add('no-anim'); fn(); void ph.root.offsetWidth;
    var free = function () { ph.root.classList.remove('no-anim'); };
    clearTimeout(ph.animT); ph.animT = setTimeout(free, 250);                       // רשת ביטחון: rAF מווסת בלשונית ברקע
    requestAnimationFrame(function () { requestAnimationFrame(function () { clearTimeout(ph.animT); free(); }); });
  }
  function toast(ph, t) {
    ph.toast.textContent = t; ph.toast.classList.add('show');
    clearTimeout(ph.toastT); ph.toastT = setTimeout(function () { ph.toast.classList.remove('show'); }, 2000);
  }
  // רוחב הטאב הפעיל נמצא באמצע מעבר ברגע המדידה, אז מודדים שיבוט סמוי של הבר שכבר יושב במצב היעד.
  // הגאומטריה תלויה רק בצד ובטאב הפעיל — פתיחת הבר לא משנה אותה — ולכן מדידה זהה לא נעשית פעמיים.
  function fitNav(ph, force) {
    var on0 = ph.nav.querySelector('.dp-tab.is-on');
    var key = ph.side + '|' + (on0 ? on0.getAttribute('data-act') : '-') + '|' + ph.nav.offsetWidth;
    if (!force && ph._navKey === key) return;
    ph._navKey = key;
    var nav = ph.nav, c = nav.cloneNode(true);
    c.classList.add('measure'); c.removeAttribute('role');
    ph.navwrap.appendChild(c);
    var on = c.querySelector('.dp-tab.is-on'), navW = c.offsetWidth, pad = 5;
    if (on && navW && on.offsetWidth) {
      var tW = on.offsetWidth, tL = on.offsetParent === c ? on.offsetLeft + c.clientLeft : on.offsetLeft - c.offsetLeft;
      var left = Math.max(0, tL - pad), right = Math.max(0, navW - (tL + tW) - pad);
      nav.style.setProperty('--clip', 'inset(0 ' + right.toFixed(1) + 'px 0 ' + left.toFixed(1) + 'px round 24px)');
      nav.style.setProperty('--shift', 'translateX(' + (navW / 2 - (tL + tW / 2)).toFixed(1) + 'px)');
      ph.navwrap.style.setProperty('--fabx', ((navW - (tW + 2 * pad)) / 2).toFixed(1) + 'px');
    }
    c.remove();
  }

  /* ── פעולות ───────────────────────────────────────────────────────── */
  function act(ph, a) {
    var p = a.split(':');
    if (p[0] === 'start') { startAll(ph); return; }
    if (p[0] === 'noop') { ph.hint = 'בדמו הזה זה עוצר כאן — באפליקציה זה ממשיך'; }
    else if (p[0] === 'noopcoach') { ph.hint = 'באפליקציה נפתח כאן דף המאמן'; }
    else if (p[0] === 'go') {
      ph.screen = p[1]; ph.scrollTop = 0; ph.navOpen = false; ph.catOpen = false;
      if (p[1] === 'profile' && p[2]) ph.profileTab = p[2];
      if (p[1] === 'clients') ph.clientsNeeds = p[2] === 'needs';
      if (p[1] === 'thread') S.unreadByTrainer = 0;
      if (ph.side === 'trainee' && p[1] === 'chat') S.unreadByTrainee = 0;
    }
    else if (p[0] === 'tab') { if (!ph.navOpen && !reduceMotion) { ph.navOpen = true; render(ph); return; } ph.navOpen = false; if (ph.side === 'trainee' && p[1] === 'chat') ph.typing = false; act(ph, 'go:' + p[1]); return; }
    else if (p[0] === 'flip') { flip(ph); return; }
    else if (p[0] === 'send') {
      var isTrainer = p[1] === 'trainer';
      var txt = (isTrainer ? trainerPresets : traineePresets)[ph.presetIdx % 3]; ph.presetIdx++;
      S.chat.push({ from: isTrainer ? 'trainer' : 'trainee', text: txt, time: now() });
      if (isTrainer) S.unreadByTrainee++; else S.unreadByTrainer++;
      ph.scrollTop = 9999;
    }
    else if (p[0] === 'eat') { S.meals[+p[1]].eaten = true; ph.split = true; }
    else if (p[0] === 'uneat') { S.meals[+p[1]].eaten = false; }
    else if (p[0] === 'eatnext') { var nm = nextMeal(); if (nm) { nm.eaten = true; ph.split = true; } }
    else if (p[0] === 'uneatlast') { var le = lastEaten(); if (le) le.eaten = false; }
    else if (p[0] === 'choose') { var key = p[1] + ':' + p[2]; S.choice[key] = S.choice[key] === +p[3] ? undefined : +p[3]; }
    else if (p[0] === 'xm') { ph.openMeal = ph.openMeal === +p[1] ? -1 : +p[1]; }
    else if (p[0] === 'xw') { ph.openWo = ph.openWo === +p[1] ? -1 : +p[1]; }
    else if (p[0] === 'xp') { if (p[1] === 'wo') ph.openPwo = !ph.openPwo; else if (p[1] === 'me') ph.openMe = !ph.openMe; else ph.hint = 'טאב התזונה נשאר פתוח בדמו'; }
    else if (p[0] === 'cfilter') { ph.clientsNeeds = !ph.clientsNeeds; ph.scrollTop = 0; }
    else if (p[0] === 'htile') { ph.homeTile = p[1]; }                                   // מסך הבית של המאמן: איזה מונה פתוח
    else if (p[0] === 'ttile') { ph.tTile = p[1]; if (ph.screen !== 'today') { ph.screen = 'today'; ph.scrollTop = 0; } }   // ושל המתאמן
    else if (p[0] === 'cseg') { ph.clientsNeeds = p[1] === 'needs'; ph.scrollTop = 0; }
    else if (p[0] === 'chatseg') { ph.chatSeg = p[1]; }
    else if (p[0] === 'mseg') { ph.reqFilter = p[1]; }
    else if (p[0] === 'payseg') { ph.paySeg = p[1]; }
    else if (p[0] === 'set') { var e = S.exercises[+p[1]]; e.w = (e.w === e.prev || e.w === null) ? (e.prev ? e.prev + 2.5 : 0) : e.prev; ph.focusEx = +p[1]; }
    else if (p[0] === 'finish') { S.workoutDone = true; ph.screen = 'workouts'; ph.scrollTop = 0; ph.hint = 'האימון נשמר ✓'; }
    else if (p[0] === 'aerosave') { S.aerobic = Math.min(3, S.aerobic + 1); ph.sheetKind = null; }
    else if (p[0] === 'aerundo') { S.aerobic = Math.max(0, S.aerobic - 1); }
    else if (p[0] === 'weight') { ph.sheetKind = 'weight'; ph.saved = false; ph.navOpen = false; }
    else if (p[0] === 'weightsave') { S.weightLogged = true; S.weight = 76.5; ph.saved = true; scheduleClose(ph, 3200); }
    else if (p[0] === 'requestsend') { S.traineeRequestSent = true; ph.saved = true; scheduleClose(ph, 3400); }
    else if (p[0] === 'pulse') { ph.pulse = true; ph.scrollTop = 0; }
    else if (p[0] === 'approve') { S.proposalApproved = true; ph.hint = 'הפגישה אושרה ✓'; }
    else if (p[0] === 'confirm') { S.attendance = true; }
    else if (p[0] === 'unconfirm') { S.attendance = false; }
    else if (p[0] === 'calsync') { S.calendarSynced = true; }
    else if (p[0] === 'ronapprove') { S.ronPending = false; ph.sheetKind = null; ph.hint = 'הפגישה אושרה ✓'; }
    else if (p[0] === 'paysave') { S.danielPaid = true; ph.sheetKind = null; ph.hint = 'התשלום נרשם'; }
    else if (p[0] === 'sheet') { ph.sheetKind = p[1]; ph.sheetArg = p[2]; ph.saved = false; ph.navOpen = false; }
    else if (p[0] === 'sheetdone') { ph.sheetKind = null; ph.hint = p.slice(1).join(':'); }
    else if (p[0] === 'sheetclose') { ph.sheetKind = null; }
    else if (p[0] === 'typing') { ph.typing = true; ph.navOpen = false; ph.scrollTop = 9999; }
    else if (p[0] === 'typingoff') { ph.typing = false; }
    else if (p[0] === 'ptab') { ph.profileTab = p[1]; ph.scrollTop = 0; }
    else if (p[0] === 'mcat' || p[0] === 'pcat' || p[0] === 'ncat') {
      var key2 = p[0] === 'mcat' ? 'meetCat' : p[0] === 'pcat' ? 'payCat' : 'tMeetCat';
      if (p[0] === 'mcat' && ph.screen !== 'meetings') { ph.screen = 'meetings'; ph.meetCat = p[1]; ph.navOpen = false; ph.scrollTop = 0; }
      else if (!ph.catOpen && !reduceMotion && ph[key2] === p[1]) { ph.catOpen = true; render(ph); return; }
      else { ph[key2] = p[1]; ph.catOpen = false; ph.scrollTop = 0; }
    }
    else if (p[0] === 'mfilter') { ph.reqFilter = (ph.reqFilter || 'trainees') === 'trainees' ? 'mine' : 'trainees'; }
    else if (p[0] === 'car') { ph.carousel = p[1]; }
    else if (/^var_/.test(p[0])) { var list = PANES[p[0].slice(4)]; ph[p[0]] = Math.max(0, Math.min(list.length - 1, +p[1])); }
    else if (p[0] === 'reset') { S = initial(); S.meals[0].eaten = true; phones.forEach(function (x) { x.screen = x.side === 'trainer' ? 'home' : 'today'; x.navOpen = false; x.sheetKind = null; x.typing = false; x.split = false; x.presetIdx = 0; x.scrollTop = 0; x.catOpen = false; x.openMeal = -1; x.openWo = -1; x.openPwo = false; x.openMe = false; x.clientsNeeds = false; x.carousel = 'weight'; x.var_measures = 0; x.var_strength = 0; x.homeTile = null; x.tTile = null; x.chatSeg = null; x.paySeg = null; x.reqFilter = null; }); }
    renderAll();
  }
  function scheduleClose(ph, ms) { clearTimeout(ph.closeT); ph.closeT = setTimeout(function () { if (ph.saved) { ph.sheetKind = null; ph.saved = false; renderAll(); } }, reduceMotion ? 1200 : ms); }

  function flip(ph) {
    if (ph.turning) return;
    if (!ph.started) startAll(ph);   // סיבוב = גם התחלה, בשני הטלפונים
    var wrap = ph.root.parentNode;
    var to = ph.side === 'trainer' ? 'trainee' : 'trainer';
    var swap = function () { quiet(ph, function () { ph.side = to; ph.screen = to === 'trainer' ? 'home' : 'today'; ph.navOpen = false; ph.sheetKind = null; ph.typing = false; ph.scrollTop = 0; ph.catOpen = false; render(ph); }); };
    if (reduceMotion) { swap(); return; }
    ph.turning = true;
    wrap.classList.add('is-flipping');
    var arrow = wrap.querySelector('.flip-btn svg');
    if (arrow) { ph.spins = (ph.spins || 0) + 360; arrow.style.transform = 'rotate(' + ph.spins + 'deg)'; }
    ph.root.classList.add('is-turning');
    // ההחלפה נקשרת לשעון האנימציה, לא ל-setTimeout: אם פריים נופל, currentTime עדיין מספר את הזווית האמיתית
    var spin = ph.root.getAnimations().filter(function (a) { return a.animationName === 'dp-spin'; })[0];
    var swapped = false;
    var done = function () { ph.root.classList.remove('is-turning'); wrap.classList.remove('is-flipping'); ph.turning = false; };
    if (!spin) { setTimeout(function () { if (!swapped) { swapped = true; swap(); } }, 475); setTimeout(done, 960); return; }
    var watch = function () {
      if (swapped) return;
      if (spin.playState === 'finished' || spin.currentTime >= 470) { swapped = true; swap(); return; }
      requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
    spin.finished.then(function () { if (!swapped) { swapped = true; swap(); } done(); }, function () { if (!swapped) { swapped = true; swap(); } done(); });
  }

  function edges() { var s = ''; for (var i = 1; i <= 8; i++) s += '<i class="dp-edge" style="--i:' + i + '" aria-hidden="true"></i>'; return s + '<i class="dp-btn power" aria-hidden="true"></i><i class="dp-btn mute" aria-hidden="true"></i><i class="dp-btn vol-up" aria-hidden="true"></i><i class="dp-btn vol-down" aria-hidden="true"></i><i class="dp-tray" aria-hidden="true"></i>'; }
  function mount(root) {
    var ph = { root: root, side: root.getAttribute('data-side') || 'trainer', navOpen: false, presetIdx: 0, scrollTop: 0, openMeal: -1, openWo: -1, started: false };
    root.classList.add('is-idle'); root.parentNode.classList.add('is-idle');   // גם על העטיפה — כדי לא לסמוך על :has
    ph.screen = ph.side === 'trainer' ? 'home' : 'today';
    root.innerHTML = '<div class="dp-screen"><div class="dp-status"><span class="dp-clock">' + now() + '</span><span class="dp-status-icons">' + icon('signal') + icon('wifi') + icon('battery') + '</span></div>' +
      '<div class="dp-topbar"></div><div class="dp-stage"></div>' +
      '<button class="dp-more" type="button" hidden aria-label="להמשך המסך">' + icon('nav-down', 'bi') + '</button>' +
      '<div class="dp-navwrap"><div class="dp-nav" role="tablist"></div></div>' +
      '<div class="dp-toast" role="status" aria-live="polite"></div><div class="dp-sheet" hidden></div><div class="dp-sheen" aria-hidden="true"></div>' +
      '<div class="dp-cover"><span class="wm" dir="ltr">' + wordmark() + '</span><p>הדגמה חיה של הממשק — כל כפתור לחיץ</p><button class="dp-start" data-act="start">התחל הדגמה</button></div></div>' +
      '<i class="dp-face" aria-hidden="true"></i>' +   // המסגרת המרונדרת — מעל המסך, שקופה בחלון המסך
      edges() +'<div class="dp-back" aria-hidden="true"><span class="dp-cam"><i class="l l1"></i><i class="l l2"></i><i class="l l3"></i><b class="flash"></b><u class="lidar"></u><s class="mic"></s></span><svg viewBox="0 0 100 100"><path d="M47 9.61A40.5 40.5 0 0 0 47 90.39L47 73.31A23.5 23.5 0 0 1 47 26.69Z" fill="#F07C1A"/><path d="M53 9.61A40.5 40.5 0 0 1 53 90.39L53 73.31A23.5 23.5 0 0 0 53 26.69Z" fill="#12939D"/></svg><span class="brand">FIT<svg class="brand-o" viewBox="0 0 100 100"><path d="M47 9.61A40.5 40.5 0 0 0 47 90.39L47 73.31A23.5 23.5 0 0 1 47 26.69Z"/><path d="M53 9.61A40.5 40.5 0 0 1 53 90.39L53 73.31A23.5 23.5 0 0 0 53 26.69Z"/></svg>POLIS</span></div>';
    var ground = document.createElement('div'); ground.className = 'dp-ground'; ground.setAttribute('aria-hidden', 'true');
    root.parentNode.insertBefore(ground, root);
    var placeGround = function () { ground.style.top = (root.offsetTop + root.offsetHeight - 12) + 'px'; };
    placeGround(); window.addEventListener('resize', placeGround);
    ph.topbar = root.querySelector('.dp-topbar'); ph.stage = root.querySelector('.dp-stage'); ph.more = root.querySelector('.dp-more'); ph.nav = root.querySelector('.dp-nav'); ph.sheet = root.querySelector('.dp-sheet'); ph.navwrap = root.querySelector('.dp-navwrap'); ph.toast = root.querySelector('.dp-toast');
    // מסך מגע: כפתור גדול מתחת לטלפון, ליד כפתור המעבר, מגלגל את המסך שבפנים (הבעלים, 27/10: "תשים כפתור במובייל בשביל גלילה בתוך הטלפון")
    var flipB = root.parentNode.querySelector('.flip-btn');
    if (coarse && flipB) {
      var row = document.createElement('div'); row.className = 'dp-ctrls';
      flipB.parentNode.insertBefore(row, flipB); row.appendChild(flipB);
      var sb = document.createElement('button'); sb.type = 'button'; sb.className = 'scroll-btn'; sb.hidden = true;
      sb.innerHTML = icon('nav-down', 'bi') + '<span>גלילה במסך</span>';
      row.appendChild(sb); ph.more = sb;
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (ph.sheetKind && e.target.closest('.dp-sheet') && !e.target.closest('.k-form, .k-detsheet')) { ph.sheetKind = null; render(ph); return; }
      if ((ph.navOpen || ph.catOpen) && !e.target.closest('.dp-nav, .k-catbar')) { ph.navOpen = false; ph.catOpen = false; if (!b) { render(ph); return; } }
      if (!b || !root.contains(b) || b.disabled) return;
      e.preventDefault(); act(ph, b.getAttribute('data-act'));
    });
    root.addEventListener('keydown', function (e) {                    // כרטיסים לחיצים (role=button) גם מהמקלדת
      if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute && e.target.getAttribute('role') === 'button' && e.target.hasAttribute('data-act')) { e.preventDefault(); act(ph, e.target.getAttribute('data-act')); }
    });
    ph.stage.addEventListener('scroll', function () { ph.scrollTop = ph.stage.scrollTop; syncMore(ph); }, { passive: true });
    if (ph.more) ph.more.addEventListener('click', function (e) {
      e.stopPropagation();
      var el = ph.stage, max = el.scrollHeight - el.clientHeight;
      el.scrollTo({ top: el.scrollTop > max - 24 ? 0 : Math.min(max, el.scrollTop + el.clientHeight * 0.72), behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    var wrap = root.parentNode;
    var fb = wrap.querySelector('.flip-btn'); if (fb) fb.addEventListener('click', function () { act(ph, 'flip'); });
    var rb = wrap.querySelector('.reset-btn'); if (rb) rb.addEventListener('click', function () { act(ph, 'reset'); });
    phones.push(ph);
    quiet(ph, function () { render(ph); });
  }
  // "התחל הדגמה": מסיר את מסך הפתיחה, ופותח את הבר לרגע כדי שיראו שהוא חי
  // ההדגמה מתחילה בשני הטלפונים יחד — הם צד אחד ושני של אותה מערכת, ומצב אחד משותף
  function startAll(ph) { phones.forEach(function (x) { if (x !== ph) start(x, true); }); start(ph); }
  function start(ph, quietly) {
    if (ph.started) return;
    ph.started = true; ph.root.classList.remove('is-idle'); ph.root.parentNode.classList.remove('is-idle');
    if (reduceMotion || quietly) return;
    setTimeout(function () { if (!ph.navOpen && !ph.turning) { ph.navOpen = true; render(ph); setTimeout(function () { if (ph.navOpen) { ph.navOpen = false; render(ph); } }, 1700); } }, 700);
  }
  document.querySelectorAll('.dp[data-demo]').forEach(mount);
  function refit() { phones.forEach(function (ph) { quiet(ph, function () { fitNav(ph, true); }); }); }   // שינוי גופן/גודל חלון — מודדים מחדש בכל מקרה
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
  window.addEventListener('resize', refit);
  window.addEventListener('load', refit);
})();
