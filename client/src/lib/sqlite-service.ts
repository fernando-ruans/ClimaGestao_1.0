import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

// Definições do banco de dados
const DB_NAME = 'sam_climatiza_db';
const DB_VERSION = 1;

// Interface para as tabelas e estrutura do banco
export interface SQLiteSchema {
  version: number;
  tables: {
    [key: string]: {
      name: string;
      schema: string[];
      indexes?: {
        name: string;
        column: string;
        value: string; // "ASC" | "DESC"
        unique?: boolean;
      }[];
    };
  };
  queries?: {
    [key: string]: string;
  };
}

// Definindo o esquema do banco de dados
const schema: SQLiteSchema = {
  version: DB_VERSION,
  tables: {
    users: {
      name: 'users',
      schema: [
        'id INTEGER PRIMARY KEY AUTOINCREMENT',
        'name TEXT NOT NULL',
        'email TEXT NOT NULL',
        'role TEXT NOT NULL',
        'password TEXT NOT NULL',
        'username TEXT NOT NULL',
        'isActive INTEGER NOT NULL'
      ],
      indexes: [
        {
          name: 'idx_users_username',
          column: 'username',
          value: 'ASC',
          unique: true
        }
      ]
    },
    clients: {
      name: 'clients',
      schema: [
        'id INTEGER PRIMARY KEY AUTOINCREMENT',
        'name TEXT NOT NULL',
        'contactName TEXT',
        'email TEXT',
        'phone TEXT',
        'address TEXT',
        'city TEXT',
        'state TEXT',
        'zip TEXT',
        'createdAt TEXT NOT NULL'
      ]
    },
    services: {
      name: 'services',
      schema: [
        'id INTEGER PRIMARY KEY AUTOINCREMENT',
        'clientId INTEGER NOT NULL',
        'description TEXT',
        'status TEXT NOT NULL',
        'serviceType TEXT NOT NULL',
        'scheduledDate TEXT',
        'completedDate TEXT',
        'createdAt TEXT NOT NULL',
        'updatedAt TEXT NOT NULL',
        'FOREIGN KEY (clientId) REFERENCES clients(id)'
      ]
    },
    serviceItems: {
      name: 'serviceItems',
      schema: [
        'id INTEGER PRIMARY KEY AUTOINCREMENT',
        'serviceId INTEGER NOT NULL',
        'description TEXT NOT NULL',
        'quantity INTEGER NOT NULL',
        'unitPrice REAL NOT NULL',
        'type TEXT NOT NULL',
        'total REAL NOT NULL',
        'FOREIGN KEY (serviceId) REFERENCES services(id)'
      ]
    },
    quotes: {
      name: 'quotes',
      schema: [
        'id INTEGER PRIMARY KEY AUTOINCREMENT',
        'clientId INTEGER NOT NULL',
        'serviceId INTEGER',
        'description TEXT',
        'status TEXT NOT NULL',
        'total REAL NOT NULL',
        'validUntil TEXT',
        'createdAt TEXT NOT NULL',
        'pdfPath TEXT',
        'FOREIGN KEY (clientId) REFERENCES clients(id)',
        'FOREIGN KEY (serviceId) REFERENCES services(id)'
      ]
    },
    quoteItems: {
      name: 'quoteItems',
      schema: [
        'id INTEGER PRIMARY KEY AUTOINCREMENT',
        'quoteId INTEGER NOT NULL',
        'description TEXT NOT NULL',
        'quantity INTEGER NOT NULL',
        'unitPrice REAL NOT NULL',
        'total REAL NOT NULL',
        'FOREIGN KEY (quoteId) REFERENCES quotes(id)'
      ]
    },
    workOrders: {
      name: 'workOrders',
      schema: [
        'id INTEGER PRIMARY KEY AUTOINCREMENT',
        'clientId INTEGER NOT NULL',
        'serviceId INTEGER NOT NULL',
        'description TEXT',
        'status TEXT NOT NULL',
        'createdAt TEXT NOT NULL',
        'pdfPath TEXT',
        'scheduledDate TEXT',
        'completedDate TEXT',
        'FOREIGN KEY (clientId) REFERENCES clients(id)',
        'FOREIGN KEY (serviceId) REFERENCES services(id)'
      ]
    },
    workOrderTechnicians: {
      name: 'workOrderTechnicians',
      schema: [
        'workOrderId INTEGER NOT NULL',
        'technicianId INTEGER NOT NULL',
        'PRIMARY KEY (workOrderId, technicianId)',
        'FOREIGN KEY (workOrderId) REFERENCES workOrders(id)',
        'FOREIGN KEY (technicianId) REFERENCES users(id)'
      ]
    }
  }
};

