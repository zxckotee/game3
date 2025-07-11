const { Sequelize, Op } = require('sequelize');
const modelRegistry = require('../models/registry');
/**
 * Сервис для работы с эффектами на серверной стороне
 */
class EffectsService {
  /**
   * Получает все эффекты пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Объект с эффектами, сгруппированными по источнику
   */
  static async getAllEffects(userId) {
    try {
      await modelRegistry.initializeRegistry();
      const User = modelRegistry.getModel('User');
      const Effect = modelRegistry.getModel('Effect');

      // Проверяем существование пользователя
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error(`Пользователь с ID ${userId} не найден`);
      }

      // Получаем все эффекты пользователя
      const effects = await Effect.findAll({
        where: { user_id: userId },
        order: [['source_type', 'ASC'], ['type', 'ASC']]
      });

      // Удаляем истекшие эффекты
      await this.removeExpiredEffects(userId);

      // Группируем эффекты по типу источника
      const groupedEffects = {
        technique: [],
        weather: [],
        sect: [],
        equipment: [],
        pet: [],
        status: []
      };

      effects.forEach(effect => {
        if (groupedEffects[effect.source_type]) {
          groupedEffects[effect.source_type].push(this.formatEffect(effect));
        }
      });

      return groupedEffects;
    } catch (error) {
      console.error('Ошибка при получении эффектов:', error);
      throw error;
    }
  }

  /**
   * Добавляет эффект
   * @param {number} userId - ID пользователя
   * @param {Object} effectData - Данные эффекта
   * @returns {Promise<Object>} - Добавленный эффект
   */
  static async addEffect(userId, effectData) {
    try {
      await modelRegistry.initializeRegistry();
      const User = modelRegistry.getModel('User');
      const Effect = modelRegistry.getModel('Effect');

      // Проверяем существование пользователя
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error(`Пользователь с ID ${userId} не найден`);
      }

      // Проверка обязательных полей
      if (!effectData.type || !effectData.sourceType) {
        throw new Error('Не указаны обязательные поля (type, sourceType)');
      }

      // Расчет времени истечения, если указана длительность
      let expiresAt = null;
      if (effectData.duration && effectData.duration > 0) {
        expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + effectData.duration);
      }

      // Создаем эффект
      const effect = await Effect.create({
        user_id: userId,
        source_type: effectData.sourceType,
        source_id: effectData.sourceId || null,
        type: effectData.type,
        name: effectData.name || effectData.type,
        value: effectData.value || effectData.modifier || 0,
        duration: effectData.duration || -1,
        expires_at: expiresAt,
        icon: effectData.icon || null
      });

      return this.formatEffect(effect);
    } catch (error) {
      console.error('Ошибка при добавлении эффекта:', error);
      throw error;
    }
  }

  /**
   * Удаляет эффект по ID
   * @param {number} userId - ID пользователя
   * @param {number} effectId - ID эффекта
   * @returns {Promise<boolean>} - Результат удаления
   */
  static async removeEffect(userId, effectId) {
    try {
      await modelRegistry.initializeRegistry();
      const Effect = modelRegistry.getModel('Effect');

      const result = await Effect.destroy({
        where: {
          id: effectId,
          user_id: userId
        }
      });

      return result > 0;
    } catch (error) {
      console.error('Ошибка при удалении эффекта:', error);
      throw error;
    }
  }

  /**
   * Удаляет все эффекты определенного типа источника
   * @param {number} userId - ID пользователя
   * @param {string} sourceType - Тип источника эффектов
   * @returns {Promise<number>} - Количество удаленных эффектов
   */
  static async removeEffectsBySourceType(userId, sourceType) {
    try {
      await modelRegistry.initializeRegistry();
      const Effect = modelRegistry.getModel('Effect');

      const result = await Effect.destroy({
        where: {
          user_id: userId,
          source_type: sourceType
        }
      });

      return result;
    } catch (error) {
      console.error(`Ошибка при удалении эффектов типа ${sourceType}:`, error);
      throw error;
    }
  }

  /**
   * Удаляет истекшие эффекты
   * @param {number} userId - ID пользователя (опционально)
   * @returns {Promise<number>} - Количество удаленных эффектов
   */
  static async removeExpiredEffects(userId = null) {
    try {
      await modelRegistry.initializeRegistry();
      const Effect = modelRegistry.getModel('Effect');

      const whereClause = {
        expires_at: {
          [Op.not]: null,
          [Op.lt]: new Date()
        }
      };

      if (userId) {
        whereClause.user_id = userId;
      }

      const result = await Effect.destroy({
        where: whereClause
      });

      return result;
    } catch (error) {
      console.error('Ошибка при удалении истекших эффектов:', error);
      throw error;
    }
  }

  /**
   * Обновляет эффекты погоды
   * @param {number} userId - ID пользователя
   * @param {Object} weatherData - Данные о погоде
   * @returns {Promise<Object>} - Обновленные эффекты пользователя
   */
  static async updateWeatherEffects(userId, weatherData) {
    try {
      // Удаляем все старые эффекты погоды
      await this.removeEffectsBySourceType(userId, 'weather');

      const { weather, dayPeriod } = weatherData;

      // Определяем новые эффекты в зависимости от погоды и времени суток
      const newWeatherEffects = this.calculateWeatherEffects(weather, dayPeriod);

      // Добавляем новые эффекты
      for (const effectData of newWeatherEffects) {
        await this.addEffect(userId, {
          ...effectData,
          sourceType: 'weather'
        });
      }

      // Возвращаем все эффекты пользователя
      return this.getAllEffects(userId);
    } catch (error) {
      console.error('Ошибка при обновлении эффектов погоды:', error);
      throw error;
    }
  }

  /**
   * Форматирует эффект для API
   * @param {Object} effect - Объект эффекта из БД
   * @returns {Object} - Форматированный объект эффекта
   */
  static formatEffect(effect) {
    return {
      id: effect.id,
      type: effect.type,
      name: effect.name,
      value: effect.value,
      modifier: effect.value, // Для совместимости
      duration: effect.duration,
      expiresAt: effect.expires_at,
      icon: effect.icon,
      source: effect.source_type,
      sourceId: effect.source_id
    };
  }

  /**
   * Рассчитывает эффекты погоды
   * @param {string} weather - Тип погоды
   * @param {string} dayPeriod - Период дня
   * @returns {Array} - Массив эффектов
   */
  static calculateWeatherEffects(weather, dayPeriod) {
    const effects = [];
    
    // Эффекты в зависимости от погоды
    switch (weather) {
      case 'clear':
        effects.push({
          type: 'cultivation_speed',
          name: 'Ясная погода',
          value: 5,
          icon: '☀️'
        });
        break;
      case 'rain':
        effects.push({
          type: 'water_cultivation',
          name: 'Дождливая погода',
          value: 10,
          icon: '🌧️'
        });
        effects.push({
          type: 'fire_cultivation',
          name: 'Дождливая погода',
          value: -5,
          icon: '🌧️'
        });
        break;
      case 'storm':
        effects.push({
          type: 'spirit_energy',
          name: 'Грозовая погода',
          value: 15,
          icon: '⚡'
        });
        effects.push({
          type: 'movement_speed',
          name: 'Грозовая погода',
          value: -10,
          icon: '⚡'
        });
        break;
      case 'fog':
        effects.push({
          type: 'stealth',
          name: 'Туманная погода',
          value: 10,
          icon: '🌫️'
        });
        effects.push({
          type: 'perception',
          name: 'Туманная погода',
          value: -15,
          icon: '🌫️'
        });
        break;
      case 'snow':
        effects.push({
          type: 'water_cultivation',
          name: 'Снежная погода',
          value: 5,
          icon: '❄️'
        });
        effects.push({
          type: 'movement_speed',
          name: 'Снежная погода',
          value: -20,
          icon: '❄️'
        });
        break;
    }
    
    // Эффекты в зависимости от времени суток
    switch (dayPeriod) {
      case 'dawn':
        effects.push({
          type: 'spirit_energy',
          name: 'Рассвет',
          value: 10,
          icon: '🌅'
        });
        break;
      case 'morning':
        effects.push({
          type: 'energy_regen',
          name: 'Утро',
          value: 5,
          icon: '🌄'
        });
        break;
      case 'noon':
        effects.push({
          type: 'cultivation_speed',
          name: 'Полдень',
          value: 8,
          icon: '☀️'
        });
        break;
      case 'evening':
        effects.push({
          type: 'insight_chance',
          name: 'Вечер',
          value: 5,
          icon: '🌆'
        });
        break;
      case 'night':
        effects.push({
          type: 'stealth',
          name: 'Ночь',
          value: 10,
          icon: '🌙'
        });
        effects.push({
          type: 'perception',
          name: 'Ночь',
          value: -10,
          icon: '🌙'
        });
        break;
      case 'deep_night':
        effects.push({
          type: 'dark_cultivation',
          name: 'Глубокая ночь',
          value: 15,
          icon: '🌑'
        });
        effects.push({
          type: 'light_cultivation',
          name: 'Глубокая ночь',
          value: -10,
          icon: '🌑'
        });
        break;
    }
    
    return effects;
  }

  /**
   * Получает все активные временные эффекты игрока для отображения на UI.
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array<Object>>} - Массив отформатированных эффектов
   */
  static async getActivePlayerEffects(userId) {
    try {
      await modelRegistry.initializeRegistry();
      const ActivePlayerEffect = modelRegistry.getModel('ActivePlayerEffect');

      const now = new Date();
      const effects = await ActivePlayerEffect.findAll({
        where: {
          user_id: userId,
          // Выбираем только временные эффекты, которые еще не истекли
          duration_seconds: { [Op.ne]: -1 },
          expires_at: { [Op.gt]: now }
        }
      });

      return effects.map(effect => {
        const details = effect.effect_details_json || {};
        const expiresAt = new Date(effect.expires_at);
        const remainingSeconds = Math.max(0, Math.round((expiresAt - now) / 1000));

        return {
          id: effect.id,
          name: details.original_description || effect.name,
          value: details.value,
          value_type: details.value_type,
          remaining_seconds: remainingSeconds,
          effect_type: effect.effect_type,
        };
      });

    } catch (error) {
      console.error('Ошибка при получении активных эффектов игрока:', error);
      throw error;
    }
  }
}

module.exports = EffectsService;