// Referenced from javascript_database blueprint
import {
  users,
  empresas,
  clientes,
  cameras,
  cameraAcessos,
  type User,
  type InsertUser,
  type Empresa,
  type InsertEmpresa,
  type Cliente,
  type InsertCliente,
  type Camera,
  type InsertCamera,
  type CameraAcesso,
  type InsertCameraAcesso,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Empresas
  getAllEmpresas(): Promise<Empresa[]>;
  getEmpresa(id: number): Promise<Empresa | undefined>;
  createEmpresa(empresa: InsertEmpresa): Promise<Empresa>;
  
  // Clientes
  getAllClientes(empresaId?: number): Promise<Cliente[]>;
  getCliente(id: number): Promise<Cliente | undefined>;
  createCliente(cliente: InsertCliente): Promise<Cliente>;
  
  // Cameras
  getAllCameras(empresaId?: number): Promise<Camera[]>;
  getCamerasForCliente(clienteId: number): Promise<Camera[]>;
  getCamera(id: number): Promise<Camera | undefined>;
  createCamera(camera: InsertCamera): Promise<Camera>;
  
  // Camera Acessos
  getCameraAcessos(cameraId: number): Promise<CameraAcesso[]>;
  createCameraAcesso(acesso: InsertCameraAcesso): Promise<CameraAcesso>;
  deleteCameraAcessos(cameraId: number): Promise<void>;
  
  // Dashboard Stats
  getDashboardStats(empresaId?: number): Promise<{
    totalEmpresas: number;
    totalClientes: number;
    totalCameras: number;
    camerasOnline: number;
    camerasOffline: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Empresas
  async getAllEmpresas(): Promise<Empresa[]> {
    return await db.select().from(empresas);
  }

  async getEmpresa(id: number): Promise<Empresa | undefined> {
    const [empresa] = await db.select().from(empresas).where(eq(empresas.id, id));
    return empresa || undefined;
  }

  async createEmpresa(insertEmpresa: InsertEmpresa): Promise<Empresa> {
    const [empresa] = await db.insert(empresas).values(insertEmpresa).returning();
    return empresa;
  }

  async updateEmpresa(id: number, updateData: InsertEmpresa): Promise<Empresa | undefined> {
    const [empresa] = await db.update(empresas).set(updateData).where(eq(empresas.id, id)).returning();
    return empresa || undefined;
  }

  async deleteEmpresa(id: number): Promise<void> {
    await db.delete(empresas).where(eq(empresas.id, id));
  }

  // Clientes
  async getAllClientes(empresaId?: number): Promise<Cliente[]> {
    if (empresaId) {
      return await db.select().from(clientes).where(eq(clientes.empresaId, empresaId));
    }
    return await db.select().from(clientes);
  }

  async getCliente(id: number): Promise<Cliente | undefined> {
    const [cliente] = await db.select().from(clientes).where(eq(clientes.id, id));
    return cliente || undefined;
  }

  async createCliente(insertCliente: InsertCliente): Promise<Cliente> {
    const [cliente] = await db.insert(clientes).values(insertCliente).returning();
    return cliente;
  }

  async updateCliente(id: number, updateData: InsertCliente): Promise<Cliente | undefined> {
    const [cliente] = await db.update(clientes).set(updateData).where(eq(clientes.id, id)).returning();
    return cliente || undefined;
  }

  async deleteCliente(id: number): Promise<void> {
    await db.delete(clientes).where(eq(clientes.id, id));
  }

  // Cameras
  async getAllCameras(empresaId?: number): Promise<Camera[]> {
    if (empresaId) {
      return await db.select().from(cameras).where(eq(cameras.empresaId, empresaId));
    }
    return await db.select().from(cameras);
  }

  async getCamerasForCliente(clienteId: number): Promise<Camera[]> {
    const acessos = await db
      .select()
      .from(cameraAcessos)
      .where(eq(cameraAcessos.clienteId, clienteId));

    if (acessos.length === 0) {
      return [];
    }

    const cameraIds = acessos.map((a) => a.cameraId);
    return await db.select().from(cameras).where(inArray(cameras.id, cameraIds));
  }

  async getCamera(id: number): Promise<Camera | undefined> {
    const [camera] = await db.select().from(cameras).where(eq(cameras.id, id));
    return camera || undefined;
  }

  async createCamera(insertCamera: InsertCamera): Promise<Camera> {
    const [camera] = await db.insert(cameras).values(insertCamera).returning();
    return camera;
  }

  async updateCamera(id: number, updateData: InsertCamera): Promise<Camera | undefined> {
    const [camera] = await db.update(cameras).set(updateData).where(eq(cameras.id, id)).returning();
    return camera || undefined;
  }

  async deleteCamera(id: number): Promise<void> {
    await db.delete(cameras).where(eq(cameras.id, id));
  }

  // Camera Acessos
  async getCameraAcessos(cameraId: number): Promise<CameraAcesso[]> {
    return await db.select().from(cameraAcessos).where(eq(cameraAcessos.cameraId, cameraId));
  }

  async createCameraAcesso(insertAcesso: InsertCameraAcesso): Promise<CameraAcesso> {
    const [acesso] = await db.insert(cameraAcessos).values(insertAcesso).returning();
    return acesso;
  }

  async deleteCameraAcessos(cameraId: number): Promise<void> {
    await db.delete(cameraAcessos).where(eq(cameraAcessos.cameraId, cameraId));
  }

  // Dashboard Stats
  async getDashboardStats(empresaId?: number): Promise<{
    totalEmpresas: number;
    totalClientes: number;
    totalCameras: number;
    camerasOnline: number;
    camerasOffline: number;
  }> {
    let totalEmpresas = 0;
    let totalClientes = 0;
    let totalCameras = 0;
    let camerasOnline = 0;
    let camerasOffline = 0;

    if (empresaId) {
      // Stats scoped to specific company
      const clientesList = await this.getAllClientes(empresaId);
      const camerasList = await this.getAllCameras(empresaId);

      totalEmpresas = 1;
      totalClientes = clientesList.length;
      totalCameras = camerasList.length;
      camerasOnline = camerasList.filter((c) => c.ativa).length;
      camerasOffline = camerasList.filter((c) => !c.ativa).length;
    } else {
      // Global stats for super admin
      const empresasList = await this.getAllEmpresas();
      const clientesList = await this.getAllClientes();
      const camerasList = await this.getAllCameras();

      totalEmpresas = empresasList.length;
      totalClientes = clientesList.length;
      totalCameras = camerasList.length;
      camerasOnline = camerasList.filter((c) => c.ativa).length;
      camerasOffline = camerasList.filter((c) => !c.ativa).length;
    }

    return {
      totalEmpresas,
      totalClientes,
      totalCameras,
      camerasOnline,
      camerasOffline,
    };
  }
}

export const storage = new DatabaseStorage();
