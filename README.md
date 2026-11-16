# Travel Memories — GitHub Pages archive

A minimal responsive photo archive. The website is static; Python prepares the JSON data and local thumbnails.

## Run locally

Requires Python 3.9+.

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
python generate.py
python -m http.server 8000
```

Visit http://localhost:8000 (do not open index.html directly; fetch needs a local server).

## Add trips

Edit `trips.md`, adding a year heading and rows:

```markdown
# 2025 | Summer in Italy

| Event | Google Photos URL |
|---|---|
| Rome | https://photos.app.goo.gl/your-share-link |
| Florence | https://photos.app.goo.gl/your-share-link |
```

Then run `python generate.py`. It updates `data/trips.json` and `images/<year>/`.

## Automatic thumbnail caveat

The generator tries `og:image` and `twitter:image` metadata on each Google Photos share page. Google Photos does not guarantee permanent public thumbnail URLs and may block automated requests, omit the preview, or change its HTML. If no usable image is found, the script generates a local SVG placeholder. The website itself uses local files, so it does not depend on Google at page-view time.

For albums where automatic previews fail, replace the SVG with a photo you choose and update the `thumbnail` path in `data/trips.json`.

## Publish with GitHub Pages

1. Create a GitHub repository, e.g. `travel-memories`.
2. Upload the project files.
3. Go to **Settings → Pages**.
4. Choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then save.
5. Your site will be published at `https://YOUR-USERNAME.github.io/travel-memories/`.

Keep `data/trips.json` and the `images/` folder in the repository. Google Photos albums must be shared so your visitors can open them.

**Data note:** The Basel entry currently uses the exact same URL as Zurich in the supplied text. Check whether that duplicate is intentional.
