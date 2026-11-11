"""Sinh bộ sprite linh vật heo đất (PNG 32x32, nền trong suốt) từ asset CC0.

Nguồn: assets/pet-src/ (xem CREDITS.md)
Chạy:  python scripts/build_pet_sprites.py

Đầu ra:
  assets/pet-sprites/{name}.png       – từng khung, đặt tên theo quy ước
  client/src/pet/sprites.js           – object SPRITES chứa data URI base64

Quy ước tên khung:
  Stage 1 : idle_1..4, happy_1..4, eat_1..4, sad_1..2, evolve_1..3
  Stage 2-5: s{n}_ + cùng quy ước (vd s2_idle_1)
  Đồng xu : coin_1..6 (9x10, dùng cho hiệu ứng UI)
"""
import base64
import io
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "pet-src"
OUT_PNG = ROOT / "assets" / "pet-sprites"
OUT_JS = ROOT / "client" / "src" / "pet" / "sprites.js"
F = 32            # khung đầu ra 32x32
OX, OY = 0, 2     # vị trí đặt heo 32x32 trong khung

OUTLINE = (52, 34, 46, 255)
PINK = {
    (238, 195, 154): (247, 170, 160),
    (217, 160, 102): (222, 116, 120),
    (143, 86, 59): (52, 34, 46),
}
GOLD = {
    (238, 195, 154): (250, 204, 21),
    (217, 160, 102): (202, 138, 4),
    (143, 86, 59): (52, 34, 46),
}
COIN_MAP = {
    (255, 255, 0): (250, 204, 21),
    (255, 168, 0): (217, 119, 6),
    (128, 128, 0): (133, 77, 14),
    (128, 84, 0): (133, 77, 14),
    (255, 255, 255): (254, 243, 199),
    (128, 128, 128): (133, 77, 14),
}
COIN_GOLD, COIN_DARK = (250, 204, 21, 255), (133, 77, 14, 255)
RED, RED_D = (220, 38, 38, 255), (153, 27, 27, 255)
BLUSH = (244, 114, 182, 255)
TEAR = (56, 189, 248, 255)
WHITE = (255, 255, 255, 255)
SPARK = (254, 240, 138, 255)


# ---------- nạp nguồn ----------
def load_pig_frames():
    sheet = Image.open(SRC / "pig_look_32.png").convert("RGBA")
    return [sheet.crop((c * 32, r * 32, c * 32 + 32, r * 32 + 32)) for r in range(3) for c in range(3)]


def load_coin_frames():
    strip = Image.open(SRC / "coin_spin_9x10.png").convert("RGBA")
    frames = []
    for i in range(6):
        fr = strip.crop((i * 9, 0, i * 9 + 9, 10))
        px = fr.load()
        for y in range(10):
            for x in range(9):
                r, g, b, a = px[x, y]
                px[x, y] = (0, 0, 0, 0) if a < 100 else (*COIN_MAP.get((r, g, b), (r, g, b)), 255)
        frames.append(fr)
    return frames


# ---------- tiện ích pixel ----------
def recolor(img, mapping):
    out = img.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (*mapping.get((r, g, b), (r, g, b)), 255)
    return out


def add_outline(img, color=OUTLINE):
    """Viền ngoài 1px; điểm chạm mép khung thì tô viền vào trong để không bị cắt."""
    out = img.copy()
    src, dst = img.load(), out.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            if src[x, y][3]:
                if x in (0, w - 1) or y in (0, h - 1):
                    dst[x, y] = color
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and src[nx, ny][3]:
                    dst[x, y] = color
                    break
    return out


def silhouette(img, color):
    out = img.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            if px[x, y][3]:
                px[x, y] = color
    return out


def top_of(img, x):
    px = img.load()
    for y in range(img.height):
        if px[x, y][3]:
            return y
    return None


def head_box(pig):
    tops = [(x, top_of(pig, x)) for x in range(16, 32)]
    tops = [(x, t) for x, t in tops if t is not None]
    min_t = min(t for _, t in tops)
    ear_cols = [x for x, t in tops if t <= min_t + 1]
    return min(ear_cols), max(ear_cols), min_t


def put(px, x, y, c):
    if 0 <= x < F and 0 <= y < F:
        px[x, y] = c


def stamp(px, x0, y0, rows, colors):
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch in colors:
                put(px, x0 + i, y0 + j, colors[ch])


# ---------- phụ kiện ----------
def draw_slot_and_side_coin(canvas, pig, dy, gold_body):
    px = canvas.load()
    for x in range(11, 16):  # khe bỏ xu trên lưng
        t = top_of(pig, x)
        if t is not None:
            put(px, OX + x, OY + t + dy, OUTLINE)
    ring, mark = (COIN_DARK, (254, 243, 199, 255)) if gold_body else (COIN_GOLD, COIN_DARK)
    stamp(px, OX + 9, OY + 15 + dy,
          ["  ### ", " #$$$#", " #$## ", " #$$$#", "  ##$#", " #$$$#", "  ### "],
          {"#": ring, "$": mark})


def draw_crown(canvas, pig, dy, big):
    px = canvas.load()
    x0, x1, t = head_box(pig)
    rows = ["#  #  #", "## # ##", "#######", "#*###*#"] if big else ["# # #", "#####", "##*##"]
    cx = OX + (x0 + x1) // 2 - len(rows[0]) // 2
    cy = OY + t + dy - len(rows) - 1
    stamp(px, cx, cy, rows, {"#": COIN_GOLD, "*": RED})
    stamp(px, cx, cy + len(rows), ["#" * len(rows[0])], {"#": COIN_DARK})


