import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Empresas from "@/pages/empresas";
import Clientes from "@/pages/clientes";
import CamerasManagement from "@/pages/cameras-management";
import CamerasView from "@/pages/cameras-view";
import Perfil from "@/pages/perfil";
import Notificacoes from "@/pages/notificacoes";
import MobileHome from "@/pages/mobile/home";
import MobileMenu from "@/pages/mobile/menu";
import MobileEmpresasList from "@/pages/mobile/empresas/list";
import MobileEmpresaForm from "@/pages/mobile/empresas/form";
import MobileClientesList from "@/pages/mobile/clientes/list";
import MobileClienteForm from "@/pages/mobile/clientes/form";
import MobileCamerasList from "@/pages/mobile/cameras/list";
import MobileCameraForm from "@/pages/mobile/cameras/form";
import MobileNotificacoes from "@/pages/mobile/notificacoes";
import MobileConfiguracoes from "@/pages/mobile/configuracoes";
import { Loader2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function PublicRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) {
    // Redirect based on user type
    if (user.tipo === "user") {
      return <Redirect to="/mobile/home" />;
    } else {
      return <Redirect to="/dashboard" />;
    }
  }

  return <Component {...rest} />;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Nova câmera adicionada",
      message: "A câmera 'Entrada Principal' foi adicionada com sucesso.",
      time: "5 min atrás",
      read: false,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma notificação
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                    !notification.read ? 'bg-accent/50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <a
            href="/notificacoes"
            className="block text-center text-sm text-primary hover:underline"
          >
            Ver todas as notificações
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) return <>{children}</>;

  // Desktop sidebar for admins only
  const sidebarStyle = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="hidden md:flex items-center h-16 px-6 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2 ml-auto">
              <NotificationBell />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      {/* Root redirect */}
      <Route path="/">
        {() => {
          const { user, isLoading } = useAuth();
          
          if (isLoading) {
            return (
              <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            );
          }
          
          if (!user) {
            return <Redirect to="/login" />;
          }
          
          // Redirect based on user type
          if (user.tipo === "user") {
            return <Redirect to="/mobile/home" />;
          } else {
            return <Redirect to="/dashboard" />;
          }
        }}
      </Route>

      <Route path="/login">
        <PublicRoute component={Login} />
      </Route>

      {/* Mobile Routes */}
      <Route path="/mobile/home">
        <ProtectedRoute component={MobileHome} />
      </Route>

      <Route path="/mobile/menu">
        <ProtectedRoute component={MobileMenu} />
      </Route>

      <Route path="/mobile/empresas/new">
        <ProtectedRoute component={MobileEmpresaForm} />
      </Route>

      <Route path="/mobile/empresas/edit/:id">
        <ProtectedRoute component={MobileEmpresaForm} />
      </Route>

      <Route path="/mobile/empresas">
        <ProtectedRoute component={MobileEmpresasList} />
      </Route>

      <Route path="/mobile/clientes/new">
        <ProtectedRoute component={MobileClienteForm} />
      </Route>

      <Route path="/mobile/clientes/edit/:id">
        <ProtectedRoute component={MobileClienteForm} />
      </Route>

      <Route path="/mobile/clientes">
        <ProtectedRoute component={MobileClientesList} />
      </Route>

      <Route path="/mobile/cameras/new">
        <ProtectedRoute component={MobileCameraForm} />
      </Route>

      <Route path="/mobile/cameras/edit/:id">
        <ProtectedRoute component={MobileCameraForm} />
      </Route>

      <Route path="/mobile/cameras">
        <ProtectedRoute component={MobileCamerasList} />
      </Route>

      <Route path="/mobile/notificacoes">
        <ProtectedRoute component={MobileNotificacoes} />
      </Route>

      <Route path="/mobile/configuracoes">
        <ProtectedRoute component={MobileConfiguracoes} />
      </Route>

      {/* Desktop Routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>

      <Route path="/empresas">
        <ProtectedRoute component={Empresas} />
      </Route>

      <Route path="/clientes">
        <ProtectedRoute component={Clientes} />
      </Route>

      <Route path="/cameras">
        {() => {
          const { user } = useAuth();
          // Users see the view page, admins see management
          if (user?.tipo === "user") {
            return <ProtectedRoute component={CamerasView} />;
          } else {
            return <ProtectedRoute component={CamerasManagement} />;
          }
        }}
      </Route>

      <Route path="/perfil">
        <ProtectedRoute component={Perfil} />
      </Route>

      <Route path="/notificacoes">
        <ProtectedRoute component={Notificacoes} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppLayout>
            <Router />
          </AppLayout>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;