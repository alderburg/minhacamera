import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { User } from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

export interface AuthRequest extends Request {
  user?: User;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token inválido" });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    if (!allowedRoles.includes(req.user.tipo)) {
      return res.status(403).json({ message: "Sem permissão para acessar este recurso" });
    }

    next();
  };
}

// Alias for authenticateToken
export const requireAuth = authenticateToken;

// Helper functions for role checking
export function isAdmin(user: User | undefined): boolean {
  return user?.tipo === "admin" || user?.tipo === "super_admin";
}

export function isSuperAdmin(user: User | undefined): boolean {
  return user?.tipo === "super_admin";
}
