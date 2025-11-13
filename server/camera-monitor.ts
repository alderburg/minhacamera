
import { db } from "./db";
import { cameras } from "@shared/schema";
import { eq } from "drizzle-orm";
import { checkCameraHealth } from "./camera-health";

interface CameraStatusChange {
  cameraId: number;
  cameraNome: string;
  wasOnline: boolean;
  isOnline: boolean;
  timestamp: Date;
}

const statusChangeListeners: Array<(change: CameraStatusChange) => void> = [];

export function onCameraStatusChange(listener: (change: CameraStatusChange) => void) {
  statusChangeListeners.push(listener);
}

export async function monitorCameras() {
  const allCameras = await db.select().from(cameras);

  for (const camera of allCameras) {
    const health = await checkCameraHealth(camera.urlConexao, camera.ip, 5000);
    const wasOnline = camera.online ?? false;
    const isOnline = health.online;

    // Update camera status in database if changed
    if (wasOnline !== isOnline) {
      try {
        await db
          .update(cameras)
          .set({ online: isOnline })
          .where(eq(cameras.id, camera.id));

        // Notify listeners
        const statusChange: CameraStatusChange = {
          cameraId: camera.id,
          cameraNome: camera.nome,
          wasOnline,
          isOnline,
          timestamp: new Date(),
        };

        statusChangeListeners.forEach(listener => {
          try {
            listener(statusChange);
          } catch (error) {
            console.error('Error in status change listener:', error);
          }
        });
      } catch (error) {
        console.error(`Error updating camera ${camera.id} status:`, error);
      }
    } else if (camera.online !== isOnline) {
      // Update even if same status but database is outdated
      try {
        await db
          .update(cameras)
          .set({ online: isOnline })
          .where(eq(cameras.id, camera.id));
      } catch (error) {
        console.error(`Error updating camera ${camera.id} status:`, error);
      }
    }
  }
}

let monitoringInterval: NodeJS.Timeout | null = null;

export function startCameraMonitoring(intervalMs = 30000) {
  if (monitoringInterval) {
    console.log('Camera monitoring already running');
    return;
  }

  console.log(`Starting camera monitoring (every ${intervalMs}ms)`);
  
  // Run immediately
  monitorCameras().catch(console.error);
  
  // Then run periodically
  monitoringInterval = setInterval(() => {
    monitorCameras().catch(console.error);
  }, intervalMs);
}

export function stopCameraMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log('Camera monitoring stopped');
  }
}
