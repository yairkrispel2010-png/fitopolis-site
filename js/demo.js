// פיטופוליס — אב-טיפוס אינטראקטיבי של שני הממשקים בתוך הטלפונים שבאתר.
// לא אנימציה: כל מסך מצויר מחדש מ-state אחד משותף לכל הטלפונים בדף, ולכן
// מה שעושים בצד המאמן מופיע בצד המתאמן ולהפך. המחרוזות, המבנה והצבעים —
// מהאפליקציה עצמה (lib/l10n/strings.dart, trainee_strings.dart, המסכים).
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── ה-state המשותף ───────────────────────────────────────
  var initial = function () {
    return {
      chat: [
        { from: 'trainee', text: 'היי, סיימתי את אימון A 💪', time: '14:10' },
        { from: 'trainer', text: 'שלחתי לך את התכנית המעודכנת', time: '14:22' }
      ],
      unreadByTrainer: 2,      // הודעות של מתאמנים שהמאמן עוד לא פתח
      unreadByTrainee: 1,      // הודעות של המאמן שהמתאמן עוד לא פתח
      meetingConfirmed: false, // הפגישה של דניאל היום 19:00
      requestPending: true,    // בקשת הפגישה של אור
      requestSentByTrainee: false,
      meals: [
        { name: 'בוקר', time: '08:00', eaten: true },
        { name: 'צהריים', time: '13:00', eaten: false, src: 'חזה עוף 150 גר׳ · אורז לבן כוס · סלט ירקות', alt: 'או: בשר בקר רזה 130 גר׳ · בטטה בינונית', p: 42, c: 55, f: 12, k: 496 },
        { name: 'ביניים אחר הצהריים', time: '16:30', eaten: false, src: 'יוגורט חלבון · תפוח · 10 שקדים', alt: '', p: 24, c: 30, f: 8, k: 280 },
        { name: 'ערב', time: '19:30', eaten: false, src: 'סלמון 150 גר׳ · קינואה כוס · ירקות מאודים', alt: 'או: טופו 200 גר׳ · אורז מלא', p: 38, c: 48, f: 16, k: 500 }
      ],
      exercises: [
        { name: 'לחיצת חזה במוט', sets: 4, reps: 8, kg: 60, done: 0 },
        { name: 'לחיצת כתפיים', sets: 3, reps: 10, kg: 32, done: 0 },
        { name: 'פרפר בכבלים', sets: 3, reps: 12, kg: 15, done: 0 }
      ],
      workoutDone: false,
      weightLogged: false,
      payments: [
        { name: 'מיכל לוי', av: 'מל', c: 'green', period: 'ספטמבר', paid: true },
        { name: 'דניאל כהן', av: 'דכ', c: 'blue', period: 'ספטמבר', paid: false },
        { name: 'יוסי מזרחי', av: 'ימ', c: 'amber', period: 'אוגוסט', paid: false, late: true }
      ]
    };
  };
  var S = initial();
  var trainerPresets = ['עדכנתי לך את התפריט, תציץ בכרטיס', 'תזכור לעדכן משקל היום', 'כל הכבוד על השבוע 💪'];
  var traineePresets = ['תודה! הבנתי את ההנחיות 💪', 'סיימתי את הצהריים, היה טעים', 'אפשר להזיז את הפגישה לשבוע הבא?'];

  // ── עזרים ────────────────────────────────────────────────
  function icon(id, cls) { return '<svg class="' + (cls || '') + '"><use href="#i-' + id + '"/></svg>'; }
  function av(txt, color, extra) { return '<span class="av av-' + color + ' ' + (extra || '') + '">' + txt + '</span>'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function now() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function attentionCount() { return (S.weightLogged ? 0 : 1) + 1; }           // דניאל (משקל) + יוסי (מידות)
  function lastTrainerMsg() { for (var i = S.chat.length - 1; i >= 0; i--) if (S.chat[i].from === 'trainer') return S.chat[i]; return null; }
  function lastTraineeMsg() { for (var i = S.chat.length - 1; i >= 0; i--) if (S.chat[i].from === 'trainee') return S.chat[i]; return null; }
  function nextMeal() { for (var i = 0; i < S.meals.length; i++) if (!S.meals[i].eaten) return S.meals[i]; return null; }
  function lastEaten() { var m = null; for (var i = 0; i < S.meals.length; i++) if (S.meals[i].eaten) m = S.meals[i]; return m; }
  function requestsCount() { return (S.requestPending ? 1 : 0) + (S.requestSentByTrainee ? 1 : 0); }

  // ── מסכי המאמן ───────────────────────────────────────────
  var trainer = {
    tabs: [['home', 'home', 'בית'], ['clients', 'people', 'לקוחות'], ['chat', 'chat', "צ'אט"], ['meetings', 'calendar', 'פגישות'], ['payments', 'card', 'תשלום']],
    topbar: function () {
      return '<span class="dp-wm" dir="ltr">' + wordmark() + '</span>' +
        '<button class="dp-tbtn v-coach" aria-label="התראות">' + icon('bell') + '</button>' +
        '<button class="dp-tbtn v-system" aria-label="מעבר לממשק המתאמן" data-act="flip">' + icon('swap') + '</button>' +
        '<button class="dp-tbtn v-system" aria-label="הגדרות">' + icon('settings') + '</button>' +
        '<span class="dp-me ring-coach" aria-hidden="true">רל</span>';
    },
    screens: {
      home: function () {
        var unread = S.unreadByTrainer, att = attentionCount(), req = requestsCount();
        var avs = [av('דכ', 'blue'), av('מל', 'green')]; if (unread > 2) avs.push(av('שכ', 'purple'));
        return '<div class="dp-stitle"><i></i><span>היום</span><i></i></div>' +
          card(icon('chat', 'ic ' + (unread ? 'v-trainee' : 'v-muted')), 'הודעות', unread ? unread + ' הודעות לא נקראו' : 'אין הודעות חדשות', unread ? avs.slice(0, Math.min(3, unread)).join('') : '', "לכל הצ'אטים", 'go:chat') +
          card(icon('priority', 'ic ' + (att ? 'v-attention' : 'v-muted')), 'דורשים טיפול', att ? att + ' לקוחות דורשים טיפול' : 'כל הלקוחות מעודכנים ✓', att ? [S.weightLogged ? '' : av('דכ', 'blue'), av('ימ', 'amber')].join('') : '', 'לכולם', 'go:clients') +
          '<div class="dp-card"><div class="dp-ct">' + icon('event', 'ic v-coach') + '<span>פגישות קרובות</span></div>' +
            mrow('מל', 'green', 'מיכל לוי · 08/09 · 17:30', 'go:meetings') + mrow('דכ', 'blue', 'דניאל כהן · 08/09 · 19:00', 'go:meetings') +
            '<div class="dp-label">סה"כ 2 פגישות היום</div><button class="dp-obtn" data-act="go:meetings">לכל הפגישות</button></div>' +
          card(icon('inbox', 'ic ' + (req ? 'v-attention' : 'v-muted')), 'בקשות פגישה', req ? req + ' בקשות ממתינות' : 'אין בקשות חדשות', req ? [S.requestPending ? av('אב', 'amber') : '', S.requestSentByTrainee ? av('דכ', 'blue') : ''].join('') : '', 'לכל הבקשות', 'go:meetings',
            req ? 'הבקשה הישנה ביותר התקבלה: 08/09 · 09:15' : '');
      },
      clients: function () {
        var rows = [
          ['דכ', 'blue', 'דניאל כהן', 'ירידה במשקל · מאז 03/2026', S.weightLogged ? ['ok', 'הכל תקין ✓'] : ['needs', 'נדרש טיפול'], 'go:profile'],
          ['מל', 'green', 'מיכל לוי', 'חיטוב · מאז 01/2026', ['ok', 'הכל תקין ✓'], ''],
          ['ימ', 'amber', 'יוסי מזרחי', 'עלייה במסה · מאז 05/2026', ['needs', 'נדרש טיפול'], ''],
          ['שכ', 'purple', 'שירה כהן', 'שמירה על כושר · מאז 02/2026', ['ok', 'הכל תקין ✓'], ''],
          ['אב', 'amber', 'אור בן דוד', 'חיטוב · מאז 06/2026', ['ok', 'הכל תקין ✓'], ''],
          ['רג', 'green', 'רון גולדברג', 'סיבולת · מאז 04/2026', ['ok', 'הכל תקין ✓'], '']
        ];
        return '<div class="dp-stitle"><i></i><span>לקוחות</span><i></i></div>' +
          '<div class="dp-search">' + icon('search') + '<span>חיפוש</span></div>' +
          '<div class="dp-filter"><span class="on">כולם</span><span>נדרש טיפול</span></div>' +
          '<div class="dp-count">6 לקוחות</div>' +
          rows.map(function (r) {
            return '<button class="dp-ccard" data-act="' + r[5] + '"' + (r[5] ? '' : ' disabled') + '>' + av(r[0], r[1], 'md') +
              '<span class="col"><b>' + r[2] + '</b><small>' + r[3] + '</small></span><span class="badge-' + r[4][0] + '">' + r[4][1] + '</span></button>';
          }).join('');
      },
      profile: function () {
        return '<div class="dp-chead"><button class="back" data-act="go:clients" aria-label="חזרה">' + icon('back') + '</button><span class="cname">דניאל כהן</span></div>' +
          '<div class="dp-hero">' + av('דכ', 'blue', 'lg') +
            '<div class="facts"><span><b>גובה</b>180 ס"מ</span><span><b>משקל</b>' + (S.weightLogged ? '81.2' : '81.4') + ' ק"ג</span><span><b>גיל</b>30</span><span><b>מאז</b>03/2026</span></div>' +
            '<div class="tags"><span class="tag-set">מזין ארוחות</span><span class="tag-set">מגבלה: גב תחתון</span><i></i>' + (S.weightLogged ? '<span class="badge-ok">הכל תקין ✓</span>' : '<span class="badge-needs">נדרש טיפול</span>') + '</div>' +
          '</div>' +
          '<div class="dp-tabs"><span class="on">מעקב</span><span>יצירת קשר</span><span>תשלומים</span></div>' +
          '<div class="dp-tcard">' +
            prow(icon('weight', 'ic ' + (S.weightLogged ? 'v-trainee' : 'v-attention')), 'משקל', S.weightLogged ? '81.2 ק"ג · עודכן היום ✓' : '81.4 ק"ג · לא עודכן השבוע') +
            prow(icon('fitness', 'ic v-coach'), 'תוכנית אימון', 'תכנית 4 ימים · ' + (S.workoutDone ? 'אימון A בוצע היום ✓' : '3 מתוך 4 השבוע')) +
            prow(icon('restaurant', 'ic v-coach'), 'תפריט', 'תפריט חיטוב · ' + S.meals.filter(function (m) { return m.eaten; }).length + ' מתוך 4 ארוחות סומנו היום') +
            prow(icon('event', 'ic v-coach'), 'פגישה קרובה', 'היום · 19:00 · מדידת היקפים' + (S.meetingConfirmed ? ' · אישר הגעה ✓' : '')) +
          '</div>';
      },
      chat: function () {
        var lt = S.chat[S.chat.length - 1];
        return '<div class="dp-stitle"><i></i><span>צ\'אט</span><i></i></div>' +
          '<div class="dp-filter"><span class="on">הכל</span><span>לא נקראו</span></div>' +
          crow('דכ', 'blue', 'דניאל כהן', lt.text, lt.time, S.unreadByTrainer > 2 ? 1 : 0, 'go:thread') +
          crow('מל', 'green', 'מיכל לוי', 'אישרתי את הפגישה ליום חמישי 👍', 'אתמול', 1, '') +
          crow('שכ', 'purple', 'שירה כהן', 'כן, בדקתי את התפריט ונראה לי טוב...', 'אתמול', 1, '');
      },
      thread: function (ph) {
        var preset = trainerPresets[ph.presetIdx % trainerPresets.length];
        return '<div class="dp-chead"><button class="back" data-act="go:chat" aria-label="חזרה">' + icon('back') + '</button>' + av('דכ', 'blue', 'sm ring-trainee') + '<span class="cname">דניאל כהן</span></div>' +
          '<div class="dp-bubbles">' + S.chat.map(function (m) { return '<div class="bub ' + (m.from === 'trainer' ? 'mine' : 'theirs') + '">' + esc(m.text) + '<time>' + m.time + '</time></div>'; }).join('') + '</div>' +
          '<div class="dp-input"><span class="field">' + esc(preset) + '</span><button class="send" data-act="send:trainer" aria-label="שלח הודעה">' + icon('send') + '</button></div>';
      },
      meetings: function () {
        return '<div class="dp-stitle"><i></i><span>פגישות</span><i></i></div>' +
          (requestsCount() ? '<div class="dp-sub">ממתין לאישורך</div>' : '') +
          (S.requestPending ? '<div class="dp-tcard dp-req">' + av('אב', 'amber', 'sm') + '<span class="col"><b>אור בן דוד</b><small>יום חמישי · 18:00 · מדידת היקפים</small></span><button class="dp-mini v-coach-fill" data-act="approve">אשר</button></div>' : '') +
          (S.requestSentByTrainee ? '<div class="dp-tcard dp-req">' + av('דכ', 'blue', 'sm') + '<span class="col"><b>דניאל כהן</b><small>שבוע הבא · 19:00 · ' + esc('מדידת היקפים') + '</small></span><button class="dp-mini v-coach-fill" data-act="approve2">אשר</button></div>' : '') +
          '<div class="dp-sub">היום</div>' +
          meet('מל', 'green', 'מיכל לוי', '17:30 · אימון כוח', ['positive', 'אישרה הגעה ✓']) +
          meet('דכ', 'blue', 'דניאל כהן', '19:00 · מדידת היקפים', S.meetingConfirmed ? ['positive', 'אישר הגעה ✓'] : ['attention', 'ממתין לאישור']) +
          '<div class="dp-sub">מחר</div>' + meet('רג', 'green', 'רון גולדברג', '10:00 · ריצה', ['neutral', 'טרם אושר']);
      },
      payments: function () {
        return '<div class="dp-stitle"><i></i><span>תשלומים</span><i></i></div>' +
          '<div class="dp-sub">ספטמבר</div>' +
          S.payments.map(function (p, i) {
            var badge = p.paid ? '<span class="chip chip-positive">שולם ✓</span>' : (p.late ? '<span class="chip chip-negative">באיחור</span>' : '<span class="chip chip-attention">לא שולם</span>');
            return '<button class="dp-ccard" data-act="' + (p.paid ? '' : 'pay:' + i) + '"' + (p.paid ? ' disabled' : '') + '>' + av(p.av, p.c, 'md') + '<span class="col"><b>' + p.name + '</b><small>' + p.period + ' · 350 ₪' + (p.paid ? '' : ' · לחץ לרישום תשלום') + '</small></span>' + badge + '</button>';
          }).join('');
      }
    }
  };

  // ── מסכי המתאמן ──────────────────────────────────────────
  var trainee = {
    tabs: [['today', 'today', 'בית'], ['nutrition', 'restaurant', 'תזונה'], ['workouts', 'fitness', 'אימונים'], ['meetings', 'calendar', 'פגישות'], ['chat', 'chat', "צ'אט"]],
    topbar: function () {
      return '<span class="dp-wm" dir="ltr">' + wordmark() + '</span>' +
        '<button class="dp-tbtn v-system" aria-label="מעבר לממשק המאמן" data-act="flip">' + icon('swap') + '</button>' +
        '<button class="dp-tbtn v-system" aria-label="הגדרות">' + icon('settings') + '</button>' +
        '<span class="dp-me av-blue ring-trainee" aria-hidden="true">דכ</span>';
    },
    screens: {
      today: function () {
        var lm = lastTrainerMsg(), nm = nextMeal(), le = lastEaten();
        return '<div class="dp-ghead"><span>היום</span><i></i></div>' +
          '<div class="dp-tcard">' +
            trow(icon('campaign', 'ic v-coach'), 'הודעה מהמאמן', lm ? lm.text : '—', 'go:chat', S.unreadByTrainee ? '<span class="badge">' + S.unreadByTrainee + '</span>' : '') +
            (S.workoutDone
              ? trow(icon('check', 'ic v-trainee'), 'האימון של היום', 'השלמת את האימון היום ✓', 'go:workouts')
              : trow(icon('fitness', 'ic v-coach'), 'האימון של היום', 'אימון A – חזה + כתפיים', 'go:workout', '', '<span class="sub">' + icon('calendar', 'v-coach') + 'המאמן קבע לבצע בין יום ראשון ליום שלישי</span>')) +
            trow(icon('event', 'ic ' + (S.meetingConfirmed ? 'v-trainee' : 'v-coach')), 'פגישה היום', '08/09 · 19:00 · מדידת היקפים' + (S.meetingConfirmed ? ' · אישרת הגעה ✓' : ''), 'go:meetings') +
            (S.weightLogged
              ? trow(icon('check', 'ic v-trainee'), 'הזנת משקל', '81.2 ק"ג · עודכן היום ✓', 'weight')
              : trow(icon('weight', 'ic v-attention'), 'הזנת משקל', 'מומלץ לעדכן משקל השבוע', 'weight')) +
          '</div>' +
          '<div class="dp-tcard dp-meal">' + (nm && !le ? mealFull(nm) : nm ? mealSplit(le, nm) : '<div class="meal-done">' + icon('check', 'v-trainee') + 'סיימת את כל הארוחות של היום! הארוחה הבאה תהיה מחר.</div>') + '</div>' +
          '<div class="dp-ghead"><span>מעקב התקדמות</span><i></i></div>' +
          '<div class="dp-tcard dp-graph"><span class="lbl">משקל גוף · חודש</span><span class="big"><b>' + (S.weightLogged ? '81.2' : '81.4') + '</b><i>ק"ג</i></span>' +
            '<svg class="line" viewBox="0 0 240 64" preserveAspectRatio="none"><path d="M2 14 C 30 18, 52 26, 80 24 S 130 40, 160 38 S 210 52, 238 ' + (S.weightLogged ? '54' : '50') + '" fill="none" stroke="#12939D" stroke-width="2.5" stroke-linecap="round"/></svg></div>';
      },
      nutrition: function () {
        return '<div class="dp-ghead"><span>תזונה</span><i></i></div><div class="dp-sub">התפריט המלא · תפריט חיטוב</div>' +
          S.meals.map(function (m, i) {
            return '<div class="dp-tcard dp-mealrow' + (m.eaten ? ' eaten' : '') + '"><span class="col"><b>' + m.name + '</b><small>' + icon('schedule', 'v-coach') + 'מתי כדאי לאכול: ' + m.time + (m.src ? ' · ' + m.p + ' חלבון · ' + m.k + ' קק"ל' : '') + '</small></span>' +
              (m.eaten ? '<button class="dp-mini v-trainee-text" data-act="uneat:' + i + '">' + icon('check', 'v-trainee') + 'נאכל ✓</button>' : '<button class="dp-eat compact" data-act="eat:' + i + '">' + icon('check') + 'סמן שאכלת</button>') + '</div>';
          }).join('');
      },
      workouts: function () {
        var w = [['אימון A – חזה + כתפיים', S.workoutDone ? 'בוצע היום ✓' : 'להיום · 3 תרגילים', S.workoutDone], ['אימון B – גב + זרועות', 'יום רביעי', false], ['אימון C – רגליים', 'יום שישי', false]];
        return '<div class="dp-ghead"><span>האימונים שלי</span><i></i></div><div class="dp-sub">תכנית 4 ימים · מהמאמן</div>' +
          w.map(function (x, i) { return '<button class="dp-ccard" data-act="' + (i === 0 ? 'go:workout' : '') + '"' + (i ? ' disabled' : '') + '>' + icon('fitness', 'ic ' + (x[2] ? 'v-trainee' : 'v-coach')) + '<span class="col"><b>' + x[0] + '</b><small>' + x[1] + '</small></span>' + (i === 0 && !x[2] ? '<span class="chip chip-coach">התחל אימון</span>' : '') + '</button>'; }).join('');
      },
      workout: function () {
        var all = S.exercises.every(function (e) { return e.done >= e.sets; });
        return '<div class="dp-chead"><button class="back" data-act="go:workouts" aria-label="חזרה">' + icon('back') + '</button><span class="cname">אימון A – חזה + כתפיים</span></div>' +
          '<div class="dp-sub">לחץ על סט כשסיימת אותו</div>' +
          S.exercises.map(function (e, i) {
            var dots = ''; for (var s = 0; s < e.sets; s++) dots += '<button class="setdot' + (s < e.done ? ' on' : '') + '" data-act="set:' + i + ':' + s + '" aria-label="סט ' + (s + 1) + '">' + (s + 1) + '</button>';
            return '<div class="dp-tcard dp-ex"><span class="col"><b>' + e.name + '</b><small>' + e.sets + ' סטים × ' + e.reps + ' חזרות · ' + e.kg + ' ק"ג</small></span><span class="dots">' + dots + '</span></div>';
          }).join('') +
          '<button class="dp-eat' + (all ? '' : ' dim') + '" data-act="finish">' + icon('check') + (S.workoutDone ? 'בוצע ✓' : 'סיים אימון') + '</button>';
      },
      meetings: function () {
        return '<div class="dp-ghead"><span>פגישות</span><i></i></div><div class="dp-sub">פגישה קרובה</div>' +
          '<div class="dp-tcard dp-meetcard"><span class="col"><b>היום · 19:00</b><small>מדידת היקפים · עם המאמן</small></span>' +
            (S.meetingConfirmed ? '<span class="chip chip-positive">אישרת הגעה ✓</span>' : '<button class="dp-eat compact" data-act="confirm">' + icon('check') + 'אשר הגעה</button>') + '</div>' +
          '<div class="dp-sub">פגישות הבאות</div><div class="dp-tcard dp-meetcard"><span class="col"><b>יום שני · 19:00</b><small>אימון משותף</small></span></div>' +
          (S.requestSentByTrainee ? '<div class="dp-note-ok">' + icon('check', 'v-trainee') + 'הבקשה נשלחה למאמן ✓</div>' : '<button class="dp-obtn" data-act="request">בקשת פגישה</button>');
      },
      chat: function (ph) {
        var preset = traineePresets[ph.presetIdx % traineePresets.length];
        return '<div class="dp-chead">' + av('רל', 'blue', 'sm ring-coach') + '<span class="cname">המאמן שלך · רן</span></div>' +
          '<div class="dp-bubbles">' + S.chat.map(function (m) { return '<div class="bub ' + (m.from === 'trainee' ? 'mine' : 'theirs') + '">' + esc(m.text) + '<time>' + m.time + '</time></div>'; }).join('') + '</div>' +
          '<div class="dp-input"><span class="field">' + esc(preset) + '</span><button class="send" data-act="send:trainee" aria-label="שלח הודעה">' + icon('send') + '</button></div>';
      }
    }
  };

  // ── חתיכות HTML משותפות ──────────────────────────────────
  function wordmark() {
    return '<b class="fit">FIT</b><svg class="o" viewBox="0 0 100 100"><path d="M 41.8 17 A 34 34 0 0 0 41.8 83" fill="none" stroke="#F07C1A" stroke-width="14" stroke-linecap="round"/><path d="M 58.2 17 A 34 34 0 0 1 58.2 83" fill="none" stroke="#12939D" stroke-width="14" stroke-linecap="round"/></svg><b class="polis">POLIS</b>';
  }
  function card(ic, title, body, avs, btn, act, note) {
    return '<div class="dp-card"><div class="dp-ct">' + ic + '<span>' + title + '</span></div><div class="dp-body">' + body + '</div>' +
      (note ? '<div class="dp-note">' + note + '</div>' : '') + (avs ? '<div class="dp-avs">' + avs + '</div>' : '') +
      '<button class="dp-obtn" data-act="' + act + '">' + btn + '</button></div>';
  }
  function mrow(a, c, txt, act) { return '<button class="dp-mrow" data-act="' + act + '">' + av(a, c, 'sm') + '<span class="mtxt">' + txt + '</span>' + icon('chevron', 'chev') + '</button>'; }
  function crow(a, c, name, last, time, unread, act) {
    return '<button class="dp-ccard" data-act="' + act + '"' + (act ? '' : ' disabled') + '>' + av(a, c, 'md') + '<span class="col"><b>' + name + '</b><small>' + esc(last) + '</small></span><span class="meta"><time>' + time + '</time>' + (unread ? '<span class="badge badge-trainee">' + unread + '</span>' : '') + '</span></button>';
  }
  function meet(a, c, name, when, st) { return '<div class="dp-tcard dp-req">' + av(a, c, 'sm') + '<span class="col"><b>' + name + '</b><small>' + when + '</small></span><span class="chip chip-' + st[0] + '">' + st[1] + '</span></div>'; }
  function prow(ic, lbl, val) { return '<div class="dp-row">' + ic + '<span class="col"><span class="lbl">' + lbl + '</span><span class="val">' + val + '</span></span></div>'; }
  function trow(ic, lbl, val, act, badge, sub) { return '<button class="dp-row" data-act="' + act + '">' + ic + '<span class="col"><span class="lbl">' + lbl + '</span><span class="val">' + esc(val) + '</span>' + (sub || '') + '</span>' + (badge || '') + '</button>'; }
  function macros(m) { return '<div class="macros"><span class="mc"><small>חלבון</small><b>' + m.p + '</b><i>גר׳</i></span><span class="mc"><small>פחמימה</small><b>' + m.c + '</b><i>גר׳</i></span><span class="mc"><small>שומן</small><b>' + m.f + '</b><i>גר׳</i></span><span class="mc"><small>קלוריות</small><b>' + m.k + '</b><i></i></span></div>'; }
  function mealFull(m) {
    return '<div class="meal-full"><span class="vpill">' + icon('arrow') + 'הארוחה הבאה</span><span class="mname">' + m.name + '</span><span class="mtime">' + icon('schedule', 'v-coach') + 'מתי כדאי לאכול: ' + m.time + '</span>' +
      (m.src ? '<span class="msrc">' + m.src + '</span>' : '') + (m.alt ? '<span class="msrc muted">' + m.alt + '</span>' : '') + macros(m) +
      '<button class="dp-eat" data-act="eatnext">' + icon('check') + 'סמן שאכלת</button></div>';
  }
  function mealSplit(le, nm) {
    return '<div class="meal-split on"><div class="half eaten"><span class="lbl">אכלת</span><span class="mname muted">' + le.name + '</span><span class="done">' + icon('check', 'v-trainee') + 'נאכל ✓</span></div><i class="vdiv"></i>' +
      '<div class="half next"><span class="vpill">' + icon('arrow') + 'הארוחה הבאה</span><span class="mname">' + nm.name + '</span><span class="mtime">' + icon('schedule', 'v-coach') + 'מתי כדאי לאכול: ' + nm.time + '</span><button class="dp-eat compact" data-act="eatnext">' + icon('check') + 'סמן גם אותה</button></div></div>';
  }
  function navHtml(app, ph) {
    var side = ph.side;
    return app.tabs.map(function (t) {
      var on = ph.screen === t[0] || (side === 'trainer' && ph.screen === 'thread' && t[0] === 'chat') || (side === 'trainer' && ph.screen === 'profile' && t[0] === 'clients') || (side === 'trainee' && ph.screen === 'workout' && t[0] === 'workouts');
      return '<button class="dp-tab' + (on ? ' is-on' : '') + '" role="tab" aria-selected="' + on + '" data-act="tab:' + t[0] + '">' + icon(t[1]) + '<b>' + t[2] + '</b></button>';
    }).join('');
  }

  // ── הטלפונים בדף ─────────────────────────────────────────
  var phones = [];
  function render(ph) {
    var app = ph.side === 'trainer' ? trainer : trainee;
    var screenFn = app.screens[ph.screen] || app.screens[app.tabs[0][0]];
    ph.topbar.innerHTML = app.topbar();
    ph.stage.innerHTML = '<div class="dp-page' + (ph.screen === 'thread' || ph.screen === 'chat' && ph.side === 'trainee' ? ' dp-chat' : '') + '">' + screenFn(ph) + '</div>';
    ph.nav.innerHTML = navHtml(app, ph);
    ph.nav.classList.toggle('is-open', !!ph.navOpen);
    ph.nav.setAttribute('data-side', ph.side);
    fitNav(ph);
    ph.stage.scrollTop = ph.scrollTop || 0;
    if (ph.sheet) ph.sheet.hidden = !ph.sheetOpen;
    if (ph.hint) { toast(ph, ph.hint); ph.hint = null; }
    var lab = ph.root.parentNode.querySelector('.flip-btn');
    if (lab) lab.querySelector('span').textContent = ph.side === 'trainer' ? 'לממשק המתאמן' : 'לממשק המאמן';
    ph.root.setAttribute('data-side', ph.side);
    ph.root.setAttribute('aria-label', 'הדגמה אינטראקטיבית של ' + (ph.side === 'trainer' ? 'ממשק המאמן' : 'ממשק המתאמן') + ' — כל כפתור לחיץ');
  }
  function renderAll() { phones.forEach(render); }
  function toast(ph, t) {
    ph.toast.textContent = t; ph.toast.classList.add('show');
    clearTimeout(ph.toastT); ph.toastT = setTimeout(function () { ph.toast.classList.remove('show'); }, 1800);
  }

  // הבר מכווץ סביב הטאב הפעיל: חותכים את הגלולה לגבולות הטאב ומזיזים אותה
  // כך שהפרוסה הנראית יושבת במרכז המסך — כמו bottom_nav_with_fab.dart,
  // בלי להנפיש רוחב (רק clip-path ו-transform).
  function fitNav(ph) {
    var nav = ph.nav, on = nav.querySelector('.dp-tab.is-on');
    if (!on) return;
    var nr = nav.getBoundingClientRect(), tr = on.getBoundingClientRect(), pad = 5;
    var right = Math.max(0, nr.right - tr.right - pad), left = Math.max(0, tr.left - nr.left - pad);
    nav.style.setProperty('--clip', 'inset(0 ' + right.toFixed(1) + 'px 0 ' + left.toFixed(1) + 'px round 24px)');
    var m = new DOMMatrix(getComputedStyle(nav).transform);          // מנטרלים הזזה קודמת
    var sliceCenter = (tr.left + tr.right) / 2 - m.m41, navCenter = (nr.left + nr.right) / 2 - m.m41;
    nav.style.setProperty('--shift', 'translateX(' + (navCenter - sliceCenter).toFixed(1) + 'px)');
  }

  function act(ph, a) {
    var p = a.split(':');
    if (p[0] === 'go') { ph.screen = p[1]; ph.scrollTop = 0; ph.navOpen = false; if (p[1] === 'thread') S.unreadByTrainer = 0; if (ph.side === 'trainee' && p[1] === 'chat') S.unreadByTrainee = 0; }
    else if (p[0] === 'tab') { if (!ph.navOpen && !reduceMotion) { ph.navOpen = true; render(ph); return; } ph.navOpen = false; act(ph, 'go:' + p[1]); return; }
    else if (p[0] === 'flip') { flip(ph); return; }
    else if (p[0] === 'send') {
      var isTrainer = p[1] === 'trainer';
      var txt = (isTrainer ? trainerPresets : traineePresets)[ph.presetIdx % 3]; ph.presetIdx++;
      S.chat.push({ from: isTrainer ? 'trainer' : 'trainee', text: txt, time: now() });
      if (isTrainer) S.unreadByTrainee++; else S.unreadByTrainer++;
      ph.scrollTop = 9999;
    }
    else if (p[0] === 'approve') { S.requestPending = false; }
    else if (p[0] === 'approve2') { S.requestSentByTrainee = false; }
    else if (p[0] === 'pay') { S.payments[+p[1]].paid = true; S.payments[+p[1]].late = false; }
    else if (p[0] === 'eat') { S.meals[+p[1]].eaten = true; }
    else if (p[0] === 'uneat') { S.meals[+p[1]].eaten = false; }
    else if (p[0] === 'eatnext') { var nm = nextMeal(); if (nm) nm.eaten = true; }
    else if (p[0] === 'set') { var e = S.exercises[+p[1]], s = +p[2]; e.done = (s < e.done) ? s : s + 1; }
    else if (p[0] === 'finish') { if (S.exercises.every(function (e) { return e.done >= e.sets; })) { S.workoutDone = true; ph.screen = 'workouts'; } else { ph.hint = 'סמן את כל הסטים קודם'; } }
    else if (p[0] === 'confirm') { S.meetingConfirmed = true; }
    else if (p[0] === 'request') { S.requestSentByTrainee = true; }
    else if (p[0] === 'weight') { ph.sheetOpen = true; }
    else if (p[0] === 'weightsave') { S.weightLogged = true; ph.sheetOpen = false; }
    else if (p[0] === 'sheetclose') { ph.sheetOpen = false; }
    else if (p[0] === 'reset') { S = initial(); phones.forEach(function (x) { x.screen = x.side === 'trainer' ? 'home' : 'today'; x.navOpen = false; x.sheetOpen = false; x.presetIdx = 0; x.scrollTop = 0; }); }
    renderAll();
  }

  function flip(ph) {
    if (ph.turning) return;
    var wrap = ph.root.parentNode;
    var to = ph.side === 'trainer' ? 'trainee' : 'trainer';
    var swap = function () { ph.side = to; ph.screen = to === 'trainer' ? 'home' : 'today'; ph.navOpen = false; ph.sheetOpen = false; ph.scrollTop = 0; render(ph); };
    if (reduceMotion) { swap(); return; }
    ph.turning = true;
    wrap.classList.add('is-flipping');
    var arrow = wrap.querySelector('.flip-btn svg');
    if (arrow) { ph.spins = (ph.spins || 0) + 360; arrow.style.transform = 'rotate(' + ph.spins + 'deg)'; }
    ph.root.classList.add('is-turning');
    setTimeout(swap, 475);                                            // המסך פונה מאיתנו — מחליפים
    setTimeout(function () { ph.root.classList.remove('is-turning'); wrap.classList.remove('is-flipping'); ph.turning = false; }, 960);
  }

  function mount(root) {
    var ph = { root: root, side: root.getAttribute('data-side') || 'trainer', navOpen: false, presetIdx: 0, scrollTop: 0 };
    ph.screen = ph.side === 'trainer' ? 'home' : 'today';
    root.innerHTML = '<div class="dp-screen"><div class="dp-status"><span class="dp-clock">' + now() + '</span><span class="dp-status-icons">' + icon('signal') + icon('wifi') + icon('battery') + '</span></div>' +
      '<div class="dp-topbar"></div><div class="dp-stage"></div><div class="dp-navwrap"><div class="dp-nav" role="tablist"></div></div>' +
      '<div class="dp-toast" role="status" aria-live="polite"></div><div class="dp-sheet" hidden><div class="sheet-card"><span class="lbl">הזנת משקל</span><span class="big"><b>81.2</b><i>ק"ג</i></span><span class="hint">היום · אפשר לערוך עד חצות</span><div class="sheet-btns"><button class="dp-obtn" data-act="sheetclose">ביטול</button><button class="dp-eat compact" data-act="weightsave">' + icon('check') + 'שמור</button></div></div></div></div>' +
      '<div class="dp-back" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="M 41.8 17 A 34 34 0 0 0 41.8 83" fill="none" stroke="#F07C1A" stroke-width="14" stroke-linecap="round"/><path d="M 58.2 17 A 34 34 0 0 1 58.2 83" fill="none" stroke="#12939D" stroke-width="14" stroke-linecap="round"/></svg></div>';
    ph.topbar = root.querySelector('.dp-topbar'); ph.stage = root.querySelector('.dp-stage'); ph.nav = root.querySelector('.dp-nav'); ph.sheet = root.querySelector('.dp-sheet'); ph.toast = root.querySelector('.dp-toast');
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      // לחיצה מחוץ לבר סוגרת אותו (כמו באפליקציה)
      if (ph.navOpen && !e.target.closest('.dp-nav')) { ph.navOpen = false; if (!b) { render(ph); return; } }
      if (!b || !root.contains(b) || b.disabled) return;
      e.preventDefault(); act(ph, b.getAttribute('data-act'));
    });
    ph.stage.addEventListener('scroll', function () { ph.scrollTop = ph.stage.scrollTop; }, { passive: true });
    // כפתור הסיבוב ואיפוס — מחוץ לטלפון, בתוך העטיפה
    var wrap = root.parentNode;
    var fb = wrap.querySelector('.flip-btn'); if (fb) fb.addEventListener('click', function () { act(ph, 'flip'); });
    var rb = wrap.querySelector('.reset-btn'); if (rb) rb.addEventListener('click', function () { act(ph, 'reset'); });
    phones.push(ph);
    ph.nav.style.transition = 'none';                               // הבר נולד מכווץ, בלי אנימציית פתיחה בטעינה
    render(ph);
    requestAnimationFrame(function () { requestAnimationFrame(function () { ph.nav.style.transition = ''; }); });
  }

  document.querySelectorAll('.dp[data-demo]').forEach(mount);
  // הגלולה נמדדת שוב אחרי שהגופנים נטענו ובשינוי גודל — אחרת הרוחב של התווית לא נכון בלחיצה הראשונה
  function refit() { phones.forEach(fitNav); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
  window.addEventListener('resize', refit);
  window.addEventListener('load', refit);
})();
