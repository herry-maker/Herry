# PaperBanana plugin for Claude Code

Wraps [PaperBanana](https://github.com/llmsresearch/paperbanana) (MIT, by
llmsresearch) as a Claude Code plugin. PaperBanana is an open-source
reimplementation of Google Research's PaperBanana paper (arXiv:2601.23265)
that generates academic methodology diagrams and statistical plots through a
multi-agent pipeline (retriever, planner, stylist, visualizer, critic).

Upstream ships an MCP server and three Claude Code skills but no plugin
manifest, so this directory adds one. Skill text is copied from upstream's
`.claude/skills/` with `name`/`description` frontmatter added. Upstream's
license is in `LICENSE.upstream`.

## What you get

| Component | Provides |
|-----------|----------|
| MCP server `paperbanana` (tools appear as `mcp__plugin_paperbanana_paperbanana__<tool>`) | `generate_diagram`, `generate_plot`, `continue_run`, `continue_diagram`, `continue_plot`, `evaluate_diagram`, `evaluate_plot`, `orchestrate_figures`, `batch_diagrams`, `batch_plots`, `download_references` |
| `/generate-diagram <file> [caption]` | Methodology diagram from a text file |
| `/generate-plot <data-file> [intent]` | Statistical plot from CSV or JSON |
| `/evaluate-diagram <generated> <reference>` | VLM-as-judge scoring on four dimensions |

## Requirements

- `uv` (the server is launched with `uvx --from 'paperbanana[mcp]' paperbanana-mcp`,
  so nothing is installed into your project). Install from https://docs.astral.sh/uv/.
- An API key for one provider, exported in the shell that starts Claude Code
  (the MCP server inherits your environment and also reads a `.env` in the
  working directory):

  ```bash
  export OPENAI_API_KEY=...        # default provider (VLM + image model)
  ```

  or

  ```bash
  export GOOGLE_API_KEY=...        # Gemini; set VLM_PROVIDER / IMAGE_PROVIDER per upstream .env.example
  ```

  Other upstream variables (`OPENAI_BASE_URL`, `GOOGLE_VLM_MODEL`,
  `ATLASCLOUD_API_KEY`, `PAPERBANANA_CACHE_DIR`, ...) work the same way.

## Install

From this repository's marketplace:

```bash
claude plugin marketplace add herry-maker/Herry
```

```bash
claude plugin install paperbanana@herry-tools
```

Or load it for a single session without installing:

```bash
claude --plugin-dir ./plugins/paperbanana
```

Inside this repository the marketplace is pre-registered in
`.claude/settings.json`, so Claude Code offers the plugin on first launch.

## Updating to a new upstream release

Bump `version` in `.claude-plugin/plugin.json` and `../../.claude-plugin/marketplace.json`,
then diff `skills/*/SKILL.md` against upstream `.claude/skills/`.
