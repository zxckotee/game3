/**
 * Сервис для работы с врагами
 * Обрабатывает запросы от API и взаимодействует с базой данных через ORM
 */

// Импортируем connectionProvider и инициализатор моделей
const connectionProvider = require('../utils/connection-provider');
const { initializeModels, waitForInitialization } = require('../models/initializeModels');
const modelRegistry = require('../models/registry'); // не трогай, это я исправил импорт

// Константы для типов врагов
const enemyRanks = {
  NORMAL: 'normal',
  ELITE: 'elite',
  BOSS: 'boss'
};

// Кэш для хранения данных (для оптимизации и обратной совместимости)
let enemiesCache = [];
let timeModifiersCache = null;
let weatherModifiersCache = null;

/**
 * Получает всех врагов из базы данных
 * @returns {Promise<Array>} Массив врагов
 */
exports.getAllEnemies = async function() {
  try {
    // Сначала дожидаемся инициализации всех моделей
    await waitForInitialization();
    
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    try {
      // Получаем модели напрямую через Sequelize
      const Enemy = db.model('Enemy');
      const EnemyStats = db.model('EnemyStats');
      const EnemyAttack = db.model('EnemyAttack');
      const EnemyLoot = db.model('EnemyLoot');
      const EnemyCurrency = db.model('EnemyCurrency');
    
    // Загружаем всех врагов с их связями
    const enemies = await Enemy.findAll({
      include: [
        { model: EnemyStats, as: 'stats' },
        { model: EnemyAttack, as: 'attacks' },
        { model: EnemyLoot, as: 'loot' },
        { model: EnemyCurrency, as: 'currency' }
      ]
    });
    
    // Преобразуем в удобный формат для клиента
    const formattedEnemies = enemies.map(enemy => formatEnemy(enemy));
    
    // Обновляем кэш
    enemiesCache = formattedEnemies;
    
    return formattedEnemies;
    } catch (modelError) {
      console.error('Ошибка при получении моделей:', modelError);
      throw modelError;
    }
  } catch (error) {
    console.error('Ошибка при получении врагов:', error);
    // В случае ошибки возвращаем кэшированные данные
    return enemiesCache;
  }
};

/**
 * Получает врага по ID
 * @param {string} id - ID врага
 * @returns {Promise<Object|null>} Враг или null, если не найден
 */
exports.getEnemyById = async function(id) {
  try {
    // Сначала дожидаемся инициализации всех моделей
    await waitForInitialization();
    
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    try {
      // Получаем модели напрямую через Sequelize
      const Enemy = db.model('Enemy');
      const EnemyStats = db.model('EnemyStats');
      const EnemyAttack = db.model('EnemyAttack');
      const EnemyLoot = db.model('EnemyLoot');
      const EnemyCurrency = db.model('EnemyCurrency');
    
    // Загружаем врага с его связями
    const enemy = await Enemy.findByPk(id, {
      include: [
        { model: EnemyStats, as: 'stats' },
        { model: EnemyAttack, as: 'attacks' },
        { model: EnemyLoot, as: 'loot' },
        { model: EnemyCurrency, as: 'currency' }
      ]
    });
    
    if (!enemy) {
      return null;
    }
    
    // Преобразуем в удобный формат для клиента
    return formatEnemy(enemy);
    } catch (modelError) {
      console.error('Ошибка при получении моделей:', modelError);
      throw modelError;
    }
  } catch (error) {
    console.error(`Ошибка при получении врага с ID ${id}:`, error);
    // В случае ошибки проверяем кэш
    return enemiesCache.find(enemy => enemy.id === id) || null;
  }
};

/**
 * Получает врагов по категории
 * @param {string} category - Категория врагов
 * @returns {Promise<Array>} Массив врагов указанной категории
 */
exports.getEnemiesByCategory = async function(category) {
  try {
    // Сначала дожидаемся инициализации всех моделей
    await waitForInitialization();
    
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    try {
      // Получаем модели напрямую через Sequelize
      const Enemy = db.model('Enemy');
      const EnemyStats = db.model('EnemyStats');
      const EnemyAttack = db.model('EnemyAttack');
      const EnemyLoot = db.model('EnemyLoot');
      const EnemyCurrency = db.model('EnemyCurrency');
    
    // Загружаем врагов с их связями
    const enemies = await Enemy.findAll({
      where: { category },
      include: [
        { model: EnemyStats, as: 'stats' },
        { model: EnemyAttack, as: 'attacks' },
        { model: EnemyLoot, as: 'loot' },
        { model: EnemyCurrency, as: 'currency' }
      ]
    });
    
    // Преобразуем в удобный формат для клиента
    return enemies.map(enemy => formatEnemy(enemy));
    } catch (modelError) {
      console.error('Ошибка при получении моделей:', modelError);
      throw modelError;
    }
  } catch (error) {
    console.error(`Ошибка при получении врагов категории ${category}:`, error);
    // В случае ошибки фильтруем кэш
    return enemiesCache.filter(enemy => enemy.category === category);
  }
};

