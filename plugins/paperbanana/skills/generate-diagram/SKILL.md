---
name: generate-diagram
description: Generate a publication-quality methodology diagram from a text file with PaperBanana. Use when the user asks for a paper figure, architecture diagram, framework overview, or pipeline schematic from a methods description. Usage: /generate-diagram <file> [caption]
user-invocable: true
allowed-tools:
  - mcp__plugin_paperbanana_paperbanana__generate_diagram
  - Read
  - "Bash(paperbanana *)"
---

# Generate Diagram

Generate a publication-quality methodology diagram from a text file using PaperBanana.

## Instructions

1. Read the file at `$ARGUMENTS[0]` to get the methodology text content.
2. If `$ARGUMENTS[1]` is provided, use it as the figure caption. Otherwise, ask the user for a caption describing what the diagram should communicate.
3. Call the MCP tool `generate_diagram` with:
   - `source_context`: the text content read from the file
   - `caption`: the figure caption
   - `iterations`: 3 (default)
4. Present the generated diagram to the user.

## CLI Fallback

If the MCP tool is not available, fall back to the CLI:

```bash
paperbanana generate --input <file> --caption "<caption>"
```

## Example

```
/generate-diagram method.txt "Overview of our encoder-decoder architecture"
```
