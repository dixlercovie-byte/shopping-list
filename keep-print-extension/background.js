chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "KEEP_PRINT_TRIGGER" }, () => {
    // Ignore "no receiving end" errors, e.g. the content script hasn't
    // loaded yet because the tab isn't on keep.google.com.
    void chrome.runtime.lastError;
  });
});
