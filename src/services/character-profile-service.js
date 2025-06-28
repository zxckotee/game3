const CharacterProfile = require('../models/character-profile');
const { getInitializedUserModel } = require('../models/user');

// Проверяем, находимся ли мы в браузере
const isBrowser = typeof window !== 'undefined';

// Храним данные о профилях персонажей в памяти для браузера
let browserProfileData = {};

/**
 * Сервис для работы с профилем персонажа
 */
class CharacterProfileService {
  /**
   * Получение профиля персонажа
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Профиль персонажа
   */
  static async getCharacterProfile(userId) {
    try {
      if (isBrowser) {
        // В браузере используем объект в памяти
        const profile = browserProfileData[userId];
        
        // Если записи нет, возвращаем null (персонаж не создан)
        if (!profile) {
          return null;
        }
        
        // Возвращаем данные из памяти
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
            spiritStones: profile.spiritStones
          },
          reputation: profile.reputation,
          relationships: profile.relationships
        };
      } else {
        // На сервере используем базу данных
        // Проверяем, есть ли запись о профиле для пользователя
        let profile = await CharacterProfile.findOne({
          where: { user_id: userId }
        });
        
        // Если записи нет, возвращаем null (персонаж не создан)
        if (!profile) {
          return null;
        }
        
        // Преобразуем данные для клиента
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
            spiritStones: profile.spiritStones
          },
          reputation: profile.reputation,
          relationships: profile.relationships
        };
      }
    } catch (error) {
      console.error('Ошибка при получении профиля персонажа:', error);
      throw error;
    }
  }
  
  /**
   * Создание или обновление профиля персонажа
   * @param {number} userId - ID пользователя
   * @param {Object} data - Данные профиля персонажа
   * @returns {Promise<Object>} - Обновленный профиль персонажа
   */
  static async updateCharacterProfile(userId, data, isInitializing = false) {
    try {
     if (isBrowser) {
       // В браузере используем объект в памяти
       const profile = browserProfileData[userId];
       
       // Если записи нет, создаем новую
       if (!profile) {
         // Проверяем обязательные поля, но пропускаем проверку если это инициализация
         if (!data.name && !isInitializing) {
           throw new Error('Имя персонажа обязательно');
         }
          
          browserProfileData[userId] = {
            userId,
            name: data.name,
            gender: data.gender || 'male',
            region: data.region || 'central',
            background: data.background || 'commoner',
            description: data.description || '',
            avatar: data.avatar || '',
            level: data.level || 1,
            experience: data.experience || 0,
            gold: data.currency?.gold || 0,
            silver: data.currency?.silver || 0,
            copper: data.currency?.copper || 0,
            spiritStones: data.currency?.spiritStones || 0,
            reputation: data.reputation || {},
            relationships: data.relationships || {}
          };
        } else {
          // Обновляем существующий профиль
          if (data.name !== undefined) browserProfileData[userId].name = data.name;
          if (data.gender !== undefined) browserProfileData[userId].gender = data.gender;
          if (data.region !== undefined) browserProfileData[userId].region = data.region;
          if (data.background !== undefined) browserProfileData[userId].background = data.background;
          if (data.description !== undefined) browserProfileData[userId].description = data.description;
          if (data.avatar !== undefined) browserProfileData[userId].avatar = data.avatar;
          if (data.level !== undefined) browserProfileData[userId].level = data.level;
          if (data.experience !== undefined) browserProfileData[userId].experience = data.experience;
          
          // Обновляем валюту
          if (data.currency) {
            if (data.currency.gold !== undefined) browserProfileData[userId].gold = data.currency.gold;
            if (data.currency.silver !== undefined) browserProfileData[userId].silver = data.currency.silver;
            if (data.currency.copper !== undefined) browserProfileData[userId].copper = data.currency.copper;
            if (data.currency.spiritStones !== undefined) browserProfileData[userId].spiritStones = data.currency.spiritStones;
          }
          
          // Обновляем репутацию и отношения
          if (data.reputation !== undefined) browserProfileData[userId].reputation = data.reputation;
          if (data.relationships !== undefined) browserProfileData[userId].relationships = data.relationships;
        }
        
        // Возвращаем обновленные данные
        const updatedProfile = browserProfileData[userId];
        
        return {
          name: updatedProfile.name,
          gender: updatedProfile.gender,
          region: updatedProfile.region,
          background: updatedProfile.background,
          description: updatedProfile.description,
          avatar: updatedProfile.avatar,
          level: updatedProfile.level,
          experience: updatedProfile.experience,
          currency: {
            gold: updatedProfile.gold,
            silver: updatedProfile.silver,
            copper: updatedProfile.copper,
            spiritStones: updatedProfile.spiritStones
          },
          reputation: updatedProfile.reputation,
          relationships: updatedProfile.relationships
        };
      } else {
        // На сервере используем базу данных
        // Получаем текущий профиль персонажа
        let profile = await CharacterProfile.findOne({
          where: { user_id: userId }
        });
        
        // Если записи нет, создаем новую
        if (!profile) {
          // Проверяем обязательные поля, но пропускаем проверку если это инициализация
          if (!data.name && !isInitializing) {
            throw new Error('Имя персонажа обязательно');
          }
          
          profile = await CharacterProfile.create({
            user_id: userId,
            name: data.name,
            gender: data.gender || 'male',
            region: data.region || 'central',
            background: data.background || 'commoner',
            description: data.description || '',
            avatar: data.avatar || '',
            level: data.level || 1,
            experience: data.experience || 0,
            gold: data.currency?.gold || 0,
            silver: data.currency?.silver || 0,
            copper: data.currency?.copper || 0,
            spiritStones: data.currency?.spiritStones || 0,
            reputation: data.reputation || {},
            relationships: data.relationships || {}
          });
        } else {
          // Обновляем существующий профиль
          const updateData = {};
          
          if (data.name !== undefined) updateData.name = data.name;
          if (data.gender !== undefined) updateData.gender = data.gender;
          if (data.region !== undefined) updateData.region = data.region;
          if (data.background !== undefined) updateData.background = data.background;
          if (data.description !== undefined) updateData.description = data.description;
          if (data.avatar !== undefined) updateData.avatar = data.avatar;
          if (data.level !== undefined) updateData.level = data.level;
          if (data.experience !== undefined) updateData.experience = data.experience;
          
          // Обновляем валюту
          if (data.currency) {
            if (data.currency.gold !== undefined) updateData.gold = data.currency.gold;
            if (data.currency.silver !== undefined) updateData.silver = data.currency.silver;
            if (data.currency.copper !== undefined) updateData.copper = data.currency.copper;
            if (data.currency.spiritStones !== undefined) updateData.spiritStones = data.currency.spiritStones;
          }
          
          // Обновляем репутацию и отношения
          if (data.reputation !== undefined) updateData.reputation = data.reputation;
          if (data.relationships !== undefined) updateData.relationships = data.relationships;
          
          await profile.update(updateData);
        }
        
        // Получаем обновленный профиль
        profile = await CharacterProfile.findOne({
          where: { user_id: userId }
        });
        
        // Преобразуем данные для клиента
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
            spiritStones: profile.spiritStones,
          },
          reputation: profile.reputation,
          relationships: profile.relationships
        };
      }
    } catch (error) {
      console.error('Ошибка при обновлении профиля персонажа:', error);
      throw error;
    }
  }
  
  /**
   * Проверка, создан ли персонаж
   * @param {number} userId - ID пользователя
   * @returns {Promise<boolean>} - Флаг, создан ли персонаж
   */
  static async isCharacterCreated(userId) {
    try {
      if (isBrowser) {
        // В браузере используем объект в памяти
        return !!browserProfileData[userId];
      } else {
        // На сервере используем базу данных
        // Проверяем, есть ли запись о профиле для пользователя
        const profile = await CharacterProfile.findOne({
          where: { user_id: userId }
        });
        
        return !!profile;
      }
    } catch (error) {
      console.error('Ошибка при проверке создания персонажа:', error);
      throw error;
    }
  }
  
  /**
   * Обновление валюты персонажа
   * @param {number} userId - ID пользователя
   * @param {Object} currency - Данные о валюте
   * @returns {Promise<Object>} - Обновленная валюта
   */
  static async updateCurrency(userId, currency, options = {}) {
    const { transaction } = options;
    try {
      if (isBrowser) {
        // В браузере используем объект в памяти
        const profile = browserProfileData[userId];
        
        if (!profile) {
          throw new Error('Профиль персонажа не найден');
        }
        
        // Обновляем валюту - ДОБАВЛЯЕМ к существующему значению вместо замены
        if (currency.gold !== undefined) profile.gold = (profile.gold || 0) + currency.gold;
        if (currency.silver !== undefined) profile.silver = (profile.silver || 0) + currency.silver;
        if (currency.copper !== undefined) profile.copper = (profile.copper || 0) + currency.copper;
        if (currency.spirit_stones !== undefined) profile.spiritStones = (profile.spirit_stones || 0) + currency.spirit_stones;

        
        // Возвращаем обновленную валюту
        return {
          gold: profile.gold,
          silver: profile.silver,
          copper: profile.copper,
          spiritStones: profile.spiritStones
        };
      } else {
        // На сервере используем базу данных
        // Получаем текущий профиль персонажа
        let profile = await CharacterProfile.findOne({
          where: { user_id: userId },
          transaction
        });
        
        if (!profile) {
          throw new Error('Профиль персонажа не найден');
        }
        
        // Обновляем валюту - ДОБАВЛЯЕМ к существующему значению вместо замены
        const { Sequelize } = require('sequelize');
        const updateData = {};
        
        // Получаем текущие значения для сложения
        if (currency.gold !== undefined && currency.gold !== 0) {
          updateData.gold = Sequelize.literal(`gold + ${parseInt(currency.gold)}`);
        }
        if (currency.silver !== undefined && currency.silver !== 0) {
          updateData.silver = Sequelize.literal(`silver + ${parseInt(currency.silver)}`);
        }
        if (currency.copper !== undefined && currency.copper !== 0) {
          updateData.copper = Sequelize.literal(`copper + ${parseInt(currency.copper)}`);
        }
        if (currency.spiritStones !== undefined && currency.spiritStones !== 0) {
          updateData.spiritStones = Sequelize.literal(`spirit_stones + ${parseInt(currency.spiritStones)}`);
        }
        console.log(currency);
        if (Object.keys(updateData).length > 0) {
          await profile.update(updateData, { transaction });
        }
        
        // Получаем обновленный профиль
        profile = await CharacterProfile.findOne({
          where: { user_id: userId },
          transaction
        });
        
        // Возвращаем обновленную валюту
        return {
          gold: profile.gold,
          silver: profile.silver,
          copper: profile.copper,
          spiritStones: profile.spirit_stones
        };
      }
    } catch (error) {
      console.error('Ошибка при обновлении валюты персонажа:', error);
      throw error;
    }
  }
  
  /**
   * Обновление отношений с NPC
   * @param {number} userId - ID пользователя
   * @param {Object} relationships - Данные об отношениях
   * @returns {Promise<Object>} - Обновленные отношения
   */
  static async updateRelationships(userId, relationships) {
    try {
      if (isBrowser) {
        // В браузере используем объект в памяти
        const profile = browserProfileData[userId];
        
        if (!profile) {
          throw new Error('Профиль персонажа не найден');
        }
        
        // Обновляем отношения
        profile.relationships = relationships;
        
        // Возвращаем обновленные отношения
        return profile.relationships;
      } else {
        // На сервере используем базу данных
        // Получаем текущий профиль персонажа
        let profile = await CharacterProfile.findOne({
          where: { user_id: userId }
        });
        
        if (!profile) {
          throw new Error('Профиль персонажа не найден');
        }
        
        // Обновляем отношения
        await profile.update({
          relationships
        });
        
        // Получаем обновленный профиль
        profile = await CharacterProfile.findOne({
          where: { user_id: userId }
        });
        
        // Возвращаем обновленные отношения
        return profile.relationships;
      }
    } catch (error) {
      console.error('Ошибка при обновлении отношений персонажа:', error);
      throw error;
    }
  }

  /**
   * Создание начального профиля персонажа при регистрации
   * @param {number} userId - ID пользователя
   * @param {string} username - Имя пользователя, используется как имя персонажа по умолчанию
   * @param {Object} transaction - Объект транзакции Sequelize
   * @returns {Promise<Object>} - Созданный профиль персонажа
   */
  static async createInitialProfile(userId, username, transaction) {
    try {
      if (isBrowser) {
        // Этот метод не должен вызываться на клиенте
        throw new Error('createInitialProfile can only be called on the server.');
      }

      const profile = await CharacterProfile.create({
        userId: userId,
        name: username, // Используем username как имя персонажа по умолчанию
        gender: 'male',
        region: 'central',
        background: 'commoner',
        description: '',
        avatar: '',
        level: 1,
        experience: 0,
        gold: 0,
        silver: 0,
        copper: 0,
        spirit_stones: 0,
        reputation: {},
        relationships: {}
      }, { transaction });

      return profile;
    } catch (error) {
      console.error('Ошибка при создании начального профиля персонажа:', error);
      throw error;
    }
  }
}

module.exports = CharacterProfileService;


// Экспортируем отдельные методы для совместимости
module.exports.getCharacterProfile = CharacterProfileService.getCharacterProfile;
module.exports.updateCharacterProfile = CharacterProfileService.updateCharacterProfile;
module.exports.isCharacterCreated = CharacterProfileService.isCharacterCreated;
module.exports.updateCurrency = CharacterProfileService.updateCurrency;
module.exports.updateRelationships = CharacterProfileService.updateRelationships;
module.exports.createInitialProfile = CharacterProfileService.createInitialProfile;