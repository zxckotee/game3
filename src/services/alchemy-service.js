const { Op } = require('sequelize');
/**
 * Сервис для работы с алхимической системой
 * Предоставляет методы для создания и получения рецептов, ингредиентов и результатов алхимии
 */

// Импортируем реестр моделей вместо прямого использования моделей
const modelRegistry = require('../models/registry');
const db = require('./database');
const { alchemyItems, ITEM_TYPES, RARITY, calculateSuccessRate } = require('../data/alchemy-items');
const { getEnemyAlchemyDrops } = require('../data/combat-alchemy-drops');
const { getResourceById } = require('../data/resources');

// Кэш для хранения рецептов (для оптимизации и обратной совместимости)
let recipesCache = [];
let recipesByTypeCache = {};
let recipesByRarityCache = {};

const QuestService = require('./quest-service');
const InventoryService = require('./inventory-service');

class AlchemyService {

  // Вспомогательная функция для создания ActivePlayerEffect
  static async _applyActivePlayerEffect(ActivePlayerEffectModel, userId, sourceItemId, effectTypeKey, detailsJson, durationSeconds, appliedAt, transaction) {
    if (!ActivePlayerEffectModel) {
        console.error("Модель ActivePlayerEffect не передана в _applyActivePlayerEffect!");
        throw new Error('Модель ActivePlayerEffect не определена для _applyActivePlayerEffect');
    }
    if (durationSeconds <= 0) {
      // Не создаем ActivePlayerEffect для мгновенных или пассивных с duration = 0
      // Прямое изменение статов для duration = 1 (если это не временный бафф) должно обрабатываться отдельно.
      console.log(`Skipping ActivePlayerEffect creation for ${effectTypeKey} due to duration: ${durationSeconds}`);
      return;
    }
    await ActivePlayerEffectModel.create({
      user_id: userId,
      source_item_id: sourceItemId,
      effect_type: effectTypeKey,
      effect_details_json: detailsJson,
      duration_seconds: durationSeconds,
      expires_at: new Date(appliedAt.getTime() + durationSeconds * 1000),
      applied_at: appliedAt
    }, { transaction });
  }

  /**
   * Получает все рецепты алхимии
   * @returns {Promise<Array>} Массив рецептов
   */
  static async getAllRecipes() {
    try {
      // Инициализируем реестр моделей, если он еще не инициализирован
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const AlchemyRecipe = modelRegistry.getModel('AlchemyRecipe');
      const RecipeIngredient = modelRegistry.getModel('RecipeIngredient');
      const AlchemyResult = modelRegistry.getModel('AlchemyResult');
      const InventoryItem = modelRegistry.getModel('InventoryItem');
      
      const recipes = await AlchemyRecipe.findAll({
        attributes: ['id', 'name', 'description', 'type', 'rarity', 'required_level', 'required_stage', 'success_rate', 'created_at', 'updated_at'],
        include: [
          {
            model: RecipeIngredient,
            as: 'ingredients',
            attributes: ['id', 'recipe_id', 'item_id', 'quantity', 'created_at', 'updated_at'],
            include: [
              {
                model: InventoryItem,
                as: 'item',
                attributes: ['id', 'itemId', 'name', 'description', 'rarity']
              }
            ]
          },
          {
            model: AlchemyResult,
            as: 'results',
            attributes: ['id', 'recipe_id', 'item_id', 'quantity', 'chance', 'created_at', 'updated_at'],
            include: [
              {
                model: InventoryItem,
                as: 'item',
                attributes: ['id', 'itemId', 'name', 'description', 'rarity']
              }
            ]
          }
        ]
      });
      
      // Обновляем кэш для обратной совместимости
      recipesCache = recipes;
      
      return recipes;
    } catch (error) {
      console.error('Ошибка при получении рецептов алхимии:', error);
      // Возвращаем кэшированные данные или пустой массив при ошибках
      return recipesCache.length > 0 ? recipesCache : [];
    }
  }
  /**
   * Использует алхимический предмет
   * @param {number} userId ID пользователя
   * @param {string} itemId ID предмета
   * @param {number} quantity Количество предметов для использования
   * @returns {Promise<Object>} Результат использования предмета
   */
  
