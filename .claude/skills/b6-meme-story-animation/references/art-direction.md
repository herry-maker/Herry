# B6 art direction: drawing, expression, era, light

Condensed from `references/b6-art-direction.md` and `b6-dynamic-meme.md`
in kaomei/stickman-video-director (MIT). Applies to EVERY character and
environment, including background extras, not just one traced face.

## Reference hierarchy

| Reference | Role | Where (installed upstream skill) |
|---|---|---|
| Sample 1, "The Man Who Sold the Eiffel Tower", portrait V44 | STRICT PRIMARY standard for drawing, relative limb weight, meme acting, soft light, space, camera, rhythm, caption geometry | `assets/b6/reference/eiffel-portrait-v44.mp4` (sha256 `b0047f58…3e5d79`), criteria in `assets/b6/style-standard.json` |
| Approved character V21b | supporting static drawing reference (asymmetric short side part, unified head/body) | `assets/b6/reference/approved-character-v21b.png` |
| Sample 2, "1990s Hong Kong" V90, 20 s, 16:9 | SECONDARY binding/engineering evidence (ensemble ownership, occlusion, scene changes). Its thinner limbs are NOT the target | `assets/b6/reference/hong-kong-v90-20s.mp4`, editable project `assets/b6/hong-kong-v90/` |
| `assets/b6/paint/` | example cast and Paris-era layers; usable as style reference for NEW paintings, never pasted into a new story | `assets/b6/manifest.json` |

Reference clips are compare-only. The runtime hashes bundled media and
rejects it as a production layer even when renamed.

## Shape and brush

- **Head:** white, slightly flattened, tilted, asymmetric contour; uneven jaw, imperfect hair mass. Never an exact circle/ellipse or generic round-head stickman.
- **Meme acting:** short heavy upper lids, low pupils, uneven brows, off-center mouth, simplified irregular teeth. Eyes/mouth/brows change with the beat (suspicion, greed, surprise, disappointment, excitement, recovery). Gaze lands on the partner/prop first, then the reaction follows.
- **Unified body:** simple slightly crooked clothed torso; head and body share ink pressure, paint softness and detail level. A clean vector body under a painted head is a failure.
- **Stick-limb priority:** single-stroke, pressure-varying painted arms with small dark simplified hands; garment volume stays on the torso. Match Sample 1's visibly heavier stroke relative to head width (compare at matched head width, record frames and normalization; there is no universal pixel width). No flesh-filled anatomical forearms, no modeled elbows/wrists, no circular joint caps.
- **Ink:** selective pressure variation, lighter lit edges, heavier jaw/shadow edges, a few deliberate repasses/breaks with shape logic. No uniform zigzags, random scratches, or frame-jittering contour noise.
- **Pigment:** broad matte colored masses, restrained local variation, a few brushed boundaries. Texture lives in asset-local coordinates so it moves with the art; no noise swimming over the face.

## Era, place and trend direction

When the user names a time/place, it must shape clothing silhouette, hair/headwear, accessories AND scenery together. A year label, one old prop and a warm filter are not period art direction.

Before painting, save a look brief: year range and place, story role/social milieu, period references, chosen silhouette and fashion cues, hairstyle, accessories, palette, architecture/shopfront/transport/interior cues. Favor the period's recognizable, expressive vocabulary over an average outfit; amplify a silhouette, hair shape, accessory scale or color combination enough to read at shot size. Differentiate occupations and personalities. Keep the look coherent to one city/decade/class; no decade costume pile, no celebrity/brand copy by default. If no era is requested, follow the story's setting; do not invent retro.

Period-read review (at wide-shot scale and in face/body crops): with year label and captions hidden, do clothes + hair + accessories + environment together suggest the setting? Is the principal silhouette visible when the character is small? Does every cue belong to the same time/place? Does the stronger era design still use B6's imperfect ink, matte paint, simple stick limbs, meme expression and soft light?

## Lighting and finish

Face near-white with a soft pale-violet underside; dark ink stays legible. Warm diffuse room light; softer local occlusion at chin, sleeve, hand/prop, shoe/ground, counter contact. Warm windows may spill a little into nearby edges. Grounded soft shadow sized to contact and elevation; a paper gets a small contact shadow. World light moves with the world, never as a screen overlay. Matte hair/clothes never get plastic specular highlights.

Optional finishing pass, compared at matched framing/exposure: restrained highlight-only bloom, soft shoulder, warm/cool balance. Reject crushed ink, washed-out faces, clipped windows, uniform blur, muddy blacks, or any filter used to hide bad drawing.

## Reusable still-art brief (adapt, do not paste blindly)

> A deliberately imperfect painted meme cartoon for layered 2D animation. Asymmetric slightly flattened white head, heavy short eyelids and uneven brows, off-center expressive mouth, sparse slightly crooked body and simple single-stroke stick limbs with the relative ink weight of the approved Sample 1 portrait, avoiding Sample 2's finer wire-like arms. The face and clothes share the same loose pressure-varying ink and broad matte paint. Selective broken and repassed contours, pale violet soft underside shadows, warm diffuse light and restrained spill at bright edges. Keep it scrappy and funny, readable at small size, with stable character identity. No polished vector outline, perfect circular head, glossy 3D rendering, ornate illustration, random scratch overlay or disconnected head/body styles.

Add: identity, exact view/expression/pose, transparent-background layer requirements, story-specific setting. For an era: `period/place + role + distinctive clothing silhouette/cut/colors + hair/headwear shape + purposeful accessories + local scene/transport/interior cues + degree of exaggeration`. Never put motion in a still prompt expecting a rig.

Environment plates: request a continuous very wide painted world with distinct connected regions (left/center/right or near/middle/far), usable floor, horizon, deep layers and vertical overscan for the planned camera; state the shot subject and whether the protagonist is absent. A clean plate omits people/vehicles that must move independently; request those as separate layers with the views they need.

## Asset handoff record (per cast card)

Identity, view IDs, expression IDs, layer paths/hashes, opaque-pixel shoulder/hip/head pivots, fixed bone lengths, grip sockets, occluders, supported poses. Test front/three-quarter/side/back at the same scale. Never invent a missing angle by narrowing the front head. Review whole figure and face/body/arm crops beside Sample 1 at matched head size. Record accepted/pending/rejected separately from user acceptance.
