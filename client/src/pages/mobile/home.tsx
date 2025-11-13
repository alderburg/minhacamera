import { MobileTopBar } from "@/components/mobile-top-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, Video, Activity, Trash2, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalEmpresas: number;
  totalClientes: number;
  totalCameras: number;
  camerasOnline: number;
  camerasOffline: number;
}

// Placeholder for MobileProfile component - this will be created based on the intention.
function MobileProfile() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <MobileTopBar showProfile />
      <div className="pt-20 md:pt-0 md:px-0">
        <div className="mb-6 px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Perfil de {user?.nome || "Usuário"}
          </h1>
        </div>
        <Card className="border-0 shadow-sm mb-6 mx-4">
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Informações</h2>
            <div className="space-y-3">
              <p><span className="font-medium">Nome:</span> {user?.nome}</p>
              <p><span className="font-medium">Email:</span> {user?.email}</p>
              <p><span className="font-medium">Tipo:</span> {user?.tipo}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <MobileBottomNav />
    </div>
  );
}


export default function MobileHome() {
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user && (user.tipo === "super_admin" || user.tipo === "admin"),
  });

  const isSuperAdmin = user?.tipo === "super_admin";
  const isAdmin = user?.tipo === "admin" || user?.tipo === "super_admin";

  // Default stats for regular users
  const defaultStats: DashboardStats = {
    totalEmpresas: 0,
    totalClientes: 0,
    totalCameras: 0,
    camerasOnline: 0,
    camerasOffline: 0,
  };

  const currentStats = stats || defaultStats;

  const statCards = [
    {
      title: "Empresas",
      value: currentStats.totalEmpresas,
      icon: Building2,
      show: isSuperAdmin,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Clientes",
      value: currentStats.totalClientes,
      icon: Users,
      show: isAdmin,
      color: "from-blue-500 to-cyan-500", // Changed to blue
    },
    {
      title: "Câmeras",
      value: currentStats.totalCameras,
      icon: Video,
      show: true,
      color: "from-blue-500 to-cyan-500", // Changed to blue
    },
    {
      title: "Online",
      value: currentStats.camerasOnline,
      icon: Activity,
      show: true,
      color: "from-blue-500 to-cyan-500", // Changed to blue
    },
  ].filter(card => card.show);

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <MobileTopBar showProfile />

      <div className="pt-20 md:pt-0 md:px-0">
        <div className="mb-6 px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Bem-vindo! 👋
          </h1>
          <p className="text-gray-600">Visão geral do sistema MinhaCamera</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6 px-4">
          {statCards.map((card) => (
            <Card key={card.title} className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className={`bg-gradient-to-br ${card.color} p-4 text-white`}>
                  <card.icon className="h-8 w-8 mb-2 opacity-90" />
                  <div className="text-3xl font-bold mb-1">{card.value}</div>
                  <div className="text-sm opacity-90">{card.title}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-sm mb-6 mx-4">
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Status do Sistema</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"> {/* Changed to blue */}
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" /> {/* Changed to blue */}
                  <span className="text-sm font-medium text-gray-700">Câmeras Online</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{currentStats.camerasOnline}</span> {/* Changed to blue */}
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm font-medium text-gray-700">Câmeras Offline</span>
                </div>
                <span className="text-lg font-bold text-red-600">{currentStats.camerasOffline}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-sm font-semibold text-gray-700">Taxa de Disponibilidade</span>
                <span className="text-lg font-bold text-blue-600"> {/* Changed to blue */}
                  {currentStats.totalCameras
                    ? Math.round((currentStats.camerasOnline / currentStats.totalCameras) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for List component with edit and delete buttons */}
        <Card className="border-0 shadow-sm mb-6 mx-4">
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Exemplo de Lista</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Item da Lista 1</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Item da Lista 2</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <MobileBottomNav />
    </div>
  );
}

// Mocking MobileProfile to be used in the menu navigation
// This would typically be imported from another file or defined elsewhere.
// For demonstration, let's assume it's defined here.
// export { MobileProfile };

// Mocking menu items, removing 'Dashboard'
const menuItems = [
  { name: "Home", href: "/mobile", icon: Building2 },
  { name: "Perfil", href: "/mobile/perfil", icon: Users }, // Adjusted href
];

// This would be part of your main layout or navigation component
// Example of how menuItems might be used in MobileBottomNav (conceptual)
/*
function MobileBottomNav() {
  const pathname = usePathname(); // Assuming usePathname from next/navigation
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white p-2 shadow-t flex justify-around">
      {menuItems.map((item) => (
        <Link key={item.name} href={item.href} className={`flex flex-col items-center p-2 rounded-lg ${pathname === item.href ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}>
          <item.icon className="h-6 w-6" />
          <span className="text-xs font-medium">{item.name}</span>
        </Link>
      ))}
    </nav>
  );
}
*/