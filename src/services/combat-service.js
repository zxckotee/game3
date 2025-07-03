/**
 * Combat Service - сервис для управления боями с NPC (PvE)
 */
const modelRegistry = require('../models/registry');
const { Op, QueryTypes } = require('sequelize');
const { unifiedDatabase, initializeDatabaseConnection } = require('./database-connection-manager');
const { Sequelize } = require('sequelize');
const techniqueService = require('./technique-service');

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
   * Рассчитывает боевые характеристики игрока на основе его статов.
   * @param {Object} characterStats - Объект характеристик персонажа из БД.
   * @returns {Object} - Объект с рассчитанными боевыми характеристиками.
   * @private
   */
  static _calculatePlayerStats(characterStats) {
    const stats = characterStats.dataValues ? characterStats.dataValues : characterStats;

    // Формулы, аналогичные pvp-service
    const baseHealth = stats.health || 100;
    const strength = stats.strength || 10;
    const intellect = stats.intellect || 10;

    const maxHealth = baseHealth + (strength * 10);
    const maxEnergy = 100 + (intellect * 5); // Предположим базовую энергию 100

    return {
      maxHp: maxHealth,
      currentHp: maxHealth,
      maxEnergy: maxEnergy,
      currentEnergy: maxEnergy,
    };
  }

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

    // Рассчитываем характеристики игрока
    const calculatedPlayerStats = this._calculatePlayerStats(player.characterStats);
    const Combat = modelRegistry.getModel('Combat');

    // Получаем изученные техники игрока
    const learnedTechniques = await techniqueService.getLearnedTechniques(userId);

    const playerState = {
      currentHp: calculatedPlayerStats.currentHp,
      maxHp: calculatedPlayerStats.maxHp,
      currentEnergy: calculatedPlayerStats.currentEnergy,
      maxEnergy: calculatedPlayerStats.maxEnergy,
      effects: [],
      techniques: learnedTechniques || [] // Добавляем техники в состояние
    };

    const enemyState = {
      currentHp: enemy.stats.health,
      maxHp: enemy.stats.health,
      currentEnergy: enemy.stats.energy,
      maxEnergy: enemy.stats.energy,
      effects: []
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
      logEntry = { turn: 'player', action: 'attack', ...attackResult, message };
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
      logEntry = { turn: 'player', action: 'defense', message: 'Игрок уходит в глухую оборону.' };
      console.log(`[CombatService] Игрок применил защиту в бою ${combatId}`);

    } else if (action.type === 'technique') {
      const technique = combat.player_state.techniques.find(t => t.id === action.id);
      if (!technique) {
        throw new Error('Игрок не знает такую технику');
      }
      console.log('[COMBAT_DEBUG] 3. Используется техника:', JSON.stringify(technique, null, 2));

      // Расчет стоимости энергии с учетом модификаторов
      const modifiers = this._getEffectModifiers(combat.player_state);
      let energyCost = technique.energy_cost || 0;

      if (modifiers.energyCostModifier) {
        energyCost = Math.floor(energyCost * (1 - modifiers.energyCostModifier / 100));
      }
      if (modifiers.isFree) {
        energyCost = 0;
      }

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
      }

      // Применяем прямой урон (только для атакующих техник)
      if (isAttack && technique.damage > 0) {
        console.log(`[COMBAT_DEBUG] 6. Техника имеет прямой урон: ${technique.damage}. Наносим...`);
        const attackResult = this._calculateDamage(combat.player_state, combat.enemy_state, technique.damage);
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

      logEntry = { turn: 'player', action: 'technique', message };

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
      combat.log.push({ message: 'Игрок потерпел поражение.' });
    } else if (combat.enemy_state.currentHp <= 0) {
      combat.status = 'completed';
      combat.winner = 'player';
      combat.log.push({ message: 'Противник повержен!' });
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

    const newEffects = technique.effects.map(dbEffect => {
      console.log('[COMBAT_DEBUG] 1. Исходный эффект из БД:', JSON.stringify(dbEffect, null, 2));

      const newEffect = {
        ...dbEffect, // Копируем все поля изначального эффекта
        id: `${dbEffect.id}_${Date.now()}`, // Уникальный ID для каждого экземпляра эффекта
        startTime: Date.now(),
        durationMs: (dbEffect.duration || 0) * 1000,
        sourceTechnique: technique.id,
        // Трансляция полей для совместимости
        value: 0,
        subtype: dbEffect.type, // По умолчанию subtype равен type
      };

      // Определяем subtype и value на основе типа эффекта
      if (['burn', 'bleed', 'poison'].includes(dbEffect.type)) {
        newEffect.subtype = 'dot'; // Damage Over Time
        newEffect.value = dbEffect.damage || 0;
      } else if (dbEffect.type === 'regenerate') {
        newEffect.subtype = 'hot'; // Heal Over Time
        newEffect.value = dbEffect.healing || 0;
      } else if (dbEffect.type === 'stun' || dbEffect.type === 'silence' || dbEffect.type === 'root') {
        newEffect.subtype = dbEffect.type; // Статусные эффекты
      } else if (dbEffect.type === 'buff' || dbEffect.type === 'debuff') {
        // Для баффов/дебаффов value может не использоваться, важны modifiers
        newEffect.subtype = dbEffect.modifiers ? 'modifier' : dbEffect.type;
      }
      
      console.log('[COMBAT_DEBUG] 2. Преобразованный эффект для добавления:', JSON.stringify(newEffect, null, 2));
      return newEffect;
    });

    targetState.effects = this.mergeEffects(targetState.effects || [], newEffects);
  }

  /**
   * Объединяет новые эффекты с существующими, обрабатывая стаки.
   * @param {Array} currentEffects - Текущие эффекты на цели.
   * @param {Array} newEffects - Новые эффекты для добавления.
   * @returns {Array} - Обновленный массив эффектов.
   */
  static mergeEffects(currentEffects, newEffects) {
    const result = [...currentEffects];

    newEffects.forEach(newEffect => {
      const existingEffectIndex = result.findIndex(e => e.name === newEffect.name);

      if (existingEffectIndex !== -1) {
        const existingEffect = result[existingEffectIndex];
        // Обновляем существующий эффект (например, обновляем время действия)
        result[existingEffectIndex] = {
          ...existingEffect,
          ...newEffect, // Новый эффект перезаписывает старый, но сохраняет некоторые свойства
          startTime: newEffect.startTime, // Всегда обновляем время начала
          durationMs: Math.max(existingEffect.durationMs - (Date.now() - existingEffect.startTime), 0) + newEffect.durationMs,
        };
      } else {
        // Добавляем новый эффект
        result.push(newEffect);
      }
    });

    return result;
  }

  /**
   * Получает модификаторы от активных эффектов.
   * @param {Object} entityState - Состояние игрока или врага.
   * @returns {Object} - Объект с модификаторами.
   * @private
   */
  static _getEffectModifiers(entityState) {
    const modifiers = {
        damageModifier: 0,
        defenseModifier: 0,
        critChanceModifier: 0,
        critDamageModifier: 0,
        dodgeChanceModifier: 0,
        accuracyModifier: 0,
        energyCostModifier: 0,
        healingModifier: 0,
        dotModifier: 0,
        isFree: false,
        stun: false,
        silence: false,
        root: false,
    };

    if (!entityState.effects || entityState.effects.length === 0) {
        return modifiers;
    }

    for (const effect of entityState.effects) {
        if (!effect.modifiers) continue;

        // Простой парсер для модификаторов вида "damage_increase_10"
        const parts = effect.modifiers.split('_');
        if (parts.length < 3) continue;

        const [target, type, valueStr] = parts;
        const value = parseInt(valueStr, 10);

        if (isNaN(value)) continue;

        switch (target) {
            case 'damage':
                if (type === 'increase') modifiers.damageModifier += value;
                if (type === 'decrease') modifiers.damageModifier -= value;
                break;
            case 'defense':
                if (type === 'increase') modifiers.defenseModifier += value;
                if (type === 'decrease') modifiers.defenseModifier -= value;
                break;
            case 'critchance':
                if (type === 'increase') modifiers.critChanceModifier += value;
                break;
            case 'critdamage':
                if (type === 'increase') modifiers.critDamageModifier += value;
                break;
            case 'dodge':
                if (type === 'increase') modifiers.dodgeChanceModifier += value;
                break;
            case 'accuracy':
                if (type === 'increase') modifiers.accuracyModifier += value;
                break;
            case 'energy':
                if (type === 'cost_reduction') modifiers.energyCostModifier += value;
                break;
            case 'healing':
                if (type === 'increase') modifiers.healingModifier += value;
                break;
            case 'dot': // damage over time
                if (type === 'increase') modifiers.dotModifier += value;
                break;
        }

        // Проверка на статусные эффекты
        if (effect.subtype === 'stun') modifiers.stun = true;
        if (effect.subtype === 'silence') modifiers.silence = true;
        if (effect.subtype === 'root') modifiers.root = true;
    }

    return modifiers;
  }

  /**
   * @private
   */
  static _calculateDamage(attackerState, defenderState, baseDamage = null) {
    // Базовые статы, если они не определены
    const attackerStats = {
        strength: attackerState.strength || 10,
        intellect: attackerState.intellect || 10,
        level: attackerState.level || 1,
    };
    const defenderStats = {
        vitality: defenderState.vitality || 10,
        level: defenderState.level || 1,
    };

    const attackerModifiers = this._getEffectModifiers(attackerState);
    const defenderModifiers = this._getEffectModifiers(defenderState);

    // Если базовый урон не передан (обычная атака), рассчитываем его от силы.
    // Если передан (атака от техники), используем его.
    let finalBaseDamage = baseDamage !== null ? baseDamage : (attackerStats.strength || 10) * 2;

    // 1. Модификаторы урона атакующего
    const damageBonusPercent = attackerModifiers.damageModifier;
    finalBaseDamage *= (1 + damageBonusPercent / 100);

    // 2. Модификаторы защиты защищающегося
    const defenseBonusPercent = defenderModifiers.defenseModifier;
    const defenseReduction = (defenderStats.vitality || 10) * 0.5; // Базовая защита от живучести
    const totalDefense = defenseReduction * (1 + defenseBonusPercent / 100);

    let finalDamage = Math.max(1, finalBaseDamage - totalDefense);

    // 3. Шанс уклонения
    const dodgeChance = (defenderModifiers.dodgeChanceModifier || 0) / 100;
    if (Math.random() < dodgeChance) {
        console.log('[CombatService] Уклонение!');
        return { damage: 0, isDodge: true, isCrit: false };
    }

    // 4. Крит. урон
    let isCrit = false;
    const critChance = ((attackerStats.intellect || 10) * 0.01) + (attackerModifiers.critChanceModifier / 100);
    if (Math.random() < critChance) {
        isCrit = true;
        const critDamageBonus = 1.5 + (attackerModifiers.critDamageModifier / 100);
        finalDamage *= critDamageBonus;
        console.log(`[CombatService] Критический удар! Множитель: ${critDamageBonus}`);
    }
    
    finalDamage = Math.round(finalDamage);

    console.log(`[CombatService] Расчет урона: База=${finalBaseDamage.toFixed(2)}, Защита=${totalDefense.toFixed(2)}, Итог=${finalDamage}`);

    return { damage: finalDamage, isCrit, isDodge: false };
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
    
    const logEntry = { turn: 'enemy', action: 'attack', ...attackResult, message };
    console.log(`[CombatService] Противник атаковал в бою ${combat.id}. Результат:`, attackResult);
    return logEntry;
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
      return []; // Возвращаем пустой массив логов, если нет эффектов
    }

    let totalHealthChange = 0;
    let totalEnergyChange = 0;
    const battleLogEntries = [];
    const modifiers = this._getEffectModifiers(entityState);

    for (let i = 0; i < ticks; i++) {
      if (entityState.currentHp <= 0) break; // Не применяем эффекты, если цель уже повержена

      for (const effect of entityState.effects) {
        // Эффекты периодического урона (DoT)
        if (effect.subtype === 'dot' || (effect.modifiers && effect.modifiers.includes('dot'))) {
          let dotDamage = effect.value || 5;
          dotDamage *= (1 + modifiers.dotModifier / 100); // Учитываем модификаторы
          totalHealthChange -= Math.round(dotDamage);
          battleLogEntries.push({ message: `${entityName} получает ${Math.round(dotDamage)} урона от эффекта "${effect.name}".` });
        }
        // Эффекты периодического лечения (HoT)
        if (effect.subtype === 'hot' || (effect.modifiers && effect.modifiers.includes('healing'))) {
          let hotHealing = effect.value || 5;
          hotHealing *= (1 + modifiers.healingModifier / 100); // Учитываем модификаторы
          totalHealthChange += Math.round(hotHealing);
          battleLogEntries.push({ message: `${entityName} восстанавливает ${Math.round(hotHealing)} здоровья от эффекта "${effect.name}".` });
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

    return battleLogEntries; // Возвращаем только логи для записи в историю боя
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
        combat.log.push({ message: 'Игрок потерпел поражение от периодических эффектов.' });
        changed = true;
      } else if (combat.enemy_state.currentHp <= 0) {
        combat.status = 'completed';
        combat.winner = 'player';
        combat.log.push({ message: 'Противник повержен периодическими эффектами!' });
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
    const sequelize = await getSequelizeInstance();
    const CharacterProfile = modelRegistry.getModel('CharacterProfile');
    const InventoryItem = modelRegistry.getModel('InventoryItem');
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
      const existingItem = await InventoryItem.findOne({ where: { userId, itemId: item.item_id } });

      if (existingItem) {
        existingItem.quantity += quantity;
        await existingItem.save();
      } else {
        await InventoryItem.create({
          userId,
          itemId: item.item_id,
          name: item.name,
          description: item.description,
          type: item.type,
          rarity: item.rarity,
          quantity: quantity
        });
      }
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
}

module.exports = CombatService;