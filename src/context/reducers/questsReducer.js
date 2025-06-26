import ACTION_TYPES from '../actions/actionTypes';

// Редуктор для обработки действий, связанных с квестами
export const questsReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.ACCEPT_QUEST: {
      const quest = state.player.progress.quests.available.find(q => q.id === action.payload);
      if (!quest) return state;
      
      return {
        ...state,
        player: {
          ...state.player,
          progress: {
            ...state.player.progress,
            quests: {
              ...state.player.progress.quests,
              available: state.player.progress.quests.available.filter(q => q.id !== action.payload),
              active: [...state.player.progress.quests.active, { ...quest, status: 'active', startedAt: new Date().toISOString() }]
            }
          }
        }
      };
    }
    
    case ACTION_TYPES.COMPLETE_QUEST: {
      const quest = state.player.progress.quests.active.find(q => q.id === action.payload);
      if (!quest) return state;
      
      // Проверяем, все ли цели выполнены
      if (!quest.objectives.every(obj => obj.completed)) return state;
      
      // Выдаем награды
      const rewardsPromise = quest.rewards.reduce(async (accPromise, reward) => {
        const acc = await accPromise;
        
        switch (reward.type) {
          case 'experience':
            return {
              ...acc,
              player: {
                ...acc.player,
                cultivation: {
                  ...acc.player.cultivation,
                  experience: acc.player.cultivation.experience + reward.amount
                }
              }
            };
          case 'currency':
            // Обрабатываем разные форматы валюты
            let updatedCurrency = { ...(acc.player.inventory.currency || {}) };
            
            console.log('Получение награды валютой:', reward.amount);
            
            if (typeof reward.amount === 'number') {
              // Обратная совместимость: если reward.amount это число, преобразуем его в золото
              updatedCurrency.gold = (updatedCurrency.gold || 0) + reward.amount;
            } else if (typeof reward.amount === 'object') {
              // Если reward.amount это объект с разными типами валют
              Object.entries(reward.amount).forEach(([currency, amount]) => {
                if (typeof amount === 'number') {
                  updatedCurrency[currency] = (updatedCurrency[currency] || 0) + amount;
                }
              });
            }
            
            return {
              ...acc,
              player: {
                ...acc.player,
                inventory: {
                  ...acc.player.inventory,
                  currency: updatedCurrency
                }
              }
            };
          case 'item':
            return {
              ...acc,
              player: {
                ...acc.player,
                inventory: {
                  ...acc.player.inventory,
                  items: [...acc.player.inventory.items, reward]
                }
              }
            };
          case 'technique':
            try {
              // Получаем технику из базы данных по названию
              const techniqueService = require('../../services/technique-service');
              const technique = await techniqueService.getTechniqueByName(reward.name);
              
              // Проверяем, не изучена ли уже техника
              const isAlreadyLearned = acc.player.techniques.some(t => t.id === technique.techniqueId);
              
              if (isAlreadyLearned) {
                return acc;
              }
              
              // Добавляем технику в список изученных
              return {
                ...acc,
                player: {
                  ...acc.player,
                  techniques: [
                    ...acc.player.techniques,
                    {
                      id: technique.techniqueId,
                      level: 1,
                      experience: 0
                    }
                  ]
                },
                ui: {
                  ...acc.ui,
                  notifications: [
                    ...acc.ui.notifications,
                    {
                      id: Date.now() + Math.random(),
                      message: `Вы изучили технику "${technique.name}"!`,
                      type: 'success'
                    }
                  ]
                }
              };
            } catch (error) {
              console.error(`Ошибка при получении техники "${reward.name}":`, error);
              return acc;
            }
          default:
            return acc;
        }
      }, Promise.resolve(state));
      
      // Ожидаем завершения всех асинхронных операций
      const rewards = async () => await rewardsPromise;
      
      return {
        ...rewards(),
        player: {
          ...state.player,
          progress: {
            ...state.player.progress,
            quests: {
              ...state.player.progress.quests,
              active: state.player.progress.quests.active.filter(q => q.id !== action.payload),
              completed: [...state.player.progress.quests.completed, { ...quest, status: 'completed', completedAt: new Date().toISOString() }]
            }
          },
          ui: {
            ...state.ui,
            notifications: [
              ...state.ui.notifications,
              {
                id: Date.now(),
                message: `Задание "${quest.title}" выполнено!`,
                type: 'success'
              }
            ]
          }
        }
      };
    }
    
    case ACTION_TYPES.UPDATE_QUEST_OBJECTIVE: {
      const { questId, objectiveId } = action.payload;
      return {
        ...state,
        player: {
          ...state.player,
          progress: {
            ...state.player.progress,
            quests: {
              ...state.player.progress.quests,
              active: state.player.progress.quests.active.map(quest => 
                quest.id === questId
                  ? {
                      ...quest,
                      objectives: quest.objectives.map(obj =>
                        obj.id === objectiveId
                          ? { ...obj, completed: true }
                          : obj
                      )
                    }
                  : quest
              )
            }
          }
        }
      };
    }
    
    default:
      return state;
  }
};
