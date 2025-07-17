import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useGame } from '../../context/GameContext';
import { startCombat as startCombatAPI, performCombatAction, getCombatState } from '../../services/combat-api';
const { getCultivationProgress } = require('../../services/cultivation-api');
const { getCharacterProfile } = require('../../services/character-profile-service-api');
import { enemies } from '../../data/enemies-adapter';
import PveBattleInterface from '../battle/PveBattleInterface';
import BattleResult from '../battle/BattleResult';

// Анимации
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
`;

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg,
    rgba(26, 35, 126, 0.1) 0%,
    rgba(74, 20, 140, 0.1) 25%,
    rgba(144, 19, 254, 0.05) 50%,
    rgba(212, 175, 55, 0.1) 75%,
    rgba(244, 208, 63, 0.05) 100%
  );
  overflow: hidden;
  animation: fadeIn 0.6s ease-out;
`;

const WorldArea = styled.div`
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #f0f0f0;
  box-sizing: border-box;
`;



const AreaInfo = styled.div`
  background: linear-gradient(145deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(212, 175, 55, 0.05) 100%
  );
  backdrop-filter: blur(10px);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #d4af37, #f4d03f, #d4af37);
  }
`;

const AreaTitle = styled.h2`
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: bold;
`;

const AreaDescription = styled.p`
  color: rgba(240, 240, 240, 0.9);
  margin: 0;
  line-height: 1.6;
  font-size: 16px;
`;

const EnemiesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  max-width: 100%;
  overflow: hidden;
`;

const EnemyCard = styled.div`
  background: linear-gradient(145deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(212, 175, 55, 0.05) 100%
  );
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.available ? 'rgba(212, 175, 55, 0.3)' : 'rgba(150, 150, 150, 0.2)'};
  border-radius: 16px;
  padding: 20px;
  cursor: ${props => props.available ? 'pointer' : 'not-allowed'};
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  ${props => props.available && `
    &:hover {
      border-color: rgba(212, 175, 55, 0.6);
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(212, 175, 55, 0.2);
      
      &::before {
        left: 100%;
      }
    }
  `}
  
  ${props => !props.available && `
    opacity: 0.6;
    filter: grayscale(0.3);
  `}
`;

const EnemyHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const EnemyIcon = styled.div`
  font-size: 3rem;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg,
    rgba(212, 175, 55, 0.15) 0%,
    rgba(244, 208, 63, 0.1) 100%
  );
  backdrop-filter: blur(5px);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg,
      transparent 30%,
      rgba(212, 175, 55, 0.1) 50%,
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
`;

const EnemyImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const EnemyIconFallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  background: linear-gradient(135deg,
    rgba(212, 175, 55, 0.2) 0%,
    rgba(244, 208, 63, 0.1) 100%
  );
  border-radius: 8px;
  color: #d4af37;
`;

// Компонент для отображения иконки врага с поддержкой изображений
const EnemyIconDisplay = ({ enemy }) => {
  const [imageError, setImageError] = React.useState(false);
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  // Проверяем, является ли icon URL-ом изображения
  const isImageUrl = enemy.icon && (
    enemy.icon.startsWith('http') ||
    enemy.icon.startsWith('/') ||
    enemy.icon.includes('.png') ||
    enemy.icon.includes('.jpg') ||
    enemy.icon.includes('.jpeg') ||
    enemy.icon.includes('.gif') ||
    enemy.icon.includes('.webp')
  );
  
  return (
    <EnemyIcon>
      {isImageUrl && !imageError ? (
        <EnemyImage
          src={enemy.icon}
          alt={enemy.name}
          onError={handleImageError}
        />
      ) : (
        <EnemyIconFallback>
          {enemy.icon || '👹'}
        </EnemyIconFallback>
      )}
    </EnemyIcon>
  );
};

const EnemyInfo = styled.div`
  flex: 1;
`;

const EnemyName = styled.h3`
  background: linear-gradient(135deg, #f4d03f 0%, #d4af37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const EnemyLevel = styled.div`
  color: ${props => props.available ? 'rgba(255, 255, 255, 0.8)' : '#f44336'};
  font-size: 13px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
