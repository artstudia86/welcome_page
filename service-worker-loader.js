import "./assets/chunk-78ca80d1.js";

// Welcome page that adapts to the toolbar pin state (pin guide vs. usage guide).
const WELCOME_URL = "https://ws.captain.works/";
// Chrome may apply the auto-pin a moment after onInstalled fires, so wait before asking.
const PIN_CHECK_DELAY_MS = 1000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Returns true/false when Chrome reports the pin state, null when the API is unavailable or fails.
const getPinnedState = async () => {
  try {
    if (!chrome.action || typeof chrome.action.getUserSettings !== "function") return null;
    const settings = await chrome.action.getUserSettings();
    return Boolean(settings && settings.isOnToolbar);
  } catch (err) {
    console.error("Study Timer: failed to read toolbar pin state", err);
    return null;
  }
};

const buildWelcomeUrl = (pinned) => {
  const url = new URL(WELCOME_URL);
  if (pinned !== null) url.searchParams.set("pinned", pinned ? "1" : "0");
  url.searchParams.set("id", chrome.runtime.id);
  return url.toString();
};

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason !== chrome.runtime.OnInstalledReason.INSTALL) return;
  await delay(PIN_CHECK_DELAY_MS);
  const pinned = await getPinnedState();
  try {
    await chrome.tabs.create({ url: buildWelcomeUrl(pinned) });
  } catch (err) {
    console.error("Study Timer: failed to open the welcome page", err);
  }
});

// The welcome page (allowed via externally_connectable) polls the live pin state,
// so it can switch from the pin guide to the usage guide as soon as the user pins.
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== "getPinState") return false;
  getPinnedState().then((pinned) => sendResponse({ isOnToolbar: pinned }));
  return true; // keep the channel open for the async response
});
