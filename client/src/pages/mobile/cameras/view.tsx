import { MobileTopBar } from "@/components/mobile-top-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Video, MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CameraStatus } from "@/components/camera-status";
import { CameraPlayer } from "@/components/camera-player";
import { useEffect } from "react";
import type { Camera } from "@shared/schema";

export default function MobileCameraView() {
  const [, params] = useRoute("/mobile/cameras/view/:id");
  const cameraId = params?.id ? parseInt(params.id) : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: camera, isLoading } = useQuery<Camera>({
    queryKey: ["/api/cameras", cameraId],
    enabled: !!cameraId,
    refetchInterval: 15000,
  });

  if (isLoading || !camera) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
        <MobileTopBar
          showBack
          backUrl="/mobile/cameras"
          title="Câmera"
          icon={Video}
        />
        <div className="flex items-center justify-center py-12 pt-24">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Carregando câmera...</p>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden pb-16">
      <MobileTopBar
        showBack
        backUrl="/mobile/cameras"
        title={camera.nome}
        icon={Video}
      />

      <div className="flex-1 overflow-y-auto pt-16 pb-4">
        <div className="p-4 space-y-4">
          {/* Status Section */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Status da Câmera</h3>
              <CameraStatus status={camera.status as 'online' | 'offline' | 'error' | 'disabled'} />
            </div>
            {camera.localizacao && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <MapPin className="h-4 w-4" />
                <span>{camera.localizacao}</span>
              </div>
            )}
          </div>

          {/* Live View */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Visualização ao Vivo</h3>
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              {camera.status === 'online' ? (
                <CameraPlayer cameraId={camera.id} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                  <Video className="h-12 w-12 mb-2" />
                  <p className="text-sm">Câmera {camera.status === 'disabled' ? 'desativada' : 'offline'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Camera Details */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Detalhes da Câmera</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Protocolo</span>
                <Badge variant="outline">{camera.protocolo}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Resolução</span>
                <Badge variant="outline">{camera.resolucaoPreferida || "720p"}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Gravação</span>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span>{camera.diasGravacao || 7} dias</span>
                </div>
              </div>
              {camera.ip && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Endereço IP</span>
                  <span className="text-sm font-mono">{camera.ip}</span>
                </div>
              )}
              {camera.porta && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Porta</span>
                  <span className="text-sm font-mono">{camera.porta}</span>
                </div>
              )}
            </div>
          </div>

          {/* Connection Info */}
          {camera.urlConexao && (
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Informações de Conexão</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500">URL de Conexão</span>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1 break-all">
                    {camera.urlConexao}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
