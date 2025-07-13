/**
 * Combat Service - сервис для управления боями с NPC (PvE)
 */
const modelRegistry = require('../models/registry');
const { Op, QueryTypes } = require('sequelize');
const { unifiedDatabase, initializeDatabaseConnection } = require('./database-connection-manager');
const { Sequelize } = require('sequelize');
const techniqueService = require('./technique-service');
const QuestService = require('./quest-service');
const InventoryService = require('./inventory-service');
const CharacterStatsService = require('./character-stats-service');

let sequelize;
// Асинхронная функция для получения экземпляра
async function getSequelizeInstance() {
  if (!sequelize) {
    const { db } = await initializeDatabaseConnection();
    sequelize = db;
  }
  return sequelize;
}
/**
 * Класс для работы с PvE боями
 */
class CombatService {
  /**
   * Начать новый бой с NPC
   * @param {number} userId - ID игрока
   * @param {string} enemyId - ID врага
   * @returns {Object} - Объект с информацией о созданном бое
   */
  static async startCombat(userId, enemyId) {
    console.log(`[CombatService] Попытка начать бой для игрока ${userId} с врагом ${enemyId}`);

    const User = modelRegistry.getModel('User');
    const CharacterStats = modelRegistry.getModel('CharacterStats');
    const Enemy = modelRegistry.getModel('Enemy');
    const EnemyStats = modelRegistry.getModel('EnemyStats');
    const EnemyAttack = modelRegistry.getModel('EnemyAttack');
    const EnemyLoot = modelRegistry.getModel('EnemyLoot');
    const EnemyCurrency = modelRegistry.getModel('EnemyCurrency');

    const player = await User.findByPk(userId, {
      include: [{ model: CharacterStats, as: 'characterStats' }]
    });

    if (!player || !player.characterStats) {
      throw new Error('Игрок или его характеристики не найдены');
    }

    const enemy = await Enemy.findByPk(enemyId, {
      include: [
        { model: EnemyStats, as: 'stats' },
        { model: EnemyAttack, as: 'attacks' },
        { model: EnemyLoot, as: 'loot' },
        { model: EnemyCurrency, as: 'currency' },
      ]
    });

    if (!enemy) {
      throw new Error('Враг не найден');
    }

    // Получаем полное состояние игрока, включая все модификаторы
    const fullPlayerStats = await CharacterStatsService.getCombinedCharacterState(userId);

    const Combat = modelRegistry.getModel('Combat');

    // Получаем изученные техники игрока
    const learnedTechniques = await techniqueService.getLearnedTechniques(userId);

    // Рассчитываем здоровье по формуле: 100 + (level * 2) + (health * 2)
    const playerLevel = fullPlayerStats.base.level || 1;
    const healthStat = fullPlayerStats.modified.health || 10;
    const calculatedMaxHp = 100 + (playerLevel * 2) + (healthStat * 2);
    
    // Рассчитываем энергию аналогично
    const energyStat = fullPlayerStats.modified.energy || 50;

    const calculatedMaxEnergy = 50 + (playerLevel * 1) + (energyStat * 1);

    const playerState = {
      // Используем рассчитанные значения здоровья и энергии
      currentHp: calculatedMaxHp,
      maxHp: calculatedMaxHp,
      currentEnergy: calculatedMaxEnergy,
      maxEnergy: calculatedMaxEnergy,
      // Сохраняем базовые статы для будущего пересчета эффектов в бою
      baseStats: fullPlayerStats.base,
      // Сохраняем вторичные статы для использования в расчетах
      secondaryStats: fullPlayerStats.secondary,
      effects: [],
      techniques: learnedTechniques || [] // Добавляем техники в состояние
    };

    const enemyBaseStats = {
      health: enemy.stats.health || 100,
      energy: enemy.stats.energy || 50,
      physicalDefense: enemy.stats.physicalDefense || 0,
      spiritualDefense: enemy.stats.spiritualDefense || 0,
      accuracy: enemy.stats.accuracy || 0,
      evasion: enemy.stats.evasion || 0,
    };

    const enemyState = {
      currentHp: enemy.stats.health,
      maxHp: enemy.stats.health,
      currentEnergy: enemy.stats.energy,
      maxEnergy: enemy.stats.energy,
      effects: [],
      baseStats: enemyBaseStats, // Сохраняем базовые статы для врага
      modifiedStats: { ...enemyBaseStats }, // Начальные модифицированные статы
      secondaryStats: {}, // Врагам пока не считаем вторичные статы
      enemyLevel: enemy.level || 1 // Добавляем уровень врага для расчета урона
    };

    const newCombat = await Combat.create({
      user_id: userId,
      enemy_id: enemyId,
      player_state: playerState,
      enemy_state: enemyState,
      turn: 'player',
      log: [{ message: `Бой начался! ${player.username} против ${enemy.name}.`, timestamp: new Date() }]
    });

    console.log('[CombatService] Бой успешно создан и сохранен в БД:', newCombat.toJSON());

    return { success: true, combat: newCombat.toJSON() };
  }

