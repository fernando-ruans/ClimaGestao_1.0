var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express4 from "express";

// server/routes.ts
import express2 from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  clients: () => clients,
  insertClientSchema: () => insertClientSchema,
  insertQuoteItemSchema: () => insertQuoteItemSchema,
  insertQuoteSchema: () => insertQuoteSchema,
  insertServiceItemSchema: () => insertServiceItemSchema,
  insertServiceSchema: () => insertServiceSchema,
  insertUserSchema: () => insertUserSchema,
  insertWorkOrderSchema: () => insertWorkOrderSchema,
  quoteItems: () => quoteItems,
  quotes: () => quotes,
  serviceItems: () => serviceItems,
  services: () => services,
  users: () => users,
  workOrders: () => workOrders
});
import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("technician"),
  isActive: boolean("is_active").notNull().default(true),
  photoUrl: text("photo_url")
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isActive: true
});
var clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true
});
var services = pgTable("services", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  serviceType: text("service_type").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  scheduledDate: date("scheduled_date"),
  completedDate: date("completed_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  pdfPath: text("pdf_path")
});
var insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  completedDate: true,
  createdAt: true,
  updatedAt: true,
  pdfPath: true
});
var serviceItems = pgTable("service_items", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull(),
  type: text("type").notNull(),
  // 'material' or 'labor'
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  // Stored in cents
  total: integer("total").notNull()
  // Stored in cents
});
var insertServiceItemSchema = createInsertSchema(serviceItems).omit({
  id: true
});
var quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  serviceId: integer("service_id"),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  // pending, approved, rejected
  total: integer("total").notNull(),
  // Stored in cents
  validUntil: date("valid_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  pdfPath: text("pdf_path")
});
var insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
  pdfPath: true
});
var quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull(),
  type: text("type").notNull(),
  // 'material' or 'labor'
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  // Stored in cents
  total: integer("total").notNull()
  // Stored in cents
});
var insertQuoteItemSchema = createInsertSchema(quoteItems).omit({
  id: true
});
var workOrders = pgTable("work_orders", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  serviceId: integer("service_id").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  // pending, in_progress, completed, cancelled
  scheduledDate: date("scheduled_date"),
  completedDate: date("completed_date"),
  technicianIds: text("technician_ids").array(),
  // Array of user IDs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  pdfPath: text("pdf_path")
});
var insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  completedDate: true,
  createdAt: true,
  pdfPath: true
});

// server/storage.ts
import session from "express-session";
import createMemoryStore from "memorystore";

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var connectionString = process.env.DATABASE_URL || "postgresql://postgres:admin@localhost:5432/postgres";
var pool = new Pool({ connectionString });
var originalEnd = pool.end.bind(pool);
pool.end = async function() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return originalEnd();
};
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
var MemoryStore = createMemoryStore(session);
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  // Usando any para evitar problemas de tipagem com session.SessionStore
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 864e5
      // 24 horas
    });
  }
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(user) {
    const [newUser] = await db.insert(users).values({ ...user, isActive: true }).returning();
    return newUser;
  }
  async updateUser(id, userData) {
    const [updatedUser] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return updatedUser;
  }
  async listUsers() {
    return db.select().from(users);
  }
  // Client operations
  async getClient(id) {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }
  async createClient(client) {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }
  async updateClient(id, clientData) {
    const [updatedClient] = await db.update(clients).set(clientData).where(eq(clients.id, id)).returning();
    return updatedClient;
  }
  async listClients() {
    return db.select().from(clients);
  }
  async deleteClient(id) {
    try {
      await db.delete(clients).where(eq(clients.id, id));
      return true;
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      return false;
    }
  }
  // Service operations
  async getService(id) {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }
  async createService(service) {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }
  async updateService(id, serviceData) {
    const now = /* @__PURE__ */ new Date();
    const [updatedService] = await db.update(services).set({ ...serviceData, updatedAt: now }).where(eq(services.id, id)).returning();
    return updatedService;
  }
  async listServices() {
    return db.select().from(services);
  }
  async listServicesByClient(clientId) {
    return db.select().from(services).where(eq(services.clientId, clientId));
  }
  async deleteService(id) {
    try {
      await db.delete(serviceItems).where(eq(serviceItems.serviceId, id));
      await db.delete(services).where(eq(services.id, id));
      return true;
    } catch (error) {
      console.error("Erro ao excluir servi\xE7o:", error);
      return false;
    }
  }
  // Service items operations
  async getServiceItem(id) {
    const [item] = await db.select().from(serviceItems).where(eq(serviceItems.id, id));
    return item;
  }
  async createServiceItem(item) {
    const [newItem] = await db.insert(serviceItems).values(item).returning();
    return newItem;
  }
  async updateServiceItem(id, itemData) {
    const [updatedItem] = await db.update(serviceItems).set(itemData).where(eq(serviceItems.id, id)).returning();
    return updatedItem;
  }
  async listServiceItems(serviceId) {
    return db.select().from(serviceItems).where(eq(serviceItems.serviceId, serviceId));
  }
  // Quote operations
  async getQuote(id) {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote;
  }
  async createQuote(quote) {
    const [newQuote] = await db.insert(quotes).values({ ...quote, pdfPath: "" }).returning();
    return newQuote;
  }
  async updateQuote(id, quoteData) {
    const [updatedQuote] = await db.update(quotes).set(quoteData).where(eq(quotes.id, id)).returning();
    return updatedQuote;
  }
  async listQuotes() {
    return db.select().from(quotes);
  }
  async listQuotesByClient(clientId) {
    return db.select().from(quotes).where(eq(quotes.clientId, clientId));
  }
  async deleteQuote(id) {
    try {
      await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
      await db.delete(quotes).where(eq(quotes.id, id));
      return true;
    } catch (error) {
      console.error("Erro ao excluir or\xE7amento:", error);
      return false;
    }
  }
  // Quote items operations
  async getQuoteItem(id) {
    const [item] = await db.select().from(quoteItems).where(eq(quoteItems.id, id));
    return item;
  }
  async createQuoteItem(item) {
    const [newItem] = await db.insert(quoteItems).values(item).returning();
    return newItem;
  }
  async updateQuoteItem(id, itemData) {
    const [updatedItem] = await db.update(quoteItems).set(itemData).where(eq(quoteItems.id, id)).returning();
    return updatedItem;
  }
  async listQuoteItems(quoteId) {
    return db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  }
  // Work order operations
  async getWorkOrder(id) {
    const [workOrder] = await db.select().from(workOrders).where(eq(workOrders.id, id));
    return workOrder;
  }
  async createWorkOrder(workOrder) {
    const [newWorkOrder] = await db.insert(workOrders).values({ ...workOrder, pdfPath: "" }).returning();
    return newWorkOrder;
  }
  async updateWorkOrder(id, workOrderData) {
    const [updatedWorkOrder] = await db.update(workOrders).set(workOrderData).where(eq(workOrders.id, id)).returning();
    return updatedWorkOrder;
  }
  async listWorkOrders() {
    return db.select().from(workOrders);
  }
  async listWorkOrdersByClient(clientId) {
    return db.select().from(workOrders).where(eq(workOrders.clientId, clientId));
  }
  async deleteWorkOrder(id) {
    try {
      await db.delete(workOrders).where(eq(workOrders.id, id));
      return true;
    } catch (error) {
      console.error("Erro ao excluir ordem de servi\xE7o:", error);
      return false;
    }
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "hvac-app-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 864e5,
      // 24 hours
      secure: false,
      // Desabilita secure para desenvolvimento
      sameSite: "lax"
      // Para permitir requisições de diferentes origens
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false, { message: "Usu\xE1rio ou senha incorretos" });
        } else if (!user.isActive) {
          return done(null, false, { message: "Usu\xE1rio desativado" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Usu\xE1rio j\xE1 existe" });
      }
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      const { password, ...userWithoutPassword } = user;
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Erro no registro:", error);
      return res.status(500).json({ message: "Erro interno ao criar usu\xE1rio" });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Erro na autentica\xE7\xE3o:", err);
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Falha na autentica\xE7\xE3o" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Erro no login:", loginErr);
          return next(loginErr);
        }
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        console.error("Erro no logout:", err);
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.status(200).json({ message: "Logout realizado com sucesso" });
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}

