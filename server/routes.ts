import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { authenticateToken, requireRole, type AuthRequest } from "./middleware";
import {
  loginSchema,
  insertEmpresaSchema,
  insertClienteSchema,
  insertCameraSchema,
  batchCameraAcessoSchema,
  insertUserSchema,
} from "@shared/schema";
import { startCameraStream, stopCameraStream, getStreamPath, getStreamDir } from './streaming';
import { checkMultipleCameras } from './camera-health';
import { existsSync } from 'fs';
import { join } from 'path';

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cookieParser());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ==================== AUTH ROUTES ====================

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, senha } = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const isPasswordValid = await bcrypt.compare(senha, user.senha);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      if (!user.ativo) {
        return res.status(403).json({ message: "Usuário inativo" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, tipo: user.tipo, empresaId: user.empresaId, clienteId: user.clienteId },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return user without password
      const { senha: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro no login" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logout realizado com sucesso" });
  });

  // Get current user
  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    // Fetch fresh user data
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const { senha: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  // ==================== EMPRESAS ROUTES (Super Admin only) ====================

  app.get("/api/empresas", authenticateToken, requireRole("super_admin"), async (req: AuthRequest, res) => {
    try {
      const empresas = await storage.getAllEmpresas();
      res.json(empresas);
    } catch (error) {
      console.error("Get empresas error:", error);
      res.status(500).json({ message: "Erro ao buscar empresas" });
    }
  });

  app.get("/api/empresas/:id", authenticateToken, requireRole("super_admin"), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const empresa = await storage.getEmpresa(id);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      res.json(empresa);
    } catch (error) {
      console.error("Get empresa error:", error);
      res.status(500).json({ message: "Erro ao buscar empresa" });
    }
  });

  app.post("/api/empresas", authenticateToken, requireRole("super_admin"), async (req: AuthRequest, res) => {
    try {
      const empresaData = insertEmpresaSchema.parse(req.body);
      const empresa = await storage.createEmpresa(empresaData);
      res.status(201).json(empresa);
    } catch (error) {
      console.error("Create empresa error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao criar empresa" });
    }
  });

  app.patch("/api/empresas/:id", authenticateToken, requireRole("super_admin"), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const empresaData = insertEmpresaSchema.parse(req.body);
      const empresa = await storage.updateEmpresa(id, empresaData);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      res.json(empresa);
    } catch (error) {
      console.error("Update empresa error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao atualizar empresa" });
    }
  });

  app.delete("/api/empresas/:id", authenticateToken, requireRole("super_admin"), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEmpresa(id);
      res.json({ message: "Empresa excluída com sucesso" });
    } catch (error) {
      console.error("Delete empresa error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao excluir empresa" });
    }
  });

  // Check subdomain availability
  app.get("/api/empresas/check-subdomain/:subdomain", authenticateToken, requireRole("super_admin"), async (req: AuthRequest, res) => {
    try {
      const subdomain = req.params.subdomain.toLowerCase().trim();
      const fullDomain = `${subdomain}.minhacamera.com`;
      
      // Validate subdomain format (only alphanumeric and hyphens)
      if (!/^[a-z0-9-]+$/.test(subdomain)) {
        return res.json({ available: false, message: "Use apenas letras, números e hífen" });
      }
      
      // Check if domain already exists
      const existingEmpresa = await storage.getEmpresaByDominio(fullDomain);
      
      if (existingEmpresa) {
        return res.json({ available: false, message: "Subdomínio já está em uso" });
      }
      
      res.json({ available: true, message: "Subdomínio disponível" });
    } catch (error) {
      console.error("Check subdomain error:", error);
      res.status(500).json({ available: false, message: "Erro ao verificar disponibilidade" });
    }
  });

  // ==================== CLIENTES ROUTES ====================

  app.get("/api/clientes", authenticateToken, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      
      // Super admin sees all, admin sees only their company's clients
      const empresaId = user.tipo === "super_admin" ? undefined : user.empresaId!;
      const clientes = await storage.getAllClientes(empresaId);
      
      res.json(clientes);
    } catch (error) {
      console.error("Get clientes error:", error);
      res.status(500).json({ message: "Erro ao buscar clientes" });
    }
  });

  app.get("/api/clientes/:id", authenticateToken, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const id = parseInt(req.params.id);
      const cliente = await storage.getCliente(id);
      
      if (!cliente) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      // If admin, verify cliente belongs to their company
      if (user.tipo === "admin" && user.empresaId && cliente.empresaId !== user.empresaId) {
        return res.status(403).json({ message: "Sem permissão para visualizar este cliente" });
      }
      
      res.json(cliente);
    } catch (error) {
      console.error("Get cliente error:", error);
      res.status(500).json({ message: "Erro ao buscar cliente" });
    }
  });

  app.post("/api/clientes", authenticateToken, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const clienteData = insertClienteSchema.parse(req.body);

      // If admin (not super_admin), force empresaId to their own company
      if (user.tipo === "admin") {
        if (!user.empresaId) {
          return res.status(403).json({ message: "Admin sem empresa associada" });
        }
        clienteData.empresaId = user.empresaId;
      }

      // Validate empresa exists
      const empresa = await storage.getEmpresa(clienteData.empresaId);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      const cliente = await storage.createCliente(clienteData);
      res.status(201).json(cliente);
    } catch (error) {
      console.error("Create cliente error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao criar cliente" });
    }
  });

  app.patch("/api/clientes/:id", authenticateToken, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const id = parseInt(req.params.id);
      const clienteData = insertClienteSchema.parse(req.body);

      // Verify cliente exists
      const existingCliente = await storage.getCliente(id);
      if (!existingCliente) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      // If admin, verify cliente belongs to their company
      if (user.tipo === "admin") {
        if (!user.empresaId || existingCliente.empresaId !== user.empresaId) {
          return res.status(403).json({ message: "Sem permissão para editar este cliente" });
        }
        clienteData.empresaId = user.empresaId;
      }

      const cliente = await storage.updateCliente(id, clienteData);
      res.json(cliente);
    } catch (error) {
      console.error("Update cliente error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao atualizar cliente" });
    }
  });

  app.delete("/api/clientes/:id", authenticateToken, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const id = parseInt(req.params.id);

      // Verify cliente exists
      const existingCliente = await storage.getCliente(id);
      if (!existingCliente) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      // If admin, verify cliente belongs to their company
      if (user.tipo === "admin") {
        if (!user.empresaId || existingCliente.empresaId !== user.empresaId) {
          return res.status(403).json({ message: "Sem permissão para excluir este cliente" });
        }
      }

      await storage.deleteCliente(id);
      res.json({ message: "Cliente excluído com sucesso" });
    } catch (error) {
      console.error("Delete cliente error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao excluir cliente" });
    }
  });

  // ==================== CAMERAS ROUTES ====================

  app.get("/api/cameras", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;

      let cameras;
      if (user.tipo === "user") {
        // Users only see cameras they have access to
        if (!user.clienteId) {
          return res.json([]);
        }
        cameras = await storage.getCamerasForCliente(user.clienteId);
      } else if (user.tipo === "admin") {
        // Admins see their company's cameras
        cameras = await storage.getAllCameras(user.empresaId!);
      } else {
        // Super admins see all cameras
        cameras = await storage.getAllCameras();
      }

      res.json(cameras);
    } catch (error) {
      console.error("Get cameras error:", error);
      res.status(500).json({ message: "Erro ao buscar câmeras" });
    }
  });

  app.get("/api/cameras/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const id = parseInt(req.params.id);
      const camera = await storage.getCamera(id);
      
      if (!camera) {
        return res.status(404).json({ message: "Câmera não encontrada" });
      }

      // Verify permissions based on user type
      if (user.tipo === "super_admin") {
        // Super admins can access all cameras
        return res.json(camera);
      }
      
      if (user.tipo === "admin") {
        // Admins can only access cameras from their company
        if (!user.empresaId || camera.empresaId !== user.empresaId) {
          return res.status(403).json({ message: "Sem permissão para visualizar esta câmera" });
        }
        return res.json(camera);
      }
      
      // Users can only access cameras they have permission for
      if (!user.clienteId) {
        return res.status(403).json({ message: "Sem permissão para visualizar esta câmera" });
      }
      const hasAccess = await storage.clienteHasAccessToCamera(user.clienteId, id);
      if (!hasAccess) {
        return res.status(403).json({ message: "Sem permissão para visualizar esta câmera" });
      }
      
      res.json(camera);
    } catch (error) {
      console.error("Get camera error:", error);
      res.status(500).json({ message: "Erro ao buscar câmera" });
    }
  });

  app.post("/api/cameras", authenticateToken, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      
      // If admin (not super_admin), inject empresaId before validation
      if (user.tipo === "admin") {
        if (!user.empresaId) {
          return res.status(403).json({ message: "Admin sem empresa associada" });
        }
        req.body.empresaId = user.empresaId;
      }
      
      const cameraData = insertCameraSchema.parse(req.body);

      // Validate empresa exists
      const empresa = await storage.getEmpresa(cameraData.empresaId);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      const camera = await storage.createCamera(cameraData);
      res.status(201).json(camera);
    } catch (error) {
      console.error("Create camera error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao criar câmera" });
    }
  });

  app.patch("/api/cameras/:id", authenticateToken, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const id = parseInt(req.params.id);

      // Verify camera exists
      const existingCamera = await storage.getCamera(id);
      if (!existingCamera) {
        return res.status(404).json({ message: "Câmera não encontrada" });
      }

      // If admin, verify camera belongs to their company and inject empresaId before validation
      if (user.tipo === "admin") {
        if (!user.empresaId || existingCamera.empresaId !== user.empresaId) {
          return res.status(403).json({ message: "Sem permissão para editar esta câmera" });
        }
        req.body.empresaId = user.empresaId;
      }
      
      const cameraData = insertCameraSchema.parse(req.body);

      const camera = await storage.updateCamera(id, cameraData);
      res.json(camera);
    } catch (error) {
      console.error("Update camera error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao atualizar câmera" });
    }
  });

  app.delete("/api/cameras/:id", authenticateToken, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const id = parseInt(req.params.id);

      // Verify camera exists
      const existingCamera = await storage.getCamera(id);
      if (!existingCamera) {
        return res.status(404).json({ message: "Câmera não encontrada" });
      }

      // If admin, verify camera belongs to their company
      if (user.tipo === "admin") {
        if (!user.empresaId || existingCamera.empresaId !== user.empresaId) {
          return res.status(403).json({ message: "Sem permissão para excluir esta câmera" });
        }
      }

      await storage.deleteCamera(id);
      res.json({ message: "Câmera excluída com sucesso" });
    } catch (error) {
      console.error("Delete camera error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao excluir câmera" });
    }
  });

  // ==================== CAMERA ACESSOS ROUTES ====================

  app.post("/api/camera-acessos", authenticateToken, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const { cameraId, clienteIds } = batchCameraAcessoSchema.parse(req.body);
      const user = req.user!;

      // Verify camera exists and belongs to user's company (if admin)
      const camera = await storage.getCamera(cameraId);
      if (!camera) {
        return res.status(404).json({ message: "Câmera não encontrada" });
      }

      if (user.tipo === "admin") {
        if (!user.empresaId || camera.empresaId !== user.empresaId) {
          return res.status(403).json({ message: "Sem permissão para gerenciar esta câmera" });
        }
      }

      // Verify all clients belong to the same company as the camera
      for (const clienteId of clienteIds) {
        const cliente = await storage.getCliente(clienteId);
        if (!cliente) {
          return res.status(404).json({ message: `Cliente ${clienteId} não encontrado` });
        }
        if (cliente.empresaId !== camera.empresaId) {
          return res.status(403).json({ message: "Cliente deve pertencer à mesma empresa da câmera" });
        }
      }

      // Delete existing access entries for this camera
      await storage.deleteCameraAcessos(cameraId);

      // Create new access entries
      const acessos = [];
      for (const clienteId of clienteIds) {
        const acesso = await storage.createCameraAcesso({ cameraId, clienteId });
        acessos.push(acesso);
      }

      res.json(acessos);
    } catch (error) {
      console.error("Create camera acesso error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao atualizar acessos" });
    }
  });

  // ==================== DASHBOARD STATS ====================

  app.get("/api/dashboard/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      
      // Super admin gets global stats, admin gets company stats, users get their client stats
      let empresaId: number | undefined;
      
      if (user.tipo === "super_admin") {
        empresaId = undefined; // All companies
      } else if (user.tipo === "admin") {
        empresaId = user.empresaId!;
      } else if (user.tipo === "user") {
        // For regular users, get stats from their client's company
        if (user.clienteId) {
          const cliente = await storage.getCliente(user.clienteId);
          empresaId = cliente?.empresaId;
        }
      }
      
      const stats = await storage.getDashboardStats(empresaId);
      
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // ==================== STREAM ENDPOINTS ====================

  // Inicia o stream de uma câmera
  app.post("/api/stream/:cameraId/start", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const cameraId = parseInt(req.params.cameraId);
      const user = req.user!;

      const camera = await storage.getCamera(cameraId);
      if (!camera) {
        return res.status(404).json({ message: "Câmera não encontrada" });
      }

      // Check access permissions
      let hasAccess = false;
      if (user.tipo === "super_admin") {
        hasAccess = true;
      } else if (user.tipo === "admin") {
        hasAccess = camera.empresaId === user.empresaId;
      } else if (user.tipo === "user" && user.clienteId) {
        const userCameras = await storage.getCamerasForCliente(user.clienteId);
        hasAccess = userCameras.some((c) => c.id === cameraId);
      }

      if (!hasAccess) {
        return res.status(403).json({ message: "Sem permissão para acessar esta câmera" });
      }

      if (!camera.urlConexao) {
        return res.status(400).json({ message: "URL de conexão não configurada para esta câmera" });
      }

      const playlistPath = await startCameraStream(cameraId, camera.urlConexao);
      res.json({ streamUrl: playlistPath });
    } catch (error) {
      console.error("Stream start error:", error);
      res.status(500).json({ message: "Erro ao iniciar stream" });
    }
  });

  // Para o stream de uma câmera
  app.post("/api/stream/:cameraId/stop", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const cameraId = parseInt(req.params.cameraId);
      await stopCameraStream(cameraId);
      res.json({ message: "Stream parado" });
    } catch (error) {
      console.error("Stream stop error:", error);
      res.status(500).json({ message: "Erro ao parar stream" });
    }
  });

  // Serve a playlist HLS
  app.get("/api/stream/:cameraId/playlist.m3u8", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const cameraId = parseInt(req.params.cameraId);
      const streamDir = getStreamDir(cameraId);
      
      if (!streamDir) {
        return res.status(404).json({ message: "Stream não iniciado" });
      }

      const playlistFile = join(streamDir, 'playlist.m3u8');
      if (!existsSync(playlistFile)) {
        return res.status(404).json({ message: "Playlist não encontrada" });
      }

      res.set('Content-Type', 'application/vnd.apple.mpegurl');
      res.sendFile(playlistFile);
    } catch (error) {
      console.error("Playlist error:", error);
      res.status(500).json({ message: "Erro ao acessar playlist" });
    }
  });

  // Serve os segmentos HLS
  app.get("/api/stream/:cameraId/:segment", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const cameraId = parseInt(req.params.cameraId);
      const segment = req.params.segment;
      const streamDir = getStreamDir(cameraId);
      
      if (!streamDir) {
        return res.status(404).json({ message: "Stream não iniciado" });
      }

      const segmentFile = join(streamDir, segment);
      if (!existsSync(segmentFile)) {
        return res.status(404).json({ message: "Segmento não encontrado" });
      }

      res.set('Content-Type', 'video/MP2T');
      res.sendFile(segmentFile);
    } catch (error) {
      console.error("Segment error:", error);
      res.status(500).json({ message: "Erro ao acessar segmento" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
