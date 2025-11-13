import { sql, relations } from "drizzle-orm";
import { pgTable, text, integer, boolean, unique, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - supports super_admin, admin (company), and user (client) roles
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senha: text("senha").notNull(),
  tipo: text("tipo").notNull(), // 'super_admin' | 'admin' | 'user'
  empresaId: integer("empresa_id").references(() => empresas.id),
  clienteId: integer("cliente_id").references(() => clientes.id), // Link users to clients for end-user access
  ativo: boolean("ativo").notNull().default(true),
});

// Companies table - multi-tenant support with white-label
export const empresas = pgTable("empresas", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nome: text("nome").notNull(),
  logo: text("logo"),
  dominio: text("dominio"),
  ativo: boolean("ativo").notNull().default(true),
});

// Clients table - end users who view cameras
export const clientes = pgTable("clientes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  telefone: text("telefone"),
  empresaId: integer("empresa_id").notNull().references(() => empresas.id),
  ativo: boolean("ativo").notNull().default(true),
});

// Cameras table - IP cameras with multiple protocol support
export const cameras = pgTable("cameras", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nome: text("nome").notNull(),
  protocolo: text("protocolo").notNull().default("RTSP"), // 'RTSP' | 'ONVIF' | 'P2P' | 'HTTP' | 'RTMP' | 'HLS'

  // URL/Conexão - campos genéricos que servem para todos os protocolos
  urlConexao: text("url_conexao"), // URL principal (RTSP, HTTP, HLS, etc)
  usuario: text("usuario"), // Usuário para autenticação
  senhaCam: text("senha_cam"), // Senha da câmera

  // Campos específicos para cada protocolo
  ip: text("ip"), // IP da câmera (ONVIF, P2P)
  porta: integer("porta"), // Porta de conexão
  canalRtsp: text("canal_rtsp"), // Canal RTSP (ex: /stream1, /Streaming/Channels/101)

  // ONVIF específico
  onvifPort: integer("onvif_port"), // Porta ONVIF (geralmente 80 ou 8000)
  profileToken: text("profile_token"), // Token do perfil ONVIF

  // P2P específico
  p2pId: text("p2p_id"), // ID único do dispositivo P2P
  p2pPassword: text("p2p_password"), // Senha P2P

  // HTTP/RTMP/HLS específico
  streamPath: text("stream_path"), // Caminho do stream (para HTTP/HLS)

  empresaId: integer("empresa_id").notNull().references(() => empresas.id),
  localizacao: text("localizacao"),
  ativa: boolean("ativa").notNull().default(true),
  status: text("status").notNull().default("offline"), // 'online' | 'offline' | 'error' | 'disabled'

  // Configurações
  diasGravacao: integer("dias_gravacao").default(7),
  resolucaoPreferida: text("resolucao_preferida").default("720p"),
});

// Camera access control - prevents duplicate access entries
export const cameraAcessos = pgTable("camera_acessos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  cameraId: integer("camera_id").notNull().references(() => cameras.id, { onDelete: "cascade" }),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
}, (table) => ({
  // Composite unique constraint to prevent duplicate camera/client mappings
  uniqueCameraCliente: unique().on(table.cameraId, table.clienteId),
}));

// Notifications table - system and camera notifications
export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'success' | 'warning' | 'error' | 'info'
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  empresaId: integer("empresa_id").references(() => empresas.id, { onDelete: "cascade" }),
});

// Define relations
export const usersRelations = relations(users, ({ one }) => ({
  empresa: one(empresas, {
    fields: [users.empresaId],
    references: [empresas.id],
  }),
  cliente: one(clientes, {
    fields: [users.clienteId],
    references: [clientes.id],
  }),
}));

export const empresasRelations = relations(empresas, ({ many }) => ({
  users: many(users),
  clientes: many(clientes),
  cameras: many(cameras),
}));

export const clientesRelations = relations(clientes, ({ one, many }) => ({
  empresa: one(empresas, {
    fields: [clientes.empresaId],
    references: [empresas.id],
  }),
  users: many(users),
  cameraAcessos: many(cameraAcessos),
}));

