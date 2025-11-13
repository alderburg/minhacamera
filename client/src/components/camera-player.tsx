
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, AlertCircle } from "lucide-react";

interface CameraPlayerProps {
  cameraId: number;
  autoPlay?: boolean;
  className?: string;
}

export function CameraPlayer({ cameraId, autoPlay = true, className = "" }: CameraPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startStream = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Inicia o stream no backend
        const response = await fetch(`/api/stream/${cameraId}/start`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Erro ao iniciar stream');
        }

        const { streamUrl } = await response.json();
        const video = videoRef.current;

        if (!video) return;

        // Verifica se o navegador suporta HLS nativamente (Safari)
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
          if (autoPlay) {
            video.play().catch(e => console.error('Autoplay error:', e));
          }
          setIsLoading(false);
        } 
        // Usa HLS.js para outros navegadores
        else if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
          });

          hlsRef.current = hls;
          hls.loadSource(streamUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (autoPlay) {
              video.play().catch(e => console.error('Autoplay error:', e));
            }
            setIsLoading(false);
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error('Network error, tentando recuperar...');
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error('Media error, tentando recuperar...');
                  hls.recoverMediaError();
                  break;
                default:
                  setError('Erro fatal ao carregar stream');
                  hls.destroy();
                  break;
              }
            }
          });
        } else {
          setError('Navegador não suporta HLS');
        }
      } catch (err) {
        console.error('Stream error:', err);
        setError('Erro ao conectar com a câmera');
        setIsLoading(false);
      }
    };

    startStream();

    // Cleanup
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // Para o stream no backend quando o componente é desmontado
      fetch(`/api/stream/${cameraId}/stop`, {
        method: 'POST',
        credentials: 'include',
      }).catch(console.error);
    };
  }, [cameraId, autoPlay]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        controls
        playsInline
        muted
      />
    </div>
  );
}
