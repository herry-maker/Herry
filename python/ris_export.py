#!/usr/bin/env python3
"""Reference pipeline: APA 7 reference list (DOCX or plain text) -> RIS.

Usage:
    python3 python/ris_export.py references/References.docx -o references/References.ris

Each non-empty paragraph in the source is treated as one reference. Entries are
classified as journal article (TY - JOUR), book chapter (TY - CHAP) or book
(TY - BOOK). Anything that cannot be parsed is emitted as TY - GEN with the raw
text in the N1 (notes) field so no reference is silently dropped, and the
failure is reported on stderr.
"""
from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

DASH = r"[–—-]"  # en dash, em dash or hyphen in page ranges

# ----------------------------------------------------------------------------
# Input
# ----------------------------------------------------------------------------

def read_paragraphs(path: Path) -> list[str]:
    """Return the non-empty paragraphs of a .docx or text file."""
    if path.suffix.lower() == ".docx":
        try:
            import docx  # python-docx
        except ImportError as exc:  # pragma: no cover
            sys.exit(f"python-docx is required to read {path}: {exc}")
        paras = [p.text for p in docx.Document(str(path)).paragraphs]
    else:
        paras = path.read_text(encoding="utf-8").splitlines()
    out = []
    for p in paras:
        p = re.sub(r"\s+", " ", p.replace(" ", " ")).strip()
        if p:
            out.append(p)
    return out


# ----------------------------------------------------------------------------
# Parsing
# ----------------------------------------------------------------------------

@dataclass
class Ref:
    kind: str                     # JOUR | CHAP | BOOK | GEN
    authors: list[str] = field(default_factory=list)
    year: str = ""
    title: str = ""
    journal: str = ""
    volume: str = ""
    issue: str = ""
    start: str = ""
    end: str = ""
    article_no: str = ""
    doi: str = ""
    url: str = ""
    editors: list[str] = field(default_factory=list)
    book_title: str = ""
    publisher: str = ""
    raw: str = ""


INITIALS = re.compile(r"^(?:[A-Z]\.(?:\s?-?[A-Z]\.)*)(?:\s[A-Z]\.)*$")


def split_authors(s: str) -> list[str]:
    """'de Witte, M., Stams, G.-J., & Soesanto' -> ['de Witte, M.', 'Stams, G.-J.', 'Soesanto']"""
    s = re.sub(r",?\s*&\s*", ", ", s.strip())
    s = re.sub(r"\s+and\s+", ", ", s)
    tokens = [t.strip() for t in s.split(",") if t.strip()]
    out, i = [], 0
    while i < len(tokens):
        name = tokens[i]
        if i + 1 < len(tokens) and INITIALS.match(tokens[i + 1]):
            out.append(f"{name}, {tokens[i + 1]}")
            i += 2
        else:
            out.append(name)        # mononym (e.g. "Soesanto", "Helaluddin")
            i += 1
    return out


def split_editors(s: str) -> list[str]:
    """'J. van den Akker, R. M. Branch, & T. Plomp' -> ['van den Akker, J.', ...]"""
    s = re.sub(r",?\s*&\s*", ", ", s.strip())
    out = []
    for tok in [t.strip() for t in s.split(",") if t.strip()]:
        m = re.match(r"^((?:[A-Z]\.\s?-?)+)\s*(.+)$", tok)
        if m:
            out.append(f"{m.group(2).strip()}, {m.group(1).strip()}")
        else:
            out.append(tok)
    return out


HEAD = re.compile(r"^(?P<authors>.+?)\s*\((?P<year>\d{4}[a-z]?|n\.d\.)\)\.\s*(?P<rest>.+)$")

JOUR = re.compile(
    r"^(?P<title>.+?[.?!])\s+"
    r"(?P<journal>[^.?!]+?),\s+"
    r"(?P<volume>\d+)(?:\((?P<issue>[^)]+)\))?"
    r"(?:,\s+(?:Article\s+(?P<article>\S+?)|(?P<start>[A-Za-z]?\d+)" + DASH + r"(?P<end>[A-Za-z]?\d+)))?"
    r"\.?\s*(?P<link>https?://\S+)?$"
)

CHAP = re.compile(
    r"^(?P<title>.+?[.?!])\s+In\s+(?P<editors>.+?)\s+\((?:Ed|Eds)\.\),\s+"
    r"(?P<book>.+?)\s+\(pp\.\s+(?P<start>\d+)" + DASH + r"(?P<end>\d+)\)\.\s+"
    r"(?P<publisher>.+?)\.?\s*(?P<link>https?://\S+)?$"
)

BOOK = re.compile(r"^(?P<title>.+?[.?!])\s+(?P<publisher>[^.]+?)\.?\s*(?P<link>https?://\S+)?$")


