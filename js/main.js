// פיטופוליס — אינטראקציות דף הבית
// פרלקסת טבעות + הטיית הטלפון (עכבר בלבד) · חשיפה בגלילה
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  // ── פרלקסה: עכבר + גלילה ─────────────────────────────────
  // הטבעות ברקע זזות משני מקורות — תנועת העכבר (עומק) והגלילה (מרחק).
  // הטלפון מיטה את עצמו לכיוון הסמן. הכול מתבטל ב-prefers-reduced-motion.
  if (!reduceMotion) {
    var layers = Array.prototype.slice.call(document.querySelectorAll('[data-depth]'));
    var tilt = document.querySelector('[data-tilt]');
    var hero = document.querySelector('.hero');
    var raf = null;
    var mx = 0;
    var my = 0;

    function paint() {
      raf = null;
      // הגלילה מזיזה כל שכבה ביחס לעומק שלה — רק כל עוד ה-Hero על המסך
      var sy = window.scrollY || 0;
      var heroH = hero ? hero.offsetHeight : 1;
      var progress = Math.min(sy / heroH, 1);

      layers.forEach(function (el) {
        var d = parseFloat(el.getAttribute('data-depth')) || 0;
        var mouseX = finePointer ? -mx * d : 0;
        var mouseY = finePointer ? -my * d : 0;
        var scrollShift = progress * d * 2.2;
        el.style.transform = 'translate(' + mouseX.toFixed(1) + 'px,' + (mouseY + scrollShift).toFixed(1) + 'px)';
      });

      if (tilt && finePointer) {
        tilt.style.transform = 'rotateX(' + (my * -5).toFixed(2) + 'deg) rotateY(' + (mx * 7).toFixed(2) + 'deg)';
      }
    }

    function schedule() {
      if (raf) { return; }
      raf = requestAnimationFrame(paint);
    }

    if (finePointer) {
      document.addEventListener('mousemove', function (e) {
        mx = (e.clientX / (window.innerWidth || 1)) - 0.5;
        my = (e.clientY / (window.innerHeight || 1)) - 0.5;
        schedule();
      });
    }
    window.addEventListener('scroll', schedule, { passive: true });
    schedule();
  }

  // ── חשיפה בגלילה ──
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.scroll-reveal'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = ((i % 5) * 0.07) + 's';
      io.observe(el);
    });
  }
})();
