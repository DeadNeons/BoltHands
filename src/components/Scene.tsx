import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useXR } from '@react-three/xr';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

import { HandGesture } from '../types/hand';
import ConeObject from './objects/ConeObject';

interface SceneProps {
  handGestures: HandGesture[];
  placedObjects: {position: [number, number, number], id: number}[];
  selectedObjectId: number | null;
  setPlacedObjects: React.Dispatch<React.SetStateAction<{position: [number, number, number], id: number}[]>>;
  isPresenting: boolean;
}

function Scene({ 
  handGestures = [], 
  placedObjects = [], 
  selectedObjectId,
  setPlacedObjects,
  isPresenting 
}: SceneProps) {
  const { scene, camera } = useThree();
  const { session, isPresenting: isXRPresenting } = useXR();
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const lastPinchPositionRef = useRef<THREE.Vector3 | null>(null);
  
  // Initialize scene and camera
  useEffect(() => {
    let mounted = true;

    const initializeScene = async () => {
      if (!mounted) return;

      scene.background = null;
      scene.fog = null;
      
      // Only set camera position when not in XR mode
      if (!isXRPresenting) {
        camera.position.set(0, 1.6, 3);
        camera.lookAt(0, 1.6, 0);
      }

      // Log XR session state
      if (session) {
        try {
          const referenceSpace = await session.requestReferenceSpace('local');
          if (!mounted) return;

          console.log('XR session active:', {
            mode: session.mode,
            frameRate: session.frameRate,
            referenceSpace: referenceSpace
          });
        } catch (error) {
          console.warn('Failed to initialize XR reference space:', error);
        }
      }
    };

    initializeScene();

    return () => {
      mounted = false;
    };
  }, [scene, camera, isXRPresenting, session]);

  // Handle pinch gesture for object creation
  useEffect(() => {
    if (!session) return;

    const pinchGesture = handGestures.find(
      gesture => gesture.type === 'pinch' && gesture.state === 'start'
    );

    if (pinchGesture) {
      try {
        // Convert pinch position to AR space
        const position = new THREE.Vector3(
          pinchGesture.position.x,
          pinchGesture.position.y,
          pinchGesture.position.z
        );

        // Create new object at the pinch position
        const newObject = {
          position: [position.x, position.y, position.z] as [number, number, number],
          id: Date.now()
        };
        
        setPlacedObjects(prev => [...prev, newObject]);
      } catch (error) {
        console.warn('Error creating object at pinch position:', error);
      }
    }
  }, [handGestures, setPlacedObjects, session]);

  // Handle object movement
  useEffect(() => {
    if (selectedObjectId === null || !session) {
      lastPinchPositionRef.current = null;
      return;
    }

    const pinchGesture = handGestures.find(
      gesture => gesture.type === 'pinch' && gesture.state === 'move'
    );

    if (pinchGesture) {
      try {
        const currentPosition = new THREE.Vector3(
          pinchGesture.position.x,
          pinchGesture.position.y,
          pinchGesture.position.z
        );

        if (lastPinchPositionRef.current) {
          const delta = currentPosition.clone().sub(lastPinchPositionRef.current);
          
          setPlacedObjects(prev => prev.map(obj => {
            if (obj.id === selectedObjectId) {
              return {
                ...obj,
                position: [
                  obj.position[0] + delta.x,
                  obj.position[1] + delta.y,
                  obj.position[2] + delta.z
                ]
              };
            }
            return obj;
          }));
        }
        
        lastPinchPositionRef.current = currentPosition;
      } catch (error) {
        console.warn('Error updating object position:', error);
        lastPinchPositionRef.current = null;
      }
    }
  }, [handGestures, selectedObjectId, setPlacedObjects, session]);

  // Update light position to follow camera
  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.position.copy(camera.position);
    }
  });

  return (
    <>
      <Environment preset="apartment" />
      
      <directionalLight 
        ref={lightRef}
        intensity={isXRPresenting ? 0.5 : 1.0} 
        position={[0, 2, 1]} 
        castShadow 
      />
      
      <ambientLight intensity={0.5} />
      
      {placedObjects.map((object) => (
        <ConeObject 
          key={object.id}
          position={object.position} 
          isSelected={object.id === selectedObjectId} 
        />
      ))}
      
      {!isXRPresenting && (
        <gridHelper 
          args={[10, 10, 0x888888, 0x444444]} 
          position={[0, -0.01, 0]} 
          rotation={[0, 0, 0]} 
        />
      )}
    </>
  );
}

export default Scene;