import { MobileTopBar } from "@/components/mobile-top-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, Video, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";

interface DashboardStats {
  totalEmpresas: number;
  totalClientes: number;
  totalCameras: number;
  camerasOnline: number;
  camerasOffline: number;
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
      color: "bg-blue-600",
    },
    {
      title: "Clientes",
      value: currentStats.totalClientes,
      icon: Users,
      show: isAdmin,
      color: "bg-orange-500",
    },
    {
      title: "Câmeras",
      value: currentStats.totalCameras,
      icon: Video,
      show: true,
      color: "bg-blue-600",
    },
    {
      title: "Online",
      value: currentStats.camerasOnline,
      icon: Activity,
      show: true,
      color: "bg-orange-500",
    },
  ].filter(card => card.show);

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 overflow-x-hidden">
      <MobileTopBar showProfile />

      <div className="pt-16 md:pt-0 md:px-4">
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
                <div className={`${card.color} p-4 text-white`}>
                  <card.icon className="h-8 w-8 mb-2 opacity-90" />
                  <div className="text-3xl font-bold mb-1">{card.value}</div>
                  <div className="text-sm opacity-90">{card.title}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-sm mb-6 rounded-none">
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Status do Sistema</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-gray-700">Câmeras Online</span>
                </div>
                <span className="text-lg font-bold text-green-600">{currentStats.camerasOnline}</span>
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
                <span className="text-lg font-bold text-green-600">
                  {currentStats.totalCameras
                    ? Math.round((currentStats.camerasOnline / currentStats.totalCameras) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <MobileBottomNav />
    </div>
  );
}