  static async useConsumableItem(userId, itemId, quantity = 1) {
    if (!userId || !itemId) {
      return { success: false, message: 'Отсутствуют ID пользователя или ID предмета.' };
    }
    if (quantity <= 0) {
      return { success: false, message: 'Количество должно быть положительным числом.' };
    }

    const sequelize = modelRegistry.getModel('User').sequelize; // Получаем экземпляр sequelize
    let transaction;

    try {
      // Гарантируем, что реестр моделей инициализирован
      await modelRegistry.initializeRegistry();
      
      transaction = await sequelize.transaction();

      // 1. Получение моделей через реестр
      const AlchemyItem = modelRegistry.getModel('AlchemyItem');
      const InventoryItem = modelRegistry.getModel('InventoryItem');
      const UserItemCooldown = modelRegistry.getModel('UserItemCooldown');
      const AlchemyItemEffect = modelRegistry.getModel('AlchemyItemEffect');
      const AlchemyEffectDetails = modelRegistry.getModel('AlchemyEffectDetails'); // Добавлено
      const AlchemyItemProperty = modelRegistry.getModel('AlchemyItemProperty'); // Пока оставляем для cooldown
      const ActivePlayerEffectModel = modelRegistry.getModel('ActivePlayerEffect'); // Переименовано здесь
      const CultivationProgress = modelRegistry.getModel('CultivationProgress');
      // const CharacterStats = modelRegistry.getModel('CharacterStats'); // Если есть и используется

      // 2. Проверка предмета
      const alchemyItem = await AlchemyItem.findByPk(itemId, { transaction });
      if (!alchemyItem) {
        await transaction.rollback();
        return { success: false, message: 'Предмет не найден.' };
      }
      if (alchemyItem.type !== 'consumable') {
        await transaction.rollback();
        return { success: false, message: 'Этот предмет не является расходуемым.' };
      }

      // 3. Проверка инвентаря
      const inventoryItem = await InventoryItem.findOne({
        where: { user_id: userId, item_id: itemId }, // Используем snake_case для столбцов
        transaction
      });

      if (!inventoryItem || inventoryItem.quantity < quantity) {
        await transaction.rollback();
        return { success: false, message: 'Недостаточно предметов в инвентаре.' };
      }

      // 4. Проверка cooldown
      const now = new Date();
      const cooldown = await UserItemCooldown.findOne({
        where: {
          user_id: userId,
          item_id: itemId,
          cooldown_ends_at: { [Op.gt]: now }
        },
        transaction
      });

      /*if (cooldown) { // пока не используем
        await transaction.rollback();
        const timeLeft = Math.ceil((cooldown.cooldown_ends_at.getTime() - now.getTime()) / 1000);
        return { success: false, message: `Предмет на перезарядке. Осталось: ${timeLeft} сек.` };
      }*/

      // 5. Потребление предмета
      inventoryItem.quantity -= quantity;
      if (inventoryItem.quantity <= 0) {
        await inventoryItem.destroy({ transaction });
      } else {
        await inventoryItem.save({ transaction });
      }

      // 6. Получение и применение эффектов (цикл по количеству, если эффекты стакаются)
      // Для простоты пока считаем, что эффекты от одного использования применяются один раз,
      // но предмет потребляется в указанном количестве.
      // Если каждый из quantity должен триггерить эффекты отдельно, логика усложнится.

      // Получаем модели здесь, после инициализации реестра и до использования
      const AlchemyItemEffectModel = modelRegistry.getModel('AlchemyItemEffect');
      const AlchemyEffectDetailsModel = modelRegistry.getModel('AlchemyEffectDetails');

      if (!AlchemyItemEffectModel) {
        console.error("Модель AlchemyItemEffect не найдена в реестре!");
        if (transaction) await transaction.rollback();
        return { success: false, message: 'Ошибка сервера: модель AlchemyItemEffect не найдена.' };
      }
      if (!AlchemyEffectDetailsModel) {
        console.error("Модель AlchemyEffectDetails не найдена в реестре!");
        if (transaction) await transaction.rollback();
        return { success: false, message: 'Ошибка сервера: модель AlchemyEffectDetails не найдена.' };
      }

      const itemEffects = await AlchemyItemEffectModel.findAll({
        where: { item_id: itemId },
        include: [{
          model: AlchemyEffectDetailsModel, // Используем полученную модель
          as: 'details'
        }],
        transaction
      });
      const cultivationProgress = await CultivationProgress.findOne({ where: { user_id: userId }, transaction });
      // const characterStats = await CharacterStats.findOne({ where: { user_id: userId }, transaction }); // Если нужно

      if (!cultivationProgress) {
          // Это критическая ситуация, если у пользователя нет записи о прогрессе культивации
          await transaction.rollback();
          return { success: false, message: 'Не найден прогресс культивации для пользователя.' };
      }
      
      let appliedEffectsDescriptions = [];

      for (const effect of itemEffects) {
        if (effect.details && effect.details.length > 0) {
          for (const detail of effect.details) {
            if (!appliedEffectsDescriptions.includes(effect.description)) {
                 appliedEffectsDescriptions.push(effect.description); // Сохраняем общее описание эффекта
            }

            const effectType = effect.effect_type;
            const targetAttribute = detail.target_attribute;
            const value = detail.value;
            const valueType = detail.value_type;
            const duration = detail.duration;

            // TODO: Разработать детальную логику применения на основе effectType и targetAttribute
            console.log(`Применение эффекта: ItemID=${itemId}, EffectType=${effectType}, Target=${targetAttribute}, Value=${value} (${valueType}), Duration=${duration}s`);

            // Основной блок новой логики
            const effectDetailsJson = {
              target_attribute: targetAttribute,
              value: value,
              value_type: valueType,
              original_description: effect.description,
              effect_id_source: effect.id,
              detail_id_source: detail.id
            };

            switch (targetAttribute) {
              case 'spiritual_energy_restore':
                if (effectType === 'instant' && cultivationProgress) {
                  const currentEnergy = Number(cultivationProgress.energy);
                  const maxEnergy = Number(cultivationProgress.max_energy);
                  const restoreAmount = Number(value);

                  if (isNaN(currentEnergy)) {
                    console.warn(`cultivationProgress.energy is NaN for user ${userId}. Defaulting to 0.`);
                    cultivationProgress.energy = 0;
                  }
                  if (isNaN(maxEnergy)) {
                    console.error(`cultivationProgress.max_energy is NaN for user ${userId}. Cannot reliably restore energy.`);
                    // Можно либо прервать, либо установить какое-то значение по умолчанию, либо не ограничивать сверху.
                    // Для безопасности пока не будем изменять энергию, если max_energy не число.
                  } else if (valueType === 'absolute' && !isNaN(restoreAmount)) {
                    cultivationProgress.energy = Math.min(maxEnergy, (isNaN(currentEnergy) ? 0 : currentEnergy) + restoreAmount);
                  } else if (valueType === 'percentage' && !isNaN(restoreAmount)) {
                    const amountToRestore = Math.floor(maxEnergy * (restoreAmount / 100));
                    cultivationProgress.energy = Math.min(maxEnergy, (isNaN(currentEnergy) ? 0 : currentEnergy) + amountToRestore);
                  } else {
                    console.warn(`Invalid value or valueType for spiritual_energy_restore: value=${value}, type=${valueType}`);
                  }
                }
                break;
              case 'health_restore':
                if (effectType === 'instant' /* && characterStats */) {
                  // TODO: Интеграция с CharacterStats для здоровья
                  // const healAmount = Number(value);
                  // if (!isNaN(healAmount) && valueType === 'absolute') {
                  //   characterStats.health = Math.min(characterStats.max_health, characterStats.health + healAmount);
                  // }
                  console.log(`TODO: Restore health by ${value} (${valueType})`);
                }
                break;
              case 'cultivation_speed_buff':
              case 'qi_control_buff':
              case 'strength_buff':
              case 'stamina_buff':
              case 'physical_defense_buff':
              case 'meditation_speed_buff':
              case 'intelligence_buff':
                // Общая логика для баффов статов
                // Предполагаем, что CharacterStats или CultivationProgress будут обновляться
                // на основе ActivePlayerEffect при их расчете/загрузке, а не напрямую здесь для временных эффектов.
                if (duration > 1) { // Только временные баффы создают ActivePlayerEffect
                  await AlchemyService._applyActivePlayerEffect(
                    ActivePlayerEffectModel, userId, itemId, `BUFF_${targetAttribute.toUpperCase()}`,
                    effectDetailsJson, duration, now, transaction
                  );
                } else if (duration === 1) {
                  // Мгновенное постоянное изменение стата (если применимо для расходуемого предмета)
                  // Например, если бы пилюля навсегда увеличивала силу.
                  console.log(`TODO: Apply instant permanent stat change for ${targetAttribute} by ${value} (${valueType})`);
                }
                // duration = 0 для пассивных от экипировки, здесь не обрабатываем для consumables
                break;
              
              case 'dispel_negative_circulation_effects':
                if (effectType === 'special' && duration === 1) {
                  // TODO: Реализовать логику снятия конкретных ActivePlayerEffect
                  // await modelRegistry.ActivePlayerEffect.destroy({
                  //   where: {
                  //     user_id: userId,
                  //     // effect_type: { [Op.like]: '%DEBUFF_CIRCULATION%' } // или более точный критерий
                  //     // Возможно, потребуется более сложная логика для определения, какие именно эффекты снимать
                  //   },
                  //   transaction
                  // });
                  console.log(`TODO: Dispel negative circulation effects for user ${userId}`);
                }
                break;

              case 'technique_comprehension_buff':
                if (duration > 1) {
                  await AlchemyService._applyActivePlayerEffect(
                    ActivePlayerEffectModel, userId, itemId, `BUFF_TECHNIQUE_COMPREHENSION`,
                    effectDetailsJson, duration, now, transaction
                  );
                } else {
                  console.log(`TODO: Apply instant/permanent technique comprehension change for ${targetAttribute} by ${value} (${valueType})`);
                }
                break;

              case 'breakthrough_chance_buff_next_attempt': // duration === 1
                if (cultivationProgress) {
                  // Это состояние должно где-то храниться и сбрасываться после попытки прорыва
                  // Например, добавить поля в CultivationProgress: temp_breakthrough_chance_buff, temp_breakthrough_buff_source_item
                  // cultivationProgress.temp_breakthrough_chance_buff = (cultivationProgress.temp_breakthrough_chance_buff || 0) + value;
                  // cultivationProgress.temp_breakthrough_buff_item = itemId; // Чтобы знать, какой предмет дал бафф
                  console.log(`TODO: Apply breakthrough_chance_buff_next_attempt: ${value}% for user ${userId}`);
                }
                break;

              case 'breakthrough_resource_cost_reduction': // duration === 1, value уже отрицательное (-20)
                if (cultivationProgress) {
                  // Аналогично шансу прорыва, это временное состояние для следующего прорыва
                  // cultivationProgress.temp_resource_reduction_percent = (cultivationProgress.temp_resource_reduction_percent || 0) + value;
                  console.log(`TODO: Apply breakthrough_resource_cost_reduction: ${value}% for user ${userId}`);
                }
                break;

              case 'spiritual_energy_full_restore': // duration === 1
                if (cultivationProgress) {
                  cultivationProgress.energy = cultivationProgress.max_energy;
                }
                break;

              case 'max_spiritual_energy_buff':
              case 'all_stats_buff': // "all_stats_buff" потребует итерации по всем релевантным статам
                if (duration > 0) { // duration = 0 для пассивных от экипировки
                  await AlchemyService._applyActivePlayerEffect(
                    ActivePlayerEffectModel, userId, itemId, `BUFF_${targetAttribute.toUpperCase()}`,
                    effectDetailsJson, duration, now, transaction
                  );
                } else if (duration === 0 && itemId.includes('_ring') || itemId.includes('_amulet') || itemId.includes('_crown')) { // Пассивный от экипировки
                    console.log(`Passive buff from equipment: ${targetAttribute} by ${value} (${valueType}). Applied when equipped.`);
                } else {
                     console.log(`TODO: Apply instant/permanent change for ${targetAttribute} by ${value} (${valueType})`);
                }
                break;

              case 'see_hidden_energies': // duration > 0 (от пилюли) или 0 (от короны)
              case 'guaranteed_breakthrough_next_attempt': // duration === 1
              case 'damage_reflection_shield_percent':
              case 'damage_absorption_cap_value':
              case 'fire_damage_direct': // duration === 1
              case 'fire_damage_dot': // duration > 1
                // Эти эффекты, скорее всего, создадут ActivePlayerEffect или изменят временные флаги
                if (duration > 0 || (duration === 0 && (itemId.includes('_ring') || itemId.includes('_amulet') || itemId.includes('_crown')))) {
                   // Для fire_damage_direct с duration=1, _applyActivePlayerEffect не создаст запись,
                   // но мы можем захотеть специальную обработку для мгновенного урона.
                   // Пока что, если duration=1, он не создаст ActivePlayerEffect.
                  await AlchemyService._applyActivePlayerEffect(
                    ActivePlayerEffectModel, userId, itemId, `${effectType.toUpperCase()}_${targetAttribute.toUpperCase()}`,
                    effectDetailsJson, duration, now, transaction
                  );
                   if (targetAttribute === 'fire_damage_direct' && duration === 1) {
                       console.log(`TODO: Apply direct fire damage ${value} to target (if applicable in this context)`);
                   }
                } else if (duration === 1 && targetAttribute === 'guaranteed_breakthrough_next_attempt') {
                     // cultivationProgress.temp_guaranteed_breakthrough_item = itemId;
                     console.log(`TODO: Apply guaranteed_breakthrough_next_attempt for user ${userId}`);
                } else {
                  console.log(`Unhandled duration case for ${targetAttribute}: duration=${duration}`);
                }
                break;

              // Следующая группа атрибутов
              case 'knockback_distance_metres': // duration: 1
                // TODO: Нужна логика определения цели и применения отбрасывания
                console.log(`TODO: Apply knockback ${value} metres. Item: ${itemId}, Effect ID: ${effect.id}, Detail ID: ${detail.id}`);
                break;

              case 'enhanced_jump_active': // duration: >0 (от талисмана)
                await AlchemyService._applyActivePlayerEffect(
                  ActivePlayerEffectModel, userId, itemId, `BUFF_ENHANCED_JUMP`,
                  effectDetailsJson, duration, now, transaction
                );
                break;

              case 'aoe_lightning_damage_value': // duration: 1
                // TODO: Нужна логика определения целей в радиусе и нанесения урона
                console.log(`TODO: Apply AOE lightning damage ${value}. Item: ${itemId}, Effect ID: ${effect.id}, Detail ID: ${detail.id}`);
                break;

              case 'stun_chance_percent': // value: шанс, duration: длительность стана
                 await AlchemyService._applyActivePlayerEffect(
                    ActivePlayerEffectModel, userId, itemId, `STATUS_STUN_CHANCE`,
                    effectDetailsJson, duration, now, transaction // duration здесь - длительность стана, value (шанс) в detailsJson
                );
                console.log(`Applied stun effect: chance ${value}%, duration ${duration}s. Item: ${itemId}, Effect ID: ${effect.id}, Detail ID: ${detail.id}`);
                break;

              case 'energy_restore_on_kill_percent': // duration: 1 (эффект триггерится мгновенно при убийстве)
                // Этот эффект должен быть пассивным, активным пока предмет "действует" (например, экипирован или активен бафф от него)
                // duration = 0 в alchemy_effect_details для этого случая будет означать "постоянно активен, пока есть источник"
                await AlchemyService._applyActivePlayerEffect(
                    ActivePlayerEffectModel, userId, itemId, `PASSIVE_ENERGY_ON_KILL`,
                    effectDetailsJson, 0, now, transaction // duration 0 для обозначения пассивного эффекта
                );
                console.log(`Passive effect 'energy_restore_on_kill_percent' (${value}%) registered. Item: ${itemId}, Effect ID: ${effect.id}, Detail ID: ${detail.id}`);
                break;

              case 'invulnerability_shield_active':
              case 'aoe_ally_shield_radius_metres':
                // Для aoe_ally_shield_radius_metres, основное действие - это щит, радиус - его свойство.
                // detailsJson будет содержать target_attribute, value (например, радиус) и т.д.
                await AlchemyService._applyActivePlayerEffect(
                  ActivePlayerEffectModel, userId, itemId, `BUFF_INVULNERABILITY_SHIELD`,
                  effectDetailsJson, duration, now, transaction
                );
                break;

              case 'shield_absorption_cap_then_knockback_value':
                // Этот эффект сложен. Сам щит (например, 'invulnerability_shield_active' или другой тип)
                // должен иметь свойство поглощения (это value). Когда урон превышает value, щит разрушается
                // и срабатывает этот эффект (отбрасывание).
                // Текущая структура ActivePlayerEffect может не полностью это поддерживать без доп. логики.
                // Возможно, создать ActivePlayerEffect для щита с этим порогом в detailsJson.
                await AlchemyService._applyActivePlayerEffect(
                  ActivePlayerEffectModel, userId, itemId, `SHIELD_WITH_ABSORPTION_KNOCKBACK`,
                  effectDetailsJson, duration, now, transaction // duration щита
                );
                console.log(`Shield with absorption ${value} and knockback on break registered. Item: ${itemId}, Effect ID: ${effect.id}, Detail ID: ${detail.id}`);
                break;

              // Пассивные/специфичные от экипировки (многие создают ActivePlayerEffect с duration = 0)
              case 'crit_chance_buff_percent':
              case 'crit_damage_buff_percent':
              // 'comprehension_rate_buff_percent' уже покрыт общим 'technique_comprehension_buff' или общим баффом стата
              case 'breakthrough_chance_buff_percent': // Постоянный, в отличие от _next_attempt
              // 'elemental_damage_reduction_percent' уже покрыт общим баффом/дебаффом
              // 'elemental_damage_output_buff_percent' уже покрыт общим баффом
                if (duration >= 0) {
                     await AlchemyService._applyActivePlayerEffect(
                        ActivePlayerEffectModel, userId, itemId, `PASSIVE_${targetAttribute.toUpperCase()}`, // или BUFF_ если duration > 0
                        effectDetailsJson, duration, now, transaction
                    );
                }
                break;

              case 'inventory_slots_increase': // duration: 0 (пассивный)
                // TODO: Прямое изменение характеристики пользователя, не через ActivePlayerEffect.
                // Например, UserProfile.inventory_slots += value; или аналогичное поле.
                console.log(`TODO: Increase inventory slots by ${value} for user ${userId}. Item: ${itemId}, Effect ID: ${effect.id}, Detail ID: ${detail.id}`);
                break;

              case 'instant_item_access_in_combat_active':
              case 'dragon_blessing_system_active':
              case 'see_hidden_essences_and_power_levels_active':
              case 'significant_luck_increase_active':
                // Эти эффекты являются флагами.
                await AlchemyService._applyActivePlayerEffect(
                  ActivePlayerEffectModel, userId, itemId, `FLAG_${targetAttribute.toUpperCase()}`,
                  effectDetailsJson, duration, now, transaction // duration здесь обычно 0 для пассивных
                );
                break;

              default:
                console.warn(`Неизвестный или необработанный target_attribute: ${targetAttribute} для effect_type: ${effectType}, item: ${itemId}, effect_id: ${effect.id}, detail_id: ${detail.id}`);
            }
          }
        } else {
          console.warn(`Эффект ${effect.id} (type: ${effect.effect_type}) для предмета ${itemId} не имеет деталей (AlchemyEffectDetails). Описание: ${effect.description}`);
        }
      }
      if (cultivationProgress && cultivationProgress.changed()) {
        await cultivationProgress.save({ transaction });
      }
      // if (characterStats && characterStats.changed()) {
      //   await characterStats.save({ transaction });
      // }


      // 7. Установка cooldown
      const cooldownProperty = await AlchemyItemProperty.findOne({
        where: { item_id: itemId, property_name: 'cooldown' },
        transaction
      });

      if (cooldownProperty && cooldownProperty.property_value > 0) {
        await UserItemCooldown.create({
          user_id: userId,
          item_id: itemId,
          cooldown_ends_at: new Date(now.getTime() + cooldownProperty.property_value * 1000)
        }, { transaction });
      }

      await transaction.commit();
      return { 
        success: true, 
        message: `Предмет "${alchemyItem.name}" успешно использован. Эффекты: ${appliedEffectsDescriptions.join(', ') || 'нет явных эффектов'}.`,
        data: {
            consumed: itemId,
            quantityConsumed: quantity,
            remainingQuantity: inventoryItem ? inventoryItem.quantity : 0,
            effectsApplied: appliedEffectsDescriptions
        }
      };

    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error('Ошибка при использовании предмета:', error);
      return { success: false, message: `Ошибка сервера при использовании предмета: ${error.message}` };
    }
  }

