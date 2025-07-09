const { Sect, SectMember } = require('../models');
const CultivationService = require('./cultivation-service');
const ResourceService = require('./resource-adapter');
const { updateRelationshipAndLoyalty } = require('../utils/sectRelationshipSyncer');
const { Sequelize } = require('sequelize');
const { initializeDatabaseConnection } = require('./database-connection-manager');
const CharacterProfileService = require('./character-profile-service');
const modelRegistry = require('../models/registry');
let sequelize;

// Асинхронная функция для получения экземпляра
async function getSequelizeInstance() {
  if (!sequelize) {
    const { db } = await initializeDatabaseConnection();
    sequelize = db;
  }
  return sequelize;
}


/**
 * Сервис для работы с сектами и их членами
 */
class SectService {
  constructor(models) {
    this.models = models;
    this.cultivationService = CultivationService; // Используем класс напрямую для статических методов
    this.resourceService = ResourceService; // Используем экземпляр напрямую
  }

  /** 
   * Получает информацию о секте по ID
   * @param {number} sectId ID секты
   * @returns {Promise<Sect>} Информация о секте
   */
  async getSectById(sectId) {
    try {
      // Получаем экземпляр sequelize
      const sequelizeDb = await getSequelizeInstance();
      
      try {
        // SQL-запрос для получения основной информации о секте
        const sects = await sequelizeDb.query(
          `SELECT * FROM sects WHERE id = :sectId LIMIT 1`,
          {
            replacements: { sectId },
            type: Sequelize.QueryTypes.SELECT
          }
        );
        
        if (!sects || sects.length === 0) {
          // Если секту не нашли, но мы в браузере, можем вернуть демо-секту
          if (typeof window !== 'undefined') {
            return this._createDemoSect(sectId);
          }
          
          throw new Error('Секта не найдена');
        }
        
        const sectData = sects[0];
        
        // Получаем членов секты
        const members = await sequelizeDb.query(
          `SELECT sm.*, u.username AS user_name
           FROM sect_memberships sm
           JOIN users u ON sm.user_id = u.id
           WHERE sm.sect_id = :sectId`,
          {
            replacements: { sectId },
            type: Sequelize.QueryTypes.SELECT
          }
        );
        
        // Получаем ID всех членов секты для запроса данных культивации
        const memberIds = members.map(m => m.user_id);
        
        // Получаем данные о культивации для всех членов, если есть члены
        let cultivationMap = {};
        if (memberIds.length > 0) {
          const cultivations = await sequelizeDb.query(
            `SELECT * FROM cultivation_progresses
             WHERE user_id IN (:memberIds)`,
            {
              replacements: { memberIds },
              type: Sequelize.QueryTypes.SELECT
            }
          );
          
          // Создаем Map для быстрого доступа к данным культивации по ID пользователя
          cultivations.forEach(c => {
            cultivationMap[c.user_id] = c;
          });
        }
        
        // Получаем бонусы секты
        const benefits = await sequelizeDb.query(
          `SELECT * FROM sect_benefits
           WHERE sect_id = :sectId`,
          {
            replacements: { sectId },
            type: Sequelize.QueryTypes.SELECT
          }
        );
        
        // Объединяем данные членства и культивации для каждого члена
        const enrichedMembers = members.map(member => {
          const cultivation = cultivationMap[member.user_id] || {};
          return {
            id: member.id,
            userId: member.user_id,
            name: member.user_name || 'Неизвестный',
            role: member.rank, // Поле rank в таблице sect_memberships
            joinedAt: member.joined_at || member.created_at,
            contribution: member.contribution || 0,
            // Данные из cultivation_progresses
            cultivationLevel: cultivation.level || 1,
            experience: cultivation.experience || 0,
            requiredExperience: cultivation.experience_to_next_level || 100,
            energy: cultivation.energy || 0,
            maxEnergy: cultivation.max_energy || 100
          };
        });
        
        // Формируем объект секты с обогащенными данными о членах
        const sect = {
          id: sectId,
          name: sectData.name,
          level: sectData.level,
          experience: sectData.experience,
          requiredExperience: sectData.required_experience,
          influence: sectData.influence || 0,
          members: enrichedMembers,
          benefits: benefits.map(b => ({
            id: b.id,
            type: b.type,
            modifier: b.modifier
          })),
          calculateRequiredExperience: function() {
            this.requiredExperience = Math.floor(100 * Math.pow(1.2, this.level - 1));
            return this.requiredExperience;
          },
          updateRank: function() {
            if (this.level >= 10) this.rank = 'Высшая';
            else if (this.level >= 5) this.rank = 'Средняя';
            else this.rank = 'Начальная';
            return this.rank;
          },
          updateBenefits: function() {
            return this.benefits;
          },
          save: async function() {
            return this;
          }
        };
        
        return sect;
      } catch (error) {
        console.warn('Ошибка поиска секты в БД, используем мок-данные:', error);
        
        // В режиме браузера возвращаем демо-секту
        if (typeof window !== 'undefined') {
          return this._createDemoSect(sectId);
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Ошибка при получении секты:', error);
      throw error;
    }
  }
  
  // Вспомогательный метод для создания демо-секты с заданным ID
  _createDemoSect(sectId) {
    // Проверяем, есть ли сохраненные данные о секте в localStorage
    let level = 1;
    let experience = 0;
    let rank = 'Начальная';
    let requiredExperience = 100;
    
    if (typeof window !== 'undefined') {
      const savedSectData = localStorage.getItem(`sect_${sectId}`);
      // Если есть сохраненные данные, используем их
      if (savedSectData) {
        try {
          const parsedData = JSON.parse(savedSectData);
          level = parsedData.level || 1;
          experience = parsedData.experience || 0;
          rank = parsedData.rank || 'Начальная';
          requiredExperience = parsedData.requiredExperience || 100;
        } catch (e) {
          console.error('Ошибка при чтении данных секты из localStorage:', e);
        }
      }
    }
    
    // Создаем демо-секту, подобную той, что у нас в getUserSect
    const sect = {
      id: sectId,
      name: 'Секта Восходящего Облака',
      rank: rank,
      level: level,
      experience: experience,
      requiredExperience: requiredExperience,
      influence: 100,
      resources: 50,
      territories: 1,
      benefits: [
        {type: 'cultivation_speed', modifier: 5},
        {type: 'resource_gathering', modifier: 3},
        {type: 'technique_discount', modifier: 2},
      ],
      members: [
        { id: 1, name: 'Мастер Ли', role: 'Глава секты', cultivationLevel: 30, level: 8, experience: 200, requiredExperience: 300 },
        { id: 2, name: 'Старейшина Чжан', role: 'Старейшина', cultivationLevel: 25, level: 6, experience: 150, requiredExperience: 250 },
        { id: 3, name: 'Ученик Ван', role: 'Внутренний ученик', cultivationLevel: 15, level: 4, experience: 80, requiredExperience: 150 },
        { id: 4, name: 'Ученица Мэй', role: 'Внутренний ученик', cultivationLevel: 12, level: 3, experience: 50, requiredExperience: 120 },
        { id: 5, name: 'Ученик Чен', role: 'Внешний ученик', cultivationLevel: 8, level: 2, experience: 30, requiredExperience: 100 }
      ],
      // Методы для мок-объекта
      calculateRequiredExperience: function() {
        this.requiredExperience = Math.floor(100 * Math.pow(1.2, this.level - 1));
        return this.requiredExperience;
      },
      updateRank: function() {
        if (this.level >= 10) this.rank = 'Высшая';
        else if (this.level >= 5) this.rank = 'Средняя';
        else this.rank = 'Начальная';
        return this.rank;
      },
      updateBenefits: function() {
        this.benefits = [
          {type: 'cultivation_speed', modifier: Math.round((0.05 + (this.level * 0.01)) * 100)},
          {type: 'resource_gathering', modifier: Math.round((0.03 + (this.level * 0.01)) * 100)},
          {type: 'technique_discount', modifier: Math.round((0.02 + (this.level * 0.005)) * 100)}
        ];
        return this.benefits;
      },
      save: async function() {
        return this;
      }
    };
    
    return sect;
  }

  /**
   * Получает информацию о секте игрока
   * @param {number} userId ID пользователя
   * @returns {Promise<Sect>} Информация о секте
   */
  async getUserSect(userId) {
    try {
      // Получаем экземпляр sequelize
      const sequelizeDb = await getSequelizeInstance();
      
      try {
        // SQL-запрос для получения членства в секте и основной информации о секте
        const sectMemberships = await sequelizeDb.query(
          `SELECT sm.*, s.*
           FROM sect_memberships sm
           JOIN sects s ON sm.sect_id = s.id
           WHERE sm.user_id = :userId
           LIMIT 1`,
          {
            replacements: { userId },
            type: Sequelize.QueryTypes.SELECT
          }
        );
        
        if (!sectMemberships || sectMemberships.length === 0) {
          // В режиме браузера, возвращаем демо-секту
          if (typeof window !== 'undefined') {
            // Проверяем, есть ли сохраненные данные о секте в localStorage
            const savedSectData = localStorage.getItem(`sect_1`); // используем фиксированный ID 1 для демо-секты
            let level = 1;
            let experience = 0;
            let rank = 'Начальная';
            let requiredExperience = 100;
            
            // Если есть сохраненные данные, используем их
            if (savedSectData) {
              try {
                const parsedData = JSON.parse(savedSectData);
                level = parsedData.level || 1;
                experience = parsedData.experience || 0;
                rank = parsedData.rank || 'Начальная';
                requiredExperience = parsedData.requiredExperience || 100;
              } catch (e) {
                console.error('Ошибка при чтении данных секты из localStorage:', e);
              }
            }
            
            // Создаем демо-секту, подобную defaultSect в SectTab.js
            const demoSect = {
              id: 1,
              name: 'Секта Восходящего Облака',
              rank: rank,
              level: level,
              experience: experience,
              requiredExperience: requiredExperience,
              influence: 100,
              resources: 50,
              territories: 1,
              benefits: [
                {type: 'cultivation_speed', modifier: 5},
                {type: 'resource_gathering', modifier: 3},
                {type: 'technique_discount', modifier: 2}
              ],
              members: [
                { id: 1, name: 'Мастер Ли', role: 'Глава секты', cultivationLevel: 30, level: 8, experience: 200, requiredExperience: 300 },
                { id: 2, name: 'Старейшина Чжан', role: 'Старейшина', cultivationLevel: 25, level: 6, experience: 150, requiredExperience: 250 },
                { id: 3, name: 'Ученик Ван', role: 'Внутренний ученик', cultivationLevel: 15, level: 4, experience: 80, requiredExperience: 150 },
                { id: 4, name: 'Ученица Мэй', role: 'Внутренний ученик', cultivationLevel: 12, level: 3, experience: 50, requiredExperience: 120 },
                { id: 5, name: 'Ученик Чен', role: 'Внешний ученик', cultivationLevel: 8, level: 2, experience: 30, requiredExperience: 100 }
              ]
            };
            
            // Добавляем методы для мок-объекта
            demoSect.calculateRequiredExperience = function() {
              this.requiredExperience = Math.floor(100 * Math.pow(1.2, this.level - 1));
              return this.requiredExperience;
            };
            
            demoSect.updateRank = function() {
              if (this.level >= 10) this.rank = 'Высшая';
              else if (this.level >= 5) this.rank = 'Средняя';
              else this.rank = 'Начальная';
              return this.rank;
            };
            
            demoSect.updateBenefits = function() {
              this.benefits = [
                {type: 'cultivation_speed', modifier: Math.round((0.05 + (this.level * 0.01)) * 100)},
                {type: 'resource_gathering', modifier: Math.round((0.03 + (this.level * 0.01)) * 100)},
                {type: 'technique_discount', modifier: Math.round((0.02 + (this.level * 0.005)) * 100)}
              ];
              return this.benefits;
            };
            
            demoSect.save = async function() {
              return this;
            };
            
            return demoSect;
          }
          
          return null; // Пользователь не состоит в секте
        }
        
        const sectMembership = sectMemberships[0];
        const sectId = sectMembership.sect_id;
        
        // Получаем всех членов этой секты
        const members = await sequelizeDb.query(
          `SELECT sm.*, u.username AS user_name
           FROM sect_memberships sm
           JOIN users u ON sm.user_id = u.id
           WHERE sm.sect_id = :sectId`,
          {
            replacements: { sectId },
            type: Sequelize.QueryTypes.SELECT
          }
        );
        
        // Получаем ID всех членов секты для запроса данных культивации
        const memberIds = members.map(m => m.user_id);
        
        // Получаем данные о культивации для всех членов
        const cultivations = await sequelizeDb.query(
          `SELECT * FROM cultivation_progresses
           WHERE user_id IN (:memberIds)`,
          {
            replacements: { memberIds },
            type: Sequelize.QueryTypes.SELECT
          }
        );
        
        // Создаем Map для быстрого доступа к данным культивации по ID пользователя
        const cultivationMap = {};
        cultivations.forEach(c => {
          cultivationMap[c.user_id] = c;
        });
        
        // Получаем бонусы секты
        const benefits = await sequelizeDb.query(
          `SELECT * FROM sect_benefits
           WHERE sect_id = :sectId`,
          {
            replacements: { sectId },
            type: Sequelize.QueryTypes.SELECT
          }
        );
        
        // Объединяем данные членства и культивации для каждого члена
        const enrichedMembers = members.map(member => {
          const cultivation = cultivationMap[member.user_id] || {};
          return {
            id: member.id,
            userId: member.user_id,
            name: member.user_name || 'Неизвестный',
            role: member.rank, // Поле rank в таблице sect_memberships
            joinedAt: member.joined_at || member.created_at,
            contribution: member.contribution || 0,
            // Данные из cultivation_progresses
            cultivationLevel: cultivation.level || 1,
            experience: cultivation.experience || 0,
            requiredExperience: cultivation.experience_to_next_level || 100,
            energy: cultivation.energy || 0,
            maxEnergy: cultivation.max_energy || 100
          };
        });
        
        // Формируем объект секты с обогащенными данными о членах
        const sect = {
          id: sectId,
          name: sectMembership.name,
          level: sectMembership.level,
          experience: sectMembership.experience,
          requiredExperience: sectMembership.required_experience,
          influence: sectMembership.influence || 0,
          members: enrichedMembers,
          benefits: benefits.map(b => ({
            id: b.id,
            type: b.type,
            modifier: b.modifier
          })),
          calculateRequiredExperience: function() {
            this.requiredExperience = Math.floor(100 * Math.pow(1.2, this.level - 1));
            return this.requiredExperience;
          },
          updateRank: function() {
            if (this.level >= 10) this.rank = 'Высшая';
            else if (this.level >= 5) this.rank = 'Средняя';
            else this.rank = 'Начальная';
            return this.rank;
          },
          updateBenefits: function() {
            return this.benefits;
          },
          save: async function() {
            return this;
          }
        };
        
        return sect;
      } catch (error) {
        console.warn('Ошибка получения данных секты из БД:', error);
        if (typeof window !== 'undefined') {
          // В случае ошибки в браузере, возвращаем демо-данные
          return this._createDemoSect();
        }
        throw error;
      }
    } catch (error) {
      console.error('Ошибка при получении секты пользователя:', error);
      throw error;
    }
  }
  
  // Вспомогательный метод для создания демо-секты
  _createDemoSect() {
    // Создаем демо-секту с тестовыми данными
    const demoSect = {
      id: 1,
      name: 'Секта Восходящего Облака',
      rank: 'Начальная',
      level: 1,
      experience: 0,
      requiredExperience: 100,
      influence: 100,
      resources: 50,
      territories: 1,
      benefits: [
        {type: 'cultivation_speed', modifier: 5},
        {type: 'resource_gathering', modifier: 3},
        {type: 'technique_discount', modifier: 2}
      ],
      members: [
        { id: 1, name: 'Мастер Ли', role: 'Глава секты', cultivationLevel: 30, level: 8, experience: 200, requiredExperience: 300 },
        { id: 2, name: 'Старейшина Чжан', role: 'Старейшина', cultivationLevel: 25, level: 6, experience: 150, requiredExperience: 250 },
        { id: 3, name: 'Ученик Ван', role: 'Внутренний ученик', cultivationLevel: 15, level: 4, experience: 80, requiredExperience: 150 },
        { id: 4, name: 'Ученица Мэй', role: 'Внутренний ученик', cultivationLevel: 12, level: 3, experience: 50, requiredExperience: 120 },
        { id: 5, name: 'Ученик Чен', role: 'Внешний ученик', cultivationLevel: 8, level: 2, experience: 30, requiredExperience: 100 }
      ],
      calculateRequiredExperience: function() {
        this.requiredExperience = Math.floor(100 * Math.pow(1.2, this.level - 1));
        return this.requiredExperience;
      },
      updateRank: function() {
        if (this.level >= 10) this.rank = 'Высшая';
        else if (this.level >= 5) this.rank = 'Средняя';
        else this.rank = 'Начальная';
        return this.rank;
      },
      updateBenefits: function() {
        this.benefits = [
          {type: 'cultivation_speed', modifier: Math.round((0.05 + (this.level * 0.01)) * 100)},
          {type: 'resource_gathering', modifier: Math.round((0.03 + (this.level * 0.01)) * 100)},
          {type: 'technique_discount', modifier: Math.round((0.02 + (this.level * 0.005)) * 100)}
        ];
        return this.benefits;
      },
      save: async function() {
        return this;
      }
    };
    return demoSect;
  }

  /**
   * Создает секту с пользователем в качестве лидера
   * @param {number} userId ID пользователя
   * @param {string} sectName Название секты
   * @returns {Promise<Sect>} Созданная секта
   */
  async createSect(userId, sectName) {
    try {
      // Проверяем, состоит ли пользователь уже в секте
      const userSect = await this.getUserSect(userId);
      if (userSect) {
        throw new Error('Пользователь уже состоит в секте');
      }
      
      // Получаем информацию о пользователе
      const user = await this.models.User.findByPk(userId);
      if (!user) {
        throw new Error('Пользователь не найден');
      }
      
      // Создаем секту
      const sect = await this.models.Sect.create({
        name: sectName,
        leaderId: userId
      });
      
      // Создаем члена секты для лидера
      await this.models.SectMember.create({
        name: user.name || 'Лидер секты',
        role: 'Глава секты',
        userId,
        sectId: sect.id,
        cultivationLevel: user.cultivation?.level || 1,
      });
      
      // Обновляем данные секты с членами
      return await this.getSectById(sect.id);
    } catch (error) {
      console.error('Ошибка при создании секты:', error);
      throw error;
    }
  }

  /**
   * Присоединяет пользователя к секте
   * @param {number} userId ID пользователя
   * @param {number} sectId ID секты
   * @returns {Promise<SectMember>} Созданный член секты
   */
  async joinSect(userId, sectId) {
    try {
      // Проверяем, состоит ли пользователь уже в секте
      const userSect = await this.getUserSect(userId);
      if (userSect) {
        throw new Error('Пользователь уже состоит в секте');
      }
      
      // Получаем информацию о пользователе
      const user = await this.models.User.findByPk(userId);
      if (!user) {
        throw new Error('Пользователь не найден');
      }
      
      // Проверяем существование секты
      const sect = await this.getSectById(sectId);
      if (!sect) {
        throw new Error('Секта не найдена');
      }
      
      // Создаем члена секты для пользователя
      const sectMember = await this.models.SectMember.create({
        name: user.name || 'Новый член секты',
        role: 'Внешний ученик',
        userId,
        sectId,
        cultivationLevel: user.cultivation?.level || 1,
      });
      
      return sectMember;
    } catch (error) {
      console.error('Ошибка при присоединении к секте:', error);
      throw error;
    }
  }

  /**
   * Вносит вклад в секту, повышая её уровень
   * @param {number} userId ID пользователя
   * @param {number} sectId ID секты
   * @param {number} energyAmount Количество энергии для вклада
   * @returns {Promise<Object>} Результат вклада
   */
  async contributeToSect(userId, sectId, energyAmount) {
    try {
      // Получаем секту
      const sect = await this.getSectById(sectId);
      if (!sect) {
        throw new Error('Секта не найдена');
      }
      
      // Проверяем, является ли пользователь членом секты
      let sectMember;
      
      try {
        sectMember = await this.models.SectMember.findOne({
          where: { 
            userId,
            sectId
          }
        });
      } catch (error) {
        console.warn('Ошибка поиска члена секты в БД при внесении вклада, используем мок-данные:', error);
      }
      
      // Если члена секты не найдено, и мы в браузере, создаем мок-члена
      if (!sectMember && typeof window !== 'undefined') {
        // Предполагаем, что пользователь является членом этой секты
        sectMember = {
          userId,
          sectId
        };
      }
      
      if (!sectMember) {
        throw new Error('Пользователь не является членом этой секты');
      }
      
      // Получаем данные культивации пользователя
      const cultivation = await CultivationService.getCultivationProgress(userId);
      
      // Проверяем, достаточно ли у пользователя энергии
      if (cultivation.energy < energyAmount) {
        throw new Error('Недостаточно энергии');
      }
      
      // Вычитаем энергию у пользователя
      cultivation.energy -= energyAmount;
      await CultivationService.updateCultivationProgress(userId, { energy: cultivation.energy });
      
      // Добавляем опыт и влияние секте
      const contributionXP = energyAmount * 5; // 1 единица энергии = 5 единиц опыта секты
      const influenceGain = Math.floor(energyAmount / 2); // 1 единица энергии = 0.5 единиц влияния
      
      sect.experience += contributionXP;
      sect.influence += influenceGain;
      
      // Проверяем возможность повышения уровня
      const oldLevel = sect.level;
      
      // Сохраняем текущий requiredExperience для первого повышения уровня (для уровней 1-2)
      const currentRequiredExperience = sect.requiredExperience;
      
      // Независимо от уровня секты используем единый подход к повышению уровня
      if (sect.level <= 2) {
        // Для уровней 1 и 2 теперь тоже сохраняем избыток опыта
        sect.level += 1;
        sect.experience -= currentRequiredExperience; // Вычитаем только необходимый опыт
        if (sect.experience < 0) sect.experience = 0; // Защита от отрицательного опыта
        sect.calculateRequiredExperience();
        sect.updateRank();
        sect.updateBenefits();
      } else {
        // Обычный процесс повышения уровня для более высоких уровней
        while (sect.experience >= sect.requiredExperience) {
          sect.level += 1;
          sect.experience -= sect.requiredExperience;
          sect.calculateRequiredExperience();
          sect.updateRank();
          sect.updateBenefits();
        }
      }
      
      await sect.save();
      
      // В режиме браузера, сохраняем обновленные данные в localStorage для сохранения прогресса
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`sect_${sectId}`, JSON.stringify({
            level: sect.level,
            experience: sect.experience,
            rank: sect.rank,
            requiredExperience: sect.requiredExperience
          }));
        } catch (e) {
          console.error('Ошибка при сохранении данных секты в localStorage:', e);
        }
      }
      
      // Возвращаем обновленную информацию о секте и результаты вклада
      return {
        leveledUp: sect.level > oldLevel,
        oldLevel,
        newLevel: sect.level,
        sectRank: sect.rank,
        sectExperience: sect.experience,
        sectRequiredExperience: sect.requiredExperience,
        sectInfluence: sect.influence,
        influenceGain,
        message: `Вклад успешно внесен! Секта получила ${contributionXP} опыта и ${influenceGain} влияния.`
      };
    } catch (error) {
      console.error('Ошибка при внесении вклада в секту:', error);
      throw error;
    }
  }

  /**
   * Тренирует члена секты, повышая его уровень
   * @param {number} userId ID тренирующего пользователя
   * @param {number} memberId ID тренируемого члена секты
   * @param {number} duration Продолжительность тренировки (влияет на затраты энергии и получаемый опыт)
   * @returns {Promise<Object>} Результат тренировки
   */
  async trainWithMember(userId, memberId, duration) {
    try {
      // Получаем тренируемого члена секты
      let member;
      
      try {
        member = await this.models.SectMember.findByPk(memberId);
      } catch (error) {
        console.warn('Ошибка поиска члена секты в БД, используем мок-данные:', error);
      }
      
      // Если члена не найдено в БД, пробуем получить из мок-данных или localStorage
      if (!member) {
        // Сначала проверяем, есть ли сохраненные данные в localStorage
        let savedMemberData = null;
        if (typeof window !== 'undefined') {
          try {
            const savedData = localStorage.getItem(`sect_member_${memberId}`);
            if (savedData) {
              savedMemberData = JSON.parse(savedData);
              console.log(`Загружены данные члена секты из localStorage:`, savedMemberData);
            }
          } catch (e) {
            console.error('Ошибка при загрузке данных члена секты из localStorage:', e);
          }
        }
        
        // Затем пробуем получить из секты
        const sect = await this.getUserSect(userId);
        if (sect && sect.members) {
          member = sect.members.find(m => m.id === memberId);
          
          // Если есть сохраненные данные в localStorage, обновляем ими найденного члена
          if (savedMemberData && member) {
            member = {
              ...member,
              level: savedMemberData.level || member.level || 1,
              experience: savedMemberData.experience || member.experience || 0,
              requiredExperience: savedMemberData.requiredExperience || member.requiredExperience || 100
            };
          }
          
          // Добавляем необходимые методы мок-объекту
          if (member) {
            member.canTrainToday = () => true;
            member.addExperience = (amount) => {
              console.log(`[DEBUG] Добавление опыта члену ${member.name}. Текущий опыт:`, member.experience, "Добавляем:", amount);
              
              // Проверяем, что experience - число, иначе устанавливаем в 0
              if (typeof member.experience !== 'number') {
                console.log(`[DEBUG] Опыт не является числом, сбрасываем в 0`);
                member.experience = 0;
              }
              
              member.experience = (member.experience || 0) + amount;
              const oldLevel = member.level || 1;
              const requiredExp = member.requiredExperience || 100;
              let leveledUp = false;
              
              console.log(`[DEBUG] После добавления: Опыт=${member.experience}, Требуется=${requiredExp}`);
              
              if (member.experience >= requiredExp) {
                member.level = (member.level || 1) + 1;
                member.experience -= requiredExp;
                member.requiredExperience = Math.floor(requiredExp * 1.2);
                leveledUp = true;
                console.log(`[DEBUG] Повышение уровня! Новый уровень=${member.level}, Остаток опыта=${member.experience}`);
              }
              
              return {
                leveledUp,
                oldLevel,
                newLevel: member.level
              };
            };
            member.updateRole = () => member.role;
            member.save = async () => {
              // Сохраняем данные в localStorage
              if (typeof window !== 'undefined') {
                try {
                  const dataToSave = {
                    id: member.id,
                    level: member.level,
                    experience: member.experience,
                    requiredExperience: member.requiredExperience,
                    loyalty: member.loyalty,
                    role: member.role
                  };
                  
                  console.log(`[DEBUG] Сохраняем данные члена секты в localStorage:`, JSON.stringify(dataToSave));
                  localStorage.setItem(`sect_member_${memberId}`, JSON.stringify(dataToSave));
                } catch (e) {
                  console.error('Ошибка при сохранении данных члена секты в localStorage:', e);
                }
              }
              return member;
            };
          }
        }
      }
      
      // Если члена все равно не найдено, выбрасываем ошибку
      if (!member) {
        throw new Error('Член секты не найден');
      }
      
      // Проверяем, можно ли тренироваться с этим членом сегодня
      if (!member.canTrainToday()) {
        throw new Error('С этим членом секты уже проводилась тренировка сегодня');
      }
      
      // Получаем данные культивации тренирующего
      const cultivation = await CultivationService.getCultivationProgress(userId);
      
      // Получаем информацию о тренирующем пользователе
      let userMember;
      
      try {
        userMember = await this.models.SectMember.findOne({
          where: { userId, sectId: member.sectId }
        });
      } catch (error) {
        console.warn('Ошибка поиска пользователя в БД, используем мок-данные:', error);
      }
      
      // Если пользователя нет в БД, считаем его членом секты в режиме мок-данных
      if (!userMember) {
        const sect = await this.getUserSect(userId);
        if (sect && sect.members) {
          userMember = sect.members.find(m => m.userId === userId);
        }
        
        // Если мы в браузере с тестовыми данными, создаем фиктивного члена секты для пользователя
        if (!userMember && typeof window !== 'undefined') {
          userMember = {
            userId,
            sectId: member.sectId
          };
        }
      }
      
      if (!userMember) {
        throw new Error('Пользователь не является членом этой секты');
      }
      
      // Проверка энергии
      const energyCost = duration * 5; // 5 единиц энергии за каждую единицу времени
      if (cultivation.energy < energyCost) {
        throw new Error('Недостаточно энергии для тренировки');
      }
      
      // Вычитаем энергию
      cultivation.energy -= energyCost;
      await CultivationService.updateCultivationProgress(userId, { energy: cultivation.energy });
      
      // Вычисляем опыт для члена секты (зависит от уровня культивации тренирующего)
      const memberXPGain = Math.floor(duration * 10 * (1 + cultivation.level / 10));
      
      // Обновляем дату последней тренировки
      member.lastTrainingDate = new Date();
      
      // Добавляем опыт члену секты и проверяем повышение уровня
      console.log(`[DEBUG] Начинаем тренировку с членом секты ${member.name}. Текущее состояние:`,
        { уровень: member.level, опыт: member.experience, требуется: member.requiredExperience });
      
      const levelUpResult = member.addExperience(memberXPGain);
      
      console.log(`[DEBUG] После тренировки:`,
        { уровень: member.level, опыт: member.experience, требуется: member.requiredExperience });
      
      // Обновляем опыт в базе данных
      if (typeof window !== 'undefined' && window.__gameContext) {
        try {
          const state = window.__gameContext.getState();
          // Обновляем значение лояльности и в секте, и в социальных отношениях
          window.__gameContext.dispatch({
            type: 'UPDATE_RELATIONSHIP_AND_LOYALTY',
            payload: {
              name: member.name,
              value: newLoyalty
            }
          });
          console.log(`✅ Обновлена лояльность и социальные отношения для "${member.name}" до уровня ${newLoyalty}`);
        } catch (error) {
          console.warn('⚠️ Не удалось обновить социальные отношения:', error);
        }
      }
      
      // Обновляем роль если необходимо
      member.updateRole();
      
      // Сохраняем изменения
      await member.save();
      
      // Игрок также получает опыт культивации от тренировки
      const userXPGain = Math.floor(duration * 5 * (1 + member.level / 20));
      const userLevelBefore = cultivation.level;
      
      // Обновляем опыт игрока
      cultivation.experience += userXPGain;
      
      // Проверяем возможность прорыва у игрока
      let userLevelUp = false;
      if (cultivation.experience >= cultivation.requiredExperience) {
        // В реальной реализации здесь должна быть проверка возможности прорыва
        // и процесс трибуляции из cultivation-service
        userLevelUp = true;
      }
      
      await CultivationService.updateCultivationProgress(userId, { 
        experience: cultivation.experience 
      });
      
      const result = {
        memberName: member.name,
        memberLevel: member.level,
        memberExperience: member.experience,
        memberRequiredExperience: member.requiredExperience,
        memberLeveledUp: levelUpResult.leveledUp,
        memberOldLevel: levelUpResult.oldLevel,
        memberNewLevel: levelUpResult.newLevel,
        memberRole: member.role,
        userGainedXP: userXPGain,
        userLevelUp,
        userLevel: cultivation.level,
        userLevelBefore,
        energySpent: energyCost,
        message: levelUpResult.leveledUp
          ? `Тренировка успешна! ${member.name} получил ${memberXPGain} опыта и повысил уровень до ${member.level}!`
          : `Тренировка успешна! ${member.name} получил ${memberXPGain} опыта и теперь имеет ${member.experience}/${member.requiredExperience} опыта.`
      };

      // Обновляем отношения с NPC
      try {
        const profile = await CharacterProfileService.getCharacterProfile(userId);
        if (profile && profile.relationships) {
          const relatedNpc = profile.relationships.find(r => r.name === member.name);
          if (relatedNpc) {
            const eventText = `Вы провели тренировку с ${member.name}.`;
            await CharacterProfileService.addRelationshipEvent(userId, relatedNpc.id, eventText);
            console.log(`Добавлено событие в отношения для NPC ${relatedNpc.name}`);
          }
        }
      } catch (relationshipError) {
        console.error('Не удалось обновить отношения после тренировки:', relationshipError);
      }

      return result;
    } catch (error) {
      console.error('Ошибка при тренировке члена секты:', error);
      throw error;
    }
  }

  /**
   * Получает преимущества, которые дает секта игроку
   * @param {number} userId ID пользователя
   * @returns {Promise<Object>} Бонусы от секты
   */
  async getSectBenefits(userId) {
    try {
      const sect = await this.getUserSect(userId);
      if (!sect) {
        return [
          {type: 'cultivation_speed', modifier: 0},
          {type: 'resource_gathering', modifier: 0},
          {type: 'technique_discount', modifier: 0}
        ];
      }
      
      // Убеждаемся, что benefits всегда массив
      if (!Array.isArray(sect.benefits)) {
        console.warn('Бонусы секты не являются массивом, конвертируем в массив');
        // Конвертируем старый формат объекта в новый формат массива, если необходимо
        return [
          {type: 'cultivation_speed', modifier: Math.round((sect.benefits.cultivationSpeedBonus || 0) * 100)},
          {type: 'resource_gathering', modifier: Math.round((sect.benefits.resourceGatheringBonus || 0) * 100)},
          {type: 'technique_discount', modifier: Math.round((sect.benefits.techniqueDiscountPercent || 0) * 100)}
        ];
      }
      
      return sect.benefits;
    } catch (error) {
      console.error('Ошибка при получении бонусов секты:', error);
      throw error;
    }
  }

  /**
   * Устанавливает роль члена секты и обновляет прогресс достижения если необходимо
   * @param {number} userId ID пользователя
   * @param {number} sectId ID секты
   * @param {string} newRole Новая роль ('Глава секты', 'Старейшина', 'Внутренний ученик', 'Начальный ученик')
   * @returns {Promise<Object>} Обновленные данные о члене секты
   */
  async setMemberRole(userId, sectId, newRole) {
    try {
      // Получаем экземпляр sequelize
      const sequelizeDb = await getSequelizeInstance();
      
      // Обновляем роль члена секты
      await sequelizeDb.query(
        `UPDATE sect_memberships
         SET rank = :newRole
         WHERE user_id = :userId AND sect_id = :sectId`,
        {
          replacements: { userId, sectId, newRole },
          type: Sequelize.QueryTypes.UPDATE
        }
      );
      

      // Возвращаем обновленные данные о члене секты
      const members = await sequelizeDb.query(
        `SELECT sm.*, u.username AS user_name
         FROM sect_memberships sm
         JOIN users u ON sm.user_id = u.id
         WHERE sm.user_id = :userId AND sm.sect_id = :sectId`,
        {
          replacements: { userId, sectId },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      return members.length > 0 ? members[0] : null;
    } catch (error) {
      console.error('Ошибка при изменении роли члена секты:', error);
      throw error;
    }
  }

  /**
   * Получает ранг пользователя в секте и связанные с ним привилегии
   * @param {number} userId ID пользователя
   * @returns {Promise<Object>} Информация о ранге и привилегиях
   */
  async getUserSectRank(userId) {
    try {
      let sectMember;
      
      try {
        // Находим пользователя в секте
        sectMember = await this.models.SectMember.findOne({
          where: { userId },
          include: [{
            model: this.models.Sect,
            as: 'sect'
          }]
        });
      } catch (error) {
        console.warn('Ошибка поиска члена секты в БД для ранга, используем мок-данные:', error);
      }
      
      // Если пользователя нет в БД или у него нет секты, и мы в режиме браузера
      if ((!sectMember || !sectMember.sect) && typeof window !== 'undefined') {
        const sect = await this.getUserSect(userId);
        
        if (sect && sect.members) {
          // Ищем члена секты, который соответствует пользователю
          // В демо-режиме предположим, что пользователь является первым членом секты
          sectMember = {
            role: 'Внутренний ученик',
            level: 5,
            sect: sect
          };
        } else {
          return {
            inSect: false,
            rank: null,
            privileges: []
          };
        }
      } else if (!sectMember || !sectMember.sect) {
        return {
          inSect: false,
          rank: null,
          privileges: []
        };
      }
      
      // Определяем ранг на основе роли
      let privileges = [];
      
      switch (sectMember.role) {
        case 'Глава секты':
          privileges = [
            'Полный контроль над сектой',
            'Доступ ко всем ресурсам секты',
            'Управление членами секты',
            'Возможность сбора налогов (20%)',
            'Доступ к особым техникам секты'
          ];
          break;
        case 'Старейшина':
          privileges = [
            'Доступ к продвинутым техникам',
            'Ежедневные ресурсы высокого качества',
            'Возможность сбора налогов (10%)',
            'Доступ к территориям секты'
          ];
          break;
        case 'Внутренний ученик':
          privileges = [
            'Доступ к средним техникам',
            'Ежедневные ресурсы среднего качества',
            'Доступ к тренировочным площадкам секты'
          ];
          break;
        case 'Внешний ученик':
          privileges = [
            'Доступ к базовым техникам',
            'Базовая защита секты'
          ];
          break;
      }
      
      return {
        inSect: true,
        sectName: sectMember.sect.name,
        sectRank: sectMember.sect.rank,
        memberName: sectMember.name,
        role: sectMember.role,
        level: sectMember.level,
        privileges
      };
    } catch (error) {
      console.error('Ошибка при получении ранга пользователя в секте:', error);
      throw error;
    }
  }
  
  /**
   * Удаляет пользователя из секты (выход из секты)
   * @param {number} userId ID пользователя
   * @returns {Promise<Object>} Результат выхода из секты
   */
  async leaveSect(userId) {
    try {
      // Проверяем, состоит ли пользователь в секте
      let sectMember;
      const sequelizeDb = await getSequelizeInstance();

      try {
        // Находим членство пользователя в секте
        sectMember = await sequelizeDb.query(
          `SELECT * FROM sect_memberships WHERE user_id = :userId LIMIT 1`,
          {
            replacements: { userId },
            type: Sequelize.QueryTypes.SELECT
          }
        );
        
        // Если результат запроса - пустой массив, пользователь не состоит в секте
        if (!sectMember || sectMember.length === 0) {
          return { success: false, error: 'Пользователь не состоит в секте' };
        }
        
        // Получаем ID секты из первой записи (должна быть только одна)
        const sectId = sectMember[0].sect_id;
        
        // Проверяем, является ли пользователь лидером секты
        const sect = await sequelizeDb.query(
          `SELECT * FROM sects WHERE id = :sectId LIMIT 1`,
          {
            replacements: { sectId },
            type: Sequelize.QueryTypes.SELECT
          }
        );
        
        if (sect && sect.length > 0 && sect[0].leader_id === userId) {
          // Если пользователь - лидер секты, можно реализовать особую логику
          // Например, передать лидерство другому участнику или распустить секту
          // Для простоты пока просто выходим из секты
          console.log('Лидер секты покидает секту');
        }
        
        // Удаляем членство пользователя в секте
        await sequelizeDb.query(
          `DELETE FROM sect_memberships WHERE user_id = :userId`,
          {
            replacements: { userId },
            type: Sequelize.QueryTypes.DELETE
          }
        );
        
        // В режиме браузера обновляем localStorage
        if (typeof window !== 'undefined') {
          try {
            // Очищаем localStorage от данных о секте пользователя
            localStorage.removeItem(`sect_${sectId}`);
          } catch (e) {
            console.error('Ошибка при удалении данных секты из localStorage:', e);
          }
        }
        
        return { success: true, message: 'Вы успешно покинули секту' };
        
      } catch (error) {
        console.warn('Ошибка работы с БД при выходе из секты:', error);
        
        // В режиме браузера можем вернуть успешный результат для демо-режима
        if (typeof window !== 'undefined') {
          // Очищаем localStorage от всех данных о секте
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sect_')) {
              localStorage.removeItem(key);
            }
          }
          return { success: true, message: 'Симуляция выхода из секты успешна' };
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Ошибка при выходе из секты:', error);
      throw error;
    }
  }
}
console.log(SectService);
// Экспорт для CommonJS
// Создаем и экспортируем экземпляр класса
// Экспортируем сам класс
module.exports = SectService;

