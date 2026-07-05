#!/usr/bin/env python3
"""Generate the app/notification icons (#58): a jara coin on Celo green.

Placeholder-grade but branded — regenerate any time with:
    python3 scripts/gen-icons.py
Replace with designed artwork whenever one exists; keep the filenames.
"""

from PIL import Image, ImageDraw

GREEN = "#35D07F"  # celo-green (tailwind theme)
GOLD = "#FBCC5C"  # celo-gold
WHITE = "#FFFFFF"


def icon(size: int) -> Image.Image:
    s = size
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Rounded-square background.
    radius = s // 5
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=radius, fill=GREEN)

    # The jara coin: white ring, gold face.
    cx = cy = s / 2
    r_outer = s * 0.34
    r_face = s * 0.26
    d.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], fill=WHITE)
    d.ellipse([cx - r_face, cy - r_face, cx + r_face, cy + r_face], fill=GOLD)

    # A little "spray" of three white drops toward the top-right.
    for i, (dx, dy, r) in enumerate([(0.26, -0.30, 0.045), (0.34, -0.20, 0.035), (0.31, -0.38, 0.03)]):
        x, y, rr = cx + s * dx, cy + s * dy, s * r
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=WHITE)

    return img


for size in (192, 512):
    icon(size).save(f"public/icon-{size}.png")
    print(f"wrote public/icon-{size}.png")
