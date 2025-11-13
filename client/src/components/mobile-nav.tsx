import { Link, useLocation } from "wouter";
import { LayoutDashboard, Video, User, Building2, Users, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);

  useEffect(() => {
    // Simulate fetching notifications
    const fetchedNotifications = [
      {
        id: 1,
        message: "Nova notificação simulada!",
        timestamp: new Date(),
      },
    ];
    setNotifications(fetchedNotifications);
    if (fetchedNotifications.length > 0) {
      setHasNotification(true);
    }
  }, []);

  const handleNotificationClick = () => {
    setIsNotificationModalOpen(true);
    setHasNotification(false); // Clear notification indicator after opening
  };

  if (!user) return null;

  const isUser = user.tipo === "user";
  const isSuperAdmin = user.tipo === "super_admin";
  const isAdmin = user.tipo === "admin" || user.tipo === "super_admin";

  // Users (clients) only see Início and Câmeras
  if (isUser) {
    const userNavItems = [
      {
        title: "Início",
        url: "/cameras",
        icon: LayoutDashboard,
      },
      {
        title: "Perfil",
        url: "/perfil",
        icon: User,
      },
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-50 md:hidden">
        <div className="flex items-center justify-around h-full px-4">
          {userNavItems.map((item) => {
            const isActive = location === item.url;
            return (
              <Link key={item.url} href={item.url}>
                <button
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`mobile-nav-${item.url.replace("/", "")}`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "fill-current" : ""}`} />
                  <span className="text-xs font-medium">{item.title}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Admin navigation
  const adminNavItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      show: isAdmin,
    },
    {
      title: "Empresas",
      url: "/empresas",
      icon: Building2,
      show: isSuperAdmin,
    },
    {
      title: "Clientes",
      url: "/clientes",
      icon: Users,
      show: isAdmin,
    },
    {
      title: "Câmeras",
      url: "/cameras",
      icon: Video,
      show: true,
    },
    {
      title: "Notificações",
      url: "/notificacoes",
      icon: Bell,
      show: isAdmin,
    },
  ].filter((item) => item.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around h-full px-2">
        {adminNavItems.map((item) => {
          const isActive = location === item.url;
          return (
            <Link key={item.url} href={item.url}>
              <button
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`mobile-nav-${item.url.replace("/", "")}`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "fill-current" : ""}`} />
                <span className="text-xs font-medium">{item.title}</span>
              </button>
            </Link>
          );
        })}
        <Dialog open={isNotificationModalOpen} onOpenChange={setIsNotificationModalOpen}>
          <DialogTrigger asChild>
            <button
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors relative ${
                location === "/notificacoes"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={handleNotificationClick}
              data-testid="mobile-nav-notifications"
            >
              <Bell className={`h-5 w-5 ${location === "/notificacoes" ? "fill-current" : ""} ${hasNotification ? "animate-pulse text-red-500" : ""}`} />
              <span className="text-xs font-medium">Notificações</span>
              {hasNotification && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              )}
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Notificações</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div key={notif.id} className="mb-4 p-3 border rounded-md">
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {notif.timestamp.toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">Nenhuma notificação no momento.</p>
              )}
              <div className="mt-4 text-center">
                <Link href="/notificacoes">
                  <Button variant="outline" size="sm">Ver todas as notificações</Button>
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </nav>
  );
}