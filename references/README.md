# Reference pipeline (APA 7 → RIS)

`References.docx` is the APA 7 reference list (one reference per paragraph).
`References.ris` is the RIS export generated from it, importable into
EndNote, Zotero, Mendeley and similar reference managers.

Regenerate after editing the DOCX:

```bash
python3 python/ris_export.py references/References.docx \
    -o references/References.ris --dump-text references/References.txt
```

The script classifies each entry as a journal article (`TY - JOUR`), book
chapter (`TY - CHAP`) or book (`TY - BOOK`). DOIs are written to `DO` and
`UR`; article numbers (e.g. "Article 3668") are written to `SP` and `C7`.
Any entry that cannot be parsed is kept as `TY - GEN` with the raw text in
`N1`, is reported on stderr, and makes the script exit non-zero, so nothing
is silently dropped.

Requires `python-docx` (`pip install python-docx`) to read `.docx` input;
plain-text input needs no extra dependency.
