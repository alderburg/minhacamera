import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRequireAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Video, Loader2, MapPin, Edit, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CameraStatus } from "@/components/camera-status";
import type { Camera, InsertCamera, Empresa, Cliente } from "@shared/schema";

export default function CamerasManagement() {
  const { user, isLoading: authLoading } = useRequireAuth(["super_admin", "admin"]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [deletingCamera, setDeletingCamera] = useState<Camera | null>(null);
  const [selectedClientes, setSelectedClientes] = useState<number[]>([]);
  const [formData, setFormData] = useState<InsertCamera>({
    nome: "",
    urlRtsp: "",
    empresaId: 0,
    ativa: true,
    localizacao: "",
    diasGravacao: 7,
    resolucaoPreferida: "720p",
  });
  const { toast } = useToast();

  const isSuperAdmin = user?.tipo === "super_admin";

  const { data: cameras, isLoading } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
    enabled: !!user,
  });

  const { data: empresas } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
    enabled: isSuperAdmin,
  });

  const { data: clientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCamera) => {
      if (editingCamera) {
        return await apiRequest("PATCH", `/api/cameras/${editingCamera.id}`, data);
      }
      return await apiRequest("POST", "/api/cameras", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      setIsDialogOpen(false);
      setEditingCamera(null);
      setFormData({
        nome: "",
        urlRtsp: "",
        empresaId: 0,
        ativa: true,
        localizacao: "",
        diasGravacao: 7,
        resolucaoPreferida: "720p",
      });
      toast({
        title: editingCamera ? "Câmera atualizada" : "Câmera criada",
        description: editingCamera ? "A câmera foi atualizada com sucesso" : "A câmera foi criada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: editingCamera ? "Erro ao atualizar câmera" : "Erro ao criar câmera",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/cameras/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      setIsDeleteDialogOpen(false);
      setDeletingCamera(null);
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

  const updateAccessMutation = useMutation({
    mutationFn: async (data: { cameraId: number; clienteIds: number[] }) => {
      return await apiRequest("POST", "/api/camera-acessos", data);
    },
    onSuccess: () => {
      setIsAccessDialogOpen(false);
      setSelectedCamera(null);
      setSelectedClientes([]);
      toast({
        title: "Acessos atualizados",
        description: "Os acessos da câmera foram atualizados",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar acessos",
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (camera: Camera) => {
    setEditingCamera(camera);
    setFormData({
      nome: camera.nome,
      urlRtsp: camera.urlRtsp,
      empresaId: camera.empresaId,
      ativa: camera.ativa,
      localizacao: camera.localizacao || "",
      diasGravacao: camera.diasGravacao || 7,
      resolucaoPreferida: camera.resolucaoPreferida || "720p",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (camera: Camera) => {
    setDeletingCamera(camera);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingCamera) {
      deleteMutation.mutate(deletingCamera.id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingCamera(null);
      setFormData({
        nome: "",
        urlRtsp: "",
        empresaId: 0,
        ativa: true,
        localizacao: "",
        diasGravacao: 7,
        resolucaoPreferida: "720p",
      });
    }
    setIsDialogOpen(open);
  };

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCamera) {
      updateAccessMutation.mutate({
        cameraId: selectedCamera.id,
        clienteIds: selectedClientes,
      });
    }
  };

  const openAccessDialog = (camera: Camera) => {
    setSelectedCamera(camera);
    setIsAccessDialogOpen(true);
  };

  const toggleClienteAccess = (clienteId: number) => {
    setSelectedClientes((prev) =>
      prev.includes(clienteId)
        ? prev.filter((id) => id !== clienteId)
        : [...prev, clienteId]
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Câmeras</h1>
          <p className="text-muted-foreground">Gerenciar câmeras do sistema</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-camera">
          <Plus className="h-4 w-4 mr-2" />
          Nova Câmera
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cameras?.map((camera) => (
          <Card key={camera.id} className="hover-elevate" data-testid={`camera-card-${camera.id}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <Video className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate mb-1">{camera.nome}</h3>
                    <CameraStatus online={camera.ativa} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {camera.localizacao && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{camera.localizacao}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono truncate">
                  <span className="truncate">{camera.urlRtsp}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Badge variant={camera.ativa ? "default" : "secondary"} className="text-xs">
                  {camera.ativa ? "Ativa" : "Inativa"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAccessDialog(camera)}
                  data-testid={`button-manage-access-${camera.id}`}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Acessos
                </Button>
                <div className="ml-auto flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(camera)}
                    data-testid={`button-edit-camera-${camera.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(camera)}
                    data-testid={`button-delete-camera-${camera.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cameras?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma câmera cadastrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comece criando sua primeira câmera
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Câmera
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCamera ? "Editar Câmera" : "Nova Câmera"}</DialogTitle>
            <DialogDescription>
              {editingCamera ? "Atualize os dados da câmera" : "Cadastre uma nova câmera IP no sistema"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa *</Label>
                <Select
                  value={formData.empresaId?.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, empresaId: parseInt(value) })
                  }
                  required
                >
                  <SelectTrigger data-testid="select-camera-empresa">
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas?.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id.toString()}>
                        {empresa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Câmera *</Label>
              <Input
                id="nome"
                placeholder="Ex: Câmera Entrada Principal"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                data-testid="input-camera-nome"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="urlRtsp">URL RTSP *</Label>
              <Input
                id="urlRtsp"
                placeholder="rtsp://usuario:senha@ip:porta/stream"
                value={formData.urlRtsp}
                onChange={(e) => setFormData({ ...formData, urlRtsp: e.target.value })}
                required
                className="font-mono text-sm"
                data-testid="input-camera-rtsp"
              />
              <p className="text-xs text-muted-foreground">
                URL completa do stream RTSP da câmera IP
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="localizacao">Localização (opcional)</Label>
              <Input
                id="localizacao"
                placeholder="Ex: Portaria Principal - 1º Andar"
                value={formData.localizacao || ""}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                data-testid="input-camera-localizacao"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diasGravacao">Dias de Gravação</Label>
                <Select
                  value={formData.diasGravacao?.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, diasGravacao: parseInt(value) })
                  }
                >
                  <SelectTrigger data-testid="select-dias-gravacao">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Para uso futuro (gravação)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolucao">Resolução</Label>
                <Select
                  value={formData.resolucaoPreferida}
                  onValueChange={(value) =>
                    setFormData({ ...formData, resolucaoPreferida: value })
                  }
                >
                  <SelectTrigger data-testid="select-resolucao">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">480p</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Para compressão futura
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit-camera"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingCamera ? "Atualizando..." : "Criando..."}
                  </>
                ) : (
                  editingCamera ? "Atualizar Câmera" : "Criar Câmera"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a câmera "{deletingCamera?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Acessos</DialogTitle>
            <DialogDescription>
              {selectedCamera?.nome} - Selecione os clientes que podem visualizar esta câmera
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAccessSubmit} className="space-y-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {clientes?.map((cliente) => (
                <div
                  key={cliente.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover-elevate cursor-pointer"
                  onClick={() => toggleClienteAccess(cliente.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedClientes.includes(cliente.id)}
                    onChange={() => toggleClienteAccess(cliente.id)}
                    className="h-4 w-4"
                    data-testid={`checkbox-cliente-${cliente.id}`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{cliente.nome}</p>
                    <p className="text-xs text-muted-foreground">{cliente.email}</p>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAccessDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateAccessMutation.isPending}
                data-testid="button-submit-access"
              >
                {updateAccessMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Acessos"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
