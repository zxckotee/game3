/**
 * Клиентская версия GroupActivityService без серверных зависимостей
 * Используется в браузере вместо оригинального group-activity-service.js
 */

// Типы групповых активностей
const ACTIVITY_TYPES = {
  CULTIVATION: 'cultivation',
  RESOURCE_GATHERING: 'resource_gathering',
  COMBAT: 'combat',
  EXPLORATION: 'exploration',
  DUNGEON: 'dungeon',
  RITUAL: 'ritual',
  COMPETITION: 'competition'
};

// Статусы активностей
const ACTIVITY_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELED: 'canceled'
};

// Уровни сложности
const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard',
  EXPERT: 'expert',
  MASTER: 'master'
};

// Моковые данные о групповых активностях
const mockActivities = [
  {
    id: 1,
    groupId: 1,
    name: 'Совместная охота на духовных зверей',
    description: 'Охота на духовных зверей в лесу Туманных Сосен.',
    type: ACTIVITY_TYPES.COMBAT,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Запланировано на завтра
    endTime: new Date(Date.now() + 26 * 60 * 60 * 1000), // Продолжительность 2 часа
    status: ACTIVITY_STATUS.SCHEDULED,
    minParticipants: 3,
    maxParticipants: 8,
    location: 'forest_of_misty_pines',
    difficulty: DIFFICULTY_LEVELS.NORMAL,
    rewards: {
      exp: 200,
      resources: [
        { id: 'spiritual_beast_core', amount: [1, 3] },
        { id: 'beast_hide', amount: [5, 10] }
      ]
    },
    createdBy: 101, // ID пользователя, создавшего активность
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: 2,
    groupId: 2,
    name: 'Сбор редких трав',
    description: 'Сбор редких трав на Горе Девяти Сокровищ.',
    type: ACTIVITY_TYPES.RESOURCE_GATHERING,
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Через 3 дня
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // Продолжительность 4 часа
    status: ACTIVITY_STATUS.SCHEDULED,
    minParticipants: 2,
    maxParticipants: 6,
    location: 'nine_treasures_mountain',
    difficulty: DIFFICULTY_LEVELS.EASY,
    rewards: {
      exp: 150,
      resources: [
        { id: 'spirit_herb', amount: [10, 20] },
        { id: 'celestial_flower', amount: [1, 3] }
      ]
    },
    createdBy: 102,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: 3,
    groupId: 1,
    name: 'Исследование древних руин',
    description: 'Исследование руин древней секты в Долине Забытых Ветров.',
    type: ACTIVITY_TYPES.EXPLORATION,
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Началось 2 дня назад
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Продолжительность 3 дня
    status: ACTIVITY_STATUS.IN_PROGRESS,
    minParticipants: 4,
    maxParticipants: 10,
    location: 'forgotten_winds_valley',
    difficulty: DIFFICULTY_LEVELS.HARD,
    rewards: {
      exp: 500,
      resources: [
        { id: 'ancient_scripture', amount: [1, 2] },
        { id: 'spirit_stone', amount: [10, 20] }
      ]
    },
    createdBy: 101,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }
];

// Моковые данные об участниках активностей
const mockActivityParticipants = [
  {
    id: 1,
    activityId: 1,
    userId: 101,
    status: 'confirmed',
    joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: 2,
    activityId: 1,
    userId: 104,
    status: 'confirmed',
    joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: 3,
    activityId: 1,
    userId: 105,
    status: 'pending',
    joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: 4,
    activityId: 3,
    userId: 101,
    status: 'confirmed',
    joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: 5,
    activityId: 3,
    userId: 104,
    status: 'confirmed',
    joinedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  },
  {
    id: 6,
    activityId: 3,
    userId: 105,
    status: 'confirmed',
    joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  }
];

class GroupActivityServiceAPI {
  /**
   * Получает все типы активностей
   * @returns {Promise<Object>} Объект с типами активностей
   */
  static async getActivityTypes() {
    return Promise.resolve(ACTIVITY_TYPES);
  }

  /**
   * Получает все статусы активностей
   * @returns {Promise<Object>} Объект со статусами активностей
   */
  static async getActivityStatuses() {
    return Promise.resolve(ACTIVITY_STATUS);
  }

  /**
   * Получает все уровни сложности
   * @returns {Promise<Object>} Объект с уровнями сложности
   */
  static async getDifficultyLevels() {
    return Promise.resolve(DIFFICULTY_LEVELS);
  }

