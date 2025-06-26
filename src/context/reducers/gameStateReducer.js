import ACTION_TYPES from '../actions/actionTypes';
import initialState from '../state/initialState';
import { repairTechniques } from '../../utils/techniqueUtils';

// Редуктор для обработки действий, связанных с сохранением и загрузкой игры
export const gameStateReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SAVE_GAME: {
      try {
        // Создаем глубокую копию состояния для сохранения
        const stateToSave = JSON.parse(JSON.stringify(state));
        
        // Подготавливаем техники перед сохранением, чтобы гарантировать сохранение всех свойств
        if (stateToSave.player && Array.isArray(stateToSave.player.techniques)) {
          // Проверяем и подготавливаем каждую технику
          stateToSave.player.techniques = stateToSave.player.techniques.map(technique => {
            // Проверяем, что все необходимые поля присутствуют
            const validatedTechnique = {
              id: technique.id,
              name: technique.name || '',
              description: technique.description || '',
              type: technique.type || 'attack',
              element: technique.element || 'fire',
              icon: technique.icon || '',
              level: technique.level || 1,
              experience: technique.experience || 0,
              masteryLevel: technique.masteryLevel || 0,
              energyCost: technique.energyCost || 10,
              damage: technique.damage || 0,
              damageType: technique.damageType || 'physical',
              healing: technique.healing || 0,
              cooldown: technique.cooldown || 0,
              maxLevel: technique.maxLevel || 10,
              lastUsed: technique.lastUsed || null,
              effects: Array.isArray(technique.effects) ? technique.effects : [],
              requiredLevel: technique.requiredLevel || 1
            };
            
            return validatedTechnique;
          });
          
          console.log(`Подготовлено ${stateToSave.player.techniques.length} техник для сохранения`);
        }
        
        // Сохраняем игру в localStorage и на сервере
        localStorage.setItem('gameState', JSON.stringify(stateToSave));
        console.log('Игра успешно сохранена в localStorage');
        
        // Если передан колбэк для обработки результата сохранения
        if (action.payload && typeof action.payload.onSuccess === 'function') {
          action.payload.onSuccess();
        }
      } catch (error) {
        console.error('Ошибка при сохранении игры:', error);
        
        // Если передан колбэк для обработки ошибки
        if (action.payload && typeof action.payload.onError === 'function') {
          action.payload.onError(error);
        }
      }
      
      return state;
    }
    
    case ACTION_TYPES.LOAD_GAME: {
      const loadedState = action.payload;
      console.log('Загрузка состояния:', loadedState);
      
      // Логгируем техники перед валидацией для отладки
      if (Array.isArray(loadedState?.player?.techniques) && loadedState.player.techniques.length > 0) {
        console.log('Загружаемые техники до валидации:', loadedState.player.techniques);
      }
      
      // Проверяем и восстанавливаем структуру состояния
      const validatedState = {
        ...initialState,
        ...loadedState,
        player: {
          ...initialState.player,
          ...(loadedState?.player || {}),
          social: {
            ...initialState.player.social,
            ...(loadedState?.player?.social || {}),
            relationships: loadedState?.player?.social?.relationships || {}
          },
          progress: {
            ...initialState.player.progress,
            ...(loadedState?.player?.progress || {}),
            discoveries: loadedState?.player?.progress?.discoveries || {},
            quests: {
              ...initialState.player.progress.quests,
              ...(loadedState?.player?.progress?.quests || {}),
              active: Array.isArray(loadedState?.player?.progress?.quests?.active) 
                ? loadedState.player.progress.quests.active 
                : [],
              available: Array.isArray(loadedState?.player?.progress?.quests?.available) 
                ? loadedState.player.progress.quests.available 
                : [],
              completed: Array.isArray(loadedState?.player?.progress?.quests?.completed) 
                ? loadedState.player.progress.quests.completed 
                : []
            }
          },
          inventory: {
            ...initialState.player.inventory,
            ...(loadedState?.player?.inventory || {}),
            items: Array.isArray(loadedState?.player?.inventory?.items) 
              ? loadedState.player.inventory.items 
              : [],
            equipment: loadedState?.player?.inventory?.equipment || {},
            currency: loadedState?.player?.inventory?.currency || 0
          },
          cultivation: {
            ...initialState.player.cultivation,
            ...(loadedState?.player?.cultivation || {})
          },
      // Загружаем техники без сложной логики восстановления
      techniques: Array.isArray(loadedState?.player?.techniques) 
        ? loadedState.player.techniques 
        : [],
          spiritPets: {
            ...initialState.player.spiritPets,
            ...(loadedState?.player?.spiritPets || {}),
            pets: Array.isArray(loadedState?.player?.spiritPets?.pets)
              ? loadedState.player.spiritPets.pets
              : [],
            activePetId: loadedState?.player?.spiritPets?.activePetId || null
          }
        },
        achievements: {
          ...initialState.achievements,
          ...(loadedState?.achievements || {}),
          completed: Array.isArray(loadedState?.achievements?.completed) 
            ? loadedState.achievements.completed 
            : []
        },
        isLoading: loadedState?.isLoading !== undefined ? loadedState.isLoading : false,
        error: loadedState?.error || null,
        isInitialized: loadedState?.isInitialized !== undefined ? loadedState.isInitialized : false
      };
      
      console.log('Валидированное состояние:', validatedState);
      
      // Логгируем техники после валидации для проверки
      if (Array.isArray(validatedState?.player?.techniques) && validatedState.player.techniques.length > 0) {
        console.log('Техники после валидации:', validatedState.player.techniques);
      }
      
      return validatedState;
    }
    
    case ACTION_TYPES.SET_INITIALIZED:
      return {
        ...state,
        isInitialized: action.payload
      };
      
    case ACTION_TYPES.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
      
    default:
      return state;
  }
};
