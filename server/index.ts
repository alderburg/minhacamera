import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startCameraMonitoring, onCameraStatusChange } from "./camera-monitor";
import { createNotification } from "./notifications";
import { setupWebSocket, broadcastCameraStatusChange, broadcastNotification } from "./websocket";
import { db } from "./db";
import { cameras } from "@shared/schema";
import { eq } from "drizzle-orm";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);

    // Setup WebSocket
    setupWebSocket(server);

    // Start camera monitoring - check every 30 seconds
    startCameraMonitoring(30000);

    // Listen for camera status changes and create notifications
    onCameraStatusChange(async (change) => {
      try {
        // Broadcast status change via WebSocket
        broadcastCameraStatusChange({
          cameraId: change.cameraId,
          cameraNome: change.cameraNome,
          isOnline: change.isOnline,
          timestamp: change.timestamp,
        });

        // Get camera details to associate notification with company
        const cameraResults = await db.select().from(cameras).where(eq(cameras.id, change.cameraId)).limit(1);
        
        // If camera was deleted during monitoring, skip notification creation
        if (!cameraResults || cameraResults.length === 0) {
          console.warn(`Camera ${change.cameraId} not found - skipping notification creation`);
          return;
        }

        const empresaId = cameraResults[0].empresaId;

        if (!change.isOnline && change.wasOnline) {
          // Camera went offline - create notification
          try {
            const notification = await createNotification(
              'Câmera Offline',
              `A câmera "${change.cameraNome}" está offline.`,
              'error',
              undefined,
              empresaId
            );
            broadcastNotification(notification);
            log(`📹 Camera ${change.cameraNome} went OFFLINE`);
          } catch (error) {
            console.error('Error creating offline notification:', error);
          }
        } else if (change.isOnline && !change.wasOnline) {
          // Camera came back online - create notification
          try {
            const notification = await createNotification(
              'Câmera Online',
              `A câmera "${change.cameraNome}" voltou a ficar online.`,
              'success',
              undefined,
              empresaId
            );
            broadcastNotification(notification);
            log(`📹 Camera ${change.cameraNome} is back ONLINE`);
          } catch (error) {
            console.error('Error creating online notification:', error);
          }
        }
      } catch (error) {
        console.error('Error handling camera status change:', error);
      }
    });
  });
})();