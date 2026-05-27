"""
Music Transcriber: Convert PDF music notation to MuseScore format

This module provides functionality to extract music notation from PDF files
and convert them to MuseScore (.mscx) format.

Dependencies:
- pdf2image: Convert PDF pages to images
- pytesseract: OCR for text in sheet music
- music21: Parse and generate MusicXML for MuseScore
- opencv-python: Image processing for music recognition
"""

import json
import os
from pathlib import Path
from typing import Optional, Dict, List, Tuple
import logging

try:
    from pdf2image import convert_from_path
    import cv2
    import numpy as np
    from music21 import converter, stream, instrument, meter, tempo, note, chord, duration
except ImportError as e:
    print(f"Warning: Some dependencies not installed. Install with: pip install -r requirements.txt")
    print(f"Missing: {e}")


class MusicTranscriber:
    """
    Handles conversion of PDF sheet music to MuseScore format.
    """

    def __init__(self, pdf_path: str, output_dir: str = None):
        """
        Initialize the transcriber.
        
        Args:
            pdf_path: Path to input PDF file
            output_dir: Directory for output files (default: current directory)
        """
        self.pdf_path = pdf_path
        self.output_dir = output_dir or os.path.dirname(pdf_path) or "."
        self.logger = logging.getLogger(__name__)
        self.images = []
        self.detected_notes = []
        
    def convert_pdf_to_images(self) -> List:
        """
        Convert PDF pages to images.
        
        Returns:
            List of PIL Image objects
        """
        try:
            self.logger.info(f"Converting PDF: {self.pdf_path}")
            self.images = convert_from_path(self.pdf_path, dpi=300)
            self.logger.info(f"Successfully converted {len(self.images)} pages to images")
            return self.images
        except Exception as e:
            self.logger.error(f"Error converting PDF to images: {e}")
            raise

    def detect_staff_lines(self, image) -> Tuple[int, List]:
        """
        Detect staff lines in a music sheet image.
        
        Args:
            image: PIL Image object
            
        Returns:
            Tuple of (line_spacing, list of detected staff line y-coordinates)
        """
        try:
            # Convert PIL image to numpy array
            img_array = np.array(image)
            
            # Convert to grayscale
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            # Apply threshold to isolate staff lines
            _, binary = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY)
            
            # Detect horizontal lines (staff lines)
            horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (50, 1))
            horizontal_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, horizontal_kernel)
            
            # Find contours of staff lines
            contours, _ = cv2.findContours(horizontal_lines, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            staff_lines = []
            for contour in contours:
                y = cv2.boundingRect(contour)[1]
                staff_lines.append(y)
            
            staff_lines = sorted(set(staff_lines))
            
            # Calculate line spacing
            line_spacing = 0
            if len(staff_lines) > 1:
                differences = [staff_lines[i+1] - staff_lines[i] for i in range(len(staff_lines)-1)]
                line_spacing = int(np.mean(differences))
            
            self.logger.info(f"Detected {len(staff_lines)} staff lines with spacing: {line_spacing}px")
            return line_spacing, staff_lines
            
        except Exception as e:
            self.logger.error(f"Error detecting staff lines: {e}")
            return 0, []

    def detect_notes(self, image, staff_lines: List, line_spacing: int) -> List[Dict]:
        """
        Detect notes from a music sheet image.
        
        Args:
            image: PIL Image object
            staff_lines: List of staff line y-coordinates
            line_spacing: Spacing between staff lines
            
        Returns:
            List of detected note dictionaries with position and estimated pitch
        """
        try:
            img_array = np.array(image)
            
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            # Detect circles/note heads
            circles = cv2.HoughCircles(
                gray,
                cv2.HOUGH_GRADIENT,
                dp=1,
                minDist=20,
                param1=50,
                param2=30,
                minRadius=5,
                maxRadius=20
            )
            
            notes = []
            
            if circles is not None:
                circles = np.uint16(np.around(circles))
                
                for circle in circles[0, :]:
                    x, y, r = circle
                    
                    # Find which staff line this note is closest to
                    closest_line_idx = 0
                    min_distance = float('inf')
                    
                    for idx, line_y in enumerate(staff_lines):
                        distance = abs(y - line_y)
                        if distance < min_distance:
                            min_distance = distance
                            closest_line_idx = idx
                    
                    # Estimate pitch based on position relative to staff lines
                    pitch = self.estimate_pitch(y, staff_lines, line_spacing)
                    
                    notes.append({
                        'x': int(x),
                        'y': int(y),
                        'radius': int(r),
                        'pitch': pitch,
                        'staff_position': closest_line_idx
                    })
            
            self.detected_notes.extend(notes)
            self.logger.info(f"Detected {len(notes)} notes on current image")
            return notes
            
        except Exception as e:
            self.logger.error(f"Error detecting notes: {e}")
            return []

    def estimate_pitch(self, y: int, staff_lines: List, line_spacing: int) -> str:
        """
        Estimate musical pitch based on vertical position relative to staff lines.
        
        Args:
            y: Y-coordinate of note
            staff_lines: List of staff line y-coordinates
            line_spacing: Spacing between staff lines
            
        Returns:
            Pitch string (e.g., 'C4', 'D4', 'E4')
        """
        if not staff_lines or line_spacing == 0:
            return 'C4'  # Default pitch
        
        # Notes on treble clef staff (from bottom to top)
        treble_pitches = ['E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']
        
        # Find position relative to bottom staff line
        bottom_line = staff_lines[-1]
        position = (bottom_line - y) / line_spacing
        
        # Map position to pitch index
        pitch_idx = int(round(position + 4))  # Offset to account for spaces
        pitch_idx = max(0, min(len(treble_pitches) - 1, pitch_idx))
        
        return treble_pitches[pitch_idx]

    def create_musescore_xml(self, notes: List[Dict], title: str = "Transcribed Score") -> str:
        """
        Create a MusicXML file compatible with MuseScore from detected notes.
        
        Args:
            notes: List of detected note dictionaries
            title: Title for the score
            
        Returns:
            Path to generated MusicXML file
        """
        try:
            # Create a music21 score
            score = stream.Score()
            part = stream.Part()
            part.append(instrument.Piano())
            
            # Add metadata
            score.metadata.title = title
            
            # Add time signature
            part.append(meter.TimeSignature('4/4'))
            
            # Add tempo
            part.append(tempo.MetronomeMarkList([tempo.MetronomeMark(number=120)]))
            
            # Sort notes by x-coordinate (left to right)
            sorted_notes = sorted(notes, key=lambda n: n['x'])
            
            # Add notes to the part
            current_beat = 0
            for note_data in sorted_notes:
                try:
                    # Create music21 note
                    pitch = note_data['pitch']
                    n = note.Note(pitch)
                    n.quarterLength = 1  # Default to quarter note
                    part.append(n)
                except Exception as e:
                    self.logger.warning(f"Could not add note {note_data['pitch']}: {e}")
            
            score.append(part)
            
            # Generate output filename
            output_filename = os.path.join(
                self.output_dir,
                Path(self.pdf_path).stem + '_transcribed.mscx'
            )
            
            # Write MusicXML
            score.write('musicxml', fp=output_filename)
            self.logger.info(f"Created MuseScore file: {output_filename}")
            
            return output_filename
            
        except Exception as e:
            self.logger.error(f"Error creating MuseScore XML: {e}")
            raise

    def transcribe(self, title: str = None) -> Dict:
        """
        Complete transcription workflow: PDF → Images → Detect → MuseScore.
        
        Args:
            title: Title for the output score
            
        Returns:
            Dictionary with transcription results
        """
        try:
            title = title or Path(self.pdf_path).stem
            
            # Step 1: Convert PDF to images
            self.convert_pdf_to_images()
            
            # Step 2: Process each image
            all_notes = []
            for page_num, image in enumerate(self.images):
                self.logger.info(f"Processing page {page_num + 1}/{len(self.images)}")
                
                # Detect staff lines
                line_spacing, staff_lines = self.detect_staff_lines(image)
                
                # Detect notes
                notes = self.detect_notes(image, staff_lines, line_spacing)
                all_notes.extend(notes)
            
            # Step 3: Create MuseScore file
            output_file = self.create_musescore_xml(all_notes, title)
            
            return {
                'success': True,
                'output_file': output_file,
                'pages_processed': len(self.images),
                'notes_detected': len(all_notes),
                'message': f'Successfully transcribed {len(all_notes)} notes from {len(self.images)} pages'
            }
            
        except Exception as e:
            self.logger.error(f"Transcription failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Transcription failed'
            }


def transcribe_pdf_to_musescore(pdf_path: str, output_dir: str = None, title: str = None) -> Dict:
    """
    Convenience function to transcribe a PDF to MuseScore format.
    
    Args:
        pdf_path: Path to input PDF file
        output_dir: Output directory (default: same as PDF)
        title: Score title (default: PDF filename)
        
    Returns:
        Dictionary with results
    """
    transcriber = MusicTranscriber(pdf_path, output_dir)
    return transcriber.transcribe(title)


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    # Example: python music_transcriber.py input.pdf
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python music_transcriber.py <pdf_file> [output_dir] [title]")
        sys.exit(1)
    
    pdf_file = sys.argv[1]
    out_dir = sys.argv[2] if len(sys.argv) > 2 else None
    score_title = sys.argv[3] if len(sys.argv) > 3 else None
    
    result = transcribe_pdf_to_musescore(pdf_file, out_dir, score_title)
    print(json.dumps(result, indent=2))
