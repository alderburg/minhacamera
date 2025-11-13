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
import { Save, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import type { Empresa, InsertEmpresa } from "@shared/schema";

export default function MobileEmpresaForm() {
  const [matchEdit, paramsEdit] = useRoute("/mobile/empresas/edit/:id");
  const [matchNew] = useRoute("/mobile/empresas/new");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  console.log('=== MOBILE EMPRESA FORM ===');
  console.log('Match Edit:', matchEdit, 'Params:', paramsEdit);
  console.log('Match New:', matchNew);
  
  const empresaId = matchEdit && paramsEdit?.id ? parseInt(paramsEdit.id) : null;
  const isEditing = !!empresaId;
  
  console.log('Empresa ID:', empresaId);
  console.log('Is Editing:', isEditing);

  const [formData, setFormData] = useState<InsertEmpresa>({
    nome: "",
    logo: "",
    dominio: "",
    ativo: true,
  });

  const [subdomain, setSubdomain] = useState("");
  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({
    checking: false,
    available: null,
    message: "",
  });

  const { data: empresa, isLoading: isLoadingEmpresa } = useQuery<Empresa>({
    queryKey: ["/api/empresas", empresaId?.toString() || ""],
    enabled: !!empresaId,
  });

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

  const checkSubdomain = async (sub: string) => {
    if (sub.length < 3) {
      setSubdomainStatus({
        checking: false,
        available: null,
        message: "Mínimo de 3 caracteres",
      });
      return;
    }

    setSubdomainStatus({ checking: true, available: null, message: "" });

    try {
      const response = await fetch(`/api/empresas/check-subdomain?subdomain=${sub}`);
      const data = await response.json();

      setSubdomainStatus({
        checking: false,
        available: data.available,
        message: data.available ? "Subdomínio disponível" : "Subdomínio já está em uso",
      });
    } catch (error) {
      setSubdomainStatus({
        checking: false,
        available: false,
        message: "Erro ao verificar subdomínio",
      });
    }
  };

  const handleSubdomainChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSubdomain(sanitized);
    const fullDomain = sanitized ? `${sanitized}.minhacamera.com` : "";
    setFormData({ ...formData, dominio: fullDomain });

    if (sanitized.length >= 3) {
      const timeoutId = setTimeout(() => checkSubdomain(sanitized), 500);
      return () => clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    console.log('=== EMPRESAS FORM DEBUG ===');
    console.log('empresaId:', empresaId);
    console.log('isEditing:', isEditing);
    console.log('isLoadingEmpresa:', isLoadingEmpresa);
    console.log('empresa data:', empresa);
    
    if (empresa) {
      console.log('Carregando dados da empresa no formulário:', empresa);
      setFormData({
        nome: empresa.nome,
        logo: empresa.logo || "",
        dominio: empresa.dominio || "",
        ativo: empresa.ativo,
      });

      // Extrair subdomínio se existir
      if (empresa.dominio) {
        const sub = empresa.dominio.replace(".minhacamera.com", "");
        setSubdomain(sub);
      }
    } else {
      console.log('Empresa não carregada ainda');
    }
  }, [empresa]);

  if (isEditing && isLoadingEmpresa) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <MobileTopBar
          showBack
          backUrl="/mobile/empresas"
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

      <form onSubmit={handleSubmit} className="p-4 pt-24 space-y-6">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
              Nome da Empresa <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Digite o nome da empresa"
              required
              className="h-12 bg-white"
              data-testid="input-nome"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subdomain" className="text-sm font-medium text-gray-700">
              Subdomínio
            </Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    id="subdomain"
                    placeholder="empresa"
                    value={subdomain}
                    onChange={(e) => handleSubdomainChange(e.target.value)}
                    disabled={!!empresaId}
                    data-testid="input-subdomain"
                    className="h-12 bg-white pr-10"
                  />
                  {!empresaId && subdomain.length >= 3 && (
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
                <span className="text-muted-foreground text-sm whitespace-nowrap">.minhacamera.com</span>
              </div>
              {!empresaId && subdomainStatus.message && (
                <p
                  className={`text-xs ${
                    subdomainStatus.available
                      ? "text-green-600"
                      : subdomainStatus.available === false
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {subdomainStatus.message}
                </p>
              )}
              {empresaId && (
                <p className="text-xs text-muted-foreground">
                  Subdomínio não pode ser alterado após criação
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo" className="text-sm font-medium text-gray-700">
              URL da Logo
            </Label>
            <Input
              id="logo"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="https://exemplo.com/logo.png"
              className="h-12 bg-white"
              data-testid="input-logo"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white rounded-md border p-4">
              <div>
                <Label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                  Status Ativo
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Empresa ativa no sistema
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