  /**
   * Получает все активности группы
   * @param {number} groupId ID группы
   * @returns {Promise<Array>} Массив активностей группы
   */
  static async getGroupActivities(groupId) {
    const activities = mockActivities.filter(a => a.groupId === groupId);
    return Promise.resolve([...activities]);
  }

  /**
   * Получает активность по ID
   * @param {number} activityId ID активности
   * @returns {Promise<Object|null>} Объект активности или null, если не найдена
   */
  static async getActivityById(activityId) {
    const activity = mockActivities.find(a => a.id === activityId);
    return Promise.resolve(activity ? {...activity} : null);
  }

  /**
   * Создает новую групповую активность
   * @param {number} userId ID пользователя (должен быть членом группы)
   * @param {number} groupId ID группы
   * @param {Object} activityData Данные об активности
   * @returns {Promise<Object>} Созданная активность
   */
  static async createActivity(userId, groupId, activityData) {
    // Генерируем новый ID активности
    const newActivityId = Math.max(...mockActivities.map(a => a.id), 0) + 1;
    
    const newActivity = {
      id: newActivityId,
      groupId,
      name: activityData.name,
      description: activityData.description || '',
      type: activityData.type || ACTIVITY_TYPES.CULTIVATION,
      startTime: activityData.startTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
      endTime: activityData.endTime || new Date(Date.now() + 26 * 60 * 60 * 1000),
      status: ACTIVITY_STATUS.SCHEDULED,
      minParticipants: activityData.minParticipants || 2,
      maxParticipants: activityData.maxParticipants || 10,
      location: activityData.location || 'default_location',
      difficulty: activityData.difficulty || DIFFICULTY_LEVELS.NORMAL,
      rewards: activityData.rewards || {
        exp: 100,
        resources: []
      },
      createdBy: userId,
      createdAt: new Date()
    };
    
    // Создаем запись об участии организатора
    const participantId = Math.max(...mockActivityParticipants.map(p => p.id), 0) + 1;
    const creatorParticipant = {
      id: participantId,
      activityId: newActivityId,
      userId,
      status: 'confirmed',
      joinedAt: new Date()
    };
    
    return Promise.resolve({
      success: true,
      message: `Активность "${newActivity.name}" успешно создана`,
      activity: newActivity,
      participant: creatorParticipant
    });
  }

  /**
   * Обновляет информацию об активности
   * @param {number} userId ID пользователя (должен быть создателем активности)
   * @param {number} activityId ID активности
   * @param {Object} updateData Данные для обновления
   * @returns {Promise<Object>} Обновленная активность
   */
  static async updateActivity(userId, activityId, updateData) {
    const activity = await this.getActivityById(activityId);
    
    if (!activity) {
      return Promise.reject(new Error('Активность не найдена'));
    }
    
    // Проверяем, является ли пользователь создателем активности
    if (activity.createdBy !== userId) {
      return Promise.reject(new Error('У вас нет прав для обновления этой активности'));
    }
    
    // Проверяем статус активности
    if (activity.status !== ACTIVITY_STATUS.SCHEDULED) {
      return Promise.reject(new Error('Можно обновлять только запланированные активности'));
    }
    
    // Обновляем данные активности
    const updatedActivity = {
      ...activity,
      name: updateData.name !== undefined ? updateData.name : activity.name,
      description: updateData.description !== undefined ? updateData.description : activity.description,
      startTime: updateData.startTime !== undefined ? updateData.startTime : activity.startTime,
      endTime: updateData.endTime !== undefined ? updateData.endTime : activity.endTime,
      minParticipants: updateData.minParticipants !== undefined ? updateData.minParticipants : activity.minParticipants,
      maxParticipants: updateData.maxParticipants !== undefined ? updateData.maxParticipants : activity.maxParticipants,
      location: updateData.location !== undefined ? updateData.location : activity.location,
      difficulty: updateData.difficulty !== undefined ? updateData.difficulty : activity.difficulty,
      rewards: updateData.rewards !== undefined ? updateData.rewards : activity.rewards
    };
    
    return Promise.resolve({
      success: true,
      message: `Активность "${updatedActivity.name}" обновлена`,
      activity: updatedActivity
    });
  }

