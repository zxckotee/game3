/**
 * Сервис для работы с групповыми активностями
 */
const { uuidv4 } = require('uuid');
const { database } = require('./database-connection-manager-adapter');

class GroupActivityService {
  /**
   * Получение списка всех видов групповых активностей
   */
  static async getAllActivityTypes() {
    try {
      const typesSnapshot = await database.collection('group_activity_types').get();
      return typesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Ошибка при получении видов групповых активностей:', error);
      throw error;
    }
  }
  
  /**
   * Получение групповой активности по ID
   */
  static async getActivityById(activityId) {
    try {
      const activityDoc = await database.collection('group_activities').doc(activityId).get();
      
      if (!activityDoc.exists) {
        throw new Error('Активность не найдена');
      }
      
      const activity = {
        id: activityDoc.id,
        ...activityDoc.data()
      };
      
      // Загружаем данные о типе активности
      if (activity.typeId) {
        const typeDoc = await database.collection('group_activity_types').doc(activity.typeId).get();
        if (typeDoc.exists) {
          activity.type = {
            id: typeDoc.id,
            ...typeDoc.data()
          };
        }
      }
      
      // Загружаем участников активности
      activity.participants = await this.getActivityParticipants(activityId);
      
      return activity;
    } catch (error) {
      console.error('Ошибка при получении данных активности:', error);
      throw error;
    }
  }
  
  /**
   * Получение списка активностей группы
   */
  static async getGroupActivities(groupId, options = {}) {
    try {
      let query = database.collection('group_activities')
        .where('groupId', '==', groupId);
      
      // Фильтрация по статусу, если указан
      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.where('status', 'in', options.status);
        } else {
          query = query.where('status', '==', options.status);
        }
      }
      
      // Сортировка (по умолчанию - от новых к старым)
      const sortField = options.sortField || 'createdAt';
      const sortDirection = options.sortDirection || 'desc';
      query = query.orderBy(sortField, sortDirection);
      
      // Ограничение количества, если указано
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const activitiesSnapshot = await query.get();
      const activities = [];
      
      for (const activityDoc of activitiesSnapshot.docs) {
        const activity = {
          id: activityDoc.id,
          ...activityDoc.data()
        };
        
        // Загружаем данные о типе активности, если требуется
        if (options.includeType && activity.typeId) {
          const typeDoc = await database.collection('group_activity_types').doc(activity.typeId).get();
          if (typeDoc.exists) {
            activity.type = {
              id: typeDoc.id,
              ...typeDoc.data()
            };
          }
        }
        
        // Загружаем участников, если требуется
        if (options.includeParticipants) {
          activity.participants = await this.getActivityParticipants(activity.id);
        } else {
          // Считаем количество участников для краткой информации
          const participantsSnapshot = await database.collection('group_activity_participants')
            .where('activityId', '==', activity.id)
            .get();
          
          activity.participantCount = participantsSnapshot.size;
        }
        
        activities.push(activity);
      }
      
