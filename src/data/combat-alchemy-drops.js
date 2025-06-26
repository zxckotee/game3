/**
 * Файл с данными о выпадении алхимических ингредиентов при сражениях
 * Определяет, какие ингредиенты могут выпасть с разных типов врагов
 */

// Типы врагов
const ENEMY_TYPES = {
  BEAST: 'beast', // Звери
  DEMON: 'demon', // Демоны
  UNDEAD: 'undead', // Нежить
  CULTIVATOR: 'cultivator', // Культиваторы
  SPIRIT: 'spirit', // Духи
  ELEMENTAL: 'elemental', // Элементали
  MONSTER: 'monster' // Монстры
};

// Элементы стихий
const ELEMENTS = {
  FIRE: 'fire', // Огонь
  WATER: 'water', // Вода
  EARTH: 'earth', // Земля
  WIND: 'wind', // Ветер
  METAL: 'metal', // Металл
  WOOD: 'wood' // Дерево
};

// Редкость добычи (определяет шансы выпадения)
const DROP_RARITY = {
  COMMON: { chance: 40, minLevel: 1 }, // 40% шанс выпадения, минимальный уровень врага 1
  UNCOMMON: { chance: 20, minLevel: 3 }, // 20% шанс выпадения, минимальный уровень врага 3
  RARE: { chance: 10, minLevel: 5 }, // 10% шанс выпадения, минимальный уровень врага 5
  EPIC: { chance: 3, minLevel: 10 }, // 3% шанс выпадения, минимальный уровень врага 10
  LEGENDARY: { chance: 1, minLevel: 20 } // 1% шанс выпадения, минимальный уровень врага 20
};

/**
 * Таблица добычи алхимических ингредиентов
 * Определяет какие предметы могут выпасть с определенных врагов
 * 
 * Структура:
 * - enemyType: тип врага
 * - element: (опционально) стихия врага
 * - drops: массив предметов, которые могут выпасть
 *   - itemId: ID предмета (должен соответствовать ID в resources.js)
 *   - rarity: редкость выпадения (влияет на шанс)
 *   - minQuantity: минимальное количество
 *   - maxQuantity: максимальное количество
 *   - bossMultiplier: множитель для боссов (увеличивает шанс и количество)
 */
const alchemyDropTable = [
  // Звери
  {
    enemyType: ENEMY_TYPES.BEAST,
    drops: [
      { 
        itemId: 'low_grade_herb', 
        rarity: DROP_RARITY.COMMON, 
        minQuantity: 1, 
        maxQuantity: 3, 
        bossMultiplier: 2
      },
      { 
        itemId: 'medium_grade_herb', 
        rarity: DROP_RARITY.UNCOMMON, 
        minQuantity: 1, 
        maxQuantity: 2, 
        bossMultiplier: 2
      },
      { 
        itemId: 'beast_soul', 
        rarity: DROP_RARITY.EPIC, 
        minQuantity: 1, 
        maxQuantity: 1, 
        bossMultiplier: 3
      }
    ]
  },
  
  // Демоны
  {
    enemyType: ENEMY_TYPES.DEMON,
    drops: [
      { 
        itemId: 'fire_essence', 
        rarity: DROP_RARITY.UNCOMMON, 
        minQuantity: 1, 
        maxQuantity: 2, 
        bossMultiplier: 2
      },
      { 
        itemId: 'demon_soul', 
        rarity: DROP_RARITY.RARE, 
        minQuantity: 1, 
        maxQuantity: 1, 
        bossMultiplier: 2
      },
      { 
        itemId: 'spirit_mineral', 
        rarity: DROP_RARITY.UNCOMMON, 
        minQuantity: 1, 
        maxQuantity: 3, 
        bossMultiplier: 2
      }
    ]
  },
  
  // Нежить
  {
    enemyType: ENEMY_TYPES.UNDEAD,
    drops: [
      { 
        itemId: 'spirit_essence', 
        rarity: DROP_RARITY.RARE, 
        minQuantity: 1, 
        maxQuantity: 1, 
        bossMultiplier: 2
      },
      { 
        itemId: 'high_grade_herb', 
        rarity: DROP_RARITY.UNCOMMON, 
        minQuantity: 1, 
        maxQuantity: 2, 
        bossMultiplier: 2
      }
    ]
  },
  
  // Культиваторы
  {
    enemyType: ENEMY_TYPES.CULTIVATOR,
    drops: [
      { 
        itemId: 'spirit_stone', 
        rarity: DROP_RARITY.COMMON, 
        minQuantity: 2, 
        maxQuantity: 5, 
        bossMultiplier: 3
      },
      { 
        itemId: 'spirit_mineral', 
        rarity: DROP_RARITY.UNCOMMON, 
        minQuantity: 1, 
        maxQuantity: 2, 
        bossMultiplier: 2
      },
      { 
        itemId: 'spirit_crystal', 
        rarity: DROP_RARITY.RARE, 
        minQuantity: 1, 
        maxQuantity: 1, 
        bossMultiplier: 2
      },
      { 
        itemId: 'heavenly_jade', 
        rarity: DROP_RARITY.LEGENDARY, 
        minQuantity: 1, 
        maxQuantity: 1, 
        bossMultiplier: 1
      }
    ]
  },
  
  // Духи
  {
    enemyType: ENEMY_TYPES.SPIRIT,
    drops: [
      { 
        itemId: 'spirit_essence', 
        rarity: DROP_RARITY.UNCOMMON, 
        minQuantity: 1, 
        maxQuantity: 2, 
        bossMultiplier: 2
      },
      { 
        itemId: 'spirit_stone', 
        rarity: DROP_RARITY.COMMON, 
        minQuantity: 1, 
        maxQuantity: 3, 
        bossMultiplier: 2
      }
    ]
  },
  
  // Элементали
  // Огонь
  {
    enemyType: ENEMY_TYPES.ELEMENTAL,
    element: ELEMENTS.FIRE,
    drops: [
      { 
        itemId: 'fire_essence', 
        rarity: DROP_RARITY.COMMON, 
        minQuantity: 1, 
        maxQuantity: 3, 
        bossMultiplier: 2
      }
    ]
  },
  // Вода
  {
    enemyType: ENEMY_TYPES.ELEMENTAL,
    element: ELEMENTS.WATER,
    drops: [
      { 
        itemId: 'water_essence', 
        rarity: DROP_RARITY.COMMON, 
        minQuantity: 1, 
        maxQuantity: 3, 
        bossMultiplier: 2
      }
    ]
  },
  // Земля
  {
    enemyType: ENEMY_TYPES.ELEMENTAL,
    element: ELEMENTS.EARTH,
    drops: [
      { 
        itemId: 'earth_essence', 
        rarity: DROP_RARITY.COMMON, 
        minQuantity: 1, 
        maxQuantity: 3, 
        bossMultiplier: 2
      }
    ]
  },
  // Ветер
  {
    enemyType: ENEMY_TYPES.ELEMENTAL,
    element: ELEMENTS.WIND,
    drops: [
      { 
        itemId: 'wind_essence', 
        rarity: DROP_RARITY.COMMON, 
        minQuantity: 1, 
        maxQuantity: 3, 
        bossMultiplier: 2
      }
    ]
  },
  
  // Монстры (общая категория)
  {
    enemyType: ENEMY_TYPES.MONSTER,
    drops: [
      { 
        itemId: 'low_grade_herb', 
        rarity: DROP_RARITY.COMMON, 
        minQuantity: 1, 
        maxQuantity: 3, 
        bossMultiplier: 2
      },
      { 
        itemId: 'spirit_iron', 
        rarity: DROP_RARITY.UNCOMMON, 
        minQuantity: 1, 
        maxQuantity: 2, 
        bossMultiplier: 2
      },
      { 
        itemId: 'celestial_wood', 
        rarity: DROP_RARITY.RARE, 
        minQuantity: 1, 
        maxQuantity: 1, 
        bossMultiplier: 2
      }
    ]
  }
];

