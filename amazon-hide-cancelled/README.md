# Hide Cancelled Amazon Orders

Chrome/Edge/Brave (Manifest V3) extension that hides cancelled orders on Amazon's order history page.

## Install
1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this `amazon-hide-cancelled` folder.
3. Visit your Amazon order history. Cancelled orders are hidden; use the toolbar popup to toggle.

## Notes
Detection looks for "cancelled"/"canceled" text in each order card. If Amazon changes its markup,
update `CARD_SELECTOR` in `content.js`. For Firefox, add a `browser_specific_settings.gecko.id` to the manifest.
