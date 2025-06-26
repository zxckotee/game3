import ACTION_TYPES from '../actions/actionTypes';
import CharacterStatsServiceAPI from '../../services/character-stats-api';
import BonusServiceAPI from '../../services/bonus-service-api';
import InventoryService from '../../services/inventory-adapter';
import EquipmentService from '../../services/equipment-service-adapter'; // Добавляем импорт адаптера экипировки
import { ensureEquipmentHasCalculatedBonuses, ensureItemHasCalculatedBonuses } from '../../utils/equipmentBonusHelper';
import { normalizeStatusEffects, mergeEffects, reindexEffects, normalizePlayerEffects } from '../../utils/effectsNormalizer';
import { createNormalizedSectData, collectAllSectBenefits, cleanEffects } from '../../utils/sectUtils';
import { syncSectRelationshipToSocial, syncSocialToSectRelationship, updateRelationshipAndLoyalty } from '../../utils/sectRelationshipSyncer.js';

// Глобальная отладка
const DEBUG_EQUIPMENT = true; // Включаем отладку экипировки

// Глобальная переменная для отслеживания ошибок
let lastError = null;

// Редуктор для обработки действий, связанных с игроком
export const playerReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_USER:
      console.log('🔄 Обновление данных пользователя:', action.payload);
      return {
        ...state,
        auth: {
          ...state.auth,
          user: action.payload,
          isAuthenticated: !!action.payload
        }
      };
    case ACTION_TYPES.UPDATE_PLAYER:
      return {
        ...state,
        player: {
          ...state.player,
          ...action.payload,
        },
      };
      
    case ACTION_TYPES.UPDATE_PLAYER_STATS:
      return {
        ...state,
        player: {
          ...state.player,
          stats: {
            ...state.player.stats,
            ...action.payload,
          },
          // Пересчитываем вторичные характеристики при изменении основных
          secondaryStats: CharacterStatsServiceAPI.calculateSecondaryStats({
            ...state.player.stats,
            ...action.payload,
          }, state.player.cultivation),
        },
      };
      
    case ACTION_TYPES.UPDATE_CULTIVATION:
      console.log('🌀 Обновление культивации:', {
        текущая: state.player.cultivation,
        новая: action.payload
      });
      
      // Проверяем валидность приходящих данных
      if (!action.payload) {
        console.warn('⚠️ Получены пустые данные культивации, сохраняем текущее состояние');
        return state;
      }
      
      // Проверяем важные поля (stage, level, energy, maxEnergy и т.д.)
      const hasValidData = action.payload.stage &&
                          action.payload.level &&
                          typeof action.payload.energy === 'number';
      
      if (!hasValidData) {
        console.warn('⚠️ Получены неполные данные культивации, сохраняем текущее состояние');
        console.warn('Отсутствуют важные поля:',
          !action.payload.stage ? 'stage' : '',
          !action.payload.level ? 'level' : '',
          typeof action.payload.energy !== 'number' ? 'energy' : '');
        return state;
      }
      
      // Создаем новый объект с проверкой на null/undefined
      const safePayload = Object.entries(action.payload).reduce((acc, [key, value]) => {
        // Исключаем null, undefined и пустые строки
        if (value !== null && value !== undefined && value !== '') {
          acc[key] = value;
        } else {
          // Используем текущее значение, если оно есть
          if (state.player.cultivation && state.player.cultivation[key] !== undefined) {
            acc[key] = state.player.cultivation[key];
          }
        }
        return acc;
      }, {});
      
      // Создаем объединенный объект культивации с приоритетом новых данных,
      // но с сохранением старых для отсутствующих полей
      const mergedCultivation = {
        ...state.player.cultivation,
        ...safePayload,
      };
      
      console.log('🌀 Итоговое состояние культивации:', mergedCultivation);
      
      return {
        ...state,
        player: {
          ...state.player,
          cultivation: mergedCultivation,
          // Пересчитываем вторичные характеристики при изменении культивации
          secondaryStats: CharacterStatsServiceAPI.calculateSecondaryStats(
            state.player.stats,
            mergedCultivation
          ),
        },
      };
      
    case ACTION_TYPES.ADD_ITEM:
      // Проверяем, есть ли уже такой предмет в инвентаре
      const existingItemIndex = state.player.inventory.items.findIndex(
        item => item.id === action.payload.id
      );
      
      if (existingItemIndex !== -1) {
        // Если предмет уже есть, увеличиваем его количество
        const updatedItems = [...state.player.inventory.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + (action.payload.quantity || 1)
        };
        
        return {
          ...state,
          player: {
            ...state.player,
            inventory: {
              ...state.player.inventory,
              items: updatedItems,
            },
          },
        };
      } else {
        // Если предмета нет, добавляем новый с указанным количеством
        return {
          ...state,
          player: {
            ...state.player,
            inventory: {
              ...state.player.inventory,
              items: [...state.player.inventory.items, {
                ...action.payload,
                quantity: action.payload.quantity || 1
              }],
            },
          },
        };
      }
      
    case ACTION_TYPES.REMOVE_ITEM:
      // Находим предмет, который нужно удалить
      const itemToRemoveIndex = state.player.inventory.items.findIndex(
        item => item.id === action.payload.id
      );
      
      if (itemToRemoveIndex === -1) {
        // Если предмет не найден, возвращаем состояние без изменений
        return state;
      }
      
      const itemToRemove = state.player.inventory.items[itemToRemoveIndex];
      const quantityToRemove = action.payload.quantity || 1;
      
      if (itemToRemove.quantity <= quantityToRemove) {
        // Если нужно удалить все количество или больше, удаляем предмет полностью
        return {
          ...state,
          player: {
            ...state.player,
            inventory: {
              ...state.player.inventory,
              items: state.player.inventory.items.filter((_, index) => index !== itemToRemoveIndex),
            },
          },
        };
      } else {
        // Если нужно удалить часть предметов, уменьшаем количество
        const updatedItems = [...state.player.inventory.items];
        updatedItems[itemToRemoveIndex] = {
          ...itemToRemove,
          quantity: itemToRemove.quantity - quantityToRemove
        };
        
        return {
          ...state,
          player: {
            ...state.player,
            inventory: {
              ...state.player.inventory,
              items: updatedItems,
            },
          },
        };
      }
      
    // Новый обработчик для полного обновления инвентаря с сервера
    case ACTION_TYPES.UPDATE_INVENTORY:
      console.log('Полное обновление инвентаря с сервера:', action.payload);
      
      return {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...state.player.inventory,
            items: action.payload
          }
        }
      };
      
    // Обработчик для очистки инвентаря (например, при смене пользователя)
    case ACTION_TYPES.CLEAR_INVENTORY:
      console.log('Очистка инвентаря пользователя');
      
      return {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...state.player.inventory,
            items: []
          }
        }
      };
      
    // Новый обработчик для обновления отдельного предмета
    case 'UPDATE_ITEM':
      console.log('Обновление предмета:', action.payload);
      
      // Находим индекс предмета, который нужно обновить
      const itemToUpdateIndex = state.player.inventory.items.findIndex(
        item => item.id === action.payload.id
      );
      
      if (itemToUpdateIndex === -1) {
        // Если предмет не найден, возвращаем состояние без изменений
        console.warn('Предмет для обновления не найден:', action.payload.id);
        return state;
      }
      
      // Обновляем предмет
      const updatedItemsList = [...state.player.inventory.items];
      updatedItemsList[itemToUpdateIndex] = {
        ...updatedItemsList[itemToUpdateIndex],
        ...action.payload
      };
      
      return {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...state.player.inventory,
            items: updatedItemsList
          }
        }
      };
      
    // Новый обработчик для массового добавления предметов
    case 'ADD_ITEMS_BATCH':
      console.log('Массовое добавление предметов:', action.payload);
      
      if (!Array.isArray(action.payload) || action.payload.length === 0) {
        return state; // Ничего не делаем, если нет предметов для добавления
      }
      
      const currentItems = [...state.player.inventory.items];
      const itemsToAdd = [];
      
      // Обрабатываем каждый предмет для добавления
      action.payload.forEach(newItem => {
        // Проверяем, есть ли уже такой предмет в инвентаре
        const existingItemIdx = currentItems.findIndex(item => item.id === newItem.id);
        
        if (existingItemIdx !== -1) {
          // Если предмет уже есть, увеличиваем его количество
          currentItems[existingItemIdx] = {
            ...currentItems[existingItemIdx],
            quantity: currentItems[existingItemIdx].quantity + (newItem.quantity || 1)
          };
        } else {
          // Если предмета нет, добавляем его в список для добавления
          itemsToAdd.push({
            ...newItem,
            quantity: newItem.quantity || 1
          });
        }
      });
      
      // Добавляем новые предметы
      return {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...state.player.inventory,
            items: [...currentItems, ...itemsToAdd]
          }
        }
      };
      
    case ACTION_TYPES.UPDATE_CURRENCY:
      // Обрабатываем разные форматы валюты
      const newCurrency = { ...(state.player.inventory.currency || {}) };
      
      if (typeof action.payload === 'number') {
        // Обратная совместимость: если payload это число, добавляем его к текущему значению золота
        newCurrency.gold = (newCurrency.gold || 0) + action.payload;
      } else if (typeof action.payload === 'object') {
        // Если payload это объект с разными типами валют
        
        // Сохраняем текущее значение spiritStones перед обновлением
        const currentSpiritStones = newCurrency.spiritStones;
        
        Object.entries(action.payload).forEach(([currency, amount]) => {
          if (typeof amount === 'number') {
            // ИСПРАВЛЕНО: Уточняем логику аддитивного режима
            if (action.isAdditive === true) {
              // Режим ДОБАВЛЕНИЯ - аддитивный (складываем)
              newCurrency[currency] = (newCurrency[currency] || 0) + amount;
            } else {
              // Режим УСТАНОВКИ (по умолчанию) - заменяем значение
              newCurrency[currency] = amount;
            }
          }
        });
        
        // Проверяем, был ли spiritStones до обновления, и есть ли он в action.payload
        if (currentSpiritStones !== undefined && action.payload.spiritStones === undefined) {
          // Если spiritStones был, но не указан в payload, сохраняем его
          newCurrency.spiritStones = currentSpiritStones;
          console.log('[CurrencyUpdate] Сохранено значение spiritStones:', currentSpiritStones);
        }
      }
      
      // Отладочный вывод
      console.log('Обновление валюты:', { 
        было: state.player.inventory.currency, 
        новое: newCurrency,
        разница: action.payload,
        режим: action.isAdditive === true ? 'добавление' : 'установка'
      });
      
      console.log('Обновление валюты:', newCurrency);
      
      // Создаем объект обновленного состояния
      const currencyUpdatedState = {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...state.player.inventory,
            currency: newCurrency,
          }
        }
      };
      
      return currencyUpdatedState;
      
    case ACTION_TYPES.UPDATE_LOCATION:
      // Дополнительная обработка для разрешения проблемы с отображением "Неизвестно" для локации
      const locationPayload = action.payload;
      // Если payload содержит только координаты, но не содержит полной информации о локации
      const defaultLocations = [
        { id: 1, name: 'Долина Начала', type: 'forest', x: 3, y: 3, description: 'Место, где начинают свой путь молодые культиваторы.', resources: [{ id: 1, name: 'Духовные травы', amount: 'Мало' }] },
        { id: 2, name: 'Горы Облачного Пика', type: 'mountain', x: 5, y: 2, description: 'Высокие горы, окутанные облаками и духовной энергией.', resources: [{ id: 2, name: 'Духовные камни', amount: 'Средне' }] },
        { id: 3, name: 'Город Восточного Ветра', type: 'city', x: 7, y: 5, description: 'Крупный город, центр торговли и культивации.', resources: [{ id: 3, name: 'Товары', amount: 'Много' }] },
        { id: 4, name: 'Озеро Отражений', type: 'water', x: 2, y: 6, description: 'Мистическое озеро, в котором отражаются звезды даже днем.', resources: [{ id: 4, name: 'Водные эссенции', amount: 'Много' }] },
        { id: 5, name: 'Пещера Тысячи Испытаний', type: 'dungeon', x: 8, y: 8, description: 'Древнее место испытаний для культиваторов.', resources: [{ id: 5, name: 'Сокровища', amount: 'Редко' }] }
      ];
      
      // Если получены только координаты, ищем полную информацию о локации
      let fullLocationInfo = locationPayload;
      if (locationPayload && locationPayload.x !== undefined && (!locationPayload.name || !locationPayload.type)) {
        // Поиск по координатам
        const matchedLocation = defaultLocations.find(
          loc => loc.x === locationPayload.x && loc.y === locationPayload.y
        );
        
        if (matchedLocation) {
          fullLocationInfo = {
            ...matchedLocation,
            ...locationPayload // Сохраняем все переданные данные
          };
          console.log(`🌍 Найдена полная информация о локации: ${fullLocationInfo.name}`);
        }
      }
      
      return {
        ...state,
        world: {
          ...state.world,
          currentLocation: fullLocationInfo,
        },
        player: {
          ...state.player,
          location: fullLocationInfo,
        },
      };
      
    case ACTION_TYPES.ADD_STATUS_EFFECT:
      console.log('Добавление эффекта:', action.payload);
      
      // Получаем текущие эффекты и конвертируем в массив, если это объект
      const currentEffects = normalizeStatusEffects(state.player.statusEffects);
      
      // Очищаем новый эффект от id и source
      const cleanNewEffect = cleanEffects([action.payload])[0];
      
      // Добавляем очищенный новый эффект
      const effectsWithNew = [...currentEffects, cleanNewEffect];
      
      // Получаем нормализованные бонусы секты, используя функцию из sectUtils
      const sectBenefits = collectAllSectBenefits(state.sect);
      
      // Создаем новый объект игрока с обновленными эффектами
      const playerWithNewEffect = {
        ...state.player,
        statusEffects: effectsWithNew
      };
      
      // Используем функцию комплексной нормализации из effectsNormalizer.js
      const normalizedPlayerWithNew = normalizePlayerEffects(playerWithNewEffect, state.sect);
      
      return {
        ...state,
        player: normalizedPlayerWithNew
      };
      
    case ACTION_TYPES.UPDATE_STATUS_EFFECT:
      console.log('Обновление эффекта:', action.payload);
      
      // Получаем текущие эффекты и конвертируем в массив
      const allEffects = normalizeStatusEffects(state.player.statusEffects);
      
      // Получаем тип эффекта, который нужно обновить
      const effectTypeToUpdate = action.payload.type;
      if (!effectTypeToUpdate) {
        console.error('Ошибка: тип эффекта не указан в обновлении', action.payload);
        return state;
      }
      
      // Создаем очищенную версию обновления
      const cleanUpdatePayload = cleanEffects([action.payload])[0];
      
      // Находим и обновляем эффект по типу вместо ID
      const updatedEffects = allEffects.map(effect => 
        effect.type === effectTypeToUpdate ? {...effect, ...cleanUpdatePayload} : effect
      );
      
      // Создаем новый объект игрока с обновленными эффектами
      const playerWithUpdatedEffect = {
        ...state.player,
        statusEffects: updatedEffects
      };
      
      // Используем функцию комплексной нормализации из effectsNormalizer.js
      const normalizedPlayerWithUpdated = normalizePlayerEffects(playerWithUpdatedEffect, state.sect);
      
      return {
        ...state,
        player: normalizedPlayerWithUpdated
      };
      
    case ACTION_TYPES.REMOVE_STATUS_EFFECT:
      // Теперь вместо ID передаем тип эффекта
      console.log('Удаление эффекта с типом:', action.payload);
      
      // Получаем текущие эффекты и конвертируем в массив
      const effectsArray = normalizeStatusEffects(state.player.statusEffects);
      
      // Определяем, что именно передано - ID или тип эффекта
      const isTypeProvided = typeof action.payload === 'string';
      
      // Удаляем эффект по типу или ID
      const filteredEffects = isTypeProvided 
        ? effectsArray.filter(effect => effect.type !== action.payload)
        : effectsArray.filter(effect => effect.id !== action.payload);
      
      // Создаем новый объект игрока с отфильтрованными эффектами
      const playerWithRemovedEffect = {
        ...state.player,
        statusEffects: filteredEffects
      };
      
      // Используем функцию комплексной нормализации из effectsNormalizer.js
      const normalizedPlayerWithRemoved = normalizePlayerEffects(playerWithRemovedEffect, state.sect);
      
      return {
        ...state,
        player: normalizedPlayerWithRemoved
      };
      
    // Действие для нормализации эффектов
    case ACTION_TYPES.NORMALIZE_EFFECTS:
      console.log('📊 Принудительная нормализация эффектов');
      
      // Используем функцию комплексной нормализации
      const normalizedPlayer = normalizePlayerEffects(state.player, state.sect);
      
      console.log('✅ Эффекты нормализованы:', normalizedPlayer.statusEffects);
      
      return {
        ...state,
        player: normalizedPlayer
      };
    
    case ACTION_TYPES.EQUIP_ITEM:
      console.log('▶️▶️▶️ ВЫЗОВ ДЕЙСТВИЯ ЭКИПИРОВКИ ПРЕДМЕТА ◀️◀️◀️');
      console.dir(action.payload);
      
      // СУПЕР ЖЕСТКИЙ КОСТЫЛЬ - ПРИНУДИТЕЛЬНАЯ БЛОКИРОВКА
      // Выводим информацию о предмете и его требованиях
      const itemToCheck = action.payload;
      if (itemToCheck && (itemToCheck.requirements || (itemToCheck.properties && itemToCheck.properties.requirements))) {
        console.log('🚫🚫🚫 ПРЕДМЕТ ИМЕЕТ ТРЕБОВАНИЯ - ПРОВЕРЯЕМ ИХ 🚫🚫🚫');
        
        // Определяем все требования
        const allReqs = itemToCheck.requirements || itemToCheck.properties?.requirements || {};
        console.log('ТРЕБОВАНИЯ ПРЕДМЕТА:', JSON.stringify(allReqs));
        
        // Получаем данные персонажа
        const playerData = {
          level: state.player.level || 1,
          stats: state.player.stats || {},
          // Добавляем прямой доступ к характеристикам
          strength: state.player.stats?.strength || 0,
          intellect: state.player.stats?.intellect || 0,
          agility: state.player.stats?.agility || 0,
          spirit: state.player.stats?.spirit || 0,
          health: state.player.stats?.health || 0
        };
        console.log('ДАННЫЕ ПЕРСОНАЖА:', JSON.stringify(playerData));
        
        let failedRequirements = [];
        
        // ИСПРАВЛЕНО! Проверяем требования для массива требований (форматы предметов могут отличаться)
        if (Array.isArray(allReqs)) {
          console.log('🚨 Требования в формате массива');
          
          // Перебираем все требования в массиве
          for (const req of allReqs) {
            const reqType = req.type?.toLowerCase();
            const reqValue = req.value || 0;
            
            // Проверка требования к уровню
            if (reqType === 'level') {
              console.log(`👉 Проверка требования уровня: ${reqValue} (требуется) vs ${playerData.level} (игрок)`);
              if (playerData.level < reqValue) {
                failedRequirements.push(`Требуемый уровень: ${reqValue}`);
                console.log(`❌ Требование уровня не выполнено: ${playerData.level} < ${reqValue}`);
              }
            }
            // Проверка требования к интеллекту
            else if (reqType === 'intelligence' || reqType === 'intellect') {
              console.log(`👉 Проверка требования интеллекта: ${reqValue} (требуется) vs ${playerData.intellect} (игрок)`);
              if (playerData.intellect < reqValue) {
                failedRequirements.push(`Требуемый интеллект: ${reqValue}`);
                console.log(`❌ Требование интеллекта не выполнено: ${playerData.intellect} < ${reqValue}`);
              }
            }
            // Проверка требования к восприятию
            else if (reqType === 'perception' || reqType === 'spirit') {
              console.log(`👉 Проверка требования восприятия: ${reqValue} (требуется) vs ${playerData.spirit} (игрок)`);
              if (playerData.spirit < reqValue) {
                failedRequirements.push(`Требуемое восприятие: ${reqValue}`);
                console.log(`❌ Требование восприятия не выполнено: ${playerData.spirit} < ${reqValue}`);
              }
            }
            // Проверка требования к силе
            else if (reqType === 'strength') {
              console.log(`👉 Проверка требования силы: ${reqValue} (требуется) vs ${playerData.strength} (игрок)`);
              if (playerData.strength < reqValue) {
                failedRequirements.push(`Требуемая сила: ${reqValue}`);
                console.log(`❌ Требование силы не выполнено: ${playerData.strength} < ${reqValue}`);
              }
            }
            // Проверка требования к ловкости
            else if (reqType === 'dexterity' || reqType === 'agility') {
              console.log(`👉 Проверка требования ловкости: ${reqValue} (требуется) vs ${playerData.agility} (игрок)`);
              if (playerData.agility < reqValue) {
                failedRequirements.push(`Требуемая ловкость: ${reqValue}`);
                console.log(`❌ Требование ловкости не выполнено: ${playerData.agility} < ${reqValue}`);
              }
            }
            // Проверка требования к здоровью
            else if (reqType === 'vitality' || reqType === 'health') {
              console.log(`👉 Проверка требования здоровья: ${reqValue} (требуется) vs ${playerData.health} (игрок)`);
              if (playerData.health < reqValue) {
                failedRequirements.push(`Требуемое здоровье: ${reqValue}`);
                console.log(`❌ Требование здоровья не выполнено: ${playerData.health} < ${reqValue}`);
              }
            }
          }
        }
        // Проверка для объектного формата требований
        else {
          console.log('🚨 Требования в формате объекта');
          
          // Проверка требования к уровню
          if (allReqs.level) {
            console.log(`👉 Проверка требования уровня: ${allReqs.level} (требуется) vs ${playerData.level} (игрок)`);
            if (playerData.level < allReqs.level) {
              failedRequirements.push(`Требуемый уровень: ${allReqs.level}`);
              console.log(`❌ Требование уровня не выполнено: ${playerData.level} < ${allReqs.level}`);
            }
          }
          
          // Проверка требования к силе
          if (allReqs.strength) {
            console.log(`👉 Проверка требования силы: ${allReqs.strength} (требуется) vs ${playerData.strength} (игрок)`);
            if (playerData.strength < allReqs.strength) {
              failedRequirements.push(`Требуемая сила: ${allReqs.strength}`);
              console.log(`❌ Требование силы не выполнено: ${playerData.strength} < ${allReqs.strength}`);
            }
          }
          
          // Проверка требования к интеллекту
          const reqIntellect = allReqs.intelligence || allReqs.intellect;
          if (reqIntellect) {
            console.log(`👉 Проверка требования интеллекта: ${reqIntellect} (требуется) vs ${playerData.intellect} (игрок)`);
            if (playerData.intellect < reqIntellect) {
              failedRequirements.push(`Требуемый интеллект: ${reqIntellect}`);
              console.log(`❌ Требование интеллекта не выполнено: ${playerData.intellect} < ${reqIntellect}`);
            }
          }
          
          // Проверка требования к ловкости
          const reqAgility = allReqs.dexterity || allReqs.agility;
          if (reqAgility) {
            console.log(`👉 Проверка требования ловкости: ${reqAgility} (требуется) vs ${playerData.agility} (игрок)`);
            if (playerData.agility < reqAgility) {
              failedRequirements.push(`Требуемая ловкость: ${reqAgility}`);
              console.log(`❌ Требование ловкости не выполнено: ${playerData.agility} < ${reqAgility}`);
            }
          }
          
          // Проверка требования к духу/восприятию
          const reqSpirit = allReqs.perception || allReqs.spirit;
          if (reqSpirit) {
            console.log(`👉 Проверка требования восприятия: ${reqSpirit} (требуется) vs ${playerData.spirit} (игрок)`);
            if (playerData.spirit < reqSpirit) {
              failedRequirements.push(`Требуемое восприятие: ${reqSpirit}`);
              console.log(`❌ Требование восприятия не выполнено: ${playerData.spirit} < ${reqSpirit}`);
            }
          }
          
          // Проверка требования к здоровью
          const reqHealth = allReqs.vitality || allReqs.health;
          if (reqHealth) {
            console.log(`👉 Проверка требования здоровья: ${reqHealth} (требуется) vs ${playerData.health} (игрок)`);
            if (playerData.health < reqHealth) {
              failedRequirements.push(`Требуемое здоровье: ${reqHealth}`);
              console.log(`❌ Требование здоровья не выполнено: ${playerData.health} < ${reqHealth}`);
            }
          }
        }
        
        // Проверяем, есть ли невыполненные требования
        if (failedRequirements.length > 0) {
          console.log('🛑🛑🛑 БЛОКИРОВКА ЭКИПИРОВКИ: Не все требования выполнены!');
          console.log('❌ НЕВЫПОЛНЕННЫЕ ТРЕБОВАНИЯ:', failedRequirements);
          
          // Показываем уведомление о невыполненных требованиях
          return {
            ...state,
            notifications: [
              ...(state.notifications || []),
              {
                id: Date.now(),
                message: `Невыполненные требования: ${failedRequirements.join(', ')}`,
                type: 'error'
              }
            ]
          };
        }
        
        console.log('✅✅✅ ВСЕ ТРЕБОВАНИЯ ВЫПОЛНЕНЫ, РАЗРЕШАЕМ ЭКИПИРОВКУ');
      }
      
      // Проверяем, что получили корректный предмет
      if (!action.payload || !action.payload.id) {
        console.error('Ошибка: некорректные данные для экипировки предмета', action.payload);
        return state;
      }
      
      // Объявляем переменную вне блока try, чтобы она была доступна после него
      let itemToEquip;
      
      try {
        // Убедимся, что предмет имеет предрассчитанные бонусы
        itemToEquip = ensureItemHasCalculatedBonuses(action.payload);
        
        // ПОСЛЕДНЯЯ ЛИНИЯ ЗАЩИТЫ: Еще раз проверяем требования предмета прямо здесь
        console.log('🔒 ПОСЛЕДНЯЯ ЛИНИЯ ЗАЩИТЫ: Проверка требований в редьюсере');
        
        // Проверяем, имеет ли предмет требования (используем другое имя переменной)
        const finalRequirements = itemToEquip.requirements ||
                              (itemToEquip.properties && itemToEquip.properties.requirements);
        
        if (finalRequirements && Object.keys(finalRequirements).length > 0) {
          console.log('🔒 Предмет имеет требования:', JSON.stringify(itemRequirements));
          
          // Создаем объект пользователя для проверки
          const userObj = {
            level: state.player.level || 1,
            cultivation: state.player.cultivation || {},
            stats: { ...(state.player.stats || {}) },
            strength: state.player.stats?.strength || 0,
            intellect: state.player.stats?.intellect || 0,
            agility: state.player.stats?.agility || 0,
            spirit: state.player.stats?.spirit || 0,
            health: state.player.stats?.health || 0,
            intelligence: state.player.stats?.intellect || 0,
            dexterity: state.player.stats?.agility || 0,
            perception: state.player.stats?.spirit || 0,
            vitality: state.player.stats?.health || 0
          };
          
          // Используем EquipmentService для проверки
          const checkResult = EquipmentService.checkItemRequirements(itemToEquip, userObj);
          
          console.log('🔒 Результат проверки в редьюсере:', JSON.stringify(checkResult));
          
          // Если требования не выполнены, возвращаем текущее состояние
          if (!checkResult.canEquip) {
            console.error('🔒 БЛОКИРОВКА ЭКИПИРОВКИ: Требования не выполнены:', checkResult.failedRequirements);
            return {
              ...state,
              notifications: [...(state.notifications || []), {
                id: Date.now(),
                message: `Требования не выполнены: ${checkResult.failedRequirements.join(', ')}`,
                type: 'error'
              }]
            };
          }
          
          console.log('🔒 Требования выполнены, продолжаем экипировку');
        }
        
        if (DEBUG_EQUIPMENT) {
          console.log('📋 ОТЛАДКА ЭКИПИРОВКИ:');
          console.log('📦 Предмет для экипировки:', JSON.stringify(itemToEquip, null, 2));
          console.log('🔄 Тип предмета:', itemToEquip.type);
          console.log('🔍 Требования предмета:', JSON.stringify(itemToEquip.requirements || (itemToEquip.properties && itemToEquip.properties.requirements), null, 2));
        }
        
        // Получаем требования предмета (используем другое имя переменной)
        const itemReqs = itemToEquip.requirements ||
                              (itemToEquip.properties && itemToEquip.properties.requirements);
        
        // Если у предмета есть требования, проверяем их выполнение
        if (itemReqs && Object.keys(itemReqs).length > 0) {
          if (DEBUG_EQUIPMENT) {
            console.log('⚠️ Предмет имеет требования, проверяем их выполнение...');
          }
          
          // Сначала создаем объект пользователя для проверки требований
          const userObj = {
            // Основные сведения
            level: state.player.level || 1,
            
            // ВАЖНО! Передаем данные культивации целиком
            cultivation: state.player.cultivation,
            
            // Добавляем все характеристики напрямую для совместимости
            // Используем РЕАЛЬНЫЕ имена характеристик из логов состояния
            strength: state.player.stats?.strength || 0,
            intellect: state.player.stats?.intellect || 0,
            agility: state.player.stats?.agility || 0,
            spirit: state.player.stats?.spirit || 0,
            health: state.player.stats?.health || 0,
            
            // Добавляем также альтернативные имена для совместимости
            intelligence: state.player.stats?.intellect || 0,
            dexterity: state.player.stats?.agility || 0,
            perception: state.player.stats?.spirit || 0,
            vitality: state.player.stats?.health || 0,
            
            // Включаем оригинальный объект stats
            stats: {
              ...state.player.stats,
              // И также добавляем альтернативные имена характеристик
              intelligence: state.player.stats?.intellect || 0,
              dexterity: state.player.stats?.agility || 0,
              perception: state.player.stats?.spirit || 0,
              vitality: state.player.stats?.health || 0
            }
          };
          
          if (DEBUG_EQUIPMENT) {
            console.log('👤 Характеристики персонажа:', JSON.stringify(userObj.stats, null, 2));
            console.log('📊 Уровень персонажа:', userObj.level);
            console.log('🌀 Культивация:', JSON.stringify(userObj.cultivation, null, 2));
          }
          
          // БОЛЬШЕ НЕ ПРОВЕРЯЕМ ЗДЕСЬ - вынесем проверку за пределы условия
          console.log('👤 Пользователь сформирован, готов к проверке требований');
        } else {
          // Даже если у предмета нет требований - всё равно проверим через сервис
          console.log('🔄 Предмет не имеет явных требований, но всё равно проверим');
        }
        
        // --- ПРИНУДИТЕЛЬНАЯ ПРОВЕРКА ТРЕБОВАНИЙ ВНЕ ЗАВИСИМОСТИ ОТ НАЛИЧИЯ ТРЕБОВАНИЙ ---
        // Создаем объект пользователя для проверки требований всегда
        // (даже если у предмета нет требований)
        const userObj = {
          level: state.player.level || 1,
          cultivation: state.player.cultivation || {},
          strength: state.player.stats?.strength || 0,
          intellect: state.player.stats?.intellect || 0,
          agility: state.player.stats?.agility || 0,
          spirit: state.player.stats?.spirit || 0,
          health: state.player.stats?.health || 0,
          intelligence: state.player.stats?.intellect || 0,
          dexterity: state.player.stats?.agility || 0,
          perception: state.player.stats?.spirit || 0,
          vitality: state.player.stats?.health || 0,
          stats: {
            ...state.player.stats,
            intelligence: state.player.stats?.intellect || 0,
            dexterity: state.player.stats?.agility || 0,
            perception: state.player.stats?.spirit || 0,
            vitality: state.player.stats?.health || 0
          }
        };
        
        // ПРИНУДИТЕЛЬНОЕ ЛОГИРОВАНИЕ
        console.log('🛑 ПРИНУДИТЕЛЬНАЯ ПРОВЕРКА ТРЕБОВАНИЙ ПРЕДМЕТА');
        console.log('🛑 Предмет:', itemToEquip?.name || itemToEquip?.id);
        console.log('🛑 Требования:', JSON.stringify(itemToEquip.requirements || (itemToEquip.properties && itemToEquip.properties.requirements)));
        
        // ВАЖНО! Используем ЯВНО импортированный EquipmentService, а не через require
        // Проверяем выполнение требований
        const checkResult = EquipmentService.checkItemRequirements(itemToEquip, userObj);
        
        // ПРИНУДИТЕЛЬНОЕ ЛОГИРОВАНИЕ результата
        console.log('🛑 РЕЗУЛЬТАТ ПРОВЕРКИ ТРЕБОВАНИЙ:', JSON.stringify(checkResult, null, 2));
        
        // Проверяем, что результат не undefined и не null
        if (!checkResult) {
          console.error('❌ ОШИБКА: checkItemRequirements вернул пустой результат');
          return state; // Возвращаем состояние без изменений
        }
        
        // Проверяем, может ли предмет быть экипирован
        if (!checkResult.canEquip) {
          console.log('❌ ПРЕДМЕТ НЕ СООТВЕТСТВУЕТ ТРЕБОВАНИЯМ:', checkResult.failedRequirements);
          // Выводим дополнительную информацию для отладки
          console.log('📊 Характеристики игрока:', JSON.stringify(userObj.stats, null, 2));
          console.log('📏 Уровень игрока:', userObj.level);
          return state; // Возвращаем состояние без изменений
        } else {
          console.log('✅ ПРЕДМЕТ СООТВЕТСТВУЕТ ТРЕБОВАНИЯМ, продолжаем экипировку');
        }
      } catch (error) {
        console.error('❌ Ошибка при проверке требований:', error);
        lastError = error;
        // В случае ошибки, разрешаем экипировку предмета
        // Это безопасный вариант для пользователя
      }
      
      // Если все проверки прошли успешно, и у нас есть действительный предмет для экипировки
      if (!itemToEquip) {
        console.error('❌ Ошибка: itemToEquip не определен после проверки требований');
        return state; // Возвращаем состояние без изменений
      }
      
      // Обновляем инвентарь, помечая предмет как экипированный
      const updatedInventoryItems = state.player.inventory.items.map(item => {
        // Помечаем экипируемый предмет
        if (item.id === itemToEquip.id) {
          return { ...item, equipped: true };
        }
        
        // Определяем тип брони для снятия других предметов того же типа
        if (item.type === 'armor' && itemToEquip.type === 'armor' && item.id !== itemToEquip.id && item.equipped) {
          // Получаем armorType для обоих предметов
          const itemArmorType = item.properties?.armorType || item.armorType;
          const newItemArmorType = itemToEquip.properties?.armorType || itemToEquip.armorType;
          
          // Если подтип брони не указан явно, определяем его по названию
          const getArmorTypeFromName = (name) => {
            if (!name) return 'body'; // По умолчанию
            name = name.toLowerCase();
            if (name.includes('шлем') || name.includes('шапка') || name.includes('капюшон')) {
              return 'head';
            } else if (name.includes('сапог') || name.includes('ботин') || name.includes('обувь')) {
              return 'legs';
            } else if (name.includes('перчат') || name.includes('рукав')) {
              return 'hands';
            } else {
              return 'body'; // По умолчанию
            }
          };
          
          // Определяем окончательный тип для каждого предмета
          const effectiveItemType = itemArmorType || getArmorTypeFromName(item.name);
          const effectiveNewItemType = newItemArmorType || getArmorTypeFromName(itemToEquip.name);
          
          console.log(`Сравнение типов брони: ${item.name} (${effectiveItemType}) и ${itemToEquip.name} (${effectiveNewItemType})`);
          
          // Только если типы совпадают (например, оба "head"), снимаем старый предмет
          if (effectiveItemType === effectiveNewItemType) {
            console.log(`Снимаем предмет ${item.name}, т.к. экипируем предмет того же типа (${effectiveNewItemType})`);
            return { ...item, equipped: false };
          }
          
          // Предметы разных подтипов (например, "head" и "legs") остаются экипированными
          return item;
        }
        
        // Если это оружие и уже экипировано другое оружие, снимаем его
        if (item.type === 'weapon' && itemToEquip.type === 'weapon' && item.id !== itemToEquip.id && item.equipped) {
          return { ...item, equipped: false };
        }
        
        // Для аксессуаров и артефактов особая логика - нужна информация о слоте
        if ((item.type === 'accessory' && itemToEquip.type === 'accessory') || 
            (item.type === 'artifact' && itemToEquip.type === 'artifact')) {
          // Здесь можно добавить логику выбора слота, если это требуется
          // Пока просто оставляем как есть, позволяя экипировать два аксессуара/артефакта
        }
        
        return item;
      });
      
      // Создаем обновленное состояние игрока
      const updatedPlayer = {
        ...state.player,
        inventory: {
          ...state.player.inventory,
          items: updatedInventoryItems
        }
      };
      
      // Находим все экипированные предметы для применения бонусов
      const equippedItems = {};
      updatedInventoryItems
        .filter(item => item.equipped)
        .forEach(item => {
          // Определяем слот для предмета
          let slot = null;
          
          switch(item.type) {
            case 'weapon':
              slot = 'weapon';
              break;
            case 'armor':
              const armorType = item.properties?.armorType || item.armorType;
              if (armorType === 'head') slot = 'headArmor';
              else if (armorType === 'body') slot = 'bodyArmor';
              else if (armorType === 'legs') slot = 'legArmor';
              else if (armorType === 'hands') slot = 'handArmor';
              else {
                // Определяем по названию, если тип не указан
                const name = item.name.toLowerCase();
                if (name.includes('шлем') || name.includes('шапка')) slot = 'headArmor';
                else if (name.includes('сапог') || name.includes('ботин')) slot = 'legArmor';
                else if (name.includes('перчат') || name.includes('рукав')) slot = 'handArmor';
                else slot = 'bodyArmor'; // По умолчанию - броня для тела
              }
              break;
            case 'accessory':
              // Находим первый пустой слот для аксессуара
              if (!equippedItems['accessory1']) slot = 'accessory1';
              else slot = 'accessory2';
              break;
            case 'artifact':
              // Находим первый пустой слот для артефакта
              if (!equippedItems['artifact1']) slot = 'artifact1';
              else slot = 'artifact2';
              break;
          }
          
          if (slot) {
            equippedItems[slot] = ensureItemHasCalculatedBonuses(item);
          }
        });
      
      // Применяем бонусы от экипировки
      console.log('Применение бонусов после экипировки:', equippedItems);
      
      // Вызываем обработчик APPLY_EQUIPMENT_BONUSES для применения бонусов
      const stateWithItem = {
        ...state,
        player: updatedPlayer
      };
      
      // Применяем бонусы экипировки напрямую
      const equipBonusesState = playerReducer(stateWithItem, { 
        type: ACTION_TYPES.APPLY_EQUIPMENT_BONUSES, 
        payload: equippedItems 
      });
      
      return equipBonusesState;
      
    case ACTION_TYPES.UNEQUIP_ITEM:
      console.log('Снятие предмета экипировки:', action.payload);
      
      // Проверяем, что получили корректный слот
      if (!action.payload) {
        console.error('Ошибка: не указан слот для снятия предмета');
        return state;
      }
      
      // Находим предмет в указанном слоте
      const slotToUnequip = action.payload;
      const itemsToUpdate = state.player.inventory.items.map(item => {
        // Используем логику определения слота аналогичную экипировке
        let itemSlot = null;
        
        if (item.equipped) {
          switch(item.type) {
            case 'weapon':
              itemSlot = 'weapon';
              break;
            case 'armor':
              const armorType = item.properties?.armorType || item.armorType;
              if (armorType === 'head') itemSlot = 'headArmor';
              else if (armorType === 'body') itemSlot = 'bodyArmor';
              else if (armorType === 'legs') itemSlot = 'legArmor';
              else if (armorType === 'hands') itemSlot = 'handArmor';
              else {
                // Определяем по названию, если тип не указан
                const name = item.name.toLowerCase();
                if (name.includes('шлем') || name.includes('шапка')) itemSlot = 'headArmor';
                else if (name.includes('сапог') || name.includes('ботин')) itemSlot = 'legArmor';
                else if (name.includes('перчат') || name.includes('рукав')) itemSlot = 'handArmor';
                else itemSlot = 'bodyArmor'; // По умолчанию - броня для тела
              }
              break;
            case 'accessory':
              // Определяем какой это аксессуар по порядку (первый или второй)
              const equippedAccessories = state.player.inventory.items.filter(
                i => i.equipped && i.type === 'accessory'
              );
              
              if (equippedAccessories.length === 1) {
                // Если только один аксессуар экипирован, он всегда в первом слоте
                if (slotToUnequip === 'accessory1') {
                  itemSlot = 'accessory1';
                }
              } else if (equippedAccessories.length >= 2) {
                // Если экипированы два аксессуара, находим этот в массиве
                const accessoryIndex = equippedAccessories.findIndex(a => a.id === item.id);
                
                // Первый аксессуар в слоте accessory1, второй в accessory2
                if (accessoryIndex === 0 && slotToUnequip === 'accessory1') {
                  itemSlot = 'accessory1';
                } else if (accessoryIndex === 1 && slotToUnequip === 'accessory2') {
                  itemSlot = 'accessory2';
                }
              }
              break;
            case 'artifact':
              // Аналогичная логика для артефактов
              const equippedArtifacts = state.player.inventory.items.filter(
                i => i.equipped && i.type === 'artifact'
              );
              
              if (equippedArtifacts.length === 1) {
                if (slotToUnequip === 'artifact1') {
                  itemSlot = 'artifact1';
                }
              } else if (equippedArtifacts.length >= 2) {
                const artifactIndex = equippedArtifacts.findIndex(a => a.id === item.id);
                
                if (artifactIndex === 0 && slotToUnequip === 'artifact1') {
                  itemSlot = 'artifact1';
                } else if (artifactIndex === 1 && slotToUnequip === 'artifact2') {
                  itemSlot = 'artifact2';
                }
              }
              break;
          }
          
          // Если это тот слот, который нужно снять
          if (itemSlot === slotToUnequip) {
            return { ...item, equipped: false };
          }
        }
        
        return item;
      });
      
      // Обновляем инвентарь
      const playerAfterUnequip = {
        ...state.player,
        inventory: {
          ...state.player.inventory,
          items: itemsToUpdate
        }
      };
      
      // Находим все экипированные предметы для применения бонусов
      const remainingEquippedItems = {};
      itemsToUpdate
        .filter(item => item.equipped)
        .forEach(item => {
          let slot = null;
          
          switch(item.type) {
            case 'weapon':
              slot = 'weapon';
              break;
            case 'armor':
              // Та же логика, что и выше
              const armorType = item.properties?.armorType || item.armorType;
              if (armorType === 'head') slot = 'headArmor';
              else if (armorType === 'body') slot = 'bodyArmor';
              else if (armorType === 'legs') slot = 'legArmor';
              else if (armorType === 'hands') slot = 'handArmor';
              else {
                const name = item.name.toLowerCase();
                if (name.includes('шлем') || name.includes('шапка')) slot = 'headArmor';
                else if (name.includes('сапог') || name.includes('ботин')) slot = 'legArmor';
                else if (name.includes('перчат') || name.includes('рукав')) slot = 'handArmor';
                else slot = 'bodyArmor';
              }
              break;
            case 'accessory':
              if (!remainingEquippedItems['accessory1']) slot = 'accessory1';
              else slot = 'accessory2';
              break;
            case 'artifact':
              if (!remainingEquippedItems['artifact1']) slot = 'artifact1';
              else slot = 'artifact2';
              break;
          }
          
          if (slot) {
            remainingEquippedItems[slot] = ensureItemHasCalculatedBonuses(item);
          }
        });
      
      // Применяем бонусы от оставшейся экипировки
      console.log('Применение бонусов после снятия предмета:', remainingEquippedItems);
      
      const stateAfterUnequip = {
        ...state,
        player: playerAfterUnequip
      };
      
      // Применяем бонусы экипировки напрямую
      const unequipBonusesState = playerReducer(stateAfterUnequip, { 
        type: ACTION_TYPES.APPLY_EQUIPMENT_BONUSES, 
        payload: remainingEquippedItems 
      });
      
      return unequipBonusesState;
      
    case ACTION_TYPES.APPLY_EQUIPMENT_BONUSES:
      console.log('Применение бонусов от экипировки:', action.payload);
      
      if (!action.payload || !Object.keys(action.payload).length) {
        console.log('Нет данных о экипировке для применения бонусов');
        return {
          ...state,
          player: {
            ...state.player,
            equipmentBonuses: {
              stats: {},
              combat: {},
              cultivation: {},
              elemental: {},
              special: []
            }
          }
        };
      }
      
      // Убедимся, что у всех предметов экипировки есть предрассчитанные бонусы
      const equippedItemsWithBonuses = ensureEquipmentHasCalculatedBonuses(action.payload);
      console.log('Экипировка с гарантированными бонусами:', equippedItemsWithBonuses);
      
      // Проверяем наличие предрассчитанных бонусов в предметах
      let equipmentBonuses;
      const hasPreCalculatedBonuses = Object.values(equippedItemsWithBonuses).some(
        item => item && item.calculatedBonuses
      );
      
      if (hasPreCalculatedBonuses) {
        console.log('✅ Используем предрассчитанные бонусы из предметов');
        
        // Объединяем все предрассчитанные бонусы
        equipmentBonuses = {
          stats: { strength: 0, dexterity: 0, vitality: 0, intelligence: 0, perception: 0, luck: 0 },
          combat: { physicalDamage: 0, magicDamage: 0, physicalDefense: 0, magicDefense: 0, critChance: 0, critDamage: 0, dodgeChance: 0 },
          cultivation: { energyMax: 0, energyRegen: 0, comprehensionRate: 0, breakthroughChance: 0 },
          elemental: { fire: 0, water: 0, earth: 0, air: 0, light: 0, dark: 0 },
          special: []
        };
        
        // Суммируем бонусы из всех предметов
        Object.values(action.payload).forEach(item => {
          if (!item || !item.calculatedBonuses) return;
          
          const bonuses = item.calculatedBonuses;
          
          // Суммируем базовые статы
          if (bonuses.stats) {
            Object.entries(bonuses.stats).forEach(([stat, value]) => {
              if (equipmentBonuses.stats[stat] !== undefined) {
                equipmentBonuses.stats[stat] += value;
              }
            });
          }
          
          // Суммируем боевые характеристики
          if (bonuses.combat) {
            Object.entries(bonuses.combat).forEach(([stat, value]) => {
              if (equipmentBonuses.combat[stat] !== undefined) {
                equipmentBonuses.combat[stat] += value;
              }
            });
          }
          
          // Суммируем параметры культивации
          if (bonuses.cultivation) {
            Object.entries(bonuses.cultivation).forEach(([stat, value]) => {
              if (equipmentBonuses.cultivation[stat] !== undefined) {
                equipmentBonuses.cultivation[stat] += value;
              }
            });
          }
          
          // Суммируем стихийные бонусы
          if (bonuses.elemental) {
            Object.entries(bonuses.elemental).forEach(([element, value]) => {
              if (equipmentBonuses.elemental[element] !== undefined) {
                equipmentBonuses.elemental[element] += value;
              }
            });
          }
          
          // Собираем особые эффекты
          if (bonuses.special && Array.isArray(bonuses.special)) {
            equipmentBonuses.special = [
              ...equipmentBonuses.special,
              ...bonuses.special
            ];
          }
        });
      } else {
        // Если нет предрассчитанных бонусов, используем BonusService
        console.log('⚠️ Предрассчитанные бонусы не найдены, используем BonusService');
        // ЭТОТ ВЫЗОВ БОЛЬШЕ НЕ БУДЕТ РАБОТАТЬ НАПРЯМУЮ ЗДЕСЬ
        // TODO: Перенести логику расчета бонусов экипировки в action creator (thunk),
        // который будет вызывать BonusServiceAPI.calculateAllBonuses
        // и диспатчить новое действие с результатом.
        // Пока что оставляем заглушку, чтобы избежать ошибки.
        console.warn('ТРЕБУЕТСЯ РЕФАКТОРИНГ: Расчет бонусов экипировки должен быть перенесен в action creator.');
        equipmentBonuses = {}; // Заглушка
      }
      
      console.log('Итоговые бонусы от экипировки:', equipmentBonuses);
      
      // ВАЖНО: НЕ изменяем основные характеристики игрока
      // Бонусы должны храниться отдельно и применяться только к вторичным характеристикам
      
      // Получаем текущие вторичные характеристики
      const baseSecondaryStats = CharacterStatsService.calculateSecondaryStats(
        state.player.stats, 
        state.player.cultivation
      );
      
      // Применяем бонусы от экипировки к вторичным характеристикам
      const secondaryWithBonuses = {
        ...baseSecondaryStats,
        // Применяем боевые бонусы
        physicalAttack: (baseSecondaryStats.physicalAttack || 0) + (equipmentBonuses.combat.physicalDamage || 0),
        magicalAttack: (baseSecondaryStats.magicalAttack || 0) + (equipmentBonuses.combat.magicDamage || 0),
        physicalDefense: (baseSecondaryStats.physicalDefense || 0) + (equipmentBonuses.combat.physicalDefense || 0),
        magicDefense: (baseSecondaryStats.magicDefense || 0) + (equipmentBonuses.combat.magicDefense || 0),
        critChance: (baseSecondaryStats.critChance || 0) + (equipmentBonuses.combat.critChance || 0),
        critDamage: (baseSecondaryStats.critDamage || 0) + (equipmentBonuses.combat.critDamage || 0),
        evasion: (baseSecondaryStats.evasion || 0) + (equipmentBonuses.combat.dodgeChance || 0)
      };
      
      console.log('Вторичные характеристики после применения бонусов:', secondaryWithBonuses);
      
      return {
        ...state,
        player: {
          ...state.player,
          // Сохраняем базовые статы без изменений
          // stats: state.player.stats, 
          // Применяем обновленные вторичные статы с бонусами
          secondaryStats: secondaryWithBonuses,
          // Сохраняем данные о бонусах для отображения в интерфейсе
          equipmentBonuses: equipmentBonuses
        }
      };
      
    case ACTION_TYPES.LEARN_TECHNIQUE:
      // Получаем технику из payload
      const technique = action.payload;
      
      // Проверяем, есть ли уже эта техника в списке изученных
      const existingTechnique = state.player.techniques.find(t => t.id === technique.id);
      
      if (existingTechnique) {
        // Если техника уже изучена, ничего не делаем
        return state;
      }
      
      // Вычитаем опыт и валюту
      const learnCost = technique.upgradeCost ? technique.upgradeCost(1) : { experience: 50, currency: 20 };
      const currentExperience = state.player.cultivation.experience || 0;
      const newExperience = Math.max(0, currentExperience - learnCost.experience);
      
      // Обновляем валюту
      const currentCurrency = state.player.inventory.currency || {};
      let learnCurrencyUpdate = { ...currentCurrency };
      
      // Обрабатываем разные типы валют
      if (typeof learnCost.currency === 'object') {
        // Если указаны конкретные типы валют
        Object.entries(learnCost.currency).forEach(([type, amount]) => {
          learnCurrencyUpdate[type] = (learnCurrencyUpdate[type] || 0) - amount;
        });
      } else {
        // Если указана просто общая стоимость, считаем как золото
        learnCurrencyUpdate.gold = (learnCurrencyUpdate.gold || 0) - learnCost.currency;
      }
      
      // Если техники нет в списке, добавляем её со всеми необходимыми данными
      console.log("Изучена новая техника:", technique);
      return {
        ...state,
        player: {
          ...state.player,
          techniques: [
            ...state.player.techniques,
            {
              id: technique.id,
              name: technique.name,
              description: technique.description,
              type: technique.type,
              icon: technique.icon,
              damage: technique.damage,
              damageType: technique.damageType,
              energyCost: technique.energyCost,
              cooldown: technique.cooldown,
              effects: technique.effects,
              level: 1,
              experience: 0,
              maxLevel: technique.maxLevel,
              requiredLevel: technique.requiredLevel,
              learnedAt: new Date().toISOString()
            }
          ],
          // Обновляем опыт
          cultivation: {
            ...state.player.cultivation,
            experience: newExperience
          },
          // Обновляем валюту
          inventory: {
            ...state.player.inventory,
            currency: learnCurrencyUpdate
          }
        }
      };
      
    case ACTION_TYPES.UPGRADE_TECHNIQUE:
      // Извлекаем ID техники и новые данные из payload
      const { techniqueId, cost } = action.payload;
      
      // Находим технику в списке изученных
      const techniqueToUpgrade = state.player.techniques.find(t => t.id === techniqueId);
      
      // Если техника не найдена или достигнут максимальный уровень, ничего не делаем
      if (!techniqueToUpgrade) {
        console.error(`Техника с ID ${techniqueId} не найдена и не может быть улучшена`);
        return state;
      }
      
      // Обновляем опыт
      const currentExp = state.player.cultivation.experience || 0;
      const updatedExperience = Math.max(0, currentExp - cost.experience);
      
      // Обновляем валюту
      const currentCurr = state.player.inventory.currency || {};
      let upgradeCurrencyUpdate = { ...currentCurr };
      
      // Обрабатываем разные типы валют
      if (typeof cost.currency === 'object') {
        // Если указаны конкретные типы валют
        Object.entries(cost.currency).forEach(([type, amount]) => {
          upgradeCurrencyUpdate[type] = (upgradeCurrencyUpdate[type] || 0) - amount;
        });
      } else {
        // Если указана просто общая стоимость, считаем как золото
        upgradeCurrencyUpdate.gold = (upgradeCurrencyUpdate.gold || 0) - cost.currency;
      }
      
      // Получаем данные об исходной технике из импорта
      const { getTechniqueById } = require('../../data/techniques');
      
      // Находим базовые данные о технике
      const baseTechnique = getTechniqueById(techniqueId);
      console.log("Базовая техника для апгрейда:", baseTechnique);
      
      // Обновляем уровень техники и все зависящие от уровня параметры
      const updatedTechniques = state.player.techniques.map(t => {
        if (t.id === techniqueId) {
          // Рассчитываем новые значения, зависящие от уровня
          const newLevel = t.level + 1;
          const levelMultiplier = 1 + (newLevel - 1) * 0.2; // +20% за каждый уровень
          
          // Увеличиваем урон и другие параметры в соответствии с уровнем
          const updatedTechnique = {
            ...t,
            level: newLevel,
            // Увеличиваем параметры если они существуют
            damage: t.damage ? Math.floor(t.damage * levelMultiplier) : t.damage,
            healing: t.healing ? Math.floor(t.healing * levelMultiplier) : t.healing,
            energyCost: t.energyCost ? Math.floor(t.energyCost * (1 + (newLevel - 1) * 0.1)) : t.energyCost,
          };
          
          // Обновляем эффекты если они есть
          if (t.effects && Array.isArray(t.effects)) {
            updatedTechnique.effects = t.effects.map(effect => {
              const updatedEffect = { ...effect };
              
              // Увеличиваем урон эффекта если он есть
              if (updatedEffect.damage) {
                updatedEffect.damage = Math.floor(updatedEffect.damage * levelMultiplier);
              }
              
              // Увеличиваем исцеление эффекта если оно есть
              if (updatedEffect.healing) {
                updatedEffect.healing = Math.floor(updatedEffect.healing * levelMultiplier);
              }
              
              // Можно добавить и другие параметры, зависящие от уровня
              
              return updatedEffect;
            });
          }
          
          console.log("Обновлена техника:", updatedTechnique);
          return updatedTechnique;
        }
        return t;
      });
      
      return {
        ...state,
        player: {
          ...state.player,
          techniques: updatedTechniques,
          // Обновляем опыт
          cultivation: {
            ...state.player.cultivation,
            experience: updatedExperience
          },
          // Обновляем валюту
          inventory: {
            ...state.player.inventory,
            currency: upgradeCurrencyUpdate
          }
        }
      };
    
    case ACTION_TYPES.UPDATE_RELATIONSHIP:
      const character = action.payload;
      
      // Дефолтные данные отношений (скопированы из SocialTab.js)
      const defaultRelationships = [
        { id: 1, name: 'Мастер Ли', role: 'Наставник', level: 80, events: ['Вы получили урок от Мастера Ли', 'Мастер Ли похвалил ваш прогресс'] },
        { id: 2, name: 'Старейшина Чжан', role: 'Старейшина секты', level: 60, events: ['Вы помогли Старейшине Чжану собрать травы'] },
        { id: 3, name: 'Ученик Ван', role: 'Соученик', level: 45, events: ['Вы тренировались вместе с Ваном', 'Вы одолжили Вану духовный камень'] },
        { id: 4, name: 'Ученица Мэй', role: 'Соученица', level: 40, events: ['Мэй поделилась с вами техникой культивации'] },
        { id: 5, name: 'Торговец Чен', role: 'Торговец', level: 30, events: ['Вы купили товары у Чена', 'Чен дал вам скидку'] },
        { id: 6, name: 'Глава клана Сюй', role: 'Глава враждебного клана', level: 10, events: ['Глава клана Сюй угрожал вам', 'Вы избежали ловушки клана Сюй'] }
      ];
      
      // Проверяем, существует ли relationships как объект или массив
      let relationships = state.player.relationships || [...defaultRelationships];
      
      // Преобразуем объект в массив, если он является объектом
      if (!Array.isArray(relationships)) {
        // Если это объект с IDшниками в качестве ключей, преобразуем его в массив
        relationships = Object.values(relationships);
      }
      
      // Ищем персонажа по ID
      const existingCharIndex = relationships.findIndex(rel => rel.id === character.id);
      
      let updatedRelationships;
      if (existingCharIndex !== -1) {
        // Обновляем существующий
        updatedRelationships = [...relationships];
        updatedRelationships[existingCharIndex] = character;
      } else {
        // Добавляем нового
        updatedRelationships = [...relationships, character];
      }
      
      console.log(`Обновлены отношения с ${character.name} до уровня ${character.level}`);
      
      // Обновляем relationships в двух местах для обратной совместимости:
      // 1. В player.relationships (откуда их считывает SocialTab.js)
      // 2. В player.social.relationships (согласно структуре initialState.js)
      // Проверяем существование social перед обновлением
      const social = state.player.social || {};
      
      return {
        ...state,
        player: {
          ...state.player,
          relationships: updatedRelationships,
          social: {
            ...social,
            relationships: updatedRelationships
          }
        }
      };
    
    case 'UPDATE_SOCIAL_FRIENDS':
      console.log('Обновление списка друзей:', action.payload);
      
      // Проверяем payload
      if (!Array.isArray(action.payload)) {
        console.error('Ошибка: payload не является массивом:', action.payload);
        return state;
      }
      
      // Проверяем существование social перед обновлением
      const socialObj = state.player.social || {};
      
      return {
        ...state,
        player: {
          ...state.player,
          social: {
            ...socialObj,
            friends: action.payload
          }
        }
      };
    
    case ACTION_TYPES.REPAIR_TECHNIQUES:
      console.log('🔧 Запущен процесс восстановления техник');
      
      // Проверяем, есть ли у нас массив техник для восстановления
      if (!Array.isArray(state.player.techniques) || state.player.techniques.length === 0) {
        console.log('🔧 Нет техник для восстановления');
        return state;
      }
      
      // Восстанавливаем техники, беря данные из определений в techniques.js
      try {
        // Получаем базовые определения техник
        const { techniques } = require('../../data/techniques');
        
        // Для каждой техники игрока ищем соответствующее базовое определение
        const repairedTechniques = state.player.techniques.map(playerTechnique => {
          // Сохраняем важные игровые данные
          const level = playerTechnique.level || 1;
          const experience = playerTechnique.experience || 0;
          const masteryLevel = playerTechnique.masteryLevel || 0;
          const lastUsed = playerTechnique.lastUsed || null;
          const id = playerTechnique.id;
          
          // Ищем базовое определение техники
          const baseTechnique = techniques.find(t => t.id === id);
          
          if (!baseTechnique) {
            console.warn(`⚠️ Не найдено базовое определение для техники с ID: ${id}`);
            return playerTechnique; // Если не нашли - возвращаем оригинал
          }
          
          // Вычисляем множитель урона на основе уровня
          const levelMultiplier = 1 + (level - 1) * 0.2;
          
          // Создаем восстановленную технику с полными данными
          const repairedTechnique = {
            ...baseTechnique,
            id,
            level,
            experience,
            masteryLevel,
            lastUsed,
            // Масштабируем параметры в соответствии с уровнем
            damage: Math.floor((baseTechnique.damage || 0) * levelMultiplier),
            healing: Math.floor((baseTechnique.healing || 0) * levelMultiplier),
            energyCost: Math.floor((baseTechnique.energyCost || 10) * (1 + (level - 1) * 0.1))
          };
          
          console.log(`✅ Восстановлена техника ${repairedTechnique.name} (ID: ${id}, Урон: ${repairedTechnique.damage})`);
          return repairedTechnique;
        });
        
        console.log(`🔧 Восстановлено ${repairedTechniques.length} техник`);
        
        // Сохраняем состояние с восстановленными техниками
        try {
          // Сохраняем обновленное состояние в localStorage вместе с восстановленными техниками
          const updatedState = {
            ...state,
            player: {
              ...state.player,
              techniques: repairedTechniques
            }
          };
          
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('gameState', JSON.stringify(updatedState));
            console.log('💾 Состояние с восстановленными техниками сохранено в localStorage');
          }
        } catch (saveError) {
          console.error('❌ Ошибка при сохранении состояния:', saveError);
        }
        
        // Возвращаем обновленное состояние
        return {
          ...state,
          player: {
            ...state.player,
            techniques: repairedTechniques
          }
        };
      } catch (error) {
        console.error('❌ Ошибка при восстановлении техник:', error);
        return state; // В случае ошибки возвращаем исходное состояние
      }
    
    case ACTION_TYPES.UPDATE_COMBAT_STATE: {
      return {
        ...state,
        combat: {
          ...state.combat,
          ...action.payload
        }
      };
    }
    
    case ACTION_TYPES.USE_TECHNIQUE: {
      const { techniqueId } = action.payload;
      console.log(`🔄 Использование техники с ID: ${techniqueId}`);
      
      // Находим технику в списке
      const techniqueIndex = state.player.techniques.findIndex(t => t.id === techniqueId);
      
      if (techniqueIndex === -1) {
        console.error(`❌ Техника с ID ${techniqueId} не найдена`);
        return state;
      }
      
      // Обновляем время последнего использования и опыт техники
      const updatedTechniques = [...state.player.techniques];
      const technique = updatedTechniques[techniqueIndex];
      
      // Обновляем lastUsed и experience
      updatedTechniques[techniqueIndex] = {
        ...technique,
        lastUsed: new Date().toISOString(),
        experience: (technique.experience || 0) + 1
      };
      
      // Проверяем, достигнут ли порог опыта для повышения мастерства
      const masteryThreshold = 100 * ((technique.masteryLevel || 0) + 1);
      if ((updatedTechniques[techniqueIndex].experience || 0) >= masteryThreshold) {
        updatedTechniques[techniqueIndex].masteryLevel = (updatedTechniques[techniqueIndex].masteryLevel || 0) + 1;
        updatedTechniques[techniqueIndex].experience -= masteryThreshold;
        
        console.log(`🌟 Повышен уровень мастерства техники ${technique.name} до ${updatedTechniques[techniqueIndex].masteryLevel}`);
      }
      
      // Обновляем состояние с новыми техниками
      const newState = {
        ...state,
        player: {
          ...state.player,
          techniques: updatedTechniques
        }
      };
      
      // Запускаем автосохранение после использования техники
      try {
        // Используем localStorage напрямую для сохранения полного состояния
        localStorage.setItem('gameState', JSON.stringify(newState));
        console.log('💾 Автосохранение после использования техники выполнено');
      } catch (error) {
        console.error('❌ Ошибка при автосохранении после использования техники:', error);
      }
      
      return newState;
    }
    
    case ACTION_TYPES.ADD_COMBAT_HISTORY: {
      console.log('📝 Добавление записи в историю боев:', action.payload);
      
      // Проверяем, что получили корректные данные
      if (!action.payload || typeof action.payload !== 'object') {
        console.error('❌ Некорректные данные для добавления в историю боев:', action.payload);
        return state;
      }
      
      // Получаем текущую историю боев или создаем пустой массив, если ее нет
      const currentHistory = Array.isArray(state.player.combatHistory) 
        ? state.player.combatHistory 
        : [];
      
      // Добавляем новую запись в начало массива (чтобы последние бои были сверху)
      const updatedHistory = [
        {
          ...action.payload,
          timestamp: action.payload.timestamp || Date.now() // Добавляем timestamp, если его нет
        },
        ...currentHistory
      ];
      
      // Ограничиваем размер истории до 50 записей, чтобы не перегружать хранилище
      const limitedHistory = updatedHistory.slice(0, 50);
      
      console.log(`📊 История боев обновлена: ${limitedHistory.length} записей`);
      
      // Запускаем автосохранение после добавления записи в историю боев
      try {
        const newState = {
          ...state,
          player: {
            ...state.player,
            combatHistory: limitedHistory
          }
        };
        
        localStorage.setItem('gameState', JSON.stringify(newState));
        console.log('💾 Автосохранение после обновления истории боев выполнено');
        
        return newState;
      } catch (error) {
        console.error('❌ Ошибка при автосохранении после обновления истории боев:', error);
        
        // Возвращаем обновленное состояние даже при ошибке сохранения
        return {
          ...state,
          player: {
            ...state.player,
            combatHistory: limitedHistory
          }
        };
      }
    }
    
    // Синхронизация лояльности секты с социальными отношениями
    case ACTION_TYPES.SYNC_SECT_TO_SOCIAL: {
      console.log('🔄 Синхронизация лояльности секты с социальными отношениями');
      
      if (!state.sect || !state.sect.sect) {
        console.warn('⚠️ Невозможно синхронизировать: данные о секте отсутствуют или неполные');
        return state;
      }

      // В этой версии не используем лояльность секты, работаем только с членами секты
      
      // Используем утилиту синхронизации
      const updatedRelationships = syncSectRelationshipToSocial(
        state.player.relationships || [],
        state.sect.sect,
        sectLoyalty
      );
      
      console.log(`✅ Обновлены социальные отношения на основе лояльности секты (${sectLoyalty})`);
      
      // Обновляем social и relationships
      const updatedSocial = state.player.social || {};
      
      return {
        ...state,
        player: {
          ...state.player,
          relationships: updatedRelationships,
          social: {
            ...updatedSocial,
            relationships: updatedRelationships
          }
        }
      };
    }
    
    // Синхронизация социальных отношений с лояльностью секты
    case ACTION_TYPES.SYNC_SOCIAL_TO_SECT: {
      console.log('🔄 Синхронизация социальных отношений с лояльностью секты');
      
      if (!state.player.relationships && (!state.player.social || !state.player.social.relationships)) {
        console.warn('⚠️ Невозможно синхронизировать: данные о социальных отношениях отсутствуют');
        return state;
      }
      
      // Получаем отношения из правильного места (предпочитаем player.relationships)
      const relationships = state.player.relationships || 
                          (state.player.social && state.player.social.relationships) || 
                          [];
      
      // Используем утилиту синхронизации для получения нового значения лояльности
      const newLoyalty = syncSocialToSectRelationship(relationships, state.sect && state.sect.sect);
      
      // Проверяем, нужно ли обновлять лояльность
      if (newLoyalty === null || newLoyalty === undefined) {
        console.warn('⚠️ Не удалось рассчитать новое значение лояльности секты');
        return state;
      }
      
      console.log(`✅ Рассчитана лояльность секты (${newLoyalty}) на основе социальных отношений`);
      
      // Возвращаем обновленное состояние без фактического изменения
      // Фактическое обновление должно происходить через отдельное действие UPDATE_SECT_LOYALTY
      return {
        ...state,
        calculatedSectLoyalty: newLoyalty // Временное хранение для последующего обновления
      };
    }
    
    // Обработчик для обновления социальных отношений (используется sectRelationshipSyncer.js)
    case ACTION_TYPES.UPDATE_SOCIAL_RELATIONSHIPS: {
      console.log('🔄 Обновление социальных отношений');
      
      if (!action.payload || !Array.isArray(action.payload)) {
        console.warn('⚠️ Невозможно обновить: неверный формат данных о социальных отношениях');
        return state;
      }
      
      console.log(`✅ Обновлены социальные отношения (${action.payload.length} записей)`);
      
      // Обновляем social и relationships
      return {
        ...state,
        player: {
          ...state.player,
          relationships: action.payload,
          social: {
            ...(state.player.social || {}),
            relationships: action.payload
          }
        }
      };
    }
    
    // Обработчик для одновременного обновления отношений и лояльности
    case ACTION_TYPES.UPDATE_RELATIONSHIP_AND_LOYALTY: {
      console.log('🔄 Одновременное обновление отношений и лояльности');
      
      if (!action.payload || !action.payload.name || action.payload.value === undefined) {
        console.warn('⚠️ Невозможно обновить: неполные данные', action.payload);
        return state;
      }
      
      const { name, value } = action.payload;
      console.log(`📊 Обновление отношений с "${name}" до уровня ${value}`);
      
      // Используем функцию для прямого обновления обоих значений
      const updatedState = updateRelationshipAndLoyalty(state, name, value);
      
      return updatedState;
    }
      
    // Обработчики для обогащения предметов данными из БД
    case ACTION_TYPES.ENRICH_ITEM_REQUEST:
      console.log(`[ENRICH] Запрос на обогащение предмета: ${action.payload.itemId}`);
      return state; // Состояние не меняется при запросе
    
    case ACTION_TYPES.ENRICH_ITEM_SUCCESS:
      console.log(`[ENRICH] ========== НАЧАЛО ОБОГАЩЕНИЯ ПРЕДМЕТА В REDUX: ${action.payload.itemId} ==========`);
      console.log(`[ENRICH] Данные для обогащения:`, JSON.stringify(action.payload, null, 2));
      
      // Проверяем, если это только обновление флага enriched
      if (action.payload.updateFlagOnly === true) {
        console.log(`[ENRICH] Запрос на обновление только флага enriched для предмета ${action.payload.itemId}`);
        
        // Ищем предмет в инвентаре
        let itemToUpdateIndex = state.player.inventory.items.findIndex(
          item => item.id === action.payload.itemId || String(item.id) === String(action.payload.itemId)
        );
        
        if (itemToUpdateIndex === -1) {
          console.warn(`[ENRICH] ⚠️ Предмет ${action.payload.itemId} для обновления флага не найден`);
          return state;
        }
        
        // Создаем новый массив предметов
        const updatedItems = [...state.player.inventory.items];
        
        // Обновляем только флаг enriched
        updatedItems[itemToUpdateIndex] = {
          ...updatedItems[itemToUpdateIndex],
          enriched: true
        };
        
        console.log(`[ENRICH] ✅ Флаг enriched обновлен для предмета ${action.payload.itemId}`);
        
        return {
          ...state,
          player: {
            ...state.player,
            inventory: {
              ...state.player.inventory,
              items: updatedItems
            }
          }
        };
      }
      
      // Если данные загружены из кеша, можно применить их сразу
      if (action.payload.fromCache === true && action.payload.itemDetails) {
        console.log(`[ENRICH] Применение кешированных данных для предмета ${action.payload.itemId}`);
        
        // Ищем предмет в инвентаре
        let itemToUpdateIndex = state.player.inventory.items.findIndex(
          item => item.id === action.payload.itemId || String(item.id) === String(action.payload.itemId)
        );
        
        if (itemToUpdateIndex === -1) {
          console.warn(`[ENRICH] ⚠️ Предмет ${action.payload.itemId} для обновления из кеша не найден`);
          return state;
        }
        
        // Получаем текущий предмет и данные для обогащения
        const currentItem = state.player.inventory.items[itemToUpdateIndex];
        const cachedItem = action.payload.itemDetails;
        
        // Создаем новый массив предметов
        const updatedItems = [...state.player.inventory.items];
        
        // Обновляем предмет с кешированными данными
        updatedItems[itemToUpdateIndex] = {
          ...currentItem,
          ...cachedItem,
          enriched: true
        };
        
        console.log(`[ENRICH] ✅ Предмет ${action.payload.itemId} обновлен из кеша`);
        
        return {
          ...state,
          player: {
            ...state.player,
            inventory: {
              ...state.player.inventory,
              items: updatedItems
            }
          }
        };
      }
      
      // Логируем текущие предметы в инвентаре для отладки
      console.log(`[ENRICH] Текущие предметы в инвентаре:`);
      state.player.inventory.items.forEach((item, index) => {
        console.log(`[ENRICH] ${index}: ${item.name} (ID: ${item.id || 'нет ID'}, тип: ${item.type || 'нет типа'})`);
      });
      
      // Пытаемся найти предмет различными способами
      let itemToEnrichIndex = -1;
      
      // 1. Сначала ищем точное совпадение по id
      itemToEnrichIndex = state.player.inventory.items.findIndex(
        item => item.id === action.payload.itemId
      );
      
      console.log(`[ENRICH] Поиск предмета по id '${action.payload.itemId}'. Найден индекс: ${itemToEnrichIndex}`);
      
      // 2. Если не нашли, пробуем искать по строковому представлению
      if (itemToEnrichIndex === -1) {
        const searchId = String(action.payload.itemId);
        itemToEnrichIndex = state.player.inventory.items.findIndex(
          item => String(item.id) === searchId
        );
        if (itemToEnrichIndex !== -1) {
          console.log(`[ENRICH] Найдено совпадение по строковому ID: ${searchId}`);
        }
      }
      
      // 3. Если всё ещё не нашли, попробуем поискать по имени предмета
      if (itemToEnrichIndex === -1 && action.payload.itemDetails && action.payload.itemDetails.name) {
        const searchName = action.payload.itemDetails.name;
        itemToEnrichIndex = state.player.inventory.items.findIndex(
          item => item.name === searchName
        );
        if (itemToEnrichIndex !== -1) {
          console.log(`[ENRICH] Найдено совпадение по имени предмета: ${searchName}`);
        }
      }
      
      // Дополнительный поиск - по коду предмета (для случаев, когда id=bronze_sword)
      if (itemToEnrichIndex === -1) {
        // Проверяем, есть ли в наборе предметов предмет с id, который соответствует
        // строковому коду, связанному с itemId
        const itemsWithMatchingIds = state.player.inventory.items
          .map((item, idx) => ({ item, idx }))
          .filter(({ item }) => item.id && typeof item.id === 'string');
        
        console.log(`[ENRICH] Доступные предметы для поиска по коду:`,
          itemsWithMatchingIds.map(({ item, idx }) => `${idx}: ${item.id} - ${item.name}`));
        
        // Ищем похожие предметы для диагностики
        const similarItems = itemsWithMatchingIds.filter(({ item }) =>
          item.id.includes(String(action.payload.itemId)) ||
          String(action.payload.itemId).includes(item.id));
        
        if (similarItems.length > 0) {
          console.log(`[ENRICH] Найдены похожие предметы:`,
            similarItems.map(({ item, idx }) => `${idx}: ${item.id} - ${item.name}`));
          
          // Берем первый похожий предмет
          itemToEnrichIndex = similarItems[0].idx;
          console.log(`[ENRICH] Используем похожий предмет с индексом ${itemToEnrichIndex}`);
        }
      }
      
      // Если предмет не найден ни одним из способов, возвращаем состояние без изменений
      if (itemToEnrichIndex === -1) {
        console.warn(`[ENRICH] ⚠️ Предмет для обогащения не найден: ${action.payload.itemId}`);
        console.warn(`[ENRICH] Детали предмета:`, JSON.stringify(action.payload.itemDetails, null, 2));
        return state;
      }
      
      console.log(`[ENRICH] ✅ Найден предмет для обогащения на позиции ${itemToEnrichIndex}`);
      
      // Проверяем, что предмет не обогащен перед обновлением
      const currentItem = state.player.inventory.items[itemToEnrichIndex];
      
      if (currentItem.enriched === true) {
        console.log(`[ENRICH] ℹ️ Предмет ${action.payload.itemId} уже обогащен, пропускаем`);
        return state;
      }
      
      // Получаем данные для обогащения
      const enrichData = action.payload.itemDetails;
      
      if (!enrichData) {
        console.warn(`[ENRICH] ⚠️ Отсутствуют данные для обогащения предмета ${action.payload.itemId}`);
        return state;
      }
      
      // Логируем исходную структуру предмета для диагностики
      console.log(`[ENRICH] Исходная структура предмета:`, JSON.stringify(
        Object.keys(currentItem).sort().reduce((obj, key) => {
          obj[key] = Array.isArray(currentItem[key]) ?
            `Array(${currentItem[key].length})` :
            (typeof currentItem[key] === 'object' ? '{Object}' : currentItem[key]);
          return obj;
        }, {})
      , null, 2));
      
      console.log(`[ENRICH] Текущий предмет:`, JSON.stringify(currentItem, null, 2));
      console.log(`[ENRICH] Данные обогащения:`, JSON.stringify(enrichData, null, 2));
      
      // Обновляем предмет с данными из БД
      const enrichedItems = [...state.player.inventory.items];
      
      // Начинаем с текущего объекта предмета
      const enrichedItem = { ...currentItem };
      
      // Базовые поля обновляем только если они существуют в данных, с использованием дефолтных значений
      if (enrichData.name) enrichedItem.name = enrichData.name;
      if (enrichData.description) enrichedItem.description = enrichData.description;
      if (enrichData.type) enrichedItem.type = enrichData.type;
      if (enrichData.rarity) enrichedItem.rarity = enrichData.rarity;
      if (enrichData.icon) enrichedItem.icon = enrichData.icon;
      
      // Новые поля добавляем только если они существуют в данных
      if (enrichData.base_price !== undefined) enrichedItem.basePrice = enrichData.base_price;
      if (enrichData.armor_type) enrichedItem.armorType = enrichData.armor_type;
      if (enrichData.set_id) enrichedItem.setId = enrichData.set_id;
      
      // Массивы добавляем только если они существуют и не пусты
      if (enrichData.effects && Array.isArray(enrichData.effects) && enrichData.effects.length > 0) {
        enrichedItem.effects = enrichData.effects;
        console.log(`[ENRICH] Добавлено ${enrichData.effects.length} эффектов`);
      } else {
        // Удаляем поле effects, если оно существовало раньше (для случаев повторного обогащения)
        delete enrichedItem.effects;
        console.log(`[ENRICH] Эффекты отсутствуют, поле не добавлено или удалено`);
      }
      
      if (enrichData.requirements && Array.isArray(enrichData.requirements) && enrichData.requirements.length > 0) {
        enrichedItem.requirements = enrichData.requirements;
        console.log(`[ENRICH] Добавлено ${enrichData.requirements.length} требований`);
      } else {
        delete enrichedItem.requirements;
        console.log(`[ENRICH] Требования отсутствуют, поле не добавлено или удалено`);
      }
      
      if (enrichData.specialEffects && Array.isArray(enrichData.specialEffects) && enrichData.specialEffects.length > 0) {
        enrichedItem.specialEffects = enrichData.specialEffects;
        console.log(`[ENRICH] Добавлено ${enrichData.specialEffects.length} специальных эффектов`);
      } else {
        delete enrichedItem.specialEffects;
        console.log(`[ENRICH] Специальные эффекты отсутствуют, поле не добавлено или удалено`);
      }
      
      // Обязательные поля для отслеживания статуса обогащения
      enrichedItem.enriched = true;
      enrichedItem.enrichedAt = Date.now();
      
      // Логируем итоговую структуру предмета для диагностики
      console.log(`[ENRICH] Итоговая структура предмета:`, JSON.stringify(
        Object.keys(enrichedItem).sort().reduce((obj, key) => {
          obj[key] = Array.isArray(enrichedItem[key]) ?
            `Array(${enrichedItem[key].length})` :
            (typeof enrichedItem[key] === 'object' ? '{Object}' : enrichedItem[key]);
          return obj;
        }, {})
      , null, 2));
      
      // Применяем обновленный объект
      enrichedItems[itemToEnrichIndex] = enrichedItem;
      
      console.log(`[ENRICH] ✅ Предмет успешно обогащен:`, JSON.stringify({
        id: enrichedItems[itemToEnrichIndex].id,
        name: enrichedItems[itemToEnrichIndex].name,
        type: enrichedItems[itemToEnrichIndex].type,
        effects: enrichedItems[itemToEnrichIndex].effects?.length || 0,
        enriched: enrichedItems[itemToEnrichIndex].enriched
      }, null, 2));
      
      const updatedState = {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...state.player.inventory,
            items: enrichedItems
          }
        }
      };
      
      console.log(`[ENRICH] ========== ЗАВЕРШЕНИЕ ОБОГАЩЕНИЯ ПРЕДМЕТА ${action.payload.itemId} (${enrichedItems[itemToEnrichIndex].id}) ==========`);
      
      // Сохраняем обогащенный предмет в localStorage для кеширования
      try {
        const cacheKey = `enriched_${action.payload.itemId}`;
        localStorage.setItem(cacheKey, JSON.stringify(enrichedItems[itemToEnrichIndex]));
        console.log(`[ENRICH] 💾 Обогащенный предмет сохранен в localStorage: ${cacheKey}`);
      } catch (error) {
        console.error(`[ENRICH] Ошибка при сохранении в localStorage:`, error);
      }
      
      return updatedState;
    
    case ACTION_TYPES.ENRICH_ITEM_FAILURE:
      console.warn(`[ENRICH] ❌ Ошибка при обогащении предмета: ${action.payload.itemId}`, action.payload.error);
      console.warn(`[ENRICH] Стек вызовов:`, new Error().stack);
      
      // Дополнительная диагностика для поиска предмета с таким ID
      console.log(`[ENRICH] Поиск предмета с ID '${action.payload.itemId}' для диагностики...`);
      const matchingItems = state.player.inventory.items
        .filter(item => item.id && (
          item.id === action.payload.itemId ||
          String(item.id).includes(String(action.payload.itemId)) ||
          String(action.payload.itemId).includes(String(item.id))
        ))
        .map(item => ({ id: item.id, name: item.name }));
      
      if (matchingItems.length > 0) {
        console.log(`[ENRICH] Найдены похожие предметы:`, matchingItems);
      } else {
        console.log(`[ENRICH] Не найдено предметов с похожим ID`);
      }
      
      return state; // При ошибке состояние не меняется, предмет остается с базовыми данными
      
    default:
      return state;
  }
};
