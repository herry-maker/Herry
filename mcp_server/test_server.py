"""
Synchronous smoke-tests for the MCP pipeline tools.
Run with:  python mcp_server/test_server.py
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from server import (
    _execute_python_code,
    _generate_sample_data,
    _list_scripts,
    _run_analysis_pipeline,
    _run_python_script,
    _run_project_tests,
)


def check(label: str, result: str, must_contain: str = "") -> None:
    ok = "ERROR" not in result and (not must_contain or must_contain in result)
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {label}")
    if not ok:
        print(f"       got: {result[:300]}")


def main() -> None:
    print("=== Herry MCP Pipeline Smoke Tests ===\n")

    # 1. list_project_scripts
    r = _list_scripts()
    check("list_project_scripts", r, "guitar_data_analysis.py")

    # 2. execute_python_code
    r = _execute_python_code("print('hello mcp')")
    check("execute_python_code basic", r, "hello mcp")

    # 3. execute_python_code with arithmetic
    r = _execute_python_code("x = 2 + 2\nprint(x)")
    check("execute_python_code arithmetic", r, "4")

    # 4. generate_sample_data
    sample = "/tmp/smoke_sample.csv"
    r = _generate_sample_data(sample)
    check("generate_sample_data", r, sample)
    from pathlib import Path as P
    assert P(sample).exists(), "CSV file not created"
    print("[PASS] sample CSV exists on disk")

    # 5. run_analysis_pipeline (uses sample data)
    r = _run_analysis_pipeline(sample, "/tmp/smoke_output")
    check("run_analysis_pipeline", r, "Report")

    # 6. run_python_script
    r = _run_python_script("analysis/guitar_data_analysis.py", [], "/tmp")
    check("run_python_script", r, "Analysis complete")

    # 7. run_project_tests (python suite)
    r = _run_project_tests("python", False)
    # Just check it ran (pass or fail is OK for smoke test)
    check("run_project_tests python", r, "")
    print(f"       test output: {r[:120].strip()}")

    print("\n=== Done ===")


if __name__ == "__main__":
    main()
