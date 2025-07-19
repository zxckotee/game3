const { getModel } = require('../models/registry');
const modelRegistry = require('../models/registry');
const CultivationService = require('./cultivation-service');

// Получаем модель CharacterStats через registry для избежания конфликтов инициализации
const getCharacterStatsModel = async () => {
  await modelRegistry.initializeRegistry();
  return getModel('CharacterStats');
};

// Проверяем, находимся ли мы в браузере
const isBrowser = typeof window !== 'undefined';

// Храним данные о характеристиках в памяти для браузера
let browserCharacterStatsData = {};

/**
 * Сервис для работы с характеристиками персонажа
 */
class CharacterStatsService {
  /**
   * Получение характеристик персонажа
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Характеристики персонажа
   */
  static async getCharacterStats(userId) {
    try {
      if (isBrowser) {
        // В браузере используем объект в памяти
        if (!browserCharacterStatsData[userId]) {
          // Если данных нет, создаем исходные данные
          browserCharacterStatsData[userId] = {
            userId,
            strength: 10,
            intellect: 10,
            spirit: 10,
            agility: 10,
            health: 10,
            physicalDefense: 0,
            spiritualDefense: 0,
            attackSpeed: 0,
            criticalChance: 0,
            movementSpeed: 0,
            luck: 0
          };
        }
        
        // Возвращаем данные из памяти
        const stats = browserCharacterStatsData[userId];
        
        return {
          strength: stats.strength,
          intellect: stats.intellect,
          spirit: stats.spirit,
          agility: stats.agility,
          health: stats.health,
          physicalDefense: stats.physicalDefense,
          spiritualDefense: stats.spiritualDefense,
          attackSpeed: stats.attackSpeed,
          criticalChance: stats.criticalChance,
          movementSpeed: stats.movementSpeed,
          luck: stats.luck
        };
      } else {
        // На сервере используем базу данных
        // Получаем модель через registry для избежания конфликтов инициализации
        const CharacterStats = await getCharacterStatsModel();
        
        // Проверяем, есть ли запись о характеристиках для пользователя
        let stats = await CharacterStats.findOne({
          where: { user_id: userId }
        });
        
        // Если записи нет, создаем новую с начальными значениями
        if (!stats) {
          stats = await CharacterStats.create({
            user_id: userId,
            strength: 10,
            intellect: 10,
            spirit: 10,
            agility: 10,
            health: 10,
            physical_defense: 0,
            spiritual_defense: 0,
            attack_speed: 0,
            critical_chance: 0,
            movement_speed: 0,
            luck: 0
          });
        }
        
        // Преобразуем данные для клиента из snake_case в camelCase
        return {
          strength: stats.strength,
          intellect: stats.intellect,
          spirit: stats.spirit,
          agility: stats.agility,
          health: stats.health,
          physicalDefense: stats.physical_defense,
          spiritualDefense: stats.spiritual_defense,
          attackSpeed: stats.attack_speed,
          criticalChance: stats.critical_chance,
          movementSpeed: stats.movement_speed,
          luck: stats.luck
        };
      }
    } catch (error) {
      console.error('Ошибка при получении характеристик персонажа:', error);
      throw error;
    }
  }
  
