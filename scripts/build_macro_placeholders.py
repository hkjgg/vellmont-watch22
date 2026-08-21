"""Generates abstract macro-photography-style placeholder JPGs used as backdrop
texture behind the Cinematic Macro Zoom section. Not real photography — a
stand-in so the section has photographic depth with no missing-file errors.

Run: python3 scripts/build_macro_placeholders.py
"""
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

W, H = 1920, 1200
OUT_DIR = "public/assets/macro"


def vignette(img, strength=0.55):
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([-w * 0.25, -h * 0.25, w * 1.25, h * 1.25], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(w * 0.12))
    dark = Image.new("RGB", (w, h), (5, 5, 6))
    return Image.composite(img, dark, mask.point(lambda p: int(p * strength + (1 - strength) * 255)))


def grain(img, amount=10):
    px = img.load()
    w, h = img.size
    rnd = random.Random(7)
    for _ in range(int(w * h * 0.06)):
        x, y = rnd.randrange(w), rnd.randrange(h)
        r, g, b = px[x, y]
        n = rnd.randint(-amount, amount)
        px[x, y] = (max(0, min(255, r + n)), max(0, min(255, g + n)), max(0, min(255, b + n)))
    return img


def radial_gradient(size, inner, outer):
    w, h = size
    img = Image.new("RGB", size)
    cx, cy = w / 2, h / 2
    maxd = math.hypot(cx, cy)
    px = img.load()
    for y in range(h):
        for x in range(0, w, 2):
            d = math.hypot(x - cx, y - cy) / maxd
            t = min(1, d)
            r = int(inner[0] + (outer[0] - inner[0]) * t)
            g = int(inner[1] + (outer[1] - inner[1]) * t)
            b = int(inner[2] + (outer[2] - inner[2]) * t)
            px[x, y] = (r, g, b)
            if x + 1 < w:
                px[x + 1, y] = (r, g, b)
    return img


def case_texture():
    """Brushed steel case macro — fine directional brushed-metal streaks."""
    img = radial_gradient((W, H), (150, 152, 158), (30, 31, 34))
    draw = ImageDraw.Draw(img)
    rnd = random.Random(1)
    for _ in range(2200):
        y = rnd.uniform(0, H)
        x0 = rnd.uniform(-100, W)
        length = rnd.uniform(120, 520)
        shade = rnd.randint(-26, 30)
        base = 120 + shade
        draw.line([(x0, y), (x0 + length, y + rnd.uniform(-2, 2))], fill=(base, base + 2, base + 6), width=1)
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    img = vignette(img, 0.6)
    return grain(img, 6)


def dial_texture():
    """Guilloché dial macro — fine concentric engine-turned rings."""
    img = Image.new("RGB", (W, H), (8, 8, 9))
    draw = ImageDraw.Draw(img)
    cx, cy = W / 2, H / 2
    maxr = math.hypot(W, H) / 2
    r = 6
    i = 0
    while r < maxr:
        t = r / maxr
        shade = int(14 + 46 * (0.5 + 0.5 * math.sin(i * 0.9)))
        gold = (int(shade * 1.4 + 20), int(shade * 1.15 + 12), int(shade * 0.6 + 4))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=gold, width=1)
        r += 5.5
        i += 1
    img = img.filter(ImageFilter.GaussianBlur(0.3))
    img = vignette(img, 0.45)
    return grain(img, 5)


def movement_texture():
    """Warm brass movement macro — overlapping gear-like circles and jewels."""
    img = radial_gradient((W, H), (58, 44, 24), (10, 8, 6))
    draw = ImageDraw.Draw(img)
    rnd = random.Random(3)
    for _ in range(26):
        r = rnd.uniform(40, 220)
        cx = rnd.uniform(0, W)
        cy = rnd.uniform(0, H)
        shade = rnd.randint(70, 150)
        col = (shade, int(shade * 0.78), int(shade * 0.38))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=col, width=3)
        for tooth in range(14):
            a = tooth * (2 * math.pi / 14)
            x1, y1 = cx + math.cos(a) * r, cy + math.sin(a) * r
            x2, y2 = cx + math.cos(a) * (r + 10), cy + math.sin(a) * (r + 10)
            draw.line([(x1, y1), (x2, y2)], fill=col, width=2)
    for _ in range(8):
        r = rnd.uniform(6, 14)
        cx, cy = rnd.uniform(0, W), rnd.uniform(0, H)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(150, 20, 26))
    img = img.filter(ImageFilter.GaussianBlur(0.5))
    img = vignette(img, 0.6)
    return grain(img, 8)


def strap_texture():
    """Polished bracelet-link macro — rows of beveled metal links."""
    img = radial_gradient((W, H), (170, 172, 176), (24, 25, 28))
    draw = ImageDraw.Draw(img)
    rnd = random.Random(5)
    link_w = 170
    for row in range(0, H, 90):
        offset = 0 if (row // 90) % 2 == 0 else link_w // 2
        for x in range(-link_w, W + link_w, link_w):
            xx = x + offset
            shade = rnd.randint(60, 200)
            col = (shade, shade + 2, shade + 6)
            draw.rounded_rectangle([xx, row, xx + link_w - 8, row + 78], radius=10, outline=col, width=2)
            draw.line([(xx + 10, row + 10), (xx + link_w - 18, row + 10)], fill=(255, 255, 255, 40), width=1)
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    img = vignette(img, 0.55)
    return grain(img, 7)


os.makedirs(OUT_DIR, exist_ok=True)
for name, fn in [("case", case_texture), ("dial", dial_texture), ("movement", movement_texture), ("strap", strap_texture)]:
    out = fn()
    path = os.path.join(OUT_DIR, f"{name}.jpg")
    out.save(path, "JPEG", quality=82)
    print(f"Wrote {path} ({os.path.getsize(path) // 1024} KB)")
