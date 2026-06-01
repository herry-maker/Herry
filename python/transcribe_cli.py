#!/usr/bin/env python3
"""CLI wrapper for MusicTranscriber — called from Laravel via subprocess."""

import argparse
import json
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from music_transcriber import transcribe_pdf_to_musescore


def main():
    parser = argparse.ArgumentParser(description='Transcribe a PDF music sheet to MuseScore format')
    parser.add_argument('--input', required=True, help='Path to the input PDF file')
    parser.add_argument('--output', required=True, help='Directory for the output file')
    parser.add_argument('--title', default=None, help='Title for the transcription')
    args = parser.parse_args()

    result = transcribe_pdf_to_musescore(
        pdf_path=args.input,
        output_dir=args.output,
        title=args.title,
    )
    print(json.dumps(result))
    sys.exit(0 if result.get('success') else 1)


if __name__ == '__main__':
    main()