  /**
   * Обновление характеристик персонажа
   * @param {number} userId - ID пользователя
   * @param {Object} data - Новые характеристики персонажа
   * @returns {Promise<Object>} - Обновленные характеристики персонажа
   */
  static async updateCharacterStats(userId, data) {
    try {
      if (isBrowser) {
        // В браузере используем объект в памяти
        if (!browserCharacterStatsData[userId]) {
          // Если данных нет, создаем исходные данные
          browserCharacterStatsData[userId] = {
            userId,
            strength: 10,
            intellect: 10,
            spirit: 10,
            agility: 10,
            health: 10,
            physicalDefense: 0,
            spiritualDefense: 0,
            attackSpeed: 0,
            criticalChance: 0,
            movementSpeed: 0,
            luck: 0
          };
        }
        
        // Обновляем данные в памяти
        const stats = browserCharacterStatsData[userId];
        
        browserCharacterStatsData[userId] = {
          ...stats,
          strength: data.strength !== undefined ? data.strength : stats.strength,
          intellect: data.intellect !== undefined ? data.intellect : stats.intellect,
          spirit: data.spirit !== undefined ? data.spirit : stats.spirit,
          agility: data.agility !== undefined ? data.agility : stats.agility,
          health: data.health !== undefined ? data.health : stats.health,
          physicalDefense: data.physicalDefense !== undefined ? data.physicalDefense : stats.physicalDefense,
          spiritualDefense: data.spiritualDefense !== undefined ? data.spiritualDefense : stats.spiritualDefense,
          attackSpeed: data.attackSpeed !== undefined ? data.attackSpeed : stats.attackSpeed,
          criticalChance: data.criticalChance !== undefined ? data.criticalChance : stats.criticalChance,
          movementSpeed: data.movementSpeed !== undefined ? data.movementSpeed : stats.movementSpeed,
          luck: data.luck !== undefined ? data.luck : stats.luck
        };
        
        // Возвращаем обновленные данные
        return {
          strength: browserCharacterStatsData[userId].strength,
          intellect: browserCharacterStatsData[userId].intellect,
          spirit: browserCharacterStatsData[userId].spirit,
          agility: browserCharacterStatsData[userId].agility,
          health: browserCharacterStatsData[userId].health,
          physicalDefense: browserCharacterStatsData[userId].physicalDefense,
          spiritualDefense: browserCharacterStatsData[userId].spiritualDefense,
          attackSpeed: browserCharacterStatsData[userId].attackSpeed,
          criticalChance: browserCharacterStatsData[userId].criticalChance,
          movementSpeed: browserCharacterStatsData[userId].movementSpeed,
          luck: browserCharacterStatsData[userId].luck
        };
      } else {
        // На сервере используем базу данных
        // Получаем модель через registry для избежания конфликтов инициализации
        const CharacterStats = await getCharacterStatsModel();
        
        // Получаем текущие характеристики персонажа
        let stats = await CharacterStats.findOne({
          where: { user_id: userId }
        });
        
        // Если записи нет, создаем новую
        if (!stats) {
          stats = await CharacterStats.create({
            user_id: userId,
            strength: 10,
            intellect: 10,
            spirit: 10,
            agility: 10,
            health: 10,
            physical_defense: 0,
            spiritual_defense: 0,
            attack_speed: 0,
            critical_chance: 0,
            movement_speed: 0,
            luck: 0
          });
        }
        
        // Обновляем характеристики - преобразуем из camelCase в snake_case
        await stats.update({
          strength: data.strength !== undefined ? data.strength : stats.strength,
          intellect: data.intellect !== undefined ? data.intellect : stats.intellect,
          spirit: data.spirit !== undefined ? data.spirit : stats.spirit,
          agility: data.agility !== undefined ? data.agility : stats.agility,
          health: data.health !== undefined ? data.health : stats.health,
          physical_defense: data.physicalDefense !== undefined ? data.physicalDefense : stats.physical_defense,
          spiritual_defense: data.spiritualDefense !== undefined ? data.spiritualDefense : stats.spiritual_defense,
          attack_speed: data.attackSpeed !== undefined ? data.attackSpeed : stats.attack_speed,
          critical_chance: data.criticalChance !== undefined ? data.criticalChance : stats.critical_chance,
          movement_speed: data.movementSpeed !== undefined ? data.movementSpeed : stats.movement_speed,
          luck: data.luck !== undefined ? data.luck : stats.luck
        });
        
        // Получаем обновленные характеристики
        stats = await CharacterStats.findOne({
          where: { user_id: userId }
        });
        
        // Преобразуем данные для клиента из snake_case в camelCase
        return {
          strength: stats.strength,
          intellect: stats.intellect,
          spirit: stats.spirit,
          agility: stats.agility,
          health: stats.health,
          physicalDefense: stats.physical_defense,
          spiritualDefense: stats.spiritual_defense,
          attackSpeed: stats.attack_speed,
          criticalChance: stats.critical_chance,
          movementSpeed: stats.movement_speed,
          luck: stats.luck
        };
      }
    } catch (error) {
      console.error('Ошибка при обновлении характеристик персонажа:', error);
      throw error;
    }
  }
  
