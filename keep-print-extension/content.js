(() => {
  const FAB_ID = "keep-print-fab";
  const HOST_ID = "keep-print-host";

  // DevTools inspection showed Keep's open note isn't a separate dialog
  // element at all — it shares its wrapper class with ordinary grid tiles
  // and sits among its siblings in the same container, just rendered as a
  // floating overlay via CSS. So detect it by how it's actually drawn on
  // screen (fixed/absolute positioning, sized like a note rather than a
  // small button or badge) instead of guessing a class or role name. Still
  // check role="dialog" first in case Keep ever adopts that pattern.
  function getOpenDialog() {
    const ariaDialogs = document.querySelectorAll('div[role="dialog"]');
    for (const dialog of ariaDialogs) {
      if (dialog.offsetParent !== null) return dialog;
    }
    return findOverlayNote();
  }

  function findOverlayNote() {
    const viewportArea = window.innerWidth * window.innerHeight;
    let best = null;
    document.querySelectorAll("div").forEach((el) => {
      if (el.id === FAB_ID) return;
      const style = getComputedStyle(el);
      if (style.position !== "fixed" && style.position !== "absolute") return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 300 || rect.height < 150) return; // too small to be a note
      const area = rect.width * rect.height;
      if (area > viewportArea * 0.95) return; // skip full-page scrims/backdrops
      if (!best || area > best.area) best = { el, area };
    });
    return best ? best.el : null;
  }

  function nearestCommonAncestor(a, b) {
    const ancestors = new Set();
    for (let node = a; node; node = node.parentElement) ancestors.add(node);
    for (let node = b; node; node = node.parentElement) {
      if (ancestors.has(node)) return node;
    }
    return null;
  }

  // Confirmed via DevTools inspection: Keep wraps the whole notes grid in
  // <div class="notes-container ...">. Unlike the rest of the page's
  // build-hashed class names, this one reads as a deliberate, stable hook,
  // so try it first.
  function findNotesGridContainer() {
    const known = document.querySelector(".notes-container");
    if (known && known.offsetParent !== null) return known;
    return findNotesGridContainerByHeuristic();
  }

  // Fallback for if Keep ever renames/removes that class: find whichever
  // group of elements sharing one exact class attribute repeats the most
  // across the page (the note tiles almost always win this, since there
  // are usually far more of them than any other repeated UI element), then
  // isolate their common container.
  function findNotesGridContainerByHeuristic() {
    const groups = new Map();
    document.querySelectorAll("div[class]").forEach((el) => {
      const key = el.getAttribute("class");
      if (!key) return;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(el);
    });

    let best = null;
    for (const els of groups.values()) {
      if (els.length < 4) continue;
      if (!els.some((el) => el.offsetParent !== null)) continue; // skip hidden groups
      let ancestor = els[0];
      for (let i = 1; i < els.length; i++) {
        ancestor = nearestCommonAncestor(ancestor, els[i]);
        if (!ancestor) break;
      }
      if (!ancestor || ancestor === document.body) continue;
      if (!best || els.length > best.count) {
        best = { ancestor, count: els.length };
      }
    }
    return best ? best.ancestor : null;
  }

  // Keep is a live React app — marking its own DOM nodes with classes and
  // hiding/showing them in place risks Keep re-rendering and wiping those
  // classes out before the print snapshot is actually taken, which can
  // silently blank the page no matter what the CSS says. Sidestep that
  // entirely: clone the target into a plain, detached container appended
  // fresh to <body>. The clone still renders correctly, since Keep's CSS
  // is keyed by class name globally, not scoped to the original node — but
  // nothing Keep's app does afterward can touch our copy.
  function printIsolated(target, extraClass) {
    const clone = target.cloneNode(true);
    if (extraClass) clone.classList.add(extraClass);
    const host = document.createElement("div");
    host.id = HOST_ID;
    host.appendChild(clone);
    document.body.appendChild(host);
    document.body.classList.add("keep-print-active");

    const cleanup = () => {
      host.remove();
      document.body.classList.remove("keep-print-active");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    // Safety net in case afterprint doesn't fire (some browsers skip it if
    // the print dialog is cancelled very quickly).
    setTimeout(cleanup, 3000);
  }

  function handlePrintRequest() {
    const dialog = getOpenDialog();
    if (dialog) {
      printIsolated(dialog, "keep-print-dialog");
      return;
    }
    const grid = findNotesGridContainer();
    if (grid) {
      printIsolated(grid, "keep-print-grid");
      return;
    }
    // Last resort: nothing recognizable found, just print the page as-is.
    window.print();
  }

  function ensureButton() {
    if (document.getElementById(FAB_ID)) return;
    const btn = document.createElement("button");
    btn.id = FAB_ID;
    btn.type = "button";
    btn.title = "Print this note (or all notes if none is open)";
    btn.textContent = "🖨️ Print";
    btn.addEventListener("click", handlePrintRequest);
    document.body.appendChild(btn);
  }

  ensureButton();
  // Keep re-renders large chunks of the page as you navigate; keep the
  // button alive across those re-renders.
  new MutationObserver(ensureButton).observe(document.body, { childList: true });

  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === "KEEP_PRINT_TRIGGER") {
      handlePrintRequest();
    }
  });
})();