/**
 * Получает модификаторы времени суток для врагов
 * @returns {Promise<Object>} Модификаторы времени суток
 */
exports.getTimeOfDaySpawnModifiers = async function() {
  try {
    // Если данные уже есть в кэше и они не пустые, вернем их
    if (timeModifiersCache) {
      return timeModifiersCache;
    }
    
    console.log('Модификаторы времени суток отключены, возвращаем значения по умолчанию');
    
    // Возвращаем значения по умолчанию без обращения к базе данных
    const defaultModifiers = {
      'рассвет': {
        'spirit_beast': 1.2,
        'bandit': 0.8,
        'undead': 0.5,
        'elemental': 1.1
      },
      'утро': {
        'spirit_beast': 1.1,
        'bandit': 1.0,
        'undead': 0.3,
        'elemental': 1.0
      },
      'полдень': {
        'spirit_beast': 1.0,
        'bandit': 1.2,
        'undead': 0.2,
        'elemental': 0.9
      },
      'день': {
        'spirit_beast': 1.0,
        'bandit': 1.2,
        'undead': 0.1,
        'elemental': 0.8
      },
      'вечер': {
        'spirit_beast': 1.1,
        'bandit': 1.0,
        'undead': 0.7,
        'elemental': 1.0
      },
      'ночь': {
        'spirit_beast': 0.8,
        'bandit': 0.6,
        'undead': 1.5,
        'elemental': 1.2
      }
    };
    
    // Обновляем кэш
    timeModifiersCache = defaultModifiers;
    
    return defaultModifiers;
  } catch (error) {
    console.error('Ошибка при получении модификаторов времени суток:', error);
    
    // В случае ошибки возвращаем значения по умолчанию
    const defaultModifiers = {
      'рассвет': {
        'spirit_beast': 1.2,
        'bandit': 0.8,
        'undead': 0.5,
        'elemental': 1.1
      },
      'утро': {
        'spirit_beast': 1.1,
        'bandit': 1.0,
        'undead': 0.3,
        'elemental': 1.0
      },
      'полдень': {
        'spirit_beast': 1.0,
        'bandit': 1.2,
        'undead': 0.2,
        'elemental': 0.9
      },
      'день': {
        'spirit_beast': 1.0,
        'bandit': 1.2,
        'undead': 0.1,
        'elemental': 0.8
      },
      'вечер': {
        'spirit_beast': 1.1,
        'bandit': 1.0,
        'undead': 0.7,
        'elemental': 1.0
      },
      'ночь': {
        'spirit_beast': 0.8,
        'bandit': 0.6,
        'undead': 1.5,
        'elemental': 1.2
      }
    };
    
    // Обновляем кэш
    timeModifiersCache = defaultModifiers;
    
    return defaultModifiers;
  }
};

/**
 * Получает модификаторы погоды для врагов
 * @returns {Promise<Object>} Модификаторы погоды
 */
