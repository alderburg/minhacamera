import { MobileTopBar } from "@/components/mobile-top-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useRoute, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { Empresa, InsertEmpresa } from "@shared/schema";

export default function MobileEmpresaForm() {
  const [, params] = useRoute("/mobile/empresas/edit/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const empresaId = params?.id ? parseInt(params.id) : null;
  const isEditing = !!empresaId;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState<InsertEmpresa>({
    nome: "",
    logo: "",
    dominio: "",
    ativo: true,
  });

  const { data: empresa } = useQuery<Empresa>({
    queryKey: [`/api/empresas/${empresaId}`],
    enabled: !!empresaId,
  });

  useEffect(() => {
    if (empresa) {
      setFormData({
        nome: empresa.nome,
        logo: empresa.logo || "",
        dominio: empresa.dominio || "",
        ativo: empresa.ativo,
      });
    }
  }, [empresa]);

  const saveMutation = useMutation({
    mutationFn: async (data: InsertEmpresa) => {
      if (isEditing) {
        return await apiRequest("PATCH", `/api/empresas/${empresaId}`, data);
      }
      return await apiRequest("POST", "/api/empresas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas"] });
      toast({
        title: isEditing ? "Empresa atualizada" : "Empresa criada",
        description: isEditing ? "A empresa foi atualizada com sucesso" : "A empresa foi criada com sucesso",
      });
      setLocation("/mobile/empresas");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: isEditing ? "Erro ao atualizar empresa" : "Erro ao criar empresa",
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 overflow-x-hidden">
      <MobileTopBar
        showBack
        backUrl="/mobile/empresas"
        title={isEditing ? "Editar Empresa" : "Nova Empresa"}
        subtitle={isEditing ? "Atualize os dados da empresa" : "Preencha os dados abaixo"}
      />

      <form onSubmit={handleSubmit} className="pt-16 px-0 pb-6 md:px-4 md:pt-0">
        <div className="px-4">
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <Label htmlFor="nome" className="text-gray-700 font-semibold mb-2 block">
              Nome da Empresa <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Digite o nome da empresa"
              required
              className="bg-gray-50 border-gray-200"
            />
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <Label htmlFor="dominio" className="text-gray-700 font-semibold mb-2 block">
              Domínio
            </Label>
            <Input
              id="dominio"
              value={formData.dominio}
              onChange={(e) => setFormData({ ...formData, dominio: e.target.value })}
              placeholder="exemplo.com.br"
              className="bg-gray-50 border-gray-200"
            />
            <p className="text-xs text-gray-500 mt-2">
              URL personalizada para acesso da empresa
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <Label htmlFor="logo" className="text-gray-700 font-semibold mb-2 block">
              URL da Logo
            </Label>
            <Input
              id="logo"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="https://exemplo.com/logo.png"
              className="bg-gray-50 border-gray-200"
            />
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ativo" className="text-gray-700 font-semibold">
                  Status Ativo
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Empresa ativa no sistema
                </p>
              </div>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>
          </div>
        </div>

        </div>
        <div className="mt-6 px-4">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold"
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
                {isEditing ? "Atualizar Empresa" : "Criar Empresa"}
              </>
            )}
          </Button>
        </div>
      </form>

      <MobileBottomNav />
    </div>
  );
}