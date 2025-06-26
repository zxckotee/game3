/**
 * Действия для работы с группами и групповыми активностями
 */
import ACTION_TYPES from './actionTypes';
import GroupService from '../../services/group-service';
import GroupActivityService from '../../services/group-activity-service';

// Базовые действия для установки состояния
export const setGroups = (groups) => ({
  type: ACTION_TYPES.SET_GROUPS,
  payload: groups
});

export const setCurrentGroup = (group) => ({
  type: ACTION_TYPES.SET_CURRENT_GROUP,
  payload: group
});

export const setGroupActivities = (activities) => ({
  type: ACTION_TYPES.SET_GROUP_ACTIVITIES,
  payload: activities
});

export const setCurrentActivity = (activity) => ({
  type: ACTION_TYPES.SET_CURRENT_ACTIVITY,
  payload: activity
});

export const setGroupActivityInstances = (activityInstances) => ({
  type: ACTION_TYPES.SET_GROUP_ACTIVITY_INSTANCES,
  payload: activityInstances
});

// Асинхронные действия для взаимодействия с API
export const fetchUserGroups = (userId) => async (dispatch) => {
  try {
    const groups = await GroupService.getUserGroups(userId);
    dispatch(setGroups(groups));
    return groups;
  } catch (error) {
    console.error('Ошибка при получении групп пользователя:', error);
    throw error;
  }
};

export const createGroup = (groupData, userId) => async (dispatch) => {
  try {
    const newGroup = await GroupService.createGroup(groupData, userId);
    dispatch({
      type: ACTION_TYPES.CREATE_GROUP,
      payload: newGroup
    });
    return newGroup;
  } catch (error) {
    console.error('Ошибка при создании группы:', error);
    throw error;
  }
};

export const updateGroup = (groupId, updateData, userId) => async (dispatch) => {
  try {
    const updatedGroup = await GroupService.updateGroup(groupId, updateData, userId);
    dispatch({
      type: ACTION_TYPES.UPDATE_GROUP,
      payload: updatedGroup
    });
    return updatedGroup;
  } catch (error) {
    console.error('Ошибка при обновлении группы:', error);
    throw error;
  }
};

export const deleteGroup = (groupId, userId) => async (dispatch) => {
  try {
    await GroupService.deleteGroup(groupId, userId);
    dispatch({
      type: ACTION_TYPES.DELETE_GROUP,
      payload: groupId
    });
    return true;
  } catch (error) {
    console.error('Ошибка при удалении группы:', error);
    throw error;
  }
};

export const joinGroup = (groupId, userId, role = 'member', specialization = null) => async (dispatch) => {
  try {
    const member = await GroupService.addMember(groupId, userId, role, specialization);
    dispatch({
      type: ACTION_TYPES.JOIN_GROUP,
      payload: { groupId, member }
    });
    
    // Обновляем текущую группу, если пользователь присоединился к ней
    const group = await GroupService.getGroupById(groupId);
    dispatch(setCurrentGroup(group));
    
    return member;
  } catch (error) {
    console.error('Ошибка при присоединении к группе:', error);
    throw error;
  }
};

export const leaveGroup = (groupId, userId) => async (dispatch) => {
  try {
    await GroupService.removeMember(groupId, userId, userId);
    dispatch({
      type: ACTION_TYPES.LEAVE_GROUP,
      payload: { groupId, userId }
    });
    
    // Если пользователь покинул текущую группу, сбрасываем её
    dispatch(setCurrentGroup(null));
    
    return true;
  } catch (error) {
    console.error('Ошибка при выходе из группы:', error);
    throw error;
  }
};

// Действия для получения групповых активностей
export const fetchGroupActivities = (filters) => async (dispatch) => {
  try {
    const activities = await GroupActivityService.getActivities(filters);
    dispatch(setGroupActivities(activities));
    return activities;
  } catch (error) {
    console.error('Ошибка при получении групповых активностей:', error);
    throw error;
  }
};

export const createActivityInstance = (groupId, activityId, difficulty, options, initiatorId) => async (dispatch) => {
  try {
    const activityInstance = await GroupActivityService.createActivityInstance(
      groupId, activityId, difficulty, options, initiatorId
    );
    dispatch({
      type: ACTION_TYPES.CREATE_ACTIVITY_INSTANCE,
      payload: activityInstance
    });
    
    // Устанавливаем созданную активность как текущую
    dispatch(setCurrentActivity(activityInstance));
    
    return activityInstance;
  } catch (error) {
    console.error('Ошибка при создании экземпляра активности:', error);
    throw error;
  }
};

