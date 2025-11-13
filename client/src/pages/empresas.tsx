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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Empresa, InsertEmpresa } from "@shared/schema";

export default function Empresas() {
  const { user, isLoading: authLoading } = useRequireAuth(["super_admin"]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      return await apiRequest("POST", "/api/empresas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas"] });
      setIsDialogOpen(false);
      setFormData({ nome: "", logo: "", dominio: "", ativo: true });
      toast({
        title: "Empresa criada",
        description: "A empresa foi criada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar empresa",
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
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
          <p className="text-muted-foreground">Gerenciar empresas do sistema</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-empresa">
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {empresas?.map((empresa) => (
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
                  <div className="mt-3">
                    <Badge variant={empresa.ativo ? "default" : "secondary"} className="text-xs">
                      {empresa.ativo ? "Ativa" : "Inativa"}
                    </Badge>
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
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Empresa</DialogTitle>
            <DialogDescription>
              Cadastre uma nova empresa no sistema
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
                    Criando...
                  </>
                ) : (
                  "Criar Empresa"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
