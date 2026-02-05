/**
 * The Hearth - Main JavaScript (Static Version)
 */

(function() {
  'use strict';

  // ============================================
  // Configuration (edit these values directly)
  // ============================================

  const CONFIG = {
    // Gallery images - add/remove/edit as needed
    // To add new images: upload to /images/gallery/ and add entry here
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
    navToggle: document.getElementById('nav-toggle'),
    navMobile: document.getElementById('nav-mobile'),

    // Share
    shareBtn: document.getElementById('share-btn'),
    shareBtnMobile: document.getElementById('share-btn-mobile'),
    shareModal: document.getElementById('share-modal'),

    // Carousel
    carouselTrack: document.getElementById('carousel-track'),
    carouselDots: document.getElementById('carousel-dots'),
    carouselPrev: document.getElementById('carousel-prev'),
    carouselNext: document.getElementById('carousel-next'),

    // Contact
    contactForm: document.getElementById('contact-form'),
    formStatus: document.getElementById('form-status'),

    // Footer
    currentYear: document.getElementById('current-year')
  };

  // ============================================
  // Initialization
  // ============================================

  function init() {
    // Set current year
    if (elements.currentYear) {
      elements.currentYear.textContent = new Date().getFullYear();
    }

    initTheme();
    initNavigation();
    initShareModal();
    initGallery();
    initCarousel();
    initContactForm();
    initSmoothScroll();
  }

  // ============================================
  // Theme Toggle
  // ============================================

  function initTheme() {
    // Check for saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Theme toggle listeners
    [elements.themeToggle, elements.themeToggleMobile].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', toggleTheme);
      }
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        if (e.matches) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
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

      // Close mobile nav when clicking a link
      elements.navMobile.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          elements.navToggle.classList.remove('active');
          elements.navMobile.classList.remove('active');
        });
      });
    }
  }

  // ============================================
  // Share Modal
  // ============================================

  function initShareModal() {
    const modal = elements.shareModal;
    if (!modal) return;

    const backdrop = modal.querySelector('.modal-backdrop');
    const closeBtn = modal.querySelector('.modal-close');

    // Open modal
    [elements.shareBtn, elements.shareBtnMobile].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          modal.classList.add('active');
          // Close mobile nav if open
          if (elements.navToggle) {
            elements.navToggle.classList.remove('active');
          }
          if (elements.navMobile) {
            elements.navMobile.classList.remove('active');
          }
        });
      }
    });

    // Close modal
    [backdrop, closeBtn].forEach(el => {
      if (el) {
        el.addEventListener('click', () => {
          modal.classList.remove('active');
        });
      }
    });

    // Share options
    modal.querySelectorAll('.share-option').forEach(btn => {
      btn.addEventListener('click', () => handleShare(btn.dataset.share));
    });

    // Close on escape
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
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
        break;

      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        break;

      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
        break;

      case 'email':
        window.location.href = `mailto:?subject=${title}&body=${text}%20${url}`;
        break;
    }
  }

  // ============================================
  // Gallery & Carousel
  // ============================================

  function initGallery() {
    if (!elements.carouselTrack) return;

    const gallery = CONFIG.gallery;

    if (gallery.length === 0) {
      elements.carouselTrack.innerHTML = `
        <div class="carousel-empty">
          <p>Gallery coming soon...</p>
        </div>
      `;
      if (elements.carouselPrev) elements.carouselPrev.style.display = 'none';
      if (elements.carouselNext) elements.carouselNext.style.display = 'none';
      if (elements.carouselDots) elements.carouselDots.style.display = 'none';
      return;
    }

    // Build slides
    elements.carouselTrack.innerHTML = gallery.map(img => `
      <figure class="carousel-slide">
        <img src="${img.path}" alt="${img.caption || 'Gallery image'}" loading="lazy">
        ${img.caption ? `<figcaption>${img.caption}</figcaption>` : ''}
      </figure>
    `).join('');

    // Build dots
    if (elements.carouselDots) {
      elements.carouselDots.innerHTML = gallery.map((_, i) => `
        <button class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Go to slide ${i + 1}"></button>
      `).join('');
    }
  }

  function initCarousel() {
    if (CONFIG.gallery.length === 0) return;

    if (elements.carouselPrev) {
      elements.carouselPrev.addEventListener('click', () => navigateCarousel(-1));
    }

    if (elements.carouselNext) {
      elements.carouselNext.addEventListener('click', () => navigateCarousel(1));
    }

    if (elements.carouselDots) {
      elements.carouselDots.addEventListener('click', (e) => {
        if (e.target.classList.contains('carousel-dot')) {
          goToSlide(parseInt(e.target.dataset.index));
        }
      });
    }

    // Auto-play
    startCarouselAutoplay();

    // Pause on hover
    const carousel = document.querySelector('.carousel');
    if (carousel) {
      carousel.addEventListener('mouseenter', stopCarouselAutoplay);
      carousel.addEventListener('mouseleave', startCarouselAutoplay);
    }

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    if (elements.carouselTrack) {
      elements.carouselTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      elements.carouselTrack.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          navigateCarousel(diff > 0 ? 1 : -1);
        }
      }, { passive: true });
    }
  }

  function navigateCarousel(direction) {
    const totalSlides = CONFIG.gallery.length;
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
      elements.carouselTrack.style.transform = `translateX(-${carouselIndex * 100}%)`;
    }

    if (elements.carouselDots) {
      elements.carouselDots.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === carouselIndex);
      });
    }
  }

  function startCarouselAutoplay() {
    stopCarouselAutoplay();
    carouselInterval = setInterval(() => navigateCarousel(1), 5000);
  }

  function stopCarouselAutoplay() {
    if (carouselInterval) {
      clearInterval(carouselInterval);
      carouselInterval = null;
    }
  }

  // ============================================
  // Contact Form
  // ============================================

  function initContactForm() {
    if (!elements.contactForm) return;

    elements.contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = elements.contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        const formData = new FormData(elements.contactForm);

        const response = await fetch('/contact.php', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          showFormStatus('success', 'Message sent successfully! We\'ll get back to you soon.');
          elements.contactForm.reset();
        } else {
          showFormStatus('error', result.error || 'Failed to send message. Please try again.');
        }
      } catch (err) {
        console.error('Contact form error:', err);
        showFormStatus('error', 'Failed to send message. Please try again later.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    });
  }

  function showFormStatus(type, message) {
    if (!elements.formStatus) return;

    elements.formStatus.className = 'form-status ' + type;
    elements.formStatus.textContent = message;

    setTimeout(() => {
      elements.formStatus.className = 'form-status';
      elements.formStatus.textContent = '';
    }, 5000);
  }

  // ============================================
  // Smooth Scroll
  // ============================================

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
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
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
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
