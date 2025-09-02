const pages = document.querySelectorAll('.page');
const bottomNav = document.querySelector('.bottom-nav');
const mobileWrapper = document.querySelector('.mobile-wrapper');
const soundBtn = document.getElementById('soundBtn');
const storyIcon = document.getElementById('storyIcon');
const locationBtn = document.getElementById('locationBtn');
const audio = new Audio('assets/music/song.mp3');
audio.loop = true;
let isPlaying = false;

// Disable scroll pas load
mobileWrapper.style.overflowY = "hidden";

// Flag story icon muncul 1x
let storyShown = false;

// ===== Preload semua video =====
pages.forEach(p => {
  const vid = p.querySelector('video');
  if (vid) vid.preload = 'auto';
});

// ===== Page 1 auto-play dan story icon =====
const page1Video = document.querySelector('#page1 video');
if (page1Video) {
  page1Video.muted = true; // supaya autoplay bisa jalan
  page1Video.play().catch(() => console.log('Autoplay blocked'));

  if (storyIcon && !storyShown) {
    storyShown = true;
    setTimeout(() => {
      requestAnimationFrame(() => {
        storyIcon.classList.add("story-show");
      });
    }, 3000);
  }
}

// ===== Autoplay observer untuk page 2 ke atas =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const video = entry.target.querySelector('video');
    if (!video) return;

    if (entry.isIntersecting) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
}, { threshold: 0.6 });

pages.forEach(page => {
  if (page.id !== 'page1') observer.observe(page);
});

// ===== Story icon click → scroll page 2 =====
if (storyIcon) {
  storyIcon.addEventListener('click', () => {
    mobileWrapper.style.overflowY = "scroll";
    pages[1].scrollIntoView({ behavior: 'smooth' });

    audio.play().catch(() => console.log('Audio blocked, user interaction needed'));
    isPlaying = true;

    bottomNav.style.opacity = '1';
    bottomNav.style.pointerEvents = 'auto';
  });
}

// ===== Scroll → kontrol navbar =====
mobileWrapper.addEventListener('scroll', () => {
  const currentIndex = Math.round(mobileWrapper.scrollTop / mobileWrapper.clientHeight);
  const currentPage = pages[currentIndex];

  if (!currentPage) return;

  // sembunyiin navbar di page 1, 6, 7, 8, dan terakhir
  if (
    currentIndex === 0 ||
    currentPage.id === "page6" ||
    currentPage.id === "page7" ||
    currentPage.id === "page8" ||
    currentIndex === pages.length - 1
  ) {
    bottomNav.style.opacity = "0";
    bottomNav.style.pointerEvents = "none";
    bottomNav.style.transform = "translateX(-50%) translateY(20px)";
  } else {
    bottomNav.style.opacity = "1";
    bottomNav.style.pointerEvents = "auto";
    bottomNav.style.transform = "translateX(-50%) translateY(0)";
  }
});

// ===== Sound toggle =====
if (soundBtn) {
  soundBtn.addEventListener('click', () => {
    if (!isPlaying) {
      audio.play().catch(() => console.log('Audio blocked'));
      soundBtn.querySelector('img').src = 'assets/icons/soundon.png';
      isPlaying = true;
    } else if (audio.paused) {
      audio.play();
      soundBtn.querySelector('img').src = 'assets/icons/soundon.png';
    } else {
      audio.pause();
      soundBtn.querySelector('img').src = 'assets/icons/soundoff.png';
    }
  });
}

// ===== Navbar buttons =====
const homeBtn = document.getElementById('homeBtn');
const groomBtn = document.getElementById('groomBtn');
const giftBtn = document.getElementById('giftBtn');

const scrollToPage = (index) => {
  const page = pages[index];
  page.scrollIntoView({ behavior: 'smooth' });
  const vid = page.querySelector('video');
  if (vid) vid.play().catch(() => {});
};

if (homeBtn) homeBtn.addEventListener('click', () => scrollToPage(0));
if (groomBtn) groomBtn.addEventListener('click', () => scrollToPage(5));
if (giftBtn) giftBtn.addEventListener('click', () => scrollToPage(6));

// ===== Tombol lokasi click =====
if (locationBtn) {
  locationBtn.addEventListener("click", () => {
    window.open("https://maps.app.goo.gl/1QNJQmjTruCgxpyx8", "_blank");
  });
}

// ===== Page 6 animation observer =====
const page6 = document.getElementById("page6");
if (page6 && locationBtn) {
  const page6Observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        locationBtn.classList.remove("location-show");
        void locationBtn.offsetWidth;
        locationBtn.classList.add("location-show");
      } else {
        locationBtn.classList.remove("location-show");
      }
    });
  }, { threshold: 0.6 });

  page6Observer.observe(page6);
}

// ===== Page 7 copy buttons =====
const copyBtn1 = document.getElementById('copyBtn1');
const copyBtn2 = document.getElementById('copyBtn2');

if (copyBtn1) {
  copyBtn1.addEventListener('click', () => {
    navigator.clipboard.writeText('1640005528270').then(() => {
      alert('Mandiri bank account number successfully copied!');
    });
  });
}

if (copyBtn2) {
  copyBtn2.addEventListener('click', () => {
    navigator.clipboard.writeText('3450508143').then(() => {
      alert('BCA bank account number successfully copied!');
    });
  });
}
// ===== Page 7 observer untuk animasi =====
const page7 = document.getElementById("page7");
const copyBtns = [copyBtn1, copyBtn2];

if (page7) {
  const page7Observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        copyBtns.forEach(btn => {
          if (btn) {
            btn.classList.remove("copy-show");
            void btn.offsetWidth;
            btn.classList.add("copy-show");
          }
        });
      }
    });
  }, { threshold: 0.6 });

  page7Observer.observe(page7);
}