  /**
   * Расчет вторичных характеристик персонажа
   * @param {Object} stats - Основные характеристики персонажа
   * @param {Object} cultivation - Данные о культивации
   * @returns {Promise<Object>} - Вторичные характеристики персонажа
   */
  static calculateSecondaryStats(stats, cultivation) {
    try {
      if (!stats || !cultivation) {
        return {
          physicalAttack: 0,
          physicalDefense: 0,
          spiritualAttack: 0,
          spiritualDefense: 0,
          attackSpeed: 0,
          criticalChance: 0,
          movementSpeed: 0,
          luck: 0
        };
      }
      
      // Расчет общего уровня культивации
      const stageValues = {
        'закалка тела': 0,
        'очищение ци': 100,
        'золотое ядро': 300,
        'формирование души': 500
      };
      
      // Проверяем наличие stage и level в объекте cultivation
      const stage = cultivation.stage ? cultivation.stage.toLowerCase() : '';
      const level = cultivation.level || 1;
      
      const totalLevel = (stageValues[stage] || 0) + (level - 1);
      
      // Расчет вторичных характеристик
      return {
        physicalAttack: Math.floor(stats.strength), // Физическая атака равна параметру силы
        physicalDefense: Math.floor(stats.strength * 0.5 + stats.health * 0.3 + totalLevel * 0.2),
        spiritualAttack: Math.floor(stats.spirit + stats.intellect * 0.5), // Духовная атака равна параметру духа + половина интеллекта
        spiritualDefense: Math.floor(stats.spirit * 0.5 + stats.intellect * 0.3 + totalLevel * 0.2),
        attackSpeed: Math.floor(stats.agility * 0.6 + totalLevel * 0.1),
        criticalChance: Math.floor(stats.agility * 0.3 + stats.intellect * 0.2),
        movementSpeed: Math.floor(stats.agility * 0.4 + totalLevel * 0.1),
        luck: Math.floor((stats.spirit + stats.intellect) * 0.2)
      };
    } catch (error) {
      console.error('Ошибка при расчете вторичных характеристик персонажа:', error);
      throw error;
    }
  }
  
  /**
   * Получение вторичных характеристик персонажа
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Вторичные характеристики персонажа
   */
  static async getSecondaryStats(userId) {
    try {
      // Получаем комбинированное состояние, которое уже включает вторичные характеристики
      const combinedState = await this.getCombinedCharacterState(userId);
      const secondaryStats = combinedState.secondary;
      
      //console.log(`[CharacterStats] Вторичные характеристики пользователя ${userId}:`, secondaryStats);
      
      return secondaryStats;
    } catch (error) {
      console.error('Ошибка при получении вторичных характеристик персонажа:', error);
      // Возвращаем значения по умолчанию в случае ошибки
      return {
        physicalAttack: 10,
        physicalDefense: 5,
        spiritualAttack: 10,
        spiritualDefense: 5,
        attackSpeed: 5,
        criticalChance: 5,
        movementSpeed: 5,
        luck: 5
      };
    }
  }

  /**
   * Применяет массив эффектов к набору базовых характеристик.
   * @param {Object} baseStats - Базовые характеристики.
   * @param {Array<Object>} activeEffects - Массив активных эффектов.
   * @returns {Object} Модифицированные характеристики.
   */
  static applyEffectsToStats(baseStats, activeEffects) {
    const modifiedState = { ...baseStats };

    for (const effect of activeEffects) {
      // Эффекты из pvp-service могут иметь другую структуру, адаптируем их
      const details = effect.effect_details_json || effect.modifies;
      if (!details || effect.effect_type === 'instant') {
        continue;
      }

      // Если это новая структура из pvp-service
      if (effect.modifies) {
          for (const targetAttribute in effect.modifies) {
              const mod = effect.modifies[targetAttribute];
              const value = parseFloat(mod.value);
              const isPercentage = mod.isPercentage;

              if (isNaN(value) || !modifiedState.hasOwnProperty(targetAttribute)) {
                  console.warn(`[Stats] Пропуск неверного модификатора в PvP эффекте:`, mod);
                  continue;
              }

              if (isPercentage) {
                  const baseValue = parseFloat(baseStats[targetAttribute]);
                  if (!isNaN(baseValue)) {
                      modifiedState[targetAttribute] += baseValue * (value / 100);
                  }
              } else {
                  modifiedState[targetAttribute] += value;
              }
          }
      } else { // Старая структура из ActivePlayerEffect
          const targetAttribute = details.target_attribute;
          const value = parseFloat(details.value);
          const valueType = details.value_type;

          if (isNaN(value) || !targetAttribute || !modifiedState.hasOwnProperty(targetAttribute)) {
              console.warn(`[Stats] Пропуск неверного эффекта из БД:`, details);
              continue;
          }
          
          if (valueType === 'percentage') {
              const baseValue = parseFloat(baseStats[targetAttribute]);
              if(!isNaN(baseValue)) {
                  modifiedState[targetAttribute] += baseValue * (value / 100);
              }
          } else { // 'absolute'
              modifiedState[targetAttribute] += value;
          }
      }
    }
    
    // Округление значений после всех модификаций
    for(const key in modifiedState) {
      if(typeof modifiedState[key] === 'number') {
          modifiedState[key] = Math.floor(modifiedState[key]);
      }
    }

    return modifiedState;
  }