  /**
   * Получает рецепты алхимии по типу
   * @param {string} type Тип рецепта (pill, talisman, weapon, armor, accessory)
   * @returns {Promise<Array>} Массив рецептов указанного типа
   */
  static async getRecipesByType(type) {
    try {
      // Инициализируем реестр моделей, если он еще не инициализирован
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const AlchemyRecipe = modelRegistry.getModel('AlchemyRecipe');
      const RecipeIngredient = modelRegistry.getModel('RecipeIngredient');
      const AlchemyResult = modelRegistry.getModel('AlchemyResult');
      const InventoryItem = modelRegistry.getModel('InventoryItem');
      
      const recipes = await AlchemyRecipe.findAll({
        attributes: ['id', 'name', 'description', 'type', 'rarity', 'required_level', 'required_stage', 'success_rate', 'created_at', 'updated_at'],
        where: { type },
        include: [
          {
            model: RecipeIngredient,
            as: 'ingredients',
            attributes: ['id', 'recipe_id', 'item_id', 'quantity', 'created_at', 'updated_at'],
            include: [
              {
                model: InventoryItem,
                as: 'item',
                attributes: ['id', 'itemId', 'name', 'description', 'rarity']
              }
            ]
          },
          {
            model: AlchemyResult,
            as: 'results',
            attributes: ['id', 'recipe_id', 'item_id', 'quantity', 'chance', 'created_at', 'updated_at'],
            include: [
              {
                model: InventoryItem,
                as: 'item',
                attributes: ['id', 'itemId', 'name', 'description', 'rarity']
              }
            ]
          }
        ]
      });
      
      // Обновляем кэш для обратной совместимости
      if (!recipesByTypeCache[type]) {
        recipesByTypeCache[type] = [];
      }
      recipesByTypeCache[type] = recipes;
      
      return recipes;
    } catch (error) {
      console.error(`Ошибка при получении рецептов алхимии типа ${type}:`, error);
      // Возвращаем кэшированные данные этого типа или пустой массив при ошибках
      return (recipesByTypeCache[type] && recipesByTypeCache[type].length > 0) ? recipesByTypeCache[type] : [];
    }
  }

