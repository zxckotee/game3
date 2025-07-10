/**
 * PvP Service - сервис для работы с PvP-системой
 */
const modelRegistry = require('../models/registry');
const { Op } = require('sequelize');
const { targetTypes, damageTypes, statusEffects } = require('../data/combat');
const EffectTypes = require('../constants/effectTypes');
const QuestService = require('./quest-service');
const InventoryService = require('./inventory-service');
const PvpStatsService = require('./pvp-stats-service');

/**
 * Класс для работы с PvP-системой
 */
class PvPService {
  /**
   * Обновление длительности эффектов
   * @param {Object} participant - Участник боя
   * @param {Object} transaction - Транзакция Sequelize
   * @returns {Object} Объект с информацией об истекших эффектах и результатах
   */
  static async updateEffectsDuration(participant, transaction, shouldDecrementTurns = false) {
    if (!participant.effects || !Array.isArray(participant.effects)) {
      return { expired: [], statusChanged: false, updated: [] };
    }
    
    const expiredEffects = [];
    const updatedEffects = [];
    const effectChanges = [];
    let statusChanged = false;
    
    console.log(`[PvP] Обновление длительности эффектов для участника ${participant.id} (${participant.username || 'Unknown'}). Всего эффектов: ${participant.effects.length}`);
    
    // Группируем эффекты по типу продолжительности для удобства обработки
    const effectsByDurationType = {
      timeBased: [], // Эффекты, основанные на реальном времени
      permanent: []  // Постоянные эффекты
    };
    
    // Классифицируем эффекты и конвертируем все эффекты на основе ходов в эффекты на основе времени
    for (const effect of participant.effects) {
      if (effect.permanent || effect.duration === -1) {
        effectsByDurationType.permanent.push(effect);
      } else if (effect.durationMs) {
        effectsByDurationType.timeBased.push(effect);
      } else if (effect.duration !== undefined && effect.duration !== null) {
        // Улучшенная проверка: проверяем, что duration существует и не равно null
        console.log(`[PvP] Найдено свойство duration: ${effect.duration} для эффекта "${effect.name}"`);
        
        // Конвертируем эффекты на основе ходов в эффекты на основе времени
        // Конвертируем секунды из БД в миллисекунды
        effect.durationMs = effect.duration * 1000;
        effect.startTime = effect.startTime || Date.now();
        effect.durationType = 'time';
        
        // Удаляем свойства системы ходов
        // НЕ удаляем duration, чтобы сохранить эту информацию для восстановления durationMs при необходимости
        // delete effect.duration;
        delete effect.elapsedTurns;
        delete effect.remainingTurns;
        
        console.log(`[PvP] Эффект на основе ходов "${effect.name}" преобразован в эффект на основе времени: ${effect.durationMs}ms`);
        
        effectsByDurationType.timeBased.push(effect);
      } else {
        // Если тип длительности не указан, используем значения по умолчанию для известных эффектов
        
        // Определяем длительность по умолчанию в зависимости от эффекта
        let defaultDuration = 3; // Стандартное значение - 3 секунды
        
        // Здесь можно добавить известные значения длительности для конкретных эффектов из БД
        if (effect.name === 'Накопление энергии') {
          defaultDuration = 7; // Известное значение из БД - 7 секунд
          console.log(`[PvP] Установлено значение длительности из БД для эффекта "Накопление энергии": ${defaultDuration} сек.`);
        }
        
        // Устанавливаем значения
        effect.duration = defaultDuration; // Сохраняем duration
        effect.durationMs = defaultDuration * 1000;
        effect.startTime = Date.now();
        effect.durationType = 'time';
        
        console.log(`[PvP] Эффект без указанной длительности "${effect.name}" установлен как эффект на основе времени: ${effect.durationMs}ms (${defaultDuration} сек.)`);
        
        effectsByDurationType.timeBased.push(effect);
      }
    }
    
    console.log(`[PvP] Классификация эффектов участника ${participant.id}:`, {
      timeBased: effectsByDurationType.timeBased.length,
      permanent: effectsByDurationType.permanent.length
    });
    
    // Обрабатываем эффекты, основанные на реальном времени
    const now = Date.now();
    
    for (const effect of effectsByDurationType.timeBased) {
      const startTime = effect.startTime || new Date(effect.appliedAt || now).getTime();
      const elapsedMs = now - startTime;
      const remainingMs = Math.max(0, effect.durationMs - elapsedMs);
      const isExpired = elapsedMs >= effect.durationMs;
      
      // Добавляем информацию о продолжительности для клиентской стороны
      effect.remainingMs = remainingMs;
      // Защита от деления на ноль при расчете процента
      effect.remainingPercent = effect.durationMs > 0 ? Math.floor((remainingMs / effect.durationMs) * 100) : 0;
      effect.remainingSeconds = Math.ceil(remainingMs / 1000);
      effect.lastUpdated = new Date().toISOString();
      
      console.log(`[PvP] Эффект на основе времени: ${effect.name || effect.id} (${effect.type || 'нет'}/${effect.subtype || 'общий'}) - осталось: ${effect.remainingSeconds}с (${effect.remainingPercent}%) [ID: ${effect.id}]`);
      
      effectChanges.push({
        id: effect.id,
        name: effect.name,
        type: 'time_based',
        remaining: effect.remainingSeconds,
        duration: Math.ceil(effect.durationMs / 1000),
        percent: effect.remainingPercent
      });
      
      if (isExpired) {
        expiredEffects.push(effect);
        console.log(`[PvP] Эффект истек: ${effect.name || effect.id}`);
      } else {
        updatedEffects.push(effect);
      }
    }
    
    // Добавляем постоянные эффекты без изменений
    for (const effect of effectsByDurationType.permanent) {
      effect.permanent = true;
      effect.remainingPercent = 100; // Для постоянных эффектов всегда 100%
      updatedEffects.push(effect);
      
      effectChanges.push({
        id: effect.id,
        name: effect.name,
        type: 'permanent',
        percent: 100
      });
    }
    
    // Группируем истекшие эффекты по типам для улучшенного логирования
    const expiredByType = {};
    for (const effect of expiredEffects) {
      const type = effect.subtype || effect.type || 'unknown';
      expiredByType[type] = (expiredByType[type] || 0) + 1;
    }
    
    // Проверяем статусные изменения (оглушение, замедление и т.д.)
    const statusEffects = ['stun', 'silence', 'root', 'sleep'];
    for (const statusType of statusEffects) {
      const hadStatus = participant.effects.some(e => e.subtype === statusType);
      const stillHasStatus = updatedEffects.some(e => e.subtype === statusType);
      
      if (hadStatus && !stillHasStatus) {
        statusChanged = true;
        console.log(`[PvP] У участника ${participant.id} закончился эффект ${statusType}`);
      }
    }
    
    // Обновляем список эффектов участника
    participant.effects = updatedEffects;
    
    // Детальное логирование истекших эффектов
    if (Object.keys(expiredByType).length > 0) {
      console.log(`[PvP] Истекшие эффекты для участника ${participant.id} по типам:`, expiredByType);
    }
    
    // ВСЕГДА сохраняем изменения, даже если не было истекших эффектов!
    // Это гарантирует обновление времени и счетчиков в БД
    console.log(`[PvP] Обновлены эффекты для участника ${participant.id}: удалено ${expiredEffects.length}, осталось ${updatedEffects.length}`);
    
    await participant.update({
      effects: updatedEffects,
      effects_changes: effectChanges // Сохраняем изменения для клиентской стороны
    }, { transaction });
    
    return { expired: expiredEffects, statusChanged };
  }
  
  /**
   * Применение периодических эффектов
   * @param {Object} participant - Участник боя
   * @param {Object} transaction - Транзакция Sequelize
   * @returns {Array} Массив результатов применения эффектов
   */
  static async applyPeriodicEffects(participant, transaction) {
    if (!participant.effects || !Array.isArray(participant.effects)) {
      return [];
    }
    
    const results = [];
    let totalHealthChange = 0;
    let totalEnergyChange = 0;
    
    console.log(`[PvP] Применение периодических эффектов для участника ${participant.id} (${participant.username || 'Unknown'}). Всего эффектов: ${participant.effects.length}`);
    
    // Создаем классификацию эффектов для более эффективной обработки
    const periodicEffects = {
      healing: [], // Эффекты восстановления здоровья
      energyRegen: [], // Эффекты восстановления энергии
      damageOverTime: [], // Эффекты периодического урона
      statModifiers: [] // Эффекты, модифицирующие параметры
    };
    
    // Классифицируем все эффекты
    for (const effect of participant.effects) {
      // Более детальное логирование для отладки
      console.log(`[PvP] Детальный анализ эффекта:`, {
        id: effect.id,
        name: effect.name,
        type: effect.type,
        subtype: effect.subtype,
        value: effect.value,
        duration: effect.duration,
        modifiers: effect.modifiers,
        appliedAt: effect.appliedAt
      });
      
      // Добавляем подтипы И ИЗМЕНЯЕМ ТИПЫ эффектов, если необходимо
      if (effect.name) {
        if (effect.name === 'Регенерация') {
          // Изменяем базовый тип для Регенерации
          effect.type = 'health_regen';
          effect.subtype = 'healing';
          console.log(`[PvP] Изменен тип и добавлен подтип для эффекта "Регенерация": тип=${effect.type}, подтип=${effect.subtype}`);
        } else if (effect.name === 'Накопление энергии') {
          // Изменяем базовый тип для Накопления энергии
          effect.type = 'energy_gain';
          effect.subtype = 'energy_gain';
          console.log(`[PvP] Изменен тип и добавлен подтип для эффекта "Накопление энергии": тип=${effect.type}, подтип=${effect.subtype}`);
        } else if (effect.name === 'Концентрация') {
          effect.subtype = 'energy_regen';
          console.log(`[PvP] Добавлен подтип 'energy_regen' для эффекта "Концентрация"`);
        } else if (effect.name === 'Защита') {
          effect.subtype = 'protection';
          console.log(`[PvP] Добавлен подтип 'protection' для эффекта "Защита"`);
        } else if (effect.name === 'Ускорение') {
          effect.subtype = 'speed';
          console.log(`[PvP] Добавлен подтип 'speed' для эффекта "Ускорение"`);
        } else if (effect.name === 'Отравление') {
          effect.subtype = 'dot';
          console.log(`[PvP] Добавлен подтип 'dot' для эффекта "Отравление"`);
        }
      }
      
      // ВКЛЮЧАЕМ ЭФФЕКТ "НАКОПЛЕНИЕ ЭНЕРГИИ" в периодические эффекты
      // (теперь он работает на основе времени, а не ходов)
      if (effect.name && effect.name === 'Накопление энергии') {
        console.log(`[PvP] Эффект "Накопление энергии" (subtype: ${effect.subtype || 'energy_gain'}) добавлен в периодические эффекты энергии`);
        // Убедимся, что подтип правильно установлен
        effect.subtype = 'energy_regen';
        periodicEffects.energyRegen.push(effect);
        continue; // Переходим к следующему эффекту после добавления
      }
      
      // Проверяем строку модификаторов для уточнения типа эффекта
      if (effect.modifiers) {
        // Пропускаем эффекты с модификатором "по названию и типу" (эффекты накопления энергии)
        if (effect.modifiers.includes('по названию и типу')) {
          console.log(`[PvP] Эффект ${effect.name || effect.id} с модификатором "${effect.modifiers}" пропущен (будет обработан при действиях)`);
          continue; // Переходим к следующему эффекту
        } else if (effect.modifiers.includes('по типу regenerate')) {
          if (effect.name && effect.name.includes('Регенерация')) {
            periodicEffects.healing.push(effect);
            console.log(`[PvP] Эффект ${effect.name} классифицирован как healing по modifiers: "${effect.modifiers}"`);
          } else {
            // Только если не содержит "накопление энергии" в названии
            if (!(effect.name && effect.name.toLowerCase().includes('накопление энергии'))) {
              periodicEffects.healing.push(effect);
              console.log(`[PvP] Эффект ${effect.name || effect.id} классифицирован как healing по modifiers: "${effect.modifiers}"`);
            }
          }
          continue; // Переходим к следующему эффекту
        }
      }
      
      // Новая система классификации на основе унифицированной структуры эффектов
      const details = effect.effect_details_json;
      if (details && details.original_description) {
          const description = details.original_description.toLowerCase();
          if (description.includes('урона в секунду') || description.includes('урона огнем')) {
              periodicEffects.damageOverTime.push(effect);
          } else if (description.includes('восстанавливает') && description.includes('здоровья')) {
              periodicEffects.healing.push(effect);
          } else if (description.includes('восстанавливает') && description.includes('духовной энергии')) {
              periodicEffects.energyRegen.push(effect);
          }
      }
    }
    
    // Логируем категоризацию для отладки
    console.log(`[PvP] Категоризация эффектов для участника ${participant.id}:`, {
      healing: periodicEffects.healing.length,
      energyRegen: periodicEffects.energyRegen.length,
      damageOverTime: periodicEffects.damageOverTime.length,
      statModifiers: periodicEffects.statModifiers.length
    });
    
    // Обрабатываем эффекты регенерации здоровья
    for (const effect of periodicEffects.healing) {
      // Подробное логирование для отладки эффекта Регенерация
      console.log(`[PvP] ДЕТАЛЬНЫЙ АНАЛИЗ ЭФФЕКТА РЕГЕНЕРАЦИИ:`, JSON.stringify(effect, null, 2));
      
      // Определяем значение регенерации здоровья
      let healthRegen = 0;
      
      // Точная идентификация эффекта "Регенерация" с проверкой подтипа
      if (effect.name === 'Регенерация' && (effect.subtype === 'healing' || !effect.subtype)) {
        // Фиксированное значение для эффекта "Регенерация"
        healthRegen = 25; // Фиксированное значение для проверки
        console.log(`[PvP] Применяем ФИКСИРОВАННОЕ значение регенерации для эффекта "Регенерация": ${healthRegen}`);
      } else if (effect.name && effect.name.includes('Регенерация')) {
        // Для эффектов, содержащих "Регенерация" в названии
        healthRegen = effect.value || 15;
        console.log(`[PvP] Применяем регенерацию для эффекта "${effect.name}": ${healthRegen}`);
      } else {
        // Для других эффектов лечения
        healthRegen = effect.value || 10;
        console.log(`[PvP] Применяем регенерацию для эффекта "${effect.name || effect.id}": ${healthRegen}`);
      }
      
      // Добавляем здоровье
      totalHealthChange += healthRegen;
      results.push({
        type: 'heal',
        amount: healthRegen,
        effectName: effect.name || effect.id,
        sourceType: effect.subtype || effect.type || 'healing'
      });
      console.log(`[PvP] Регенерация здоровья: +${healthRegen} от эффекта ${effect.name || effect.id}`);
    }
    
    // Обрабатываем эффекты регенерации энергии
    for (const effect of periodicEffects.energyRegen) {
      // Установка значения по умолчанию, если оно отсутствует
      const energyRegen = effect.value || 5;
      
      // Более детальное логирование для отладки
      console.log(`[PvP] Применение эффекта регенерации энергии: ${effect.name || effect.id}`, {
        value: energyRegen,
        original: effect.value,
        type: effect.type,
        subtype: effect.subtype
      });
      
      totalEnergyChange += energyRegen;
      results.push({
        type: 'energy',
        amount: energyRegen,
        effectName: effect.name || effect.id,
        sourceType: effect.subtype || effect.type || 'energy_regen'
      });
      console.log(`[PvP] Регенерация энергии: +${energyRegen} от эффекта ${effect.name || effect.id}`);
    }
    
    // Обрабатываем эффекты периодического урона
    for (const effect of periodicEffects.damageOverTime) {
      let dotDamage = effect.value || 5;
      
      // Проверяем, есть ли модификаторы силы урона от времени
      const modifiers = PvPService.getEffectModifiers(participant);
      if (modifiers.dotModifier !== 0) {
        dotDamage = Math.floor(dotDamage * (1 + modifiers.dotModifier / 100));
        console.log(`[PvP] Модифицированный DoT урон: ${dotDamage} (модификатор: ${modifiers.dotModifier}%)`);
      }
      
      totalHealthChange -= dotDamage;
      results.push({
        type: 'damage',
        amount: dotDamage,
        effectName: effect.name || effect.id,
        sourceType: effect.subtype || effect.type || 'dot',
        damageType: effect.damageType || 'physical'
      });
      console.log(`[PvP] Периодический урон: -${dotDamage} от эффекта ${effect.name || effect.id} (${effect.subtype || effect.type || 'dot'})`);
    }
    
    // ВСЕГДА применяем изменения к участнику, даже если они нулевые!
    // Это позволит обеспечить применение эффектов
    const oldHealth = participant.current_hp;
    const oldEnergy = participant.current_energy;
    const oldStatus = participant.status;
    const newHealth = Math.max(0, Math.min(participant.max_hp, participant.current_hp + totalHealthChange));
    const newEnergy = Math.max(0, Math.min(participant.max_energy, participant.current_energy + totalEnergyChange));
    const newStatus = newHealth <= 0 ? 'defeated' : participant.status;
    
    // Явно устанавливаем новые значения здоровья и энергии в объекте участника
    participant.current_hp = newHealth;
    participant.current_energy = newEnergy;
    participant.status = newStatus;
    
    console.log(`[PvP] Итоговые изменения для участника ${participant.id}:`, {
      healthChange: `${oldHealth} -> ${newHealth} (${totalHealthChange > 0 ? '+' : ''}${totalHealthChange})`,
      energyChange: `${oldEnergy} -> ${newEnergy} (${totalEnergyChange > 0 ? '+' : ''}${totalEnergyChange})`,
      statusChange: oldStatus !== newStatus ? `${oldStatus} -> ${newStatus}` : 'без изменений',
      effectsProcessed: {
        healing: periodicEffects.healing.length,
        energyRegen: periodicEffects.energyRegen.length,
        damageOverTime: periodicEffects.damageOverTime.length,
        statModifiers: periodicEffects.statModifiers.length
      }
    });
    
    // Формируем подробный отчет об изменениях
    const changes = {
      health: {
        before: oldHealth,
        after: newHealth,
        change: totalHealthChange
      },
      energy: {
        before: oldEnergy,
        after: newEnergy,
        change: totalEnergyChange
      }
    };
    
    // Добавляем результаты для возврата клиенту
    results.push({
      type: 'stats_update',
      changes: changes
    });
    
    try {
      // Обновляем базу данных - ВАЖНО! Используем новый объект для обновления
      await participant.update({
        current_hp: newHealth,
        current_energy: newEnergy,
        status: newStatus,
        effects_result: results
      }, { transaction });
      
      console.log(`[PvP] Сохранены изменения здоровья и энергии для участника ${participant.id}. HP: ${newHealth}, Energy: ${newEnergy}`);
    } catch (error) {
      console.error(`[PvP] ОШИБКА при сохранении изменений: ${error.message}`);
    }
    
    // Если участник побежден в результате периодических эффектов
    if (participant.status !== 'defeated' && newStatus === 'defeated') {
      results.push({
        type: 'status',
        status: 'defeated',
        message: `${participant.username || 'Участник'} побежден от периодических эффектов`
      });
      console.log(`[PvP] Участник ${participant.id} побежден от периодических эффектов`);
    }
    
    // Добавляем детальную информацию об эффектах для клиентской визуализации
    for (const effect of participant.effects) {
      if (effect.subtype) {
        // Добавляем статус эффекта для визуальных индикаторов
        effect.lastApplied = new Date().toISOString();
        if (effect.durationMs) {
          effect.remainingPercent = Math.floor((effect.remainingMs || 0) / effect.durationMs * 100);
        } else if (effect.duration) {
          effect.remainingPercent = Math.floor((effect.duration - (effect.elapsedTurns || 0)) / effect.duration * 100);
        }
      }
    }
    
    return results;
  }

