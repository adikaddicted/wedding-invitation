// script.js — REPLACE your current script.js with this (keep HTML/CSS as-is)
document.addEventListener('DOMContentLoaded', () => {
  const pages = document.querySelectorAll('.page');
  const bottomNav = document.getElementById('navbar');
  const mobileWrapper = document.querySelector('.mobile-wrapper');
  const soundBtn = document.getElementById('soundBtn');
  const storyIcon = document.getElementById('storyIcon');
  const locationBtn = document.getElementById('locationBtn');
  const copyBtn1 = document.getElementById('copyBtn1');
  const copyBtn2 = document.getElementById('copyBtn2');
  const globalLoader = document.getElementById('globalLoader');
  
  // ==== AUDIO ====
  const audio = document.getElementById('bgMusic');
  let isPlaying = false;
  if (audio) try { audio.load(); } catch(e){/*ignore*/}

  // initial state (do not change layout positions)
  if (bottomNav) { bottomNav.style.opacity = "0"; bottomNav.style.pointerEvents = "none"; }
  if (locationBtn) { locationBtn.style.opacity = "0"; locationBtn.style.pointerEvents = "none"; }
  if (copyBtn1) { copyBtn1.style.opacity = "0"; copyBtn1.style.pointerEvents = "none"; }
  if (copyBtn2) { copyBtn2.style.opacity = "0"; copyBtn2.style.pointerEvents = "none"; }
  if (mobileWrapper) mobileWrapper.style.overflowY = "hidden";

  // loader helpers
  function showLoader(){ if (globalLoader) globalLoader.classList.add('active'); }
  function hideLoader(){ if (globalLoader) globalLoader.classList.remove('active'); }

  // Safari-friendly per-video readiness promise:
  // resolves when canplaythrough OR loadeddata observed OR readyState >= 3 OR timeout
  function waitVideoReady(video, timeoutMs = 9000) {
    return new Promise((resolve) => {
      if (!video) return resolve({ video, ok: false, reason: 'no-video' });

      // Already ready states
      if (video.readyState >= 3) {
        video.dataset.ready = "true";
        return resolve({ video, ok: true, reason: 'already' });
      }

      let done = false;
      const mark = (ok, reason) => {
        if (done) return;
        done = true;
        try { video.dataset.ready = "true"; } catch(e){/*ignore*/}
        cleanup();
        resolve({ video, ok: !!ok, reason });
      };

      const onCanPlay = () => mark(true, 'canplaythrough');
      const onLoadedData = () => {
        // loadeddata is often what Safari fires; treat as success
        mark(true, 'loadeddata');
      };

      const onError = () => mark(false, 'error');
      const onTimeout = () => mark(false, 'timeout');

      const cleanup = () => {
        video.removeEventListener('canplaythrough', onCanPlay);
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('error', onError);
      };

      video.addEventListener('canplaythrough', onCanPlay, { passive: true });
      video.addEventListener('loadeddata', onLoadedData, { passive: true });
      video.addEventListener('error', onError, { passive: true });

      // final fallback timeout per video
      const t = setTimeout(() => { onTimeout(); clearTimeout(t); }, timeoutMs);
    });
  }

  // Preload ALL videos (but robust: proceed after overall timeout too)
  async function preloadAllVideos() {
    const videos = Array.from(document.querySelectorAll('video'));
    if (videos.length === 0) {
      hideLoader();
      if (mobileWrapper) mobileWrapper.style.visibility = 'visible';
      startFirstPage();
      return;
    }

    showLoader();
    if (mobileWrapper) mobileWrapper.style.visibility = 'hidden';

    const perVideoTimeout = 9000; // ms per video
    const overallTimeout = Math.max(12000, perVideoTimeout * videos.length); // cap overall

    // Start waiting for all with Promise.race to enforce overall timeout
    const readyPromises = videos.map(v => waitVideoReady(v, perVideoTimeout));

    const allSettled = Promise.allSettled(readyPromises);
    const overall = new Promise(resolve => setTimeout(resolve, overallTimeout, 'overall-timeout'));

    const result = await Promise.race([ allSettled, overall ]);

    // If overall timeout fired (result === 'overall-timeout'), still await what finished
    let outcomes;
    if (result === 'overall-timeout') {
      outcomes = await allSettled; // get whatever ended
    } else {
      outcomes = result; // settled results
    }

    // mark any unresolved videos as ready to avoid infinite loader
    outcomes.forEach(o => {
      if (o && o.status === 'fulfilled' && o.value && o.value.video) {
        try { o.value.video.dataset.ready = "true"; } catch(e){}
      }
    });

    hideLoader();
    if (mobileWrapper) mobileWrapper.style.visibility = 'visible';
    startFirstPage();
  }

  // === START PAGE1 (autoplay muted) & show storyIcon ===
  function startFirstPage() {
    const page1Video = document.querySelector('#page1 video');
    if (page1Video) {
      try {
        page1Video.muted = true;
        page1Video.play().catch(()=>{ /* autoplay may be blocked on some browsers but it's muted so should play */ });
      } catch(e){}
      // Ensure story icon shows after a short delay so layout settled
      setTimeout(() => {
        if (storyIcon) storyIcon.classList.add('story-show');
        updateOverlays();
      }, 700); // shorter delay — page already visible
    } else {
      if (storyIcon) storyIcon.classList.add('story-show');
      updateOverlays();
    }
  }

  // === Overlay positioning helpers ===
  function computeVisibleRect(video) {
    const r = video.getBoundingClientRect();
    const iw = video.videoWidth || r.width;
    const ih = video.videoHeight || r.height;
    const scale = Math.min(r.width / iw, r.height / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const ox = (r.width - dw) / 2;
    const oy = (r.height - dh) / 2;
    return { left: r.left + ox, top: r.top + oy, width: dw, height: dh };
  }

  function findActiveVideo() {
    if (!mobileWrapper) return null;
    const wrapRect = mobileWrapper.getBoundingClientRect();
    const centerY = wrapRect.top + wrapRect.height / 2;
    let best = null, bestDist = Infinity;
    pages.forEach(p => {
      const rect = p.getBoundingClientRect();
      const pageCenter = rect.top + rect.height / 2;
      const d = Math.abs(centerY - pageCenter);
      if (d < bestDist) { bestDist = d; best = p; }
    });
    return best ? best.querySelector('video') : null;
  }

  function positionElementToVideo(el, videoId, x = 0.5, y = 0.5) {
    if (!el) return;
    let video = (videoId === 'active') ? findActiveVideo() : document.getElementById(videoId);
    if (!video) return;
    if (!video.videoWidth || !video.videoHeight) return;
    const vbox = computeVisibleRect(video);
    const left = Math.round(vbox.left + x * vbox.width);
    const top  = Math.round(vbox.top  + y * vbox.height);
    el.style.left = left + 'px';
    el.style.top  = top + 'px';
  }

  function updateOverlays() {
    positionElementToVideo(storyIcon, 'video1', 0.5, 0.95);
    positionElementToVideo(locationBtn, 'video3', 0.5, 0.75);
    positionElementToVideo(copyBtn1, 'video4', 0.5, 0.38);
    positionElementToVideo(copyBtn2, 'video4', 0.5, 0.69);
    positionElementToVideo(bottomNav, 'active', 0.5, 0.95);
  }

  function updateVisibility() {
    const index = Math.round((mobileWrapper ? mobileWrapper.scrollTop : 0) / (mobileWrapper ? mobileWrapper.clientHeight : 1));
    const activeVideo = findActiveVideo();

    // NAVBAR hanya di page 2 (index 1)
    if (bottomNav) {
      if (index === 1) {
        bottomNav.style.opacity = "1";
        bottomNav.style.pointerEvents = "auto";
      } else {
        bottomNav.style.opacity = "0";
        bottomNav.style.pointerEvents = "none";
      }
    }

    if (locationBtn) {
      if (activeVideo && activeVideo.id === "video3") {
        locationBtn.style.opacity = "1";
        locationBtn.style.pointerEvents = "auto";
      } else {
        locationBtn.style.opacity = "0";
        locationBtn.style.pointerEvents = "none";
      }
    }

    if (copyBtn1 && copyBtn2) {
      if (activeVideo && activeVideo.id === "video4") {
        copyBtn1.style.opacity = "1"; copyBtn1.style.pointerEvents = "auto";
        copyBtn2.style.opacity = "1"; copyBtn2.style.pointerEvents = "auto";
      } else {
        copyBtn1.style.opacity = "0"; copyBtn1.style.pointerEvents = "none";
        copyBtn2.style.opacity = "0"; copyBtn2.style.pointerEvents = "none";
      }
    }
  }

  // === Intersection autoplay for pages (except page1) ===
  try {
    const autoplayObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('video');
        if (!video) return;
        if (entry.isIntersecting) {
          // play if ready or attempt play (muted videos not problem)
          video.play().catch(()=>{/*ignore*/});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.6 });

    pages.forEach(p => { if (p && p.id !== 'page1') autoplayObserver.observe(p); });
  } catch(e){ /* IntersectionObserver might not be available in very old browsers */ }

  // === START AUDIO setelah storyIcon diklik (user gesture) ===
  if (storyIcon) {
    storyIcon.addEventListener('click', async () => {
      // show overlay / unlock scroll
      if (audio) {
        audio.muted = false;
        try {
          if (!isPlaying) {
            audio.currentTime = 0;
            await audio.play();
            isPlaying = true;
            if (soundBtn && soundBtn.querySelector) {
              try { soundBtn.querySelector('img').src = 'assets/icons/soundon.png'; } catch(e){}
            }
          } else if (audio.paused) {
            await audio.play();
            if (soundBtn && soundBtn.querySelector) {
              try { soundBtn.querySelector('img').src = 'assets/icons/soundon.png'; } catch(e){}
            }
          }
        } catch(err) {
          console.error('❌ Audio gagal jalan (user gesture may be required):', err);
        }
      }

      if (mobileWrapper) mobileWrapper.style.overflowY = 'scroll';
      // go to page 2
      if (pages && pages[1]) pages[1].scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => { updateVisibility(); updateOverlays(); }, 600);
    }, { passive: true });
  }

  // === page3 animation observer ===
  const page3 = document.getElementById('page3');
  if (page3 && locationBtn) {
    try {
      const o = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            locationBtn.classList.remove('location-show'); void locationBtn.offsetWidth;
            locationBtn.classList.add('location-show');
          } else {
            locationBtn.classList.remove('location-show');
          }
        });
      }, { threshold: 0.6 });
      o.observe(page3);
    } catch(e){}
  }

  // === page4 animation observer ===
  const page4 = document.getElementById('page4');
  if (page4) {
    try {
      const o4 = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            [copyBtn1, copyBtn2].forEach(btn => {
              if (btn) { btn.classList.remove('copy-show'); void btn.offsetWidth; btn.classList.add('copy-show'); }
            });
          }
        });
      }, { threshold: 0.6 });
      o4.observe(page4);
    } catch(e){}
  }

  // === Toast / copy helpers ===
  function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  if (copyBtn1) copyBtn1.addEventListener('click', () => {
    const text = '1640005528270';
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Mandiri Account Number Successfully Copied');
      }).catch(() => fallbackCopy(text));
    } else fallbackCopy(text);
  });

  if (copyBtn2) copyBtn2.addEventListener('click', () => {
    const text = '3450508143';
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('BCA Account Number Successfully Copied');
      }).catch(() => fallbackCopy(text));
    } else fallbackCopy(text);
  });

  function fallbackCopy(text) {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    try { document.execCommand('copy'); } catch(e){}
    document.body.removeChild(input);
    showToast('Nomor rekening berhasil dicopy ✅');
  }

  // === Navbar buttons (keep positions untouched) ===
  const homeBtn = document.getElementById('homeBtn');
  const groomBtn = document.getElementById('groomBtn');
  const giftBtn = document.getElementById('giftBtn');
  if (homeBtn) homeBtn.addEventListener('click', () => { if (pages[0]) pages[0].scrollIntoView({ behavior: 'smooth' }); });
  if (groomBtn) groomBtn.addEventListener('click', () => { if (pages[2]) pages[2].scrollIntoView({ behavior: 'smooth' }); });
  if (giftBtn) giftBtn.addEventListener('click', () => { if (pages[3]) pages[3].scrollIntoView({ behavior: 'smooth' }); });

  if (locationBtn) {
    locationBtn.addEventListener('click', () => {
      window.open('https://maps.app.goo.gl/1QNJQmjTruCgxpyx8', '_blank');
    });
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', async () => {
      if (!isPlaying && audio) {
        audio.muted = false;
        audio.currentTime = 0;
        try { await audio.play(); isPlaying = true; } catch(e){ console.warn('audio.play() failed', e); }
        if (soundBtn.querySelector) try { soundBtn.querySelector('img').src = 'assets/icons/soundon.png'; } catch(e){}
      } else if (audio && audio.paused) {
        try { await audio.play(); } catch(e){/*ignore*/}
        if (soundBtn.querySelector) try { soundBtn.querySelector('img').src = 'assets/icons/soundon.png'; } catch(e){}
      } else if (audio) {
        audio.pause();
        if (soundBtn.querySelector) try { soundBtn.querySelector('img').src = 'assets/icons/soundoff.png'; } catch(e){}
      }
    });
  }

  // disable pinch zoom & dblclick zoom (keep this)
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('gesturechange', e => e.preventDefault());
  document.addEventListener('gestureend', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });

  // helpers to keep overlays updated
  const tickAll = () => { updateOverlays(); updateVisibility(); };
  window.addEventListener('resize', tickAll);
  window.addEventListener('orientationchange', tickAll);
  if (mobileWrapper) mobileWrapper.addEventListener('scroll', tickAll);
  document.querySelectorAll('video').forEach(v => v.addEventListener('loadedmetadata', tickAll));
  setTimeout(tickAll, 250);

  // Start preload flow
  preloadAllVideos();

  // audio error logging
  if (audio) audio.addEventListener('error', () => {
    console.error('❌ Audio gagal dimuat:', audio.error);
  });
});
