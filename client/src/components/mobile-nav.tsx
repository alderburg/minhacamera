import { Link, useLocation } from "wouter";
import { LayoutDashboard, Video, User, Building2, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();

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
      </div>
    </nav>
  );
}
