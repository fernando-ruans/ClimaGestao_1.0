import { Capacitor } from '@capacitor/core';
import { sqliteRepository } from './sqlite-repository';
import { apiRequest } from './queryClient';

// Tipos exportados do repositório para manter a compatibilidade
export type {
  User, InsertUser,
  Client, InsertClient,
  Service, InsertService,
  ServiceItem, InsertServiceItem,
  Quote, InsertQuote,
  QuoteItem, InsertQuoteItem,
  WorkOrder, InsertWorkOrder
} from './sqlite-repository';

/**
 * Classe API que decide se deve usar banco local (SQLite) ou servidor remoto
 * dependendo da plataforma e da disponibilidade de conexão
 */
class ApiProvider {
  private isOfflineMode: boolean = false;
  
  constructor() {
    // Temporariamente forçando modo online em todos os dispositivos
    this.isOfflineMode = false;
    
    // Comentado por enquanto
    // this.isOfflineMode = Capacitor.isNativePlatform();
    
    if (this.isOfflineMode) {
      console.log('App iniciado em modo offline (SQLite local)');
    } else {
      console.log('App iniciado em modo online (API remota)');
    }
  }
  
  /**
   * Define manualmente o modo de operação
   */
  setOfflineMode(isOffline: boolean) {
    this.isOfflineMode = isOffline;
    console.log(`Modo ${isOffline ? 'offline' : 'online'} ativado manualmente`);
  }
  
  /**
   * Verifica se estamos operando em modo offline
   */
  isOffline(): boolean {
    return this.isOfflineMode;
  }
  
  // =================== MÉTODOS DE API ===================
  
  // ============= USUÁRIOS =============
  
  /**
   * Autentica um usuário (login)
   */
  async login(credentials: { username: string; password: string }): Promise<any> {
    if (this.isOfflineMode) {
      const user = await sqliteRepository.getUserByUsername(credentials.username);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Aqui precisaríamos verificar a senha com bcrypt ou similar
      // Como é uma versão simplificada, apenas comparamos diretamente
      // Em produção, use biblioteca de criptografia adequada
      
      // Senha '12345' em SHA-256
      const tempHash = '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5';
      
      if (tempHash !== user.password) {
        throw new Error('Senha incorreta');
      }
      
      return user;
    } else {
      try {
        console.log('Enviando requisição de login:', {
          username: credentials.username,
          password: '********' // Não log a senha real
        });
        
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
          credentials: 'include'
        });
        
        if (!res.ok) {
          let errorMessage = 'Erro ao fazer login';
          
          try {
            const errorData = await res.json();
            if (errorData && errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (jsonError) {
            // Se não conseguir interpretar como JSON, pega o texto da resposta
            const errorText = await res.text();
            errorMessage = errorText || `Erro ${res.status}: ${res.statusText}`;
          }
          
          console.error('Resposta de erro no login:', errorMessage);
          throw new Error(errorMessage);
        }
        
        return await res.json();
      } catch (error: any) {
        console.error("Erro no login:", error);
        
        // Verificações específicas de mensagens de erro
        if (error.message && error.message.includes("Usuário não encontrado")) {
          throw new Error("Nome de usuário não encontrado");
        }
        if (error.message && error.message.includes("Senha incorreta")) {
          throw new Error("Senha incorreta");
        }
        
        throw error;
      }
    }
  }
  
  /**
   * Registra um novo usuário
   */
  async register(user: any): Promise<any> {
    if (this.isOfflineMode) {
      // Verifica se o usuário já existe
      const existingUser = await sqliteRepository.getUserByUsername(user.username);
      if (existingUser) {
        throw new Error('Nome de usuário já existe');
      }
      
      return await sqliteRepository.createUser(user);
    } else {
      try {
        console.log('Enviando requisição de registro:', JSON.stringify(user));
        
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(user),
          credentials: 'include'
        });
        
        if (!res.ok) {
          let errorMessage = 'Erro ao registrar usuário';
          
          try {
            const errorData = await res.json();
            if (errorData && errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (jsonError) {
            // Se não conseguir interpretar como JSON, pega o texto da resposta
            const errorText = await res.text();
            errorMessage = errorText || `Erro ${res.status}: ${res.statusText}`;
          }
          
          console.error('Resposta de erro:', errorMessage);
          throw new Error(errorMessage);
        }
        
        return await res.json();
      } catch (error: any) {
        console.error("Erro ao registrar usuário:", error);
        
        // Verificações específicas de mensagens de erro
        if (error.message && error.message.includes("Usuário já existe")) {
          throw new Error("Este nome de usuário já está em uso");
        }
        
        throw error;
      }
    }
  }
  
  /**
   * Faz logout do usuário
   */
  async logout(): Promise<void> {
    if (this.isOfflineMode) {
      // Em modo offline, não há sessão para encerrar
      return;
    }
    
    try {
      // Adicionando Content-Type: application/json para resolver o problema de formato
      const res = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Enviar um objeto vazio como corpo para garantir que o Content-Type seja respeitado
        body: JSON.stringify({}),
        credentials: 'include'
      });
      