  /**
   * Отменяет активность
   * @param {number} userId ID пользователя (должен быть создателем активности)
   * @param {number} activityId ID активности
   * @returns {Promise<Object>} Результат операции
   */
  static async cancelActivity(userId, activityId) {
    const activity = await this.getActivityById(activityId);
    
    if (!activity) {
      return Promise.reject(new Error('Активность не найдена'));
    }
    
    // Проверяем, является ли пользователь создателем активности
    if (activity.createdBy !== userId) {
      return Promise.reject(new Error('У вас нет прав для отмены этой активности'));
    }
    
    // Проверяем статус активности
    if (activity.status !== ACTIVITY_STATUS.SCHEDULED && activity.status !== ACTIVITY_STATUS.IN_PROGRESS) {
      return Promise.reject(new Error('Можно отменить только запланированные или текущие активности'));
    }
    
    // Обновляем статус активности
    const updatedActivity = {
      ...activity,
      status: ACTIVITY_STATUS.CANCELED
    };
    
    return Promise.resolve({
      success: true,
      message: `Активность "${updatedActivity.name}" отменена`,
      activity: updatedActivity
    });
  }

  /**
   * Получает список участников активности
   * @param {number} activityId ID активности
   * @returns {Promise<Array>} Массив участников активности
   */
  static async getActivityParticipants(activityId) {
    const participants = mockActivityParticipants.filter(p => p.activityId === activityId);
    return Promise.resolve([...participants]);
  }

  /**
   * Присоединяется к активности
   * @param {number} userId ID пользователя
   * @param {number} activityId ID активности
   * @returns {Promise<Object>} Результат присоединения
   */
  static async joinActivity(userId, activityId) {
    const activity = await this.getActivityById(activityId);
    
    if (!activity) {
      return Promise.reject(new Error('Активность не найдена'));
    }
    
    // Проверяем статус активности
    if (activity.status !== ACTIVITY_STATUS.SCHEDULED) {
      return Promise.reject(new Error('Можно присоединиться только к запланированным активностям'));
    }
    
    // Проверяем, не участвует ли пользователь уже в этой активности
    const existingParticipant = mockActivityParticipants.find(
      p => p.activityId === activityId && p.userId === userId
    );
    
    if (existingParticipant) {
      return Promise.reject(new Error('Вы уже являетесь участником этой активности'));
    }
    
    // Проверяем количество участников
    const participants = await this.getActivityParticipants(activityId);
    if (participants.length >= activity.maxParticipants) {
      return Promise.reject(new Error('Достигнуто максимальное количество участников'));
    }
    
    // Создаем запись об участии
    const participantId = Math.max(...mockActivityParticipants.map(p => p.id), 0) + 1;
    const newParticipant = {
      id: participantId,
      activityId,
      userId,
      status: 'confirmed',
      joinedAt: new Date()
    };
    
    return Promise.resolve({
      success: true,
      message: `Вы успешно присоединились к активности "${activity.name}"`,
      participant: newParticipant
    });
  }

  /**
   * Покидает активность
   * @param {number} userId ID пользователя
   * @param {number} activityId ID активности
   * @returns {Promise<Object>} Результат выхода из активности
   */
  static async leaveActivity(userId, activityId) {
    const activity = await this.getActivityById(activityId);
    
    if (!activity) {
      return Promise.reject(new Error('Активность не найдена'));
    }
    
    // Проверяем статус активности
    if (activity.status !== ACTIVITY_STATUS.SCHEDULED) {
      return Promise.reject(new Error('Можно покинуть только запланированные активности'));
    }
    
    // Проверяем, участвует ли пользователь в этой активности
    const participantIndex = mockActivityParticipants.findIndex(
      p => p.activityId === activityId && p.userId === userId
    );
    
    if (participantIndex === -1) {
      return Promise.reject(new Error('Вы не являетесь участником этой активности'));
    }
    
    // Проверяем, не является ли пользователь создателем активности
    if (activity.createdBy === userId) {
      return Promise.reject(new Error('Создатель не может покинуть активность. Вы можете отменить активность или передать организацию другому участнику.'));
    }
    
    // Удаляем запись об участии
    const participant = mockActivityParticipants[participantIndex];
    
    return Promise.resolve({
      success: true,
      message: `Вы успешно покинули активность "${activity.name}"`,
      participant
    });
  }

