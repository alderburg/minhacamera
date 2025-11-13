import { MobileTopBar } from "@/components/mobile-top-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { 
  User, 
  Building2, 
  Users, 
  Video, 
  Bell, 
  Settings, 
  LogOut,
  ChevronRight,
  Shield
} from "lucide-react";
import { useEffect } from "react";

export default function MobileMenu() {
  const { user, logout } = useAuth();

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

  const isSuperAdmin = user.tipo === "super_admin";
  const isAdmin = user.tipo === "admin" || user.tipo === "super_admin";

  const menuItems = [
    {
      title: "Dados da Conta",
      description: "Gerencie suas informações pessoais",
      icon: User,
      href: "/perfil",
      show: true,
    },
    {
      title: "Empresas",
      description: "Gerenciar empresas cadastradas",
      icon: Building2,
      href: "/mobile/empresas",
      show: isSuperAdmin,
    },
    {
      title: "Clientes",
      description: "Gerenciar clientes do sistema",
      icon: Users,
      href: "/mobile/clientes",
      show: isAdmin,
    },
    {
      title: "Câmeras",
      description: "Visualizar e gerenciar câmeras",
      icon: Video,
      href: "/mobile/cameras",
      show: true,
    },
    {
      title: "Notificações",
      description: "Configurar alertas e avisos",
      icon: Bell,
      href: "/mobile/notificacoes",
      show: true,
    },
    {
      title: "Configurações",
      description: "Preferências do sistema",
      icon: Settings,
      href: "/mobile/configuracoes",
      show: true,
    },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 overflow-x-hidden">
      <MobileTopBar 
        showBack 
        backUrl="/dashboard"
        title="Menu"
        subtitle="Navegação do sistema"
        rightAction={
          <button className="p-2 rounded-full hover:bg-white/20 transition-colors">
            <Settings className="h-5 w-5 text-white" />
          </button>
        }
      />

      <div className="pt-16 px-0 md:px-4">
        <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100 mx-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-blue-300">
              <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                {getInitials(user.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-lg text-gray-900">{user.nome}</h2>
              <p className="text-sm text-gray-600 truncate">{user.email}</p>
              <div className="mt-1">
                <span className="inline-block px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                  {user.tipo === "super_admin" ? "Super Admin" : user.tipo === "admin" ? "Admin" : "Usuário"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-4">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button className="w-full bg-white rounded-xl p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors border border-gray-100">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500 truncate">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </button>
            </Link>
          ))}

          <button
            onClick={logout}
            className="w-full bg-red-50 rounded-xl p-4 flex items-center gap-4 hover:bg-red-100 transition-colors border border-red-100"
          >
            <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <LogOut className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h3 className="font-semibold text-red-900">Sair</h3>
              <p className="text-sm text-red-600">Desconectar da conta</p>
            </div>
            <ChevronRight className="h-5 w-5 text-red-400 flex-shrink-0" />
          </button>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}