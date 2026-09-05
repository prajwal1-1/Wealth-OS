/**
 * Wealth OS - Universal Movable Horizontal Scroll Engine
 * Enables smooth drag-to-scroll (grab & move), mouse wheel translation,
 * inertia momentum physics, and floating navigation controls for all horizontally scrollable containers.
 */
(function() {
  'use strict';

  // WeakSet to avoid re-binding handlers to the same DOM element
  const initializedElements = new WeakSet();

  /**
   * Make a container horizontally movable via mouse drag, wheel, and controls.
   */
  function makeHorizontallyMovable(el) {
    if (!el || initializedElements.has(el)) return;
    initializedElements.add(el);

    el.classList.add('horizontal-scrollable');

    let isDown = false;
    let startX = 0;
    let scrollLeftStart = 0;
    let isDragging = false;
    let dragDistance = 0;
    let lastTime = 0;
    let lastX = 0;
    let velocity = 0;
    let momentumAnimId = null;

    // Default grab cursor
    if (!el.style.cursor) {
      el.style.cursor = 'grab';
    }

    // 1. Mouse Down - initiate drag
    el.addEventListener('mousedown', (e) => {
      // Don't hijack if clicking inside interactive form elements
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.button !== 0) return; // only primary left-click

      isDown = true;
      isDragging = false;
      dragDistance = 0;
      el.classList.add('is-dragging');
      el.style.cursor = 'grabbing';

      startX = e.pageX - el.offsetLeft;
      scrollLeftStart = el.scrollLeft;
      lastX = e.pageX;
      lastTime = performance.now();
      velocity = 0;

      if (momentumAnimId) {
        cancelAnimationFrame(momentumAnimId);
        momentumAnimId = null;
      }
    });

    // 2. Mouse Move - active drag
    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;

      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.35; // responsive touch-like multiplier
      dragDistance = Math.abs(x - startX);

      if (dragDistance > 5) {
        isDragging = true;
      }

      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const dx = e.pageX - lastX;
      velocity = dx / dt; // pixels per ms
      lastX = e.pageX;
      lastTime = now;

      el.scrollLeft = scrollLeftStart - walk;
      updateArrowState(el);
    });

    // 3. Mouse Up / End Drag - inertia momentum
    const handleMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      el.classList.remove('is-dragging');
      el.style.cursor = 'grab';

      // Apply smooth momentum if user flicked/dragged with velocity
      if (isDragging && Math.abs(velocity) > 0.15) {
        let currentVelocity = velocity * 18;
        const friction = 0.91;

        function stepMomentum() {
          if (Math.abs(currentVelocity) < 0.4) {
            momentumAnimId = null;
            updateArrowState(el);
            return;
          }
          el.scrollLeft -= currentVelocity;
          currentVelocity *= friction;
          updateArrowState(el);
          momentumAnimId = requestAnimationFrame(stepMomentum);
        }
        momentumAnimId = requestAnimationFrame(stepMomentum);
      } else {
        updateArrowState(el);
      }

      // Reset isDragging after next tick to prevent triggering button clicks
      setTimeout(() => {
        isDragging = false;
      }, 50);
    };

    window.addEventListener('mouseup', handleMouseUp);

    // 4. Click suppression if dragged
    el.addEventListener('click', (e) => {
      if (isDragging || dragDistance > 5) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // 5. Mouse Wheel to horizontal scroll conversion
    el.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0 && !e.shiftKey) {
        const canScrollLeft = el.scrollLeft > 0;
        const canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;

        // Scroll horizontally when mouse wheel rotates
        if ((e.deltaY < 0 && canScrollLeft) || (e.deltaY > 0 && canScrollRight)) {
          e.preventDefault();
          el.scrollLeft += e.deltaY * 0.95;
          updateArrowState(el);
        }
      }
    }, { passive: false });

    // 6. Setup navigation controls
    setupNavArrows(el);
  }

  /**
   * Attach floating Left / Right arrow navigation buttons when overflow exists
   */
  function setupNavArrows(el) {
    if (el.dataset.hasScrollArrows) return;
    el.dataset.hasScrollArrows = 'true';

    const parent = el.parentElement;
    if (!parent) return;

    setTimeout(() => {
      updateArrowState(el);
    }, 150);

    el.addEventListener('scroll', () => {
      updateArrowState(el);
    }, { passive: true });
  }

  function updateArrowState(el) {
    const parent = el.parentElement;
    if (!parent || !parent.classList.contains('h-scroll-container')) return;

    let leftArrow = parent.querySelector('.h-scroll-arrow.left');
    let rightArrow = parent.querySelector('.h-scroll-arrow.right');

    const canScrollLeft = el.scrollLeft > 8;
    const canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 8;
    const hasOverflow = el.scrollWidth > el.clientWidth + 12;

    if (!hasOverflow) {
      if (leftArrow) leftArrow.classList.add('hidden');
      if (rightArrow) rightArrow.classList.add('hidden');
      return;
    }

    if (!leftArrow) {
      leftArrow = document.createElement('button');
      leftArrow.type = 'button';
      leftArrow.className = 'h-scroll-arrow left';
      leftArrow.innerHTML = '&#8249;';
      leftArrow.title = 'Scroll Left';
      leftArrow.setAttribute('aria-label', 'Scroll left');
      leftArrow.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        el.scrollBy({ left: -260, behavior: 'smooth' });
      };
      parent.appendChild(leftArrow);
    }

    if (!rightArrow) {
      rightArrow = document.createElement('button');
      rightArrow.type = 'button';
      rightArrow.className = 'h-scroll-arrow right';
      rightArrow.innerHTML = '&#8250;';
      rightArrow.title = 'Scroll Right';
      rightArrow.setAttribute('aria-label', 'Scroll right');
      rightArrow.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        el.scrollBy({ left: 260, behavior: 'smooth' });
      };
      parent.appendChild(rightArrow);
    }

    if (leftArrow) {
      leftArrow.classList.toggle('hidden', !canScrollLeft);
    }
    if (rightArrow) {
      rightArrow.classList.toggle('hidden', !canScrollRight);
    }
  }

  /**
   * Scan DOM and attach movable scroll behavior to all target elements
   */
  function scanAndInit() {
    if (typeof document === 'undefined') return;

    const selectors = [
      '.tax-nav-tabs',
      '.income-ai-tabs-nav',
      '.floating-tabs-container',
      '.tax-persona-tabs',
      '.filter-bar',
      '.investment-filter-controls',
      '.investment-action-strip',
      '.table-wrap',
      '.will-vault-table-wrap',
      '[data-horizontal-scroll="true"]',
      '.horizontal-scrollable'
    ];

    document.querySelectorAll(selectors.join(',')).forEach(el => {
      // Add container wrapper class if needed for floating arrow buttons
      if (el.classList.contains('tax-nav-tabs') || el.classList.contains('income-ai-tabs-nav')) {
        const parent = el.parentElement;
        if (parent && !parent.classList.contains('h-scroll-container')) {
          parent.classList.add('h-scroll-container');
        }
      }
      makeHorizontallyMovable(el);
    });

    // Also scan any div with inline overflow-x: auto
    document.querySelectorAll('div').forEach(el => {
      if (el.style && (el.style.overflowX === 'auto' || el.style.overflowX === 'scroll')) {
        makeHorizontallyMovable(el);
      }
    });
  }

  /**
   * Ensure sidebar rail stays pinned and follows the user down smoothly when scrolling
   */
  function setupStickySidebar() {
    if (typeof document === 'undefined') return;
    document.documentElement.style.overflow = 'visible';
    document.body.style.overflow = 'visible';

    const sidebar = document.querySelector('.app-sidebar');
    const shell = document.querySelector('.app-shell');
    if (!sidebar || !shell) return;

    shell.style.overflow = 'visible';
    shell.style.alignItems = 'start';
    sidebar.style.position = '-webkit-sticky';
    sidebar.style.position = 'sticky';
    sidebar.style.top = '18px';
    sidebar.style.alignSelf = 'start';
    sidebar.style.zIndex = '100';
  }

  // Auto-init on page ready
  if (typeof document !== 'undefined') {
    const initAll = () => {
      scanAndInit();
      setupStickySidebar();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAll);
    } else {
      initAll();
    }

    // MutationObserver to catch dynamically rendered tabs (Tax, Income, Cashflow, Will, etc.)
    const observer = new MutationObserver(() => {
      scanAndInit();
      setupStickySidebar();
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    window.addEventListener('resize', initAll);
  }

  // Export API
  if (typeof window !== 'undefined') {
    window.WealthOSScroll = {
      makeMovable: makeHorizontallyMovable,
      scan: scanAndInit
    };
  }
})();