      return activities;
    } catch (error) {
      console.error('Ошибка при получении активностей группы:', error);
      throw error;
    }
  }
  
  /**
   * Получение списка участников активности
   */
  static async getActivityParticipants(activityId) {
    try {
      const participantsSnapshot = await database.collection('group_activity_participants')
        .where('activityId', '==', activityId)
        .get();
      
      const participants = [];
      
      for (const participantDoc of participantsSnapshot.docs) {
        const participant = {
          id: participantDoc.id,
          ...participantDoc.data()
        };
        
        // Загружаем информацию о пользователе
        const userDoc = await database.collection('users').doc(participant.userId).get();
        
        if (userDoc.exists) {
          participant.user = {
            id: userDoc.id,
            name: userDoc.data().name,
            avatar: userDoc.data().avatar,
            cultivationLevel: userDoc.data().cultivation?.level || 1,
            cultivationStage: userDoc.data().cultivation?.stage || 'Начинающий'
          };
        }
        
        participants.push(participant);
      }
      
      return participants;
    } catch (error) {
      console.error('Ошибка при получении участников активности:', error);
      throw error;
    }
  }
  
  /**
   * Создание новой групповой активности
   */
  static async createActivity(groupId, activityData, creatorId) {
    try {
      // Проверяем существование группы
      const groupDoc = await database.collection('groups').doc(groupId).get();
      
      if (!groupDoc.exists) {
        throw new Error('Групка не найдена');
      }
      
      const group = groupDoc.data();
      
      // Проверяем права пользователя
      const memberSnapshot = await database.collection('group_members')
        .where('groupId', '==', groupId)
        .where('userId', '==', creatorId)
        .get();
      
      if (memberSnapshot.empty) {
        throw new Error('Вы не являетесь участником этой группы');
      }
      
      const memberRole = memberSnapshot.docs[0].data().role;
      
      // Проверяем, имеет ли пользователь права на создание активностей
      if (memberRole !== 'leader' && memberRole !== 'officer') {
        throw new Error('Только лидер или офицер группы может создавать активности');
      }
      
      // Проверяем тип активности
      let activityType = null;
      
      if (activityData.typeId) {
        const typeDoc = await database.collection('group_activity_types').doc(activityData.typeId).get();
        
        if (!typeDoc.exists) {
          throw new Error('Указанный тип активности не найден');
        }
        
        activityType = typeDoc.data();
      }
      
      // Создаем активность
      const now = new Date();
      const activityId = uuidv4();
      
      const activity = {
        id: activityId,
        groupId,
        creatorId,
        name: activityData.name,
        description: activityData.description || '',
        typeId: activityData.typeId || null,
        location: activityData.location || '',
        minParticipants: activityData.minParticipants || 2,
        maxParticipants: activityData.maxParticipants || group.maxMembers,
        difficulty: activityData.difficulty || 'normal',
        requiredLevel: activityData.requiredLevel || 1,
        startTime: activityData.startTime || null,
        endTime: activityData.endTime || null,
        duration: activityData.duration || 60,
        rewards: activityData.rewards || {
          experience: 0,
          resources: [],
          items: []
        },
        requirements: activityData.requirements || {
          minCultivationLevel: 1,
          items: []
        },
        status: 'planned',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      // Сохраняем активность в базу данных
      await database.collection('group_activities').doc(activityId).set(activity);
      
      // Добавляем создателя как участника
      const participantId = uuidv4();
      
      const participant = {
        id: participantId,
        activityId,
        userId: creatorId,
        role: 'organizer',
        status: 'confirmed',
        joinedAt: now.toISOString()
      };
      
      await database.collection('group_activity_participants').doc(participantId).set(participant);
      
      return {
        ...activity,
        participants: [participant]
      };
    } catch (error) {
      console.error('Ошибка при создании групповой активности:', error);
      throw error;
    }
  }
  
  /**
   * Обновление данных активности
   */
  static async updateActivity(activityId, updateData, userId) {
    try {
      const activityDoc = await database.collection('group_activities').doc(activityId).get();
      
      if (!activityDoc.exists) {
        throw new Error('Активность не найдена');
      }
      
      const activity = activityDoc.data();
      
      // Проверяем права пользователя
      if (activity.creatorId !== userId) {
        // Проверяем, является ли пользователь лидером группы
        const groupDoc = await database.collection('groups').doc(activity.groupId).get();
        
        if (!groupDoc.exists || groupDoc.data().leaderId !== userId) {
          throw new Error('Только создатель активности или лидер группы может обновлять данные');
        }
      }
      
      // Обновляем файл
      const now = new Date();
      const updates = {
        ...updateData,
        updatedAt: now.toISOString()
      };
      
      await database.collection('group_activities').doc(activityId).update(updates);
      
      return {
        ...activity,
        ...updates
      };
    } catch (error) {
      console.error('Ошибка при обновлении активности:', error);
      throw error;
    }
  }
  
  /**
   * Отмена активности
   */
  static async cancelActivity(activityId, userId, reason = '') {
    try {
      const activityDoc = await database.collection('group_activities').doc(activityId).get();
      
      if (!activityDoc.exists) {
        throw new Error('Активность не найдена');
      }
      
      const activity = activityDoc.data();
      
      // Проверяем права пользователя
      if (activity.creatorId !== userId) {
        throw new Error('Только создатель активности может ее отменить');
      }
      
      // Обновляем статус
      const now = new Date();
      
      await database.collection('group_activities').doc(activityId).update({
        status: 'canceled',
        cancelReason: reason,
        updatedAt: now.toISOString()
      });
      
      return {
        success: true,
        message: 'Активность успешно отменена'
      };
    } catch (error) {
      console.error('Ошибка при отмене активности:', error);
      throw error;
    }
  }
  
  /**
   * Присоединение к активности
   */
  static async joinActivity(activityId, userId) {
    try {
      const activityDoc = await database.collection('group_activities').doc(activityId).get();
      
      if (!activityDoc.exists) {
        throw new Error('Активность не найдена');
      }
      
      const activity = activityDoc.data();
      
      // Проверяем участника
      const memberSnapshot = await database.collection('group_members')
        .where('groupId', '==', activity.groupId)
        .where('userId', '==', userId)
        .get();
      
      if (memberSnapshot.empty) {
        throw new Error('Вы не являетесь участником этой группы');
      }
      
      // Добавляем участника
      const now = new Date();
      const participantId = uuidv4();
      
      const participant = {
        id: participantId,
        activityId,
        userId,
        status: 'confirmed',
        joinedAt: now.toISOString()
      };
      
      await database.collection('group_activity_participants').doc(participantId).set(participant);
      
      return {
        success: true,
        participant
      };
    } catch (error) {
      console.error('Ошибка при присоединении к активности:', error);
      throw error;
    }
  }
  
  /**
   * Покидание активности
   */
  static async leaveActivity(activityId, userId) {
    try {
      // Проверяем участника
      const participantSnapshot = await database.collection('group_activity_participants')
        .where('activityId', '==', activityId)
        .where('userId', '==', userId)
        .get();
      
      if (participantSnapshot.empty) {
        throw new Error('Вы не являетесь участником этой активности');
      }
      
      // Удаляем участника
      await participantSnapshot.docs[0].ref.delete();
      
      return {
        success: true,
        message: 'Вы успешно покинули активность'
      };
    } catch (error) {
      console.error('Ошибка при покидании активности:', error);
      throw error;
    }
  }
  
  /**
   * Начало активности
   */
  static async startActivity(activityId, userId) {
    try {
      const activityDoc = await database.collection('group_activities').doc(activityId).get();
      
      if (!activityDoc.exists) {
        throw new Error('Активность не найдена');
      }
      
      const activity = activityDoc.data();
      
      // Проверяем создателя
      if (activity.creatorId !== userId) {
        throw new Error('Только создатель активности может начать ее');
      }
      
      // Обновляем статус
      const now = new Date();
      
      await database.collection('group_activities').doc(activityId).update({
        status: 'active',
        startedAt: now.toISOString(),
        updatedAt: now.toISOString()
      });
      
      return {
        success: true,
        message: 'Активность успешно начата'
      };
    } catch (error) {
      console.error('Ошибка при начале активности:', error);
      throw error;
    }
  }
  
  /**
   * Завершение активности
   */
  static async completeActivity(activityId, userId, success = true) {
    try {
      const activityDoc = await database.collection('group_activities').doc(activityId).get();
      
      if (!activityDoc.exists) {
        throw new Error('Активность не найдена');
      }
      
      const activity = activityDoc.data();
      
      // Проверяем создателя
      if (activity.creatorId !== userId) {
        throw new Error('Только создатель активности может завершить ее');
      }
      
      // Обновляем статус
      const now = new Date();
      
      await database.collection('group_activities').doc(activityId).update({
        status: 'completed',
        completedAt: now.toISOString(),
        updatedAt: now.toISOString()
      });
      
      return {
        success: true,
        message: `Активность успешно завершена (${success ? 'успех' : 'неудача'})`
      };
    } catch (error) {
      console.error('Ошибка при завершении активности:', error);
      throw error;
    }
  }
}

module.exports = GroupActivityService;


// Экспортируем отдельные методы для совместимости
module.exports.getAllActivityTypes = GroupActivityService.getAllActivityTypes;
module.exports.getActivityById = GroupActivityService.getActivityById;
module.exports.getGroupActivities = GroupActivityService.getGroupActivities;
module.exports.getActivityParticipants = GroupActivityService.getActivityParticipants;
module.exports.createActivity = GroupActivityService.createActivity;
module.exports.updateActivity = GroupActivityService.updateActivity;
module.exports.cancelActivity = GroupActivityService.cancelActivity;
module.exports.joinActivity = GroupActivityService.joinActivity;
module.exports.leaveActivity = GroupActivityService.leaveActivity;
module.exports.startActivity = GroupActivityService.startActivity;
module.exports.completeActivity = GroupActivityService.completeActivity;