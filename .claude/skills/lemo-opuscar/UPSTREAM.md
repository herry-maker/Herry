# Provenance

This skill is vendored unchanged from the Lemo-Opuscar library by Lemomo (LemoLab):

- Source: https://github.com/lemomo-ai/lemo-opuscar, path `plugin/skills/lemo-opuscar/`
- Commit: f9e204293930952b61ba921cd8944d05f121beee (main, 2026-11-20)
- Gallery of the 99 styles: https://lemomo-ai.github.io/lemo-opuscar/

## Licence

Per the upstream `REUSE.toml`: `SKILL.md` is CC BY-NC 4.0, `scripts/setup.sh` is MIT.
Copyright 2026 Lemomo (LemoLab). Licence texts: https://github.com/lemomo-ai/lemo-opuscar/tree/main/LICENSES

## How it works

`SKILL.md` is a bootstrap. On first use `scripts/setup.sh` makes a sparse clone of the
style library into `~/lemo-opuscar` (override with `LEMO_OPUSCAR_HOME`), then the agent
follows the library's own `AGENTS.md`, `DIRECTOR.md` and `TECHNIQUE.md`. Films are
written into `<name>/` under the folder the session started from.

System requirements the script checks for (it reports, it does not install):
Node 20+, ffmpeg 7+, Python 3.11+ or uv. Three styles marked ✦ also need an
image generator the user supplies.

## Updating

```sh
git clone --depth 1 https://github.com/lemomo-ai/lemo-opuscar.git /tmp/lemo-opuscar
cp /tmp/lemo-opuscar/plugin/skills/lemo-opuscar/SKILL.md .claude/skills/lemo-opuscar/
cp /tmp/lemo-opuscar/plugin/skills/lemo-opuscar/scripts/setup.sh .claude/skills/lemo-opuscar/scripts/
```

Then update the commit hash above.
