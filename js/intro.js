// פיטופוליס — הפתיח: הלוגו במרכז; בגלילה FIT ו-POLIS זזים הצידה, וה-O
// גדל עד שהחור שבתוכו מכסה את כל המסך ונעלם — מה שבפנים הוא האתר.
// אין ספרייה: SVG אחד בגודל המסך, מסכה עם עיגול, וחישוב לפי scrollY.
(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.classList.contains('intro-on')) { return; }

  var intro = document.querySelector('.intro');
  var pin = document.querySelector('.intro-pin');
  var slot = intro && intro.querySelector('.intro-o-slot');
  var ring = document.getElementById('intro-ring');
  var hole = document.getElementById('intro-hole-c');
  var fit = intro && intro.querySelector('.fit');
  var polis = intro && intro.querySelector('.polis');
  var cue = intro && intro.querySelector('.intro-cue');
  if (!intro || !pin || !slot || !ring || !hole) { root.classList.remove('intro-on'); return; }

  var R_OUT = 40.5;   // מתוך ה-path של הסמל (viewBox 100)
  var R_IN = 23.5;
  var W = 0, H = 0, run = 1, cx0 = 0, cy0 = 0, k0 = 1, kEnd = 1, spread = 0;
  var raf = null;
  var released = false;

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function easeIn(t) { return t * t * t; }

  function measure() {
    W = window.innerWidth;
    H = window.innerHeight;
    run = Math.round(H * 1.3);
    root.style.setProperty('--intro-run', run + 'px');
    // נמדד כשהפתיח במצב ההתחלה — מבטלים זמנית את ההזזות
    var r = slot.getBoundingClientRect();
    cx0 = r.left + r.width / 2;
    cy0 = r.top + r.height / 2;
    k0 = r.width / 100;
    // החור (R_IN) צריך לכסות את פינת המסך הרחוקה ביותר מהמרכז
    kEnd = (Math.sqrt(W * W + H * H) / 2) / R_IN * 1.08;
    spread = W * 0.6;
  }

  function paint() {
    raf = null;
    var p = clamp((window.scrollY || 0) / run);

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
    hole.setAttribute('cx', cx.toFixed(2));
    hole.setAttribute('cy', cy.toFixed(2));
    // בהתחלה ה-O הוא הסמל כמו שהוא, עם רקע לבן בפנים; החור נפתח עם הגלילה
    hole.setAttribute('r', (R_IN * k * easeInOut(clamp(p / 0.14))).toFixed(2));

    // האנימציות של הפתיח שמתחת מתחילות כשהחור כבר גדול
    if (!released && p > 0.55) { released = true; root.classList.remove('intro-hold'); }
    intro.classList.toggle('is-done', p >= 1);
  }

  function schedule() { if (!raf) { raf = requestAnimationFrame(paint); } }

  function relayout() {
    if (fit) { fit.style.transform = ''; }
    if (polis) { polis.style.transform = ''; }
    measure();
    paint();
  }

  // הגופן משנה את רוחב FIT ו-POLIS, ולכן את מקום ה-O — מודדים אחרי שנטען
  relayout();
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(relayout); }
  window.addEventListener('resize', relayout, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });
})();
