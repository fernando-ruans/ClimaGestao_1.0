import { sqliteService } from './sqlite-service';
import * as schema from "@shared/schema"; // Importamos apenas para reuso dos tipos
import { formatISO } from 'date-fns';

// Utilizamos os tipos do schema.ts para manter compatibilidade
export type User = schema.User;
export type InsertUser = schema.InsertUser;
export type Client = schema.Client;
export type InsertClient = schema.InsertClient;
export type Service = schema.Service;
export type InsertService = schema.InsertService;
export type ServiceItem = schema.ServiceItem;
export type InsertServiceItem = schema.InsertServiceItem;
export type Quote = schema.Quote;
export type InsertQuote = schema.InsertQuote;
export type QuoteItem = schema.QuoteItem;
export type InsertQuoteItem = schema.InsertQuoteItem;
export type WorkOrder = schema.WorkOrder;
export type InsertWorkOrder = schema.InsertWorkOrder;

// Helper para converter datas entre SQLite e JavaScript
const toISOString = (date: Date | string): string => {
  if (date instanceof Date) {
    return formatISO(date);
  }
  return date;
};

const fromISOString = (isoString: string | null): Date | null => {
  if (!isoString) return null;
  return new Date(isoString);
};

// Classe responsável por operações no repositório SQLite
class SQLiteRepository {

  /**
   * Inicializa o repositório
   */
  async initialize(): Promise<boolean> {
    return await sqliteService.initialize();
  }

  // ============= USUÁRIOS =============

