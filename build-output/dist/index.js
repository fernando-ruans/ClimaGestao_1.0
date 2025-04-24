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
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  completedDate: true,
  createdAt: true,
  updatedAt: true
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
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
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
      secure: process.env.NODE_ENV === "production"
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

// server/pdf-generator.ts
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
function addHeaderWithLogo(doc, title) {
  const logoPath = path.resolve("./public/img/logo.png");
  if (fs.existsSync(logoPath)) {
    const logoWidth = 80;
    doc.image(logoPath, 50, 40, {
      width: logoWidth
    });
    doc.moveDown(4);
  } else {
    doc.fontSize(20).fillColor("#1a56db").text("SAM CLIMATIZA", { align: "left" }).moveDown(3);
  }
  doc.fontSize(16).fillColor("#1a56db").text(title, { align: "center" }).moveDown();
}
async function generateQuotePDF(data) {
  const { quote, client, items } = data;
  const filename = `quote_${quote.id}_${Date.now()}.pdf`;
  const outputDir = path.resolve("./public/pdf");
  const outputPath = path.join(outputDir, filename);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);
  addHeaderWithLogo(doc, "OR\xC7AMENTO");
  doc.fontSize(12).fillColor("#000").text(`Or\xE7amento #ORC-${quote.id}`, { continued: true }).text(`Data: ${new Date(quote.createdAt).toLocaleDateString("pt-BR")}`, { align: "right" }).moveDown();
  if (quote.validUntil) {
    doc.text(`Validade: ${new Date(quote.validUntil).toLocaleDateString("pt-BR")}`).moveDown();
  }
  doc.fontSize(14).fillColor("#1d4ed8").text("Dados do Cliente").moveDown(0.5);
  doc.fontSize(12).fillColor("#000").text(`Nome: ${client.name}`).text(`Contato: ${client.contactName || "-"}`).text(`Email: ${client.email || "-"}`).text(`Telefone: ${client.phone || "-"}`).text(`Endere\xE7o: ${client.address || "-"}`).moveDown();
  if (quote.description) {
    doc.fontSize(14).fillColor("#1d4ed8").text("Descri\xE7\xE3o").moveDown(0.5);
    doc.fontSize(12).fillColor("#000").text(quote.description).moveDown();
  }
  doc.fontSize(14).fillColor("#1d4ed8").text("Itens do Or\xE7amento").moveDown(0.5);
  const tableTop = doc.y;
  const itemX = 50;
  const typeX = 230;
  const qtyX = 300;
  const priceX = 370;
  const totalX = 450;
  doc.fontSize(10).fillColor("#666").text("Descri\xE7\xE3o", itemX, tableTop).text("Tipo", typeX, tableTop).text("Qtd", qtyX, tableTop).text("Valor Unit.", priceX, tableTop).text("Total", totalX, tableTop).moveDown();
  doc.strokeColor("#ddd").moveTo(itemX, doc.y).lineTo(550, doc.y).stroke().moveDown(0.5);
  let totalAmount = 0;
  items.forEach((item) => {
    const y = doc.y;
    const unitPrice = (item.unitPrice / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
    const totalPrice = (item.total / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
    totalAmount += item.total;
    doc.fontSize(10).fillColor("#000").text(item.description, itemX, y, { width: 170 }).text(item.type === "material" ? "Material" : "Servi\xE7o", typeX, y).text(item.quantity.toString(), qtyX, y).text(unitPrice, priceX, y).text(totalPrice, totalX, y).moveDown();
    doc.strokeColor("#ddd").moveTo(itemX, doc.y).lineTo(550, doc.y).stroke().moveDown(0.5);
  });
  const formattedTotal = (totalAmount / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
  doc.fontSize(12).fillColor("#000").text(`Valor Total: ${formattedTotal}`, { align: "right" }).moveDown(2);
  doc.fontSize(12).text("Termos e Condi\xE7\xF5es:", { underline: true }).fontSize(10).text("1. Or\xE7amento v\xE1lido pelo prazo informado acima.", { continued: false, indent: 10 }).text("2. Valores sujeitos a altera\xE7\xE3o ap\xF3s o prazo de validade.", { continued: false, indent: 10 }).text("3. Pagamento conforme negocia\xE7\xE3o com o cliente.", { continued: false, indent: 10 }).moveDown(3);
  const signatureY = doc.y;
  doc.strokeColor("#000").moveTo(100, signatureY).lineTo(250, signatureY).stroke();
  doc.moveTo(350, signatureY).lineTo(500, signatureY).stroke();
  doc.fontSize(10).text("Assinatura do Cliente", 120, signatureY + 5).text("Data", 415, signatureY + 5);
  doc.end();
  return new Promise((resolve, reject) => {
    stream.on("finish", () => {
      resolve(`/pdf/${filename}`);
    });
    stream.on("error", reject);
  });
}
async function generateWorkOrderPDF(data) {
  const { workOrder, service, client, items, technicians } = data;
  const filename = `workorder_${workOrder.id}_${Date.now()}.pdf`;
  const outputDir = path.resolve("./public/pdf");
  const outputPath = path.join(outputDir, filename);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);
  addHeaderWithLogo(doc, "ORDEM DE SERVI\xC7O");
  doc.fontSize(12).fillColor("#000").text(`Ordem de Servi\xE7o #OS-${workOrder.id}`, { continued: true }).text(`Data: ${new Date(workOrder.createdAt).toLocaleDateString("pt-BR")}`, { align: "right" }).moveDown();
  if (workOrder.scheduledDate) {
    doc.text(`Data agendada: ${new Date(workOrder.scheduledDate).toLocaleDateString("pt-BR")}`).moveDown();
  }
  doc.fontSize(14).fillColor("#1d4ed8").text("Dados do Cliente").moveDown(0.5);
  doc.fontSize(12).fillColor("#000").text(`Nome: ${client.name}`).text(`Contato: ${client.contactName || "-"}`).text(`Email: ${client.email || "-"}`).text(`Telefone: ${client.phone || "-"}`).text(`Endere\xE7o: ${client.address || "-"}`).moveDown();
  doc.fontSize(14).fillColor("#1d4ed8").text("Dados do Servi\xE7o").moveDown(0.5);
  let serviceTypeLabel = service.serviceType;
  switch (service.serviceType) {
    case "installation":
      serviceTypeLabel = "Instala\xE7\xE3o";
      break;
    case "maintenance":
      serviceTypeLabel = "Manuten\xE7\xE3o";
      break;
    case "repair":
      serviceTypeLabel = "Reparo";
      break;
    case "inspection":
      serviceTypeLabel = "Vistoria";
      break;
  }
  let statusLabel = workOrder.status;
  switch (workOrder.status) {
    case "completed":
      statusLabel = "Conclu\xEDdo";
      break;
    case "in_progress":
      statusLabel = "Em andamento";
      break;
    case "pending":
      statusLabel = "Pendente";
      break;
    case "cancelled":
      statusLabel = "Cancelado";
      break;
  }
  doc.fontSize(12).fillColor("#000").text(`Tipo: ${serviceTypeLabel}`).text(`Status: ${statusLabel}`);
  if (service.description) {
    doc.text(`Descri\xE7\xE3o: ${service.description}`);
  }
  doc.moveDown();
  if (technicians.length > 0) {
    doc.fontSize(14).fillColor("#1d4ed8").text("T\xE9cnicos Respons\xE1veis").moveDown(0.5);
    technicians.forEach((tech) => {
      doc.fontSize(12).fillColor("#000").text(`${tech.name} (${tech.role})`);
    });
    doc.moveDown();
  }
  doc.fontSize(14).fillColor("#1d4ed8").text("Materiais e Servi\xE7os").moveDown(0.5);
  const tableTop = doc.y;
  const itemX = 50;
  const typeX = 230;
  const qtyX = 300;
  const priceX = 370;
  const totalX = 450;
  doc.fontSize(10).fillColor("#666").text("Descri\xE7\xE3o", itemX, tableTop).text("Tipo", typeX, tableTop).text("Qtd", qtyX, tableTop).text("Valor Unit.", priceX, tableTop).text("Total", totalX, tableTop).moveDown();
  doc.strokeColor("#ddd").moveTo(itemX, doc.y).lineTo(550, doc.y).stroke().moveDown(0.5);
  let totalAmount = 0;
  let totalMaterials = 0;
  let totalServices = 0;
  items.forEach((item) => {
    const y = doc.y;
    const unitPrice = (item.unitPrice / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
    const totalPrice = (item.total / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
    totalAmount += item.total;
    if (item.type === "material") {
      totalMaterials += item.total;
    } else {
      totalServices += item.total;
    }
    doc.fontSize(10).fillColor("#000").text(item.description, itemX, y, { width: 170 }).text(item.type === "material" ? "Material" : "Servi\xE7o", typeX, y).text(item.quantity.toString(), qtyX, y).text(unitPrice, priceX, y).text(totalPrice, totalX, y).moveDown();
    doc.strokeColor("#ddd").moveTo(itemX, doc.y).lineTo(550, doc.y).stroke().moveDown(0.5);
  });
  const formattedTotalMaterials = (totalMaterials / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
  const formattedTotalServices = (totalServices / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
  const formattedTotal = (totalAmount / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
  doc.fontSize(12).fillColor("#000").text(`Total Materiais: ${formattedTotalMaterials}`, { align: "right" }).text(`Total Servi\xE7os: ${formattedTotalServices}`, { align: "right" }).text(`Valor Total: ${formattedTotal}`, { align: "right" }).moveDown(2);
  doc.fontSize(14).fillColor("#1d4ed8").text("Conclus\xE3o do Servi\xE7o").moveDown(0.5);
  const signatureY = doc.y;
  doc.strokeColor("#000").moveTo(100, signatureY).lineTo(250, signatureY).stroke();
  doc.moveTo(350, signatureY).lineTo(500, signatureY).stroke();
  doc.fontSize(10).text("Assinatura do Cliente", 120, signatureY + 5).text("Assinatura do T\xE9cnico", 370, signatureY + 5).moveDown(2);
  doc.fontSize(12).fillColor("#000").text("Observa\xE7\xF5es:", { underline: true }).moveDown();
  const commentBoxY = doc.y;
  doc.rect(50, commentBoxY, 500, 100).stroke();
  doc.end();
  return new Promise((resolve, reject) => {
    stream.on("finish", () => {
      resolve(`/pdf/${filename}`);
    });
    stream.on("error", reject);
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
async function registerRoutes(app2) {
  setupAuth(app2);
  setupStaticFiles(app2);
  app2.use(handleMulterError);
  app2.get("/api/register", (req, res) => {
    return res.status(405).json({ message: "M\xE9todo n\xE3o permitido. Use POST para registrar um usu\xE1rio." });
  });
  app2.use((req, res, next) => {
    const safeMethods = ["GET", "HEAD", "OPTIONS"];
    if (!safeMethods.includes(req.method)) {
      const contentType = req.headers["content-type"] || "";
      const hasValidContentType = contentType.includes("application/json") || contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded");
      if (!hasValidContentType && req.method !== "DELETE") {
        console.log(`Requisi\xE7\xE3o ${req.method} com content-type inv\xE1lido: ${contentType}`);
        return res.status(415).json({
          message: "Formato de conte\xFAdo inv\xE1lido. Use application/json, multipart/form-data ou application/x-www-form-urlencoded"
        });
      }
    }
    next();
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
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating service" });
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
  app2.get("/api/quotes/:id/generate-pdf", requireAuth, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.id);
      const quote = await storage.getQuote(quoteId);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      const client = await storage.getClient(quote.clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      const items = await storage.listQuoteItems(quoteId);
      const pdfPath = await generateQuotePDF({
        quote,
        client,
        items
      });
      await storage.updateQuote(quoteId, { pdfPath });
      res.json({ pdfPath });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error generating PDF" });
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
  app2.get("/api/work-orders/:id/generate-pdf", requireAuth, async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      const workOrder = await storage.getWorkOrder(workOrderId);
      if (!workOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }
      const service = await storage.getService(workOrder.serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      const client = await storage.getClient(workOrder.clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      const items = await storage.listServiceItems(workOrder.serviceId);
      const users2 = await storage.listUsers();
      const technicians = users2.filter(
        (user) => workOrder.technicianIds && workOrder.technicianIds.includes(user.id.toString())
      );
      const pdfPath = await generateWorkOrderPDF({
        workOrder,
        service,
        client,
        items,
        technicians
      });
      await storage.updateWorkOrder(workOrderId, { pdfPath });
      res.json({ pdfPath });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error generating PDF" });
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
