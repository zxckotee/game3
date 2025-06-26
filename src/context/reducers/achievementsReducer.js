import ACTION_TYPES from '../actions/actionTypes';

// Редуктор для обработки действий, связанных с достижениями
export const achievementsReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.CHECK_ACHIEVEMENTS: {
      // Определяем браузер
      const userAgent = navigator.userAgent;
      const isChrome = userAgent.match(/chrome|chromium|crios/i) && !userAgent.match(/opr\//i) && !userAgent.match(/edg/i);
      console.log('Проверка достижений в редьюсере, браузер Chrome:', isChrome);
      
      const { achievements } = action.payload;
      console.log('Начало проверки достижений в редьюсере:', { achievements });
      
      if (!Array.isArray(achievements)) {
        console.error('Достижения не являются массивом:', achievements);
        return state;
      }
      
      try {
        // Проверяем структуру состояния перед проверкой достижений
        if (!state?.player) {
          console.error('Отсутствует объект player в состоянии');
          return state;
        }
        
        // Создаем безопасную копию состояния для проверки достижений
        // Для Chrome используем более глубокое копирование
        let safeState;
        if (isChrome) {
          // Для Chrome создаем полностью новый объект
          safeState = {
            ...state,
            player: {
              ...state.player,
              social: {
                ...state.player.social || {},
                relationships: state.player.social?.relationships ? 
                  {...state.player.social.relationships} : {}
              },
              progress: {
                ...state.player.progress || {},
                discoveries: state.player.progress?.discoveries ? 
                  {...state.player.progress.discoveries} : {}
              },
              inventory: {
                ...state.player.inventory || {},
                currency: state.player.inventory?.currency || { copper: 0, silver: 0, gold: 0, spiritStones: 0 }
              }
            }
          };
        } else {
          // Для других браузеров используем JSON.parse/stringify
          safeState = {
            ...state,
            player: {
              ...state.player,
              social: {
                ...state.player.social || {},
                relationships: state.player.social?.relationships || {}
              },
              progress: {
                ...state.player.progress || {},
                discoveries: state.player.progress?.discoveries || {}
              },
              inventory: {
                ...state.player.inventory || {},
                currency: state.player.inventory?.currency || { copper: 0, silver: 0, gold: 0, spiritStones: 0 }
              }
            }
          };
        }
        
        console.log('Безопасное состояние для проверки в редьюсере создано');
        
        const newAchievements = [];
        
        // Проверяем каждое достижение по отдельности с подробным логированием
        for (let i = 0; i < achievements.length; i++) {
          const achievement = achievements[i];
          
          console.log(`Проверка достижения #${i}:`, {
            id: achievement?.id,
            title: achievement?.title
          });
          
          try {
            if (!achievement || typeof achievement !== 'object') {
              console.warn('Некорректное достижение:', achievement);
              continue;
            }
            
            const hasCondition = typeof achievement.condition === 'function';
            if (!hasCondition) {
              console.warn('У достижения отсутствует функция condition:', achievement);
              continue;
            }
            
            console.log(`Вызов функции condition для достижения ${achievement.id}`);
            const conditionResult = achievement.condition(safeState);
            console.log(`Результат проверки условия для достижения ${achievement.id}:`, conditionResult);
            
            const isNotCompleted = !state.achievements.completed.find(a => a.id === achievement.id);
            
            console.log('Результаты проверки:', {
              id: achievement?.id,
              hasCondition,
              conditionResult,
              isNotCompleted
            });
            
            if (hasCondition && conditionResult && isNotCompleted) {
              newAchievements.push(achievement);
            }
          } catch (error) {
            console.error(`Ошибка при проверке достижения ${achievement?.id}:`, error);
          }
        }
        
        console.log('Новые достижения:', newAchievements);
        
        if (newAchievements.length === 0) {
          console.log('Нет новых достижений');
          return state;
        }
        
        // Выдаем награды за новые достижения
        const rewards = newAchievements.reduce((acc, achievement) => {
          if (!achievement?.rewards || !Array.isArray(achievement.rewards)) {
            console.warn('У достижения отсутствуют награды:', achievement);
            return acc;
          }
          
          // Добавляем уведомления о получении достижений
          acc.ui.notifications.push({
            id: Date.now() + Math.random(),
            message: `Получено достижение: ${achievement.title || 'Неизвестное достижение'}!`,
            type: 'achievement'
          });
          
          // Обрабатываем награды
          achievement.rewards.forEach(reward => {
            if (!reward?.type) {
              console.warn('Некорректная награда:', reward);
              return;
            }
            
            try {
              switch (reward.type) {
                case 'experience':
                  acc.player.cultivation.experience += reward.amount || 0;
                  break;
                case 'currency':
                  if (typeof acc.player.inventory.currency === 'number') {
                    acc.player.inventory.currency += reward.amount || 0;
                  } else if (typeof acc.player.inventory.currency === 'object' && acc.player.inventory.currency !== null) {
                    // Определяем, какой тип валюты использовать в зависимости от размера награды
                    const currencyAmount = reward.amount || 0;
                    
                    // Для разных типов наград используем разные типы валюты
                    if (reward.currencyType) {
                      // Если явно указан тип валюты, используем его
                      acc.player.inventory.currency[reward.currencyType] = 
                        (acc.player.inventory.currency[reward.currencyType] || 0) + currencyAmount;
                    } else if (currencyAmount >= 1000) {
                      // Для крупных сумм используем золото
                      acc.player.inventory.currency.gold = 
                        (acc.player.inventory.currency.gold || 0) + currencyAmount;
                    } else if (currencyAmount >= 10) {
                      // Для средних сумм используем серебро
                      acc.player.inventory.currency.silver = 
                        (acc.player.inventory.currency.silver || 0) + currencyAmount;
                    } else {
                      // Для малых сумм используем медь
                      acc.player.inventory.currency.copper = 
                        (acc.player.inventory.currency.copper || 0) + currencyAmount;
                    }
                    
                    console.log('Добавлена валюта за достижение:', {
                      тип: reward.currencyType || (currencyAmount >= 1000 ? 'gold' : (currencyAmount >= 10 ? 'silver' : 'copper')),
                      количество: currencyAmount,
                      итоговоеСостояние: acc.player.inventory.currency
                    });
                  }
                  break;
                case 'item':
                  if (reward.name) {
                    acc.player.inventory.items.push(reward);
                  }
                  break;
                case 'reputation':
                  acc.player.reputation = (acc.player.reputation || 0) + (reward.amount || 0);
                  break;
                case 'technique':
                  if (reward.name) {
                    acc.player.techniques.push(reward);
                  }
                  break;
              }
            } catch (error) {
              console.error(`Ошибка при обработке награды ${reward.type}:`, error);
            }
          });
          
          return acc;
        }, {
          ...state,
          achievements: {
            ...state.achievements,
            completed: [...state.achievements.completed, ...newAchievements],
            points: state.achievements.points + newAchievements.reduce((sum, ach) => 
              sum + (ach.rewards || []).reduce((total, reward) => total + (reward?.amount || 0), 0), 0
            )
          },
          ui: {
            ...state.ui,
            notifications: [...state.ui.notifications]
          }
        });
        
        return rewards;
      } catch (error) {
        console.error('Критическая ошибка при проверке достижений:', error);
        return state;
      }
    }
    
    case ACTION_TYPES.COMPLETE_ACHIEVEMENT: {
      const achievement = action.payload;
      
      if (state.achievements.completed.find(a => a.id === achievement.id)) {
        return state;
      }
      
      // Выдаем награды за достижение
      const rewardsPromise = achievement.rewards.reduce(async (accPromise, reward) => {
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
            return {
              ...acc,
              player: {
                ...acc.player,
                inventory: {
                  ...acc.player.inventory,
                  currency: typeof acc.player.inventory.currency === 'number'
                    ? acc.player.inventory.currency + reward.amount
                    : {
                        ...acc.player.inventory.currency,
                        ...(
                          // Определяем, какой тип валюты использовать в зависимости от размера награды
                          reward.currencyType ? 
                            // Если явно указан тип валюты, используем его
                            { [reward.currencyType]: (acc.player.inventory.currency[reward.currencyType] || 0) + (reward.amount || 0) } :
                            // Иначе выбираем в зависимости от суммы
                            (reward.amount >= 1000) ? 
                              { gold: (acc.player.inventory.currency.gold || 0) + (reward.amount || 0) } :
                              (reward.amount >= 10) ?
                                { silver: (acc.player.inventory.currency.silver || 0) + (reward.amount || 0) } :
                                { copper: (acc.player.inventory.currency.copper || 0) + (reward.amount || 0) }
                        )
                      }
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
      }, Promise.resolve({
        ...state,
        achievements: {
          ...state.achievements,
          completed: [...state.achievements.completed, achievement],
          points: state.achievements.points + achievement.rewards.reduce(
            (total, reward) => total + (reward.amount || 0), 0
          )
        },
        ui: {
          ...state.ui,
          notifications: [
            ...state.ui.notifications,
            {
              id: Date.now() + Math.random(),
              message: `Получено достижение: ${achievement.title}!`,
              type: 'achievement'
            }
          ]
        }
      }));
      
      // Ожидаем завершения всех асинхронных операций
      const rewards = async () => await rewardsPromise;
      return rewards();
    }
    
    default:
      return state;
  }
};
