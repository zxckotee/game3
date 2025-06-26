import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import CombatInterface from './CombatInterface';
import CombatResults from './CombatResults';
import { combatActions, combatStats, combatRewards, techniques } from '../../data/combat';
import { petTypeAbilities } from '../../data/spirit-pets-adapter';
import weatherService from '../../services/weather-service';

function CombatManager({ enemy: initialEnemy, onEnd, weatherEffects }) {
  const { state, actions } = useGame();
  const activePet = state.player.spiritPets.pets.find(pet => pet.id === state.player.spiritPets.activePetId);
  
  // Добавляем состояние для отслеживания обработки действия
  const [isProcessingAction, setIsProcessingAction] = useState(false);
   
  // Проверяем наличие сохраненного состояния боя
  const hasSavedCombatState = state.combat.inCombat &&
                              state.combat.enemyCombatState &&
                              state.combat.enemyCombatState.id === initialEnemy.id;
  
  console.log('Проверка сохраненного состояния боя:', {
    hasSavedState: hasSavedCombatState,
    enemyId: initialEnemy.id,
    savedEnemyId: state.combat.enemyCombatState?.id,
    globalEnemyId: state.combat.enemy?.id,
    inCombat: state.combat.inCombat,
    savedEnemyHealth: state.combat.enemyCombatState?.stats?.health,
    globalEnemyHealth: state.combat.enemy?.stats?.health,
    enemyDataMatch: state.combat.enemy?.id === state.combat.enemyCombatState?.id ? 'MATCH' : 'MISMATCH'
  });
  
  const [enemy, setEnemy] = useState(() => {
    // Проверяем наличие state.combat.enemy (из глобального состояния)
    const globalEnemy = state.combat.enemy;
    
    // Если есть сохраненное состояние и это тот же враг - восстанавливаем его
    if (hasSavedCombatState) {
      console.log('Восстановление сохраненного состояния противника:', state.combat.enemyCombatState);
      
      // Проверка на нулевое здоровье и восстановление при необходимости
      let savedEnemy = {...state.combat.enemyCombatState};
      
      // Проверяем здоровье врага - если оно нулевое или отрицательное, восстанавливаем до 30% от максимума
      if (!savedEnemy.stats || savedEnemy.stats.health <= 0) {
        console.log('⚠️ Обнаружено нулевое здоровье врага, восстанавливаем!');
        
        // Восстанавливаем структуру stats если она отсутствует
        if (!savedEnemy.stats) {
          savedEnemy.stats = {
            ...initialEnemy.stats,
            health: Math.ceil(initialEnemy.stats.health * 0.3),
            maxHealth: initialEnemy.stats.health,
            energy: null, // Всегда устанавливаем энергию на 10000
            maxEnergy: null // Устанавливаем макс. энергию тоже на 10000
          };
        } else {
          // Если структура есть, но здоровье равно 0, восстанавливаем только здоровье
          savedEnemy.stats.health = Math.ceil(savedEnemy.stats.maxHealth * 0.3);
        }
      }
      
      // Проверяем наличие массива атак
      if (!savedEnemy.attacks || !Array.isArray(savedEnemy.attacks) || savedEnemy.attacks.length === 0) {
        console.log('⚠️ Отсутствуют атаки у врага, восстанавливаем!');
        savedEnemy.attacks = initialEnemy.attacks || [];
      }
      
      return savedEnemy;
    } else if (globalEnemy) {
      // Если нет сохраненного состояния, но есть противник в глобальном состоянии
      console.log('Используем противника из глобального состояния:', globalEnemy);
      
      // Проверяем и исправляем базовые свойства для безопасности
      const preparedEnemy = {
        ...globalEnemy,
        stats: {
          ...(globalEnemy.stats || {}),
          health: globalEnemy.stats?.health || initialEnemy.stats.health,
          maxHealth: globalEnemy.stats?.maxHealth || initialEnemy.stats.health,
          energy: null, // Всегда устанавливаем энергию на 10000
          maxEnergy: null // Устанавливаем макс. энергию тоже на 10000
        },
        attacks: Array.isArray(globalEnemy.attacks) && globalEnemy.attacks.length > 0
          ? globalEnemy.attacks
          : (initialEnemy.attacks || []),
        effects: globalEnemy.effects || []
      };
      
      return preparedEnemy;
    }
    
    // Иначе создаем нового противника из initialEnemy
    console.log('Создание нового противника из initialEnemy:', initialEnemy);
    return {
      ...initialEnemy,
      stats: {
        ...initialEnemy.stats,
        health: initialEnemy.stats.health,
        maxHealth: initialEnemy.stats.health,
        energy: null, // Всегда устанавливаем энергию на 10000
        maxEnergy: null // Устанавливаем макс. энергию тоже на 10000
      },
      effects: []
    };
  });
  
  const [player, setPlayer] = useState(() => {
    // Получаем все бонусы от экипировки
    const equipBonuses = state.player.equipmentBonuses?.combat || {};
    
    console.log('CombatManager: Applying equipment bonuses:', equipBonuses);
    console.log('CombatManager: Player base stats:', state.player.secondaryStats);
    
    // Если есть сохраненное состояние игрока в бою - используем его
    if (hasSavedCombatState && state.combat.playerCombatState) {
      console.log('Восстановление сохраненного состояния игрока:', state.combat.playerCombatState);
      return {
        name: state.player.name,
        level: state.player.cultivation.level,
        icon: state.player.avatar,
        stats: { ...state.combat.playerCombatState.stats },
        effects: [...state.combat.playerCombatState.effects]
      };
    }
    
    // Иначе устанавливаем здоровье и энергию на максимальные значения при входе в бой
    let playerMaxHealth = state.player.stats.maxHealth || 100;
    let playerHealth = playerMaxHealth; // Начинаем с полного здоровья
    
    let playerMaxEnergy = state.player.stats.maxEnergy || 100;
    let playerEnergy = playerMaxEnergy; // Начинаем с полной энергии
    
    console.log('CombatManager: Максимальное здоровье при входе в бой:', playerMaxHealth);
    console.log('CombatManager: Максимальная энергия при входе в бой:', playerMaxEnergy);
    
    let initialStats = {
      // Применяем исправленные характеристики здоровья и энергии
      health: playerHealth,
      maxHealth: playerMaxHealth,
      energy: playerEnergy,
      maxEnergy: playerMaxEnergy,
      
      // Физическая атака (с бонусами от экипировки)
      physicalAttack: (state.player.secondaryStats?.physicalAttack || 0) + 
                      (equipBonuses.physicalDamage || 0),
      
      // Магическая атака (с бонусами от экипировки)
      magicalAttack: (state.player.secondaryStats?.magicalAttack || 0) + 
                     (equipBonuses.magicDamage || 0),
      
      // Физическая защита (с бонусами от экипировки)
      physicalDefense: (state.player.secondaryStats?.physicalDefense || 0) + 
                       (equipBonuses.physicalDefense || 0),
      
      // Магическая защита (с бонусами от экипировки)
      spiritualDefense: (state.player.secondaryStats?.magicalDefense || 0) + 
                        (equipBonuses.magicDefense || 0),
      
      // Точность
      accuracy: state.player.secondaryStats?.accuracy || 90,
      
      // Уклонение (с бонусами от экипировки)
      evasion: (state.player.secondaryStats?.evasion || 0) + 
               (equipBonuses.dodgeChance || 0),
      
      // Критический шанс (с бонусами от экипировки)
      criticalChance: (state.player.secondaryStats?.critChance || 5) + 
                      (equipBonuses.critChance || 0),
      
      // Критический урон
      criticalDamage: state.player.secondaryStats?.critDamage || 50
    };
    
    if (activePet) {
      // Добавляем бонусы от питомца
      initialStats.maxHealth += activePet.vitality * 5;
      initialStats.maxEnergy += activePet.spirit * 5;
      initialStats.physicalDefense += activePet.strength;
      initialStats.spiritualDefense += activePet.intelligence;
      initialStats.criticalChance += activePet.agility * 0.01;
    }
    
    console.log('CombatManager: Final player combat stats:', initialStats);
    
    return {
      name: state.player.name,
      level: state.player.cultivation.level,
      icon: state.player.avatar,
      stats: initialStats,
      effects: []
    };
  });
  
  // Восстанавливаем ход игрока из сохраненного состояния или устанавливаем на ход игрока по умолчанию
  const [isPlayerTurn, setIsPlayerTurn] = useState(() => {
    if (hasSavedCombatState && state.combat.isPlayerTurn !== undefined) {
      console.log('Восстанавливаем ход игрока:', state.combat.isPlayerTurn);
      return state.combat.isPlayerTurn;
    }
    return true; // По умолчанию ход игрока
  });
  
  const [disabled, setDisabled] = useState(false);
  
  // Восстанавливаем боевой лог
  const [combatLog, setCombatLog] = useState(() => {
    if (hasSavedCombatState && Array.isArray(state.combat.log) && state.combat.log.length > 0) {
      console.log('Восстанавливаем боевой лог, записей:', state.combat.log.length);
      return [...state.combat.log];
    }
    return [];
  });
  
  // Восстанавливаем боевую статистику
  const [combatStats, setCombatStats] = useState(() => {
    if (hasSavedCombatState && state.combat.combatStats) {
      console.log('Восстанавливаем боевую статистику:', state.combat.combatStats);
      return state.combat.combatStats;
    }
    return {
      player: {
        damageDealt: 0,
        techniquesUsed: 0,
        criticalHits: 0,
        dodges: 0
      },
      enemy: {
        damageDealt: 0,
        techniquesUsed: 0,
        criticalHits: 0,
        dodges: 0
      }
    };
  });
  
  const [startTime] = useState(() => hasSavedCombatState ? state.combat.startTime : Date.now());
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState(null);
  
  // Улучшенный эффект для сохранения состояния боя в глобальное состояние игрока
  useEffect(() => {
    if (!isFinished) {
      // Используем условие, чтобы избежать циклических обновлений
      const shouldUpdateState =
        // Обновляем только если:
        // 1. Изменились статистики игрока или противника
        // 2. Изменился ход
        // 3. Добавлена новая запись в лог
        // 4. Изменилась статистика боя
        // 5. Изменился флаг isProcessingAction (ДОБАВЛЕНО)
        player.stats.health !== state.combat?.playerCombatState?.stats?.health ||
        enemy?.stats?.health !== state.combat?.enemyCombatState?.stats?.health ||
        isPlayerTurn !== state.combat?.isPlayerTurn ||
        combatLog.length !== state.combat?.log?.length ||
        combatStats.player.damageDealt !== state.combat?.combatStats?.player?.damageDealt ||
        combatStats.enemy.damageDealt !== state.combat?.combatStats?.enemy?.damageDealt ||
        isProcessingAction !== state.combat?.isProcessingAction; // ДОБАВЛЕНО: отслеживаем изменения статуса обработки
      
      if (shouldUpdateState) {
        console.log('Обновление состояния боя в глобальное состояние:', {
          isPlayerTurn,
          isProcessingAction,
          playerHealth: player.stats.health,
          enemyHealth: enemy?.stats?.health
        });
        
        // ИСПРАВЛЕНИЕ: Сохраняем также флаг isProcessingAction в глобальное состояние для синхронизации
        actions.updateCombatState({
          inCombat: true,
          enemy: enemy,
          enemyCombatState: enemy,
          playerCombatState: {
            stats: { ...player.stats },
            effects: [...player.effects]
          },
          isPlayerTurn: isPlayerTurn,
          isProcessingAction: isProcessingAction, // ДОБАВЛЕНО: сохраняем в глобальное состояние
          log: combatLog,
          combatStats: combatStats,
          startTime: startTime
        });
      }
    }
  }, [
    player.stats.health,
    enemy?.stats?.health,
    isPlayerTurn,
    isProcessingAction, // ДОБАВЛЕНО: отслеживаем изменения
    combatLog.length,
    combatStats.player.damageDealt,
    combatStats.enemy.damageDealt,
    isFinished
  ]);
  
  const addLogEntry = useCallback((message, type = 'info') => {
    setCombatLog(prev => [...prev, {
      message,
      type,
      timestamp: Date.now()
    }]);
  }, []);
  
  const updateStats = useCallback((source, stats) => {
    setCombatStats(prev => ({
      ...prev,
      [source]: {
        ...prev[source],
        ...stats
      }
    }));
  }, []);
  
  // Используем переданные эффекты погоды или берем из состояния
  const effectiveWeatherEffects = weatherEffects || 
    (state.weather?.weatherEffects || {
      combat: {
        damageModifiers: {},
        hitChanceModifier: 1.0,
        critChanceModifier: 1.0,
        dodgeChanceModifier: 1.0
      }
    });
  
  // Применяем эффекты погоды к боевым показателям
  const applyWeatherEffects = useCallback((combatState) => {
    if (!effectiveWeatherEffects || !effectiveWeatherEffects.combat) {
      return combatState; // Если нет данных о погоде, возвращаем как есть
    }
    
    // Применяем модификаторы от погоды вручную
    if (combatState.player) {
      combatState.player.hitChance = (combatState.player.hitChance || 0.9) * 
        effectiveWeatherEffects.combat.hitChanceModifier;
      combatState.player.dodgeChance = (combatState.player.dodgeChance || 0.1) * 
        effectiveWeatherEffects.combat.dodgeChanceModifier;
      combatState.player.critChance = (combatState.player.critChance || 0.05) * 
        effectiveWeatherEffects.combat.critChanceModifier;
    }
    
    return combatState;
  }, [effectiveWeatherEffects]);
  
  // Получаем модификатор урона для элементального типа из погодных эффектов
  const getWeatherDamageModifier = useCallback((damageType) => {
    if (!effectiveWeatherEffects || !effectiveWeatherEffects.combat || !effectiveWeatherEffects.combat.damageModifiers) {
      return 1.0; // По умолчанию без модификатора
    }
    
    return effectiveWeatherEffects.combat.damageModifiers[damageType] || 1.0;
  }, [effectiveWeatherEffects]);
  
  // Получаем модификаторы точности и критических ударов из погодных эффектов
  const getWeatherCombatModifiers = useCallback(() => {
    if (!effectiveWeatherEffects || !effectiveWeatherEffects.combat) {
      return {
        hitChanceModifier: 1.0,
        critChanceModifier: 1.0,
        dodgeChanceModifier: 1.0
      };
    }
    
    return {
      hitChanceModifier: effectiveWeatherEffects.combat.hitChanceModifier || 1.0,
      critChanceModifier: effectiveWeatherEffects.combat.critChanceModifier || 1.0,
      dodgeChanceModifier: effectiveWeatherEffects.combat.dodgeChanceModifier || 1.0
    };
  }, [effectiveWeatherEffects]);
  
  // Функция для применения всех активных эффектов к характеристикам персонажа
  const applyEffectsToStats = useCallback((character) => {
    if (!character.effects || character.effects.length === 0) {
      console.log(`⚠️ У ${character.name} нет активных эффектов для применения к характеристикам`);
      return character;
    }
    
    console.log(`🧩 Применение эффектов к ${character.name}:`, character.effects);
    console.log(`📊 Исходные характеристики:`, character.stats);
    
    // Выводим все поля character.stats для отладки
    console.log(`🔍 Доступные поля в stats:`, Object.keys(character.stats));
    
    // Создаем копию персонажа и его характеристик
    const updatedCharacter = {...character};
    const updatedStats = {...character.stats};
    
    console.log(`⚔️ Физическая защита до применения эффектов:`, updatedStats.physicalDefense);
    console.log(`🔮 Духовная защита до применения эффектов:`, updatedStats.spiritualDefense);
    
    // Применяем эффекты к характеристикам
    character.effects.forEach(effect => {
      console.log(`🔄 Обработка эффекта "${effect.name}" (тип: ${effect.type})`);
      
      if (effect.stats) {
        console.log(`📈 Бонусы эффекта:`, effect.stats);
        console.log(`🔍 Поля бонусов:`, Object.keys(effect.stats));
        
        // Обрабатываем каждую характеристику из эффекта
        Object.entries(effect.stats).forEach(([statName, value]) => {
          console.log(`🔎 Проверка поля "${statName}" со значением ${value}`);
          console.log(`🔎 Это поле ${updatedStats[statName] !== undefined ? 'существует' : 'отсутствует'} в stats персонажа`);
          
          if (updatedStats[statName] !== undefined) {
            updatedStats[statName] += value;
            console.log(`✅ Эффект "${effect.name}" добавляет ${value} к ${statName}: ${updatedStats[statName] - value} → ${updatedStats[statName]}`);
          } else {
            console.log(`❌ Поле "${statName}" не найдено в stats персонажа!`);
          }
        });
      }
    });
    
    console.log(`⚔️ Физическая защита после применения эффектов:`, updatedStats.physicalDefense);
    console.log(`🔮 Духовная защита после применения эффектов:`, updatedStats.spiritualDefense);
    console.log(`📊 Итоговые характеристики:`, updatedStats);
    
    updatedCharacter.stats = updatedStats;
    return updatedCharacter;
  }, []);
  
  const calculateDamage = useCallback((attacker, defender, base, type = 'physical') => {
    // Безопасная проверка на входные параметры
    if (!attacker || !defender || !attacker.stats || !defender.stats) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Некорректные параметры в calculateDamage', {
        hasAttacker: !!attacker,
        hasDefender: !!defender,
        hasAttackerStats: attacker && !!attacker.stats,
        hasDefenderStats: defender && !!defender.stats,
        baseValue: base
      });
      // В случае ошибки возвращаем урон 1 как минимальный
      return { damage: 1, isCritical: false, weatherModifier: 1, damageBonus: 0 };
    }

    // Применяем все активные эффекты к характеристикам
    const updatedAttacker = applyEffectsToStats(attacker);
    const updatedDefender = applyEffectsToStats(defender);
    
    // Используем обновленные характеристики для дальнейших расчетов
    attacker = updatedAttacker;
    defender = updatedDefender;
    
    console.log('🔍 calculateDamage получил параметры:', {
      базовыйУрон: base,
      типУрона: type,
      атакующий: attacker.name,
      защитник: defender.name
    });
    
    // НОВОЕ ИСПРАВЛЕНИЕ: определяем источник base - предрассчитанный урон с защитой или нет
    // Проверяем, является ли действие техникой с предрассчитанным уроном
    const isPreCalculatedTechnique = (
      attacker.action?.type === 'technique' && 
      attacker.action?.calculatedDamage === base
    );
    
    // Проверяем наличие эффектов урона у атакующего
    let damageBonus = 0;
    if (attacker.effects && attacker.effects.length > 0) {
      // Ведем подробное логирование для отладки
      console.log('⚔️ Проверка эффектов атакующего для расчета урона:', attacker.effects);
      
      attacker.effects.forEach(effect => {
        // Проверяем эффекты урона (combat_damage) - разные варианты названий и типов
        if (effect.effectType === 'combat_damage' || 
            effect.originalType === 'combat_damage' || 
            effect.type === 'combat_damage' ||
            effect.effectType === 'combat_damage (thunderstorm)' ||
            effect.name.includes('Урон в бою') ||
            effect.isCombatEffect === true) {
          
          // Эффект может хранить модификатор в разных полях
          const modifier = typeof effect.modifier === 'number' ? effect.modifier : 
                          typeof effect.value === 'number' ? effect.value : 0;
                          
          // Если модификатор больше 1, считаем его процентом, меньше 1 - коэффициентом
          const bonusValue = Math.abs(modifier) > 1 ? modifier / 100 : modifier;
          
          damageBonus += bonusValue;
          console.log(`⚔️ Эффект "${effect.name}" добавляет ${Math.abs(modifier) > 1 ? modifier + '%' : modifier * 100 + '%'} к урону (${bonusValue} дробный)`);
        }
        
        // Проверяем специфические эффекты стихийного урона
        if (effect.effectType === `${type}_damage` || 
            effect.originalType === `${type}_damage` || 
            effect.type === `${type}_damage`) {
          
          // Аналогично проверяем разные поля
          const modifier = typeof effect.modifier === 'number' ? effect.modifier : 
                          typeof effect.value === 'number' ? effect.value : 0;
                          
          // Преобразуем модификатор в коэффициент
          const bonusValue = Math.abs(modifier) > 1 ? modifier / 100 : modifier;
          
          damageBonus += bonusValue;
          console.log(`⚔️ Эффект "${effect.name}" добавляет ${Math.abs(modifier) > 1 ? modifier + '%' : modifier * 100 + '%'} к урону типа ${type} (${bonusValue} дробный)`);
        }
      });
      
      console.log(`⚔️ Суммарный бонус к урону от эффектов: ${(damageBonus * 100).toFixed(0)}%`);
    } else {
      console.log('⚔️ У атакующего нет активных эффектов для расчета урона');
    }
    
    // Получаем модификаторы от статусов персонажа и погоды
    const weatherDamageModifier = getWeatherDamageModifier(type);
    
    // Если это предрассчитанный урон от техники, используем его напрямую
    // без повторного применения защиты
    if (isPreCalculatedTechnique || (base > 0 && attacker.isTechniqueDamage)) {
      console.log('🔄 Используем предрассчитанный урон техники напрямую:', base);
      
      // Применяем модификатор от погоды и бонусы от эффектов
      const finalMultiplier = (1 + damageBonus) * weatherDamageModifier;
      let damage = Math.max(1, Math.floor(base * finalMultiplier));
      
      console.log(`🧮 Итоговый множитель урона: ${finalMultiplier.toFixed(2)} (погода: ${weatherDamageModifier}, эффекты: ${(1 + damageBonus).toFixed(2)})`);
      console.log(`🧮 Итоговый урон без учета защиты: ${base} × ${finalMultiplier.toFixed(2)} = ${damage}`);
      
      // НОВОЕ: Проверяем наличие эффекта "Защитная стойка" для предрассчитанных техник
      if (defender.effects && defender.effects.length > 0) {
        console.log(`🔍 [Предрассчитанная атака] Проверка эффектов защиты у ${defender.name}, найдено эффектов: ${defender.effects.length}`);
        console.log(`📋 [Предрассчитанная атака] Все активные эффекты:`, defender.effects);
        
        const protectEffect = defender.effects.find(effect =>
          effect.type === 'protect' && effect.damageReduction);
        
        if (protectEffect) {
          console.log(`✅ [Предрассчитанная атака] Найден эффект защиты:`, protectEffect);
          
          // Прямое снижение урона на указанный процент
          const originalDamage = damage;
          damage = Math.max(1, Math.floor(damage * (1 - protectEffect.damageReduction)));
          
          console.log(`🛡️ Эффект "Защитная стойка" снижает урон на ${protectEffect.damageReduction * 100}%: ${originalDamage} → ${damage} урона (предрассчитанная атака)`);
        } else {
          console.log(`❌ [Предрассчитанная атака] Эффект защиты не найден среди активных эффектов`);
        }
      } else {
        console.log(`❌ [Предрассчитанная атака] У ${defender.name} нет активных эффектов`);
      }
      
      // Применяем модификатор шанса крита от погоды
      const { critChanceModifier } = getWeatherCombatModifiers();
      const baseCritChance = attacker.stats.criticalChance || 5; // По умолчанию 5%
      const modifiedCritChance = baseCritChance * critChanceModifier;
      
      console.log(`🎯 Шанс критического удара: ${baseCritChance}% × ${critChanceModifier} = ${modifiedCritChance}%`);
      
      const isCritical = Math.random() * 100 < modifiedCritChance;
      if (isCritical) {
        const critMultiplier = 1 + (attacker.stats.criticalDamage || 50) / 100;
        const critDamage = Math.floor(damage * critMultiplier);
        
        console.log(`💥 Критический удар! ${damage} × ${critMultiplier} = ${critDamage}`);
        
        return {
          damage: critDamage,
          isCritical,
          weatherModifier: weatherDamageModifier,
          damageBonus: damageBonus
        };
      }
      
      return { 
        damage, 
        isCritical: false, 
        weatherModifier: weatherDamageModifier,
        damageBonus: damageBonus
      };
    }
    
    // УПРОЩЕННЫЙ расчет урона для обеспечения минимального урона
    let attackPower = 10; // Значение по умолчанию
    
    if (type === 'physical') {
      attackPower = attacker.stats.physicalAttack || 10;
      console.log(`🔄 Физическая атака ${attacker.name}: ${attackPower}`);
    } else {
      attackPower = attacker.stats.magicalAttack || 10;
      console.log(`🔄 Магическая атака ${attacker.name}: ${attackPower}`);
    }
    
    // Добавляем базовый урон к атаке, если он задан
    if (base > 0 && base !== attackPower) {
      const originalAttackPower = attackPower;
      attackPower += base;
      console.log(`🔄 Добавляем базовый урон ${base} к атаке: ${originalAttackPower} → ${attackPower}`);
    }
    
    console.log('🔄 Итоговая сила атаки для расчета:', attackPower);
    
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Всегда обеспечиваем минимальный урон от атаки игрока
    if (attacker.name === state.player.name) {
      console.log('🔥 Атака игрока - обеспечиваем минимальный урон!');
      // Для атак игрока устанавливаем минимальный урон 5
      attackPower = Math.max(attackPower, 10);
    }
    
    // Получаем базовую защиту
    // Определяем защиту с учетом разных возможных имен полей
    let defense = 0;
    
    if (type === 'physical') {
      // Пробуем разные варианты названия физической защиты
      if (defender.stats.physicalDefense !== undefined) {
        defense = defender.stats.physicalDefense;
        console.log(`🛡️ Используем physicalDefense: ${defense}`);
      } else if (defender.stats.physical_defense !== undefined) {
        defense = defender.stats.physical_defense;
        console.log(`🛡️ Используем physical_defense: ${defense}`);
      } else if (defender.stats.physDefense !== undefined) {
        defense = defender.stats.physDefense;
        console.log(`🛡️ Используем physDefense: ${defense}`);
      } else {
        console.log(`⚠️ Не найдено поле физической защиты!`);
        defense = 0;
      }
    } else {
      // Пробуем разные варианты названия духовной/магической защиты
      if (defender.stats.spiritualDefense !== undefined) {
        defense = defender.stats.spiritualDefense;
        console.log(`🛡️ Используем spiritualDefense: ${defense}`);
      } else if (defender.stats.magicDefense !== undefined) {
        defense = defender.stats.magicDefense;
        console.log(`🛡️ Используем magicDefense: ${defense}`);
      } else {
        console.log(`⚠️ Не найдено поле духовной/магической защиты!`);
        defense = 0;
      }
    }
    
    // Проверяем наличие эффектов защиты и применяем их
    if (defender.effects && defender.effects.length > 0) {
      console.log(`🔍 Проверка эффектов защиты у ${defender.name}, найдено эффектов: ${defender.effects.length}`);
      console.log(`📋 Все активные эффекты:`, defender.effects);
      
      let defenseBonus = 0;
      
      // Проходим по всем активным эффектам
      defender.effects.forEach(effect => {
        console.log(`📊 Анализ эффекта "${effect.name}" (тип: ${effect.type}):`, effect);
        
        // Проверяем, есть ли у эффекта бонусы к защите
        if (effect.stats) {
          console.log(`📈 Бонусы характеристик от эффекта:`, effect.stats);
          
          // Обрабатываем все возможные варианты поля физической защиты
          if (type === 'physical') {
            // Проверяем все возможные варианты названия поля физической защиты
            if (effect.stats.physicalDefense) {
              defenseBonus += effect.stats.physicalDefense;
              console.log(`🛡️ Эффект "${effect.name}" добавляет ${effect.stats.physicalDefense} к физической защите (physicalDefense)`);
            }
            
            if (effect.stats.physical_defense) {
              defenseBonus += effect.stats.physical_defense;
              console.log(`🛡️ Эффект "${effect.name}" добавляет ${effect.stats.physical_defense} к физической защите (physical_defense)`);
            }
            
            if (effect.stats.physDefense) {
              defenseBonus += effect.stats.physDefense;
              console.log(`🛡️ Эффект "${effect.name}" добавляет ${effect.stats.physDefense} к физической защите (physDefense)`);
            }
          }
          // Обрабатываем все возможные варианты поля духовной/магической защиты
          else if (type === 'spiritual' || type === 'magical') {
            if (effect.stats.spiritualDefense) {
              defenseBonus += effect.stats.spiritualDefense;
              console.log(`🛡️ Эффект "${effect.name}" добавляет ${effect.stats.spiritualDefense} к духовной защите (spiritualDefense)`);
            }
            
            if (effect.stats.magicDefense) {
              defenseBonus += effect.stats.magicDefense;
              console.log(`🛡️ Эффект "${effect.name}" добавляет ${effect.stats.magicDefense} к магической защите (magicDefense)`);
            }
          }
        }
      });
      
      // Добавляем бонусы к базовой защите
      if (defenseBonus > 0) {
        console.log(`🛡️ Всего добавлено ${defenseBonus} к защите от эффектов`);
        defense += defenseBonus;
      }
    }
    
    // Рассчитываем коэффициент снижения урона с учетом всех бонусов
    let reduction = defense / (defense + 100);
    console.log(`🛡️ Итоговая защита: ${defense}, коэффициент снижения урона: ${reduction.toFixed(2)} (${Math.floor(reduction * 100)}%)`);
    
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Для атак игрока ограничиваем максимальное снижение урона до 80%
    if (attacker.name === state.player.name) {
      reduction = Math.min(reduction, 0.8); // Максимум 80% снижения для атак игрока
      console.log(`🛡️ Ограничение снижения урона для атаки игрока: ${reduction.toFixed(2)} (${Math.floor(reduction * 100)}%)`);
    }
    
    // Применяем модификаторы от погоды и эффектов к базовому урону
    const finalMultiplier = (1 + damageBonus) * weatherDamageModifier;
    
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обеспечиваем минимальный урон 5 для атак игрока
    let damage = Math.floor(attackPower * (1 - reduction) * finalMultiplier);
    
    // Всегда обеспечиваем минимальный урон 1
    damage = Math.max(1, damage);
    
    // Если это атака игрока, минимальный урон 5
    if (attacker.name === state.player.name) {
      damage = Math.max(5, damage);
      console.log(`💪 Минимальный урон игрока: ${damage}`);
    }
    
    // Проверяем наличие эффекта "Защитная стойка"
    if (defender.effects && defender.effects.length > 0) {
      const protectEffect = defender.effects.find(effect =>
        effect.type === 'protect' && effect.damageReduction);
      
      if (protectEffect) {
        // Прямое снижение урона на указанный процент (75%)
        const originalDamage = damage;
        damage = Math.max(1, Math.floor(damage * (1 - protectEffect.damageReduction)));
        
        console.log(`🛡️ Эффект "Защитная стойка" снижает урон на ${protectEffect.damageReduction * 100}%: ${originalDamage} → ${damage} урона`);
      }
    }
    
    console.log(`🧮 Итоговый множитель урона: ${finalMultiplier.toFixed(2)} (погода: ${weatherDamageModifier}, эффекты: ${(1 + damageBonus).toFixed(2)})`);
    console.log(`🧮 Формула урона: ${attackPower} × ${(1 - reduction).toFixed(2)} × ${finalMultiplier.toFixed(2)} = ${damage}`);
    
    // Применяем модификатор шанса крита от погоды
    const { critChanceModifier } = getWeatherCombatModifiers();
    const baseCritChance = attacker.stats.criticalChance || 5; // По умолчанию 5%
    const modifiedCritChance = baseCritChance * critChanceModifier;
    
    console.log(`🎯 Шанс критического удара: ${baseCritChance}% × ${critChanceModifier} = ${modifiedCritChance}%`);
    
    const isCritical = Math.random() * 100 < modifiedCritChance;
    if (isCritical) {
      const critMultiplier = 1 + (attacker.stats.criticalDamage || 50) / 100;
      const critDamage = Math.floor(damage * critMultiplier);
      
      console.log(`💥 Критический удар! ${damage} × ${critMultiplier} = ${critDamage}`);
      
      return {
        damage: critDamage,
        isCritical,
        weatherModifier: weatherDamageModifier,
        damageBonus: damageBonus
      };
    }
    
    return { 
      damage, 
      isCritical: false, 
      weatherModifier: weatherDamageModifier,
      damageBonus: damageBonus
    };
  }, [getWeatherDamageModifier, getWeatherCombatModifiers, applyEffectsToStats]);
  
  const applyDamage = useCallback((target, amount) => {
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: добавляем подробную отладку
    console.log(`💥 ПРИМЕНЕНИЕ УРОНА: ${amount} к ${target}`);
    
    // Принудительно обеспечиваем минимальный урон
    const actualAmount = Math.max(1, amount);
    
    if (target === 'player') {
      setPlayer(prev => {
        // Проверка на валидные данные
        if (!prev || !prev.stats) {
          console.error('❌ ОШИБКА: Невалидные данные игрока в applyDamage', prev);
          return prev;
        }
        
        const newHealth = Math.max(0, prev.stats.health - actualAmount);
        console.log(`❤️ Здоровье игрока: ${prev.stats.health} → ${newHealth}`);
        
        return {
          ...prev,
          stats: {
            ...prev.stats,
            health: newHealth
          }
        };
      });
    } else {
      setEnemy(prev => {
        // Проверка на валидные данные
        if (!prev || !prev.stats) {
          console.error('❌ ОШИБКА: Невалидные данные противника в applyDamage', prev);
          return prev;
        }
        
        const newHealth = Math.max(0, prev.stats.health - actualAmount);
        console.log(`❤️ Здоровье противника: ${prev.stats.health} → ${newHealth}`);
        
        return {
          ...prev,
          stats: {
            ...prev.stats,
            health: newHealth
          }
        };
      });
      
      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: обновляем также глобальное состояние противника
      // для синхронизации с другими компонентами
      setTimeout(() => {
        if (enemy && enemy.stats) {
          const newHealth = Math.max(0, enemy.stats.health - actualAmount);
          actions.updateCombatState({
            enemyCombatState: {
              ...enemy,
              stats: {
                ...enemy.stats,
                health: newHealth
              }
            }
          });
        }
      }, 0);
    }
  }, [enemy, actions]);
  
  const handleAction = useCallback(async (action) => {
    // Проверяем, не обрабатывается ли уже действие
    if (isProcessingAction) {
      console.log('⚠️ Попытка вызвать handleAction во время обработки другого действия');
      
      // Сброс флага блокировки при обнаружении "зависшего" состояния
      if (!isPlayerTurn) {
        console.log('🚨 Обнаружено зависшее состояние обработки - принудительно сбрасываем блокировку');
        setIsProcessingAction(false);
        return;
      }
      return;
    }
    
    // Устанавливаем флаг, что действие обрабатывается с отладочной информацией
    console.log('🔒 Блокировка: устанавливаем isProcessingAction = true');
    setIsProcessingAction(true);
    
    // Сбрасываем флаг forceNPCTurn, если он установлен
    if (state.combat.forceNPCTurn) {
      actions.updateCombatState({ forceNPCTurn: false });
    }
    
    // Добавляем отладочный вывод для анализа полученного action
    console.log('🔍 handleAction вызван с параметром:', {
      action: action,
      actionType: action.type,
      actionTypeJSON: JSON.stringify(action.type),
      actionTypeIsString: typeof action.type === 'string',
      actionTypeConstructor: action.type ? action.type.constructor.name : 'undefined',
      actionHasTypeProp: 'type' in action,
      actionName: action.name,
      actionID: action.id,
      isPlayerTurn: isPlayerTurn,
      isProcessingAction: true
    });
    
    setDisabled(true);
    
    const attacker = isPlayerTurn ? player : enemy;
    const defender = isPlayerTurn ? enemy : player;
    const attackerType = isPlayerTurn ? 'player' : 'enemy';
    const defenderType = isPlayerTurn ? 'enemy' : 'player';
    
    // Проверяем уклонение с учетом точности и уклонения
    const hitChanceModifier = getWeatherCombatModifiers().hitChanceModifier || 1.0;
    const accuracy = (attacker.stats.accuracy || 90) * hitChanceModifier;
    const evasion = defender.stats.evasion || 0;
    
    // Базовый шанс попадания 80% + разница между точностью и уклонением
    // Ограничиваем шанс минимум 20%, максимум 95%
    const baseHitChance = 80;
    const hitChance = Math.min(95, Math.max(20, baseHitChance + (accuracy - evasion) / 10));
    const hitRoll = Math.random() * 100;
    
    console.log(`Атака ${attacker.name}: Точность ${accuracy}, Уклонение ${evasion}, Шанс попадания ${hitChance.toFixed(1)}%, Бросок ${hitRoll.toFixed(1)}`);
    
    // Промах происходит, если бросок больше шанса попадания
    if (hitRoll >= hitChance) {
      addLogEntry(
        `${defender.name} уклоняется от атаки ${attacker.name}!`,
        'dodge'
      );
      updateStats(defenderType, { dodges: combatStats[defenderType].dodges + 1 });
      
      // Вместо выхода из функции, переходим к концу функции для переключения хода
      // Этим гарантируем, что ход переключится даже при уклонении
      const currentTurn = isPlayerTurn;
      setDisabled(false);
      
      // Задержка перед переключением хода для предотвращения быстрых многократных переключений
      setTimeout(() => {
        setIsPlayerTurn(!currentTurn);
        
        // Сбрасываем флаг обработки с небольшой задержкой после переключения хода
        setTimeout(() => {
          setIsProcessingAction(false);
          console.log(`🎮 Завершение обработки действия после уклонения, новый ход игрока: ${!currentTurn}`);
        }, 50);
      }, 100);
      
      return;
    }
    
    let damage = 0;
    let isCritical = false;
    
    switch (action.type) {
      case 'attack': {
        // Используем физическую атаку персонажа вместо фиксированного значения
        const baseDamage = attacker.stats.physicalAttack || 10;
        const result = calculateDamage(attacker, defender, baseDamage, 'physical');
        damage = result.damage;
        isCritical = result.isCritical;
        break;
      }
      case 'technique': {
        console.log('🛑 ТЕХНИКА: Попытка использования', {
          техникаИмя: action.name,
          техникаID: action.id,
          базовыйУрон: action.damage,
          рассчитанныйУрон: action.calculatedDamage,
          затратыЭнергии: action.energyCost,
          доступнаяЭнергия: attacker.stats.energy,
          атакующий: {
            имя: attacker.name,
            здоровье: attacker.stats.health,
            максЗдоровье: attacker.stats.maxHealth,
            энергия: attacker.stats.energy,
            максЭнергия: attacker.stats.maxEnergy,
          }
        });
        
        // Принудительно устанавливаем энергию на максимум
        // Это временное исправление, чтобы обойти проблему
        if (isPlayerTurn) {
          attacker.stats.energy = attacker.stats.maxEnergy || 100;
          console.log('⚡ ИСПРАВЛЕНИЕ: Энергия принудительно установлена на максимум:', attacker.stats.energy);
        }
        
        if (attacker.stats.energy < action.energyCost) {
          console.log('❌ ОШИБКА: Недостаточно энергии для техники', {
            энергия: attacker.stats.energy,
            требуется: action.energyCost
          });
          
          addLogEntry(
            `У ${attacker.name} недостаточно энергии для использования ${action.name}!`,
            'system'
          );
          setDisabled(false);
          return;
        }
        
        console.log('✅ ТЕХНИКА: Достаточно энергии для использования', {
          энергия: attacker.stats.energy,
          требуется: action.energyCost
        });
        
  // Используем предварительно рассчитанный урон, если он есть, иначе базовый
  console.log('🧮 РАСЧЕТ: Начало расчета урона для техники', {
    базовыйУрон: action.damage,
    рассчитанныйУрон: action.calculatedDamage,
    используемыйУрон: action.calculatedDamage || action.damage,
    типУрона: action.damageType
  });
  
  // Создаем временный объект с пометкой, что это предрассчитанный урон техники
  const attackerWithInfo = {
    ...attacker,
    isTechniqueDamage: true // Этот флаг будет использоваться для определения предрассчитанного урона
  };
  
  const result = calculateDamage(
    attackerWithInfo,
    defender,
    action.calculatedDamage || action.damage, // Передаем предрассчитанный урон
    action.damageType
  );
  
  console.log('📊 РЕЗУЛЬТАТ: Рассчитанный урон', {
    итоговыйУрон: result.damage,
    критический: result.isCritical
  });
        damage = result.damage;
        isCritical = result.isCritical;
        
        // Тратим энергию
        if (attackerType === 'player') {
          setPlayer(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              energy: prev.stats.energy - action.energyCost
            }
          }));
        } else {
          // Для противника вообще не меняем энергию - она не важна для его работы
          setEnemy(prev => ({
            ...prev
            // Не обновляем состояние энергии вообще
          }));
        }
        
        updateStats(attackerType, {
          techniquesUsed: combatStats[attackerType].techniquesUsed + 1
        });
        
        // Применяем эффекты
        if (action.effects) {
          action.effects.forEach(effect => {
            if (effect.target === 'enemy') {
              setEnemy(prev => ({
                ...prev,
                effects: [...prev.effects, effect]
              }));
            } else {
              setPlayer(prev => ({
                ...prev,
                effects: [...prev.effects, effect]
              }));
            }
            
            addLogEntry(
              `${effect.name} применён к ${effect.target === 'enemy' ? defender.name : attacker.name}!`,
              'effect'
            );
          });
        }
        break;
      }
      case 'petAbility': {
        // Получаем свежую информацию о питомце непосредственно из state
        const activePet = state.player.spiritPets.pets.find(pet => 
          pet.id === state.player.spiritPets.activePetId
        );
        
        if (!activePet) {
          addLogEntry(`Ошибка: активный питомец не найден!`, 'system');
          setDisabled(false);
          return;
        }
        
        // Проверяем лояльность питомца - если ≤ 25, он убегает
        if (activePet.loyalty <= 25) {
          addLogEntry(
            `Питомец ${activePet.name} отказывается помогать и убегает с поля боя!`,
            'system'
          );
          
          // Вызываем действие для удаления питомца
          actions.removeFleePet(activePet.id);
          
          // Сразу передаем ход противнику
          setDisabled(false);
          setIsPlayerTurn(false);
          return;
        }
        
        // Проверяем, достаточно ли сытости
        if (activePet.hunger < 20) {
          addLogEntry(`Питомцу ${activePet.name} не хватает сытости (${activePet.hunger}%) для использования способности!`, 'system');
          setDisabled(false);
          return;
        }
        
        // Рассчитываем урон от способности питомца
        // Используем физическую атаку игрока + урон способности питомца
        const petBaseDamage = Math.floor((activePet.strength * 1.5 + activePet.intelligence * 0.5) * 
                           (action.damageMultiplier || 1.0));
        const playerAttackBonus = attacker.stats.physicalAttack || 0;
        
        // Создаем временный объект для расчета атаки
        const attackerWithPetInfo = {
          ...attacker,
          isTechniqueDamage: true // Это предрассчитанный урон, не применять защиту повторно
        };
        
        // Считаем финальный урон
        const result = calculateDamage(
          attackerWithPetInfo,
          defender,
          action.calculatedDamage || (petBaseDamage + playerAttackBonus),
          action.damageType || 'physical'
        );
        
        damage = result.damage;
        isCritical = result.isCritical;
        
        // Отладочный вывод перед использованием способности
        console.log(`🐾 Питомец до атаки: ${activePet.name}, сытость ${activePet.hunger}%, лояльность ${activePet.loyalty}%`);
        
        // Более подробный вывод для отладки
        console.log(`ПИТОМЕЦ ИСПОЛЬЗУЕТ СПОСОБНОСТЬ - НАЧАЛО ИСПОЛЬЗОВАНИЯ`);
        console.log(`ID питомца: ${activePet.id}, ID способности: ${action.id}`);
        console.log(`Состояние до: сытость ${activePet.hunger}%, лояльность ${activePet.loyalty}%`);
        
        // Сохраняем начальные параметры питомца для отображения в логах
        const initialHunger = activePet.hunger;
        const initialLoyalty = activePet.loyalty;
        
        // Рассчитываем потерю лояльности по той же формуле, что и в редукторе,
        // чтобы быть уверенными, что логи показывают правильные значения
        const hungerCost = 20;
        const calculatedLoyaltyCost = Math.round(5 * (100 / Math.max(activePet.hunger, 1)));
        
        console.log(`РАСЧЕТ В КОМПОНЕНТЕ: Питомец теряет ${calculatedLoyaltyCost}% лояльности (сытость: ${activePet.hunger}%)`);
        console.log(`ФОРМУЛА В КОМПОНЕНТЕ: 5 * (100 / ${activePet.hunger}) = ${calculatedLoyaltyCost}`);
        
        // Уменьшаем сытость и лояльность питомца через действие
        actions.usePetAbility({
          petId: activePet.id,
          abilityId: action.id
        });
        
        // Создаем локальную копию с обновленными значениями для немедленного отображения
        // Это гарантирует, что пользователь сразу увидит изменения, даже если редуктор еще не обновил состояние
        const newHunger = Math.max(0, initialHunger - hungerCost);
        const newLoyalty = Math.max(0, initialLoyalty - calculatedLoyaltyCost);
        
        console.log(`ЛОКАЛЬНЫЙ РАСЧЕТ: Питомец ${activePet.name}: сытость ${newHunger}%, лояльность ${newLoyalty}%`);
        
        // Сразу добавляем запись в лог с прогнозируемыми параметрами питомца
        addLogEntry(
          `Питомец ${activePet.name}: сытость снизилась с ${initialHunger}% до ${newHunger}%, лояльность снизилась с ${initialLoyalty}% до ${newLoyalty}%`,
          'info'
        );
        
        // Сразу обновляем локальную копию в состоянии
        if (isPlayerTurn) {
          setPlayer(prev => {
            const updatedActivePet = {
              ...activePet,
              hunger: newHunger,
              loyalty: newLoyalty
            };
            
            const updatedPets = state.player.spiritPets.pets.map(p => 
              p.id === activePet.id ? updatedActivePet : p
            );
            
            // Сразу обновляем глобальное состояние для синхронизации
            setTimeout(() => {
              // Используем actions.updateSpiritPet вместо прямого dispatch
              actions.updateSpiritPet({ 
                id: activePet.id, 
                updates: { 
                  hunger: newHunger, 
                  loyalty: newLoyalty,
                  lastUsedAbility: new Date() 
                } 
              });
            }, 0);
            
            return prev;
          });
        }
        
        // Пытаемся получить обновленного питомца сразу (может не сработать из-за асинхронности)
        const updatedPet = state.player.spiritPets.pets.find(pet => pet.id === activePet.id);
        
        // Добавляем информативную запись в боевой лог
        const petType = {
          'fire': 'огненного',
          'water': 'водного',
          'earth': 'земляного',
          'wind': 'ветряного',
          'lightning': 'молниевого',
          'wood': 'древесного',
          'metal': 'металлического',
          'darkness': 'теневого',
          'light': 'светлого'
        }[activePet.type] || '';
        
        addLogEntry(
          `${attacker.name} использует ${action.name} ${petType} питомца и наносит ${damage} урона ${defender.name}${isCritical ? ' (Критический удар!)' : ''}`,
          isCritical ? 'critical' : 'damage'
        );
        
        // Выводим информацию о статусе питомца
        if (updatedPet) {
          addLogEntry(
            `Питомец ${updatedPet.name}: сытость ${updatedPet.hunger}%, лояльность ${updatedPet.loyalty}%`,
            'info'
          );
        }
        
        // Применяем особые эффекты способности, если они есть
        if (action.effects) {
          action.effects.forEach(effect => {
            if (effect.target === 'enemy') {
              setEnemy(prev => ({
                ...prev,
                effects: [...prev.effects, effect]
              }));
              
              addLogEntry(
                `${effect.name} применён к ${defender.name}!`,
                'effect'
              );
            } else {
              setPlayer(prev => ({
                ...prev,
                effects: [...prev.effects, effect]
              }));
              
              addLogEntry(
                `${effect.name} применён к ${attacker.name}!`,
                'effect'
              );
            }
          });
        }
        
        break;
      }
      case 'defend': {
        // Создаем статы для эффекта, поддерживая все возможные имена защитных характеристик
        const effectStats = {};
        
        // Физическая защита
        if (attacker.stats.physicalDefense !== undefined) {
          effectStats.physicalDefense = Math.floor(attacker.stats.physicalDefense * 0.5);
        }
        if (attacker.stats.physical_defense !== undefined) {
          effectStats.physical_defense = Math.floor(attacker.stats.physical_defense * 0.5);
        }
        if (attacker.stats.physDefense !== undefined) {
          effectStats.physDefense = Math.floor(attacker.stats.physDefense * 0.5);
        }
        
        // Духовная/магическая защита
        if (attacker.stats.spiritualDefense !== undefined) {
          effectStats.spiritualDefense = Math.floor(attacker.stats.spiritualDefense * 0.5);
        }
        if (attacker.stats.magicDefense !== undefined) {
          effectStats.magicDefense = Math.floor(attacker.stats.magicDefense * 0.5);
        }
        
        const effect = {
          type: 'protect',
          name: 'Защитная стойка',
          duration: 2, 
          damageReduction: 0.5, // Уменьшение урона на 50% (игрок получит только 50% урона)
          stats: effectStats
        };
        
        console.log(`🛡️ Создан эффект защиты:`, effect);
        console.log(`🛡️ Характеристики защиты игрока:`, attacker.stats);
        
        if (attackerType === 'player') {
          setPlayer(prev => ({
            ...prev,
            effects: [...prev.effects, effect]
          }));
        } else {
          setEnemy(prev => ({
            ...prev,
            effects: [...prev.effects, effect]
          }));
        }
        
        addLogEntry(
          `${attacker.name} принимает защитную стойку! Получаемый урон снижен на 50% в течение 2 ходов.`,
          'buff'
        );
        break;
      }
      case 'flee': {
        const fleeRoll = Math.random() * 100;
        if (fleeRoll < 30) {
          addLogEntry(
            `${attacker.name} успешно сбегает с поля боя!`,
            'system'
          );
          handleCombatEnd(false);
          return;
        } else {
          addLogEntry(
            `${attacker.name} пытается сбежать, но безуспешно!`,
            'system'
          );
        }
        break;
      }
      default:
        break;
    }
    
    // Добавляем отладочную информацию о рассчитанном уроне
    console.log('💥 Итоговый урон:', {
      урон: damage,
      критический: isCritical,
      атакующий: attackerType,
      защищающийся: defenderType
    });

    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Всегда применяем урон для атак игрока
    if (isPlayerTurn || damage > 0) {
      // Перед применением урона убедимся, что все ссылки на объекты корректны
      console.log('🔍 Проверка состояния перед применением урона:', {
        player: player?.stats?.health,
        enemy: enemy?.stats?.health,
        damageAmount: damage,
        isPlayerTurn: isPlayerTurn
      });
      
      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Принудительно обеспечиваем урон для атак игрока
      if (isPlayerTurn && defenderType === 'enemy' && damage < 5) {
        console.log('⚠️ Урон игрока слишком мал, увеличиваем до 5');
        damage = 5;
      }
      
      // Применяем урон к защищающемуся
      applyDamage(defenderType, damage);
      
      // Добавляем запись в лог
      addLogEntry(
        `${attacker.name} наносит ${damage} урона ${defender.name}${isCritical ? ' (Критический удар!)' : ''}`,
        isCritical ? 'critical' : 'damage'
      );
      
      // Обновляем статистику боя
      updateStats(attackerType, {
        damageDealt: combatStats[attackerType].damageDealt + damage,
        criticalHits: combatStats[attackerType].criticalHits + (isCritical ? 1 : 0)
      });
      
      // Проверяем условие победы
      if (defenderType === 'enemy' && enemy.stats.health <= 0) {
        handleCombatEnd(true);
        return;
      }
      
      if (defenderType === 'player' && player.stats.health <= 0) {
        handleCombatEnd(false);
        return;
      }
    } else {
      // Даже если урон 0, добавляем запись в лог, чтобы игрок понимал, что произошло
      addLogEntry(
        `${attacker.name} атакует ${defender.name}, но не наносит урона!`,
        'miss'
      );
    }
    
    // Вместо уменьшения счетчика после каждого действия,
    // уменьшаем счетчик только когда ход возвращается от противника к игроку
    if (!isPlayerTurn) {
      // Если текущий ход противника, и он заканчивается (переход к игроку),
      // только тогда уменьшаем счетчик эффектов
      setPlayer(prev => ({
        ...prev,
        effects: Array.isArray(prev.effects) ? prev.effects
          .map(effect => ({
            ...effect,
            duration: effect.duration - 1
          }))
          .filter(effect => effect.duration > 0) : []
      }));
      
      setEnemy(prev => ({
        ...prev,
        effects: Array.isArray(prev.effects) ? prev.effects
          .map(effect => ({
            ...effect,
            duration: effect.duration - 1
          }))
          .filter(effect => effect.duration > 0) : []
      }));
      
      console.log('🕐 Завершен полный ход (игрок + противник), уменьшаем продолжительность эффектов');
    }
    
    // Сохраняем текущее состояние хода, прежде чем его изменить
    const currentTurn = isPlayerTurn;
    
    setDisabled(false);
    
    // РАДИКАЛЬНО УЛУЧШЕННОЕ ИСПРАВЛЕНИЕ:
    // Выполняем переключение хода и сброс флагов обработки атомарно
    console.log(`🎮 Атомарное переключение хода: ${currentTurn} -> ${!currentTurn}`);
    
    try {
      // Создаем копию глобального состояния боя для синхронизации
      const newCombatState = {
        isPlayerTurn: !currentTurn,
        isProcessingAction: false,
        forceNPCTurn: false // Всегда сбрасываем этот флаг при смене хода
      };
      
      // Выполняем все обновления в одной транзакции
      setIsPlayerTurn(!currentTurn);
      setIsProcessingAction(false);
      
      // Сразу же синхронизируем с глобальным состоянием
      actions.updateCombatState(newCombatState);
      
      console.log(`✅ Успешное переключение хода на: ${!currentTurn ? 'игрока' : 'NPC'}`);
    } catch (error) {
      console.error('❌ Ошибка при переключении хода:', error);
      
      // В случае ошибки, все равно разблокируем интерфейс
      setIsProcessingAction(false);
      setIsPlayerTurn(!currentTurn);
    }
    
    // Добавляем задержку перед следующей проверкой для отладки
    setTimeout(() => {
      // Проверяем текущее состояние (через консоль)
      console.log('🔍 Проверка состояния после смены хода:', {
        isPlayerTurn: !currentTurn,
        isProcessingAction: false,
        enemyHealth: enemy?.stats?.health || 'N/A',
        playerHealth: player?.stats?.health || 'N/A'
      });
    }, 500);
  }, [
    isPlayerTurn,
    player,
    enemy,
    combatStats,
    calculateDamage,
    applyDamage,
    addLogEntry,
    updateStats,
    isProcessingAction
  ]);
  
  const handleCombatEnd = useCallback((victory) => {
    setIsFinished(true);
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const currentTimestamp = Date.now();
    
    // Создаем объект с результатами боя
    const combatResult = {
      victory: victory,
      enemy: {
        id: enemy.id,
        name: enemy.name,
        level: enemy.level || 1,
        type: enemy.type || 'unknown'
      },
      combatStats: { ...combatStats },
      duration: duration,
      timestamp: currentTimestamp,
      location: state.world.currentLocation // Сохраняем информацию о локации боя
    };
    
    console.log('Завершение боя, сохранение результата:', combatResult);
    
    // Сохраняем результат боя в глобальном стейте
    actions.updateCombatState({
      inCombat: false,
      enemy: null,                // Явно очищаем enemy
      enemyCombatState: null,
      playerCombatState: null,
      isPlayerTurn: true,
      log: [],
      combatStats: {
        player: { damageDealt: 0, techniquesUsed: 0, criticalHits: 0, dodges: 0 },
        enemy: { damageDealt: 0, techniquesUsed: 0, criticalHits: 0, dodges: 0 }
      },
      startTime: null,
      // Сохраняем полную информацию о результате боя
      lastCombatResult: combatResult
    });
    
    // Добавляем запись о бое в историю боев игрока
    if (actions.addCombatHistory) {
      console.log('📈 Сохранение результата боя в историю игрока');
      actions.addCombatHistory(combatResult);
    } else {
      console.error('❌ Метод addCombatHistory не найден, результат боя не будет добавлен в историю');
    }
    
    if (victory) {
      // Рассчитываем награды
      const experienceGain = Math.floor(
        enemy.experience * (1 + Math.random() * 0.2)
      );
      
      // Конвертируем общий доход в разные типы валют (золото, серебро, медь)
      const totalCurrencyGain = Math.floor(
        enemy.currency.min + Math.random() * (enemy.currency.max - enemy.currency.min)
      );
      
      // Распределяем общую сумму на разные типы валют
      // 1 золото = 100 серебра, 1 серебро = 100 меди
      let remainingValue = totalCurrencyGain;
      
      const gold = Math.floor(remainingValue / 10000);
      remainingValue %= 10000;
      
      const silver = Math.floor(remainingValue / 100);
      remainingValue %= 100;
      
      const copper = remainingValue;
      
      // Формируем объект с валютами
      const currencyGain = {
        gold: gold,
        silver: silver,
        copper: copper
      };
      
      // Удаляем типы валют с нулевым значением
      Object.keys(currencyGain).forEach(key => {
        if (currencyGain[key] === 0) {
          delete currencyGain[key];
        }
      });
      
      // Если все значения равны 0, добавляем хотя бы немного меди
      if (Object.keys(currencyGain).length === 0) {
        currencyGain.copper = 1;
      }
      
      console.log('Награда валютой за бой:', currencyGain);
      
      // Модифицируем шанс получения предметов на основе погодных эффектов
      const lootChanceModifier = effectiveWeatherEffects.exploration?.resourceQualityModifier || 1.0;
      
      const lootItems = enemy.loot
        .filter(item => Math.random() * 100 < (item.chance * lootChanceModifier))
        .map(item => ({
          ...item,
          quantity: 1
        }));
      
      setResults({
        victory: true,
        playerStats: combatStats.player,
        enemyStats: combatStats.enemy,
        duration,
        rewards: {
          experience: experienceGain,
          currency: currencyGain,
          items: lootItems
        }
      });
      
      // Обновляем состояние игрока
      if (actions.addExperience) {
        actions.addExperience(experienceGain);
      }
      
      // Выбираем единый способ обновления валюты
      console.log('Добавление награды в виде валюты после боя:', currencyGain);
      
      // Используем updateCurrency с флагом isAdditive=true, не используя addCurrency,
      // чтобы избежать двойного сложения
      if (actions.updateCurrency) {
        actions.updateCurrency(currencyGain, true);
      } else {
        console.error('Функция updateCurrency не найдена, используем dispatch напрямую');
        // Запасной вариант, если функции нет
        actions.dispatch({ 
          type: ACTION_TYPES.UPDATE_CURRENCY, 
          payload: currencyGain,
          isAdditive: true
        });
      }
      
      lootItems.forEach(item => {
        if (actions.addItem) {
          actions.addItem(item);
        }
      });
    } else {
      setResults({
        victory: false,
        playerStats: combatStats.player,
        enemyStats: combatStats.enemy,
        duration
      });
    }
  }, [enemy, combatStats, startTime, actions]);
  
  // ПОЛНОСТЬЮ ПЕРЕРАБОТАННЫЙ механизм хода противника - без таймеров и с защитой от переключения вкладок
  useEffect(() => {
    // Функция для немедленного выполнения хода NPC
    const performEnemyAction = () => {
      console.log('⚡ ПРЯМОЕ выполнение действия противника');
      
      // Получаем самые актуальные данные о противнике из всех возможных источников
      const currentEnemy = enemy || state.combat.enemyCombatState || state.combat.enemy;
      
      try {
        if (!currentEnemy || !currentEnemy.attacks || !Array.isArray(currentEnemy.attacks) || currentEnemy.attacks.length === 0) {
          console.warn('⚠️ Недостаточно данных для хода NPC, выполняем базовую атаку');
          handleAction({ type: 'attack' });
          return;
        }
        
        // Выбираем случайную доступную атаку
        const availableActions = currentEnemy.attacks.filter(attack => typeof attack === 'object' && attack !== null);
        
        if (availableActions.length > 0) {
          const selectedAction = availableActions[Math.floor(Math.random() * availableActions.length)];
          console.log('NPC выбрал действие:', selectedAction.name);
          
          handleAction({
            type: 'technique',
            ...selectedAction
          });
        } else {
          handleAction({ type: 'attack' });
        }
      } catch (error) {
        console.error('❌ Ошибка при выборе действия NPC:', error);
        handleAction({ type: 'attack' });
      }
    };
    
    // Проверяем наличие флага forceNPCTurn в глобальном состоянии
    const forceNPCTurn = state.combat.forceNPCTurn;
    
    // Проверяем, нужно ли принудительно выполнить ход NPC
    if (forceNPCTurn) {
      console.log('🔄 Принудительное выполнение хода NPC после возвращения на вкладку');
      
      // Убедимся, что сейчас ход NPC
      if (!isPlayerTurn) {
        // Блокируем повторное выполнение действий
        setIsProcessingAction(true);
        
        // Сбрасываем флаг forceNPCTurn немедленно
        actions.updateCombatState({ forceNPCTurn: false });
        
        // Небольшая задержка перед выполнением хода NPC для стабильности
        setTimeout(() => {
          // Немедленно выполняем ход NPC
          performEnemyAction();
        }, 100);
      } else {
        // Если сейчас ход игрока, просто сбрасываем флаг
        actions.updateCombatState({ forceNPCTurn: false });
      }
    }
    
    // Проверяем, не зависло ли состояние боя
    // Это происходит, если мы не на ходу игрока, интерфейс не заблокирован, бой не завершен, но никакое действие не обрабатывается
    const isHanging = !isPlayerTurn && !disabled && !isFinished && !isProcessingAction;
    
    if (isHanging) {
      console.log('🔍 Обнаружено потенциальное зависание - ход NPC без активной обработки');
      
      // Блокируем повторное выполнение действий
      setIsProcessingAction(true);
      
      // Немедленно выполняем ход NPC - без таймеров
      performEnemyAction();
    }
}, [
  isPlayerTurn,
  disabled,
  isFinished,
  isProcessingAction,
  enemy?.id,
  handleAction,
  state.combat.enemyCombatState?.id,
  state.combat.forceNPCTurn,
  actions
]);

