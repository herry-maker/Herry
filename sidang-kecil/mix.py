"""Sound for «Sidang Kecil Sebelum Sidang»: three Indonesian voices + a synthesised score in the style's palette + procedural foley.

Everything is synthesised with numpy (no sample libraries): kalimba, celesta, marimba, glockenspiel, vibraphone, soft strings.
Reads timeline.json (lines, scenes, cards) and events.json (exported by core/render/events.mjs). Writes out/mix.wav (48 kHz stereo).
Mix rules (STYLE.md §7): voice compressed, ≈10 dB (RMS) above the music; the music gives way 300 Hz–4 kHz and ducks under each line;
music stops dead at every question card (room tone only); two real silences (scene 3 after the let-go, scene 12 before Vidka's last line).
"""
import json, os, sys
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
sys.path.insert(0, LIB)
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, clack, whoosh, pop, thump, noise, env_exp, t_, norm
import soxr

TL = json.load(open(os.path.join(HERE, 'timeline.json'), encoding='utf-8'))
EV = json.load(open(os.path.join(HERE, 'events.json'), encoding='utf-8'))['ev']
DUR = TL['dur']; N = int(DUR * SR) + SR
SCENES = {s['n']: s for s in TL['scenes']}
LINES = {l['id']: l for l in TL['lines']}
B = {e['type']: e for e in EV}        # last of each type (not used for timing; events are iterated)
rng = np.random.default_rng(3)

# ================= instruments (mono float32 @ SR) =================
def midi(n): return 440.0 * 2 ** ((n - 69) / 12)
def tone(f, d, partials, decay, attack=.002, inharm=0.0):
    tt = t_(d); x = np.zeros_like(tt)
    for k, (ratio, amp, tau) in enumerate(partials):
        x += amp * np.sin(2 * np.pi * f * ratio * (1 + inharm * k) * tt) * np.exp(-tt / (tau * decay))
    x *= np.minimum(1, tt / attack)
    return x.astype(np.float32)
def kalimba(n, v=1.0):   # bright pluck, short, a little tine click
    f = midi(n); x = tone(f, 1.6, [(1, 1, .35), (2.02, .35, .12), (5.4, .18, .05), (8.9, .08, .03)], 1.0, .001)
    x[:int(.012 * SR)] += hp(noise(.012), 3000) * env_exp(.012, .003) * .25
    return norm(x) * .5 * v
def celesta(n, v=1.0):
    f = midi(n); return norm(tone(f, 2.2, [(1, 1, .9), (4, .25, .4), (10, .06, .15)], 1.0, .002)) * .42 * v
def marimba(n, v=1.0):
    f = midi(n); return norm(tone(f, 1.1, [(1, 1, .22), (4, .45, .08), (10, .12, .04)], 1.0, .002)) * .55 * v
def glock(n, v=1.0):
    f = midi(n); return norm(tone(f, 2.4, [(1, 1, 1.0), (2.76, .3, .5), (5.4, .12, .25)], 1.0, .001)) * .4 * v
def vibes(n, d=4.0, v=1.0):
    f = midi(n); tt = t_(d); x = tone(f, d, [(1, 1, 1.6), (4, .18, .7), (9.9, .04, .3)], 1.0, .004)
    x *= (1 - .25 * (.5 + .5 * np.sin(2 * np.pi * 5.2 * tt)))
    return norm(x) * .45 * v
def strings(n, d=6.0, v=1.0):   # soft bowed pad: detuned saws, low-passed, slow attack
    f = midi(n); tt = t_(d); x = np.zeros_like(tt)
    for det in (-.004, 0, .005):
        ph = (tt * f * (1 + det)) % 1.0; x += (2 * ph - 1)
    x = lp(x, 1800, 2) * np.minimum(1, tt / 1.2) * np.minimum(1, np.maximum(0, (d - tt) / 1.5))
    return norm(x).astype(np.float32) * .22 * v

# ================= buses =================
music = np.zeros((N, 2), np.float32); foley = np.zeros((N, 2), np.float32); amb = np.zeros((N, 2), np.float32)
def putM(x, t, g=1.0, pan=0.0): add(music, x, t, g, pan)
def putF(x, t, g=1.0, pan=0.0): add(foley, x, t, g, pan)

# ---- room tone: a very quiet low rumble + faint air, the whole film, so the pauses are never digital silence ----
rt = lp(noise(DUR + 1), 240, 2) * .5 + hp(lp(noise(DUR + 1), 6000), 2500) * .06
rt = norm(rt) * .012
amb[:len(rt), 0] += rt; amb[:len(rt), 1] += np.roll(rt, 311)

