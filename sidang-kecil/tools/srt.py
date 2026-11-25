"""Subtitle cues from the timeline, matching the page's on-screen subtitles: python tools/srt.py → out/cues.json, then core/render/srt.py."""
import json, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(HERE, 'timeline.json'), encoding='utf-8'))
NAME = {'V': 'Vidka', 'H': 'Dr. Herry', 'A': 'Prof. Ardipal'}
cues = []
for l in TL['lines']:
    t0 = round(l['t'] - .2, 3); t1 = round(max(l['t'] + l['d'] + .5, l['t'] + 1.8), 3)
    cues.append({'t0': t0, 't1': t1, 'text': f"{NAME[l['who']]}: {l['text']}"})
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
json.dump(cues, open(os.path.join(HERE, 'out', 'cues.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(cues), 'cues')
