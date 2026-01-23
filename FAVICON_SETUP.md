# Favicon & OG Image Setup

## Quick Setup

### Option 1: Use HTML Generator (Recommended)
1. Open `public/generate-favicons.html` in your browser
2. Click "Generate All Favicons" and "Generate OG Image"
3. Right-click each canvas and save to `public/` directory
4. Convert `favicon-32x32.png` to `favicon.ico` using [favicon.io](https://favicon.io/favicon-converter/) or similar

### Option 2: Use Python Script
```bash
pip install Pillow
python3 scripts/generate-favicons.py
```

### Option 3: Manual Creation
Create the following files in `public/`:
- `favicon-16x16.png` - 16x16 PNG with black background, white "P"
- `favicon-32x32.png` - 32x32 PNG with black background, white "P"
- `apple-touch-icon.png` - 180x180 PNG with black background, white "P"
- `android-chrome-192x192.png` - 192x192 PNG with black background, white "P"
- `android-chrome-512x512.png` - 512x512 PNG with black background, white "P"
- `favicon.ico` - Convert from favicon-32x32.png
- `og-image.jpg` - 1200x630 JPEG, black background, white "Praxis" wordmark, gray "Get dressed right." tagline

## Design Specs
- **Background**: #000000 (black)
- **Text**: #ffffff (white) for favicons, #cccccc (gray) for OG tagline
- **Font**: System sans-serif, bold
- **Favicon**: Simple "P" letterform, centered
- **OG Image**: "Praxis" wordmark (120px) + "Get dressed right." tagline (32px)
