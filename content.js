(function () {
  const PSEUDO_ICON_SIZE = 450;
  const REMOVE_SHORTS = true;
  const REMOVE_PLAYABLES = true;
  const SHELF_NAME = "ytd-rich-section-renderer";

  function setGridItemsPerRow() {
    const gridRenderer = document.querySelector("ytd-rich-grid-renderer");

    if (gridRenderer) {
      gridRenderer.style.setProperty(
        "--ytd-rich-grid-items-per-row",
        window.innerWidth / PSEUDO_ICON_SIZE
      );
    }
  }

  function removeShortsShelf() {
    const shortsShelves = document.querySelectorAll(SHELF_NAME);

    shortsShelves.forEach((shelf) => {
      const titleElement = shelf.querySelector("span#title");
      if (
        titleElement &&
        titleElement.textContent.trim().toLowerCase().includes("shorts")
      ) {
        shelf.remove();
      }
    });
  }

  function removePlayablesShelf() {
    const playablesShelves = document.querySelectorAll(SHELF_NAME);
    
    playablesShelves.forEach((shelf) => {
      const titleElement = shelf.querySelector("span#title");
      if (
        titleElement &&
        titleElement.textContent.trim().toLowerCase().includes("youtube playables")
      ) {
        shelf.remove();
      }
    });
  }

  function applyChanges() {
    setGridItemsPerRow();
    if (REMOVE_SHORTS) {
      removeShortsShelf();
    }
    if (REMOVE_PLAYABLES) {
      removePlayablesShelf();
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
