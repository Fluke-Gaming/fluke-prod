// Fetch the navbar HTML from the server and inject it into the page.
fetch('/navbar.html')
  .then(response => response.text())
  .then(html => {

    // Find the #navbar mount point in the current page.
    // If it doesn't exist, bail out — nothing to do.
    const navContainer = document.getElementById('navbar');
    if (!navContainer) return;

    // Write the fetched HTML string into the mount point.
    // After this line, the navbar exists in the DOM and can be queried.
    navContainer.innerHTML = html;

    // Cache references to the elements to interact with.
    // querySelector returns the first match; querySelectorAll returns all matches as a NodeList.
    const toggle = navContainer.querySelector('.nav__toggle');
    const menu = navContainer.querySelector('.nav__menu');
    const links = navContainer.querySelectorAll('.nav__link');
    const submenu = navContainer.querySelector('.nav__submenu');
    const sublinks = navContainer.querySelectorAll('.nav__sublink');


    // ===== ACTIVE LINK =====

    // Arrow function that cleans up a URL path to compare them reliably.
    // e.g. "/wow/index.html", "/wow/", and "/wow" all become "/wow"
    const normalizePath = (path) => {
      return path
        .replace(/index\.html$/i, '')  // strip index.html from the end (case-insensitive)
        .replace(/\.html$/i, '')       // strip any other .html extension
        .replace(/\/+$/, '')           // strip trailing slashes
        .toLowerCase();                // lowercase so /WoW and /wow match
    };

    // Normalize the current page's path once, to compare it against each link.
    const currentPath = normalizePath(window.location.pathname);

    // Loop every nav link and mark the one that matches the current page.
    links.forEach(link => {
      const linkPath = normalizePath(new URL(link.href).pathname);
      // Skip /coming-soon links.
      if (linkPath === currentPath && !linkPath.includes('/coming-soon')) {
        link.classList.add('selected');
      }
    });


    // ===== SUBMENU VISIBILITY =====

    // List of pages where the submenu should be permanently visible.
    // Written as an array to add more pages later without restructuring.
    const submenuPages = ['/wow'];

    // .some() returns true if at least one item in the array satisfies the condition.
    // Here: is the current page one of the submenu pages?
    const showSubmenu = submenuPages.some(p => currentPath === normalizePath(p));

    if (submenu) {
      // toggle(className, force): when force is a boolean,
      // true = add the class, false = remove it. Replaces an if/else.
      submenu.classList.toggle('nav__submenu--visible', showSubmenu);

      // ===== SUBMENU SCROLL FADE =====
      const submenuFade = navContainer.querySelector('.nav__submenu-fade');

      // Only wire up the scroll fade on pages where the submenu is shown.
      if (showSubmenu && submenuFade) {

        // Checks whether the submenu has been scrolled to its rightmost point.
        // scrollLeft = how far scrolled; clientWidth = visible width; scrollWidth = total width.
        // -4 accounts for sub-pixel rounding differences across browsers.
        function updateSubmenuFade() {
          const atEnd = submenu.scrollLeft + submenu.clientWidth >= submenu.scrollWidth - 4;
          submenuFade.classList.toggle('is-hidden', atEnd);
        }

        // Hide the fade arrow when the user manually scrolls the navbar.
        submenu.addEventListener('scroll', updateSubmenuFade, { passive: true });

        // Run once immediately to set the correct initial state.
        updateSubmenuFade();

        // Sync the navbar's horizontal scroll position to the page's vertical scroll.
        window.addEventListener('scroll', () => {
          // scrollY / (total page height - viewport height) = a 0-to-1 value
          // representing how far through the page the user is.
          const scrollPct = window.scrollY / (document.body.scrollHeight - window.innerHeight);

          // Map that 0-1 value onto the navbar's scrollable range.
          const maxScroll = submenu.scrollWidth - submenu.clientWidth;

          // Setting scrollLeft moves the navbar — it's writable, not just readable.
          submenu.scrollLeft = scrollPct * maxScroll;

          updateSubmenuFade();
        }, { passive: true });
        // passive: true tells the browser this listener won't call preventDefault(),
        // so it doesn't have to wait for the handler before rendering the next scroll frame.
      }
    }


    // ===== SUBMENU HOVER (non-WoW pages) =====

    // On pages where the submenu isn't permanently shown,
    // reveal it as a hover preview when the user mouses over the WoW link.
    if (!showSubmenu && submenu) {

      // Array.from() converts the NodeList into a true array so we can use .find().
      // .find() returns the first element that satisfies the condition, or undefined.
      const wowLink = Array.from(links).find(link =>
        normalizePath(new URL(link.href).pathname) === '/wow'
      );

      if (wowLink) {
        // Show the submenu when hovering the WoW link.
        wowLink.addEventListener('mouseenter', () => {
          submenu.classList.add('nav__submenu--visible');
        });

        // Hide the submenu when hovering any other nav link.
        // .filter() returns a new array excluding items that don't pass the test.
        Array.from(links).filter(link => link !== wowLink).forEach(link => {
          link.addEventListener('mouseenter', () => {
            submenu.classList.remove('nav__submenu--visible');
          });
        });

        // Also hide when the mouse leaves the entire navbar container.
        navContainer.addEventListener('mouseleave', () => {
          submenu.classList.remove('nav__submenu--visible');
        });
      }
    }


    // ===== ACTIVE SUBLINK =====

    if (showSubmenu) {

      // window.location.hash is the #anchor portion of the current URL (e.g. "#raid-signup").
      const currentHash = window.location.hash;

      sublinks.forEach(link => {
        const linkHash = new URL(link.href).hash;
        if (linkHash && linkHash === currentHash) {
          link.classList.add('selected');
        }
      });

      // hashchange fires when the URL's #anchor changes without a full page load.
      // This keeps the active sublink in sync when the user clicks anchor links.
      window.addEventListener('hashchange', () => {
        sublinks.forEach(link => {
          link.classList.toggle('selected', new URL(link.href).hash === window.location.hash);
        });
      });


      // ===== SCROLL SPY =====

      // Build a list of { hash, el } objects — one per sublink that has a matching
      // section element on the page. .filter(s => s.el) drops any where querySelector
      // returned null (section doesn't exist on this page).
      const sections = Array.from(sublinks)
        .map(link => ({
          hash: new URL(link.href).hash,
          el: document.querySelector(new URL(link.href).hash)
        }))
        .filter(s => s.el);

      // hashTimer debounces the history.replaceState call.
      // rafId prevents multiple rAF callbacks from queuing up on the same frame.
      let hashTimer, rafId = null;

      const updateActiveSublink = () => {
        // If a frame is already scheduled, don't schedule another.
        if (rafId) return;

        // requestAnimationFrame defers execution until the browser is about to repaint.
        // This batches DOM reads/writes to avoid layout thrashing on every scroll event.
        rafId = requestAnimationFrame(() => {
          rafId = null;

          // The "trigger zone" — a band just below the navbar.
          // A section becomes active when its top edge enters this zone.
          const triggerTop = NAVBAR_HEIGHT - 100;
          const triggerBottom = NAVBAR_HEIGHT + 180;

          sections.forEach(({ hash, el }) => {
            // getBoundingClientRect().top gives the element's distance from the viewport top.
            // Unlike offsetTop, this updates dynamically as the user scrolls.
            const top = el.getBoundingClientRect().top;

            if (top >= triggerTop && top <= triggerBottom) {
              sublinks.forEach(link => {
                link.classList.toggle('selected', new URL(link.href).hash === hash);
              });

              // Debounce the URL update — wait 150ms after the last scroll event
              // before writing to history, so it doesn't fire on every pixel of scroll.
              clearTimeout(hashTimer);
              hashTimer = setTimeout(() => {
                // replaceState updates the URL bar without adding a browser history entry,
                // so the back button isn't polluted with every anchor transition.
                history.replaceState(null, '', hash);
              }, 150);
            }
          });
        });
      };

      window.addEventListener('scroll', updateActiveSublink, { passive: true });
      updateActiveSublink(); // run once on load to set initial state
    }

    // Guard: if the toggle or menu somehow didn't render, stop here.
    if (!toggle || !menu) return;


    // ===== TOGGLE MENU =====

    const closeMenu = () => {
      toggle.classList.remove('is-active');
      menu.classList.remove('is-open');
      // Keep the aria attribute in sync for screen readers.
      toggle.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
      toggle.classList.add('is-active');
      menu.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', () => {
      // Ternary: condition ? if-true : if-false — compact alternative to if/else.
      const isOpen = menu.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    });


    // ===== CLOSE ON LINK CLICK =====

    // Close the mobile menu automatically when any nav link is clicked,
    // so the menu doesn't stay open after navigating.
    links.forEach(link => {
      link.addEventListener('click', closeMenu);
    });


    // ===== CLOSE ON OUTSIDE CLICK =====

    // If the user clicks anywhere outside the navbar, close the menu.
    // .contains() checks whether the navContainer has the clicked element as a descendant.
    document.addEventListener('click', (e) => {
      if (!navContainer.contains(e.target)) {
        closeMenu();
      }
    });
  });


