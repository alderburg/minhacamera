import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { Notification } from '@shared/schema';

const clients = new Set<WebSocket>();

interface WebSocketClient extends WebSocket {
  isAlive: boolean;
}

let wss: WebSocketServer | null = null;

export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({
    server,
    path: '/ws'
  });

  wss.on('connection', (ws: WebSocketClient) => {
    console.log('WebSocket client connected');
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connected', timestamp: new Date() }));
  });

  // Heartbeat to detect broken connections
  const interval = setInterval(() => {
    if (!wss) return;

    wss.clients.forEach((ws: WebSocket) => {
      const client = ws as WebSocketClient;
      if (client.isAlive === false) {
        return client.terminate();
      }

      client.isAlive = false;
      client.ping();
    });
  }, 30000); // 30 seconds

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('WebSocket server initialized');
  return wss;
}

export function broadcastCameraStatusChange(data: {
  cameraId: number;
  cameraNome: string;
  isOnline: boolean;
  timestamp: Date;
}) {
  if (!wss) {
    console.log('⚠️ WebSocket server not initialized, cannot broadcast camera status');
    return;
  }

  const message = JSON.stringify({
    type: 'camera-status-change',
    data,
  });

  let sentCount = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sentCount++;
    }
  });

  console.log(`📹 Broadcast camera status change to ${sentCount} client(s):`, data.cameraNome, data.isOnline ? 'ONLINE' : 'OFFLINE');
}

export function broadcastNotification(notification: {
  id: number;
  title: string;
  message: string;
  type: string;
  createdAt: Date;
}) {
  if (!wss) {
    console.log('⚠️ WebSocket server not initialized, cannot broadcast notification');
    return;
  }

  const message = JSON.stringify({
    type: 'notification',
    data: notification,
  });

  let sentCount = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sentCount++;
    }
  });

  console.log(`🔔 Broadcast notification to ${sentCount} client(s):`, notification.title);
}

export function getWebSocketServer() {
  return wss;
}