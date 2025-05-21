import React, { useState } from 'react';
import { Info, Hand } from 'lucide-react';

import ARExperience from './components/ARExperience';
import Instructions from './components/Instructions';

function App() {
  const [showInstructions, setShowInstructions] = useState(true);
  const [arSupported, setARSupported] = useState<boolean | null>(null);
  const [placedObjects, setPlacedObjects] = useState<{position: [number, number, number], id: number}[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);

  // Check for WebXR support
  React.useEffect(() => {
    const checkARSupport = async () => {
      try {
        if (!window.isSecureContext) {
          console.warn('AR requires HTTPS or localhost for secure context');
          setARSupported(false);
          return;
        }

        if (!navigator.xr) {
          console.warn('WebXR not available in this browser');
          setARSupported(false);
          return;
        }

        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        console.log('AR support check result:', supported);
        setARSupported(supported);
      } catch (error) {
        console.error('Error checking AR support:', error);
        setARSupported(false);
      }
    };

    checkARSupport();
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900">
      <ARExperience 
        arSupported={arSupported} 
        placedObjects={placedObjects}
        setPlacedObjects={setPlacedObjects}
        selectedObjectId={selectedObjectId}
        setSelectedObjectId={setSelectedObjectId}
      />
      
      {/* Instructions button */}
      <button 
        onClick={() => setShowInstructions(!showInstructions)}
        className="absolute top-4 right-4 z-50 p-3 bg-slate-800/70 text-white rounded-full hover:bg-slate-700/70 transition-colors"
        aria-label="Show instructions"
      >
        <Info size={24} />
      </button>

      {/* Instructions panel */}
      {showInstructions && (
        <Instructions onClose={() => setShowInstructions(false)} />
      )}

      {/* Status indicator */}
      <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-slate-800/70 text-white px-4 py-2 rounded-full z-50">
        <Hand size={20} />
        <span className="text-sm font-medium">
          {arSupported === null 
            ? 'Checking AR support...' 
            : arSupported 
              ? 'AR Mode Active' 
              : 'Fallback Mode (Camera Only)'}
        </span>
      </div>
    </div>
  );
}

export default App;