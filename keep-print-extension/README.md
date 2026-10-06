# Print for Google Keep

A small Chrome extension that adds a print button to [Google Keep](https://keep.google.com) so you can print a note — like a shopping list — as a clean, simple page instead of Google's print dialog capturing the whole app UI.

## What it does

- Adds a floating **🖨️ Print** button in the bottom-right corner of any Keep page.
- Open a note (checklist or plain text) and click it. The extension reads the note's title and its list items (or text), and opens a new tab with a plain, readable printout — a title, and either a checklist (with boxes showing which items are checked) or the note's text — then triggers your browser's print dialog on that page.
- The extension's toolbar icon does the same thing, so you don't have to hunt for the floating button.
- If no note is open, it tells you to open one first — it doesn't try to print the whole notes grid.

This deliberately doesn't try to visually replicate Keep's note card (colors, fonts, exact layout). Google Keep's page is a complex, actively-changing web app with no public structure to target reliably, so instead of fighting it, the extension only reads the note's text content (via stable accessibility roles, not Keep's internal class names) and renders it in a page the extension fully controls. That's what makes this reliable rather than fragile.

## Install (unpacked, for personal use)

Chrome extensions installed this way aren't published to the Web Store — you load the folder directly:

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select this `keep-print-extension` folder.
5. Go to `keep.google.com`, open a note, and click **🖨️ Print**.

## Notes

- If Chrome blocks the print preview as a pop-up, allow pop-ups for `keep.google.com` and try again.
- No data leaves your browser — the extension only reads the note you have open and opens a new tab with its text.
