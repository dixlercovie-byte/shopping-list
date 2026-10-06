(() => {
  const FAB_ID = "keep-print-fab";
  const CHAIN_CLASS = "keep-print-chain";

  // Google Keep opens a note as a `role="dialog"` React portal appended near
  // the end of <body>. Only one is ever visible at a time, so pick the first
  // one that's actually laid out on screen.
  function getOpenDialog() {
    const dialogs = document.querySelectorAll('div[role="dialog"]');
    for (const dialog of dialogs) {
      if (dialog.offsetParent !== null) return dialog;
    }
    return null;
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

  // Add a marker class to `target` and every ancestor up to <body>. The
  // matching print CSS hides any element that is a direct child of a marked
  // ancestor but isn't itself marked — i.e. every branch off the path to
  // `target` disappears, while `target` and everything inside it stays
  // exactly as rendered.
  function isolate(target) {
    const chain = [];
    for (let node = target; node; node = node.parentElement) {
      chain.push(node);
      if (node === document.body) break;
    }
    chain.forEach((node) => node.classList.add(CHAIN_CLASS));
    document.body.classList.add("keep-print-active");
    return () => {
      chain.forEach((node) => node.classList.remove(CHAIN_CLASS));
      document.body.classList.remove("keep-print-active");
    };
  }

  function printIsolated(target, extraClass) {
    if (extraClass) target.classList.add(extraClass);
    const restore = isolate(target);
    const cleanup = () => {
      restore();
      if (extraClass) target.classList.remove(extraClass);
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