def draw_bow(canvas, pig, dy):
    px = canvas.load()
    x0, _, t = head_box(pig)
    stamp(px, OX + x0 - 1, OY + t + dy + 9, ["#   #", "##o##", "#   #"], {"#": RED, "o": RED_D})


def draw_cape(canvas, pig, dy):
    px = canvas.load()
    for x in range(2, 11):
        t = top_of(pig, x)
        if t is None:
            continue
        for k in range(2 + (10 - x) // 3):
            put(px, OX + x, OY + t + dy + k, RED if k < 2 else RED_D)


def draw_blush(canvas, pig, dy):
    px = canvas.load()
    x0, _, t = head_box(pig)
    put(px, OX + x0 + 2, OY + t + dy + 8, BLUSH)
    put(px, OX + x0 + 3, OY + t + dy + 8, BLUSH)


def draw_tear(canvas, pig, dy, phase):
    px = canvas.load()
    x0, _, t = head_box(pig)
    x, y = OX + x0 + 4, OY + t + dy + 7 + phase
    for p in ((x, y), (x, y + 1), (x - 1, y + 1)):
        put(px, *p, TEAR)


def draw_sparkles(canvas, phase):
    px = canvas.load()
    for i, (x, y) in enumerate([(2, 2), (29, 3), (30, 15), (24, 1)]):
        if (i + phase) % 2 == 0:
            for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)):
                put(px, x + dx, y + dy, WHITE if not (dx or dy) else SPARK)


# ---------- dựng khung ----------
def compose(stage, pig_raw, *, dy=0, coin=None, coin_y=None, extras=(), flash=None, sad=False, phase=0):
    pig = recolor(pig_raw, GOLD if stage >= 4 else PINK)
    if sad:
        pig = recolor(pig, {(247, 170, 160): (226, 160, 160), (250, 204, 21): (214, 182, 80)})
    canvas = Image.new("RGBA", (F, F), (0, 0, 0, 0))
    canvas.alpha_composite(pig, (OX, OY + dy))
    draw_slot_and_side_coin(canvas, pig_raw, dy, stage >= 4)
    if stage >= 3:
        draw_cape(canvas, pig_raw, dy)
    if stage in (2, 3):
        draw_bow(canvas, pig_raw, dy)
    if stage >= 4:
        draw_crown(canvas, pig_raw, dy, big=stage == 5)
    for fn in extras:
        fn(canvas, pig_raw, dy)
    if coin is not None:
        y = OY + dy + (top_of(pig_raw, 13) or 10) - 9 if coin_y is None else coin_y
        canvas.alpha_composite(coin, (OX + 9, max(0, y)))
    canvas = add_outline(canvas)
    if flash:
        canvas = silhouette(canvas, flash)
    if stage == 5 and not flash:
        draw_sparkles(canvas, phase)
    return canvas


def build_stage(stage, L, coins):
    slot_top = OY + (top_of(L[0], 13) or 10)
    blush = (draw_blush,)
    frames = {
        "idle_1": compose(stage, L[0], coin=coins[0], phase=0),
        "idle_2": compose(stage, L[0], dy=1, coin=coins[0], phase=1),
        "idle_3": compose(stage, L[0], coin=coins[0], phase=0),
        "idle_4": compose(stage, L[5], coin=coins[0], phase=1),
        "eat_1": compose(stage, L[0], coin=coins[0], coin_y=slot_top - 14 + 4),
        "eat_2": compose(stage, L[0], coin=coins[1], coin_y=slot_top - 9),
        "eat_3": compose(stage, L[0], coin=coins[0], coin_y=slot_top - 6),
        "eat_4": compose(stage, L[5], dy=1, extras=blush),
        "sad_1": compose(stage, L[0], sad=True, extras=(lambda c, p, d: draw_tear(c, p, d, 0),)),
        "sad_2": compose(stage, L[0], dy=1, sad=True, extras=(lambda c, p, d: draw_tear(c, p, d, 1),)),
        "evolve_1": compose(stage, L[0], flash=WHITE),
        "evolve_2": compose(stage, L[5], dy=-1, flash=SPARK),
        "evolve_3": compose(stage, L[5], coin=coins[2], extras=blush, phase=1),
    }
    for i, (pi, d) in enumerate(((6, -2), (7, -2), (6, -1), (8, 0))):
        frames[f"happy_{i + 1}"] = compose(stage, L[pi], dy=d, coin=coins[(i + 1) % 6], extras=blush, phase=i)
    prefix = "" if stage == 1 else f"s{stage}_"
    return {prefix + k: v for k, v in frames.items()}


def to_data_uri(img):
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def main():
    OUT_PNG.mkdir(parents=True, exist_ok=True)
    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    pigs, coins = load_pig_frames(), load_coin_frames()

    sprites = {}
    for stage in range(1, 6):
        sprites.update(build_stage(stage, pigs, coins))
    for i, c in enumerate(coins):
        sprites[f"coin_{i + 1}"] = c

    for name, img in sprites.items():
        img.save(OUT_PNG / f"{name}.png")

    lines = [
        "// FILE SINH TỰ ĐỘNG bởi scripts/build_pet_sprites.py – không sửa tay.",
        "// Nguồn CC0: assets/pet-src/CREDITS.md",
        "export const SPRITES = {",
    ]
    lines += [f"  {name}: '{to_data_uri(img)}'," for name, img in sprites.items()]
    lines += ["};", ""]
    OUT_JS.write_text("\n".join(lines), encoding="utf-8")
    print(f"Đã sinh {len(sprites)} khung -> {OUT_PNG} và {OUT_JS}")


if __name__ == "__main__":
    main()
