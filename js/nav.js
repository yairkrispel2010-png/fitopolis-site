/* תפריט הניווט — <details> עובד גם בלי הקובץ הזה.
   כאן רק שתי נוחויות: Escape סוגר, ולחיצה מחוץ לתפריט סוגרת. */
(function () {
  var menu = document.querySelector('details.site-nav');
  if (!menu) return;
  document.addEventListener('click', function (e) {
    if (menu.open && !menu.contains(e.target)) menu.open = false;
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
})();
