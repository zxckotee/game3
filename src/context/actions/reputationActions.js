/**
 * Действия для управления системой репутации
 */
import * as types from './reputationActionTypes';
import reputationService from '../../services/reputation-service';

/**
 * Загрузка данных о репутации игрока
 * @param {number} userId - ID пользователя
 * @returns {Function} - Thunk-функция
 */
export const loadReputationData = (userId) => async (dispatch) => {
  try {
    dispatch({ type: types.LOAD_REPUTATION_REQUEST });
    
    // Загрузка данных по всем городам
    const cities = [
      // Небесный Город (ID: 1)
      {
        id: 1,
        name: 'Небесный Город',
        type: 'city',
        spheres: ['general', 'combat', 'trade', 'political']
      },
      // Туманная Долина (ID: 2)
      {
        id: 2,
        name: 'Туманная Долина',
        type: 'city',
        spheres: ['general', 'alchemy', 'spiritual']
      },
      // Огненная Гора (ID: 3)
      {
        id: 3,
        name: 'Огненная Гора',
        type: 'city',
        spheres: ['general', 'combat', 'trade']
      },
      // Нефритовая Гавань (ID: 4)
      {
        id: 4,
        name: 'Нефритовая Гавань',
        type: 'city',
        spheres: ['general', 'trade', 'political']
      }
    ];
    
    // Загрузка данных по всем фракциям
    const factions = [
      // Секта Небесного Лотоса (ID: 1)
      {
        id: 1,
        name: 'Секта Небесного Лотоса',
        type: 'faction',
        spheres: ['general', 'spiritual']
      },
      // Торговая гильдия (ID: 2)
      {
        id: 2,
        name: 'Торговая гильдия',
        type: 'faction',
        spheres: ['general', 'trade']
      },
      // Императорский двор (ID: 3)
      {
        id: 3,
        name: 'Императорский двор',
        type: 'faction',
        spheres: ['general', 'political']
      },
      // Боевой союз (ID: 4)
      {
        id: 4,
        name: 'Боевой союз',
        type: 'faction',
        spheres: ['general', 'combat']
      }
    ];

    // Получаем репутацию для каждой сущности и сферы
    const reputationData = {
      cities: [],
      factions: [],
      global: null
    };
    
    // Загрузка репутации для городов
    for (const city of cities) {
      const cityData = {
        id: city.id,
        name: city.name,
        type: city.type,
        spheres: []
      };
      
      for (const sphere of city.spheres) {
        const reputation = await reputationService.getReputation(userId, 'city', city.id, sphere);
        cityData.spheres.push({
          name: sphere,
          value: reputation.value,
          level: reputation.level,
          title: reputation.title
        });
      }
      
      reputationData.cities.push(cityData);
    }
    
    // Загрузка репутации для фракций
    for (const faction of factions) {
      const factionData = {
        id: faction.id,
        name: faction.name,
        type: faction.type,
        spheres: []
      };
      
      for (const sphere of faction.spheres) {
        const reputation = await reputationService.getReputation(userId, 'faction', faction.id, sphere);
        factionData.spheres.push({
          name: sphere,
          value: reputation.value,
          level: reputation.level,
          title: reputation.title
        });
      }
      
      reputationData.factions.push(factionData);
    }
    
    // Загрузка глобальной репутации
    const globalReputation = await reputationService.getReputation(userId, 'global', null, 'general');
    reputationData.global = {
      name: 'Глобальная репутация',
      type: 'global',
      spheres: [
        {
          name: 'general',
          value: globalReputation.value,
          level: globalReputation.level,
          title: globalReputation.title
        }
      ]
    };
    
    // Загрузка доступных возможностей
    const availableFeatures = await reputationService.getAvailableFeatures(userId);
    
    dispatch({
      type: types.LOAD_REPUTATION_SUCCESS,
      payload: {
        reputationData,
        availableFeatures
      }
    });
    
    return reputationData;
  } catch (error) {
    dispatch({
      type: types.LOAD_REPUTATION_FAILURE,
      payload: { error: error.message }
    });
    throw error;
  }
};

