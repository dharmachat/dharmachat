/**
 * dc-premium-unlock.js  v3.0
 * DharmaChat — Universal Premium Unlock
 *
 * Fixes:
 * v1: File didn't exist
 * v2: CSS specificity too low (0,1,0) vs original lock rules (0,3,0)
 * v3: Exact-match CSS selectors + cache-bust query string on all pages
 */
(function () {
  'use strict';

  /* ── 1. Read premium from localStorage ───────────────────── */
  var premium = null;
  try {
    var raw = localStorage.getItem('dc_premium');
    if (raw) {
      var d = JSON.parse(raw);
      if (d) {
        /* Accept if: has valid unexpired expiry, OR no expiry at all (legacy) */
        if (!d.expiry || new Date(d.expiry) > new Date()) {
          premium = d;
        } else {
          localStorage.removeItem('dc_premium');
        }
      }
    }
  } catch (e) { /* silent */ }

  if (!premium) return; /* Not premium — leave paywalls in place */

  /* ── 2. CSS injection — EXACT same selectors as original locking rules ──
   *
   * Each page locks content with a 3-class selector (specificity 0,3,0):
   *   .parva.locked-parva .parva-content { filter:blur(5px); ... }
   *
   * We override with THE SAME selector + !important, guaranteeing a win.
   * ──────────────────────────────────────────────────────────────────── */
  var unlockCSS =
    /* bhagavad-gita-18-chapters.html */
    '.chapter.locked-chapter .chapter-content,' +
    /* bhagavad-gita.html */
    '.chapter.locked-ch .chapter-content,' +
    /* mahabharata.html */
    '.parva.locked-parva .parva-content,' +
    /* ramayana.html */
    '.kanda.locked-k .kanda-content,' +
    /* upanishads.html */
    '.upanishad.locked-up .up-content,' +
    /* vedas.html */
    '.veda.locked-veda .veda-content,' +
    /* puranas.html */
    '.purana.locked-purana .purana-content' +
    '{filter:none!important;max-height:none!important;' +
    'overflow:visible!important;user-select:auto!important;' +
    'pointer-events:auto!important;}' +
    /* Hide ALL paywall overlays on premium pages */
    '.paywall-overlay{display:none!important;}';

  var styleEl = document.createElement('style');
  styleEl.id  = 'dc-premium-unlock-v3';
  styleEl.textContent = unlockCSS;
  /* Append to <head> — works even before DOMContentLoaded */
  (document.head || document.documentElement).appendChild(styleEl);

  /* ── 3. DOM manipulation — belt AND suspenders ───────────── */
  function unlockDOM() {
    /* Single selector covering all 7 locked wrapper classes */
    var wrappers = document.querySelectorAll(
      '.locked-chapter,.locked-ch,.locked-parva,.locked-k,' +
      '.locked-up,.locked-veda,.locked-purana'
    );

    wrappers.forEach(function (wrapper) {
      /* Un-blur the content div (whichever type it is) */
      var contentDiv = wrapper.querySelector(
        '.chapter-content,.parva-content,.kanda-content,' +
        '.up-content,.veda-content,.purana-content'
      );
      if (contentDiv) {
        /* Inline style beats ALL stylesheet rules — highest priority */
        contentDiv.style.setProperty('filter',        'none',     'important');
        contentDiv.style.setProperty('max-height',    'none',     'important');
        contentDiv.style.setProperty('overflow',      'visible',  'important');
        contentDiv.style.setProperty('user-select',   'auto',     'important');
        contentDiv.style.setProperty('pointer-events','auto',     'important');
      }

      /* Hide the paywall overlay */
      var overlay = wrapper.querySelector('.paywall-overlay');
      if (overlay) {
        overlay.style.setProperty('display', 'none', 'important');
      }
    });

    /* Catch any standalone paywall overlays not inside a wrapper */
    document.querySelectorAll('.paywall-overlay').forEach(function (el) {
      el.style.setProperty('display', 'none', 'important');
    });

    /* Fix Ramayana progress dots (built by inline JS, redirect to premium.html) */
    document.querySelectorAll('.progress-k').forEach(function (dot) {
      var name = dot.getAttribute('data-name') || '';
      var m    = name.match(/\d+/);
      if (!m) return;
      var idx = parseInt(m[0], 10);
      var nd  = dot.cloneNode(false);
      nd.className = dot.className.replace(/(?:^|\s)(?!free-k)\S+/g, '').trim() + ' progress-k free-k';
      nd.setAttribute('data-name', name);
      nd.style.background = 'linear-gradient(90deg,#E8611A,#D4A017)';
      nd.style.cursor     = 'pointer';
      nd.onclick = function () {
        var t = document.getElementById('k-' + idx);
        if (t) t.scrollIntoView({ behavior: 'smooth' });
      };
      if (dot.parentNode) dot.parentNode.replaceChild(nd, dot);
    });

    /* Fix Mahabharata progress dots */
    document.querySelectorAll('.progress-parva.locked').forEach(function (dot) {
      var name = dot.getAttribute('data-name') || '';
      var m    = name.match(/^(\d+)/);
      if (!m) return;
      var num = parseInt(m[1], 10);
      var nd  = dot.cloneNode(false);
      nd.className = 'progress-parva free';
      nd.setAttribute('data-name', name);
      nd.style.background = 'linear-gradient(90deg,#E8611A,#D4A017)';
      nd.style.cursor     = 'pointer';
      nd.onclick = function () {
        var t = document.getElementById('parva-' + num);
        if (t) t.scrollIntoView({ behavior: 'smooth' });
      };
      if (dot.parentNode) dot.parentNode.replaceChild(nd, dot);
    });

    /* Fix nav links that redirect to premium.html */
    document.querySelectorAll(
      '.parva-nav-item,.k-nav-item,.up-nav-item,.veda-nav-item,.purana-nav-item'
    ).forEach(function (a) {
      if ((a.getAttribute('href') || '').indexOf('premium') !== -1) {
        a.innerHTML = a.innerHTML.replace('🔒', '📖');
        var m = a.textContent.match(/\d+/);
        if (m) {
          var n   = parseInt(m[0], 10);
          var ids = ['parva-','k-','up-','v-','p-','ch-'];
          for (var i = 0; i < ids.length; i++) {
            var t = document.getElementById(ids[i] + n);
            if (t) { a.setAttribute('href', '#' + t.id); break; }
          }
        }
        a.classList.remove('locked-item');
      }
    });

    /* ── 6. Update "Go Premium" / "btn-upgrade" links for premium users ── */
    /* Any hardcoded "👑 Go Premium" nav button becomes "👑 Premium Member" */
    document.querySelectorAll('a.btn-upgrade, a[href="premium.html"].btn-upgrade').forEach(function(a) {
      a.textContent  = '👑 Premium Member';
      a.href         = 'premium.html';
      a.style.background = 'linear-gradient(135deg,#3E0000,#5A0A0A)';
      a.style.border     = '1px solid rgba(212,160,23,0.4)';
      a.style.cursor     = 'default';
      a.style.pointerEvents = 'none';
    });

    /* Footer / inline "Go Premium" anchor links */
    document.querySelectorAll('a[href="premium.html"]').forEach(function(a) {
      if (a.textContent.trim() === 'Go Premium' || a.textContent.trim() === '👑 Go Premium') {
        a.textContent = '👑 Premium';
        a.style.opacity = '0.7';
      }
    });

    console.log('[DharmaChat] ✅ Premium unlocked — all content accessible.');
  }

  /* ── 4. Timing — run on DOMContentLoaded AND window.load ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', unlockDOM);
  } else {
    unlockDOM(); /* DOM already ready */
  }
  /* Second pass on window.load — catches any dynamically added elements */
  window.addEventListener('load', unlockDOM);

  /* ── 5. Premium status banner ───────────────────────────── */
  window.addEventListener('load', function () {
    if (sessionStorage.getItem('dc_unlock_v3')) return;
    sessionStorage.setItem('dc_unlock_v3', '1');

    var expiry  = premium.expiry ? new Date(premium.expiry) : null;
    var dateStr = expiry
      ? expiry.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
      : 'Active';
    var plan = (premium.plan === 'yearly' || premium.plan === 'annual') ? 'Annual' : 'Monthly';

    var b = document.createElement('div');
    b.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(130%);' +
      'z-index:99999;background:linear-gradient(135deg,#3E0000,#5A0A0A);' +
      'border:1px solid rgba(212,160,23,0.5);border-radius:20px;padding:14px 20px;' +
      'display:flex;align-items:center;gap:12px;box-shadow:0 8px 40px rgba(0,0,0,0.5);' +
      'max-width:380px;width:calc(100% - 48px);' +
      'transition:transform .5s cubic-bezier(0.34,1.56,0.64,1);';
    b.innerHTML =
      '<div style="font-size:20px;flex-shrink:0;">👑</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-family:Cinzel,serif;font-size:12px;color:#F0C040;font-weight:700;margin-bottom:2px;">' +
          'Premium Active — ' + plan + ' Plan</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,0.55);">' +
          'Full access · Valid until ' + dateStr + '</div></div>' +
      '<button id="dcUnlockX" style="background:rgba(255,255,255,0.1);border:none;border-radius:50%;' +
        'width:22px;height:22px;color:rgba(255,255,255,0.7);font-size:14px;cursor:pointer;flex-shrink:0;">×</button>';

    document.body.appendChild(b);
    setTimeout(function () { b.style.transform = 'translateX(-50%) translateY(0)'; }, 700);

    function dismiss() {
      b.style.transform = 'translateX(-50%) translateY(160%)';
      setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 500);
    }
    var t = setTimeout(dismiss, 4500);
    document.getElementById('dcUnlockX').addEventListener('click', function () {
      clearTimeout(t); dismiss();
    });
  });

})();
