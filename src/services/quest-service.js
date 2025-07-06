const QuestProgress = require('../models/quest-progress');
const Quest = require('../models/quest');
const User = require('../models/user');
const QuestObjective = require('../models/quest-objective');
const QuestObjectiveProgress = require('../models/quest-objective-progress');
const QuestReward = require('../models/quest-reward');
const QuestCategory = require('../models/quest-category');
const CharacterProfileService = require('./character-profile-service');
const { questDifficulty } = require('../data/quests-adapter');
/* abc */
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
        type: quest.category,
        level: quest.level,
        category: quest.category ? quest.category.name : null,
        rewards: quest.rewards,
        objectives: quest.objectives,
        difficulty: quest.difficulty
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
        //console.log (questData);
        if (!questData) continue; // Пропускаем, если квест не найден
        
        // Получаем цели квеста
        const objectives = await QuestObjective.findAll({
          where: { quest_id: questData.id },
          attributes: ['id', 'text', 'required_progress', 'type', 'target']
        });
        
        // Получаем награды квеста
        const rewards = await QuestReward.findAll({
          where: { quest_id: questData.id },
          attributes: ['id', 'type', 'name', 'amount', 'gold', 'silver', 'copper', 'icon']
        });
        
        // Категорию квеста берем напрямую из данных квеста (ID)
        const categoryName = questData.category;
        
        // Формируем объект квеста
        const quest = {
          id: questData.id,
          title: questData.title,
          description: questData.description,
          type: questData.category || 'main',
          level: questData.dataValues.required_level || 1,
          required_level: questData.dataValues.required_level || 1, // для совместимости
          category: categoryName, // Теперь здесь будет ID, например 'main'
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
          objectives: await Promise.all(objectives.map(async objective => {
            // Получаем прогресс из новой нормализованной таблицы
            const objectiveProgress = await QuestObjectiveProgress.findOne({
              where: {
                userId: userId,
                objectiveId: objective.id
              }
            });

            // Если записи нет, используем данные из JSONB для обратной совместимости
            const isCompleted = objectiveProgress
              ? objectiveProgress.completed
              : (Array.isArray(progressRecord.completedObjectives) && progressRecord.completedObjectives.includes(objective.id));
            
            const currentProgress = objectiveProgress
              ? objectiveProgress.currentProgress
              : (progressRecord.progress ? (progressRecord.progress[objective.id] || 0) : 0);

            return {
              id: objective.id,
              text: objective.text,
              completed: isCompleted,
              progress: currentProgress,
              requiredProgress: objective.dataValues.required_progress,
              type: objective.dataValues.type,
              target: objective.dataValues.target
            };
          })),
          difficulty: questData.difficulty,
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
        //console.log(quest);
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
      // Используем сырой запрос, чтобы избежать магии Sequelize
      const [questResults] = await Quest.sequelize.query('SELECT * FROM quests WHERE id = :questId', {
        replacements: { questId },
        type: Quest.sequelize.QueryTypes.SELECT
      });

      const quest = questResults;

      if (!quest) {
        throw new Error('Задание не найдено');
      }

      // Получаем цели и награды отдельно
      const objectives = await QuestObjective.findAll({
        where: { quest_id: questId },
        attributes: ['id', 'quest_id', 'text', 'required_progress', 'type', 'target']
      });
      const rewards = await QuestReward.findAll({
        where: { quest_id: questId },
        attributes: ['id', 'quest_id', 'type', 'name', 'amount', 'gold', 'silver', 'copper', 'icon']
      });

      // Проверяем, есть ли у пользователя уже активное задание
      const activeQuest = await QuestProgress.findOne({
        where: {
          userId,
          status: 'active'
        }
      });

      if (activeQuest) {
        throw new Error('Вы не можете принять новое задание, пока у вас есть активное.');
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
        type: quest.category,
        level: quest.level,
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
          completed: false,
          progress: 0,
          requiredProgress: objective.dataValues.required_progress,
          type: objective.dataValues.type,
          target: objective.dataValues.target
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
        attributes: ['id', 'title', 'description', 'category', 'required_level', 'difficulty', 'status']
      });
      
      if (!quest) {
        throw new Error('Квест не найден');
      }
      
      // 3. Получаем цели квеста
      const objectives = await QuestObjective.findAll({
        where: { quest_id: questId },
        attributes: ['id', 'text', 'required_progress', 'type', 'target']
      });
      
      // 4. Получаем награды квеста
      const rewards = await QuestReward.findAll({
        where: { quest_id: questId },
        attributes: ['id', 'type', 'name', 'amount', 'gold', 'silver', 'copper', 'icon']
      });
      
      // Обновляем прогресс через новую систему
      for (const [objectiveId, progressValue] of Object.entries(progress)) {
        const objective = objectives.find(obj => obj.id == objectiveId);
        if (objective) {
          await this.addObjectiveProgress(userId, parseInt(objectiveId), progressValue, {
            source: 'legacy_update',
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Обновляем JSONB для обратной совместимости
      const updatedProgress = {
        ...questProgress.progress,
        ...progress
      };
      
      questProgress.progress = updatedProgress;
      await questProgress.save();
      
      // 5. Формируем результат с данными из новой таблицы
      const objectivesWithProgress = await Promise.all(objectives.map(async objective => {
        const objectiveProgress = await QuestObjectiveProgress.findOne({
          where: {
            userId: userId,
            objectiveId: objective.id
          }
        });

        const currentProgress = objectiveProgress
          ? objectiveProgress.currentProgress
          : (updatedProgress[objective.id] || 0);
        
        const isCompleted = objectiveProgress
          ? objectiveProgress.completed
          : (currentProgress >= objective.dataValues.required_progress);

        return {
          id: objective.id,
          text: objective.text,
          completed: isCompleted,
          progress: currentProgress,
          requiredProgress: objective.dataValues.required_progress,
          type: objective.dataValues.type,
          target: objective.dataValues.target
        };
      }));

      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        type: quest.category,
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
        objectives: objectivesWithProgress,
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
        attributes: ['id', 'title', 'description', 'category', 'required_level', 'difficulty', 'status']
      });
      
      if (!quest) {
        throw new Error('Квест не найден');
      }
      
      // 3. Получаем цели квеста
      const objectives = await QuestObjective.findAll({
        where: { quest_id: questId },
        attributes: ['id', 'text', 'required_progress', 'type', 'target']
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
        type: quest.category,
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
          completed: questProgress.completedObjectives && questProgress.completedObjectives.includes(objective.id),
          progress: questProgress.progress ? (questProgress.progress[objective.id] || 0) : 0,
          requiredProgress: objective.dataValues.required_progress,
          type: objective.dataValues.type,
          target: objective.dataValues.target
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

  static async addObjectiveProgress(userId, objectiveId, amount, metadata = {}) {
    try {
      // 1. Получаем информацию о цели
      const objective = await QuestObjective.findByPk(objectiveId, {
        attributes: ['id', 'questId', 'text', 'requiredProgress', 'type', 'target']
      });
      if (!objective) {
        throw new Error('Цель квеста не найдена');
      }

      const questId = objective.quest_id;

      // 2. Проверяем, что квест активен
      const questProgress = await QuestProgress.findOne({
        where: {
          userId,
          questId,
          status: 'active'
        }
      });

      if (!questProgress) {
        // Квест не активен, прогресс не начисляется
        return null;
      }

      // 3. Получаем или создаем запись прогресса цели
      const [objectiveProgress, created] = await QuestObjectiveProgress.findOrCreate({
        where: { userId, objectiveId },
        defaults: {
          currentProgress: 0,
          requiredProgress: objective.requiredProgress,
          metadata: {
            ...metadata,
            createdAt: new Date().toISOString()
          }
        }
      });

      // 4. Обновляем прогресс
      if (!objectiveProgress.completed) {
        objectiveProgress.currentProgress = Math.min(
          objectiveProgress.currentProgress + amount,
          objectiveProgress.requiredProgress
        );
        
        // Обновляем метаданные
        objectiveProgress.metadata = {
          ...objectiveProgress.metadata,
          ...metadata,
          lastUpdate: new Date().toISOString(),
          totalUpdates: (objectiveProgress.metadata.totalUpdates || 0) + 1
        };

        // Проверяем завершение
        if (objectiveProgress.currentProgress >= objectiveProgress.requiredProgress) {
          objectiveProgress.completed = true;
          objectiveProgress.completedAt = new Date();
        }

        await objectiveProgress.save();
      }


      // 5. Обновляем общий прогресс квеста (для совместимости)
      await this.updateQuestProgressFromObjectives(userId, questId);

      // 6. Проверяем завершение всего квеста
      await this.checkQuestCompletion(userId, questId);

      return objectiveProgress;

    } catch (error) {
      console.error('Ошибка при добавлении прогресса к цели квеста:', error);
      throw error;
    }
  }

  /**
   * Обновляет общий прогресс квеста на основе прогресса отдельных целей
   * Используется для обратной совместимости с существующим кодом
   */
  static async updateQuestProgressFromObjectives(userId, questId) {
    try {
      const questProgress = await QuestProgress.findOne({
        where: { userId, questId }
      });

      if (!questProgress) {
        return null;
      }

      // Получаем все цели квеста
      const objectives = await QuestObjective.findAll({
        where: { quest_id: questId }
      });

      // Получаем прогресс по всем целям
      const objectiveProgresses = await QuestObjectiveProgress.findAll({
        where: {
          userId,
          objectiveId: objectives.map(obj => obj.id)
        }
      });

      // Обновляем JSONB поля для совместимости
      const progressData = {};
      const completedObjectives = [];

      for (const objProgress of objectiveProgresses) {
        progressData[objProgress.objectiveId] = objProgress.currentProgress;
        if (objProgress.completed) {
          completedObjectives.push(objProgress.objectiveId);
        }
      }

      questProgress.progress = progressData;
      questProgress.completed_objectives = completedObjectives;
      await questProgress.save();

      return questProgress;
    } catch (error) {
      console.error('Ошибка при обновлении общего прогресса квеста:', error);
      throw error;
    }
  }

  /**
   * Получает прогресс конкретной цели квеста
   * @param {number} userId - ID пользователя
   * @param {number} objectiveId - ID цели квеста
   * @returns {Promise<Object|null>} - Прогресс цели или null
   */
  static async getObjectiveProgress(userId, objectiveId) {
    try {
      const objectiveProgress = await QuestObjectiveProgress.findOne({
        where: { userId, objectiveId },
        include: [{
          model: QuestObjective,
          as: 'objective',
          attributes: ['id', 'quest_id', 'type', 'description', 'requiredProgress', 'metadata']
        }]
      });

      return objectiveProgress;
    } catch (error) {
      console.error('Ошибка при получении прогресса цели квеста:', error);
      throw error;
    }
  }

  /**
   * Получает все прогрессы целей для конкретного квеста
   * @param {number} userId - ID пользователя
   * @param {number} questId - ID квеста
   * @returns {Promise<Array>} - Массив прогрессов целей
   */
  static async getQuestObjectivesProgress(userId, questId) {
    try {
      // Получаем все цели квеста
      const objectives = await QuestObjective.findAll({
        where: { quest_id: questId }
      });

      // Получаем прогресс для каждой цели
      const objectivesProgress = await Promise.all(
        objectives.map(async objective => {
          const progress = await QuestObjectiveProgress.findOne({
            where: {
              userId,
              objectiveId: objective.id
            }
          });

          return {
            objectiveId: objective.id,
            type: objective.type,
            description: objective.description,
            requiredProgress: objective.requiredProgress,
            currentProgress: progress ? progress.currentProgress : 0,
            completed: progress ? progress.completed : false,
            completedAt: progress ? progress.completedAt : null,
            metadata: progress ? progress.metadata : {}
          };
        })
      );

      return objectivesProgress;
    } catch (error) {
      console.error('Ошибка при получении прогресса целей квеста:', error);
      throw error;
    }
  }

  /**
   * Проверяет завершение квеста на основе прогресса целей
   */
  static async checkQuestCompletion(userId, questId) {
    try {
      const questProgress = await QuestProgress.findOne({
        where: { userId, questId, status: 'active' }
      });

      if (!questProgress) {
        return null;
      }

      // Получаем все цели квеста
      const objectives = await QuestObjective.findAll({
        where: { quest_id: questId }
      });

      // Проверяем, все ли цели завершены
      const objectiveProgresses = await QuestObjectiveProgress.findAll({
        where: {
          userId,
          objectiveId: objectives.map(obj => obj.id),
          completed: true
        }
      });

      const allCompleted = objectiveProgresses.length === objectives.length;

      if (allCompleted) {
        questProgress.status = 'completed';
        questProgress.completedAt = new Date();
        await questProgress.save();

        console.log(`Квест ${questId} завершен пользователем ${userId}`);
      }

      return questProgress;
    } catch (error) {
      console.error('Ошибка при проверке завершения квеста:', error);
      throw error;
    }
  }

  static async checkQuestEvent(userId, eventType, payload) {
    try {
      // Шаг 1: Получаем активный прогресс квестов без целей
      const activeQuestsProgress = await QuestProgress.findAll({
        where: {
          userId,
          status: 'active'
        },
        include: {
          model: Quest,
          as: 'quest',
          attributes: [
            'id', 'title', 'category', 'difficulty', 'description', 'status',
            'requiredLevel', 'repeatable'
          ]
        }
      });
      console.log(`activeQuestsProgress: ${activeQuestsProgress}`);
      for (const progress of activeQuestsProgress) {
        if (!progress.quest) continue;
        
        
        // Шаг 2: Для каждого квеста получаем его цели, отфильтрованные по типу события
        const objectives = await QuestObjective.findAll({
          where: {
            questId: progress.quest.id,
            type: eventType
          },
          attributes: ['id', 'questId', 'text', 'requiredProgress', 'type', 'target']
        });

        for (const objective of objectives) {
          const objectiveProgress = await QuestObjectiveProgress.findOne({
            where: {
              userId: userId,
              objectiveId: objective.id
            }
          });

          let shouldAddProgress = false;
          
          switch (eventType) {
            case 'GATHER_ITEM':
            case 'CRAFT_ITEM':
              if (objective.target === payload.itemId) {
                shouldAddProgress = true;
              }
              break;
            case 'DEFEAT_ENEMY':
              if (objective.target === payload.enemyId) {
                shouldAddProgress = true;
              }
              break;
            case 'DEFEAT_ANY_ENEMY':
              shouldAddProgress = true;
              break;
            case 'REACH_LEVEL':
              if (payload.level >= parseInt(objective.target)) {
                // For level achievements, we set progress to max directly
                // Ensure we don't exceed requiredProgress if objectiveProgress exists
                const currentProgress = objectiveProgress ? objectiveProgress.currentProgress : 0;
                const newProgress = Math.min(currentProgress + 1, objective.requiredProgress); // Increment by 1, but cap at requiredProgress
                await this.addObjectiveProgress(userId, objective.id, newProgress);
              }
              break;
            case 'LEARN_TECHNIQUE':
              if (objective.target === payload.techniqueId) {
                shouldAddProgress = true;
              }
              break;
            case 'PVP_WIN':
              if (objective.target === payload.mode) {
                shouldAddProgress = true;
              }
              break;
            case 'PVP_RATING':
              if (payload.rating >= parseInt(objective.target)) {
                // For rating achievements, we set progress to max directly
                // Ensure we don't exceed requiredProgress if objectiveProgress exists
                const currentProgress = objectiveProgress ? objectiveProgress.currentProgress : 0;
                const newProgress = Math.min(currentProgress + 1, objective.requiredProgress); // Increment by 1, but cap at requiredProgress
                await this.addObjectiveProgress(userId, objective.id, newProgress);
              }
              break;
            case 'MEDITATION':
              if (objective.target === payload.meditationType) {
                shouldAddProgress = true;
              }
              break;
          }
          console.log(shouldAddProgress);

          if (shouldAddProgress) {
            await this.addObjectiveProgress(userId, objective.id, payload.amount || 1);
          }
        }
      }

    } catch (error) {
      console.error(`Ошибка при проверке события квеста (${eventType}):`, error);
      // не бросаем ошибку дальше, чтобы не прерывать основной процесс (например, добавление предмета)
    }
  }
}

module.exports = QuestService;