  /**
   * Получает рецепты алхимии, доступные для определенного уровня культивации
   * @param {string} stage Ступень культивации
   * @param {number} level Уровень культивации
   * @returns {Promise<Array>} Массив доступных рецептов
   */
  static async getAvailableRecipes(stage, level) {
    try {
      // Определяем порядок ступеней для сравнения
      const stagesOrder = ['Закалка тела', 'Очищение Ци', 'Золотое ядро', 'Формирование души'];
      const stageIndex = stagesOrder.indexOf(stage);
      
      // Получаем все рецепты
      const allRecipes = await this.getAllRecipes();
      
      // Фильтруем рецепты, доступные для текущего уровня культивации
      return allRecipes.filter(recipe => {
        const recipeStageIndex = stagesOrder.indexOf(recipe.requiredStage);
        
        // Если требуемая ступень ниже текущей - рецепт доступен
        if (recipeStageIndex < stageIndex) {
          return true;
        }
        
        // Если ступень та же, проверяем уровень
        if (recipeStageIndex === stageIndex && recipe.requiredLevel <= level) {
          return true;
        }
        
        return false;
      });
    } catch (error) {
      console.error(`Ошибка при получении доступных рецептов для ступени ${stage}, уровень ${level}:`, error);
      return [];
    }
  }

