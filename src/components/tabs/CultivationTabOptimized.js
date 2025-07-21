import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as S from './CultivationTabStyles';
import { useGame } from '../../context/GameContext';
import ResourceService from '../../services/resource-adapter';
import { completeTribulation as completeTribulationAPI } from '../../services/cultivation-api';
import QuestService from '../../services/quest-adapter';
import useCultivationOptimized from '../../hooks/useCultivationOptimized';
import { getInterval, INTERVAL_TYPES, simpleDebounce } from '../../config/clientIntervals';

// Компонент для отображения содержимого вкладок
const TabContent = React.memo(({ active, children }) => {
  if (!active) return null;
  return <div>{children}</div>;
});

function CultivationTabOptimized() {
  const { state, actions } = useGame();
  const {
    isLoading,
    refreshCultivationData,
    increaseBottleneckProgress,
    updateCultivationProgress,
    performBreakthrough,
    gainInsight,
    hasActiveRequests
  } = useCultivationOptimized();

  // Локальное состояние компонента
  const [isMeditating, setIsMeditating] = useState(false);
  const [meditationProgress, setMeditationProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('meditation');
  const [tribulationActive, setTribulationActive] = useState(false);
  const [tribulationProgress, setTribulationProgress] = useState(0);
  const [tribulationResult, setTribulationResult] = useState(null);
  const [insightCooldown, setInsightCooldown] = useState(0);

  // Кэш для требуемых ресурсов
  const [requiredResources, setRequiredResources] = useState({});
  const [hasRequiredResources, setHasRequiredResources] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  // Мемоизированные вычисления
  const cultivationStats = useMemo(() => {
    const cultivation = state.player?.cultivation || {};
    const experienceToNextLevel = cultivation.experienceToNextLevel || 100;
    const hasEnoughExperience = cultivation.experience >= experienceToNextLevel;
    const hasEnoughEnergy = cultivation.energy >= cultivation.maxEnergy * 0.8;
    const needsTribulation = cultivation.level % 3 === 0;
    const passedTribulation = !needsTribulation || cultivation.tribulationCompleted;
    const bottleneckProgress = cultivation.bottleneckProgress || 0;
    const requiredBottleneckProgress = cultivation.requiredBottleneckProgress || 100;
    const passedBottleneck = bottleneckProgress >= requiredBottleneckProgress;

    return {
      experienceToNextLevel,
      hasEnoughExperience,
      hasEnoughEnergy,
      needsTribulation,
      passedTribulation,
      bottleneckProgress,
      requiredBottleneckProgress,
      passedBottleneck
    };
  }, [state.player?.cultivation]);

  const canBreakthrough = useMemo(() => {
    return cultivationStats.hasEnoughExperience && 
           cultivationStats.hasEnoughEnergy && 
           cultivationStats.passedTribulation && 
           cultivationStats.passedBottleneck && 
           hasRequiredResources;
  }, [cultivationStats, hasRequiredResources]);

  // Дебаунсированная загрузка инвентаря
  const debouncedLoadInventory = useCallback(
    simpleDebounce((userId) => {
      if (actions.loadInventoryData && 
          (!state.player.inventory?.items || state.player.inventory.items.length === 0)) {
        console.log('[CultivationTabOptimized] Загрузка инвентаря...');
        actions.loadInventoryData(userId);
      }
    }, 2000, 'load-inventory'),
    [actions, state.player.inventory?.items]
  );

  // Оптимизированная загрузка инвентаря
  useEffect(() => {
    const userId = state.player?.id;
    if (userId) {
      debouncedLoadInventory(userId);
    }
  }, [state.player?.id, debouncedLoadInventory]);

  // Оптимизированная функция завершения медитации
  const handleMeditationComplete = useCallback(() => {
    const cultivation = state.player.cultivation;
    const cultivationEfficiency = cultivation.cultivationEfficiency || 1.0;
    const experienceGain = Math.floor((Math.random() * 10 + 10) * cultivationEfficiency);
    const energyGain = Math.floor((Math.random() * 5 + 5) * cultivationEfficiency);
    
    const bottleneckChance = 0.3;
    const currentBottleneckProgress = cultivation.bottleneckProgress || 0;
    
    let newBottleneckProgress = currentBottleneckProgress;
    let bottleneckGainValue = 0;
    
    if (Math.random() < bottleneckChance) {
      const bottleneckGain = Math.floor(Math.random() * 3) + 1;
      bottleneckGainValue = bottleneckGain;
      newBottleneckProgress = currentBottleneckProgress + bottleneckGain;
      
      actions.addNotification({
        message: `Вы продвинулись в преодолении "бутылочного горлышка" (+${bottleneckGain})`,
        type: 'info'
      });
      
      // Используем оптимизированный метод
      increaseBottleneckProgress(bottleneckGain).catch(error => {
        console.error('Ошибка при обновлении прогресса "бутылочного горлышка":', error);
        // Резервное обновление через Redux
        actions.updateCultivation({
          bottleneckProgress: newBottleneckProgress
        });
      });
    }
    
    // Проверяем, не превысит ли опыт максимальное значение
    const experienceToNextLevel = cultivation.experienceToNextLevel || 100;
    const currentExperience = cultivation.experience || 0;
    const newExperience = Math.min(currentExperience + experienceGain, experienceToNextLevel);
    
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
        cultivation.energy + energyGain,
        cultivation.maxEnergy
      ),
      stage: cultivation.stage,
      level: cultivation.level
    };
    
    if (bottleneckGainValue > 0) {
      cultivationUpdates.bottleneckProgress = newBottleneckProgress;
    }
    
    // Используем оптимизированный метод обновления
    const userId = state.player.id;
    if (userId) {
      updateCultivationProgress(cultivationUpdates).catch(error => {
        console.error('Ошибка при обновлении данных культивации:', error);
        // Резервное обновление через Redux
        actions.updateCultivation(cultivationUpdates);
      });
    } else {
      actions.updateCultivation(cultivationUpdates);
    }

    // Проверяем квесты на завершение медитации
    if (userId) {
      try {
        QuestService.checkQuestEvent(userId, 'MEDITATION', {
          meditationType: 'daily_meditation',
          experienceGained: experienceGain,
          energyGained: energyGain
        });
      } catch (error) {
        console.error('Ошибка при проверке квестов медитации:', error);
      }
    }
  }, [state.player, actions, increaseBottleneckProgress, updateCultivationProgress]);

  // Оптимизированный useEffect для медитации
  useEffect(() => {
    if (!isMeditating) return;

    const meditationInterval = getInterval(INTERVAL_TYPES.GAME_TIME_UPDATE) || 100;
    const timer = setInterval(() => {
      setMeditationProgress(prev => {
        const newValue = prev + 1;
        if (newValue >= 100) {
          setTimeout(handleMeditationComplete, 0);
          return 0;
        }
        return newValue;
      });
    }, meditationInterval);
    
    return () => clearInterval(timer);
  }, [isMeditating, handleMeditationComplete]);

  // Дебаунсированная загрузка ресурсов
  const debouncedLoadResources = useCallback(
    simpleDebounce(async () => {
      if (resourcesLoading) return;
      
      setResourcesLoading(true);
      try {
        const cultivation = state.player.cultivation;
        const inventoryItems = state.player.inventory.items || [];
        const stage = cultivation.stage;
        const level = cultivation.level;
        const requiredResourcesFromState = cultivation.requiredResources || {};
        const resourceIds = Object.keys(requiredResourcesFromState);
        
        const resourcesNeeded = {};
        
        // Определяем стандартные ресурсы
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
        
        // Используем либо предопределенные ресурсы, либо стандартные
        const resourcesToCheck = resourceIds.length > 0 
          ? requiredResourcesFromState 
          : stageResources[stage] || stageResources['Закалка тела'];
        
        // Загружаем информацию о ресурсах
        for (const [id, amount] of Object.entries(resourcesToCheck)) {
          try {
            const resource = await ResourceService.getResourceById(id);
            if (resource) {
              resourcesNeeded[id] = {
                name: resource.name,
                amount: resourceIds.length > 0 ? amount : amount,
                available: inventoryItems.filter(item => item.id === id).length
              };
            }
          } catch (err) {
            console.error(`Ошибка при получении ресурса ${id}:`, err);
          }
        }
        
        setRequiredResources(resourcesNeeded);
        
        // Проверяем, есть ли все необходимые ресурсы
        const hasAll = Object.values(resourcesNeeded).every(resource => 
          resource.available >= resource.amount
        );
        
        setHasRequiredResources(hasAll);
      } catch (error) {
        console.error('Ошибка при получении требуемых ресурсов:', error);
        setHasRequiredResources(false);
      } finally {
        setResourcesLoading(false);
      }
    }, 3000, 'load-resources'),
    [state.player.cultivation, state.player.inventory.items, resourcesLoading]
  );

  // Оптимизированная загрузка ресурсов
  useEffect(() => {
    debouncedLoadResources();
  }, [debouncedLoadResources]);

  // Оптимизированная функция прорыва
  const handleBreakthrough = useCallback(() => {
    if (!canBreakthrough || hasActiveRequests()) return;
    
    setTimeout(async () => {
      try {
        const result = await performBreakthrough();
        
        if (result && result.success) {
          // Обновляем инвентарь после успешного прорыва
          const userId = state.player.id;
          if (userId && actions.loadInventoryData) {
            actions.loadInventoryData(userId);
          }
          
          // Добавляем очки характеристик если они не были добавлены автоматически
          if (result.statsPointsAwarded && !result.statsPointsApplied) {
            actions.updatePlayerStats({
              unassignedPoints: (state.player.stats.unassignedPoints || 0) + result.statsPointsAwarded
            });
          }
          
          actions.addNotification({
            message: result.message || 'Вы успешно повысили уровень культивации!',
            type: 'success'
          });
        } else {
          actions.addNotification({
            message: result?.message || 'Прорыв не удался.',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('Ошибка при выполнении прорыва:', error);
        actions.addNotification({
          message: `Ошибка при выполнении прорыва: ${error.message}`,
          type: 'error'
        });
      }
    }, 0);
  }, [canBreakthrough, hasActiveRequests, performBreakthrough, state.player, actions]);

  // Обработка трибуляции (оптимизированная)
  useEffect(() => {
    if (!tribulationActive || tribulationProgress >= 100 || tribulationResult) return;

    const timer = setInterval(() => {
      // Случайные события
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
        
        if (newProgress >= 100) {
          setTimeout(completeTribulation, 0);
          return 100;
        }
        
        return newProgress;
      });
    }, 500);
    
    return () => clearInterval(timer);
  }, [tribulationActive, tribulationResult, actions]);

  // Завершение трибуляции (оптимизированная)
  const completeTribulation = useCallback(() => {
    setTimeout(async () => {
      try {
        const cultivation = state.player.cultivation;
        const stats = state.player.stats;
        const spirit = stats.spirit || 0;
        const intellect = stats.intellect || 0;
        
        const successChance = 0.6 + (spirit / 150) + (intellect / 250);
        const success = Math.random() < successChance;
        
        const tribulationData = {
          success,
          level: cultivation.level,
          timestamp: Date.now(),
          stats: { spirit, intellect }
        };
        
        const userId = state.player.id;
        if (userId) {
          try {
            const result = await completeTribulationAPI(userId, tribulationData);
            
            if (success) {
              const rewardExperience = result.rewards?.experience || Math.floor(cultivation.experienceToNextLevel * 0.2);
              const energyReward = result.rewards?.energy || Math.floor(cultivation.maxEnergy * 0.2);
              
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
                  energy: Math.floor(cultivation.energy * 0.3),
                  health: Math.floor(state.player.health * 0.2)
                }
              });
              
              actions.addNotification({
                message: result.notificationMessage || 'Вы не смогли пройти трибуляцию и потеряли часть энергии.',
                type: 'error'
              });
            }
            
            window.dispatchEvent(new CustomEvent('tribulation-complete', {
              detail: { success, result }
            }));
            
            // Обновляем данные после трибуляции
            refreshCultivationData(true);
          } catch (error) {
            console.error('Ошибка при завершении трибуляции через API:', error);
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
  }, [state.player, actions, refreshCultivationData]);

  // Начало трибуляции (оптимизированная)
  const handleStartTribulation = useCallback(() => {
    if (tribulationActive) return;
    
    const cultivation = state.player.cultivation;
    const maxEnergy = cultivation.maxEnergy || 100;
    const currentEnergy = cultivation.energy || 0;
    
    if (currentEnergy < maxEnergy * 0.5) {
      actions.addNotification({
        message: 'Недостаточно энергии для начала трибуляции. Требуется минимум 50% от максимума.',
        type: 'error'
      });
      return;
    }
    
    setTimeout(() => {
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

  // Получение озарения (оптимизированная)
  const handleGainInsight = useCallback(() => {
    if (insightCooldown > 0 || hasActiveRequests()) return;
    
    setTimeout(async () => {
      try {
        const result = await gainInsight();
        
        if (result && result.success) {
          setInsightCooldown(24 * 60 * 60);
          
          actions.addNotification({
            message: result.message || 'Вы получили прозрение! Эффективность культивации увеличена.',
            type: 'success'
          });
        } else {
          setInsightCooldown(12 * 60 * 60);
          
          actions.addNotification({
            message: result?.message || 'Не удалось получить прозрение.',
            type: 'warning'
          });
        }
        
        window.dispatchEvent(new CustomEvent('insight-gained'));
      } catch (error) {
        console.error('Ошибка при получении прозрения:', error);
        actions.addNotification({
          message: 'Произошла ошибка при получении прозрения.',
          type: 'error'
        });
        
        setInsightCooldown(6 * 60 * 60);
      }
    }, 0);
  }, [insightCooldown, hasActiveRequests, gainInsight, actions]);

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
              disabled={isLoading}
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
                  {state.player.cultivation.experience || 0}/{cultivationStats.experienceToNextLevel}
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
            <S.ProgressBar progress={(cultivationStats.bottleneckProgress / cultivationStats.requiredBottleneckProgress) * 100} />
            <S.ProgressText>
              {cultivationStats.bottleneckProgress}/{cultivationStats.requiredBottleneckProgress}
            </S.ProgressText>
          </S.ProgressInfo>
        </S.Panel>
      </TabContent>
      
      <TabContent active={activeTab === 'breakthrough'}>
        <S.Panel>
          <h3>Прорыв</h3>
          
          <S.BreakthroughRequirements>
            <S.Requirement met={cultivationStats.hasEnoughExperience}>
              Опыт: {state.player.cultivation.experience}/{cultivationStats.experienceToNextLevel}
            </S.Requirement>
            <S.Requirement met={cultivationStats.hasEnoughEnergy}>
              Энергия: {state.player.cultivation.energy} (требуется {Math.floor(state.player.cultivation.maxEnergy * 0.8)})
            </S.Requirement>
            <S.Requirement met={cultivationStats.passedBottleneck}>
              Бутылочное горлышко: {cultivationStats.bottleneckProgress}/{cultivationStats.requiredBottleneckProgress}
            </S.Requirement>
            {cultivationStats.needsTribulation && (
              <S.Requirement met={cultivationStats.passedTribulation}>
                Трибуляция: {cultivationStats.passedTribulation ? 'Пройдена' : 'Не пройдена'}
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
            disabled={!canBreakthrough || isLoading || hasActiveRequests()}
            style={{ marginTop: '15px', width: '100%' }}
          >
            {isLoading ? 'Обработка...' : 'Попытаться совершить прорыв'}
          </S.Button>
        </S.Panel>
      </TabContent>
      
      <TabContent active={activeTab === 'tribulation'}>
        <S.Panel>
          <h3>Трибуляция</h3>
          
          {cultivationStats.needsTribulation && !cultivationStats.passedTribulation && (
            <>
              {!tribulationActive && !tribulationResult && (
                <>
                  <p>
                    Для перехода на следующий уровень культивации вам необходимо пройти трибуляцию.
                    Это испытание проверит вашу силу духа и тела.
                  </p>
                  <S.Button 
                    onClick={handleStartTribulation}
                    disabled={state.player.cultivation.energy < state.player.cultivation.maxEnergy * 0.5 || isLoading}
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
          
          {(!cultivationStats.needsTribulation || cultivationStats.passedTribulation) && (
            <p>
              Вам не требуется проходить трибуляцию на текущем уровне культивации.
              {cultivationStats.passedTribulation && cultivationStats.needsTribulation && ' Вы уже успешно прошли трибуляцию.'}
            </p>
          )}
        </S.Panel>
      </TabContent>
      
      <TabContent active={activeTab === 'insight'}>
        <S.Panel>
          <h3>Прозрение</h3>
          
          <S.Button
            onClick={handleGainInsight}
            disabled={insightCooldown > 0 || isLoading || hasActiveRequests()}
            style={{ marginTop: '15px', width: '100%' }}
          >
            {insightCooldown > 0
              ? `Доступно через: ${Math.floor(insightCooldown / 3600)}:${Math.floor((insightCooldown % 3600) / 60)}:${insightCooldown % 60}`
              : (isLoading ? 'Обработка...' : 'Получить прозрение')}
          </S.Button>
        </S.Panel>
      </TabContent>
    </S.Container>
  );
}

export default CultivationTabOptimized;