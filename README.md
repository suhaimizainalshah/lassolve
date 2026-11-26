# Lassolve

**Capture, record and extract anything you can see.** Lassolve is a Chrome extension that puts screenshots, screen recording, a design inspector, a data scraper and a media finder behind one button. Everything runs on your device: no accounts, no servers, no tracking.

## Features

### Capture
- **Area:** drag to select (Alt+Shift+A).
- **Lasso:** draw any shape; the capture keeps only what's inside.
- **Element:** hover to highlight, scroll to step out to the parent or in to a child, then click.
- **Visible area** or **full page** (Alt+Shift+F). Full pages are scrolled and stitched automatically, and fixed headers appear only once.
- After selecting an area, lasso or element you can also **copy its text**, **find the media inside it**, or **scrape similar items**.

### Edit captures
Arrow, box, circle, pen, highlighter, text, numbered steps, blur to hide private details, and crop. Undo and redo. Copy to the clipboard or download as PNG, JPG, WebP or **PDF**: either one page the size of the capture, or A4 pages ready to print (long captures are split across pages). In **My captures**, *Save all as one PDF* combines every capture into a single document. Your last 30 captures are kept in **My captures** so you can come back to them.

### Record
Record a tab, a window or the whole screen, with sound from the tab or screen, your microphone, or both. Optional floating camera bubble for window and screen recordings, a 3-second countdown, 720p or 1080p, 30 or 60 frames a second, pause and resume, mute the mic, then review and download as MP4 (or WebM).

**Your voice:** switch on **Microphone** to narrate. A meter checks your microphone before you start ("Speak to test"), and shows your voice while you record. The video keeps the sound.

### GIFs
- **After a recording:** choose the part you want while watching it back (**Set start here**, **Set end here**), the width, the smoothness and whether it loops, then **Create GIF**.
- **Video to GIF:** turn part of any MP4, WebM or MOV file into a GIF. Open it from the recorder, or go straight to `recorder.html#gif`.
- **Made for screen recordings:** one palette built from the clip's own colours keeps text crisp, and each frame stores only the pixels that changed, so a still screen costs almost nothing. In a test, a 6-second tutorial clip at 640 px came to 66 KB, against 474 KB with a fixed palette.
- GIFs cannot hold sound: your voice stays in the video download. Everything is made on your device.

### Page effects
Great for tutorials, demos and accessibility: cursor highlight, click ripples, show keystrokes, spotlight, magnifier, reading ruler, dark page, grayscale, layout outlines and pause animations.

### Visual inspector
- **Fonts and styles:** hover anything to see its font, size, weight, line height, colours, padding and radius; click to copy the CSS.
- **Pick colour:** sample any pixel on screen and copy its hex code.
- **Page palette:** the page's most-used colours and fonts.

### Extract
- **Scrape data:** detects tables and repeated lists (products, search results, listings) and turns them into columns such as title, link, image, price, date and rating. Also lists every link (internal and external), contact details (emails, phones, social profiles), meta tags, headings and structured data. Export CSV (Excel-friendly), JSON, or copy straight into Google Sheets.
- **Point and pick:** click one item and Lassolve finds all the similar ones on the page.
- **Media and files:** finds images (including high-resolution srcset versions, CSS backgrounds, inline SVGs, share images and icons), videos, audio and documents (PDF, Word, Excel, PowerPoint, ZIP and more), including ones the page has hidden or loaded in the background. Filter by type and size, then download what you select into a `Lassolve/<site>` folder.
- **Hidden items:** hidden text (collapsed sections, menus, pop-ups) with a one-click reveal, developer comments in the page source, hidden form fields and embedded frames.

### Everywhere
Right-click any page and choose **Lassolve** for the main tools. Shortcuts can be changed at `chrome://extensions/shortcuts`.

## Responsible use
Lassolve only saves files that a page already serves openly. It does not bypass logins, paywalls, DRM or streaming protection (streaming video is shown as "can't be saved"; use Record instead). Respect copyright, each site's terms of service and robots rules, and privacy law when handling personal data such as contact details.

## Install for testing
1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose this folder.
3. Pin Lassolve from the puzzle-piece menu.

Works in Chrome 116 or later and other Chromium browsers (Edge, Brave, Opera, Vivaldi, Arc). Chrome doesn't allow extensions on its own pages, the Chrome Web Store or its PDF viewer; recording still works there.

## Publish on the Chrome Web Store
1. Upload `Lassolve-extension.zip` in the Chrome Web Store Developer Dashboard.
2. Copy the listing text and permission reasons from `store/STORE_LISTING.md`, and upload the screenshots and promo tile from `store/`.
3. Privacy policy URL: `https://github.com/suhaimizainalshah/Lassolve/blob/main/PRIVACY.md`.

## Files
```
manifest.json    Manifest V3 settings
background.js    tools, screenshot capture and stitching, storage, downloads, menus, shortcuts
toolkit.js       on-page tools in a Shadow DOM: selection, effects, inspector, scraper, media, hidden items
popup.html/js    the toolbar panel
editor.html/js   capture editor and My captures library
recorder.html/js screen recorder (with voice meters)
recorder-gif.js, gifpanel.js, gifmaker.js  GIFs from recordings and video files
vendor/gifenc.esm.js  GIF encoder (gifenc 1.0.3 by Matt DesLauriers, MIT licence: vendor/gifenc-LICENSE.md)
welcome.html     first-run page
privacy.html, PRIVACY.md  privacy policy
icons/  store/   icons, Web Store screenshots and listing text
```

## Licence
MIT