  /**
   * Обработка действия игрока в бою
   * @param {number} combatId - ID боя
   * @param {number} userId - ID игрока
   * @param {Object} action - Объект действия, например { type: 'attack' }
   * @returns {Object} - Обновленное состояние боя
   */
  static async performAction(combatId, userId, action) {
    const Combat = modelRegistry.getModel('Combat');
    const combat = await Combat.findByPk(combatId);

    if (!combat) {
      throw new Error('Бой не найден');
    }


    if (combat.user_id !== userId) {
      throw new Error('Вы не можете действовать в чужом бою');
    }

    if (combat.status !== 'active') {
      throw new Error('Бой уже завершен');
    }

    if (combat.turn !== 'player') {
      throw new Error('Сейчас не ваш ход');
    }

    // TODO: Реализовать логику техник и других действий
    let logEntry = {};

    if (action.type === 'attack') {
      const attackResult = this._calculateDamage(combat.player_state, combat.enemy_state);
      combat.enemy_state.currentHp = Math.max(0, combat.enemy_state.currentHp - attackResult.damage);
      let message = `Игрок атакует.`;
      if (attackResult.isDodge) {
        message += ` Враг уклонился!`;
      } else if (attackResult.isCrit) {
        message += ` Критический удар! Нанесено ${attackResult.damage} урона.`;
      } else {
        message += ` Нанесено ${attackResult.damage} урона.`;
      }
      logEntry = { turn: 'player', action: 'attack', ...attackResult, message, timestamp: new Date() };
      console.log(`[CombatService] Игрок атаковал в бою ${combatId}. Результат:`, attackResult);
    } else if (action.type === 'defense') {
      // Логика защиты, адаптированная из pvp-service
      const defenseEffectData = { // Заглушка, т.к. модели TechniqueEffect еще нет
          name: 'Защита',
          type: 'buff',
          subtype: 'protection',
          duration: 5, // 5 секунд
          modifiers: 'defense_increase_25'
      };

      if (!combat.player_state.effects) {
        combat.player_state.effects = [];
      }

      const defenseEffect = {
        id: `eff_${Date.now()}`,
        name: defenseEffectData.name,
        type: defenseEffectData.type,
        subtype: defenseEffectData.subtype,
        duration: defenseEffectData.duration,
        durationMs: defenseEffectData.duration * 1000,
        startTime: Date.now(),
        appliedAt: new Date().toISOString(),
        modifiers: defenseEffectData.modifiers,
        source: 'player_action'
      };

      combat.player_state.effects.push(defenseEffect);
      logEntry = { turn: 'player', action: 'defense', message: 'Игрок уходит в глухую оборону.', timestamp: new Date() };
      console.log(`[CombatService] Игрок применил защиту в бою ${combatId}`);
      
      // Пересчитываем статы после применения эффекта защиты
      this._recalculateCombatStats(combat.player_state);


    } else if (action.type === 'technique') {
      const technique = combat.player_state.techniques.find(t => t.id === action.id);
      if (!technique) {
        throw new Error('Игрок не знает такую технику');
      }
      console.log('[COMBAT_DEBUG] 3. Используется техника:', JSON.stringify(technique, null, 2));

      // TODO: Перенести расчет стоимости энергии на основе модифицированных статов
      let energyCost = technique.energy_cost || 0;
      if (combat.player_state.currentEnergy < energyCost) {
        throw new Error('Недостаточно энергии для применения техники');
      }

      combat.player_state.currentEnergy -= energyCost;
      let message = `Игрок использует технику "${technique.name}".`;

      // Определяем цель
      const isAttack = technique.type === 'attack';
      const targetState = isAttack ? combat.enemy_state : combat.player_state;
      const targetName = isAttack ? 'врага' : 'себя';
      console.log(`[COMBAT_DEBUG] 4. Тип техники: ${technique.type}. Цель: ${targetName}`);

      // Применяем эффекты
      if (technique.effects && technique.effects.length > 0) {
        console.log('[COMBAT_DEBUG] 5. Техника имеет эффекты. Применяем...');
        this._applyTechniqueEffects(technique, targetState);
        message += ` Накладывает эффекты на ${targetName}.`;
        
        // Пересчитываем характеристики только для игрока, не для врагов
        // DoT эффекты не должны влиять на максимальное здоровье врагов
        if (targetState === combat.player_state) {
          this._recalculateCombatStats(targetState);
        }
      }

      // Применяем прямой урон (только для атакующих техник)
      if (isAttack && technique.damage > 0) {
        console.log(`[COMBAT_DEBUG] 6. Техника имеет прямой урон: ${technique.damage}. Наносим...`);
        const attackResult = this._calculateDamage(combat.player_state, combat.enemy_state, technique.damage, 'physical', 'technique');
        targetState.currentHp = Math.max(0, targetState.currentHp - attackResult.damage);
        
        if (attackResult.isDodge) {
          message += ` Враг уклонился от техники!`;
        } else if (attackResult.isCrit) {
          message += ` Критический удар техникой! Нанесено ${attackResult.damage} урона.`;
        } else {
          message += ` Наносит ${attackResult.damage} урона.`;
        }
        console.log(`[COMBAT_DEBUG] 6.1. Результат прямого урона:`, attackResult);
      }

      // Применяем прямое исцеление (только для НЕатакующих техник)
      if (!isAttack && technique.healing > 0) {
        console.log(`[COMBAT_DEBUG] 7. Техника имеет прямое исцеление: ${technique.healing}. Применяем...`);
        const healing = technique.healing; // В будущем можно добавить модификаторы
        targetState.currentHp = Math.min(targetState.maxHp, targetState.currentHp + healing);
        message += ` Восстанавливает ${healing} здоровья.`;
        console.log(`[COMBAT_DEBUG] 7.1. Здоровье игрока после исцеления: ${targetState.currentHp}`);
      }

      logEntry = { turn: 'player', action: 'technique', message, timestamp: new Date() };

    } else {
      throw new Error(`Неизвестное действие: ${action.type}`);
    }

    combat.log.push(logEntry);
    combat.turn = 'enemy'; // Передаем ход противнику

    // Ответный ход противника
    const enemyLogEntry = this._performEnemyTurn(combat);
    combat.log.push(enemyLogEntry);
    
    // Проверяем, не закончился ли бой
    if (combat.player_state.currentHp <= 0) {
      combat.status = 'completed';
      combat.winner = 'enemy';
      combat.log.push({ message: 'Игрок потерпел поражение.', timestamp: new Date() });
    } else if (combat.enemy_state.currentHp <= 0) {
      combat.status = 'completed';
      combat.winner = 'player';
      combat.log.push({ message: 'Противник повержен!', timestamp: new Date() });
      const rewards = await this._processRewards(combat, userId);
      combat.rewards = rewards; // Динамически добавляем награды в объект
    } else {
      combat.turn = 'player'; // Возвращаем ход игроку
    }

    // Sequelize не всегда корректно отслеживает изменения в JSONB, поэтому помечаем поле как измененное
    combat.changed('player_state', true);
    combat.changed('enemy_state', true);
    combat.changed('log', true);

    await combat.save();

    const finalCombatState = combat.toJSON();
    if (combat.rewards) {
      finalCombatState.rewards = combat.rewards;
    }
    return { success: true, combat: finalCombatState };
  }