  /**
   * Создает новый рецепт алхимии
   * @param {Object} recipeData Данные о рецепте
   * @param {Array} ingredients Массив ингредиентов
   * @param {Array} results Массив результатов
   * @returns {Promise<Object>} Созданный рецепт
   */
  static async createRecipe(recipeData, ingredients, results) {

    
    try {
      // Инициализируем реестр моделей, если он еще не инициализирован
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const AlchemyRecipe = modelRegistry.getModel('AlchemyRecipe');
      const RecipeIngredient = modelRegistry.getModel('RecipeIngredient');
      const AlchemyResult = modelRegistry.getModel('AlchemyResult');
      const InventoryItem = modelRegistry.getModel('InventoryItem');
      
      // Создаем рецепт
      const recipe = await AlchemyRecipe.create(recipeData, { transaction });
      
      // Добавляем ингредиенты
      for (const ingredient of ingredients) {
        await RecipeIngredient.create({
          recipeId: recipe.id,
          itemId: ingredient.itemId,
          quantity: ingredient.quantity
        }, { transaction });
      }
      
      // Добавляем результаты
      for (const result of results) {
        await AlchemyResult.create({
          recipeId: recipe.id,
          itemId: result.itemId,
          quantity: result.quantity || 1
        }, { transaction });
      }

      
      // Возвращаем созданный рецепт с ингредиентами и результатами
      return await AlchemyRecipe.findByPk(recipe.id, {
        include: [
          {
            model: RecipeIngredient,
            as: 'ingredients',
            include: [
              {
                model: InventoryItem,
                as: 'item',
                attributes: ['id', 'itemId', 'name', 'description', 'rarity']
              }
            ]
          },
          {
            model: AlchemyResult,
            as: 'results',
            include: [
              {
                model: InventoryItem,
                as: 'item',
                attributes: ['id', 'itemId', 'name', 'description', 'rarity']
              }
            ]
          }
        ]
      });
    } catch (error) {

      console.error('Ошибка при создании рецепта алхимии:', error);
      throw error;
    }
  }

