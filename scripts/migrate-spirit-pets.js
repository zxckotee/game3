/**
 * Скрипт миграции данных духовных питомцев из старой структуры в новую
 * 
 * Старая структура: одна таблица spirit_pets с полем userId
 * Новая структура: 
 *   - spirit_pets (каталог типов питомцев)
 *   - user_spirit_pets (экземпляры питомцев пользователей)
 */

const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Загружаем переменные окружения
dotenv.config();

// Конфигурация подключения к базе данных
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'game3',
  logging: console.log
});

// Определение старой модели SpiritPet
const OldSpiritPet = sequelize.define('SpiritPet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: { 
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  loyalty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50
  },
  hunger: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100
  },
  strength: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5
  },
  intelligence: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5
  },
  agility: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5
  },
  vitality: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5
  },
  spirit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5
  },
  abilities: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  evolutionStage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  lastFed: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  lastTrained: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at'
  }
}, {
  tableName: 'spirit_pets',
  timestamps: true,
  underscored: true
});

// Функция для проверки существования таблицы
async function tableExists(tableName) {
  try {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = :tableName
      )
    `;
    const result = await sequelize.query(query, {
      replacements: { tableName },
      type: Sequelize.QueryTypes.SELECT,
      plain: true
    });
    
    return result.exists;
  } catch (error) {
    console.error(`Ошибка при проверке существования таблицы ${tableName}:`, error);
    return false;
  }
}

// Функция для миграции данных
async function migrateSpiritPets() {
  try {
    console.log('Начинаем миграцию данных духовных питомцев...');
    
    // 1. Проверяем существование таблиц
    const spiritPetsExists = await tableExists('spirit_pets');
    const userSpiritPetsExists = await tableExists('user_spirit_pets');
    
    if (!spiritPetsExists) {
      console.error('Таблица spirit_pets не найдена! Миграция невозможна.');
      return;
    }
    
    // 2. Создаем таблицу user_spirit_pets, если её нет
    if (!userSpiritPetsExists) {
      console.log('Создаем таблицу user_spirit_pets...');
      
      await sequelize.query(`
        CREATE TABLE user_spirit_pets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          pet_id VARCHAR(30) NOT NULL REFERENCES spirit_pets(id) ON DELETE CASCADE,
          is_active BOOLEAN DEFAULT false,
          custom_name VARCHAR(100),
          level INTEGER DEFAULT 1,
          experience INTEGER DEFAULT 0,
          hunger INTEGER DEFAULT 100,
          loyalty INTEGER DEFAULT 100,
          strength INTEGER DEFAULT 1,
          intelligence INTEGER DEFAULT 1,
          agility INTEGER DEFAULT 1,
          vitality INTEGER DEFAULT 1,
          spirit INTEGER DEFAULT 1,
          last_fed TIMESTAMP,
          last_trained TIMESTAMP,
          combat_uses_count INTEGER DEFAULT 0,
          combat_flee_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, pet_id)
        );
        
        CREATE INDEX idx_user_spirit_pets_user_id ON user_spirit_pets(user_id);
        CREATE INDEX idx_user_spirit_pets_pet_id ON user_spirit_pets(pet_id);
        CREATE INDEX idx_user_spirit_pets_is_active ON user_spirit_pets(user_id, is_active);
      `);
      
      // Создаем триггер для автоматического обновления updated_at
      await sequelize.query(`
        CREATE OR REPLACE FUNCTION update_user_spirit_pets_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER trigger_update_user_spirit_pets_updated_at
        BEFORE UPDATE ON user_spirit_pets
        FOR EACH ROW
        EXECUTE FUNCTION update_user_spirit_pets_updated_at();
      `);
      
      console.log('Таблица user_spirit_pets успешно создана');
    }
    
    // 3. Проверяем наличие данных о базовых типах питомцев в каталоге
    const petTypesCount = await sequelize.query(
      `SELECT COUNT(*) FROM spirit_pets WHERE id ~ '^[a-z_]+$'`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (parseInt(petTypesCount[0].count) === 0) {
      console.log('Каталог питомцев пуст, создаем базовые типы...');
      
      // Создаем резервную копию существующей таблицы spirit_pets
      console.log('Создаем резервную копию таблицы spirit_pets...');
      await sequelize.query('CREATE TABLE spirit_pets_backup AS SELECT * FROM spirit_pets');
      
      // Очищаем таблицу spirit_pets
      await sequelize.query('TRUNCATE TABLE spirit_pets CASCADE');
      
      // Создаем базовые типы питомцев в каталоге
      await sequelize.query(`
        INSERT INTO spirit_pets (id, name, description, type, element, rarity, unlock_condition, max_level, icon, evolution_path) VALUES
        ('fire_fox', 'Огненный лис', 'Духовный питомец с элементом огня, способный к быстрому передвижению и атакам огненного типа', 'beast', 'fire', 'uncommon', 'Победить 10 огненных существ', 100, '🦊', '[]'),
        ('water_dragon', 'Водяной дракон', 'Редкий водяной дракон с мощными атаками и способностью к регенерации', 'mythical', 'water', 'rare', 'Исследовать Озеро Духов и победить Хранителя Вод', 120, '🐉', '[]'),
        ('earth_turtle', 'Земляная черепаха', 'Прочная земляная черепаха с высокой защитой', 'beast', 'earth', 'common', 'Собрать 20 единиц духовных минералов', 80, '🐢', '[]'),
        ('lightning_bird', 'Громовая птица', 'Редкая птица, управляющая молниями и способная к быстрым атакам', 'celestial', 'lightning', 'epic', 'Пережить небесную трибуляцию', 150, '⚡', '[]'),
        ('shadow_wolf', 'Теневой волк', 'Легендарный теневой волк с способностью к скрытности и мощными темными атаками', 'demonic', 'darkness', 'legendary', 'Найти и победить Хранителя Теней', 200, '🐺', '[]')
      `);
      
      console.log('Базовые типы питомцев успешно созданы');
    }
    
    // 4. Получаем данные существующих питомцев из резервной копии
    let oldPets = [];
    try {
      // Сначала пытаемся взять данные из резервной копии
      oldPets = await sequelize.query(
        'SELECT * FROM spirit_pets_backup WHERE id::text ~ \'^[0-9]+$\'',
        { type: sequelize.QueryTypes.SELECT }
      );
    } catch (error) {
      // Если резервной копии нет, берем данные из текущей таблицы
      oldPets = await OldSpiritPet.findAll();
    }
    
    console.log(`Найдено ${oldPets.length} питомцев для миграции`);
    
    // 5. Миграция данных в новую структуру
    let migratedCount = 0;
    const petTypeMap = {
      'fire': 'fire_fox',
      'water': 'water_dragon',
      'earth': 'earth_turtle',
      'lightning': 'lightning_bird',
      'darkness': 'shadow_wolf'
    };
    
    for (const oldPet of oldPets) {
      // Определяем ID типа питомца
      let petTypeId = oldPet.type ? petTypeMap[oldPet.type] || 'fire_fox' : 'fire_fox';
      
      // Проверяем, существует ли уже такой экземпляр питомца
      const existingPet = await sequelize.query(
        'SELECT * FROM user_spirit_pets WHERE user_id = :userId AND pet_id = :petId',
        { 
          replacements: { 
            userId: oldPet.userId || oldPet.user_id, 
            petId: petTypeId 
          },
          type: sequelize.QueryTypes.SELECT 
        }
      );
      
      if (existingPet.length === 0) {
        // Создаем новую запись в user_spirit_pets
        await sequelize.query(`
          INSERT INTO user_spirit_pets (
            user_id, pet_id, is_active, custom_name, level, experience,
            hunger, loyalty, strength, intelligence, agility, vitality,
            spirit, last_fed, last_trained, created_at, updated_at
          ) VALUES (
            :userId, :petId, :isActive, :customName, :level, :experience,
            :hunger, :loyalty, :strength, :intelligence, :agility, :vitality,
            :spirit, :lastFed, :lastTrained, :createdAt, :updatedAt
          )
        `, { 
          replacements: {
            userId: oldPet.userId || oldPet.user_id,
            petId: petTypeId,
            isActive: oldPet.isActive || oldPet.is_active || false,
            customName: oldPet.name,
            level: oldPet.level || 1,
            experience: oldPet.experience || 0,
            hunger: oldPet.hunger || 100,
            loyalty: oldPet.loyalty || 50,
            strength: oldPet.strength || 5,
            intelligence: oldPet.intelligence || 5,
            agility: oldPet.agility || 5,
            vitality: oldPet.vitality || 5,
            spirit: oldPet.spirit || 5,
            lastFed: oldPet.lastFed || oldPet.last_fed || new Date(),
            lastTrained: oldPet.lastTrained || oldPet.last_trained || null,
            createdAt: oldPet.createdAt || oldPet.created_at || new Date(),
            updatedAt: oldPet.updatedAt || oldPet.updated_at || new Date()
          }
        });
        
        migratedCount++;
      }
    }
    
    console.log(`Успешно мигрировано ${migratedCount} питомцев`);
    
    // 6. Проверяем и создаем таблицу для еды питомцев, если её нет
    const petFoodExists = await tableExists('spirit_pet_food_items');
    
    if (!petFoodExists) {
      console.log('Создаем таблицу spirit_pet_food_items...');
      
      await sequelize.query(`
        CREATE TABLE spirit_pet_food_items (
          id VARCHAR(30) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          rarity VARCHAR(20),
          nutrition_value INTEGER NOT NULL DEFAULT 25,
          loyalty_bonus INTEGER NOT NULL DEFAULT 0,
          stat_bonus_type VARCHAR(20) DEFAULT NULL,
          stat_bonus_value INTEGER DEFAULT 0,
          price INTEGER DEFAULT 100,
          icon VARCHAR(50),
          shop_categories JSONB DEFAULT '["pet_supplies"]'
        );
        
        -- Заполнение таблицы еды для питомцев
        INSERT INTO spirit_pet_food_items (id, name, description, rarity, nutrition_value, loyalty_bonus, price, icon) VALUES
        ('basic_pet_food', 'Базовый корм для питомцев', 'Простая еда для духовных питомцев', 'common', 20, 0, 50, '🥫'),
        ('improved_pet_food', 'Улучшенный корм для питомцев', 'Питательная еда с духовными травами для питомцев среднего уровня', 'uncommon', 35, 2, 150, '🍖'),
        ('premium_pet_food', 'Премиум корм для питомцев', 'Высококачественная еда для духовных питомцев', 'rare', 50, 5, 500, '🍗'),
        ('elemental_treat_fire', 'Огненное лакомство', 'Особое лакомство для питомцев огненной стихии', 'rare', 40, 8, 800, '🔥'),
        ('elemental_treat_water', 'Водное лакомство', 'Особое лакомство для питомцев водной стихии', 'rare', 40, 8, 800, '💧'),
        ('elemental_treat_earth', 'Земляное лакомство', 'Особое лакомство для питомцев земной стихии', 'rare', 40, 8, 800, '🌱'),
        ('elemental_treat_air', 'Воздушное лакомство', 'Особое лакомство для питомцев воздушной стихии', 'rare', 40, 8, 800, '💨'),
        ('mystic_pet_feast', 'Мистический пир для питомцев', 'Легендарная еда, значительно повышающая все показатели питомца', 'legendary', 100, 15, 3000, '✨');
        
        -- Интеграция с таблицей предметов, если она существует
        DO $$
        BEGIN
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'item_catalog') THEN
            INSERT INTO item_catalog (item_id, name, description, type, rarity)
            SELECT id, name, description, 'pet_food', rarity FROM spirit_pet_food_items
            ON CONFLICT (item_id) DO NOTHING;
          END IF;
        END $$;
      `);
      
      console.log('Таблица spirit_pet_food_items успешно создана');
    }
    
    console.log('Миграция успешно завершена!');
  } catch (error) {
    console.error('Ошибка при миграции данных:', error);
  } finally {
    await sequelize.close();
  }
}

// Запускаем миграцию
migrateSpiritPets();