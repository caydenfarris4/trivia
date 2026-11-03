"""
Finds a Wikipedia/Wikimedia Commons lead photo for every place in globetrotters_bank.csv.
No API key needed. Run locally:  pip install requests   then   python fetch_images.py
Writes globetrotters_images.csv with a candidate image URL + license + author per place.
ALWAYS eyeball the results: the top search hit is usually right, but not always.
"""
import csv, re, time, requests

# Wikimedia asks for a descriptive User-Agent with a way to contact you. Edit this line.
HEADERS = {"User-Agent": "GlobeTrottersTrivia/1.0 (youremail@example.com)"}
WIKI = "https://en.wikipedia.org/w/api.php"
COMMONS = "https://commons.wikimedia.org/w/api.php"

def lead_image(query):
    """Search Wikipedia for the place and return (article title, lead image filename)."""
    r = requests.get(WIKI, headers=HEADERS, timeout=30, params={
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": query, "gsrlimit": 1,
        "prop": "pageimages", "piprop": "name",
    })
    pages = r.json().get("query", {}).get("pages", {})
    for p in pages.values():
        return p.get("title"), p.get("pageimage")
    return None, None

def file_info(filename):
    """Ask Commons for the file's URL (1600px wide), license, and author."""
    r = requests.get(COMMONS, headers=HEADERS, timeout=30, params={
        "action": "query", "format": "json", "titles": "File:" + filename,
        "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 1600,
    })
    page = next(iter(r.json()["query"]["pages"].values()))
    info = page["imageinfo"][0]
    meta = info.get("extmetadata", {})
    strip = lambda s: re.sub(r"<[^>]+>", "", s or "").strip()
    return {
        "image_url": info.get("thumburl") or info["url"],
        "commons_page": info["descriptionurl"],
        "license": strip(meta.get("LicenseShortName", {}).get("value")),
        "author": strip(meta.get("Artist", {}).get("value")),
    }

with open("globetrotters_bank.csv", newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

out_cols = ["id", "name", "wiki_title", "image_url", "license", "author", "commons_page"]
with open("globetrotters_images.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=out_cols)
    w.writeheader()
    for row in rows:
        rec = {"id": row["id"], "name": row["name"]}
        try:
            title, fname = lead_image(f'{row["name"]} {row["country"]}')
            rec["wiki_title"] = title or ""
            if fname:
                rec.update(file_info(fname))
        except Exception as e:
            rec["wiki_title"] = f"ERROR: {e}"
        w.writerow(rec)
        print(row["id"], row["name"], "->", rec.get("wiki_title"))
        time.sleep(0.3)  # be polite to the servers