export const startActivity = (instanceId, userId) => async (dispatch) => {
  try {
    const activity = await GroupActivityService.startActivity(instanceId, userId);
    dispatch({
      type: ACTION_TYPES.UPDATE_ACTIVITY_INSTANCE,
      payload: activity
    });
    return activity;
  } catch (error) {
    console.error('Ошибка при запуске активности:', error);
    throw error;
  }
};

export const updateActivityProgress = (instanceId, newStage, additionalData, userId) => async (dispatch) => {
  try {
    const activity = await GroupActivityService.updateActivityProgress(
      instanceId, newStage, additionalData, userId
    );
    dispatch({
      type: ACTION_TYPES.UPDATE_ACTIVITY_INSTANCE,
      payload: activity
    });
    return activity;
  } catch (error) {
    console.error('Ошибка при обновлении прогресса активности:', error);
    throw error;
  }
};

export const completeActivity = (instanceId, additionalData, userId) => async (dispatch) => {
  try {
    const activity = await GroupActivityService.completeActivity(instanceId, additionalData, userId);
    dispatch({
      type: ACTION_TYPES.UPDATE_ACTIVITY_INSTANCE,
      payload: activity
    });
    
    // Также добавляем награды в инвентарь и опыт пользователю
    if (activity.rewards && activity.rewards.length > 0) {
      dispatch({
        type: ACTION_TYPES.ADD_REWARDS,
        payload: activity.rewards
      });
    }
    
    return activity;
  } catch (error) {
    console.error('Ошибка при завершении активности:', error);
    throw error;
  }
};

export const failActivity = (instanceId, failureData, userId) => async (dispatch) => {
  try {
    const activity = await GroupActivityService.failActivity(instanceId, failureData, userId);
    dispatch({
      type: ACTION_TYPES.UPDATE_ACTIVITY_INSTANCE,
      payload: activity
    });
    return activity;
  } catch (error) {
    console.error('Ошибка при отметке активности как проваленной:', error);
    throw error;
  }
};

export const abandonActivity = (instanceId, reason, userId) => async (dispatch) => {
  try {
    const activity = await GroupActivityService.abandonActivity(instanceId, reason, userId);
    dispatch({
      type: ACTION_TYPES.UPDATE_ACTIVITY_INSTANCE,
      payload: activity
    });
    return activity;
  } catch (error) {
    console.error('Ошибка при отмене активности:', error);
    throw error;
  }
};

/**
 * Получение экземпляров активностей группы
 * @param {string} groupId - ID группы
 * @param {Object} filters - Дополнительные фильтры для поиска
 * @returns {Promise<Array>} - Массив экземпляров активностей
 */
export const fetchGroupActivityInstances = (groupId, filters = {}) => async (dispatch) => {
  try {
    dispatch({
      type: ACTION_TYPES.FETCH_GROUP_ACTIVITY_INSTANCES,
      payload: { groupId, filters, loading: true }
    });
    
    const instances = await GroupActivityService.getGroupActivityInstances(groupId, filters);
    
    dispatch(setGroupActivityInstances(instances));
    
    return instances;
  } catch (error) {
    console.error('Ошибка при получении экземпляров активностей группы:', error);
    throw error;
  }
};

/**
 * Добавление участника в экземпляр активности
 * @param {string} instanceId - ID экземпляра активности
 * @param {string} userId - ID пользователя
 * @param {string} role - Роль пользователя в активности
 * @returns {Promise<Object>} - Обновленный экземпляр активности
 */
export const addActivityParticipant = (instanceId, userId, role = 'participant') => async (dispatch) => {
  try {
    const instance = await GroupActivityService.addActivityParticipant(instanceId, userId, role);
    
    dispatch({
      type: ACTION_TYPES.ADD_ACTIVITY_PARTICIPANT,
      payload: { instanceId, participant: { userId, role } }
    });
    
    return instance;
  } catch (error) {
    console.error('Ошибка при добавлении участника в активность:', error);
    throw error;
  }
};

