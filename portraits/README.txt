LOCAL CHARACTER PORTRAITS
=========================

The game's character art is hosted on the websim blob CDN
(https://api.websim.com/blobs/...). That CDN sits behind Cloudflare
bot-protection: a real browser can DISPLAY the images via plain <img>
tags, but every automated way of pulling the raw bytes is blocked
(server-side fetch -> HTTP 503, browser CORS fetch -> blocked,
image proxies -> 404). So the images cannot be downloaded/re-hosted
automatically -- you need the original files from the websim project.

WHAT'S IN THIS FOLDER
---------------------
  manifest.json            - list of local portrait files the game should
                             use. Currently EMPTY [] so nothing is remapped
                             and the game behaves exactly as before.
  expected_portraits.csv   - reference: every character mapped to the exact
                             filename you need (export_id, name, franchise,
                             filename, original_url). Open in Excel/Sheets.
  expected_portraits.json  - same mapping in JSON (export_id, name, filename).
  filenames.txt            - just the 407 filenames you need, one per line.
  build_manifest.py        - regenerates manifest.json from the files present.

HOW TO ACTIVATE LOCAL ART (when you have the real files)
--------------------------------------------------------
  1. Save each character's image into THIS folder using the exact filename
     from expected_portraits.csv (it's the blob id, e.g.
     019bd201-28c5-72b3-8eea-54d7a2d3aaef.png). You don't need all 407 --
     add as many as you have.

  2. Rebuild the manifest:
         python build_manifest.py
     (or edit manifest.json by hand: a JSON array of the filenames present)

  3. Reload the game. App.jsx fetches portraits/manifest.json and rewrites
     every listed character to its local file. Anything not listed keeps its
     original CDN url and falls back to placeholder_char.png if unreachable
     (handled by the image loader shim in index.html).

No code changes are ever needed -- only files + manifest.json.
