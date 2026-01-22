import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PhotoCropModalProps {
  imageUrl: string;
  onConfirm: (croppedImageUrl: string, cropBox: CropBox) => void;
  onRetake: () => void;
  onCancel: () => void;
  source: 'camera' | 'upload';
}

const ASPECT_RATIO = 4 / 5; // Portrait 4:5

const PhotoCropModal = ({ imageUrl, onConfirm, onRetake, onCancel, source }: PhotoCropModalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, boxX: 0, boxY: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate initial crop box (centered, focused on upper body)
  const calculateInitialCropBox = useCallback((imgWidth: number, imgHeight: number, dispWidth: number, dispHeight: number) => {
    // Target: cover about 60% width, positioned in upper portion
    const boxWidth = dispWidth * 0.7;
    const boxHeight = boxWidth / ASPECT_RATIO;
    
    // Center horizontally, position in upper third
    const boxX = (dispWidth - boxWidth) / 2;
    const boxY = dispHeight * 0.1;
    
    // Ensure box stays within bounds
    const constrainedY = Math.max(0, Math.min(boxY, dispHeight - boxHeight));
    
    return {
      x: boxX,
      y: constrainedY,
      width: boxWidth,
      height: Math.min(boxHeight, dispHeight - constrainedY),
    };
  }, []);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;
    
    const img = imageRef.current;
    const container = containerRef.current;
    
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    setImageDimensions({ width: imgWidth, height: imgHeight });
    
    // Calculate display size (fit within container)
    const containerRect = container.getBoundingClientRect();
    const maxWidth = containerRect.width;
    const maxHeight = containerRect.height - 120; // Leave space for buttons
    
    const imgRatio = imgWidth / imgHeight;
    let dispWidth = maxWidth;
    let dispHeight = dispWidth / imgRatio;
    
    if (dispHeight > maxHeight) {
      dispHeight = maxHeight;
      dispWidth = dispHeight * imgRatio;
    }
    
    const offsetX = (maxWidth - dispWidth) / 2;
    const offsetY = (maxHeight - dispHeight) / 2;
    
    setDisplayDimensions({ width: dispWidth, height: dispHeight, offsetX, offsetY });
    
    // Set initial crop box
    const initialBox = calculateInitialCropBox(imgWidth, imgHeight, dispWidth, dispHeight);
    setCropBox(initialBox);
  }, [calculateInitialCropBox]);

  // Constrain crop box to image bounds
  const constrainBox = useCallback((box: CropBox, dispWidth: number, dispHeight: number): CropBox => {
    let { x, y, width, height } = box;
    
    // Keep minimum size
    width = Math.max(width, 100);
    height = width / ASPECT_RATIO;
    
    // Keep within bounds
    x = Math.max(0, Math.min(x, dispWidth - width));
    y = Math.max(0, Math.min(y, dispHeight - height));
    
    return { x, y, width, height };
  }, []);

  // Handle drag start
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      boxX: cropBox.x,
      boxY: cropBox.y,
    });
  }, [cropBox]);

  // Handle drag move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    const newBox = constrainBox(
      {
        ...cropBox,
        x: dragStart.boxX + dx,
        y: dragStart.boxY + dy,
      },
      displayDimensions.width,
      displayDimensions.height
    );
    
    setCropBox(newBox);
  }, [isDragging, dragStart, cropBox, displayDimensions, constrainBox]);

  // Handle drag end
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle confirm
  const handleConfirm = useCallback(async () => {
    if (!canvasRef.current || !imageRef.current || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = imageRef.current;
      
      if (!ctx) {
        setIsProcessing(false);
        return;
      }
      
      // Calculate actual crop coordinates relative to original image
      const scaleX = imageDimensions.width / displayDimensions.width;
      const scaleY = imageDimensions.height / displayDimensions.height;
      
      const actualCropX = cropBox.x * scaleX;
      const actualCropY = cropBox.y * scaleY;
      const actualCropWidth = cropBox.width * scaleX;
      const actualCropHeight = cropBox.height * scaleY;
      
      // Output size (maintain 4:5 ratio)
      const outputWidth = 400;
      const outputHeight = 500;
      
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      
      // Draw cropped region
      ctx.drawImage(
        img,
        actualCropX,
        actualCropY,
        actualCropWidth,
        actualCropHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );
      
      const croppedUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      onConfirm(croppedUrl, {
        x: actualCropX,
        y: actualCropY,
        width: actualCropWidth,
        height: actualCropHeight,
      });
    } catch (error) {
      console.error('Crop error:', error);
      setIsProcessing(false);
    }
  }, [cropBox, displayDimensions, imageDimensions, onConfirm, isProcessing]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current) {
        handleImageLoad();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleImageLoad]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Hidden canvas for crop */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Header */}
      <div className="flex flex-col bg-black/80">
        <div className="flex items-center justify-between p-4">
          <span className="text-white font-medium">Adjust crop</span>
          <button
            type="button"
            onClick={onCancel}
            className="text-white p-2"
            aria-label="Cancel"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-white/50 text-xs text-center pb-3 -mt-1">
          We use this only to style you better. Your photo is not shared.
        </p>
      </div>
      
      {/* Image with crop overlay */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Image */}
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Crop preview"
          onLoad={handleImageLoad}
          className="max-w-full max-h-full object-contain"
          style={{
            width: displayDimensions.width || 'auto',
            height: displayDimensions.height || 'auto',
          }}
          draggable={false}
        />
        
        {/* Crop overlay */}
        {displayDimensions.width > 0 && (
          <div 
            className="absolute pointer-events-none"
            style={{
              width: displayDimensions.width,
              height: displayDimensions.height,
              left: displayDimensions.offsetX,
              top: displayDimensions.offsetY,
            }}
          >
            {/* Darkened areas outside crop */}
            <div className="absolute inset-0 bg-black/50" />
            
            {/* Clear crop area */}
            <div
              className="absolute bg-transparent border-2 border-white shadow-lg cursor-move pointer-events-auto"
              style={{
                left: cropBox.x,
                top: cropBox.y,
                width: cropBox.width,
                height: cropBox.height,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              }}
              onPointerDown={handlePointerDown}
            >
              {/* Corner indicators */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white" />
              
              {/* Center grip indicator */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-white/40" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Helper text */}
      <div className="text-center py-2">
        <p className="text-white/60 text-sm">Drag to position crop area</p>
      </div>
      
      {/* Actions */}
      <div className="p-4 bg-black/80 space-y-3">
        <Button
          onClick={handleConfirm}
          variant="outline"
          size="lg"
          className="w-full bg-white text-black hover:bg-white/90"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Confirm crop
            </>
          )}
        </Button>
        
        <button
          type="button"
          onClick={onRetake}
          className="w-full text-white/60 text-sm py-2 hover:text-white transition-colors"
        >
          {source === 'camera' ? 'Retake photo' : 'Change photo'}
        </button>
      </div>
    </div>
  );
};

export default PhotoCropModal;
