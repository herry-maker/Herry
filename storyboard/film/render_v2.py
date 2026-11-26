"""Render the 3-minute animatic: 12 shots x 15 s, 1080x1920 @ 30 fps.
Frames are composed with PIL and piped to ffmpeg; audio is mixed separately."""
import sys, math, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS, SHOT = 1080, 1920, 30, 15.0
PANELS = sys.argv[1]            # dir with p01.jpg..p12.jpg
OUT = sys.argv[2]               # output mp4 (video only)
PREVIEW = len(sys.argv) > 3     # preview mode: save a few PNG frames, no video
import os
CLIPS = os.environ.get("CLIPS", "clips")   # dir with s01.mp4 .. s12.mp4 (optional per shot)
F = lambda p, s: ImageFont.truetype(p, s)
FB = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
FS = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
FM = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"
FX = "/usr/share/fonts/opentype/inter/InterDisplay-ExtraBold.otf"
FMONO = "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Regular.ttf"

RUST, TEAL, GOLD, CREAM = (163, 65, 42), (45, 106, 102), (216, 165, 58), (246, 239, 227)
SPK = {"Vidka": RUST, "Herry": TEAL, "Ardipal": (120, 84, 150)}

SCENES = [
 ("00:00", "00:15", "Medium shot", [("Vidka", "Lima bab selesai. Tinggal dijilid!"), ("Herry", "Mari baca sekali lagi.")]),
 ("00:15", "00:30", "Close-up", [("Ardipal", "Mengapa masalah baru muncul di halaman tujuh?")]),
 ("00:30", "00:45", "Top shot", [("Herry", "Apakah kesimpulan menjawab tujuan?")]),
 ("00:45", "01:00", "Over shoulder", [("Ardipal", "Apa hubungan antara sumber-sumber ini?")]),
 ("01:00", "01:15", "Close-up", [("Herry", "Apakah sesi yang berbeda justru terlewat?")]),
 ("01:15", "01:30", "Medium shot", [("Ardipal", "Satu pemain mewakili semuanya?")]),
 ("01:30", "01:45", "Over shoulder", [("Herry", "Pola apa yang perlu dilihat pembaca?")]),
 ("01:45", "02:00", "Top shot", [("Ardipal", "Apa yang dijelaskan oleh kejadian ini?")]),
 ("02:00", "02:15", "Close-up", [("Herry", "Apakah efektivitasnya sudah diuji?")]),
 ("02:15", "02:30", "Medium shot", [("Ardipal", "Apa maksudnya dalam kejadian nyata?")]),
 ("02:30", "02:45", "Close-up", [("Herry", "Bisakah pembaca menelusuri bukti ini?")]),
 ("02:45", "03:00", "Medium shot", [("Vidka", "Saya perbaiki hubungan antarbab dulu.")]),
]
# voice cue times per scene (seconds into the shot), filled from timeline.json by mix.py; here: line i starts at CUES[s][i]
import json
CUES = json.load(open("timeline.json"))["cues"]   # {"1": [[start,end],[start,end]], ...}

def ease(t):  # smoothstep
    t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)

def rounded_mask(size, r):
    m = Image.new("L", size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, size[0]-1, size[1]-1), r, fill=255); return m

def wrap(draw, text, font, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=font) <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