# ================= score (72 BPM; one beat = 0.8333 s) =================
BEAT = 60 / 72
MOTIF = [62, 66, 69, 71]          # D4 F#4 A4 B4
MOTIF_INV = [71, 69, 66, 62]
def quiet_windows():
    """time ranges with NO music: every question card to the next cut; scene 3 from the let-go; scene 12 before the last line"""
    w = []
    for s in TL['scenes']: w.append((s['card'] - .05, s['t1'] + .05))
    lg = [e['t'] for e in EV if e['type'] == 'letgo']
    if lg: w.append((lg[0] - .02, SCENES[3]['t1']))
    w.append((LINES['s12c']['t'] + LINES['s12c']['d'] + .2, LINES['s12d']['t'] + LINES['s12d']['d'] + 1.0))
    return w
QW = quiet_windows()
def is_quiet(t): return any(a <= t < b for a, b in QW)

# the motif: one kalimba note every two beats while people talk, cycling; scenes 7–11 play it inverted
for s in TL['scenes']:
    mot = MOTIF if s['n'] <= 6 else MOTIF_INV
    k = 0; t = s['t0'] + BEAT * .5
    while t < s['card'] - .3:
        if not is_quiet(t):
            n = mot[k % 4] + (12 if (k // 4) % 2 == 1 and s['n'] in (1, 12) else 0)
            putM(kalimba(n, .55 + .1 * ((k % 4) == 0)), t, .9, -.15 + .1 * (k % 3))
            if s['n'] in (1, 12) and k % 4 == 0: putM(celesta(n + 12, .35), t + BEAT, .6, .25)
        k += 1; t += 2 * BEAT
# the opening: a celesta chord as the title lands, a pizzicato-like marimba bass on the first downbeat
putM(celesta(74, .5), .35, .8, -.1); putM(celesta(78, .4), .42, .7, .1); putM(celesta(81, .35), .5, .6, .25)
putM(marimba(50, .6), .35, .7, 0)

for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'letgo':      # a link gives way: one low marimba note, then a lower one
        putM(marimba(50, .9), t, 1, -.2); putM(marimba(45, .7), t + .18, .9, -.25)
    if ty == 'clasp':      # a link made: two celesta notes rising
        putM(celesta(81, .6), t, .9, -.1); putM(celesta(86, .55), t + .14, .9, 0)
    if ty == 'pencil':     # a repair written: a soft celesta third when the pen finishes
        putM(celesta(78, .35), t + e.get('d', .6), .7, -.1); putM(celesta(81, .3), t + e.get('d', .6) + .12, .6, 0)
    if ty == 'node':       # the accent reaches a chapter: glockenspiel, climbing
        seq = [74, 78, 81, 83, 86]; k = int(e.get('k', 1)) - 1
        putM(glock(seq[min(k, 4)], .6), t, 1, -.4 + .2 * k)
    if ty == 'arrive':     # Bab V is reached: the top note and the closing chord, vibraphone + soft strings, held under the task card
        putM(glock(86, .8), t, 1, .35)
        for n, v in ((50, .5), (62, .6), (66, .5), (69, .5), (74, .4)): putM(vibes(n, 7.0, v), t + .05, 1, (n - 66) / 40)
        for n in (50, 57, 62, 66): putM(strings(n, 8.5, .5), t + .3, 1, (n - 58) / 40)
    if ty == 'pullback' and SCENES[6]['t0'] <= t < SCENES[6]['t1']:   # scene 6, the turn: an open minor chord on vibraphone, then nothing
        for n, v in ((62, .6), (65, .5), (69, .45)): putM(vibes(n, 5.0, v), t + .1, 1, (n - 65) / 30)

# ================= foley (every visible action has a sound) =================
def paper(d=.22, v=1.0):
    x = bp(noise(d), 900, 5200) * np.sin(np.pi * t_(d) / d) ** 1.5; return norm(x) * .5 * v
def pencil(d=.8, v=1.0):
    tt = t_(d); x = bp(noise(d), 1800, 6000) * (.55 + .45 * np.abs(np.sin(2 * np.pi * 7.3 * tt + np.sin(tt * 19)))) * np.minimum(1, tt / .05) * np.minimum(1, np.maximum(0, (d - tt) / .08))
    return norm(x) * .3 * v
def tick(v=1.0):
    d = .05; tt = t_(d); x = np.sin(2 * np.pi * 2400 * tt) * env_exp(d, .006) + hp(noise(d), 4000) * env_exp(d, .002) * .5; return norm(x) * .35 * v
def breath(v=1.0):
    d = .3; x = bp(noise(d), 300, 1500) * np.sin(np.pi * t_(d) / d) ** 2; return norm(x) * .18 * v
def tapsoft(v=1.0):
    d = .12; tt = t_(d); x = np.sin(2 * np.pi * 160 * tt) * env_exp(d, .02) + lp(noise(d), 900) * env_exp(d, .01) * .6; return norm(x) * .5 * v
def scrape(d=.6, v=1.0):
    tt = t_(d); x = bp(noise(d), 180, 900) * np.sin(np.pi * tt / d) ** .7 * (1 + .3 * np.sin(2 * np.pi * 11 * tt)); return norm(x) * .35 * v
def sweep(d=1.0, v=1.0):
    return whoosh(d) * .35 * v
for e in EV:
    t, ty, d = e['t'], e['type'], e.get('d', .5)
    if ty == 'cut': putF(paper(.16, .5), t, .6, 0)
    elif ty == 'card': putF(tick(.8), t, .7, -.5)
    elif ty == 'title': putF(paper(.3, .3), t, .4, -.3)
    elif ty == 'paper': putF(paper(min(.6, max(.22, d)), .8), t, .8, 0)
    elif ty == 'tap': putF(tapsoft(), t, .9, -.1)
    elif ty == 'chair': putF(scrape(d, 1), t, .7, .1)
    elif ty == 'trace': putF(bp(noise(d), 700, 3000) * .5 * np.sin(np.pi * t_(d) / d) ** .5 * .12, t, .6, .35)
    elif ty == 'flip': putF(paper(.2, .9), t, .9, .3)
    elif ty == 'tick': putF(tick(), t, .8, .3)
    elif ty == 'pencil': putF(pencil(d), t, .9, -.2)
    elif ty == 'strike': putF(pencil(.25, 1.2), t, .9, -.2)
    elif ty in ('pullback', 'pushin', 'track'): putF(sweep(d, .6), t, .5, 0)
    elif ty == 'letgo': putF(clack(.6, .5), t, .5, -.2)
    elif ty == 'reach': putF(breath(), t, .7, -.3)
    elif ty == 'clasp': putF(pop(.8), t, .8, -.2); putF(tapsoft(.6), t + .005, .5, -.2)
    elif ty == 'pulse':
        x = sweep(d, .7); n = len(x); L = np.linspace(1, 0, n); R = 1 - L
        s0 = int(t * SR); e0 = min(N, s0 + n); foley[s0:e0, 0] += x[:e0 - s0] * L[:e0 - s0] * .45; foley[s0:e0, 1] += x[:e0 - s0] * R[:e0 - s0] * .45
    elif ty == 'hit': putF(thump(.7, 60), t, .6, 0)
    elif ty == 'book': putF(tapsoft(1.1), t, .8, .4); putF(paper(.3, .6), t + .04, .6, .4)
    elif ty == 'folder': putF(clack(.8, .6), t, .6, -.3); putF(paper(.25, .5), t, .5, -.3)

# ================= voice =================
voice = np.zeros((N, 2), np.float32); vmask = np.zeros(N, np.float32)
PAN = {'V': -.18, 'H': .04, 'A': .2}
for l in TL['lines']:
    x, sr = sf.read(os.path.join(HERE, 'voice', l['id'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = soxr.resample(x, sr, SR)
    x = compress(x / (np.abs(x).max() + 1e-9) * .8, thr=.25, ratio=3.0, att=.003, rel=.12)
    x = hp(x, 80)
    s = int(l['t'] * SR); e_ = min(N, s + len(x)); seg = x[:e_ - s]
    p = PAN[l['who']]; gl, gr = np.sqrt(.5 * (1 - p)), np.sqrt(.5 * (1 + p))
    voice[s:e_, 0] += seg * gl * 1.4; voice[s:e_, 1] += seg * gr * 1.4; vmask[s:e_] = 1

# ================= bus, ducking, balance =================
bus = music + foley
k = int(.25 * SR); duck = np.convolve(vmask, np.ones(k) / k, 'same')
dip = np.stack([bp(bus[:, 0], 300, 4000), bp(bus[:, 1], 300, 4000)], 1)
bus = bus - dip * (.3 + .3 * duck[:, None])
bus = bus * (1 - .32 * duck[:, None])
if vmask.sum() > 0:
    rv = np.sqrt(np.mean(voice[vmask > 0] ** 2)); rm = np.sqrt(np.mean((music + foley)[vmask > 0] ** 2)) + 1e-9
    g = min(1.0 / (np.abs(voice).max() + 1e-9) * .8, 1.6)    # voice up to a safe peak …
    voice *= g; rv *= g
    want = rv / 10 ** (10 / 20)                                # … and the music + foley bus down to 10 dB under it
    bal = want / rm if rm > want else 1.0
    bus *= bal
bus = bus + amb
mix = bus + voice
mix = np.stack([compress(mix[:, 0], thr=.35, ratio=2.2), compress(mix[:, 1], thr=.35, ratio=2.2)], 1)
mix = np.stack([limit(mix[:, 0], .9), limit(mix[:, 1], .9)], 1)
mix = mix[:int(DUR * SR)]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix, SR, subtype='FLOAT')
spk = vmask[:len(mix)] > 0
print('mix.wav %.1f s  peak %.2f' % (len(mix) / SR, np.abs(mix).max()))
print('voice over music+foley (RMS, while speaking): %.1f dB  (bus scaled by %.2f)' % (20 * np.log10(np.sqrt(np.mean(voice[:len(mix)][spk] ** 2)) / (np.sqrt(np.mean(((music + foley) * bal)[:len(mix)][spk] ** 2)) + 1e-9)), bal))