exports.getWeatherSpawnModifiers = async function() {
  try {
    // Если данные уже есть в кэше и они не пустые, вернем их
    if (weatherModifiersCache) {
      return weatherModifiersCache;
    }
    
    console.log('Модификаторы погоды отключены, возвращаем значения по умолчанию');
    
    // Возвращаем значения по умолчанию без обращения к базе данных
    const defaultModifiers = {
      'Ясно': {
        'spirit_beast': 1.0,
        'bandit': 1.1,
        'undead': 0.9,
        'elemental': 1.0
      },
      'Облачно': {
        'spirit_beast': 1.0,
        'bandit': 1.0,
        'undead': 1.0,
        'elemental': 1.0
      },
      'Дождь': {
        'spirit_beast': 0.8,
        'bandit': 0.7,
        'undead': 1.0,
        'elemental': 1.2,
        'water_elemental': 1.5
      },
      'Гроза': {
        'spirit_beast': 0.6,
        'bandit': 0.5,
        'undead': 1.1,
        'elemental': 1.3,
        'lightning_elemental': 2.0
      },
      'Туман': {
        'spirit_beast': 0.9,
        'bandit': 1.1,
        'undead': 1.3,
        'elemental': 0.8,
        'ghost': 1.6
      },
      'Снег': {
        'spirit_beast': 0.7,
        'bandit': 0.6,
        'undead': 0.9,
        'elemental': 1.1,
        'ice_elemental': 1.8
      }
    };
    
    // Обновляем кэш
    weatherModifiersCache = defaultModifiers;
    
    return defaultModifiers;
  } catch (error) {
    console.error('Ошибка при получении модификаторов погоды:', error);
    
    // В случае ошибки возвращаем значения по умолчанию
    const defaultModifiers = {
      'Ясно': {
        'spirit_beast': 1.0,
        'bandit': 1.1,
        'undead': 0.9,
        'elemental': 1.0
      },
      'Облачно': {
        'spirit_beast': 1.0,
        'bandit': 1.0,
        'undead': 1.0,
        'elemental': 1.0
      },
      'Дождь': {
        'spirit_beast': 0.8,
        'bandit': 0.7,
        'undead': 1.0,
        'elemental': 1.2,
        'water_elemental': 1.5
      },
      'Гроза': {
        'spirit_beast': 0.6,
        'bandit': 0.5,
        'undead': 1.1,
        'elemental': 1.3,
        'lightning_elemental': 2.0
      },
      'Туман': {
        'spirit_beast': 0.9,
        'bandit': 1.1,
        'undead': 1.3,
        'elemental': 0.8,
        'ghost': 1.6
      },
      'Снег': {
        'spirit_beast': 0.7,
        'bandit': 0.6,
        'undead': 0.9,
        'elemental': 1.1,
        'ice_elemental': 1.8
      }
    };
    
    // Обновляем кэш
    weatherModifiersCache = defaultModifiers;
    
    return defaultModifiers;
  }
};

/**
 * Получает врагов, которые могут появиться в указанной локации
 * @param {string} locationId - ID локации
 * @returns {Promise<Array>} Массив врагов
 */
exports.getEnemiesByLocation = async function(locationId) {
  try {
    console.log(`Запрос на получение врагов для локации: ${locationId}`);
    
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Enemy = modelRegistry.getModel('Enemy');
    const EnemyStats = modelRegistry.getModel('EnemyStats');
    const EnemySpawn = modelRegistry.getModel('EnemySpawn');
    
    if (!Enemy || !EnemyStats || !EnemySpawn) {
      console.error('Не удалось получить модели Enemy, EnemyStats или EnemySpawn из реестра');
      return [];
    }
    
    // Загружаем точки появления врагов для указанной локации
    const spawns = await EnemySpawn.findAll({
      where: { locationId: locationId }
    });
    
    console.log(`Найдено ${spawns.length} точек появления для локации ${locationId}`);
    
    // Если точек появления нет, возвращаем пустой массив
    if (!spawns || spawns.length === 0) {
      return [];
    }
    
    // Собираем ID врагов
    const enemyIds = spawns.map(spawn => spawn.enemyId);
    console.log(`ID врагов для локации ${locationId}:`, enemyIds);
    
    // Загружаем врагов с их связями
    const enemies = await Enemy.findAll({
      where: { id: enemyIds },
      include: [
        { model: EnemyStats, as: 'stats' }
      ]
    });
    
    console.log(`Загружено ${enemies.length} врагов для локации ${locationId}`);
    
    // Преобразуем в удобный формат для клиента и добавляем шансы появления
    const formattedEnemies = enemies.map(enemy => {
      const spawn = spawns.find(s => s.enemyId === enemy.id);
      return {
        ...formatEnemy(enemy),
        spawnChance: spawn ? spawn.weight : 0, // Используем weight вместо spawn_chance
        requiredLevel: spawn ? spawn.minLevel : enemy.level // Добавляем requiredLevel из minLevel точки появления
      };
    });
    
    return formattedEnemies;
  } catch (error) {
    console.error(`Ошибка при получении врагов для локации ${locationId}:`, error);
    return [];
  }
};

/**
 * Добавляет нового врага в базу данных (только для администраторов)
 * @param {Object} enemyData - Данные о враге
 * @returns {Promise<Object>} Добавленный враг
 */
