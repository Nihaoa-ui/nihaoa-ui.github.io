(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll('.hero').forEach(function (hero) {
    var dust = document.createElement('div');
    dust.className = 'hero-dust';
    dust.setAttribute('aria-hidden', 'true');

    for (var i = 0; i < 34; i++) {
      var dot = document.createElement('span');
      var size = (Math.random() * 2 + 1).toFixed(1);
      dot.style.left = (Math.random() * 100).toFixed(2) + '%';
      dot.style.top = (Math.random() * 100).toFixed(2) + '%';
      dot.style.width = size + 'px';
      dot.style.height = size + 'px';
      dot.style.opacity = (Math.random() * 0.35 + 0.12).toFixed(2);
      dot.style.animationDuration = (Math.random() * 16 + 12).toFixed(1) + 's';
      dot.style.animationDelay = (-Math.random() * 24).toFixed(1) + 's';
      dust.appendChild(dot);
    }

    hero.appendChild(dust);
  });
})();
