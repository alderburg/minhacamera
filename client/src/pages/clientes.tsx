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
import { Plus, Users, Loader2, Mail, Phone, Pencil, Trash2, Building2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Cliente, InsertCliente, Empresa } from "@shared/schema";

export default function Clientes() {
  const { user, isLoading: authLoading } = useRequireAuth(["super_admin", "admin"]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deletingCliente, setDeletingCliente] = useState<Cliente | null>(null);
  const [empresaSearchTerm, setEmpresaSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [formData, setFormData] = useState<InsertCliente>({
    nome: "",
    email: "",
    telefone: "",
    empresaId: 0,
    ativo: true,
  });
  const { toast } = useToast();

  const isSuperAdmin = user?.tipo === "super_admin";

  const { data: clientes, isLoading } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
    enabled: !!user,
  });

  const { data: empresas } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
    enabled: isSuperAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCliente) => {
      if (editingCliente) {
        return await apiRequest("PATCH", `/api/clientes/${editingCliente.id}`, data);
      }
      return await apiRequest("POST", "/api/clientes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingCliente ? "Cliente atualizado" : "Cliente criado",
        description: editingCliente ? "O cliente foi atualizado com sucesso" : "O cliente foi criado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: editingCliente ? "Erro ao atualizar cliente" : "Erro ao criar cliente",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/clientes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      setIsDeleteDialogOpen(false);
      setDeletingCliente(null);
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir cliente",
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
        description: "Selecione uma empresa para o cliente",
      });
      return;
    }
    
    createMutation.mutate(formData);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    
    // Buscar e definir a empresa selecionada
    const empresa = empresas?.find(e => e.id === cliente.empresaId);
    if (empresa) {
      setSelectedEmpresa(empresa);
      setEmpresaSearchTerm(empresa.nome);
    }
    
    setFormData({
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone || "",
      empresaId: cliente.empresaId,
      ativo: cliente.ativo,
    });
    setIsDialogOpen(true);
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

  const handleDelete = (cliente: Cliente) => {
    setDeletingCliente(cliente);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingCliente) {
      deleteMutation.mutate(deletingCliente.id);
    }
  };

  const resetForm = () => {
    setEditingCliente(null);
    setSelectedEmpresa(null);
    setEmpresaSearchTerm("");
    setFormData({ nome: "", email: "", telefone: "", empresaId: 0, ativo: true });
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsDialogOpen(open);
  };

  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handleNewCliente = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Paginação
  const totalItems = clientes?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClientes = clientes?.slice(startIndex, endIndex) || [];

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
          <h1 className="text-2xl font-semibold mb-2">Clientes</h1>
          <p className="text-muted-foreground">Gerenciar clientes do sistema</p>
        </div>
        <Button onClick={handleNewCliente} data-testid="button-add-cliente">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentClientes.map((cliente) => (
          <Card key={cliente.id} className="hover-elevate" data-testid={`cliente-card-${cliente.id}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(cliente.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate mb-1">{cliente.nome}</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">
                        Empresa: {empresas?.find(e => e.id === cliente.empresaId)?.nome || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{cliente.email}</span>
                    </div>
                    {cliente.telefone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{cliente.telefone}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant={cliente.ativo ? "default" : "secondary"} className="text-xs">
                      {cliente.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    <div className="ml-auto flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(cliente)}
                        data-testid={`button-edit-cliente-${cliente.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(cliente)}
                        data-testid={`button-delete-cliente-${cliente.id}`}
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

      {clientes?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cliente cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comece criando seu primeiro cliente
            </p>
            <Button onClick={handleNewCliente}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
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

          <div className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription>
              {editingCliente ? "Atualize os dados do cliente" : "Cadastre um novo cliente no sistema"}
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
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                placeholder="Ex: João Silva"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                data-testid="input-cliente-nome"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="input-cliente-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (opcional)</Label>
              <Input
                id="telefone"
                placeholder="(11) 99999-9999"
                value={formData.telefone || ""}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                data-testid="input-cliente-telefone"
              />
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
                data-testid="button-submit-cliente"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingCliente ? "Atualizando..." : "Criando..."}
                  </>
                ) : (
                  editingCliente ? "Atualizar Cliente" : "Criar Cliente"
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
              Tem certeza que deseja excluir o cliente "{deletingCliente?.nome}"? Esta ação não pode ser desfeita.
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
