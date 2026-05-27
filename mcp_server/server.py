#!/usr/bin/env python3
"""
Herry MCP Code-Run Pipeline Server
-----------------------------------
Exposes project analysis scripts as MCP tools so any MCP-compatible client
(e.g. Claude Desktop) can run the guitar-research pipeline, execute Python
snippets, and run the test suite without leaving the conversation.

Start:
    python mcp_server/server.py

Or with uvx / mcp dev:
    mcp dev mcp_server/server.py
"""

from __future__ import annotations

import io
import json
import os
import subprocess
import sys
import textwrap
import traceback
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from typing import Any

import mcp.server.stdio
import mcp.types as types
from mcp.server import Server

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ANALYSIS_DIR = PROJECT_ROOT / "analysis"
PYTHON_DIR = PROJECT_ROOT / "python"

# ---------------------------------------------------------------------------
# Server setup
# ---------------------------------------------------------------------------

app = Server("herry-code-pipeline")


# ---------------------------------------------------------------------------
# Tool: list_project_scripts
# ---------------------------------------------------------------------------

@app.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="list_project_scripts",
            description=(
                "List all Python scripts available in the project (analysis/ and python/ dirs)."
            ),
            inputSchema={
                "type": "object",
                "properties": {},
                "required": [],
            },
        ),
        types.Tool(
            name="generate_sample_data",
            description=(
                "Generate a sample CSV dataset for the classical guitar case study. "
                "Creates 20 synthetic students across 8 semesters (4 years). "
                "Returns the path where the file was saved."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "output_file": {
                        "type": "string",
                        "description": "Destination path for the CSV (default: /tmp/sample_student_data.csv).",
                    }
                },
                "required": [],
            },
        ),
        types.Tool(
            name="run_analysis_pipeline",
            description=(
                "Run the full classical-guitar data-analysis pipeline on a CSV file. "
                "Steps: load → validate → semester statistics → student classification → export report & JSON. "
                "If no data_file is given, sample data is generated first."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "data_file": {
                        "type": "string",
                        "description": "Path to a student-performance CSV file. Omit to auto-generate sample data.",
                    },
                    "output_dir": {
                        "type": "string",
                        "description": "Directory where the report and JSON are written (default: /tmp).",
                    },
                },
                "required": [],
            },
        ),
        types.Tool(
            name="run_python_script",
            description=(
                "Execute any Python script that lives inside the project by its relative path "
                "(e.g. 'analysis/guitar_data_analysis.py'). "
                "Captures stdout + stderr and returns them."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "script": {
                        "type": "string",
                        "description": "Relative path from the project root to the script.",
                    },
                    "args": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Command-line arguments to pass to the script.",
                    },
                    "cwd": {
                        "type": "string",
                        "description": "Working directory for the script (default: /tmp).",
                    },
                },
                "required": ["script"],
            },
        ),
        types.Tool(
            name="execute_python_code",
            description=(
                "Execute an arbitrary Python code snippet and return its output. "
                "The snippet runs in an isolated namespace. "
                "Use this for quick calculations, data inspection, or prototyping pipeline steps."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "Python source code to execute.",
                    }
                },
                "required": ["code"],
            },
        ),
        types.Tool(
            name="run_project_tests",
            description=(
                "Run the project's test suite. "
                "Supports 'python' (pytest in python/) and 'php' (phpunit in project root)."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "suite": {
                        "type": "string",
                        "enum": ["python", "php"],
                        "description": "Which test suite to run.",
                    },
                    "verbose": {
                        "type": "boolean",
                        "description": "Pass -v flag to the test runner (default: false).",
                    },
                },
                "required": ["suite"],
            },
        ),
    ]


# ---------------------------------------------------------------------------
# Tool handlers
# ---------------------------------------------------------------------------

@app.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[types.TextContent]:
    try:
        result = await _dispatch(name, arguments)
    except Exception as exc:
        result = f"ERROR: {exc}\n\n{traceback.format_exc()}"
    return [types.TextContent(type="text", text=str(result))]


async def _dispatch(name: str, args: dict[str, Any]) -> str:
    if name == "list_project_scripts":
        return _list_scripts()
    if name == "generate_sample_data":
        return _generate_sample_data(args.get("output_file"))
    if name == "run_analysis_pipeline":
        return _run_analysis_pipeline(args.get("data_file"), args.get("output_dir"))
    if name == "run_python_script":
        return _run_python_script(
            args["script"],
            args.get("args", []),
            args.get("cwd"),
        )
    if name == "execute_python_code":
        return _execute_python_code(args["code"])
    if name == "run_project_tests":
        return _run_project_tests(args["suite"], args.get("verbose", False))
    raise ValueError(f"Unknown tool: {name}")