  /**
   * Применяет эффекты от техники к цели.
   * @param {Object} technique - Объект техники, содержащий эффекты.
   * @param {Object} targetState - Состояние цели (player_state или enemy_state).
   * @private
   */
  static _applyTechniqueEffects(technique, targetState) {
    if (!technique.effects || technique.effects.length === 0) {
      return;
    }

    console.log(`[CombatService] Применение эффектов техники "${technique.name}". Всего эффектов: ${technique.effects.length}`);

    const newEffects = technique.effects.map(effect => {
      // Определяем правильный тип и подтип эффекта (как в PvP)
      let newType = effect.type;
      let subtype = effect.subtype;
      
      // Особая обработка для Регенерации и Накопления энергии (как в PvP)
      if (effect.name === 'Регенерация') {
        newType = 'health_regen'; // Изменяем тип
        subtype = 'healing';
        console.log(`[CombatService] Изменен тип для эффекта "Регенерация": ${newType}`);
      } else if (effect.name === 'Накопление энергии') {
        newType = 'energy_gain'; // Изменяем тип
        subtype = 'energy_gain';
        console.log(`[CombatService] Изменен тип для эффекта "Накопление энергии": ${newType}`);
      } else if (effect.name === 'Защита') {
        subtype = 'protection';
      } else if (effect.name === 'Ускорение') {
        subtype = 'speed';
      } else if (effect.name === 'Багряное пламя') {
        newType = 'burn';
        subtype = 'dot';
      }
      
      // Генерируем уникальный ID (как в PvP)
      const uniqueId = effect.id ||
        `${effect.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      console.log(`[CombatService] Создан новый эффект от техники:`, {
        name: effect.name,
        type: newType,
        originalType: effect.type,
        subtype: subtype,
        id: uniqueId
      });
      
      // Создаем эффект с учетом типа длительности (как в PvP)
      let effectData = {
        id: uniqueId,
        name: effect.name,
        icon: effect.icon,
        type: newType, // Используем новый тип
        subtype: subtype, // Добавляем подтип
        tickRate: effect.tickRate,
        appliedAt: new Date().toISOString()
      };
      
      // Получаем базовую длительность эффекта из БД (как в PvP)
      let baseDuration = effect.duration;
      
      // Проверяем наличие duration в эффекте из БД (как в PvP)
      if (baseDuration === undefined || baseDuration === null) {
        console.log(`[CombatService ПРЕДУПРЕЖДЕНИЕ] Эффект ${effect.id || effect.name} не имеет значения duration в БД`);
        
        // Устанавливаем значение по умолчанию в зависимости от типа эффекта (как в PvP)
        if (effect.name === 'Накопление энергии') {
          baseDuration = 7; // Известное значение из БД
          console.log(`[CombatService] Установлено значение по умолчанию для эффекта "Накопление энергии": ${baseDuration} сек.`);
        } else if (effect.name === 'Регенерация') {
          baseDuration = 5; // Известное значение из БД
          console.log(`[CombatService] Установлено значение по умолчанию для эффекта "Регенерация": ${baseDuration} сек.`);
        } else if (effect.name === 'Багряное пламя') {
          baseDuration = 6; // Известное значение из БД
          console.log(`[CombatService] Установлено значение по умолчанию для эффекта "Багряное пламя": ${baseDuration} сек.`);
        } else {
          baseDuration = 3; // Стандартное значение для остальных эффектов
          console.log(`[CombatService] Установлено стандартное значение для эффекта "${effect.name}": ${baseDuration} сек.`);
        }
      }
      
      // Устанавливаем длительность (как в PvP)
      effectData.durationMs = baseDuration * 1000;
      effectData.duration = baseDuration;
      effectData.startTime = Date.now();
      effectData.durationType = 'time';
      
      // Добавляем специфичные поля для разных типов эффектов (как в PvP)
      if (effect.name === 'Накопление энергии') {
        // Устанавливаем значение регенерации энергии (как в PvP)
        const baseValue = effect.value || 5;
        effectData.value = baseValue;
        console.log(`[CombatService] Значение эффекта "Накопление энергии": ${effectData.value}`);
      } else if (effect.name === 'Багряное пламя') {
        // Устанавливаем урон от огня (как в PvP)
        const baseDamage = effect.damage || 8;
        effectData.damage = baseDamage;
        console.log(`[CombatService] Урон эффекта "Багряное пламя": ${effectData.damage}`);
      } else if (effect.name === 'Регенерация') {
        // Устанавливаем лечение (как в PvP)
        const baseHealing = effect.healing || 15;
        effectData.healing = baseHealing;
        console.log(`[CombatService] Лечение эффекта "Регенерация": ${effectData.healing}`);
      }
      
      // Добавляем поля damage, healing, value из базы данных
      if (effect.damage) {
        effectData.damage = effect.damage;
      }
      if (effect.healing) {
        effectData.healing = effect.healing;
      }
      if (effect.value) {
        effectData.value = effect.value;
      }
      
      console.log(`[CombatService] Установлена временная длительность для эффекта "${effect.name}": ${effectData.durationMs}ms (${baseDuration} секунд)`);
      console.log(`[CombatService] Финальная структура эффекта:`, {
        name: effectData.name,
        type: effectData.type,
        damage: effectData.damage,
        healing: effectData.healing,
        value: effectData.value,
        duration: effectData.duration
      });
      
      return effectData;
    });

    targetState.effects = this.mergeEffects(targetState.effects || [], newEffects);
  }

  /**
   * Объединяет новые эффекты с существующими.
   * Новые эффекты с тем же `name` заменяют старые.
   */
  static mergeEffects(currentEffects, newEffects) {
    const effectMap = new Map(currentEffects.map(e => [e.name, e]));
    newEffects.forEach(e => effectMap.set(e.name, e));
    return Array.from(effectMap.values());
  }

  /**
   * Пересчитывает боевые характеристики сущности на основе ее базовых статов и текущих эффектов.
   * @param {Object} entityState - Состояние игрока или врага (player_state или enemy_state).
   * @private
   */
  static _recalculateCombatStats(entityState) {
    if (!entityState.baseStats) {
      console.warn('[CombatService] Попытка пересчитать статы без базовых характеристик.');
      return;
    }

    // 1. Применяем эффекты к базовым характеристикам
    const modifiedStats = CharacterStatsService.applyEffectsToStats(
      entityState.baseStats,
      entityState.effects || []
    );

    // 2. Пересчитываем вторичные характеристики на основе модифицированных
    const secondaryStats = CharacterStatsService.calculateSecondaryStats(
      modifiedStats,
      modifiedStats // Используем modifiedStats как основу для культивации
    );

    // 3. Обновляем состояние сущности
    entityState.modifiedStats = modifiedStats;
    entityState.secondaryStats = secondaryStats;

    // 4. Пересчитываем максимальное здоровье и энергию по правильной формуле
    const playerLevel = entityState.baseStats.level || 1;
    const healthStat = modifiedStats.health || 10;
    const energyStat = modifiedStats.energy || 50;
    
    // Используем ту же формулу, что и при создании боя: 100 + (level * 2) + (health * 2)
    const newMaxHp = 100 + (playerLevel * 2) + (healthStat * 2);
    const newMaxEnergy = 50 + (playerLevel * 1) + (energyStat * 1);
    
    // Обновляем максимальные значения
    entityState.maxHp = newMaxHp;
    entityState.maxEnergy = newMaxEnergy;
    
    // Убеждаемся, что текущие значения не превышают новые максимальные
    entityState.currentHp = Math.min(entityState.currentHp, newMaxHp);
    entityState.currentEnergy = Math.min(entityState.currentEnergy, newMaxEnergy);
    
    console.log(`[CombatService] Пересчитаны характеристики: maxHp=${newMaxHp}, maxEnergy=${newMaxEnergy}`);
  }


  /**
   * Упрощенная система расчета урона: (10% + уровень_атакующего)% от максимального здоровья цели
   * @param {Object} attackerState - Состояние атакующего (игрок или враг)
   * @param {Object} defenderState - Состояние защищающегося (игрок или враг)
   * @param {number|null} techniqueDamage - Базовый урон техники (если используется)
   * @param {string} damageType - Тип урона ('physical' или 'spiritual')
   * @param {string} actionType - Тип действия ('attack' или 'technique')
   * @returns {Object} Результат расчета урона
   * @private
   */
  static _calculateDamage(attackerState, defenderState, techniqueDamage = null, damageType = 'physical', actionType = 'attack') {
    console.log(`[CombatService] Начало расчета урона: тип=${damageType}, действие=${actionType}, техника=${techniqueDamage || 'нет'}`);
    
    // 1. Определяем уровень атакующего
    let attackerLevel = 1;
    if (attackerState.baseStats && attackerState.baseStats.level) {
      // Для игрока: уровень из baseStats
      attackerLevel = attackerState.baseStats.level;
    } else if (attackerState.baseStats && attackerState.baseStats.health) {
      // Для врага: используем уровень врага (будет передан в baseStats)
      attackerLevel = attackerState.enemyLevel || 1;
    }

    // 2. Получаем максимальное здоровье цели
    const defenderMaxHp = defenderState.maxHp || 100;

    console.log(`[CombatService] Уровень атакующего: ${attackerLevel}, MaxHP цели: ${defenderMaxHp}`);

    // 3. Рассчитываем базовый урон
    let damage;
    let damagePercent = 0; // Для логирования
    
    // 4. Для техник используем прямые значения как в PvP
    if (actionType === 'technique' && techniqueDamage) {
      // Техника наносит прямой урон (как в PvP)
      damage = techniqueDamage;
      damagePercent = Math.round((damage / defenderMaxHp) * 100); // Для логирования
      console.log(`[CombatService] Прямой урон от техники: ${damage}`);
    } else {
      // Для обычных атак используем процентный расчет
      damagePercent = 10 + attackerLevel;
      damage = Math.floor((defenderMaxHp * damagePercent) / 100);
      console.log(`[CombatService] Базовый урон: ${damagePercent}% от ${defenderMaxHp} = ${damage}`);
    }

    // 6. Проверяем уклонение
    let dodgeChance = 5; // Базовый шанс уклонения 5%
    
    // Для игрока: используем характеристику удачи
    if (defenderState.secondaryStats && defenderState.secondaryStats.luck) {
      dodgeChance += Math.floor(defenderState.secondaryStats.luck / 2);
    }
    // Для врага: используем evasion из базовых характеристик
    else if (defenderState.baseStats && defenderState.baseStats.evasion) {
      dodgeChance += Math.floor(defenderState.baseStats.evasion / 10);
    }
    
    const isDodged = Math.random() * 100 < dodgeChance;
    if (isDodged) {
      console.log(`[CombatService] Атака уклонена! Шанс уклонения: ${dodgeChance}%`);
      return {
        damage: 0,
        isCrit: false,
        isDodge: true,
        dodgeChance: dodgeChance,
        critChance: 0
      };
    }

    // 7. Проверяем критический удар
    let critChance = 5; // Базовый шанс крита 5%
    
    // Для игрока: используем характеристику критического шанса
    if (attackerState.secondaryStats && attackerState.secondaryStats.criticalChance) {
      critChance = attackerState.secondaryStats.criticalChance;
    }
    // Для врага: базовый шанс + бонус от уровня
    else if (attackerState.baseStats) {
      critChance = 5 + Math.floor(attackerLevel / 2);
    }
    
    const isCrit = Math.random() * 100 < critChance;
    if (isCrit) {
      damage = Math.floor(damage * 1.5); // Критический удар увеличивает урон в 1.5 раза
      console.log(`[CombatService] Критический удар! Урон увеличен до ${damage}`);
    }

    // 8. Применяем эффекты (если есть)
    if (attackerState.effects && Array.isArray(attackerState.effects)) {
      for (const effect of attackerState.effects) {
        if (effect.damageBonus && typeof effect.damageBonus === 'number') {
          damage = Math.floor(damage * (1 + effect.damageBonus));
          console.log(`[CombatService] Применен бонус урона от эффекта ${effect.name}: +${effect.damageBonus * 100}%`);
        }
      }
    }

    if (defenderState.effects && Array.isArray(defenderState.effects)) {
      for (const effect of defenderState.effects) {
        if (effect.damageReduction && typeof effect.damageReduction === 'number') {
          damage = Math.floor(damage * (1 - effect.damageReduction));
          console.log(`[CombatService] Применено снижение урона от эффекта ${effect.name}: -${effect.damageReduction * 100}%`);
        }
      }
    }

    // 9. Минимальный урон = 1
    damage = Math.max(1, damage);

    console.log(`[CombatService] Итоговый урон: ${damage} (${damagePercent}% от ${defenderMaxHp}), критический: ${isCrit}, уклонение: ${isDodged}`);

    return {
      damage,
      isCrit,
      isDodge: false,
      critChance: critChance,
      dodgeChance: dodgeChance
    };
  }

  /**
   * @private
   */
  static _performEnemyTurn(combat) {
    const attackResult = this._calculateDamage(combat.enemy_state, combat.player_state); // Враг пока использует базовую атаку
    combat.player_state.currentHp = Math.max(0, combat.player_state.currentHp - attackResult.damage);
    
    let message = `Противник атакует.`;
    if (attackResult.isDodge) {
      message += ` Игрок уклонился!`;
    } else if (attackResult.isCrit) {
      message += ` Критический удар! Вам нанесено ${attackResult.damage} урона.`;
    } else {
      message += ` Вам нанесено ${attackResult.damage} урона.`;
    }
    
    const logEntry = { turn: 'enemy', action: 'attack', ...attackResult, message, timestamp: new Date() };
    console.log(`[CombatService] Противник атаковал в бою ${combat.id}. Результат:`, attackResult);
    return logEntry;
  }

  /**
   * Получает модификаторы от активных эффектов сущности.
   * @param {Object} entityState - Состояние сущности с эффектами.
   * @returns {Object} - Объект с модификаторами эффектов.
   * @private
   */
  static _getEffectModifiers(entityState) {
    if (!entityState || !entityState.effects || !Array.isArray(entityState.effects)) {
      return {
        dotModifier: 0,       // Модификатор урона от времени (в процентах)
        healingModifier: 0,   // Модификатор лечения (в процентах)
        damage: 0,            // Модификатор урона (в процентах)
        defense: 0,           // Модификатор защиты (в процентах)
        speed: 0,             // Модификатор скорости (в процентах)
        energyRegen: 0        // Бонус к регенерации энергии (абсолютное значение)
      };
    }
    
    const modifiers = {
      dotModifier: 0,       // Модификатор урона от времени (в процентах)
      healingModifier: 0,   // Модификатор лечения (в процентах)
      damage: 0,            // Модификатор урона (в процентах)
      defense: 0,           // Модификатор защиты (в процентах)
      speed: 0,             // Модификатор скорости (в процентах)
      energyRegen: 0        // Бонус к регенерации энергии (абсолютное значение)
    };
    
    // Суммируем модификаторы от всех эффектов
    for (const effect of entityState.effects) {
      // Обработка по типу эффекта
      switch (effect.type) {
        case 'burn':
        case 'poison':
        case 'bleed':
          // Эффекты урона от времени могут иметь модификаторы силы
          if (effect.damageBonus) {
            modifiers.dotModifier += effect.damageBonus;
          }
          break;
          
        case 'regenerate':
        case 'heal':
          // Эффекты лечения могут иметь модификаторы эффективности
          if (effect.healingBonus) {
            modifiers.healingModifier += effect.healingBonus;
          }
          if (effect.value && effect.name && effect.name.includes('энерги')) {
            modifiers.energyRegen += effect.value;
          }
          break;
          
        case 'buff':
          // Баффы могут модифицировать различные характеристики
          if (effect.damageBonus) modifiers.damage += effect.damageBonus;
          if (effect.defenseBonus) modifiers.defense += effect.defenseBonus;
          if (effect.speedBonus) modifiers.speed += effect.speedBonus;
          break;
          
        case 'debuff':
          // Дебаффы уменьшают характеристики
          if (effect.damageReduction) modifiers.damage -= effect.damageReduction;
          if (effect.defenseReduction) modifiers.defense -= effect.defenseReduction;
          if (effect.speedReduction) modifiers.speed -= effect.speedReduction;
          break;
      }
      
      // Дополнительная обработка по подтипу
      if (effect.subtype) {
        switch (effect.subtype) {
          case 'dot':
            if (effect.value) modifiers.dotModifier += (effect.value * 0.1); // 10% за единицу
            break;
          case 'healing':
            if (effect.value) modifiers.healingModifier += (effect.value * 0.1); // 10% за единицу
            break;
          case 'energy_regen':
            if (effect.value) modifiers.energyRegen += effect.value;
            break;
        }
      }
    }
    
    return modifiers;
  }

  /**
   * Применяет периодические эффекты (урон/лечение со временем), напрямую изменяя состояние.
   * @param {Object} entityState - Состояние игрока или врага.
   * @param {number} ticks - Количество прошедших секунд (тиков).
   * @param {string} entityName - Имя сущности для логов ('Игрок' или 'Враг').
   * @returns {Array} - Массив записей для лога боя.
   * @private
   */
  static applyPeriodicEffects(entityState, ticks, entityName = 'Сущность') {
    if (!entityState.effects || entityState.effects.length === 0 || ticks <= 0) {
      return [];
    }

    let totalHealthChange = 0;
    let totalEnergyChange = 0;
    const battleLogEntries = [];
    const modifiers = this._getEffectModifiers(entityState);

    // Применяем эффекты только один раз, как в PvP системе
    if (entityState.currentHp > 0) {
      for (const effect of entityState.effects) {
        let value;
        
        // Определяем тип эффекта, если он не задан
        let effectType = effect.type;
        if (!effectType || effectType === 'undefined') {
          // Определяем тип по названию эффекта
          if (effect.name) {
            const name = effect.name.toLowerCase();
            if (name.includes('накопление') && name.includes('энерги')) {
              effectType = 'energy_gain';
            } else if (name.includes('багряное') && name.includes('пламя')) {
              effectType = 'burn';
            } else if (name.includes('регенерация')) {
              effectType = 'health_regen';
            } else if (name.includes('пламя') || name.includes('огонь') || name.includes('горение')) {
              effectType = 'burn';
            } else if (name.includes('кровотечение') || name.includes('рассечение')) {
              effectType = 'bleed';
            } else if (name.includes('отравление') || name.includes('яд')) {
              effectType = 'poison';
            } else if (name.includes('лечение') || name.includes('исцеление')) {
              effectType = 'heal';
            } else if (name.includes('оглушение') || name.includes('стан')) {
              effectType = 'stun';
            } else if (name.includes('защита') || name.includes('щит')) {
              effectType = 'protect';
            } else if (name.includes('ускорение') || name.includes('скорость')) {
              effectType = 'speed';
            }
          }
        }
        
        // Добавляем отладочные логи для диагностики
        console.log(`[CombatService] Обрабатываем эффект "${effect.name}" типа "${effect.type}" -> "${effectType}":`, {
          damage: effect.damage,
          healing: effect.healing,
          value: effect.value,
          duration: effect.duration
        });
        
        switch (effectType) {
          case 'burn':
          case 'bleed':
          case 'poison':
            // Используем точные значения как в PvP
            if (effect.value && effect.value > 0) {
              value = effect.value;
            } else {
              // Определяем урон по типу эффекта, как в PvP
              switch (effectType) {
                case 'burn':
                  value = 8; // Огненный урон
                  break;
                case 'poison':
                  value = 6; // Урон от яда
                  break;
                case 'bleed':
                  value = 7; // Кровотечение
                  break;
                default:
                  value = 5; // Стандартный урон
              }
            }
            if (value > 0) {
              totalHealthChange -= value;
              battleLogEntries.push({ message: `${entityName} получает ${value} урона от эффекта "${effect.name}".`, timestamp: new Date() });
              console.log(`[CombatService] Применен урон от эффекта "${effect.name}": ${value}`);
            }
            break;

          case 'regenerate':
            // Проверяем, это регенерация здоровья или энергии по названию
            if (effect.name && effect.name.toLowerCase().includes('энерги')) {
              // Для эффектов энергии используем точные значения
              value = effect.value || 5;
              if (value > 0) {
                totalEnergyChange += value;
                battleLogEntries.push({ message: `${entityName} восстанавливает ${value} энергии от эффекта "${effect.name}".`, timestamp: new Date() });
                console.log(`[CombatService] Применена регенерация энергии от эффекта "${effect.name}": ${value}`);
              }
            } else {
              // Для эффектов здоровья используем точные значения
              value = effect.value || 15;
              if (value > 0) {
                totalHealthChange += value;
                battleLogEntries.push({ message: `${entityName} восстанавливает ${value} здоровья от эффекта "${effect.name}".`, timestamp: new Date() });
                console.log(`[CombatService] Применена регенерация здоровья от эффекта "${effect.name}": ${value}`);
              }
            }
            break;
            
          case 'heal':
            // Прямое лечение - используем точные значения
            value = effect.healing || effect.value || 15;
            if (value > 0) {
              totalHealthChange += value;
              battleLogEntries.push({ message: `${entityName} восстанавливает ${value} здоровья от эффекта "${effect.name}".`, timestamp: new Date() });
              console.log(`[CombatService] Применено лечение от эффекта "${effect.name}": ${value}`);
            }
            break;

          case 'health_regen':
            // Новый тип для регенерации здоровья (как в PvP) - используем точные значения
            value = effect.value || 15;
            if (value > 0) {
              totalHealthChange += value;
              battleLogEntries.push({ message: `${entityName} восстанавливает ${value} здоровья от эффекта "${effect.name}".`, timestamp: new Date() });
              console.log(`[CombatService] Применена регенерация здоровья от эффекта "${effect.name}": ${value}`);
            }
            break;

          case 'energy_gain':
            // Новый тип для накопления энергии (как в PvP) - используем точные значения
            value = effect.value || 5;
            if (value > 0) {
              totalEnergyChange += value;
              battleLogEntries.push({ message: `${entityName} восстанавливает ${value} энергии от эффекта "${effect.name}".`, timestamp: new Date() });
              console.log(`[CombatService] Применена регенерация энергии от эффекта "${effect.name}": ${value}`);
            }
            break;

          case 'stun':
            // Оглушение - не применяется в периодических эффектах, только блокирует действия
            console.log(`[CombatService] Эффект оглушения "${effect.name}" активен (не применяется в периодических эффектах)`);
            break;

          case 'protect':
          case 'speed':
          case 'buff':
          case 'debuff':
            // Эти эффекты не применяются периодически, они влияют на модификаторы
            console.log(`[CombatService] Эффект модификатора "${effect.name}" типа "${effectType}" активен`);
            break;

          case 'fire':
          case 'ice':
          case 'lightning':
          case 'damage':
          case 'dot':
            // Альтернативные названия для урона со временем
            value = effect.value || 5;
            if (value > 0) {
              totalHealthChange -= value;
              battleLogEntries.push({ message: `${entityName} получает ${value} урона от эффекта "${effect.name}".`, timestamp: new Date() });
              console.log(`[CombatService] Применен урон от эффекта "${effect.name}": ${value}`);
            }
            break;

          case 'healing':
          case 'regeneration':
            // Альтернативные названия для лечения
            value = effect.value || 15;
            if (value > 0) {
              totalHealthChange += value;
              battleLogEntries.push({ message: `${entityName} восстанавливает ${value} здоровья от эффекта "${effect.name}".`, timestamp: new Date() });
              console.log(`[CombatService] Применено лечение от эффекта "${effect.name}": ${value}`);
            }
            break;

          case 'energy_regen':
          case 'mana_regen':
            // Альтернативные названия для восстановления энергии
            value = effect.value || 5;
            if (value > 0) {
              totalEnergyChange += value;
              battleLogEntries.push({ message: `${entityName} восстанавливает ${value} энергии от эффекта "${effect.name}".`, timestamp: new Date() });
              console.log(`[CombatService] Применена регенерация энергии от эффекта "${effect.name}": ${value}`);
            }
            break;
           
          // Другие периодические эффекты можно добавить сюда
          default:
            console.log(`[CombatService] Неизвестный тип эффекта: "${effectType}" (оригинал: "${effect.type}") для эффекта "${effect.name}"`);
            break;
        }
      }
    }

    if (totalHealthChange !== 0 || totalEnergyChange !== 0) {
      const oldHp = entityState.currentHp;
      const oldEnergy = entityState.currentEnergy;

      entityState.currentHp = Math.max(0, Math.min(entityState.maxHp, oldHp + totalHealthChange));
      entityState.currentEnergy = Math.max(0, Math.min(entityState.maxEnergy, oldEnergy + totalEnergyChange));
      
      console.log(`[CombatService] Периодические эффекты для ${entityName}:`, {
          hpChange: `${oldHp} -> ${entityState.currentHp}`,
          energyChange: `${oldEnergy} -> ${entityState.currentEnergy}`
      });
    }

    return battleLogEntries;
  }

  static updateEffectsDuration(entityState) {
    if (!entityState.effects || entityState.effects.length === 0) {
      return false;
    }
    
    const now = Date.now();
    const initialCount = entityState.effects.length;

    entityState.effects = entityState.effects.filter(effect => {
      if (effect.permanent || !effect.durationMs) return true; // Оставляем постоянные и без времени действия
      const startTime = effect.startTime || new Date(effect.appliedAt).getTime();
      const elapsedMs = now - startTime;
      const isExpired = elapsedMs >= effect.durationMs;
      if (isExpired) {
        console.log(`[CombatService] Эффект "${effect.name}" истек.`);
      }
      return !isExpired;
    });

    return entityState.effects.length !== initialCount;
  }

  static async getCombatState(combatId) {
    const Combat = modelRegistry.getModel('Combat');
    const combat = await Combat.findByPk(combatId);

    if (!combat) {
      throw new Error('Бой не найден');
    }
    
    // Если бой уже завершен, просто возвращаем его состояние
    if (combat.status !== 'active') {
      const finalState = combat.toJSON();
      if (combat.rewards) {
        finalState.rewards = combat.rewards;
      }
      return { success: true, combat: finalState };
    }

    const now = new Date();
    const lastUpdate = new Date(combat.last_updated_at);
    const secondsPassed = Math.floor((now - lastUpdate) / 1000);
    let changed = false;

    if (secondsPassed > 0) {
      const playerLogs = this.applyPeriodicEffects(combat.player_state, secondsPassed, 'Игрок');
      const enemyLogs = this.applyPeriodicEffects(combat.enemy_state, secondsPassed, 'Враг');
      
      if (playerLogs.length > 0 || enemyLogs.length > 0) {
        combat.log.push(...playerLogs, ...enemyLogs);
        changed = true;
      }

      // Обновляем длительность эффектов
      const playerEffectsChanged = this.updateEffectsDuration(combat.player_state);
      const enemyEffectsChanged = this.updateEffectsDuration(combat.enemy_state);

      if (playerEffectsChanged || enemyEffectsChanged) {
        changed = true;
      }

      // Проверяем, не закончился ли бой после применения эффектов
      if (combat.player_state.currentHp <= 0) {
        combat.status = 'completed';
        combat.winner = 'enemy';
        combat.log.push({ message: 'Игрок потерпел поражение от периодических эффектов.', timestamp: new Date() });
        changed = true;
      } else if (combat.enemy_state.currentHp <= 0) {
        combat.status = 'completed';
        combat.winner = 'player';
        combat.log.push({ message: 'Противник повержен периодическими эффектами!', timestamp: new Date() });
        const rewards = await this._processRewards(combat, combat.user_id);
        combat.rewards = rewards;
        changed = true;
      }

      // Обновляем время последнего действия и сохраняем, если были изменения
      if (changed) {
        combat.last_updated_at = now;
        combat.changed('player_state', true);
        combat.changed('enemy_state', true);
        combat.changed('log', true);
        await combat.save();
      }
    }

    const finalCombatState = combat.toJSON();
    if (combat.rewards) {
      finalCombatState.rewards = combat.rewards;
    }
    return { success: true, combat: finalCombatState };
  }
  /**
   * Обработка и начисление наград игроку после победы
   * @param {Object} combat - Экземпляр боя
   * @param {number} userId - ID игрока
   * @returns {Promise<Object>} - Объект с информацией о полученных наградах
   * @private
   */
  static async _processRewards(combat, userId) {
    // Проверка квестов на убийство врага
    const completedDefeatEnemyQuests = await QuestService.checkQuestEvent(userId, 'DEFEAT_ENEMY', { enemyId: combat.enemy_id, amount: 1 });
    for (const questId of completedDefeatEnemyQuests) {
      await QuestService.completeQuest(userId, questId);
    }
    const completedDefeatAnyEnemyQuests = await QuestService.checkQuestEvent(userId, 'DEFEAT_ANY_ENEMY', { amount: 1 });
    for (const questId of completedDefeatAnyEnemyQuests) {
      await QuestService.completeQuest(userId, questId);
    }
    
    const sequelize = await getSequelizeInstance();
    const CharacterProfile = modelRegistry.getModel('CharacterProfile');
    const Enemy = modelRegistry.getModel('Enemy');

    const rewards = {
      currency: {},
      items: [],
      experience: 0
    };

    // --- 1. Начисление предметов ---
    const getWeightedRandomItem = (items) => {
      const rarityWeights = {
        common: 100,
        uncommon: 50,
        rare: 20,
        epic: 5,
        legendary: 1
      };

      const totalWeight = items.reduce((sum, item) => sum + (rarityWeights[item.rarity] || 0.1), 0);
      let random = Math.random() * totalWeight;

      for (const item of items) {
        const weight = rarityWeights[item.rarity] || 0.1;
        if (random < weight) {
          return item;
        }
        random -= weight;
      }
      return null; // На случай, если что-то пойдет не так
    };

    const itemQuery = `
      SELECT item_id, name, rarity, type, description
      FROM item_catalog
      WHERE (type = 'resource' OR type = 'artifact')
        AND item_id NOT LIKE '%pvp_reward%';
    `;
    
    const possibleItems = await sequelize.query(itemQuery, { type: QueryTypes.SELECT });
    const item = getWeightedRandomItem(possibleItems);

    if (item) {
      const quantity = Math.floor(Math.random() * 3) + 1;
      // Используем InventoryService для добавления предмета
      await InventoryService.addInventoryItem(userId, {
        id: item.item_id,
        name: item.name,
        description: item.description,
        type: item.type,
        rarity: item.rarity,
        quantity: quantity
      });
      rewards.items.push({ ...item, quantity, icon: '❓' }); // Иконку пока не берем
      console.log(`[CombatService] Игроку ${userId} выпал предмет: ${item.name} x${quantity}.`);
    }

    // --- 2. Начисление валюты ---
    const currencyRoll = Math.random() * 100;
    const profile = await CharacterProfile.findOne({ where: { userId } });

    if (profile) {
      let currencyType = null;
      let amount = 0;

      if (currencyRoll < 10) { // 10% шанс на золото
        currencyType = 'gold';
        amount = Math.floor(Math.random() * 5) + 1; // 1-5 золота
      } else if (currencyRoll < 40) { // 30% шанс на серебро
        currencyType = 'silver';
        amount = Math.floor(Math.random() * 50) + 10; // 10-60 серебра
      } else { // 60% шанс на медь
        currencyType = 'copper';
        amount = Math.floor(Math.random() * 200) + 50; // 50-250 меди
      }
      
      if (amount > 0) {
        profile[currencyType] += amount;
        await profile.save();
        rewards.currency = { type: currencyType, amount };
        console.log(`[CombatService] Игроку ${userId} начислено ${amount} ${currencyType}.`);
      }
    }

    // --- 3. Начисление опыта ---
    const enemy = await Enemy.findByPk(combat.enemy_id);
    if (enemy && enemy.experience > 0) {
      const CultivationProgress = modelRegistry.getModel('CultivationProgress');
      const [affectedRows] = await CultivationProgress.update(
        { experience: sequelize.literal(`experience + ${enemy.experience}`) },
        { where: { userId: userId } }
      );

      if (affectedRows > 0) {
        rewards.experience = enemy.experience;
        console.log(`[CombatService] Игроку ${userId} начислено ${enemy.experience} опыта.`);
      } else {
        console.error(`[CombatService] Не удалось обновить опыт для пользователя ${userId}. Запись CultivationProgress не найдена.`);
      }
    }

    return rewards;
  }

  /**
   * Получает текущий статус боя пользователя
   * @param {number} userId - ID пользователя
   * @returns {Object} - Статус боя пользователя
   */
  static async getUserCombatStatus(userId) {
    try {
      const Combat = modelRegistry.getModel('Combat');
      
      // Ищем активный бой пользователя
      const activeCombat = await Combat.findOne({
        where: {
          user_id: userId,
          status: 'active'
        },
        order: [['created_at', 'DESC']]
      });

      if (activeCombat) {
        return {
          success: true,
          inCombat: true,
          combatId: activeCombat.id,
          combat: activeCombat.toJSON()
        };
      }

      return {
        success: true,
        inCombat: false
      };
    } catch (error) {
      console.error('[CombatService] Ошибка при получении статуса боя пользователя:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Принудительно завершить бой с поражением игрока
   * @param {number} combatId - ID боя
   * @param {number} userId - ID игрока
   * @returns {Object} - Результат операции
   */
  static async forfeitCombat(combatId, userId) {
    try {
      const Combat = modelRegistry.getModel('Combat');
      const combat = await Combat.findByPk(combatId);

      if (!combat) {
        return {
          success: false,
          message: 'Бой не найден'
        };
      }

      if (combat.user_id !== userId) {
        return {
          success: false,
          message: 'Доступ запрещен - это не ваш бой'
        };
      }

      if (combat.status !== 'active') {
        return {
          success: false,
          message: 'Бой уже завершен'
        };
      }

      // Завершаем бой с поражением игрока
      combat.status = 'completed';
      combat.winner = 'enemy';
      
      // Добавляем запись в лог
      const currentLog = combat.log || [];
      currentLog.push({
        message: 'Игрок сдался и покинул бой.',
        timestamp: new Date(),
        type: 'forfeit'
      });
      combat.log = currentLog;

      // Помечаем поля как измененные для Sequelize
      combat.changed('log', true);
      await combat.save();

      console.log(`[CombatService] Игрок ${userId} сдался в бою ${combatId}`);

      return {
        success: true,
        message: 'Бой завершен. Вы сдались.',
        combat: combat.toJSON()
      };

    } catch (error) {
      console.error('[CombatService] Ошибка при сдаче боя:', error);
      return {
        success: false,
        message: `Ошибка при завершении боя: ${error.message}`
      };
    }
  }
}

module.exports = CombatService;