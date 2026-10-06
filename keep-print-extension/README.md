# Print for Google Keep

A small Chrome extension that adds a print button to [Google Keep](https://keep.google.com) so you can print a single note (like a shopping list) without the app's toolbar, sidebar, and other clutter showing up on the page.

## What it does

- Adds a floating **🖨️ Print** button in the bottom-right corner of any Keep page.
- Click it while a note is open to print just that note (title, text/checklist, and labels — no toolbar icons or backdrop).
- Click it with no note open to print the whole notes grid instead.
- The extension's toolbar icon does the same thing, so you don't have to hunt for the floating button.

## Install (unpacked, for personal use)

Chrome extensions installed this way aren't published to the Web Store — you load the folder directly:

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select this `keep-print-extension` folder.
5. Go to `keep.google.com`, open a note, and click **🖨️ Print**.

## Notes

- Google Keep's page structure isn't publicly documented and can change; if the print button ever produces a blank or messy page, let me know what changed and the selectors in `content.js`/`print.css` can be updated.
- No data leaves your browser — the extension only adds a button and some print-only CSS to the Keep page you're already viewing.
