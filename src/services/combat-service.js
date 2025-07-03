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

    // Обновляем длительность эффектов перед каждым действием
    await this.updateEffectsDuration(combat);

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
      const damage = this._calculateDamage(combat.player_state, combat.enemy_state);
      combat.enemy_state.currentHp = Math.max(0, combat.enemy_state.currentHp - damage);
      logEntry = { turn: 'player', action: 'attack', damage, message: `Игрок наносит ${damage} урона.` };
      console.log(`[CombatService] Игрок нанес ${damage} урона в бою ${combatId}`);
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

      const energyCost = technique.energy_cost || 0;
      if (combat.player_state.currentEnergy < energyCost) {
        throw new Error('Недостаточно энергии для применения техники');
      }

      combat.player_state.currentEnergy -= energyCost;
      let message = `Игрок использует технику "${technique.name}".`;

      // Применяем урон
      if (technique.damage > 0) {
        const damage = technique.damage; // В будущем можно добавить модификаторы
        combat.enemy_state.currentHp = Math.max(0, combat.enemy_state.currentHp - damage);
        message += ` Наносит ${damage} урона.`;
        console.log(`[CombatService] Игрок нанес ${damage} урона техникой "${technique.name}" в бою ${combatId}`);
      }

      // Применяем исцеление
      if (technique.healing > 0) {
        const healing = technique.healing; // В будущем можно добавить модификаторы
        combat.player_state.currentHp = Math.min(combat.player_state.maxHp, combat.player_state.currentHp + healing);
        message += ` Восстанавливает ${healing} здоровья.`;
        console.log(`[CombatService] Игрок восстановил ${healing} здоровья техникой "${technique.name}" в бою ${combatId}`);
      }
      
      // Применяем эффекты
      if (technique.effects && technique.effects.length > 0) {
        // Определяем цель для эффектов в зависимости от типа техники
        const targetState = technique.type === 'attack' ? combat.enemy_state : combat.player_state;
        const targetName = technique.type === 'attack' ? 'врага' : 'себя';
        this._applyTechniqueEffects(technique, targetState);
        message += ` Накладывает эффекты на ${targetName}.`;
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

    const newEffects = technique.effects.map(effect => ({
      ...effect,
      id: `${effect.id}_${Date.now()}`, // Уникальный ID для каждого экземпляра эффекта
      startTime: Date.now(),
      durationMs: (effect.duration || 0) * 1000,
      sourceTechnique: technique.id,
    }));

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
   * @private
   */
  static _calculateDamage(attackerState, defenderState) {
    // Упрощенная формула урона для примера
    const baseDamage = 10;
    const damage = Math.max(1, baseDamage + Math.floor(Math.random() * 5));
    return damage;
  }

  /**
   * @private
   */
  static _performEnemyTurn(combat) {
    const damage = this._calculateDamage(combat.enemy_state, combat.player_state);
    combat.player_state.currentHp = Math.max(0, combat.player_state.currentHp - damage);
    const logEntry = { turn: 'enemy', action: 'attack', damage, message: `Противник наносит ${damage} урона.` };
    console.log(`[CombatService] Противник нанес ${damage} урона в бою ${combat.id}`);
    return logEntry;
  }

  /**
   * Обновление длительности эффектов
   * @param {Object} combat - Экземпляр боя
   */
  static async updateEffectsDuration(combat) {
    const playerState = combat.player_state;
    const enemyState = combat.enemy_state;

    const now = Date.now();
    let changed = false;

    // Обновление эффектов игрока
    if (playerState.effects && playerState.effects.length > 0) {
      const initialCount = playerState.effects.length;
      playerState.effects = playerState.effects.filter(effect => {
        if (effect.permanent) return true;
        const startTime = effect.startTime || new Date(effect.appliedAt).getTime();
        const elapsedMs = now - startTime;
        return elapsedMs < effect.durationMs;
      });
      if (playerState.effects.length !== initialCount) {
        changed = true;
        console.log(`[CombatService] Эффекты игрока обновлены. Было: ${initialCount}, стало: ${playerState.effects.length}`);
      }
    }

    // Обновление эффектов противника
    if (enemyState.effects && enemyState.effects.length > 0) {
      const initialCount = enemyState.effects.length;
      enemyState.effects = enemyState.effects.filter(effect => {
        if (effect.permanent) return true;
        const startTime = effect.startTime || new Date(effect.appliedAt).getTime();
        const elapsedMs = now - startTime;
        return elapsedMs < effect.durationMs;
      });
      if (enemyState.effects.length !== initialCount) {
        changed = true;
        console.log(`[CombatService] Эффекты противника обновлены. Было: ${initialCount}, стало: ${enemyState.effects.length}`);
      }
    }

    if (changed) {
      combat.changed('player_state', true);
      combat.changed('enemy_state', true);
    }
  }

  /**
   * Получение актуального состояния боя
   * @param {number} combatId - ID боя
   * @param {number} userId - ID игрока
   * @returns {Object} - Актуальное состояние боя
   */
  static async getCombatState(combatId) {
    const Combat = modelRegistry.getModel('Combat');
    const combat = await Combat.findByPk(combatId);

    if (!combat) {
      throw new Error('Бой не найден');
    }

    // Обновляем длительность эффектов перед отправкой состояния клиенту
    await this.updateEffectsDuration(combat);

    await combat.save();

    return { success: true, combat: combat.toJSON() };
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