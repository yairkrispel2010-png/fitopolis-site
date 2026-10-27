// פיטופוליס — הפתיח: הלוגו במרכז; בגלילה FIT ו-POLIS זזים הצידה, וה-O גדל עד שהחור
// שבתוכו חושף את האתר — ונעצר כשקצוות הטבעת יושבים בפינות המסך. משם עוד קצת גלילה
// הראש של האתר עומד במקום; אחר כך האתר נגלל בתוך המסגרת הזאת עד הבלוק הכהה שלמטה,
// ושם המסגרת עולה יחד עם הקצה העליון שלו.
// אין ספרייה. בזמן הזום — SVG אחד בגודל המסך: מלבן לבן עם חור עגול (evenodd, בלי מסכה) והטבעת.
// אחרי הזום — שתי שכבות של קצוות ה-O, אחת נעוצה לראש המסך ואחת לתחתית שלו. הכל לפי scrollY.
(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.classList.contains('intro-on')) { return; }

  var intro = document.querySelector('.intro');
  var pin = document.querySelector('.intro-pin');
  var dark = document.querySelector('[data-intro-end]');   // הבלוק הכהה: עד אליו האתר נגלל בתוך המסגרת
  var slot = intro && intro.querySelector('.intro-o-slot');
  var ring = document.getElementById('intro-ring');
  var veil = document.getElementById('intro-veil-p');
  var edgeT = document.getElementById('intro-edge-t');
  var edgeB = document.getElementById('intro-edge-b');
  var fit = intro && intro.querySelector('.fit');
  var polis = intro && intro.querySelector('.polis');
  var cue = intro && intro.querySelector('.intro-cue');
  if (!intro || !pin || !slot || !ring || !veil || !edgeT || !edgeB) { root.classList.remove('intro-on', 'intro-frame'); return; }
  // בלי הזום — רק המסגרת: הדף נפתח כמו בסוף הזום, הקצוות בפינות עד הבלוק הכהה (הבעלים, 27/10)
  var frameOnly = root.classList.contains('intro-frame');
  var svgT = edgeT.ownerSVGElement;
  var svgB = edgeB.ownerSVGElement;

  var R_IN = 23.5;    // הרדיוס הפנימי של הסמל (viewBox 100)
  var W = 0, H = 0, top0 = 0, run = 1, stay = 0, cx0 = 0, cy0 = 0, k0 = 1, spread = 0;
  var hv = 0;         // הגובה שרואים עכשיו (בטלפון — עם שורת הכתובת או בלעדיה): לפיו המסגרת
  var mode = '';      // 'fixed' נעוצה למסך · 'scroll' עולה עם הבלוק הכהה · 'done' כבר מעל המסך
  var framed = false; // אחרי הזום: שתי שכבות הקצוות במקום הלוח הלבן

  // הגובה של הזום: המסך הגדול (100lvh) — בטלפון זה המסך בלי שורת הכתובת, ולכן הלוח הלבן מכסה עד התחתית
  // גם כשהשורה נעלמת (נמדד בטלפון של הבעלים: בלי זה 60px בתחתית נשארו בלי כיסוי). הגובה הזה לא משתנה
  // כשהשורה נעלמת ונחזרת, אז המסלול לא קופץ
  var probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  function boxH() { return Math.round(probe.getBoundingClientRect().height) || window.innerHeight; }
  var raf = null;
  var released = false;
  var lastA = -1, lastCue = '', lastT = '', lastD = '', lastTop = '', lastE = '';
  var lastW = -1, lastH = -1;

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  // הגדילה בסקאלה לוגריתמית: לאט בהתחלה (FIT ו-POLIS יוצאים קודם), ובסוף מאטה ונעצרת בפינות
  function zoom(t) { var c = 1 - t * t * t; return 1 - c * c; }

  function measure() {
    // אחרי הזום הלוגו מוסתר, ואחרי הסוף כל הפתיח (display:none) — ומדידה של אלמנט מוסתר מחזירה אפסים.
    // מציגים לרגע; המיקום נמדד יחסית לפתיח עצמו, אז לא משנה איפה הוא עומד
    var saved = intro.className;
    intro.classList.remove('is-done', 'is-scroll', 'is-framed');
    if (fit) { fit.style.transform = ''; }
    if (polis) { polis.style.transform = ''; }
    W = root.clientWidth;
    H = boxH();
    hv = window.innerHeight;
    top0 = pin.getBoundingClientRect().top + (window.scrollY || 0);
    run = frameOnly ? 0 : Math.round(H * 1.2);     // ה-O גדל
    stay = frameOnly ? 0 : Math.round(H * 0.6);    // האתר עומד במקום, וקצוות ה-O בפינות
    root.style.setProperty('--intro-run', (run + stay) + 'px');
    // מקום ה-O בלוגו, יחסית לראש הפתיח (הלוגו במרכז המסך הקטן — svh — אז הוא לא זז כששורת הכתובת זזה)
    var box = intro.getBoundingClientRect();
    var r = slot.getBoundingClientRect();
    if (r.width > 0) {
      cx0 = r.left - box.left + r.width / 2;
      cy0 = r.top - box.top + r.height / 2;
      k0 = r.width / 100;
    }
    spread = W * 0.6;
    lastW = W; lastH = H;
    lastA = -1; lastCue = lastT = lastD = lastTop = lastE = '';
    intro.className = saved;
  }

  // כמה ה-O גדל בסוף: החור מגיע כמעט עד הפינות, וקצוות הטבעת נשארים בהן. העומק בפינה — לפי
  // הצלע הקצרה, ולעולם לא כזה שהטבעת תיכנס לאמצע הצלע הארוכה (בטלפון לאורך)
  function kStopFor(h) {
    var half = Math.sqrt(W * W + h * h) / 2;
    var depth = Math.min(Math.max(Math.min(W, h) * 0.085, 26), 140, (half - Math.max(W, h) / 2) * 0.75);
    return (half - depth) / R_IN;
  }

  function veilPath(cx, cy, r, h) {
    // הלוח הלבן עד תחתית הפתיח (המסך הגדול), גם כשרואים פחות: בטלפון, בזמן ששורת הכתובת זזה, רואים
    // מתחת לגובה שנמדד עוד לפני שהציור הבא מתעדכן
    var d = 'M-2 -2H' + (W + 2) + 'V' + (Math.max(h, H) + 2) + 'H-2Z';
    if (r <= 0.05) { return d; }
    return d + 'M' + (cx - r).toFixed(2) + ' ' + cy.toFixed(2) + 'a' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 1 0 ' + (2 * r).toFixed(2) + ' 0a' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 1 0 ' + (-2 * r).toFixed(2) + ' 0Z';
  }

  // מצייר את רגע p (0 עד 1) במסך בגובה h; מחזיר כמה החור פתוח, יחסית לחצי האלכסון
  function draw(p, h) {
    // FIT ו-POLIS יוצאים לצדדים בשליש הראשון
    var a = easeInOut(clamp(p / 0.38));
    if (a !== lastA) {
      lastA = a;
      if (fit) {
        fit.style.transform = 'translate3d(' + (-a * spread).toFixed(1) + 'px,0,0)';
        fit.style.opacity = (1 - a).toFixed(3);
      }
      if (polis) {
        polis.style.transform = 'translate3d(' + (a * spread).toFixed(1) + 'px,0,0)';
        polis.style.opacity = (1 - a).toFixed(3);
      }
    }
    var co = clamp(1 - p * 6).toFixed(3);
    if (cue && co !== lastCue) { lastCue = co; cue.style.opacity = co; }

    // ה-O עובר למרכז מה שרואים, ובמקביל גדל — לאט בהתחלה, מהר באמצע, ונעצר בעדינות בפינות
    var c = easeInOut(clamp(p / 0.3));
    var cx = cx0 + (W / 2 - cx0) * c;
    var cy = cy0 + (h / 2 - cy0) * c;
    var k = k0 * Math.pow(kStopFor(h) / k0, zoom(p));
    // בהתחלה ה-O הוא הסמל כמו שהוא, עם רקע לבן בפנים; החור נפתח עם הגלילה
    var hole = R_IN * k * easeInOut(clamp(p / 0.14));

    var t = 'translate(' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ') scale(' + k.toFixed(4) + ') translate(-50 -50)';
    var d = veilPath(cx, cy, hole, h);
    if (t !== lastT) { lastT = t; ring.setAttribute('transform', t); }
    if (d !== lastD) { lastD = d; veil.setAttribute('d', d); }
    return hole / (Math.sqrt(W * W + h * h) / 2);
  }

  // המסגרת, לפי הגובה שרואים (h). כל שכבה בגובה חצי מסך: העליונה מציירת את חצי המעגל העליון ביחס לראש
  // המסך, והתחתונה את התחתון ביחס לתחתית. אמצע כל צלע תמיד בתוך החור, אז אין ביניהן תפר; וכשבטלפון
  // שורת הכתובת זזה, הדפדפן מזיז את השכבה התחתונה עם התחתית — הפינות לא נחתכות ולא נעלמות
  function drawEdges(h) {
    var key = W + '|' + h;
    if (key === lastE) { return; }
    lastE = key;
    var half = Math.ceil(h / 2);
    var s = ') scale(' + kStopFor(h).toFixed(4) + ') translate(-50 -50)';
    svgT.style.height = svgB.style.height = half + 'px';
    edgeT.setAttribute('transform', 'translate(' + (W / 2).toFixed(2) + ' ' + (h / 2).toFixed(2) + s);
    edgeB.setAttribute('transform', 'translate(' + (W / 2).toFixed(2) + ' ' + (half - h / 2).toFixed(2) + s);
  }

  function setFramed(on) {
    if (on === framed) { return; }
    framed = on;
    intro.classList.toggle('is-framed', on);
  }

  function setMode(m) {
    if (m === mode) { return; }
    mode = m;
    intro.classList.toggle('is-scroll', m !== 'fixed');
    intro.classList.toggle('is-done', m === 'done');
    if (m === 'fixed') { intro.style.top = intro.style.height = ''; lastTop = ''; }
  }

  function paint() {
    raf = null;
    var sy = window.scrollY || 0;
    // כשהמסגרת נעוצה — לפי מה שרואים עכשיו; כשהיא כבר עולה עם הדף — הגובה שהיה ברגע המעבר
    if (mode === 'fixed' || mode === '') { hv = window.innerHeight; }
    // המקום בדף שבו הבלוק הכהה נוגע בתחתית המסך: עד שם המסגרת נעוצה (קוראים לפני שכותבים משהו).
    // בלי בלוק כהה — המסגרת עולה עם הראש של האתר, מיד אחרי העצירה
    var stopAt = top0 + run + stay;
    if (dark) { stopAt = Math.max(stopAt, dark.getBoundingClientRect().top + sy - hv); }
    var hold = false;

    if (sy < stopAt) {
      setMode('fixed');
      hv = window.innerHeight;
      var p = frameOnly ? 1 : clamp((sy - top0) / run);
      if (p < 1) {
        setFramed(false);
        // התוכן שמאחורי הלוח הלבן לא נגיש למקלדת עד שהחור כבר גדול
        hold = draw(p, hv) < 0.3;
      } else {
        drawEdges(hv);
        setFramed(true);
      }
    } else {
      // המסגרת עוברת לעמוד עצמו, בדיוק במקום שבו עמדה — מכאן הדפדפן מזיז אותה יחד עם הבלוק הכהה
      drawEdges(hv);
      setFramed(true);
      setMode(sy < stopAt + hv ? 'scroll' : 'done');
      var tp = stopAt + '|' + hv;
      if (mode === 'scroll' && tp !== lastTop) {
        lastTop = tp;
        intro.style.top = stopAt + 'px';
        intro.style.height = hv + 'px';
      }
    }

    if (pin.inert !== hold) { pin.inert = hold; }
    if (!released && !hold) { released = true; root.classList.remove('intro-hold'); }
  }

  function schedule() { if (!raf) { raf = requestAnimationFrame(paint); } }

  function relayout() { measure(); paint(); }

  // מודדים מחדש רק כשהרוחב או המסך הגדול משתנים (סיבוב, שינוי חלון). שורת הכתובת שנעלמת ונחזרת
  // משנה רק את הגובה שרואים — המסלול נשאר, והמסגרת מתעדכנת בציור הבא
  function onResize() {
    if (root.clientWidth !== lastW || boxH() !== lastH) { relayout(); }
    else { schedule(); }
  }

  // מקלדת: Tab בזמן הפתיח מדלג לסופו — האתר פתוח, הפינות במקומן — ומשם ממשיכים לתוכן כרגיל
  document.addEventListener('keydown', function (e) {
    if (frameOnly || e.key !== 'Tab' || (window.scrollY || 0) - top0 >= run) { return; }
    window.scrollTo({ top: top0 + run, behavior: 'instant' });
    pin.inert = false;
  });

  // הגופן משנה את רוחב FIT ו-POLIS, ולכן את מקום ה-O — מודדים אחרי שנטען
  relayout();
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(relayout); }
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });
})();
