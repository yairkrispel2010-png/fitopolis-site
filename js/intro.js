// פיטופוליס — הפתיח: הלוגו במרכז; בגלילה FIT ו-POLIS זזים הצידה, וה-O
// גדל עד שהחור שבתוכו מכסה את כל המסך ונעלם — מה שבפנים הוא האתר.
// אין ספרייה: SVG אחד בגודל המסך — מלבן לבן עם חור עגול (evenodd, בלי מסכה), וחישוב לפי scrollY.
(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.classList.contains('intro-on')) { return; }

  var intro = document.querySelector('.intro');
  var pin = document.querySelector('.intro-pin');
  var slot = intro && intro.querySelector('.intro-o-slot');
  var ring = document.getElementById('intro-ring');
  var veil = document.getElementById('intro-veil-p');
  var fit = intro && intro.querySelector('.fit');
  var polis = intro && intro.querySelector('.polis');
  var cue = intro && intro.querySelector('.intro-cue');
  if (!intro || !pin || !slot || !ring || !veil) { root.classList.remove('intro-on'); return; }

  var R_IN = 23.5;    // הרדיוס הפנימי של הסמל (viewBox 100)
  var W = 0, H = 0, run = 1, cx0 = 0, cy0 = 0, k0 = 1, kEnd = 1, spread = 0;
  var raf = null;
  var released = false;
  var done = false;
  var lastW = -1, lastH = -1;

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function easeIn(t) { return t * t * t; }

  function measure() {
    // אחרי הסוף הפתיח מוסתר (display:none), ומדידה של אלמנט מוסתר מחזירה אפסים — מציגים לרגע
    var hidden = intro.classList.contains('is-done');
    if (hidden) { intro.classList.remove('is-done'); }
    if (fit) { fit.style.transform = ''; }
    if (polis) { polis.style.transform = ''; }
    W = window.innerWidth;
    H = window.innerHeight;
    run = Math.round(H * 1.3);
    root.style.setProperty('--intro-run', run + 'px');
    var r = slot.getBoundingClientRect();
    if (r.width > 0) {
      cx0 = r.left + r.width / 2;
      cy0 = r.top + r.height / 2;
      k0 = r.width / 100;
    }
    // החור (R_IN) צריך לכסות את פינת המסך הרחוקה ביותר מהמרכז
    kEnd = Math.max(k0 * 1.01, (Math.sqrt(W * W + H * H) / 2) / R_IN * 1.08);
    spread = W * 0.6;
    lastW = W; lastH = H;
    if (hidden) { intro.classList.add('is-done'); }
  }

  function veilPath(cx, cy, r) {
    var d = 'M0 0H' + W + 'V' + H + 'H0Z';
    if (r <= 0.05) { return d; }
    return d + 'M' + (cx - r).toFixed(2) + ' ' + cy.toFixed(2) + 'a' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 1 0 ' + (2 * r).toFixed(2) + ' 0a' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 1 0 ' + (-2 * r).toFixed(2) + ' 0Z';
  }

  function paint() {
    raf = null;
    var p = clamp((window.scrollY || 0) / run);

    // התוכן שמאחורי הלוח הלבן לא נגיש למקלדת עד שהחור כבר גדול
    var hold = p <= 0.55;
    if (pin.inert !== hold) { pin.inert = hold; }
    if (!released && !hold) { released = true; root.classList.remove('intro-hold'); }

    if (p >= 1) {                           // אחרי הסוף: מסתירים פעם אחת, ולא כותבים כלום בכל גלילה
      if (!done) { done = true; intro.classList.add('is-done'); }
      return;
    }
    if (done) { done = false; intro.classList.remove('is-done'); }

    // FIT ו-POLIS יוצאים לצדדים בשליש הראשון
    var a = easeInOut(clamp(p / 0.38));
    if (fit) {
      fit.style.transform = 'translate3d(' + (-a * spread).toFixed(1) + 'px,0,0)';
      fit.style.opacity = (1 - a).toFixed(3);
    }
    if (polis) {
      polis.style.transform = 'translate3d(' + (a * spread).toFixed(1) + 'px,0,0)';
      polis.style.opacity = (1 - a).toFixed(3);
    }
    if (cue) { cue.style.opacity = clamp(1 - p * 6).toFixed(3); }

    // ה-O עובר למרכז המסך, ובמקביל גדל — לאט בהתחלה, מהר בסוף (זום פנימה)
    var c = easeInOut(clamp(p / 0.3));
    var cx = cx0 + (W / 2 - cx0) * c;
    var cy = cy0 + (H / 2 - cy0) * c;
    var k = k0 * Math.pow(kEnd / k0, easeIn(p));

    ring.setAttribute('transform', 'translate(' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ') scale(' + k.toFixed(4) + ') translate(-50 -50)');
    // בהתחלה ה-O הוא הסמל כמו שהוא, עם רקע לבן בפנים; החור נפתח עם הגלילה
    veil.setAttribute('d', veilPath(cx, cy, R_IN * k * easeInOut(clamp(p / 0.14))));
  }

  function schedule() { if (!raf) { raf = requestAnimationFrame(paint); } }

  function relayout() { measure(); paint(); }

  // בטלפון שורת הכתובת מתכווצת ומתרחבת תוך כדי גלילה ומשנה את גובה החלון — זה לא שינוי פריסה,
  // ומדידה מחדש הייתה מזיזה את אורך המסלול באמצע הגלילה. מודדים מחדש רק כשהרוחב משתנה או הגובה בהרבה.
  function onResize() {
    if (window.innerWidth !== lastW || Math.abs(window.innerHeight - lastH) > 120) { relayout(); }
    else { schedule(); }
  }

  // מקלדת: Tab בזמן הפתיח מדלג לסופו, ומשם ממשיכים לתוכן כרגיל
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || (window.scrollY || 0) >= run) { return; }
    window.scrollTo({ top: run, behavior: 'instant' });
    pin.inert = false;
  });

  // הגופן משנה את רוחב FIT ו-POLIS, ולכן את מקום ה-O — מודדים אחרי שנטען
  relayout();
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(relayout); }
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });
})();
