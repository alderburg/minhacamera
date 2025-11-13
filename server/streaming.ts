
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';

// Configura o path do FFmpeg
const setFfmpegPath = async () => {
  try {
    const { stdout } = await promisify(exec)('which ffmpeg');
    const ffmpegPath = stdout.trim();
    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath);
      console.log('FFmpeg encontrado em:', ffmpegPath);
    }
  } catch (error) {
    console.error('FFmpeg não encontrado no sistema');
  }
};

setFfmpegPath();

const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);

interface StreamSession {
  process: any;
  cameraId: number;
  playlistPath: string;
  streamDir: string;
}

const activeSessions = new Map<number, StreamSession>();

export async function startCameraStream(cameraId: number, rtspUrl: string): Promise<string> {
  // Se já existe uma sessão ativa, retorna o caminho
  if (activeSessions.has(cameraId)) {
    return activeSessions.get(cameraId)!.playlistPath;
  }

  const streamDir = path.join(process.cwd(), 'streams', `camera-${cameraId}`);
  const playlistPath = path.join(streamDir, 'playlist.m3u8');

  // Cria diretório para os arquivos HLS
  await mkdir(streamDir, { recursive: true });

  return new Promise((resolve, reject) => {
    const ffmpegProcess = ffmpeg(rtspUrl)
      .inputOptions([
        '-rtsp_transport', 'tcp',
        '-fflags', 'nobuffer',
        '-flags', 'low_delay',
      ])
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-g', '50',
        '-sc_threshold', '0',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-f', 'hls',
        '-hls_time', '2',
        '-hls_list_size', '3',
        '-hls_flags', 'delete_segments+append_list',
        '-start_number', '0',
      ])
      .output(playlistPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg started:', commandLine);
        activeSessions.set(cameraId, {
          process: ffmpegProcess,
          cameraId,
          playlistPath: `/api/stream/${cameraId}/playlist.m3u8`,
          streamDir,
        });
        resolve(`/api/stream/${cameraId}/playlist.m3u8`);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        stopCameraStream(cameraId);
        reject(err);
      })
      .on('end', () => {
        console.log('FFmpeg process ended');
        stopCameraStream(cameraId);
      });

    ffmpegProcess.run();
  });
}

export async function stopCameraStream(cameraId: number): Promise<void> {
  const session = activeSessions.get(cameraId);
  if (!session) return;

  try {
    session.process.kill('SIGKILL');
    activeSessions.delete(cameraId);
    
    // Limpa arquivos de stream
    await rm(session.streamDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Error stopping stream:', error);
  }
}

export function getStreamPath(cameraId: number): string | null {
  const session = activeSessions.get(cameraId);
  return session ? session.playlistPath : null;
}

export function getStreamDir(cameraId: number): string | null {
  const session = activeSessions.get(cameraId);
  return session ? session.streamDir : null;
}
