import { useState, useEffect, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Loader2, Pencil, Trash2, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Empresa, InsertEmpresa } from "@shared/schema";

export default function Empresas() {
  const { user, isLoading: authLoading } = useRequireAuth(["super_admin"]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [deletingEmpresa, setDeletingEmpresa] = useState<Empresa | null>(null);
  const [subdomain, setSubdomain] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: "" });
  const [formData, setFormData] = useState<InsertEmpresa>({
    nome: "",
    logo: "",
    dominio: "",
    ativo: true,
  });
  const { toast } = useToast();

  const { data: empresas, isLoading } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertEmpresa) => {
      if (editingEmpresa) {
        return await apiRequest("PATCH", `/api/empresas/${editingEmpresa.id}`, data);
      }
      return await apiRequest("POST", "/api/empresas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas"] });
      setIsDialogOpen(false);
      setEditingEmpresa(null);
      setFormData({ nome: "", logo: "", dominio: "", ativo: true });
      toast({
        title: editingEmpresa ? "Empresa atualizada" : "Empresa criada",
        description: editingEmpresa ? "A empresa foi atualizada com sucesso" : "A empresa foi criada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: editingEmpresa ? "Erro ao atualizar empresa" : "Erro ao criar empresa",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/empresas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas"] });
      setIsDeleteDialogOpen(false);
      setDeletingEmpresa(null);
      toast({
        title: "Empresa excluída",
        description: "A empresa foi excluída com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir empresa",
        description: error.message,
      });
    },
  });

  const checkSubdomainAvailability = useCallback(async (sub: string) => {
    if (!sub || sub.length < 3) {
      setSubdomainStatus({ checking: false, available: null, message: "" });
      return;
    }

    setSubdomainStatus({ checking: true, available: null, message: "" });

    try {
      const response = await fetch(`/api/empresas/check-subdomain/${sub}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setSubdomainStatus({ 
        checking: false, 
        available: data.available, 
        message: data.message 
      });
    } catch (error) {
      setSubdomainStatus({ 
        checking: false, 
        available: false, 
        message: "Erro ao verificar disponibilidade" 
      });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (subdomain && !editingEmpresa) {
        checkSubdomainAvailability(subdomain);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [subdomain, editingEmpresa, checkSubdomainAvailability]);

  const handleSubdomainChange = (value: string) => {
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(cleanValue);
    setFormData({ ...formData, dominio: `${cleanValue}.minhacamera.com` });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEmpresa && subdomainStatus.available === false) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O subdomínio escolhido não está disponível",
      });
      return;
    }
    
    createMutation.mutate(formData);
  };

  const handleEdit = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    const currentSubdomain = empresa.dominio ? empresa.dominio.replace('.minhacamera.com', '') : '';
    setSubdomain(currentSubdomain);
    setFormData({
      nome: empresa.nome,
      logo: empresa.logo || "",
      dominio: empresa.dominio || "",
      ativo: empresa.ativo,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (empresa: Empresa) => {
    setDeletingEmpresa(empresa);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingEmpresa) {
      deleteMutation.mutate(deletingEmpresa.id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingEmpresa(null);
      setSubdomain("");
      setSubdomainStatus({ checking: false, available: null, message: "" });
      setFormData({ nome: "", logo: "", dominio: "", ativo: true });
    }
    setIsDialogOpen(open);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleNewEmpresa = () => {
    setEditingEmpresa(null);
    setSubdomain("");
    setSubdomainStatus({ checking: false, available: null, message: "" });
    setFormData({ nome: "", logo: "", dominio: "", ativo: true });
    setIsDialogOpen(true);
  };

  // Filtro e Paginação
  const filteredEmpresas = empresas?.filter((empresa) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      empresa.nome.toLowerCase().includes(search) ||
      empresa.dominio?.toLowerCase().includes(search)
    );
  }) || [];

  const totalItems = filteredEmpresas.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmpresas = filteredEmpresas.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Empresas</h1>
          <p className="text-muted-foreground">Gerenciar empresas do sistema</p>
        </div>
        <Button onClick={handleNewEmpresa} data-testid="button-add-empresa">
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar empresas por nome ou domínio..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentEmpresas.map((empresa) => (
          <Card key={empresa.id} className="hover-elevate" data-testid={`empresa-card-${empresa.id}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {empresa.logo ? (
                    <img
                      src={empresa.logo}
                      alt={empresa.nome}
                      className="h-full w-full object-contain rounded-lg"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate mb-1">{empresa.nome}</h3>
                  {empresa.dominio && (
                    <p className="text-xs text-muted-foreground truncate font-mono">
                      {empresa.dominio}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant={empresa.ativo ? "default" : "secondary"} className="text-xs">
                      {empresa.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                    <div className="ml-auto flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(empresa)}
                        data-testid={`button-edit-empresa-${empresa.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(empresa)}
                        data-testid={`button-delete-empresa-${empresa.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {empresas?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comece criando sua primeira empresa
            </p>
            <Button onClick={handleNewEmpresa}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEmpresa ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
            <DialogDescription>
              {editingEmpresa ? "Atualize os dados da empresa" : "Cadastre uma nova empresa no sistema"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Empresa *</Label>
              <Input
                id="nome"
                placeholder="Ex: Segurança Total LTDA"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                data-testid="input-empresa-nome"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomínio</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    id="subdomain"
                    placeholder="empresa"
                    value={subdomain}
                    onChange={(e) => handleSubdomainChange(e.target.value)}
                    disabled={!!editingEmpresa}
                    data-testid="input-empresa-subdomain"
                    className="pr-10"
                  />
                  {!editingEmpresa && subdomain.length >= 3 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {subdomainStatus.checking ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : subdomainStatus.available === true ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : subdomainStatus.available === false ? (
                        <XCircle className="h-4 w-4 text-destructive" />
                      ) : null}
                    </div>
                  )}
                </div>
                <span className="text-muted-foreground whitespace-nowrap">.minhacamera.com</span>
              </div>
              {!editingEmpresa && subdomainStatus.message && (
                <p className={`text-xs ${subdomainStatus.available ? 'text-green-600' : 'text-destructive'}`}>
                  {subdomainStatus.message}
                </p>
              )}
              {editingEmpresa && (
                <p className="text-xs text-muted-foreground">
                  O subdomínio não pode ser alterado após a criação
                </p>
              )}
              {!editingEmpresa && (
                <p className="text-xs text-muted-foreground">
                  Use apenas letras minúsculas, números e hífen
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">URL do Logo (opcional)</Label>
              <Input
                id="logo"
                placeholder="https://..."
                value={formData.logo || ""}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                data-testid="input-empresa-logo"
              />
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
                data-testid="button-submit-empresa"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingEmpresa ? "Atualizando..." : "Criando..."}
                  </>
                ) : (
                  editingEmpresa ? "Atualizar Empresa" : "Criar Empresa"
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
              Tem certeza que deseja excluir a empresa "{deletingEmpresa?.nome}"? Esta ação não pode ser desfeita.
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
    </div>
  );
}
