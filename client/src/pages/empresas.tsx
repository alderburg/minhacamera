import { useState, useMemo } from "react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Loader2, Pencil, Trash2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Empresa, InsertEmpresa } from "@shared/schema";

export default function Empresas() {
  const { user, isLoading: authLoading } = useRequireAuth(["super_admin"]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [deletingEmpresa, setDeletingEmpresa] = useState<Empresa | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
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

  const filteredEmpresas = useMemo(() => {
    if (!empresas) return [];
    
    return empresas.filter((empresa) => {
      const matchesSearch = 
        empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (empresa.dominio && empresa.dominio.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
  }, [empresas, searchTerm]);

  const totalPages = Math.ceil(filteredEmpresas.length / itemsPerPage);
  const paginatedEmpresas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmpresas.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmpresas, currentPage, itemsPerPage]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Empresas</h1>
          <p className="text-muted-foreground">
            {filteredEmpresas.length} {filteredEmpresas.length === 1 ? "empresa" : "empresas"}
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-empresa">
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou domínio..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
            data-testid="input-search-empresas"
          />
        </div>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => {
            setItemsPerPage(parseInt(value));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]" data-testid="select-items-per-page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12 por página</SelectItem>
            <SelectItem value="24">24 por página</SelectItem>
            <SelectItem value="48">48 por página</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedEmpresas.map((empresa) => (
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

      {filteredEmpresas.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? "Tente ajustar sua busca" : "Comece criando sua primeira empresa"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
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
              <Label htmlFor="dominio">Domínio (opcional)</Label>
              <Input
                id="dominio"
                placeholder="Ex: seguranca.minhacamera.com"
                value={formData.dominio || ""}
                onChange={(e) => setFormData({ ...formData, dominio: e.target.value })}
                data-testid="input-empresa-dominio"
              />
              <p className="text-xs text-muted-foreground">
                Domínio personalizado para white-label
              </p>
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
