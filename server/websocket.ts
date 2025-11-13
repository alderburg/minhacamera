
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

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
  if (!wss) return;

  const message = JSON.stringify({
    type: 'camera-status-change',
    data,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function broadcastNotification(notification: {
  id: number;
  title: string;
  message: string;
  type: string;
  createdAt: Date;
}) {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'notification',
    data: notification,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function getWebSocketServer() {
  return wss;
}
