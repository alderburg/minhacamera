import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Video, Activity } from "lucide-react";

interface DashboardStats {
  totalEmpresas: number;
  totalClientes: number;
  totalCameras: number;
  camerasOnline: number;
  camerasOffline: number;
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useRequireAuth(["super_admin", "admin"]);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = user?.tipo === "super_admin";

  const statCards = [
    {
      title: "Total de Empresas",
      value: stats?.totalEmpresas || 0,
      icon: Building2,
      show: isSuperAdmin,
    },
    {
      title: "Total de Clientes",
      value: stats?.totalClientes || 0,
      icon: Users,
      show: true,
    },
    {
      title: "Total de Câmeras",
      value: stats?.totalCameras || 0,
      icon: Video,
      show: true,
    },
    {
      title: "Câmeras Online",
      value: stats?.camerasOnline || 0,
      icon: Activity,
      show: true,
      color: "text-status-online",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de gerenciamento de câmeras
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards
          .filter((card) => card.show)
          .map((card) => (
            <Card key={card.title} data-testid={`stat-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-5 w-5 ${card.color || "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Câmeras Online</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-status-online animate-pulse" />
                <span className="text-sm font-medium">{stats?.camerasOnline || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Câmeras Offline</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-status-offline" />
                <span className="text-sm font-medium">{stats?.camerasOffline || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm font-medium">Taxa de Disponibilidade</span>
              <span className="text-sm font-bold text-status-online">
                {stats?.totalCameras
                  ? Math.round((stats.camerasOnline / stats.totalCameras) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
