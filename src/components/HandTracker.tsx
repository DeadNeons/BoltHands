import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { AlertCircle } from 'lucide-react';

import { calculateHandGestures } from '../utils/gestureUtils';
import { HandGesture } from '../types/hand';

interface HandTrackerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onGestureDetected: (gestures: HandGesture[]) => void;
}

function HandTracker({ videoRef, onGestureDetected }: HandTrackerProps) {
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const rafIdRef = useRef<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const gestureStateRef = useRef<Record<string, any>>({});
  const initializationAttempts = useRef(0);
  const detectionStartTime = useRef<number | null>(null);
  const isInitializingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    detectionStartTime.current = Date.now();
    
    const initializeHandLandmarker = async () => {
      if (isInitializingRef.current) return;
      isInitializingRef.current = true;

      try {
        console.log('Initializing MediaPipe...');
        
        // Create a canvas element for WebGL context
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2', {
          preserveDrawingBuffer: true,
          antialias: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false
        });

        if (!gl) {
          throw new Error('WebGL2 not supported');
        }

        // Initialize vision tasks with explicit timeout and retry
        const visionPromise = FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Vision tasks initialization timeout')), 15000);
        });

        const vision = await Promise.race([visionPromise, timeoutPromise]);
        
        if (!isMounted) {
          isInitializingRef.current = false;
          return;
        }
        
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.05, // Further lowered threshold
          minHandPresenceConfidence: 0.05, // Further lowered threshold
          minTrackingConfidence: 0.05 // Further lowered threshold
        });

        if (!isMounted) {
          isInitializingRef.current = false;
          return;
        }

        handLandmarkerRef.current = landmarker;
        console.log('MediaPipe initialized successfully');
        
        // Start camera after successful initialization
        await startCamera();
        isInitializingRef.current = false;

      } catch (error) {
        console.error('Error initializing hand landmarker:', error);
        
        if (!isMounted) {
          isInitializingRef.current = false;
          return;
        }

        // More aggressive retry strategy
        if (initializationAttempts.current < 5) {
          const delay = Math.min(1000 * Math.pow(1.5, initializationAttempts.current), 5000);
          initializationAttempts.current++;
          console.log(`Retrying initialization (attempt ${initializationAttempts.current}/5) in ${delay}ms...`);
          
          setTimeout(() => {
            isInitializingRef.current = false;
            initializeHandLandmarker();
          }, delay);
        } else {
          setCameraError('Failed to initialize hand tracking. Please refresh the page to try again.');
          isInitializingRef.current = false;
        }
      }
    };

    initializeHandLandmarker();

    return () => {
      isMounted = false;
      isInitializingRef.current = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      stopCamera();
    };
  }, []);

  const handleCameraError = (error: Error) => {
    console.error('Camera error:', error);
    
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      setCameraError(
        'Camera access was denied. Please enable camera permissions in your browser settings to use this feature.'
      );
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      setCameraError(
        'No camera device was found. Please ensure your device has a working camera and try again.'
      );
    } else {
      setCameraError(
        'An error occurred while accessing the camera. Please check your camera settings and try again.'
      );
    }
  };

  const startCamera = async () => {
    if (!videoRef?.current) return;

    try {
      console.log('Starting camera...');
      const constraints = { 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 60 }
        } 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
        
        if (videoRef.current) {
          await videoRef.current.play();
          setCameraReady(true);
          setCameraError(null);
          console.log('Camera started, beginning hand detection');
          predictWebcam();
        }
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      try {
        console.log('Trying fallback camera...');
        const fallbackConstraints = { 
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 60 }
          } 
        };
        const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        
        if (videoRef?.current) {
          videoRef.current.srcObject = fallbackStream;
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = resolve;
            }
          });
          
          if (videoRef.current) {
            await videoRef.current.play();
            setCameraReady(true);
            setCameraError(null);
            console.log('Fallback camera started, beginning hand detection');
            predictWebcam();
          }
        }
      } catch (fallbackError: any) {
        handleCameraError(fallbackError);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef?.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  };

  const predictWebcam = async () => {
    if (!handLandmarkerRef.current || !videoRef?.current || !cameraReady) {
      rafIdRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    const video = videoRef.current;
    
    if (video.paused || video.ended) {
      rafIdRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    const startTimeMs = performance.now();

    try {
      const results: HandLandmarkerResult = handLandmarkerRef.current.detectForVideo(video, startTimeMs);
      
      if (results.landmarks && results.landmarks.length > 0) {
        const gestures = calculateHandGestures(results, gestureStateRef.current);
        if (gestures.length > 0) {
          onGestureDetected(gestures);
        }
      }
    } catch (error) {
      console.error('Error in hand detection:', error);
    }

    rafIdRef.current = requestAnimationFrame(predictWebcam);
  };

  if (cameraError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">Camera Access Required</h3>
          </div>
          <p className="text-gray-600 mb-4">{cameraError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry Camera Access
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default HandTracker;