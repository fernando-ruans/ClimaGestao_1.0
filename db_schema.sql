-- Esquema do banco de dados SAM Climatiza (PostgreSQL)

-- Tabela de Usuários
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

-- Tabela de Clientes
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

-- Tabela de Serviços
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    service_type TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    scheduled_date DATE,
    completed_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de Itens de Serviço (materiais e mão de obra)
CREATE TABLE service_items (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'material' ou 'labor'
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL, -- Valor em centavos
    total INTEGER NOT NULL -- Valor em centavos
);

-- Tabela de Orçamentos
CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    service_id INTEGER,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    total INTEGER NOT NULL, -- Valor em centavos
    valid_until DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    pdf_path TEXT
);

-- Tabela de Itens de Orçamento
CREATE TABLE quote_items (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'material' ou 'labor'
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL, -- Valor em centavos
    total INTEGER NOT NULL -- Valor em centavos
);

-- Tabela de Ordens de Serviço
CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    scheduled_date DATE,
    completed_date DATE,
    technician_ids TEXT[], -- Array de IDs de usuários técnicos
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    pdf_path TEXT
);

-- Tabela de Sessões (para autenticação de usuários)
CREATE TABLE session (
    sid VARCHAR PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Chaves estrangeiras (Relacionamentos)
-- Nota: O sistema armazena esses relacionamentos em nível de aplicação, não no banco de dados.
-- As relações seriam:
-- 1. services.client_id -> clients.id
-- 2. service_items.service_id -> services.id
-- 3. quotes.client_id -> clients.id
-- 4. quotes.service_id -> services.id
-- 5. quote_items.quote_id -> quotes.id
-- 6. work_orders.client_id -> clients.id
-- 7. work_orders.service_id -> services.id
-- 8. work_orders.technician_ids[] -> users.id (muitos para muitos)