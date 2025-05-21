import React from 'react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

function CameraView({ videoRef }: CameraViewProps) {
  return (
    <div className="fixed inset-0">
      <video 
        ref={videoRef}
        className="absolute object-cover w-full h-full"
        playsInline
      />
    </div>
  );
}

export default CameraView;