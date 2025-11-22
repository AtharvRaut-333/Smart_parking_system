import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import webSocketService from '../services/WebSocketService';

export const useWebSocket = () => {
  // Fix: Use currentUser from state.user
  const currentUser = useSelector(state => state.user?.currentUser || null);
  const isConnected = useRef(false);

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        await webSocketService.connect();
        isConnected.current = true;
        console.log('WebSocket connected successfully');
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        isConnected.current = false;
      }
    };

    connectWebSocket();

    return () => {
      webSocketService.disconnect();
      isConnected.current = false;
    };
  }, []);

  const reserveSlot = useCallback((slotId, parkingSpaceId) => {
    console.log('Reserve slot called, currentUser:', currentUser); // Debug log
    
    // Fix: Check for userId instead of id
    if (!currentUser || !currentUser.userId) {
      console.warn('User not logged in - cannot reserve slot', currentUser);
      return false;
    }

    webSocketService.reserveSlot(
      slotId, 
      parkingSpaceId, 
      currentUser.userId, // Fix: Use userId
      currentUser.fullname || currentUser.name || 'Anonymous User'
    );
    return true;
  }, [currentUser]);

  const releaseSlot = useCallback((slotId, parkingSpaceId) => {
    console.log('Release slot called, currentUser:', currentUser); // Debug log
    
    // Fix: Check for userId instead of id
    if (!currentUser || !currentUser.userId) {
      console.warn('User not logged in - cannot release slot', currentUser);
      return false;
    }

    webSocketService.releaseSlot(
      slotId, 
      parkingSpaceId, 
      currentUser.userId, // Fix: Use userId
      currentUser.fullname || currentUser.name || 'Anonymous User'
    );
    return true;
  }, [currentUser]);

  const subscribeToSlotUpdates = useCallback((parkingSpaceId, callback) => {
    return webSocketService.subscribeToSlotUpdates(parkingSpaceId, callback);
  }, []);

  const subscribeToGlobalSlots = useCallback((callback) => {
    return webSocketService.subscribeToGlobalSlots(callback);
  }, []);

  const subscribeToParkingSpaces = useCallback((callback) => {
    return webSocketService.subscribeToParkingSpaces(callback);
  }, []);

  return {
    isConnected: isConnected.current,
    user: currentUser, // Return as 'user' for consistency in components
    currentUser, // Also return as currentUser if needed
    reserveSlot,
    releaseSlot,
    subscribeToSlotUpdates,
    subscribeToGlobalSlots,
    subscribeToParkingSpaces,
    webSocketService
  };
};

export default useWebSocket;