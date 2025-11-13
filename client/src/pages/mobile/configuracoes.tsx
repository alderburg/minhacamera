import { MobileTopBar } from "@/components/mobile-top-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Settings, Moon, Globe, Shield, HelpCircle, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";

export default function MobileConfiguracoes() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <MobileTopBar 
        showBack 
        backUrl="/mobile/menu"
        title="Configurações"
        subtitle="Preferências do sistema"
        rightAction={
          <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <Settings className="h-5 w-5 text-white" />
          </button>
        }
      />

      <div className="pt-20 px-4 md:pt-0 md:px-0">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              Aparência
            </h3>
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Moon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Modo Escuro</h4>
                    <p className="text-sm text-gray-500">Tema escuro do sistema</p>
                  </div>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              Geral
            </h3>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
              <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-gray-900">Idioma</h4>
                  <p className="text-sm text-gray-500">Português (Brasil)</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-gray-900">Privacidade e Segurança</h4>
                  <p className="text-sm text-gray-500">Gerenciar permissões</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              Suporte
            </h3>
            <div className="bg-white rounded-xl border border-gray-100">
              <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <HelpCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-gray-900">Central de Ajuda</h4>
                  <p className="text-sm text-gray-500">FAQ e tutoriais</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="pt-4 pb-2">
            <p className="text-center text-sm text-gray-400">
              MinhaCamera v1.0.0
            </p>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
