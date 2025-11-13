import { sql, relations } from "drizzle-orm";
import { pgTable, text, integer, boolean, unique } from "drizzle-orm/pg-core";
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

// Cameras table - IP cameras with RTSP streaming
export const cameras = pgTable("cameras", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nome: text("nome").notNull(),
  urlRtsp: text("url_rtsp").notNull(),
  empresaId: integer("empresa_id").notNull().references(() => empresas.id),
  localizacao: text("localizacao"),
  ativa: boolean("ativa").notNull().default(true),
  // Future expansion fields
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
  urlRtsp: z.string().min(1, "URL RTSP é obrigatória"),
  empresaId: z.number().int().positive("Empresa ID é obrigatório"),
  ativa: z.boolean().optional(),
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
