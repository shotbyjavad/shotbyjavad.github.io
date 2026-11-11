(function () {
  var root = document.documentElement.dataset.root || './';

  // e-mail links: the address is not in the HTML (anti-spam); join it here
  // (stored reversed + base64 in data-m; decoded only in a real browser)
  document.querySelectorAll('a[data-m]').forEach(function (a) {
    var m = '';
    try { m = atob(a.dataset.m).split('').reverse().join(''); } catch (e) { return; }
    a.href = 'mailto:' + m;
    if (a.classList.contains('mail')) a.textContent = m;
  });

  // theme toggle
  var tbtn = document.getElementById('theme');
  if (tbtn) tbtn.addEventListener('click', function () {
    var el = document.documentElement;
    var dark = el.dataset.theme ? el.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    el.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', el.dataset.theme); } catch (e) {}
  });

  // photo page: arrow-key navigation + share
  document.addEventListener('keydown', function (ev) {
    if (/INPUT|TEXTAREA/.test(document.activeElement.tagName) || ev.metaKey || ev.ctrlKey) return;
    var sel = ev.key === 'ArrowLeft' ? 'a[rel=prev]' : ev.key === 'ArrowRight' ? 'a[rel=next]' : null;
    var a = sel && document.querySelector(sel);
    if (a) location.href = a.href;
  });
  var share = document.getElementById('share'), menu = document.getElementById('sharemenu');
  if (share && menu) {
    var url = location.href.split('#')[0], title = share.dataset.title;
    var img = document.querySelector('.photo figure img');
    var media = img ? new URL(img.getAttribute('src'), location.href).href : '';
    var u = encodeURIComponent(url), t = encodeURIComponent(title);
    var nets = {
      x: ['X', 'https://twitter.com/intent/tweet?url=' + u + '&text=' + t],
      facebook: ['Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + u],
      whatsapp: ['WhatsApp', 'https://wa.me/?text=' + t + '%20' + u],
      telegram: ['Telegram', 'https://t.me/share/url?url=' + u + '&text=' + t],
      linkedin: ['LinkedIn', 'https://www.linkedin.com/sharing/share-offsite/?url=' + u],
      pinterest: ['Pinterest', 'https://pinterest.com/pin/create/button/?url=' + u + '&media=' + encodeURIComponent(media) + '&description=' + t],
      reddit: ['Reddit', 'https://www.reddit.com/submit?url=' + u + '&title=' + t],
      email: ['Email', 'mailto:?subject=' + t + '&body=' + u]
    };
    // the menu (with icons) is already in the HTML; here we only fill in the links
    menu.querySelectorAll('a[data-net]').forEach(function (a) {
      var n = nets[a.dataset.net];
      if (n) a.href = n[1]; else a.hidden = true;
    });
    var nat = menu.querySelector('[data-act=native]');
    if (nat && navigator.share) nat.hidden = false;
    var setOpen = function (o) { menu.hidden = !o; share.setAttribute('aria-expanded', o); };
    share.addEventListener('click', function (ev) { ev.stopPropagation(); setOpen(menu.hidden); });
    document.addEventListener('click', function (ev) { if (!menu.contains(ev.target)) setOpen(false); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') setOpen(false); });
    menu.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) return;
      if (b.dataset.act === 'native') navigator.share({ title: title, url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () {
        var lbl = b.querySelector('.lbl');
        lbl.textContent = 'Copied ✓';
        setTimeout(function () { lbl.textContent = 'Copy link'; }, 1600);
      });
    });
  }

  // search page
  var q = document.getElementById('q');
  if (q) {
    var out = document.getElementById('results'), status = document.getElementById('status'), data = [];
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
    var render = function () {
      var terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.length) { out.innerHTML = ''; status.textContent = ''; return; }
      var hits = data.filter(function (p) {
        var hay = (p.t + ' ' + p.l + ' ' + p.c + ' ' + p.g.join(' ') + ' ' + p.d).toLowerCase();
        return terms.every(function (t) { return hay.indexOf(t) > -1; });
      });
      status.textContent = hits.length + ' result' + (hits.length === 1 ? '' : 's');
      out.innerHTML = hits.map(function (p) {
        return '<a class="tile" href="' + root + 'photo/' + p.s + '/" style="aspect-ratio:' + p.w + '/' + p.h + ';background:' + p.k +
          '"><img loading="lazy" src="' + root + p.i + '" alt="' + esc(p.t) + '"><span class="cap">' + esc(p.t) + '</span></a>';
      }).join('');
    };
    q.value = new URLSearchParams(location.search).get('q') || '';
    q.addEventListener('input', render);
    fetch(root + 'search.json').then(function (r) { return r.json(); }).then(function (d) { data = d; render(); });
  }

  // service worker (only works over http(s), not file://)
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register(root + 'sw.js').catch(function () {});
  }
})();
