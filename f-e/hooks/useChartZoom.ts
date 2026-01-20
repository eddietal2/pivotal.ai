import { useState, useCallback, useRef, useEffect } from 'react';

interface ZoomState {
  scale: number;
  offsetX: number;
  minScale: number;
  maxScale: number;
}

interface TouchPoint {
  x: number;
  y: number;
}

interface UseChartZoomReturn {
  zoomState: ZoomState;
  isZooming: boolean;
  isPanning: boolean;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
  resetZoom: () => void;
  getVisibleRange: (dataLength: number) => { startIndex: number; endIndex: number };
  zoomIn: () => void;
  zoomOut: () => void;
}

export function useChartZoom(
  containerRef: React.RefObject<HTMLElement>,
  options?: { minScale?: number; maxScale?: number }
): UseChartZoomReturn {
  const minScale = options?.minScale ?? 1;
  const maxScale = options?.maxScale ?? 5;

  const [zoomState, setZoomState] = useState<ZoomState>({
    scale: 1,
    offsetX: 0,
    minScale,
    maxScale,
  });

  const [isZooming, setIsZooming] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  // Track touch state
  const touchStateRef = useRef<{
    initialDistance: number;
    initialScale: number;
    initialOffsetX: number;
    lastTouchX: number;
    touchCount: number;
    lastPinchCenter: number;
  }>({
    initialDistance: 0,
    initialScale: 1,
    initialOffsetX: 0,
    lastTouchX: 0,
    touchCount: 0,
    lastPinchCenter: 0,
  });

  // Calculate distance between two touch points
  const getDistance = (t1: TouchPoint, t2: TouchPoint): number => {
    return Math.sqrt(Math.pow(t2.x - t1.x, 2) + Math.pow(t2.y - t1.y, 2));
  };

  // Get center point between two touches
  const getCenterX = (t1: TouchPoint, t2: TouchPoint): number => {
    return (t1.x + t2.x) / 2;
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;
    touchStateRef.current.touchCount = touches.length;

    if (touches.length === 2) {
      // Pinch gesture starting
      e.preventDefault();
      setIsZooming(true);
      setIsPanning(false);

      const t1 = { x: touches[0].clientX, y: touches[0].clientY };
      const t2 = { x: touches[1].clientX, y: touches[1].clientY };

      touchStateRef.current.initialDistance = getDistance(t1, t2);
      touchStateRef.current.initialScale = zoomState.scale;
      touchStateRef.current.initialOffsetX = zoomState.offsetX;
      touchStateRef.current.lastPinchCenter = getCenterX(t1, t2);
    } else if (touches.length === 1 && zoomState.scale > 1) {
      // Single touch for panning when zoomed in
      setIsPanning(true);
      setIsZooming(false);
      touchStateRef.current.lastTouchX = touches[0].clientX;
      touchStateRef.current.initialOffsetX = zoomState.offsetX;
    }
  }, [zoomState.scale, zoomState.offsetX]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;

    if (touches.length === 2 && isZooming) {
      e.preventDefault();

      const t1 = { x: touches[0].clientX, y: touches[0].clientY };
      const t2 = { x: touches[1].clientX, y: touches[1].clientY };

      const currentDistance = getDistance(t1, t2);
      const currentCenterX = getCenterX(t1, t2);
      
      // Calculate new scale
      const scaleRatio = currentDistance / touchStateRef.current.initialDistance;
      let newScale = touchStateRef.current.initialScale * scaleRatio;
      newScale = Math.max(minScale, Math.min(maxScale, newScale));

      // Calculate offset to keep pinch center stable
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const centerXPercent = (currentCenterX - rect.left) / rect.width;
        
        // Adjust offset based on scale change and pinch center movement
        const pinchCenterDelta = currentCenterX - touchStateRef.current.lastPinchCenter;
        const scaleChange = newScale / zoomState.scale;
        
        let newOffsetX = zoomState.offsetX;
        
        // When zooming, adjust offset to zoom toward pinch center
        if (Math.abs(scaleChange - 1) > 0.01) {
          const viewportWidth = 100; // SVG viewBox width
          const scaledWidth = viewportWidth * newScale;
          const centerInSvg = centerXPercent * viewportWidth;
          
          // Calculate new offset to keep the pinch center stable
          newOffsetX = centerInSvg - (centerXPercent * scaledWidth / newScale);
        }
        
        // Add panning from pinch movement
        newOffsetX += (pinchCenterDelta / rect.width) * (100 / newScale) * 0.5;
        
        // Clamp offset
        const maxOffset = Math.max(0, (100 * (newScale - 1)) / newScale);
        newOffsetX = Math.max(-maxOffset, Math.min(maxOffset, newOffsetX));

        setZoomState(prev => ({
          ...prev,
          scale: newScale,
          offsetX: newOffsetX,
        }));
        
        touchStateRef.current.lastPinchCenter = currentCenterX;
      }
    } else if (touches.length === 1 && isPanning && zoomState.scale > 1) {
      // Single finger panning
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const deltaX = touches[0].clientX - touchStateRef.current.lastTouchX;
        
        // Convert pixel delta to SVG units
        const svgDeltaX = (deltaX / rect.width) * (100 / zoomState.scale);
        
        let newOffsetX = zoomState.offsetX + svgDeltaX;
        
        // Clamp offset
        const maxOffset = Math.max(0, (100 * (zoomState.scale - 1)) / zoomState.scale);
        newOffsetX = Math.max(-maxOffset, Math.min(maxOffset, newOffsetX));

        setZoomState(prev => ({
          ...prev,
          offsetX: newOffsetX,
        }));

        touchStateRef.current.lastTouchX = touches[0].clientX;
      }
    }
  }, [isZooming, isPanning, zoomState.scale, zoomState.offsetX, containerRef, minScale, maxScale]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const remainingTouches = e.touches.length;
    
    if (remainingTouches === 0) {
      setIsZooming(false);
      setIsPanning(false);
    } else if (remainingTouches === 1 && zoomState.scale > 1) {
      // Switch from pinch to pan
      setIsZooming(false);
      setIsPanning(true);
      touchStateRef.current.lastTouchX = e.touches[0].clientX;
    }
    
    touchStateRef.current.touchCount = remainingTouches;
  }, [zoomState.scale]);

  const resetZoom = useCallback(() => {
    setZoomState({
      scale: 1,
      offsetX: 0,
      minScale,
      maxScale,
    });
    setIsZooming(false);
    setIsPanning(false);
  }, [minScale, maxScale]);

  // Reset zoom when data changes significantly
  useEffect(() => {
    resetZoom();
  }, []);

  // Get visible data range based on zoom and pan
  const getVisibleRange = useCallback((dataLength: number): { startIndex: number; endIndex: number } => {
    if (zoomState.scale <= 1) {
      return { startIndex: 0, endIndex: dataLength - 1 };
    }

    const visiblePercent = 1 / zoomState.scale;
    const offsetPercent = -zoomState.offsetX / 100;
    
    const startPercent = Math.max(0, offsetPercent);
    const endPercent = Math.min(1, startPercent + visiblePercent);
    
    const startIndex = Math.floor(startPercent * (dataLength - 1));
    const endIndex = Math.ceil(endPercent * (dataLength - 1));
    
    return { startIndex, endIndex };
  }, [zoomState.scale, zoomState.offsetX]);

  const zoomIn = useCallback(() => {
    setZoomState(prev => ({
      ...prev,
      scale: Math.min(maxScale, prev.scale * 1.5),
    }));
  }, [maxScale]);

  const zoomOut = useCallback(() => {
    setZoomState(prev => {
      const newScale = Math.max(minScale, prev.scale / 1.5);
      // Reset offset if returning to 1x
      const newOffsetX = newScale <= 1 ? 0 : prev.offsetX;
      return {
        ...prev,
        scale: newScale,
        offsetX: newOffsetX,
      };
    });
  }, [minScale]);

  return {
    zoomState,
    isZooming,
    isPanning,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetZoom,
    getVisibleRange,
    zoomIn,
    zoomOut,
  };
}