# ---------------------------------------------------------------------------
# Implementations
# ---------------------------------------------------------------------------

def _list_scripts() -> str:
    lines = ["Available Python scripts in the project:\n"]
    for directory in (ANALYSIS_DIR, PYTHON_DIR):
        if directory.exists():
            scripts = sorted(directory.glob("*.py"))
            if scripts:
                lines.append(f"\n{directory.relative_to(PROJECT_ROOT)}/")
                for s in scripts:
                    lines.append(f"  {s.name}")
    return "\n".join(lines) if len(lines) > 1 else "No Python scripts found."


def _generate_sample_data(output_file: str | None) -> str:
    if output_file is None:
        output_file = "/tmp/sample_student_data.csv"

    # Inline the sample-data generation so this tool has no file-system
    # dependency on the analysis module's working directory.
    code = textwrap.dedent(f"""
        import sys
        sys.path.insert(0, {str(ANALYSIS_DIR)!r})
        from guitar_data_analysis import create_sample_data
        create_sample_data({output_file!r})
    """)
    out = _execute_python_code(code)
    return f"Sample data written to: {output_file}\n\n{out}"


def _run_analysis_pipeline(
    data_file: str | None,
    output_dir: str | None,
) -> str:
    if output_dir is None:
        output_dir = "/tmp"
    os.makedirs(output_dir, exist_ok=True)

    report_path = os.path.join(output_dir, "guitar_analysis_report.txt")
    json_path = os.path.join(output_dir, "guitar_analysis_data.json")

    if data_file is None:
        data_file = "/tmp/sample_student_data.csv"
        gen_out = _generate_sample_data(data_file)
    else:
        gen_out = ""

    code = textwrap.dedent(f"""
        import sys, os
        os.chdir({output_dir!r})
        sys.path.insert(0, {str(ANALYSIS_DIR)!r})
        from guitar_data_analysis import GuitarStudentDataAnalyzer
        analyzer = GuitarStudentDataAnalyzer()
        analyzer.load_data({data_file!r})
        assert analyzer.validate_data(), "Validation failed"
        analyzer.calculate_semester_statistics()
        analyzer.display_semester_summary()
        analyzer.identify_student_types()
        analyzer.display_student_types()
        analyzer.export_analysis_report({report_path!r})
        analyzer.export_json({json_path!r})
    """)
    pipeline_out = _execute_python_code(code)

    sections = []
    if gen_out:
        sections.append(gen_out)
    sections.append(pipeline_out)
    sections.append(f"\nReport  : {report_path}")
    sections.append(f"JSON    : {json_path}")
    return "\n".join(sections)


def _run_python_script(script: str, extra_args: list[str], cwd: str | None) -> str:
    script_path = PROJECT_ROOT / script
    if not script_path.exists():
        return f"ERROR: Script not found: {script_path}"

    cmd = [sys.executable, str(script_path), *extra_args]
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=cwd or "/tmp",
        timeout=120,
    )
    parts = []
    if result.stdout:
        parts.append(result.stdout)
    if result.stderr:
        parts.append(f"[stderr]\n{result.stderr}")
    parts.append(f"\n[exit code: {result.returncode}]")
    return "\n".join(parts)


def _execute_python_code(code: str) -> str:
    stdout_buf = io.StringIO()
    stderr_buf = io.StringIO()
    namespace: dict[str, Any] = {}
    try:
        with redirect_stdout(stdout_buf), redirect_stderr(stderr_buf):
            exec(compile(code, "<mcp_snippet>", "exec"), namespace)  # noqa: S102
    except Exception:
        stderr_buf.write(traceback.format_exc())

    out = stdout_buf.getvalue()
    err = stderr_buf.getvalue()
    parts = []
    if out:
        parts.append(out)
    if err:
        parts.append(f"[stderr]\n{err}")
    return "\n".join(parts) if parts else "(no output)"


def _run_project_tests(suite: str, verbose: bool) -> str:
    if suite == "python":
        cmd = [sys.executable, "-m", "pytest", str(PYTHON_DIR)]
        if verbose:
            cmd.append("-v")
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=str(PROJECT_ROOT),
            timeout=120,
        )
    elif suite == "php":
        php_bin = "php"
        artisan = str(PROJECT_ROOT / "artisan")
        cmd = [php_bin, artisan, "test"]
        if verbose:
            cmd.append("--verbose")
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=str(PROJECT_ROOT),
            timeout=180,
        )
    else:
        return f"ERROR: Unknown suite '{suite}'. Choose 'python' or 'php'."

    parts = []
    if result.stdout:
        parts.append(result.stdout)
    if result.stderr:
        parts.append(f"[stderr]\n{result.stderr}")
    parts.append(f"\n[exit code: {result.returncode}]")
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def main() -> None:
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options(),
        )


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
