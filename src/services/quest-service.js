const QuestProgress = require('../models/quest-progress');
const Quest = require('../models/quest');
const User = require('../models/user');
const QuestObjective = require('../models/quest-objective');
const QuestReward = require('../models/quest-reward');
const QuestCategory = require('../models/quest-category');
const CharacterProfileService = require('./character-profile-service');

/**
 * Сервис для работы с заданиями
 */
class QuestService {
  /**
   * Получение всех квестов в системе
   * @returns {Promise<Array>} - Массив всех квестов
   */
  static async getAllQuests() {
    try {
      const quests = await Quest.findAll({
        include: [
          {
            model: QuestCategory,
            as: 'category',
            attributes: ['id', 'name']
          }
        ]
      });
      
      return quests.map(quest => ({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        type: quest.type,
        level: quest.level,
        category: quest.category ? quest.category.name : null,
        rewards: quest.rewards,
        objectives: quest.objectives
      }));
    } catch (error) {
      console.error('Ошибка при получении всех квестов:', error);
      throw error;
    }
  }

  /**
   * Получение всех заданий пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Объект с заданиями пользователя
   */
  static async getQuests(userId) {
    try {
      // Разбиваем сложный запрос на более простые для избежания проблем с SQL
      
      // 1. Сначала получаем только записи прогресса квестов пользователя
      const questProgressRecords = await QuestProgress.findAll({
        where: { userId },
        attributes: ['id', 'questId', 'status', 'progress', 'completedObjectives', 'startedAt', 'completedAt']
      });
      
      // Группируем задания по статусу
      const quests = {
        available: [],
        active: [],
        completed: []
      };
      
      // 2. Для каждой записи прогресса отдельно получаем связанные данные
      for (const progressRecord of questProgressRecords) {
        // Получаем данные о квесте
        const questData = await Quest.findByPk(progressRecord.questId, {
          attributes: ['id', 'title', 'category', 'difficulty', 'description', 'status', 'required_level', 'repeatable']
        });
        
        if (!questData) continue; // Пропускаем, если квест не найден
        
        // Получаем цели квеста
        const objectives = await QuestObjective.findAll({
          where: { quest_id: questData.id },
          attributes: ['id', 'text']
        });
        
        // Получаем награды квеста
        const rewards = await QuestReward.findAll({
          where: { quest_id: questData.id },
          attributes: ['id', 'type', 'name', 'amount', 'gold', 'silver', 'copper', 'icon']
        });
        
        // Получаем категорию квеста, если она есть
        let categoryName = null;
        if (questData.category) {
          const category = await QuestCategory.findByPk(questData.category, {
            attributes: ['id', 'name']
          });
          if (category) {
            categoryName = category.name;
          }
        }
        
        // Формируем объект квеста
        const quest = {
          id: questData.id,
          title: questData.title,
          description: questData.description,
          type: questData.type || 'main',
          level: questData.required_level || 1,
          category: categoryName,
          rewards: rewards.map(reward => ({
            id: reward.id,
            type: reward.type,
            name: reward.name,
            amount: reward.amount,
            gold: reward.gold,
            silver: reward.silver,
            copper: reward.copper,
            icon: reward.icon
          })),
          objectives: objectives.map(objective => {
            // Проверяем прогресс для этой цели
            const isCompleted = progressRecord.progress &&
                              typeof progressRecord.progress === 'object' &&
                              progressRecord.progress[objective.id] === true;
            
            return {
              id: objective.id,
              text: objective.text,
              completed: isCompleted
            };
          }),
          status: progressRecord.status,
          progress: progressRecord.progress,
          startedAt: progressRecord.startedAt,
          completedAt: progressRecord.completedAt
        };
        
        // Добавляем квест в соответствующую категорию
        if (progressRecord.status === 'available') {
          quests.available.push(quest);
        } else if (progressRecord.status === 'active') {
          quests.active.push(quest);
        } else if (progressRecord.status === 'completed') {
          quests.completed.push(quest);
        }
      }
      
      return quests;
    } catch (error) {
      console.error('Ошибка при получении заданий пользователя:', error);
      throw error;
    }
  }
    