exports.addNewEnemy = async function(enemyData) {
  try {
    // Сначала дожидаемся инициализации всех моделей
    await waitForInitialization();
    
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    try {
      // Получаем модели напрямую через Sequelize
      const Enemy = db.model('Enemy');
      const EnemyStats = db.model('EnemyStats');
    
    // Начинаем транзакцию
    const transaction = await db.transaction();
    
    try {
      // Создаем врага
      const enemy = await Enemy.create({
        id: enemyData.id,
        name: enemyData.name,
        icon: enemyData.icon,
        description: enemyData.description,
        level: enemyData.level,
        category: enemyData.category,
        experience: enemyData.experience
      }, { transaction });
      
      // Создаем характеристики врага
      await EnemyStats.create({
        enemy_id: enemy.id,
        health: enemyData.stats.health,
        attack: enemyData.stats.attack,
        defense: enemyData.stats.defense,
        speed: enemyData.stats.speed,
        resistance: enemyData.stats.resistance || 0,
        critical_chance: enemyData.stats.criticalChance || 0.05
      }, { transaction });
      
      // Если есть атаки, создаем их
      if (enemyData.attacks && enemyData.attacks.length > 0) {
        const EnemyAttack = db.model('EnemyAttack');
        for (const attack of enemyData.attacks) {
          await EnemyAttack.create({
            enemy_id: enemy.id,
            name: attack.name,
            damage: attack.damage,
            cooldown: attack.cooldown,
            damage_type: attack.damageType,
            range: attack.range
          }, { transaction });
        }
      }
      
      // Если есть лут, создаем его
      if (enemyData.loot && enemyData.loot.length > 0) {
        const EnemyLoot = db.model('EnemyLoot');
        for (const loot of enemyData.loot) {
          await EnemyLoot.create({
            enemy_id: enemy.id,
            item_id: loot.itemId,
            drop_chance: loot.dropChance,
            min_quantity: loot.minQuantity || 1,
            max_quantity: loot.maxQuantity || 1
          }, { transaction });
        }
      }
      
      // Если есть валюта, создаем ее
      if (enemyData.currency) {
        const EnemyCurrency = db.model('EnemyCurrency');
        await EnemyCurrency.create({
          enemy_id: enemy.id,
          min_amount: enemyData.currency.minAmount || 0,
          max_amount: enemyData.currency.maxAmount || 0,
          currency_type: enemyData.currency.type || 'spirit_stone'
        }, { transaction });
      }
      
      // Фиксируем транзакцию
      await transaction.commit();
      
      // Получаем созданного врага со всеми связями
      const createdEnemy = await exports.getEnemyById(enemy.id);
      
      // Обновляем кэш
      const enemyIndex = enemiesCache.findIndex(e => e.id === enemy.id);
      if (enemyIndex !== -1) {
        enemiesCache[enemyIndex] = createdEnemy;
      } else {
        enemiesCache.push(createdEnemy);
      }
      
      return createdEnemy;
    } catch (error) {
      // В случае ошибки откатываем транзакцию
      await transaction.rollback();
      throw error;
    }
    } catch (modelError) {
      console.error('Ошибка при получении моделей:', modelError);
      throw modelError;
    }
  } catch (error) {
    console.error('Ошибка при добавлении нового врага:', error);
    throw error;
  }
};

/**
 * Обновляет существующего врага (только для администраторов)
 * @param {string} id - ID врага
 * @param {Object} updates - Обновления для врага
 * @returns {Promise<Object|null>} Обновленный враг или null, если не найден
 */
exports.updateEnemy = async function(id, updates) {
  try {
    // Сначала дожидаемся инициализации всех моделей
    await waitForInitialization();
    
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    try {
      // Получаем модели напрямую через Sequelize
      const Enemy = db.model('Enemy');
    
    // Проверяем, существует ли враг
    const enemy = await Enemy.findByPk(id);
    if (!enemy) {
      return null;
    }
    
    // Начинаем транзакцию
    const transaction = await db.transaction();
    
    try {
      // Обновляем основные данные врага
      await enemy.update({
        name: updates.name !== undefined ? updates.name : enemy.name,
        icon: updates.icon !== undefined ? updates.icon : enemy.icon,
        description: updates.description !== undefined ? updates.description : enemy.description,
        level: updates.level !== undefined ? updates.level : enemy.level,
        category: updates.category !== undefined ? updates.category : enemy.category,
        experience: updates.experience !== undefined ? updates.experience : enemy.experience
      }, { transaction });
      
      // Если есть обновления для характеристик
      if (updates.stats) {
        const EnemyStats = db.model('EnemyStats');
        const stats = await EnemyStats.findOne({ where: { enemy_id: id } });
        
        if (stats) {
          await stats.update({
            health: updates.stats.health !== undefined ? updates.stats.health : stats.health,
            attack: updates.stats.attack !== undefined ? updates.stats.attack : stats.attack,
            defense: updates.stats.defense !== undefined ? updates.stats.defense : stats.defense,
            speed: updates.stats.speed !== undefined ? updates.stats.speed : stats.speed,
            resistance: updates.stats.resistance !== undefined ? updates.stats.resistance : stats.resistance,
            critical_chance: updates.stats.criticalChance !== undefined ? updates.stats.criticalChance : stats.critical_chance
          }, { transaction });
        }
      }
      
      // Фиксируем транзакцию
      await transaction.commit();
      
      // Получаем обновленного врага со всеми связями
      const updatedEnemy = await exports.getEnemyById(id);
      
      // Обновляем кэш
      const enemyIndex = enemiesCache.findIndex(e => e.id === id);
      if (enemyIndex !== -1) {
        enemiesCache[enemyIndex] = updatedEnemy;
      }
      
      return updatedEnemy;
    } catch (error) {
      // В случае ошибки откатываем транзакцию
      await transaction.rollback();
      throw error;
    }
    } catch (modelError) {
      console.error('Ошибка при получении моделей:', modelError);
      throw modelError;
    }
  } catch (error) {
    console.error(`Ошибка при обновлении врага с ID ${id}:`, error);
    return null;
  }
};

