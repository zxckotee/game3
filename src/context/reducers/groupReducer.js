/**
 * Редьюсер для управления состоянием групп и групповых активностей
 */
import ACTION_TYPES from '../actions/actionTypes';

// Начальное состояние
const initialState = {
  list: [], // Список групп пользователя
  currentGroup: null, // Текущая активная группа
  activities: [], // Доступные типы активностей
  currentActivity: null, // Текущая активная групповая активность
  activityInstances: [], // Экземпляры активностей текущей группы
  invitations: [], // Приглашения в группы
  rewards: [], // Полученные, но не забранные награды
  loading: false, // Флаг загрузки данных
  error: null // Ошибка, если есть
};

/**
 * Редьюсер для управления состоянием групп
 * @param {Object} state - Текущее состояние
 * @param {Object} action - Действие для обработки
 * @returns {Object} - Новое состояние
 */
const groupReducer = (state = initialState, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_GROUPS:
      return {
        ...state,
        list: action.payload
      };
      
    case ACTION_TYPES.SET_CURRENT_GROUP:
      return {
        ...state,
        currentGroup: action.payload
      };
      
    case ACTION_TYPES.CREATE_GROUP:
      return {
        ...state,
        list: [...state.list, action.payload],
        currentGroup: action.payload
      };
      
    case ACTION_TYPES.UPDATE_GROUP:
      return {
        ...state,
        list: state.list.map(group => 
          group.id === action.payload.id ? action.payload : group
        ),
        currentGroup: state.currentGroup && state.currentGroup.id === action.payload.id 
          ? action.payload 
          : state.currentGroup
      };
      
    case ACTION_TYPES.DELETE_GROUP:
      return {
        ...state,
        list: state.list.filter(group => group.id !== action.payload),
        currentGroup: state.currentGroup && state.currentGroup.id === action.payload 
          ? null 
          : state.currentGroup
      };
      
    case ACTION_TYPES.JOIN_GROUP: {
      const { groupId, member } = action.payload;
      
      // Находим группу и добавляем нового участника
      return {
        ...state,
        list: state.list.map(group => {
          if (group.id === groupId) {
            return {
              ...group,
              members: [...group.members, member]
            };
          }
          return group;
        })
      };
    }
      
    case ACTION_TYPES.LEAVE_GROUP: {
      const { groupId, userId } = action.payload;
      
      // Находим группу и удаляем участника
      return {
        ...state,
        list: state.list.map(group => {
          if (group.id === groupId) {
            return {
              ...group,
              members: group.members.filter(member => member.userId !== userId)
            };
          }
          return group;
        })
      };
    }
      
    case ACTION_TYPES.SET_GROUP_ACTIVITIES:
      return {
        ...state,
        activities: action.payload
      };
      
    case ACTION_TYPES.SET_CURRENT_ACTIVITY:
      return {
        ...state,
        currentActivity: action.payload
      };
      
    case ACTION_TYPES.CREATE_ACTIVITY_INSTANCE:
      return {
        ...state,
        activityInstances: [...state.activityInstances, action.payload],
        currentActivity: action.payload
      };
      
    case ACTION_TYPES.FETCH_GROUP_ACTIVITY_INSTANCES:
      return {
        ...state,
        loading: true,
        error: null
      };
      
    case ACTION_TYPES.SET_GROUP_ACTIVITY_INSTANCES:
      return {
        ...state,
        activityInstances: action.payload,
        loading: false
      };
    
    case ACTION_TYPES.UPDATE_ACTIVITY_INSTANCE:
      return {
        ...state,
        activityInstances: state.activityInstances.map(instance => 
          instance.id === action.payload.id ? action.payload : instance
        ),
        currentActivity: state.currentActivity && state.currentActivity.id === action.payload.id 
          ? action.payload 
          : state.currentActivity
      };
      
    case ACTION_TYPES.START_ACTIVITY:
    case ACTION_TYPES.UPDATE_ACTIVITY_PROGRESS:
    case ACTION_TYPES.COMPLETE_ACTIVITY:
    case ACTION_TYPES.FAIL_ACTIVITY:
    case ACTION_TYPES.ABANDON_ACTIVITY:
      // Все эти действия обрабатываются одинаково - обновляем экземпляр активности
      return {
        ...state,
        activityInstances: state.activityInstances.map(instance => 
          instance.id === action.payload.id ? action.payload : instance
        )
      };
    
    case ACTION_TYPES.ADD_ACTIVITY_PARTICIPANT: {
      const { instanceId, participant } = action.payload;
      
      return {
        ...state,
        activityInstances: state.activityInstances.map(instance => {
          if (instance.id === instanceId) {
            return {
              ...instance,
              participants: [...instance.participants, participant]
            };
          }
          return instance;
        })
      };
    }
    
    case ACTION_TYPES.REMOVE_ACTIVITY_PARTICIPANT: {
      const { instanceId, userId } = action.payload;
      
      return {
        ...state,
        activityInstances: state.activityInstances.map(instance => {
          if (instance.id === instanceId) {
            return {
              ...instance,
              participants: instance.participants.filter(p => p.userId !== userId)
            };
          }
          return instance;
        })
      };
    }
    
    case ACTION_TYPES.UPDATE_ACTIVITY_REWARDS: {
      const { instanceId, rewards } = action.payload;
      
      return {
        ...state,
        activityInstances: state.activityInstances.map(instance => {
          if (instance.id === instanceId) {
            return {
              ...instance,
              rewards: rewards
            };
          }
          return instance;
        })
      };
    }
      
    case ACTION_TYPES.ADD_REWARDS:
      // Добавляем награды в список необработанных наград
      return {
        ...state,
        rewards: [...state.rewards, ...action.payload.filter(reward => !reward.isClaimed)]
      };
    
    case ACTION_TYPES.SET_USER_INVITATIONS:
      return {
        ...state,
        invitations: action.payload,
        loading: false
      };
      
    case ACTION_TYPES.FETCH_USER_INVITATIONS:
      return {
        ...state,
        loading: true
      };
      
    case ACTION_TYPES.RESPOND_TO_INVITATION:
      return {
        ...state,
        invitations: state.invitations.filter(invite => 
          invite.id !== action.payload.invitationId
        )
      };
      
    case ACTION_TYPES.SET_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    default:
      return state;
  }
};

export default groupReducer;
