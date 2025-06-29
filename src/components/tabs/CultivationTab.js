import React, { useState, useEffect, useCallback } from 'react';
import * as S from './CultivationTabStyles';
import { useGame } from '../../context/GameContext';
import ResourceService from '../../services/resource-adapter';
import CultivationAdapter from '../../services/cultivation-adapter';
import { getCultivationProgress, completeTribulation as completeTribulationAPI } from '../../services/cultivation-api';

// Компонент для отображения содержимого вкладок
const TabContent = ({ active, children }) => {
  if (!active) return null;
  return <div>{children}</div>;
};

function CultivationTab() {
  const { state, actions } = useGame();
  const [isMeditating, setIsMeditating] = useState(false);
  const [meditationProgress, setMeditationProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('meditation');
  const [tribulationActive, setTribulationActive] = useState(false);
  const [tribulationProgress, setTribulationProgress] = useState(0);
  const [tribulationResult, setTribulationResult] = useState(null);
  const [insightCooldown, setInsightCooldown] = useState(0);

  const refreshCultivationData = useCallback(async () => {
    const userId = state.player?.id;
    if (!userId) return;

    try {
      console.log('[CultivationTab] Refreshing cultivation data...');
      const cultivationData = await getCultivationProgress(userId);
      if (cultivationData) {
        actions.updateCultivation(cultivationData);
        console.log('[CultivationTab] Cultivation data refreshed successfully.');
      }
    } catch (error) {
      console.error('Ошибка при обновлении данных о культивации:', error);
      actions.addNotification({
        message: 'Не удалось обновить данные о культивации.',
        type: 'error'
      });
    }
  }, [state.player?.id, actions]);

  useEffect(() => {
    // Загружаем данные инвентаря при монтировании, если они нужны и еще не загружены
    // или если userId изменился.
    const userId = state.player?.id;
    if (userId && actions.loadInventoryData) {
      // Простая проверка: если items пустой, загружаем.
      // В более сложном сценарии можно добавить флаг isInventoryLoaded в state.
      if (!state.player.inventory?.items || state.player.inventory.items.length === 0) {
        console.log('[CultivationTab] Инвентарь пуст, загрузка данных...');
        actions.loadInventoryData(userId);
      }
    }
  }, [state.player?.id, actions, state.player.inventory?.items]);
  
  // Function to handle meditation completion
  const handleMeditationComplete = useCallback(() => {
    const cultivationEfficiency = state.player.cultivation.cultivationEfficiency || 1.0;
    const experienceGain = Math.floor((Math.random() * 10 + 10) * cultivationEfficiency);
    const energyGain = Math.floor((Math.random() * 5 + 5) * cultivationEfficiency);
    
    const bottleneckChance = 0.3;
    // Используем текущее значение из состояния, гарантируя, что оно не будет undefined
    const currentBottleneckProgress = state.player.cultivation.bottleneckProgress !== undefined 
      ? state.player.cultivation.bottleneckProgress 
      : 0;
    
    let newBottleneckProgress = currentBottleneckProgress;
    let bottleneckGainValue = 0;
    
    if (Math.random() < bottleneckChance) {
      const bottleneckGain = Math.floor(Math.random() * 3) + 1;
      bottleneckGainValue = bottleneckGain;  // Сохраняем значение для использования позже
      newBottleneckProgress = currentBottleneckProgress + bottleneckGain;
      
      actions.addNotification({
        message: `Вы продвинулись в преодолении "бутылочного горлышка" (+${bottleneckGain})`,
        type: 'info'
      });
      
      console.log(`Обновление прогресса бутылочного горлышка: ${currentBottleneckProgress} -> ${newBottleneckProgress}`);
      
      // Используем адаптер для увеличения прогресса "бутылочного горлышка"
      const userId = state.player.id;
      if (userId) {
        try {
          CultivationAdapter.increaseBottleneckProgress(userId, bottleneckGain)
            .then(result => {
              console.log('Прогресс "бутылочного горлышка" обновлен через API:', result);
              
              // Обновляем Redux-состояние для немедленного отображения в UI только если API не обновил его
              if (!result.reduxUpdated) {
                const bottleneckProgress = result.bottleneckProgress || result.currentProgress;
                if (bottleneckProgress !== undefined) {
                  actions.updateCultivation({
                    bottleneckProgress: bottleneckProgress
                  });
                  console.log('Прогресс в Redux обновлен напрямую через actions:', bottleneckProgress);
                }
              }
            })
            .catch(error => {
              console.error('Ошибка при обновлении прогресса "бутылочного горлышка" через API:', error);
              
              // Резервное обновление через Redux в случае ошибки
              actions.updateCultivation({
                bottleneckProgress: newBottleneckProgress
              });
            });
        } catch (error) {
          console.error('Ошибка при вызове API для обновления прогресса:', error);
          
          // Резервное обновление через Redux в случае ошибки
          actions.updateCultivation({
            bottleneckProgress: newBottleneckProgress
          });
        }
      } else {
        console.log('userId не доступен, обновляем состояние напрямую');
        
        actions.updateCultivation({
          bottleneckProgress: newBottleneckProgress
        });
      }
    }
    
    // Проверяем, не превысит ли опыт максимальное значение
    const experienceToNextLevel = state.player.cultivation.experienceToNextLevel || 100;
    const currentExperience = state.player.cultivation.experience || 0;
    const newExperience = Math.min(currentExperience + experienceGain, experienceToNextLevel);
    
    // Если опыт достиг максимума, уведомляем пользователя
    if (newExperience >= experienceToNextLevel) {
      actions.addNotification({
        message: 'Вы достигли максимального опыта для текущего уровня. Попробуйте совершить прорыв!',
        type: 'success'
      });
    }
    
    // Подготавливаем данные для обновления
    const cultivationUpdates = {
      experience: newExperience,
      energy: Math.min(
        state.player.cultivation.energy + energyGain,
        state.player.cultivation.maxEnergy
      ),
      // Добавляем обязательные поля из текущего состояния
      stage: state.player.cultivation.stage,
      level: state.player.cultivation.level
    };
    
    // Если был прогресс по бутылочному горлышку, добавляем его тоже
    if (bottleneckGainValue > 0) {
      cultivationUpdates.bottleneckProgress = newBottleneckProgress;
    }
    
    // Используем адаптер для обновления данных культивации
    const userId = state.player.id;
    if (userId) {
      try {
        CultivationAdapter.updateCultivationProgress(userId, cultivationUpdates)
          .then(updatedCultivation => {
            console.log('Данные культивации обновлены через API:', updatedCultivation);
            refreshCultivationData(); // Обновляем данные
          })
          .catch(error => {
            console.error('Ошибка при обновлении данных культивации через API:', error);
            
            // Резервное обновление через Redux в случае ошибки
            actions.updateCultivation(cultivationUpdates);
          });
      } catch (error) {
        console.error('Ошибка при вызове API для обновления культивации:', error);
        
        // Резервное обновление через Redux в случае ошибки
        actions.updateCultivation(cultivationUpdates);
      }
    } else {
      console.warn('Невозможно отправить запрос на сервер: отсутствует userId');
      // Используем традиционный подход, если userId не доступен
      actions.updateCultivation(cultivationUpdates);
    }
  }, [actions, state.player.cultivation]);

  useEffect(() => {
    let timer;
    if (isMeditating) {
      timer = setInterval(() => {
        setMeditationProgress(prev => {
          const newValue = prev + 1;
          if (newValue >= 100) {
            // Schedule the handleMeditationComplete call after the state update completes
            setTimeout(() => {
              handleMeditationComplete();
            }, 0);
            return 0;
          }
          return newValue;
        });
      }, 100);
    }
    
    return () => clearInterval(timer);
  }, [isMeditating, handleMeditationComplete]);
  
  const experienceToNextLevel = state.player.cultivation.experienceToNextLevel || 100;
  const hasEnoughExperience = state.player.cultivation.experience >= experienceToNextLevel;
  const hasEnoughEnergy = state.player.cultivation.energy >= state.player.cultivation.maxEnergy * 0.8;
  
  const needsTribulation = state.player.cultivation.level % 3 === 0;
  const passedTribulation = !needsTribulation || state.player.cultivation.tribulationCompleted;
  
  const bottleneckProgress = state.player.cultivation.bottleneckProgress || 0;
  const requiredBottleneckProgress = state.player.cultivation.requiredBottleneckProgress || 100;
  const passedBottleneck = bottleneckProgress >= requiredBottleneckProgress;
  
  // Проверка наличия требуемых ресурсов
  const [requiredResources, setRequiredResources] = useState({});
  const [hasRequiredResources, setHasRequiredResources] = useState(false);
  
  // Получение требуемых ресурсов для прорыва
  useEffect(() => {
    let isActive = true; // Flag to prevent state updates after unmount
    
    // Use a separate function to fetch resources that will only update state if component is still mounted
    const fetchResources = async () => {
      try {
        // First extract all needed data from state to avoid state access during async operations
        const requiredResources = state.player.cultivation.requiredResources || {};
        const resourceIds = Object.keys(requiredResources);
        const stage = state.player.cultivation.stage;
        const level = state.player.cultivation.level;
        const inventoryItems = state.player.inventory.items;
        
        const resourcesNeeded = {};
        
        // Define the standard resources outside of any async operations
        const stageResources = {
          'Закалка тела': {
            'low_grade_herb': level * 5,
            'basic_pill': level * 2
          },
          'Очищение Ци': {
            'medium_grade_herb': level * 4,
            'qi_pill': level * 3,
            'spirit_stone': level * 3
          },
          'Золотое ядро': {
            'rare_herb': level * 3,
            'high_quality_pill': level * 2,
            'spirit_mineral': level * 4,
            'spirit_stone': level * 10
          },
          'Формирование души': {
            'exotic_herb': level * 2,
            'spirit_essence': level * 3,
            'beast_soul': level * 1,
            'spirit_mineral': level * 8,
            'spirit_stone': level * 20
          }
        };
        
        // Use either the specified resources or default ones
        if (resourceIds.length > 0) {
          // Process pre-defined required resources
          for (const id of resourceIds) {
            try {
              const resource = await ResourceService.getResourceById(id);
              if (resource && isActive) {
                resourcesNeeded[id] = {
                  name: resource.name,
                  amount: requiredResources[id],
                  available: inventoryItems.filter(item => item.id === id).length
                };
              }
            } catch (err) {
              console.error(`Error fetching resource ${id}:`, err);
            }
          }
        } else {
          // Use standard resources based on cultivation stage
          const currentStageResources = stageResources[stage] || stageResources['Закалка тела'];
          
          for (const id of Object.keys(currentStageResources)) {
            try {
              const resource = await ResourceService.getResourceById(id);
              if (resource && isActive) {
                resourcesNeeded[id] = {
                  name: resource.name,
                  amount: currentStageResources[id],
                  available: inventoryItems.filter(item => item.id === id).length
                };
              }
            } catch (err) {
              console.error(`Error fetching resource ${id}:`, err);
            }
          }
        }
        
        // Only update state if component is still mounted
        if (isActive) {
          setRequiredResources(resourcesNeeded);
          
          // Check if player has all required resources
          const hasAll = Object.values(resourcesNeeded).every(resource => 
            resource.available >= resource.amount
          );
          
          setHasRequiredResources(hasAll);
        }
      } catch (error) {
        console.error('Ошибка при получении требуемых ресурсов:', error);
        if (isActive) {
          setHasRequiredResources(false);
        }
      }
    };
    
    // Schedule the fetch operation to happen outside the render cycle
    const timeoutId = setTimeout(fetchResources, 0);
    
    // Cleanup function
    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [state.player.cultivation.stage, state.player.cultivation.level, state.player.cultivation.requiredResources, state.player.inventory.items]);
  
  const canBreakthrough = hasEnoughExperience && hasEnoughEnergy && passedTribulation && passedBottleneck && hasRequiredResources;
  
  // Функция резервной логики прорыва культивации (для случаев, когда API недоступно)
  const fallbackBreakthrough = useCallback(() => {
    // Extract all needed values from state first
    const spirit = state.player.stats.spirit || 0;
    const intellect = state.player.stats.intellect || 0;
    const currentLevel = state.player.cultivation.level || 1;
    const currentStage = state.player.cultivation.stage || 'Закалка тела';
    const currentExpToNextLevel = state.player.cultivation.experienceToNextLevel || 100;
    const currentMaxEnergy = state.player.cultivation.maxEnergy || 100;
    const currentUnassignedPoints = state.player.stats.unassignedPoints || 0;
    const currentExp = state.player.cultivation.experience || 0;
    const currentEnergy = state.player.cultivation.energy || 0;
    
    console.log('Используем резервную логику прорыва на фронтенде');
    
    const successChance = 0.5 + (spirit / 100) + (intellect / 200);
    
    if (Math.random() < successChance) {
      const newLevel = currentLevel + 1;
      const isStageUp = newLevel > 9;
      
      if (isStageUp) {
        const stages = ['Закалка тела', 'Очищение Ци', 'Золотое ядро', 'Формирование души'];
        const currentStageIndex = stages.indexOf(currentStage);
        
        if (currentStageIndex < stages.length - 1) {
          const newStage = stages[currentStageIndex + 1];
          const newMaxEnergy = currentMaxEnergy * 1.5;
          
          actions.updateCultivation({
            stage: newStage,
            level: 1,
            experience: 0,
            experienceToNextLevel: currentExpToNextLevel * 2,
            maxEnergy: newMaxEnergy,
            energy: newMaxEnergy,
            tribulationCompleted: false,
            bottleneckProgress: 0,
            requiredBottleneckProgress: 100 // Сбрасываем при смене этапа
          });
          
          actions.addNotification({
            message: `Поздравляем! Вы достигли ступени ${newStage}!`,
            type: 'success'
          });
        }
      } else {
        const newMaxEnergy = Math.floor(currentMaxEnergy * 1.1);
        
        actions.updateCultivation({
          level: newLevel,
          experience: 0,
          experienceToNextLevel: Math.floor(currentExpToNextLevel * 1.2),
          maxEnergy: newMaxEnergy,
          energy: newMaxEnergy,
          tribulationCompleted: false,
          bottleneckProgress: 0,
          requiredBottleneckProgress: (state.player.cultivation.requiredBottleneckProgress || 100) + newLevel * 10
        });
        
        actions.updatePlayerStats({
          unassignedPoints: currentUnassignedPoints + 5
        });
        
        actions.addNotification({
          message: `Вы успешно повысили уровень культивации! Получено 5 очков характеристик.`,
          type: 'success'
        });
      }
      
      // Расходуем ресурсы (теперь это делает сервер, клиент перезапрашивает инвентарь)
      // Object.entries(requiredResources).forEach(([resourceId, resource]) => {
      //   actions.removeItem({
      //     id: resourceId,
      //     quantity: resource.amount
      //   });
      // });
      if (state.player.id && actions.loadInventoryData) {
        actions.loadInventoryData(state.player.id);
      }
      
      // Создаем событие для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('breakthrough-complete', {
        detail: { success: true }
      }));
    } else {
      actions.updateCultivation({
        energy: Math.floor(currentEnergy * 0.5),
        experience: Math.floor(currentExp * 0.8)
      });
      
      actions.addNotification({
        message: 'Прорыв не удался. Вы потеряли часть энергии и опыта.',
        type: 'error'
      });
      
      // Создаем событие для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('breakthrough-complete', {
        detail: { success: false }
      }));
    }
  }, [actions, state.player.cultivation, state.player.stats, requiredResources]);

  const handleBreakthrough = useCallback(() => {
    if (!canBreakthrough) return;
    
    // Schedule state updates outside the render cycle
    setTimeout(async () => {
      try {
        // Получаем ID пользователя
        const userId = state.player.id;
        if (!userId) {
          console.error('ID пользователя не найден');
          throw new Error('ID пользователя не найден');
        }
        
        console.log('ID пользователя для проверки прорыва:', userId);
        
        // Используем адаптер для проверки возможности прорыва
        const checkResult = await CultivationAdapter.checkBreakthroughPossibility(userId);
        console.log('Проверка возможности прорыва через API:', checkResult);
        
        if (checkResult && checkResult.canBreakthrough) {
          // Используем адаптер для выполнения прорыва
          console.log('Вызов API для прорыва...');
          
          const result = await CultivationAdapter.performBreakthrough(userId);
          console.log('Результат прорыва через API:', result);
          
          if (result.success) {
            // Расходуем ресурсы (теперь это делает сервер, клиент перезапрашивает инвентарь)
            // if (!result.resourcesConsumed) {
            //   Object.entries(requiredResources).forEach(([resourceId, resource]) => {
            //     actions.removeItem({
            //       id: resourceId,
            //       quantity: resource.amount
            //     });
            //   });
            // }
            if (userId && actions.loadInventoryData) {
              actions.loadInventoryData(userId);
            }
            
            // Добавляем очки характеристик если они не были добавлены автоматически
            if (result.statsPointsAwarded && !result.statsPointsApplied) {
              actions.updatePlayerStats({
                unassignedPoints: (state.player.stats.unassignedPoints || 0) + result.statsPointsAwarded
              });
            }
            
            // Отображаем уведомление о успехе
            actions.addNotification({
              message: result.message || 'Вы успешно повысили уровень культивации!',
              type: 'success'
            });
            
            // Другие компоненты будут уведомлены через событие, отправленное из API-метода
            refreshCultivationData(); // Обновляем данные
          } else {
            // Отображаем уведомление о неудаче
            actions.addNotification({
              message: result.message || 'Прорыв не удался.',
              type: 'error'
            });
          }
        } else {
          actions.addNotification({
            message: checkResult?.message || 'Вы не можете совершить прорыв в данный момент.',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('Ошибка при выполнении прорыва:', error);
        
        // Используем резервную логику только при критических ошибках
        if (error.message === 'Network Error' || error.name === 'TypeError' ||
            error.message === 'ID пользователя не найден') {
          console.warn('Критическая ошибка API, используем резервную логику');
          fallbackBreakthrough();
        } else {
          actions.addNotification({
            message: `Ошибка при выполнении прорыва: ${error.message}`,
            type: 'error'
          });
        }
      }
    }, 0);
  }, [actions, canBreakthrough, state.player, requiredResources, fallbackBreakthrough]);
  
  // Обработка трибуляции
  useEffect(() => {
    let timer;
    if (tribulationActive && tribulationProgress < 100 && !tribulationResult) {
      timer = setInterval(() => {
        // Создаем случайные события вне функции обновления состояния
        if (Math.random() < 0.1) {
          const eventType = Math.floor(Math.random() * 3);
          const messages = [
            {
              message: 'Вы чувствуете, как энергия трибуляции усиливается!',
              type: 'warning'
            },
            {
              message: 'Ваше тело испытывает сильную боль, но вы продолжаете сопротивляться!',
              type: 'warning'
            },
            {
              message: 'Вы ощущаете, как ваша духовная сила растет в процессе испытания!',
              type: 'info'
            }
          ];
          actions.addNotification(messages[eventType]);
        }
        
        setTribulationProgress(prev => {
          const newProgress = prev + (Math.random() * 2 + 0.5);
          
          // Завершение трибуляции
          if (newProgress >= 100) {
            // Используем setTimeout для вызова функции после обновления состояния
            setTimeout(() => {
              completeTribulation();
            }, 0);
            return 100;
          }
          
          return newProgress;
        });
      }, 500);
    }
    
    return () => clearInterval(timer);
  }, [tribulationActive, tribulationResult]); // Убрал tribulationProgress из зависимостей
  
  // Завершение трибуляции
  const completeTribulation = useCallback(() => {
    // Use setTimeout to defer state updates
    setTimeout(async () => {
      try {
        // Extract state values first
        const spirit = state.player.stats.spirit || 0;
        const intellect = state.player.stats.intellect || 0;
        const experienceToNextLevel = state.player.cultivation.experienceToNextLevel || 100;
        const currentExperience = state.player.cultivation.experience || 0;
        const maxEnergy = state.player.cultivation.maxEnergy || 100;
        const currentEnergy = state.player.cultivation.energy || 0;
        const health = state.player.health || 100;
        
        // Определяем успешность прохождения трибуляции
        const successChance = 0.6 + (spirit / 150) + (intellect / 250);
        const success = Math.random() < successChance;
        
        // Подготавливаем данные о результате трибуляции
        const tribulationData = {
          success,
          level: state.player.cultivation.level,
          timestamp: Date.now(),
          stats: {
            spirit,
            intellect
          }
        };
        
        // Используем адаптер для завершения трибуляции
        const userId = state.player.id;
        if (userId) {
          try {
            const result = await completeTribulationAPI(userId, tribulationData);
            console.log('Трибуляция завершена через API:', result);
            
            // Устанавливаем результат трибуляции на основе ответа API
            if (success) {
              const rewardExperience = result.rewards?.experience || Math.floor(experienceToNextLevel * 0.2);
              const energyReward = result.rewards?.energy || Math.floor(maxEnergy * 0.2);
              
              setTribulationResult({
                success: true,
                message: result.message || 'Вы успешно прошли трибуляцию!',
                rewards: {
                  experience: rewardExperience,
                  energy: energyReward
                }
              });
              
              actions.addNotification({
                message: result.notificationMessage || 'Поздравляем! Вы успешно прошли трибуляцию и получили награду!',
                type: 'success'
              });
            } else {
              setTribulationResult({
                success: false,
                message: result.message || 'Вы не смогли пройти трибуляцию.',
                penalties: result.penalties || {
                  energy: Math.floor(currentEnergy * 0.3),
                  health: Math.floor(health * 0.2)
                }
              });
              
              actions.addNotification({
                message: result.notificationMessage || 'Вы не смогли пройти трибуляцию и потеряли часть энергии.',
                type: 'error'
              });
            }
            
            // Создаем событие для уведомления других компонентов
            window.dispatchEvent(new CustomEvent('tribulation-complete', {
              detail: { success, result }
            }));
          } catch (error) {
            console.error('Ошибка при завершении трибуляции через API:', error);
            // Продолжаем с традиционным подходом в случае ошибки
          }
        } else {
          // Используем традиционный подход, если API не доступно
          if (success) {
            const rewardExperience = Math.floor(experienceToNextLevel * 0.2);
            const energyReward = Math.floor(maxEnergy * 0.2);
            const newExperience = Math.min(currentExperience + rewardExperience, experienceToNextLevel);
            
            setTribulationResult({
              success: true,
              message: 'Вы успешно прошли трибуляцию!',
              rewards: {
                experience: rewardExperience,
                energy: energyReward
              }
            });
            
            // Если опыт достиг максимума после трибуляции, уведомляем пользователя
            if (newExperience >= experienceToNextLevel) {
              actions.addNotification({
                message: 'Вы достигли максимального опыта для текущего уровня. Попробуйте совершить прорыв!',
                type: 'success'
              });
            }
            
            actions.updateCultivation({
              tribulationCompleted: true,
              experience: newExperience,
              energy: Math.min(currentEnergy + energyReward, maxEnergy)
            });
            
            actions.addNotification({
              message: 'Поздравляем! Вы успешно прошли трибуляцию и получили награду!',
              type: 'success'
            });
          } else {
            const energyPenalty = Math.floor(currentEnergy * 0.3);
            const healthPenalty = Math.floor(health * 0.2);
            
            setTribulationResult({
              success: false,
              message: 'Вы не смогли пройти трибуляцию.',
              penalties: {
                energy: energyPenalty,
                health: healthPenalty
              }
            });
            
            actions.updateCultivation({
              energy: Math.floor(currentEnergy * 0.7)
            });
            
            actions.addNotification({
              message: 'Вы не смогли пройти трибуляцию и потеряли часть энергии.',
              type: 'error'
            });
          }
        }
        
        setTribulationActive(false);
      } catch (error) {
        console.error('Ошибка при завершении трибуляции:', error);
        setTribulationActive(false);
        
        actions.addNotification({
          message: 'Произошла ошибка при завершении трибуляции.',
          type: 'error'
        });
      }
    }, 0);
  }, [actions, state.player.cultivation, state.player.stats, state.player.health]);
  
  // Начало трибуляции
  const handleStartTribulation = useCallback(() => {
    if (tribulationActive) return;
    
    // Check energy requirements
    const maxEnergy = state.player.cultivation.maxEnergy || 100;
    const currentEnergy = state.player.cultivation.energy || 0;
    
    if (currentEnergy < maxEnergy * 0.5) {
      actions.addNotification({
        message: 'Недостаточно энергии для начала трибуляции. Требуется минимум 50% от максимума.',
        type: 'error'
      });
      return;
    }
    
    // Schedule state updates outside the render cycle
    setTimeout(() => {
      // Extract all values before updating state
      const newEnergy = Math.floor(currentEnergy * 0.8);
      
      setTribulationActive(true);
      setTribulationProgress(0);
      setTribulationResult(null);
      
      actions.updateCultivation({
        energy: newEnergy
      });
      
      actions.addNotification({
        message: 'Вы начали трибуляцию. Сосредоточьтесь и преодолейте испытание!',
        type: 'info'
      });
    }, 0);
  }, [actions, state.player.cultivation, tribulationActive]);
  
  const handleGainInsight = useCallback(() => {
    if (insightCooldown > 0) return;
    
    // Schedule the state updates outside of the render cycle
    setTimeout(async () => {
      try {
        // Используем адаптер для получения озарения
        const userId = state.player.id;
        if (userId) {
          const result = await CultivationAdapter.gainInsight(userId);
          console.log('Озарение получено через API:', result);
          
          if (result && result.success) {
            setInsightCooldown(24 * 60 * 60);
            
            actions.addNotification({
              message: result.message || 'Вы получили прозрение! Эффективность культивации увеличена.',
              type: 'success'
            });
            refreshCultivationData(); // Обновляем данные
            refreshCultivationData(); // Обновляем данные
          } else {
            setInsightCooldown(12 * 60 * 60);
            
            actions.addNotification({
              message: result?.message || 'Не удалось получить прозрение.',
              type: 'warning'
            });
          }
          
          // Создаем событие для уведомления других компонентов
          window.dispatchEvent(new CustomEvent('insight-gained'));
        } else {
          // Используем традиционный подход, если API не доступно
          const currentEfficiency = state.player.cultivation.cultivationEfficiency || 1.0;
          const newEfficiency = Math.min(currentEfficiency + 0.1, 2.0);
          const currentInsightPoints = state.player.cultivation.insightPoints || 0;
          
          const insightResult = {
            success: true,
            message: 'Вы получили прозрение! Эффективность культивации увеличена на 10%.',
            effect: {
              cultivationEfficiency: newEfficiency
            }
          };
          
          if (insightResult.success) {
            actions.updateCultivation({
              cultivationEfficiency: newEfficiency,
              insightPoints: currentInsightPoints + 1
            });
            
            setInsightCooldown(24 * 60 * 60);
            
            actions.addNotification({
              message: insightResult.message,
              type: 'success'
            });
          } else {
            actions.addNotification({
              message: insightResult.message || 'Не удалось получить прозрение.',
              type: 'error'
            });
          }
        }
      } catch (error) {
        console.error('Ошибка при получении прозрения:', error);
        actions.addNotification({
          message: 'Произошла ошибка при получении прозрения.',
          type: 'error'
        });
        
        setInsightCooldown(6 * 60 * 60); // Меньший кулдаун при ошибке
      }
    }, 0);
  }, [actions, insightCooldown, state.player.cultivation]);
  
  return (
    <S.Container>
      <S.TabsContainer>
        <S.Tab 
          active={activeTab === 'meditation'} 
          onClick={() => setActiveTab('meditation')}
        >
          Медитация
        </S.Tab>
        <S.Tab 
          active={activeTab === 'breakthrough'} 
          onClick={() => setActiveTab('breakthrough')}
        >
          Прорыв
        </S.Tab>
        <S.Tab 
          active={activeTab === 'tribulation'} 
          onClick={() => setActiveTab('tribulation')}
        >
          Трибуляция
        </S.Tab>
        <S.Tab 
          active={activeTab === 'insight'} 
          onClick={() => setActiveTab('insight')}
        >
          Прозрение
        </S.Tab>
      </S.TabsContainer>
      
      <TabContent active={activeTab === 'meditation'}>
        <S.CultivationArea>
          <S.MeditationPanel>
            <h3>Медитация</h3>
            <S.ProgressInfo>
              <S.ProgressBar progress={meditationProgress} />
              <S.ProgressText>
                {isMeditating ? 'Медитация...' : 'Нажмите кнопку для начала медитации'}
              </S.ProgressText>
            </S.ProgressInfo>
            <S.Button 
              active={isMeditating}
              onClick={() => setIsMeditating(!isMeditating)}
            >
              {isMeditating ? 'Прервать медитацию' : 'Начать медитацию'}
            </S.Button>
          </S.MeditationPanel>
          
          <S.Panel>
            <h3>Характеристики культивации</h3>
            <S.StatsList>
              <S.StatItem>
                <S.StatLabel>Ступень</S.StatLabel>
                <S.StatValue>{state.player.cultivation.stage}</S.StatValue>
              </S.StatItem>
              <S.StatItem>
                <S.StatLabel>Уровень</S.StatLabel>
                <S.StatValue>{state.player.cultivation.level}</S.StatValue>
              </S.StatItem>
              <S.StatItem>
                <S.StatLabel>Опыт</S.StatLabel>
                <S.StatValue>
                  {state.player.cultivation.experience || 0}/{experienceToNextLevel || 100}
                </S.StatValue>
              </S.StatItem>
              <S.StatItem>
                <S.StatLabel>Духовная энергия</S.StatLabel>
                <S.StatValue>
                  {state.player.cultivation.energy}/{state.player.cultivation.maxEnergy}
                </S.StatValue>
              </S.StatItem>
              <S.StatItem>
                <S.StatLabel>Эффективность</S.StatLabel>
                <S.StatValue>
                  {Math.floor((state.player.cultivation.cultivationEfficiency || 1.0) * 100)}%
                </S.StatValue>
              </S.StatItem>
            </S.StatsList>
          </S.Panel>
        </S.CultivationArea>
        
        <S.Panel>
          <h3>Прогресс "бутылочного горлышка"</h3>
          <S.ProgressInfo>
            <S.ProgressBar progress={(bottleneckProgress / requiredBottleneckProgress) * 100} />
            <S.ProgressText>
              {bottleneckProgress}/{requiredBottleneckProgress}
            </S.ProgressText>
          </S.ProgressInfo>
        </S.Panel>
      </TabContent>
      
      <TabContent active={activeTab === 'breakthrough'}>
        <S.Panel>
          <h3>Прорыв</h3>
          
          <S.BreakthroughRequirements>
            <S.Requirement met={hasEnoughExperience}>
              Опыт: {state.player.cultivation.experience}/{experienceToNextLevel || 100}
            </S.Requirement>
            <S.Requirement met={hasEnoughEnergy}>
              Энергия: {state.player.cultivation.energy} (требуется {Math.floor(state.player.cultivation.maxEnergy * 0.8)})
            </S.Requirement>
            <S.Requirement met={passedBottleneck}>
              Бутылочное горлышко: {bottleneckProgress}/{requiredBottleneckProgress}
            </S.Requirement>
            {needsTribulation && (
              <S.Requirement met={passedTribulation}>
                Трибуляция: {passedTribulation ? 'Пройдена' : 'Не пройдена'}
              </S.Requirement>
            )}
            <S.Requirement met={hasRequiredResources}>
              Ресурсы: {hasRequiredResources ? 'Достаточно' : (
                <span>
                  Недостаточно: {Object.values(requiredResources)
                    .filter(resource => resource.available < resource.amount)
                    .map(resource => `${resource.name} (${resource.available}/${resource.amount})`)
                    .join(', ')}
                </span>
              )}
            </S.Requirement>
          </S.BreakthroughRequirements>
          
          {Object.keys(requiredResources).length > 0 && (
            <S.ResourceList>
              <h4>Требуемые ресурсы:</h4>
              {Object.values(requiredResources).map((resource, index) => (
                <S.ResourceItem key={index}>
                  <span>{resource.name}</span>
                  <span style={{ color: resource.available >= resource.amount ? '#4caf50' : '#f44336' }}>
                    {resource.available}/{resource.amount}
                  </span>
                </S.ResourceItem>
              ))}
            </S.ResourceList>
          )}
          
          <S.Button 
            onClick={handleBreakthrough}
            disabled={!canBreakthrough}
            style={{ marginTop: '15px', width: '100%' }}
          >
            Попытаться совершить прорыв
          </S.Button>
        </S.Panel>
      </TabContent>
      
      <TabContent active={activeTab === 'tribulation'}>
        <S.Panel>
          <h3>Трибуляция</h3>
          
          {needsTribulation && !passedTribulation && (
            <>
              {!tribulationActive && !tribulationResult && (
                <>
                  <p>
                    Для перехода на следующий уровень культивации вам необходимо пройти трибуляцию.
                    Это испытание проверит вашу силу духа и тела.
                  </p>
                  <S.Button 
                    onClick={handleStartTribulation}
                    disabled={state.player.cultivation.energy < state.player.cultivation.maxEnergy * 0.5}
                    style={{ marginTop: '15px', width: '100%' }}
                  >
                    Начать трибуляцию (требуется 50% энергии)
                  </S.Button>
                </>
              )}
              
              {tribulationActive && !tribulationResult && (
                <>
                  <p>Вы проходите трибуляцию. Сосредоточьтесь и преодолейте испытание!</p>
                  <S.ProgressInfo>
                  <S.TribulationProgressBar 
                    progress={tribulationProgress} 
                  />
                    <S.ProgressText>
                      Прогресс: {Math.floor(tribulationProgress)}%
                    </S.ProgressText>
                  </S.ProgressInfo>
                </>
              )}
              
              {tribulationResult && (
                <div>
                  <h4 style={{ color: tribulationResult.success ? '#4caf50' : '#f44336' }}>
                    {tribulationResult.message}
                  </h4>
                  
                  {tribulationResult.success && tribulationResult.rewards && (
                    <div>
                      <p>Вы получили награду:</p>
                      <ul>
                        {tribulationResult.rewards.experience && (
                          <li>Опыт культивации: +{tribulationResult.rewards.experience}</li>
                        )}
                        {tribulationResult.rewards.energy && (
                          <li>Духовная энергия: +{tribulationResult.rewards.energy}</li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  {!tribulationResult.success && tribulationResult.penalties && (
                    <div>
                      <p>Вы понесли потери:</p>
                      <ul>
                        {tribulationResult.penalties.energy && (
                          <li>Духовная энергия: -{tribulationResult.penalties.energy}</li>
                        )}
                        {tribulationResult.penalties.health && (
                          <li>Здоровье: -{tribulationResult.penalties.health}</li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  <S.Button 
                    onClick={() => setTribulationResult(null)}
                    style={{ marginTop: '15px', width: '100%' }}
                  >
                    {tribulationResult.success ? 'Продолжить культивацию' : 'Попробовать снова позже'}
                  </S.Button>
                </div>
              )}
            </>
          )}
          
          {(!needsTribulation || passedTribulation) && (
            <p>
              Вам не требуется проходить трибуляцию на текущем уровне культивации.
              {passedTribulation && needsTribulation && ' Вы уже успешно прошли трибуляцию.'}
            </p>
          )}
        </S.Panel>
      </TabContent>
      
      <TabContent active={activeTab === 'insight'}>
        <S.Panel>
          <h3>Прозрение</h3>
          
          <S.Button 
            onClick={handleGainInsight}
            disabled={insightCooldown > 0}
            style={{ marginTop: '15px', width: '100%' }}
          >
            {insightCooldown > 0 
              ? `Доступно через: ${Math.floor(insightCooldown / 3600)}:${Math.floor((insightCooldown % 3600) / 60)}:${insightCooldown % 60}` 
              : 'Получить прозрение'}
          </S.Button>
        </S.Panel>
      </TabContent>
    </S.Container>
  );
}

export default CultivationTab;
