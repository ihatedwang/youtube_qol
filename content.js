// Content script - bridges between popup and injected script
let injectedScript = null;

// Default settings
const DEFAULT_SETTINGS = {
  iconSize: 600,
  enableShorts: false,
  enablePlayables: false,
};

/**
 * injected.js is loaded into a custom element <script>
 * Attempts to add element to <head> or <html> tag.
 * <script> is then removed afterwards to clean up the DOM
 */
function injectScript() {
  if (injectedScript) return;

  injectedScript = document.createElement("script");
  injectedScript.src = chrome.runtime.getURL("injected.js");
  injectedScript.onload = function () {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(injectedScript);
}

/**
 * Send settings to injected script
 * @param {*} settings contains (number) iconSize, (boolean) enableShorts, and (boolean) enablePlayables
 */
function sendSettingsToPage(settings) {
  window.postMessage(
    {
      type: "YOUTUBE_LAYOUT_SETTINGS",
      settings: settings,
    },
    "*"
  );
}

chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
  injectScript();

  setTimeout(() => {
    sendSettingsToPage(settings);
  }, 100);
});

// Listen for updateSettings message from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateSettings") {
    sendSettingsToPage(message.settings);
  }
});

observer.observe(document, { subtree: true, childList: true });