# ---------- static layers per shot ----------
FRAME_W = 1000; FRAME_X = (W - FRAME_W) // 2; FRAME_Y = 400
def build_static(i, img):
    # background: blurred, darkened panel filling the screen
    bg = img.resize((H, H), Image.LANCZOS).crop(((H - W)//2, 0, (H - W)//2 + W, H))
    bg = bg.filter(ImageFilter.GaussianBlur(38))
    bg = Image.blend(bg, Image.new("RGB", (W, H), (18, 14, 12)), 0.62)
    d = ImageDraw.Draw(bg)
    # header
    t0, t1, shot, lines = SCENES[i]
    d.text((60, 92), "SIDANG KECIL SEBELUM SIDANG", font=F(FX, 44), fill=CREAM)
    d.text((60, 150), "Film pendek edukatif · 3 menit", font=F(FM, 26), fill=(205, 192, 172))
    # scene chip
    chip = f"ADEGAN {i+1:02d}"
    cw = d.textlength(chip, font=F(FB, 26)) + 44
    d.rounded_rectangle((60, 232, 60 + cw, 232 + 54), 14, fill=RUST)
    d.text((82, 244), chip, font=F(FB, 26), fill="white")
    tc = f"{t0} – {t1}"
    tw = d.textlength(tc, font=F(FMONO, 26)) + 40
    d.rounded_rectangle((60 + cw + 14, 232, 60 + cw + 14 + tw, 286), 14, fill=(0, 0, 0, 120), outline=(90, 80, 70))
    d.text((60 + cw + 34, 246), tc, font=F(FMONO, 26), fill=(230, 220, 205))
    sw = d.textlength(shot.upper(), font=F(FS, 22)) + 36
    d.rounded_rectangle((W - 60 - sw, 238, W - 60, 282), 12, fill=(246, 239, 227))
    d.text((W - 60 - sw + 18, 248), shot.upper(), font=F(FS, 22), fill=(60, 50, 40))
    # soft shadow under the frame
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((FRAME_X + 6, FRAME_Y + 22, FRAME_X + FRAME_W + 6, FRAME_Y + FRAME_W + 22), 34, fill=(0, 0, 0, 170))
    sh = sh.filter(ImageFilter.GaussianBlur(28))
    bg = Image.alpha_composite(bg.convert("RGBA"), sh)
    return bg

def subtitle_layer(speaker, text, dim=False):
    """RGBA layer with the dialogue card."""
    L = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    font = F(FS, 46); lines = wrap(d, "“" + text + "”", font, FRAME_W - 120)
    lh = 60; card_h = 120 + lh * len(lines)
    y0 = FRAME_Y + FRAME_W + 70
    d.rounded_rectangle((FRAME_X, y0, FRAME_X + FRAME_W, y0 + card_h), 28, fill=(250, 245, 236, 235 if not dim else 140))
    col = SPK[speaker]
    d.rounded_rectangle((FRAME_X, y0, FRAME_X + 14, y0 + card_h), 7, fill=col)
    d.text((FRAME_X + 48, y0 + 34), speaker.upper(), font=F(FB, 28), fill=col)
    for k, ln in enumerate(lines):
        d.text((FRAME_X + 48, y0 + 84 + k * lh), ln, font=font, fill=(32, 26, 22))
    return L

def reflect_layer(i):
    L = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    y0 = FRAME_Y + FRAME_W + 70
    # label
    d.rounded_rectangle((FRAME_X, y0, FRAME_X + 250, y0 + 58), 29, fill=GOLD)
    d.text((FRAME_X + 30, y0 + 13), "✦  REFLEKSI", font=F(FB, 26), fill=(40, 30, 10))
    d.text((FRAME_X + 275, y0 + 14), "5 detik · jeda untuk berpikir", font=F(FM, 26), fill=(220, 208, 190))
    # the question, muted
    q = SCENES[i][3][-1][1]
    font = F(FM, 40); lines = wrap(d, q, font, FRAME_W)
    for k, ln in enumerate(lines):
        d.text((FRAME_X, y0 + 96 + k * 54), ln, font=font, fill=(236, 226, 210))
    return L

def title_layer():
    L = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    d.rectangle((0, 0, W, H), fill=(14, 11, 9, 235))
    d.text((W/2, 760), "Film Pendek Edukatif", font=F(FM, 40), fill=(205, 192, 172), anchor="mm")
    d.text((W/2, 880), "SIDANG KECIL", font=F(FX, 112), fill=CREAM, anchor="mm")
    d.text((W/2, 1000), "SEBELUM SIDANG", font=F(FX, 112), fill=GOLD, anchor="mm")
    d.text((W/2, 1120), "12 adegan × 15 detik  ·  dialog + refleksi", font=F(FM, 34), fill=(205, 192, 172), anchor="mm")
    return L

def end_layer():
    L = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    d.rectangle((0, 0, W, H), fill=(14, 11, 9, 225))
    d.text((W/2, 800), "TUGAS", font=F(FB, 36), fill=GOLD, anchor="mm")
    for k, ln in enumerate(["Temukan satu bagian", "yang belum selaras.", "Tulis perbaikan", "dan alasannya."]):
        d.text((W/2, 900 + k * 78), ln, font=F(FS, 56), fill=CREAM, anchor="mm")
    d.text((W/2, 1300), "Vidka · Herry · Ardipal", font=F(FM, 30), fill=(205, 192, 172), anchor="mm")
    return L

def alpha_scale(layer, a):
    if a >= 0.999: return layer
    r, g, b, al = layer.split(); al = al.point(lambda v: int(v * a)); return Image.merge("RGBA", (r, g, b, al))

def clip_reader(path):
    """Yield 1000x1000 RGB frames at 30 fps from a clip; holds the last frame after it ends."""
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-vf", f"fps={FPS},scale={FRAME_W}:{FRAME_W}:force_original_aspect_ratio=increase,crop={FRAME_W}:{FRAME_W}",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n = FRAME_W * FRAME_W * 3; last = None
    while True:
        buf = p.stdout.read(n) if p.stdout else b""
        if len(buf) < n:
            if p.stdout: p.stdout.close(); p.wait(); p.stdout = None
            yield last
        else:
            last = Image.frombytes("RGB", (FRAME_W, FRAME_W), buf); yield last

# ---------- render ----------
ff = None if PREVIEW else subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                       "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)
mask = rounded_mask((FRAME_W, FRAME_W), 34)
TITLE, END = title_layer(), end_layer()
total = 0
for i in ([0, 5, 11] if PREVIEW else range(12)):
    src = Image.open(f"{PANELS}/p{i+1:02d}.jpg").convert("RGB")
    big = src.resize((2200, 2200), Image.LANCZOS)         # oversampled source for smooth Ken Burns
    static = build_static(i, src)
    subs = [subtitle_layer(s, t) for s, t in SCENES[i][3]]
    refl = reflect_layer(i)
    cues = CUES[str(i + 1)]
    zin = (i % 2 == 0)  # alternate zoom-in / zoom-out
    # pan direction varies per shot
    px, py = [(0.0, 0.0), (0.5, -0.3), (-0.4, 0.4), (0.3, 0.3), (-0.5, 0.0), (0.0, 0.5)][i % 6]
    nfr = int(SHOT * FPS)
    clip_path = f"{CLIPS}/s{i+1:02d}.mp4"; rdr = clip_reader(clip_path) if os.path.exists(clip_path) else None
    delay = cues[0][0] if rdr else 0.0
    first = next(rdr) if rdr else None
    started = False
    if rdr: print(f"shot {i+1}: using clip, starts at {delay}s", flush=True)
    for f in ([0, 45, 120, 330, 420] if PREVIEW else range(nfr)):
        t = f / FPS; u = ease(t / SHOT)
        if rdr and PREVIEW:
            # preview mode skips frames; advance the reader to frame f
            while getattr(rdr, "_pos", 0) < f: next(rdr); rdr._pos = getattr(rdr, "_pos", 0) + 1
        z = (1.0 + 0.14 * u) if zin else (1.14 - 0.14 * u)
        cw = 2200 / z
        cx = 1100 + px * (2200 - cw) * 0.5 * (u if zin else 1 - u)
        cy = 1100 + py * (2200 - cw) * 0.5 * (u if zin else 1 - u)
        box = (int(cx - cw/2), int(cy - cw/2), int(cx + cw/2), int(cy + cw/2))
        if rdr:
            if t < delay: crop = first
            elif not started: crop = first; started = True
            else: crop = next(rdr)
            # after the clip ends (10 s), a slow Ken Burns on the held last frame keeps the reflection beat alive
            if t > delay + 10.0:
                zz = 1.0 + 0.04 * ease((t - delay - 10.0) / 4.0); cw2 = FRAME_W / zz; c0 = (FRAME_W - cw2) / 2
                crop = crop.crop((int(c0), int(c0), int(c0 + cw2), int(c0 + cw2))).resize((FRAME_W, FRAME_W), Image.BILINEAR)
        else:
            crop = big.crop(box).resize((FRAME_W, FRAME_W), Image.BILINEAR)
        frame = static.copy()
        # reflection: gently dim the picture
        if t >= 10.0:
            dimf = ease((t - 10.0) / 0.8) * 0.28
            crop = Image.blend(crop, Image.new("RGB", crop.size, (10, 8, 6)), dimf)
        frame.paste(crop, (FRAME_X, FRAME_Y), mask)
        # dialogue cards
        for k, (st, en) in enumerate(cues):
            a = 0.0
            nxt = cues[k + 1][0] - 0.35 if k + 1 < len(cues) else 9.5
            if st - 0.35 <= t < 10.0:
                a = ease((t - (st - 0.35)) / 0.35) * (1 - ease((t - nxt) / 0.4))
            if a > 0.01: frame = Image.alpha_composite(frame, alpha_scale(subs[k], a))
        if t >= 10.0 and not (i == 11 and t > 10.4):
            a = ease((t - 10.0) / 0.6) * (1 - ease((t - 14.6) / 0.4))
            frame = Image.alpha_composite(frame, alpha_scale(refl, a))
        # title over the first 3.2 s, end card over the last 4.5 s
        if i == 0 and t < 3.4:
            frame = Image.alpha_composite(frame, alpha_scale(TITLE, 1 - ease((t - 2.6) / 0.8)))
        if i == 11 and t > 10.4:
            frame = Image.alpha_composite(frame, alpha_scale(END, ease((t - 10.4) / 0.8)))
        # dip between shots
        if f < 10 and i > 0: frame = Image.blend(frame, Image.new("RGBA", (W, H), (0, 0, 0, 255)), 1 - f / 10)
        if f >= nfr - 10 and i < 11: frame = Image.blend(frame, Image.new("RGBA", (W, H), (0, 0, 0, 255)), (f - (nfr - 10)) / 10)
        if PREVIEW: frame.convert("RGB").save(f"{sys.argv[3]}/s{i+1:02d}_f{f:04d}.jpg", quality=90); continue
        ff.stdin.write(frame.convert("RGB").tobytes()); total += 1
    print(f"shot {i+1} done ({total} frames)", flush=True)
if not PREVIEW: ff.stdin.close(); ff.wait()
print("video done", total, "frames")
