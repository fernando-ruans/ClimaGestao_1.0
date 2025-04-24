-- Dump do banco de dados SAM Climatiza
-- Data: 23 de abril de 2025

-- Criando as tabelas
\c samclimatiza_db -- Conectando ao banco de dados

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
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    total INTEGER NOT NULL
);

-- Tabela de Orçamentos
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

-- Tabela de Itens de Orçamento
CREATE TABLE quote_items (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    total INTEGER NOT NULL
);

-- Tabela de Ordens de Serviço
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

-- Tabela de Sessões (para autenticação de usuários)
CREATE TABLE session (
    sid VARCHAR PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Inserindo os dados
-- Users
INSERT INTO users (id, username, password, name, email, role, is_active, photo_url) VALUES
(1, 'teste', 'bcd79fce62b1e5ad6213e4b5bbb7d09d77f6d85ad6a63cb78c22709c2e888b44d9cdb68e191358505765c02c1dc93f6217870e2a8e2efb012a656ba113678e18.def2bb3eef7f6e59080319649e3ca804', 'teste', 'teste@email.com', 'admin', true, '/uploads/942e2a74-d101-4bfd-b5f9-b8f3b0c12cc3-1745285593751.jpg'),
(2, 'Dino ', '55231e5fdb0311f71f0ed213807062aca6bae9091bb23b86641e246c0866c107fe29ffc912d9ebe75c1cc102b4fe5c33a48cdc16891c186162ae2b9106ffda3d.42301919d1c26b811e4dd5a4769406b6', 'Dinossauro Silva Sauro ', 'email@email.com', 'technician', true, '/uploads/b0ab30a5-f2e2-4f88-8ad5-87f8629751a1-1745285599762.jpg'),
(3, 'Samuel', '56a9a8fd54013dc2798f394eb8f95e0230a16cccffc15849ccd28f14bf3a5c195463a0804405a78f2e4222c974a958e18b593ef5c0169e6b09918b30faaeb79e.233d923f421a53a3521565eed1995273', 'Samuel Felipe ', 'samuel@email.com', 'technician', true, '/uploads/f0e05e59-0a1e-4f07-94c1-044d4da956f4-1745288106058.jpg'),
(4, 'user', 'f8365f5f4f5d82f1adeaee51f3d5837e52d78fb5e79544d7d0a940e140c37ba8fef1f58c6dea6fa3a2517f6bd44e16bd8217a7f30676385d8429609b3bef3bfa.9a1afb405d375a2ca95bf99910a72ddd', 'user  user ', 'user@email.com', 'technician', true, NULL);

-- Clients
INSERT INTO clients (id, name, contact_name, email, phone, address, city, state, zip, created_at) VALUES
(1, 'Dinossauro Silva Santos', 'Dino', 'dino@sauro.com', '(31) 9 9878-9898', 'Rua da pica torta 330 - Tanque Novo', 'Geraldina', 'MG', '125587-888', '2025-04-21 16:54:58.208989'),
(2, 'Gustavo Lima Dias', 'Gustavo', 'gustavo@email.com', '*31) 9 5566-6676', 'Rua Alguma coisa 567', 'Guaraná', 'MG', '45878-000', '2025-04-21 18:28:25.656189'),
(3, 'Raimundo Neto', 'Raimundo', 'neto@email.com', '(31)9-3352-9989', 'Rua dos Prazeres 585 - Barra', 'Esmeralza', 'SP', '45878-545', '2025-04-22 15:09:23.340618'),
(4, 'Paulo Santos', 'Paulo', 'paulo@email.com', '(77) 9 9857-5454', 'rua jose alvino 157', 'brumado', 'ba', '46115-570', '2025-04-22 21:02:20.935784');

-- Services
INSERT INTO services (id, client_id, service_type, description, status, scheduled_date, completed_date, created_at, updated_at) VALUES
(5, 2, 'maintenance', 'INSTALAÇÃO', 'scheduled', '2025-04-12', NULL, '2025-04-23 03:15:31.038253', '2025-04-23 03:15:31.038253');

-- Service Items
INSERT INTO service_items (id, service_id, type, description, quantity, unit_price, total) VALUES
(7, 5, 'labor', 'SERVIÇO', 1, 50000, 50000),
(8, 5, 'material', 'MATERIAIS', 1, 15000, 15000);

-- Quotes
INSERT INTO quotes (id, client_id, service_id, description, status, total, valid_until, created_at, pdf_path) VALUES
(8, 2, 5, 'INSTALAÇÃO AR CONSDICIONADO 12.000', 'approved', 65000, '2025-04-12', '2025-04-23 03:17:32.192222', '/pdf/quote_8_1745378253236.pdf');

-- Quote Items
INSERT INTO quote_items (id, quote_id, type, description, quantity, unit_price, total) VALUES
(11, 8, 'material', 'MATERIAIS', 1, 15000, 15000),
(12, 8, 'labor', 'SERVIÇO', 1, 50000, 50000);

-- Work Orders
INSERT INTO work_orders (id, client_id, service_id, description, status, scheduled_date, completed_date, technician_ids, created_at, pdf_path) VALUES
(7, 2, 5, 'INSTALAÇÃO DE CONDENSADORA EM RESIDENCIAL', 'completed', '2025-04-23', NULL, ARRAY['3'], '2025-04-23 03:24:05.153094', '/pdf/workorder_7_1745378965785.pdf'),
(8, 2, 5, 'desc', 'completed', NULL, NULL, ARRAY['4'], '2025-04-23 03:29:22.585293', '/pdf/workorder_8_1745378991569.pdf');

-- Reset das sequências
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));
SELECT setval('services_id_seq', (SELECT MAX(id) FROM services));
SELECT setval('service_items_id_seq', (SELECT MAX(id) FROM service_items));
SELECT setval('quotes_id_seq', (SELECT MAX(id) FROM quotes));
SELECT setval('quote_items_id_seq', (SELECT MAX(id) FROM quote_items));
SELECT setval('work_orders_id_seq', (SELECT MAX(id) FROM work_orders));