  /**
   * Проверяет наличие необходимых ингредиентов у игрока
   * @param {Array} ingredients Массив ингредиентов
   * @param {Array} inventory Инвентарь игрока
   * @returns {boolean} Результат проверки
   */
  static checkIngredients(ingredients, inventory) {
    for (const ingredient of ingredients) {
      const inventoryItem = inventory.find(item => 
        item.itemId === ingredient.itemId && item.quantity >= ingredient.quantity
      );
      
      if (!inventoryItem) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Создает предмет по рецепту алхимии
   * @param {number} recipeId ID рецепта
   * @param {number} userId ID пользователя
   * @returns {Promise<Object>} Результат создания предмета
   */
  static async craftItem(recipeId, userId) {
    try {
      // Инициализируем реестр моделей
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const AlchemyRecipe = modelRegistry.getModel('AlchemyRecipe');
      const RecipeIngredient = modelRegistry.getModel('RecipeIngredient');
      const AlchemyResult = modelRegistry.getModel('AlchemyResult');
      const InventoryItem = modelRegistry.getModel('InventoryItem');
      
      // Получаем экземпляр Sequelize через модель
      const sequelize = AlchemyRecipe.sequelize;
      if (!sequelize) {
        throw new Error('Не удалось получить экземпляр Sequelize для транзакции');
      }
      
      // Создаем транзакцию для всех операций с БД
      const transaction = await sequelize.transaction();
      
      console.log(`КРАФТ: Начало процесса крафта для пользователя ${userId}, рецепт ${recipeId}`);
      
      // Получаем рецепт с ингредиентами и результатами
      const recipe = await AlchemyRecipe.findByPk(recipeId, {
        attributes: ['id', 'name', 'description', 'type', 'rarity', 'required_level', 'required_stage', 'success_rate', 'created_at', 'updated_at'],
        include: [
          {
            model: RecipeIngredient,
            as: 'ingredients',
            attributes: ['id', 'recipe_id', 'item_id', 'quantity', 'created_at', 'updated_at'],
            include: [
              {
                model: InventoryItem,
                as: 'item',
                attributes: ['id', 'itemId', 'name', 'description', 'rarity']
              }
            ]
          },
          {
            model: AlchemyResult,
            as: 'results',
            attributes: ['id', 'recipe_id', 'item_id', 'quantity', 'chance', 'created_at', 'updated_at'],
            include: [
              {
                model: InventoryItem,
                as: 'item',
                attributes: ['id', 'itemId', 'name', 'description', 'rarity']
              }
            ]
          }
        ]
      });
      
      if (!recipe) {
        return {
          success: false,
          message: `Рецепт с ID ${recipeId} не найден`
        };
      }
      
      // Получаем инвентарь игрока
      const inventory = await InventoryItem.findAll({
        where: { userId },
        transaction
      });
      
      console.log("КРАФТ: Начальное состояние инвентаря",
        inventory.map(item => `${item.name} (ID: ${item.itemId}): ${item.quantity}`).join(', '));
      
      // Клиент уже проверил наличие ингредиентов, пропускаем эту проверку на сервере
      
      // Определяем вероятность успеха на основе типа и редкости предмета
      // Если указан явный шанс успеха в рецепте, используем его, иначе рассчитываем
      let successRate;
      if (recipe.success_rate || recipe.successRate) {
        // Используем явно указанную вероятность из рецепта
        successRate = recipe.success_rate || recipe.successRate;
      } else {
        // Рассчитываем вероятность на основе типа и редкости
        successRate = calculateSuccessRate(recipe.type || 'pill', recipe.rarity || 'common');
      }
      
      // Генерируем случайное число для определения успеха
      const roll = Math.random() * 100;
      const isSuccess = roll <= successRate;
      
      console.log(`Проверка успеха создания: шанс=${successRate}%, выпало=${roll.toFixed(2)}%, результат=${isSuccess ? 'успех' : 'неудача'}`);
      
      // Массив для хранения использованных ингредиентов (для возврата клиенту)
      const usedIngredients = [];
      
      // Удаляем ингредиенты из инвентаря (независимо от успеха)
      for (const ingredient of recipe.ingredients) {
        try {
          // Получаем ID ингредиента, поддерживая разные форматы данных
          const ingredientId = ingredient.item_id || ingredient.itemId;
          
          if (!ingredientId) {
            console.warn(`Отсутствует ID ингредиента в рецепте ${recipe.id}`);
            continue;
          }
          
          console.log(`Поиск ингредиента ${ingredientId} в инвентаре пользователя ${userId}...`);
          
          // Проверяем все возможные форматы сравнения идентификаторов
          let inventoryItem = null;
          
          // Метод 1: Прямое сравнение
          inventoryItem = inventory.find(item => item.itemId === ingredientId);
          
          // Метод 2: Сравнение строковых представлений
          if (!inventoryItem) {
            inventoryItem = inventory.find(item => String(item.itemId) === String(ingredientId));
          }
          
          // Метод 3: Поиск по вложенному объекту item
          if (!inventoryItem && ingredient.item && ingredient.item.itemId) {
            inventoryItem = inventory.find(item =>
              item.itemId === ingredient.item.itemId ||
              String(item.itemId) === String(ingredient.item.itemId)
            );
          }
          
          // Метод 4: Проверка по имени предмета (запасной вариант)
          if (!inventoryItem && ingredient.item && ingredient.item.name) {
            inventoryItem = inventory.find(item => item.name === ingredient.item.name);
          }
          
          // Если всё ещё не нашли, выводим предупреждение и пропускаем
          if (!inventoryItem) {
            console.warn(`Предмет с ID ${ingredientId} не найден в инвентаре пользователя ${userId}`);
            continue;
          }
          
          console.log(`Найден ингредиент в инвентаре: ${inventoryItem.name} (ID: ${inventoryItem.itemId}), количество: ${inventoryItem.quantity}`);
          
          // Получаем количество ингредиента
          const requiredQuantity = ingredient.quantity || 1;
          
          // Добавляем информацию об использованном ингредиенте для возврата клиенту
          usedIngredients.push({
            id: inventoryItem.itemId,
            name: inventoryItem.name,
            quantity: requiredQuantity
          });
          
          if (inventoryItem.quantity > requiredQuantity) {
            // Вычисляем новое количество
            const newQuantity = inventoryItem.quantity - requiredQuantity;
            
            // Уменьшаем количество, если у игрока больше, чем нужно
            await inventoryItem.update({
              quantity: newQuantity
            }, { transaction });
            
            // Важно: обновляем сам объект inventoryItem для правильного логирования
            inventoryItem.quantity = newQuantity;
            
            console.log(`Обновлено количество ${inventoryItem.name}: было ${inventoryItem.quantity + requiredQuantity}, стало ${inventoryItem.quantity}`);
          } else {
            // Удаляем предмет из инвентаря, если количество совпадает или меньше требуемого
            await inventoryItem.destroy({ transaction });
            console.log(`Удален предмет ${inventoryItem.name} из инвентаря`);
          }
        } catch (error) {
          console.error(`Ошибка при обработке ингредиента:`, error);
          continue; // Пропускаем этот ингредиент и продолжаем с остальными
        }
      }
      
      // Проверяем состояние инвентаря после удаления ингредиентов
      const inventoryAfterRemoval = await InventoryItem.findAll({
        where: { userId },
        transaction
      });
      
      console.log("КРАФТ: Состояние после удаления ингредиентов",
        inventoryAfterRemoval.map(item => `${item.name} (ID: ${item.itemId}): ${item.quantity}`).join(', '));
      
      // Если создание неуспешно, возвращаем информацию о неудаче
      if (!isSuccess) {
        return {
          success: false,
          message: 'Создание предмета не удалось. Ингредиенты потрачены впустую.',
          debug: {
            successRate,
            roll
          }
        };
      }
      
      // Добавляем результаты создания в инвентарь только если крафт успешен
      const createdItems = [];
      
      for (const result of recipe.results) {
        try {
          // Получаем ID результата, поддерживая разные форматы данных
          const resultItemId = result.item_id || result.itemId;
          
          if (!resultItemId) {
            console.warn(`Отсутствует ID результата в рецепте ${recipe.id}`);
            continue;
          }
          
          // Получаем количество
          const resultQuantity = result.quantity || 1;
          
          console.log(`Поиск информации о предмете ${resultItemId} в каталоге предметов...`);
          
          // Пытаемся найти информацию о предмете в каталоге через прямой SQL запрос
          let catalogItem = null;
          try {
            // Получаем модель AlchemyRecipe и через неё доступ к sequelize
            const AlchemyRecipe = modelRegistry.getModel('AlchemyRecipe');
            const sequelize = AlchemyRecipe.sequelize;
            
            // Проверяем, что sequelize получен успешно
            if (!sequelize) {
              console.warn('Не удалось получить экземпляр Sequelize для запроса к каталогу предметов');
            } else {
              // Выполняем запрос к таблице item_catalog
              const catalogItems = await sequelize.query(
                `SELECT * FROM item_catalog WHERE item_id = :itemId LIMIT 1`,
                {
                  replacements: { itemId: resultItemId },
                  type: sequelize.QueryTypes.SELECT
                }
              );
              
              // Проверяем, найден ли предмет
              if (catalogItems && catalogItems.length > 0) {
                catalogItem = catalogItems[0];
                console.log(`Найден предмет в каталоге: ${catalogItem.name}, тип: ${catalogItem.type}, редкость: ${catalogItem.rarity}`);
              } else {
                console.log(`Предмет с ID ${resultItemId} не найден в каталоге`);
              }
            }
          } catch (error) {
            console.warn(`Ошибка при поиске предмета в каталоге:`, error.message);
          }
          
          // Получаем данные предмета, приоритет: каталог > результат > значения по умолчанию
          const itemName = catalogItem?.name ||
                           (result.item ? result.item.name :
                           (typeof resultItemId === 'string' ? resultItemId : `Item #${resultItemId}`));
          
          const itemDescription = catalogItem?.description ||
                                 (result.item ? result.item.description : '');
          
          // Определяем тип в английском формате из каталога или результата
          let rawItemType = catalogItem?.type || recipe.type || 'consumable';
          
          // Переводим тип на русский язык для соответствия ограничениям БД
          let itemType = 'расходник'; // Значение по умолчанию
          switch(rawItemType.toLowerCase()) {
            case 'weapon': itemType = 'оружие'; break;
            case 'armor': itemType = 'броня'; break;
            case 'artifact': case 'talisman': itemType = 'артефакт'; break;
            case 'pill': case 'potion': case 'consumable': itemType = 'расходник'; break;
            case 'resource': itemType = 'ресурс'; break;
            default: itemType = 'расходник';
          }
          
          // Определяем редкость в английском формате из каталога или результата
          let rawItemRarity = catalogItem?.rarity ||
                             (result.item ? result.item.rarity : 'common');
          
          // Переводим редкость на русский язык для соответствия ограничениям БД
          let itemRarity = 'обычный'; // Значение по умолчанию
          switch(rawItemRarity.toLowerCase()) {
            case 'common': itemRarity = 'обычный'; break;
            case 'uncommon': itemRarity = 'необычный'; break;
            case 'rare': itemRarity = 'редкий'; break;
            case 'epic': itemRarity = 'эпический'; break;
            case 'legendary': itemRarity = 'легендарный'; break;
            default: itemRarity = 'обычный';
          }
          
          console.log(`Добавление результата в инвентарь: ${itemName} (ID: ${resultItemId}), тип: ${itemType}, редкость: ${itemRarity}, количество: ${resultQuantity}`);
          
          // Проверяем, есть ли уже такой предмет в инвентаре
          const existingItem = await InventoryItem.findOne({
            where: {
              userId,
              itemId: resultItemId
            }
          });
          
          if (existingItem) {
            // Увеличиваем количество, если предмет уже есть
            await existingItem.update({
              quantity: existingItem.quantity + resultQuantity
            }, { transaction });
            
            // Обновляем локальный объект для корректного логирования
            existingItem.quantity = existingItem.quantity + resultQuantity;
            console.log(`Обновлен существующий предмет в инвентаре: ${existingItem.name}, новое количество: ${existingItem.quantity + resultQuantity}`);
          } else {
            // Создаем новый предмет в инвентаре через InventoryService
            const newItem = await InventoryService.addInventoryItem(userId, {
              id: resultItemId,
              name: itemName,
              description: itemDescription,
              rarity: itemRarity, // Используем русскоязычное значение
              quantity: resultQuantity,
              type: itemType, // Используем русскоязычное значение (соответствует полю item_type в БД)
              stats: {} // Добавляем пустые stats, чтобы обеспечить полную совместимость с моделью
            }, { transaction });
            console.log(`Создан новый предмет в инвентаре: ${newItem.name} (тип: ${newItem.type})`);
            const completedCraftQuests = await QuestService.checkQuestEvent(userId, 'CRAFT_ITEM', { itemId: newItem.id || newItem.itemId, amount: newItem.quantity });
            for (const questId of completedCraftQuests) {
              await QuestService.completeQuest(userId, questId);
            }
          }
          
          // Добавляем информацию о созданном предмете в результат
          createdItems.push({
            id: resultItemId,
            name: itemName,
            quantity: resultQuantity,
            type: itemType,
            rarity: itemRarity
          });
        } catch (error) {
          console.error(`Ошибка при добавлении предмета в инвентарь:`, error);
          console.error(error.stack); // Выводим стек вызовов для отладки
        }
      }
      
      // Проверяем финальное состояние инвентаря
      const finalInventory = await InventoryItem.findAll({
        where: { userId },
        transaction
      });
      
      console.log("КРАФТ: Финальное состояние инвентаря",
        finalInventory.map(item => `${item.name} (ID: ${item.itemId}): ${item.quantity}`).join(', '));
      
      // Обновляем прогресс достижения "Мастер алхимии" (ID 3)
      try {
        // Инициализируем модели, если они еще не инициализированы
        const sequelize = AlchemyRecipe.sequelize;
        if (!sequelize) {
          console.warn('Не удалось получить экземпляр Sequelize для обновления прогресса достижения');
        } else {
          // Найдем существующую запись прогресса для достижения "Мастер алхимии"
          const [achievementProgress] = await sequelize.query(
            `SELECT * FROM achievement_progress WHERE user_id = :userId AND achievement_id = 3 LIMIT 1`,
            {
              replacements: { userId },
              type: sequelize.QueryTypes.SELECT
            }
          );
          
          if (achievementProgress) {
            // Если запись найдена, увеличиваем счетчик на 1
            const newValue = achievementProgress.current_value + 1;
            const isCompleted = newValue >= 10 || achievementProgress.is_completed;
            
            await sequelize.query(
              `UPDATE achievement_progress
               SET current_value = :newValue,
                   is_completed = :isCompleted,
                   completion_date = CASE WHEN :isNewlyCompleted THEN CURRENT_TIMESTAMP ELSE completion_date END,
                   updated_at = CURRENT_TIMESTAMP
               WHERE user_id = :userId AND achievement_id = 3`,
              {
                replacements: {
                  userId,
                  newValue,
                  isCompleted,
                  isNewlyCompleted: !achievementProgress.is_completed && isCompleted
                },
                type: sequelize.QueryTypes.UPDATE
              }
            );
            
            console.log(`Обновлен прогресс достижения "Мастер алхимии" для пользователя ${userId}: ${achievementProgress.current_value} -> ${newValue}`);
          } else {
            // Если запись не найдена, создаем новую с начальным значением 1
            await sequelize.query(
              `INSERT INTO achievement_progress
               (user_id, achievement_id, current_value, is_completed, is_rewarded, created_at, updated_at)
               VALUES (:userId, 3, 1, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              {
                replacements: { userId },
                type: sequelize.QueryTypes.INSERT
              }
            );
            
            console.log(`Создана запись прогресса достижения "Мастер алхимии" для пользователя ${userId} с начальным значением 1`);
          }
        }
      } catch (achievementError) {
        // Не прерываем основной процесс в случае ошибки обновления достижения
        console.error('Ошибка при обновлении прогресса достижения "Мастер алхимии":', achievementError);
      }
      
      // Завершаем транзакцию
      await transaction.commit();
      
      return {
        success: true,
        message: 'Предмет успешно создан!',
        items: createdItems,
        usedIngredients: usedIngredients // Добавляем информацию об использованных ингредиентах
      };
    } catch (error) {
      // Откатываем транзакцию в случае ошибки
      await transaction.rollback();
      
      console.error('Ошибка при создании предмета по рецепту алхимии:', error);
      return {
        success: false,
        message: `Ошибка при создании предмета: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Получает рецепт алхимии по ID
   * @param {number} id ID рецепта
   * @returns {Promise<Object|null>} Рецепт алхимии или null, если не найден
   */
  static async getRecipeById(id) {
    try {
      // Инициализируем реестр моделей, если он еще не инициализирован
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const AlchemyRecipe = modelRegistry.getModel('AlchemyRecipe');
      const RecipeIngredient = modelRegistry.getModel('RecipeIngredient');
      const AlchemyResult = modelRegistry.getModel('AlchemyResult');
      const InventoryItem = modelRegistry.getModel('InventoryItem');
      
      const recipe = await AlchemyRecipe.findByPk(id, {
        attributes: ['id', 'name', 'description', 'type', 'rarity', 'required_level', 'required_stage', 'success_rate', 'created_at', 'updated_at'],
        include: [
          {
            model: RecipeIngredient,
            as: 'ingredients',
            attributes: ['id', 'recipe_id', 'item_id', 'quantity', 'created_at', 'updated_at'],
            include: [
              {
                model: InventoryItem,
                as: 'item',
                attributes: ['id', 'itemId', 'name', 'description', 'rarity']
              }
            ]
          },
          {
            model: AlchemyResult,
            as: 'results',
            attributes: ['id', 'recipe_id', 'item_id', 'quantity', 'chance', 'created_at', 'updated_at'],
            include: [
              {
                model: InventoryItem,
                as: 'item',
                attributes: ['id', 'itemId', 'name', 'description', 'rarity']
              }
            ]
          }
        ]
      });
      
      return recipe;
    } catch (error) {
      console.error(`Ошибка при получении рецепта алхимии с ID ${id}:`, error);
      // При ошибке возвращаем null вместо выбрасывания исключения
      return null;
    }
  }

  /**
   * Получает рецепты алхимии по редкости
   * @param {string} rarity Редкость рецепта
   * @returns {Promise<Array>} Массив рецептов указанной редкости
   */
  static async getRecipesByRarity(rarity) {
    try {
      // Инициализируем реестр моделей, если он еще не инициализирован
      await modelRegistry.initializeRegistry();
      
      // Получаем модели через реестр
      const AlchemyRecipe = modelRegistry.getModel('AlchemyRecipe');
      const RecipeIngredient = modelRegistry.getModel('RecipeIngredient');
      const AlchemyResult = modelRegistry.getModel('AlchemyResult');
      const InventoryItem = modelRegistry.getModel('InventoryItem');
      
      const recipes = await AlchemyRecipe.findAll({
        attributes: ['id', 'name', 'description', 'type', 'rarity', 'required_level', 'required_stage', 'success_rate', 'created_at', 'updated_at'],
        where: { rarity },
        include: [
          {
            model: RecipeIngredient,
            as: 'ingredients',
            attributes: ['id', 'recipe_id', 'item_id', 'quantity', 'created_at', 'updated_at'],
            include: [
              {
                model: InventoryItem,
                as: 'item',
                attributes: ['id', 'itemId', 'name', 'description', 'rarity']
              }
            ]
          },
          {
            model: AlchemyResult,
            as: 'results',
            attributes: ['id', 'recipe_id', 'item_id', 'quantity', 'chance', 'created_at', 'updated_at'],
            include: [
              {
                model: InventoryItem,
                as: 'item',
                attributes: ['id', 'itemId', 'name', 'description', 'rarity']
              }
            ]
          }
        ]
      });
      
      // Обновляем кэш для обратной совместимости
      if (!recipesByRarityCache[rarity]) {
        recipesByRarityCache[rarity] = [];
      }
      recipesByRarityCache[rarity] = recipes;
      
      return recipes;
    } catch (error) {
      console.error(`Ошибка при получении рецептов алхимии редкости ${rarity}:`, error);
      // Возвращаем кэшированные данные этой редкости или пустой массив при ошибках
      return (recipesByRarityCache[rarity] && recipesByRarityCache[rarity].length > 0) ? recipesByRarityCache[rarity] : [];
    }
  }

  /**
   * Получает алхимические предметы пользователя
   * @param {number} userId ID пользователя
   * @returns {Promise<Array>} Массив алхимических предметов
   */
  static async getUserAlchemyItems(userId) {
    try {
      // Инициализируем реестр моделей, если он еще не инициализирован
      await modelRegistry.initializeRegistry();
      
      // Получаем модель через реестр
      const InventoryItem = modelRegistry.getModel('InventoryItem');
      
      // Получаем предметы алхимии из инвентаря пользователя
      return await InventoryItem.findAll({
        where: {
          userId,
          // Здесь можно добавить условие для выбора только алхимических предметов
          // Например: type: { [Op.like]: 'alchemy_%' }
        },
        include: [
          {
            model: InventoryItem,
            as: 'item',
            attributes: ['id', 'name', 'description', 'type', 'rarity', 'effects']
          }
        ]
      });
    } catch (error) {
      console.error(`Ошибка при получении алхимических предметов пользователя ${userId}:`, error);
      return [];
    }
  }

  /**
   * Использует алхимический предмет
   * @param {number} userId ID пользователя
   * @param {string} itemId ID предмета
   * @param {number} quantity Количество предметов для использования
   * @returns {Promise<Object>} Результат использования предмета
   */
  static async useAlchemyItem(userId, itemId, quantity = 1) {
    try {
      // Инициализируем реестр моделей, если он еще не инициализирован
      await modelRegistry.initializeRegistry();
      
      // Получаем модель через реестр
      const InventoryItem = modelRegistry.getModel('InventoryItem');
      
      // Получаем экземпляр Sequelize через модель
      const sequelize = InventoryItem.sequelize;
      if (!sequelize) {
        throw new Error('Не удалось получить экземпляр Sequelize для транзакции');
      }
      
      // Создаем транзакцию для всех операций с БД
      const transaction = await sequelize.transaction();
      
      // Проверяем наличие предмета в инвентаре
      const inventoryItem = await InventoryItem.findOne({
        where: {
          userId,
          itemId
        },
        transaction
      });
      
      if (!inventoryItem) {
        throw new Error(`Предмет с ID ${itemId} не найден в инвентаре пользователя`);
      }
      
      if (inventoryItem.quantity < quantity) {
        throw new Error(`У вас недостаточно предметов. Требуется: ${quantity}, имеется: ${inventoryItem.quantity}`);
      }
      
      // Получаем информацию о предмете для определения его эффектов
      const item = await InventoryItem.findByPk(itemId, { transaction });
      
      if (!item) {
        throw new Error(`Предмет с ID ${itemId} не найден в базе данных`);
      }
      
      // Используем предмет - уменьшаем количество в инвентаре
      if (inventoryItem.quantity > quantity) {
        await inventoryItem.update({
          quantity: inventoryItem.quantity - quantity
        }, { transaction });
      } else {
        // Если количество равно используемому, удаляем предмет из инвентаря
        await inventoryItem.destroy({ transaction });
      }
      
      // Здесь можно добавить логику применения эффектов предмета
      // Например, увеличение характеристик персонажа, восстановление здоровья и т.д.
      
      // Для примера, возвращаем базовые эффекты
      const effects = [
        { type: 'cultivation_boost', value: 10 },
        { type: 'energy_restore', value: 25 }
      ];
      
      await transaction.commit();
      
      return {
        success: true,
        message: `Предмет ${item.name || itemId} успешно использован (${quantity} шт.)`,
        effects
      };
    } catch (error) {
      await transaction.rollback();
      console.error(`Ошибка при использовании предмета ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Получает выпадение алхимических ингредиентов с врага
   * @param {string} enemyType Тип врага
   * @param {number} enemyLevel Уровень врага
   * @param {boolean} isBoss Является ли враг боссом
   * @param {string} [element] Стихия врага
   * @returns {Array} Массив выпавших предметов
   */
  static getEnemyDropsWithAlchemy(enemyType, enemyLevel, isBoss = false, element = null) {
    return getEnemyAlchemyDrops(enemyType, enemyLevel, isBoss, element);
  }
}

console.log(AlchemyService.useConsumableItem(22, 'qi_gathering_pill'));

module.exports = AlchemyService;
