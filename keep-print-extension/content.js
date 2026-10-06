(() => {
  const FAB_ID = "keep-print-fab";

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

  // Walk up to the portal's root child of <body> so we can hide every other
  // sibling on the page (Keep's toolbar, sidebar, note grid, etc.) for print.
  function getPortalRoot(el) {
    let node = el;
    while (node.parentElement && node.parentElement !== document.body) {
      node = node.parentElement;
    }
    return node;
  }

  function printWithCleanup(applyClasses, removeClasses) {
    applyClasses();
    const cleanup = () => {
      removeClasses();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    // Safety net in case afterprint doesn't fire (some browsers skip it if
    // the print dialog is cancelled very quickly).
    setTimeout(cleanup, 3000);
  }

  function printOpenDialog(dialog) {
    const portalRoot = getPortalRoot(dialog);
    printWithCleanup(
      () => {
        document.body.classList.add("keep-print-active");
        portalRoot.classList.add("keep-print-target");
        dialog.classList.add("keep-print-dialog");
      },
      () => {
        document.body.classList.remove("keep-print-active");
        portalRoot.classList.remove("keep-print-target");
        dialog.classList.remove("keep-print-dialog");
      }
    );
  }

  function printNoteGrid() {
    printWithCleanup(
      () => document.body.classList.add("keep-print-active", "keep-print-grid"),
      () => document.body.classList.remove("keep-print-active", "keep-print-grid")
    );
  }

  function handlePrintRequest() {
    const dialog = getOpenDialog();
    if (dialog) {
      printOpenDialog(dialog);
    } else {
      printNoteGrid();
    }
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
