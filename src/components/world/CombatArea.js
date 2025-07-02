import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import { startCombat as startCombatAPI, performCombatAction, getCombatState } from '../../services/combat-api';
import { enemies, getModifiedEnemySpawns } from '../../data/enemies-adapter';
import PveBattleInterface from '../battle/PveBattleInterface';
import BattleResult from '../battle/BattleResult';

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
`;

const WorldArea = styled.div`
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const WeatherBanner = styled.div`
  background: rgba(30, 30, 30, 0.95);
  border-radius: 8px;
  padding: 10px 15px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 3px solid #d4af37;
`;

const WeatherInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const WeatherIcon = styled.div`
  font-size: 1.8rem;
`;

const WeatherDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const WeatherType = styled.div`
  color: #d4af37;
  font-size: 1.1rem;
`;

const TimeOfDay = styled.div`
  color: #aaa;
  font-size: 0.9rem;
`;

const WeatherEffects = styled.div`
  color: #aaa;
  font-size: 0.8rem;
  max-width: 50%;
  
  span {
    color: ${props => props.positive ? '#a3be8c' : '#bf616a'};
  }
`;

// Функции для получения иконок времени суток и погоды
const getTimeIcon = (timeOfDay) => {
  switch(timeOfDay) {
    case 'рассвет': return '🌅';
    case 'утро': return '🌄';
    case 'полдень': return '☀️';
    case 'день': return '🌞';
    case 'вечер': return '🌇';
    case 'ночь': return '🌙';
    default: return '⏰';
  }
};

const getWeatherIcon = (weatherType) => {
  switch(weatherType) {
    case 'Ясно': return '☀️';
    case 'Облачно': return '☁️';
    case 'Дождь': return '🌧️';
    case 'Гроза': return '⛈️';
    case 'Туман': return '🌫️';
    case 'Снег': return '❄️';
    default: return '🌈';
  }
};

const AreaInfo = styled.div`
  background: rgba(30, 30, 30, 0.95);
  border-radius: 8px;
  padding: 20px;
`;

const AreaTitle = styled.h2`
  color: #d4af37;
  margin: 0 0 10px 0;
`;

const AreaDescription = styled.p`
  color: #aaa;
  margin: 0;
  line-height: 1.6;
`;

const EnemiesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
`;

const EnemyCard = styled.div`
  background: rgba(30, 30, 30, 0.95);
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  
  ${props => props.available && `
    &:hover {
      border-color: #d4af37;
      transform: translateY(-2px);
    }
  `}
  
  ${props => !props.available && `
    opacity: 0.7;
    cursor: not-allowed;
  `}
`;

const EnemyHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const EnemyIcon = styled.div`
  font-size: 2rem;
`;

const EnemyInfo = styled.div`
  flex: 1;
`;

const EnemyName = styled.h3`
  color: #d4af37;
  margin: 0;
  font-size: 1.1rem;
`;

const EnemyLevel = styled.div`
  color: ${props => props.available ? '#aaa' : '#f44336'};
  font-size: 0.9rem;
`;

const EnemyDescription = styled.p`
  color: #aaa;
  margin: 0 0 10px 0;
  font-size: 0.9rem;
`;

const EnemyStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
  font-size: 0.8rem;
  color: #aaa;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const RewardsList = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const RewardItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: #aaa;
  
  span {
    color: #d4af37;
  }
`;

function CombatArea({ areaId }) {
  const { state, actions } = useGame();
  
  const [combatState, setCombatState] = useState(null);
  const [activeEnemy, setActiveEnemy] = useState(null); // Хранит полный объект врага во время боя

  useEffect(() => {
    if (!combatState || combatState.status !== 'active') {
      return;
    }

    const interval = setInterval(async () => {
      const updatedState = await getCombatState(combatState.id);
      if (updatedState.success) {
        setCombatState(updatedState.combat);
      }
    }, 2000); // Опрос каждые 2 секунды

    return () => clearInterval(interval);
  }, [combatState]);
  
  const defaultWeather = {
    weatherType: 'Ясно',
    timeOfDay: 'день',
    weatherIntensity: 5,
    weatherEffects: {
      combat: {
        damageModifiers: {},
        hitChanceModifier: 1.0,
        dodgeChanceModifier: 1.0,
        critChanceModifier: 1.0,
        enemySpawnRateModifier: 1.0
      }
    }
  };
  
  const weather = {
    ...defaultWeather,
    ...(state.weather || {}),
    weatherEffects: {
      ...defaultWeather.weatherEffects,
      ...(state.weather?.weatherEffects || {}),
      combat: {
        ...defaultWeather.weatherEffects.combat,
        ...(state.weather?.weatherEffects?.combat || {})
      }
    }
  };
  
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
  
  const areaEnemies = getModifiedEnemySpawns(
    areaId,
    weather.timeOfDay,
    weather.weatherType
  );
  
  let availableEnemies = [];
  if (!Array.isArray(areaEnemies)) {
    console.error('areaEnemies не является массивом:', areaEnemies);
  } else {
    try {
      availableEnemies = areaEnemies.map(spawn => {
        if (!spawn || typeof spawn !== 'object') {
          console.error('Некорректный объект spawn:', spawn);
          return null;
        }
        const enemy = spawnEnemy(spawn);
        if (!enemy || !enemy.stats) {
          console.error('Некорректный объект enemy:', enemy);
          return null;
        }
        return {
          ...enemy,
          available: state.player.cultivation.level >= spawn.minLevel
        };
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
  
  const handleCombatAction = async (actionType) => {
    if (!combatState) return;

    if (actionType === 'flee') {
        setCombatState(null);
        setActiveEnemy(null);
        actions.addNotification({ message: 'Вы сбежали из боя', type: 'warning' });
        return;
    }

    const updatedState = await performCombatAction(combatState.id, { type: actionType });
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
          onClose={() => {
            setCombatState(null);
            setActiveEnemy(null);
            // Возможно, здесь нужно будет обновить состояние игрока в GameContext
            // actions.fetchPlayerState();
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
        <WeatherBanner>
          <WeatherInfo>
            <WeatherIcon>{getTimeIcon(weather.timeOfDay)}</WeatherIcon>
            <WeatherDetails>
              <WeatherType>{weather.weatherType}</WeatherType>
              <TimeOfDay>{weather.timeOfDay}</TimeOfDay>
            </WeatherDetails>
          </WeatherInfo>
          <WeatherEffects>
            Влияние погоды...
          </WeatherEffects>
        </WeatherBanner>
        <AreaInfo>
          <AreaTitle>
            {areaId === 'starting_area' && 'Тренировочная площадка'}
            {areaId === 'mountain_path' && 'Горная тропа'}
            {areaId === 'ancient_ruins' && 'Древние руины'}
          </AreaTitle>
          <AreaDescription>
            {areaId === 'starting_area' && 'Безопасное место для начинающих культиваторов. Здесь обитают слабые духовные звери, идеально подходящие для тренировки.'}
            {areaId === 'mountain_path' && 'Извилистая тропа, ведущая в горы. Здесь можно встретить более сильных противников и найти редкие ресурсы.'}
            {areaId === 'ancient_ruins' && 'Загадочные руины древней цивилизации. В этом опасном месте обитают могущественные духи и хранятся древние сокровища.'}
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
                <EnemyIcon>{enemy.icon}</EnemyIcon>
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