// server/routes.ts
import { ZodError as ZodError2 } from "zod";
import { fromZodError as fromZodError2 } from "zod-validation-error";

// server/pdf-generator-new.ts
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
function addLogoToHeader(doc) {
  try {
    const logoPath = path.resolve("./attached_assets/SAM_CLIMATIZA.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 40, {
        width: 100
        // Tamanho reduzido, não muito grande
      });
      doc.moveDown(3);
    } else {
      console.warn("Logo n\xE3o encontrada:", logoPath);
      doc.fontSize(16).fillColor("#1a56db").text("SAM CLIMATIZA", 50, 50);
    }
  } catch (error) {
    console.error("Erro ao adicionar logo:", error);
  }
}
async function generateQuotePDF(data) {
  console.log("Iniciando gera\xE7\xE3o de PDF profissional para or\xE7amento");
  const { quote, client, items } = data;
  const filename = `quote_${quote.id}_${Date.now()}.pdf`;
  const outputDir = path.resolve("./public/pdf");
  const outputPath = path.join(outputDir, filename);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4"
      });
      const stream = fs.createWriteStream(outputPath);
      stream.on("finish", () => {
        console.log("PDF gerado com sucesso:", filename);
        resolve(`/pdf/${filename}`);
      });
      stream.on("error", (err) => {
        console.error("Erro no stream:", err);
        reject(err);
      });
      doc.pipe(stream);
      addLogoToHeader(doc);
      doc.fontSize(20).fillColor("#1a56db").text("OR\xC7AMENTO", { align: "right" }).fontSize(12).fillColor("#666666").text("Sistema de Gest\xE3o para Climatiza\xE7\xE3o", { align: "right" }).moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#1a56db").strokeOpacity(0.5).stroke().moveDown(1);
      const infoStartY = doc.y;
      doc.fontSize(12).fillColor("#000").text(`Or\xE7amento #ORC-${quote.id}`, 50, infoStartY).text(`Data: ${new Date(quote.createdAt).toLocaleDateString("pt-BR")}`, 50, infoStartY + 20);
      let statusText = "";
      let statusColor = "";
      switch (quote.status) {
        case "approved":
          statusText = "APROVADO";
          statusColor = "#22c55e";
          break;
        case "rejected":
          statusText = "RECUSADO";
          statusColor = "#ef4444";
          break;
        default:
          statusText = "PENDENTE";
          statusColor = "#f59e0b";
      }
      doc.fontSize(12).fillColor(statusColor).text(`Status: ${statusText}`, 350, infoStartY, { align: "right" });
      if (quote.validUntil) {
        doc.fillColor("#000").text(`Validade: ${new Date(quote.validUntil).toLocaleDateString("pt-BR")}`, 350, infoStartY + 20, { align: "right" });
      }
      doc.moveDown(2);
      const clientBoxY = doc.y;
      doc.rect(50, clientBoxY, 500, 90).fillColor("#f0f5ff").fillOpacity(0.5).fill();
      doc.fillOpacity(1).fontSize(14).fillColor("#1a56db").text("DADOS DO CLIENTE", 70, clientBoxY + 10).moveDown(0.5);
      doc.fontSize(11).fillColor("#333").text(`Nome: ${client.name}`, 70, doc.y).text(`Contato: ${client.contactName || "-"}`, 70, doc.y + 15).text(`Email: ${client.email || "-"}`, 70, doc.y + 30).text(`Telefone: ${client.phone || "-"}`, 350, clientBoxY + 40).text(`Endere\xE7o: ${client.address || "-"}`, 350, clientBoxY + 55);
      doc.moveDown(3);
      if (quote.description) {
        doc.fontSize(14).fillColor("#1a56db").text("DESCRI\xC7\xC3O", { underline: true }).moveDown(0.5).fontSize(11).fillColor("#333").text(quote.description).moveDown(1);
      }
      doc.fontSize(14).fillColor("#1a56db").text("ITENS DO OR\xC7AMENTO", { underline: true }).moveDown(0.5);
      const tableTop = doc.y + 10;
      const colWidths = [40, 260, 70, 70, 70];
      const colPositions = [
        50,
        // Item
        50 + colWidths[0],
        // Descrição 
        50 + colWidths[0] + colWidths[1],
        // Quantidade
        50 + colWidths[0] + colWidths[1] + colWidths[2],
        // Preço Unitário
        50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]
        // Total
      ];
      doc.rect(50, tableTop - 5, 500, 20).fillColor("#1a56db").fill();
      doc.fontSize(10).fillColor("#ffffff").text("Item", colPositions[0] + 5, tableTop).text("Descri\xE7\xE3o", colPositions[1], tableTop).text("Qtd", colPositions[2], tableTop, { width: colWidths[2], align: "center" }).text("Pre\xE7o", colPositions[3], tableTop, { width: colWidths[3], align: "center" }).text("Total", colPositions[4], tableTop, { width: colWidths[4], align: "center" });
      let rowY = tableTop + 20;
      items.forEach((item, i) => {
        const fillColor = i % 2 === 0 ? "#f8fafc" : "#ffffff";
        const rowHeight = 25;
        doc.rect(50, rowY, 500, rowHeight).fillColor(fillColor).fill();
        doc.fontSize(10).fillColor("#333333").text((i + 1).toString(), colPositions[0] + 5, rowY + 7).text(item.description, colPositions[1], rowY + 7, { width: colWidths[1] }).text(item.quantity.toString(), colPositions[2], rowY + 7, { width: colWidths[2], align: "center" }).text(
          (item.unitPrice / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
          colPositions[3],
          rowY + 7,
          { width: colWidths[3], align: "center" }
        ).text(
          (item.total / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
          colPositions[4],
          rowY + 7,
          { width: colWidths[4], align: "center" }
        );
        rowY += rowHeight;
      });
      doc.rect(50, tableTop - 5, 500, rowY - tableTop + 5).strokeColor("#cccccc").stroke();
      doc.rect(350, rowY, 200, 30).fillColor("#f0f5ff").fill();
      doc.fontSize(12).fillColor("#1a56db").text("TOTAL:", 360, rowY + 10).fillColor("#000").fontSize(12).text(
        (quote.total / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        colPositions[4],
        rowY + 10,
        { width: colWidths[4], align: "center" }
      );
      if (doc.y > 650) {
        doc.addPage();
      } else {
        doc.moveDown(2);
      }
      doc.fontSize(10).fillColor("#666666").text("OBSERVA\xC7\xD5ES:", { underline: true }).moveDown(0.3);
      const notesBoxY = doc.y;
      doc.rect(50, notesBoxY, 500, 50).fillColor("#f9fafb").fillOpacity(0.7).fill().strokeColor("#e5e7eb").stroke();
      doc.fillOpacity(1).fontSize(8.5).fillColor("#444444");
      doc.text("\u2022 Os pre\xE7os incluem m\xE3o de obra e material, conforme especificado.", 60, notesBoxY + 10, { width: 230 });
      doc.text("\u2022 Valores sujeitos a altera\xE7\xE3o ap\xF3s visita t\xE9cnica.", 300, notesBoxY + 10, { width: 230 });
      doc.text("\u2022 Condi\xE7\xF5es de pagamento: a combinar.", 60, notesBoxY + 30, { width: 230 });
      doc.text("\u2022 Validade da proposta: 15 dias.", 300, notesBoxY + 30, { width: 230 });
      doc.y = notesBoxY + 60;
      const signatureY = doc.y;
      const signatureWidth = 180;
      const signaturePad = 30;
      const leftSignatureX = 50 + signaturePad;
      const rightSignatureX = 300 + signaturePad;
      doc.moveTo(leftSignatureX, signatureY + 40).lineTo(leftSignatureX + signatureWidth, signatureY + 40).strokeColor("#888888").stroke();
      doc.moveTo(rightSignatureX, signatureY + 40).lineTo(rightSignatureX + signatureWidth, signatureY + 40).stroke();
      doc.fontSize(10).fillColor("#666").text("Respons\xE1vel", leftSignatureX, signatureY + 45, { width: signatureWidth, align: "center" }).text("Cliente", rightSignatureX, signatureY + 45, { width: signatureWidth, align: "center" });
      const pageHeight = doc.page.height;
      doc.fontSize(8).fillColor("#666666").text("SAM CLIMATIZA - CNPJ: XX.XXX.XXX/0001-XX", 50, pageHeight - 40, { align: "center", width: 500 }).text("Rua Exemplo, 123 - Bairro - Cidade - Estado - CEP: 00000-000", 50, pageHeight - 30, { align: "center", width: 500 }).text("Tel: (XX) XXXX-XXXX | Email: contato@samclimatiza.com.br", 50, pageHeight - 20, { align: "center", width: 500 });
      doc.end();
    } catch (error) {
      console.error("Erro na gera\xE7\xE3o do PDF:", error);
      reject(error);
    }
  });
}
async function generateWorkOrderPDF(data) {
  console.log("Iniciando gera\xE7\xE3o de PDF profissional para ordem de servi\xE7o");
  const { workOrder, service, client, items, technicians } = data;
  const filename = `workorder_${workOrder.id}_${Date.now()}.pdf`;
  const outputDir = path.resolve("./public/pdf");
  const outputPath = path.join(outputDir, filename);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4"
      });
      const stream = fs.createWriteStream(outputPath);
      stream.on("finish", () => {
        console.log("PDF gerado com sucesso:", filename);
        resolve(`/pdf/${filename}`);
      });
      stream.on("error", (err) => {
        console.error("Erro no stream:", err);
        reject(err);
      });
      doc.pipe(stream);
      addLogoToHeader(doc);
      doc.fontSize(20).fillColor("#1a56db").text("ORDEM DE SERVI\xC7O", { align: "right" }).fontSize(12).fillColor("#666666").text("Sistema de Gest\xE3o para Climatiza\xE7\xE3o", { align: "right" }).moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#1a56db").strokeOpacity(0.5).stroke().moveDown(1);
      const infoStartY = doc.y;
      doc.rect(50, infoStartY, 500, 70).fillColor("#f0f9ff").fillOpacity(0.5).fill().strokeColor("#cccccc").stroke();
      doc.fillOpacity(1).fontSize(12).fillColor("#000");
      doc.text(`Ordem de Servi\xE7o: #OS-${workOrder.id}`, 70, infoStartY + 15);
      doc.text(`Data de Cria\xE7\xE3o: ${new Date(workOrder.createdAt).toLocaleDateString("pt-BR")}`, 70, infoStartY + 35);
      let statusText = "";
      let statusColor = "";
      switch (workOrder.status) {
        case "completed":
          statusText = "CONCLU\xCDDA";
          statusColor = "#22c55e";
          break;
        case "in_progress":
          statusText = "EM ANDAMENTO";
          statusColor = "#f59e0b";
          break;
        case "cancelled":
          statusText = "CANCELADA";
          statusColor = "#ef4444";
          break;
        default:
          statusText = "PENDENTE";
          statusColor = "#3b82f6";
      }
      doc.fontSize(12).fillColor(statusColor).text(`Status: ${statusText}`, 350, infoStartY + 15, { align: "left" });
      if (workOrder.scheduledDate) {
        doc.fillColor("#000").text(`Data Agendada: ${new Date(workOrder.scheduledDate).toLocaleDateString("pt-BR")}`, 350, infoStartY + 35, { align: "left" });
      }
      doc.moveDown(4);
      const clientBoxY = doc.y;
      doc.rect(50, clientBoxY, 500, 90).fillColor("#f0f5ff").fillOpacity(0.5).fill().strokeColor("#cccccc").stroke();
      doc.fillOpacity(1).fontSize(14).fillColor("#1a56db").text("DADOS DO CLIENTE", 70, clientBoxY + 10).moveDown(0.5);
      doc.fontSize(11).fillColor("#333").text(`Nome: ${client.name}`, 70, doc.y).text(`Contato: ${client.contactName || "-"}`, 70, doc.y + 15).text(`Email: ${client.email || "-"}`, 70, doc.y + 30).text(`Telefone: ${client.phone || "-"}`, 350, clientBoxY + 40).text(`Endere\xE7o: ${client.address || "-"}`, 350, clientBoxY + 55);
      doc.moveDown(4);
      const serviceBoxY = doc.y;
      doc.rect(50, serviceBoxY, 500, 100).fillColor("#f0f7ff").fillOpacity(0.5).fill().strokeColor("#cccccc").stroke();
      doc.fillOpacity(1).fontSize(14).fillColor("#1a56db").text("DADOS DO SERVI\xC7O", 70, serviceBoxY + 10).moveDown(0.5);
      let serviceTypeText = "";
      switch (service.serviceType) {
        case "installation":
          serviceTypeText = "Instala\xE7\xE3o";
          break;
        case "maintenance":
          serviceTypeText = "Manuten\xE7\xE3o";
          break;
        case "repair":
          serviceTypeText = "Reparo";
          break;
        case "inspection":
          serviceTypeText = "Vistoria";
          break;
        default:
          serviceTypeText = service.serviceType || "-";
      }
      doc.fontSize(11).fillColor("#333").text(`Tipo: ${serviceTypeText}`, 70, doc.y).text(`Descri\xE7\xE3o: ${service.description || "-"}`, 70, doc.y + 20, { width: 450 });
      if (workOrder.description) {
        doc.text(`Observa\xE7\xF5es da OS: ${workOrder.description}`, 70, doc.y + 40, { width: 450 });
      }
      doc.moveDown(5);
      if (technicians && technicians.length > 0) {
        const techBoxY = doc.y;
        doc.fontSize(14).fillColor("#1a56db").text("T\xC9CNICOS RESPONS\xC1VEIS", { underline: true }).moveDown(0.5);
        const techPerRow = 2;
        const techWidth = 200;
        const techHeight = 40;
        const techMargin = 20;
        technicians.forEach((tech, i) => {
          const row = Math.floor(i / techPerRow);
          const col = i % techPerRow;
          const techX = 70 + col * (techWidth + techMargin);
          const techY = techBoxY + 30 + row * (techHeight + 10);
          doc.roundedRect(techX, techY, techWidth, techHeight, 5).fillColor("#f8fafc").fill().strokeColor("#e2e8f0").stroke();
          doc.fontSize(11).fillColor("#333").text(tech.name, techX + 10, techY + 10).fontSize(9).fillColor("#666").text(tech.email || "", techX + 10, techY + 25);
        });
        doc.y = techBoxY + 30 + Math.ceil(technicians.length / techPerRow) * (techHeight + 10) + 20;
      }
      if (items && items.length > 0) {
        doc.fontSize(14).fillColor("#1a56db").text("ITENS DO SERVI\xC7O", { underline: true }).moveDown(0.5);
        if (doc.y > 620) {
          doc.addPage();
        }
        const tableTop = doc.y;
        const tableWidths = [30, 220, 40, 70, 70, 70];
        const colPositions = [
          50,
          // Item
          50 + tableWidths[0],
          // Descrição
          50 + tableWidths[0] + tableWidths[1],
          // Quantidade
          50 + tableWidths[0] + tableWidths[1] + tableWidths[2],
          // Tipo
          50 + tableWidths[0] + tableWidths[1] + tableWidths[2] + tableWidths[3],
          // Preço Unitário
          50 + tableWidths[0] + tableWidths[1] + tableWidths[2] + tableWidths[3] + tableWidths[4]
          // Total
        ];
        doc.rect(50, tableTop, 500, 20).fillColor("#1a56db").fill();
        doc.fontSize(10).fillColor("#ffffff").text("Item", colPositions[0] + 5, tableTop + 6).text("Descri\xE7\xE3o", colPositions[1], tableTop + 6).text("Qtd", colPositions[2], tableTop + 6, { width: tableWidths[2], align: "center" }).text("Tipo", colPositions[3], tableTop + 6, { width: tableWidths[3], align: "center" }).text("Pre\xE7o", colPositions[4], tableTop + 6, { width: tableWidths[4], align: "center" }).text("Total", colPositions[5], tableTop + 6, { width: tableWidths[5], align: "center" });
        let rowY = tableTop + 20;
        let totalValue = 0;
        items.forEach((item, i) => {
          const rowHeight = 25;
          const fillColor = i % 2 === 0 ? "#f8fafc" : "#ffffff";
          let typeText = item.type === "material" ? "Material" : "M\xE3o de obra";
          const unitPrice = item.unitPrice || 0;
          const quantity = item.quantity || 1;
          const itemTotal = unitPrice * quantity;
          totalValue += itemTotal;
          doc.rect(50, rowY, 500, rowHeight).fillColor(fillColor).fill();
          doc.fontSize(10).fillColor("#333").text((i + 1).toString(), colPositions[0] + 5, rowY + 8).text(item.description, colPositions[1], rowY + 8, { width: tableWidths[1] }).text(quantity.toString(), colPositions[2], rowY + 8, { width: tableWidths[2], align: "center" }).text(typeText, colPositions[3], rowY + 8, { width: tableWidths[3], align: "center" }).text(
            (unitPrice / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
            colPositions[4],
            rowY + 8,
            { width: tableWidths[4], align: "center" }
          ).text(
            (itemTotal / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
            colPositions[5],
            rowY + 8,
            { width: tableWidths[5], align: "center" }
          );
          rowY += rowHeight;
        });
        doc.rect(50, tableTop, 500, rowY - tableTop).strokeColor("#cccccc").stroke();
        doc.rect(350, rowY, 200, 30).fillColor("#f0f5ff").fill();
        doc.fontSize(12).fillColor("#1a56db").text("TOTAL:", 360, rowY + 10).fillColor("#000").fontSize(12).text(
          (totalValue / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
          colPositions[5],
          rowY + 10,
          { width: tableWidths[5], align: "center" }
        );
        doc.y = rowY + 40;
      }
      if (doc.y > 650) {
        doc.addPage();
      }
      doc.fontSize(12).fillColor("#1a56db").text("CONFIRMA\xC7\xC3O DE SERVI\xC7O", { align: "center" }).moveDown(1.5);
      const signatureY = doc.y;
      const signatureWidth = 180;
      const signaturePad = 30;
      const leftSignatureX = 50 + signaturePad;
      const rightSignatureX = 300 + signaturePad;
      doc.moveTo(leftSignatureX, signatureY + 40).lineTo(leftSignatureX + signatureWidth, signatureY + 40).strokeColor("#888888").stroke();
      doc.moveTo(rightSignatureX, signatureY + 40).lineTo(rightSignatureX + signatureWidth, signatureY + 40).stroke();
      doc.fontSize(10).fillColor("#666").text("Assinatura do T\xE9cnico", leftSignatureX, signatureY + 45, { width: signatureWidth, align: "center" }).text("Assinatura do Cliente", rightSignatureX, signatureY + 45, { width: signatureWidth, align: "center" });
      doc.moveDown(3).fontSize(11).fillColor("#1a56db").text("OBSERVA\xC7\xD5ES:").moveDown(0.3);
      doc.rect(50, doc.y, 500, 60).strokeColor("#cccccc").stroke().moveDown(4);
      const pageHeight = doc.page.height;
      doc.fontSize(8).fillColor("#666666").text("SAM CLIMATIZA - CNPJ: XX.XXX.XXX/0001-XX", 50, pageHeight - 40, { align: "center", width: 500 }).text("Rua Exemplo, 123 - Bairro - Cidade - Estado - CEP: 00000-000", 50, pageHeight - 30, { align: "center", width: 500 }).text("Tel: (XX) XXXX-XXXX | Email: contato@samclimatiza.com.br", 50, pageHeight - 20, { align: "center", width: 500 });
      doc.end();
    } catch (error) {
      console.error("Erro na gera\xE7\xE3o do PDF:", error);
      reject(error);
    }
  });
}