/**
 * Удаляет врага из базы данных (только для администраторов)
 * @param {string} id - ID врага
 * @returns {Promise<boolean>} true, если враг успешно удален
 */
exports.deleteEnemy = async function(id) {
  try {
    // Сначала дожидаемся инициализации всех моделей
    await waitForInitialization();
    
    // Получаем экземпляр Sequelize через connectionProvider
    const { db } = await connectionProvider.getSequelizeInstance();
    
    try {
      // Получаем модель Enemy через Sequelize
      const Enemy = db.model('Enemy');
    
    // Проверяем, существует ли враг
    const enemy = await Enemy.findByPk(id);
    if (!enemy) {
      return false;
    }
    
    // Начинаем транзакцию
    const transaction = await db.transaction();
    
    try {
      // Удаляем врага и все связанные записи (каскадно)
      await enemy.destroy({ transaction });
      
      // Фиксируем транзакцию
      await transaction.commit();
      
      // Обновляем кэш
      enemiesCache = enemiesCache.filter(e => e.id !== id);
      
      return true;
    } catch (error) {
      // В случае ошибки откатываем транзакцию
      await transaction.rollback();
      throw error;
    }
    } catch (modelError) {
      console.error('Ошибка при получении моделей:', modelError);
      throw modelError;
    }
  } catch (error) {
    console.error(`Ошибка при удалении врага с ID ${id}:`, error);
    return false;
  }
};

/**
 * Преобразует врага в удобный формат для клиента
 * @param {Object} enemy - Объект врага из базы данных
 * @returns {Object} Форматированный враг
 */
function formatEnemy(enemy) {
  // Преобразуем объект в чистый JS-объект для более удобной работы
  const plainEnemy = enemy.toJSON ? enemy.toJSON() : enemy;
  
  // Преобразуем статистику
  const stats = plainEnemy.stats ? {
    health: plainEnemy.stats.health,
    attack: plainEnemy.stats.attack,
    defense: plainEnemy.stats.defense,
    speed: plainEnemy.stats.speed,
    resistance: plainEnemy.stats.resistance || 0,
    criticalChance: plainEnemy.stats.critical_chance || 0.05
  } : {};
  
  // Преобразуем атаки
  const attacks = plainEnemy.attacks ? plainEnemy.attacks.map(attack => ({
    id: attack.id,
    name: attack.name,
    damage: attack.damage,
    cooldown: attack.cooldown,
    damageType: attack.damage_type,
    range: attack.range
  })) : [];
  
  // Преобразуем лут
  const loot = plainEnemy.loot ? plainEnemy.loot.map(item => ({
    itemId: item.item_id,
    dropChance: item.drop_chance,
    minQuantity: item.min_quantity,
    maxQuantity: item.max_quantity
  })) : [];
  
  // Преобразуем валюту
  const currency = plainEnemy.currency ? {
    minAmount: plainEnemy.currency.min_amount,
    maxAmount: plainEnemy.currency.max_amount,
    type: plainEnemy.currency.currency_type
  } : null;
  
  return {
    id: plainEnemy.id,
    name: plainEnemy.name,
    description: plainEnemy.description,
    icon: plainEnemy.icon,
    level: plainEnemy.level,
    category: plainEnemy.category,
    experience: plainEnemy.experience,
    stats,
    attacks,
    loot,
    currency
  };
}

// Экспортируем константы
exports.enemyRanks = enemyRanks;