// Усиленный механизм обнаружения и исправления "зависшего" состояния
useEffect(() => {
  // Время ожидания перед принудительным исправлением зависшего состояния
  const HANG_DETECTION_DELAY = 2000; // 2 секунды - более быстрое обнаружение
  const PLAYER_TURN_HANG_DELAY = 5000; // 5 секунд для хода игрока
  
  let lastCheckedTime = Date.now();
  let stuckActionStartTime = null;
  
  // Функция для исправления зависшего состояния
  const checkAndFixHangingState = () => {
    const currentTime = Date.now();
    
    // Если isProcessingAction = true, и это состояние не меняется
    if (isProcessingAction) {
      if (!stuckActionStartTime) {
        stuckActionStartTime = currentTime;
        console.log('⏱️ Начало отсчета потенциального зависания:', stuckActionStartTime);
      }
      
      // Вычисляем, сколько времени длится потенциальное зависание
      const stuckDuration = currentTime - stuckActionStartTime;
      
      // Разные таймауты для хода игрока и NPC
      const timeoutThreshold = isPlayerTurn ? PLAYER_TURN_HANG_DELAY : HANG_DETECTION_DELAY;
      
      // Если превышен таймаут, исправляем зависание
      if (stuckDuration > timeoutThreshold) {
        console.warn(`⚠️ ОБНАРУЖЕНО ЗАВИСАНИЕ: ${isPlayerTurn ? 'ход игрока' : 'ход NPC'} заблокирован ${stuckDuration}ms`);
        
        // Принудительно разблокируем состояние
        setIsProcessingAction(false);
        
        // Если это ход NPC, переключаем на игрока
        if (!isPlayerTurn) {
          setIsPlayerTurn(true);
          
          // Обновляем глобальное состояние для синхронизации
          actions.updateCombatState({
            isPlayerTurn: true,
            isProcessingAction: false,
            forceNPCTurn: false
          });
          
          console.log('🔄 Ход принудительно передан игроку после обнаружения зависания');
        } else {
          // Обновляем только флаг обработки, сохраняя ход игрока
          actions.updateCombatState({
            isProcessingAction: false
          });
          console.log('🔓 Снята блокировка хода игрока после обнаружения зависания');
        }
        
        // Сбрасываем отслеживание
        stuckActionStartTime = null;
      }
    } else {
      // Если isProcessingAction = false, сбрасываем отслеживание
      stuckActionStartTime = null;
    }
    
    lastCheckedTime = currentTime;
  };
  
  // Запускаем проверку каждую секунду
  const hangDetectionTimer = setInterval(checkAndFixHangingState, 1000);
  
  // Очищаем таймер при размонтировании
  return () => {
    clearInterval(hangDetectionTimer);
  };
}, [
  isPlayerTurn,
  disabled,
  isFinished,
  isProcessingAction,
  actions
]);

  // Используем точно такую же формулу, как и при расчете урона в бою, с проверкой на undefined
  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавлена безопасная проверка на enemy и enemy.stats
  let exactDamage = 10; // Значение по умолчанию
  
  if (enemy && enemy.stats && player && player.stats) {
    const dummyDefense = enemy.stats.physicalDefense !== undefined
      ? enemy.stats.physicalDefense
      : (enemy.stats.defense || 0);
    const reduction = dummyDefense / (dummyDefense + 100);
    exactDamage = Math.max(1, Math.floor(player.stats.physicalAttack * (1 - reduction)));
    console.log('📊 Расчет базового урона:', exactDamage);
  } else {
    console.warn('⚠️ Невозможно рассчитать урон - отсутствуют данные игрока или противника');
  }
  
  const calculatedBasicAttack = {
    ...techniques.basicAttack,
    calculatedDamage: exactDamage
  };
  
  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавлена глубокая безопасная проверка на state.player
  // Убираем возможность ошибки "Cannot read properties of undefined (reading 'map')"
  console.log('🛡️ Проверка state.player:', {
    hasState: !!state,
    hasPlayer: state && !!state.player,
    hasTechniques: state?.player?.techniques ? 'да' : 'нет',
    isTechniquesArray: Array.isArray(state?.player?.techniques) ? 'да' : 'нет',
  });
  
  // Безопасно получаем список техник
  const playerTechniques = (state && state.player && Array.isArray(state.player.techniques))
    ? state.player.techniques
    : [];
  console.log('📋 Список техник игрока:', Array.isArray(playerTechniques) ? playerTechniques.length : 'не массив');
  
  const playerActions = [
    calculatedBasicAttack,
    ...(Array.isArray(playerTechniques) ? playerTechniques.map(technique => {
      // Для техник рассчитываем урон с учетом силы атаки персонажа
      const attackPower =
        player && player.stats ? (
          technique.damageType === 'physical'
            ? player.stats.physicalAttack
            : player.stats.magicalAttack
        ) : 10; // Значение по умолчанию, если нет данных игрока
      
      // ВАЖНОЕ ИСПРАВЛЕНИЕ: Изменен порядок - type указывается ПОСЛЕ spread-оператора
      // Это предотвращает перезапись свойства type значением из technique
      
      // ОБНОВЛЕНИЕ: Расчет урона техник с учетом защиты противника
      // Проверка наличия damage в технике
      const techniqueDamage = typeof technique.damage === 'number' ? technique.damage : 0;
      
      // Сначала складываем базовую атаку и урон техники
      const totalAttackPower = attackPower + techniqueDamage;
      
      // Затем применяем формулу с учетом защиты противника (как для обычной атаки)
      let techniqueExactDamage = totalAttackPower; // Значение по умолчанию
      
      // КРИТИЧЕСКАЯ БЕЗОПАСНАЯ ПРОВЕРКА - убираем прямое обращение к enemy.stats
      if (enemy && enemy.stats) {
        const dummyDefense = enemy.stats.physicalDefense !== undefined
          ? enemy.stats.physicalDefense
          : (enemy.stats.defense || 0);
        const reduction = dummyDefense / (dummyDefense + 100);
        techniqueExactDamage = Math.max(1, Math.floor(totalAttackPower * (1 - reduction)));
      }
      
      // Логируем информацию для отладки
      /*console.log(`📊 Расчет урона для техники ${technique.name}:`, {
        базоваяАтака: attackPower,
        бонусТехники: technique.damage,
        общаяАтака: totalAttackPower,
        защитаПротивника: dummyDefense,
        коэффициентСнижения: reduction.toFixed(2),
        итоговыйУрон: exactDamage
      });*/
      
      return {
        ...technique,
        type: 'technique', // Теперь type не будет перезаписан
        calculatedDamage: techniqueExactDamage
      };
    }) : []), // ИСПРАВЛЕНО: добавлена закрывающая скобка и пустой массив как альтернатива
    { // ИСПРАВЛЕНО: теперь это отдельный элемент массива
      type: 'defend',
      name: 'Защита',
      description: 'Снижает получаемый урон на 50% в течение 2 ходов',
      icon: '🛡️'
    },
    {
      type: 'flee',
      name: 'Побег',
      description: '30% шанс сбежать из боя',
      icon: '🏃'
    }
  ];
  
  // Добавляем способности питомца
  if (activePet) {
    // Преобразуем ID способностей питомца в полные объекты способностей
    const petAbilities = activePet.abilities.map(abilityId => {
      // Находим полный объект способности по ID и типу питомца
      const fullAbility = petTypeAbilities[activePet.type]?.find(a => a.id === abilityId);
      
      // Получаем локализованные названия способностей
      const petTypeNames = {
        'fire': 'Огненный',
        'water': 'Водный',
        'earth': 'Земляной',
        'wind': 'Ветряной',
        'lightning': 'Молниевый',
        'wood': 'Древесный',
        'metal': 'Металлический',
        'darkness': 'Теневой',
        'light': 'Светлый',
      };
      
      // Локализация названий способностей
      const abilityLocalNames = {
        'fire_breath': 'Огненное дыхание',
        'heat_aura': 'Аура жара',
        'meteor_strike': 'Метеоритный удар',
        'water_splash': 'Водяной всплеск',
        'healing_rain': 'Исцеляющий дождь',
        'tidal_wave': 'Приливная волна',
        'stone_armor': 'Каменная броня',
        'earth_spike': 'Земляной шип',
        'earthquake': 'Землетрясение',
        'swift_winds': 'Быстрые ветра',
        'wind_slash': 'Ветряной разрез',
        'cyclone': 'Циклон',
        'wind_breath': 'Ветряное дыхание'
      };
      
      // Если способность найдена, возвращаем её с типом 'petAbility'
      if (fullAbility) {
        // Рассчитываем урон питомца: базовая физическая атака игрока + урон способности питомца
        const basePetDamage = Math.floor((activePet.strength * 1.5 + activePet.intelligence * 0.5) * 
                            (fullAbility.damageMultiplier || 1.0));
        
        const playerAttackBonus = player.stats.physicalAttack || 0;
        const totalDamage = basePetDamage + playerAttackBonus;
        
        return {
          ...fullAbility,
          type: 'petAbility',
          petId: activePet.id, // Добавляем ID питомца для редуктора
          // Используем локализованное название вместо технического ID
          name: abilityLocalNames[fullAbility.id] || fullAbility.name || `Способность питомца (${fullAbility.id})`,
          // Добавляем сведения о типе питомца
          description: fullAbility.description || 
            `${petTypeNames[activePet.type] || ''} питомец использует особую способность, наносящую ${totalDamage} урона.`,
          // Общий урон - сумма атаки игрока и способности питомца
          damage: totalDamage,
          calculatedDamage: totalDamage,
          // Добавляем информацию о стоимости использования способности в виде сытости
          hungerCost: 20,
          // Проверяем доступность способности по сытости
          disabled: activePet.hunger < 20,
          // Иконка способности на основе стихии питомца
          icon: fullAbility.element === 'fire' ? '🔥' : 
               fullAbility.element === 'water' ? '💧' : 
               fullAbility.element === 'earth' ? '🌋' : 
               fullAbility.element === 'wind' ? '🌪️' : '⚡'
        };
      }
      
      // Если способность не найдена, возвращаем заглушку с более понятным названием
      const localName = abilityLocalNames[abilityId] || `Способность питомца (${abilityId})`;
      console.warn(`Способность ${abilityId} не найдена для питомца типа ${activePet.type}`);
      
      return {
        type: 'petAbility',
        petId: activePet.id,
        id: abilityId,
        name: localName,
        description: `${petTypeNames[activePet.type] || ''} питомец использует особую способность.`,
        damage: player.stats.physicalAttack + Math.floor(activePet.strength * 1.5),
        calculatedDamage: player.stats.physicalAttack + Math.floor(activePet.strength * 1.5),
        damageType: 'physical',
        hungerCost: 20,
        disabled: activePet.hunger < 20,
        icon: '🐾'
      };
    });
    
          // Для каждой способности питомца проверяем, достаточно ли сытости,
          // и устанавливаем disabled=true для кнопки если недостаточно
          const petAbilitiesWithDisabled = petAbilities.map(ability => ({
            ...ability,
            // Установка состояния disabled для кнопки на основе проверки сытости
            disabled: activePet.hunger < 20, // Используем такое же пороговое значение, как и в коде проверки
            // Дополнительный CSS класс для отображения недоступной кнопки
            className: activePet.hunger < 20 ? 'pet-ability-disabled' : ''
          }));
          
          // Добавляем все найденные способности питомца к действиям игрока
          playerActions.push(...petAbilitiesWithDisabled);
  }

  if (isFinished) {
    return (
      <CombatResults
        results={results}
        onClose={() => onEnd(results)}
      />
    );
  }
  
  // Проверка что игрок и враг корректно сформированы
  console.log('CombatManager передает в CombatInterface:', {
    player: player ? 'player OK' : 'player is ' + typeof player,
    playerType: typeof player,
    enemy: enemy ? 'enemy OK' : 'enemy is ' + typeof enemy,
    enemyType: typeof enemy,
    playerActions: Array.isArray(playerActions) ? `${playerActions.length} actions` : typeof playerActions
  });
  
  // Проверяем, что все обязательные данные у player и enemy присутствуют
  if (!player || typeof player !== 'object') {
    console.error('CombatManager: player не определен или не является объектом', player);
    return <div>Ошибка: Данные игрока отсутствуют</div>;
  }
  
  if (!enemy || typeof enemy !== 'object') {
    console.error('CombatManager: enemy не определен или не является объектом', enemy);
    return <div>Ошибка: Данные противника отсутствуют</div>;
  }
  
  if (!player.stats || !enemy.stats) {
    console.error('CombatManager: отсутствуют stats у player или enemy', {
      playerStats: player.stats,
      enemyStats: enemy.stats
    });
    return <div>Ошибка: Данные статистики отсутствуют</div>;
  }
  
  // Добавляем отладочную информацию о состоянии боя
  console.log('CombatManager: Текущее состояние боя', {
    isPlayerTurn,
    isProcessingAction,
    forceNPCTurn: state.combat.forceNPCTurn,
    disabled,
    isFinished
  });

  return (
    <CombatInterface
      player={player}
      enemy={enemy}
      playerActions={playerActions}
      onActionSelect={handleAction}
      isPlayerTurn={isPlayerTurn}
      disabled={disabled} // Удаляем дополнительное условие, которое могло блокировать атаки игрока
      combatLog={combatLog}
    />
  );
}
export default CombatManager;
