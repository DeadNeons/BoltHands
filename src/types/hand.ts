export interface HandLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface HandGesture {
  type: 'pinch' | 'rotate' | 'scale';
  state: 'start' | 'move' | 'end';
  position: {
    x: number;
    y: number;
    z: number;
  };
  handIndex: number;
  confidence: number;
  // Additional gesture-specific properties
  angle?: number;
  scale?: number;
}