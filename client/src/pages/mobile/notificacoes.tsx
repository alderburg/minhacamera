import { MobileTopBar } from "@/components/mobile-top-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function MobileNotificacoes() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const notifications = [
    {
      id: 1,
      title: "Nova câmera adicionada",
      message: "A câmera 'Entrada Principal' foi adicionada com sucesso.",
      time: "5 min atrás",
      read: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <MobileTopBar 
        showBack 
        backUrl="/dashboard"
        title="Notificações"
        subtitle="Alertas e avisos do sistema"
      />

      <div className="pt-20 px-4 md:pt-0 md:px-0">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Bell className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              Nenhuma notificação no momento
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl p-4 border ${
                  !notification.read ? 'border-pink-200 bg-pink-50' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">{notification.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-400">{notification.time}</p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-pink-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="mt-4">
            <Button variant="outline" className="w-full">
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}
