import React from 'react';
import { X, Fingerprint as PinchFingers, Move3d, Maximize, RotateCcw } from 'lucide-react';

interface InstructionsProps {
  onClose: () => void;
}

function Instructions({ onClose }: InstructionsProps) {
  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-40 bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          aria-label="Close instructions"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">AR Hand Tracking</h2>
          <p className="text-gray-600">Use your hands to place and manipulate 3D objects in augmented reality.</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <PinchFingers size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Pinch to Place</h3>
              <p className="text-sm text-gray-600">Pinch your thumb and index finger together to place a 3D cone.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-teal-100 p-2 rounded-lg">
              <Move3d size={24} className="text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Move to Translate</h3>
              <p className="text-sm text-gray-600">Pinch and move your hand to move the selected object.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <RotateCcw size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Rotate Gesture</h3>
              <p className="text-sm text-gray-600">Use two fingers and rotate to change the object's orientation.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Maximize size={24} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Pinch and Spread</h3>
              <p className="text-sm text-gray-600">Pinch with two hands and move apart/together to scale the object.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Note: This experience works best in well-lit environments. For AR mode, use a device that supports WebXR.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Instructions;