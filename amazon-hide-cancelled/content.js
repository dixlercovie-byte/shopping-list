(() => {
  // Order containers across current and older Amazon layouts.
  const CARD_SELECTOR = ".order-card, .js-order-card, .a-box-group.order, [data-component='orderCard']";
  // Matches cancelled/canceled/cancellation-complete wording (not the "Cancel items" button on live orders).
  const CANCELLED = /\b(cancelled|canceled|order cancell?ation)\b|\bannulé|\bstorniert|\bannullat|\bcancelad|\bキャンセル済/i;
  const HIDDEN_ATTR = "data-hcao-hidden";

  let enabled = true;

  function isCancelled(card) {
    // Status text lives in delivery/status banners; check the whole card but ignore buttons/links labelled "Cancel".
    return CANCELLED.test(card.innerText || "");
  }

  function scan() {
    document.querySelectorAll(CARD_SELECTOR).forEach((card) => {
      // Skip nested matches (an inner element of an already-handled card).
      if (card.parentElement && card.parentElement.closest(CARD_SELECTOR)) return;
      const hide = enabled && isCancelled(card);
      if (hide) {
        card.style.display = "none";
        card.setAttribute(HIDDEN_ATTR, "1");
      } else if (card.hasAttribute(HIDDEN_ATTR)) {
        card.style.display = "";
        card.removeAttribute(HIDDEN_ATTR);
      }
    });
  }

  let timer;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(scan, 100);
  };

  chrome.storage.sync.get({ enabled: true }, (v) => {
    enabled = v.enabled;
    scan();
  });
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
      enabled = changes.enabled.newValue;
      scan();
    }
  });

  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
})();
