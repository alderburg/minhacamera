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

  app.post("/api/cameras", authenticateToken, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const cameraData = insertCameraSchema.parse(req.body);

      // If admin (not super_admin), force empresaId to their own company
      if (user.tipo === "admin") {
        if (!user.empresaId) {
          return res.status(403).json({ message: "Admin sem empresa associada" });
        }
        cameraData.empresaId = user.empresaId;
      }

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

  app.get("/api/dashboard/stats", authenticateToken, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      
      // Super admin gets global stats, admin gets company stats
      const empresaId = user.tipo === "super_admin" ? undefined : user.empresaId!;
      const stats = await storage.getDashboardStats(empresaId);
      
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // ==================== STREAM ENDPOINT (Future: RTSP to HLS) ====================
  
  app.get("/api/stream/:cameraId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const cameraId = parseInt(req.params.cameraId);
      const user = req.user!;

      // Verify user has access to this camera
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

      // TODO: Implement RTSP to HLS conversion using FFmpeg
      // For now, return camera data
      res.json({ 
        camera,
        message: "Stream endpoint - RTSP to HLS conversion será implementado aqui",
        note: "Use FFmpeg para converter o stream RTSP para HLS"
      });
    } catch (error) {
      console.error("Stream error:", error);
      res.status(500).json({ message: "Erro ao acessar stream" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