  /**
   * Busca um usuário pelo ID
   */
  async getUser(id: number): Promise<User | undefined> {
    const result = await sqliteService.executeQuery(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    if (result.values && result.values.length > 0) {
      const user = result.values[0];
      return {
        ...user,
        isActive: !!user.isActive
      };
    }
    return undefined;
  }

  /**
   * Busca um usuário pelo nome de usuário
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await sqliteService.executeQuery(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    if (result.values && result.values.length > 0) {
      const user = result.values[0];
      return {
        ...user,
        isActive: !!user.isActive
      };
    }
    return undefined;
  }

  /**
   * Cria um novo usuário
   */
  async createUser(user: InsertUser): Promise<User> {
    const id = await sqliteService.executeStatement(
      'INSERT INTO users (name, email, role, password, username, isActive) VALUES (?, ?, ?, ?, ?, ?)',
      [user.name, user.email, user.role, user.password, user.username, user.isActive ? 1 : 0]
    );
    return {
      ...user,
      id
    };
  }

  /**
   * Atualiza um usuário existente
   */
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(userData).forEach(([key, value]) => {
      if (key !== 'id') {
        if (key === 'isActive') {
          fields.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    if (fields.length === 0) return await this.getUser(id);

    values.push(id);
    await sqliteService.executeStatement(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.getUser(id);
  }

  /**
   * Lista todos os usuários
   */
  async listUsers(): Promise<User[]> {
    const result = await sqliteService.executeQuery('SELECT * FROM users');
    if (result.values) {
      return result.values.map(user => ({
        ...user,
        isActive: !!user.isActive
      }));
    }
    return [];
  }

  // ============= CLIENTES =============

  /**
   * Busca um cliente pelo ID
   */
  async getClient(id: number): Promise<Client | undefined> {
    const result = await sqliteService.executeQuery(
      'SELECT * FROM clients WHERE id = ?',
      [id]
    );
    if (result.values && result.values.length > 0) {
      const client = result.values[0];
      return {
        ...client,
        createdAt: fromISOString(client.createdAt) || new Date()
      };
    }
    return undefined;
  }

  /**
   * Cria um novo cliente
   */
  async createClient(client: InsertClient): Promise<Client> {
    const createdAt = toISOString(new Date());
    const id = await sqliteService.executeStatement(
      'INSERT INTO clients (name, contactName, email, phone, address, city, state, zip, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [client.name, client.contactName, client.email, client.phone, client.address, client.city, client.state, client.zip, createdAt]
    );
    return {
      ...client,
      id,
      createdAt: new Date()
    };
  }

  /**
   * Atualiza um cliente existente
   */
  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(clientData).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return await this.getClient(id);

    values.push(id);
    await sqliteService.executeStatement(
      `UPDATE clients SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.getClient(id);
  }

  /**
   * Lista todos os clientes
   */
  async listClients(): Promise<Client[]> {
    const result = await sqliteService.executeQuery('SELECT * FROM clients');
    if (result.values) {
      return result.values.map(client => ({
        ...client,
        createdAt: fromISOString(client.createdAt) || new Date()
      }));
    }
    return [];
  }

  // ============= SERVIÇOS =============

  /**
   * Busca um serviço pelo ID
   */
  async getService(id: number): Promise<Service | undefined> {
    const result = await sqliteService.executeQuery(
      'SELECT * FROM services WHERE id = ?',
      [id]
    );
    if (result.values && result.values.length > 0) {
      const service = result.values[0];
      return {
        ...service,
        createdAt: fromISOString(service.createdAt) || new Date(),
        updatedAt: fromISOString(service.updatedAt) || new Date()
      };
    }
    return undefined;
  }

  /**
   * Cria um novo serviço
   */
  async createService(service: InsertService): Promise<Service> {
    const now = new Date();
    const createdAt = toISOString(now);
    const updatedAt = toISOString(now);
    
    const id = await sqliteService.executeStatement(
      'INSERT INTO services (clientId, description, status, serviceType, scheduledDate, completedDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        service.clientId, 
        service.description, 
        service.status || 'pending', 
        service.serviceType, 
        service.scheduledDate, 
        service.completedDate, 
        createdAt, 
        updatedAt
      ]
    );
    
    return {
      ...service,
      id,
      status: service.status || 'pending',
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Atualiza um serviço existente
   */
  async updateService(id: number, serviceData: Partial<Service>): Promise<Service | undefined> {
    const fields: string[] = [];
    const values: any[] = [];

    // Sempre atualizamos o updatedAt
    const updatedAt = toISOString(new Date());
    fields.push('updatedAt = ?');
    values.push(updatedAt);

    Object.entries(serviceData).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    values.push(id);
    await sqliteService.executeStatement(
      `UPDATE services SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.getService(id);
  }

  /**
   * Lista todos os serviços
   */
  async listServices(): Promise<Service[]> {
    const result = await sqliteService.executeQuery('SELECT * FROM services');
    if (result.values) {
      return result.values.map(service => ({
        ...service,
        createdAt: fromISOString(service.createdAt) || new Date(),
        updatedAt: fromISOString(service.updatedAt) || new Date()
      }));
    }
    return [];
  }

  /**
   * Lista todos os serviços de um cliente
   */
  async listServicesByClient(clientId: number): Promise<Service[]> {
    const result = await sqliteService.executeQuery(
      'SELECT * FROM services WHERE clientId = ?',
      [clientId]
    );
    if (result.values) {
      return result.values.map(service => ({
        ...service,
        createdAt: fromISOString(service.createdAt) || new Date(),
        updatedAt: fromISOString(service.updatedAt) || new Date()
      }));
    }
    return [];
  }

  // ============= ITENS DE SERVIÇO =============

  /**
   * Busca um item de serviço pelo ID
   */
  async getServiceItem(id: number): Promise<ServiceItem | undefined> {
    const result = await sqliteService.executeQuery(
      'SELECT * FROM serviceItems WHERE id = ?',
      [id]
    );
    if (result.values && result.values.length > 0) {
      return result.values[0];
    }
    return undefined;
  }

  /**
   * Cria um novo item de serviço
   */
  async createServiceItem(item: InsertServiceItem): Promise<ServiceItem> {
    const id = await sqliteService.executeStatement(
      'INSERT INTO serviceItems (serviceId, description, quantity, unitPrice, type, total) VALUES (?, ?, ?, ?, ?, ?)',
      [item.serviceId, item.description, item.quantity, item.unitPrice, item.type, item.total]
    );
    return {
      ...item,
      id
    };
  }

  /**
   * Atualiza um item de serviço existente
   */
  async updateServiceItem(id: number, itemData: Partial<ServiceItem>): Promise<ServiceItem | undefined> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(itemData).forEach(([key, value]) => {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return await this.getServiceItem(id);

    values.push(id);
    await sqliteService.executeStatement(
      `UPDATE serviceItems SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.getServiceItem(id);
  }

  /**
   * Lista todos os itens de um serviço
   */
  async listServiceItems(serviceId: number): Promise<ServiceItem[]> {
    const result = await sqliteService.executeQuery(
      'SELECT * FROM serviceItems WHERE serviceId = ?',
      [serviceId]
    );
    return result.values || [];
  }

  // ============= ORÇAMENTOS =============

  /**
   * Busca um orçamento pelo ID
   */
  async getQuote(id: number): Promise<Quote | undefined> {
    const result = await sqliteService.executeQuery(
      'SELECT * FROM quotes WHERE id = ?',
      [id]
    );
    if (result.values && result.values.length > 0) {
      const quote = result.values[0];
      return {
        ...quote,
        createdAt: fromISOString(quote.createdAt) || new Date()
      };
    }
    return undefined;
  }

  /**
   * Cria um novo orçamento
   */
  async createQuote(quote: InsertQuote): Promise<Quote> {
    const createdAt = toISOString(new Date());
    const id = await sqliteService.executeStatement(
      'INSERT INTO quotes (clientId, serviceId, description, status, total, validUntil, createdAt, pdfPath) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        quote.clientId, 
        quote.serviceId, 
        quote.description, 
        quote.status || 'pending', 
        quote.total, 
        quote.validUntil, 
        createdAt, 
        quote.pdfPath || null
      ]
    );
    
    return {
      ...quote,
      id,
      status: quote.status || 'pending',
      createdAt: new Date()
    };
  }

  /**
   * Atualiza um orçamento existente
   */
  async updateQuote(id: number, quoteData: Partial<Quote>): Promise<Quote | undefined> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(quoteData).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return await this.getQuote(id);

    values.push(id);
    await sqliteService.executeStatement(
      `UPDATE quotes SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.getQuote(id);
  }

  /**
   * Lista todos os orçamentos
   */
  async listQuotes(): Promise<Quote[]> {
    const result = await sqliteService.executeQuery('SELECT * FROM quotes');
    if (result.values) {
      return result.values.map(quote => ({
        ...quote,
        createdAt: fromISOString(quote.createdAt) || new Date()
      }));
    }
    return [];
  }

  /**
   * Lista todos os orçamentos de um cliente
   */
  async listQuotesByClient(clientId: number): Promise<Quote[]> {
    const result = await sqliteService.executeQuery(
      'SELECT * FROM quotes WHERE clientId = ?',
      [clientId]
    );
    if (result.values) {
      return result.values.map(quote => ({
        ...quote,
        createdAt: fromISOString(quote.createdAt) || new Date()
      }));
    }
    return [];
  }

  // ============= ITENS DE ORÇAMENTO =============

  /**
   * Busca um item de orçamento pelo ID
   */
  async getQuoteItem(id: number): Promise<QuoteItem | undefined> {
    const result = await sqliteService.executeQuery(
      'SELECT * FROM quoteItems WHERE id = ?',
      [id]
    );
    if (result.values && result.values.length > 0) {
      return result.values[0];
    }
    return undefined;
  }

  /**
   * Cria um novo item de orçamento
   */
  async createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem> {
    const id = await sqliteService.executeStatement(
      'INSERT INTO quoteItems (quoteId, description, quantity, unitPrice, total) VALUES (?, ?, ?, ?, ?)',
      [item.quoteId, item.description, item.quantity, item.unitPrice, item.total]
    );
    return {
      ...item,
      id
    };
  }

  /**
   * Atualiza um item de orçamento existente
   */
  async updateQuoteItem(id: number, itemData: Partial<QuoteItem>): Promise<QuoteItem | undefined> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(itemData).forEach(([key, value]) => {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return await this.getQuoteItem(id);

    values.push(id);
    await sqliteService.executeStatement(
      `UPDATE quoteItems SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.getQuoteItem(id);
  }

  /**
   * Lista todos os itens de um orçamento
   */
  async listQuoteItems(quoteId: number): Promise<QuoteItem[]> {
    const result = await sqliteService.executeQuery(
      'SELECT * FROM quoteItems WHERE quoteId = ?',
      [quoteId]
    );
    return result.values || [];
  }

  // ============= ORDENS DE SERVIÇO =============

  /**
   * Busca uma ordem de serviço pelo ID
   */
  async getWorkOrder(id: number): Promise<WorkOrder | undefined> {
    const result = await sqliteService.executeQuery(
      'SELECT * FROM workOrders WHERE id = ?',
      [id]
    );
    if (result.values && result.values.length > 0) {
      const workOrder = result.values[0];
      
      // Buscar os técnicos associados a esta ordem de serviço
      const techResult = await sqliteService.executeQuery(
        'SELECT technicianId FROM workOrderTechnicians WHERE workOrderId = ?',
        [id]
      );
      
      const technicianIds = techResult.values 
        ? techResult.values.map(row => row.technicianId.toString())
        : null;
      
      return {
        ...workOrder,
        technicianIds,
        createdAt: fromISOString(workOrder.createdAt) || new Date()
      };
    }
    return undefined;
  }

  /**
   * Cria uma nova ordem de serviço
   */
  async createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder> {
    const createdAt = toISOString(new Date());
    
    // Inserir a ordem de serviço
    const id = await sqliteService.executeStatement(
      'INSERT INTO workOrders (clientId, serviceId, description, status, createdAt, pdfPath, scheduledDate, completedDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        workOrder.clientId, 
        workOrder.serviceId, 
        workOrder.description, 
        workOrder.status || 'pending', 
        createdAt, 
        workOrder.pdfPath || null,
        workOrder.scheduledDate,
        workOrder.completedDate
      ]
    );
    
    // Inserir os técnicos associados, se houver
    if (workOrder.technicianIds && workOrder.technicianIds.length > 0) {
      for (const techId of workOrder.technicianIds) {
        await sqliteService.executeStatement(
          'INSERT INTO workOrderTechnicians (workOrderId, technicianId) VALUES (?, ?)',
          [id, parseInt(techId)]
        );
      }
    }
    
    return {
      ...workOrder,
      id,
      status: workOrder.status || 'pending',
      createdAt: new Date()
    };
  }

  /**
   * Atualiza uma ordem de serviço existente
   */
  async updateWorkOrder(id: number, workOrderData: Partial<WorkOrder>): Promise<WorkOrder | undefined> {
    const fields: string[] = [];
    const values: any[] = [];
    const { technicianIds, ...rest } = workOrderData;

    Object.entries(rest).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    // Atualizar a ordem de serviço
    if (fields.length > 0) {
      values.push(id);
      await sqliteService.executeStatement(
        `UPDATE workOrders SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Atualizar os técnicos associados, se necessário
    if (technicianIds) {
      // Primeiro remover os antigos
      await sqliteService.executeStatement(
        'DELETE FROM workOrderTechnicians WHERE workOrderId = ?',
        [id]
      );
      
      // Depois inserir os novos
      for (const techId of technicianIds) {
        await sqliteService.executeStatement(
          'INSERT INTO workOrderTechnicians (workOrderId, technicianId) VALUES (?, ?)',
          [id, parseInt(techId)]
        );
      }
    }

    return await this.getWorkOrder(id);
  }

  /**
   * Lista todas as ordens de serviço
   */
  async listWorkOrders(): Promise<WorkOrder[]> {
    const result = await sqliteService.executeQuery('SELECT * FROM workOrders');
    if (!result.values) return [];
    
    const workOrders = [];
    
    for (const workOrder of result.values) {
      // Buscar os técnicos para cada ordem
      const techResult = await sqliteService.executeQuery(
        'SELECT technicianId FROM workOrderTechnicians WHERE workOrderId = ?',
        [workOrder.id]
      );
      
      const technicianIds = techResult.values 
        ? techResult.values.map(row => row.technicianId.toString())
        : null;
      
      workOrders.push({
        ...workOrder,
        technicianIds,
        createdAt: fromISOString(workOrder.createdAt) || new Date()
      });
    }
    
    return workOrders;
  }

  /**
   * Lista todas as ordens de serviço de um cliente
   */
  async listWorkOrdersByClient(clientId: number): Promise<WorkOrder[]> {
    const result = await sqliteService.executeQuery(
      'SELECT * FROM workOrders WHERE clientId = ?',
      [clientId]
    );
    if (!result.values) return [];
    
    const workOrders = [];
    
    for (const workOrder of result.values) {
      // Buscar os técnicos para cada ordem
      const techResult = await sqliteService.executeQuery(
        'SELECT technicianId FROM workOrderTechnicians WHERE workOrderId = ?',
        [workOrder.id]
      );
      
      const technicianIds = techResult.values 
        ? techResult.values.map(row => row.technicianId.toString())
        : null;
      
      workOrders.push({
        ...workOrder,
        technicianIds,
        createdAt: fromISOString(workOrder.createdAt) || new Date()
      });
    }
    
    return workOrders;
  }
}

// Exportar uma instância única do repositório
export const sqliteRepository = new SQLiteRepository();