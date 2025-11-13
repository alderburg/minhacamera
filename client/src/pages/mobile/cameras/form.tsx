import { MobileTopBar } from "@/components/mobile-top-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useRoute, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { Camera, InsertCamera, Empresa } from "@shared/schema";

export default function MobileCameraForm() {
  const [, params] = useRoute("/mobile/cameras/edit/:id");
  const cameraId = params?.id ? parseInt(params.id) : null;
  const isEditing = !!cameraId;
  const [, setLocation] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.tipo === "super_admin";

  const [formData, setFormData] = useState<InsertCamera>({
    nome: "",
    urlRtsp: "",
    empresaId: user?.empresaId || 0,
    ativa: true,
    localizacao: "",
    diasGravacao: 7,
    resolucaoPreferida: "720p",
  });

  const { data: camera } = useQuery<Camera>({
    queryKey: [`/api/cameras/${cameraId}`],
    enabled: !!cameraId,
  });

  const { data: empresas } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
    enabled: isSuperAdmin,
  });

  useEffect(() => {
    if (camera) {
      setFormData({
        nome: camera.nome,
        urlRtsp: camera.urlRtsp,
        empresaId: camera.empresaId,
        ativa: camera.ativa,
        localizacao: camera.localizacao || "",
        diasGravacao: camera.diasGravacao || 7,
        resolucaoPreferida: camera.resolucaoPreferida || "720p",
      });
    }
  }, [camera]);

  const saveMutation = useMutation({
    mutationFn: async (data: InsertCamera) => {
      if (isEditing) {
        return await apiRequest("PATCH", `/api/cameras/${cameraId}`, data);
      }
      return await apiRequest("POST", "/api/cameras", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      toast({
        title: isEditing ? "Câmera atualizada" : "Câmera criada",
        description: isEditing ? "A câmera foi atualizada com sucesso" : "A câmera foi criada com sucesso",
      });
      setLocation("/mobile/cameras");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: isEditing ? "Erro ao atualizar câmera" : "Erro ao criar câmera",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/cameras/${cameraId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      toast({
        title: "Câmera excluída",
        description: "A câmera foi excluída com sucesso",
      });
      setLocation("/mobile/cameras");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir câmera",
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuperAdmin && !formData.empresaId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione uma empresa",
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (window.confirm("Tem certeza que deseja excluir esta câmera?")) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <MobileTopBar 
        showBack 
        backUrl="/mobile/cameras"
        title={isEditing ? "Editar Câmera" : "Nova Câmera"}
        subtitle={isEditing ? "Atualize os dados da câmera" : "Preencha os dados abaixo"}
      />

      <form onSubmit={handleSubmit} className="pt-20 pb-6">
        <div className="space-y-4 px-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <Label htmlFor="nome" className="text-gray-700 font-semibold mb-2 block">
              Nome da Câmera <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Câmera Entrada Principal"
              required
              className="bg-gray-50 border-gray-200"
            />
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <Label htmlFor="urlRtsp" className="text-gray-700 font-semibold mb-2 block">
              URL RTSP <span className="text-red-500">*</span>
            </Label>
            <Input
              id="urlRtsp"
              value={formData.urlRtsp}
              onChange={(e) => setFormData({ ...formData, urlRtsp: e.target.value })}
              placeholder="rtsp://usuario:senha@ip:porta/stream"
              required
              className="bg-gray-50 border-gray-200"
            />
            <p className="text-xs text-gray-500 mt-2">
              URL de streaming da câmera IP
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <Label htmlFor="localizacao" className="text-gray-700 font-semibold mb-2 block">
              Localização
            </Label>
            <Input
              id="localizacao"
              value={formData.localizacao}
              onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
              placeholder="Ex: Portaria Principal"
              className="bg-gray-50 border-gray-200"
            />
          </div>

          {isSuperAdmin && empresas && (
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <Label htmlFor="empresaId" className="text-gray-700 font-semibold mb-2 block">
                Empresa <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.empresaId?.toString()}
                onValueChange={(value) => setFormData({ ...formData, empresaId: parseInt(value) })}
              >
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id.toString()}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <Label htmlFor="resolucaoPreferida" className="text-gray-700 font-semibold mb-2 block">
              Resolução
            </Label>
            <Select
              value={formData.resolucaoPreferida}
              onValueChange={(value) => setFormData({ ...formData, resolucaoPreferida: value })}
            >
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="Selecione a resolução" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="480p">480p</SelectItem>
                <SelectItem value="720p">720p (HD)</SelectItem>
                <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                <SelectItem value="4K">4K (Ultra HD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <Label htmlFor="diasGravacao" className="text-gray-700 font-semibold mb-2 block">
              Dias de Gravação
            </Label>
            <Input
              id="diasGravacao"
              type="number"
              min="1"
              max="365"
              value={formData.diasGravacao}
              onChange={(e) => setFormData({ ...formData, diasGravacao: parseInt(e.target.value) || 7 })}
              className="bg-gray-50 border-gray-200"
            />
            <p className="text-xs text-gray-500 mt-2">
              Período de retenção das gravações
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ativa" className="text-gray-700 font-semibold">
                  Câmera Ativa
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Câmera disponível para visualização
                </p>
              </div>
              <Switch
                id="ativa"
                checked={formData.ativa}
                onCheckedChange={(checked) => setFormData({ ...formData, ativa: checked })}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3 px-4">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white h-12 text-base font-semibold"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                {isEditing ? "Atualizar Câmera" : "Criar Câmera"}
              </>
            )}
          </Button>

          {isEditing && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 h-12 text-base font-semibold"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-5 w-5 mr-2" />
                  Excluir Câmera
                </>
              )}
            </Button>
          )}
        </div>
      </form>

      <MobileBottomNav />
    </div>
  );
}