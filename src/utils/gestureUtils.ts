import { HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { HandGesture } from '../types/hand';
import * as THREE from 'three';

const THUMB_TIP = 4;
const INDEX_FINGER_TIP = 8;
const PINCH_THRESHOLD = 0.05; // Adjusted threshold for better detection

const calculateDistance = (p1: THREE.Vector3, p2: THREE.Vector3): number => {
  return p1.distanceTo(p2);
};

const convertToThreeSpace = (
  landmark: { x: number; y: number; z: number }, 
  handIndex: number
): THREE.Vector3 => {
  // Convert from normalized coordinates (0-1) to world space (-1 to 1)
  const x = (landmark.x - 0.5) * 2;
  const y = (landmark.y - 0.5) * -2; // Flip Y axis to match camera
  const z = landmark.z * -2; // Flip Z axis for correct depth
  
  return new THREE.Vector3(x, y, z);
};

const detectPinchGesture = (
  handLandmarks: { x: number; y: number; z: number }[],
  handIndex: number,
  gestureState: Record<string, any>
): HandGesture | null => {
  const handStateKey = `hand_${handIndex}_pinch`;
  const prevState = gestureState[handStateKey] || {
    isPinching: false,
    startPosition: null
  };
  
  const thumbTip = convertToThreeSpace(handLandmarks[THUMB_TIP], handIndex);
  const indexTip = convertToThreeSpace(handLandmarks[INDEX_FINGER_TIP], handIndex);
  
  const distance = calculateDistance(thumbTip, indexTip);
  const isPinching = distance < PINCH_THRESHOLD;
  
  const pinchPosition = new THREE.Vector3().addVectors(thumbTip, indexTip).multiplyScalar(0.5);
  
  let gestureType: HandGesture['state'] = 'move';
  
  if (isPinching && !prevState.isPinching) {
    gestureType = 'start';
    console.log('Pinch gesture started:', {
      position: pinchPosition.toArray(),
      distance
    });
  } else if (!isPinching && prevState.isPinching) {
    gestureType = 'end';
    console.log('Pinch gesture ended');
  } else if (!isPinching) {
    gestureState[handStateKey] = {
      isPinching: false,
      startPosition: null
    };
    return null;
  }
  
  gestureState[handStateKey] = {
    isPinching,
    startPosition: gestureType === 'start' ? pinchPosition : prevState.startPosition
  };
  
  return {
    type: 'pinch',
    state: gestureType,
    position: {
      x: pinchPosition.x,
      y: pinchPosition.y,
      z: pinchPosition.z
    },
    handIndex,
    confidence: 1.0
  };
};

export const calculateHandGestures = (
  results: HandLandmarkerResult,
  gestureState: Record<string, any>
): HandGesture[] => {
  const gestures: HandGesture[] = [];
  
  if (!results.landmarks || results.landmarks.length === 0) {
    return gestures;
  }
  
  results.landmarks.forEach((handLandmarks, handIndex) => {
    const pinch = detectPinchGesture(handLandmarks, handIndex, gestureState);
    if (pinch) {
      gestures.push(pinch);
    }
  });
  
  return gestures;
};