  /**
   * Главная функция для применения любого эффекта к участнику.
   * @param {Object} participant - Участник боя.
   * @param {Object} effect - Объект эффекта для применения.
   * @param {Object} transaction - Транзакция Sequelize.
   * @returns {Object} Результат применения эффекта.
   */
  static async applyEffect(participant, effect, transaction) {
    const effectType = effect.effect_type || effect.type;
    let result = { success: false, message: `Неизвестный тип эффекта: ${effectType}` };

    console.log(`[PvP] Применение эффекта "${effect.name || effect.id}" с типом "${effectType}" к участнику ${participant.id}`);

    switch (effectType) {
      case EffectTypes.INSTANT:
        result = this.applyInstantEffect(participant, effect);
        break;
      case EffectTypes.STATS:
        result = this.applyStatsEffect(participant, effect);
        break;
      case EffectTypes.COMBAT:
        result = this.applyCombatEffect(participant, effect);
        break;
      case EffectTypes.CULTIVATION:
        result = this.applyCultivationEffect(participant, effect);
        break;
      case EffectTypes.SPECIAL:
      case EffectTypes.ADVANCED:
      case EffectTypes.BREAKTHROUGH:
      case EffectTypes.DEFENSE:
      case EffectTypes.DRAWBACK:
      case EffectTypes.MOVEMENT:
        result = this.applySpecialEffect(participant, effect);
        break;
      //   result = this.applySpecialEffect(participant, effect);
      //   break;
      default:
        console.log(`[PvP] Нет обработчика для типа эффекта: ${effectType}`);
        break;
    }
    
    // Обновляем состояние участника в БД, если эффект был успешно применен
    if (result.success) {
      await participant.update(result.changes, { transaction });
      console.log(`[PvP] Эффект "${effect.name || effect.id}" успешно применен. Изменения:`, result.changes);
    }

    return result;
  }

  /**
   * Обрабатывает мгновенные эффекты (восстановление здоровья, энергии и т.д.).
   * @param {Object} participant - Участник боя.
   * @param {Object} effect - Объект эффекта.
   * @returns {Object} Результат с изменениями.
   */
  static applyInstantEffect(participant, effect) {
    const changes = {};
    const description = effect.description.toLowerCase();
    const valueMatch = description.match(/\d+/);

    if (!valueMatch) {
        console.log(`[PvP] Не удалось извлечь значение из описания эффекта: ${effect.description}`);
        return { success: false, changes: {} };
    }
    const value = parseInt(valueMatch[0], 10);

    if (description.includes('восстанавливает') && description.includes('здоровья')) {
      const newHealth = Math.min(participant.max_hp, participant.current_hp + value);
      changes.current_hp = newHealth;
    }

    if (description.includes('восстанавливает') && description.includes('духовной энергии')) {
      const newEnergy = Math.min(participant.max_energy, participant.current_energy + value);
      changes.current_energy = newEnergy;
    }

    return { success: Object.keys(changes).length > 0, changes };
  }

  /**
   * Обрабатывает эффекты, изменяющие характеристики.
   * @param {Object} participant - Участник боя.
   * @param {Object} effect - Объект эффекта.
   * @returns {Object} Результат с изменениями.
   */
  static applyStatsEffect(participant, effect) {
    const changes = {};
    const description = effect.description.toLowerCase();
    const parts = description.split(/ и |,/);
    const statsMapping = {
        'силу': 'strength',
        'выносливость': 'stamina',
        'интеллект': 'intelligence',
        'восприятие': 'perception',
        'контроль над ци': 'qi_control',
        'все характеристики': 'all_stats' // Это потребует специальной обработки
    };

    if (!participant.effects) {
        participant.effects = [];
    }

    for (const part of parts) {
        const valueMatch = part.match(/(\d+)(%?)/);
        if (!valueMatch) continue;

        const value = parseInt(valueMatch[1], 10);
        const valueType = valueMatch[2] === '%' ? 'percentage' : 'absolute';

        for (const key in statsMapping) {
            if (part.includes(key)) {
                const targetAttribute = statsMapping[key];
                
                const newEffect = {
                    id: `stat_buff_${targetAttribute}_${Date.now()}`,
                    name: effect.name,
                    effect_type: EffectTypes.STATS,
                    durationMs: effect.durationSeconds ? effect.durationSeconds * 1000 : 300000,
                    appliedAt: new Date().toISOString(),
                    source: effect.item_id || 'unknown',
                    // Новая унифицированная структура
                    effect_details_json: {
                        target_attribute: targetAttribute,
                        value: value,
                        value_type: valueType,
                        original_description: effect.description
                    }
                };
                participant.effects.push(newEffect);
            }
        }
    }
    
    changes.effects = participant.effects;
    return { success: true, changes };
  }

  /**
   * Обрабатывает боевые эффекты.
   * @param {Object} participant - Участник боя.
   * @param {Object} effect - Объект эффекта.
   * @returns {Object} Результат с изменениями.
   */
  static applyCombatEffect(participant, effect) {
    const changes = {};
    const description = effect.description.toLowerCase();
    const valueMatch = description.match(/(\d+)/);
    const value = valueMatch ? parseInt(valueMatch[1], 10) : 0;

    let newEffect = {
        id: `combat_effect_${Date.now()}`,
        name: effect.name,
        effect_type: EffectTypes.COMBAT,
        durationMs: effect.durationSeconds ? effect.durationSeconds * 1000 : 300000,
        appliedAt: new Date().toISOString(),
        source: effect.item_id || 'unknown',
        effect_details_json: {
            original_description: effect.description,
            value: value,
        }
    };

    if (description.includes('физическую защиту')) {
        newEffect.effect_details_json.target_attribute = 'physicalDefense';
        newEffect.effect_details_json.value_type = 'absolute';
    } else if (description.includes('духовную защиту')) {
        newEffect.effect_details_json.target_attribute = 'spiritualDefense';
        newEffect.effect_details_json.value_type = 'absolute';
    } else if (description.includes('урона') && description.includes('отражающий')) {
        newEffect.effect_details_json.target_attribute = 'damageReflection';
        newEffect.effect_details_json.value_type = 'percentage';
    } else {
        return { success: false, message: 'Не удалось определить боевой эффект' };
    }
    
    if (!participant.effects) {
        participant.effects = [];
    }
    participant.effects.push(newEffect);
    changes.effects = participant.effects;
    return { success: true, changes };
  }

  /**
   * Обрабатывает эффекты, связанные с культивацией.
   * @param {Object} participant - Участник боя.
   * @param {Object} effect - Объект эффекта.
   * @returns {Object} Результат с изменениями.
   */
  static applyCultivationEffect(participant, effect) {
    const changes = {};
    const description = effect.description.toLowerCase();
    const valueMatch = description.match(/(\d+)/);
    const value = valueMatch ? parseInt(valueMatch[1], 10) : 0;

    let newEffect = {
        id: `cultivation_effect_${Date.now()}`,
        name: effect.name,
        effect_type: EffectTypes.CULTIVATION,
        durationMs: effect.durationSeconds ? effect.durationSeconds * 1000 : 300000,
        appliedAt: new Date().toISOString(),
        source: effect.item_id || 'unknown',
        effect_details_json: {
            original_description: effect.description,
            value: value,
            value_type: 'percentage' // Большинство эффектов культивации - процентные
        }
    };

    if (description.includes('скорость культивации')) {
        newEffect.effect_details_json.target_attribute = 'cultivationSpeed';
    } else if (description.includes('скорость медитации')) {
        newEffect.effect_details_json.target_attribute = 'meditationSpeed';
    } else if (description.includes('максимум духовной энергии')) {
        newEffect.effect_details_json.target_attribute = 'maxEnergy';
    } else {
        return { success: false, message: 'Не удалось определить эффект культивации' };
    }

    if (!participant.effects) {
        participant.effects = [];
    }
    participant.effects.push(newEffect);
    changes.effects = participant.effects;
    return { success: true, changes };
  }

  /**
   * Обрабатывает особые, сложные и уникальные эффекты.
   * @param {Object} participant - Участник боя.
   * @param {Object} effect - Объект эффекта.
   * @returns {Object} Результат с изменениями.
   */
  static applySpecialEffect(participant, effect) {
    const changes = {};
    const description = effect.description.toLowerCase();
    const effectType = effect.effect_type || effect.type;

    // Для спецэффектов мы просто сохраняем их как есть,
    // так как их логика будет обрабатываться в других местах (например, `calculateDamage` или `performAction`).
    const newEffect = {
        id: `special_effect_${Date.now()}`,
        name: effect.name,
        effect_type: effectType,
        durationMs: effect.durationSeconds ? effect.durationSeconds * 1000 : 300000,
        appliedAt: new Date().toISOString(),
        source: effect.item_id || 'unknown',
        effect_details_json: {
            original_description: effect.description
        }
    };
    
    if (description.includes('снимает все негативные эффекты')) {
        participant.effects = participant.effects.filter(e => e.type !== 'debuff' && e.subtype !== 'debuff');
        // Этот эффект мгновенный и не должен добавляться в массив
        changes.effects = participant.effects;
        return { success: true, changes };
    }

    if (!participant.effects) {
        participant.effects = [];
    }
    participant.effects.push(newEffect);
    changes.effects = participant.effects;

    return { success: true, changes };
  }

  /**
   * Применение эффектов, активируемых при действиях (например, "Накопление энергии")
   * @param {Object} participant - Участник боя
   * @param {Object} transaction - Транзакция Sequelize
   * @returns {Array} Массив примененных эффектов
   */
  static async applyActionBasedEffects(participant, transaction) {
    if (!participant.effects || !Array.isArray(participant.effects)) {
      return [];
    }
    
    const results = [];
    let totalEnergyChange = 0;
    
    console.log(`[PvP] Применение эффектов при действиях для участника ${participant.id} (${participant.username || 'Unknown'})`);
    
    // Получаем эффекты, которые активируются при действиях (но НЕ "Накопление энергии")
    const actionBasedEffects = participant.effects.filter(effect => {
      // "Накопление энергии" теперь обрабатывается как периодический эффект
      if (effect.name === 'Накопление энергии') {
        console.log(`[PvP] Эффект "Накопление энергии" пропущен в applyActionBasedEffects (теперь обрабатывается в applyPeriodicEffects)`);
        return false;
      }
      
      // Проверяем тип, подтип и модификаторы
      if ((effect.type === 'energy_gain' && effect.name !== 'Накопление энергии') ||
          (effect.modifiers && effect.modifiers.includes('по названию и типу'))) {
        
        console.log(`[PvP] Найден эффект при действии:`, {
          id: effect.id,
          name: effect.name,
          type: effect.type,
          subtype: effect.subtype
        });
        
        return true;
      }
      
      return false;
    });
    
    if (actionBasedEffects.length === 0) {
      console.log(`[PvP] Эффекты "Накопление энергии" не найдены для участника ${participant.id}`);
      return [];
    }
    
    console.log(`[PvP] Найдено эффектов "Накопление энергии": ${actionBasedEffects.length} для участника ${participant.id}`);
    
    // Применяем эффекты накопления энергии
    for (const effect of actionBasedEffects) {
      // Фиксированное значение накопления энергии - 15
      const energyGain = 15;
      
      console.log(`[PvP] Применение эффекта "Накопление энергии": ${effect.name || effect.id}`, {
        id: effect.id,
        name: effect.name,
        type: effect.type,
        subtype: effect.subtype,
        value: energyGain,
        original: effect.value,
        modifiers: effect.modifiers
      });
      
      totalEnergyChange += energyGain;
      results.push({
        type: 'energy',
        amount: energyGain,
        effectName: effect.name || effect.id,
        sourceType: 'action_based_energy'
      });
    }
    
    // Применяем изменения к участнику, если были изменения
    if (totalEnergyChange > 0) {
      const oldEnergy = participant.current_energy;
      const newEnergy = Math.max(0, Math.min(participant.max_energy, participant.current_energy + totalEnergyChange));
      
      console.log(`[PvP] Итоговые изменения энергии для участника ${participant.id} при действии:`, {
        energyChange: `${oldEnergy} -> ${newEnergy} (+${totalEnergyChange})`,
        appliedEffects: actionBasedEffects.length,
        beforeUpdate: true
      });
      
      // Обновляем базу данных
      await participant.update({
        current_energy: newEnergy,
        effects_result: results // Используем правильное свойство
      }, { transaction });
    }
    
    return results;
  }
  
  /**
   * Вычисляет суммарные модификаторы от всех активных эффектов.
   * @param {Object} participant - Участник боя.
   * @returns {Object} Объект с суммарными модификаторами.
   */
  static getEffectModifiers(participant) {
    const modifiers = {
      // Статы
      strength: 0,
      stamina: 0,
      intelligence: 0,
      perception: 0,
      qi_control: 0,
      // Боевые
      physicalDefense: 0,
      magicDefense: 0,
      damageReflection: 0, // в %
      // DoT/HoT
      damageOverTime: [], // массив объектов { type, value }
      healthOverTime: [], // массив объектов { value }
      // Культивация
      cultivationSpeed: 0, // в %
      meditationSpeed: 0, // в %
      maxEnergy: 0, // в %
      // Специальные
      breakthroughChance: 0, // в %
      movementSpeed: 0, // в %
    };

    if (!participant || !participant.effects || !Array.isArray(participant.effects)) {
      return modifiers;
    }

    const now = Date.now();
    const activeEffects = participant.effects.filter(effect => {
        if (!effect.durationMs) return true; // Постоянные эффекты
        const startTime = new Date(effect.appliedAt).getTime();
        const elapsedMs = now - startTime;
        return elapsedMs < effect.durationMs;
    });

    for (const effect of activeEffects) {
        if (!effect.modifies) continue;

        for (const key in effect.modifies) {
            const mod = effect.modifies[key];
            if (key === 'damageOverTime' || key === 'healthOverTime') {
                modifiers[key].push(mod);
            } else {
                // Пока что мы просто суммируем. Для процентных баффов нужна более сложная логика,
                // которая будет применяться к базовым статам.
                if (modifiers[key] !== undefined) {
                    modifiers[key] += mod.value;
                }
            }
        }
    }

    return modifiers;
  }

  /**
   * Проверка возможности выполнения действия
   * @param {Object} participant - Участник боя
   * @returns {Object} Результат проверки
   */
  static canPerformAction(participant) {
    if (!participant) {
      return { canAct: false, reason: 'Участник не найден' };
    }
    
    if (participant.status !== 'active') {
      return { canAct: false, reason: 'Участник не активен' };
    }
    
    // Проверка на оглушение
    if (participant.effects && Array.isArray(participant.effects)) {
      // Для эффектов оглушения используем временную систему
      const now = Date.now();
      const stunEffect = participant.effects.find(e =>
        e.subtype === 'stun' &&
        e.durationMs &&
        e.startTime &&
        (now - e.startTime < e.durationMs)
      );
      
      if (stunEffect) {
        // Рассчитываем оставшееся время в секундах
        const elapsedMs = now - stunEffect.startTime;
        const remainingMs = Math.max(0, stunEffect.durationMs - elapsedMs);
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        
        return {
          canAct: false,
          reason: 'Оглушение',
          remainingSeconds: remainingSeconds
        };
      }
    }
    
    // Проверка таймаута с учетом эффектов скорости
    if (participant.last_action_time) {
      const now = new Date();
      const lastActionTime = new Date(participant.last_action_time);
      const cooldown = PvPService.calculateActionCooldown(participant);
      const timeDiff = (now - lastActionTime) / 1000; // разница в секундах
      
      if (timeDiff < cooldown / 1000) {
        return {
          canAct: false,
          reason: 'Таймаут',
          remainingSeconds: Math.ceil(cooldown / 1000 - timeDiff)
        };
      }
    }
    
    return { canAct: true };
  }
  
  /**
   * Расчет модификаторов от эффектов
   * @param {Object} participant - Участник боя
   * @returns {Object} Объект с модификаторами
   */
  static getEffectModifiers(participant) {
    if (!participant || !participant.effects || !Array.isArray(participant.effects)) {
      return {
        damage: 0,            // Модификатор урона (в процентах)
        defense: 0,           // Модификатор защиты (в процентах)
        speed: 0,             // Модификатор скорости (в процентах)
        energyRegen: 0,       // Бонус к регенерации энергии (абсолютное значение)
        dotModifier: 0,       // Модификатор урона от времени (в процентах)
        critChance: 0,        // Бонус к шансу критического удара (в процентах)
        critDamage: 0,        // Бонус к критическому урону (в процентах)
        healingReceived: 0,   // Модификатор получаемого лечения (в процентах)
        healingDone: 0,       // Модификатор исходящего лечения (в процентах)
        physicalDamage: 0,    // Модификатор физического урона (в процентах)
        spiritualDamage: 0,   // Модификатор духовного урона (в процентах)
        cooldownReduction: 0  // Сокращение перезарядки (в процентах)
      };
    }
    
    console.log(`[PvP] Расчет модификаторов эффектов для участника ${participant.id}. Всего эффектов: ${participant.effects.length}`);
    
    const modifiers = {
      damage: 0,            // Модификатор урона (в процентах)
      defense: 0,           // Модификатор защиты (в процентах)
      speed: 0,             // Модификатор скорости (в процентах)
      energyRegen: 0,       // Бонус к регенерации энергии (абсолютное значение)
      dotModifier: 0,       // Модификатор урона от времени (в процентах)
      critChance: 0,        // Бонус к шансу критического удара (в процентах)
      critDamage: 0,        // Бонус к критическому урону (в процентах)
      healingReceived: 0,   // Модификатор получаемого лечения (в процентах)
      healingDone: 0,       // Модификатор исходящего лечения (в процентах)
      physicalDamage: 0,    // Модификатор физического урона (в процентах)
      spiritualDamage: 0,   // Модификатор духовного урона (в процентах)
      cooldownReduction: 0  // Сокращение перезарядки (в процентах)
    };
    
    // Создаем набор уже обработанных эффектов для логирования
    const processedEffects = [];
    
    // Суммируем модификаторы от всех эффектов
    for (const effect of participant.effects) {
      const effectInfo = {
        id: effect.id,
        name: effect.name || effect.id,
        type: effect.type,
        subtype: effect.subtype,
        appliedModifiers: []
      };
      
      // Перед обработкой добавляем детальное логирование для каждого эффекта
      console.log(`[PvP] Обрабатываем эффект для модификаторов: ${effect.name || effect.id}`, {
        type: effect.type,
        subtype: effect.subtype,
        value: effect.value,
        damageBonus: effect.damageBonus,
        damageReduction: effect.damageReduction
      });
      
      // Специальная обработка для эффекта "Накопление энергии"
      if (effect.name && effect.name.includes('энерги') && effect.type === 'regenerate') {
        modifiers.energyRegen += (effect.value || 5);
        effectInfo.appliedModifiers.push(`energyRegen: +${effect.value || 5} (по названию и типу)`);
        console.log(`[PvP] Обнаружен эффект накопления энергии: ${effect.name}, добавлен бонус energyRegen +${effect.value || 5}`);
      }
      // Если это эффект типа regenerate без подтипа
      else if (effect.type === 'regenerate' && !effect.subtype) {
        modifiers.energyRegen += (effect.value || 5);
        effectInfo.appliedModifiers.push(`energyRegen: +${effect.value || 5} (по типу regenerate)`);
        console.log(`[PvP] Обнаружен эффект регенерации типа regenerate, добавлен бонус energyRegen +${effect.value || 5}`);
      }
      // Обработка по подтипу
      else if (effect.subtype) {
        switch (effect.subtype) {
          // Модификаторы урона
          case 'weaken':
          case 'weakness':
          case 'attack_down':
            // Ослабление снижает наносимый урон
            modifiers.damage -= (effect.value || 25);
            effectInfo.appliedModifiers.push(`damage: -${effect.value || 25}%`);
            break;
            
          case 'strengthen':
          case 'attack_up':
          case 'empower':
            // Усиление увеличивает наносимый урон
            modifiers.damage += (effect.value || 20);
            effectInfo.appliedModifiers.push(`damage: +${effect.value || 20}%`);
            break;
            
          // Модификаторы защиты
          case 'protect':
          case 'defense_up':
          case 'shield':
          case 'armor':
            // Защита снижает получаемый урон
            modifiers.defense += (effect.value || 40);
            effectInfo.appliedModifiers.push(`defense: +${effect.value || 40}%`);
            break;
            
          case 'vulnerable':
          case 'defense_down':
          case 'expose':
            // Уязвимость увеличивает получаемый урон
            modifiers.defense -= (effect.value || 30);
            effectInfo.appliedModifiers.push(`defense: -${effect.value || 30}%`);
            break;
            
          // Модификаторы скорости
          case 'speed':
          case 'haste':
          case 'speed_up':
            // Увеличение скорости
            modifiers.speed += (effect.value || 20);
            effectInfo.appliedModifiers.push(`speed: +${effect.value || 20}%`);
            break;
            
          case 'slow':
          case 'speed_down':
            // Замедление
            modifiers.speed -= (effect.value || 25);
            effectInfo.appliedModifiers.push(`speed: -${effect.value || 25}%`);
            break;
            
          // Модификаторы регенерации
          case 'regenerate':
          case 'energy_regen':
            // Бонус к регенерации энергии
            modifiers.energyRegen += (effect.value || 15);
            effectInfo.appliedModifiers.push(`energyRegen: +${effect.value || 15}`);
            break;
            
          // Модификаторы DoT
          case 'dot_amplifier':
            // Усиление урона от времени
            modifiers.dotModifier += (effect.value || 25);
            effectInfo.appliedModifiers.push(`dotModifier: +${effect.value || 25}%`);
            break;
            
          // Модификаторы крита
          case 'crit_chance':
            modifiers.critChance += (effect.value || 10);
            effectInfo.appliedModifiers.push(`critChance: +${effect.value || 10}%`);
            break;
            
          case 'crit_damage':
            modifiers.critDamage += (effect.value || 20);
            effectInfo.appliedModifiers.push(`critDamage: +${effect.value || 20}%`);
            break;
            
          // Модификаторы лечения
          case 'healing_received':
            modifiers.healingReceived += (effect.value || 30);
            effectInfo.appliedModifiers.push(`healingReceived: +${effect.value || 30}%`);
            break;
            
          case 'healing_done':
            modifiers.healingDone += (effect.value || 30);
            effectInfo.appliedModifiers.push(`healingDone: +${effect.value || 30}%`);
            break;
            
          // Модификаторы конкретных типов урона
          case 'physical_damage':
            modifiers.physicalDamage += (effect.value || 20);
            effectInfo.appliedModifiers.push(`physicalDamage: +${effect.value || 20}%`);
            break;
            
          case 'spiritual_damage':
            modifiers.spiritualDamage += (effect.value || 20);
            effectInfo.appliedModifiers.push(`spiritualDamage: +${effect.value || 20}%`);
            break;
            
          // Модификаторы перезарядки
          case 'cooldown_reduction':
            modifiers.cooldownReduction += (effect.value || 15);
            effectInfo.appliedModifiers.push(`cooldownReduction: +${effect.value || 15}%`);
            break;
        }
      }
      
      // Второй проход - обработка прямых модификаторов (для обратной совместимости)
      
      // Урон
      if (effect.damageBonus) {
        const damageBonus = effect.damageBonus * 100;
        modifiers.damage += damageBonus;
        effectInfo.appliedModifiers.push(`damage: +${damageBonus}% (damageBonus)`);
      }
      
      // Защита
      if (effect.damageReduction) {
        const defenseBonus = effect.damageReduction * 100;
        modifiers.defense += defenseBonus;
        effectInfo.appliedModifiers.push(`defense: +${defenseBonus}% (damageReduction)`);
      }
      
      // Скорость
      if (effect.speedBonus) {
        const speedBonus = effect.speedBonus * 100;
        modifiers.speed += speedBonus;
        effectInfo.appliedModifiers.push(`speed: +${speedBonus}% (speedBonus)`);
      }
      
      // Бонус критического урона
      if (effect.critDamageBonus) {
        modifiers.critDamage += effect.critDamageBonus * 100;
        effectInfo.appliedModifiers.push(`critDamage: +${effect.critDamageBonus * 100}% (critDamageBonus)`);
      }
      
      // Бонус шанса критического удара
      if (effect.critChanceBonus) {
        modifiers.critChance += effect.critChanceBonus * 100;
        effectInfo.appliedModifiers.push(`critChance: +${effect.critChanceBonus * 100}% (critChanceBonus)`);
      }
      
      // Если для эффекта были применены какие-либо модификаторы, добавляем его в список обработанных
      if (effectInfo.appliedModifiers.length > 0) {
        processedEffects.push(effectInfo);
      }
    }
    
    // Детальное логирование примененных модификаторов
    if (processedEffects.length > 0) {
      console.log(`[PvP] Обработаны эффекты с модификаторами для участника ${participant.id}:`,
        processedEffects.map(e => ({
          name: e.name,
          modifiers: e.appliedModifiers.join(', ')
        }))
      );
    }
    
    // Детальное логирование итоговых модификаторов
    console.log(`[PvP] Итоговые модификаторы для участника ${participant.id}:`,
      Object.entries(modifiers)
        .filter(([_, value]) => value !== 0)
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {})
    );
    
