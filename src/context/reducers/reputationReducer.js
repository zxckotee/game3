/**
 * Редуктор для системы репутации
 */
import * as types from '../actions/reputationActionTypes';

// Начальное состояние
const initialState = {
  // Данные о репутации
  data: {
    cities: [],
    factions: [],
    global: null
  },
  // Доступные возможности
  features: [],
  // Уведомления
  notifications: [],
  // Статус загрузки
  loading: false,
  // Флаг изменения репутации
  changing: false,
  // Ошибка
  error: null
};

/**
 * Редуктор для обработки действий, связанных с репутацией
 * @param {Object} state - Текущее состояние
 * @param {Object} action - Действие
 * @returns {Object} - Новое состояние
 */
const reputationReducer = (state = initialState, action) => {
  switch (action.type) {
    // Загрузка репутации
    case types.LOAD_REPUTATION_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case types.LOAD_REPUTATION_SUCCESS:
      return {
        ...state,
        data: action.payload.reputationData,
        features: action.payload.availableFeatures,
        loading: false,
        error: null
      };
    
    case types.LOAD_REPUTATION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload.error
      };
    
    // Изменение репутации
    case types.CHANGE_REPUTATION_REQUEST:
      return {
        ...state,
        changing: true,
        error: null
      };
    
    case types.CHANGE_REPUTATION_SUCCESS: {
      const { userId, entityType, entityId, sphere, reputation, relatedChanges } = action.payload;
      
      // Обновляем данные о репутации в зависимости от типа сущности
      let updatedData = { ...state.data };
      
      if (entityType === 'city') {
        updatedData.cities = state.data.cities.map(city => {
          if (city.id === entityId) {
            return {
              ...city,
              spheres: city.spheres.map(s => {
                if (s.name === sphere) {
                  return {
                    ...s,
                    value: reputation.value,
                    level: reputation.level,
                    title: reputation.title
                  };
                }
                return s;
              })
            };
          }
          return city;
        });
      } else if (entityType === 'faction') {
        updatedData.factions = state.data.factions.map(faction => {
          if (faction.id === entityId) {
            return {
              ...faction,
              spheres: faction.spheres.map(s => {
                if (s.name === sphere) {
                  return {
                    ...s,
                    value: reputation.value,
                    level: reputation.level,
                    title: reputation.title
                  };
                }
                return s;
              })
            };
          }
          return faction;
        });
      } else if (entityType === 'global') {
        if (updatedData.global) {
          updatedData.global = {
            ...updatedData.global,
            spheres: updatedData.global.spheres.map(s => {
              if (s.name === sphere) {
                return {
                  ...s,
                  value: reputation.value,
                  level: reputation.level,
                  title: reputation.title
                };
              }
              return s;
            })
          };
        }
      }
      
      // Обновляем данные о связанных репутациях, если есть
      if (relatedChanges && relatedChanges.length > 0) {
        for (const change of relatedChanges) {
          if (change.entityType === 'city') {
            updatedData.cities = updatedData.cities.map(city => {
              if (city.id === change.entityId) {
                return {
                  ...city,
                  spheres: city.spheres.map(s => {
                    if (s.name === change.sphere) {
                      return {
                        ...s,
                        // Обновляем значение на основе изменения
                        value: s.value + change.amount,
                        // Уровень обновится при следующей загрузке
                      };
                    }
                    return s;
                  })
                };
              }
              return city;
            });
          } else if (change.entityType === 'faction') {
            updatedData.factions = updatedData.factions.map(faction => {
              if (faction.id === change.entityId) {
                return {
                  ...faction,
                  spheres: faction.spheres.map(s => {
                    if (s.name === change.sphere) {
                      return {
                        ...s,
                        value: s.value + change.amount,
                      };
                    }
                    return s;
                  })
                };
              }
              return faction;
            });
          } else if (change.entityType === 'global' && updatedData.global) {
            updatedData.global = {
              ...updatedData.global,
              spheres: updatedData.global.spheres.map(s => {
                if (s.name === change.sphere) {
                  return {
                    ...s,
                    value: s.value + change.amount,
                  };
                }
                return s;
              })
            };
          }
        }
      }
      
      return {
        ...state,
        data: updatedData,
        changing: false,
        error: null
      };
    }
    
    case types.CHANGE_REPUTATION_FAILURE:
      return {
        ...state,
        changing: false,
        error: action.payload.error
      };
    
    // Проверка возможностей
    case types.CHECK_REPUTATION_FEATURES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case types.CHECK_REPUTATION_FEATURES_SUCCESS:
      return {
        ...state,
        features: action.payload.availableFeatures,
        loading: false,
        error: null
      };
    
    case types.CHECK_REPUTATION_FEATURES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload.error
      };
    
    // Уведомления
    case types.ADD_REPUTATION_NOTIFICATION:
      return {
        ...state,
        notifications: [
          ...state.notifications,
          action.payload.notification
        ]
      };
    
    case types.REMOVE_REPUTATION_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload.id
        )
      };
    
    case types.CLEAR_REPUTATION_NOTIFICATIONS:
      return {
        ...state,
        notifications: []
      };
    
    default:
      return state;
  }
};

export default reputationReducer;
