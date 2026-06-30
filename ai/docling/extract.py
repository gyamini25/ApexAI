#!/usr/bin/env python3
"""
ApexAI — Docling document extraction.

Converts a racing document (PDF, DOCX, PPTX, HTML…) into clean, structured
Markdown that the backend feeds to IBM Granite for retrieval-grounded answers.

Usage:
    python3 extract.py <path-to-document>

Prints the extracted Markdown to stdout. Exits non-zero (with a message on
stderr) if Docling isn't installed or extraction fails, so the Node backend
can fall back gracefully.

Install Docling:
    pip install docling
"""
import sys


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: extract.py <document>", file=sys.stderr)
        return 2
    src = sys.argv[1]

    try:
        from docling.document_converter import DocumentConverter
    except ImportError:
        print("docling-not-installed", file=sys.stderr)
        return 3

    try:
        converter = DocumentConverter()
        result = converter.convert(src)
        # Structured Markdown preserves headings, tables and lists — ideal
        # context for Granite to reason over race reports and regulations.
        sys.stdout.write(result.document.export_to_markdown())
        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"docling-error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
