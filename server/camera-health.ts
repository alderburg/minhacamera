import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CameraHealthResult {
  online: boolean;
  latency?: number;
  error?: string;
}

export async function checkCameraHealth(urlConexao: string | null, ip: string | null, timeout = 3000): Promise<CameraHealthResult> {
  if (!urlConexao && !ip) {
    return { online: false, error: 'No connection URL or IP configured' };
  }

  try {
    // Try to extract IP from URL if no IP is provided
    let targetIp = ip;
    if (!targetIp && urlConexao) {
      const urlMatch = urlConexao.match(/(?:rtsp|http|https):\/\/([^:@\/]+)/);
      if (urlMatch) {
        targetIp = urlMatch[1];
      }
    }

    if (!targetIp) {
      return { online: false, error: 'Could not determine target IP' };
    }

    // Use ping to check if camera is reachable
    const startTime = Date.now();
    const { stdout } = await execAsync(`ping -c 1 -W ${Math.floor(timeout / 1000)} ${targetIp}`, {
      timeout,
    });
    const latency = Date.now() - startTime;

    // Check if ping was successful
    const packetLoss = stdout.match(/(\d+)% packet loss/);
    if (packetLoss && packetLoss[1] === '0') {
      return { online: true, latency };
    }

    return { online: false, error: 'Packet loss detected' };
  } catch (error) {
    return { 
      online: false, 
      error: error instanceof Error ? error.message : 'Connection failed' 
    };
  }
}

export async function checkMultipleCameras(cameras: Array<{ id: number; urlConexao: string | null; ip: string | null }>): Promise<Map<number, boolean>> {
  const healthChecks = cameras.map(async (camera) => {
    const health = await checkCameraHealth(camera.urlConexao, camera.ip);
    return { id: camera.id, online: health.online };
  });

  const results = await Promise.all(healthChecks);
  
  return new Map(results.map(r => [r.id, r.online]));
}
