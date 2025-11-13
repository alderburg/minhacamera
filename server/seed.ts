import { db } from "./db";
import { users, empresas, clientes, cameras, cameraAcessos } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Check if super admin already exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@minhacamera.com"));

    if (existingAdmin) {
      console.log("✅ Super admin already exists");
      return;
    }

    // Create super admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const [superAdmin] = await db
      .insert(users)
      .values({
        nome: "Super Administrador",
        email: "admin@minhacamera.com",
        senha: hashedPassword,
        tipo: "super_admin",
        ativo: true,
      })
      .returning();

    console.log("✅ Super admin created:");
    console.log("   Email: admin@minhacamera.com");
    console.log("   Senha: admin123");

    // Create a demo company
    const [empresa1] = await db
      .insert(empresas)
      .values({
        nome: "Empresa Demo",
        logo: null,
        dominio: "demo.minhacamera.com",
        ativo: true,
      })
      .returning();

    console.log("✅ Demo company created:", empresa1.nome);

    // Create admin user for the company
    const hashedAdminPassword = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db
      .insert(users)
      .values({
        nome: "Admin Empresa Demo",
        email: "admin@demo.com",
        senha: hashedAdminPassword,
        tipo: "admin",
        empresaId: empresa1.id,
        ativo: true,
      })
      .returning();

    console.log("✅ Company admin created:");
    console.log("   Email: admin@demo.com");
    console.log("   Senha: admin123");

    // Create demo client
    const [cliente1] = await db
      .insert(clientes)
      .values({
        nome: "Cliente Demo",
        email: "cliente@demo.com",
        telefone: "(11) 99999-9999",
        empresaId: empresa1.id,
        ativo: true,
      })
      .returning();

    console.log("✅ Demo client created:", cliente1.nome);

    // Create user account for the client
    const hashedUserPassword = await bcrypt.hash("cliente123", 10);
    const [clienteUser] = await db
      .insert(users)
      .values({
        nome: cliente1.nome,
        email: cliente1.email,
        senha: hashedUserPassword,
        tipo: "user",
        empresaId: empresa1.id,
        clienteId: cliente1.id,
        ativo: true,
      })
      .returning();

    console.log("✅ Client user created:");
    console.log("   Email: cliente@demo.com");
    console.log("   Senha: cliente123");

    // Create demo cameras
    const [camera1] = await db
      .insert(cameras)
      .values({
        nome: "Câmera Entrada Principal",
        urlRtsp: "rtsp://demo:demo@192.168.1.100:554/stream1",
        empresaId: empresa1.id,
        localizacao: "Portaria Principal - Térreo",
        ativa: true,
        diasGravacao: 7,
        resolucaoPreferida: "1080p",
      })
      .returning();

    const [camera2] = await db
      .insert(cameras)
      .values({
        nome: "Câmera Estacionamento",
        urlRtsp: "rtsp://demo:demo@192.168.1.101:554/stream1",
        empresaId: empresa1.id,
        localizacao: "Estacionamento - Subsolo",
        ativa: true,
        diasGravacao: 7,
        resolucaoPreferida: "720p",
      })
      .returning();

    console.log("✅ Demo cameras created");

    // Give client access to cameras
    await db.insert(cameraAcessos).values([
      {
        cameraId: camera1.id,
        clienteId: cliente1.id,
      },
      {
        cameraId: camera2.id,
        clienteId: cliente1.id,
      },
    ]);

    console.log("✅ Camera access granted to client");

    console.log("\n🎉 Database seed completed successfully!");
    console.log("\n📋 Test Credentials:");
    console.log("   Super Admin: admin@minhacamera.com / admin123");
    console.log("   Company Admin: admin@demo.com / admin123");
    console.log("   End User: cliente@demo.com / cliente123");
  } catch (error) {
    console.error("❌ Seed error:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seed();
