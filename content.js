(function () {
  const pseudoIconSize = 450;
  const removeYoutubeshort = true;

  function setGridItemsPerRow() {
    const gridRenderer = document.querySelector("ytd-rich-grid-renderer");

    if (gridRenderer) {
      gridRenderer.style.setProperty(
        "--ytd-rich-grid-items-per-row",
        window.innerWidth / pseudoIconSize
      );
    }
  }

  function removeShortsShelf() {
    const shortsShelves = document.querySelectorAll("ytd-rich-section-renderer");

    shortsShelves.forEach((shelf) => {
      const titleElement = shelf.querySelector("span#title");
      if (
        titleElement &&
        titleElement.textContent.trim().toLowerCase() === "shorts"
      ) {
        shelf.remove();
      }
    });
  }

  function applyChanges() {
    setGridItemsPerRow();
    if (removeYoutubeshort) {
      removeShortsShelf();
    }
  }

  applyChanges();

  const observer = new MutationObserver(() => {
    applyChanges();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Update if window size changes
  window.addEventListener("resize", applyChanges);
})();