/**
 * Удаление участника из экземпляра активности
 * @param {string} instanceId - ID экземпляра активности
 * @param {string} userId - ID пользователя
 * @param {string} removedById - ID пользователя, который удаляет
 * @returns {Promise<Object>} - Обновленный экземпляр активности
 */
export const removeActivityParticipant = (instanceId, userId, removedById) => async (dispatch) => {
  try {
    const instance = await GroupActivityService.removeActivityParticipant(instanceId, userId, removedById);
    
    dispatch({
      type: ACTION_TYPES.REMOVE_ACTIVITY_PARTICIPANT,
      payload: { instanceId, userId }
    });
    
    return instance;
  } catch (error) {
    console.error('Ошибка при удалении участника из активности:', error);
    throw error;
  }
};

export const claimReward = (rewardId, userId) => async (dispatch) => {
  try {
    const reward = await GroupActivityService.claimReward(rewardId, userId);
    
    // В зависимости от типа награды, добавляем соответствующие ресурсы пользователю
    // Реализация этой логики требует взаимодействия с другими редьюсерами
    switch (reward.rewardType) {
      case 'experience':
        dispatch({
          type: ACTION_TYPES.UPDATE_CULTIVATION,
          payload: { 
            experience: reward.quantity,
            incrementType: 'add'
          }
        });
        break;
      case 'resource':
        dispatch({
          type: ACTION_TYPES.ADD_ITEM,
          payload: {
            itemType: 'resource',
            itemId: reward.rewardId,
            quantity: reward.quantity,
            quality: reward.quality
          }
        });
        break;
      case 'item':
        dispatch({
          type: ACTION_TYPES.ADD_ITEM,
          payload: {
            itemType: 'equipment',
            itemId: reward.rewardId,
            quantity: reward.quantity,
            quality: reward.quality
          }
        });
        break;
      case 'reputation':
        // Обработка наград репутации
        const [faction, sphere] = reward.rewardId.split(':');
        dispatch({
          type: ACTION_TYPES.UPDATE_RELATIONSHIP,
          payload: {
            faction,
            sphere: sphere || 'general',
            value: reward.quantity,
            incrementType: 'add'
          }
        });
        break;
      default:
        console.warn(`Неизвестный тип награды: ${reward.rewardType}`);
    }
    
    return reward;
  } catch (error) {
    console.error('Ошибка при получении награды:', error);
    throw error;
  }
};

/**
 * Получение приглашений пользователя в группы
 * @param {string} userId - ID пользователя
 * @param {string|Array<string>} status - Статус приглашений (pending, accepted, declined)
 * @returns {Promise<Array>} - Массив приглашений
 */
export const fetchUserInvitations = (userId, status = 'pending') => async (dispatch) => {
  try {
    dispatch({
      type: ACTION_TYPES.FETCH_USER_INVITATIONS,
      payload: { userId, status }
    });
    
    const invitations = await GroupService.getUserInvitations(userId, status);
    
    dispatch({
      type: ACTION_TYPES.SET_USER_INVITATIONS,
      payload: invitations
    });
    
    return invitations;
  } catch (error) {
    console.error('Ошибка при получении приглашений пользователя:', error);
    
    dispatch({
      type: ACTION_TYPES.SET_ERROR,
      payload: `Не удалось загрузить приглашения: ${error.message}`
    });
    
    throw error;
  }
};

/**
 * Ответ на приглашение в группу
 * @param {string} invitationId - ID приглашения
 * @param {boolean} accept - true для принятия, false для отклонения
 * @param {string} userId - ID пользователя
 * @returns {Promise<Object>} - Результат ответа на приглашение
 */
export const respondToInvitation = (invitationId, accept, userId) => async (dispatch) => {
  try {
    const response = await GroupService.respondToInvitation(
      invitationId,
      accept ? 'accept' : 'decline',
      userId
    );
    
    dispatch({
      type: ACTION_TYPES.RESPOND_TO_INVITATION,
      payload: { invitationId, userId, accepted: accept }
    });
    
    // Если приглашение принято, обновляем список групп пользователя
    if (accept) {
      await dispatch(fetchUserGroups(userId));
    }
    
    return response;
  } catch (error) {
    console.error('Ошибка при ответе на приглашение:', error);
    
    dispatch({
      type: ACTION_TYPES.SET_ERROR,
      payload: `Не удалось обработать приглашение: ${error.message}`
    });
    
    throw error;
  }
};
