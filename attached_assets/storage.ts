import { 
  User, InsertUser,
  Client, InsertClient,
  Service, InsertService,
  ServiceItem, InsertServiceItem,
  Quote, InsertQuote, 
  QuoteItem, InsertQuoteItem,
  WorkOrder, InsertWorkOrder,
  users, clients, services, serviceItems, quotes, quoteItems, workOrders
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  listClients(): Promise<Client[]>;
  
  // Service operations
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<Service>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  listServices(): Promise<Service[]>;
  listServicesByClient(clientId: number): Promise<Service[]>;
  
  // Service items operations
  getServiceItem(id: number): Promise<ServiceItem | undefined>;
  createServiceItem(item: InsertServiceItem): Promise<ServiceItem>;
  updateServiceItem(id: number, item: Partial<ServiceItem>): Promise<ServiceItem | undefined>;
  listServiceItems(serviceId: number): Promise<ServiceItem[]>;
  
  // Quote operations
  getQuote(id: number): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<Quote>): Promise<Quote | undefined>;
  deleteQuote(id: number): Promise<boolean>;
  listQuotes(): Promise<Quote[]>;
  listQuotesByClient(clientId: number): Promise<Quote[]>;
  
  // Quote items operations
  getQuoteItem(id: number): Promise<QuoteItem | undefined>;
  createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem>;
  updateQuoteItem(id: number, item: Partial<QuoteItem>): Promise<QuoteItem | undefined>;
  listQuoteItems(quoteId: number): Promise<QuoteItem[]>;
  
  // Work order operations
  getWorkOrder(id: number): Promise<WorkOrder | undefined>;
  createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: number, workOrder: Partial<WorkOrder>): Promise<WorkOrder | undefined>;
  deleteWorkOrder(id: number): Promise<boolean>;
  listWorkOrders(): Promise<WorkOrder[]>;
  listWorkOrdersByClient(clientId: number): Promise<WorkOrder[]>;
  
  // Session store
  sessionStore: any; // Usando any para evitar problemas de tipagem com session.SessionStore
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private services: Map<number, Service>;
  private serviceItems: Map<number, ServiceItem>;
  private quotes: Map<number, Quote>;
  private quoteItems: Map<number, QuoteItem>;
  private workOrders: Map<number, WorkOrder>;
  
  sessionStore: any; // Usando any para evitar problemas de tipagem
  
  private userIdCounter: number;
  private clientIdCounter: number;
  private serviceIdCounter: number;
  private serviceItemIdCounter: number;
  private quoteIdCounter: number;
  private quoteItemIdCounter: number;
  private workOrderIdCounter: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.services = new Map();
    this.serviceItems = new Map();
    this.quotes = new Map();
    this.quoteItems = new Map();
    this.workOrders = new Map();
    
    this.userIdCounter = 1;
    this.clientIdCounter = 1;
    this.serviceIdCounter = 1;
    this.serviceItemIdCounter = 1;
    this.quoteIdCounter = 1;
    this.quoteItemIdCounter = 1;
    this.workOrderIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Create a default admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$kEMQlc6VjPOGAWphAlG1hu7CU74OWBb0fU0j8Lv56jQYS0LGM3jQC", // "admin123"
      name: "Administrador",
      email: "admin@climatech.com",
      role: "admin"
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { 
      ...user, 
      id, 
      isActive: true,
      role: user.role || "technician",
      photoUrl: user.photoUrl || null
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    const newClient: Client = { 
      ...client, 
      id, 
      createdAt: new Date(),
      address: client.address || null,
      contactName: client.contactName || null,
      email: client.email || null,
      phone: client.phone || null,
      city: client.city || null,
      state: client.state || null,
      zip: client.zip || null
    };
    this.clients.set(id, newClient);
    return newClient;
  }
  
  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...clientData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }
  
  async listClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }
  
  async deleteClient(id: number): Promise<boolean> {
    if (!this.clients.has(id)) return false;
    return this.clients.delete(id);
  }
  
  // Service operations
  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }
  
  async createService(service: InsertService): Promise<Service> {
    const id = this.serviceIdCounter++;
    const now = new Date();
    const newService: Service = { 
      ...service, 
      id, 
      status: service.status || "pending",
      description: service.description || null,
      scheduledDate: service.scheduledDate || null,
      completedDate: null,
      createdAt: now,
      updatedAt: now
    };
    this.services.set(id, newService);
    return newService;
  }
  
  async updateService(id: number, serviceData: Partial<Service>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;
    
    const updatedService = { 
      ...service, 
      ...serviceData,
      updatedAt: new Date()
    };
    this.services.set(id, updatedService);
    return updatedService;
  }
  
  async listServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }
  
  async listServicesByClient(clientId: number): Promise<Service[]> {
    return Array.from(this.services.values()).filter(
      (service) => service.clientId === clientId
    );
  }
  
  async deleteService(id: number): Promise<boolean> {
    if (!this.services.has(id)) return false;
    
    // Primeiro, excluir todos os itens de serviço relacionados
    const serviceItems = this.listServiceItems(id);
    for (const item of await serviceItems) {
      this.serviceItems.delete(item.id);
    }
    
    return this.services.delete(id);
  }
  
  // Service items operations
  async getServiceItem(id: number): Promise<ServiceItem | undefined> {
    return this.serviceItems.get(id);
  }
  
  async createServiceItem(item: InsertServiceItem): Promise<ServiceItem> {
    const id = this.serviceItemIdCounter++;
    const newItem: ServiceItem = { ...item, id };
    this.serviceItems.set(id, newItem);
    return newItem;
  }
  
  async updateServiceItem(id: number, itemData: Partial<ServiceItem>): Promise<ServiceItem | undefined> {
    const item = this.serviceItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemData };
    this.serviceItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async listServiceItems(serviceId: number): Promise<ServiceItem[]> {
    return Array.from(this.serviceItems.values()).filter(
      (item) => item.serviceId === serviceId
    );
  }
  
  // Quote operations
  async getQuote(id: number): Promise<Quote | undefined> {
    return this.quotes.get(id);
  }
  
  async createQuote(quote: InsertQuote): Promise<Quote> {
    const id = this.quoteIdCounter++;
    const newQuote: Quote = { 
      ...quote, 
      id, 
      status: quote.status || "pending",
      description: quote.description || null,
      serviceId: quote.serviceId || null,
      validUntil: quote.validUntil || null,
      createdAt: new Date(),
      pdfPath: null
    };
    this.quotes.set(id, newQuote);
    return newQuote;
  }
  
  async updateQuote(id: number, quoteData: Partial<Quote>): Promise<Quote | undefined> {
    const quote = this.quotes.get(id);
    if (!quote) return undefined;
    
    const updatedQuote = { ...quote, ...quoteData };
    this.quotes.set(id, updatedQuote);
    return updatedQuote;
  }
  
  async listQuotes(): Promise<Quote[]> {
    return Array.from(this.quotes.values());
  }
  
  async listQuotesByClient(clientId: number): Promise<Quote[]> {
    return Array.from(this.quotes.values()).filter(
      (quote) => quote.clientId === clientId
    );
  }
  
  async deleteQuote(id: number): Promise<boolean> {
    if (!this.quotes.has(id)) return false;
    
    // Excluir todos os itens relacionados
    const quoteItems = this.listQuoteItems(id);
    for (const item of await quoteItems) {
      this.quoteItems.delete(item.id);
    }
    
    return this.quotes.delete(id);
  }
  
  // Quote items operations
  async getQuoteItem(id: number): Promise<QuoteItem | undefined> {
    return this.quoteItems.get(id);
  }
  
  async createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem> {
    const id = this.quoteItemIdCounter++;
    const newItem: QuoteItem = { ...item, id };
    this.quoteItems.set(id, newItem);
    return newItem;
  }
  
  async updateQuoteItem(id: number, itemData: Partial<QuoteItem>): Promise<QuoteItem | undefined> {
    const item = this.quoteItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemData };
    this.quoteItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async listQuoteItems(quoteId: number): Promise<QuoteItem[]> {
    return Array.from(this.quoteItems.values()).filter(
      (item) => item.quoteId === quoteId
    );
  }
  
  // Work order operations
  async getWorkOrder(id: number): Promise<WorkOrder | undefined> {
    return this.workOrders.get(id);
  }
  
  async createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder> {
    const id = this.workOrderIdCounter++;
    const newWorkOrder: WorkOrder = { 
      ...workOrder, 
      id, 
      status: workOrder.status || "pending",
      description: workOrder.description || null,
      scheduledDate: workOrder.scheduledDate || null,
      completedDate: null,
      technicianIds: workOrder.technicianIds || null,
      createdAt: new Date(),
      pdfPath: null
    };
    this.workOrders.set(id, newWorkOrder);
    return newWorkOrder;
  }
  
  async updateWorkOrder(id: number, workOrderData: Partial<WorkOrder>): Promise<WorkOrder | undefined> {
    const workOrder = this.workOrders.get(id);
    if (!workOrder) return undefined;
    
    const updatedWorkOrder = { ...workOrder, ...workOrderData };
    this.workOrders.set(id, updatedWorkOrder);
    return updatedWorkOrder;
  }
  
  async listWorkOrders(): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values());
  }
  
  async listWorkOrdersByClient(clientId: number): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values()).filter(
      (workOrder) => workOrder.clientId === clientId
    );
  }
  
  async deleteWorkOrder(id: number): Promise<boolean> {
    if (!this.workOrders.has(id)) return false;
    return this.workOrders.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Usando any para evitar problemas de tipagem com session.SessionStore

  constructor() {
    // Usando MemoryStore em vez de PostgresSessionStore para evitar problemas com a sessão
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 horas
    });
    
    /* Descomentando para usar PostgreSQL para sessões
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
    */
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values({ ...user, isActive: true })
      .returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values(client)
      .returning();
    return newClient;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set(clientData)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async listClients(): Promise<Client[]> {
    return db.select().from(clients);
  }
  
  async deleteClient(id: number): Promise<boolean> {
    try {
      await db.delete(clients).where(eq(clients.id, id));
      return true;
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      return false;
    }
  }

  // Service operations
  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db
      .insert(services)
      .values(service)
      .returning();
    return newService;
  }

  async updateService(id: number, serviceData: Partial<Service>): Promise<Service | undefined> {
    const now = new Date();
    const [updatedService] = await db
      .update(services)
      .set({ ...serviceData, updatedAt: now })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async listServices(): Promise<Service[]> {
    return db.select().from(services);
  }

  async listServicesByClient(clientId: number): Promise<Service[]> {
    return db
      .select()
      .from(services)
      .where(eq(services.clientId, clientId));
  }
  
  async deleteService(id: number): Promise<boolean> {
    try {
      // Primeiro, excluir todos os itens de serviço relacionados
      await db.delete(serviceItems).where(eq(serviceItems.serviceId, id));
      
      // Depois excluir o serviço
      await db.delete(services).where(eq(services.id, id));
      return true;
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      return false;
    }
  }

  // Service items operations
  async getServiceItem(id: number): Promise<ServiceItem | undefined> {
    const [item] = await db.select().from(serviceItems).where(eq(serviceItems.id, id));
    return item;
  }

  async createServiceItem(item: InsertServiceItem): Promise<ServiceItem> {
    const [newItem] = await db
      .insert(serviceItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateServiceItem(id: number, itemData: Partial<ServiceItem>): Promise<ServiceItem | undefined> {
    const [updatedItem] = await db
      .update(serviceItems)
      .set(itemData)
      .where(eq(serviceItems.id, id))
      .returning();
    return updatedItem;
  }

  async listServiceItems(serviceId: number): Promise<ServiceItem[]> {
    return db
      .select()
      .from(serviceItems)
      .where(eq(serviceItems.serviceId, serviceId));
  }

  // Quote operations
  async getQuote(id: number): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote;
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [newQuote] = await db
      .insert(quotes)
      .values({ ...quote, pdfPath: "" })
      .returning();
    return newQuote;
  }

  async updateQuote(id: number, quoteData: Partial<Quote>): Promise<Quote | undefined> {
    const [updatedQuote] = await db
      .update(quotes)
      .set(quoteData)
      .where(eq(quotes.id, id))
      .returning();
    return updatedQuote;
  }

  async listQuotes(): Promise<Quote[]> {
    return db.select().from(quotes);
  }

  async listQuotesByClient(clientId: number): Promise<Quote[]> {
    return db
      .select()
      .from(quotes)
      .where(eq(quotes.clientId, clientId));
  }
  
  async deleteQuote(id: number): Promise<boolean> {
    try {
      // Primeiro, excluir todos os itens relacionados
      await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
      
      // Depois excluir o orçamento
      await db.delete(quotes).where(eq(quotes.id, id));
      return true;
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      return false;
    }
  }

  // Quote items operations
  async getQuoteItem(id: number): Promise<QuoteItem | undefined> {
    const [item] = await db.select().from(quoteItems).where(eq(quoteItems.id, id));
    return item;
  }

  async createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem> {
    const [newItem] = await db
      .insert(quoteItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateQuoteItem(id: number, itemData: Partial<QuoteItem>): Promise<QuoteItem | undefined> {
    const [updatedItem] = await db
      .update(quoteItems)
      .set(itemData)
      .where(eq(quoteItems.id, id))
      .returning();
    return updatedItem;
  }

  async listQuoteItems(quoteId: number): Promise<QuoteItem[]> {
    return db
      .select()
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, quoteId));
  }

  // Work order operations
  async getWorkOrder(id: number): Promise<WorkOrder | undefined> {
    const [workOrder] = await db.select().from(workOrders).where(eq(workOrders.id, id));
    return workOrder;
  }

  async createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder> {
    const [newWorkOrder] = await db
      .insert(workOrders)
      .values({ ...workOrder, pdfPath: "" })
      .returning();
    return newWorkOrder;
  }

  async updateWorkOrder(id: number, workOrderData: Partial<WorkOrder>): Promise<WorkOrder | undefined> {
    const [updatedWorkOrder] = await db
      .update(workOrders)
      .set(workOrderData)
      .where(eq(workOrders.id, id))
      .returning();
    return updatedWorkOrder;
  }

  async listWorkOrders(): Promise<WorkOrder[]> {
    return db.select().from(workOrders);
  }

  async listWorkOrdersByClient(clientId: number): Promise<WorkOrder[]> {
    return db
      .select()
      .from(workOrders)
      .where(eq(workOrders.clientId, clientId));
  }
  
  async deleteWorkOrder(id: number): Promise<boolean> {
    try {
      await db.delete(workOrders).where(eq(workOrders.id, id));
      return true;
    } catch (error) {
      console.error("Erro ao excluir ordem de serviço:", error);
      return false;
    }
  }
}

// Use the DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
