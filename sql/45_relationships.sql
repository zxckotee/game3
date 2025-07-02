
/* SQL скрипт для создания социальных отношений
   Он отражает redux структуру state.player.social.relationships.sql */
\encoding UTF8

DROP TABLE IF EXISTS relationships;
DROP TABLE IF EXISTS relationships_events;

-- Создаем таблицы 
CREATE TABLE IF NOT EXISTS relationships (
   id SERIAL PRIMARY KEY,
   user_id INTEGER REFERENCES users(id),
   level INTEGER,
   name VARCHAR(40),
   role VARCHAR(40),
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS relationships_events (
   id SERIAL PRIMARY KEY,
   event_id INTEGER REFERENCES relationships(id),
   description TEXT,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- триггер на регистрацию нового пользователя
CREATE OR REPLACE FUNCTION initialize_relationships_for_user()
RETURNS TRIGGER AS $$
BEGIN

   INSERT INTO relationships(user_id, level, name, role) VALUES
   (NEW.id, 80, 'Мастер Ли', 'Наставник'),
   (NEW.id, 40, 'Торговец Чен', 'Торговец'),
   (NEW.id, 40, 'Госпожа Юнь', 'Торговец'),
   (NEW.id, 60, 'Старейшина Чжан', 'Торговец'),
   (NEW.id, 30, 'Торговец Чжао', 'Торговец'),
   (NEW.id, 50, 'Староста деревни Ванг', 'Лидер общины'),
   (NEW.id, 20, 'Загадочный отшельник Фэн', 'Отшельник');

   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Повторно создаем триггер, если его еще нет

DROP TRIGGER IF EXISTS user_relationships ON "users";
CREATE TRIGGER user_relationships
AFTER INSERT ON "users"
FOR EACH ROW
EXECUTE FUNCTION initialize_relationships_for_user();