/**
 * Миграция: Добавление поля calculatedBonuses к предметам экипировки
 * 
 * Эта миграция добавляет поле calculatedBonuses ко всем предметам экипировки в базе данных.
 * Поле содержит предрассчитанные бонусы для различных характеристик.
 */

const path = require('path');
const fs = require('fs');
const { connectToDatabase } = require('../services/database');

/**
 * Выполнение миграции
 */
async function up() {
  console.log('Начало миграции: добавление поля calculatedBonuses к предметам экипировки');
  
  try {
    const db = await connectToDatabase();
    
    // Получаем все предметы экипировки
    const equipment = await db.all(
      `SELECT * FROM equipment_items WHERE item_type IN ('weapon', 'armor', 'accessory', 'artifact', 'talisman')`
    );
    
    console.log(`Найдено ${equipment.length} предметов экипировки для обновления`);
    
    // Начинаем транзакцию для безопасного обновления
    await db.run('BEGIN TRANSACTION');
    
    // Убедимся, что в таблице есть столбец calculated_bonuses
    await db.run(`
      ALTER TABLE equipment_items ADD COLUMN calculated_bonuses TEXT DEFAULT NULL
    `).catch(err => {
      if (!err.message.includes('duplicate column name')) {
        throw err;
      }
      console.log('Столбец calculated_bonuses уже существует');
    });
    
    // Для каждого предмета рассчитываем бонусы и обновляем запись в базе данных
    for (const item of equipment) {
      const calculatedBonuses = calculateBonusesForItem(item);
      
      // Обновляем запись в базе данных
      await db.run(
        `UPDATE equipment_items SET calculated_bonuses = ? WHERE id = ?`,
        [JSON.stringify(calculatedBonuses), item.id]
      );
      
      console.log(`Обновлен предмет ID ${item.id}: ${item.name}`);
    }
    
    // Завершаем транзакцию
    await db.run('COMMIT');
    
    console.log('Миграция завершена успешно: calculatedBonuses добавлены к предметам экипировки');
  } catch (error) {
    console.error('Ошибка при выполнении миграции:', error);
    
    // В случае ошибки откатываем транзакцию
    try {
      const db = await connectToDatabase();
      await db.run('ROLLBACK');
    } catch (rollbackError) {
      console.error('Ошибка при откате транзакции:', rollbackError);
    }
    
    throw error;
  }
}

/**
 * Откат миграции
 */
async function down() {
  console.log('Откат миграции: удаление поля calculatedBonuses из предметов экипировки');
  
  try {
    const db = await connectToDatabase();
    
    // Начинаем транзакцию
    await db.run('BEGIN TRANSACTION');
    
    // Создаем временную таблицу без столбца calculated_bonuses
    await db.run(`
      CREATE TEMPORARY TABLE equipment_items_backup (
        id INTEGER PRIMARY KEY,
        item_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        item_type TEXT NOT NULL,
        rarity TEXT NOT NULL,
        base_price INTEGER,
        effects TEXT,
        properties TEXT,
        requirements TEXT,
        image_url TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    `);
    
    // Копируем данные во временную таблицу
    await db.run(`
      INSERT INTO equipment_items_backup 
      SELECT id, item_id, name, description, item_type, rarity, base_price, effects, 
             properties, requirements, image_url, created_at, updated_at 
      FROM equipment_items
    `);
    
    // Удаляем оригинальную таблицу
    await db.run('DROP TABLE equipment_items');
    
    // Переименовываем временную таблицу
    await db.run('ALTER TABLE equipment_items_backup RENAME TO equipment_items');
    
    // Завершаем транзакцию
    await db.run('COMMIT');
    
    console.log('Откат миграции завершен успешно: поле calculatedBonuses удалено');
  } catch (error) {
    console.error('Ошибка при откате миграции:', error);
    
    // В случае ошибки откатываем транзакцию
    try {
      const db = await connectToDatabase();
      await db.run('ROLLBACK');
    } catch (rollbackError) {
      console.error('Ошибка при откате транзакции:', rollbackError);
    }
    
    throw error;
  }
}

/**
 * Функция для расчета бонусов предмета
 * @param {Object} item - Предмет экипировки
 * @return {Object} - Объект с рассчитанными бонусами
 */
