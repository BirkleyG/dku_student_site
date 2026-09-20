"""Generates the PWA icon PNGs (ink background, gold 'D' monogram) with
only the Python stdlib, since no image tooling is installed in this
environment. Re-run after changing the brand colors in globals.css."""

import struct
import zlib
from pathlib import Path

INK = (10, 14, 23)
GOLD = (242, 169, 59)

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "icons"


def draw_d(size: int, padding_ratio: float = 0.24):
    pad = int(size * padding_ratio)
    top, bottom = pad, size - pad
    left = pad
    bar_w = max(2, int(size * 0.14))
    cx = left + bar_w
    cy = size // 2
    outer_r = (bottom - top) / 2
    inner_r = outer_r - int(size * 0.17)
    hole_start_x = cx + inner_r * 0.6

    pixels = [[INK for _ in range(size)] for _ in range(size)]

    for y in range(size):
        for x in range(size):
            in_bar = left <= x < left + bar_w and top <= y < bottom
            dx, dy = x - cx, y - cy
            dist = (dx * dx + dy * dy) ** 0.5
            in_hole = x >= hole_start_x and dist < inner_r
            in_bowl = x >= cx and dist <= outer_r and not in_hole
            if in_bar or in_bowl:
                pixels[y][x] = GOLD
    return pixels


def write_png(path: Path, pixels):
    size = len(pixels)
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for (r, g, b) in row:
            raw.extend((r, g, b, 255))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)

    path.write_bytes(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))


if __name__ == "__main__":
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for size in (180, 192, 512):
        write_png(OUT_DIR / f"icon-{size}.png", draw_d(size))
    # Maskable icons need extra padding so OS masks don't crop the glyph.
    write_png(OUT_DIR / "icon-512-maskable.png", draw_d(512, padding_ratio=0.34))
    print("wrote icons to", OUT_DIR)
