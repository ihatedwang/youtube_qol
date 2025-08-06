(function () {
  let PSEUDO_ICON_SIZE = 600;
  let REMOVE_SHORTS = true;
  let REMOVE_PLAYABLES = true;
  const SHELF_NAME = "ytd-rich-section-renderer";
  const SEARCH_SHELF_NAME = "ytd-shelf-renderer";
  const SEARCH_SHELF_MODEL = "grid-shelf-view-model";

  let gridRenderer = null;
  let lastGridUpdate = 0;
  let resizeTimeout = null;

  /**
   * Creates a list contains shelf items to remove based on ui toggles
   * @returns list of shelf items to remove
   */
  function getRemovalPatterns() {
    const patterns = [];

    if (REMOVE_SHORTS) {
      patterns.push(/shorts/i);
    }
    if (REMOVE_PLAYABLES) {
      patterns.push(/youtube playables/i);
    }
    return patterns;
  }

  /**
   *  Select YouTube's grid renderer and force thumbnail size based on PSEUDO_ICON_SIZE
   */
  function setGridItemsPerRow() {
    const now = Date.now();

    // Debounce grid updates to avoid excessive calculations
    if (now - lastGridUpdate < 100) return;

    if (!gridRenderer) {
      gridRenderer = document.querySelector("ytd-rich-grid-renderer");
    }

    if (gridRenderer) {
      const itemsPerRow = Math.floor(window.innerWidth / PSEUDO_ICON_SIZE);
      gridRenderer.style.setProperty(
        "--ytd-rich-grid-items-per-row",
        itemsPerRow
      );
    }

    lastGridUpdate = now;
  }

  /**
   * Some ai gen logic to force remove toggled off shelves from YouTube layout
   * I don't know how useful all of this is. It seems to work though...
   */
  function removeShelves() {
    const REMOVAL_PATTERNS = getRemovalPatterns();
    if (REMOVAL_PATTERNS.length === 0) return;

    // Target the specific shelf containers based on your structure
    const shelfSelectors = [
      `${SHELF_NAME}:not([data-processed])`, // Homepage shelves
      `${SEARCH_SHELF_NAME}:not([data-processed])`, // General shelf renderer
      `${SEARCH_SHELF_MODEL}:not([data-processed])`, // Search page shorts shelves
      "ytd-item-section-renderer:not([data-processed])", // Item sections that might contain shelves
    ];

    shelfSelectors.forEach((selector) => {
      const shelves = document.querySelectorAll(selector);

      shelves.forEach((shelf) => {
        // For ytd-item-section-renderer, only process if it contains a shelf, not videos
        if (selector.includes("ytd-item-section-renderer")) {
          const hasVideoRenderer = shelf.querySelector("ytd-video-renderer");
          const hasShelfModel = shelf.querySelector(SEARCH_SHELF_MODEL);

          // Skip if this section contains videos (we want to keep those)
          if (hasVideoRenderer && !hasShelfModel) {
            shelf.setAttribute("data-processed", "true");
            return;
          }

          // Only process if it contains a shelf model
          if (!hasShelfModel) {
            shelf.setAttribute("data-processed", "true");
            return;
          }
        }

        // Try multiple title selectors for different shelf types
        let titleElement =
          shelf.querySelector("span#title") ||
          shelf.querySelector("#title-text a") ||
          shelf.querySelector("#header #title") ||
          shelf.querySelector("h2 span") ||
          shelf.querySelector(".ytd-shelf-renderer #title") ||
          shelf.querySelector("[id*='title']") ||
          shelf.querySelector("h3") ||
          shelf.querySelector(".shelf-title");

        // For grid-shelf-view-model, look for text content in different places
        if (!titleElement && selector.includes(SEARCH_SHELF_MODEL)) {
          titleElement =
            shelf.querySelector("[class*='title']") ||
            shelf.querySelector("span") ||
            shelf.querySelector("div[class*='header']");
        }

        if (titleElement) {
          const titleText = titleElement.textContent.trim().toLowerCase();
          console.log(
            "Found shelf with title:",
            titleText,
            "Element:",
            shelf.tagName,
            shelf.className
          ); // Debug log

          // Check against all patterns in one pass
          const shouldRemove = REMOVAL_PATTERNS.some((pattern) => {
            const matches = pattern.test(titleText);
            if (matches) {
              console.log(
                `Removing shelf "${titleText}" (matched pattern: ${pattern})`
              );
            }
            return matches;
          });

          if (shouldRemove) {
            shelf.remove();
          } else {
            // Mark as processed to avoid checking again
            shelf.setAttribute("data-processed", "true");
          }
        } else {
          // If no title found, check if this might be a shorts shelf by class name
          const shelfClasses = shelf.className.toLowerCase();
          const shouldRemoveByClass = REMOVAL_PATTERNS.some((pattern) => {
            const matches = pattern.test(shelfClasses);
            if (matches) {
              console.log(
                `Removing shelf by class "${shelfClasses}" (matched pattern: ${pattern})`
              );
            }
            return matches;
          });

          if (shouldRemoveByClass) {
            shelf.remove();
          } else {
            // Mark as processed to avoid repeated checks
            shelf.setAttribute("data-processed", "true");
          }
        }
      });
    });
  }

  /**
   * Some ai gen logic to re-add shelf items
   * I don't know how useful all of this is. It seems to work though...
   */
  function restoreShelves() {
    const processedShelves = document.querySelectorAll(
      '[data-processed="true"]'
    );
    processedShelves.forEach((shelf) => {
      shelf.removeAttribute("data-processed");
    });
  }

  /**
   * Apply UI changes to YouTube
   */
  function applyChanges() {
    setGridItemsPerRow();
    removeShelves();
  }

  // Debounced resize handler
  function handleResize() {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(() => {
      // Clear renderer cache if DOM structure might have changed
      gridRenderer = null;
      setGridItemsPerRow();
    }, 150);
  }

  // Throttled mutation observer callback
  let mutationTimeout = null;
  const handleMutations = (mutations) => {
    // Only process if there are actual content changes
    const hasRelevantChanges = mutations.some(
      (mutation) =>
        mutation.type === "childList" &&
        (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
    );

    if (!hasRelevantChanges) return;

    if (mutationTimeout) {
      clearTimeout(mutationTimeout);
    }

    mutationTimeout = setTimeout(() => {
      // Clear renderer cache if DOM structure might have changed
      gridRenderer = null;
      applyChanges();
    }, 50);
  };

  let observer = null;

  function initializeObserver() {
    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver(handleMutations);

    const targetNode =
      document.querySelector("#contents") ||
      document.querySelector("ytd-page-manager") ||
      document.body;

    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  }

  /**
   * Update YouTube layout based on input settings
   * Shorts and Playable booleans are reversed
   * @param {*} settings contains (number) iconSize, (boolean) enableShorts, and (boolean) enablePlayables
   */
  function updateSettings(settings) {
    PSEUDO_ICON_SIZE = settings.iconSize || 600;
    REMOVE_SHORTS = !settings.enableShorts;
    REMOVE_PLAYABLES = !settings.enablePlayables;

    // Clear renderer cache if DOM structure might have changed
    gridRenderer = null;

    if (settings.enableShorts || settings.enablePlayables) {
      restoreShelves();
    }

    applyChanges();
  }

  /**
   * Listen to UI updates sent from content.js
   */
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data.type === "YOUTUBE_LAYOUT_SETTINGS") {
      updateSettings(event.data.settings);
    }
  });

  // Init
  applyChanges();
  initializeObserver();

  window.addEventListener("resize", handleResize, { passive: true });

  // Cleanup function (useful for development/testing)
  window.youtubeLayoutCleanup = () => {
    if (observer) observer.disconnect();
    window.removeEventListener("resize", handleResize);
    if (resizeTimeout) clearTimeout(resizeTimeout);
    if (mutationTimeout) clearTimeout(mutationTimeout);
  };
})();
