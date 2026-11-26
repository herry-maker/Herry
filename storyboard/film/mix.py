"""Build timeline.json (voice cue times) and the final 48 kHz stereo mix: voice + synthesized pad + reflection chime."""
import json, wave, math, numpy as np
SR, SHOT, N = 48000, 15.0, 12
VOICE = {1: ["01a", "01b"], 2: ["02"], 3: ["03"], 4: ["04"], 5: ["05"], 6: ["06"], 7: ["07"], 8: ["08"], 9: ["09"], 10: ["10"], 11: ["11"], 12: ["12"]}
def rd(p):
    w = wave.open(p); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    assert w.getframerate() == SR and w.getnchannels() == 1; return a
total = int(N * SHOT * SR)
voice = np.zeros(total, np.float32); cues = {}
for s in range(1, N + 1):
    t = 1.0 if s != 1 else 3.6          # first shot waits for the title card
    cues[str(s)] = []
    for name in VOICE[s]:
        a = rd(f"voice/{name}.wav"); st = int(((s - 1) * SHOT + t) * SR)
        voice[st:st + len(a)] += a
        cues[str(s)].append([round(t, 2), round(t + len(a) / SR, 2)])
        t += len(a) / SR + 0.7
json.dump({"cues": cues}, open("timeline.json", "w"), indent=1)
# ---- music pad: slow I-vi-IV-V in F major, soft detuned saws through a gentle low-pass, 15 s per shot = one bar each chord x ... 
def note(f, n): 
    t = np.arange(n) / SR
    o = sum(np.sin(2*np.pi*f*(1+d)*t) * g for d, g in [(0, 1.0), (0.003, 0.5), (-0.003, 0.5), (2.0 + 0.001, 0.15)])
    return o
chords = [[174.61, 220.0, 261.63, 349.23], [146.83, 174.61, 220.0, 293.66], [116.54, 174.61, 233.08, 293.66], [130.81, 196.0, 261.63, 329.63]]
pad = np.zeros(total, np.float32); seg = int(7.5 * SR)
env = np.ones(seg); fade = int(1.2 * SR); env[:fade] = np.linspace(0, 1, fade); env[-fade:] = np.linspace(1, 0, fade)
for k in range(total // seg):
    ch = chords[k % 4]; st = k * seg
    pad[st:st + seg] += sum(note(f, seg) for f in ch) * env / len(ch)
# simple one-pole low-pass for warmth
y = np.zeros_like(pad); a = math.exp(-2*math.pi*900/SR); acc = 0.0
for i in range(0, total, 1): pass
# vectorised IIR via scipy-free recurrence (numpy trick: chunked lfilter)
def lp(x, a):
    out = np.empty_like(x); z = 0.0
    for i in range(len(x)): z = a*z + (1-a)*x[i]; out[i] = z
    return out
pad = lp(pad, a).astype(np.float32)
pad /= (np.abs(pad).max() + 1e-6)
# chime at each reflection start (10 s into the shot)
chime = np.zeros(total, np.float32)
for s in range(N):
    st = int((s * SHOT + 10.0) * SR); n = int(2.2 * SR); t = np.arange(n) / SR
    tone = (np.sin(2*np.pi*1046.5*t) + 0.4*np.sin(2*np.pi*2093*t) + 0.25*np.sin(2*np.pi*1568*t)) * np.exp(-t*2.6)
    chime[st:st + n] += tone * 0.5
# levels & ducking
music_db, duck_db = -24, -9
g_music = 10 ** (music_db / 20)
envv = np.convolve(np.abs(voice), np.ones(int(0.25*SR)) / int(0.25*SR), mode="same")
duck = 1 - (10 ** (duck_db/20) * 0 + (1 - 10 ** (duck_db/20))) * np.clip(envv / 0.05, 0, 1)
mix = voice * 0.9 + pad * g_music * duck + chime * 10 ** (-20/20)
# master fade in/out
fi = int(1.0 * SR); mix[:fi] *= np.linspace(0, 1, fi); mix[-int(2.5*SR):] *= np.linspace(1, 0, int(2.5*SR))
peak = np.abs(mix).max(); mix = mix / peak * 0.89 if peak > 0.89 else mix
st = np.stack([mix, mix], 1); st = (st * 32767).astype(np.int16)
w = wave.open("mix.wav", "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes()); w.close()
print("mix written", total / SR, "s; cues:", cues)