    return modifiers;
  }
  
  /**
   * Расчет индивидуального времени перезарядки для участника
   * @param {Object} participant - Участник боя
   * @returns {number} Время перезарядки в миллисекундах
   */
  static calculateActionCooldown(participant) {
    // Базовый интервал между действиями - 5 секунд
    const baseCooldown = 5000; // ms
    
    if (!participant || !participant.effects || !Array.isArray(participant.effects)) {
      return baseCooldown;
    }
    
    // Вычисляем суммарный эффект скорости
    let speedModifier = 0;
    const speedEffects = participant.effects.filter(e => e.subtype === 'speed');
    
    for (const effect of speedEffects) {
      speedModifier += (effect.value || 0);
    }
    
    // Также проверяем наличие прямого параметра speedBonus
    const speedBonusEffects = participant.effects.filter(e => e.speedBonus);
    for (const effect of speedBonusEffects) {
      speedModifier += (effect.speedBonus * 100);
    }
    
    // Ограничиваем модификатор скорости максимумом в 80%
    speedModifier = Math.min(80, speedModifier);
    
    // Уменьшаем время кулдауна на процент модификатора скорости
    const adjustedCooldown = baseCooldown * (1 - speedModifier / 100);
    
    // Минимальный интервал - 1 секунда
    return Math.max(1000, Math.floor(adjustedCooldown));
  }
  /**
   * Получение эффектов от экипированных предметов
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>} - Массив эффектов
   * @private
   */
  static async _getEquipmentEffects(userId) {
    if (!userId) {
      return [];
    }

    try {
      const inventory = await InventoryService.getInventoryItems(userId);
      const equippedItems = inventory.filter(item => item.equipped);

      const effects = [];
      for (const item of equippedItems) {
        // Ищем эффекты в stats, как это делается в inventory-service
        if (item.stats && item.stats.effects && Array.isArray(item.stats.effects)) {
          for (const effect of item.stats.effects) {
            if (effect.type === 'statBoost' || effect.type === 'combatBoost') {
              effects.push(effect);
            }
          }
        }
      }
      
      
      return effects;
    } catch (error) {
      console.error(`[PvP] Ошибка при получении эффектов экипировки для пользователя ${userId}:`, error);
      return [];
    }
  }

  /**
   * Расчет урона с учетом эффектов
   * @param {Object} attacker - Атакующий участник
   * @param {Object} defender - Защищающийся участник
   * @param {number} baseDamage - Базовый урон
   * @param {string} damageType - Тип урона
   * @returns {Object} Итоговый урон и информация о критическом ударе
   */
  static async calculateDamage(attacker, defender, baseDamage, damageType, actionType = 'attack', techniqueId = null) {
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    const LearnedTechnique = modelRegistry.getModel('LearnedTechnique');

    // 1. Получаем полные, рассчитанные характеристики для обоих участников
    const [attackerFullStats, defenderFullStats] = await Promise.all([
        PvpStatsService.getPvpParticipantStats(attacker),
        PvpStatsService.getPvpParticipantStats(defender)
    ]);

    // 2. Используем модифицированные и вторичные характеристики для расчетов
    const finalAttackerStats = { ...attackerFullStats.modified, ...attackerFullStats.secondary };
    const finalDefenderStats = { ...defenderFullStats.modified, ...defenderFullStats.secondary };

    // 3. Получаем уровень техники, если она используется
    let techniqueLevel = 1;
    if (techniqueId && actionType === 'technique') {
      try {
        const learnedTechnique = await LearnedTechnique.findOne({
          where: {
            userId: attacker.user_id, // ВАЖНО: убедиться, что user_id есть в объекте attacker
            techniqueId: techniqueId
          }
        });
        if (learnedTechnique) {
          techniqueLevel = learnedTechnique.level;
        }
      } catch (error) {
        console.error(`[PvP] Ошибка при получении уровня техники:`, error);
      }
    }

    // 4. Используем рассчитанные характеристики
    const attackerPhysicalAttack = finalAttackerStats.physicalAttack;
    const attackerSpiritualAttack = finalAttackerStats.spiritualAttack;
    const defenderPhysicalDefense = finalDefenderStats.physicalDefense;
    const defenderSpiritualDefense = finalDefenderStats.spiritualDefense;
    
    console.log(`[PvP] Расчет урона с учетом уровней и экипировки:`, {
      attackerLevel,
      defenderLevel,
      baseAttack,
      baseDefense,
      attackerPhysicalAttack,
      attackerSpiritualAttack,
      defenderPhysicalDefense,
      defenderSpiritualDefense,
      baseDamage,
      damageType,
      actionType
    });
    
    // Расчет урона в зависимости от типа действия и типа урона
    if (actionType === 'attack') {
      // Урон обычной атаки = physical_attack - physical_defense
      damage = baseDamage + attackerPhysicalAttack - defenderPhysicalDefense;
    } else if (actionType === 'technique') {
      // Рассчитываем базовый урон техники с учетом ее уровня
      // Формула: каждый уровень техники добавляет 10% к базовому урону
      const techniqueLevelMultiplier = 1 + (0.1 * (techniqueLevel - 1));
      const scaledBaseDamage = Math.floor(baseDamage * techniqueLevelMultiplier);
      
      console.log(`[PvP] Расчет урона техники с учетом уровня ${techniqueLevel}:`, {
        baseDamage,
        techniqueLevelMultiplier,
        scaledBaseDamage
      });
      
      if (damageType === 'physical') {
        // Урон физической техники = (baseDamage * levelMultiplier) + physical_attack - physical_defense
        damage = scaledBaseDamage + attackerPhysicalAttack - defenderPhysicalDefense;
      } else if (damageType === 'spiritual') {
        // Урон духовной техники = (baseDamage * levelMultiplier) + spiritual_attack - spiritual_defense
        damage = scaledBaseDamage + attackerSpiritualAttack - defenderSpiritualDefense;
      }
    }
    
    // Проверка на уклонение (перед расчетом критического удара)
    const baseDodgeChance = 10; // Базовый шанс уклонения 10%
    let dodgeChance = baseDodgeChance;
    
    // Учитываем параметр luck из состояния защищающегося
    if (finalDefenderStats.luck) {
      dodgeChance += finalDefenderStats.luck;
    }
    
    // Учитываем эффекты скорости у защищающегося
    if (defender.effects && Array.isArray(defender.effects)) {
      const speedEffects = defender.effects.filter(e => e.subtype === 'speed');
      for (const effect of speedEffects) {
        const dodgeBonus = effect.value ? effect.value / 2 : 0;
        dodgeChance += dodgeBonus;
      }
    }

    // Применяем combatBoost эффекты к шансу уклонения
    for (const effect of defenderEquipmentEffects) {
        if (effect.type === 'combatBoost' && effect.target === 'dodgeChance') {
            dodgeChance += effect.value * 100; // Приводим к процентам
        }
    }
    
    // Проверяем, уклонился ли защищающийся
    const isDodged = Math.random() * 100 < dodgeChance;
    
    if (isDodged) {
      return {
        damage: 0,
        isCritical: false,
        isDodged: true,
        dodgeChance: dodgeChance
      };
    }
    
    // Проверяем критический удар
    let critChance = 5; // Базовый шанс критического удара
    
    if (finalAttackerStats.criticalChance) {
      critChance = finalAttackerStats.criticalChance;
    }

    // Применяем combatBoost эффекты к шансу крита
    for (const effect of attackerEquipmentEffects) {
        if (effect.type === 'combatBoost' && effect.target === 'critChance') {
            critChance += effect.value * 100; // Приводим к процентам
        }
    }
    
    const isCritical = Math.random() * 100 < critChance;
    
    // Получаем модификаторы от эффектов атакующего
    const attackerModifiers = PvPService.getEffectModifiers(attacker);
    
    // Получаем модификаторы от эффектов защищающегося
    const defenderModifiers = PvPService.getEffectModifiers(defender);
    
    // Применяем combatBoost эффекты к урону и защите
    for (const effect of equipmentEffects) {
        if (effect.type === 'combatBoost') {
            if (attackerEquipmentEffects.includes(effect) && effect.target === 'physicalDamage') {
                damage += effect.value;
            }
            if (defenderEquipmentEffects.includes(effect) && effect.target === 'physicalDefense') {
                damage -= effect.value;
            }
        }
    }

    // Применяем модификаторы урона от атакующего
    if (attackerModifiers.damage !== 0) {
      damage *= (1 + (attackerModifiers.damage / 100));
    }
    
    // Применяем модификаторы защиты от защищающегося
    if (defenderModifiers.defense !== 0) {
      damage *= (1 - Math.min(0.8, defenderModifiers.defense / 100));
    }
    if (attacker.effects && attacker.effects.length > 0) {
      for (const effect of attacker.effects) {
        if (effect.damageBonus && !effect.subtype) { // Только если это не новый тип эффекта
          damage *= (1 + effect.damageBonus);
          console.log(`[PvP] Применен бонус урона от эффекта ${effect.name || effect.id}: ${effect.damageBonus * 100}%`);
        }
      }
    }
    
    if (defender.effects && defender.effects.length > 0) {
      for (const effect of defender.effects) {
        if (effect.damageReduction && !effect.subtype) { // Только если это не новый тип эффекта
          damage *= (1 - effect.damageReduction);
          console.log(`[PvP] Применено снижение урона от эффекта ${effect.name || effect.id}: ${effect.damageReduction * 100}%`);
        }
      }
    }
    
    // Если критический удар, увеличиваем урон
    if (isCritical) {
      damage *= 1.5;
    }
    
    // Урон не должен быть отрицательным
    damage = Math.max(1, Math.floor(damage));
    
    console.log(`[PvP] Итоговый урон: ${damage}, критический: ${isCritical}`);
    
    return {
      damage,
      isCritical,
      isDodged: false,
      critChance: critChance, // Добавляем информацию о шансе крита
      dodgeChance: dodgeChance // Добавляем информацию о шансе уклонения
    };
  }
  /**
   * Получение списка доступных режимов PvP
   * @returns {Promise<Array>} Массив доступных режимов
   */
  static async getModes() {
    try {
      // Инициализируем реестр моделей, если он еще не инициализирован
      await modelRegistry.initializeRegistry();
      
      // Получаем модель через реестр
      const PvPMode = modelRegistry.getModel('PvPMode');
      
      const modes = await PvPMode.findAll({
        where: { enabled: true },
        order: [['id', 'ASC']]
      });
      
      return modes;
    } catch (error) {
      console.error('Ошибка при получении режимов PvP:', error);
      throw new Error('Не удалось получить режимы PvP');
    }
  }

  /**
   * Создание новой комнаты PvP
   * @param {number} userId - ID создателя комнаты
   * @param {string} name - Название комнаты
   * @param {number} modeId - ID режима PvP
   * @param {number} minLevel - Минимальный уровень культивации
   * @param {number} maxLevel - Максимальный уровень культивации
   * @returns {Promise<Object>} Данные созданной комнаты
   */
  static async createRoom(userId, name, modeId, minLevel, maxLevel) {
    try {
      // Инициализируем реестр моделей
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const PvPRoom = modelRegistry.getModel('PvPRoom');
      const PvPMode = modelRegistry.getModel('PvPMode');
      const User = modelRegistry.getModel('User');
      const CultivationProgress = modelRegistry.getModel('CultivationProgress');
      const PvPParticipant = modelRegistry.getModel('PvPParticipant');
      const sequelize = PvPRoom.sequelize;
      
      // Проверяем, есть ли у пользователя активные комнаты
      const activeParticipations = await PvPParticipant.findAll({
        where: {
          user_id: userId,
          status: 'active'
        },
        include: [
          {
            model: PvPRoom,
            as: 'pvpRoom',
            where: {
              status: {
                [Op.in]: ['waiting', 'in_progress']
              }
            }
          }
        ]
      });
      
      // Если у пользователя уже есть активные комнаты, выбрасываем ошибку
      if (activeParticipations.length > 0) {
        const roomId = activeParticipations[0].pvpRoom.id;
        throw new Error(`У вас уже есть активная комната (ID: ${roomId}). Вы не можете создать новую, пока не покинете текущую.`);
      }
      
      // Получаем данные пользователя для проверки уровня культивации
      const user = await User.findByPk(userId, {
        include: [
          {
            model: CultivationProgress,
            as: 'cultivationProgress',
            attributes: ['level']
          }
        ]
      });
      
      if (!user) {
        throw new Error('Пользователь не найден');
      }
      
      // Получаем уровень культивации пользователя
      const userLevel = user.cultivationProgress?.level || 1;
      
      // Проверяем, входит ли уровень пользователя в указанный диапазон
      if (userLevel < minLevel) {
        throw new Error(`Ваш уровень культивации (${userLevel}) ниже минимального требуемого уровня (${minLevel})`);
      }
      
      if (userLevel > maxLevel) {
        throw new Error(`Ваш уровень культивации (${userLevel}) выше максимального допустимого уровня (${maxLevel})`);
      }
      
      // Используем транзакцию для создания комнаты
      const result = await sequelize.transaction(async (transaction) => {
        // Создаем комнату
        const room = await PvPRoom.create({
          name,
          mode_id: modeId,
          min_level: minLevel,
          max_level: maxLevel,
          leader_id: userId,
          status: 'waiting'
        }, { transaction });
        
        // Получаем информацию о режиме
        const mode = await PvPMode.findByPk(modeId, { transaction });
        
        if (!mode) {
          throw new Error('Режим PvP не найден');
        }
        
        // Получаем характеристики игрока для расчета HP и других параметров
        const CharacterStatsService = require('./character-stats-service');
        let baseHp = 200 + (userLevel * 20);
        let baseEnergy = 100 + (userLevel * 10);
        
        try {
          // Получаем характеристики игрока
          const playerStats = await CharacterStatsService.getSecondaryStats(userId);
          
          // Используем характеристики для расчета HP, если они доступны
          if (playerStats && playerStats.health) {
            baseHp = Math.max(100, 50 + (userLevel * 10) + (playerStats.health * 2));
          }
          
          // Используем характеристики для расчета энергии, если они доступны
          if (playerStats && playerStats.energy) {
            baseEnergy = Math.max(50, 30 + (userLevel * 5) + (playerStats.energy * 1.5));
          }
          
          console.log(`[PvP] Рассчитаны базовые характеристики для игрока ${userId}:`, {
            level: userLevel,
            baseHp,
            baseEnergy
          });
        } catch (error) {
          console.error(`[PvP] Ошибка при получении характеристик для расчета HP: ${error.message}`);
          // Продолжаем с базовыми значениями
        }
        
        // Автоматически добавляем создателя комнаты как участника в команду 1, позиция 1
        await PvPParticipant.create({
          room_id: room.id,
          user_id: userId,
          team: 1,
          position: 1,
          status: 'active',
          // Используем рассчитанные значения
          current_hp: baseHp,
          max_hp: baseHp,
          current_energy: baseEnergy,
          max_energy: baseEnergy,
          level: userLevel,
          // Инициализируем время последнего действия
          // Устанавливаем время в прошлом, чтобы игрок мог сразу выполнить действие
          last_action_time: new Date(Date.now() - 10000) // 10 секунд назад
        }, { transaction });
        
        // Сохраняем характеристики игрока в таблицу pvp_player_stats
        await this.savePlayerStats(userId, room.id, transaction);
        
        // Создаем новый объект с данными комнаты и режима
        const roomData = room.toJSON();
        roomData.player_count = mode.player_count;
        
        return roomData;
      });
      
      return result;
    } catch (error) {
      console.error('Ошибка при создании комнаты PvP:', error);
      throw new Error(`Не удалось создать комнату PvP: ${error.message}`);
    }
  }

  /**
   * Получение списка комнат PvP
   * @param {string} status - Статус комнат (waiting, in_progress, completed)
   * @param {number} modeId - ID режима для фильтрации
   * @returns {Promise<Array>} Массив комнат
   */
  static async getRooms(status = 'waiting', modeId = null) {
    try {
      // Инициализируем реестр моделей
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const PvPRoom = modelRegistry.getModel('PvPRoom');
      const PvPMode = modelRegistry.getModel('PvPMode');
      const User = modelRegistry.getModel('User');
      const PvPParticipant = modelRegistry.getModel('PvPParticipant');
      
      // Формируем условия поиска
      const whereConditions = { status };
      if (modeId) {
        whereConditions.mode_id = modeId;
      }
      
      // Получаем комнаты с ассоциациями
      const rooms = await PvPRoom.findAll({
        where: whereConditions,
        include: [
          {
            model: PvPMode,
            as: 'pvpMode',
            attributes: ['id', 'name', 'player_count', 'team_size']
          },
          {
            model: User,
            as: 'leader',
            attributes: ['id', 'username']
          },
          {
            model: PvPParticipant,
            as: 'participants',
            attributes: ['id']
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      // Преобразуем результат для совместимости с предыдущей реализацией
      return rooms.map(room => ({
        id: room.id,
        name: room.name,
        status: room.status,
        min_level: room.min_level,
        max_level: room.max_level,
        leader_id: room.leader_id,
        leader_name: room.leader ? room.leader.username : 'Unknown',
        mode_name: room.pvpMode ? room.pvpMode.name : 'Unknown',
        player_count: room.pvpMode ? room.pvpMode.player_count : 0,
        participant_count: room.participants ? room.participants.length : 0
      }));
    } catch (error) {
      console.error('Ошибка при получении списка комнат:', error);
      throw new Error('Не удалось получить список комнат');
    }
  }

  /**
   * Получение детальной информации о комнате
   * @param {number} roomId - ID комнаты
   * @returns {Promise<Object>} Данные комнаты и участников
   */
  static async getRoomDetails(roomId) {
    try {
      // Инициализируем реестр моделей
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const PvPRoom = modelRegistry.getModel('PvPRoom');
      const PvPParticipant = modelRegistry.getModel('PvPParticipant');
      const PvPAction = modelRegistry.getModel('PvPAction');
      const User = modelRegistry.getModel('User');
      const PvPMode = modelRegistry.getModel('PvPMode');
      
      // Получаем данные комнаты с ассоциациями
      const room = await PvPRoom.findByPk(roomId, {
        include: [
          {
            model: PvPMode,
            as: 'pvpMode',
            attributes: ['id', 'name', 'player_count', 'team_size'] // Добавляем виртуальное поле team_size
          },
          {
            model: User,
            as: 'leader',
            attributes: ['id', 'username']
          }
        ]
      });
      
      if (!room) {
        throw new Error('Комната не найдена');
      }
      
      // Преобразуем данные комнаты
      const roomData = {
        id: room.id,
        name: room.name,
        status: room.status,
        min_level: room.min_level,
        max_level: room.max_level,
        leader_id: room.leader_id,
        leader_name: room.leader ? room.leader.username : 'Unknown',
        mode_name: room.pvpMode ? room.pvpMode.name : 'Unknown',
        player_count: room.pvpMode ? room.pvpMode.player_count : 0,
        winner_team: room.winner_team,
        start_time: room.start_time,
        end_time: room.end_time,
        created_at: room.created_at
      };
      
      // Получаем участников комнаты
      const participants = await PvPParticipant.findAll({
        where: { room_id: roomId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username']
          }
        ],
        order: [['team', 'ASC'], ['position', 'ASC']]
      });
      
      // Обновляем длительность эффектов для каждого участника
      const sequelize = PvPParticipant.sequelize;
      await sequelize.transaction(async (transaction) => {
        for (const participant of participants) {
          // Обновляем длительность эффектов ПЕРЕД показом на фронтенде
          // НО не уменьшаем счетчик ходов при простом обновлении интерфейса
          if (participant.effects && participant.effects.length > 0) {
            console.log(`[PvP] Обновление длительности эффектов для участника ${participant.id} в getRoomDetails (без уменьшения ходов)`);
            await PvPService.updateEffectsDuration(participant, transaction, false);
          }
        }
      });

      // Обработка эффектов и расчет модификаторов для каждого участника
      for (const participant of participants) {
          
          // Обеспечиваем уникальность ID для эффектов и добавляем информацию о длительности
          participant.effects = participant.effects.map(effect => {
            // Обеспечиваем наличие подтипа и правильного типа у эффекта
            if (effect.name === 'Регенерация') {
              // Явно устанавливаем тип для Регенерации
              effect.type = 'health_regen';
              effect.subtype = 'healing';
              console.log(`[PvP] В getRoomDetails обновлен тип эффекта "Регенерация": ${effect.id}`);
            } else if (effect.name === 'Накопление энергии') {
              // Явно устанавливаем тип для Накопления энергии
              effect.type = 'energy_gain';
              effect.subtype = 'energy_regen'; // Используем подтип energy_regen для периодических эффектов
              
              // Убедимся, что эффект использует временную длительность
              if (!effect.durationMs && effect.duration) {
                // Преобразуем длительность из секунд в миллисекунды
                effect.durationMs = effect.duration * 1000;
                effect.startTime = effect.startTime || effect.appliedAt ? new Date(effect.appliedAt).getTime() : Date.now();
                effect.durationType = 'time';
                
                // Удаляем поля связанные с ходами
                delete effect.elapsedTurns;
                delete effect.remainingTurns;
              }
              
              console.log(`[PvP] В getRoomDetails обновлен тип эффекта "Накопление энергии": ${effect.id}, тип=${effect.type}, подтип=${effect.subtype}, durationType=${effect.durationType}`);
            } else if (effect.name === 'Защита') {
              effect.subtype = 'protection';
            } else if (effect.name === 'Ускорение') {
              effect.subtype = 'speed';
              console.log(`[PvP] В getRoomDetails обновлен тип эффекта "Ускорение": ${effect.id}, подтип=speed`);
            }
            
            // Обеспечиваем уникальность ID
            if (!effect.id) {
              effect.id = `${effect.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            }
            
            // Формируем результат с информацией о длительности
            let result = { ...effect };
            
            // НОВАЯ ЛОГИКА: ВСЕ ЭФФЕКТЫ ОТОБРАЖАЮТСЯ В СЕКУНДАХ
            let remainingSeconds = 0;
            
            // Для эффектов с временем в миллисекундах
            if (effect.durationMs) {
              const now = Date.now();
              const startTime = effect.startTime || new Date(effect.appliedAt || now).getTime();
              const elapsedMs = now - startTime;
              const remainingMs = Math.max(0, effect.durationMs - elapsedMs);
              remainingSeconds = Math.ceil(remainingMs / 1000);
              console.log(`[PvP] Расчет времени для эффекта "${effect.name}": startTime=${startTime}, elapsedMs=${elapsedMs}, remainingMs=${remainingMs}, remainingSeconds=${remainingSeconds}`);
            }
            // Для эффектов со значением duration (преобразуем ходы в секунды)
            else if (effect.duration !== undefined && effect.duration !== null) {
              // Улучшенная проверка: проверяем, что duration существует и не равно null
              // Используем значение duration напрямую, т.к. в БД хранятся секунды
              remainingSeconds = effect.duration;
              console.log(`[PvP] Использование значения duration (${effect.duration}) для эффекта "${effect.name}"`);
              console.log(`[PvP] Использование длительности для эффекта "${effect.name}": duration=${effect.duration} секунд`);
              
              // Добавляем durationMs для дальнейшей обработки
              effect.durationMs = remainingSeconds * 1000;
              effect.startTime = Date.now();
              // Удаляем поля, связанные с ходами
              delete effect.elapsedTurns;
            } else {
              // Если нет ни durationMs, ни duration, определяем длительность по типу эффекта
              
              // Определяем длительность по умолчанию в зависимости от эффекта
              let defaultDuration = 3; // Стандартное значение - 3 секунды
              
              // Здесь можно добавить известные значения длительности для конкретных эффектов из БД
              if (effect.name === 'Накопление энергии') {
                defaultDuration = 7; // Известное значение из БД - 7 секунд
                console.log(`[PvP] Установлено значение длительности из БД для эффекта "Накопление энергии": ${defaultDuration} сек.`);
              }
              
              // Устанавливаем значения
              remainingSeconds = defaultDuration;
              effect.duration = defaultDuration; // Сохраняем duration для будущих обработок
              effect.durationMs = defaultDuration * 1000;
              effect.startTime = Date.now();
              console.log(`[PvP] Установлено время для эффекта "${effect.name}" без длительности: ${defaultDuration} сек.`);
            }
            
            // Проверка и защита от NaN
            if (isNaN(remainingSeconds) || remainingSeconds === undefined) {
              console.log(`[PvP] ВНИМАНИЕ: Обнаружено значение NaN для длительности эффекта "${effect.name}". Устанавливаем значение по умолчанию.`);
              remainingSeconds = 3;
              effect.durationMs = 3000;
              effect.startTime = Date.now();
            }
            
            // Применяем форматирование в секундах для ВСЕХ эффектов
            result = {
              ...result,
              remainingSeconds: remainingSeconds,
              durationUnit: 'seconds', // Всегда используем секунды
              isExpiring: remainingSeconds <= 5,
              displayValue: `${remainingSeconds} сек.`, // Форматированная строка для отображения
              durationType: 'time', // Явно указываем тип длительности - время
              durationFormatted: `${remainingSeconds} сек.` // Дублируем форматирование для совместимости
            };
            
            // Обновляем сам эффект для сохранения в базе данных
            effect.durationMs = effect.durationMs || (remainingSeconds * 1000);
            effect.startTime = effect.startTime || Date.now();
            effect.durationType = 'time';
            // Удаляем свойства системы ходов для предотвращения ошибок
            // НЕ удаляем duration, чтобы сохранить эту информацию для восстановления durationMs при необходимости
            // delete effect.duration;
            delete effect.elapsedTurns;
            delete effect.remainingTurns;
            
            // Логирование для отладки
            console.log(`[PvP] Обработан эффект для участника ${participant.id}:`, {
              id: result.id,
              name: result.name,
              type: result.type,
              subtype: result.subtype
            });
            
            return result;
          });
          
          // Гарантируем, что все эффекты с одинаковыми именами, но разными ID, сохраняются отдельно
          console.log(`[PvP] Всего эффектов для участника ${participant.id}: ${participant.effects.length}`);
        }
        
        // Применяем периодические эффекты для каждого участника
        for (const participant of participants) {
          try {
            const localSequelize = PvPParticipant.sequelize;
            await localSequelize.transaction(async (localTransaction) => {
              // Запоминаем начальные значения для отчета
              const oldHp = participant.current_hp;
              const oldEnergy = participant.current_energy;
              
              // Применяем периодические эффекты (регенерация здоровья, энергии и т.д.)
              const periodicEffectsResults = await PvPService.applyPeriodicEffects(participant, localTransaction);
              
              // ВАЖНО: Обязательно сохраняем обновленные значения после применения эффектов
              await participant.update({
                current_hp: participant.current_hp,  // Обновляем, даже если значение то же самое
                current_energy: participant.current_energy,
                effects_result: periodicEffectsResults
              }, { transaction: localTransaction });
            
            // Получаем эффекты для логирования
            const healingEffects = periodicEffectsResults.filter(r => r.type === 'heal');
            const energyEffects = periodicEffectsResults.filter(r => r.type === 'energy');
            
            if (healingEffects.length > 0 || energyEffects.length > 0) {
              console.log(`[PvP] Применены периодические эффекты для участника ${participant.id} (${participant.username || 'Unknown'}):`, {
                health: healingEffects.length > 0 ? `${oldHp} -> ${participant.current_hp} (+${participant.current_hp - oldHp})` : 'без изменений',
                energy: energyEffects.length > 0 ? `${oldEnergy} -> ${participant.current_energy} (+${participant.current_energy - oldEnergy})` : 'без изменений',
                effectsApplied: periodicEffectsResults.length
              });
            }
          });
        } catch (error) {
          console.error(`[PvP] Ошибка при применении периодических эффектов для участника ${participant.id}:`, error.message);
        }
        
        // Рассчитываем модификаторы от эффектов
        participant.statsModifiers = PvPService.getEffectModifiers(participant);
        
        // Рассчитываем индивидуальный кулдаун с учетом эффектов скорости
        participant.action_cooldown = PvPService.calculateActionCooldown(participant);
        
        // Если у участника есть время последнего действия, рассчитываем оставшееся время до следующего
        if (participant.last_action_time) {
          const now = new Date();
          const lastAction = new Date(participant.last_action_time);
          const elapsedMs = now - lastAction;
          const cooldown = participant.action_cooldown || 5000;
          participant.cooldown_remaining_ms = Math.max(0, cooldown - elapsedMs);
          participant.can_act = elapsedMs >= cooldown;
        } else {
          participant.cooldown_remaining_ms = 0;
          participant.can_act = true;
        }
        
        // Обновляем участника с сохранением эффектов
        await participant.update({
          effects: participant.effects
        });
        
        // Обработка перезарядки
        if (participant.cooldowns) {
          const currentTime = new Date();
          const updatedCooldowns = {};
          let cooldownsChanged = false;
          
          // Проверяем каждую технику в перезарядке
          for (const [techniqueId, cooldownEndTimeStr] of Object.entries(participant.cooldowns)) {
            const cooldownEndTime = new Date(cooldownEndTimeStr);
            
            // Если перезарядка еще не закончилась, сохраняем ее
            if (currentTime < cooldownEndTime) {
              updatedCooldowns[techniqueId] = cooldownEndTimeStr;
            } else {
              cooldownsChanged = true;
            }
          }
          
          // Если были изменения в перезарядке, обновляем запись
          if (cooldownsChanged) {
            await participant.update({
              cooldowns: updatedCooldowns
            });
          }
        }
      }
      
      // Преобразуем данные участников
      const participantsData = participants.map(p => {
        // Убедимся, что все эффекты имеют правильный формат для фронтенда
        const formattedEffects = (p.effects || []).map(effect => {
          // Защита от NaN и неопределенных значений
          if (isNaN(effect.remainingSeconds) || effect.remainingSeconds === undefined) {
            effect.remainingSeconds = 3;
          }
          
          // Гарантируем наличие всех необходимых полей для отображения
          return {
            ...effect,
            // Гарантируем корректный тип длительности
            durationType: 'time',
            // Обеспечиваем разные форматы для совместимости с фронтендом
            displayDuration: `${effect.remainingSeconds} сек.`,
            displayValue: `${effect.remainingSeconds} сек.`,
            formattedDuration: `${effect.remainingSeconds} сек.`,
            // Удаляем все ссылки на ходы
            duration: undefined,
            elapsedTurns: undefined,
            remainingTurns: undefined
          };
        });
        
        console.log(`[PvP] Отформатировано ${formattedEffects.length} эффектов для участника ${p.id}`);
        
        return {
          id: p.id,
          user_id: p.user_id,
          team: p.team,
          position: p.position,
          status: p.status,
          current_hp: p.current_hp,
          max_hp: p.max_hp,
          current_energy: p.current_energy,
          max_energy: p.max_energy,
          level: p.level,
          username: p.user ? p.user.username : 'Unknown',
          effects: formattedEffects,
          cooldowns: p.cooldowns || {}
        };
      });
      
      // Группируем участников по командам
      const teams = {
        1: [],
        2: []
      };
      
      participantsData.forEach(p => {
        if (teams[p.team]) {
          teams[p.team].push(p);
        }
      });
      
      // Получаем историю действий
      const actions = await PvPAction.findAll({
        where: { room_id: roomId },
        include: [
          {
            model: PvPParticipant,
            as: 'actor',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username']
              }
            ]
          },
          {
            model: PvPParticipant,
            as: 'target',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username']
              }
            ]
          }
        ],
        order: [['timestamp', 'DESC']],
        limit: 20
      });
      
      // Преобразуем данные действий
      const actionsData = actions.map(a => ({
        id: a.id,
        participant_id: a.participant_id,
        action_type: a.action_type,
        target_id: a.target_id,
        technique_id: a.technique_id,
        damage: a.damage,
        healing: a.healing,
        timestamp: a.timestamp,
        actor_name: a.actor && a.actor.user ? a.actor.user.username : 'Unknown',
        target_name: a.target && a.target.user ? a.target.user.username : 'Unknown'
      }));
      
      return {
        room: roomData,
        participants: participantsData,
        teams,
        actions: actionsData
      };
    } catch (error) {
      console.error('Ошибка при получении деталей комнаты:', error);
      throw new Error(`Не удалось получить детали комнаты: ${error.message}`);
    }
  }

  /**
   * Присоединение к комнате
   * @param {number} userId - ID пользователя
   * @param {number} roomId - ID комнаты
   * @param {number} team - Номер команды (1 или 2)
   * @param {number} position - Позиция в команде
   * @returns {Promise<Object>} Результат присоединения
   */
  static async joinRoom(userId, roomId, team, position) {
    try {
      // Инициализируем реестр моделей
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const PvPRoom = modelRegistry.getModel('PvPRoom');
      const PvPParticipant = modelRegistry.getModel('PvPParticipant');
      const PvPMode = modelRegistry.getModel('PvPMode');
      const User = modelRegistry.getModel('User');
      
      // Импортируем сервис культивации для получения уровня культивации
      const CultivationService = require('./cultivation-service');
      const sequelize = PvPRoom.sequelize;
      
      // Используем транзакцию для всех операций
      const result = await sequelize.transaction(async (transaction) => {
        // Проверяем, существует ли комната и в каком статусе
        const room = await PvPRoom.findOne({
          where: { id: roomId },
          include: [
            {
              model: PvPMode,
              as: 'pvpMode', // Исправляем алиас на соответствующий определению в модели
              attributes: ['id', 'player_count', 'team_size'] // Добавляем виртуальное поле team_size
            }
          ],
          transaction,
          // Добавляем дополнительные опции для предотвращения неявного выбора всех полей
          subQuery: false
        });
        
        if (!room) {
          throw new Error('Комната не найдена');
        }
        
        if (room.status !== 'waiting') {
          throw new Error('К этой комнате нельзя присоединиться');
        }
        
        // Получаем информацию о пользователе
        const user = await User.findByPk(userId, {
          attributes: ['id'],
          transaction
        });
        
        if (!user) {
          throw new Error('Пользователь не найден');
        }
        
        // Получаем информацию о культивации пользователя из специализированного сервиса
        const cultivationInfo = await CultivationService.getCultivationProgress(userId);
        
        if (!cultivationInfo || !cultivationInfo.level) {
          throw new Error('Не удалось получить уровень культивации пользователя');
        }
        
        const userLevel = cultivationInfo.level;
        console.log(`[PvP] Уровень культивации пользователя ${userId}: ${userLevel}`);
        
        // Проверяем соответствие уровня требованиям комнаты
        if (userLevel < room.min_level) {
          throw new Error(`Ваш уровень культивации (${userLevel}) ниже минимального требуемого уровня (${room.min_level})`);
        }
        
        if (userLevel > room.max_level) {
          throw new Error(`Ваш уровень культивации (${userLevel}) выше максимального допустимого уровня (${room.max_level})`);
        }
        
        // Проверяем, не занята ли позиция
        const existingPosition = await PvPParticipant.findOne({
          where: {
            room_id: roomId,
            team,
            position
          },
          transaction
        });
        
        if (existingPosition) {
          throw new Error('Эта позиция уже занята');
        }
        
        // Проверяем, не состоит ли пользователь уже в этой комнате
        const existingParticipant = await PvPParticipant.findOne({
          where: {
            room_id: roomId,
            user_id: userId
          },
          transaction
        });
        
        if (existingParticipant) {
          // Вместо выбрасывания ошибки, обновляем позицию и команду существующего участника
          
          // Проверяем, что новая позиция не занята другим игроком (кроме текущего)
          const positionTaken = await PvPParticipant.findOne({
            where: {
              room_id: roomId,
              team: team,
              position: position,
              user_id: { [Op.ne]: userId } // Исключаем текущего пользователя
            },
            transaction
          });
          
          if (positionTaken) {
            throw new Error('Эта позиция уже занята другим игроком');
          }
          
          // Сохраняем старые данные для логирования
          const oldTeam = existingParticipant.team;
          const oldPosition = existingParticipant.position;
          
          console.log(`[PvP] Обновление позиции пользователя ${userId} в комнате ${roomId}:`, {
            oldTeam,
            oldPosition,
            newTeam: team,
            newPosition: position
          });
          
          // Обновляем позицию и команду
          await existingParticipant.update({
            team: team,
            position: position
          }, { transaction });
          
          // Возвращаем успех с информацией об обновлении позиции
          const result = {
            success: true,
            message: 'Позиция успешно обновлена',
            positionChanged: true,
            previousTeam: oldTeam,
            previousPosition: oldPosition,
            room: { id: roomId }
          };
          
          // Проверка автоматического старта комнаты
          try {
            // Получаем информацию о комнате и режиме
            const room = await PvPRoom.findByPk(roomId, {
              include: [
                {
                  model: PvPMode,
                  as: 'pvpMode',
                  attributes: ['player_count', 'team_size']
                }
              ],
              transaction
            });
            
            // Если комната уже в процессе или завершена, не начинаем её снова
            if (room && room.status === 'waiting') {
              // Получаем всех участников комнаты
              const allParticipants = await PvPParticipant.findAll({
                where: { room_id: roomId },
                transaction
              });
              
              // Получаем требуемое количество игроков в команде из режима
              // team_size теперь виртуальное поле, автоматически вычисляемое из player_count
              const teamSize = room.pvpMode?.team_size || Math.ceil((room.pvpMode?.player_count || 2) / 2);
              
              // Считаем количество игроков в каждой команде
              const team1Count = allParticipants.filter(p => p.team === 1 || p.team === '1').length;
              const team2Count = allParticipants.filter(p => p.team === 2 || p.team === '2').length;
              
              console.log(`[PvP] Проверка автоматического начала для комнаты ${roomId}:`, {
                teamSize,
                team1Count,
                team2Count,
                roomStatus: room.status
              });
              
              // Комната начинается, если обе команды заполнены
              if (team1Count >= teamSize && team2Count >= teamSize) {
                result.roomStarted = true;
              }
            }
          } catch (error) {
            console.error('[PvP] Ошибка при проверке автоматического начала комнаты:', error);
          }
          
          // Не вызываем commit здесь, чтобы избежать ошибки "Transaction cannot be committed because it has been finished"
          // Транзакция будет автоматически закоммичена после выполнения переданной в sequelize.transaction функции
          return result;
        }
        
        console.log('[PvP] Присоединение нового пользователя:', {
          userId,
          roomId,
          team,
          position,
          level: userLevel
        });
        
        // Получаем характеристики игрока для расчета HP и других параметров
        const CharacterStatsService = require('./character-stats-service');
        let baseHp = 100;
        let baseEnergy = 100;
        
        try {
          // Получаем характеристики игрока
          const playerStats = await CharacterStatsService.getSecondaryStats(userId);
          
          // Используем характеристики для расчета HP, если они доступны
          if (playerStats && playerStats.health) {
            baseHp = Math.max(100, 50 + (userLevel * 10) + (playerStats.health * 2));
          } else {
            baseHp = 200 + (userLevel * 20);
          }
          
          // Используем характеристики для расчета энергии, если они доступны
          if (playerStats && playerStats.energy) {
            baseEnergy = Math.max(50, 30 + (userLevel * 5) + (playerStats.energy * 1.5));
          } else {
            baseEnergy = 100 + (userLevel * 10);
          }
          
          console.log(`[PvP] Рассчитаны базовые характеристики для игрока ${userId}:`, {
            level: userLevel,
            baseHp,
            baseEnergy
          });
        } catch (error) {
          console.error(`[PvP] Ошибка при получении характеристик для расчета HP: ${error.message}`);
          // Продолжаем с базовыми значениями
          baseHp = 200 + (userLevel * 20);
          baseEnergy = 100 + (userLevel * 10);
        }
        
        // Присоединяем нового пользователя к комнате
        await PvPParticipant.create({
          room_id: roomId,
          user_id: userId,
          team,
          position,
          status: 'active',
          current_hp: baseHp,
          max_hp: baseHp,
          current_energy: baseEnergy,
          max_energy: baseEnergy,
          // Используем полученный из сервиса культивации уровень
          level: userLevel,
          // Инициализируем время последнего действия
          // Устанавливаем время в прошлом, чтобы игрок мог сразу выполнить действие
          last_action_time: new Date(Date.now() - 10000) // 10 секунд назад
        }, { transaction });
        
        // Сохраняем характеристики игрока в таблицу pvp_player_stats
        await this.savePlayerStats(userId, roomId, transaction);
        
        // Проверяем, заполнена ли комната для старта боя
        const totalParticipants = await PvPParticipant.count({
          where: { room_id: roomId },
          transaction
        });
        
        let roomStarted = false;
        
        // Если комната заполнена, меняем статус на in_progress
        if (totalParticipants === room.pvpMode.player_count) {
          await room.update({
            status: 'in_progress',
            start_time: new Date()
          }, { transaction });
          
          roomStarted = true;
        }
        
        return {
          success: true,
          message: 'Вы успешно присоединились к комнате',
          roomStarted
        };
      });
      
      return result;
    } catch (error) {
      console.error('Ошибка при присоединении к комнате:', error);
      throw new Error(`Не удалось присоединиться к комнате: ${error.message}`);
    }
  }

  /**
   * Выполнение действия в бою
   * @param {number} userId - ID пользователя
   * @param {number} roomId - ID комнаты
   * @param {string} actionType - Тип действия (attack, defend, technique)
   * @param {number} targetId - ID цели (для атаки)
   * @param {string} techniqueId - ID техники (для использования техники)
   * @returns {Promise<Object>} Результат действия
   */
  static async performAction(userId, roomId, actionType, targetId, techniqueId) {
    try {
      // Инициализируем реестр моделей
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const PvPRoom = modelRegistry.getModel('PvPRoom');
      const PvPParticipant = modelRegistry.getModel('PvPParticipant');
      const PvPAction = modelRegistry.getModel('PvPAction');
      const sequelize = PvPRoom.sequelize;
      
      // Используем транзакцию для всех операций
      const result = await sequelize.transaction(async (transaction) => {
        // Проверяем, существует ли комната и в каком статусе
        const room = await PvPRoom.findByPk(roomId, { transaction });
        
        if (!room) {
          throw new Error('Комната не найдена');
        }
        
        if (room.status !== 'in_progress') {
          throw new Error('Бой не начался или уже завершен');
        }
        
        // Получаем участника пользователя
        const participant = await PvPParticipant.findOne({
          where: {
            room_id: roomId,
            user_id: userId
          },
          transaction
        });
        
        if (!participant) {
          throw new Error('Вы не являетесь участником этого боя');
        }
        
        if (participant.status !== 'active') {
          throw new Error('Вы не можете выполнять действия');
        }
        
        // Проверка возможности выполнения действия с учетом эффектов
        const actionCheck = PvPService.canPerformAction(participant);
        if (!actionCheck.canAct) {
          if (actionCheck.reason === 'Оглушение') {
            throw new Error(`Вы оглушены и не можете действовать (осталось: ${actionCheck.remainingSeconds} сек.)`);
          } else if (actionCheck.reason === 'Таймаут') {
            throw new Error(`Слишком частые действия. Подождите еще ${actionCheck.remainingSeconds} секунд`);
          } else {
            throw new Error(`Невозможно выполнить действие: ${actionCheck.reason}`);
          }
        }
        
        // СНАЧАЛА обновляем счетчик ходов для эффектов ПЕРЕД применением других эффектов
        console.log(`[PvP] Обновление длительности эффектов для активного участника ${participant.id} ПЕРЕД действием`);
        await PvPService.updateEffectsDuration(participant, transaction, true);
        
        // Обновление/применение периодических эффектов в начале хода (регенерация и т.д.)
        const periodicEffectsResults = await PvPService.applyPeriodicEffects(participant, transaction);
        
        // Применение эффектов, активируемых при действиях (накопление энергии)
        const actionEffectsResults = await PvPService.applyActionBasedEffects(participant, transaction);
        
        if (actionEffectsResults.length > 0) {
          console.log(`[PvP] Применены эффекты при действии для активного участника ${participant.id}:`,
            actionEffectsResults.map(r => ({
              type: r.type,
              amount: r.amount,
              effectName: r.effectName
            })));
        }
        
        // Если участник побежден от периодических эффектов, не позволяем ему действовать
        if (periodicEffectsResults.some(r => r.type === 'status' && r.status === 'defeated')) {
          throw new Error('Вы побеждены и не можете выполнять действия');
        }
        
        let damage = 0;
        let healing = 0;
        let energyCost = 0;
        let battleLogs = []; // Инициализируем массив для хранения логов боя
        
        // Обработка действий
        switch (actionType) {
          case 'attack':
            // Проверяем, что цель указана и действительна
            if (!targetId) {
              throw new Error('Не указана цель для атаки');
            }
            
            const target = await PvPParticipant.findOne({
              where: {
                id: targetId,
                room_id: roomId
              },
              transaction
            });
            
            if (!target) {
              throw new Error('Цель не найдена');
            }
            
            if (target.status !== 'active') {
              throw new Error('Невозможно атаковать эту цель');
            }
            
            // Также обновляем эффекты для цели атаки
            console.log(`[PvP] Обновление длительности эффектов для цели атаки ${target.id}`);
            await PvPService.updateEffectsDuration(target, transaction, true);
            
            if (target.team === participant.team) {
              throw new Error('Невозможно атаковать союзника');
            }
            
            // Базовый урон для обычной атаки
            const baseDamage = 10;
            energyCost = 0; // Устанавливаем стоимость обычной атаки в 0 энергии
            
            // Проверка энергии больше не нужна, так как стоимость обычной атаки 0
            
            // Расчет урона с учетом характеристик
            const damageResult = await PvPService.calculateDamage(participant, target, baseDamage, 'physical', 'attack');
            damage = damageResult.damage;
            
            if (damageResult.isDodged) {
              console.log(`[PvP] ${target.username || 'Цель'} уклонился от обычной атаки ${participant.username || 'атакующего'}`);
              
              // Добавляем сообщение в лог
              battleLogs.push({
                type: 'dodge',
                attackerId: participant.id,
                targetId: target.id,
                message: `${target.username || 'Цель'} уклонился от атаки (шанс: ${damageResult.dodgeChance.toFixed(1)}%)`
              });
            } else {
              console.log(`[PvP] Нанесение урона обычной атакой: ${damage}${damageResult.isCritical ? ' (критический удар)' : ''}`);
              
              // Добавляем запись в боевой лог для обычной атаки или критического удара
              if (damageResult.isCritical) {
                battleLogs.push({
                  type: 'critical_hit',
                  attackerId: participant.id,
                  targetId: target.id,
                  damage: damage,
                  message: `${participant.username || 'Атакующий'} наносит критический удар: ${damage} урона! (шанс: ${damageResult.critChance.toFixed(1)}%)`
                });
              } else {
                battleLogs.push({
                  type: 'hit',
                  attackerId: participant.id,
                  targetId: target.id,
                  damage: damage,
                  message: `${participant.username || 'Атакующий'} наносит ${damage} урона`
                });
              }
            }
            
            // Обновляем энергию атакующего
            await participant.update({
              current_energy: participant.current_energy - energyCost
            }, { transaction });
            
            // Обновляем HP цели только если не было уклонения
            if (!damageResult.isDodged) {
              const newHp = Math.max(0, target.current_hp - damage);
              console.log(`[PvP] Обновление здоровья цели ${target.id}: ${target.current_hp} -> ${newHp}, урон: ${damage}`);
              
              await target.update({
                current_hp: newHp,
                status: newHp <= 0 ? 'defeated' : 'active'
              }, { transaction });
              
              console.log(`[PvP] Участник ${participant.id} (игрок ${userId}) нанес урон: ${damage}. Здоровье цели ${target.id}: ${newHp}`);
              
              // Проверка обновления HP
              const updatedTarget = await PvPParticipant.findByPk(target.id, { transaction });
              console.log(`[PvP] Проверка обновления здоровья: ${updatedTarget.current_hp}, статус: ${updatedTarget.status}`);
            }
            
            // Обновляем общий урон атакующего независимо от уклонения
            await participant.update({
              total_damage: sequelize.literal(`COALESCE(total_damage, 0) + ${damage}`)
            }, { transaction });
            
            break;
            
          case 'defense': // Изменено с 'defend' на 'defense' для соответствия с ActionPanel.js
            // Проверяем, что не указана цель (или целью является сам игрок)
            if (targetId && Number(targetId) !== Number(participant.id)) {
              console.log(`[PvP] Предупреждение: Для действия защиты указана цель ${targetId}, но это действие не требует цели. Игнорируем цель.`);
              // Для защиты цель не требуется, поэтому игнорируем targetId, если он указан
            }
            
            // Защита - восстанавливает энергию и создает эффект снижения урона
            const energyGain = 20;
            
            // Получаем текущие эффекты участника
            const currentEffects = participant.effects || [];
            
            // Получаем модель из реестра (используем существующую переменную)
            // Обратите внимание, что TechniqueEffect уже объявлен ниже в коде
            
            // Ищем эффект "Защита" в БД
            const defenseEffectData = await modelRegistry.getModel('TechniqueEffect').findOne({
              where: {
                name: 'Защита',
                type: 'protect'
              },
              transaction
            });
            
            // Получаем длительность из БД или используем значение по умолчанию (2)
            const defenseDuration = defenseEffectData ? defenseEffectData.duration : null;
            
            // Логируем предупреждение, если duration отсутствует в БД
            if (defenseDuration === null) {
              console.log(`[PvP ПРЕДУПРЕЖДЕНИЕ] Эффект "Защита" не имеет значения duration в БД`);
            }
            const defenseDurationMs = defenseDuration * 1000; // Конвертируем секунды из БД в миллисекунды
            
            
            // Создаем эффект защиты в новом формате с уникальным ID
            const uniqueDefenseId = `defense_effect_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const defenseEffect = {
              id: uniqueDefenseId,
              name: 'Защита',
              icon: '🛡️',
              type: 'buff',
              subtype: 'protection',   // Используем стандартизированный подтип для определения механики
              durationMs: defenseDurationMs, // Длительность из БД в миллисекундах
              startTime: Date.now(),   // Время начала эффекта
              durationType: 'time',    // Тип длительности - время
              value: 40,               // Значение защиты в процентах
              appliedAt: new Date().toISOString()
            };
            
            console.log(`[PvP] Создан эффект защиты с ID: ${uniqueDefenseId}, длительность: ${defenseDuration * 3} сек. (из БД: ${defenseDuration})`);
            
            console.log(`[PvP] Применение защиты для игрока ${participant.user_id} (${participant.id}). Добавлен эффект защиты (${defenseEffect.value}%) и восстановлено ${energyGain} энергии`);
            
            // Обновляем участника - добавляем энергию и эффект защиты
            await participant.update({
              current_energy: Math.min(participant.max_energy, participant.current_energy + energyGain),
              effects: [...currentEffects, defenseEffect]
            }, { transaction });
            
            // Проверяем, что эффект действительно применился
            const updatedParticipant = await PvPParticipant.findByPk(participant.id, { transaction });
            console.log(`[PvP] Проверка применения защиты:`, {
              previousEffectsCount: currentEffects.length,
              currentEffectsCount: updatedParticipant.effects ? updatedParticipant.effects.length : 0,
              energyBefore: participant.current_energy,
              energyAfter: updatedParticipant.current_energy
            });
            
            break;
            
          case 'speed':
            // Проверяем, что не указана цель (или целью является сам игрок)
            if (targetId && Number(targetId) !== Number(participant.id)) {
              console.log(`[PvP] Предупреждение: Для действия ускорения указана цель ${targetId}, но это действие не требует цели. Игнорируем цель.`);
              // Для ускорения цель не требуется, поэтому игнорируем targetId, если он указан
            }
            
            // Ускорение - создает эффект увеличения скорости и шанса уклонения
            const speedEnergyCost = 25; // Затраты энергии
            
            // Получаем текущие эффекты участника
            const currentSpeedEffects = participant.effects || [];
            
            // Ищем эффект "Ускорение" в БД
            const speedEffectData = await modelRegistry.getModel('TechniqueEffect').findOne({
              where: {
                name: 'Ускорение',
                type: 'buff'
              },
              transaction
            });
            
            // Получаем длительность только из БД
            const speedDuration = speedEffectData ? speedEffectData.duration : null;
            
            // Логируем предупреждение, если duration отсутствует в БД
            if (speedDuration === null) {
              console.log(`[PvP ПРЕДУПРЕЖДЕНИЕ] Эффект "Ускорение" не имеет значения duration в БД`);
            }
            const speedDurationMs = speedDuration * 1000; // Конвертируем секунды из БД в миллисекунды
            
            
            // Создаем эффект ускорения в новом формате с уникальным ID
            const uniqueSpeedId = `speed_effect_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const speedEffect = {
              id: uniqueSpeedId,
              name: 'Ускорение',
              icon: '⚡',
              type: 'buff',
              subtype: 'speed',         // Используем стандартизированный подтип для определения механики
              durationMs: speedDurationMs, // Длительность из БД в миллисекундах
              startTime: Date.now(),    // Время начала эффекта
              durationType: 'time',     // Тип длительности - время
              value: 30,                // Значение скорости в процентах (снижение времени перезарядки и увеличение шанса уклонения)
              appliedAt: new Date().toISOString()
            };
            
            console.log(`[PvP] Создан эффект ускорения с ID: ${uniqueSpeedId}, длительность: ${speedDuration * 3} сек. (из БД: ${speedDuration})`);
            
            console.log(`[PvP] Применение ускорения для игрока ${participant.user_id} (${participant.id}). Добавлен эффект ускорения (${speedEffect.value}%) и потрачено ${speedEnergyCost} энергии`);
            
            // Проверяем, достаточно ли энергии
            if (participant.current_energy < speedEnergyCost) {
              throw new Error(`Недостаточно энергии для применения ускорения. Требуется: ${speedEnergyCost}, имеется: ${participant.current_energy}`);
            }
            
            // Обновляем участника - вычитаем энергию и добавляем эффект ускорения
            await participant.update({
              current_energy: Math.max(0, participant.current_energy - speedEnergyCost),
              effects: [...currentSpeedEffects, speedEffect]
            }, { transaction });
            
            // Проверяем, что эффект действительно применился
            const updatedSpeedParticipant = await PvPParticipant.findByPk(participant.id, { transaction });
            console.log(`[PvP] Проверка применения ускорения:`, {
              previousEffectsCount: currentSpeedEffects.length,
              currentEffectsCount: updatedSpeedParticipant.effects ? updatedSpeedParticipant.effects.length : 0,
              energyBefore: participant.current_energy + speedEnergyCost,
              energyAfter: updatedSpeedParticipant.current_energy
            });
            
            break;
            
          case 'technique':
            // Использование техники
            if (!techniqueId) {
              throw new Error('Не указана техника для использования');
            }
            
            // Получаем данные о технике только из базы данных
            console.log(`[DEBUG] PvPService: Ищем технику ${techniqueId} в базе данных`);
            
            // Получаем модели из реестра
            const Technique = modelRegistry.getModel('Technique');
            const TechniqueEffect = modelRegistry.getModel('TechniqueEffect');
            
            // Ищем технику в базе данных вместе с эффектами
            const dbTechnique = await Technique.findByPk(techniqueId, {
              include: [
                {
                  model: TechniqueEffect,
                  as: 'effects'
                }
              ],
              transaction
            });
            
            if (!dbTechnique) {
              throw new Error('Указанная техника не найдена');
            }
            
            console.log(`[DEBUG] PvPService: Техника ${techniqueId} найдена в базе данных: ${dbTechnique.name}`);
            
            // Преобразуем эффекты техники из базы данных в формат, необходимый для боевой системы
            const techniqueEffects = dbTechnique.effects ? dbTechnique.effects.map(effect => {
              // Проверяем наличие duration в эффекте из БД
              if (effect.duration === undefined || effect.duration === null) {
                console.log(`[PvP ПРЕДУПРЕЖДЕНИЕ] Эффект ${effect.id} (${effect.name}) не имеет значения duration в БД`);
              }
              
              return {
                id: effect.id,
                name: effect.name,
                icon: effect.icon || '✨',
                type: effect.type || 'buff',
                duration: effect.duration, // Сохраняем оригинальное значение duration из БД
                durationMs: effect.duration * 1000, // Конвертируем секунды из БД в миллисекунды
                startTime: Date.now(),
                durationType: 'time',
                damage_over_time: effect.damage_over_time,
                healing_over_time: effect.healing_over_time,
                damage_reduction: effect.damage_reduction,
                damage_bonus: effect.damage_bonus,
                energy_regen: effect.energy_regen
              };
            }) : [];
            
            // Функция для определения targetType техники
            function determineTargetType(dbTechnique) {
              // Если target_type явно указан в базе, используем его
              if (dbTechnique.target_type) {
                console.log(`[DEBUG] PvPService: Техника ${dbTechnique.id} имеет явно указанный target_type: ${dbTechnique.target_type}`);
                return dbTechnique.target_type;
              }
              
              // Специальные проверки для конкретных техник
              if (dbTechnique.id === 'heavenly_breath') {
                console.log(`[DEBUG] PvPService: Техника "Дыхание Небес" автоматически получает targetType: ${targetTypes.SELF}`);
                return targetTypes.SELF;
              }
              
              // Для культивационных техник по умолчанию применяем к себе
              if (dbTechnique.type === 'cultivation') {
                console.log(`[DEBUG] PvPService: Техника ${dbTechnique.id} имеет тип cultivation, устанавливаем targetType: ${targetTypes.SELF}`);
                return targetTypes.SELF;
              }
              
              // Некоторые типы техник по умолчанию применяются к себе
              if (['meditation', 'cultivation', 'transformation'].includes(dbTechnique.type)) {
                console.log(`[DEBUG] PvPService: Техника ${dbTechnique.id} имеет тип ${dbTechnique.type}, устанавливаем targetType: ${targetTypes.SELF}`);
                return targetTypes.SELF;
              }
              
              // По умолчанию для остальных - требуется цель
              console.log(`[DEBUG] PvPService: Техника ${dbTechnique.id} по умолчанию получает targetType: ${targetTypes.SINGLE}`);
              return targetTypes.SINGLE;
            }
            
            // Преобразуем технику из базы данных в формат, необходимый для боевой системы
            const technique = {
              id: dbTechnique.id,
              name: dbTechnique.name,
              description: dbTechnique.description,
              targetType: determineTargetType(dbTechnique),
              damageType: dbTechnique.damage_type || damageTypes.PHYSICAL,
              damage: dbTechnique.damage || 0,
              energyCost: dbTechnique.energy_cost || 0,
              cooldown: dbTechnique.cooldown || 0,
              effects: techniqueEffects
            };
            
            console.log(`[DEBUG] PvPService: Техника ${techniqueId} имеет ${techniqueEffects.length} эффектов`);
            
            // Определяем, является ли техника атакующей (требует цель)
            const isTechniqueAttack = async () => {
              // Специальная проверка для техники "Удар кулака"
              if (dbTechnique.id === 'basic_punch' ||
                  dbTechnique.name === 'Удар кулака' ||
                  dbTechnique.name?.toLowerCase().includes('удар кулака')) {
                console.log(`[DEBUG] PvPService: Обнаружена техника "Удар кулака" (${dbTechnique.id}), считаем её атакующей`);
                return true;
              }
              
              // Специальная проверка для техники "Дыхание Небес"
              if (dbTechnique.id === 'heavenly_breath') {
                console.log(`[DEBUG] PvPService: Обнаружена техника "Дыхание Небес", не требует выбора цели`);
                return false;
              }
              
              // Получаем тип техники из базы данных
              const techniqueType = dbTechnique.type;
              console.log(`[DEBUG] PvPService: Техника ${techniqueId} (${dbTechnique.name}) имеет тип: ${techniqueType}`);
              
              // Если тип техники явно определен как "attack", то требуется выбор цели
              const isAttack = techniqueType === 'attack';
              
              // Также проверяем урон - если техника наносит урон, то вероятно это атака
              const hasDamage = dbTechnique.damage !== undefined && dbTechnique.damage > 0;
              
              console.log(`[DEBUG] PvPService: Техника ${techniqueId} (${dbTechnique.name}):
                isAttack=${isAttack},
                hasDamage=${hasDamage},
                damage=${dbTechnique.damage || 0}`);
              
              // Техника требует выбор цели, если она имеет тип "attack" или наносит урон
              return isAttack || hasDamage;
            };
            
            // Получаем результат проверки один раз
            const isAttackTechnique = await isTechniqueAttack();
            console.log(`[DEBUG] PvPService: Техника ${techniqueId} (${dbTechnique.name}): isAttackTechnique=${isAttackTechnique}`);
            
            // Проверяем, что цель указана для техник, требующих цель
            if (!targetId && isAttackTechnique) {
              throw new Error(`Не указана цель для атакующей техники "${dbTechnique.name}"`);
            }
            
            // Расчет урона и затрат энергии
            damage = technique.damage;
            // Установим стандартное значение затраты энергии для техники (в 2 раза больше, чем для атаки)
            energyCost = technique.energyCost || 20; // Если энергия не определена в технике, используем значение по умолчанию
            
            // Проверяем достаточность энергии
            if (participant.current_energy < energyCost) {
              throw new Error('Недостаточно энергии для использования техники');
            }
            
            // Удаляем проверку кулдаунов для техник, оставляя только общий таймаут между действиями
            
            // Определяем цель в зависимости от типа техники
            let techTarget;
            if (technique.targetType === targetTypes.SELF || !targetId) {
              // Если техника применяется к себе или цель не указана для не-атакующих техник
              techTarget = participant;
            } else {
              techTarget = await PvPParticipant.findOne({
                where: {
                  id: targetId,
                  room_id: roomId
                },
                transaction
              });
              
              if (!techTarget) {
                throw new Error('Цель не найдена');
              }
              
              if (technique.targetType === targetTypes.SINGLE && techTarget.team === participant.team && technique.damage > 0) {
                throw new Error('Невозможно атаковать союзника');
              }
            }
            
            // Обновляем эффекты для цели техники, если это не сам игрок
            if (techTarget && techTarget.id !== participant.id) {
              console.log(`[PvP] Обновление длительности эффектов для цели техники ${techTarget.id}`);
              await PvPService.updateEffectsDuration(techTarget, transaction, true);
            }
            
            // Обновляем энергию атакующего
            await participant.update({
              current_energy: participant.current_energy - energyCost
            }, { transaction });
            
            // Удаляем установку кулдаунов для техник
            // Оставляем только общий таймаут между действиями в 5 секунд
            
            // Применяем эффекты техники
            if (technique.effects && technique.effects.length > 0) {
              // Определяем цель для наложения эффектов в зависимости от типа техники и её целевого назначения
              let effectTarget;
              
              // Если техника атакующая, эффекты накладываются на цель
              if (technique.type === 'attack' || (technique.damage > 0 && techTarget.id !== participant.id)) {
                // Для атакующих техник эффекты накладываются на противника
                effectTarget = techTarget;
              } else {
                // Для защитных и нейтральных техник эффекты накладываются на себя
                effectTarget = participant;
              }
              
              console.log(`[PvP] Применение эффектов техники ${technique.name} (${technique.type || 'неизвестный тип'}) на ${effectTarget.id === participant.id ? 'себя' : 'противника'}`);
              
              // Получаем текущие эффекты цели
              const currentEffects = effectTarget.effects || [];
              
              // Добавляем новые эффекты с гарантировано уникальными ID
              const effectPromises = technique.effects.map(async effect => {
                // Определяем правильный тип и подтип эффекта
                let newType = effect.type;
                let subtype = effect.subtype;
                
                // Особая обработка для Регенерации и Накопления энергии
                if (effect.name === 'Регенерация') {
                  newType = 'health_regen'; // Изменяем тип
                  subtype = 'healing';
                  console.log(`[PvP] Изменен тип для нового эффекта "Регенерация": ${newType}`);
                } else if (effect.name === 'Накопление энергии') {
                  newType = 'energy_gain'; // Изменяем тип
                  subtype = 'energy_gain';
                  console.log(`[PvP] Изменен тип для нового эффекта "Накопление энергии": ${newType}`);
                } else if (effect.name === 'Защита') {
                  subtype = 'protection';
                } else if (effect.name === 'Ускорение') {
                  subtype = 'speed';
                  console.log(`[PvP] Установлен подтип 'speed' для нового эффекта "Ускорение"`);
                }
                
                // Генерируем уникальный ID на основе имени, типа и времени
                const uniqueId = effect.id ||
                  `${effect.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                
                console.log(`[PvP] Создан новый эффект от техники:`, {
                  name: effect.name,
                  type: newType,
                  originalType: effect.type,
                  subtype: subtype,
                  id: uniqueId
                });
                
                // Создаем эффект с учетом типа длительности (ходы или время)
                let effectData = {
                  id: uniqueId,
                  name: effect.name,
                  icon: effect.icon,
                  type: newType, // Используем новый тип
                  subtype: subtype, // Добавляем подтип
                  tickRate: effect.tickRate,
                  damageReduction: effect.effect && effect.effect(1).defenseBonus ? effect.effect(1).defenseBonus : undefined,
                  damageBonus: effect.effect && effect.effect(1).damageBonus ? effect.effect(1).damageBonus : undefined,
                  appliedAt: new Date().toISOString()
                };

                // ИЗМЕНЕНО: ВСЕ ЭФФЕКТЫ ТЕПЕРЬ ИСПОЛЬЗУЮТ ВРЕМЕННУЮ ДЛИТЕЛЬНОСТЬ
                
                // Получаем базовую длительность эффекта из БД
                let baseDuration = effect.duration;
                
                // Получаем информацию о выученной технике для масштабирования длительности эффектов
                let techniqueLevel = 1;
                try {
                  // Используем уже имеющуюся модель LearnedTechnique
                  const LearnedTechnique = modelRegistry.getModel('LearnedTechnique');
                  
                  const learnedTechnique = await LearnedTechnique.findOne({
                    where: {
                      userId: participant.user_id,
                      techniqueId: techniqueId
                    },
                    transaction
                  });
                  
                  if (learnedTechnique) {
                    techniqueLevel = learnedTechnique.level;
                    console.log(`[PvP] Масштабирование эффекта "${effect.name}" с учетом уровня техники ${techniqueLevel}`);
                  }
                } catch (error) {
                  console.error(`[PvP] Ошибка при получении уровня техники для масштабирования эффекта:`, error);
                }
                
                // Проверяем наличие duration в эффекте из БД
                if (baseDuration === undefined || baseDuration === null) {
                  console.log(`[PvP ПРЕДУПРЕЖДЕНИЕ] Эффект ${effect.id || effect.name} не имеет значения duration в БД`);
                  
                  // Устанавливаем значение по умолчанию в зависимости от типа эффекта
                  if (effect.name === 'Накопление энергии') {
                    baseDuration = 7; // Известное значение из БД
                    console.log(`[PvP] Установлено значение по умолчанию для эффекта "Накопление энергии": ${baseDuration} сек.`);
                  } else if (effect.name === 'Регенерация') {
                    baseDuration = 5; // Известное значение из БД
                    console.log(`[PvP] Установлено значение по умолчанию для эффекта "Регенерация": ${baseDuration} сек.`);
                  } else if (effect.name === 'Духовная защита') {
                    baseDuration = 7; // Известное значение из БД
                    console.log(`[PvP] Установлено значение по умолчанию для эффекта "Духовная защита": ${baseDuration} сек.`);
                  } else {
                    baseDuration = 3; // Стандартное значение для остальных эффектов
                    console.log(`[PvP] Установлено стандартное значение для эффекта "${effect.name}": ${baseDuration} сек.`);
                  }
                }
                
                // Определяем длительность в миллисекундах в зависимости от типа эффекта
                // Масштабируем длительность эффекта в зависимости от уровня техники
                // Формула: каждый уровень техники добавляет 5% к длительности эффекта
                const durationMultiplier = 1 + (0.05 * (techniqueLevel - 1));
                
                if (effect.name === 'Регенерация') {
                  // Используем длительность из БД для Регенерации (значение в секундах)
                  const scaledDuration = Math.floor(baseDuration * durationMultiplier);
                  effectData.durationMs = scaledDuration * 1000;
                  effectData.duration = scaledDuration; // Сохраняем масштабированное значение duration
                  console.log(`[PvP] Длительность эффекта "Регенерация" масштабирована: ${baseDuration} → ${scaledDuration} сек. (x${durationMultiplier.toFixed(2)})`);
                } else if (effect.name === 'Накопление энергии') {
                  // Длительность для Накопления энергии (значение в секундах)
                  const scaledDuration = Math.floor(baseDuration * durationMultiplier);
                  effectData.durationMs = scaledDuration * 1000;
                  effectData.duration = scaledDuration; // Сохраняем масштабированное значение duration
                  // Устанавливаем значение регенерации энергии из характеристики
                  // Значение регенерации энергии также масштабируется с уровнем техники
                  const baseValue = effect.value || 5;
                  const valueMultiplier = 1 + (0.1 * (techniqueLevel - 1)); // +10% за уровень для значения
                  effectData.value = Math.floor(baseValue * valueMultiplier);
                  console.log(`[PvP] Длительность эффекта "Накопление энергии" масштабирована: ${baseDuration} → ${scaledDuration} сек. (x${durationMultiplier.toFixed(2)})`);
                  console.log(`[PvP] Значение эффекта "Накопление энергии" масштабировано: ${baseValue} → ${effectData.value} (x${valueMultiplier.toFixed(2)})`);
                } else {
                  // Для всех остальных эффектов - базовая длительность в секундах
                  const scaledDuration = Math.floor(baseDuration * durationMultiplier);
                  effectData.durationMs = scaledDuration * 1000;
                  effectData.duration = scaledDuration; // Сохраняем масштабированное значение duration
                  console.log(`[PvP] Длительность эффекта "${effect.name}" масштабирована: ${baseDuration} → ${scaledDuration} сек. (x${durationMultiplier.toFixed(2)})`);
                }
                
                // Общие параметры для всех эффектов, основанных на времени
                effectData.startTime = Date.now();
                effectData.durationType = 'time';
                
                console.log(`[PvP] Установлена временная длительность для эффекта "${effect.name}": ${effectData.durationMs}ms (${baseDuration} секунд из БД)`);

                return effectData;
              });
              
              // Ожидаем завершения всех асинхронных операций в map
              const newEffects = await Promise.all(effectPromises);
              
              console.log(`[PvP] Создано эффектов от техники ${technique.name}: ${newEffects.length}`,
                newEffects.map(e => ({ id: e.id, name: e.name, subtype: e.subtype })));
              
              // Обновляем эффекты цели
              await effectTarget.update({
                effects: [...currentEffects, ...newEffects]
              }, { transaction });
            }
            
            // Определяем, должна ли техника наносить урон
            let shouldApplyDamage = false;

            // Урон наносится только если техника имеет урон > 0
            if (technique.damage > 0) {
              // Проверяем тип техники и цель
              if (technique.type === 'attack' || !technique.type) {
                // Атакующие техники или техники без явного типа наносят урон только по противнику
                shouldApplyDamage = (techTarget.id !== participant.id);
              } else if (technique.type === 'heal' || technique.type === 'buff') {
                // Лечащие техники и баффы не наносят урон
                shouldApplyDamage = false;
              } else {
                // Для других типов техник, урон наносится в зависимости от targetType
                if (technique.targetType === targetTypes.SELF) {
                  // Техники с целью на себя наносят урон только себе
                  shouldApplyDamage = (techTarget.id === participant.id);
                } else {
                  // Техники с целью на противника наносят урон только противнику
                  shouldApplyDamage = (techTarget.id !== participant.id);
                }
              }
            } else {
              // Если урон техники равен 0, не наносим урон
              shouldApplyDamage = false;
            }

            console.log(`[PvP] Проверка условия нанесения урона для техники ${technique.name} (${technique.type}):`, {
              damage: technique.damage,
              type: technique.type,
              targetType: technique.targetType,
              isSelf: techTarget.id === participant.id,
              shouldApplyDamage
            });

            if (shouldApplyDamage) {
              const damageResult = await PvPService.calculateDamage(participant, techTarget, technique.damage, technique.damageType, 'technique', techniqueId);
              damage = damageResult.damage;
              
              // Проверяем на уклонение
              if (damageResult.isDodged) {
                console.log(`[PvP] ${techTarget.username || 'Цель'} уклонился от техники ${technique.name} ${participant.username || 'атакующего'}`);
                
                // Добавляем сообщение в лог
                battleLogs.push({
                  type: 'dodge',
                  attackerId: participant.id,
                  targetId: techTarget.id,
                  message: `${techTarget.username || 'Цель'} уклонился от техники ${technique.name} (шанс: ${damageResult.dodgeChance.toFixed(1)}%)`
                });
              }
              
              // Добавляем специальное логирование для техники "Удар кулака"
              if (technique.name === 'Удар кулака') {
                console.log(`[PvP] Детальная информация о технике "Удар кулака":`, {
                  technique: {
                    id: technique.id,
                    name: technique.name,
                    damage: technique.damage,
                    damageType: technique.damageType,
                    type: technique.type
                  },
                  target: techTarget ? {
                    id: techTarget.id,
                    user_id: techTarget.user_id,
                    current_hp: techTarget.current_hp
                  } : null,
                  calculatedDamage: damage,
                  damageResult: damageResult
                });
              }
              
              // Обрабатываем урон и обновляем HP только если не было уклонения
              if (!damageResult.isDodged) {
                console.log(`[PvP] Нанесение урона техникой ${technique.name} (${technique.type}): ${damage}${damageResult.isCritical ? ' (критический удар)' : ''}`);
                
                // Добавляем запись в боевой лог для критического удара техникой
                if (damageResult.isCritical) {
                  battleLogs.push({
                    type: 'critical_hit',
                    attackerId: participant.id,
                    targetId: techTarget.id,
                    damage: damage,
                    message: `${participant.username || 'Атакующий'} наносит критический удар техникой ${technique.name}: ${damage} урона! (шанс: ${damageResult.critChance.toFixed(1)}%)`
                  });
                } else {
                  battleLogs.push({
                    type: 'hit',
                    attackerId: participant.id,
                    targetId: techTarget.id,
                    damage: damage,
                    message: `${participant.username || 'Атакующий'} наносит ${damage} урона техникой ${technique.name}`
                  });
                }
                
                const newTechHp = Math.max(0, techTarget.current_hp - damage);
                
                // Дополнительное логирование перед обновлением HP
                console.log(`[PvP] Урон от техники ${technique.name}: Текущее HP цели ${techTarget.current_hp}, новое HP ${newTechHp}, разница ${techTarget.current_hp - newTechHp}`);
                
                await techTarget.update({
                  current_hp: newTechHp,
                  status: newTechHp <= 0 ? 'defeated' : 'active'
                }, { transaction });
                
                console.log(`[PvP] Участник ${participant.id} (игрок ${userId}) нанес урон техникой: ${damage}. Цель ${techTarget.id} здоровье: ${newTechHp}`);
                
                // Проверка обновления HP
                const updatedTarget = await PvPParticipant.findByPk(techTarget.id, { transaction });
                console.log(`[PvP] Проверка обновления HP после техники ${technique.name}: старое=${techTarget.current_hp}, расчетное=${newTechHp}, фактическое=${updatedTarget.current_hp}`);
              }
              
              // Обновляем общий урон атакующего независимо от уклонения
              await participant.update({
                total_damage: sequelize.literal(`COALESCE(total_damage, 0) + ${damage}`)
              }, { transaction });
            }
            
            break;
            
          default:
            throw new Error('Неизвестный тип действия');
        }
        
        // Текущее время для записи действия
        const currentTime = new Date();
        
        // Записываем действие в историю
        const action = await PvPAction.create({
          room_id: roomId,
          participant_id: participant.id,
          action_type: actionType,
          target_id: targetId,
          technique_id: techniqueId,
          damage,
          healing,
          timestamp: currentTime
        }, { transaction });

        // Обновляем эффекты для всех ДРУГИХ активных участников боя, которые не были затронуты атакой
        const allParticipants = await PvPParticipant.findAll({
          where: {
            room_id: roomId,
            status: 'active',
            id: {
              [Op.notIn]: [participant.id, targetId].filter(id => id) // Исключаем активного участника и цель атаки
            }
          },
          transaction
        });
        
        console.log(`[PvP] Обновление эффектов для других участников (${allParticipants.length}) после хода игрока ${userId}`);
        
        // Обрабатываем эффекты для каждого ДРУГОГО участника
        for (const currentParticipant of allParticipants) {
          // Обновляем длительность эффектов (без уменьшения ходов)
          const effectsUpdateResult = await PvPService.updateEffectsDuration(currentParticipant, transaction, false);
          
          if (effectsUpdateResult.expired.length > 0) {
            console.log(`[PvP] Истекли эффекты у участника ${currentParticipant.id}:`,
              effectsUpdateResult.expired.map(e => `${e.name || e.id} (${e.type}/${e.subtype || 'общий'})`));
          }
          
          // Если это не активный участник, применяем периодические эффекты
          // (для активного участника эффекты уже применены в начале хода)
          if (currentParticipant.id !== participant.id) {
            // Применяем периодические эффекты (регенерация и т.д.)
            const periodicEffectsResults = await PvPService.applyPeriodicEffects(currentParticipant, transaction);
            
            if (periodicEffectsResults.length > 0) {
              console.log(`[PvP] Применены периодические эффекты для участника ${currentParticipant.id}:`,
                periodicEffectsResults.filter(r => r.type === 'heal').map(r => ({
                  type: r.type,
                  amount: r.amount,
                  effectName: r.effectName
                })));
            }
          }
          
          // Применяем эффекты, активируемые при действиях (например, "Накопление энергии")
          // Эти эффекты должны срабатывать при любом действии в бою для всех участников
          const actionEffectsResults = await PvPService.applyActionBasedEffects(currentParticipant, transaction);
          
          if (actionEffectsResults.length > 0) {
            console.log(`[PvP] Применены эффекты при действии для участника ${currentParticipant.id}:`,
              actionEffectsResults.map(r => ({
                type: r.type,
                amount: r.amount,
                effectName: r.effectName
              })));
          }
        }
        
        // Обновляем время последнего действия участника с учетом эффекта скорости
        const cooldown = PvPService.calculateActionCooldown(participant);
        await participant.update({
          last_action_time: currentTime,
          action_cooldown: cooldown // Сохраняем рассчитанный кулдаун для этого участника
        }, { transaction });
        
        // Проверяем, есть ли победитель (все участники одной команды побеждены)
        const teamStatus = await PvPParticipant.findAll({
          where: { room_id: roomId },
          attributes: [
            'team',
            [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
            [
              sequelize.fn(
                'SUM',
                sequelize.literal(`CASE WHEN current_hp <= 0 OR status = 'defeated' THEN 1 ELSE 0 END`)
              ),
              'defeated'
            ]
          ],
          group: ['team'],
          transaction
        });
        
        // Подробное логирование для отладки
        console.log(`[PvP] Проверка состояния команд:`,
          teamStatus.map(t => t.get({ plain: true }))
        );
        
        let battleCompleted = false;
        let winnerTeam = null;
        
        for (const teamData of teamStatus) {
          const teamInfo = teamData.get({ plain: true });
          const total = parseInt(teamInfo.total) || 0;
          const defeated = parseInt(teamInfo.defeated) || 0;
          
          console.log(`[PvP] Состояние команды ${teamInfo.team}: всего ${total}, побеждено ${defeated}`);
          
          // Проверяем, что в команде есть участники и все они побеждены
          if (total > 0 && defeated >= total) {
            // Другая команда победила
            winnerTeam = teamInfo.team === 1 ? 2 : 1;
            battleCompleted = true;
            console.log(`[PvP] Все участники команды ${teamInfo.team} побеждены! Победила команда ${winnerTeam}`);
            break;
          }
          
          console.log(`[PvP] Подробное состояние команды ${teamInfo.team}: ` +
            `total=${total}, defeated=${defeated}, ` +
            `rawTotal=${teamInfo.total}, rawDefeated=${teamInfo.defeated}, ` +
            `total > 0=${total > 0}, defeated >= total=${defeated >= total}`);
        }
        
        // Если бой завершен, обновляем статус комнаты и обрабатываем результаты
        if (battleCompleted) {
          console.log(`[PvP] Бой в комнате ${roomId} завершен. Победитель: команда ${winnerTeam}`);
          
          // Обновляем статус комнаты
          await room.update({
            status: 'completed',
            end_time: new Date(),
            winner_team: winnerTeam
          }, { transaction });
          
          // Устанавливаем статус всех участников на 'inactive'
          await PvPParticipant.update(
            { status: 'inactive' },
            {
              where: { room_id: roomId },
              transaction
            }
          );
          
          // Обновляем историю боёв и рейтинги участников
          try {
            await PvPService.updateBattleHistoryAndRatings(roomId, winnerTeam, transaction);
            console.log(`[PvP] Успешно обновлена история боя и рейтинги для комнаты ${roomId}`);
          } catch (updateError) {
            // Логируем ошибку, но продолжаем процесс завершения боя
            console.error(`[PvP] Ошибка при обновлении истории боя и рейтингов:`, updateError);
          }
          
          // Полностью распускаем комнату, меняя статус на 'dismissed'
          await room.update({
            status: 'dismissed'
          }, { transaction });
          
          console.log(`[PvP] Комната ${roomId} распущена после завершения боя`);
        }
        
        // Добавляем логи боя в результат
        return {
          success: true,
          damage,
          healing,
          battleCompleted,
          winnerTeam,
          battleLogs // Добавляем логи боя для отображения на клиенте
        };
      });
      
      return result;
    } catch (error) {
      console.error('Ошибка при выполнении действия в бою:', error);
      throw new Error(`Не удалось выполнить действие: ${error.message}`);
    }
  }

  /**
   * Роспуск комнаты
   * @param {number} roomId - ID комнаты
   * @returns {Promise<Object>} - Результат операции
   */
  static async dismissRoom(roomId) {
    try {
      // Инициализируем реестр моделей
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const PvPRoom = modelRegistry.getModel('PvPRoom');
      const PvPParticipant = modelRegistry.getModel('PvPParticipant');
      const sequelize = PvPRoom.sequelize;
      
      // Используем транзакцию для всех операций
      const result = await sequelize.transaction(async (transaction) => {
        // Проверяем, существует ли комната
        const room = await PvPRoom.findByPk(roomId, { transaction });
        
        if (!room) {
          throw new Error('Комната не найдена');
        }
        
        // Обновляем статус комнаты
        await room.update({
          status: 'dismissed'
        }, { transaction });
        
        // Обновляем статус всех участников
        await PvPParticipant.update(
          { status: 'inactive' },
          {
            where: { room_id: roomId },
            transaction
          }
        );
        
        return {
          success: true,
          message: 'Комната успешно распущена'
        };
      });
      
      return result;
    } catch (error) {
      console.error('Ошибка при роспуске комнаты:', error);
      throw new Error(`Не удалось распустить комнату: ${error.message}`);
    }
  }

  /**
   * Получение обновлений состояния комнаты
   * @param {number} roomId - ID комнаты
   * @param {number} lastActionId - ID последнего известного действия
   * @returns {Promise<Object>} Текущее состояние комнаты
   */
  static async getRoomState(roomId, userId = null, lastActionId = 0) {
    try {
      // Если передан userId, обновляем характеристики игрока
      if (userId) {
        // Проверяем, является ли пользователь участником комнаты
        const PvPParticipant = modelRegistry.getModel('PvPParticipant');
        const participant = await PvPParticipant.findOne({
          where: {
            room_id: roomId,
            user_id: userId
          }
        });

        // Если пользователь является участником, обновляем его характеристики
        if (participant) {
          console.log(`[PvP] Обновление характеристик игрока ${userId} при получении состояния комнаты ${roomId}`);
          await this.savePlayerStats(userId, roomId);
        }
      }
      
      // Получаем детали комнаты
      return await this.getRoomDetails(roomId);
    } catch (error) {
      console.error('Ошибка при получении состояния комнаты:', error);
      throw new Error(`Не удалось получить состояние комнаты: ${error.message}`);
    }
  }

  /**
   * Получение рейтингов пользователя
   * @param {number} userId - ID пользователя
   * @param {number} modeId - ID режима (опционально)
   * @param {string} season - Сезон (опционально)
   * @returns {Promise<Array>} Массив рейтингов
   */
  static async getUserRatings(userId, modeId = null, season = 'current') {
    try {
      // Инициализируем реестр моделей
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const PvPRating = modelRegistry.getModel('PvPRating');
      const PvPMode = modelRegistry.getModel('PvPMode');
      
      // Формируем условия поиска
      const whereConditions = { user_id: userId };
      
      if (modeId) {
        whereConditions.mode_id = modeId;
      }
      
      if (season) {
        whereConditions.season = season;
      }
      
      // Получаем рейтинги пользователя
      const ratings = await PvPRating.findAll({
        where: whereConditions,
        include: [
          {
            model: PvPMode,
            as: 'pvpMode',
            attributes: ['id', 'name', 'team_size'] // Добавляем виртуальное поле team_size
          }
        ],
        order: [['rating', 'DESC']]
      });
      
      // Преобразуем результат
      return ratings.map(rating => ({
        id: rating.id,
        rating: rating.rating, 
        wins: rating.wins,
        losses: rating.losses,
        draws: rating.draws,
        league: rating.league,
        season: rating.season,
        mode_id: rating.mode_id,
        mode_name: rating.pvpMode ? rating.pvpMode.name : 'Unknown'
      }));
    } catch (error) {
      console.error('Ошибка при получении рейтингов пользователя:', error);
      throw new Error('Не удалось получить рейтинги пользователя');
    }
  }

  /**
   * Получение таблицы лидеров
   * @param {number} modeId - ID режима
   * @param {string} season - Сезон
   * @param {number} limit - Лимит записей
   * @param {number} offset - Смещение
   * @returns {Promise<Array>} Таблица лидеров
   */
  static async getLeaderboard(modeId, season = 'current', limit = 100, offset = 0) {
    try {
      // Инициализируем реестр моделей
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const PvPRating = modelRegistry.getModel('PvPRating');
      const User = modelRegistry.getModel('User');
      
      // Получаем таблицу лидеров
      const leaderboard = await PvPRating.findAll({
        where: {
          mode_id: modeId,
          season
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'cultivation_level']
          }
        ],
        order: [['rating', 'DESC']],
        limit,
        offset
      });
      
      // Преобразуем результат
      return leaderboard.map(entry => ({
        id: entry.id,
        user_id: entry.user_id,
        rating: entry.rating,
        wins: entry.wins,
        losses: entry.losses,
        league: entry.league,
        username: entry.user ? entry.user.username : 'Unknown',
        cultivation_level: entry.user ? entry.user.cultivation_level : 0
      }));
    } catch (error) {
      console.error('Ошибка при получении таблицы лидеров:', error);
      throw new Error('Не удалось получить таблицу лидеров');
    }
  }

  /**
   * Получение истории боев пользователя
   * @param {number} userId - ID пользователя
   * @param {number} limit - Лимит записей
   * @param {number} offset - Смещение
   * @returns {Promise<Array>} История боев
   */
  static async getUserBattleHistory(userId, limit = 10, offset = 0) {
    try {
      // Инициализируем реестр моделей
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const PvPHistory = modelRegistry.getModel('PvPHistory');
      const PvPMode = modelRegistry.getModel('PvPMode');
      
      // Получаем историю боев
      const history = await PvPHistory.findAll({
        where: { user_id: userId },
        include: [
          {
            model: PvPMode,
            as: 'pvpMode',
            attributes: ['id', 'name', 'team_size'] // Добавляем виртуальное поле team_size
          }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });
      
      // Преобразуем результат
      return history.map(entry => ({
        id: entry.id,
        room_id: entry.room_id,
        result: entry.result,
        rating_change: entry.rating_change,
        rewards: entry.rewards,
        created_at: entry.created_at,
        mode_name: entry.pvpMode ? entry.pvpMode.name : 'Unknown'
      }));
    } catch (error) {
      console.error('Ошибка при получении истории боев:', error);
      throw new Error('Не удалось получить историю боев');
    }
  }

  /**
   * Получение доступных наград
   * @param {string} season - Сезон
   * @param {number} minRating - Минимальный рейтинг
   * @param {number} maxRating - Максимальный рейтинг
   * @returns {Promise<Array>} Список наград
   */
  static async getAvailableRewards(season = 'current', minRating = null, maxRating = null) {
    try {
      // Инициализируем реестр моделей
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const PvPReward = modelRegistry.getModel('PvPReward');
      // Модель ItemCatalog пока не существует
      // const ItemCatalog = modelRegistry.getModel('ItemCatalog');
      
      // Формируем условия поиска
      const whereConditions = { season };
      
      if (minRating !== null) {
        whereConditions.min_rating = { [Op.gte]: minRating };
      }
      
      if (maxRating !== null) {
        whereConditions.min_rating = {
          ...whereConditions.min_rating,
          [Op.lte]: maxRating
        };
      }
      
      // Получаем награды
      const rewards = await PvPReward.findAll({
        where: whereConditions,
        // Исключаем включение ItemCatalog, так как модели пока нет
        /*
        include: [
          {
            model: ItemCatalog,
            as: 'item',
            attributes: ['item_id', 'name', 'type', 'rarity', 'description']
          }
        ],
        */
        order: [['min_rating', 'ASC']]
      });
      
      // Преобразуем результат
      return rewards.map(reward => ({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        min_rating: reward.min_rating,
        rarity: reward.rarity,
        item_id: reward.item_id
      }));
    } catch (error) {
      console.error('Ошибка при получении доступных наград:', error);
      throw new Error('Не удалось получить доступные награды');
    }
  }

  /**
   * Выход пользователя из комнаты
   * @param {number} userId - ID пользователя
   * @param {number} roomId - ID комнаты
   * @returns {Promise<Object>} - Результат операции
   */
  static async leaveRoom(userId, roomId) {
    try {
      // Инициализируем реестр моделей
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const PvPParticipant = modelRegistry.getModel('PvPParticipant');
      const PvPRoom = modelRegistry.getModel('PvPRoom');
      const PvPPlayerStats = modelRegistry.getModel('PvPPlayerStats');
      
      // Проверяем, что пользователь состоит в комнате
      const participant = await PvPParticipant.findOne({
        where: {
          room_id: roomId,
          user_id: userId
        }
      });
      
      if (!participant) {
        throw new Error('Вы не являетесь участником этой комнаты');
      }
      
      // Получаем информацию о комнате
      const room = await PvPRoom.findByPk(roomId);
      
      if (!room) {
        throw new Error('Комната не найдена');
      }
      
      // Удаляем характеристики игрока из таблицы pvp_player_stats
      try {
        await PvPPlayerStats.destroy({
          where: {
            user_id: userId,
            room_id: roomId
          }
        });
        
        console.log(`[PvP] Удалены характеристики игрока ${userId} из комнаты ${roomId}`);
      } catch (error) {
        console.error(`[PvP] Ошибка при удалении характеристик игрока ${userId}:`, error);
        // Не выбрасываем ошибку, чтобы не прерывать процесс выхода из комнаты
      }
      
      // Выбираем действия в зависимости от статуса комнаты
      if (room.status === 'waiting') {
        // Если комната в статусе ожидания, удаляем участника
        await participant.destroy();
        
        // Если пользователь был лидером комнаты, то закрываем ее
        if (room.leader_id === userId) {
          await room.update({ status: 'closed' });
          
          // Удаляем всех остальных участников
          await PvPParticipant.destroy({
            where: {
              room_id: roomId
            }
          });
          
          // Удаляем характеристики всех игроков из комнаты
          await PvPPlayerStats.destroy({
            where: {
              room_id: roomId
            }
          });
          
          return {
            success: true,
            message: 'Вы вышли из комнаты. Комната была закрыта, так как вы были её создателем.'
          };
        }
        
        return {
          success: true,
          message: 'Вы успешно вышли из комнаты'
        };
      } else if (room.status === 'in_progress') {
        // Если бой идет, отмечаем участника как AFK
        await participant.update({ status: 'afk' });
        
        return {
          success: true,
          message: 'Вы вышли из боя, но будете считаться AFK до его завершения'
        };
      } else if (room.status === 'completed' || room.status === 'dismissed') {
        // Если бой завершен или комната распущена, освобождаем позицию и меняем статус
        await participant.update({
          status: 'inactive',
          position: null
        });
        
        console.log(`[PvP] Участник ${userId} вышел из завершенной комнаты ${roomId}`);
        
        return {
          success: true,
          message: 'Вы успешно вышли из завершенного боя'
        };
      } else {
        // Для любых других статусов просто освобождаем позицию
        await participant.update({
          status: 'inactive',
          position: null
        });
        
        return {
          success: true,
          message: 'Вы успешно вышли из комнаты'
        };
      }
    } catch (error) {
      console.error('Ошибка при выходе из комнаты:', error);
      throw new Error(`Ошибка при выходе из комнаты: ${error.message}`);
    }
  }

  /**
   * Получение текущего статуса пользователя в PvP
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Информация о текущем статусе пользователя
   */
  static async getUserPvPStatus(userId) {
    try {
      // Инициализируем реестр моделей
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const PvPParticipant = modelRegistry.getModel('PvPParticipant');
      const PvPRoom = modelRegistry.getModel('PvPRoom');
      
      // Ищем активное участие пользователя в комнатах
      const participants = await PvPParticipant.findAll({
        where: {
          user_id: userId,
          status: 'active'
        },
        include: [
          {
            model: PvPRoom,
            as: 'pvpRoom',
            attributes: ['id', 'status', 'name', 'mode_id', 'leader_id', 'winner_team', 'created_at']
          }
        ],
        order: [
          [{ model: PvPRoom, as: 'pvpRoom' }, 'created_at', 'DESC']
        ]
      });
      
      if (!participants || participants.length === 0) {
        return { inRoom: false };
      }
      
      // Если пользователь участвует в нескольких комнатах, приоритет отдаем комнатам в статусе "in_progress"
      let activeParticipant = participants.find(p => p.pvpRoom.status === 'in_progress');
      
      // Если нет комнат в статусе "in_progress", берем самую новую комнату
      if (!activeParticipant) {
        activeParticipant = participants[0]; // Уже отсортировано по created_at DESC
      }
      
      const room = activeParticipant.pvpRoom;
      
      // Проверяем, не закрыта/завершена/распущена ли комната
      if (room.status === 'closed' || room.status === 'completed' || room.status === 'dismissed') {
        console.log(`[PvP] Найден участник ${userId} в неактивной комнате ${room.id} со статусом ${room.status}`);
        
        // Освобождаем позицию участника
        try {
          // Устанавливаем статус inactive и сбрасываем позицию
          await activeParticipant.update({
            status: 'inactive',
            position: null
          });
          
          console.log(`[PvP] Обновлен статус участника ${userId} в комнате ${room.id}`);
        } catch (err) {
          console.error(`[PvP] Ошибка при обновлении участника ${userId}:`, err);
          // Пытаемся полностью удалить запись участника, если обновление не удалось
          try {
            await activeParticipant.destroy();
            console.log(`[PvP] Удален участник ${userId} из комнаты ${room.id}`);
          } catch (destroyErr) {
            console.error(`[PvP] Ошибка при удалении участника ${userId}:`, destroyErr);
          }
        }
        
        // Проверяем, есть ли другие активные комнаты
        const remainingParticipants = participants.filter(p =>
          p.id !== activeParticipant.id &&
          p.pvpRoom.status !== 'closed' &&
          p.pvpRoom.status !== 'completed' &&
          p.pvpRoom.status !== 'dismissed'
        );
        
        if (remainingParticipants.length > 0) {
          // Если есть другие активные комнаты, возвращаем информацию о следующей
          const nextParticipant = remainingParticipants[0];
          const nextRoom = nextParticipant.pvpRoom;
          
          return {
            inRoom: true,
            roomId: nextRoom.id,
            roomStatus: nextRoom.status,
            team: nextParticipant.team,
            position: nextParticipant.position
          };
        }
        
        return { inRoom: false };
      }
      
      return {
        inRoom: true,
        roomId: room.id,
        roomStatus: room.status,
        team: activeParticipant.team,
        position: activeParticipant.position
      };
    } catch (error) {
      console.error('Ошибка при получении статуса пользователя в PvP:', error);
      throw new Error(`Не удалось получить статус пользователя в PvP: ${error.message}`);
    }
  }
  /**
   * Сохраняет характеристики игрока в pvp_player_stats
   * @param {number} userId - ID пользователя
   * @param {number} roomId - ID комнаты
   * @param {Transaction} transaction - Транзакция Sequelize
   * @returns {Promise<boolean>} Результат операции
   */
  static async savePlayerStats(userId, roomId, transaction = null) {
    try {
      // Импортируем сервис характеристик
      const CharacterStatsService = require('./character-stats-service');
      
      // Получаем характеристики игрока
      const playerStats = await CharacterStatsService.getSecondaryStats(userId);
      
      console.log(`[PvP] Получены характеристики игрока ${userId}:`, playerStats);
      
      // Получаем модель PvPPlayerStats
      const PvPPlayerStats = modelRegistry.getModel('PvPPlayerStats');
      
      // Проверяем, существует ли уже запись
      const existingStats = await PvPPlayerStats.findOne({
        where: {
          user_id: userId,
          room_id: roomId
        },
        transaction
      });
      
      // Опции для операций
      const options = transaction ? { transaction } : {};
      
      if (existingStats) {
        // Если запись существует, обновляем её
        await existingStats.update({
          physical_attack: playerStats.physicalAttack || 0,
          physical_defense: playerStats.physicalDefense || 0,
          spiritual_attack: playerStats.spiritualAttack || 0,
          spiritual_defense: playerStats.spiritualDefense || 0
        }, options);
        
        console.log(`[PvP] Обновлены характеристики игрока ${userId} в комнате ${roomId}`);
      } else {
        // Если записи нет, создаём новую
        await PvPPlayerStats.create({
          user_id: userId,
          room_id: roomId,
          physical_attack: playerStats.physicalAttack || 0,
          physical_defense: playerStats.physicalDefense || 0,
          spiritual_attack: playerStats.spiritualAttack || 0,
          spiritual_defense: playerStats.spiritualDefense || 0
        }, options);
        
        console.log(`[PvP] Созданы характеристики игрока ${userId} в комнате ${roomId}`);
      }
      
      return true;
    } catch (error) {
      console.error(`[PvP] Ошибка при сохранении характеристик игрока ${userId}:`, error);
      // Не выбрасываем ошибку, чтобы не прерывать процесс
      return false;
    }
  }
  /**
   * Обновляет историю боев и рейтинги для всех участников боя
   * @param {number} roomId - ID комнаты
   * @param {number} winnerTeam - ID команды-победителя
   * @param {Transaction} transaction - Транзакция Sequelize
   * @returns {Promise<boolean>} Результат операции
   */
  static async updateBattleHistoryAndRatings(roomId, winnerTeam, transaction = null) {
  try {
    console.log(`[PvP] Обновление истории боя и рейтингов для комнаты ${roomId}, победитель: команда ${winnerTeam}`);
    
    // Получаем необходимые модели
    const PvPParticipant = modelRegistry.getModel('PvPParticipant');
    const PvPRoom = modelRegistry.getModel('PvPRoom');
    const PvPHistory = modelRegistry.getModel('PvPHistory');
    const PvPRating = modelRegistry.getModel('PvPRating');
    const PvPAction = modelRegistry.getModel('PvPAction');
    const User = modelRegistry.getModel('User');
    const sequelize = PvPRoom.sequelize;
    
    // Получаем информацию о комнате
    const room = await PvPRoom.findByPk(roomId, { transaction });
    if (!room) {
      console.error(`[PvP] Комната ${roomId} не найдена при обновлении истории`);
      return false;
    }
    
    // Получаем всех участников боя
    const participants = await PvPParticipant.findAll({
      where: { room_id: roomId },
      transaction
    });
    
    if (!participants || participants.length === 0) {
      console.error(`[PvP] Участники комнаты ${roomId} не найдены при обновлении истории`);
      return false;
    }
    
    // Получаем общий урон, нанесённый каждым участником
    const damageStats = await PvPAction.findAll({
      attributes: [
        'participant_id',
        [sequelize.fn('SUM', sequelize.col('damage')), 'total_damage']
      ],
      where: {
        room_id: roomId
      },
      group: ['participant_id'],
      transaction
    });
    
    // Преобразуем в удобный формат Map
    const participantDamageMap = new Map();
    damageStats.forEach(stat => {
      const damage = parseInt(stat.get('total_damage')) || 0;
      participantDamageMap.set(stat.participant_id, damage);
      console.log(`[PvP] Участник ID ${stat.participant_id} нанес урон: ${damage}`);
    });
    
    // Группируем участников по командам
    const teamParticipants = new Map();
    participants.forEach(participant => {
      if (!teamParticipants.has(participant.team)) {
        teamParticipants.set(participant.team, []);
      }
      teamParticipants.get(participant.team).push(participant);
    });
    
    // Рассчитываем длительность боя в секундах
    const battleDuration = room.end_time && room.start_time
      ? Math.floor((new Date(room.end_time) - new Date(room.start_time)) / 1000)
      : 0;
    
    // Прямой доступ к каталогу предметов для выбора наград
    const ItemCatalog = modelRegistry.getModel('ItemCatalog');
    console.log(ItemCatalog);
    // Функция для получения предметов из item_catalog, сгруппированных по редкости
    async function getItemsByRarity(transaction) {
      try {
        // Получаем все предметы из каталога
        const items = await ItemCatalog.findAll({ transaction });
        
        // Группируем предметы по редкости
        const itemsByRarity = {
          common: [],
          uncommon: [],
          rare: [],
          epic: [],
          legendary: []
        };
        
        // Распределяем предметы по группам редкости
        items.forEach(item => {
          const rarity = item.rarity || 'common';
          if (itemsByRarity[rarity]) {
            itemsByRarity[rarity].push(item);
          } else {
            // Если редкость неизвестна, добавляем в common
            itemsByRarity.common.push(item);
          }
        });
        
        console.log(`[PvP] Загружено предметов для наград: ${items.length}`);
        for (const [rarity, items] of Object.entries(itemsByRarity)) {
          console.log(`[PvP] - ${rarity}: ${items.length} предметов`);
        }
        
        return itemsByRarity;
      } catch (error) {
        console.error(`[PvP] Ошибка при получении предметов для наград:`, error);
        return {
          common: [],
          uncommon: [],
          rare: [],
          epic: [],
          legendary: []
        };
      }
    }
    
    // Получаем предметы, сгруппированные по редкости
    const itemsByRarity = await getItemsByRarity(transaction);
    console.log(`[PvP] Предметы для наград успешно получены и сгруппированы по редкости`);
    
    // Получаем сервис инвентаря
    const InventoryService = require('../services/inventory-service');
    
    // Для каждого участника обновляем историю и рейтинг
    console.log(`[PvP] Начало обработки ${participants.length} участников`);
    for (const participant of participants) {
      const isWinner = participant.team === winnerTeam;
      const userId = participant.user_id;
      
      // Базовое изменение рейтинга
      const ratingChange = isWinner ? 15 : -10;
      
      // Обновляем рейтинг пользователя
      let userRating = await PvPRating.findOne({
        where: {
          user_id: userId,
          mode_id: room.mode_id,
          season: 'current'
        },
        transaction
      });
      
      if (userRating) {
        // Обновляем существующий рейтинг
        await userRating.update({
          rating: Math.max(0, userRating.rating + ratingChange),
          wins: isWinner ? userRating.wins + 1 : userRating.wins,
          losses: isWinner ? userRating.losses : userRating.losses + 1
        }, { transaction });
      } else {
        // Создаем новую запись рейтинга
        await PvPRating.create({
          user_id: userId,
          mode_id: room.mode_id,
          season: 'current',
          rating: isWinner ? 1015 : 990, // Начальный рейтинг 1000 + изменение
          wins: isWinner ? 1 : 0,
          losses: isWinner ? 0 : 1,
          draws: 0,
          league: 'bronze' // Начальная лига
        }, { transaction });
      }
      
      // Проверяем квесты для PvP событий
      try {
        if (isWinner) {
          // Определяем режим PvP для квестов
          let pvpMode = 'unknown';
          if (room.mode_id === 1) pvpMode = 'duel_1v1';
          else if (room.mode_id === 2) pvpMode = 'team_3v3';
          else if (room.mode_id === 3) pvpMode = 'sect_5v5';
          else if (room.mode_id === 4) pvpMode = 'tournament';
          
          // Проверяем квест на победу в PvP
          const completedPvpWinQuests = await QuestService.checkQuestEvent(userId, 'PVP_WIN', { mode: pvpMode });
          for (const questId of completedPvpWinQuests) {
            await QuestService.completeQuest(userId, questId);
          }
        }
        
        // Проверяем квест на достижение рейтинга
        const currentRating = userRating ? userRating.rating + ratingChange : (isWinner ? 1015 : 990);
        const completedPvpRatingQuests = await QuestService.checkQuestEvent(userId, 'PVP_RATING', { rating: currentRating });
        for (const questId of completedPvpRatingQuests) {
          await QuestService.completeQuest(userId, questId);
        }
      } catch (questError) {
        console.error(`[PvP] Ошибка при проверке квестов для игрока ${userId}:`, questError);
        // Не прерываем основной процесс из-за ошибки в квестах
      }
      
      // Определяем список ID союзников (team_ids)
      const teamIds = teamParticipants.get(participant.team)
        .filter(p => p.id !== participant.id)
        .map(p => p.user_id);
      
      // Определяем список ID противников (opponent_ids)
      const opponentIds = [];
      teamParticipants.forEach((members, team) => {
        if (team !== participant.team) {
          members.forEach(member => opponentIds.push(member.user_id));
        }
      });
      
      // Получаем урон, нанесённый участником
      const damage = participantDamageMap.get(participant.id) || 0;
      const damageBonusPercent = damage / 100;
      
      // Информация о награде (пустой объект по умолчанию)
      let rewardInfo = {};
      
      // Награды только для победителей
      if (isWinner) {
        try {
          // Базовые шансы для каждой редкости
          const rarityChances = {
            common: 60,
            uncommon: 25,
            rare: 10,
            epic: 4,
            legendary: 1
          };
          
          // Модификаторы шансов
          function modifyRarityChances(chances, rating, damage) {
            // Копируем оригинальные шансы
            const modified = { ...chances };
            
            // Бонус за рейтинг (до 10%)
            const ratingBonus = Math.min(10, Math.floor(rating / 100));
            
            // Бонус за урон (до 5%)
            const damageBonus = Math.min(5, Math.floor(damage / 100));
            
            // Уменьшаем шанс обычных предметов
            modified.common -= (ratingBonus + damageBonus);
            
            // Распределяем бонус
            const extraPerRarity = (ratingBonus + damageBonus) / 4;
            modified.uncommon += extraPerRarity;
            modified.rare += extraPerRarity;
            modified.epic += extraPerRarity;
            modified.legendary += extraPerRarity;
            
            // Обеспечиваем положительные значения
            Object.keys(modified).forEach(key => {
              modified[key] = Math.max(0, modified[key]);
            });
            
            // Нормализуем (сумма = 100%)
            const total = Object.values(modified).reduce((sum, val) => sum + val, 0);
            Object.keys(modified).forEach(key => {
              modified[key] = (modified[key] / total) * 100;
            });
            
            return modified;
          }
          
          // Выбор случайной редкости
          function selectRandomRarity(chances) {
            const roll = Math.random() * 100;
            let cumulative = 0;
            
            for (const [rarity, chance] of Object.entries(chances)) {
              cumulative += chance;
              if (roll <= cumulative) return rarity;
            }
            
            return 'common'; // по умолчанию
          }
          
          // Выбор случайного предмета указанной редкости
          function selectRandomItem(items, rarity) {
            const availableItems = items[rarity] || [];
            if (availableItems.length === 0) return null;
            
            const randomIndex = Math.floor(Math.random() * availableItems.length);
            return availableItems[randomIndex];
          }
          
          // Модифицируем шансы
          const currentRating = userRating ? userRating.rating : 1000;
          const modifiedChances = modifyRarityChances(rarityChances, currentRating, damage);
          
          console.log(`[PvP] Шансы на награды для игрока ${userId} (рейтинг: ${currentRating}, урон: ${damage}):`, modifiedChances);
          
          // Выбираем редкость и предмет
          const selectedRarity = selectRandomRarity(modifiedChances);
          const selectedItem = selectRandomItem(itemsByRarity, selectedRarity);
          
          if (selectedItem) {
            console.log(`[PvP] Выбран предмет для награды: ${selectedItem.name} (${selectedRarity})`);
            
            try {
              // Добавляем предмет в инвентарь
              await InventoryService.addInventoryItem(userId, {
                item_id: selectedItem.item_id,
                name: selectedItem.name,
                type: selectedItem.type,
                rarity: selectedItem.rarity || selectedRarity,
                description: selectedItem.description,
                quantity: 1,
                stackable: false,
                value: selectedItem.price || 0
              }, transaction);
              
              // Сохраняем информацию о награде
              rewardInfo = {
                item_id: selectedItem.item_id,
                name: selectedItem.name,
                rarity: selectedItem.rarity || selectedRarity,
                type: selectedItem.type
              };
              
              console.log(`[PvP] Игроку ${userId} выдана награда: ${selectedItem.name} (${selectedRarity})`);
            } catch (inventoryError) {
              console.error(`[PvP] Ошибка при добавлении предмета в инвентарь игрока ${userId}:`, inventoryError);
              // Продолжаем выполнение без выдачи награды
            }
          } else {
            console.log(`[PvP] Не найдено предметов редкости ${selectedRarity} для награды игрока ${userId}`);
          }
        } catch (rewardError) {
          console.error(`[PvP] Ошибка при расчете и выдаче награды игроку ${userId}:`, rewardError);
          // Продолжаем выполнение, чтобы остальные игроки получили награды
        }
      }
      
      // Добавляем запись в историю боев со всеми данными
      await PvPHistory.create({
        user_id: userId,
        room_id: roomId,
        mode_id: room.mode_id,
        result: isWinner ? 'win' : 'loss',
        rating_change: ratingChange,
        rewards: rewardInfo ? JSON.stringify(rewardInfo) : '{}',
        opponent_ids: opponentIds,
        team_ids: teamIds,
        damage_dealt: damage,
        timestamp: new Date(),
        duration: battleDuration,
        created_at: new Date()
      }, { transaction });
      
      console.log(`[PvP] Успешно обновлены рейтинг и история для игрока ${userId}`);
      
      console.log(`[PvP] Обновлены рейтинг и история для игрока ${userId}: ${isWinner ? 'победа' : 'поражение'}, изменение рейтинга: ${ratingChange}`);
      
      // Освобождаем позицию участника (устанавливаем специальное значение -1, которое означает "позиция не активна")
      await participant.update({
        position: -1
      }, { transaction });
    }
    
    return true;
  } catch (error) {
    console.error(`[PvP] Ошибка при обновлении истории боя и рейтингов:`, error);
    return false;
  }
}

  /**
   * Очищает все неактуальные PvP комнаты (завершенные более часа назад или "застрявшие" в процессе)
   * Метод можно вызывать периодически для обслуживания системы
   * @returns {Promise<Object>} Результат операции
   */
  static async cleanupStaleRooms() {
    try {
      console.log(`[PvP] Запуск очистки неактуальных PvP комнат`);
      
      // Инициализируем реестр моделей
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const PvPRoom = modelRegistry.getModel('PvPRoom');
      const PvPParticipant = modelRegistry.getModel('PvPParticipant');
      const sequelize = PvPRoom.sequelize;
      
      // Используем транзакцию для всех операций
      const result = await sequelize.transaction(async (transaction) => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 час назад
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 часов назад
        
        // Находим все завершенные комнаты старше 1 часа
        const completedRooms = await PvPRoom.findAll({
          where: {
            status: 'completed',
            end_time: {
              [Op.lt]: oneHourAgo
            }
          },
          transaction
        });
        
        // Находим все комнаты "in_progress", которые не обновлялись более 6 часов
        // Такие комнаты можно считать "застрявшими"
        const staleInProgressRooms = await PvPRoom.findAll({
          where: {
            status: 'in_progress',
            updatedAt: {
              [Op.lt]: sixHoursAgo
            }
          },
          transaction
        });
        
        // Объединяем списки комнат для очистки
        const roomsToCleanup = [...completedRooms, ...staleInProgressRooms];
        
        console.log(`[PvP] Найдено ${roomsToCleanup.length} комнат для очистки`);
        
        // Обрабатываем каждую комнату
        for (const room of roomsToCleanup) {
          console.log(`[PvP] Очистка комнаты ${room.id} (статус: ${room.status})`);
          
          // Получаем всех участников
          const participants = await PvPParticipant.findAll({
            where: { room_id: room.id },
            transaction
          });
          
          // Обновляем участников
          for (const participant of participants) {
            await participant.update({
              status: 'inactive',
              position: null
            }, { transaction });
          }
          
          // Обновляем статус комнаты на "dismissed"
          await room.update({
            status: 'dismissed'
          }, { transaction });
          
          console.log(`[PvP] Комната ${room.id} успешно очищена`);
        }
        
        return {
          success: true,
          cleanedRooms: roomsToCleanup.length
        };
      });
      
      return result;
    } catch (error) {
      console.error('Ошибка при очистке PvP комнат:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Метод для обработки смены позиции был перемещен внутрь joinRoom
  
  /**
   * Объединяет новые эффекты с существующими, обрабатывая дубликаты и конфликты
   * @param {Array} currentEffects - Текущие эффекты участника
   * @param {Array} newEffects - Новые эффекты для добавления
   * @returns {Array} Результирующий массив эффектов
   */
  static mergeEffects(currentEffects, newEffects) {
    // Если один из массивов пустой, просто возвращаем валидный массив
    if (!Array.isArray(currentEffects) || currentEffects.length === 0) {
      return Array.isArray(newEffects) ? [...newEffects] : [];
    }
    if (!Array.isArray(newEffects) || newEffects.length === 0) {
      return [...currentEffects];
    }
    
    console.log(`[PvP] Объединение эффектов: текущих - ${currentEffects.length}, новых - ${newEffects.length}`);
    
    // Копируем текущие эффекты
    const result = [...currentEffects];
    
    for (const newEffect of newEffects) {
      // Проверяем наличие обязательных свойств
      if (!newEffect.name) {
        console.warn(`[PvP] Попытка добавить эффект без имени:`, newEffect);
        continue;
      }
      
      // Добавляем подтип, если его нет
      if (!newEffect.subtype) {
        if (newEffect.name === 'Накопление энергии') {
          newEffect.subtype = 'energy_gain';
        } else if (newEffect.name === 'Регенерация') {
          newEffect.subtype = 'healing';
        } else if (newEffect.name === 'Защита') {
          newEffect.subtype = 'protection';
        }
      }
      
      // Детально логируем каждый обрабатываемый эффект
      console.log(`[PvP] Обработка эффекта "${newEffect.name}" (${newEffect.type || 'unknown'}/${newEffect.subtype || 'unknown'})`);
      
      // Ищем существующий эффект с таким же именем И подтипом (если подтип указан)
      const existingEffectIndex = result.findIndex(e =>
        e.name === newEffect.name &&
        (newEffect.subtype ? e.subtype === newEffect.subtype : true)
      );
      
      if (existingEffectIndex >= 0) {
        const existingEffect = result[existingEffectIndex];
        console.log(`[PvP] Найден существующий эффект "${existingEffect.name}" (${existingEffect.type || 'unknown'}/${existingEffect.subtype || 'unknown'})`);
        
        // Если это тот же тип эффекта, обновляем его
        if (existingEffect.type === newEffect.type || !newEffect.type) {
          // Обновляем длительность до максимальной
          const newDuration = Math.max(
            existingEffect.duration || 0,
            newEffect.duration || 0
          );
          
          // Обновляем значение до максимального (если указаны)
          const newValue = Math.max(
            existingEffect.value || 0,
            newEffect.value || 0
          );
          
          console.log(`[PvP] Обновление существующего эффекта:`, {
            name: existingEffect.name,
            oldDuration: existingEffect.duration,
            newDuration: newDuration,
            oldValue: existingEffect.value,
            newValue: newValue
          });
          
          result[existingEffectIndex] = {
            ...existingEffect,
            duration: newDuration,
            value: newValue > 0 ? newValue : existingEffect.value,
            // Обновляем время применения
            appliedAt: new Date().toISOString(),
            // Сбрасываем счетчик прошедших ходов
            elapsedTurns: 0
          };
        } else {
          // Если это разные типы эффектов с одинаковым именем,
          // добавляем новый с уникальным ID
          const uniqueEffect = {
            ...newEffect,
            id: `${newEffect.id || newEffect.name}_${Date.now()}`,
            appliedAt: new Date().toISOString(),
            // Обеспечиваем использование временной системы
            durationMs: newEffect.durationMs || (newEffect.duration ? newEffect.duration * 3000 : 3000),
            startTime: Date.now(),
            durationType: 'time'
          };
          
          // Удаляем свойства системы ходов
          delete uniqueEffect.duration;
          delete uniqueEffect.elapsedTurns;
          delete uniqueEffect.remainingTurns;
          
          console.log(`[PvP] Добавление нового уникального эффекта с тем же именем:`, {
            name: uniqueEffect.name,
            id: uniqueEffect.id,
            type: uniqueEffect.type
          });
          
          result.push(uniqueEffect);
        }
      } else {
        // Если такого эффекта еще нет, добавляем его
        const newEffectWithTime = {
          ...newEffect,
          appliedAt: new Date().toISOString(),
          // Обеспечиваем использование временной системы
          durationMs: newEffect.durationMs || (newEffect.duration ? newEffect.duration * 3000 : 3000),
          startTime: Date.now(),
          durationType: 'time'
        };
        
        // Удаляем свойства системы ходов
        delete newEffectWithTime.duration;
        delete newEffectWithTime.elapsedTurns;
        delete newEffectWithTime.remainingTurns;
        
        console.log(`[PvP] Добавление нового эффекта:`, {
          name: newEffectWithTime.name,
          type: newEffectWithTime.type,
          subtype: newEffectWithTime.subtype,
          durationMs: newEffectWithTime.durationMs,
          durationSeconds: Math.ceil(newEffectWithTime.durationMs / 1000),
          durationType: newEffectWithTime.durationType
        });
        
        result.push(newEffectWithTime);
      }
    }
    
    console.log(`[PvP] Результат объединения эффектов: ${result.length} эффектов`);
    return result;
  }
}

module.exports = PvPService;