export const camerasRelations = relations(cameras, ({ one, many }) => ({
  empresa: one(empresas, {
    fields: [cameras.empresaId],
    references: [empresas.id],
  }),
  cameraAcessos: many(cameraAcessos),
}));

export const cameraAcessosRelations = relations(cameraAcessos, ({ one }) => ({
  camera: one(cameras, {
    fields: [cameraAcessos.cameraId],
    references: [cameras.id],
  }),
  cliente: one(clientes, {
    fields: [cameraAcessos.clienteId],
    references: [clientes.id],
  }),
}));

// Zod schemas for validation

// User schemas
export const insertUserSchema = createInsertSchema(users, {
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  tipo: z.enum(["super_admin", "admin", "user"]),
  ativo: z.boolean().optional(),
}).omit({
  id: true,
});

export const selectUserSchema = createSelectSchema(users);

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

// Empresa schemas
export const insertEmpresaSchema = createInsertSchema(empresas, {
  nome: z.string().min(1, "Nome da empresa é obrigatório"),
  ativo: z.boolean().optional(),
}).omit({
  id: true,
});

export const selectEmpresaSchema = createSelectSchema(empresas);

// Cliente schemas
export const insertClienteSchema = createInsertSchema(clientes, {
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  empresaId: z.number().int().positive("Empresa ID é obrigatório"),
  ativo: z.boolean().optional(),
}).omit({
  id: true,
});

export const selectClienteSchema = createSelectSchema(clientes);

// Camera schemas
export const insertCameraSchema = createInsertSchema(cameras, {
  nome: z.string().min(1, "Nome da câmera é obrigatório"),
  protocolo: z.enum(["RTSP", "ONVIF", "P2P", "HTTP", "RTMP", "HLS"]),
  empresaId: z.number().int().positive("Empresa ID é obrigatório"),
  ativa: z.boolean().optional(),
  status: z.enum(["online", "offline", "error", "disabled"]).optional().default("offline"),
  // Campos opcionais dependendo do protocolo
  urlConexao: z.string().optional(),
  usuario: z.string().optional(),
  senhaCam: z.string().optional(),
  ip: z.string().optional(),
  porta: z.number().int().optional(),
  canalRtsp: z.string().optional(),
  onvifPort: z.number().int().optional(),
  profileToken: z.string().optional(),
  p2pId: z.string().optional(),
  p2pPassword: z.string().optional(),
  streamPath: z.string().optional(),
}).omit({
  id: true,
});

export const selectCameraSchema = createSelectSchema(cameras);

// Camera access schemas
export const insertCameraAcessoSchema = createInsertSchema(cameraAcessos, {
  cameraId: z.number().int().positive(),
  clienteId: z.number().int().positive(),
}).omit({
  id: true,
});

export const selectCameraAcessoSchema = createSelectSchema(cameraAcessos);

// Batch camera access schema for assigning multiple clients to a camera
export const batchCameraAcessoSchema = z.object({
  cameraId: z.number().int().positive(),
  clienteIds: z.array(z.number().int().positive()),
});

// TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEmpresa = z.infer<typeof insertEmpresaSchema>;
export type Empresa = typeof empresas.$inferSelect;

export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientes.$inferSelect;

export type InsertCamera = z.infer<typeof insertCameraSchema>;
export type Camera = typeof cameras.$inferSelect;

export type InsertCameraAcesso = z.infer<typeof insertCameraAcessoSchema>;
export type CameraAcesso = typeof cameraAcessos.$inferSelect;
export type BatchCameraAcesso = z.infer<typeof batchCameraAcessoSchema>;

// Notification schemas
export const insertNotificationSchema = createInsertSchema(notifications, {
  title: z.string().min(1, "Título é obrigatório"),
  message: z.string().min(1, "Mensagem é obrigatória"),
  type: z.enum(["success", "warning", "error", "info"]),
  read: z.boolean().optional(),
  userId: z.number().int().optional(),
  empresaId: z.number().int().optional(),
}).omit({
  id: true,
  createdAt: true, // createdAt is managed by defaultNow()
});

export const selectNotificationSchema = createSelectSchema(notifications);

// TypeScript types for notifications
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;