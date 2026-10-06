(() => {
  const FAB_ID = "keep-print-fab";

  // An open note is rendered as a floating overlay on top of the grid, so
  // find it by how it's actually drawn on screen (fixed/absolute
  // positioning, sized like a note rather than a small button) instead of
  // guessing a class or role name — Keep's wrapper classes are
  // build-hashed and shared between grid tiles and the open note alike.
  function findOpenNoteContainer() {
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

  // Pull out just the note's text — title, and either checklist items (with
  // checked state) or plain body text — rather than trying to preserve
  // Keep's exact visual markup. This only depends on ARIA roles Keep uses
  // for accessibility (role="textbox" for editable text, role="checkbox"
  // for list items), which are far more stable than its generated class
  // names and don't care about exactly where the note's container
  // boundary falls.
  function extractNote(container) {
    const textboxes = Array.from(container.querySelectorAll('[role="textbox"]')).filter(
      (el) => el.offsetParent !== null
    );
    const checkboxes = Array.from(container.querySelectorAll('[role="checkbox"]')).filter(
      (el) => el.offsetParent !== null
    );

    const title = textboxes.length ? textboxes[0].innerText.trim() : "";

    if (checkboxes.length) {
      const items = checkboxes
        .map((checkbox) => {
          const checked = checkbox.getAttribute("aria-checked") === "true";
          const row = checkbox.parentElement;
          const rowTextbox = row ? row.querySelector('[role="textbox"]') : null;
          const text = (rowTextbox ? rowTextbox.innerText : row ? row.innerText : "").trim();
          return { text, checked };
        })
        .filter((item) => item.text);
      return { title, items };
    }

    const body = textboxes
      .slice(1)
      .map((tb) => tb.innerText.trim())
      .filter(Boolean)
      .join("\n\n");
    return { title, body };
  }

  function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function buildPrintDocument({ title, items, body }) {
    const heading = escapeHTML(title || "Untitled note");
    const content =
      items && items.length
        ? `<ul class="items">${items
            .map(
              (item) =>
                `<li class="${item.checked ? "checked" : ""}"><span class="box"></span><span>${escapeHTML(
                  item.text
                )}</span></li>`
            )
            .join("")}</ul>`
        : `<p class="body">${escapeHTML(body || "(empty note)").replace(/\n/g, "<br>")}</p>`;

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${heading}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #202124; padding: 32px; max-width: 700px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 20px; border-bottom: 2px solid #202124; padding-bottom: 8px; }
  ul.items { list-style: none; margin: 0; padding: 0; }
  ul.items li { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; font-size: 15px; border-bottom: 1px solid #e0e0e0; }
  .box { width: 16px; height: 16px; border: 2px solid #5f6368; border-radius: 3px; flex: none; margin-top: 2px; }
  li.checked .box { background: #5f6368; }
  li.checked { color: #80868b; text-decoration: line-through; }
  p.body { font-size: 15px; line-height: 1.7; white-space: pre-wrap; }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
  <h1>${heading}</h1>
  ${content}
</body>
</html>`;
  }

  function printNoteWindow(data) {
    const html = buildPrintDocument(data);
    const win = window.open("", "_blank", "width=850,height=900");
    if (!win) {
      alert(
        "Your browser blocked the print preview pop-up. Please allow pop-ups for keep.google.com and try again."
      );
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.addEventListener("load", () => {
      win.focus();
      win.print();
    });
  }

  function handlePrintRequest() {
    const container = findOpenNoteContainer();
    if (!container) {
      alert("Open a note first, then click Print.");
      return;
    }
    const data = extractNote(container);
    if (!data.title && !(data.items && data.items.length) && !data.body) {
      alert("Couldn't find any text in the open note — try again, or let me know if this keeps happening.");
      return;
    }
    printNoteWindow(data);
  }

  function ensureButton() {
    if (document.getElementById(FAB_ID)) return;
    const btn = document.createElement("button");
    btn.id = FAB_ID;
    btn.type = "button";
    btn.title = "Print the open note";
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
