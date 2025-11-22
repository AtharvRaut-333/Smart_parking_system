import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }

      // Use environment variable or fallback to localhost
      const socketUrl = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/ws` 
        : 'http://localhost:8081/ws';

      this.client = new Client({
        webSocketFactory: () => new SockJS(socketUrl),
        connectHeaders: {},
        debug: (str) => {
          console.log('WebSocket Debug:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = (frame) => {
        console.log('WebSocket Connected:', frame);
        this.connected = true;
        this.reconnectAttempts = 0;
        resolve();
      };

      this.client.onStompError = (frame) => {
        console.error('WebSocket STOMP Error:', frame);
        this.connected = false;
        reject(new Error('WebSocket connection failed'));
      };

      this.client.onWebSocketError = (error) => {
        console.error('WebSocket Error:', error);
        this.connected = false;
      };

      this.client.onDisconnect = () => {
        console.log('WebSocket Disconnected');
        this.connected = false;
        this.handleReconnect();
      };

      try {
        this.client.activate();
      } catch (error) {
        console.error('Failed to activate WebSocket client:', error);
        reject(error);
      }
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.connect().catch(console.error);
      }, 5000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.client && this.connected) {
      this.subscriptions.clear();
      this.client.deactivate();
      this.connected = false;
    }
  }

  subscribe(destination, callback) {
    if (!this.connected) {
      console.warn('WebSocket not connected. Attempting to connect...');
      this.connect().then(() => {
        this.subscribe(destination, callback);
      });
      return;
    }

    console.log(' === WebSocketService: SUBSCRIBING ===');
    console.log(' Destination:', destination);
    console.log(' Client connected:', this.connected);
    console.log(' Client object:', this.client);

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        console.log(' === WebSocketService: MESSAGE RECEIVED ===');
        console.log(' From:', destination);
        console.log(' Raw message:', message);
        console.log(' Parsed data:', data);
        callback(data);
      } catch (error) {
        console.error(' Error parsing WebSocket message:', error, message);
        console.log(' Raw message body:', message.body);
      }
    });

    this.subscriptions.set(destination, subscription);
    console.log(' Subscription created successfully:', subscription);
    console.log(' Total subscriptions:', this.subscriptions.size);
    return subscription;
  }

  unsubscribe(destination) {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  send(destination, data) {
    if (!this.connected) {
      console.warn('WebSocket not connected. Cannot send message.');
      return;
    }

    console.log('=== WebSocketService: SENDING MESSAGE ===');
    console.log('Destination:', destination);
    console.log('Data:', data);

    this.client.publish({
      destination,
      body: JSON.stringify(data)
    });
  }

  // Slot-specific methods
  reserveSlot(slotId, parkingSpaceId, userId, userName) {
    const payload = {
      slotId,
      parkingSpaceId,
      userId,
      userName,
      reservationTimeoutMinutes: 5
    };
    
    console.log('=== WebSocketService: SENDING RESERVE REQUEST ===');
    console.log('Payload:', payload);
    console.log('Destination: /app/slot.reserve');
    
    this.send('/app/slot.reserve', payload);
  }

  releaseSlot(slotId, parkingSpaceId, userId, userName) {
    const payload = {
      slotId,
      parkingSpaceId,
      userId,
      userName
    };
    
    console.log('=== WebSocketService: SENDING RELEASE REQUEST ===');
    console.log('Payload:', payload);
    console.log('Destination: /app/slot.release');
    
    this.send('/app/slot.release', payload);
  }

  subscribeToParkingSpace(parkingSpaceId) {
    console.log('=== WebSocketService: SENDING PARKING SPACE SUBSCRIBE REQUEST ===');
    console.log('Payload:', parkingSpaceId);
    console.log('Destination: /app/parking-space.subscribe');
    
    this.send('/app/parking-space.subscribe', parkingSpaceId);
  }

  // Subscribe to slot updates for a specific parking space
  subscribeToSlotUpdates(parkingSpaceId, callback) {
    return this.subscribe(`/topic/parking-space/${parkingSpaceId}`, callback);
  }

  // Subscribe to global slot updates
  subscribeToGlobalSlots(callback) {
    return this.subscribe('/topic/slots', callback);
  }

  // Subscribe to parking space availability updates
  subscribeToParkingSpaces(callback) {
    return this.subscribe('/topic/parking-spaces', callback);
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;