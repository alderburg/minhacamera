
import { MobileTopBar } from "@/components/mobile-top-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, User, Shield } from "lucide-react";
import { useEffect } from "react";

export default function MobilePerfil() {
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (tipo: string) => {
    switch (tipo) {
      case "super_admin":
        return "Super Administrador";
      case "admin":
        return "Administrador";
      case "user":
        return "Usuário";
      default:
        return tipo;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <MobileTopBar 
        showBack 
        backUrl="/mobile/menu"
        title="Meu Perfil"
        subtitle="Informações da conta"
      />

      <div className="pt-20 px-4 md:pt-0 md:px-0">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 mb-6 border border-blue-100">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 border-4 border-blue-300 mb-4">
              <AvatarFallback className="bg-blue-600 text-white text-3xl font-bold">
                {getInitials(user.nome)}
              </AvatarFallback>
            </Avatar>
            <h2 className="font-bold text-xl text-gray-900 mb-2">{user.nome}</h2>
            <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
              {getRoleLabel(user.tipo)}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-1">E-mail</p>
                <p className="font-semibold text-gray-900 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-1">Status da Conta</p>
                <p className="font-semibold text-gray-900">
                  {user.ativo ? "Ativa" : "Inativa"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-1">Nível de Acesso</p>
                <p className="font-semibold text-gray-900">{getRoleLabel(user.tipo)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
