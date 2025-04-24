-- Criar tabela de usuários
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'technician',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  photo_url TEXT
);

-- Criar tabela de clientes
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criar tabela de serviços
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_date DATE,
  completed_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  pdf_path TEXT
);

-- Criar tabela de itens de serviço
CREATE TABLE service_items (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  total INTEGER NOT NULL
);

-- Criar tabela de orçamentos
CREATE TABLE quotes (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  service_id INTEGER,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total INTEGER NOT NULL,
  valid_until DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  pdf_path TEXT
);

-- Criar tabela de itens de orçamento
CREATE TABLE quote_items (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  total INTEGER NOT NULL
);

-- Criar tabela de ordens de serviço
CREATE TABLE work_orders (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_date DATE,
  completed_date DATE,
  technician_ids TEXT[],
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  pdf_path TEXT
);

-- Criar tabela de sessões para autenticação
CREATE TABLE session (
  sid VARCHAR(255) NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

-- Adicionar chaves estrangeiras
ALTER TABLE services 
ADD CONSTRAINT fk_services_client 
FOREIGN KEY (client_id) 
REFERENCES clients(id);

ALTER TABLE service_items 
ADD CONSTRAINT fk_service_items_service
FOREIGN KEY (service_id) 
REFERENCES services(id);

ALTER TABLE quotes 
ADD CONSTRAINT fk_quotes_client
FOREIGN KEY (client_id) 
REFERENCES clients(id);

ALTER TABLE quotes 
ADD CONSTRAINT fk_quotes_service
FOREIGN KEY (service_id) 
REFERENCES services(id);

ALTER TABLE quote_items 
ADD CONSTRAINT fk_quote_items_quote
FOREIGN KEY (quote_id) 
REFERENCES quotes(id);

ALTER TABLE work_orders 
ADD CONSTRAINT fk_work_orders_client
FOREIGN KEY (client_id) 
REFERENCES clients(id);

ALTER TABLE work_orders 
ADD CONSTRAINT fk_work_orders_service
FOREIGN KEY (service_id) 
REFERENCES services(id);

-- Criar índices para melhorar performance
CREATE INDEX idx_services_client_id ON services(client_id);
CREATE INDEX idx_service_items_service_id ON service_items(service_id);
CREATE INDEX idx_quotes_client_id ON quotes(client_id);
CREATE INDEX idx_quotes_service_id ON quotes(service_id);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_work_orders_client_id ON work_orders(client_id);
CREATE INDEX idx_work_orders_service_id ON work_orders(service_id);
CREATE INDEX idx_session_expire ON session(expire);