  /**
   * Начинает активность
   * @param {number} userId ID пользователя (должен быть создателем активности)
   * @param {number} activityId ID активности
   * @returns {Promise<Object>} Результат начала активности
   */
  static async startActivity(userId, activityId) {
    const activity = await this.getActivityById(activityId);
    
    if (!activity) {
      return Promise.reject(new Error('Активность не найдена'));
    }
    
    // Проверяем, является ли пользователь создателем активности
    if (activity.createdBy !== userId) {
      return Promise.reject(new Error('У вас нет прав для начала этой активности'));
    }
    
    // Проверяем статус активности
    if (activity.status !== ACTIVITY_STATUS.SCHEDULED) {
      return Promise.reject(new Error('Можно начать только запланированную активность'));
    }
    
    // Проверяем количество участников
    const participants = await this.getActivityParticipants(activityId);
    const confirmedParticipants = participants.filter(p => p.status === 'confirmed');
    
    if (confirmedParticipants.length < activity.minParticipants) {
      return Promise.reject(new Error(`Недостаточно участников (минимум: ${activity.minParticipants})`));
    }
    
    // Обновляем статус активности
    const updatedActivity = {
      ...activity,
      status: ACTIVITY_STATUS.IN_PROGRESS,
      startTime: new Date() // Обновляем время начала на текущее
    };
    
    return Promise.resolve({
      success: true,
      message: `Активность "${updatedActivity.name}" начата`,
      activity: updatedActivity
    });
  }

  /**
   * Завершает активность
   * @param {number} userId ID пользователя (должен быть создателем активности)
   * @param {number} activityId ID активности
   * @param {Object} result Результаты активности
   * @returns {Promise<Object>} Результат завершения активности
   */
  static async completeActivity(userId, activityId, result) {
    const activity = await this.getActivityById(activityId);
    
    if (!activity) {
      return Promise.reject(new Error('Активность не найдена'));
    }
    
    // Проверяем, является ли пользователь создателем активности
    if (activity.createdBy !== userId) {
      return Promise.reject(new Error('У вас нет прав для завершения этой активности'));
    }
    
    // Проверяем статус активности
    if (activity.status !== ACTIVITY_STATUS.IN_PROGRESS) {
      return Promise.reject(new Error('Можно завершить только активность в процессе'));
    }
    
    // Определяем статус завершения в зависимости от результата
    const completionStatus = result.success ? ACTIVITY_STATUS.COMPLETED : ACTIVITY_STATUS.FAILED;
    
    // Обновляем статус активности
    const updatedActivity = {
      ...activity,
      status: completionStatus,
      endTime: new Date(), // Обновляем время окончания на текущее
      result: result.details || {}
    };
    
    // Генерируем награды для участников
    const participants = await this.getActivityParticipants(activityId);
    const confirmedParticipants = participants.filter(p => p.status === 'confirmed');
    
    const rewards = [];
    
    // Если активность успешна, распределяем награды
    if (result.success) {
      for (const participant of confirmedParticipants) {
        const participantReward = {
          userId: participant.userId,
          exp: activity.rewards.exp,
          resources: []
        };
        
        // Распределяем ресурсы
        if (activity.rewards.resources) {
          for (const resource of activity.rewards.resources) {
            const amount = Math.floor(Math.random() * (resource.amount[1] - resource.amount[0] + 1)) + resource.amount[0];
            participantReward.resources.push({
              id: resource.id,
              amount
            });
          }
        }
        
        rewards.push(participantReward);
      }
    }
    
    return Promise.resolve({
      success: true,
      message: result.success 
        ? `Активность "${updatedActivity.name}" успешно завершена` 
        : `Активность "${updatedActivity.name}" провалена`,
      activity: updatedActivity,
      rewards
    });
  }
}

// Экспортируем класс через CommonJS
module.exports = GroupActivityServiceAPI;

// Экспортируем константы для совместимости
const ACTIVITY_TYPES_EXPORT = ACTIVITY_TYPES;
const ACTIVITY_STATUS_EXPORT = ACTIVITY_STATUS;
const DIFFICULTY_LEVELS_EXPORT = DIFFICULTY_LEVELS;

// Экспортируем отдельные методы для совместимости
module.exports.getActivityTypes = GroupActivityServiceAPI.getActivityTypes;
module.exports.getActivityStatuses = GroupActivityServiceAPI.getActivityStatuses;
module.exports.getDifficultyLevels = GroupActivityServiceAPI.getDifficultyLevels;
module.exports.getGroupActivities = GroupActivityServiceAPI.getGroupActivities;
module.exports.getActivityById = GroupActivityServiceAPI.getActivityById;
module.exports.createActivity = GroupActivityServiceAPI.createActivity;
module.exports.updateActivity = GroupActivityServiceAPI.updateActivity;
module.exports.cancelActivity = GroupActivityServiceAPI.cancelActivity;
module.exports.getActivityParticipants = GroupActivityServiceAPI.getActivityParticipants;
module.exports.joinActivity = GroupActivityServiceAPI.joinActivity;
module.exports.leaveActivity = GroupActivityServiceAPI.leaveActivity;
module.exports.startActivity = GroupActivityServiceAPI.startActivity;
module.exports.completeActivity = GroupActivityServiceAPI.completeActivity;