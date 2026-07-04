"""
Regenerate manifest.json from whatever portrait image files are present
in this folder. Run this AFTER you drop real image files in here:

    python build_manifest.py

It scans for image files whose names look like websim blob ids
(<uuid>.<ext>) and lists them in manifest.json. App.jsx reads that
manifest on load and redirects matching characters to the local file.
"""
import os, json, re

HERE = os.path.dirname(os.path.abspath(__file__))
IMG_EXT = ('.webp', '.png', '.jpg', '.jpeg', '.gif')
# blob-id style names, e.g. 019bd201-28c5-72b3-8eea-54d7a2d3aaef.png
BLOB_RE = re.compile(r'^[0-9a-fA-F-]{16,}\.(webp|png|jpg|jpeg|gif)$', re.I)

files = []
for fn in os.listdir(HERE):
    full = os.path.join(HERE, fn)
    if not os.path.isfile(full):
        continue
    if fn.lower().endswith(IMG_EXT) and BLOB_RE.match(fn) and os.path.getsize(full) > 100:
        files.append(fn)

files.sort()
json.dump(files, open(os.path.join(HERE, 'manifest.json'), 'w'), indent=0)
print(f'manifest.json updated: {len(files)} local portrait(s) active.')