/**
 * Изменение репутации игрока
 * @param {number} userId - ID пользователя
 * @param {string} entityType - Тип сущности (city, faction, global)
 * @param {number} entityId - ID сущности
 * @param {string} sphere - Сфера влияния
 * @param {number} amount - Изменение значения
 * @param {string} reason - Причина изменения репутации
 * @param {string} entityName - Название сущности (для уведомления)
 * @returns {Function} - Thunk-функция
 */
export const changeReputation = (userId, entityType, entityId, sphere, amount, reason, entityName) => async (dispatch) => {
  try {
    dispatch({ 
      type: types.CHANGE_REPUTATION_REQUEST,
      payload: { userId, entityType, entityId, sphere, amount }
    });
    
    // Вызов сервиса для изменения репутации
    const result = await reputationService.changeReputation(
      userId, entityType, entityId, sphere, amount, reason
    );
    
    dispatch({
      type: types.CHANGE_REPUTATION_SUCCESS,
      payload: {
        userId,
        entityType,
        entityId,
        sphere,
        reputation: result.reputation,
        relatedChanges: result.relatedChanges
      }
    });
    
    // Если изменился уровень, создаем уведомление
    if (result.levelChanged) {
      dispatch(addReputationNotification({
        entityType,
        entityId,
        entityName,
        sphere,
        oldValue: result.reputation.value - amount,
        newValue: result.reputation.value,
        oldLevel: result.reputation.level, // Здесь нужно было бы сохранить предыдущий уровень
        newLevel: result.reputation.level,
        change: amount,
        reason
      }));
    }
    
    // Если открылись новые возможности, уведомляем о них
    if (result.unlockedFeatures && result.unlockedFeatures.length > 0) {
      for (const feature of result.unlockedFeatures) {
        dispatch(addReputationNotification({
          entityType,
          entityId,
          entityName,
          sphere: feature.sphere,
          change: 0, // Нет изменения значения
          reason: `Новая возможность: ${feature.name}`,
          featureType: feature.featureType,
          featureName: feature.name,
          featureId: feature.id
        }));
      }
    }
    
    return result;
  } catch (error) {
    dispatch({
      type: types.CHANGE_REPUTATION_FAILURE,
      payload: { error: error.message }
    });
    throw error;
  }
};

/**
 * Проверка наличия новых возможностей
 * @param {number} userId - ID пользователя
 * @returns {Function} - Thunk-функция
 */
export const checkNewFeatures = (userId) => async (dispatch) => {
  try {
    dispatch({ type: types.CHECK_REPUTATION_FEATURES_REQUEST });
    
    const availableFeatures = await reputationService.getAvailableFeatures(userId);
    
    dispatch({
      type: types.CHECK_REPUTATION_FEATURES_SUCCESS,
      payload: { availableFeatures }
    });
    
    return availableFeatures;
  } catch (error) {
    dispatch({
      type: types.CHECK_REPUTATION_FEATURES_FAILURE,
      payload: { error: error.message }
    });
    throw error;
  }
};

/**
 * Добавление уведомления об изменении репутации
 * @param {Object} notification - Данные уведомления
 * @returns {Object} - Action
 */
export const addReputationNotification = (notification) => ({
  type: types.ADD_REPUTATION_NOTIFICATION,
  payload: { notification: { ...notification, id: Date.now() } }
});

/**
 * Удаление уведомления об изменении репутации
 * @param {number} id - ID уведомления
 * @returns {Object} - Action
 */
export const removeReputationNotification = (id) => ({
  type: types.REMOVE_REPUTATION_NOTIFICATION,
  payload: { id }
});

/**
 * Очистка всех уведомлений об изменении репутации
 * @returns {Object} - Action
 */
export const clearReputationNotifications = () => ({
  type: types.CLEAR_REPUTATION_NOTIFICATIONS
});
