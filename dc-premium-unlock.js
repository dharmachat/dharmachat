/**
 * dc-premium-unlock.js  v2.0
 * DharmaChat — Universal Premium Unlock Script
 *
 * Include at bottom of every scripture page via:
 *   <script src="dc-premium-unlock.js"></script>
 *
 * Reads dc_premium from localStorage (written by premium.html
 * after successful Razorpay payment) and removes ALL paywalls
 * if the subscription is active and unexpired.
 */

(function () {
  'use strict';

  /* 1. Validate premium from localStorage */
  function getPremiumData() {
    try {
      var raw = localStorage.getItem('dc_premium');
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.expiry) return null;
      if (new Date(data.expiry) <= new Date()) {
        localStorage.removeItem('dc_premium');
        return null;
      }
      return data;
    } catch (e) { return null; }
  }

  /* 2. Inject CSS immediately — no paint flash */
  function injectUnlockCSS() {
    var style = document.createElement('style');
    style.id = 'dc-unlock-css';
    style.textContent =
      '.chapter-content,.parva-content,.kanda-content,.chapter-content,' +
      '.up-content,.veda-content,.purana-content{' +
        'filter:none!important;user-select:auto!important;' +
        'pointer-events:auto!important;max-height:none!important;' +
        'overflow:visible!important;}' +
      '.paywall-overlay{display:none!important;}' +
      '.progress-parva.locked{background:linear-gradient(90deg,#E8611A,#D4A017)!important;opacity:.7;}' +
      '.progress-k:not(.free-k){background:linear-gradient(90deg,#E8611A,#D4A017)!important;opacity:.7;}';
    document.head.appendChild(style);
  }

  /* 3. DOM unlock — remove classes, rewire nav & progress dots */
  function unlockDOM() {
    /* 3a. Remove locked wrapper classes + hide overlays */
    var sels = ['.locked-chapter','.locked-parva','.locked-k','.locked-up','.locked-veda','.locked-purana','.locked-ch'];
    sels.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        [].slice.call(el.classList).forEach(function(c){ if(/^locked-/.test(c)) el.classList.remove(c); });
        ['.chapter-content','.parva-content','.kanda-content','.up-content','.veda-content','.purana-content'].forEach(function(is){
          var inner = el.querySelector(is);
          if(inner){ inner.style.filter='none'; inner.style.maxHeight='none'; inner.style.overflow='visible'; inner.style.userSelect='auto'; inner.style.pointerEvents='auto'; }
        });
        var ov = el.querySelector('.paywall-overlay');
        if(ov) ov.style.display='none';
      });
    });

    /* Hide any remaining standalone overlays */
    document.querySelectorAll('.paywall-overlay').forEach(function(el){ el.style.display='none'; });

    /* 3b. Fix Mahabharata parva nav locked items */
    document.querySelectorAll('.parva-nav-item.locked-item').forEach(function(a){
      a.classList.remove('locked-item');
      var lk = a.querySelector('.lock-icon');
      if(lk) lk.textContent='📖';
      var m = a.textContent.match(/\d+/);
      if(m && (a.getAttribute('href')||'').includes('premium')){
        a.setAttribute('href','#parva-'+parseInt(m[0],10));
      }
    });

    /* 3c. Fix Ramayana kanda nav links */
    document.querySelectorAll('.k-nav-item').forEach(function(a){
      if((a.getAttribute('href')||'').includes('premium')){
        var m = a.textContent.match(/\d+/);
        if(m) a.setAttribute('href','#k-'+parseInt(m[0],10));
        a.innerHTML = a.innerHTML.replace('🔒','📖');
      }
    });

    /* 3d. Rewire Ramayana progress bar dots */
    document.querySelectorAll('.progress-k').forEach(function(dot){
      var n = dot.getAttribute('data-name')||'';
      var m = n.match(/\d+/);
      if(!m) return;
      var idx = parseInt(m[0],10);
      var nd = dot.cloneNode(true);
      nd.classList.add('free-k');
      nd.style.background='linear-gradient(90deg,#E8611A,#D4A017)';
      nd.onclick = function(){ var t=document.getElementById('k-'+idx); if(t) t.scrollIntoView({behavior:'smooth'}); };
      dot.parentNode.replaceChild(nd,dot);
    });

    /* 3e. Rewire Mahabharata progress bar dots */
    document.querySelectorAll('.progress-parva.locked').forEach(function(dot){
      var n = dot.getAttribute('data-name')||'';
      var m = n.match(/^(\d+)/);
      if(!m) return;
      var num = parseInt(m[1],10);
      var nd = dot.cloneNode(true);
      nd.classList.remove('locked'); nd.classList.add('free');
      nd.style.background='linear-gradient(90deg,#E8611A,#D4A017)';
      nd.onclick = function(){ var t=document.getElementById('parva-'+num); if(t) t.scrollIntoView({behavior:'smooth'}); };
      dot.parentNode.replaceChild(nd,dot);
    });

    /* 3f. Fix any remaining premium.html links inside nav grids */
    setTimeout(function(){
      document.querySelectorAll('a[href="premium.html"]').forEach(function(a){
        if(!a.closest('.parva-nav-grid,.kanda-nav-grid,.nav-grid')) return;
        var m=(a.textContent||'').match(/\d+/);
        if(!m) return;
        var n=parseInt(m[0],10);
        var t=document.getElementById('parva-'+n)||document.getElementById('k-'+n)||document.getElementById('up-'+n)||document.getElementById('v-'+n)||document.getElementById('p-'+n)||document.getElementById('ch-'+n);
        if(t) a.setAttribute('href','#'+t.id);
      });
    }, 400);

    console.log('[DharmaChat] Premium active — all content unlocked.');
  }

  /* 4. Small status banner */
  function showBanner(data) {
    if(sessionStorage.getItem('dc_unlock_shown')) return;
    sessionStorage.setItem('dc_unlock_shown','1');
    var expiry=new Date(data.expiry);
    var ds=expiry.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
    var plan=(data.plan==='yearly'||data.plan==='annual')?'Annual':'Monthly';
    var b=document.createElement('div');
    b.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(130%);z-index:99999;background:linear-gradient(135deg,#3E0000,#5A0A0A);border:1px solid rgba(212,160,23,0.5);border-radius:20px;padding:14px 20px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 40px rgba(0,0,0,0.5);max-width:380px;width:calc(100% - 48px);transition:transform .5s cubic-bezier(0.34,1.56,0.64,1);';
    b.innerHTML='<div style="font-size:20px;flex-shrink:0;">👑</div>'+
      '<div style="flex:1;min-width:0;"><div style="font-family:Cinzel,serif;font-size:12px;color:#F0C040;font-weight:700;margin-bottom:2px;">Premium Active — '+plan+' Plan</div>'+
      '<div style="font-size:10px;color:rgba(255,255,255,0.55);">Full access granted · Valid until '+ds+'</div></div>'+
      '<button id="dcBannerX" style="background:rgba(255,255,255,0.1);border:none;border-radius:50%;width:22px;height:22px;color:rgba(255,255,255,0.7);font-size:14px;cursor:pointer;flex-shrink:0;line-height:1;">×</button>';
    document.body.appendChild(b);
    setTimeout(function(){ b.style.transform='translateX(-50%) translateY(0)'; },700);
    function dismiss(){ b.style.transform='translateX(-50%) translateY(160%)'; setTimeout(function(){ if(b.parentNode) b.parentNode.removeChild(b); },500); }
    var t=setTimeout(dismiss,4500);
    document.getElementById('dcBannerX').addEventListener('click',function(){ clearTimeout(t); dismiss(); });
  }

  /* 5. Run */
  var premium = getPremiumData();
  if(!premium) return;

  injectUnlockCSS();

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){ unlockDOM(); showBanner(premium); });
  } else {
    unlockDOM();
    showBanner(premium);
  }

})();
