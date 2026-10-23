(function () {
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      localStorage.setItem('theme', next);
    });
  }

  var progress = document.getElementById('progress');
  var article = document.querySelector('.prose');
  if (progress && article) {
    var update = function () {
      var rect = article.getBoundingClientRect();
      var total = article.offsetHeight - window.innerHeight;
      var passed = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      progress.style.width = (passed / Math.max(total, 1)) * 100 + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc-side a'));
  if (tocLinks.length) {
    var map = {};
    tocLinks.forEach(function (link) {
      var id = decodeURIComponent(link.getAttribute('href').slice(1));
      map[id] = link;
    });
    var headings = Array.prototype.slice.call(document.querySelectorAll('.prose h2, .prose h3'));
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(function (l) { l.classList.remove('active'); });
        var link = map[entry.target.id];
        if (link) link.classList.add('active');
      });
    }, { rootMargin: '-80px 0px -70% 0px' });
    headings.forEach(function (h) { if (h.id) observer.observe(h); });
  }
})();

(function () {
  document.querySelectorAll('[data-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var modal = document.getElementById(btn.getAttribute('data-open'));
      if (!modal) return;
      if (typeof modal.showModal === 'function') modal.showModal();
      else modal.setAttribute('open', '');
      var audio = modal.querySelector('audio');
      if (audio) { audio.currentTime = 0; audio.play().catch(function () {}); }
    });
  });

  document.querySelectorAll('dialog.intro-modal').forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.close();
    });
    modal.querySelectorAll('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { modal.close(); });
    });
    modal.addEventListener('close', function () {
      modal.querySelectorAll('audio').forEach(function (a) { a.pause(); a.currentTime = 0; });
    });
  });
})();

(function () {
  var trigger = document.getElementById('sensei-trigger');
  var modal = document.getElementById('sensei-modal');
  var stage = document.getElementById('sensei-stage');
  var dataEl = document.getElementById('sensei-data');
  var next = document.getElementById('sensei-next');
  if (!trigger || !modal || !stage || !dataEl) return;

  var list = [];
  try { list = JSON.parse(dataEl.textContent || '[]'); } catch (e) { list = []; }
  var current = null;

  function playRandom() {
    stage.innerHTML = '';
    if (!list.length) {
      var p = document.createElement('p');
      p.className = 'sensei-empty';
      p.textContent = '动画还没放进来。';
      stage.appendChild(p);
      return;
    }
    var pool = list.filter(function (x) { return x.src !== current; });
    if (!pool.length) pool = list;
    var item = pool[Math.floor(Math.random() * pool.length)];
    current = item.src;
    var el;
    if (item.type === 'video') {
      el = document.createElement('video');
      el.src = item.src;
      el.autoplay = true;
      el.loop = false;
      el.muted = false;
      el.playsInline = true;
      el.controls = true;
    } else {
      el = document.createElement('img');
      el.src = item.src;
      el.alt = 'sensei';
    }
    stage.appendChild(el);
    if (typeof el.play === 'function') el.play().catch(function () {});
  }

  trigger.addEventListener('click', function () {
    playRandom();
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
  });

  if (next) next.addEventListener('click', playRandom);
})();
