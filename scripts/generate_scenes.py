"""
Generate atmospheric composite images for each Bushido bottle.
Each bottle gets a unique scene matching its character.
"""
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance
import os, math, random

random.seed(42)
np.random.seed(42)

OUT_DIR = "public/images/bushido/scenes"
os.makedirs(OUT_DIR, exist_ok=True)

W, H = 1800, 2400  # Portrait orientation for bottle showcase


def make_gradient(w, h, colors, direction="vertical"):
    """Create smooth multi-stop gradient."""
    arr = np.zeros((h, w, 3), dtype=np.float64)
    n = len(colors)
    for y in range(h):
        t = y / h if direction == "vertical" else 0
        seg = t * (n - 1)
        i = min(int(seg), n - 2)
        f = seg - i
        c = np.array(colors[i]) * (1 - f) + np.array(colors[i + 1]) * f
        arr[y, :] = c
    return Image.fromarray(arr.astype(np.uint8))


def add_fog(img, intensity=0.3, scale=80):
    """Add atmospheric fog/mist."""
    w, h = img.size
    noise = np.random.rand(h // scale, w // scale) * 255
    noise_img = Image.fromarray(noise.astype(np.uint8)).resize((w, h), Image.BILINEAR)
    noise_img = noise_img.filter(ImageFilter.GaussianBlur(radius=scale))
    noise_img = noise_img.convert("L")
    fog = Image.new("RGB", (w, h), (220, 225, 230))
    result = Image.composite(fog, img, noise_img.point(lambda x: int(x * intensity)))
    return result


def add_water_reflection(img, bottle, bottle_pos, alpha=0.3):
    """Add subtle water reflection below the bottle."""
    w, h = img.size
    bx, by = bottle_pos
    bw, bh = bottle.size

    reflection = bottle.transpose(Image.FLIP_TOP_BOTTOM)
    reflection = ImageEnhance.Brightness(reflection).enhance(0.4)

    r_arr = np.array(reflection).astype(np.float64)
    for y in range(r_arr.shape[0]):
        fade = max(0, 1.0 - (y / r_arr.shape[0]) * 2.5)
        r_arr[y, :, 3] = r_arr[y, :, 3] * fade * alpha

    reflection = Image.fromarray(r_arr.astype(np.uint8))
    reflection = reflection.filter(ImageFilter.GaussianBlur(radius=3))

    ref_y = by + bh - 20
    if ref_y + reflection.size[1] > h:
        reflection = reflection.crop((0, 0, reflection.size[0], h - ref_y))

    img.paste(reflection, (bx, ref_y), reflection)
    return img


def add_particles(img, count=60, color=(201, 168, 76), spread=0.6):
    """Add floating particles."""
    w, h = img.size
    cx = w // 2
    for _ in range(count):
        x = cx + int((random.random() - 0.5) * w * spread)
        y = int(random.random() * h)
        size = random.uniform(0.5, 2.5)
        alpha = random.randint(30, 140)
        c = (*color, alpha)
        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(overlay)
        d.ellipse([x, y, x + size, y + size], fill=c)
        overlay = overlay.filter(ImageFilter.GaussianBlur(radius=0.8))
        img = Image.alpha_composite(img, overlay)
    return img


def add_light_rays(img, origin=(0.5, 0.15), intensity=0.12, count=8):
    """Add volumetric light rays."""
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    ox, oy = int(origin[0] * w), int(origin[1] * h)

    for _ in range(count):
        angle = math.radians(random.uniform(-30, 30) + 90)
        length = random.uniform(h * 0.5, h * 0.9)
        width = random.uniform(30, 80)
        ex = ox + int(math.cos(angle) * length)
        ey = oy + int(math.sin(angle) * length)

        a = int(255 * intensity * random.uniform(0.5, 1.0))
        points = [
            (ox - width // 4, oy),
            (ox + width // 4, oy),
            (ex + width, ey),
            (ex - width, ey),
        ]
        draw.polygon(points, fill=(255, 245, 220, a))

    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=40))
    img = Image.alpha_composite(img, overlay)
    return img


def composite_bottle(bg, bottle_path, scale=0.55, y_offset=-0.05):
    """Composite transparent bottle onto background."""
    bg = bg.convert("RGBA")
    bottle = Image.open(bottle_path).convert("RGBA")

    bw = int(bg.size[0] * scale)
    bh = int(bottle.size[1] * (bw / bottle.size[0]))
    bottle = bottle.resize((bw, bh), Image.LANCZOS)

    x = (bg.size[0] - bw) // 2
    y = int((bg.size[1] - bh) // 2 + bg.size[1] * y_offset)

    bg = add_water_reflection(bg, bottle, (x, y), alpha=0.25)
    bg.paste(bottle, (x, y), bottle)

    return bg, (x, y, bw, bh)


# ============================
# Scene A: White Peak - Snowy mountain dawn with mist
# ============================
print("Creating Scene A: White Peak - Misty mountain dawn...")
bg = make_gradient(W, H, [
    (45, 55, 75), (80, 95, 120), (140, 155, 175),
    (180, 190, 200), (120, 130, 145), (60, 65, 80),
])
bg = add_fog(bg, intensity=0.25, scale=60)
bg = bg.convert("RGBA")
bg = add_light_rays(bg, origin=(0.3, 0.05), intensity=0.08, count=5)
bg = add_particles(bg, count=80, color=(220, 225, 235), spread=0.8)
bg, _ = composite_bottle(bg, "public/images/bushido/junmai_daiginjo_01.png", scale=0.50)
bg = add_particles(bg, count=30, color=(201, 168, 76), spread=0.4)
bg.convert("RGB").save(f"{OUT_DIR}/a_white_peak.jpg", "JPEG", quality=92)
print("  Done")

# ============================
# Scene B: Ninja Veil - Moonlit forest with blue mist
# ============================
print("Creating Scene B: Ninja Veil - Moonlit forest...")
bg = make_gradient(W, H, [
    (8, 12, 28), (15, 25, 55), (20, 40, 75),
    (30, 55, 85), (15, 30, 55), (5, 10, 25),
])
bg = add_fog(bg, intensity=0.18, scale=50)
bg = bg.convert("RGBA")
moon = Image.new("RGBA", (W, H), (0, 0, 0, 0))
md = ImageDraw.Draw(moon)
md.ellipse([W // 2 - 60, 120, W // 2 + 60, 240], fill=(220, 230, 245, 60))
moon = moon.filter(ImageFilter.GaussianBlur(radius=40))
bg = Image.alpha_composite(bg, moon)
bg = add_light_rays(bg, origin=(0.5, 0.07), intensity=0.06, count=4)
bg = add_particles(bg, count=50, color=(150, 180, 220), spread=0.7)
bg, _ = composite_bottle(bg, "public/images/bushido/junmai_ginjo_02.png", scale=0.50)
bg = add_particles(bg, count=25, color=(201, 168, 76), spread=0.3)
bg.convert("RGB").save(f"{OUT_DIR}/b_ninja_veil.jpg", "JPEG", quality=92)
print("  Done")

# ============================
# Scene C: White Dominion - Blizzard command
# ============================
print("Creating Scene C: White Dominion - Blizzard realm...")
bg = make_gradient(W, H, [
    (85, 90, 100), (130, 140, 155), (175, 185, 200),
    (200, 210, 220), (160, 170, 185), (100, 110, 125),
])
bg = add_fog(bg, intensity=0.35, scale=40)
bg = bg.convert("RGBA")
bg = add_light_rays(bg, origin=(0.6, 0.0), intensity=0.10, count=6)
bg = add_particles(bg, count=120, color=(240, 245, 255), spread=0.9)
bg, _ = composite_bottle(bg, "public/images/bushido/junmai_ginjo_01.png", scale=0.50)
bg = add_particles(bg, count=20, color=(200, 160, 60), spread=0.3)
bg.convert("RGB").save(f"{OUT_DIR}/c_white_dominion.jpg", "JPEG", quality=92)
print("  Done")

# ============================
# Scene D: Fuji Noir - Dark cinematic with crimson accent
# ============================
print("Creating Scene D: Fuji Noir - Noir cinematic...")
bg = make_gradient(W, H, [
    (10, 8, 12), (20, 15, 22), (35, 25, 35),
    (25, 20, 28), (15, 12, 18), (8, 5, 10),
])
bg = add_fog(bg, intensity=0.10, scale=70)
bg = bg.convert("RGBA")
crimson = Image.new("RGBA", (W, H), (0, 0, 0, 0))
cd = ImageDraw.Draw(crimson)
cd.ellipse([W // 2 - 200, 200, W // 2 + 200, 600], fill=(139, 26, 26, 25))
crimson = crimson.filter(ImageFilter.GaussianBlur(radius=100))
bg = Image.alpha_composite(bg, crimson)
bg = add_particles(bg, count=40, color=(139, 60, 60), spread=0.5)
bg, _ = composite_bottle(bg, "public/images/bushido/honjozo_01.png", scale=0.50)
bg = add_particles(bg, count=30, color=(201, 168, 76), spread=0.35)
bg.convert("RGB").save(f"{OUT_DIR}/d_fuji_noir.jpg", "JPEG", quality=92)
print("  Done")

# ============================
# Scene E: Fuji Koku - Sumi-e ink wash atmosphere
# ============================
print("Creating Scene E: Fuji Koku - Ink wash atmosphere...")
bg = make_gradient(W, H, [
    (35, 35, 38), (65, 65, 68), (110, 110, 115),
    (160, 160, 165), (100, 100, 105), (40, 40, 45),
])
bg = add_fog(bg, intensity=0.20, scale=55)
bg = bg.convert("RGBA")
ink = Image.new("RGBA", (W, H), (0, 0, 0, 0))
for _ in range(15):
    ix = random.randint(0, W)
    iy = random.randint(0, H)
    ir = random.randint(50, 200)
    id2 = ImageDraw.Draw(ink)
    id2.ellipse([ix - ir, iy - ir, ix + ir, iy + ir], fill=(20, 20, 25, random.randint(8, 25)))
ink = ink.filter(ImageFilter.GaussianBlur(radius=60))
bg = Image.alpha_composite(bg, ink)
bg, _ = composite_bottle(bg, "public/images/bushido/junmai_daiginjo_01.png", scale=0.50)
bg = add_particles(bg, count=25, color=(180, 175, 170), spread=0.5)
bg.convert("RGB").save(f"{OUT_DIR}/e_fuji_koku.jpg", "JPEG", quality=92)
print("  Done")

# ============================
# Scene F: Silver Night - Starry lake reflection
# ============================
print("Creating Scene F: Silver Night - Starry lake...")
bg = make_gradient(W, H, [
    (5, 8, 20), (10, 18, 40), (18, 30, 60),
    (25, 40, 70), (15, 25, 50), (5, 10, 25),
])
bg = add_fog(bg, intensity=0.12, scale=60)
bg = bg.convert("RGBA")
stars = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(stars)
for _ in range(200):
    sx = random.randint(0, W)
    sy = random.randint(0, int(H * 0.5))
    ss = random.uniform(0.5, 2)
    sa = random.randint(60, 220)
    sd.ellipse([sx, sy, sx + ss, sy + ss], fill=(220, 225, 240, sa))
stars = stars.filter(ImageFilter.GaussianBlur(radius=0.5))
bg = Image.alpha_composite(bg, stars)
moon_f = Image.new("RGBA", (W, H), (0, 0, 0, 0))
mfd = ImageDraw.Draw(moon_f)
mfd.ellipse([W // 2 - 80, 150, W // 2 + 80, 310], fill=(180, 50, 50, 40))
moon_f = moon_f.filter(ImageFilter.GaussianBlur(radius=50))
bg = Image.alpha_composite(bg, moon_f)
bg, _ = composite_bottle(bg, "public/images/bushido/honjozo_02.png", scale=0.50)
bg = add_particles(bg, count=35, color=(168, 164, 156), spread=0.5)
bg.convert("RGB").save(f"{OUT_DIR}/f_silver_night.jpg", "JPEG", quality=92)
print("  Done")

# ============================
# Scene G: Black Snow - Obsidian night with falling snow
# ============================
print("Creating Scene G: Black Snow - Obsidian night...")
bg = make_gradient(W, H, [
    (5, 5, 8), (10, 10, 15), (18, 18, 22),
    (12, 12, 16), (8, 8, 12), (3, 3, 5),
])
bg = add_fog(bg, intensity=0.08, scale=80)
bg = bg.convert("RGBA")
crim_g = Image.new("RGBA", (W, H), (0, 0, 0, 0))
cgd = ImageDraw.Draw(crim_g)
cgd.ellipse([W // 2 - 150, 100, W // 2 + 150, 400], fill=(160, 30, 30, 20))
crim_g = crim_g.filter(ImageFilter.GaussianBlur(radius=80))
bg = Image.alpha_composite(bg, crim_g)
bg = add_particles(bg, count=150, color=(230, 235, 245), spread=0.95)
bg, _ = composite_bottle(bg, "public/images/bushido/junmai_daiginjo_02.png", scale=0.50)
bg = add_particles(bg, count=50, color=(240, 245, 255), spread=0.8)
bg.convert("RGB").save(f"{OUT_DIR}/g_black_snow.jpg", "JPEG", quality=92)
print("  Done")

print(f"\nAll 7 scenes created in {OUT_DIR}/")
for f in sorted(os.listdir(OUT_DIR)):
    fpath = os.path.join(OUT_DIR, f)
    print(f"  {f}: {os.path.getsize(fpath) // 1024}KB")
