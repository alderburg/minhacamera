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
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Building2, X, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import type { Cliente, InsertCliente, Empresa } from "@shared/schema";

export default function MobileClienteForm() {
  const [match, params] = useRoute("/mobile/clientes/edit/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  console.log('Route match:', match);
  console.log('Route params:', params);
  
  const clienteId = params?.id ? parseInt(params.id) : null;
  const isEditing = !!clienteId;
  const isSuperAdmin = user?.tipo === "super_admin";
  
  console.log('Parsed clienteId:', clienteId);
  console.log('isEditing:', isEditing);

  const [formData, setFormData] = useState<InsertCliente>({
    nome: "",
    email: "",
    telefone: "",
    empresaId: user?.empresaId || 0,
    ativo: true,
  });

  const [empresaSearchTerm, setEmpresaSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);

  const { data: cliente, isLoading: isLoadingCliente } = useQuery<Cliente>({
    queryKey: [`/api/clientes/${clienteId}`],
    enabled: !!clienteId,
  });

  const { data: empresas } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
    enabled: isSuperAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: InsertCliente) => {
      if (isEditing) {
        return await apiRequest("PATCH", `/api/clientes/${clienteId}`, data);
      }
      return await apiRequest("POST", "/api/clientes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      toast({
        title: isEditing ? "Cliente atualizado" : "Cliente criado",
        description: isEditing ? "O cliente foi atualizado com sucesso" : "O cliente foi criado com sucesso",
      });
      setLocation("/mobile/clientes");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: isEditing ? "Erro ao atualizar cliente" : "Erro ao criar cliente",
        description: error.message,
      });
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    console.log('=== CLIENTES FORM DEBUG ===');
    console.log('clienteId:', clienteId);
    console.log('isEditing:', isEditing);
    console.log('isLoadingCliente:', isLoadingCliente);
    console.log('cliente data:', cliente);
    console.log('empresas data:', empresas);
    console.log('isSuperAdmin:', isSuperAdmin);
    
    if (cliente) {
      console.log('Carregando dados do cliente no formulário:', cliente);
      setFormData({
        nome: cliente.nome,
        email: cliente.email || "",
        telefone: cliente.telefone || "",
        empresaId: cliente.empresaId,
        ativo: cliente.ativo,
      });

      // Buscar e definir a empresa selecionada se for super admin
      if (isSuperAdmin && empresas) {
        const empresa = empresas.find(e => e.id === cliente.empresaId);
        console.log('Empresa encontrada:', empresa);
        if (empresa) {
          setSelectedEmpresa(empresa);
          setEmpresaSearchTerm(empresa.nome);
        }
      }
    } else {
      console.log('Cliente não carregado ainda');
    }
  }, [cliente, empresas, isSuperAdmin]);

  if (isEditing && isLoadingCliente) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <MobileTopBar
          showBack
          backUrl="/mobile/clientes"
          title="Carregando..."
          subtitle="Aguarde..."
        />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <MobileBottomNav />
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <MobileTopBar
        showBack
        backUrl="/mobile/clientes"
        title={isEditing ? "Editar Cliente" : "Novo Cliente"}
        subtitle={isEditing ? "Atualize os dados do cliente" : "Preencha os dados abaixo"}
      />

      <form onSubmit={handleSubmit} className="pt-24 px-4 pb-6 md:px-4 md:pt-0">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
              Nome Completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Digite o nome completo"
              required
              className="h-12 bg-white"
              data-testid="input-nome"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              className="h-12 bg-white"
              data-testid="input-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone" className="text-sm font-medium text-gray-700">
              Telefone
            </Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
              className="h-12 bg-white"
              data-testid="input-telefone"
            />
          </div>

          {isSuperAdmin && (
            <div className="space-y-2">
              <Label htmlFor="empresa" className="text-sm font-medium text-gray-700">
                Empresa <span className="text-red-500">*</span>
              </Label>

              {selectedEmpresa ? (
                <div className="flex items-center gap-2 p-3 rounded-md border bg-white">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                    className="h-8 w-8 flex-shrink-0"
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
                    className="h-12 bg-white"
                    data-testid="input-empresa-search"
                  />

                  {empresaSearchTerm && filteredEmpresas && filteredEmpresas.length > 0 && (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-2 bg-white">
                      {filteredEmpresas.map((empresa) => (
                        <div
                          key={empresa.id}
                          className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                          onClick={() => handleSelectEmpresa(empresa)}
                          data-testid={`search-result-empresa-${empresa.id}`}
                        >
                          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{empresa.nome}</p>
                            {empresa.dominio && (
                              <p className="text-xs text-muted-foreground truncate">{empresa.dominio}</p>
                            )}
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}

                  {empresaSearchTerm && filteredEmpresas && filteredEmpresas.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg bg-white">
                      Nenhuma empresa encontrada
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white rounded-md border p-4">
              <div>
                <Label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                  Status Ativo
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Cliente ativo no sistema
                </p>
              </div>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                data-testid="switch-ativo"
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold"
            disabled={saveMutation.isPending}
            data-testid="button-submit"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                {isEditing ? "Atualizar Cliente" : "Criar Cliente"}
              </>
            )}
          </Button>
        </div>
      </form>

      <MobileBottomNav />
    </div>
  );
}