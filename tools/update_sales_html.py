import re
import base64
import os
import hashlib

HTML_PATH = "C:/Users/norbe/Desktop/rokie/Presentacion-de-Ventas-Rookie-Makers-3D.html"
IMG_DIR = "C:/Users/norbe/Desktop/rokie/presentacion-de-ventas"
OUT_HTML = "C:/Users/norbe/Desktop/rokie/Presentacion-de-Ventas-Rookie-Makers-3D.html"

with open(HTML_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Find all <img> src values
imgs = re.findall(r'<img[^>]+src="([^"]+)"', content)
base64s = [s for s in imgs if s.startswith("data:")]
externals = [s for s in imgs if not s.startswith("data:")]

print("Total img tags:", len(imgs))
print("Base64 images:", len(base64s))
print("External images:", len(externals))
for e in externals[:50]:
    print("  ", e)

# 2. Build hash map of existing files in presentacion-de-ventas
file_hashes = {}
for fname in os.listdir(IMG_DIR):
    fpath = os.path.join(IMG_DIR, fname)
    if os.path.isfile(fpath):
        with open(fpath, "rb") as fimg:
            file_hashes[hashlib.md5(fimg.read()).hexdigest()] = fname

print("\nExisting files in folder:", len(file_hashes))

# 3. Extract base64 blobs, compute hash, try to match
pattern = re.compile(r'src="(data:image/([^;]+);base64,([^"]+))"')
replacements = {}
for m in pattern.finditer(content):
    full_src = m.group(1)
    ext = m.group(2)
    b64data = m.group(3)
    try:
        data = base64.b64decode(b64data)
        h = hashlib.md5(data).hexdigest()
        if h in file_hashes:
            replacements[full_src] = "presentacion-de-ventas/" + file_hashes[h]
            print("Matched base64 to", file_hashes[h])
        else:
            print("No match for base64 blob (hash)", h, "ext", ext, "size", len(data))
    except Exception as e:
        print("Decode error:", e)

print("\nReplacements found:", len(replacements))

# 4. Also match onclick thumbs that reference base64
thumb_pattern = re.compile(r'onclick="openLightbox\(\&#39;([^\&#39;]+)\&#39;')
for m in thumb_pattern.finditer(content):
    src = m.group(1)
    if src.startswith("data:"):
        m2 = re.search(r'base64,([^\&#39;]+)', src)
        if m2:
            try:
                data = base64.b64decode(m2.group(1))
                h = hashlib.md5(data).hexdigest()
                if h in file_hashes:
                    replacements[src] = "presentacion-de-ventas/" + file_hashes[h]
                    print("Matched thumb base64 to", file_hashes[h])
                else:
                    print("No thumb match, hash", h)
            except Exception as e:
                print("Thumb decode error", e)

# Save a copy with replacements applied
new_content = content
for old, new in replacements.items():
    new_content = new_content.replace('"' + old + '"', '"' + new + '"')
    new_content = new_content.replace("'" + old + "'", "'" + new + "'")
    new_content = new_content.replace(old, new)

with open(OUT_HTML, "w", encoding="utf-8") as f:
    f.write(new_content)

print("\nDone. Saved updated HTML.")
