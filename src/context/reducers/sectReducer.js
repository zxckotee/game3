import ACTION_TYPES from '../actions/actionTypes';
import { 
  normalizeSectBenefits, 
  normalizeSectData, 
  createNormalizedSectData, 
  collectAllSectBenefits 
} from '../../utils/sectUtils';
import { updateRelationshipAndLoyalty } from '../../utils/sectRelationshipSyncer.js';

/**
 * Начальное состояние секты
 */
const initialState = {
  // Информация о секте
  sect: null,
  // Загрузка данных
  loading: false,
  // Ошибка
  error: null,
  // Информация о ранге пользователя в секте
  userRank: null,
  // Привилегии пользователя в секте
  privileges: [],
  // Бонусы от секты
  benefits: [
    {type: 'cultivation_speed', modifier: 0},
    {type: 'resource_gathering', modifier: 0},
    {type: 'technique_discount', modifier: 0}
  ],
  // Выбранный член секты для взаимодействия
  selectedMember: null
};

/**
 * Редуктор для работы с сектами
 * @param {Object} state Текущее состояние
 * @param {Object} action Действие для обработки
 * @returns {Object} Новое состояние
 */
const sectReducer = (state = initialState, action) => {
  // Нормализуем текущее состояние перед каждой операцией
  // Это обеспечит консистентный формат данных
  let safeState = normalizeSectData(state);
  
  switch (action.type) {
    // Нормализация данных секты
    case ACTION_TYPES.NORMALIZE_SECT_DATA:
      //console.log('Выполняется нормализация данных секты');
      return normalizeSectData(safeState);
    // Установка информации о секте
    case ACTION_TYPES.SET_SECT:
      if (!action.payload) {
        return state;
      }
      
      // Создаем копию payload с нормализованными бонусами
      const normalizedPayload = {
        ...action.payload,
        benefits: normalizeSectBenefits(action.payload.benefits)
      };
      
      // Создаем новое состояние
      const setSectState = {
        ...state,
        sect: normalizedPayload,
        benefits: normalizedPayload.benefits || state.benefits,
        loading: false,
        error: null
      };
      
      // Проводим полную нормализацию нового состояния
      return normalizeSectData(setSectState);
    
    // Обновление информации о секте
    case ACTION_TYPES.UPDATE_SECT:
      return {
        ...state,
        sect: {
          ...state.sect,
          ...action.payload
        },
        loading: false,
        error: null
      };
    
    // Вступление в секту
    case ACTION_TYPES.JOIN_SECT:
      return {
        ...state,
        sect: action.payload,
        loading: false,
        error: null
      };
    
    // Выход из секты
    case ACTION_TYPES.LEAVE_SECT:
      return {
        ...initialState
      };
    
    // Вклад в секту
    case ACTION_TYPES.CONTRIBUTE_TO_SECT:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    // Обновление информации о секте после вклада (вызывается в результате успешного вклада)
    case `${ACTION_TYPES.CONTRIBUTE_TO_SECT}_SUCCESS`:
      return {
        ...state,
        sect: {
          ...state.sect,
          level: action.payload.newLevel,
          rank: action.payload.sectRank,
          experience: action.payload.sectExperience,
          requiredExperience: action.payload.sectRequiredExperience,
          influence: action.payload.sectInfluence
        },
        loading: false,
        error: null
      };
    
    // Ошибка при вкладе в секту
    case `${ACTION_TYPES.CONTRIBUTE_TO_SECT}_ERROR`:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    // Тренировка с членом секты
    case ACTION_TYPES.TRAIN_SECT_MEMBER:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    // Обновление информации о члене секты после тренировки
    case `${ACTION_TYPES.TRAIN_SECT_MEMBER}_SUCCESS`:
      // Находим и обновляем информацию о члене секты
      const updatedMembers = state.sect.members.map(member => 
        member.id === action.payload.memberId 
          ? {
              ...member,
              level: action.payload.memberLevel,
              experience: action.payload.memberExperience,
              requiredExperience: action.payload.memberRequiredExperience,
              role: action.payload.memberRole
            }
          : member
      );
      
      return {
        ...state,
        sect: {
          ...state.sect,
          members: updatedMembers
        },
        loading: false,
        error: null
      };
    
    // Ошибка при тренировке члена секты
    case `${ACTION_TYPES.TRAIN_SECT_MEMBER}_ERROR`:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    // Обновление информации о члене секты
    case ACTION_TYPES.UPDATE_SECT_MEMBER:
      // Находим и обновляем информацию о члене секты
      const updatedMembersArray = state.sect.members.map(member => 
        member.id === action.payload.id 
          ? {
              ...member,
              ...action.payload
            }
          : member
      );
      
      return {
        ...state,
        sect: {
          ...state.sect,
          members: updatedMembersArray
        },
        loading: false,
        error: null
      };
    
// Обновление бонусов от секты
    case ACTION_TYPES.UPDATE_SECT_BENEFITS:
      // Используем функцию нормализации из sectUtils
      const normalizedBenefits = normalizeSectBenefits(action.payload);
      
     // console.log('Обновление бонусов секты. Нормализованные бонусы:', normalizedBenefits);
      
      // Обновляем также benefits в sect, если она существует
      const updatedSect = state.sect ? {
        ...state.sect,
        benefits: normalizedBenefits
      } : null;
      
      // Создаем новое состояние с нормализованными бонусами
      const newState = {
        ...state,
        benefits: normalizedBenefits,
        sect: updatedSect,
        // Пересчитываем массив эффектов напрямую
        effectsArray: normalizeSectBenefits(normalizedBenefits)
      };
      
      // Проводим полную нормализацию данных
      const normalizedState = normalizeSectData(newState);
      
      //console.log('Результат нормализации данных секты:', normalizedState);
      
      return normalizedState;
    
    // Обновление ранга пользователя в секте
    case ACTION_TYPES.UPDATE_SECT_RANK:
      return {
        ...state,
        userRank: action.payload.role,
        privileges: action.payload.privileges
      };
    
    // Выбор члена секты для взаимодействия
    case 'SELECT_SECT_MEMBER':
      return {
        ...state,
        selectedMember: action.payload
      };
    
    // Синхронизация лояльности секты с социальными отношениями
    case ACTION_TYPES.SYNC_SECT_TO_SOCIAL:
      return state; // Этот редуктор не меняет состояние, обработка в playerReducer
    
    // Синхронизация социальных отношений с лояльностью секты
    case ACTION_TYPES.SYNC_SOCIAL_TO_SECT:
      // Находим соответствующий персонаж в социальных отношениях
      return state; // Этот редуктор не меняет состояние, обработка в playerReducer
    
    // Действие UPDATE_SECT_LOYALTY удалено, т.к. лояльность не используется
    
    // Обновление полных данных секты
    case ACTION_TYPES.UPDATE_SECT_DATA:
      if (!state.sect || !action.payload) {
        //console.warn('Попытка обновить данные секты, но секта не найдена или данные некорректны');
        return state;
      }
      
      //console.log('Обновление данных секты:', action.payload);
      
      // Создаем копию данных с нормализованными бонусами, если они есть
      const dataWithNormalizedBenefits = action.payload.benefits 
        ? {
            ...action.payload,
            benefits: normalizeSectBenefits(action.payload.benefits)
          }
        : action.payload;
      
      // Создаем новое состояние
      const updatedSectState = {
        ...state,
        sect: {
          ...state.sect,
          ...dataWithNormalizedBenefits
        }
      };
      
      // Проводим полную нормализацию данных
      return normalizeSectData(updatedSectState);
    
    // Одновременное обновление отношений и лояльности
    case ACTION_TYPES.UPDATE_RELATIONSHIP_AND_LOYALTY:
      if (!action.payload || !action.payload.name || action.payload.value === undefined) {
        //console.warn('⚠️ Невозможно обновить отношения и лояльность: неполные данные', action.payload);
        return state;
      }
      
      // Этот обработчик необходим, чтобы sectReducer тоже реагировал на действие
      // updateRelationshipAndLoyalty, хотя основная обработка происходит 
      // в playerReducer. Это позволяет уведомить оба редуктора об изменении.
      //console.log(`🔄 Получено уведомление об обновлении отношений с "${action.payload.name}" до уровня ${action.payload.value}`);
      
      // Возвращаем текущее состояние, т.к. обновление через playerReducer
      // также влияет на общее состояние приложения
      return state;
    
    default:
      return state;
  }
};

export default sectReducer;