function calculateBonusesForItem(item) {
  // Создаем структуру объекта бонусов
  const bonuses = {
    stats: { strength: 0, dexterity: 0, vitality: 0, intelligence: 0, perception: 0, luck: 0 },
    combat: { physicalDamage: 0, magicDamage: 0, physicalDefense: 0, magicDefense: 0, critChance: 0, critDamage: 0, dodgeChance: 0 },
    cultivation: { energyMax: 0, energyRegen: 0, comprehensionRate: 0, breakthroughChance: 0 },
    elemental: { fire: 0, water: 0, earth: 0, air: 0, light: 0, dark: 0 },
    special: []
  };
  
  // Загружаем эффекты предмета
  let effects = [];
  try {
    // Если эффекты хранятся в JSON формате в строке
    if (item.effects) {
      effects = JSON.parse(item.effects);
    }
    
    // Если эффекты хранятся в свойствах предмета
    const properties = item.properties ? JSON.parse(item.properties) : null;
    if (properties && properties.effects) {
      effects = properties.effects;
    }
  } catch (error) {
    console.error(`Ошибка при парсинге эффектов предмета ${item.id} (${item.name}):`, error);
    return bonuses; // Возвращаем пустые бонусы в случае ошибки
  }
  
  // Отображение старых имен характеристик на новые
  const statMappings = {
    'strength': 'strength',
    'intellect': 'intelligence',
    'intelligence': 'intelligence',
    'spirit': 'perception',
    'agility': 'dexterity',
    'dexterity': 'dexterity',
    'health': 'vitality',
    'vitality': 'vitality',
    'perception': 'perception',
    'luck': 'luck'
  };
  
  // Отображение старых имен боевых характеристик на новые
  const combatMappings = {
    'physicalAttack': 'physicalDamage',
    'magicalAttack': 'magicDamage',
    'physicalDamage': 'physicalDamage',
    'magicDamage': 'magicDamage',
    'evasion': 'dodgeChance',
    'dodgeChance': 'dodgeChance'
  };
  
  // Обрабатываем каждый эффект предмета
  for (const effect of effects) {
    switch (effect.type) {
      case 'statBoost':
        if (bonuses.stats[effect.target] !== undefined) {
          bonuses.stats[effect.target] += effect.value;
        } else {
          // Проверяем, есть ли соответствие в отображении названий
          const newTarget = statMappings[effect.target];
          if (newTarget && bonuses.stats[newTarget] !== undefined) {
            bonuses.stats[newTarget] += effect.value;
          }
        }
        break;
      
      case 'combatBoost':
        if (bonuses.combat[effect.target] !== undefined) {
          bonuses.combat[effect.target] += effect.value;
        } else {
          // Проверяем, есть ли соответствие в отображении названий
          const newTarget = combatMappings[effect.target];
          if (newTarget && bonuses.combat[newTarget] !== undefined) {
            bonuses.combat[newTarget] += effect.value;
          }
        }
        break;
      
      // Обрабатываем оба типа эффектов культивации
      case 'cultivationBoost':
      case 'cultivation':
        if (bonuses.cultivation[effect.target] !== undefined) {
          bonuses.cultivation[effect.target] += effect.value;
        }
        break;
      
      case 'elementalBoost':
        if (bonuses.elemental[effect.element] !== undefined) {
          bonuses.elemental[effect.element] += effect.value;
        }
        break;
      
      case 'special':
        const specialEffect = {
          id: effect.id || `special-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: effect.name || 'Особый эффект',
          description: effect.description || 'Нет описания'
        };
        bonuses.special.push(specialEffect);
        break;
    }
  }
  
  // Для оружия добавляем базовый физический урон, если он не указан явно
  if (item.item_type === 'weapon' && bonuses.combat.physicalDamage === 0) {
    // Базовый урон в зависимости от редкости
    const rarityDamageBonus = {
      'common': 5,
      'uncommon': 10,
      'rare': 15,
      'epic': 20,
      'legendary': 30
    };
    
    bonuses.combat.physicalDamage = rarityDamageBonus[item.rarity] || 5;
  }
  
  // Для брони добавляем базовую защиту, если она не указана явно
  if (item.item_type === 'armor' && bonuses.combat.physicalDefense === 0) {
    // Базовая защита в зависимости от редкости
    const rarityDefenseBonus = {
      'common': 3,
      'uncommon': 6,
      'rare': 9,
      'epic': 12,
      'legendary': 18
    };
    
    bonuses.combat.physicalDefense = rarityDefenseBonus[item.rarity] || 3;
  }
  
  return bonuses;
}

module.exports = { up, down };