  /**
   * Получение полного состояния персонажа, включая базовые, модифицированные и вторичные характеристики
   * @param {number} userId - ID пользователя
   * @param {object} [transaction] - Опциональная транзакция Sequelize
   * @returns {Promise<Object>} - Объект с состоянием персонажа
   */
  static async getCombinedCharacterState(userId, transaction) {
    try {
      const ActivePlayerEffect = getModel('ActivePlayerEffect');

      // 1. Параллельная загрузка данных
      const [baseStats, cultivationProgress, activeEffects] = await Promise.all([
        this.getCharacterStats(userId, transaction),
        require('./cultivation-service').getCultivationProgress(userId, transaction),
        ActivePlayerEffect.findAll({ where: { user_id: userId }, transaction })
      ]);

      // 2. Создание базового состояния
      const baseState = { ...baseStats, ...cultivationProgress };

      // 3. Применение эффектов с помощью новой централизованной функции
      const modifiedState = this.applyEffectsToStats(baseState, activeEffects);
      
      // 4. Расчет вторичных характеристик
      const secondaryStats = this.calculateSecondaryStats(modifiedState, modifiedState);
      // 5. Возврат результата
      return {
        base: baseState,
        modified: modifiedState,
        secondary: secondaryStats
      };

    } catch (error) {
      console.error(`Ошибка при получении комбинированного состояния персонажа для userId ${userId}:`, error);
      // Возвращаем базовые значения в случае ошибки
      const baseStats = await this.getCharacterStats(userId).catch(() => ({}));
      const cultivationProgress = await require('./cultivation-service').getCultivationProgress(userId).catch(() => ({}));
      return {
        base: { ...baseStats, ...cultivationProgress },
        modified: { ...baseStats, ...cultivationProgress },
        secondary: this.calculateSecondaryStats(baseStats, cultivationProgress)
      };
    }
  }
 
  /**
   * Получение профиля персонажа
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Профиль персонажа
   */
  static async getCharacterProfile(userId) {
    try {
      // На сервере используем базу данных
      // Инициализируем модели
      const { CharacterProfile } = require('../models');
      
      // Проверяем, есть ли запись профиля для пользователя
      let profile = await CharacterProfile.findOne({
        where: { user_id: userId }
      });
      
      // Если записи нет, возвращаем null
      if (!profile) {
        return null;
      }
      
      // Преобразуем данные для клиента из snake_case в camelCase
      // и обрабатываем JSON-поля
      const reputation = typeof profile.reputation === 'string'
        ? JSON.parse(profile.reputation)
        : (profile.reputation || {});
        
      const relationships = typeof profile.relationships === 'string'
        ? JSON.parse(profile.relationships)
        : (profile.relationships || {});
      
      return {
        name: profile.name,
        gender: profile.gender,
        region: profile.region,
        background: profile.background,
        description: profile.description,
        avatar: profile.avatar,
        level: profile.level,
        experience: profile.experience,
        currency: {
          gold: profile.gold,
          silver: profile.silver,
          copper: profile.copper,
          spiritStones: profile.spirit_stones
        },
        reputation: reputation,
        relationships: relationships
      };
    } catch (error) {
      console.error('Ошибка при получении профиля персонажа:', error);
      throw error;
    }
  }
  
