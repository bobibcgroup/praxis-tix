import type { 
  SkinToneBucket, 
  SkinToneData, 
  ContrastLevel, 
  BodyProportions,
  ShoulderWidth,
  TorsoLength,
  LegLength,
  BuildType,
  FaceShape,
  FaceShapeData,
} from '@/types/praxis';

// ============= PHOTO ANALYSIS UTILITIES =============
// V1 heuristics for skin tone, contrast, body proportion, and face shape detection

interface RGB {
  r: number;
  g: number;
  b: number;
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Calculate luminance (0-255 scale)
function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Sample pixels from a canvas region
function sampleRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): RGB[] {
  const imageData = ctx.getImageData(x, y, width, height);
  const pixels: RGB[] = [];
  
  // Sample every 4th pixel for performance
  for (let i = 0; i < imageData.data.length; i += 16) {
    pixels.push({
      r: imageData.data[i],
      g: imageData.data[i + 1],
      b: imageData.data[i + 2],
    });
  }
  
  return pixels;
}

// Filter outliers (very bright or very dark)
function filterOutliers(pixels: RGB[]): RGB[] {
  return pixels.filter(p => {
    const lum = getLuminance(p.r, p.g, p.b);
    // Exclude very dark (shadows) and very bright (highlights)
    return lum > 40 && lum < 230;
  });
}

// Calculate average color
function averageColor(pixels: RGB[]): RGB {
  if (pixels.length === 0) {
    return { r: 128, g: 128, b: 128 };
  }
  
  const sum = pixels.reduce(
    (acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }),
    { r: 0, g: 0, b: 0 }
  );
  
  return {
    r: sum.r / pixels.length,
    g: sum.g / pixels.length,
    b: sum.b / pixels.length,
  };
}

// Classify skin tone based on luminance and warmth
function classifySkinTone(color: RGB): SkinToneBucket {
  const luminance = getLuminance(color.r, color.g, color.b);
  
  // Classify based on luminance thresholds
  if (luminance > 190) return 'very-light';
  if (luminance > 160) return 'light';
  if (luminance > 120) return 'medium';
  if (luminance > 80) return 'tan-olive';
  return 'deep';
}

// Classify contrast level
function classifyContrast(skinLuminance: number, hairLuminance: number): ContrastLevel {
  const diff = Math.abs(skinLuminance - hairLuminance);
  
  if (diff < 40) return 'low';
  if (diff < 80) return 'medium';
  return 'high';
}

// ============= FACE SHAPE DETECTION =============
// V1 heuristics based on face region aspect ratio analysis

interface FaceRegion {
  width: number;
  height: number;
  jawWidth: number;
  foreheadWidth: number;
}

// Detect face region boundaries
function detectFaceRegion(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): FaceRegion {
  // Face is typically in upper-center portion of photo
  const faceTop = Math.floor(height * 0.08);
  const faceBottom = Math.floor(height * 0.45);
  const faceLeft = Math.floor(width * 0.25);
  const faceRight = Math.floor(width * 0.75);
  
  const faceWidth = faceRight - faceLeft;
  const faceHeight = faceBottom - faceTop;
  
  // Sample forehead width (upper third of face)
  const foreheadY = faceTop + Math.floor(faceHeight * 0.15);
  const foreheadWidth = measureHorizontalSpan(ctx, foreheadY, width);
  
  // Sample jaw width (lower third of face)
  const jawY = faceTop + Math.floor(faceHeight * 0.8);
  const jawWidth = measureHorizontalSpan(ctx, jawY, width);
  
  return {
    width: faceWidth,
    height: faceHeight,
    jawWidth: Math.min(jawWidth, faceWidth),
    foreheadWidth: Math.min(foreheadWidth, faceWidth),
  };
}

// Classify face shape based on proportions
function classifyFaceShape(region: FaceRegion): FaceShapeData {
  const aspectRatio = region.width / region.height;
  const jawToForeheadRatio = region.jawWidth / Math.max(region.foreheadWidth, 1);
  
  let shape: FaceShape;
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  
  // Long face: height significantly greater than width
  if (aspectRatio < 0.7) {
    shape = 'long';
    confidence = aspectRatio < 0.6 ? 'high' : 'medium';
  }
  // Round face: width close to height, softer jaw
  else if (aspectRatio > 0.85 && jawToForeheadRatio > 0.85) {
    shape = 'round';
    confidence = aspectRatio > 0.95 ? 'high' : 'medium';
  }
  // Square face: angular jaw, similar width at jaw and forehead
  else if (jawToForeheadRatio > 0.9 && aspectRatio >= 0.7 && aspectRatio <= 0.85) {
    shape = 'square';
    confidence = jawToForeheadRatio > 0.95 ? 'high' : 'medium';
  }
  // Oval: balanced proportions (default/ideal)
  else {
    shape = 'oval';
    confidence = 'medium';
  }
  
  return { shape, confidence };
}

// ============= BODY PROPORTION DETECTION =============
// V1 heuristics based on image region analysis

interface ProportionRegions {
  shoulderWidth: number;
  torsoHeight: number;
  legHeight: number;
  bodyWidth: number;
  totalHeight: number;
}

