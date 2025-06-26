-- SQL-скрипт для создания таблиц рыночной системы
-- Создание: 28.04.2025
\encoding UTF8

-- Таблица рыночных предметов
CREATE TABLE IF NOT EXISTS market_items (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL,
  item_id INTEGER,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL,
  quality VARCHAR(50),
  attributes JSONB,
  listed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_sold BOOLEAN DEFAULT FALSE,
  sold_at TIMESTAMP,
  buyer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_market_items_seller_id ON market_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_market_items_item_type ON market_items(item_type);
CREATE INDEX IF NOT EXISTS idx_market_items_is_sold ON market_items(is_sold);
CREATE INDEX IF NOT EXISTS idx_market_items_expiry ON market_items(expires_at);
CREATE INDEX IF NOT EXISTS idx_market_items_price ON market_items(price);
CREATE INDEX IF NOT EXISTS idx_market_items_quality ON market_items(quality);

-- Комментарий к таблице
COMMENT ON TABLE market_items IS 'Предметы, выставленные на рыночную продажу игроками';

-- Таблица истории транзакций рынка
CREATE TABLE IF NOT EXISTS market_transactions (
  id SERIAL PRIMARY KEY,
  market_item_id INTEGER NOT NULL REFERENCES market_items(id) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL,
  tax INTEGER DEFAULT 0,
  transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  item_type VARCHAR(50) NOT NULL,
  item_id INTEGER,
  item_name VARCHAR(255) NOT NULL,
  item_quality VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_market_transactions_seller_id ON market_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_market_transactions_buyer_id ON market_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_market_transactions_date ON market_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_market_transactions_item_type ON market_transactions(item_type);

-- Комментарий к таблице
COMMENT ON TABLE market_transactions IS 'История всех транзакций на рынке между игроками';

-- Таблица для рыночных аукционов (опционально)
CREATE TABLE IF NOT EXISTS market_auctions (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL,
  item_id INTEGER,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  start_price INTEGER NOT NULL,
  current_price INTEGER NOT NULL,
  buyout_price INTEGER,
  min_bid_increment INTEGER DEFAULT 1,
  quality VARCHAR(50),
  attributes JSONB,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  current_bidder_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL CHECK (status IN ('active', 'completed', 'cancelled', 'expired')) DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_market_auctions_seller_id ON market_auctions(seller_id);
CREATE INDEX IF NOT EXISTS idx_market_auctions_status ON market_auctions(status);
CREATE INDEX IF NOT EXISTS idx_market_auctions_expiry ON market_auctions(expires_at);

-- Комментарий к таблице
COMMENT ON TABLE market_auctions IS 'Аукционы предметов на рынке';

-- Таблица ставок на аукционах (опционально)
CREATE TABLE IF NOT EXISTS auction_bids (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER NOT NULL REFERENCES market_auctions(id) ON DELETE CASCADE,
  bidder_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bid_amount INTEGER NOT NULL,
  bid_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_winning BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_bidder_id ON auction_bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_is_winning ON auction_bids(is_winning);

-- Комментарий к таблице
COMMENT ON TABLE auction_bids IS 'Ставки игроков на рыночных аукционах';