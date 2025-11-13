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
import { Plus, Video, Loader2, MapPin, Edit, Pencil, Trash2, X, Maximize2, Users, Search, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CameraStatus } from "@/components/camera-status";
import { CameraPlayer } from "@/components/camera-player";
import type { Camera, InsertCamera, Empresa, Cliente } from "@shared/schema";

export default function CamerasManagement() {
  const { user, isLoading: authLoading } = useRequireAuth(["super_admin", "admin"]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [deletingCamera, setDeletingCamera] = useState<Camera | null>(null);
  const [fullscreenCamera, setFullscreenCamera] = useState<Camera | null>(null);
  const [selectedClientes, setSelectedClientes] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cameraSearchTerm, setCameraSearchTerm] = useState("");
  const [empresaSearchTerm, setEmpresaSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
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
      resetForm();
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

    // Buscar e definir a empresa selecionada
    const empresa = empresas?.find(e => e.id === camera.empresaId);
    if (empresa) {
      setSelectedEmpresa(empresa);
      setEmpresaSearchTerm(empresa.nome);
    }

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

  const resetForm = () => {
    setEditingCamera(null);
    setSelectedEmpresa(null);
    setEmpresaSearchTerm("");
    setFormData({
      nome: "",
      urlRtsp: "",
      empresaId: 0,
      ativa: true,
      localizacao: "",
      diasGravacao: 7,
      resolucaoPreferida: "720p",
    });
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
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
    setSearchTerm("");
    setIsAccessDialogOpen(true);
  };

  const addClienteAccess = (clienteId: number) => {
    if (!selectedClientes.includes(clienteId)) {
      setSelectedClientes((prev) => [...prev, clienteId]);
      setSearchTerm("");
    }
  };

  const removeClienteAccess = (clienteId: number) => {
    setSelectedClientes((prev) => prev.filter((id) => id !== clienteId));
  };

  const handleSelectEmpresa = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    setFormData({ ...formData, empresaId: empresa.id });
    setEmpresaSearchTerm(empresa.nome);
  };

  const handleRemoveEmpresa = () => {
    setSelectedEmpresa(null);
    setFormData({ ...formData, empresaId: 0 });
    setEmpresaSearchTerm("");
  };

  const filteredEmpresas = empresas?.filter((empresa) => {
    if (!empresaSearchTerm) return true;
    const search = empresaSearchTerm.toLowerCase();
    return (
      empresa.nome.toLowerCase().includes(search) ||
      empresa.dominio?.toLowerCase().includes(search)
    );
  }).filter((empresa) => !selectedEmpresa || empresa.id !== selectedEmpresa.id);

  const filteredClientes = clientes?.filter((cliente) => {
    if (!searchTerm) return false;
    const search = searchTerm.toLowerCase();
    return (
      cliente.nome.toLowerCase().includes(search) ||
      cliente.email.toLowerCase().includes(search)
    );
  }).filter((cliente) => !selectedClientes.includes(cliente.id));

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleNewCamera = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Filtro e Paginação
  const filteredCameras = cameras?.filter((camera) => {
    if (!cameraSearchTerm) return true;
    const search = cameraSearchTerm.toLowerCase();
    return (
      camera.nome.toLowerCase().includes(search) ||
      camera.localizacao?.toLowerCase().includes(search) ||
      camera.urlRtsp.toLowerCase().includes(search)
    );
  }) || [];

  const totalItems = filteredCameras.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCameras = filteredCameras.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  if (fullscreenCamera) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="h-16 border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{fullscreenCamera.nome}</h2>
            <CameraStatus online={fullscreenCamera.ativa} />
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
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Câmeras</h1>
          <p className="text-muted-foreground">Gerenciar câmeras do sistema</p>
        </div>
        <Button onClick={handleNewCamera} data-testid="button-add-camera">
          <Plus className="h-4 w-4 mr-2" />
          Nova Câmera
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar câmeras por nome, localização ou URL..."
          value={cameraSearchTerm}
          onChange={(e) => {
            setCameraSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentCameras.map((camera) => (
          <Card
            key={camera.id}
            className="hover-elevate cursor-pointer"
            data-testid={`camera-card-${camera.id}`}
            onClick={() => setFullscreenCamera(camera)}
          >
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

              <div className="mt-4 flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                <Badge variant={camera.ativa ? "default" : "secondary"} className="text-xs">
                  {camera.ativa ? "Ativa" : "Inativa"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openAccessDialog(camera);
                  }}
                  data-testid={`button-manage-access-${camera.id}`}
                >
                  <Users className="h-3 w-3 mr-1" />
                  Acessos
                </Button>
                <div className="ml-auto flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullscreenCamera(camera);
                    }}
                    data-testid={`button-view-camera-${camera.id}`}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(camera);
                    }}
                    data-testid={`button-edit-camera-${camera.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(camera);
                    }}
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
            <Button onClick={handleNewCamera}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Câmera
            </Button>
          </CardContent>
        </Card>
      )}

      {totalItems > 0 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Itens por página:</span>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="48">48</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-muted-foreground min-w-[60px] text-center">
              {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
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

                {selectedEmpresa ? (
                  <div className="flex items-center gap-2 p-3 rounded-md border bg-muted">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedEmpresa.nome}</p>
                      {selectedEmpresa.dominio && (
                        <p className="text-xs text-muted-foreground truncate">{selectedEmpresa.dominio}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleRemoveEmpresa}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Input
                      id="empresa"
                      placeholder="Buscar empresa por nome ou domínio..."
                      value={empresaSearchTerm}
                      onChange={(e) => setEmpresaSearchTerm(e.target.value)}
                      data-testid="input-empresa-search"
                    />

                    {empresaSearchTerm && filteredEmpresas && filteredEmpresas.length > 0 && (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-2">
                        {filteredEmpresas.map((empresa) => (
                          <div
                            key={empresa.id}
                            className="flex items-center gap-3 p-3 rounded-md hover-elevate cursor-pointer"
                            onClick={() => handleSelectEmpresa(empresa)}
                            data-testid={`search-result-empresa-${empresa.id}`}
                          >
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{empresa.nome}</p>
                              {empresa.dominio && (
                                <p className="text-xs text-muted-foreground truncate">{empresa.dominio}</p>
                              )}
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    )}

                    {empresaSearchTerm && filteredEmpresas && filteredEmpresas.length === 0 && (
                      <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg">
                        Nenhuma empresa encontrada
                      </div>
                    )}
                  </>
                )}
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
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar Acessos</DialogTitle>
            <DialogDescription>
              {selectedCamera?.nome} - Pesquise e selecione os clientes que podem visualizar esta câmera
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAccessSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search-cliente">Pesquisar Cliente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-cliente"
                  placeholder="Digite o nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-cliente"
                />
              </div>
            </div>

            {searchTerm && filteredClientes && filteredClientes.length > 0 && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-2">
                {filteredClientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="flex items-center gap-3 p-3 rounded-md hover-elevate cursor-pointer"
                    onClick={() => addClienteAccess(cliente.id)}
                    data-testid={`search-result-cliente-${cliente.id}`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{cliente.nome}</p>
                      <p className="text-xs text-muted-foreground">{cliente.email}</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}

            {searchTerm && filteredClientes && filteredClientes.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg">
                Nenhum cliente encontrado
              </div>
            )}

            {selectedClientes.length > 0 && (
              <div className="space-y-2">
                <Label>Clientes Selecionados ({selectedClientes.length})</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-2">
                  {selectedClientes.map((clienteId) => {
                    const cliente = clientes?.find((c) => c.id === clienteId);
                    if (!cliente) return null;
                    return (
                      <div
                        key={cliente.id}
                        className="flex items-center gap-3 p-3 rounded-md border bg-muted/50"
                        data-testid={`selected-cliente-${cliente.id}`}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{cliente.nome}</p>
                          <p className="text-xs text-muted-foreground">{cliente.email}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeClienteAccess(cliente.id)}
                          data-testid={`button-remove-cliente-${cliente.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedClientes.length === 0 && !searchTerm && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum cliente selecionado</p>
                <p className="text-xs mt-1">Use o campo acima para pesquisar e adicionar clientes</p>
              </div>
            )}

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