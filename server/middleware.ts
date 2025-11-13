import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { User } from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

export interface AuthRequest extends Request {
  user?: User;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  console.log('Auth check - Path:', req.path);
  console.log('Auth check - Cookies:', req.cookies);
  console.log('Auth check - Headers Cookie:', req.headers.cookie);
  
  const token = req.cookies?.token;

  if (!token) {
    console.log('No token found in cookies');
    return res.status(401).json({ message: "Não autenticado" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      tipo: decoded.tipo,
      empresaId: decoded.empresaId,
      clienteId: decoded.clienteId
    } as User;
    next();
  } catch (error) {
    console.log('Token verification failed:', error);
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
