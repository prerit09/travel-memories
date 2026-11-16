
from pathlib import Path
from urllib.parse import urlparse
import html, json, re, time
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
HEADERS = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36"}

def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower().replace("&", " and ")).strip("-") or "event"

def parse_source():
    years, year = {}, None
    for raw in (ROOT / "trips.md").read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        m = re.match(r"#+\s*(\d{4})\s*\|\s*(.+)", line)
        if m:
            year, title = m.groups()
            years.setdefault(year, {"title": title.strip(), "events": []})
            continue
        if year and line.startswith("|") and not re.match(r"\|\s*:?-{2,}", line):
            cells = [x.strip() for x in line.strip("|").split("|")]
            if len(cells) >= 2 and cells[0].lower() != "event" and cells[1].startswith("http"):
                years[year]["events"].append({"title": cells[0], "url": cells[1]})
    return years

def fallback_svg(path, title, year):
    safe = html.escape(title[:42])
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="900" height="650" viewBox="0 0 900 650">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#dce8e3"/><stop offset="1" stop-color="#b9c9c2"/></linearGradient></defs>
<rect width="900" height="650" fill="url(#g)"/><circle cx="700" cy="150" r="78" fill="#f5f1e7"/>
<path d="M0 470L220 250L390 430L560 210L900 500V650H0Z" fill="#839b91" opacity=".6"/>
<path d="M0 530L270 360L470 520L690 340L900 500V650H0Z" fill="#617e73" opacity=".7"/>
<text x="64" y="555" font-family="Arial" font-size="24" letter-spacing="5" fill="#334b42">{year}</text>
<text x="64" y="600" font-family="Arial" font-size="34" font-weight="600" fill="#243b33">{safe}</text></svg>'''
    path.write_text(svg, encoding="utf-8")

def get_preview(page_url):
    r = requests.get(page_url, headers=HEADERS, timeout=18)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    for attr, key in [("property","og:image"),("name","twitter:image"),("property","og:image:secure_url")]:
        tag = soup.find("meta", attrs={attr:key})
        if tag and tag.get("content","").startswith(("https://","http://")):
            return tag["content"]
    return None

def save_preview(image_url, stem):
    r = requests.get(image_url, headers=HEADERS, timeout=18, stream=True)
    r.raise_for_status()
    ctype = r.headers.get("content-type","").lower()
    if not ctype.startswith("image/"):
        return None
    data = bytearray()
    for chunk in r.iter_content(65536):
        data.extend(chunk)
        if len(data) > 12*1024*1024:
            return None
    if len(data) < 2000:
        return None
    ext = ".png" if "png" in ctype else ".webp" if "webp" in ctype else ".jpg"
    out = stem.with_suffix(ext)
    out.write_bytes(data)
    return out

def main():
    years = parse_source()
    if not years:
        raise SystemExit("No events found in trips.md")
    for year, trip in years.items():
        folder = ROOT / "images" / year
        folder.mkdir(parents=True, exist_ok=True)
        for event in trip["events"]:
            stem = folder / slugify(event["title"])
            local = None
            try:
                preview = get_preview(event["url"])
                if preview:
                    local = save_preview(preview, stem)
            except Exception as e:
                print(f"[INFO] Preview unavailable for {event['title']}: {e}")
            if local:
                event["thumbnail"] = local.relative_to(ROOT).as_posix()
                print(f"[OK] Downloaded preview: {event['title']}")
            else:
                fallback = stem.with_suffix(".svg")
                fallback_svg(fallback, event["title"], year)
                event["thumbnail"] = fallback.relative_to(ROOT).as_posix()
                print(f"[FALLBACK] Created thumbnail: {event['title']}")
            time.sleep(0.3)
    (ROOT/"data"/"trips.json").write_text(json.dumps(years, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    print("Generated data/trips.json")

if __name__ == "__main__":
    main()
