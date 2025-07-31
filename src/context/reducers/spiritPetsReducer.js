import ACTION_TYPES from '../actions/actionTypes';

// Редуктор для обработки действий, связанных с духовными питомцами
export const spiritPetsReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.ADD_SPIRIT_PET:
      // Проверяем, инициализирована ли структура spiritPets
      const currentPets = state.player?.spiritPets?.pets || [];
      
      return {
        ...state,
        player: {
          ...state.player,
          spiritPets: {
            ...state.player.spiritPets || {},
            pets: [...currentPets, action.payload]
          }
        }
      };
      
    case ACTION_TYPES.REMOVE_SPIRIT_PET:
      return {
        ...state,
        player: {
          ...state.player,
          spiritPets: {
            ...state.player.spiritPets || {},
            pets: (state.player?.spiritPets?.pets || []).filter(pet => pet.id !== action.payload),
            // Если удаляемый питомец был активным, сбрасываем активного питомца
            activePetId: state.player?.spiritPets?.activePetId === action.payload 
              ? null 
              : state.player?.spiritPets?.activePetId
          }
        }
      };
      
    case ACTION_TYPES.UPDATE_SPIRIT_PET:
      return {
        ...state,
        player: {
          ...state.player,
          spiritPets: {
            ...state.player.spiritPets || {},
            pets: (state.player?.spiritPets?.pets || []).map(pet => 
              pet.id === action.payload.id 
                ? { ...pet, ...action.payload.updates } 
                : pet
            )
          }
        }
      };
      
    case ACTION_TYPES.SET_ACTIVE_SPIRIT_PET:
      // Также устанавливаем isActive для всех питомцев
      const updatedPets = (state.player?.spiritPets?.pets || []).map(pet => ({
        ...pet,
        isActive: pet.id === action.payload
      }));
      
      return {
        ...state,
        player: {
          ...state.player,
          spiritPets: {
            ...state.player.spiritPets || {},
            pets: updatedPets,
            activePetId: action.payload
          }
        }
      };
      
    case ACTION_TYPES.FEED_SPIRIT_PET: {
      // Проверяем структуру payload
      const petId = action.payload.petId || action.payload.id;
      const foodItemId = action.payload.foodItemId;
      const foodItem = action.payload.foodItem; // Для обратной совместимости
      
      if (!petId) return state;
      
      // Получаем список питомцев
      const pets = state.player?.spiritPets?.pets || [];
      
      // Находим питомца
      const pet = pets.find(p => p.id === petId);
      if (!pet) return state;
      
      // Проверяем наличие предмета питания в инвентаре, если указан foodItemId
      if (foodItemId) {
        const playerInventory = state.player?.inventory?.items || [];
        const foodItemInInventory = playerInventory.find(item => 
          item.id === foodItemId && item.type === 'pet_food' && item.quantity > 0
        );
        
        // Если предмет не найден в инвентаре, возвращаем состояние без изменений
        if (!foodItemInInventory) {
          console.log(`Предмет питания с ID ${foodItemId} не найден в инвентаре`);
          return state;
        }
        
        // Обновляем питомца с учетом характеристик предмета
        const updatedPet = {
          ...pet,
          hunger: Math.min(pet.hunger + (foodItemInInventory.nutritionValue !== undefined ? foodItemInInventory.nutritionValue : 25), 100),
          loyalty: Math.min(pet.loyalty + (foodItemInInventory.loyaltyBonus !== undefined ? foodItemInInventory.loyaltyBonus : 5), 100),
          lastFed: new Date()
        };
        
        // Обновляем питомца в списке питомцев
        const updatedPets = pets.map(p => p.id === petId ? updatedPet : p);
        
        // Удаляем предмет из инвентаря (уменьшаем количество на 1)
        const updatedInventory = playerInventory.map(item => {
          if (item.id === foodItemId) {
            return {
              ...item,
              quantity: item.quantity - 1
            };
          }
          return item;
        }).filter(item => item.quantity > 0); // Удаляем предметы с количеством 0
        
        // Возвращаем обновленное состояние с обновленным инвентарем
        return {
          ...state,
          player: {
            ...state.player,
            spiritPets: {
              ...state.player.spiritPets || {},
              pets: updatedPets
            },
            inventory: {
              ...state.player.inventory,
              items: updatedInventory
            }
          }
        };
      } 
      // Для обратной совместимости обрабатываем случай, когда передан объект foodItem
      else if (foodItem) {
        // Обновляем питомца с учетом значений foodItem
        const updatedPet = {
          ...pet,
          hunger: Math.min(pet.hunger + (foodItem.nutritionValue !== undefined ? foodItem.nutritionValue : 25), 100),
          loyalty: Math.min(pet.loyalty + (foodItem.loyaltyBonus !== undefined ? foodItem.loyaltyBonus : 5), 100),
          lastFed: new Date()
        };
        
        // Обновляем питомца в списке питомцев
        const updatedPets = pets.map(p => p.id === petId ? updatedPet : p);
        
        return {
          ...state,
          player: {
            ...state.player,
            spiritPets: {
              ...state.player.spiritPets || {},
              pets: updatedPets
            }
          }
        };
      } 
      // Если ни foodItemId, ни foodItem не указаны, используем дефолтные значения
      else {
        console.log('Использование дефолтных значений для кормления питомца (обратная совместимость)');
        // Обновляем питомца с дефолтными значениями
        const updatedPet = {
          ...pet,
          hunger: Math.min(pet.hunger + 20, 100),
          loyalty: Math.min(pet.loyalty + 5, 100),
          lastFed: new Date()
        };
        
        // Обновляем питомца в списке питомцев
        const updatedPets = pets.map(p => p.id === petId ? updatedPet : p);
        
        return {
          ...state,
          player: {
            ...state.player,
            spiritPets: {
              ...state.player.spiritPets || {},
              pets: updatedPets
            }
          }
        };
      }
    }
    
    case ACTION_TYPES.TRAIN_SPIRIT_PET: {
      // Проверяем структуру payload
      const petId = action.payload.petId || action.payload.id;
      const statToTrain = action.payload.trainingType || action.payload.statToTrain;
      
      if (!petId || !statToTrain) return state;
      
      // Получаем список питомцев
      const pets = state.player?.spiritPets?.pets || [];
      
      // Находим питомца
      const pet = pets.find(p => p.id === petId);
      if (!pet) return state;
      
      // Проверяем, достаточно ли голоден питомец
      if (pet.hunger < 30) return state;
      
      // Обновляем питомца в зависимости от типа тренировки
      let updatedPet = { ...pet };
      
      // Уменьшаем голод всегда
      updatedPet.hunger = Math.max(pet.hunger - 15, 0);
      
      // Обновляем дату тренировки
      updatedPet.lastTrained = new Date();
      
      // Безопасно даем опыт с проверкой границ
      const currentExp = pet.experience || 0;
      const expForNextLevel = state.player?.spiritPets?.expForNextLevel || 100;
      updatedPet.experience = safeUpdateExperience(currentExp, 10, expForNextLevel);
      
      // Проверяем, достаточно ли опыта для повышения уровня
      if (updatedPet.experience >= expForNextLevel) {
        updatedPet.level = (pet.level || 1) + 1;
        updatedPet.experience = Math.max(0, updatedPet.experience - expForNextLevel);
      }
      
      // Обновляем конкретную характеристику
      switch (statToTrain) {
        case 'strength':
          updatedPet.strength = Math.min((pet.strength || 1) + 1, 100);
          break;
        case 'intelligence':
          updatedPet.intelligence = Math.min((pet.intelligence || 1) + 1, 100);
          break;
        case 'agility':
          updatedPet.agility = Math.min((pet.agility || 1) + 1, 100);
          break;
        case 'vitality':
          updatedPet.vitality = Math.min((pet.vitality || 1) + 1, 100);
          break;
        case 'spirit':
          updatedPet.spirit = Math.min((pet.spirit || 1) + 1, 100);
          break;
        default:
          // Неизвестный тип тренировки
          break;
      }
      
      // Обновляем питомца в списке питомцев
      const updatedPets = pets.map(p => p.id === petId ? updatedPet : p);
      
      return {
        ...state,
        player: {
          ...state.player,
          spiritPets: {
            ...state.player.spiritPets || {},
            pets: updatedPets
          }
        }
      };
    }
    
    case ACTION_TYPES.USE_PET_ABILITY: {
      const { petId, abilityId } = action.payload;
      
      // Получаем список питомцев
      const pets = state.player?.spiritPets?.pets || [];
      
      // Находим питомца
      const pet = pets.find(p => p.id === petId);
      if (!pet) return state;
      
      // Находим способность
      const ability = pet.abilities.find(a => a.id === abilityId);
      if (!ability) return state;
      
      // Проверяем, достаточно ли сытости для использования способности
      const hungerCost = 20; // Каждая способность тратит 20% сытости
      if (pet.hunger < hungerCost) {
        console.log(`Недостаточно сытости для использования способности: ${pet.hunger}% < ${hungerCost}%`);
        return state;
      }
      
      console.log(`Питомец ${pet.name} (ID: ${pet.id}) использует способность ${abilityId}:`);
      console.log(`- До: сытость ${pet.hunger}%, лояльность ${pet.loyalty}%`);
      
      // Проверяем лояльность питомца
      // Расчет снижения лояльности обратно пропорционально сытости и умноженное на 5
      // Чем ниже сытость, тем больше снижение лояльности
      const loyaltyCost = Math.round(5 * (100 / Math.max(pet.hunger, 1)));
      console.log(`Питомец ${pet.name} теряет ${loyaltyCost}% лояльности (сытость: ${pet.hunger}%, множитель: 5)`);
      console.log(`ФОРМУЛА: 5 * (100 / ${pet.hunger}) = ${loyaltyCost}`);
      
      if (pet.loyalty <= 25) {
        console.log(`Питомец ${pet.name} отказывается помогать и убегает (лояльность слишком низкая: ${pet.loyalty}%)!`);
        
        // Если лояльность слишком низкая, питомец убегает - используем REMOVE_FLEEING_PET
        const remainingPets = pets.filter(p => p.id !== petId);
        
        return {
          ...state,
          player: {
            ...state.player,
            spiritPets: {
              ...state.player.spiritPets || {},
              pets: remainingPets,
              // Если активный питомец убегает, сбрасываем activePetId
              activePetId: pet.id === state.player.spiritPets.activePetId ? null : state.player.spiritPets.activePetId
            }
          }
        };
      }
      
      // Обновляем питомца - уменьшаем сытость и лояльность
      const updatedPet = {
        ...pet,
        hunger: Math.max(0, pet.hunger - hungerCost),
        loyalty: Math.max(0, pet.loyalty - loyaltyCost),
        lastUsedAbility: new Date()
      };
      
      console.log(`- После: сытость ${updatedPet.hunger}%, лояльность ${updatedPet.loyalty}%`);
      console.log(`- Изменения: сытость -${hungerCost}%, лояльность -${loyaltyCost}%`);
      
      // Обновляем питомца в списке питомцев
      const updatedPets = pets.map(p => p.id === petId ? updatedPet : p);
      
      return {
        ...state,
        player: {
          ...state.player,
          spiritPets: {
            ...state.player.spiritPets || {},
            pets: updatedPets
          }
        }
      };
    }
    
    case ACTION_TYPES.REMOVE_FLEEING_PET: {
      const petId = action.payload;
      
      // Получаем список питомцев
      const pets = state.player?.spiritPets?.pets || [];
      
      // Удаляем сбежавшего питомца
      const remainingPets = pets.filter(p => p.id !== petId);
      
      return {
        ...state,
        player: {
          ...state.player,
          spiritPets: {
            ...state.player.spiritPets || {},
            pets: remainingPets,
            // Если активный питомец убегает, сбрасываем activePetId
            activePetId: petId === state.player.spiritPets.activePetId ? null : state.player.spiritPets.activePetId
          }
        }
      };
    }
    
    case ACTION_TYPES.UPDATE_PETS_STATE: {
      // Обновление состояния всех питомцев (например, при смене времени)
      // Получаем список питомцев
      const pets = state.player?.spiritPets?.pets || [];
      
      // Обновляем всех питомцев
      const updatedPets = pets.map(pet => {
        // Уменьшаем голод и восстанавливаем энергию
        return {
          ...pet,
          hunger: Math.max((pet.hunger || 100) - 1, 0),
          energy: Math.min((pet.energy || 0) + 2, 100),
          // Если питомец голоден, уменьшаем лояльность
          loyalty: (pet.hunger || 100) < 20 
            ? Math.max((pet.loyalty || 100) - 1, 0) 
            : (pet.loyalty || 100)
        };
      });
      
      return {
        ...state,
        player: {
          ...state.player,
          spiritPets: {
            ...state.player.spiritPets || {},
            pets: updatedPets
          }
        }
      };
    }
    
    default:
      return state;
  }
};
