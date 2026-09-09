/* ═══ הדמו האינטראקטיבי — העתק נאמן של שני הממשקים (לפי מפרטי הקוד + ביקורת נאמנות, 09/09/2026)
   מצב אחד משותף (S) לכל הטלפונים בדף: מה שהמתאמן מסמן — המאמן רואה, ולהפך.
   כל המחרוזות, הסדר והמידות — מ-lib/screens ו-lib/widgets של האפליקציה. ═══ */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── נתוני הדמו (mock_data.dart / trainee_mock.dart / menu_mock.dart) ── */
  var CLIENTS = [
    { id: 'or',     name: 'אור בן דוד',  ini: 'אב', c: 'green',  goal: 'מסה',      since: '15/01/2025' },
    { id: 'daniel', name: 'דניאל כהן',   ini: 'דכ', c: 'blue',   goal: 'מסה',      since: '01/03/2025' },
    { id: 'yossi',  name: 'יוסי מזרחי',  ini: 'ימ', c: 'purple', goal: 'מסה',      since: '10/02/2025' },
    { id: 'michal', name: 'מיכל לוי',    ini: 'מל', c: 'amber',  goal: 'לא הוגדר', since: '20/04/2025' },
    { id: 'ron',    name: 'רון גולדברג', ini: 'רג', c: 'amber',  goal: 'חיטוב',    since: '15/05/2025' },
    { id: 'shira',  name: 'שירה כהן',    ini: 'שכ', c: 'green',  goal: 'סטטי',     since: '01/06/2025' }
  ];
  function client(id) { for (var i = 0; i < CLIENTS.length; i++) if (CLIENTS[i].id === id) return CLIENTS[i]; return CLIENTS[1]; }
  var MEETINGS = {                                                  // פגישות המאמן (mock_data) — לגיליון "לפרטי הפגישה"
    michal: { cl: 'michal', dd: '14', mon: 'ספט׳', date: '14/09/2026', topic: 'לקיחת מידות + תמונות', time: '17:30', dur: 45, platform: 'פרונטלי', place: 'הרצליה פיתוח', synced: true },
    yossi:  { cl: 'yossi',  dd: '20', mon: 'ספט׳', date: '20/09/2026', topic: 'עדכון תוכנית אימון', time: '11:00', dur: 30, platform: 'טלפון' },
    daniel: { cl: 'daniel', dd: '21', mon: 'ספט׳', date: '21/09/2026', topic: 'בדיקת התקדמות + עדכון תפריט', time: '10:00', dur: 60, platform: 'זום' },
    danielrec: { cl: 'daniel', dd: '14', mon: 'ספט׳', date: '14/09/2026', topic: 'פגישת מעקב', time: '10:00', dur: 30, platform: 'זום', footer: 'פגישה קבועה, כל שבוע. יש עוד 8 כאלה ביומן.' },
    orh:    { cl: 'or',     dd: '26', mon: 'אוג׳', date: '26/08/2026', topic: 'בדיקת התקדמות חודשית', time: '09:00', dur: 45, platform: 'טלפון', past: true },
    danielh:{ cl: 'daniel', dd: '10', mon: 'אוג׳', date: '10/08/2026', topic: 'מדידות + עדכון תפריט', time: '10:00', dur: 60, platform: 'זום', past: true }
  };
  var trainerPresets = ['עדכנתי לך את התפריט, תציץ בכרטיס', 'תזכור לעדכן משקל היום', 'כל הכבוד על השבוע 💪'];
  var traineePresets = ['תודה! הבנתי את ההנחיות 💪', 'סיימתי את הצהריים, היה טעים', 'אפשר להזיז את הפגישה לשבוע הבא?'];
  var WEIGHTS = [79.0, 78.8, 78.9, 78.6, 78.7, 78.4, 78.5, 78.2, 78.3, 78.0, 78.1, 77.9, 78.0, 77.7, 77.8, 77.6, 77.7, 77.4, 77.5, 77.3, 77.4, 77.2, 77.3, 77.1, 77.2, 77.0, 77.1, 76.9, 77.0, 76.8];
  var WDATES = ['10/08', '17/08', '25/08', '02/09'];
  // פריט מזון: [שם, גרם, חלבון, פחמימה, שומן, קלוריות]; קבוצת "בחר אחד" מציגה טווח עד שבוחרים
  function meal(name, time, groups) { return { name: name, time: time, eaten: false, groups: groups }; }
  function grp(type, rule, items, free) { return { type: type, rule: rule, free: !!free, items: items }; }
  function initial() {
    return {
      chat: [
        { from: 'trainer', text: 'היי דניאל, איך הולך השבוע?', time: '11:10' },
        { from: 'trainee', text: 'כן, בדקתי את התפריט ונראה לי טוב...', time: '11:25' },
        { from: 'trainer', card: true, time: '13:55' }                       // הצעת פגישה מהמאמן — ממתינה לתשובת המתאמן
      ],
      unreadByTrainee: 1, unreadByTrainer: 2, ronUnread: 1,
      meals: [
        meal('ארוחת בוקר', '07:30–08:30', [
          grp('חלבון', 'בחר אחד:', [['מעדן חלבון', 150, 15, 10, 3, 130], ['ביצים', 150, 20, 1, 15, 220], ['חביתה מ־3 ביצים', 150, 20, 1, 16, 230], ['גבינה לבנה 5%', 150, 17, 5, 7, 150]]),
          grp('פחמימה', 'בחר אחד:', [['פרכיות אורז', 70, 5, 55, 2, 260], ['לחמנייה ללא גלוטן', 100, 6, 50, 4, 260]]),
          grp('ירקות', 'חופשי — כמה שבא לך:', [['סלט ירקות', 0, 0, 0, 0, 0]], true)]),
        meal('ביניים בוקר', '10:30–11:00', [
          grp('חלבון', 'בחר אחד:', [['מעדן חלבון', 150, 15, 10, 3, 130], ['משקה חלבון', 250, 25, 12, 4, 190]]),
          grp('פחמימה', 'בחר אחד:', [['פרכיות אורז', 40, 3, 32, 1, 150]])]),
        meal('צהריים', '12:30–13:30', [
          grp('חלבון', 'בחר אחד:', [['חזה עוף', 150, 45, 0, 5, 240], ['פרגית', 120, 30, 0, 12, 240], ['דג מושט', 180, 38, 0, 6, 210], ['בשר טחון רזה 5%', 150, 32, 0, 8, 210]]),
          grp('פחמימה', 'בחר אחד:', [['אורז מבושל', 200, 5, 56, 1, 260], ['פסטה ללא גלוטן', 180, 6, 55, 2, 265], ['תפוא מבושל', 220, 4, 40, 0, 180], ['בטטה אפויה', 220, 4, 46, 0, 200]]),
          grp('ירקות', 'חופשי — כמה שבא לך:', [], true)]),
        meal('ביניים אחר הצהריים', '16:00–16:30', [
          grp('חלבון', 'בחר אחד:', [['מעדן חלבון', 150, 15, 10, 3, 130], ['משקה חלבון', 250, 25, 12, 4, 190]]),
          grp('פחמימה', 'בחר אחד:', [['פרי (תפוח/בננה/אגס)', 150, 1, 22, 0, 90]])]),
        meal('ערב', '19:00–20:00', [
          grp('חלבון', 'בחר אחד:', [['קציצות עוף/בשר אפויות', 150, 30, 5, 12, 250], ['שניצל אפוי', 150, 32, 12, 9, 260], ['נקניקיות עוף', 140, 24, 3, 14, 240]]),
          grp('פחמימה', 'בחר אחד:', [['אורז מבושל', 200, 5, 56, 1, 260], ['פסטה ללא גלוטן', 180, 6, 55, 2, 265], ['בטטה אפויה', 220, 4, 46, 0, 200]]),
          grp('ירקות', 'חופשי — כמה שבא לך:', [], true)])
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
  function av(c, ini, size, ring, extra) {
    return '<span class="k-av' + (ring ? ' ring-' + ring : ' noring') + (extra ? ' ' + extra : '') + '" style="--s:' + size + 'px"><i class="av-' + c + '">' + ini + '</i></span>';
  }
  function cav(cl, size, ring) { return av(cl.c, cl.ini, size, ring); }
  function nextMeal() { for (var i = 0; i < S.meals.length; i++) if (!S.meals[i].eaten) return S.meals[i]; return null; }
  function lastEaten() { for (var i = S.meals.length - 1; i >= 0; i--) if (S.meals[i].eaten) return S.meals[i]; return null; }
  function danielReasons() { var r = []; if (!S.weightLogged) r.push('לא עדכן משקל השבוע'); if (!S.workoutDone) r.push('לא סימן אף אימון השבוע'); return r; }
  function needsCount() { return (danielReasons().length ? 1 : 0) + 1; }
  function clientReasons(id) { return id === 'daniel' ? danielReasons() : id === 'ron' ? ['נדרשות מידות'] : []; }
  function unreadTotal() { return S.unreadByTrainer + S.ronUnread; }
  function requestsCount() { return (S.ronPending ? 1 : 0) + (S.traineeRequestSent ? 1 : 0); }
  function lastTrainerText() { for (var i = S.chat.length - 1; i >= 0; i--) if (S.chat[i].from === 'trainer') return S.chat[i].card ? '[הצעת פגישה]' : S.chat[i].text; return ''; }
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
    weight: [{ name: 'משקל גוף', hint: 'המשקל שאתה מזין בעצמך, לאורך הטווח שבחרת', big: function () { return (S.weightLogged ? '76.5' : '76.8') + ' ק"ג'; }, from: 'מ-79.0 ק"ג', vals: function () { return WEIGHTS.slice(6).concat(S.weightLogged ? [76.5] : []); }, color: '#F07C1A', dates: WDATES, ranges: ['חודש', 'שבועיים', 'שבוע'], weightBtn: true }],
    measures: [
      { name: 'מותן', hint: 'ההיקפים שהמאמן מודד לך — מדד אחד בכל פעם', big: '83.5 ס"מ', from: 'מ-82.0 ס"מ', vals: [82.0, 82.3, 82.6, 82.9, 83.2, 83.5], color: '#12939D', dates: ['30/06', '21/07', '11/08', '01/09'], ranges: ['חודש', 'חודשיים', 'שלושה'] },
      { name: 'ירך', hint: 'ההיקפים שהמאמן מודד לך — מדד אחד בכל פעם', big: '58.8 ס"מ', from: 'מ-58.0 ס"מ', vals: [58.0, 58.2, 58.4, 58.6, 58.8], color: '#12939D', dates: ['14/07', '28/07', '18/08', '01/09'], ranges: ['חודש', 'חודשיים', 'שלושה'] }],
    strength: [
      { name: 'מדד התקדמות', hint: 'כמה התחזקת מאז ההתחלה (0 = נקודת ההתחלה)', big: '+18%', from: 'מ-0%', vals: [0, 3, 5, 4, 8, 11, 10, 14, 15, 18], color: '#F07C1A', dates: ['12/07', '30/07', '17/08', '03/09'], ranges: ['חודש', 'שבועיים', 'שבוע'] },
      { name: 'התקדמות בנפח', hint: 'סך העומס: סטים × חזרות × משקל, בכל התרגילים', big: '4,860 ק"ג', from: 'מ-3,900 ק"ג', vals: [3900, 4100, 4050, 4300, 4500, 4480, 4700, 4860], color: '#F07C1A', dates: ['12/07', '30/07', '17/08', '03/09'], ranges: ['חודש', 'שבועיים', 'שבוע'], foot: 'לא המשקל שעל המוט. תרגילי משקל גוף וקרדיו (0 ק"ג) לא נספרים' },
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
  var trainer = {
    tabs: [['home', 'home', 'בית'], ['clients', 'people', 'לקוחות'], ['chat', 'chat', "צ'אט"], ['meetings', 'calendar', 'פגישות'], ['payments', 'card', 'תשלום']],
    topbar: function (ph) {
      if (ph.screen === 'profile' || ph.screen === 'thread') return '';        // שכבת-על מסך מלא — בלי סרגל עליון (home_screen showMain=false)
      return '<span class="k-wm" dir="ltr">' + wordmark() + '</span>' +
        '<button class="k-tbtn" aria-label="התראות">' + icon('bell', 'bi v-coach') + (unreadTotal() || requestsCount() ? '<i class="k-dot"></i>' : '') + '</button>' +
        '<button class="k-tbtn" aria-label="עבור לתצוגת מתאמן" data-act="flip">' + icon('swap', 'bi v-system') + '</button>' +
        (ph.screen === 'meetings' ? '<button class="k-tbtn" aria-label="הגדרות">' + icon('settings', 'bi v-system') + '</button>' : '') +
        '<span class="k-me ring-coach" aria-hidden="true"><i>יו</i></span>';
    },
    screens: {
      home: function () {
        var unread = unreadTotal(), needs = needsCount(), reqs = requestsCount();
        function shell(ic, title, hi, body, avs, btn, act, note) {
          return card('<div class="k-hcard-t">' + icon(ic, 'bi ' + (hi ? hi : 'v-muted')) + '<span>' + title + '</span></div><p class="k-hcard-b">' + body + '</p>' +
            (note ? '<p class="k-hcard-n">' + note + '</p>' : '') + (avs ? '<div class="k-avrow">' + avs + '</div>' : '') + secondary(btn, act), 'home strong');
        }
        var msgAvs = (S.unreadByTrainer ? '<button data-act="go:thread" aria-label="דניאל כהן">' + cav(client('daniel'), 46, 'trainee') + '</button>' : '') + (S.ronUnread ? '<span>' + cav(client('ron'), 46, 'trainee') + '</span>' : '');
        var needAvs = (danielReasons().length ? '<button data-act="go:profile" aria-label="דניאל כהן">' + cav(client('daniel'), 46, 'trainee') + '</button>' : '') + '<span>' + cav(client('ron'), 46, 'trainee') + '</span>';
        var reqAvs = (S.ronPending ? '<span>' + cav(client('ron'), 46, 'trainee') + '</span>' : '') + (S.traineeRequestSent ? '<button data-act="go:profile:connection">' + cav(client('daniel'), 46, 'trainee') + '</button>' : '');
        return screenTitle('היום') + '<div class="k-gap10"></div>' +
          shell('chat', 'הודעות', unread ? 'v-trainee' : '', unread ? unread + ' הודעות לא נקראו' : 'אין הודעות חדשות', unread ? msgAvs : '', "לכל הצ'אטים", 'go:chat') +
          shell('priority', 'דורשים טיפול', needs ? 'v-attention' : '', needs ? needs + ' לקוחות דורשים טיפול' : 'כל הלקוחות מעודכנים ✓', needs ? needAvs : '', 'לכולם', 'go:clients:needs') +
          card('<div class="k-hcard-t">' + icon('event', 'bi v-muted') + '<span>פגישות קרובות</span></div><p class="k-hcard-b">אין פגישות היום</p>' + secondary('לכל הפגישות', 'go:meetings'), 'home strong') +
          shell('inbox', 'בקשות פגישה', reqs ? 'v-coach' : '', reqs ? reqs + ' בקשות ממתינות' : 'אין בקשות חדשות', reqs ? reqAvs : '', 'לכל הבקשות', 'mcat:requests', reqs ? 'הבקשה הישנה ביותר התקבלה: 08/09 · ' + (S.ronPending ? '09:40' : now()) : '');
      },
      clients: function (ph) {
        var needsOnly = !!ph.clientsNeeds;
        var list = CLIENTS.filter(function (cl) { return !needsOnly || clientReasons(cl.id).length; }).map(function (cl) {
          var reasons = clientReasons(cl.id), needs = reasons.length;
          var meeting = cl.id === 'daniel' ? ['21', 'ראשון', 'בדיקת התקדמות + עדכון תפריט'] : cl.id === 'michal' ? ['14', 'ראשון', 'לקיחת מידות + תמונות'] : cl.id === 'yossi' ? ['20', 'שבת', 'עדכון תוכנית אימון'] : null;
          return card('<div class="k-crow">' + cav(cl, 46, 'trainee') + '<span class="col"><b>' + cl.name + '</b><small>' + cl.goal + ' · מאז ' + cl.since + '</small></span>' +
            '<span class="tags">' + (needs ? badge('נדרש טיפול · ' + needs, 'needs') : badge('הכל תקין ✓', 'ok')) + '</span></div>' +
            (meeting ? '<div class="k-mini"><div class="row"><span class="k-daybubble"><b>' + meeting[0] + '</b><small>' + meeting[1] + '</small></span><span class="col"><small>פגישה קרובה</small><b>' + meeting[2] + '</b></span></div><i class="k-div"></i><div class="k-center">' + pill('לפרטי הפגישה', 'event-note', cl.id === 'daniel' ? 'go:profile:connection' : 'sheet:tmeeting:' + cl.id) + '</div></div>' : ''),
            'client', cl.id === 'daniel' ? 'go:profile' : 'noop');
        }).join('');
        var count = needsOnly ? (CLIENTS.filter(function (c) { return clientReasons(c.id).length; }).length + ' לקוחות דורשים תשומת לב') : 'כל 6 הלקוחות';
        return screenTitle('לקוחות') + search('חפש לפי שם...') + '<div class="k-filterrow"><button class="k-tbtn k-archive" aria-label="ארכיון">' + icon('archive', 'bi v-muted') + '</button>' + filterToggle(needsOnly ? 'נדרש טיפול' : 'כולם', 'cfilter') + '</div>' +
          '<div class="k-count">' + count + '</div>' + list;
      },
      profile: function (ph) {
        var cl = client('daniel'), reasons = danielReasons(), tab = ph.profileTab || 'progress';
        var head = '<div class="k-phead"><button class="k-iconbtn" data-act="go:clients" aria-label="חזרה">' + icon('back', 'bi') + '</button><b>' + cl.name + '</b><button class="k-compact secondary" data-act="noop">' + icon('edit', 'bi') + 'עריכה</button></div>';
        var hero = '<div class="k-hero"><div class="who">' + av(cl.c, cl.ini, 64, null, 'big') +
          '<div class="facts"><span><i>גיל: </i><b>28 שנה</b></span><span><i>גובה: </i><b>180 ס"מ</b></span><span><i>משקל: </i><b>' + (S.weightLogged ? '76.5' : '76.8') + ' ק"ג</b></span><span><i>מאז: </i><b>' + cl.since + '</b></span></div></div>' +
          '<div class="tagsbox"><div class="gt">מוגדר</div>' + badge('מזין ארוחות', 'noInfo', 'check') + badge('מזין אימונים', 'noInfo', 'check') + '<i class="k-div"></i><div class="gt">סטטוס</div>' +
          (reasons.length ? badge('נדרש טיפול', 'needs') + reasons.map(function (r) { return '<small class="reason">• ' + r + '</small>'; }).join('') : badge('הכל תקין ✓', 'ok')) +
          '<span class="k-goal">מסה</span></div></div>';
        var tabs = '<div class="k-tabbar">' + [['progress', 'מעקב'], ['connection', 'יצירת קשר'], ['payments', 'תשלומים']].map(function (t) { return '<button class="' + (t[0] === tab ? 'on' : '') + '" data-act="ptab:' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
        var body = '';
        if (tab === 'progress') {
          var days = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'], today = 3;
          var vine = '<div class="k-vine">' + days.map(function (d, i) {
            var grapes = '';
            if (i < today) grapes = '<i class="g ok"></i><i class="g ok"></i><i class="g ok"></i><i class="g miss"></i><i class="g ok"></i>';
            else if (i === today) grapes = S.meals.map(function (m) { return '<i class="g ' + (m.eaten ? 'ok' : 'open') + '"></i>'; }).join('');
            else if (i === 6) grapes = '<i class="g ex"></i><i class="g ex"></i><i class="g ex"></i>';
            else grapes = '<i class="g fut"></i><i class="g fut"></i><i class="g fut"></i><i class="g fut"></i><i class="g fut"></i>';
            return '<span class="day' + (i === today ? ' today' : i > today ? ' future' : '') + '"><i class="knot"></i><i class="branch"></i><b>' + d + '</b>' + grapes + '</span>';
          }).join('') + '</div>';
          var wvine = '<div class="k-vine rest">' + days.map(function (d, i) {
            var g = i === 1 ? 'ok' : i === 2 ? (S.workoutDone ? 'ok' : 'miss') : (i === 3 && S.workoutDone ? 'ok' : i > today ? 'fut' : 'ex');
            return '<span class="day' + (i === today ? ' today' : i > today ? ' future' : '') + '"><i class="knot"></i><i class="branch"></i><b>' + d + '</b><i class="g ' + g + '"></i></span>';
          }).join('') + '</div>';
          var woOpen = !!ph.openPwo;
          body = panelTitle('תזונה ותכנית אימונים') +
            '<div class="k-expand open"><button class="head" data-act="xp:nut"><b>תזונה</b><small>2400 קלוריות ליום</small></button><div class="body"><i class="k-div"></i>' + vine +
              '<div class="k-adapt"><span class="t">' + icon('book', 'bi v-coach') + 'תבנית: תפריט יומי 2400</span><i class="k-div"></i><div class="k-target"><span class="col"><small>היעד</small><b>2400 קק״ל</b></span><i class="vdiv"></i><span class="col"><small>המאכלים נותנים</small><b class="v-coach">2,300–2,480 קק״ל</b></span></div><i class="k-div"></i><b class="k-good">היעד נמצא בתוך הטווח</b></div>' +
              secondary('התפריט המלא', 'noop', null, 'restaurant') + secondary('שינויים בתפריט', 'noop', null, 'history') + '</div></div>' +
            '<div class="k-expand' + (woOpen ? ' open' : '') + '"><button class="head" data-act="xp:wo"><b>אימונים</b><small>3 אימונים בשבוע</small></button>' +
              (woOpen ? '<div class="body"><i class="k-div"></i>' + wvine + (S.workoutDone ? '' : '<p class="k-missed">פספס אימון אחד השבוע</p>') + '<div class="k-aero">' + icon('run', 'bi v-coach') + '<b' + (S.aerobic >= 3 ? ' class="v-positive"' : '') + '>אירובי · ריצה · ' + S.aerobic + ' מתוך 3 השבוע</b></div>' +
                secondary('התוכנית המלאה', 'noop', null, 'fitness') + secondary('שינויים בתוכנית', 'noop', null, 'history') + secondary('התקדמות בכוח', 'noop', null, 'chart') + secondary('משך האימונים', 'noop', null, 'timer') + '</div>' : '') + '</div>' +
            panelTitle('משקל') + '<div class="k-infobox">' + chart(WEIGHTS.concat(S.weightLogged ? [76.5] : []), '#F07C1A', 120, WDATES) + rangePicker(['חודש', 'שבועיים', 'שבוע'], 'חודש', 'noop') +
              '<div class="k-curw" role="button" tabindex="0" data-act="noop"><small>משקל נוכחי</small><b>' + (S.weightLogged ? '76.5' : '76.8') + ' ק"ג</b></div>' + secondary('היסטוריית המשקל', 'noop', null, 'history', 'joined') + '</div>' +
            panelTitle('היקפים') + '<div class="k-expand' + (ph.openMe ? ' open' : '') + '"><button class="head" data-act="xp:me"><b>היקפים</b><small>2 היקפים</small></button>' +
              (ph.openMe ? '<div class="body"><i class="k-div"></i>' + [['מותן', '83.5 ס"מ', '▲', 'v-negative', '01/09/2026'], ['ירך', '58.8 ס"מ', '▲', 'v-positive', '01/09/2026']].map(function (m) { return '<div class="k-mtrack"><b>' + m[0] + '</b><span class="val"><b class="v-coach">' + m[1] + '</b><i class="' + m[3] + '">' + m[2] + '</i></span><small>מדידה אחרונה: ' + m[4] + '</small><i class="k-div"></i><div class="btns"><button class="k-compact secondary" data-act="noop">' + icon('chart', 'bi') + 'גרף</button><button class="k-compact secondary" data-act="noop">' + icon('history', 'bi') + 'היסטוריה</button></div></div>'; }).join('') + primary('+ הזנת מדידה', 'noop', 'coach') + '</div>' : '') + '</div>' +
            panelTitle('הערות') + '<div class="k-infobox"><div class="k-noteshead"><small>הערות קבועות</small><button class="k-textlink" data-act="noop">' + icon('edit', 'bi') + 'ערוך</button></div><p class="k-notes">אלרגיה לאגוזים. אימונים ביתיים בלבד. פגישות בזום בלבד.</p></div>' +
            '<div class="k-gap20"></div>' + primary("לצ'אט", 'go:thread', 'coach');
        } else if (tab === 'connection') {
          body = (S.traineeRequestSent ? panelTitle('בקשות') + card('<div class="k-tags">' + statusTag('ממתין לאישורך', 'coach') + '</div>' + heading('עדכון תפריט') + factPair(inline('שעה', '18:00'), inline('משך', '30 דקות')) + '<div class="k-center">' + inline('פלטפורמה', 'זום') + '</div><div class="k-received">התקבלה: 09/09 · ' + now() + '</div>' + '<div class="k-center">' + pill('לפרטי הפגישה', 'event-note', 'sheet:coord2') + '</div>', 'request', 'sheet:coord2') : '') +
            panelTitle('פגישה קרובה') + meetingCard('daniel', { tags: S.attendance ? [['אישר הגעה ✓', 'ok']] : [] }) +
            panelTitle('פגישה חוזרת') + '<div class="k-infobox"><div class="k-row-ic">' + icon('repeat', 'bi v-coach') + '<b>כל שבוע · ראשון · 10:00 · זום</b></div></div>' +
            panelTitle('היסטוריית פגישות') + '<div class="k-infobox"><div class="k-center">' + inline('התקיימו', '4') + '</div><i class="k-div"></i><button class="k-door" data-act="noop">' + icon('history', 'bi v-muted') + '<b>4 פגישות</b>' + icon('chev-l', 'bi v-muted') + '</button></div>' +
            panelTitle('תזכורת קצרה') + '<div class="k-infobox"><small class="k-hint center">הערה פרטית שלך על הלקוח. המתאמן לא רואה אותה.</small><p class="k-center">לוודא עדכון משקל לפני הפגישה ביום ראשון</p><div class="k-center"><button class="k-compact secondary" data-act="noop">' + icon('edit', 'bi') + 'עריכה</button></div></div>' +
            '<div class="k-gap20"></div>' + primary("לצ'אט", 'go:thread', 'coach');
        } else {
          body = panelTitle('מבנה תשלום') + '<div class="k-infobox"><div class="k-center">' + inline('שם התבנית', 'מנוי סטנדרטי') + '</div>' + factPair(inline('תדירות תשלום', 'כל חודש'), inline('יום החיוב', '15')) + factPair(inline('תשלום הבא', '15/10/2026')) +
            '<i class="k-div"></i><div class="k-center">' + inline('סבב החיוב הנוכחי', 'ספטמבר 2026') + '</div><div class="k-center">' + (S.danielPaid ? badge('שולם', 'ok') : badge('טרם שולם', 'noInfo')) + '</div><p class="k-center muted">' + (S.danielPaid ? 'התשלום הבא ב-15/10/2026' : 'התשלום הבא בעוד 6 ימים') + '</p>' +
            (S.danielPaid ? '' : '<i class="k-div"></i><div class="k-center"><b class="k-ts">רישום תשלום</b></div>' + primary('רשום תשלום', 'sheet:pay', 'coach', 'receipt')) + '</div>' +
            (S.danielPaid ? '<div class="k-infobox"><div class="k-confirm"><span class="ring">' + icon('check', 'bi') + '</span><b>התשלום נרשם</b><small>ביט · 09/09/2026</small></div><div class="k-center">' + inline('אמצעי תשלום', 'ביט') + '</div><div class="k-center">' + inline('לאיזה חודש', 'ספטמבר 2026') + '</div>' + secondary('מחק את הרישום', 'noop', null, 'close') + '</div>' : '') +
            secondary('היסטוריית תשלומים (11)', 'noop', null, 'history') + '<div class="k-gap8"></div>' + primary("לצ'אט", 'go:thread', 'coach');
        }
        return '<div class="k-profile">' + head + hero + tabs + '<div class="k-panel">' + body + '</div></div>';
      },
      chat: function () {
        var rows = [
          { cl: client('or'), pv: 'תודה! הבנתי את ההנחיות 💪', t: 'אתמול', n: 0 },
          { cl: client('daniel'), pv: lastDanielPreview(), t: S.chat[S.chat.length - 1].time, n: S.unreadByTrainer, online: true, act: 'go:thread' },
          { cl: client('michal'), pv: 'אישרתי את הפגישה ליום חמישי 👍', t: '09:12', n: 0 },
          { cl: client('ron'), pv: 'תיאום פגישה · ' + (S.ronPending ? 'ממתין לאישור המאמן' : 'אושרה ✓'), t: 'אתמול', n: S.ronUnread },
          { cl: client('shira'), pv: 'תיאום פגישה · הצעת חלופית - ממתין לאישור', t: '10:40', n: 0 }
        ];
        return screenTitle("צ'אט") + search('חפש לפי שם...') + filterToggle('הכל', 'noop') +
          rows.map(function (r) {
            return card('<div class="k-crow chat"><span class="avwrap">' + cav(r.cl, 46, 'trainee') + (r.online ? '<i class="online"></i>' : '') + '</span><span class="col"><b>' + r.cl.name + '</b><small>' + esc(r.pv) + '</small></span><span class="meta"><time>' + r.t + '</time>' + (r.n ? '<span class="k-count-badge">' + r.n + '</span>' : '') + '</span></div>', 'chatrow', r.act || 'noop');
          }).join('');
      },
      thread: function (ph) {
        var preset = trainerPresets[ph.presetIdx % trainerPresets.length];
        return '<div class="k-thead"><button class="k-iconbtn" data-act="go:chat" aria-label="חזרה">' + icon('back', 'bi') + '</button><button class="who" data-act="go:profile">' + cav(client('daniel'), 40, 'trainee') + '<b>דניאל כהן</b></button></div>' +
          '<div class="k-bubbles">' + S.chat.map(function (m) { return bubble(m, 'trainer'); }).join('') + '</div>' +
          '<div class="k-input"><span class="field">' + esc(preset) + '</span>' + icon('photo', 'bi v-muted') + '<button class="send v-coach" data-act="send:trainer" aria-label="שלח">' + icon('send', 'bi') + '</button></div>';
      },
      meetings: function (ph) {
        var cat = ph.meetCat || 'upcoming', open = !!ph.catOpen;
        var bar = catBar([['upcoming', 'event', 'נקבעו'], ['requests', 'inbox', 'בקשות', cat === 'requests' && (ph.reqFilter || 'trainees') === 'trainees' ? 'trainee' : 'coach'], ['history', 'history', 'היסטוריה']], cat, 'mcat', open);
        var body = '';
        if (cat === 'upcoming') {
          body = sectionTitle('קרובות — לפי הסדר') + meetingCard('michal') + meetingCard('yossi') + meetingCard('daniel', { tags: S.attendance ? [['אישר הגעה ✓', 'ok']] : [] }) +
            '<div class="k-gap8"></div>' + sectionTitle('פגישות קבועות') + meetingCard('danielrec');
        } else if (cat === 'requests') {
          var f = ph.reqFilter || 'trainees';
          body = filterToggle(f === 'trainees' ? 'בקשות מתאמנים' : 'בקשות שלי', 'mfilter', f === 'trainees' ? 'trainee' : 'coach') +
            (f === 'trainees'
              ? (S.traineeRequestSent ? requestCard({ cl: client('daniel'), dd: '16', mon: 'ספט׳', status: 'ממתין לאישורך', color: 'coach', topic: 'עדכון תפריט', time: '18:00', dur: 30, platform: 'זום', received: '09/09 · ' + now(), act: 'sheet:coord2' }) : '') +
                (S.ronPending ? requestCard({ cl: client('ron'), dd: '17', mon: 'ספט׳', status: 'ממתין לאישורך', color: 'coach', topic: 'עדכון תוכנית אימונים', time: '08:30', dur: 30, platform: 'טלפון', received: '08/09 · 09:40' }) : '') +
                requestCard({ cl: client('shira'), dd: '21', mon: 'ספט׳', status: 'הצעת חלופית - ממתין לאישור', color: 'coach', topic: 'פגישת היכרות + מדידות ראשוניות', time: '11:00', dur: 60, platform: 'פרונטלי', place: 'הסטודיו, רחוב הרצל 5', received: '07/09 · 16:05', act: 'noop' }) +
                requestCard({ cl: client('daniel'), dd: '09', mon: 'ספט׳', status: 'פגה', color: 'muted', topic: 'שאלה על התפריט', time: '08:00', dur: 30, platform: 'טלפון', received: '06/09 · 21:15', act: 'noop' })
              : requestCard({ cl: client('daniel'), dd: '13', mon: 'ספט׳', status: S.proposalApproved ? 'אושרה ✓' : 'ממתין לאישור המתאמן', color: S.proposalApproved ? 'positive' : 'coach', topic: 'בדיקת התקדמות', time: '17:30', dur: 45, platform: 'זום', received: '09/09 · 13:55', act: 'noop' }));
        } else {
          body = search('חפש לפי שם...') + '<div class="k-gap12"></div>' + meetingCard('orh', { tags: [['התקיימה', 'ok']] }) + meetingCard('danielh', { tags: [['התקיימה', 'ok']] });
        }
        return screenTitle('פגישות') + bar + '<div class="k-gap12"></div>' + body;
      },
      payments: function (ph) {
        var cat = ph.payCat || 'month', open = !!ph.catOpen;
        var bar = catBar([['month', 'payments', 'החודש'], ['history', 'history', 'תשלומים אחרונים']], cat, 'pcat', open);
        var body;
        if (cat === 'month') {
          var st = { or: ['שולם ✓', 'ok'], daniel: S.danielPaid ? ['שולם ✓', 'ok'] : ['טרם שולם', 'noInfo'], yossi: ['באיחור', 'needs'], michal: ['לא הוגדר עדיין', 'noInfo'], shira: ['לא הוגדר עדיין', 'noInfo'], ron: ['אין מידע', 'noInfo'] };
          body = '<p class="k-context">המידע בדף הוא על החודש הנוכחי</p>' + search('חפש לפי שם...') + filterToggle('כולם', 'noop') + '<div class="k-count">כל 6 הלקוחות</div>' +
            CLIENTS.map(function (cl) {
              return card('<div class="k-payhead">' + cav(cl, 46, 'trainee') + '<b>' + cl.name + '</b><span class="sp"></span></div><div class="k-center">' + badge(st[cl.id][0], st[cl.id][1]) + '</div><div class="k-center">' + pill('ערוך פרטים', 'edit', cl.id === 'daniel' ? 'go:profile:payments' : 'noop') + '</div>', 'pay', cl.id === 'daniel' ? 'go:profile:payments' : 'noop');
            }).join('');
        } else {
          body = '<p class="k-context">כל התשלומים שנרשמו, מהאחרון</p>' + search('חפש לפי שם...') + '<div class="k-gap12"></div>' +
            (S.danielPaid ? card(clientHeader(client('daniel'), '09', 'ספט׳') + '<div class="k-center">' + inline('אמצעי תשלום', 'ביט') + '</div><div class="k-center">' + inline('לאיזה חודש', 'ספטמבר 2026') + '</div><div class="k-center">' + pill('היסטוריית תשלומים', 'receipt', 'noop') + '</div>', 'meeting', 'noop') : '') +
            card(clientHeader(client('or'), '15', 'אוג׳') + '<div class="k-center">' + inline('אמצעי תשלום', 'העברה בנקאית') + '</div><div class="k-center">' + inline('לאיזה חודש', 'אוגוסט 2026') + '</div><div class="k-center">' + pill('היסטוריית תשלומים', 'receipt', 'noop') + '</div>', 'meeting', 'noop') +
            card(clientHeader(client('yossi'), '15', 'יול׳') + '<div class="k-center">' + inline('אמצעי תשלום', 'אשראי') + '</div><div class="k-center">' + inline('לאיזה חודש', 'יולי – ספטמבר 2026') + '</div><div class="k-center">' + pill('היסטוריית תשלומים', 'receipt', 'noop') + '</div>', 'meeting', 'noop');
        }
        return screenTitle('תשלומים') + bar + '<div class="k-gap12"></div>' + body;
      }
    }
  };

  /* ── ממשק המתאמן ───────────────────────────────────────────────────── */
  var trainee = {
    tabs: [['today', 'today', 'בית'], ['nutrition', 'restaurant', 'תזונה'], ['workouts', 'fitness', 'אימונים'], ['meetings', 'calendar', 'פגישות'], ['chat', 'chat', "צ'אט"]],
    topbar: function (ph) {
      if (ph.screen === 'chat' || ph.screen === 'workout') return '';
      return '<span class="k-wm" dir="ltr">' + wordmark() + '</span>' +
        '<button class="k-tbtn" aria-label="התראות">' + icon('bell', 'bi v-trainee') + '</button>' +
        '<button class="k-tbtn" aria-label="עבור לתצוגת מאמן" data-act="flip">' + icon('swap', 'bi v-system') + '</button>' +
        (/nutrition|workouts|meetings/.test(ph.screen) ? '<button class="k-tbtn" aria-label="הגדרות">' + icon('settings', 'bi v-system') + '</button>' : '') +
        '<span class="k-me ring-trainee" aria-hidden="true"><i class="av-blue">דכ</i></span>';
    },
    screens: {
      today: function (ph) {
        var nm = nextMeal(), le = lastEaten();
        var rows = [];
        if (S.unreadByTrainee) rows.push('<button class="k-trow" data-act="go:chat">' + icon('campaign', 'bi v-coach') + '<span class="col"><small>הודעה מהמאמן</small><b>' + esc(lastTrainerText()) + '</b></span><span class="k-count-badge">' + S.unreadByTrainee + '</span></button>');
        rows.push('<button class="k-trow" data-act="go:workouts">' + (S.workoutDone ? icon('check-circle-fill', 'bi v-trainee') : icon('fitness', 'bi v-coach')) + '<span class="col"><small>האימון של היום</small><b>אימון A – חזה + כתפיים' + (S.workoutDone ? ' · השלמת את האימון היום ✓' : '') + '</b></span></button>');
        if (!S.weightLogged) rows.push('<button class="k-trow" data-act="weight">' + icon('weight', 'bi v-attention') + '<span class="col"><small>הזנת משקל</small><b>מומלץ לעדכן משקל השבוע</b></span></button>');
        var todayCard = card(rows.join('<i class="k-div"></i>'), 'today');
        var mealCard;
        if (!nm) mealCard = card('<div class="k-empty compact stack">' + icon('check-circle', 'bi v-trainee') + '<b>סיימת את כל הארוחות של היום! הארוחה הבאה תהיה מחר.</b></div>', 'meal');
        else if (le && ph.split) mealCard = card('<div class="k-split"><div class="half"><small>אכלת</small><b class="muted">' + le.name + '</b><span class="done">' + icon('check-circle-fill', 'bi v-trainee') + 'נאכל ✓</span></div><i class="vdiv"></i><div class="half"><span class="k-voicepill">' + icon('arrow', 'bi') + 'הארוחה הבאה</span><b>' + nm.name + '</b><small>מתי כדאי לאכול: ' + nm.time + '</small><button class="k-eat compact" data-act="eatnext">' + icon('check-circle', 'bi') + 'סמן גם אותה</button></div></div>', 'meal split');
        else mealCard = card('<span class="k-voicepill">' + icon('arrow', 'bi') + 'הארוחה הבאה</span><b class="k-mealname">' + nm.name + '</b><span class="k-mealtime">' + icon('schedule', 'bi v-coach') + 'מתי כדאי לאכול: ' + nm.time + '</span>' + sources(nm, S.meals.indexOf(nm)) + macroCells(nm) + '<button class="k-eat" data-act="eatnext">' + icon('check-circle', 'bi') + 'סמן שאכלת</button>', 'meal');
        var cat = ph.carousel || 'weight';
        var carousel = segPills([['weight', 'משקל גוף'], ['measures', 'היקפים'], ['strength', 'כוח']], cat, 'car') + pane(cat, ph, 'var_' + cat);
        return '<div class="k-gap8"></div>' + groupHeading('היום') + todayCard + '<div class="k-gap12"></div>' + mealCard + '<div class="k-gap24"></div>' + groupHeading('מעקב התקדמות') + carousel + FOOTNOTE;
      },
      nutrition: function (ph) {
        var nm = nextMeal();
        var next = nm ? card('<b class="k-mealname sm">' + nm.name + '</b><small class="k-lbl">מתי כדאי לאכול: ' + nm.time + '</small>' + sources(nm, S.meals.indexOf(nm)) + macroCells(nm) + '<button class="k-eatctl" data-act="eatnext">סמן שאכלת</button>', 'meal hi')
          : card('<div class="k-celebrate"><span class="big">' + icon('check', 'bi') + '</span><b>סיימת את כל הארוחות של היום! הארוחה הבאה תהיה מחר.</b></div>', 'meal hi');
        var tiles = S.meals.map(function (m, i) {
          var open = ph.openMeal === i;
          return '<div class="k-tile' + (open ? ' open' : '') + '"><button class="head" data-act="xm:' + i + '"><span class="col"><b>' + m.name + '</b><small>' + kcalText(m) + ' · ' + m.time + '</small></span>' + (m.eaten ? icon('check-circle-fill', 'bi v-positive') : '') + icon('expand', 'bi v-faint chev') + '</button>' +
            (open ? '<div class="body"><i class="k-div"></i>' + sources(m, i) + (m.eaten ? '<div class="k-eatrow"><span class="eaten">' + icon('check-circle-fill', 'bi') + 'נאכל</span><button class="undo" data-act="uneat:' + i + '">הורד סימון</button></div>' : '<button class="k-eatctl" data-act="eat:' + i + '">סמן שאכלת</button>') + '</div>' : '') + '</div>';
        }).join('');
        return screenTitle('תזונה') + '<p class="k-goalline">גירעון קלורי · 2000 קלוריות</p><div class="k-gap20"></div>' + sectionTitle('הארוחה הבאה') + next +
          '<div class="k-gap20"></div>' + sectionTitle('היקפים') + pane('measures', ph, 'var_measures') + FOOTNOTE +
          '<div class="k-gap20"></div>' + sectionTitle('התפריט המלא') + '<p class="k-dayname">יום רגיל</p>' + tiles + '<div class="k-gap8"></div>' + secondary('עריכת סדר', 'noop', null, 'swap-v');
      },
      workouts: function (ph) {
        var nextName = S.workoutDone ? 'אימון B – גב + זרועות' : 'אימון A – חזה + כתפיים', nextMin = S.workoutDone ? 62 : 58;
        var next = sectionTitle('האימון הבא') + card('<div class="k-row-ic top">' + icon('fitness', 'bi v-coach lg') + '<span class="col"><b class="k-mealname">' + nextName + '</b><small>לקח ' + nextMin + ' דקות בפעם הקודמת שביצעת אימון זה</small></span></div><div class="k-gap20"></div>' + primary('התחל אימון', S.workoutDone ? 'noop' : 'go:workout', 'trainee', 'play'));
        var WOS = [['אימון A – חזה + כתפיים', '4 תרגילים', S.workoutDone, [['לחיצת חזה במוט', '4 סטים · 8–12 חזרות'], ['לחיצת כתפיים', '4 סטים · 8–12 חזרות'], ['פרפר בכבלים', '3 סטים · 12–15 חזרות'], ['פלאנק', '3 סטים · 45 שנ׳']]],
          ['אימון B – גב + זרועות', '3 תרגילים', false, [['מתח', '4 סטים · 6–10 חזרות'], ['חתירה בהרכנה', '4 סטים · 8–12 חזרות'], ['כפיפת מרפק', '3 סטים · 10–12 חזרות']]],
          ['אימון C – רגליים', '3 תרגילים', false, [['סקוואט', '5 סטים · 6–10 חזרות'], ['לחיצת רגליים', '4 סטים · 10–12 חזרות'], ['כפיפת ברך', '3 סטים · 12–15 חזרות']]]];
        var list = WOS.map(function (w, i) {
          var open = ph.openWo === i;
          return '<div class="k-tile' + (open ? ' open' : '') + '"><button class="head" data-act="xw:' + i + '"><span class="col"><b class="fd">' + w[0] + '</b><small>' + w[1] + '</small></span>' + (w[2] ? '<span class="k-donechip">' + icon('check-circle-fill', 'bi v-trainee') + 'בוצע השבוע</span>' : '') + icon('expand', 'bi v-faint chev') + '</button>' +
            (open ? '<div class="body"><i class="k-div"></i>' + w[3].map(function (e) { return '<div class="k-exrow">' + icon('chev-l', 'bi v-faint') + '<span>' + e[0] + '</span><small>' + e[1] + '</small></div>'; }).join('') + '<div class="k-gap8"></div>' +
              (w[2] ? '<div class="k-donebar">' + icon('check-circle-fill', 'bi v-trainee') + 'בוצע השבוע</div>' : primary('התחל אימון', i === 0 ? 'go:workout' : 'noop', 'trainee', 'play')) + '</div>' : '') + '</div>';
        }).join('');
        var aero = S.aerobic >= 3
          ? '<div class="k-aerorow"><div class="k-donebar">' + icon('check-circle-fill', 'bi v-trainee') + 'סיימת את האירובי השבוע</div><button class="k-undo pill" data-act="aerundo">הורד סימון</button></div>'
          : '<div class="k-aerorow">' + primary('סמן שביצעת', 'sheet:aerobic', 'trainee') + (S.aerobic ? '<button class="k-undo pill" data-act="aerundo">הורד סימון</button>' : '') + '</div>';
        var reported = S.aerobic ? '<small class="k-lbl2">מה שדיווחת</small><div class="k-chips">' + Array.apply(null, Array(S.aerobic)).map(function () { return '<span class="k-chip">30 דק׳</span>'; }).join('') + '</div>' : '';
        return screenTitle('אימונים') + '<div class="k-gap20"></div>' + next + '<div class="k-gap20"></div>' + sectionTitle('התקדמות כוח') + pane('strength', ph, 'var_strength') + FOOTNOTE +
          '<div class="k-gap12"></div>' + card('<div class="k-row-ic top">' + icon('note', 'bi v-trainee') + '<span class="col"><small class="lbl">הערה לעצמי · אימון A – חזה + כתפיים</small><b class="normal">להעלות משקל בלחיצת חזה בפעם הבאה</b></span></div>', 'selfnote') +
          '<div class="k-gap20"></div>' + sectionTitle('האימונים שלי') + list + '<div class="k-gap20"></div>' + sectionTitle('אירובי') +
          card('<div class="k-row-ic top">' + icon('run', 'bi v-coach lg') + '<span class="col"><b class="k-mealname">ריצה</b><small>ריצה · 3 פעמים בשבוע · 30 דק׳ בכל פעם</small></span></div>' + reported + '<div class="k-gap20"></div>' + aero);
      },
      workout: function (ph) {
        return '<div class="k-ahead"><button class="k-iconbtn" data-act="go:workouts" aria-label="חזרה">' + icon('back', 'bi') + '</button><b>אימון A – חזה + כתפיים</b><span class="k-timer">' + icon('timer', 'bi') + '07:12</span></div>' +
          '<div class="k-body16">' + S.exercises.map(function (e, i) {
            return '<div class="k-excard"><b>' + e.name + '</b><small>' + e.sets + '</small>' + (e.prev ? '<span class="prev">פעם קודמת: ' + e.prev + ' ק״ג</span>' : '') +
              '<button class="k-field num' + (ph.focusEx === i ? ' focus' : '') + '" data-act="set:' + i + '" aria-label="משקל"><small>משקל</small><b>' + (e.w === null ? '' : e.w) + '</b><i>ק״ג</i></button></div>';
          }).join('') +
          '<div class="k-note"><small>הערה לעצמי</small><span class="k-fieldbox">כתוב הערה...</span></div><div class="k-note"><small>הערה למאמן</small><span class="k-fieldbox">כתוב הערה...</span></div>' +
          primary('סיים אימון', 'finish', 'trainee', 'check-circle') + '</div>';
      },
      meetings: function (ph) {
        var cat = ph.tMeetCat || 'upcoming', open = !!ph.catOpen;
        var bar = catBar([['upcoming', 'event', 'קרובות'], ['history', 'history', 'היסטוריה']], cat, 'ncat', open, 'trainee');
        var banner = S.traineeRequestSent ? card('<div class="k-row-ic top">' + icon('info', 'bi v-coach') + '<span>יש לך כבר בקשת פגישה פתוחה — אפשר לפתוח בקשה חדשה אחרי שהמאמן יענה עליה</span></div><button class="k-disclose" data-act="noop">איך זה עובד?' + icon('expand', 'bi') + '</button>', 'block' + (ph.pulse ? ' pulse' : '')) : '';
        var body;
        if (cat === 'upcoming') {
          var m21 = function (hi) { return card(heading('בדיקת התקדמות + עדכון תפריט') + factPair(inline('תאריך', '21/09/2026'), inline('שעה', '10:00')) + factPair(inline('משך', '60 דקות'), inline('פלטפורמה', 'זום')) + (S.attendance ? '<p class="k-center good">אישרת שאתה מגיע ✓</p>' : '') + '<div class="k-center">' + pill('לפרטי הפגישה', 'event-note', 'sheet:meeting') + '</div>', 'meeting pad20' + (hi ? ' hi' : ''), 'sheet:meeting'); };
          var m13 = function (hi) { return card(heading('בדיקת התקדמות') + factPair(inline('תאריך', '13/09/2026'), inline('שעה', '17:30')) + factPair(inline('משך', '45 דקות'), inline('פלטפורמה', 'זום')) + '<div class="k-center">' + pill('לפרטי הפגישה', 'event-note', 'noop') + '</div>', 'meeting pad20' + (hi ? ' hi' : ''), 'noop'); };
          var openReqs = (S.proposalApproved ? '' : card('<div class="k-tags">' + statusTag('ממתין לאישורך', 'coach') + '</div>' + heading('בדיקת התקדמות') + factPair(inline('תאריך', '13/09/2026'), inline('שעה', '17:30')) + factPair(inline('משך', '45 דקות'), inline('פלטפורמה', 'זום')) +
              '<div class="k-center">' + pill('לפרטי הפגישה', 'event-note', 'noop') + '</div><div class="k-actions"><div class="row">' + primary('אישור', 'approve', 'trainee') + secondary('דחייה', 'noop', 'trainee') + '</div>' + secondary('הצע פגישה חלופית', 'noop', 'trainee', 'edit-cal') + '</div>', 'request', 'noop')) +
            (S.traineeRequestSent ? card('<div class="k-tags">' + statusTag('ממתין לאישור המאמן', 'coach') + '</div>' + heading('עדכון תפריט') + factPair(inline('תאריך', '16/09/2026'), inline('שעה', '18:00')) + factPair(inline('משך', '30 דקות'), inline('פלטפורמה', 'זום')) + '<div class="k-center">' + pill('לפרטי הפגישה', 'event-note', 'noop') + '</div><div class="k-actions">' + secondary('בטל', 'noop', 'trainee', 'close') + '</div>', 'request', 'noop') : '');
          body = banner + (openReqs ? sectionTitle('בקשות פתוחות') + openReqs : '') +
            sectionTitle('הפגישה הקרובה') + (S.proposalApproved ? m13(true) + sectionTitle('פגישות עתידיות') + m21(false) : m21(true)) +
            sectionTitle('פגישה קבועה') + card(heading('פגישת מעקב') + factPair(inline('תאריך', '14/09/2026'), inline('שעה', '10:00')) + factPair(inline('משך', '30 דקות'), inline('פלטפורמה', 'זום')) + '<div class="k-center">' + pill('לפרטי הפגישה', 'event-note', 'noop') + '</div><i class="k-div"></i><p class="k-center muted">זו פגישה קבועה שנקבעה כל שבוע. יש עוד 8 כאלה ביומן שלך.</p>', 'meeting pad20', 'noop');
        } else {
          body = banner + card(heading('פגישת התחלה') + factPair(inline('תאריך', '19/08/2026'), inline('שעה', '09:30')) + factPair(inline('משך', '60 דקות'), inline('פלטפורמה', 'זום')) + '<div class="k-center">' + pill('לפרטי הפגישה', 'event-note', 'noop') + '</div>', 'meeting pad20', 'noop');
        }
        return screenTitle('פגישות') + bar + '<div class="k-gap12"></div>' + body;
      },
      chat: function (ph) {
        var preset = traineePresets[ph.presetIdx % traineePresets.length];
        return '<button class="k-thead trainee" data-act="noopcoach"><span class="k-av ring-coach" style="--s:44px"><i class="av-green">יו</i></span><span class="col"><b>יואב</b><small>שיחה ישירה עם המאמן</small></span></button>' +
          '<div class="k-bubbles' + (ph.typing ? '' : ' navpad') + '">' + S.chat.map(function (m) { return bubble(m, 'trainee'); }).join('') + '</div>' +
          (ph.typing ? '<div class="k-input trainee"><span class="field">' + esc(preset) + '</span><span class="btns">' + icon('photo', 'bi v-muted') + '<button class="send v-trainee" data-act="send:trainee" aria-label="שלח">' + icon('send', 'bi') + '</button><button class="apps" data-act="typingoff" aria-label="הצג ניווט">' + icon('apps', 'bi') + '</button></span></div>' : '');
      }
    }
  };

  function bubble(m, viewer) {
    var mine = m.from === viewer;
    if (m.card) {
      var st = S.proposalApproved ? ['אושרה ✓', 'positive'] : viewer === 'trainer' ? ['ממתין לאישור המתאמן', 'coach'] : ['ממתין לאישורך', 'coach'];
      var actions = '';
      if (viewer === 'trainee' && !S.proposalApproved) actions = '<div class="k-actions"><div class="row">' + primary('אישור', 'approve', 'trainee') + secondary('דחייה', 'noop', 'trainee') + '</div>' + secondary('הצע פגישה חלופית', 'noop', 'trainee', 'edit-cal') + '</div>';
      else if (S.proposalApproved && !S.calendarSynced) actions = '<div class="k-actions">' + secondary('הוסף ליומן', 'calsync', viewer === 'trainee' ? 'trainee' : null, 'calendar-today') + '</div>';
      return '<div class="k-bub cardwrap ' + (mine ? 'mine' : 'theirs') + ' from-' + m.from + '"><div class="k-coord"><div class="t">' + icon('event', 'bi v-coach') + 'תיאום פגישה</div>' + heading('בדיקת התקדמות') + '<div class="k-tags">' + statusTag(st[0], st[1]) + '</div>' +
        factPair(inline('תאריך', '13/09/2026'), inline('שעה', '17:30')) + factPair(inline('משך', '45 דקות'), inline('פלטפורמה', 'זום')) + actions + '<small class="stamp">' + m.time + '</small></div></div>';
    }
    return '<div class="k-bub ' + (mine ? 'mine' : 'theirs') + ' from-' + m.from + '"><span>' + esc(m.text) + '</span><time>' + m.time + '</time></div>';
  }
  function wordmark() {
    return '<b class="fit">FIT</b><svg class="o" viewBox="0 0 100 100" aria-hidden="true"><path d="M 41.8 17 A 34 34 0 0 0 41.8 83" fill="none" stroke="#F07C1A" stroke-width="14" stroke-linecap="round"/><path d="M 58.2 17 A 34 34 0 0 1 58.2 83" fill="none" stroke="#12939D" stroke-width="14" stroke-linecap="round"/></svg><b class="polis">POLIS</b>';
  }
  function navHtml(app, ph) {
    return app.tabs.map(function (t) {
      var on = ph.screen === t[0] || (ph.side === 'trainer' && ph.screen === 'thread' && t[0] === 'chat') || (ph.side === 'trainer' && ph.screen === 'profile' && t[0] === 'clients');
      var badge = (ph.side === 'trainee' && t[0] === 'chat' && S.unreadByTrainee) ? '<i class="k-tabbadge">' + S.unreadByTrainee + '</i>' : '';
      return '<button class="dp-tab' + (on ? ' is-on' : '') + '" role="tab" aria-selected="' + on + '" data-act="tab:' + t[0] + '"><span class="ico">' + icon(t[1]) + badge + '</span><b>' + t[2] + '</b></button>';
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
      if (nextMeal()) return { icon: 'check', cls: 'v-trainee', act: 'eatnext', label: 'סמן את הארוחה הבאה' };
      return null;
    }
    if (t === 'nutrition') return nextMeal() ? { icon: 'check', cls: 'v-trainee', act: 'eatnext', label: 'סמן את הארוחה הבאה' } : { icon: 'minus', cls: 'v-trainee', act: 'uneatlast', label: 'בטל סימון' };
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
  function confirmCheck(title, detail) { return '<div class="k-confirm"><span class="ring">' + icon('check', 'bi') + '</span><b>' + title + '</b><small>' + detail + '</small></div>'; }
  function sheetHtml(kind, ph) {
    if (kind === 'weight') return formSheet('הזנת משקל', ph.saved ? confirmCheck('המשקל נשמר', '76.5 ק"ג') + '<p class="k-hint center">אפשר לערוך את המשקל של היום עד סוף היום — בהיסטוריית המשקל, דרך החשבון שלי</p>'
      : '<div class="k-explain"><b>המאמן שלך ביקש שקילה פעם בשבוע</b><small>עדכן את המשקל שלך פעם בשבוע כדי שהמעקב יהיה מדויק</small><small>אפשר לערוך את המשקל של היום עד סוף היום — בהיסטוריית המשקל, דרך החשבון שלי</small></div>' +
        '<div class="k-field wide"><small>משקל (ק"ג)</small><b dir="ltr">76.5</b><i>ק"ג</i></div>' + primary('שמור', 'weightsave', 'trainee'), true);
    if (kind === 'request') return formSheet('בקשת פגישה', ph.saved ? confirmCheck('הבקשה נשלחה למאמן', 'עדכון תפריט · 16/09/2026 · 18:00')
      : pickerRow('תאריך', '16/09/2026', 'calendar-today') + '<div class="k-avail">' + icon('event-busy', 'bi v-coach') + '<b>המאמן פנוי בימים ראשון–חמישי, 16:00–20:00</b></div>' + pickerRow('שעה', '18:00', 'schedule') +
        labeled('נושא', 'עדכון תפריט', 'על מה הפגישה?') + '<div class="k-two">' + labeled('פלטפורמה', 'זום', '') + labeled('משך פגישה', '30 דקות', '') + '</div>' + primary('שלח בקשה', 'requestsend', 'trainee'));
    if (kind === 'aerobic') return '<div class="k-detsheet bg"><b class="ttl">כמה עשית?</b>' + labeled('אירובי', '30 דק׳', '') + primary('סמן שביצעת', 'aerosave', 'ink') + '</div>';
    if (kind === 'meeting') return '<div class="k-detsheet"><b class="ttl">פרטי הפגישה</b>' + heading('בדיקת התקדמות + עדכון תפריט') + factPair(inline('תאריך', '21/09/2026'), inline('שעה', '10:00')) + factPair(inline('משך', '60 דקות'), inline('פלטפורמה', 'זום')) +
      '<div class="k-calrow">' + icon(S.calendarSynced ? 'event-ok' : 'event-busy', 'bi ' + (S.calendarSynced ? 'v-positive' : 'v-negative')) + inline('יומן', S.calendarSynced ? 'מסונכרן ✓' : 'לא מסונכרן') + '</div>' + (S.calendarSynced ? '' : secondary('הוסף ליומן', 'calsync', 'trainee', 'calendar-today')) +
      (S.attendance ? '<p class="k-center good">אישרת שאתה מגיע ✓</p><div class="k-attend"><button class="k-textbtn muted" data-act="unconfirm">' + icon('undo', 'bi') + 'ביטול האישור</button></div>' : '<div class="k-attend"><button class="k-textbtn good" data-act="confirm">' + icon('check-circle', 'bi') + 'אני בוודאות מגיע</button><button class="k-textbtn bad" data-act="sheetclose">' + icon('event-busy', 'bi') + 'לא אוכל להגיע</button></div>') +
      timeline([['coach', 'event', 'המאמן הציע פגישה', '26/08/2026 · 14:02'], ['trainee', 'check-circle', 'אישרת את ההצעה', '26/08/2026 · 18:40']].concat(S.attendance ? [['trainee', 'check-circle', 'אישרת שאתה מגיע', 'היום · ' + now()]] : [])) + '</div>';
    if (kind === 'tmeeting') {
      var m = MEETINGS[ph.sheetArg] || MEETINGS.michal;
      return '<div class="k-detsheet">' + heading(m.topic) + factPair(inline('תאריך', m.date), inline('שעה', m.time)) + factPair(inline('משך', m.dur + ' דקות'), inline('פלטפורמה', m.platform)) + (m.place ? '<div class="k-center">' + inline('מיקום', m.place) + '</div>' : '') +
        (m.past ? '' : '<i class="k-div"></i><div class="k-calrow">' + icon(m.synced ? 'event-ok' : 'event-busy', 'bi ' + (m.synced ? 'v-positive' : 'v-negative')) + inline('יומן', m.synced ? 'מסונכרן ✓' : 'לא מסונכרן') + '</div>' + (m.synced ? '' : secondary('הוסף ליומן', 'sheetdone:הפגישה נוספה ליומן', null, 'calendar-today')) +
          '<i class="k-div"></i>' + primary('פתח פרופיל ←', m.cl === 'daniel' ? 'go:profile:connection' : 'noop', 'coach') + '<button class="k-secondary v-negative" data-act="sheetclose">' + icon('event-busy', 'bi') + 'בטל פגישה</button>') +
        '<i class="k-div"></i><p class="k-center muted">הפגישה נקבעה ישירות — לא קדמה לה בקשה</p></div>';
    }
    if (kind === 'coord') return '<div class="k-detsheet"><b class="ttl">פרטי תיאום</b>' + heading('עדכון תוכנית אימונים') + '<div class="k-tags">' + statusTag('ממתין לאישורך', 'coach') + '</div>' + factPair(inline('תאריך', '17/09/2026'), inline('שעה', '08:30')) + factPair(inline('משך', '30 דקות'), inline('פלטפורמה', 'טלפון')) +
      '<p class="k-center muted">נפתח על ידי: רון גולדברג ב-08/09/2026</p><div class="k-actions"><div class="row">' + primary('אישור', 'ronapprove', 'coach') + secondary('דחייה', 'sheetclose') + '</div>' + secondary('הצע פגישה חלופית', 'sheetclose', null, 'edit-cal') + secondary("לצ'אט", 'sheetclose', null, 'chat') + '</div>' +
      timeline([['trainee', 'inbox', 'רון פתח בקשה', '08/09/2026 · 09:40']]) + '</div>';
    if (kind === 'coord2') return '<div class="k-detsheet"><b class="ttl">פרטי תיאום</b>' + heading('עדכון תפריט') + '<div class="k-tags">' + statusTag('ממתין לאישורך', 'coach') + '</div>' + factPair(inline('תאריך', '16/09/2026'), inline('שעה', '18:00')) + factPair(inline('משך', '30 דקות'), inline('פלטפורמה', 'זום')) +
      '<p class="k-center muted">נפתח על ידי: דניאל כהן ב-09/09/2026</p><div class="k-actions"><div class="row">' + primary('אישור', 'sheetdone:הפגישה אושרה ✓', 'coach') + secondary('דחייה', 'sheetclose') + '</div>' + secondary('הצע פגישה חלופית', 'sheetclose', null, 'edit-cal') + secondary("לצ'אט", 'go:thread', null, 'chat') + '</div>' +
      timeline([['trainee', 'inbox', 'דניאל פתח בקשה', '09/09/2026 · ' + now()]]) + '</div>';
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
    var screenFn = app.screens[ph.screen] || app.screens[app.tabs[0][0]];
    var top = app.topbar(ph);
    ph.topbar.innerHTML = top; ph.topbar.hidden = !top;
    var full = ph.screen === 'chat' && ph.side === 'trainee' || ph.screen === 'thread' || ph.screen === 'workout' || ph.screen === 'profile';
    ph.stage.innerHTML = '<div class="k-page' + (full ? ' full' : '') + (ph.side === 'trainer' ? ' trainer' : '') + '">' + screenFn(ph) + '</div>';
    ph.nav.innerHTML = navHtml(app, ph);
    ph.nav.classList.toggle('is-open', !!ph.navOpen);
    ph.nav.setAttribute('data-side', ph.side);
    var old = ph.navwrap.querySelector('.dp-fab'); if (old) old.remove();
    var fab = fabSpec(ph);
    if (fab) ph.navwrap.insertAdjacentHTML('beforeend', '<button class="dp-fab ' + fab.cls + '" data-act="' + fab.act + '" aria-label="' + fab.label + '" title="' + fab.label + '">' + icon(fab.icon, 'bi') + '</button>');
    ph.navwrap.classList.toggle('is-open', !!ph.navOpen);
    ph.navwrap.classList.toggle('is-hidden', (ph.side === 'trainee' && ph.screen === 'chat' && !!ph.typing) || ph.screen === 'workout' || ph.screen === 'thread' || ph.screen === 'profile');
    fitNav(ph);
    ph.stage.scrollTop = ph.scrollTop || 0;
    ph.sheet.hidden = !ph.sheetKind;
    ph.sheet.innerHTML = ph.sheetKind ? sheetHtml(ph.sheetKind, ph) : '';
    ph.sheet.className = 'dp-sheet' + (ph.sheetKind ? ' kind-' + ph.sheetKind : '');
    if (ph.hint) { toast(ph, ph.hint); ph.hint = null; }
    if (ph.pulse) { clearTimeout(ph.pulseT); ph.pulseT = setTimeout(function () { ph.pulse = false; var b = ph.stage.querySelector('.k-card.block'); if (b) b.classList.remove('pulse'); }, 1100); }
    var lab = ph.root.parentNode.querySelector('.flip-btn');
    if (lab) lab.querySelector('span').textContent = ph.side === 'trainer' ? 'לממשק המתאמן' : 'לממשק המאמן';
    ph.root.setAttribute('data-side', ph.side);
    ph.root.setAttribute('aria-label', 'הדגמה אינטראקטיבית של ' + (ph.side === 'trainer' ? 'ממשק המאמן' : 'ממשק המתאמן') + ' — כל כפתור לחיץ');
  }
  function renderAll() { phones.forEach(render); }
  function toast(ph, t) {
    ph.toast.textContent = t; ph.toast.classList.add('show');
    clearTimeout(ph.toastT); ph.toastT = setTimeout(function () { ph.toast.classList.remove('show'); }, 2000);
  }
  function fitNav(ph) {
    var nav = ph.nav, on = nav.querySelector('.dp-tab.is-on');
    if (!on) return;
    var navW = nav.offsetWidth, tW = on.offsetWidth, pad = 5;
    var tL = on.offsetParent === nav ? on.offsetLeft + nav.clientLeft : on.offsetLeft - nav.offsetLeft;
    if (!navW || !tW) return;
    var left = Math.max(0, tL - pad), right = Math.max(0, navW - (tL + tW) - pad);
    nav.style.setProperty('--clip', 'inset(0 ' + right.toFixed(1) + 'px 0 ' + left.toFixed(1) + 'px round 24px)');
    nav.style.setProperty('--shift', 'translateX(' + (navW / 2 - (tL + tW / 2)).toFixed(1) + 'px)');
    ph.navwrap.style.setProperty('--fabx', ((navW - (tW + 2 * pad)) / 2).toFixed(1) + 'px');
  }

  /* ── פעולות ───────────────────────────────────────────────────────── */
  function act(ph, a) {
    var p = a.split(':');
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
    else if (p[0] === 'reset') { S = initial(); S.meals[0].eaten = true; phones.forEach(function (x) { x.screen = x.side === 'trainer' ? 'home' : 'today'; x.navOpen = false; x.sheetKind = null; x.typing = false; x.split = false; x.presetIdx = 0; x.scrollTop = 0; x.catOpen = false; x.openMeal = -1; x.openWo = -1; x.openPwo = false; x.openMe = false; x.clientsNeeds = false; x.carousel = 'weight'; x.var_measures = 0; x.var_strength = 0; }); }
    renderAll();
  }
  function scheduleClose(ph, ms) { clearTimeout(ph.closeT); ph.closeT = setTimeout(function () { if (ph.saved) { ph.sheetKind = null; ph.saved = false; renderAll(); } }, reduceMotion ? 1200 : ms); }

  function flip(ph) {
    if (ph.turning) return;
    var wrap = ph.root.parentNode;
    var to = ph.side === 'trainer' ? 'trainee' : 'trainer';
    var swap = function () { ph.side = to; ph.screen = to === 'trainer' ? 'home' : 'today'; ph.navOpen = false; ph.sheetKind = null; ph.typing = false; ph.scrollTop = 0; ph.catOpen = false; render(ph); };
    if (reduceMotion) { swap(); return; }
    ph.turning = true;
    wrap.classList.add('is-flipping');
    var arrow = wrap.querySelector('.flip-btn svg');
    if (arrow) { ph.spins = (ph.spins || 0) + 360; arrow.style.transform = 'rotate(' + ph.spins + 'deg)'; }
    ph.root.classList.add('is-turning');
    setTimeout(swap, 475);
    setTimeout(function () { ph.root.classList.remove('is-turning'); wrap.classList.remove('is-flipping'); ph.turning = false; }, 960);
  }

  function edges() { var s = ''; for (var i = 1; i <= 12; i++) s += '<i class="dp-edge" style="--i:' + i + '" aria-hidden="true"></i>'; return s; }
  function mount(root) {
    var ph = { root: root, side: root.getAttribute('data-side') || 'trainer', navOpen: false, presetIdx: 0, scrollTop: 0, openMeal: -1, openWo: -1 };
    ph.screen = ph.side === 'trainer' ? 'home' : 'today';
    root.innerHTML = '<div class="dp-screen"><div class="dp-status"><span class="dp-clock">' + now() + '</span><span class="dp-status-icons">' + icon('signal') + icon('wifi') + icon('battery') + '</span></div>' +
      '<div class="dp-topbar"></div><div class="dp-stage"></div><div class="dp-navwrap"><div class="dp-nav" role="tablist"></div></div>' +
      '<div class="dp-toast" role="status" aria-live="polite"></div><div class="dp-sheet" hidden></div><div class="dp-sheen" aria-hidden="true"></div></div>' +
      edges() + '<div class="dp-back" aria-hidden="true"><span class="dp-cam"><i></i><i></i><i></i><b></b><u></u></span><svg viewBox="0 0 100 100"><path d="M 41.8 17 A 34 34 0 0 0 41.8 83" fill="none" stroke="#F07C1A" stroke-width="14" stroke-linecap="round"/><path d="M 58.2 17 A 34 34 0 0 1 58.2 83" fill="none" stroke="#12939D" stroke-width="14" stroke-linecap="round"/></svg></div>';
    var ground = document.createElement('div'); ground.className = 'dp-ground'; ground.setAttribute('aria-hidden', 'true');
    root.parentNode.insertBefore(ground, root);
    var placeGround = function () { ground.style.top = (root.offsetTop + root.offsetHeight - 12) + 'px'; };
    placeGround(); window.addEventListener('resize', placeGround);
    ph.topbar = root.querySelector('.dp-topbar'); ph.stage = root.querySelector('.dp-stage'); ph.nav = root.querySelector('.dp-nav'); ph.sheet = root.querySelector('.dp-sheet'); ph.navwrap = root.querySelector('.dp-navwrap'); ph.toast = root.querySelector('.dp-toast');
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
    ph.stage.addEventListener('scroll', function () { ph.scrollTop = ph.stage.scrollTop; }, { passive: true });
    var wrap = root.parentNode;
    var fb = wrap.querySelector('.flip-btn'); if (fb) fb.addEventListener('click', function () { act(ph, 'flip'); });
    var rb = wrap.querySelector('.reset-btn'); if (rb) rb.addEventListener('click', function () { act(ph, 'reset'); });
    phones.push(ph);
    ph.nav.style.transition = 'none';
    render(ph);
    requestAnimationFrame(function () { requestAnimationFrame(function () { ph.nav.style.transition = ''; }); });
    if (!reduceMotion && 'IntersectionObserver' in window) {
      var peeked = false;
      var io = new IntersectionObserver(function (es) {
        if (peeked || !es[0].isIntersecting) return;
        peeked = true; io.disconnect();
        setTimeout(function () { if (!ph.navOpen) { ph.navOpen = true; render(ph); setTimeout(function () { if (ph.navOpen) { ph.navOpen = false; render(ph); } }, 1700); } }, 900);
      }, { threshold: 0.6 });
      io.observe(root);
    }
  }
  document.querySelectorAll('.dp[data-demo]').forEach(mount);
  function refit() {
    phones.forEach(function (ph) { ph.nav.style.transition = 'none'; fitNav(ph); });
    requestAnimationFrame(function () { requestAnimationFrame(function () { phones.forEach(function (ph) { ph.nav.style.transition = ''; }); }); });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
  window.addEventListener('resize', refit);
  window.addEventListener('load', refit);
})();
