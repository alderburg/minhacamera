
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Notificacoes() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Nova câmera adicionada",
      message: "A câmera 'Entrada Principal' foi adicionada com sucesso ao sistema.",
      time: "5 minutos atrás",
      read: false,
      type: "success",
    },
    {
      id: 2,
      title: "Câmera offline",
      message: "A câmera 'Estacionamento' está offline há 2 horas.",
      time: "2 horas atrás",
      read: false,
      type: "warning",
    },
    {
      id: 3,
      title: "Manutenção programada",
      message: "Manutenção programada do sistema para amanhã às 02:00.",
      time: "1 dia atrás",
      read: true,
      type: "info",
    },
  ]);

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Notificações</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `Você tem ${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
              : 'Todas as notificações foram lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma notificação</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                !notification.read ? 'border-l-4 border-l-blue-500 bg-accent/20' : ''
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        {notification.title}
                      </CardTitle>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  {notification.time}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