  /**
   * Принятие задания
   * @param {number} userId - ID пользователя
   * @param {number} questId - ID задания
   * @returns {Promise<Object>} - Принятое задание
   */
  static async acceptQuest(userId, questId) {
    try {
      // Проверяем, существует ли задание
      const quest = await Quest.findByPk(questId, {
        include: [
          {
            model: QuestObjective,
            as: 'objectives'
          },
          {
            model: QuestReward,
            as: 'rewards'
          }
        ]
      });
      
      if (!quest) {
        throw new Error('Задание не найдено');
      }
      
      // Проверяем, не принято ли уже задание
      const existingProgress = await QuestProgress.findOne({
        where: {
          userId,
          questId
        }
      });
      
      if (existingProgress && existingProgress.status !== 'available') {
        throw new Error('Задание уже принято или выполнено');
      }
      
      // Создаем или обновляем запись о прогрессе задания
      let questProgress;
      
      if (existingProgress) {
        existingProgress.status = 'active';
        existingProgress.startedAt = new Date();
        await existingProgress.save();
        questProgress = existingProgress;
      } else {
        questProgress = await QuestProgress.create({
          userId,
          questId,
          status: 'active',
          progress: {},
          startedAt: new Date()
        });
      }
      
      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        type: quest.type,
        level: quest.level,
        rewards: quest.rewards.map(reward => ({
          id: reward.id,
          type: reward.type,
          name: reward.name,
          amount: reward.amount,
          gold: reward.gold,
          silver: reward.silver,
          copper: reward.copper,
          icon: reward.icon
        })),
        objectives: quest.objectives.map(objective => ({
          id: objective.id,
          text: objective.text,
          completed: false
        })),
        status: questProgress.status,
        progress: questProgress.progress,
        startedAt: questProgress.startedAt
      };
    } catch (error) {
      console.error('Ошибка при принятии задания:', error);
      throw error;
    }
  }
  
  /**
   * Обновление прогресса задания
   * @param {number} userId - ID пользователя
   * @param {number} questId - ID задания
   * @param {Object} progress - Прогресс задания
   * @returns {Promise<Object>} - Обновленное задание
   */
  static async updateQuestProgress(userId, questId, progress) {
    try {
      // Разбиваем сложный запрос на несколько простых
      
      // 1. Находим запись о прогрессе задания
      const questProgress = await QuestProgress.findOne({
        where: {
          userId,
          questId
        },
        attributes: ['id', 'userId', 'questId', 'status', 'progress', 'completedObjectives', 'startedAt', 'completedAt']
      });
      
      if (!questProgress) {
        throw new Error('Задание не найдено или не принято');
      }
      
      if (questProgress.status !== 'active') {
        throw new Error('Задание не активно');
      }
      
      // 2. Получаем данные о квесте
      const quest = await Quest.findByPk(questId, {
        attributes: ['id', 'title', 'description', 'type', 'required_level', 'difficulty', 'status']
      });
      
      if (!quest) {
        throw new Error('Квест не найден');
      }
      
      // 3. Получаем цели квеста
      const objectives = await QuestObjective.findAll({
        where: { quest_id: questId },
        attributes: ['id', 'text']
      });
      
      // 4. Получаем награды квеста
      const rewards = await QuestReward.findAll({
        where: { quest_id: questId },
        attributes: ['id', 'type', 'name', 'amount', 'gold', 'silver', 'copper', 'icon']
      });
      
      // Обновляем прогресс задания
      const updatedProgress = {
        ...questProgress.progress,
        ...progress
      };
      
      questProgress.progress = updatedProgress;
      await questProgress.save();
      
      // 5. Формируем результат
      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        type: quest.type,
        level: quest.required_level,
        rewards: rewards.map(reward => ({
          id: reward.id,
          type: reward.type,
          name: reward.name,
          amount: reward.amount,
          gold: reward.gold,
          silver: reward.silver,
          copper: reward.copper,
          icon: reward.icon
        })),
        objectives: objectives.map(objective => ({
          id: objective.id,
          text: objective.text,
          completed: updatedProgress[objective.id] === true
        })),
        status: questProgress.status,
        progress: updatedProgress,
        startedAt: questProgress.startedAt
      };
    } catch (error) {
      console.error('Ошибка при обновлении прогресса задания:', error);
      throw error;
    }
  }
  
  /**
   * Завершение задания
   * @param {number} userId - ID пользователя
   * @param {number} questId - ID задания
   * @returns {Promise<Object>} - Завершенное задание
   */
  static async completeQuest(userId, questId) {
    try {
      // Разбиваем сложный запрос на несколько простых
      
      // 1. Находим запись о прогрессе задания
      const questProgress = await QuestProgress.findOne({
        where: {
          userId,
          questId
        },
        attributes: ['id', 'userId', 'questId', 'status', 'progress', 'completedObjectives', 'startedAt', 'completedAt']
      });
      
      if (!questProgress) {
        throw new Error('Задание не найдено или не принято');
      }
      
      if (questProgress.status !== 'active') {
        throw new Error('Задание не активно');
      }
      
      // 2. Получаем данные о квесте
      const quest = await Quest.findByPk(questId, {
        attributes: ['id', 'title', 'description', 'type', 'required_level', 'difficulty', 'status']
      });
      
      if (!quest) {
        throw new Error('Квест не найден');
      }
      
      // 3. Получаем цели квеста
      const objectives = await QuestObjective.findAll({
        where: { quest_id: questId },
        attributes: ['id', 'text']
      });
      
      // 4. Получаем награды квеста
      const rewards = await QuestReward.findAll({
        where: { quest_id: questId },
        attributes: ['id', 'type', 'name', 'amount', 'gold', 'silver', 'copper', 'icon']
      });
      
      // Обновляем статус задания
      questProgress.status = 'completed';
      questProgress.completedAt = new Date();
      await questProgress.save();

      // 5. Обновляем отношения с NPC, если его имя есть в названии квеста
      try {
        const profile = await CharacterProfileService.getCharacterProfile(userId);
        if (profile && profile.relationships) {
          const relatedNpc = profile.relationships.find(r => quest.title.includes(r.name));
          if (relatedNpc) {
            const eventText = `Вы успешно завершили квест "${quest.title}"`;
            await CharacterProfileService.addRelationshipEvent(userId, relatedNpc.id, eventText);
            console.log(`Добавлено событие в отношения для NPC ${relatedNpc.name}`);
          }
        }
      } catch (relationshipError) {
        console.error('Не удалось обновить отношения после завершения квеста:', relationshipError);
        // Не прерываем основной процесс из-за ошибки в отношениях
      }
      
      // 6. Формируем результат
      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        type: quest.type,
        level: quest.required_level,
        rewards: rewards.map(reward => ({
          id: reward.id,
          type: reward.type,
          name: reward.name,
          amount: reward.amount,
          gold: reward.gold,
          silver: reward.silver,
          copper: reward.copper,
          icon: reward.icon
        })),
        objectives: objectives.map(objective => ({
          id: objective.id,
          text: objective.text,
          completed: questProgress.progress && questProgress.progress[objective.id] === true
        })),
        status: questProgress.status,
        progress: questProgress.progress,
        startedAt: questProgress.startedAt,
        completedAt: questProgress.completedAt
      };
    } catch (error) {
      console.error('Ошибка при завершении задания:', error);
      throw error;
    }
  }
}

module.exports = QuestService;