// server/routes.ts
import fs3 from "fs";
import path3 from "path";

// server/upload.ts
import path2 from "path";
import fs2 from "fs";
import express from "express";
import multer from "multer";
import { randomUUID } from "crypto";
var uploadDir = path2.join(process.cwd(), "uploads");
if (!fs2.existsSync(uploadDir)) {
  fs2.mkdirSync(uploadDir, { recursive: true });
}
var storage2 = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = `${randomUUID()}-${Date.now()}`;
    const extension = path2.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});
var fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Apenas imagens s\xE3o permitidas"));
  }
};
var upload = multer({
  storage: storage2,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
    // limite de 5MB
  }
});
function getImageUrl(filename) {
  if (!filename) return null;
  return `/uploads/${filename}`;
}
function setupStaticFiles(app2) {
  app2.use("/uploads", (req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000");
    next();
  });
  app2.use("/uploads", express.static(uploadDir));
}
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "Arquivo muito grande. O tamanho m\xE1ximo permitido \xE9 5MB."
      });
    }
    return res.status(400).json({ error: `Erro no upload: ${err.message}` });
  } else if (err) {
    return res.status(500).json({ error: err.message });
  }
  next();
}

// server/routes.ts
import { promisify as promisify2 } from "util";
import { scrypt as scrypt2, randomBytes as randomBytes2 } from "crypto";
function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}
function requireAdmin(req, res, next) {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}
function handleContentType(req, res, next) {
  if (req.method === "POST" && req.originalUrl.includes("/generate-pdf")) {
    return next();
  }
  if (req.method === "POST" && !req.is("application/json") && !req.is("multipart/form-data")) {
    console.log("Requisi\xE7\xE3o POST com content-type inv\xE1lido: ", req.headers["content-type"]);
    return res.status(415).json({ message: "Formato de conte\xFAdo n\xE3o suportado. Use application/json ou multipart/form-data" });
  }
  next();
}
async function registerRoutes(app2) {
  app2.use(handleContentType);
  setupAuth(app2);
  setupStaticFiles(app2);
  app2.use(handleMulterError);
  app2.get("/api/register", (req, res) => {
    return res.status(405).json({ message: "M\xE9todo n\xE3o permitido. Use POST para registrar um usu\xE1rio." });
  });
  const pdfDir = path3.resolve("./public/pdf");
  if (!fs3.existsSync(pdfDir)) {
    fs3.mkdirSync(pdfDir, { recursive: true });
  }
  app2.use("/pdf", express2.static(pdfDir));
  app2.get("/api/clients", requireAuth, async (req, res) => {
    try {
      const clients2 = await storage.listClients();
      res.json(clients2);
    } catch (error) {
      res.status(500).json({ message: "Error getting clients" });
    }
  });
  app2.get("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Error getting client" });
    }
  });
  app2.post("/api/clients", requireAuth, async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating client" });
    }
  });
  app2.put("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.updateClient(id, clientData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error updating client" });
    }
  });
  app2.delete("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const services2 = await storage.listServicesByClient(id);
      if (services2.length > 0) {
        return res.status(400).json({
          message: "N\xE3o \xE9 poss\xEDvel excluir o cliente porque existem servi\xE7os associados a ele"
        });
      }
      const quotes2 = await storage.listQuotesByClient(id);
      if (quotes2.length > 0) {
        return res.status(400).json({
          message: "N\xE3o \xE9 poss\xEDvel excluir o cliente porque existem or\xE7amentos associados a ele"
        });
      }
      const workOrders2 = await storage.listWorkOrdersByClient(id);
      if (workOrders2.length > 0) {
        return res.status(400).json({
          message: "N\xE3o \xE9 poss\xEDvel excluir o cliente porque existem ordens de servi\xE7o associadas a ele"
        });
      }
      const success = await storage.deleteClient(id);
      if (!success) {
        return res.status(404).json({ message: "Cliente n\xE3o encontrado" });
      }
      res.json({ message: "Cliente exclu\xEDdo com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao excluir cliente" });
    }
  });
  app2.get("/api/services", requireAuth, async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId) : void 0;
      if (clientId) {
        const services3 = await storage.listServicesByClient(clientId);
        return res.json(services3);
      }
      const services2 = await storage.listServices();
      res.json(services2);
    } catch (error) {
      res.status(500).json({ message: "Error getting services" });
    }
  });
  app2.get("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Error getting service" });
    }
  });
  app2.post("/api/services", requireAuth, async (req, res) => {
    try {
      console.log("Dados recebidos:", req.body);
      const serviceData = insertServiceSchema.parse(req.body);
      console.log("Dados validados:", serviceData);
      const service = await storage.createService(serviceData);
      console.log("Servi\xE7o criado:", service);
      res.status(201).json(service);
    } catch (error) {
      console.error("Erro detalhado ao criar servi\xE7o:", error);
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({
        message: "Error creating service",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.put("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const serviceData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(id, serviceData);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error updating service" });
    }
  });
  app2.post("/api/services/:id/generate-pdf", requireAuth, async (req, res) => {
    res.socket?.setNoDelay(true);
    res.on("close", () => {
      console.log("Conex\xE3o com o cliente fechada");
    });
    try {
      console.log("Iniciando gera\xE7\xE3o de PDF para servi\xE7o, ID:", req.params.id);
      const serviceId = parseInt(req.params.id);
      const service = await storage.getService(serviceId);
      if (!service) {
        console.log("Servi\xE7o n\xE3o encontrado, ID:", serviceId);
        return res.status(404).json({ message: "Service not found" });
      }
      console.log("Buscando cliente ID:", service.clientId);
      const client = await storage.getClient(service.clientId);
      if (!client) {
        console.log("Cliente n\xE3o encontrado, ID:", service.clientId);
        return res.status(404).json({ message: "Client not found" });
      }
      console.log("Buscando itens do servi\xE7o");
      const items = await storage.listServiceItems(serviceId);
      console.log(`Encontrados ${items.length} itens`);
      const technicians = [];
      const workOrder = {
        id: serviceId,
        // usando o ID do serviço
        serviceId,
        clientId: service.clientId,
        createdAt: service.createdAt,
        status: service.status,
        description: service.description,
        scheduledDate: service.scheduledDate,
        completedDate: null,
        technicianIds: [],
        pdfPath: service.pdfPath
      };
      try {
        console.log("Iniciando gera\xE7\xE3o do PDF");
        const pdfPath = await generateWorkOrderPDF({
          workOrder,
          service,
          client,
          items,
          technicians
        });
        console.log("PDF gerado com sucesso:", pdfPath);
        console.log("Atualizando caminho do PDF no servi\xE7o");
        await storage.updateService(serviceId, { pdfPath });
        const fullPath = path3.resolve("./public" + pdfPath);
        console.log("Verificando exist\xEAncia do arquivo:", fullPath);
        if (fs3.existsSync(fullPath)) {
          console.log("Arquivo PDF existe no caminho:", fullPath);
        } else {
          console.error("ALERTA: Arquivo PDF n\xE3o encontrado no caminho:", fullPath);
        }
        if (!res.headersSent && res.writable) {
          return res.status(200).send({ pdfPath });
        } else {
          console.log("Resposta j\xE1 foi enviada ou n\xE3o \xE9 grav\xE1vel");
        }
      } catch (pdfError) {
        console.error("Erro espec\xEDfico na gera\xE7\xE3o do PDF:", pdfError);
        if (!res.headersSent && res.writable) {
          return res.status(500).json({
            message: `Falha espec\xEDfica ao gerar PDF: ${pdfError.message}`,
            stack: pdfError.stack
          });
        }
      }
    } catch (error) {
      console.error("Erro geral na gera\xE7\xE3o do PDF:", error);
      if (!res.headersSent && res.writable) {
        return res.status(500).json({
          message: `Erro na gera\xE7\xE3o do PDF: ${error.message}`,
          stack: error.stack
        });
      }
    }
  });
  app2.delete("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Servi\xE7o n\xE3o encontrado" });
      }
      const workOrders2 = await storage.listWorkOrders();
      const associatedWorkOrders = workOrders2.filter((wo) => wo.serviceId === id);
      if (associatedWorkOrders.length > 0) {
        return res.status(400).json({
          message: "N\xE3o \xE9 poss\xEDvel excluir o servi\xE7o porque existem ordens de servi\xE7o associadas a ele"
        });
      }
      const success = await storage.deleteService(id);
      if (!success) {
        return res.status(500).json({ message: "Erro ao excluir servi\xE7o" });
      }
      res.json({ message: "Servi\xE7o exclu\xEDdo com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao excluir servi\xE7o" });
    }
  });
  app2.get("/api/services/:serviceId/items", requireAuth, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const items = await storage.listServiceItems(serviceId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Error getting service items" });
    }
  });
  app2.post("/api/services/:serviceId/items", requireAuth, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const itemData = insertServiceItemSchema.parse({
        ...req.body,
        serviceId
      });
      const item = await storage.createServiceItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating service item" });
    }
  });
  app2.get("/api/quotes", requireAuth, async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId) : void 0;
      if (clientId) {
        const quotes3 = await storage.listQuotesByClient(clientId);
        return res.json(quotes3);
      }
      const quotes2 = await storage.listQuotes();
      res.json(quotes2);
    } catch (error) {
      res.status(500).json({ message: "Error getting quotes" });
    }
  });
  app2.get("/api/quotes/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: "Error getting quote" });
    }
  });
  app2.post("/api/quotes", requireAuth, async (req, res) => {
    try {
      const quoteData = insertQuoteSchema.parse(req.body);
      const quote = await storage.createQuote(quoteData);
      res.status(201).json(quote);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating quote" });
    }
  });
  app2.put("/api/quotes/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quoteData = insertQuoteSchema.partial().parse(req.body);
      const quote = await storage.updateQuote(id, quoteData);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error updating quote" });
    }
  });
  app2.delete("/api/quotes/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ message: "Or\xE7amento n\xE3o encontrado" });
      }
      const success = await storage.deleteQuote(id);
      if (!success) {
        return res.status(500).json({ message: "Erro ao excluir or\xE7amento" });
      }
      res.json({ message: "Or\xE7amento exclu\xEDdo com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao excluir or\xE7amento" });
    }
  });
  app2.get("/api/quotes/:quoteId/items", requireAuth, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.quoteId);
      const items = await storage.listQuoteItems(quoteId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Error getting quote items" });
    }
  });
  app2.post("/api/quotes/:quoteId/items", requireAuth, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.quoteId);
      const itemData = insertQuoteItemSchema.parse({
        ...req.body,
        quoteId
      });
      const item = await storage.createQuoteItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating quote item" });
    }
  });
  app2.post("/api/quotes/:id/generate-pdf", requireAuth, async (req, res) => {
    res.socket?.setNoDelay(true);
    res.on("close", () => {
      console.log("Conex\xE3o com o cliente fechada");
    });
    try {
      console.log("Iniciando gera\xE7\xE3o de PDF para or\xE7amento, ID:", req.params.id);
      const quoteId = parseInt(req.params.id);
      const quote = await storage.getQuote(quoteId);
      if (!quote) {
        console.log("Or\xE7amento n\xE3o encontrado, ID:", quoteId);
        return res.status(404).json({ message: "Quote not found" });
      }
      console.log("Buscando cliente ID:", quote.clientId);
      const client = await storage.getClient(quote.clientId);
      if (!client) {
        console.log("Cliente n\xE3o encontrado, ID:", quote.clientId);
        return res.status(404).json({ message: "Client not found" });
      }
      console.log("Buscando itens do or\xE7amento");
      const items = await storage.listQuoteItems(quoteId);
      console.log(`Encontrados ${items.length} itens`);
      try {
        console.log("Iniciando gera\xE7\xE3o do PDF");
        const pdfPath = await generateQuotePDF({
          quote,
          client,
          items
        });
        console.log("PDF gerado com sucesso:", pdfPath);
        console.log("Atualizando caminho do PDF no or\xE7amento");
        await storage.updateQuote(quoteId, { pdfPath });
        const fullPath = path3.resolve("./public" + pdfPath);
        console.log("Verificando exist\xEAncia do arquivo:", fullPath);
        if (fs3.existsSync(fullPath)) {
          console.log("Arquivo PDF existe no caminho:", fullPath);
        } else {
          console.error("ALERTA: Arquivo PDF n\xE3o encontrado no caminho:", fullPath);
        }
        if (!res.headersSent && res.writable) {
          return res.status(200).send({ pdfPath });
        } else {
          console.log("Resposta j\xE1 foi enviada ou n\xE3o \xE9 grav\xE1vel");
        }
      } catch (pdfError) {
        console.error("Erro espec\xEDfico na gera\xE7\xE3o do PDF:", pdfError);
        if (!res.headersSent && res.writable) {
          return res.status(500).json({
            message: `Falha espec\xEDfica ao gerar PDF: ${pdfError.message}`,
            stack: pdfError.stack
          });
        }
      }
    } catch (error) {
      console.error("Erro geral na gera\xE7\xE3o do PDF:", error);
      if (!res.headersSent && res.writable) {
        return res.status(500).json({
          message: `Erro na gera\xE7\xE3o do PDF: ${error.message}`,
          stack: error.stack
        });
      }
    }
  });
  app2.get("/api/work-orders", requireAuth, async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId) : void 0;
      if (clientId) {
        const workOrders3 = await storage.listWorkOrdersByClient(clientId);
        return res.json(workOrders3);
      }
      const workOrders2 = await storage.listWorkOrders();
      res.json(workOrders2);
    } catch (error) {
      res.status(500).json({ message: "Error getting work orders" });
    }
  });
  app2.get("/api/work-orders/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workOrder = await storage.getWorkOrder(id);
      if (!workOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }
      res.json(workOrder);
    } catch (error) {
      res.status(500).json({ message: "Error getting work order" });
    }
  });
  app2.post("/api/work-orders", requireAuth, async (req, res) => {
    try {
      const workOrderData = insertWorkOrderSchema.parse(req.body);
      const workOrder = await storage.createWorkOrder(workOrderData);
      res.status(201).json(workOrder);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating work order" });
    }
  });
  app2.put("/api/work-orders/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workOrderData = insertWorkOrderSchema.partial().parse(req.body);
      const workOrder = await storage.updateWorkOrder(id, workOrderData);
      if (!workOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }
      res.json(workOrder);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error updating work order" });
    }
  });
  app2.delete("/api/work-orders/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workOrder = await storage.getWorkOrder(id);
      if (!workOrder) {
        return res.status(404).json({ message: "Ordem de servi\xE7o n\xE3o encontrada" });
      }
      const success = await storage.deleteWorkOrder(id);
      if (!success) {
        return res.status(500).json({ message: "Erro ao excluir ordem de servi\xE7o" });
      }
      res.json({ message: "Ordem de servi\xE7o exclu\xEDda com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao excluir ordem de servi\xE7o" });
    }
  });
  app2.post("/api/work-orders/:id/generate-pdf", requireAuth, async (req, res) => {
    res.socket?.setNoDelay(true);
    res.on("close", () => {
      console.log("Conex\xE3o com o cliente fechada");
    });
    try {
      console.log("Iniciando gera\xE7\xE3o de PDF para ordem de servi\xE7o, ID:", req.params.id);
      const workOrderId = parseInt(req.params.id);
      const workOrder = await storage.getWorkOrder(workOrderId);
      if (!workOrder) {
        console.log("Ordem de servi\xE7o n\xE3o encontrada, ID:", workOrderId);
        return res.status(404).json({ message: "Work order not found" });
      }
      console.log("Buscando servi\xE7o ID:", workOrder.serviceId);
      const service = await storage.getService(workOrder.serviceId);
      if (!service) {
        console.log("Servi\xE7o n\xE3o encontrado, ID:", workOrder.serviceId);
        return res.status(404).json({ message: "Service not found" });
      }
      console.log("Buscando cliente ID:", workOrder.clientId);
      const client = await storage.getClient(workOrder.clientId);
      if (!client) {
        console.log("Cliente n\xE3o encontrado, ID:", workOrder.clientId);
        return res.status(404).json({ message: "Client not found" });
      }
      console.log("Buscando itens do servi\xE7o");
      const items = await storage.listServiceItems(workOrder.serviceId);
      console.log(`Encontrados ${items.length} itens`);
      console.log("Buscando t\xE9cnicos");
      const users2 = await storage.listUsers();
      const technicians = users2.filter(
        (user) => workOrder.technicianIds && workOrder.technicianIds.includes(user.id.toString())
      );
      console.log(`Encontrados ${technicians.length} t\xE9cnicos`);
      try {
        console.log("Iniciando gera\xE7\xE3o do PDF");
        const pdfPath = await generateWorkOrderPDF({
          workOrder,
          service,
          client,
          items,
          technicians
        });
        console.log("PDF gerado com sucesso:", pdfPath);
        console.log("Atualizando caminho do PDF na ordem de servi\xE7o");
        await storage.updateWorkOrder(workOrderId, { pdfPath });
        const fullPath = path3.resolve("./public" + pdfPath);
        console.log("Verificando exist\xEAncia do arquivo:", fullPath);
        if (fs3.existsSync(fullPath)) {
          console.log("Arquivo PDF existe no caminho:", fullPath);
        } else {
          console.error("ALERTA: Arquivo PDF n\xE3o encontrado no caminho:", fullPath);
        }
        if (!res.headersSent && res.writable) {
          return res.status(200).send({ pdfPath });
        } else {
          console.log("Resposta j\xE1 foi enviada ou n\xE3o \xE9 grav\xE1vel");
        }
      } catch (pdfError) {
        console.error("Erro espec\xEDfico na gera\xE7\xE3o do PDF:", pdfError);
        if (!res.headersSent && res.writable) {
          return res.status(500).json({
            message: `Falha espec\xEDfica ao gerar PDF: ${pdfError.message}`,
            stack: pdfError.stack
          });
        }
      }
    } catch (error) {
      console.error("Erro geral na gera\xE7\xE3o da ordem de servi\xE7o PDF:", error);
      if (!res.headersSent && res.writable) {
        return res.status(500).json({
          message: `Erro na gera\xE7\xE3o do PDF: ${error.message}`,
          stack: error.stack
        });
      }
    }
  });
  app2.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users2 = await storage.listUsers();
      const safeUsers = users2.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Error getting users" });
    }
  });
  app2.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Error getting user" });
    }
  });
  app2.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const hashedPassword = await hashPassword2(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });
  app2.post("/api/users/:id/photo", upload.single("photo"), async (req, res) => {
    try {
      console.log("Iniciando upload de foto");
      console.log("Autenticado:", req.isAuthenticated());
      console.log("User:", req.user);
      console.log("File:", req.file);
      const id = parseInt(req.params.id);
      if (!req.isAuthenticated()) {
        console.log("Usu\xE1rio n\xE3o autenticado");
        return res.status(401).json({ message: "N\xE3o autorizado" });
      }
      if (req.user.role !== "admin" && req.user.id !== id) {
        console.log("Permiss\xE3o negada");
        return res.status(403).json({ message: "Acesso negado" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Usu\xE1rio n\xE3o encontrado" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma foto enviada" });
      }
      const photoUrl = getImageUrl(req.file.filename);
      if (user.photoUrl) {
        const oldFilename = user.photoUrl.split("/").pop();
        if (oldFilename) {
          const uploadDir2 = path3.join(process.cwd(), "uploads");
          const oldFilePath = path3.join(uploadDir2, oldFilename);
          if (fs3.existsSync(oldFilePath)) {
            fs3.unlinkSync(oldFilePath);
          }
        }
      }
      const updatedUser = await storage.updateUser(id, { photoUrl });
      if (!updatedUser) {
        return res.status(500).json({ message: "Erro ao atualizar foto do usu\xE1rio" });
      }
      const { password, ...safeUser } = updatedUser;
      res.json({ ...safeUser, photoUrl });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao fazer upload da foto" });
    }
  });
  app2.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertUserSchema.partial().parse(req.body);
      if (updateData.password) {
        updateData.password = await hashPassword2(updateData.password);
      }
      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error updating user" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
var scryptAsync2 = promisify2(scrypt2);
async function hashPassword2(password) {
  const salt = randomBytes2(16).toString("hex");
  const buf = await scryptAsync2(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

// server/vite.ts
import express3 from "express";
import fs4 from "fs";
import path5 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path4 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path4.resolve(import.meta.dirname, "client", "src"),
      "@shared": path4.resolve(import.meta.dirname, "shared"),
      "@assets": path4.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path4.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path4.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path5.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs4.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path5.resolve(import.meta.dirname, "public");
  if (!fs4.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express3.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path5.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express4();
app.use(express4.json());
app.use(express4.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Erro do servidor:", err);
    res.status(status).json({ message });
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