export class SQLiteService {
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private isInitialized: boolean = false;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  /**
   * Inicializa o banco de dados
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Se estamos rodando em plataforma web, inicializamos o SQLite para web
      if (Capacitor.getPlatform() === 'web') {
        await this.sqlite.initWebStore();
        console.log('SQLite inicializado para Web');
      }

      // Verifica se o banco de dados existe
      const result = await this.sqlite.isDatabase({
        database: DB_NAME
      });

      // Se não existir, cria
      if (!result.result) {
        await this.createDatabase();
      } else {
        // Se existir, apenas conecta
        this.db = await this.sqlite.createConnection(
          DB_NAME,
          false,
          'no-encryption',
          1
        );
        await this.db.open();
      }

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.error('Erro ao inicializar o SQLite:', err);
      return false;
    }
  }

  /**
   * Cria o banco de dados e as tabelas
   */
  private async createDatabase(): Promise<void> {
    this.db = await this.sqlite.createConnection(
      DB_NAME,
      false,
      'no-encryption',
      1
    );
    await this.db.open();

    // Criação das tabelas
    for (const table of Object.values(schema.tables)) {
      const schemaStatement = `
        CREATE TABLE IF NOT EXISTS ${table.name} (
          ${table.schema.join(', ')}
        );
      `;
      await this.db.execute({ statements: schemaStatement });

      // Criação dos índices se existirem
      if (table.indexes) {
        for (const index of table.indexes) {
          const uniqueStr = index.unique ? 'UNIQUE' : '';
          const indexStatement = `
            CREATE ${uniqueStr} INDEX IF NOT EXISTS ${index.name}
            ON ${table.name} (${index.column} ${index.value});
          `;
          await this.db.execute({ statements: indexStatement });
        }
      }
    }

    // Inserir um usuário admin padrão
    const hasUsers = await this.db.query({
      statement: 'SELECT COUNT(*) as count FROM users',
      values: []
    });

    if (hasUsers.values && hasUsers.values[0].count === 0) {
      await this.db.execute({
        statements: `
          INSERT INTO users (name, email, role, password, username, isActive)
          VALUES ('Administrador', 'admin@example.com', 'admin', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', 'admin', 1);
        `
        // Senha: 12345
      });
    }
  }

  /**
   * Executa uma consulta no banco de dados
   */
  async executeQuery(query: string, params: any[] = []): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      return await this.db.query({
        statement: query,
        values: params
      });
    } catch (err) {
      console.error('Erro ao executar query:', query, params, err);
      throw err;
    }
  }

  /**
   * Executa uma instrução no banco de dados (INSERT, UPDATE, DELETE)
   */
  async executeStatement(statement: string, params: any[] = []): Promise<number> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.db.run(statement, params);
      // Retorna o ID do último item inserido
      const result = await this.db.query({
        statement: 'SELECT last_insert_rowid() as id',
        values: []
      });
      return result.values ? result.values[0].id : 0;
    } catch (err) {
      console.error('Erro ao executar statement:', statement, params, err);
      throw err;
    }
  }

  /**
   * Fecha a conexão com o banco de dados
   */
  async closeConnection(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.isInitialized = false;
    }
  }
}

// Exportar uma instância única do serviço
export const sqliteService = new SQLiteService();