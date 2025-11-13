import { MobileTopBar } from "@/components/mobile-top-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useRoute, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Building2, X, Plus, Info } from "lucide-react";
import { useState, useEffect } from "react";
import type { Camera, InsertCamera, Empresa } from "@shared/schema";

export default function MobileCameraForm() {
  const [matchEdit, paramsEdit] = useRoute("/mobile/cameras/edit/:id");
  const [matchNew] = useRoute("/mobile/cameras/new");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  console.log('=== MOBILE CAMERA FORM ===');
  console.log('Match Edit:', matchEdit, 'Params:', paramsEdit);
  console.log('Match New:', matchNew);
  
  const cameraId = matchEdit && paramsEdit?.id ? parseInt(paramsEdit.id) : null;
  const isEditing = !!cameraId;
  const isSuperAdmin = user?.tipo === "super_admin";
  
  console.log('Camera ID:', cameraId);
  console.log('Is Editing:', isEditing);

  const [formData, setFormData] = useState<InsertCamera>({
    nome: "",
    protocolo: "RTSP",
    urlConexao: "",
    usuario: "",
    senhaCam: "",
    ip: "",
    porta: undefined,
    canalRtsp: "",
    onvifPort: undefined,
    profileToken: "",
    p2pId: "",
    p2pPassword: "",
    streamPath: "",
    empresaId: user?.empresaId || 0,
    ativa: true,
    localizacao: "",
    diasGravacao: 7,
    resolucaoPreferida: "720p",
  });

  const [empresaSearchTerm, setEmpresaSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);

  const { data: camera, isLoading: isLoadingCamera } = useQuery<Camera>({
    queryKey: [`/api/cameras/${cameraId}`],
    enabled: !!cameraId,
  });

  const { data: empresas } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
    enabled: isSuperAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: InsertCamera) => {
      if (isEditing) {
        return await apiRequest("PATCH", `/api/cameras/${cameraId}`, data);
      }
      return await apiRequest("POST", "/api/cameras", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      toast({
        title: isEditing ? "Câmera atualizada" : "Câmera criada",
        description: isEditing ? "A câmera foi atualizada com sucesso" : "A câmera foi criada com sucesso",
      });
      setLocation("/mobile/cameras");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: isEditing ? "Erro ao atualizar câmera" : "Erro ao criar câmera",
        description: error.message,
      });
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    console.log('=== CAMERAS FORM DEBUG ===');
    console.log('cameraId:', cameraId);
    console.log('isEditing:', isEditing);
    console.log('isLoadingCamera:', isLoadingCamera);
    console.log('camera data:', camera);
    console.log('empresas data:', empresas);
    console.log('isSuperAdmin:', isSuperAdmin);
    
    if (camera) {
      console.log('Carregando dados da câmera no formulário:', camera);
      setFormData({
        nome: camera.nome,
        protocolo: camera.protocolo || "RTSP",
        urlConexao: camera.urlConexao || "",
        usuario: camera.usuario || "",
        senhaCam: camera.senhaCam || "",
        ip: camera.ip || "",
        porta: camera.porta || undefined,
        canalRtsp: camera.canalRtsp || "",
        onvifPort: camera.onvifPort || undefined,
        profileToken: camera.profileToken || "",
        p2pId: camera.p2pId || "",
        p2pPassword: camera.p2pPassword || "",
        streamPath: camera.streamPath || "",
        empresaId: camera.empresaId,
        ativa: camera.ativa,
        localizacao: camera.localizacao || "",
        diasGravacao: camera.diasGravacao || 7,
        resolucaoPreferida: camera.resolucaoPreferida || "720p",
      });

      if (isSuperAdmin && empresas) {
        const empresa = empresas.find(e => e.id === camera.empresaId);
        console.log('Empresa encontrada:', empresa);
        if (empresa) {
          setSelectedEmpresa(empresa);
          setEmpresaSearchTerm(empresa.nome);
        }
      }
    } else {
      console.log('Câmera não carregada ainda');
    }
  }, [camera, empresas, isSuperAdmin]);

  if (isEditing && isLoadingCamera) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <MobileTopBar
          showBack
          backUrl="/mobile/cameras"
          title="Carregando..."
          subtitle="Aguarde..."
        />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  const handleSelectEmpresa = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    setFormData({ ...formData, empresaId: empresa.id });
    setEmpresaSearchTerm(empresa.nome);
  };

  const handleRemoveEmpresa = () => {
    setSelectedEmpresa(null);
    setFormData({ ...formData, empresaId: 0 });
    setEmpresaSearchTerm("");
  };

  const filteredEmpresas = empresas?.filter((empresa) => {
    if (!empresaSearchTerm) return true;
    const search = empresaSearchTerm.toLowerCase();
    return (
      empresa.nome.toLowerCase().includes(search) ||
      empresa.dominio?.toLowerCase().includes(search)
    );
  }).filter((empresa) => !selectedEmpresa || empresa.id !== selectedEmpresa.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuperAdmin && !formData.empresaId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione uma empresa",
      });
      return;
    }

    // Normalize numeric fields to avoid empty string issues
    const normalizedData = {
      ...formData,
      porta: formData.porta || undefined,
      onvifPort: formData.onvifPort || undefined,
      diasGravacao: formData.diasGravacao || 7,
    };

    saveMutation.mutate(normalizedData);
  };

  const getProtocolHelp = () => {
    switch (formData.protocolo) {
      case "RTSP":
        return "Real Time Streaming Protocol - Mais comum para câmeras IP";
      case "ONVIF":
        return "Padrão universal para câmeras IP com descoberta automática";
      case "P2P":
        return "Peer-to-Peer - Conexão direta sem configuração de rede";
      case "HTTP":
        return "Stream via HTTP/HTTPS (MJPEG, Snapshot)";
      case "RTMP":
        return "Real-Time Messaging Protocol - Para streaming ao vivo";
      case "HLS":
        return "HTTP Live Streaming - Compatível com navegadores";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <MobileTopBar
        showBack
        backUrl="/mobile/cameras"
        title={isEditing ? "Editar Câmera" : "Nova Câmera"}
        subtitle={isEditing ? "Atualize os dados da câmera" : "Preencha os dados abaixo"}
      />

      <form onSubmit={handleSubmit} className="p-4 pt-24 space-y-6">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
              Nome da Câmera <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Câmera Entrada Principal"
              required
              className="h-12 bg-white"
              data-testid="input-nome"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="protocolo" className="text-sm font-medium text-gray-700">
              Protocolo <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.protocolo}
              onValueChange={(value) => setFormData({ ...formData, protocolo: value as any })}
            >
              <SelectTrigger className="h-12 bg-white" data-testid="select-protocolo">
                <SelectValue placeholder="Selecione o protocolo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RTSP">RTSP - Real Time Streaming</SelectItem>
                <SelectItem value="ONVIF">ONVIF - Padrão Universal</SelectItem>
                <SelectItem value="P2P">P2P - Peer to Peer</SelectItem>
                <SelectItem value="HTTP">HTTP - Web Stream</SelectItem>
                <SelectItem value="RTMP">RTMP - Real-Time Messaging</SelectItem>
                <SelectItem value="HLS">HLS - HTTP Live Streaming</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">{getProtocolHelp()}</p>
            </div>
          </div>

          {/* Campos para RTSP */}
          {formData.protocolo === "RTSP" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="urlConexao" className="text-sm font-medium text-gray-700">
                  URL RTSP <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="urlConexao"
                  value={formData.urlConexao}
                  onChange={(e) => setFormData({ ...formData, urlConexao: e.target.value })}
                  placeholder="rtsp://usuario:senha@192.168.1.100:554/stream"
                  className="h-12 bg-white font-mono text-sm"
                  data-testid="input-url-conexao"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="canalRtsp" className="text-sm font-medium text-gray-700">
                  Canal/Caminho do Stream
                </Label>
                <Input
                  id="canalRtsp"
                  value={formData.canalRtsp}
                  onChange={(e) => setFormData({ ...formData, canalRtsp: e.target.value })}
                  placeholder="/stream1 ou /Streaming/Channels/101"
                  className="h-12 bg-white font-mono text-sm"
                  data-testid="input-canal-rtsp"
                />
              </div>
            </>
          )}

          {/* Campos para ONVIF */}
          {formData.protocolo === "ONVIF" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="ip" className="text-sm font-medium text-gray-700">
                  IP da Câmera <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ip"
                  value={formData.ip}
                  onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                  placeholder="192.168.1.100"
                  className="h-12 bg-white font-mono"
                  data-testid="input-ip"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="onvifPort" className="text-sm font-medium text-gray-700">
                    Porta ONVIF
                  </Label>
                  <Input
                    id="onvifPort"
                    type="number"
                    value={formData.onvifPort || ""}
                    onChange={(e) => setFormData({ ...formData, onvifPort: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="80"
                    className="h-12 bg-white"
                    data-testid="input-onvif-port"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="porta" className="text-sm font-medium text-gray-700">
                    Porta RTSP
                  </Label>
                  <Input
                    id="porta"
                    type="number"
                    value={formData.porta || ""}
                    onChange={(e) => setFormData({ ...formData, porta: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="554"
                    className="h-12 bg-white"
                    data-testid="input-porta"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="usuario" className="text-sm font-medium text-gray-700">
                  Usuário
                </Label>
                <Input
                  id="usuario"
                  value={formData.usuario}
                  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                  placeholder="admin"
                  className="h-12 bg-white"
                  data-testid="input-usuario"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senhaCam" className="text-sm font-medium text-gray-700">
                  Senha
                </Label>
                <Input
                  id="senhaCam"
                  type="password"
                  value={formData.senhaCam}
                  onChange={(e) => setFormData({ ...formData, senhaCam: e.target.value })}
                  placeholder="••••••••"
                  className="h-12 bg-white"
                  data-testid="input-senha-cam"
                />
              </div>
            </>
          )}

          {/* Campos para P2P */}
          {formData.protocolo === "P2P" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="p2pId" className="text-sm font-medium text-gray-700">
                  ID do Dispositivo P2P <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="p2pId"
                  value={formData.p2pId}
                  onChange={(e) => setFormData({ ...formData, p2pId: e.target.value })}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="h-12 bg-white font-mono"
                  data-testid="input-p2p-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p2pPassword" className="text-sm font-medium text-gray-700">
                  Senha P2P
                </Label>
                <Input
                  id="p2pPassword"
                  type="password"
                  value={formData.p2pPassword}
                  onChange={(e) => setFormData({ ...formData, p2pPassword: e.target.value })}
                  placeholder="••••••••"
                  className="h-12 bg-white"
                  data-testid="input-p2p-password"
                />
              </div>
            </>
          )}

          {/* Campos para HTTP/RTMP/HLS */}
          {(formData.protocolo === "HTTP" || formData.protocolo === "RTMP" || formData.protocolo === "HLS") && (
            <>
              <div className="space-y-2">
                <Label htmlFor="urlConexao" className="text-sm font-medium text-gray-700">
                  URL de Conexão <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="urlConexao"
                  value={formData.urlConexao}
                  onChange={(e) => setFormData({ ...formData, urlConexao: e.target.value })}
                  placeholder={
                    formData.protocolo === "HLS"
                      ? "https://exemplo.com/stream.m3u8"
                      : formData.protocolo === "RTMP"
                      ? "rtmp://servidor/live/stream"
                      : "http://192.168.1.100/video.cgi"
                  }
                  className="h-12 bg-white font-mono text-sm"
                  data-testid="input-url-conexao"
                />
              </div>
              {formData.protocolo === "HTTP" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="usuario" className="text-sm font-medium text-gray-700">
                      Usuário
                    </Label>
                    <Input
                      id="usuario"
                      value={formData.usuario}
                      onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                      placeholder="admin"
                      className="h-12 bg-white"
                      data-testid="input-usuario"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senhaCam" className="text-sm font-medium text-gray-700">
                      Senha
                    </Label>
                    <Input
                      id="senhaCam"
                      type="password"
                      value={formData.senhaCam}
                      onChange={(e) => setFormData({ ...formData, senhaCam: e.target.value })}
                      placeholder="••••••••"
                      className="h-12 bg-white"
                      data-testid="input-senha-cam"
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="streamPath" className="text-sm font-medium text-gray-700">
                  Caminho do Stream
                </Label>
                <Input
                  id="streamPath"
                  value={formData.streamPath}
                  onChange={(e) => setFormData({ ...formData, streamPath: e.target.value })}
                  placeholder="/stream ou /live/main"
                  className="h-12 bg-white font-mono text-sm"
                  data-testid="input-stream-path"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="localizacao" className="text-sm font-medium text-gray-700">
              Localização
            </Label>
            <Input
              id="localizacao"
              value={formData.localizacao}
              onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
              placeholder="Ex: Portaria Principal"
              className="h-12 bg-white"
              data-testid="input-localizacao"
            />
          </div>

          {isSuperAdmin && (
            <div className="space-y-2">
              <Label htmlFor="empresa" className="text-sm font-medium text-gray-700">
                Empresa <span className="text-red-500">*</span>
              </Label>

              {selectedEmpresa ? (
                <div className="flex items-center gap-2 p-3 rounded-md border bg-white">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedEmpresa.nome}</p>
                    {selectedEmpresa.dominio && (
                      <p className="text-xs text-muted-foreground truncate">{selectedEmpresa.dominio}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={handleRemoveEmpresa}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    id="empresa"
                    placeholder="Buscar empresa por nome ou domínio..."
                    value={empresaSearchTerm}
                    onChange={(e) => setEmpresaSearchTerm(e.target.value)}
                    className="h-12 bg-white"
                    data-testid="input-empresa-search"
                  />

                  {empresaSearchTerm && filteredEmpresas && filteredEmpresas.length > 0 && (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-2 bg-white">
                      {filteredEmpresas.map((empresa) => (
                        <div
                          key={empresa.id}
                          className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                          onClick={() => handleSelectEmpresa(empresa)}
                          data-testid={`search-result-empresa-${empresa.id}`}
                        >
                          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{empresa.nome}</p>
                            {empresa.dominio && (
                              <p className="text-xs text-muted-foreground truncate">{empresa.dominio}</p>
                            )}
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}

                  {empresaSearchTerm && filteredEmpresas && filteredEmpresas.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg bg-white">
                      Nenhuma empresa encontrada
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="resolucaoPreferida" className="text-sm font-medium text-gray-700">
              Resolução
            </Label>
            <Select
              value={formData.resolucaoPreferida}
              onValueChange={(value) => setFormData({ ...formData, resolucaoPreferida: value })}
            >
              <SelectTrigger className="h-12 bg-white" data-testid="select-resolucao">
                <SelectValue placeholder="Selecione a resolução" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="480p">480p</SelectItem>
                <SelectItem value="720p">720p (HD)</SelectItem>
                <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                <SelectItem value="4K">4K (Ultra HD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diasGravacao" className="text-sm font-medium text-gray-700">
              Dias de Gravação
            </Label>
            <Input
              id="diasGravacao"
              type="number"
              min="1"
              max="365"
              value={formData.diasGravacao}
              onChange={(e) => setFormData({ ...formData, diasGravacao: parseInt(e.target.value) || 7 })}
              className="h-12 bg-white"
              data-testid="input-dias-gravacao"
            />
            <p className="text-xs text-muted-foreground">
              Período de retenção das gravações
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white rounded-md border p-4">
              <div>
                <Label htmlFor="ativa" className="text-sm font-medium text-gray-700">
                  Câmera Ativa
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Câmera disponível para visualização
                </p>
              </div>
              <Switch
                id="ativa"
                checked={formData.ativa}
                onCheckedChange={(checked) => setFormData({ ...formData, ativa: checked })}
                data-testid="switch-ativa"
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold"
            disabled={saveMutation.isPending}
            data-testid="button-submit"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                {isEditing ? "Atualizar Câmera" : "Criar Câmera"}
              </>
            )}
          </Button>
        </div>
      </form>

      <MobileBottomNav />
    </div>
  );
}