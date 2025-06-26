import ACTION_TYPES from '../actions/actionTypes';

/**
 * Редуктор для обработки действий, связанных с рынком и торговлей
 * @param {Object} state Текущее состояние рынка
 * @param {Object} action Действие для обработки
 * @returns {Object} Новое состояние рынка
 */
const marketReducer = (state = {}, action) => {
  switch (action.type) {
    case ACTION_TYPES.ADD_MARKET_ITEM:
      return {
        ...state,
        marketItems: [...state.marketItems, action.payload]
      };
      
    case ACTION_TYPES.REMOVE_MARKET_ITEM:
      return {
        ...state,
        marketItems: state.marketItems.filter(item => item.id !== action.payload.id)
      };
      
    case ACTION_TYPES.UPDATE_MARKET_ITEM:
      return {
        ...state,
        marketItems: state.marketItems.map(item => 
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        )
      };
      
    case ACTION_TYPES.BUY_MARKET_ITEM:
      // Обработка покупки предмета с рынка
      // Удаляем предмет из списка рыночных предметов
      return {
        ...state,
        marketItems: state.marketItems.filter(item => item.id !== action.payload.id),
        lastUpdated: new Date().toISOString()
      };
      
    case ACTION_TYPES.SELL_MARKET_ITEM:
      // Обработка продажи предмета на рынок
      // Добавляем предмет в список рыночных предметов
      return {
        ...state,
        playerItems: [...state.playerItems, action.payload],
        lastUpdated: new Date().toISOString()
      };
      
    case ACTION_TYPES.UPDATE_MERCHANT_REPUTATION:
      // Обновление репутации игрока у торговца
      return {
        ...state,
        merchantReputation: {
          ...state.merchantReputation,
          [action.payload.merchantId]: action.payload.reputation
        }
      };
      
    case ACTION_TYPES.UPDATE_MARKET_STATE:
      // Обновление всего состояния рынка c сохранением информации о скидках
      if (action.payload.marketItems) {
        // Если есть маркетные товары в payload, обеспечиваем сохранение информации о скидках
        return {
          ...state,
          ...action.payload,
          marketItems: (action.payload.marketItems || []).map(newItem => {
            // Сохраняем оригинальную цену и скидку, если они есть в payload
            if (newItem.originalPrice && newItem.discount !== undefined) {
              return newItem;
            }

            // Ищем соответствующий предмет в старом состоянии
            const oldItem = state.marketItems ? 
              state.marketItems.find(item => item.itemId === newItem.itemId && item.itemType === newItem.itemType) : null;

            // Если нашли старый предмет и у него есть информация о скидке, сохраняем ее
            if (oldItem && oldItem.originalPrice && oldItem.discount !== undefined) {
              return {
                ...newItem,
                originalPrice: oldItem.originalPrice,
                discount: oldItem.discount
              };
            }
            
            return newItem;
          }),
          lastUpdated: new Date().toISOString()
        };
      } else {
        // Если нет маркетных товаров, просто обновляем состояние
        return {
          ...state,
          ...action.payload,
          lastUpdated: new Date().toISOString()
        };
      }
      
    default:
      return state;
  }
};

export default marketReducer;
