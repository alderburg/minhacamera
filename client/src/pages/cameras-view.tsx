import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Grid3x3, Grid2x2, Maximize2, X } from "lucide-react";
import { CameraStatus } from "@/components/camera-status";
import { CameraPlayer } from "@/components/camera-player";
import type { Camera } from "@shared/schema";

type GridLayout = "2x2" | "3x3" | "4x4";

export default function CamerasView() {
  const { user, isLoading: authLoading } = useRequireAuth(["user"]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [gridLayout, setGridLayout] = useState<GridLayout>("2x2");
  const [fullscreenCamera, setFullscreenCamera] = useState<Camera | null>(null);

  const { data: cameras, isLoading } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
    enabled: !!user,
    refetchInterval: 15000, // Refresh every 15 seconds to update camera status
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const gridCols = {
    "2x2": "grid-cols-1 md:grid-cols-2",
    "3x3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    "4x4": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  if (fullscreenCamera) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="h-16 border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{fullscreenCamera.nome}</h2>
            <CameraStatus status={fullscreenCamera.status} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFullscreenCamera(null)}
            data-testid="button-exit-fullscreen"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 p-6">
          <CameraPlayer 
            cameraId={fullscreenCamera.id} 
            className="h-full w-full rounded-lg border overflow-hidden"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-2 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">
            {user?.tipo === "user" ? "Minhas Câmeras" : "Visualização de Câmeras"}
          </h1>
          <p className="text-muted-foreground">
            {cameras?.length || 0} {cameras?.length === 1 ? "câmera disponível" : "câmeras disponíveis"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={gridLayout}
            onValueChange={(value) => setGridLayout(value as GridLayout)}
          >
            <SelectTrigger className="w-32" data-testid="select-grid-layout">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2x2">
                <div className="flex items-center gap-2">
                  <Grid2x2 className="h-4 w-4" />
                  <span>2x2</span>
                </div>
              </SelectItem>
              <SelectItem value="3x3">
                <div className="flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4" />
                  <span>3x3</span>
                </div>
              </SelectItem>
              <SelectItem value="4x4">
                <div className="flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4" />
                  <span>4x4</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {cameras && cameras.length > 0 ? (
        <div className={`grid ${gridCols[gridLayout]} gap-4`}>
          {cameras.map((camera) => (
            <Card
              key={camera.id}
              className="hover-elevate overflow-hidden"
              data-testid={`camera-view-${camera.id}`}
            >
              <CardContent className="p-0">
                <div className="relative aspect-video bg-card">
                  <CameraPlayer 
                    cameraId={camera.id} 
                    className="w-full h-full"
                    autoPlay={false}
                  />

                  <div className="absolute top-3 right-3 flex gap-2">
                    <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md">
                      <CameraStatus online={camera.ativa} showLabel={false} />
                    </div>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-background"
                      onClick={() => setFullscreenCamera(camera)}
                      data-testid={`button-fullscreen-${camera.id}`}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 border-t">
                  <h3 className="font-semibold text-sm truncate">{camera.nome}</h3>
                  {camera.localizacao && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {camera.localizacao}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              Nenhuma câmera disponível para visualização
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}