// ===== SMOOTH ANCHOR SCROLL (navbar offset) =====

// Defined outside the fetch block because it's needed by the hash handler below too.
const NAVBAR_HEIGHT = 164;

// Intercept all anchor link clicks on the page.
document.addEventListener('click', (e) => {
  // .closest() walks up the DOM tree from the clicked element
  // and returns the first ancestor matching the selector, or null.
  // This handles clicks on child elements inside an <a> tag too.
  const link = e.target.closest('a[href*="#"]');
  if (!link) return;

  const url = new URL(link.href);

  // Only handle links that point to an anchor on the current page.
  if (url.pathname !== window.location.pathname) return;

  const target = document.querySelector(url.hash);
  if (!target) return;

  e.preventDefault(); // cancel the browser's default jump-to-anchor behaviour

  // getBoundingClientRect().top is relative to the viewport.
  // Adding window.scrollY converts it to an absolute page position.
  // Subtracting NAVBAR_HEIGHT stops the section from hiding under the fixed navbar.
  const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
  window.scrollTo({ top, behavior: 'smooth' });

  // pushState updates the URL bar and adds a history entry without triggering a page load.
  history.pushState(null, '', url.hash);
});


// ===== HANDLE DIRECT URL WITH HASH (page load) =====

// When the page loads with a hash in the URL (e.g. /wow#raid-signup),
// the browser jumps to the anchor before the navbar is rendered,
// so the section ends up hidden under the navbar. This corrects that.
if (window.location.hash) {
  const target = document.querySelector(window.location.hash);
  if (target) {
    // { once: true } automatically removes the listener after it fires once.
    // No need to manually call removeEventListener.
    window.addEventListener('load', () => {
      const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
      window.scrollTo({ top, behavior: 'smooth' });
    }, { once: true });
  }
}