const InventoryItem = require('../models/inventory-item');
const { getInitializedUserModel } = require('../models/user');
const { browserInventoryData } = require('./inventory-service');

// Проверяем, находимся ли мы в браузере
const isBrowser = typeof window !== 'undefined';

// Глобальные настройки логирования
const FORCE_LOGGING = true; // Принудительное логирование независимо от флагов отладки

// Функция для логирования с префиксом, работает всегда
function forceLog(message, ...args) {
  if (FORCE_LOGGING) {
    console.log(`[EQUIPMENT SERVICE] ${message}`, ...args);
  }
}

/**
 * Сервис для работы с экипировкой
 */
class EquipmentService {
  // Включаем отладку для отслеживания проблем
  static DEBUG_REQUIREMENTS = true;

  /**
   * Проверяет соответствие требованиям предмета
   * @param {Object} item - Объект предмета
   * @param {Object} user - Объект пользователя
   * @returns {Object} - Результат проверки
   */
  static checkItemRequirements(item, user) {
    // ПРИНУДИТЕЛЬНОЕ логирование независимо от флага отладки
    forceLog(`Вызов checkItemRequirements для предмета:`, item && (item.name || item.id || 'Unnamed item'));
    forceLog(`Данные предмета:`, JSON.stringify(item, null, 2));
    
    // Проверка входных данных
    if (!item) {
      forceLog(`❌ ОШИБКА: Предмет не передан в функцию checkItemRequirements`);
      return { canEquip: false, failedRequirements: ['Предмет недоступен'] };
    }
    
    if (!user) {
      forceLog(`❌ ОШИБКА: Данные пользователя не переданы в функцию checkItemRequirements`);
      return { canEquip: false, failedRequirements: ['Данные пользователя недоступны'] };
    }
    
    // Получаем требования в обоих возможных форматах
    let directRequirements = item.requirements || {};
    let propertyRequirements = (item.properties && item.properties.requirements) || {};
    
    // Выводим требования для отладки
    forceLog(`📋 Прямые требования:`, JSON.stringify(directRequirements));
    forceLog(`📋 Требования из properties:`, JSON.stringify(propertyRequirements));
    
    // Объединяем требования, приоритет у прямых требований
    const requirements = { ...propertyRequirements, ...directRequirements };
    
    // Проверяем, есть ли вообще какие-то требования
    const hasRequirements = Object.keys(requirements).length > 0;
    
    if (!hasRequirements) {
      forceLog(`✅ У предмета нет требований, можно экипировать без проверок`);
      return { canEquip: true }; // Нет требований = можно экипировать
    }
    
    forceLog(`📊 Итоговые требования для проверки:`, JSON.stringify(requirements, null, 2));
    
    const result = { canEquip: true, failedRequirements: [] };
    
    // Получаем характеристики персонажа
    const playerLevel = user.level || 1;
    const playerStats = user.stats || {};
    const playerCultivation = user.cultivation || {};
    
    forceLog(`👤 Данные персонажа для проверки:`);
    forceLog(`- Уровень: ${playerLevel}`);
    forceLog(`- Характеристики:`, JSON.stringify(playerStats, null, 2));
    forceLog(`- Культивация:`, JSON.stringify(playerCultivation, null, 2));
    
    // Маппинг имен характеристик: ключ = имя в требованиях, значение = имя в данных игрока
    const statMappingReqToPlayer = {
      // Английские названия характеристик
      'strength': 'strength',
      'intelligence': 'intellect',
      'intellect': 'intellect',
      'perception': 'spirit',
      'spirit': 'spirit',
      'dexterity': 'agility',
      'agility': 'agility',
      'vitality': 'health',
      'health': 'health',
      'luck': 'luck',
      
      // Русские названия с учетом регистра
      'сила': 'strength',
      'Сила': 'strength',
      'интеллект': 'intellect',
      'Интеллект': 'intellect',
      'дух': 'spirit',
      'Дух': 'spirit',
      'ловкость': 'agility',
      'Ловкость': 'agility',
      'здоровье': 'health',
      'Здоровье': 'health',
      'удача': 'luck',
      'Удача': 'luck',
      
      // Требования по уровню
      'уровень': 'level',
      'Уровень': 'level'
    };
    
    // Функция для получения значения характеристики игрока
    const getPlayerStatValue = (reqStatName) => {
      // Нормализуем имя характеристики к нижнему регистру, если это строка
      const normalizedReqStatName = typeof reqStatName === 'string' ? reqStatName.toLowerCase() : reqStatName;
      
      // Получаем соответствующее имя характеристики в данных игрока
      // Пробуем сначала с оригинальным именем, затем с нормализованным
      const playerStatName = statMappingReqToPlayer[reqStatName] || statMappingReqToPlayer[normalizedReqStatName];
      
      if (!playerStatName) {
        forceLog(`⚠️ Неизвестное имя характеристики в требованиях: ${reqStatName}`);
        forceLog(`📌 Доступные требования: ${Object.keys(statMappingReqToPlayer).join(', ')}`);
        return 0;
      }
      
      // Ищем характеристику сначала напрямую в объекте user, затем в объекте stats
      const directValue = user[playerStatName];
      const statValue = playerStats[playerStatName];
      
      if (directValue !== undefined) {
        forceLog(`📊 Характеристика ${reqStatName}(${playerStatName}) найдена напрямую: ${directValue}`);
        return directValue;
      }
      
      if (statValue !== undefined) {
        forceLog(`📊 Характеристика ${reqStatName}(${playerStatName}) найдена в stats: ${statValue}`);
        return statValue;
      }
      
      forceLog(`⚠️ Характеристика ${reqStatName}(${playerStatName}) не найдена, возвращаем 0`);
      return 0;
    };
    
    // Проверка требования к уровню
    if (requirements.level) {
      const reqLevel = Number(requirements.level);
      forceLog(`🔍 Проверка уровня: ${playerLevel} >= ${reqLevel} ?`);
      
      if (playerLevel < reqLevel) {
        result.canEquip = false;
        result.failedRequirements.push(`Требуемый уровень: ${reqLevel}`);
        forceLog(`❌ Не соответствует требованию по уровню: ${playerLevel} < ${reqLevel}`);
      } else {
        forceLog(`✅ Требование по уровню выполнено`);
      }
    }
    
    // Проверка требования к стадии культивации
    if (requirements.cultivationStage) {
      const reqStage = requirements.cultivationStage;
      const playerStage = playerCultivation.stage;
      
      forceLog(`🔍 Проверка стадии культивации: "${playerStage || 'Нет'}" === "${reqStage}" ?`);
      
      if (playerStage !== reqStage) {
        result.canEquip = false;
        result.failedRequirements.push(`Требуемая стадия культивации: ${reqStage}`);
        forceLog(`❌ Не соответствует требованию по стадии культивации: "${playerStage || 'Нет'}" !== "${reqStage}"`);
      } else {
        forceLog(`✅ Требование по стадии культивации выполнено`);
      }
    }
    
    // Проверка требований к характеристикам
    // Перебираем все ключи из requirements и проверяем только те характеристики, которые есть в маппинге
    for (const [reqStat, reqValue] of Object.entries(requirements)) {
      // Пропускаем уже проверенные требования
      if (reqStat === 'level' || reqStat === 'cultivationStage') {
        continue;
      }
      
      // Проверяем, является ли это требованием к характеристике (есть в маппинге)
      if (statMappingReqToPlayer[reqStat]) {
        const playerValue = getPlayerStatValue(reqStat);
        
        // Проверяем, что reqValue - число, чтобы избежать сравнения с undefined или строками
        if (typeof reqValue === 'number') {
          forceLog(`🔍 Проверка ${reqStat}: ${playerValue} >= ${reqValue} ?`);
          
          if (playerValue < reqValue) {
            result.canEquip = false;
            result.failedRequirements.push(`Требуемый ${reqStat}: ${reqValue}`);
            forceLog(`❌ Не соответствует требованию по ${reqStat}: ${playerValue} < ${reqValue}`);
          } else {
            forceLog(`✅ Требование по ${reqStat} выполнено`);
          }
        } else {
          forceLog(`⚠️ Требование ${reqStat} имеет некорректное значение: ${reqValue}`);
        }
      }
    }
    
    // Итоговый результат проверки
    forceLog(`🏁 ИТОГОВЫЙ результат проверки: ${result.canEquip ? '✅ Можно экипировать' : '❌ Нельзя экипировать'}`);
    if (!result.canEquip) {
      forceLog(`📋 Причины:`, result.failedRequirements);
    }
    
    return result;
  }
  /**
   * Расчет бонусов для отдельного предмета
   * @param {Object} item - Объект предмета
   * @returns {Object} - Рассчитанные бонусы для предмета
   */
  static calculateItemBonuses(item) {
    if (!item) return null;
    
    // Проверяем, есть ли предрассчитанные бонусы
    if (item.calculatedBonuses) {
      // Возвращаем предрассчитанные бонусы
      return item.calculatedBonuses;
    }
    
    // Создаем стандартный объект для бонусов
    const bonuses = {
      stats: { strength: 0, dexterity: 0, vitality: 0, intelligence: 0, perception: 0, luck: 0 },
      combat: { physicalDamage: 0, magicDamage: 0, physicalDefense: 0, magicDefense: 0, critChance: 0, critDamage: 0, dodgeChance: 0 },
      cultivation: { energyMax: 0, energyRegen: 0, comprehensionRate: 0, breakthroughChance: 0 },
      elemental: { fire: 0, water: 0, earth: 0, air: 0, light: 0, dark: 0 },
      special: []
    };
    
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
    
    // Получаем эффекты предмета - проверяем оба возможных пути
    const itemEffects = item.effects || (item.properties && item.properties.effects);
    
    if (!itemEffects) return bonuses;
    
    // Обрабатываем эффекты предмета
    itemEffects.forEach(effect => {
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
            id: effect.id || `special-${Date.now()}`,
            name: effect.name || 'Особый эффект',
            description: effect.description || 'Нет описания'
          };
          bonuses.special.push(specialEffect);
          break;
      }
    });
    
    return bonuses;
  }
  /**
   * Получение экипированных предметов пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Объект с экипированными предметами по слотам
   */
  static async getEquippedItems(userId) {
    try {
      // Получаем все экипированные предметы из инвентаря
      let items = [];

      if (isBrowser) {
        // В браузере используем объект в памяти из импортированного browserInventoryData
        if (browserInventoryData[userId]) {
          items = browserInventoryData[userId].filter(item => item.equipped);
        }
      } else {
        // На сервере используем базу данных
        items = await InventoryItem.findAll({
          where: { 
            userId,
            equipped: true
          }
        });
      }
      
      // Преобразуем в объект по слотам экипировки
      const equipped = {
        weapon: null,
        headArmor: null,
        bodyArmor: null,
        legArmor: null,
        handArmor: null,
        accessory1: null,
        accessory2: null,
        artifact1: null,
        artifact2: null
      };
      
      // Заполняем слоты экипированными предметами
      for (const item of items) {
        const itemData = isBrowser ? item : item.toJSON();
        const formattedItem = {
          id: itemData.itemId,
          name: itemData.name,
          type: itemData.type,
          rarity: itemData.rarity,
          equipped: true,
          ...itemData.properties
        };
        
        // Определяем слот в зависимости от типа предмета
        switch(itemData.type) {
          case 'weapon':
            equipped.weapon = formattedItem;
            break;
          case 'armor':
            // Определяем подтип брони
            const armorType = itemData.properties.armorType || 'body';
            switch(armorType) {
              case 'head':
                equipped.headArmor = formattedItem;
                break;
              case 'body':
                equipped.bodyArmor = formattedItem;
                break;
              case 'legs':
                equipped.legArmor = formattedItem;
                break;
              case 'hands':
                equipped.handArmor = formattedItem;
                break;
              default:
                equipped.bodyArmor = formattedItem;
            }
            break;
          case 'accessory':
            if (!equipped.accessory1) {
              equipped.accessory1 = formattedItem;
            } else if (!equipped.accessory2) {
              equipped.accessory2 = formattedItem;
            }
            break;
          case 'artifact':
            if (!equipped.artifact1) {
              equipped.artifact1 = formattedItem;
            } else if (!equipped.artifact2) {
              equipped.artifact2 = formattedItem;
            }
            break;
        }
      }
      
      return equipped;
    } catch (error) {
      console.error('Ошибка при получении экипированных предметов:', error);
      throw error;
    }
  }
  
  /**
   * Экипировка предмета
   * @param {number} userId - ID пользователя
   * @param {string} itemId - ID предмета
   * @returns {Promise<Object>} - Результат операции
   */
  static async equipItem(userId, itemId) {
    try {
      let item = null;
      let existingEquippedItems = [];
      
      if (isBrowser) {
        // В браузере используем объект в памяти из импортированного browserInventoryData
        if (!browserInventoryData[userId]) {
          throw new Error('Инвентарь не найден');
        }
        
        // Находим предмет
        const itemIndex = browserInventoryData[userId].findIndex(
          item => item.itemId === itemId
        );
        
        if (itemIndex === -1) {
          throw new Error('Предмет не найден в инвентаре');
        }
        
        item = browserInventoryData[userId][itemIndex];
        
        // Проверяем требования для экипировки
        if (item.properties && item.properties.requirements) {
          // Получаем данные пользователя из глобального объекта или состояния
          const userObj = {
            level: window.gameState?.player?.level || 1,
            stats: window.gameState?.player?.stats || {}
          };
          
          const checkResult = this.checkItemRequirements(item, userObj);
          if (!checkResult.canEquip) {
            return {
              success: false,
              message: 'Не соответствует требованиям',
              failedRequirements: checkResult.failedRequirements
            };
          }
        }
        
        // Находим предметы того же типа, которые уже экипированы
        existingEquippedItems = browserInventoryData[userId].filter(
          i => i.equipped && i.type === item.type
        );
        
        // Особая обработка для аксессуаров и артефактов
        if (item.type === 'accessory' || item.type === 'artifact') {
          // Проверяем, что не более 2-х предметов этого типа экипировано
          if (existingEquippedItems.length >= 2) {
            // Снимаем экипировку с первого предмета этого типа
            browserInventoryData[userId].find(
              i => i.equipped && i.type === item.type
            ).equipped = false;
          }
        } else if (item.type === 'armor') {
          // Для брони проверяем подтип
          const armorType = item.properties.armorType || 'body';
          // Снимаем экипировку с предметов того же подтипа
          browserInventoryData[userId].forEach(i => {
            if (i.equipped && i.type === 'armor' && 
                (i.properties.armorType || 'body') === armorType) {
              i.equipped = false;
            }
          });
        } else {
          // Для остальных типов снимаем экипировку с предметов того же типа
          browserInventoryData[userId].forEach(i => {
            if (i.equipped && i.type === item.type) {
              i.equipped = false;
            }
          });
        }
        
        // Экипируем предмет
        browserInventoryData[userId][itemIndex].equipped = true;
        
        return {
          success: true,
          message: 'Предмет успешно экипирован',
          item: {
            id: item.itemId,
            name: item.name,
            type: item.type,
            rarity: item.rarity,
            equipped: true,
            ...item.properties
          }
        };
      } else {
        // На сервере используем базу данных
        item = await InventoryItem.findOne({
          where: { 
            userId,
            itemId
          }
        });
        
        if (!item) {
          throw new Error('Предмет не найден в инвентаре');
        }
        
        // Проверяем требования для экипировки
        if (item.properties && item.properties.requirements) {
          try {
            // Получаем данные пользователя
            const User = require('../models/user');
            const user = await User.findByPk(userId);
            if (!user) {
              throw new Error('Пользователь не найден');
            }
            
            const userObj = {
              level: user.level || 1,
              stats: user.stats || {}
            };
            
            const checkResult = this.checkItemRequirements(item, userObj);
            if (!checkResult.canEquip) {
              return {
                success: false,
                message: 'Не соответствует требованиям',
                failedRequirements: checkResult.failedRequirements
              };
            }
          } catch (error) {
            console.error('Ошибка при проверке требований:', error);
            // Продолжаем выполнение, так как проверка опциональна
          }
        }
        
        // Находим предметы того же типа, которые уже экипированы
        const options = { 
          where: { 
            userId,
            equipped: true
          }
        };
        
        if (item.type === 'armor' && item.properties.armorType) {
          // Для брони ищем по подтипу
          options.where.type = 'armor';
          options.where['properties.armorType'] = item.properties.armorType;
        } else if (item.type === 'accessory' || item.type === 'artifact') {
          // Для аксессуаров и артефактов особая логика
          options.where.type = item.type;
          existingEquippedItems = await InventoryItem.findAll(options);
          
          if (existingEquippedItems.length >= 2) {
            // Снимаем экипировку с первого предмета этого типа
            const oldestItem = existingEquippedItems[0];
            oldestItem.equipped = false;
            await oldestItem.save();
          }
        } else {
          // Для остальных типов просто по типу
          options.where.type = item.type;
          
          // Снимаем экипировку со всех предметов этого типа
          existingEquippedItems = await InventoryItem.findAll(options);
          for (const oldItem of existingEquippedItems) {
            oldItem.equipped = false;
            await oldItem.save();
          }
        }
        
        // Экипируем предмет
        item.equipped = true;
        await item.save();
        
        return {
          success: true,
          message: 'Предмет успешно экипирован',
          item: {
            id: item.itemId,
            name: item.name,
            type: item.type,
            rarity: item.rarity,
            equipped: true,
            ...item.properties
          }
        };
      }
    } catch (error) {
      console.error('Ошибка при экипировке предмета:', error);
      throw error;
    }
  }
  
  /**
   * Снятие предмета
   * @param {number} userId - ID пользователя
   * @param {string} itemId - ID предмета
   * @returns {Promise<Object>} - Результат операции
   */
  static async unequipItem(userId, itemId) {
    try {
      if (isBrowser) {
        // В браузере используем объект в памяти из импортированного browserInventoryData
        if (!browserInventoryData[userId]) {
          throw new Error('Инвентарь не найден');
        }
        
        // Находим предмет
        const itemIndex = browserInventoryData[userId].findIndex(
          item => item.itemId === itemId
        );
        
        if (itemIndex === -1) {
          throw new Error('Предмет не найден в инвентаре');
        }
        
        const item = browserInventoryData[userId][itemIndex];
        
        // Снимаем экипировку
        browserInventoryData[userId][itemIndex].equipped = false;
        
        return {
          success: true,
          message: 'Предмет успешно снят',
          item: {
            id: item.itemId,
            name: item.name,
            type: item.type,
            rarity: item.rarity,
            equipped: false,
            ...item.properties
          }
        };
      } else {
        // На сервере используем базу данных
        const item = await InventoryItem.findOne({
          where: { 
            userId,
            itemId
          }
        });
        
        if (!item) {
          throw new Error('Предмет не найден в инвентаре');
        }
        
        // Снимаем экипировку
        item.equipped = false;
        await item.save();
        
        return {
          success: true,
          message: 'Предмет успешно снят',
          item: {
            id: item.itemId,
            name: item.name,
            type: item.type,
            rarity: item.rarity,
            equipped: false,
            ...item.properties
          }
        };
      }
    } catch (error) {
      console.error('Ошибка при снятии предмета:', error);
      throw error;
    }
  }
  
  /**
   * Расчет бонусов от экипированных предметов
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Объект с бонусами
   */
  static async calculateEquipmentBonuses(userId) {
    try {
      // Получаем все экипированные предметы
      const equipped = await this.getEquippedItems(userId);
      
      // Создаем объект для бонусов
      const bonuses = {
        stats: {
          strength: 0,
          dexterity: 0,
          vitality: 0,
          intelligence: 0,
          perception: 0,
          luck: 0
        },
        combat: {
          physicalDamage: 0,
          magicDamage: 0,
          physicalDefense: 0,
          magicDefense: 0,
          critChance: 0,
          critDamage: 0,
          dodgeChance: 0
        },
        cultivation: {
          energyMax: 0,
          energyRegen: 0,
          comprehensionRate: 0,
          breakthroughChance: 0
        },
        elemental: {
          fire: 0,
          water: 0,
          earth: 0,
          air: 0,
          light: 0,
          dark: 0
        },
        special: []
      };
      
      // Функция для обработки эффектов предмета
      const processItemEffects = (item) => {
        if (!item) return;
        
        // Обрабатываем эффекты предмета
        if (item.effects) {
          for (const effect of item.effects) {
            switch (effect.type) {
              case 'statBoost':
                if (bonuses.stats[effect.target] !== undefined) {
                  if (effect.operation === 'add') {
                    bonuses.stats[effect.target] += effect.value;
                  } else if (effect.operation === 'percent') {
                    // Для процентного увеличения нужны базовые характеристики
                    // Реализация будет на уровне CharacterService
                  }
                }
                break;
              case 'combatBoost':
                if (bonuses.combat[effect.target] !== undefined) {
                  bonuses.combat[effect.target] += effect.value;
                }
                break;
              case 'cultivationBoost':
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
                bonuses.special.push({
                  id: effect.id,
                  name: effect.name,
                  description: effect.description
                });
                break;
            }
          }
        }
      };
      
      // Обрабатываем все экипированные предметы
      Object.values(equipped).forEach(item => processItemEffects(item));
      
      // Обработка сетов экипировки
      const equippedItems = Object.values(equipped).filter(item => item !== null);
      const setItems = {};
      
      // Группируем предметы по сетам
      equippedItems.forEach(item => {
        if (item.setId) {
          if (!setItems[item.setId]) {
            setItems[item.setId] = [];
          }
          setItems[item.setId].push(item);
        }
      });
      
      // Проверяем бонусы сетов
      Object.entries(setItems).forEach(([setId, items]) => {
        // Здесь должно быть обращение к базе данных с сетами
        // Пример реализации:
        const setData = {
          'azure-dragon': {
            name: 'Набор Лазурного Дракона',
            bonuses: [
              { 
                count: 2,
                effects: [{
                  type: 'statBoost',
                  target: 'strength',
                  value: 20,
                  operation: 'add'
                }]
              },
              {
                count: 4,
                effects: [{
                  type: 'special',
                  id: 'azure-dragon-breath',
                  name: 'Дыхание Лазурного Дракона',
                  description: 'Позволяет использовать атаку дыханием дракона'
                }]
              }
            ]
          }
        };
        
        // Проверяем, есть ли данный сет в нашей БД
        const set = setData[setId];
        if (set) {
          // Проверяем бонусы за количество предметов
          set.bonuses.forEach(bonus => {
            if (items.length >= bonus.count) {
              // Добавляем бонусы от сета
              bonus.effects.forEach(effect => {
                switch (effect.type) {
                  case 'statBoost':
                    bonuses.stats[effect.target] += effect.value;
                    break;
                  case 'combatBoost':
                    bonuses.combat[effect.target] += effect.value;
                    break;
                  case 'cultivationBoost':
                    bonuses.cultivation[effect.target] += effect.value;
                    break;
                  case 'elementalBoost':
                    bonuses.elemental[effect.element] += effect.value;
                    break;
                  case 'special':
                    bonuses.special.push({
                      id: effect.id,
                      name: effect.name,
                      description: effect.description
                    });
                    break;
                }
              });
            }
          });
        }
      });
      
      return bonuses;
    } catch (error) {
      console.error('Ошибка при расчете бонусов экипировки:', error);
      throw error;
    }
  }
}

module.exports = EquipmentService;


// Экспортируем отдельные методы для совместимости
module.exports.calculateItemBonuses = EquipmentService.calculateItemBonuses;
module.exports.getEquippedItems = EquipmentService.getEquippedItems;
module.exports.equipItem = EquipmentService.equipItem;
module.exports.unequipItem = EquipmentService.unequipItem;
module.exports.calculateEquipmentBonuses = EquipmentService.calculateEquipmentBonuses;