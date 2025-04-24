import { type Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertClientSchema, 
  insertServiceSchema, 
  insertServiceItemSchema,
  insertQuoteSchema,
  insertQuoteItemSchema,
  insertWorkOrderSchema,
  insertUserSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateQuotePDF, generateWorkOrderPDF } from "./pdf-generator";
import fs from "fs";
import path from "path";
import { upload, setupStaticFiles, handleMulterError, getImageUrl } from "./upload";

// Middleware to check authentication
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Middleware to check admin role
function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Set up static files
  setupStaticFiles(app);
  
  // Handle multer errors
  app.use(handleMulterError);
  
  // Middleware para bloquear métodos não permitidos em rotas específicas
  app.get("/api/register", (req, res) => {
    return res.status(405).json({ message: "Método não permitido. Use POST para registrar um usuário." });
  });
  
  // Middleware para verificar content-type em requisições de modificação
  app.use((req, res, next) => {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (!safeMethods.includes(req.method)) {
      // Para requisições não-GET, verifique se o content-type é adequado
      const contentType = req.headers['content-type'] || '';
      const hasValidContentType = 
        contentType.includes('application/json') || 
        contentType.includes('multipart/form-data') ||
        contentType.includes('application/x-www-form-urlencoded');
        
      if (!hasValidContentType && req.method !== 'DELETE') {
        console.log(`Requisição ${req.method} com content-type inválido: ${contentType}`);
        return res.status(415).json({ 
          message: "Formato de conteúdo inválido. Use application/json, multipart/form-data ou application/x-www-form-urlencoded" 
        });
      }
    }
    next();
  });

  // Ensure PDF directory exists
  const pdfDir = path.resolve("./public/pdf");
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  // Serve static PDFs
  app.use("/pdf", express.static(pdfDir));

  // Client routes
  app.get("/api/clients", requireAuth, async (req, res) => {
    try {
      const clients = await storage.listClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error getting clients" });
    }
  });

  app.get("/api/clients/:id", requireAuth, async (req, res) => {
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

  app.post("/api/clients", requireAuth, async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating client" });
    }
  });

  app.put("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.updateClient(id, clientData);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error updating client" });
    }
  });
  
  // Delete client
  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se existem serviços, orçamentos ou ordens de serviço associados
      const services = await storage.listServicesByClient(id);
      if (services.length > 0) {
        return res.status(400).json({ 
          message: "Não é possível excluir o cliente porque existem serviços associados a ele" 
        });
      }
      
      // Verificar orçamentos
      const quotes = await storage.listQuotesByClient(id);
      if (quotes.length > 0) {
        return res.status(400).json({ 
          message: "Não é possível excluir o cliente porque existem orçamentos associados a ele" 
        });
      }
      
      // Verificar ordens de serviço
      const workOrders = await storage.listWorkOrdersByClient(id);
      if (workOrders.length > 0) {
        return res.status(400).json({ 
          message: "Não é possível excluir o cliente porque existem ordens de serviço associadas a ele" 
        });
      }
      
      const success = await storage.deleteClient(id);
      
      if (!success) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      
      res.json({ message: "Cliente excluído com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao excluir cliente" });
    }
  });

  // Service routes
  app.get("/api/services", requireAuth, async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      if (clientId) {
        const services = await storage.listServicesByClient(clientId);
        return res.json(services);
      }
      
      const services = await storage.listServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Error getting services" });
    }
  });

  app.get("/api/services/:id", requireAuth, async (req, res) => {
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

  app.post("/api/services", requireAuth, async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating service" });
    }
  });

  app.put("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const serviceData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(id, serviceData);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json(service);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error updating service" });
    }
  });
  
  // Delete service
  app.delete("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o serviço existe
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }
      
      // Verificar se há ordens de serviço associadas
      const workOrders = await storage.listWorkOrders();
      const associatedWorkOrders = workOrders.filter(wo => wo.serviceId === id);
      if (associatedWorkOrders.length > 0) {
        return res.status(400).json({ 
          message: "Não é possível excluir o serviço porque existem ordens de serviço associadas a ele" 
        });
      }
      
      // Excluir o serviço
      const success = await storage.deleteService(id);
      
      if (!success) {
        return res.status(500).json({ message: "Erro ao excluir serviço" });
      }
      
      res.json({ message: "Serviço excluído com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao excluir serviço" });
    }
  });

  // Service items routes
  app.get("/api/services/:serviceId/items", requireAuth, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const items = await storage.listServiceItems(serviceId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Error getting service items" });
    }
  });

  app.post("/api/services/:serviceId/items", requireAuth, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const itemData = insertServiceItemSchema.parse({
        ...req.body,
        serviceId
      });
      
      const item = await storage.createServiceItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating service item" });
    }
  });

  // Quote routes
  app.get("/api/quotes", requireAuth, async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      if (clientId) {
        const quotes = await storage.listQuotesByClient(clientId);
        return res.json(quotes);
      }
      
      const quotes = await storage.listQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: "Error getting quotes" });
    }
  });

  app.get("/api/quotes/:id", requireAuth, async (req, res) => {
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

  app.post("/api/quotes", requireAuth, async (req, res) => {
    try {
      const quoteData = insertQuoteSchema.parse(req.body);
      const quote = await storage.createQuote(quoteData);
      res.status(201).json(quote);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating quote" });
    }
  });

  app.put("/api/quotes/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quoteData = insertQuoteSchema.partial().parse(req.body);
      const quote = await storage.updateQuote(id, quoteData);
      
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      
      res.json(quote);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error updating quote" });
    }
  });
  
  // Delete quote
  app.delete("/api/quotes/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o orçamento existe
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ message: "Orçamento não encontrado" });
      }
      
      // Excluir o orçamento
      const success = await storage.deleteQuote(id);
      
      if (!success) {
        return res.status(500).json({ message: "Erro ao excluir orçamento" });
      }
      
      res.json({ message: "Orçamento excluído com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao excluir orçamento" });
    }
  });

  // Quote items routes
  app.get("/api/quotes/:quoteId/items", requireAuth, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.quoteId);
      const items = await storage.listQuoteItems(quoteId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Error getting quote items" });
    }
  });

  app.post("/api/quotes/:quoteId/items", requireAuth, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.quoteId);
      const itemData = insertQuoteItemSchema.parse({
        ...req.body,
        quoteId
      });
      
      const item = await storage.createQuoteItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating quote item" });
    }
  });

  // Generate quote PDF
  app.get("/api/quotes/:id/generate-pdf", requireAuth, async (req, res) => {
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
      
      // Update the quote with the PDF path
      await storage.updateQuote(quoteId, { pdfPath });
      
      res.json({ pdfPath });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error generating PDF" });
    }
  });

  // Work Order routes
  app.get("/api/work-orders", requireAuth, async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      if (clientId) {
        const workOrders = await storage.listWorkOrdersByClient(clientId);
        return res.json(workOrders);
      }
      
      const workOrders = await storage.listWorkOrders();
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ message: "Error getting work orders" });
    }
  });

  app.get("/api/work-orders/:id", requireAuth, async (req, res) => {
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

  app.post("/api/work-orders", requireAuth, async (req, res) => {
    try {
      const workOrderData = insertWorkOrderSchema.parse(req.body);
      const workOrder = await storage.createWorkOrder(workOrderData);
      res.status(201).json(workOrder);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating work order" });
    }
  });

  app.put("/api/work-orders/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workOrderData = insertWorkOrderSchema.partial().parse(req.body);
      const workOrder = await storage.updateWorkOrder(id, workOrderData);
      
      if (!workOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }
      
      res.json(workOrder);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error updating work order" });
    }
  });
  
  // Delete work order
  app.delete("/api/work-orders/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se a ordem de serviço existe
      const workOrder = await storage.getWorkOrder(id);
      if (!workOrder) {
        return res.status(404).json({ message: "Ordem de serviço não encontrada" });
      }
      
      // Excluir a ordem de serviço
      const success = await storage.deleteWorkOrder(id);
      
      if (!success) {
        return res.status(500).json({ message: "Erro ao excluir ordem de serviço" });
      }
      
      res.json({ message: "Ordem de serviço excluída com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao excluir ordem de serviço" });
    }
  });

  // Generate work order PDF
  app.get("/api/work-orders/:id/generate-pdf", requireAuth, async (req, res) => {
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
      
      // Get technicians
      const users = await storage.listUsers();
      const technicians = users.filter(user => 
        workOrder.technicianIds && workOrder.technicianIds.includes(user.id.toString())
      );
      
      const pdfPath = await generateWorkOrderPDF({
        workOrder,
        service,
        client,
        items,
        technicians
      });
      
      // Update the work order with the PDF path
      await storage.updateWorkOrder(workOrderId, { pdfPath });
      
      res.json({ pdfPath });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error generating PDF" });
    }
  });

  // User management routes (admin only)
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.listUsers();
      
      // Remove passwords from response
      const safeUsers = users.map(({password, ...user}) => user);
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Error getting users" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...safeUser } = user;
      
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Error getting user" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create the user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Remove password from response
      const { password, ...safeUser } = user;
      
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });

  // Rota para upload de foto do usuário
  app.post("/api/users/:id/photo", upload.single('photo'), async (req, res) => {
    try {
      console.log("Iniciando upload de foto");
      console.log("Autenticado:", req.isAuthenticated());
      console.log("User:", req.user);
      console.log("File:", req.file);
      
      const id = parseInt(req.params.id);
      
      // Verifica se o usuário está autenticado
      if (!req.isAuthenticated()) {
        console.log("Usuário não autenticado");
        return res.status(401).json({ message: "Não autorizado" });
      }
      
      // Verifica se o usuário é admin ou está atualizando seu próprio perfil
      if (req.user.role !== 'admin' && req.user.id !== id) {
        console.log("Permissão negada");
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Verifica se o usuário existe
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Verifica se foi enviado um arquivo
      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma foto enviada" });
      }
      
      // Atualiza a foto do usuário
      const photoUrl = getImageUrl(req.file.filename);
      
      // Se o usuário já tinha uma foto, excluir o arquivo antigo
      if (user.photoUrl) {
        const oldFilename = user.photoUrl.split('/').pop();
        if (oldFilename) {
          const uploadDir = path.join(process.cwd(), 'uploads');
          const oldFilePath = path.join(uploadDir, oldFilename);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      }
      
      const updatedUser = await storage.updateUser(id, { photoUrl });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Erro ao atualizar foto do usuário" });
      }
      
      // Remove a senha da resposta
      const { password, ...safeUser } = updatedUser;
      
      res.json({ ...safeUser, photoUrl });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao fazer upload da foto" });
    }
  });



  app.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Parse the update data, but make password optional
      const updateData = insertUserSchema.partial().parse(req.body);
      
      // Hash the password if provided
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }
      
      const user = await storage.updateUser(id, updateData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...safeUser } = user;
      
      res.json(safeUser);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error updating user" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}

// Helper function for password hashing (imported from auth.ts)
import { promisify } from "util";
import { scrypt, randomBytes } from "crypto";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}
