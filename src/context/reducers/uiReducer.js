import ACTION_TYPES from '../actions/actionTypes';

// Редуктор для обработки действий, связанных с интерфейсом
export const uiReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.CHANGE_SCREEN:
      return {
        ...state,
        ui: {
          ...state.ui,
          currentScreen: action.payload,
        },
      };
      
    case ACTION_TYPES.ADD_NOTIFICATION:
      // Generate a unique ID for the notification if one isn't provided
      const currentTime = Date.now();
      const notificationWithId = {
        ...action.payload,
        id: action.payload.id || `notification_${currentTime}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: currentTime
      };
      
      // Check if a notification with the same message exists within the last 3 seconds
      const isDuplicate = state.ui.notifications.some(
        notification => 
          notification.message === notificationWithId.message && 
          notification.timestamp && 
          (currentTime - notification.timestamp < 3000)
      );
      
      // If it's a duplicate, don't add it
      if (isDuplicate) {
        return state;
      }
      
      // Limit to the most recent 10 notifications
      const updatedNotifications = [...state.ui.notifications, notificationWithId]
        .slice(-10);
      
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: updatedNotifications,
        },
      };
      
    case ACTION_TYPES.REMOVE_NOTIFICATION:
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(
            notification => notification.id !== action.payload
          ),
        },
      };
      
    case ACTION_TYPES.UPDATE_SETTINGS:
      return {
        ...state,
        ui: {
          ...state.ui,
          settings: {
            ...state.ui.settings,
            ...action.payload,
          },
        },
      };
      
    default:
      return state;
  }
};
