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
    var depths = layers.map(function (el) { return parseFloat(el.getAttribute('data-depth')) || 0; });
    var hero = document.querySelector('.hero');
    var raf = null;
    var mx = 0;
    var my = 0;
    // נמדד פעם אחת ולא בכל פריים — קריאת offsetHeight בתוך rAF מכריחה
    // חישוב-פריסה מחדש ומייצרת בדיוק את הלאג
    var heroH = hero ? hero.offsetHeight : 1;
    window.addEventListener('resize', function () {
      heroH = hero ? hero.offsetHeight : 1;
    }, { passive: true });

    function paint() {
      raf = null;
      var progress = Math.min((window.scrollY || 0) / heroH, 1);

      for (var i = 0; i < layers.length; i++) {
        var el = layers[i];
        var d = depths[i];
        var mouseX = finePointer ? -mx * d : 0;
        var mouseY = finePointer ? -my * d : 0;
        var scrollShift = progress * d * 2.2;
        // translate3d מכריח שכבת GPU — זול משמעותית מ-translate רגיל
        el.style.transform = 'translate3d(' + mouseX.toFixed(1) + 'px,' + (mouseY + scrollShift).toFixed(1) + 'px,0)';
      }
    }

    // מפסיקים לצייר ברגע שהפתיח יצא מהמסך — אין טעם להזיז שכבות
    // שאף אחד לא רואה, וזה מה שהעמיס את הגלילה בהמשך הדף
    var heroVisible = true;
    if ('IntersectionObserver' in window && hero) {
      new IntersectionObserver(function (es) {
        heroVisible = es[0].isIntersecting;
        if (heroVisible) { schedule(); }
      }, { rootMargin: '80px' }).observe(hero);
    }

    function schedule() {
      if (raf || !heroVisible) { return; }
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

  // ── עצירת אנימציות שיוצאות מהמסך ────────────────────────
  // לופ הדמו בטלפון והטבעות המרחפות רצים בלי סוף. בלי זה הם
  // ממשיכים לצרוך ציור גם כשגוללים הרחק מהם.
  if ('IntersectionObserver' in window) {
    var animated = document.querySelectorAll('.hero, .closing');
    var pauseObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target.classList.toggle('anim-paused', !e.isIntersecting);
      });
    }, { rootMargin: '120px' });
    [].forEach.call(animated, function (el) { pauseObserver.observe(el); });
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

  // ── הטיה עדינה אחרי הסמן (עכבר בלבד) ──────────────────────────────
  // נכתב על --tilt-y/--tilt-x (@property inherits:false), ולכן כל תזוזה פוסלת רק את .dp ולא את תת-העץ שלו.
  // שום קריאת פריסה בתוך ה-listener — הגאומטריה נמדדת פעם אחת ומתעדכנת ב-resize.
  // ⚠️ מדידה, 10/09: כל כתיבה ל---tilt מסובבת את .dp — ו-preserve-3d מאלץ ציור מחדש של כל תת-העץ
  // (8 שכבות עובי, הגב, אי המצלמה, הלחצנים). זה הדבר היקר ביותר בדף, והוא רץ בכל תזוזת עכבר.
  // לכן: רק במכונה עם יותר מארבעה מעבדים. זווית המנוחה (--rest-y) נשארת תמיד — היא לא עולה כלום.
  var strongCpu = (navigator.hardwareConcurrency || 0) > 4;
  if (!reduceMotion && finePointer && strongCpu) {
    var dps = Array.prototype.slice.call(document.querySelectorAll('.dp[data-demo]'));
    if (dps.length) {
      var geo = [], st = dps.map(function () { return { y: 0, x: 0, gy: 0, gx: 0, live: true }; }), tRaf = null;
      var measure = function () {
        geo = dps.map(function (el) { var r = el.getBoundingClientRect(); return { cx: r.left + r.width / 2 + window.scrollX, cy: r.top + r.height / 2 + window.scrollY, w: r.width || 1, h: r.height || 1 }; });
      };
      measure();
      window.addEventListener('resize', measure, { passive: true });
      window.addEventListener('load', measure);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
      if ('IntersectionObserver' in window) {
        dps.forEach(function (el, i) { st[i].live = false; new IntersectionObserver(function (es) { st[i].live = es[0].isIntersecting; }, { rootMargin: '120px' }).observe(el); });
      }
      var tPaint = function () {
        tRaf = null;
        var moving = false;
        for (var i = 0; i < dps.length; i++) {
          var s = st[i];
          if (!s.live || dps[i].classList.contains('is-turning')) continue;
          s.y += (s.gy - s.y) * 0.14; s.x += (s.gx - s.x) * 0.14;
          if (Math.abs(s.gy - s.y) > 0.03 || Math.abs(s.gx - s.x) > 0.03) moving = true;
          dps[i].style.setProperty('--tilt-y', s.y.toFixed(2) + 'deg');
          dps[i].style.setProperty('--tilt-x', s.x.toFixed(2) + 'deg');
        }
        if (moving) tRaf = requestAnimationFrame(tPaint);
      };
      document.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        for (var i = 0; i < dps.length; i++) {
          var g = geo[i]; if (!g || !st[i].live) continue;
          var dx = (e.clientX - (g.cx - window.scrollX)) / (g.w * 2.2);
          var dy = ((g.cy - window.scrollY) - e.clientY) / (g.h * 1.4);
          // מעבר לרוחב טלפון וחצי מהמרכז אין מה להטות — הסמן פשוט לא שם
          if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) { st[i].gy = 0; st[i].gx = 0; continue; }
          // כשהסמן על הטלפון עצמו — הטלפון עומד בשקט (אחרת הבר זז מתחת לעכבר ונראה כמרצד); ההטיה היא רק לסמן שמסביב
          var inside = Math.abs(e.clientX - (g.cx - window.scrollX)) < g.w / 2 + 12 && Math.abs(e.clientY - (g.cy - window.scrollY)) < g.h / 2 + 12;
          st[i].gy = inside ? 0 : Math.max(-1, Math.min(1, dx)) * 6.5;
          st[i].gx = inside ? 0 : Math.max(-1, Math.min(1, dy)) * 3.5;
        }
        if (!tRaf) tRaf = requestAnimationFrame(tPaint);
      }, { passive: true });
    }
  }
})();
