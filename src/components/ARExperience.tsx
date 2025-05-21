import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, Controllers, Interactive, useXR } from '@react-three/xr';
import CameraView from './CameraView';
import HandTracker from './HandTracker';
import Scene from './Scene';

function ARContent({ handGestures, placedObjects, selectedObjectId, setPlacedObjects }) {
  const { isPresenting } = useXR();

  return (
    <>
      <Controllers />
      <Scene 
        handGestures={handGestures}
        placedObjects={placedObjects}
        selectedObjectId={selectedObjectId}
        setPlacedObjects={setPlacedObjects}
        isPresenting={isPresenting}
      />
    </>
  );
}

function ARExperience({ 
  arSupported,
  placedObjects,
  setPlacedObjects,
  selectedObjectId,
  setSelectedObjectId 
}) {
  const videoRef = useRef(null);
  const [handGestures, setHandGestures] = useState([]);

  const handleGestureDetected = (gestures) => {
    setHandGestures(gestures);
  };

  return (
    <div className="relative w-full h-full">
      {/* Camera feed layer */}
      <div className="absolute inset-0 z-0">
        <CameraView videoRef={videoRef} />
      </div>
      
      <HandTracker 
        videoRef={videoRef}
        onGestureDetected={handleGestureDetected}
      />
      
      {/* Three.js scene layer */}
      <div className="absolute inset-0 z-10" style={{ pointerEvents: 'none' }}>
        <Canvas>
          <XR
            referenceSpace="local"
            mode="immersive-ar"
          >
            <ARContent 
              handGestures={handGestures}
              placedObjects={placedObjects}
              selectedObjectId={selectedObjectId}
              setPlacedObjects={setPlacedObjects}
            />
          </XR>
        </Canvas>
      </div>
    </div>
  );
}

export default ARExperience;