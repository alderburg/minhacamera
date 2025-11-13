import { Bell, Menu, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";

interface MobileTopBarProps {
  showBack?: boolean;
  backUrl?: string;
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  showProfile?: boolean;
}

export function MobileTopBar({ 
  showBack = false, 
  backUrl = "/mobile/home",
  title,
  subtitle,
  rightAction,
  showProfile = true
}: MobileTopBarProps) {
  const { user } = useAuth();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-blue-600 z-50 md:hidden">
      <div className="px-4 py-4">
        {showProfile && !showBack && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-white">
                <AvatarFallback className="bg-white text-pink-600 font-semibold">
                  {getInitials(user.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="text-white">
                <h2 className="font-semibold text-sm">{user.nome}</h2>
                <p className="text-xs opacity-90">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/mobile/notificacoes">
                <button className="p-2 rounded-full hover:bg-white/20 transition-colors">
                  <Bell className="h-5 w-5 text-white" />
                </button>
              </Link>
              <Link href="/mobile/menu">
                <button className="p-2 rounded-full hover:bg-white/20 transition-colors">
                  <Menu className="h-5 w-5 text-white" />
                </button>
              </Link>
            </div>
          </div>
        )}

        {showBack && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link href={backUrl}>
                <button className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors">
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
              </Link>
              {title && (
                <div className="flex-1 min-w-0">
                  <h1 className="text-white font-semibold text-base truncate">{title}</h1>
                  {subtitle && (
                    <p className="text-white/80 text-xs truncate">{subtitle}</p>
                  )}
                </div>
              )}
            </div>
            {rightAction && (
              <div className="ml-2">
                {rightAction}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
