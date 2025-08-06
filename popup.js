const DEFAULT_SETTINGS = {
  iconSize: 600,
  enableShorts: false,
  enablePlayables: false,
};

const iconSizeInput = document.getElementById("iconSize");
const enableShortsToggle = document.getElementById("enableShorts");
const enablePlayablesToggle = document.getElementById("enablePlayables");
const resetBtn = document.getElementById("resetBtn");
const status = document.getElementById("status");

/**
 * Checks and sees if the active tab url includes youtube.com
 *
 * @param {*} tabs open in chrome browser
 * @returns boolean
 */
function isYouTube(tabs) {
  return tabs[0] && tabs[0].url.includes("youtube.com");
}

/**
 * Load settings from Chrome storage
 */
function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    iconSizeInput.value = settings.iconSize;
    enableShortsToggle.checked = settings.enableShorts;
    enablePlayablesToggle.checked = settings.enablePlayables;
  });
}

/**
 * Save settings to Chrome storage when active tab is YouTube
 * Occurs everytime a setting is changed (e.g., shelf toggle or thumbnail size)
 */
function saveSettings() {
  const settings = {
    iconSize: parseInt(iconSizeInput.value),
    enableShorts: enableShortsToggle.checked,
    enablePlayables: enablePlayablesToggle.checked,
  };

  chrome.storage.sync.set(settings, () => {
    showStatus();

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (isYouTube(tabs)) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "updateSettings",
          settings: settings,
        });
      }
    });
  });
}

/**
 * Show a status message for 2 seconds
 */
function showStatus() {
  status.classList.add("show");
  setTimeout(() => {
    status.classList.remove("show");
  }, 2000);
}

/**
 * Reset settings to default values
 */
function resetSettings() {
  iconSizeInput.value = DEFAULT_SETTINGS.iconSize;
  enableShortsToggle.checked = DEFAULT_SETTINGS.enableShorts;
  enablePlayablesToggle.checked = DEFAULT_SETTINGS.enablePlayables;
  saveSettings();
}

/**
 * Disable/enable all controls based on whether current tab is YouTube
 * disable booleans are reversed
 * @param {boolean} disabled - true to disable controls, false to enable
 */
function setControlsState(enableControls) {
  iconSizeInput.disabled = !enableControls;
  enableShortsToggle.disabled = !enableControls;
  enablePlayablesToggle.disabled = !enableControls;
  resetBtn.disabled = !enableControls;

  document.body.style.opacity = disabled ? "0.5" : "1";
}

/**
 * Check if current tab is YouTube and update controls state
 */
function checkCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    setControlsState(isYouTube(tabs));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  checkCurrentTab();
});

iconSizeInput.addEventListener("input", saveSettings);
enableShortsToggle.addEventListener("change", saveSettings);
enablePlayablesToggle.addEventListener("change", saveSettings);
resetBtn.addEventListener("click", resetSettings);

// Listen for tab changes
chrome.tabs.onActivated.addListener(checkCurrentTab);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    checkCurrentTab();
  }
});