/**
 * Функция для определения, выпал ли предмет на основе его редкости
 * @param {Object} rarityData Данные о редкости (шанс и минимальный уровень)
 * @param {number} enemyLevel Уровень врага
 * @param {boolean} isBoss Является ли враг боссом
 * @returns {boolean} True, если предмет выпал, иначе false
 */
function rollForDrop(rarityData, enemyLevel, isBoss = false) {
  // Если уровень врага ниже минимального для данной редкости, предмет не выпадает
  if (enemyLevel < rarityData.minLevel) {
    return false;
  }
  
  // Базовый шанс выпадения
  let chance = rarityData.chance;
  
  // Увеличиваем шанс на основе уровня врага (каждые 5 уровней +5% к шансу)
  chance += Math.floor(enemyLevel / 5) * 5;
  
  // Если это босс, увеличиваем шанс на 20%
  if (isBoss) {
    chance += 20;
  }
  
  // Максимальный шанс - 90%
  chance = Math.min(chance, 90);
  
  // Определяем, выпал ли предмет
  return Math.random() * 100 < chance;
}

/**
 * Функция для определения количества выпавших предметов
 * @param {number} min Минимальное количество
 * @param {number} max Максимальное количество
 * @param {number} multiplier Множитель количества (для боссов)
 * @returns {number} Количество выпавших предметов
 */
function rollForQuantity(min, max, multiplier = 1) {
  const baseQuantity = Math.floor(Math.random() * (max - min + 1)) + min;
  return Math.floor(baseQuantity * multiplier);
}

/**
 * Функция для получения добычи с врага
 * @param {string} enemyType Тип врага
 * @param {number} enemyLevel Уровень врага
 * @param {boolean} isBoss Является ли враг боссом
 * @param {string} [element] Стихия врага (опционально)
 * @returns {Array} Массив выпавших предметов
 */
function getEnemyAlchemyDrops(enemyType, enemyLevel, isBoss = false, element = null) {
  const drops = [];
  
  // Фильтруем таблицу добычи по типу врага и элементу (если указан)
  const applicableTables = alchemyDropTable.filter(table => 
    table.enemyType === enemyType && 
    (element === null || table.element === undefined || table.element === element)
  );
  
  // Для каждой подходящей таблицы добычи
  applicableTables.forEach(table => {
    // Для каждого предмета в таблице
    table.drops.forEach(dropItem => {
      // Проверяем, выпал ли предмет
      if (rollForDrop(dropItem.rarity, enemyLevel, isBoss)) {
        // Определяем количество
        const quantity = rollForQuantity(
          dropItem.minQuantity, 
          dropItem.maxQuantity, 
          isBoss ? dropItem.bossMultiplier : 1
        );
        
        // Добавляем предмет в список добычи
        drops.push({
          itemId: dropItem.itemId,
          quantity
        });
      }
    });
  });
  
  return drops;
}

module.exports = {
  ENEMY_TYPES,
  ELEMENTS,
  DROP_RARITY,
  alchemyDropTable,
  getEnemyAlchemyDrops
};
