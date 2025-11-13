import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Empresas from "@/pages/empresas";
import Clientes from "@/pages/clientes";
import CamerasManagement from "@/pages/cameras-management";
import CamerasView from "@/pages/cameras-view";
import Perfil from "@/pages/perfil";
import { Loader2, Bell } from "lucide-react";

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
      return <Redirect to="/cameras" />;
    } else {
      return <Redirect to="/dashboard" />;
    }
  }

  return <Component {...rest} />;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) return <>{children}</>;

  const isUser = user.tipo === "user";

  // Mobile-only layout for users
  if (isUser) {
    return (
      <>
        <MobileHeader>
          <div className="flex items-center gap-4">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <a href="/perfil">
              <img
                src={user.avatar_url}
                alt="User Avatar"
                className="h-8 w-8 rounded-full cursor-pointer"
              />
            </a>
          </div>
        </MobileHeader>
        <main className="pt-14 pb-16 md:pt-0 md:pb-0 min-h-screen">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
        <MobileNav />
      </>
    );
  }

  // Desktop sidebar + mobile nav for admins
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
            <div className="flex items-center gap-4 ml-auto">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <a href="/perfil" className="flex items-center gap-2 cursor-pointer">
                <img
                  src={user.avatar_url}
                  alt="User Avatar"
                  className="h-8 w-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user.name}
                </span>
              </a>
            </div>
          </header>
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
      <MobileNav />
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <PublicRoute component={Login} />
      </Route>

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

      <Route path="/">
        <Redirect to="/login" />
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