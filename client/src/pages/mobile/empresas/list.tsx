import { MobileTopBar } from "@/components/mobile-top-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Search, Building2, CheckCircle2, XCircle, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import type { Empresa } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MobileEmpresasList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: empresas, isLoading } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/empresas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas"] });
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

  const handleDelete = (e: React.MouseEvent, id: number, nome: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir a empresa "${nome}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredEmpresas = empresas?.filter(empresa =>
    empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empresa.dominio?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 overflow-x-hidden">
      <MobileTopBar 
        showBack 
        backUrl="/dashboard"
        title="Empresas"
        subtitle={`${filteredEmpresas.length} empresas cadastradas`}
        icon={Building2}
      />

      <div className="pt-24 pb-8">
        <div className="mb-4 px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Carregando empresas...</p>
            </div>
          </div>
        ) : filteredEmpresas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center mb-2">
              {searchTerm ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada"}
            </p>
            <Link href="/mobile/empresas/new">
              <button className="text-blue-600 font-medium hover:underline">
                Cadastrar primeira empresa
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 px-4">
            {filteredEmpresas.map((empresa) => (
              <div key={empresa.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{empresa.nome}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link href={`/mobile/empresas/edit/${empresa.id}`}>
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </button>
                        </Link>
                        <button 
                          onClick={(e) => handleDelete(e, empresa.id, empresa.nome)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                    {empresa.dominio && (
                      <p className="text-sm text-gray-500 truncate mb-2">
                        {empresa.dominio}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      {empresa.ativo ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link href="/mobile/empresas/new">
        <button 
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 z-40"
          data-testid="button-add-empresa"
        >
          <Plus className="h-6 w-6" />
        </button>
      </Link>

      <MobileBottomNav />
    </div>
  );
}