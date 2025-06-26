import { 
  UPDATE_ITEM_DETAILS, 
  ENRICH_ITEM_REQUEST, 
  ENRICH_ITEM_SUCCESS, 
  ENRICH_ITEM_FAILURE 
} from '../actions/inventory-actions';

// Начальное состояние инвентаря
const initialState = {
  items: [],
  loading: false,
  error: null,
  enrichedItems: {}  // Хранилище для обогащенных данных предметов
};

/**
 * Редьюсер для инвентаря
 * @param {Object} state - Текущее состояние инвентаря
 * @param {Object} action - Действие
 * @returns {Object} - Новое состояние
 */
const inventoryReducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_ITEM_DETAILS:
      return {
        ...state,
        items: state.items.map(item => 
          item.itemId === action.payload.itemId 
            ? { ...item, ...action.payload.itemDetails }
            : item
        )
      };
      
    case ENRICH_ITEM_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
      
    case ENRICH_ITEM_SUCCESS:
      // Обновляем предмет в массиве items и сохраняем обогащенные данные
      return {
        ...state,
        loading: false,
        items: state.items.map(item => 
          item.itemId === action.payload.itemId
            ? {
                ...item,
                // Добавляем базовые поля из API
                name: action.payload.itemDetails.name || item.name,
                description: action.payload.itemDetails.description || item.description,
                type: action.payload.itemDetails.type || item.type,
                rarity: action.payload.itemDetails.rarity || item.rarity,
                image_url: action.payload.itemDetails.image_url || null, // Добавляем обработку image_url
                // Помечаем, что предмет был обогащен
                enriched: true
              }
            : item
        ),
        // Сохраняем полные данные в отдельном объекте для быстрого доступа
        enrichedItems: {
          ...state.enrichedItems,
          [action.payload.itemId]: action.payload.itemDetails
        }
      };
      
    case ENRICH_ITEM_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload.error
      };
      
    default:
      return state;
  }
};

export default inventoryReducer;