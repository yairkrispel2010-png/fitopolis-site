// פיטופוליס — אינטראקציות דף הבית
// פרלקסת טבעות + הטיית הטלפון (עכבר בלבד) · חשיפה בגלילה
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  // ── פרלקסה והטיה — רק בעכבר, ורק כשמותרת תנועה ──
  if (finePointer && !reduceMotion) {
    var layers = Array.prototype.slice.call(document.querySelectorAll('[data-depth]'));
    var tilt = document.querySelector('[data-tilt]');
    var raf = null;
    var mx = 0;
    var my = 0;

    document.addEventListener('mousemove', function (e) {
      var w = window.innerWidth || 1;
      var h = window.innerHeight || 1;
      mx = (e.clientX / w) - 0.5;
      my = (e.clientY / h) - 0.5;
      if (raf) { return; }
      raf = requestAnimationFrame(function () {
        raf = null;
        layers.forEach(function (el) {
          var d = parseFloat(el.getAttribute('data-depth')) || 0;
          el.style.transform = 'translate(' + (-mx * d).toFixed(1) + 'px,' + (-my * d).toFixed(1) + 'px)';
        });
        if (tilt) {
          tilt.style.transform = 'rotateX(' + (my * -5).toFixed(2) + 'deg) rotateY(' + (mx * 7).toFixed(2) + 'deg)';
        }
      });
    });
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
