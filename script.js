document.addEventListener('DOMContentLoaded', () => {
  const pages = document.querySelectorAll('.page');
  const bottomNav = document.getElementById('navbar');
  const mobileWrapper = document.querySelector('.mobile-wrapper');
  const soundBtn = document.getElementById('soundBtn');
  const storyIcon = document.getElementById('storyIcon');
  const locationBtn = document.getElementById('locationBtn');
  const copyBtn1 = document.getElementById('copyBtn1');
  const copyBtn2 = document.getElementById('copyBtn2');

  // ==== AUDIO ====
  const audio = document.getElementById('bgMusic');
  let isPlaying = false;
  audio.load(); // pastikan buffer siap

  // initial state
  bottomNav.style.opacity = "0";
  bottomNav.style.pointerEvents = "none";
  if (locationBtn) { locationBtn.style.opacity = "0"; locationBtn.style.pointerEvents = "none"; }
  if (copyBtn1) { copyBtn1.style.opacity = "0"; copyBtn1.style.pointerEvents = "none"; }
  if (copyBtn2) { copyBtn2.style.opacity = "0"; copyBtn2.style.pointerEvents = "none"; }
  mobileWrapper.style.overflowY = "hidden"; // lock page1 scroll

  // preload video
  pages.forEach(p => {
    const v = p.querySelector('video');
    if (v) v.preload = 'auto';
  });

  // helper visible rect
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
    positionElementToVideo(locationBtn, 'video6', 0.5, 0.75);
    positionElementToVideo(copyBtn1, 'video7', 0.5, 0.38);
    positionElementToVideo(copyBtn2, 'video7', 0.5, 0.69);
    positionElementToVideo(bottomNav, 'active', 0.5, 0.95);
  }

  function updateVisibility() {
    const index = Math.round(mobileWrapper.scrollTop / mobileWrapper.clientHeight);
    const activeVideo = findActiveVideo();

    if (index >= 1 && index <= 4) {
      bottomNav.style.opacity = "1";
      bottomNav.style.pointerEvents = "auto";
    } else {
      bottomNav.style.opacity = "0";
      bottomNav.style.pointerEvents = "none";
    }

    if (activeVideo && activeVideo.id === "video6") {
      locationBtn.style.opacity = "1";
      locationBtn.style.pointerEvents = "auto";
    } else {
      locationBtn.style.opacity = "0";
      locationBtn.style.pointerEvents = "none";
    }

    if (activeVideo && activeVideo.id === "video7") {
      copyBtn1.style.opacity = "1"; copyBtn1.style.pointerEvents = "auto";
      copyBtn2.style.opacity = "1"; copyBtn2.style.pointerEvents = "auto";
    } else {
      copyBtn1.style.opacity = "0"; copyBtn1.style.pointerEvents = "none";
      copyBtn2.style.opacity = "0"; copyBtn2.style.pointerEvents = "none";
    }
  }

  // Page1 autoplay
  const page1Video = document.querySelector('#page1 video');
  if (page1Video) {
    page1Video.muted = true;
    page1Video.play().catch(() => {});
    setTimeout(() => {
      if (storyIcon) storyIcon.classList.add('story-show');
      updateOverlays();
    }, 3000);
  }

  // autoplay observer
  const autoplayObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target.querySelector('video');
      if (!video) return;
      if (entry.isIntersecting) video.play().catch(()=>{});
      else video.pause();
    });
  }, { threshold: 0.6 });
  pages.forEach(p => { if (p.id !== 'page1') autoplayObserver.observe(p); });

  // === START AUDIO setelah storyIcon diklik ===
  if (storyIcon) {
    storyIcon.addEventListener('click', () => {
      audio.muted = false;
      audio.currentTime = 0;

      audio.play().then(() => {
        console.log("✅ Musik play setelah klik storyIcon");
        isPlaying = true;
        soundBtn.querySelector('img').src = 'assets/icons/soundon.png';
      }).catch(err => {
        console.error("❌ Musik gagal jalan:", err);
      });

      mobileWrapper.style.overflowY = 'scroll';
      pages[1].scrollIntoView({ behavior: 'smooth' });

      setTimeout(() => { updateVisibility(); updateOverlays(); }, 600);
    });
  }

  // page6 animasi
  const page6 = document.getElementById('page6');
  if (page6 && locationBtn) {
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
    o.observe(page6);
  }

  // page7 animasi
  const page7 = document.getElementById('page7');
  if (page7) {
    const o7 = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          [copyBtn1, copyBtn2].forEach(btn => {
            if (btn) { btn.classList.remove('copy-show'); void btn.offsetWidth; btn.classList.add('copy-show'); }
          });
        }
      });
    }, { threshold: 0.6 });
    o7.observe(page7);
  }

  // toast
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
    navigator.clipboard.writeText('1640005528270').then(() => {
      showToast('Nomor rekening Mandiri berhasil dicopy ✅');
    });
  });
  if (copyBtn2) copyBtn2.addEventListener('click', () => {
    navigator.clipboard.writeText('3450508143').then(() => {
      showToast('Nomor rekening BCA berhasil dicopy ✅');
    });
  });

  // ==== FIX scrollToPage biar video langsung ready ====
  function scrollToPage(i) {
    const p = pages[i];
    if (!p) return;
    const v = p.querySelector('video');
    if (v) {
      v.preload = 'auto';
      v.play().catch(()=>{});
    }
    p.scrollIntoView({ behavior: 'smooth' });
  }

  const homeBtn = document.getElementById('homeBtn');
  const groomBtn = document.getElementById('groomBtn');
  const giftBtn = document.getElementById('giftBtn');
  if (homeBtn) homeBtn.addEventListener('click', () => scrollToPage(0));
  if (groomBtn) groomBtn.addEventListener('click', () => scrollToPage(5));
  if (giftBtn) giftBtn.addEventListener('click', () => scrollToPage(6));

  if (locationBtn) {
    locationBtn.addEventListener('click', () => {
      window.open("https://maps.app.goo.gl/1QNJQmjTruCgxpyx8", "_blank");
    });
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      if (!isPlaying) {
        audio.muted = false;
        audio.currentTime = 0;
        audio.play().catch(()=>{}); 
        isPlaying = true;
        soundBtn.querySelector('img').src = 'assets/icons/soundon.png';
      } else if (audio.paused) {
        audio.play(); 
        soundBtn.querySelector('img').src = 'assets/icons/soundon.png';
      } else {
        audio.pause(); 
        soundBtn.querySelector('img').src = 'assets/icons/soundoff.png';
      }
    });
  }

  // disable zoom gesture
  document.addEventListener("gesturestart", e => e.preventDefault());
  document.addEventListener("gesturechange", e => e.preventDefault());
  document.addEventListener("gestureend", e => e.preventDefault());
  document.addEventListener("dblclick", e => e.preventDefault(), { passive:false });

  const tickAll = () => { updateOverlays(); updateVisibility(); };
  window.addEventListener('resize', tickAll);
  window.addEventListener('orientationchange', tickAll);
  mobileWrapper.addEventListener('scroll', tickAll);
  document.querySelectorAll('video').forEach(v => v.addEventListener('loadedmetadata', tickAll));
  setTimeout(tickAll, 250);

  // Debug error audio
  audio.addEventListener("error", () => {
    console.error("❌ Audio gagal dimuat:", audio.error);
  });
});