  /**
   * Создание или получение профиля персонажа
   * @param {number} userId - ID пользователя
   * @param {Object} defaults - Значения по умолчанию для нового профиля
   * @returns {Promise<Object>} - Профиль персонажа
   */
  static async getOrCreateCharacterProfile(userId, defaults = {}) {
    try {
      // Инициализируем модели
      const { CharacterProfile } = require('../models');
      
      // Проверяем, есть ли запись профиля для пользователя
      let profile = await CharacterProfile.findOne({
        where: { user_id: userId }
      });
      
      // Если записи нет, создаем новую с начальными значениями
      if (!profile) {
        profile = await CharacterProfile.create({
          user_id: userId,
          name: defaults.name || 'Новый культиватор',
          gender: defaults.gender || 'male',
          region: defaults.region || 'central',
          background: defaults.background || 'commoner',
          description: defaults.description || '',
          avatar: defaults.avatar || '',
          level: defaults.level || 1,
          experience: defaults.experience || 0,
          gold: defaults.gold || defaults.currency?.gold || 0,
          silver: defaults.silver || defaults.currency?.silver || 0,
          copper: defaults.copper || defaults.currency?.copper || 0,
          spirit_stones: defaults.spiritStones || defaults.currency?.spiritStones || 0,
          reputation: defaults.reputation ? JSON.stringify(defaults.reputation) : '{}',
          relationships: defaults.relationships ? JSON.stringify(defaults.relationships) : '{}'
        });
      }
      
      // Преобразуем данные для клиента из snake_case в camelCase
      // и обрабатываем JSON-поля
      const reputation = typeof profile.reputation === 'string'
        ? JSON.parse(profile.reputation)
        : (profile.reputation || {});
        
      const relationships = typeof profile.relationships === 'string'
        ? JSON.parse(profile.relationships)
        : (profile.relationships || {});
      
      return {
        name: profile.name,
        gender: profile.gender,
        region: profile.region,
        background: profile.background,
        description: profile.description,
        avatar: profile.avatar,
        level: profile.level,
        experience: profile.experience,
        currency: {
          gold: profile.gold,
          silver: profile.silver,
          copper: profile.copper,
          spiritStones: profile.spirit_stones
        },
        reputation: reputation,
        relationships: relationships
      };
    } catch (error) {
      console.error('Ошибка при создании/получении профиля персонажа:', error);
      throw error;
    }
  }
  
  /**
   * Обновление профиля персонажа
   * @param {number} userId - ID пользователя
   * @param {Object} data - Новые данные профиля
   * @returns {Promise<Object>} - Обновленный профиль персонажа
   */
  static async updateCharacterProfile(userId, data) {
    try {
      // Инициализируем модели
      const { CharacterProfile } = require('../models');
      
      // Получаем текущий профиль персонажа
      let profile = await CharacterProfile.findOne({
        where: { user_id: userId }
      });
      
      // Если записи нет, создаем новую
      if (!profile) {
        return this.getOrCreateCharacterProfile(userId, data);
      }
      
      // Подготовка данных для обновления
      const updateData = {};
      
      // Обновляем базовые поля, если они предоставлены
      if (data.name !== undefined) updateData.name = data.name;
      if (data.gender !== undefined) updateData.gender = data.gender;
      if (data.region !== undefined) updateData.region = data.region;
      if (data.background !== undefined) updateData.background = data.background;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.avatar !== undefined) updateData.avatar = data.avatar;
      if (data.level !== undefined) updateData.level = data.level;
      if (data.experience !== undefined) updateData.experience = data.experience;
      
      // Обновляем валюту, если она предоставлена
      const currency = data.currency || {};
      if (currency.gold !== undefined) updateData.gold = currency.gold;
      if (currency.silver !== undefined) updateData.silver = currency.silver;
      if (currency.copper !== undefined) updateData.copper = currency.copper;
      if (currency.spiritStones !== undefined) updateData.spirit_stones = currency.spiritStones;
      
      // Обновляем JSON-поля, если они предоставлены
      if (data.reputation !== undefined) {
        updateData.reputation = JSON.stringify(data.reputation);
      }
      
      if (data.relationships !== undefined) {
        updateData.relationships = JSON.stringify(data.relationships);
      }
      
      // Обновляем профиль
      await profile.update(updateData);
      
      // Получаем обновленный профиль
      profile = await CharacterProfile.findOne({
        where: { user_id: userId }
      });
      
      // Преобразуем данные для клиента из snake_case в camelCase
      // и обрабатываем JSON-поля
      const reputation = typeof profile.reputation === 'string'
        ? JSON.parse(profile.reputation)
        : (profile.reputation || {});
        
      const relationships = typeof profile.relationships === 'string'
        ? JSON.parse(profile.relationships)
        : (profile.relationships || {});
      
      return {
        name: profile.name,
        gender: profile.gender,
        region: profile.region,
        background: profile.background,
        description: profile.description,
        avatar: profile.avatar,
        level: profile.level,
        experience: profile.experience,
        currency: {
          gold: profile.gold,
          silver: profile.silver,
          copper: profile.copper,
          spiritStones: profile.spirit_stones
        },
        reputation: reputation,
        relationships: relationships
      };
    } catch (error) {
      console.error('Ошибка при обновлении профиля персонажа:', error);
      throw error;
    }
  }
}

module.exports = CharacterStatsService;
