/**
 * The Hearth - Main JavaScript (Redesign)
 */

(function() {
  'use strict';

  // ============================================
  // Configuration
  // ============================================

  const CONFIG = {
    gallery: [
      {
        path: '/images/gallery/placeholder-1.svg',
        caption: 'Artworks and creative productions'
      },
      {
        path: '/images/gallery/placeholder-2.svg',
        caption: 'Professional audio-visual equipment'
      },
      {
        path: '/images/gallery/placeholder-3.svg',
        caption: 'Story-driven content creation'
      },
      {
        path: '/images/gallery/placeholder-4.svg',
        caption: 'Live sound and recording sessions'
      }
    ]
  };

  // ============================================
  // State
  // ============================================

  let carouselIndex = 0;
  let carouselInterval = null;

  // ============================================
  // DOM Elements
  // ============================================

  const elements = {
    // Theme
    themeToggle: document.getElementById('theme-toggle'),
    themeToggleMobile: document.getElementById('theme-toggle-mobile'),

    // Navigation
    navbar: document.querySelector('.navbar'),
    navToggle: document.getElementById('nav-toggle'),
    navMobile: document.getElementById('nav-mobile'),

    // Share
    shareBtn: document.getElementById('share-btn'),
    shareBtnMobile: document.getElementById('share-btn-mobile'),
    shareModal: document.getElementById('share-modal'),

    // Hero
    hero: document.querySelector('.hero'),

    // Carousel
    carouselTrack: document.getElementById('carousel-track'),
    carouselDots: document.getElementById('carousel-dots'),
    carouselPrev: document.getElementById('carousel-prev'),
    carouselNext: document.getElementById('carousel-next'),

    // Footer
    currentYear: document.getElementById('current-year')
  };

  // ============================================
  // Initialization
  // ============================================

  function init() {
    if (elements.currentYear) {
      elements.currentYear.textContent = new Date().getFullYear();
    }

    initTheme();
    initNavigation();
    initNavbarScroll();
    initShareModal();
    initGallery();
    initCarousel();
    initSmoothScroll();
  }

  // ============================================
  // Theme Toggle
  // ============================================

  function initTheme() {
    const savedTheme = localStorage.getItem('theme');

    // Light theme is the default — only apply dark if explicitly saved
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    [elements.themeToggle, elements.themeToggleMobile].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', toggleTheme);
      }
    });
  }

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  }

  // ============================================
  // Navigation
  // ============================================

  function initNavigation() {
    if (elements.navToggle && elements.navMobile) {
      elements.navToggle.addEventListener('click', () => {
        elements.navToggle.classList.toggle('active');
        elements.navMobile.classList.toggle('active');
      });

      elements.navMobile.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          elements.navToggle.classList.remove('active');
          elements.navMobile.classList.remove('active');
        });
      });
    }
  }

  // ============================================
  // Navbar Scroll (transparent on hero)
  // ============================================

  function initNavbarScroll() {
    if (!elements.navbar || !elements.hero) return;

    function updateNavbar() {
      var heroBottom = elements.hero.offsetTop + elements.hero.offsetHeight;
      if (window.scrollY < heroBottom - 80) {
        elements.navbar.classList.add('at-hero');
      } else {
        elements.navbar.classList.remove('at-hero');
      }
    }

    updateNavbar();
    window.addEventListener('scroll', updateNavbar, { passive: true });
  }

  // ============================================
  // Share Modal
  // ============================================

  function initShareModal() {
    const modal = elements.shareModal;
    if (!modal) return;

    const backdrop = modal.querySelector('.modal-backdrop');
    const closeBtn = modal.querySelector('.modal-close');

    [elements.shareBtn, elements.shareBtnMobile].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          modal.classList.add('active');
          if (elements.navToggle) elements.navToggle.classList.remove('active');
          if (elements.navMobile) elements.navMobile.classList.remove('active');
        });
      }
    });

    [backdrop, closeBtn].forEach(el => {
      if (el) {
        el.addEventListener('click', () => {
          modal.classList.remove('active');
        });
      }
    });

    modal.querySelectorAll('.share-option').forEach(btn => {
      btn.addEventListener('click', () => handleShare(btn.dataset.share));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        modal.classList.remove('active');
      }
    });
  }

  function handleShare(type) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent('The Hearth - Professional Audio-Visual Production');
    const text = encodeURIComponent('Shaping time, preserving stories.');

    switch (type) {
      case 'copy':
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToast('Link copied to clipboard!');
          elements.shareModal.classList.remove('active');
        }).catch(() => {
          showToast('Failed to copy link');
        });
        break;

      case 'twitter':
        window.open('https://twitter.com/intent/tweet?url=' + url + '&text=' + text, '_blank');
        break;

      case 'facebook':
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, '_blank');
        break;

      case 'linkedin':
        window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + url, '_blank');
        break;

      case 'email':
        window.location.href = 'mailto:?subject=' + title + '&body=' + text + '%20' + url;
        break;
    }
  }

  // ============================================
  // Gallery & Carousel
  // ============================================

  function initGallery() {
    if (!elements.carouselTrack) return;

    var gallery = CONFIG.gallery;

    if (gallery.length === 0) {
      elements.carouselTrack.innerHTML = '<div class="carousel-empty"><p>Gallery coming soon...</p></div>';
      if (elements.carouselPrev) elements.carouselPrev.style.display = 'none';
      if (elements.carouselNext) elements.carouselNext.style.display = 'none';
      if (elements.carouselDots) elements.carouselDots.style.display = 'none';
      return;
    }

    elements.carouselTrack.innerHTML = gallery.map(function(img) {
      return '<figure class="carousel-slide">' +
        '<img src="' + img.path + '" alt="' + (img.caption || 'Gallery image') + '" loading="lazy">' +
        (img.caption ? '<figcaption>' + img.caption + '</figcaption>' : '') +
        '</figure>';
    }).join('');

    if (elements.carouselDots) {
      elements.carouselDots.innerHTML = gallery.map(function(_, i) {
        return '<button class="carousel-dot ' + (i === 0 ? 'active' : '') + '" data-index="' + i + '" aria-label="Go to slide ' + (i + 1) + '"></button>';
      }).join('');
    }
  }

  function initCarousel() {
    if (CONFIG.gallery.length === 0) return;

    if (elements.carouselPrev) {
      elements.carouselPrev.addEventListener('click', function() { navigateCarousel(-1); });
    }

    if (elements.carouselNext) {
      elements.carouselNext.addEventListener('click', function() { navigateCarousel(1); });
    }

    if (elements.carouselDots) {
      elements.carouselDots.addEventListener('click', function(e) {
        if (e.target.classList.contains('carousel-dot')) {
          goToSlide(parseInt(e.target.dataset.index));
        }
      });
    }

    startCarouselAutoplay();

    var carousel = document.querySelector('.carousel');
    if (carousel) {
      carousel.addEventListener('mouseenter', stopCarouselAutoplay);
      carousel.addEventListener('mouseleave', startCarouselAutoplay);
    }

    var touchStartX = 0;
    var touchEndX = 0;

    if (elements.carouselTrack) {
      elements.carouselTrack.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      elements.carouselTrack.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        var diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          navigateCarousel(diff > 0 ? 1 : -1);
        }
      }, { passive: true });
    }
  }

  function navigateCarousel(direction) {
    var totalSlides = CONFIG.gallery.length;
    if (totalSlides === 0) return;

    carouselIndex = (carouselIndex + direction + totalSlides) % totalSlides;
    updateCarousel();
  }

  function goToSlide(index) {
    carouselIndex = index;
    updateCarousel();
  }

  function updateCarousel() {
    if (elements.carouselTrack) {
      elements.carouselTrack.style.transform = 'translateX(-' + (carouselIndex * 100) + '%)';
    }

    if (elements.carouselDots) {
      elements.carouselDots.querySelectorAll('.carousel-dot').forEach(function(dot, i) {
        dot.classList.toggle('active', i === carouselIndex);
      });
    }
  }

  function startCarouselAutoplay() {
    stopCarouselAutoplay();
    carouselInterval = setInterval(function() { navigateCarousel(1); }, 5000);
  }

  function stopCarouselAutoplay() {
    if (carouselInterval) {
      clearInterval(carouselInterval);
      carouselInterval = null;
    }
  }

  // ============================================
  // Smooth Scroll
  // ============================================

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function(link) {
      link.addEventListener('click', function(e) {
        var targetId = link.getAttribute('href');
        if (targetId === '#') return;

        var target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  // ============================================
  // Toast Notifications
  // ============================================

  function showToast(message) {
    var existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function() {
      toast.classList.add('show');
    });

    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
  }

  // ============================================
  // Start
  // ============================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