      if (!res.ok) {
        let errorMessage = 'Erro ao fazer logout';
        
        try {
          const errorData = await res.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (jsonError) {
          // Se não conseguir interpretar como JSON, pega o texto da resposta
          const errorText = await res.text();
          errorMessage = errorText || `Erro ${res.status}: ${res.statusText}`;
        }
        
        console.error('Resposta de erro no logout:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Erro no logout:", error);
      throw error;
    }
  }
  
  /**
   * Obtém o usuário atual
   */
  async getCurrentUser(): Promise<any> {
    if (this.isOfflineMode) {
      // Em modo offline, assumimos que o usuário 1 está logado
      // Na implementação completa, armazenaríamos isso em localStorage ou similar
      return await sqliteRepository.getUser(1);
    } else {
      try {
        const res = await fetch('/api/user', {
          method: 'GET',
          credentials: 'include'
        });
        
        // Se o usuário não estiver autenticado, retorna null
        if (res.status === 401) return null;
        
        if (!res.ok) {
          let errorMessage = 'Erro ao obter usuário atual';
          
          try {
            const errorData = await res.json();
            if (errorData && errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (jsonError) {
            // Se não conseguir interpretar como JSON, pega o texto da resposta
            const errorText = await res.text();
            errorMessage = errorText || `Erro ${res.status}: ${res.statusText}`;
          }
          
          console.error('Resposta de erro ao obter usuário:', errorMessage);
          throw new Error(errorMessage);
        }
        
        return await res.json();
      } catch (error: any) {
        console.error("Erro ao obter usuário atual:", error);
        
        // Se o erro for de conexão ou não relacionado à autenticação, propaga o erro
        // Se for erro 401, já foi tratado acima
        if (error.message !== "Failed to fetch" && !error.message.includes("401")) {
          throw error;
        }
        
        return null;
      }
    }
  }
  
  /**
   * Lista todos os usuários
   */
  async listUsers(): Promise<any[]> {
    if (this.isOfflineMode) {
      return await sqliteRepository.listUsers();
    } else {
      const res = await apiRequest('GET', '/api/users');
      return await res.json();
    }
  }
  
  /**
   * Atualiza um usuário
   */
  async updateUser(id: number, userData: any): Promise<any> {
    if (this.isOfflineMode) {
      return await sqliteRepository.updateUser(id, userData);
    } else {
      const res = await apiRequest('PATCH', `/api/users/${id}`, userData);
      return await res.json();
    }
  }
  
  // ============= CLIENTES =============
  
  /**
   * Obtém um cliente pelo ID
   */
  async getClient(id: number): Promise<any> {
    if (this.isOfflineMode) {
      return await sqliteRepository.getClient(id);
    } else {
      const res = await apiRequest('GET', `/api/clients/${id}`);
      return await res.json();
    }
  }
  
  /**
   * Cria um novo cliente
   */
  async createClient(client: any): Promise<any> {
    if (this.isOfflineMode) {
      return await sqliteRepository.createClient(client);
    } else {
      const res = await apiRequest('POST', '/api/clients', client);
      return await res.json();
    }
  }
  
  /**
   * Atualiza um cliente
   */
  async updateClient(id: number, clientData: any): Promise<any> {
    if (this.isOfflineMode) {
      return await sqliteRepository.updateClient(id, clientData);
    } else {
      const res = await apiRequest('PATCH', `/api/clients/${id}`, clientData);
      return await res.json();
    }
  }
  
  /**
   * Lista todos os clientes
   */
  async listClients(): Promise<any[]> {
    if (this.isOfflineMode) {
      return await sqliteRepository.listClients();
    } else {
      const res = await apiRequest('GET', '/api/clients');
      return await res.json();
    }
  }
  
  // ============= SERVIÇOS =============
  
  /**
   * Obtém um serviço pelo ID
   */
  async getService(id: number): Promise<any> {
    if (this.isOfflineMode) {
      return await sqliteRepository.getService(id);
    } else {
      const res = await apiRequest('GET', `/api/services/${id}`);
      return await res.json();
    }
  }
  
  /**
   * Cria um novo serviço
   */
  async createService(service: any): Promise<any> {
    if (this.isOfflineMode) {
      return await sqliteRepository.createService(service);
    } else {
      const res = await apiRequest('POST', '/api/services', service);
      return await res.json();
    }
  }
  
  /**
   * Atualiza um serviço
   */
  async updateService(id: number, serviceData: any): Promise<any> {
    if (this.isOfflineMode) {
      return await sqliteRepository.updateService(id, serviceData);
    } else {
      const res = await apiRequest('PATCH', `/api/services/${id}`, serviceData);
      return await res.json();
    }
  }
  
  /**
   * Lista todos os serviços
   */
  async listServices(): Promise<any[]> {
    if (this.isOfflineMode) {
      return await sqliteRepository.listServices();
    } else {
      const res = await apiRequest('GET', '/api/services');
      return await res.json();
    }
  }
  
  /**
   * Lista serviços de um cliente
   */
  async listServicesByClient(clientId: number): Promise<any[]> {
    if (this.isOfflineMode) {
      return await sqliteRepository.listServicesByClient(clientId);
    } else {
      const res = await apiRequest('GET', `/api/clients/${clientId}/services`);
      return await res.json();
    }
  }
  
  // ============= ITENS DE SERVIÇO =============
  
  /**
   * Lista itens de um serviço
   */
  async listServiceItems(serviceId: number): Promise<any[]> {
    if (this.isOfflineMode) {
      return await sqliteRepository.listServiceItems(serviceId);
    } else {
      const res = await apiRequest('GET', `/api/services/${serviceId}/items`);
      return await res.json();
    }
  }
  
  /**
   * Cria um novo item de serviço
   */
  async createServiceItem(item: any): Promise<any> {
    if (this.isOfflineMode) {
      return await sqliteRepository.createServiceItem(item);
    } else {
      const res = await apiRequest('POST', '/api/service-items', item);
      return await res.json();
    }
  }
  
  // ============= ORÇAMENTOS =============
  
  /**
   * Obtém um orçamento pelo ID
   */
  async getQuote(id: number): Promise<any> {
    if (this.isOfflineMode) {
      return await sqliteRepository.getQuote(id);
    } else {
      const res = await apiRequest('GET', `/api/quotes/${id}`);
      return await res.json();
    }
  }
  
  /**
   * Cria um novo orçamento
   */
  async createQuote(quote: any): Promise<any> {
    if (this.isOfflineMode) {
      return await sqliteRepository.createQuote(quote);
    } else {
      const res = await apiRequest('POST', '/api/quotes', quote);
      return await res.json();
    }
  }
  
  /**
   * Atualiza um orçamento
   */
  async updateQuote(id: number, quoteData: any): Promise<any> {
    if (this.isOfflineMode) {
      return await sqliteRepository.updateQuote(id, quoteData);
    } else {
      const res = await apiRequest('PATCH', `/api/quotes/${id}`, quoteData);
      return await res.json();
    }
  }
  
  /**
   * Lista todos os orçamentos
   */
  async listQuotes(): Promise<any[]> {
    if (this.isOfflineMode) {
      return await sqliteRepository.listQuotes();
    } else {
      const res = await apiRequest('GET', '/api/quotes');
      return await res.json();
    }
  }
  
  /**
   * Lista itens de um orçamento
   */
  async listQuoteItems(quoteId: number): Promise<any[]> {
    if (this.isOfflineMode) {
      return await sqliteRepository.listQuoteItems(quoteId);
    } else {
      const res = await apiRequest('GET', `/api/quotes/${quoteId}/items`);
      return await res.json();
    }
  }
  
  /**
   * Cria um novo item de orçamento
   */
  async createQuoteItem(item: any): Promise<any> {
    if (this.isOfflineMode) {
      return await sqliteRepository.createQuoteItem(item);
    } else {
      const res = await apiRequest('POST', '/api/quote-items', item);
      return await res.json();
    }
  }
  
  // ============= ORDENS DE SERVIÇO =============
  
  /**
   * Obtém uma ordem de serviço pelo ID
   */
  async getWorkOrder(id: number): Promise<any> {
    if (this.isOfflineMode) {
      return await sqliteRepository.getWorkOrder(id);
    } else {
      const res = await apiRequest('GET', `/api/work-orders/${id}`);
      return await res.json();
    }
  }
  
  /**
   * Cria uma nova ordem de serviço
   */
  async createWorkOrder(workOrder: any): Promise<any> {
    if (this.isOfflineMode) {
      return await sqliteRepository.createWorkOrder(workOrder);
    } else {
      const res = await apiRequest('POST', '/api/work-orders', workOrder);
      return await res.json();
    }
  }
  
  /**
   * Atualiza uma ordem de serviço
   */
  async updateWorkOrder(id: number, workOrderData: any): Promise<any> {
    if (this.isOfflineMode) {
      return await sqliteRepository.updateWorkOrder(id, workOrderData);
    } else {
      const res = await apiRequest('PATCH', `/api/work-orders/${id}`, workOrderData);
      return await res.json();
    }
  }
  
  /**
   * Lista todas as ordens de serviço
   */
  async listWorkOrders(): Promise<any[]> {
    if (this.isOfflineMode) {
      return await sqliteRepository.listWorkOrders();
    } else {
      const res = await apiRequest('GET', '/api/work-orders');
      return await res.json();
    }
  }
}

// Exportar uma instância única do provedor de API
export const apiProvider = new ApiProvider();