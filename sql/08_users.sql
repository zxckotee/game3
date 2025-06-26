-- Скрипт для создания таблицы users (пользователи игры)
-- Хранит основную информацию учетных записей пользователей
\encoding UTF8
-- Создание таблицы, если она еще не существует
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    cultivation_level INTEGER DEFAULT 1, 
    experience INTEGER DEFAULT 0,
    auth_token VARCHAR(255) NULL,
    token_expires_at TIMESTAMP NULL,
    role VARCHAR(50) DEFAULT 'user',
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Комментарии к таблице и полям
COMMENT ON TABLE users IS 'Пользователи игры';
COMMENT ON COLUMN users.email IS 'Email пользователя (генерируется автоматически, если не указан)';
COMMENT ON COLUMN users.auth_token IS 'Токен аутентификации пользователя';
COMMENT ON COLUMN users.token_expires_at IS 'Дата и время истечения срока действия токена';
COMMENT ON COLUMN users.role IS 'Роль пользователя (user, admin)';

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_auth_token ON users (auth_token);
CREATE INDEX IF NOT EXISTS idx_users_token_expires_at ON users (token_expires_at);