`;

const EnemyDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 16px 0;
  font-size: 14px;
  line-height: 1.5;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const EnemyStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
  font-size: 13px;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
  backdrop-filter: blur(5px);
  border-radius: 8px;
  border: 1px solid rgba(212, 175, 55, 0.1);
  
  span:first-child {
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }
  
  span:last-child {
    color: #f4d03f;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
`;

const RewardsList = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(212, 175, 55, 0.3);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(244, 208, 63, 0.02) 100%);
  border-radius: 12px;
  padding: 12px;
`;

const RewardItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 6px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(2px);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
  
  span {
    color: #f4d03f;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
`;

function CombatArea({ areaId, existingCombat = null, activeEnemy: propActiveEnemy = null, onForcedExit = null, locationData = null }) {
  const { state, actions } = useGame();
  
  const [combatState, setCombatState] = useState(existingCombat);
  const [activeEnemy, setActiveEnemy] = useState(propActiveEnemy); // Хранит полный объект врага во время боя

  // Инициализация с существующим боем
  useEffect(() => {
    if (existingCombat) {
      console.log('[CombatArea] Инициализация с существующим боем:', existingCombat);
      setCombatState(existingCombat);
      
      // Если враг не передан через пропсы, создаем его из данных боя
      if (!propActiveEnemy && existingCombat.enemy_state) {
        const enemyFromCombat = {
          name: existingCombat.enemy_state.name || 'Неизвестный враг',
          level: existingCombat.enemy_state.enemyLevel || 1,
          id: existingCombat.enemy_id || 'unknown',
          icon: '👹', // Дефолтная иконка
          stats: existingCombat.enemy_state
        };
        setActiveEnemy(enemyFromCombat);
        console.log('[CombatArea] Создан объект врага из данных боя:', enemyFromCombat);
      }
    }
  }, [existingCombat, propActiveEnemy]);

  useEffect(() => {
    if (!combatState || combatState.status !== 'active') {
      return;
    }

    const interval = setInterval(async () => {
      const updatedState = await getCombatState(combatState.id);
      if (updatedState.success) {
        setCombatState(updatedState.combat);
      }
    }, 1000); // Опрос каждую секунду

    return () => clearInterval(interval);
  }, [combatState]);
  
  
  const getEnemyLevel = (spawn) => {
    return Math.floor(
      spawn.minLevel + 
      Math.random() * (spawn.maxLevel - spawn.minLevel + 1)
    );
  };
  
  const spawnEnemy = (spawn) => {
    const baseEnemy = enemies.find(e => e.id === spawn.id);
    if (!baseEnemy) {
      console.error(`Враг с ID ${spawn.id} не найден в базе данных enemies.`);
      return {
        id: spawn.id,
        name: spawn.name || `Враг ${spawn.id}`,
        icon: spawn.icon || '👹',
        description: `Неизвестный противник из ${areaId}`,
        level: spawn.minLevel || 1,
        requiredLevel: spawn.minLevel || 1,
        category: spawn.category || 'normal',
        stats: { health: 100, energy: 50, physicalDefense: 10, spiritualDefense: 10, accuracy: 70, evasion: 20 },
        attacks: [{ name: "Базовая атака", damage: 10, damageType: "physical", energyCost: 0 }],
        experience: 50,
        currency: { min: 5, max: 15 },
        loot: []
      };
    }
    
    const cacheKey = `${areaId}_${spawn.id}`;
    const cachedEnemy = state.world?.generatedEnemies?.[cacheKey];
    
    if (cachedEnemy) {
      return cachedEnemy;
    }
    
    const level = getEnemyLevel(spawn);
    const levelMultiplier = 1 + (level - baseEnemy.level) * 0.1;
    
    const newEnemy = {
      ...baseEnemy,
      level,
      requiredLevel: spawn.minLevel,
      stats: {
        ...baseEnemy.stats,
        health: Math.floor(baseEnemy.stats.health * levelMultiplier),
        energy: Math.floor(baseEnemy.stats.energy * levelMultiplier),
        physicalDefense: Math.floor(baseEnemy.stats.physicalDefense * levelMultiplier),
        spiritualDefense: Math.floor(baseEnemy.stats.spiritualDefense * levelMultiplier)
      },
      attacks: baseEnemy.attacks.map(attack => ({
        ...attack,
        damage: Math.floor(attack.damage * levelMultiplier)
      })),
      experience: Math.floor(baseEnemy.experience * levelMultiplier),
      currency: {
        min: Math.floor(baseEnemy.currency.min * levelMultiplier),
        max: Math.floor(baseEnemy.currency.max * levelMultiplier)
      }
    };
    
    actions.cacheGeneratedEnemy(areaId, spawn.id, newEnemy);
    return newEnemy;
  };
  
  // Используем данные врагов из API локации вместо хардкода
  const areaEnemies = locationData?.enemies || [];
  console.log('[CombatArea] Используем врагов из locationData:', areaEnemies);
  
  let availableEnemies = [];
  if (!Array.isArray(areaEnemies)) {
    console.error('areaEnemies не является массивом:', areaEnemies);
  } else {
    try {
      // API возвращает полные объекты врагов из базы данных, используем их напрямую
      availableEnemies = areaEnemies.map(enemy => {
        if (!enemy || typeof enemy !== 'object') {
          console.error('Некорректный объект enemy:', enemy);
          return null;
        }
        
        // Проверяем, что у врага есть необходимые поля
        if (!enemy.id || !enemy.name) {
          console.error('У врага отсутствуют обязательные поля:', enemy);
          return null;
        }
        
        // Используем данные напрямую из API с минимальными дополнениями
        const formattedEnemy = {
          ...enemy, // Используем все данные из API
          // Добавляем только недостающие поля с fallback значениями
          icon: enemy.icon || '👹',
          stats: enemy.stats || {
            health: 100,
            energy: 50,
            physicalDefense: 10,
            spiritualDefense: 10
          },
          attacks: enemy.attacks || [],
          currency: enemy.currency || { min: 1, max: 5 },
          loot: enemy.loot || [],
          // Используем requiredLevel из API для проверки доступности
          available: state.player.cultivation.level >= (enemy.requiredLevel || enemy.level || 1)
        };
        
        return formattedEnemy;
      }).filter(enemy => enemy !== null);
    } catch (error) {
      console.error('Ошибка при обработке врагов:', error);
    }
  }

  const handleEnemyClick = async (enemy) => {
    if (!enemy.available) {
      actions.addNotification({ message: 'Ваш уровень слишком низок для этого противника', type: 'error' });
      return;
    }
    
    try {
      const initialState = await startCombatAPI(enemy.id);
      if (initialState.success) {
        setCombatState(initialState.combat);
        setActiveEnemy(enemy);
        actions.addNotification({ message: `Начался бой с ${enemy.name}!`, type: 'info' });
      } else {
        actions.addNotification({ message: `Не удалось начать бой: ${initialState.message}`, type: 'error' });
      }
    } catch (error) {
      actions.addNotification({ message: `Ошибка сети: ${error.message}`, type: 'error' });
    }
  };
  
  const handleCombatAction = async (action) => {
    if (!combatState) return;

    // Обрабатываем как простые строковые действия, так и объекты
    const actionPayload = typeof action === 'string' ? { type: action } : action;

    if (actionPayload.type === 'flee') {
        // Если есть обработчик принудительного выхода, используем его
        if (onForcedExit) {
          console.log('[CombatArea] Вызов принудительного выхода через onForcedExit');
          onForcedExit();
        } else {
          // Стандартная логика бегства
          setCombatState(null);
          setActiveEnemy(null);
          actions.addNotification({ message: 'Вы сбежали из боя', type: 'warning' });
        }
        return;
    }

    const updatedState = await performCombatAction(combatState.id, actionPayload);
    if (updatedState.success) {
        setCombatState(updatedState.combat);
        if (updatedState.combat.status === 'completed') {
            actions.addNotification({ message: `Бой завершен! Победитель: ${updatedState.combat.winner}`, type: 'success' });
        }
    } else {
        actions.addNotification({ message: `Ошибка действия: ${updatedState.message}`, type: 'error' });
    }
  };

  const preparePlayerData = () => {
      if (!combatState) return null;
      return {
          name: state.player.name,
          level: state.player.cultivation.level,
          ...combatState.player_state
      };
  };

  const prepareEnemyData = () => {
      if (!combatState || !activeEnemy) return null;
      return {
          name: activeEnemy.name,
          level: activeEnemy.level,
          ...combatState.enemy_state
      };
  };

  if (combatState && activeEnemy) {
    if (combatState.status === 'completed') {
      return (
        <BattleResult
          result={combatState.winner === 'player' ? 'victory' : 'defeat'}
          rewards={combatState.rewards}
          onClose={async () => {
            try {
              // 1. Получаем ID пользователя из состояния
              const userId = state.player.id;
              if (!userId) {
                console.error("Не удалось получить ID пользователя для обновления состояния.");
                return;
              }

              // 2. Запрашиваем обновленные данные
              const [cultivationData, profileData] = await Promise.all([
                getCultivationProgress(userId),
                getCharacterProfile(userId)
              ]);

              // 3. Обновляем состояние в GameContext
              if (cultivationData) {
                actions.updateCultivation(cultivationData);
              }
              if (profileData && profileData.currency) {
                actions.updateInventoryCurrency(profileData.currency);
              }
              
              actions.addNotification({ message: 'Данные персонажа обновлены.', type: 'success' });

            } catch (error) {
              console.error("Ошибка при обновлении данных персонажа после боя:", error);
              actions.addNotification({ message: `Не удалось обновить данные: ${error.message}`, type: 'error' });
            } finally {
              // 4. Сбрасываем состояние боя
              setCombatState(null);
              setActiveEnemy(null);
            }
          }}
        />
      );
    }

    return <PveBattleInterface
        player={preparePlayerData()}
        enemy={prepareEnemyData()}
        log={combatState.log}
        onAction={handleCombatAction}
        isPlayerTurn={combatState.turn === 'player'}
    />;
  }
  
  return (
    <Container>
      <WorldArea>
        <AreaInfo>
          <AreaTitle>
            {locationData?.name || 'Неизвестная локация'}
          </AreaTitle>
          <AreaDescription>
            {locationData?.description || 'Описание локации недоступно.'}
          </AreaDescription>
        </AreaInfo>
        
        <EnemiesList>
          {availableEnemies.map(enemy => (
            <EnemyCard
              key={enemy.id}
              available={enemy.available}
              onClick={() => handleEnemyClick(enemy)}
            >
              <EnemyHeader>
                <EnemyIconDisplay enemy={enemy} />
                <EnemyInfo>
                  <EnemyName>{enemy.name}</EnemyName>
                  <EnemyLevel available={enemy.available}>
                    {enemy.available
                      ? `Уровень ${enemy.level}`
                      : `Требуется уровень ${enemy.requiredLevel}`
                    }
                  </EnemyLevel>
                </EnemyInfo>
              </EnemyHeader>
              
              <EnemyDescription>
                {enemy.description}
              </EnemyDescription>
              
              <EnemyStats>
                <StatRow>
                  <span>Здоровье:</span>
                  <span>{enemy.stats.health}</span>
                </StatRow>
                <StatRow>
                  <span>Защита:</span>
                  <span>
                    {enemy.stats.physicalDefense !== undefined
                      ? `${enemy.stats.physicalDefense || 0}/${enemy.stats.spiritualDefense || 0}`
                      : (enemy.stats.defense !== undefined ? enemy.stats.defense : "0")}
                  </span>
                </StatRow>
                <StatRow>
                  <span>Точность:</span>
                  <span>{enemy.stats.accuracy}</span>
                </StatRow>
                <StatRow>
                  <span>Уклонение:</span>
                  <span>{enemy.stats.evasion}</span>
                </StatRow>
              </EnemyStats>
              
              <RewardsList>
                <RewardItem>
                  <span>✨</span> {enemy.experience} опыта
                </RewardItem>
                <RewardItem>
                  <span>💰</span> {enemy.currency.min}-{enemy.currency.max} монет
                </RewardItem>
                {enemy.loot.map((item, index) => (
                  <RewardItem key={index}>
                    <span>{item.icon || '📦'}</span>
                    {item.name} ({Math.floor(item.chance)}%)
                  </RewardItem>
                ))}
              </RewardsList>
            </EnemyCard>
          ))}
        </EnemiesList>
      </WorldArea>
    </Container>
  );
}

export default CombatArea;
