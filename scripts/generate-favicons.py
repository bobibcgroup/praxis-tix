#!/usr/bin/env python3
"""
Generate Praxis favicon files and OG image.
Requires Pillow: pip install Pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_favicon(size, output_path):
    """Create a favicon with a white 'P' on black background"""
    # Create black background
    img = Image.new('RGB', (size, size), color='black')
    draw = ImageDraw.Draw(img)
    
    # Try to use a system font, fallback to default
    try:
        # Try different font paths for different systems
        font_paths = [
            '/System/Library/Fonts/Helvetica.ttc',
            '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
            'arial.ttf',
            'Arial.ttf',
        ]
        font = None
        for path in font_paths:
            try:
                font = ImageFont.truetype(path, int(size * 0.7))
                break
            except:
                continue
        if font is None:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    # Draw white 'P'
    text = 'P'
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    position = ((size - text_width) // 2, (size - text_height) // 2 - bbox[1])
    draw.text(position, text, fill='white', font=font)
    
    # Save
    img.save(output_path, 'PNG')
    print(f"Created {output_path} ({size}x{size})")

def create_og_image(output_path):
    """Create OG image (1200x630)"""
    img = Image.new('RGB', (1200, 630), color='black')
    draw = ImageDraw.Draw(img)
    
    # Try to load a nice font
    try:
        font_paths = [
            '/System/Library/Fonts/Helvetica.ttc',
            '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
            'arial.ttf',
        ]
        title_font = None
        tagline_font = None
        for path in font_paths:
            try:
                title_font = ImageFont.truetype(path, 120)
                tagline_font = ImageFont.truetype(path, 32)
                break
            except:
                continue
        if title_font is None:
            title_font = ImageFont.load_default()
            tagline_font = ImageFont.load_default()
    except:
        title_font = ImageFont.load_default()
        tagline_font = ImageFont.load_default()
    
    # Draw "Praxis" title
    title = 'Praxis'
    bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = bbox[2] - bbox[0]
    title_x = (1200 - title_width) // 2
    title_y = 200
    draw.text((title_x, title_y - bbox[1]), title, fill='white', font=title_font)
    
    # Draw tagline
    tagline = 'Get dressed right.'
    bbox = draw.textbbox((0, 0), tagline, font=tagline_font)
    tagline_width = bbox[2] - bbox[0]
    tagline_x = (1200 - tagline_width) // 2
    tagline_y = 350
    draw.text((tagline_x, tagline_y - bbox[1]), tagline, fill='#cccccc', font=tagline_font)
    
    # Save as JPEG
    img.save(output_path, 'JPEG', quality=90)
    print(f"Created {output_path} (1200x630)")

def main():
    # Ensure public directory exists
    public_dir = os.path.join(os.path.dirname(__file__), '..', 'public')
    os.makedirs(public_dir, exist_ok=True)
    
    # Generate favicons
    favicons = [
        (16, 'favicon-16x16.png'),
        (32, 'favicon-32x32.png'),
        (180, 'apple-touch-icon.png'),
        (192, 'android-chrome-192x192.png'),
        (512, 'android-chrome-512x512.png'),
    ]
    
    for size, filename in favicons:
        output_path = os.path.join(public_dir, filename)
        create_favicon(size, output_path)
    
    # Generate OG image
    og_path = os.path.join(public_dir, 'og-image.jpg')
    create_og_image(og_path)
    
    print("\n✅ All favicon files generated!")
    print("Note: You'll need to create favicon.ico separately (use an online converter from favicon-32x32.png)")

if __name__ == '__main__':
    main()