// Detect edges to find body silhouette boundaries
function detectEdges(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): ProportionRegions {
  // Sample horizontal slices to detect body width at different heights
  const shoulderY = Math.floor(height * 0.2); // ~20% from top
  const waistY = Math.floor(height * 0.45); // ~45% from top
  const hipY = Math.floor(height * 0.55); // ~55% from top
  
  const shoulderWidth = measureHorizontalSpan(ctx, shoulderY, width);
  const waistWidth = measureHorizontalSpan(ctx, waistY, width);
  const hipWidth = measureHorizontalSpan(ctx, hipY, width);
  
  // Estimate torso vs leg proportions
  // Typical head-to-crotch is about 50% of height, legs are remaining 50%
  const torsoHeight = height * 0.5;
  const legHeight = height * 0.5;
  
  return {
    shoulderWidth,
    torsoHeight,
    legHeight,
    bodyWidth: Math.max(shoulderWidth, waistWidth, hipWidth),
    totalHeight: height,
  };
}

// Measure the horizontal span of non-background pixels at a given Y
function measureHorizontalSpan(
  ctx: CanvasRenderingContext2D,
  y: number,
  width: number
): number {
  const imageData = ctx.getImageData(0, y, width, 1);
  let leftEdge = width;
  let rightEdge = 0;
  
  for (let x = 0; x < width; x++) {
    const i = x * 4;
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const lum = getLuminance(r, g, b);
    
    // Simple edge detection: non-uniform pixels indicate body
    // This is a heuristic - assumes background is relatively uniform
    if (lum > 20 && lum < 240) {
      if (x < leftEdge) leftEdge = x;
      if (x > rightEdge) rightEdge = x;
    }
  }
  
  return rightEdge > leftEdge ? rightEdge - leftEdge : width * 0.4;
}

// Classify body proportions based on detected regions
function classifyBodyProportions(regions: ProportionRegions): BodyProportions {
  const { shoulderWidth, torsoHeight, legHeight, bodyWidth, totalHeight } = regions;
  
  // Shoulder classification based on ratio to body width
  const shoulderRatio = shoulderWidth / bodyWidth;
  let shoulders: ShoulderWidth;
  if (shoulderRatio > 0.9) shoulders = 'broad';
  else if (shoulderRatio < 0.7) shoulders = 'narrow';
  else shoulders = 'average';
  
  // Torso length classification based on torso/leg ratio
  const torsoLegRatio = torsoHeight / legHeight;
  let torso: TorsoLength;
  if (torsoLegRatio > 1.1) torso = 'long';
  else if (torsoLegRatio < 0.9) torso = 'short';
  else torso = 'balanced';
  
  // Leg length classification (inverse of torso)
  let legs: LegLength;
  if (torsoLegRatio < 0.9) legs = 'long';
  else if (torsoLegRatio > 1.1) legs = 'short';
  else legs = 'balanced';
  
  // Build classification based on width to height ratio
  const widthHeightRatio = bodyWidth / totalHeight;
  let build: BuildType;
  if (widthHeightRatio > 0.35) build = 'solid';
  else if (widthHeightRatio < 0.25) build = 'lean';
  else build = 'average';
  
  return { shoulders, torso, legs, build };
}

// Main analysis function
export async function analyzePhoto(
  imageDataUrl: string
): Promise<{ 
  skinTone: SkinToneData; 
  contrastLevel: ContrastLevel;
  bodyProportions: BodyProportions;
  faceShape: FaceShapeData;
} | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(null);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Define regions for sampling
        const width = canvas.width;
        const height = canvas.height;
        
        // Skin region: center of image, upper portion (face/upper chest)
        const skinX = Math.floor(width * 0.25);
        const skinY = Math.floor(height * 0.15);
        const skinW = Math.floor(width * 0.5);
        const skinH = Math.floor(height * 0.35);
        
        // Hair region: top center of image
        const hairX = Math.floor(width * 0.3);
        const hairY = 0;
        const hairW = Math.floor(width * 0.4);
        const hairH = Math.floor(height * 0.12);
        
        // Sample and analyze skin region
        const skinPixels = sampleRegion(ctx, skinX, skinY, skinW, skinH);
        const filteredSkinPixels = filterOutliers(skinPixels);
        const avgSkinColor = averageColor(filteredSkinPixels);
        const skinLuminance = getLuminance(avgSkinColor.r, avgSkinColor.g, avgSkinColor.b);
        
        // Sample and analyze hair region
        const hairPixels = sampleRegion(ctx, hairX, hairY, hairW, hairH);
        const avgHairColor = averageColor(hairPixels);
        const hairLuminance = getLuminance(avgHairColor.r, avgHairColor.g, avgHairColor.b);
        
        // Classify skin tone and contrast
        const skinToneBucket = classifySkinTone(avgSkinColor);
        const contrastLevel = classifyContrast(skinLuminance, hairLuminance);
        
        // Detect and classify body proportions
        const proportionRegions = detectEdges(ctx, width, height);
        const bodyProportions = classifyBodyProportions(proportionRegions);
        
        // Detect and classify face shape
        const faceRegion = detectFaceRegion(ctx, width, height);
        const faceShape = classifyFaceShape(faceRegion);
        
        resolve({
          skinTone: {
            bucket: skinToneBucket,
            hex: rgbToHex(avgSkinColor.r, avgSkinColor.g, avgSkinColor.b),
          },
          contrastLevel,
          bodyProportions,
          faceShape,
        });
      };
      
      img.onerror = () => {
        resolve(null);
      };
      
      img.src = imageDataUrl;
    } catch {
      resolve(null);
    }
  });
}

// Crop image to specified region
export async function cropImage(
  imageDataUrl: string,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number,
  outputWidth: number = 400,
  outputHeight: number = 500
): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(null);
          return;
        }
        
        // Set output size
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        
        // Draw cropped region scaled to output size
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          outputWidth,
          outputHeight
        );
        
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      
      img.onerror = () => {
        resolve(null);
      };
      
      img.src = imageDataUrl;
    } catch {
      resolve(null);
    }
  });
}
