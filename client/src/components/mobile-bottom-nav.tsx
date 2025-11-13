import { Link, useLocation } from "wouter";
import { Home, Building2, Users, Video } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    {
      title: "Início",
      url: "/dashboard",
      icon: Home,
      show: true,
    },
    {
      title: "Empresas",
      url: "/mobile/empresas",
      icon: Building2,
      show: true,
    },
    {
      title: "Clientes",
      url: "/mobile/clientes",
      icon: Users,
      show: true,
    },
    {
      title: "Câmeras",
      url: "/mobile/cameras",
      icon: Video,
      show: true,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const isActive = location === item.url || location.startsWith(item.url + '/');
          return (
            <Link key={item.url} href={item.url}>
              <button
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[60px] ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-500"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "" : ""}`} />
                <span className="text-xs font-medium">{item.title}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}