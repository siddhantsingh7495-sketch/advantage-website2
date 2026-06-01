/* ============================================================
   AD VANTAGE — Premium Digital Agency Website
   Complete Vanilla JavaScript
   ============================================================ */

/* ----------------------------------------------------------
   SUPABASE CONFIG
---------------------------------------------------------- */
const SUPABASE_URL = 'https://mhosjvniczlhsubqaalg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_h05xylrMYyogZbbnx1Vdjg_cewB6iD94';

const supabaseHeaders = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Prefer': 'return=minimal'
};

/** Save contact form data to Supabase */
async function saveContact(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
    method: 'POST',
    headers: supabaseHeaders,
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

/** Log a visitor page view */
async function logVisitor() {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/visitors`, {
      method: 'POST',
      headers: supabaseHeaders,
      body: JSON.stringify({ page: 'home' })
    });
  } catch (e) {
    // silently fail — visitor tracking should never break UX
    console.warn('Visitor tracking error:', e.message);
  }
}

// Track visitor on page load
logVisitor();

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ----------------------------------------------------------
     0. UTILITY HELPERS
  ---------------------------------------------------------- */

  /**
   * Debounce – limits how often a function fires.
   * @param {Function} fn   Callback
   * @param {number}   ms   Delay in milliseconds
   */
  const debounce = (fn, ms = 100) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  };

  /**
   * Throttle via requestAnimationFrame – 1 call per frame.
   */
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          fn.apply(this, args);
          ticking = false;
        });
      }
    };
  };

  /** Shortcut selectors */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /** True when viewport is narrower than 768px */
  const isMobile = () => window.innerWidth < 768;

  /* ----------------------------------------------------------
     1. PRELOADER
  ---------------------------------------------------------- */

  const initPreloader = () => {
    const preloader = $('.preloader');
    if (!preloader) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        preloader.style.opacity = '0';
        preloader.style.transition = 'opacity 0.6s ease';

        preloader.addEventListener('transitionend', () => {
          preloader.style.display = 'none';
          document.body.classList.add('loaded');
        }, { once: true });
      }, 1500);
    });

    // Fallback – force-hide after 4 s even if transitionend never fires
    setTimeout(() => {
      if (!document.body.classList.contains('loaded')) {
        preloader.style.display = 'none';
        document.body.classList.add('loaded');
      }
    }, 4000);
  };

  /* ----------------------------------------------------------
     2. NAVBAR SCROLL EFFECT
  ---------------------------------------------------------- */

  const initNavbarScroll = () => {
    const navbar = $('.navbar');
    if (!navbar) return;

    const handleScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // run once on init
  };

  /* ----------------------------------------------------------
     3. MOBILE MENU TOGGLE
  ---------------------------------------------------------- */

  const initMobileMenu = () => {
    const hamburger = $('.hamburger');
    const navMenu   = $('.nav-menu');
    const overlay   = $('.navbar__overlay');
    if (!hamburger || !navMenu) return;

    const navLinks = $$('a', navMenu);

    const closeMenu = () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    const toggleMenu = () => {
      const isOpen = navMenu.classList.contains('active');
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
      if (overlay) overlay.classList.toggle('active');
      document.body.style.overflow = isOpen ? '' : 'hidden';
    };

    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    // Close on nav-link click
    navLinks.forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    // Close when clicking overlay or outside
    if (overlay) overlay.addEventListener('click', closeMenu);
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('active') &&
          !navMenu.contains(e.target) &&
          !hamburger.contains(e.target)) {
        closeMenu();
      }
    });
  };

  /* ----------------------------------------------------------
     4. SMOOTH SCROLLING
  ---------------------------------------------------------- */

  const initSmoothScroll = () => {
    const NAVBAR_HEIGHT = 80;

    $$('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const id = anchor.getAttribute('href');
        if (id === '#' || id === '') return;

        const target = $(id);
        if (!target) return;

        e.preventDefault();

        const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;

        window.scrollTo({ top, behavior: 'smooth' });

        // Close mobile menu if open
        const navMenu = $('.nav-menu');
        const hamburger = $('.hamburger');
        if (navMenu) navMenu.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
      });
    });
  };

  /* ----------------------------------------------------------
     5. ACTIVE NAV LINK ON SCROLL (Scroll-Spy)
  ---------------------------------------------------------- */

  const initScrollSpy = () => {
    const sections = $$('section[id]');
    const mobileLinks = $$('.nav-menu a[href^="#"]');
    const desktopLinks = $$('.navbar__menu a[href^="#"]');
    const allNavLinks = [...mobileLinks, ...desktopLinks];
    if (!sections.length || !allNavLinks.length) return;

    const observerOptions = {
      root: null,
      rootMargin: '-80px 0px -40% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          allNavLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, observerOptions);

    sections.forEach((section) => observer.observe(section));
  };

  /* ----------------------------------------------------------
     6. SCROLL ANIMATIONS (Fade-Up)
  ---------------------------------------------------------- */

  const initFadeUpAnimations = () => {
    const elements = $$('.fade-up');
    if (!elements.length) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.15,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Stagger siblings that share the same parent row
          const parent = entry.target.parentElement;
          const siblings = $$('.fade-up', parent);
          const idx = siblings.indexOf(entry.target);

          entry.target.style.transitionDelay = `${idx * 0.12}s`;
          entry.target.classList.add('visible');

          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    elements.forEach((el) => observer.observe(el));
  };

  /* ----------------------------------------------------------
     7. ANIMATED COUNTERS
  ---------------------------------------------------------- */

  const initCounters = () => {
    const counters = $$('.counter');
    if (!counters.length) return;

    let triggered = false;

    const animateCounter = (el) => {
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 2000;            // ms
      const start = performance.now();

      const step = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);

        el.textContent = current.toLocaleString() + suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    };

    // Observe the stats section (or fallback: the first counter's parent)
    const statsSection = $('#stats') || counters[0].closest('section');
    if (!statsSection) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !triggered) {
          triggered = true;
          counters.forEach((c, i) => {
            setTimeout(() => animateCounter(c), i * 150);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(statsSection);
  };

  /* ----------------------------------------------------------
     8. TYPED TEXT EFFECT
  ---------------------------------------------------------- */

  const initTypedText = () => {
    const el = $('.typed-text');
    if (!el) return;

    const strings = [
      'Digital Growth',
      'Web Solutions',
      'Brand Success',
      'Market Dominance',
    ];

    const TYPING_SPEED  = 100;  // ms per char
    const DELETING_SPEED = 50;
    const PAUSE_AFTER    = 2000;

    let stringIdx = 0;
    let charIdx   = 0;
    let isDeleting = false;

    const type = () => {
      const current = strings[stringIdx];

      if (isDeleting) {
        charIdx--;
        el.textContent = current.substring(0, charIdx);
      } else {
        charIdx++;
        el.textContent = current.substring(0, charIdx);
      }

      let delay = isDeleting ? DELETING_SPEED : TYPING_SPEED;

      if (!isDeleting && charIdx === current.length) {
        delay = PAUSE_AFTER;
        isDeleting = true;
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        stringIdx = (stringIdx + 1) % strings.length;
        delay = 400; // brief pause before next word
      }

      setTimeout(type, delay);
    };

    type();
  };

  /* ----------------------------------------------------------
     9. MOUSE TRACKING / PARALLAX IN HERO
  ---------------------------------------------------------- */

  const initHeroParallax = () => {
    const hero = $('.hero');
    if (!hero) return;

    const orbs = $$('.floating-orb', hero);
    if (!orbs.length) return;

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let animating = false;

    const lerp = (a, b, t) => a + (b - a) * t;

    const animate = () => {
      currentX = lerp(currentX, mouseX, 0.08);
      currentY = lerp(currentY, mouseY, 0.08);

      orbs.forEach((orb, i) => {
        const factor = (i + 1) * 0.3; // deeper orbs move less
        const tx = currentX * factor;
        const ty = currentY * factor;
        orb.style.transform = `translate(${tx}px, ${ty}px)`;
      });

      if (animating) requestAnimationFrame(animate);
    };

    hero.addEventListener('mousemove', (e) => {
      if (isMobile()) return;
      const rect = hero.getBoundingClientRect();
      mouseX = (e.clientX - rect.left - rect.width / 2) / 15;
      mouseY = (e.clientY - rect.top - rect.height / 2) / 15;
    }, { passive: true });

    hero.addEventListener('mouseenter', () => {
      if (isMobile()) return;
      animating = true;
      animate();
    });

    hero.addEventListener('mouseleave', () => {
      animating = false;
      mouseX = 0;
      mouseY = 0;
      // Ease back to origin
      const reset = () => {
        currentX = lerp(currentX, 0, 0.08);
        currentY = lerp(currentY, 0, 0.08);
        orbs.forEach((orb) => {
          orb.style.transform = `translate(${currentX}px, ${currentY}px)`;
        });
        if (Math.abs(currentX) > 0.1 || Math.abs(currentY) > 0.1) {
          requestAnimationFrame(reset);
        } else {
          orbs.forEach((orb) => (orb.style.transform = 'translate(0,0)'));
        }
      };
      requestAnimationFrame(reset);
    });
  };

  /* ----------------------------------------------------------
     10. PORTFOLIO FILTER
  ---------------------------------------------------------- */

  const initPortfolioFilter = () => {
    const filterBtns = $$('.filter-btn');
    const items      = $$('.portfolio-item');
    if (!filterBtns.length || !items.length) return;

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        // Update active button
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;

        items.forEach((item, i) => {
          const show = filter === 'all' || item.dataset.category === filter;

          if (show) {
            item.style.transitionDelay = `${i * 0.06}s`;
            item.classList.remove('hidden');
          } else {
            item.style.transitionDelay = '0s';
            item.classList.add('hidden');
          }
        });
      });
    });
  };

  /* ----------------------------------------------------------
     11. TESTIMONIAL CAROUSEL
  ---------------------------------------------------------- */

  const initTestimonialCarousel = () => {
    const track = $('.testimonial-track');
    if (!track) return;

    const cards    = $$('.testimonial-card', track);
    if (!cards.length) return;

    const dotsContainer = $('.testimonial-dots');
    let currentIndex    = 0;
    let autoPlayTimer   = null;
    let isPaused        = false;

    // ---------- helpers ----------

    const getVisibleCount = () => {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    };

    const getMaxIndex = () => Math.max(0, cards.length - getVisibleCount());

    const updateSlide = () => {
      const visibleCount = getVisibleCount();
      const gap = 30; // must match CSS gap
      const cardWidth = cards[0].offsetWidth;
      const offset = currentIndex * (cardWidth + gap);
      track.style.transform = `translateX(-${offset}px)`;
      track.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

      // Update dots
      if (dotsContainer) {
        $$('.dot', dotsContainer).forEach((dot, i) => {
          dot.classList.toggle('active', i === currentIndex);
        });
      }
    };

    const goTo = (idx) => {
      currentIndex = Math.max(0, Math.min(idx, getMaxIndex()));
      updateSlide();
    };

    const next = () => {
      currentIndex = currentIndex >= getMaxIndex() ? 0 : currentIndex + 1;
      updateSlide();
    };

    const prev = () => {
      currentIndex = currentIndex <= 0 ? getMaxIndex() : currentIndex - 1;
      updateSlide();
    };

    // ---------- dot indicators ----------

    const buildDots = () => {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      const count = getMaxIndex() + 1;
      for (let i = 0; i < count; i++) {
        const dot = document.createElement('button');
        dot.classList.add('dot');
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        if (i === currentIndex) dot.classList.add('active');
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
      }
    };

    buildDots();
    window.addEventListener('resize', debounce(() => { buildDots(); updateSlide(); }, 250));

    // ---------- auto-play ----------

    const startAutoPlay = () => {
      stopAutoPlay();
      autoPlayTimer = setInterval(() => {
        if (!isPaused) next();
      }, 5000);
    };

    const stopAutoPlay = () => {
      if (autoPlayTimer) clearInterval(autoPlayTimer);
    };

    // Pause on hover
    const carouselContainer = track.closest('.testimonial-carousel') || track.parentElement;
    carouselContainer.addEventListener('mouseenter', () => { isPaused = true; });
    carouselContainer.addEventListener('mouseleave', () => { isPaused = false; });

    startAutoPlay();

    // ---------- prev / next buttons ----------

    const prevBtn = $('.carousel-prev');
    const nextBtn = $('.carousel-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); startAutoPlay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { next(); startAutoPlay(); });

    // ---------- touch / swipe ----------

    let touchStartX = 0;
    let touchEndX   = 0;
    const SWIPE_THRESHOLD = 50;

    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      touchEndX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', () => {
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > SWIPE_THRESHOLD) {
        diff > 0 ? next() : prev();
        startAutoPlay();
      }
    });
  };

  /* ----------------------------------------------------------
     12. FAQ ACCORDION
  ---------------------------------------------------------- */

  const initFaqAccordion = () => {
    const items = $$('.faq-item');
    if (!items.length) return;

    items.forEach((item) => {
      const question = $('.faq-question', item);
      const answer   = $('.faq-answer', item);
      if (!question || !answer) return;

      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');

        // Close all others (accordion behaviour)
        items.forEach((other) => {
          if (other !== item && other.classList.contains('active')) {
            other.classList.remove('active');
            const otherAnswer = $('.faq-answer', other);
            if (otherAnswer) otherAnswer.style.maxHeight = null;
          }
        });

        // Toggle current
        if (isOpen) {
          item.classList.remove('active');
          answer.style.maxHeight = null;
        } else {
          item.classList.add('active');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });
  };

  /* ----------------------------------------------------------
     13. CONTACT FORM VALIDATION
  ---------------------------------------------------------- */

  const initContactForm = () => {
    const form = $('.contact-form');
    if (!form) return;

    const fields = {
      name:    { el: $('[name="name"]',    form), rules: { required: true, minLength: 2 } },
      email:   { el: $('[name="email"]',   form), rules: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ } },
      phone:   { el: $('[name="phone"]',   form), rules: { pattern: /^\+?\d{10,15}$/ } },
      message: { el: $('[name="message"]', form), rules: { required: true } },
    };

    const messages = {
      name:    'Please enter your name (min 2 characters).',
      email:   'Please enter a valid email address.',
      phone:   'Please enter a valid phone number (10+ digits).',
      message: 'Please enter your message.',
    };

    /** Show error under a field */
    const showError = (field, msg) => {
      clearError(field);
      if (!field) return;
      field.classList.add('error');
      const span = document.createElement('span');
      span.className = 'error-message';
      span.textContent = msg;
      field.parentNode.appendChild(span);
    };

    /** Clear error from a field */
    const clearError = (field) => {
      if (!field) return;
      field.classList.remove('error');
      const existing = field.parentNode.querySelector('.error-message');
      if (existing) existing.remove();
    };

    /** Validate a single field */
    const validate = (key) => {
      const { el, rules } = fields[key];
      if (!el) return true;
      const val = el.value.trim();

      if (rules.required && !val) { showError(el, messages[key]); return false; }
      if (rules.minLength && val.length < rules.minLength) { showError(el, messages[key]); return false; }
      if (rules.pattern && val && !rules.pattern.test(val)) { showError(el, messages[key]); return false; }

      clearError(el);
      return true;
    };

    // Live validation on input
    Object.keys(fields).forEach((key) => {
      const el = fields[key].el;
      if (el) el.addEventListener('input', () => validate(key));
    });

    /** Show a toast notification */
    const showToast = (msg, type = 'success') => {
      let toast = $('.toast-notification');
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.className = `toast-notification ${type} show`;

      setTimeout(() => toast.classList.remove('show'), 4000);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      let isValid = true;
      Object.keys(fields).forEach((key) => {
        if (!validate(key)) isValid = false;
      });

      if (!isValid) return;

      // Real Supabase submission
      const submitBtn = $('button[type="submit"]', form) || $('[type="submit"]', form);
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.classList.add('loading');
      }

      try {
        // Gather form data
        const formData = {
          first_name: ($('[name="name"]', form)?.value || '').split(' ')[0].trim(),
          last_name:  ($('[name="name"]', form)?.value || '').split(' ').slice(1).join(' ').trim() || '',
          company:    $('[name="business"]', form)?.value?.trim() || '',
          email:      $('[name="email"]', form)?.value?.trim() || '',
          phone:      $('[name="phone"]', form)?.value?.trim() || '',
          service:    $('[name="service"]', form)?.value || '',
          budget:     $('[name="budget"]', form)?.value || '',
          message:    $('[name="message"]', form)?.value?.trim() || '',
        };

        await saveContact(formData);

        showToast('✅ Message sent! We\'ll get back to you soon.', 'success');
        form.reset();

        // Clear all error states
        Object.keys(fields).forEach((key) => {
          if (fields[key].el) clearError(fields[key].el);
        });

      } catch (err) {
        console.error('Form submission error:', err);
        showToast('⚠️ Something went wrong. Please try again or call us directly.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.originalText || 'Send Message';
          submitBtn.classList.remove('loading');
        }
      }
    });
  };

  /* ----------------------------------------------------------
     14. GRADIENT MESH ANIMATION (Hero Background)
  ---------------------------------------------------------- */

  const initGradientMesh = () => {
    const hero = $('.hero');
    if (!hero) return;

    let angle = 0;
    let pos1 = 0;
    let pos2 = 100;
    let animId;

    const animate = () => {
      angle = (angle + 0.15) % 360;
      pos1  = 30 + Math.sin(angle * 0.02) * 20;
      pos2  = 70 + Math.cos(angle * 0.015) * 20;

      hero.style.setProperty('--gradient-angle', `${angle}deg`);
      hero.style.setProperty('--gradient-pos1', `${pos1}%`);
      hero.style.setProperty('--gradient-pos2', `${pos2}%`);

      animId = requestAnimationFrame(animate);
    };

    animate();

    // Pause animation when hero is not visible to save resources
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!animId) animate();
        } else {
          cancelAnimationFrame(animId);
          animId = null;
        }
      });
    }, { threshold: 0 });

    observer.observe(hero);
  };

  /* ----------------------------------------------------------
     15. SCROLL PROGRESS BAR
  ---------------------------------------------------------- */

  const initScrollProgress = () => {
    const bar = $('.scroll-progress');
    if (!bar) return;

    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress  = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = `${progress}%`;
    };

    window.addEventListener('scroll', rafThrottle(update), { passive: true });
    update();
  };

  /* ----------------------------------------------------------
     16. BACK TO TOP BUTTON
  ---------------------------------------------------------- */

  const initBackToTop = () => {
    const btn = $('.back-to-top');
    if (!btn) return;

    const toggle = () => {
      btn.classList.toggle('visible', window.scrollY > 500);
    };

    window.addEventListener('scroll', rafThrottle(toggle), { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    toggle();
  };

  /* ----------------------------------------------------------
     17. TECH STACK ANIMATION
  ---------------------------------------------------------- */

  const initTechStackAnimation = () => {
    const techItems = $$('.tech-icon, .tech-item');
    if (!techItems.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const parent   = entry.target.parentElement;
          const siblings = $$(entry.target.classList.contains('tech-icon') ? '.tech-icon' : '.tech-item', parent);
          const idx      = siblings.indexOf(entry.target);

          entry.target.style.transitionDelay = `${idx * 0.1}s`;
          entry.target.classList.add('visible');
          entry.target.classList.add('floating');

          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    techItems.forEach((item) => observer.observe(item));
  };

  /* ----------------------------------------------------------
     18. TILT EFFECT ON CARDS
  ---------------------------------------------------------- */

  const initTiltEffect = () => {
    const cards = $$('.service-card, .portfolio-item, .tilt-card');
    if (!cards.length) return;

    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        if (isMobile()) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -8;  // max ±8deg
        const rotateY = ((x - centerX) / centerX) * 8;

        card.style.transform =
          `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
        card.style.transition = 'transform 0.1s ease';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s ease';
      });
    });
  };

  /* ----------------------------------------------------------
     19. PERFORMANCE: PASSIVE SCROLL AGGREGATION
         All scroll-dependent handlers are already using
         passive listeners and RAF-throttling above.
         This section adds a global resize debounce utility.
  ---------------------------------------------------------- */

  // Window resize handler (for anything that needs recalculation)
  let resizeCallbacks = [];
  const onResize = (fn) => resizeCallbacks.push(fn);

  window.addEventListener(
    'resize',
    debounce(() => resizeCallbacks.forEach((fn) => fn()), 200),
    { passive: true }
  );

  /* ----------------------------------------------------------
     INIT – Wire everything up
  ---------------------------------------------------------- */

  initPreloader();
  initNavbarScroll();
  initMobileMenu();
  initSmoothScroll();
  initScrollSpy();
  initFadeUpAnimations();
  initCounters();
  initTypedText();
  initHeroParallax();
  initPortfolioFilter();
  initTestimonialCarousel();
  initFaqAccordion();
  initContactForm();
  initGradientMesh();
  initScrollProgress();
  initBackToTop();
  initTechStackAnimation();
  initTiltEffect();

  // eslint-disable-next-line no-console
  console.log('%c⚡ AD VANTAGE — All systems go.', 'color:#00e5ff;font-weight:bold;font-size:14px;');
});
