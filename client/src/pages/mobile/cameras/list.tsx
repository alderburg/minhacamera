import { MobileTopBar } from "@/components/mobile-top-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Search, Video, MapPin, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CameraStatus } from "@/components/camera-status";
import { useState, useEffect } from "react";
import type { Camera } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MobileCamerasList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: cameras, isLoading } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/cameras/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      toast({
        title: "Câmera excluída",
        description: "A câmera foi excluída com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir câmera",
        description: error.message,
      });
    },
  });

  const handleDelete = (e: React.MouseEvent, id: number, nome: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir a câmera "${nome}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCameras = cameras?.filter(camera =>
    camera.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    camera.localizacao?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 overflow-x-hidden">
      <MobileTopBar
        showBack
        backUrl="/dashboard"
        title="Câmeras"
        subtitle={`${filteredCameras.length} câmeras cadastradas`}
        rightAction={
          <Link href="/mobile/cameras/new">
            <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              <Plus className="h-5 w-5 text-white" />
            </button>
          </Link>
        }
      />

      <div className="p-4 pt-20 space-y-4">
        <div className="mb-4 px-0 md:px-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar câmera..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Carregando câmeras...</p>
            </div>
          </div>
        ) : filteredCameras.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Video className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center mb-2">
              {searchTerm ? "Nenhuma câmera encontrada" : "Nenhuma câmera cadastrada"}
            </p>
            <Link href="/mobile/cameras/new">
              <button className="text-blue-600 font-medium hover:underline">
                Cadastrar primeira câmera
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 px-0 md:px-0">
            {filteredCameras.map((camera) => (
              <div key={camera.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                  <Video className="h-12 w-12 text-gray-600" />
                  <div className="absolute top-2 right-2">
                    <CameraStatus online={camera.ativa} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">{camera.nome}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/mobile/cameras/edit/${camera.id}`}>
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </button>
                      </Link>
                      <button
                        onClick={(e) => handleDelete(e, camera.id, camera.nome)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  {camera.localizacao && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{camera.localizacao}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {camera.resolucaoPreferida || "720p"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {camera.diasGravacao || 7} dias
                    </Badge>
                    {camera.ativa ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                        Ativa
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Inativa
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}