def set_link(ref: Ref, link: str | None) -> None:
    if not link:
        return
    link = link.rstrip(".")
    m = re.match(r"https?://(?:dx\.)?doi\.org/(.+)$", link)
    if m:
        ref.doi = m.group(1)
        ref.url = link
    else:
        ref.url = link


def clean_title(t: str) -> str:
    return t[:-1] if t.endswith(".") else t


def parse(line: str) -> Ref:
    head = HEAD.match(line)
    if not head:
        return Ref(kind="GEN", raw=line)
    authors = split_authors(head.group("authors"))
    year = head.group("year")
    rest = head.group("rest").strip()

    m = CHAP.match(rest)
    if m:
        ref = Ref("CHAP", authors, year, clean_title(m.group("title")), raw=line)
        ref.editors = split_editors(m.group("editors"))
        ref.book_title = m.group("book")
        ref.start, ref.end = m.group("start"), m.group("end")
        ref.publisher = m.group("publisher").rstrip(".")
        set_link(ref, m.group("link"))
        return ref

    m = JOUR.match(rest)
    if m:
        ref = Ref("JOUR", authors, year, clean_title(m.group("title")), raw=line)
        ref.journal = m.group("journal")
        ref.volume = m.group("volume")
        ref.issue = m.group("issue") or ""
        ref.article_no = m.group("article") or ""
        ref.start = m.group("start") or ""
        ref.end = m.group("end") or ""
        set_link(ref, m.group("link"))
        return ref

    m = BOOK.match(rest)
    if m:
        ref = Ref("BOOK", authors, year, clean_title(m.group("title")), raw=line)
        ref.publisher = m.group("publisher")
        set_link(ref, m.group("link"))
        return ref

    return Ref("GEN", authors, year, raw=line)


# ----------------------------------------------------------------------------
# RIS output
# ----------------------------------------------------------------------------

def to_ris(ref: Ref, idx: int) -> str:
    L: list[str] = [f"TY  - {ref.kind}", f"ID  - ref{idx:03d}"]
    for a in ref.authors:
        L.append(f"AU  - {a}")
    if ref.year:
        L.append(f"PY  - {ref.year}")
    if ref.title:
        L.append(f"TI  - {ref.title}")
    if ref.kind == "JOUR":
        L.append(f"T2  - {ref.journal}")
        L.append(f"JO  - {ref.journal}")
        if ref.volume:
            L.append(f"VL  - {ref.volume}")
        if ref.issue:
            L.append(f"IS  - {ref.issue}")
        if ref.start:
            L.append(f"SP  - {ref.start}")
        if ref.end:
            L.append(f"EP  - {ref.end}")
        if ref.article_no:
            L.append(f"SP  - {ref.article_no}")
            L.append(f"C7  - {ref.article_no}")
    elif ref.kind == "CHAP":
        L.append(f"T2  - {ref.book_title}")
        for e in ref.editors:
            L.append(f"A2  - {e}")
        L.append(f"SP  - {ref.start}")
        L.append(f"EP  - {ref.end}")
        L.append(f"PB  - {ref.publisher}")
    elif ref.kind == "BOOK":
        L.append(f"PB  - {ref.publisher}")
    if ref.doi:
        L.append(f"DO  - {ref.doi}")
    if ref.url:
        L.append(f"UR  - {ref.url}")
    if ref.kind == "GEN":
        L.append(f"N1  - UNPARSED: {ref.raw}")
    L.append("ER  - ")
    return "\n".join(L) + "\n"


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source", type=Path, help=".docx or .txt reference list, one reference per paragraph")
    ap.add_argument("-o", "--output", type=Path, help="RIS file to write (default: <source>.ris)")
    ap.add_argument("--dump-text", type=Path, help="also write the extracted plain-text references here")
    args = ap.parse_args(argv)

    paras = read_paragraphs(args.source)
    refs = [parse(p) for p in paras]
    out = args.output or args.source.with_suffix(".ris")
    out.write_text("\n".join(to_ris(r, i + 1) for i, r in enumerate(refs)), encoding="utf-8", newline="\r\n")
    if args.dump_text:
        args.dump_text.write_text("\n\n".join(paras) + "\n", encoding="utf-8")

    counts = {}
    for r in refs:
        counts[r.kind] = counts.get(r.kind, 0) + 1
    print(f"{len(refs)} references -> {out}")
    for k in sorted(counts):
        print(f"  {k}: {counts[k]}")
    unparsed = [r for r in refs if r.kind == "GEN"]
    for r in unparsed:
        print(f"UNPARSED: {r.raw}", file=sys.stderr)
    return 1 if unparsed else 0


if __name__ == "__main__":
    sys.exit(main())
