import { MobileTopBar } from "@/components/mobile-top-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Search, Users, Mail, Phone, Pencil, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import type { Cliente } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MobileClientesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: clientes, isLoading } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/clientes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
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

  const handleDelete = (e: React.MouseEvent, id: number, nome: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir o cliente "${nome}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredClientes = clientes?.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 overflow-x-hidden">
      <MobileTopBar 
        showBack 
        backUrl="/dashboard"
        title="Clientes"
        subtitle={`${filteredClientes.length} clientes cadastrados`}
        icon={Users}
      />

      <div className="pt-24 pb-8 px-0 md:px-4">
        <div className="mb-4 px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar cliente..."
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
              <p className="text-sm text-gray-500">Carregando clientes...</p>
            </div>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center mb-2">
              {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </p>
            <Link href="/mobile/clientes/new">
              <button className="text-blue-600 font-medium hover:underline">
                Cadastrar primeiro cliente
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 px-4">
            {filteredClientes.map((cliente) => (
              <div key={cliente.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border-2 border-blue-100 flex-shrink-0">
                    <AvatarFallback className="bg-blue-600 text-white font-semibold">
                      {getInitials(cliente.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{cliente.nome}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link href={`/mobile/clientes/edit/${cliente.id}`}>
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </button>
                        </Link>
                        <button 
                          onClick={(e) => handleDelete(e, cliente.id, cliente.nome)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                    {cliente.email && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{cliente.email}</span>
                      </div>
                    )}
                    {cliente.telefone && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{cliente.telefone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {cliente.ativo ? (
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

      <Link href="/mobile/clientes/new">
        <button 
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 z-40"
          data-testid="button-add-cliente"
        >
          <Plus className="h-6 w-6" />
        </button>
      </Link>

      <MobileBottomNav />
    </div>
  );
}