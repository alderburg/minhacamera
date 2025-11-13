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
import { Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { Cliente, InsertCliente, Empresa } from "@shared/schema";

export default function MobileClienteForm() {
  const [, params] = useRoute("/mobile/clientes/edit/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const clienteId = params?.id ? parseInt(params.id) : null;
  const isEditing = !!clienteId;
  const isSuperAdmin = user?.tipo === "super_admin";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState<InsertCliente>({
    nome: "",
    email: "",
    telefone: "",
    empresaId: user?.empresaId || 0,
    ativo: true,
  });

  const { data: cliente } = useQuery<Cliente>({
    queryKey: [`/api/clientes/${clienteId}`],
    enabled: !!clienteId,
  });

  const { data: empresas } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
    enabled: isSuperAdmin,
  });

  useEffect(() => {
    if (cliente) {
      setFormData({
        nome: cliente.nome,
        email: cliente.email || "",
        telefone: cliente.telefone || "",
        empresaId: cliente.empresaId,
        ativo: cliente.ativo,
      });
    }
  }, [cliente]);

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

          {isSuperAdmin && empresas && (
            <div className="space-y-2">
              <Label htmlFor="empresaId" className="text-sm font-medium text-gray-700">
                Empresa <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.empresaId?.toString()}
                onValueChange={(value) => setFormData({ ...formData, empresaId: parseInt(value) })}
              >
                <SelectTrigger className="h-12 bg-white" data-testid="select-empresa">
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