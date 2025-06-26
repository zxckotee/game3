import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import CombatManager from '../combat/CombatManager';
import { enemies, getModifiedEnemySpawns } from '../../data/enemies-adapter';

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
  
  // Инициализируем selectedEnemy, проверяя наличие врага в глобальном состоянии
  const [selectedEnemy, setSelectedEnemy] = useState(() => {
    // Если уже есть активный бой, используем врага из глобального состояния
    if (state.combat.inCombat && (state.combat.enemy || state.combat.enemyCombatState)) {
      console.log('CombatArea: Восстановление противника из глобального состояния');
      return state.combat.enemy || state.combat.enemyCombatState;
    }
    return null;
  });
  
  // Получаем информацию о погоде и времени суток - вызываем все хуки в начале компонента
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
  
  // Безопасно получаем объект weather с проверкой вложенных свойств
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
  
  // Функции-хелперы
  const getEnemyLevel = (spawn) => {
    return Math.floor(
      spawn.minLevel + 
      Math.random() * (spawn.maxLevel - spawn.minLevel + 1)
    );
  };
  
  // Проверяем кэш противников и используем его, если доступен
  const spawnEnemy = (spawn) => {
    // Поиск базового противника
    const baseEnemy = enemies.find(e => e.id === spawn.id);
    if (!baseEnemy) {
      console.error(`Враг с ID ${spawn.id} не найден в базе данных enemies. Доступные ID:`, enemies.map(e => e.id));
      
      // Вместо null создаем базового противника по умолчанию
      return {
        id: spawn.id,
        name: spawn.name || `Враг ${spawn.id}`,
        icon: spawn.icon || '👹',
        description: `Неизвестный противник из ${areaId}`,
        level: spawn.minLevel || 1,
        requiredLevel: spawn.minLevel || 1,
        category: spawn.category || 'normal',
        stats: {
          health: 100,
          energy: 50,
          physicalDefense: 10,
          spiritualDefense: 10,
          accuracy: 70,
          evasion: 20
        },
        attacks: [
          {
            name: "Базовая атака",
            damage: 10,
            damageType: "physical",
            energyCost: 0
          }
        ],
        experience: 50,
        currency: {
          min: 5,
          max: 15
        },
        loot: []
      };
    }
    
    // Создаем ключ кэша
    const cacheKey = `${areaId}_${spawn.id}`;
    
    // Проверяем, есть ли кэшированный противник
    const cachedEnemy = state.world?.generatedEnemies?.[cacheKey];
    
    if (cachedEnemy) {
      console.log(`🎮 Используем кэшированного противника: ${cacheKey}`, {
        level: cachedEnemy.level,
        requiredLevel: cachedEnemy.requiredLevel
      });
      
      return cachedEnemy;
    }
    
    // Если нет в кэше, генерируем заново
    const level = getEnemyLevel(spawn);
    const levelMultiplier = 1 + (level - baseEnemy.level) * 0.1;
    
    // Создаем нового противника с корректным requiredLevel
    const newEnemy = {
      ...baseEnemy,
      level,
      requiredLevel: spawn.minLevel, // Явно устанавливаем requiredLevel из spawn.minLevel
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
    
    // Кэшируем противника
    actions.cacheGeneratedEnemy(areaId, spawn.id, newEnemy);
    
    console.log(`🎮 Сгенерирован и кэширован противник: ${cacheKey}`, {
      level: newEnemy.level,
      requiredLevel: newEnemy.requiredLevel
    });
    
    return newEnemy;
  };
  
  // Получаем список врагов - перемещаем все вычисления наверх
  console.log('Доступные враги в enemies:', enemies.map(e => e.id));
  
  // Проверяем, что getModifiedEnemySpawns возвращает правильный формат
  const areaEnemies = getModifiedEnemySpawns(
    areaId,
    weather.timeOfDay,
    weather.weatherType
  );
  
  console.log('Результат getModifiedEnemySpawns:', areaEnemies);
  
  // Предварительно объявляем переменную, чтобы она была доступна вне блоков условий
  let availableEnemies = [];
  
  // Проверяем, является ли areaEnemies массивом
  if (!Array.isArray(areaEnemies)) {
    console.error('areaEnemies не является массивом:', areaEnemies);
    // Используем безопасный пустой массив
  } else {
    try {
      // Если это массив, выполняем обработку
      availableEnemies = areaEnemies.map(spawn => {
        console.log('Спавн врага:', spawn);
        
        // Проверяем, что spawn имеет все необходимые поля
        if (!spawn || typeof spawn !== 'object') {
          console.error('Некорректный объект spawn:', spawn);
          return null;
        }
        
        const enemy = spawnEnemy(spawn);
        console.log('Результат спавна:', enemy);
        
        // Дополнительная проверка на корректность объекта enemy
        if (!enemy || !enemy.stats) {
          console.error('Некорректный объект enemy:', enemy);
          return null;
        }
        
        return {
          ...enemy,
          available: state.player.cultivation.level >= spawn.minLevel
        };
      }).filter(enemy => enemy !== null); // Удаляем null-элементы из массива
    } catch (error) {
      console.error('Ошибка при обработке врагов:', error);
      // В случае ошибки используем пустой массив
    }
  }
  
  // Добавляем эффект для отслеживания глобального состояния боя
  // и синхронизации с локальным состоянием
  useEffect(() => {
    // Если есть активный бой в глобальном состоянии, но нет в локальном
    if (state.combat.inCombat &&
        (state.combat.enemy || state.combat.enemyCombatState) &&
        (!selectedEnemy || state.combat.isProcessingAction)) {
      
      console.log('CombatArea: Синхронизация с глобальным состоянием боя');
      const globalEnemy = state.combat.enemy || state.combat.enemyCombatState;
      
      if (globalEnemy && globalEnemy.id) {
        setSelectedEnemy(globalEnemy);
      }
    }
    // Если бой завершен в глобальном состоянии, но не в локальном
    else if (!state.combat.inCombat && selectedEnemy) {
      console.log('CombatArea: Бой завершен в глобальном состоянии, очищаем локальное');
      setSelectedEnemy(null);
    }
  }, [state.combat, selectedEnemy]);

  // Создаем ref для отслеживания предыдущего значения выбранной вкладки
  const prevTabRef = useRef(state.ui.selectedTab);

  // Эффект для обработки возвращения на вкладку карты во время боя
  useEffect(() => {
    const currentTab = state.ui.selectedTab;
    const prevTab = prevTabRef.current;
    
    // Обновляем ссылку на предыдущую вкладку
    prevTabRef.current = currentTab;
    
    // Если пользователь вернулся на вкладку карты и есть активный бой
    if (currentTab === 'map' && prevTab !== 'map' && state.combat.inCombat) {
      console.log('CombatArea: Вернулись на вкладку карты во время боя');
      
      // Проверяем, нужно ли восстановить состояние боя
      if (state.combat.isProcessingAction) {
        console.log('CombatArea: Обнаружено "зависшее" состояние, перезапускаем ход NPC');
        // Сигнализируем компоненту CombatManager, что нужно продолжить бой
        actions.updateCombatState({ isProcessingAction: false, forceNPCTurn: true });
      }
    }
  }, [state.ui.selectedTab, state.combat.inCombat]);

  const handleEnemySelect = (enemy) => {
    if (!enemy.available) return;
    
    // Пропускаем если бой уже идет с этим же противником
    if (selectedEnemy && selectedEnemy.id === enemy.id && state.combat.inCombat) {
      console.log('CombatArea: Этот противник уже выбран:', enemy.name);
      return;
    }
    
    // Если бой уже идет с другим противником, сначала завершаем его
    if (state.combat.inCombat) {
      console.log('CombatArea: Завершаем текущий бой перед началом нового');
      actions.endCombat();
    }
    
    // Проверяем валидность врага перед установкой
    if (!enemy || typeof enemy !== 'object') {
      console.error('CombatArea: Попытка выбрать некорректного врага', enemy);
      return;
    }
    
    if (!enemy.stats) {
      console.error('CombatArea: У выбранного врага отсутствуют stats', enemy);
      return;
    }
    
    console.log('CombatArea: Выбран противник для боя:', enemy.name, enemy);
    
    // Сначала вызываем startCombat для обновления глобального состояния
    actions.startCombat(enemy);
    
    // Затем устанавливаем локальное состояние
    setSelectedEnemy(enemy);
  };
  
  const handleCombatEnd = (result) => {
    // Проверяем, что бой действительно был активен перед завершением
    if (state.combat.inCombat) {
      // Очищаем как локальное, так и глобальное состояние
      setSelectedEnemy(null);
      actions.endCombat(); // Вызываем endCombat для очистки глобального состояния
      
      // Выводим результаты боя в консоль для отладки
      console.log('CombatArea: Бой завершен с результатом:', result);
      
      // Дополнительная логика после боя может быть добавлена здесь
    } else {
      console.log('CombatArea: Попытка завершить бой, который уже завершен');
    }
  };
  
  // Вместо условного возврата используем условный рендеринг в одном return statement
  
  return (
    <Container>
      {selectedEnemy && state.combat.inCombat ? (
        <CombatManager
          enemy={selectedEnemy}
          onEnd={handleCombatEnd}
          weatherEffects={weather.weatherEffects}
          key={`combat-${selectedEnemy.id}-${state.combat.forceNPCTurn ? 'forced' : 'normal'}`}
        />
      ) : (
        <WorldArea>
          {/* Отображение информации о текущей погоде и времени суток */}
          <WeatherBanner>
            <WeatherInfo>
              <WeatherIcon>
                {getWeatherIcon(weather.weatherType)}
                {getTimeIcon(weather.timeOfDay)}
              </WeatherIcon>
              <WeatherDetails>
                <WeatherType>{weather.weatherType}</WeatherType>
                <TimeOfDay>{weather.formattedTime || '12:00'} ({weather.timeOfDay})</TimeOfDay>
              </WeatherDetails>
            </WeatherInfo>
            
            <WeatherEffects>
              {(weather.weatherEffects?.combat?.hitChanceModifier !== undefined && 
                weather.weatherEffects.combat.hitChanceModifier !== 1.0) && (
                <div>Шанс попадания: 
                  <span positive={weather.weatherEffects.combat.hitChanceModifier > 1.0}>
                    {weather.weatherEffects.combat.hitChanceModifier > 1.0 ? ' +' : ' -'}
                    {Math.abs(Math.round((weather.weatherEffects.combat.hitChanceModifier - 1) * 100))}%
                  </span>
                </div>
              )}
              {(weather.weatherEffects?.combat?.critChanceModifier !== undefined && 
                weather.weatherEffects.combat.critChanceModifier !== 1.0) && (
                <div>Шанс крита: 
                  <span positive={weather.weatherEffects.combat.critChanceModifier > 1.0}>
                    {weather.weatherEffects.combat.critChanceModifier > 1.0 ? ' +' : ' -'}
                    {Math.abs(Math.round((weather.weatherEffects.combat.critChanceModifier - 1) * 100))}%
                  </span>
                </div>
              )}
            </WeatherEffects>
          </WeatherBanner>
          <AreaInfo>
            <AreaTitle>
              {areaId === 'starting_area' && 'Тренировочная площадка'}
              {areaId === 'mountain_path' && 'Горная тропа'}
              {areaId === 'ancient_ruins' && 'Древние руины'}
            </AreaTitle>
            <AreaDescription>
              {areaId === 'starting_area' && 
                'Безопасное место для начинающих культиваторов. Здесь обитают слабые духовные звери, идеально подходящие для тренировки.'
              }
              {areaId === 'mountain_path' && 
                'Извилистая тропа, ведущая в горы. Здесь можно встретить более сильных противников и найти редкие ресурсы.'
              }
              {areaId === 'ancient_ruins' && 
                'Загадочные руины древней цивилизации. В этом опасном месте обитают могущественные духи и хранятся древние сокровища.'
              }
            </AreaDescription>
          </AreaInfo>
          
          <EnemiesList>
            {availableEnemies.map(enemy => (
              <EnemyCard
                key={enemy.id}
                available={enemy.available}
                onClick={() => handleEnemySelect(enemy)}
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
      )}
    </Container>
  );
}

export default CombatArea;
