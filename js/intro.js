// פיטופוליס — הפתיח: הלוגו במרכז; בגלילה FIT ו-POLIS זזים הצידה, וה-O גדל עד שהחור
// שבתוכו חושף את האתר — ונעצר כשקצוות הטבעת יושבים בפינות המסך. משם עוד קצת גלילה
// הראש של האתר עומד במקום; אחר כך האתר נגלל בתוך המסגרת הזאת עד הבלוק הכהה שלמטה,
// ושם המסגרת עולה יחד עם הקצה העליון שלו.
// אין ספרייה: SVG אחד בגודל המסך — מלבן לבן עם חור עגול (evenodd, בלי מסכה), וחישוב לפי scrollY.
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
  var fit = intro && intro.querySelector('.fit');
  var polis = intro && intro.querySelector('.polis');
  var cue = intro && intro.querySelector('.intro-cue');
  if (!intro || !pin || !slot || !ring || !veil) { root.classList.remove('intro-on'); return; }

  var R_IN = 23.5;    // הרדיוס הפנימי של הסמל (viewBox 100)
  var W = 0, H = 0, top0 = 0, run = 1, stay = 0, dx0 = 0, dy0 = 0, k0 = 1, spread = 0;
  var mode = '';      // 'fixed' נעוצה למסך · 'scroll' עולה עם הבלוק הכהה · 'done' כבר מעל המסך

  // הגובה של הפתיח: המסך הגדול (100lvh) — בטלפון זה המסך בלי שורת הכתובת. כשהשורה נעלמת בגלילה המסך
  // גדל, ופתיח בגובה "המסך הנוכחי" היה נגמר לפני התחתית (נמדד בטלפון של הבעלים: 60px בלי כיסוי).
  // הגובה הזה לא משתנה כשהשורה נעלמת ונחזרת, ולכן גם המסלול והציור לא קופצים
  var probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  function boxH() { return Math.round(probe.getBoundingClientRect().height) || window.innerHeight; }
  var raf = null;
  var released = false;
  var lastA = -1, lastCue = '', lastT = '', lastD = '', lastTop = '';
  var lastW = -1, lastH = -1;

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  // הגדילה בסקאלה לוגריתמית: לאט בהתחלה (FIT ו-POLIS יוצאים קודם), ובסוף מאטה ונעצרת בפינות
  function zoom(t) { var c = 1 - t * t * t; return 1 - c * c; }

  function measure() {
    // אחרי הסוף הפתיח מוסתר (display:none), ומדידה של אלמנט מוסתר מחזירה אפסים — מציגים לרגע
    var hidden = intro.classList.contains('is-done');
    if (hidden) { intro.classList.remove('is-done'); }
    if (fit) { fit.style.transform = ''; }
    if (polis) { polis.style.transform = ''; }
    W = root.clientWidth;
    H = boxH();
    top0 = pin.getBoundingClientRect().top + (window.scrollY || 0);
    run = Math.round(H * 1.2);     // ה-O גדל
    stay = Math.round(H * 0.6);    // האתר עומד במקום, וקצוות ה-O בפינות
    root.style.setProperty('--intro-run', (run + stay) + 'px');
    // מקום ה-O בלוגו, יחסית למרכז הפתיח (הלוגו ממורכז בו, גם כשגובה המסך משתנה)
    var box = intro.getBoundingClientRect();
    var r = slot.getBoundingClientRect();
    if (r.width > 0) {
      dx0 = r.left + r.width / 2 - (box.left + box.width / 2);
      dy0 = r.top + r.height / 2 - (box.top + box.height / 2);
      k0 = r.width / 100;
    }
    spread = W * 0.6;
    lastW = W; lastH = H;
    lastA = -1; lastCue = lastT = lastD = lastTop = '';
    if (hidden) { intro.classList.add('is-done'); }
  }

  // כמה ה-O גדל בסוף: החור מגיע כמעט עד הפינות, וקצוות הטבעת נשארים בהן. העומק בפינה — לפי
  // הצלע הקצרה, ולעולם לא כזה שהטבעת תיכנס לאמצע הצלע הארוכה (בטלפון לאורך)
  function kStopFor(h) {
    var half = Math.sqrt(W * W + h * h) / 2;
    var depth = Math.min(Math.max(Math.min(W, h) * 0.085, 26), 140, (half - Math.max(W, h) / 2) * 0.75);
    return (half - depth) / R_IN;
  }

  function veilPath(cx, cy, r, h) {
    var d = 'M-2 -2H' + (W + 2) + 'V' + (h + 2) + 'H-2Z';
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

    // ה-O עובר למרכז המסך, ובמקביל גדל — לאט בהתחלה, מהר באמצע, ונעצר בעדינות בפינות
    var c = easeInOut(clamp(p / 0.3));
    var cx = W / 2 + dx0 * (1 - c);
    var cy = h / 2 + dy0 * (1 - c);
    var k = k0 * Math.pow(kStopFor(h) / k0, zoom(p));
    // בהתחלה ה-O הוא הסמל כמו שהוא, עם רקע לבן בפנים; החור נפתח עם הגלילה
    var hole = R_IN * k * easeInOut(clamp(p / 0.14));

    var t = 'translate(' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ') scale(' + k.toFixed(4) + ') translate(-50 -50)';
    var d = veilPath(cx, cy, hole, h);
    if (t !== lastT) { lastT = t; ring.setAttribute('transform', t); }
    if (d !== lastD) { lastD = d; veil.setAttribute('d', d); }
    return hole / (Math.sqrt(W * W + h * h) / 2);
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
    // המקום בדף שבו הבלוק הכהה נוגע בתחתית המסך: עד שם המסגרת נעוצה (קוראים לפני שכותבים משהו).
    // בלי בלוק כהה — המסגרת עולה עם הראש של האתר, מיד אחרי העצירה
    var stopAt = top0 + run + stay;
    if (dark) { stopAt = Math.max(stopAt, dark.getBoundingClientRect().top + sy - H); }
    var hold = false;

    if (sy < stopAt) {
      setMode('fixed');
      // התוכן שמאחורי הלוח הלבן לא נגיש למקלדת עד שהחור כבר גדול
      hold = draw(clamp((sy - top0) / run), H) < 0.3;
    } else {
      // המסגרת עוברת לעמוד עצמו, בדיוק במקום שבו עמדה — מכאן הדפדפן מזיז אותה יחד עם הבלוק הכהה
      draw(1, H);
      setMode(sy < stopAt + H ? 'scroll' : 'done');
      var tp = stopAt + '|' + H;
      if (mode === 'scroll' && tp !== lastTop) {
        lastTop = tp;
        intro.style.top = stopAt + 'px';
        intro.style.height = H + 'px';
      }
    }

    if (pin.inert !== hold) { pin.inert = hold; }
    if (!released && !hold) { released = true; root.classList.remove('intro-hold'); }
  }

  function schedule() { if (!raf) { raf = requestAnimationFrame(paint); } }

  function relayout() { measure(); paint(); }

  // מודדים מחדש רק כשהרוחב או המסך הגדול משתנים (סיבוב, שינוי חלון). שורת הכתובת שנעלמת ונחזרת
  // משנה את גובה החלון אבל לא את המסך הגדול — אז המסלול והציור נשארים במקום
  function onResize() {
    if (root.clientWidth !== lastW || boxH() !== lastH) { relayout(); }
    else { schedule(); }
  }

  // מקלדת: Tab בזמן הפתיח מדלג לסופו — האתר פתוח, הפינות במקומן — ומשם ממשיכים לתוכן כרגיל
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || (window.scrollY || 0) - top0 >= run) { return; }
    window.scrollTo({ top: top0 + run, behavior: 'instant' });
    pin.inert = false;
  });

  // הגופן משנה את רוחב FIT ו-POLIS, ולכן את מקום ה-O — מודדים אחרי שנטען
  relayout();
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(relayout); }
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });
})();
