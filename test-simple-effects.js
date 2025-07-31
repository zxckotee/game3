/**
 * Простой тест новой логики без зависимостей от базы данных
 */

// Мокаем зависимости
const mockCharacterStatsService = {
  extractEquipmentEffects: function(inventoryItems) {
    if (!inventoryItems || !Array.isArray(inventoryItems)) {
      console.warn('[CharacterStats] Инвентарь недоступен или не является массивом');
      return [];
    }

    const equipmentEffects = [];
    const equippedItems = inventoryItems.filter(item => item.equipped === true);
    
    console.log(`[CharacterStats] Найдено ${equippedItems.length} экипированных предметов`);
    
    equippedItems.forEach(item => {
      if (item.effects && Array.isArray(item.effects)) {
        console.log(`[CharacterStats] Предмет ${item.name || item.id} имеет ${item.effects.length} эффектов`);
        
        item.effects.forEach(effect => {
          if (effect && effect.target && effect.value !== undefined) {
            equipmentEffects.push({
              ...effect,
              source: 'equipment',
              itemId: item.id || item.item_id,
              itemName: item.name
            });
          }
        });
      }
    });
    
    console.log(`[CharacterStats] Извлечено ${equipmentEffects.length} эффектов экипировки`);
    return equipmentEffects;
  },

  convertEquipmentEffectsToStatsFormat: function(equipmentEffects) {
    if (!equipmentEffects || !Array.isArray(equipmentEffects)) {
      return [];
    }

    const targetMapping = {
      'strength': 'strength',
      'intellect': 'intellect', 
      'intelligence': 'intellect',
      'spirit': 'spirit',
      'agility': 'agility',
      'dexterity': 'agility',
      'health': 'health',
      'vitality': 'health',
      'luck': 'luck',
      'physicalDamage': 'physicalAttack',
      'physicalAttack': 'physicalAttack',
      'physicalDefense': 'physicalDefense',
      'spiritualAttack': 'spiritualAttack',
      'spiritualDefense': 'spiritualDefense',
      'magicDamage': 'spiritualAttack',
      'magicDefense': 'spiritualDefense',
      'attackSpeed': 'attackSpeed',
      'criticalChance': 'criticalChance',
      'critChance': 'criticalChance',
      'movementSpeed': 'movementSpeed'
    };

    return equipmentEffects.map(effect => {
      const mappedTarget = targetMapping[effect.target] || effect.target;
      
      return {
        effect_details_json: {
          target_attribute: mappedTarget,
          value: parseFloat(effect.value) || 0,
          value_type: effect.operation === 'percentage' ? 'percentage' : 'absolute'
        },
        effect_type: 'equipment',
        source: effect.source || 'equipment',
        itemId: effect.itemId,
        itemName: effect.itemName
      };
    }).filter(effect => {
      const details = effect.effect_details_json;
      return details.target_attribute && !isNaN(details.value);
    });
  },

  separateEquipmentEffects: function(formattedEquipmentEffects) {
    const primaryStats = ['strength', 'intellect', 'spirit', 'agility', 'health', 'luck'];
    
    const primaryEffects = [];
    const secondaryEffects = [];
    
    formattedEquipmentEffects.forEach(effect => {
      const targetAttribute = effect.effect_details_json.target_attribute;
      
      if (primaryStats.includes(targetAttribute)) {
        primaryEffects.push(effect);
      } else {
        secondaryEffects.push(effect);
      }
    });
    
    console.log(`[CharacterStats] Разделение эффектов экипировки: ${primaryEffects.length} на первичные характеристики, ${secondaryEffects.length} на вторичные`);
    
    return {
      primary: primaryEffects,
      secondary: secondaryEffects
    };
  },

  applyEffectsToStats: function(baseStats, activeEffects) {
    const modifiedState = { ...baseStats };
    let appliedEffectsCount = 0;

    console.log(`[Stats] Применение ${activeEffects.length} эффектов к характеристикам`);

    for (const effect of activeEffects) {
      const details = effect.effect_details_json;
      if (!details) continue;

      const targetAttribute = details.target_attribute;
      const value = parseFloat(details.value);
      const valueType = details.value_type;

      if (isNaN(value) || !targetAttribute) {
        console.warn(`[Stats] Пропуск неверного эффекта:`, details);
        continue;
      }

      if (!modifiedState.hasOwnProperty(targetAttribute)) {
        console.log(`[Stats] Инициализация новой характеристики: ${targetAttribute} = 0`);
        modifiedState[targetAttribute] = 0;
      }
      
      const oldValue = modifiedState[targetAttribute];
      if (valueType === 'percentage') {
        const baseValue = parseFloat(baseStats[targetAttribute]) || 0;
        modifiedState[targetAttribute] += baseValue * (value / 100);
      } else {
        modifiedState[targetAttribute] += value;
      }
      
      const effectSource = effect.source || effect.effect_type || 'unknown';
      console.log(`[Stats] ${effectSource} эффект: ${targetAttribute} ${oldValue} → ${modifiedState[targetAttribute]} (${valueType === 'percentage' ? value + '%' : '+' + value})`);
      appliedEffectsCount++;
    }
    
    for(const key in modifiedState) {
      if(typeof modifiedState[key] === 'number') {
          modifiedState[key] = Math.floor(modifiedState[key]);
      }
    }

    console.log(`[Stats] Применено ${appliedEffectsCount} эффектов из ${activeEffects.length}`);
    return modifiedState;
  },

  calculateSecondaryStats: function(stats, cultivation) {
    if (!stats || !cultivation) {
      return {
        physicalAttack: 0,
        physicalDefense: 0,
        spiritualAttack: 0,
        spiritualDefense: 0,
        attackSpeed: 0,
        criticalChance: 0,
        movementSpeed: 0,
        luck: 0
      };
    }
    
    const stageValues = {
      'закалка тела': 0,
      'очищение ци': 100,
      'золотое ядро': 300,
      'формирование души': 500
    };
    
    const stage = cultivation.stage ? cultivation.stage.toLowerCase() : '';
    const level = cultivation.level || 1;
    const totalLevel = (stageValues[stage] || 0) + (level - 1);
    
    return {
      physicalAttack: Math.floor(stats.strength),
      physicalDefense: Math.floor(stats.strength * 0.5 + stats.health * 0.3 + totalLevel * 0.2),
      spiritualAttack: Math.floor(stats.spirit + stats.intellect * 0.5),
      spiritualDefense: Math.floor(stats.spirit * 0.5 + stats.intellect * 0.3 + totalLevel * 0.2),
      attackSpeed: Math.floor(stats.agility * 0.6 + totalLevel * 0.1),
      criticalChance: Math.floor(stats.agility * 0.3 + stats.intellect * 0.2),
      movementSpeed: Math.floor(stats.agility * 0.4 + totalLevel * 0.1),
      luck: Math.floor((stats.spirit + stats.intellect) * 0.2)
    };
  }
};

// Тестовые данные
const mockInventoryItems = [
  {
    id: 'strength_ring',
    name: 'Кольцо силы',
    equipped: true,
    effects: [
      { type: 'statBoost', target: 'strength', value: 5, operation: 'absolute' }
    ]
  },
  {
    id: 'combat_sword',
    name: 'Боевой меч',
    equipped: true,
    effects: [
      { type: 'combatBoost', target: 'physicalDamage', value: 8, operation: 'absolute' }
    ]
  },
  {
    id: 'intellect_amulet',
    name: 'Амулет интеллекта',
    equipped: true,
    effects: [
      { type: 'statBoost', target: 'intellect', value: 3, operation: 'absolute' }
    ]
  }
];

async function testNewLogic() {
  console.log('=== ТЕСТ НОВОЙ ЛОГИКИ С ЭФФЕКТАМИ НА ПЕРВИЧНЫЕ ХАРАКТЕРИСТИКИ ===\n');
  
  // 1. Извлечение эффектов
  const equipmentEffects = mockCharacterStatsService.extractEquipmentEffects(mockInventoryItems);
  
  // 2. Преобразование эффектов
  const formattedEffects = mockCharacterStatsService.convertEquipmentEffectsToStatsFormat(equipmentEffects);
  
  // 3. Разделение эффектов
  const separatedEffects = mockCharacterStatsService.separateEquipmentEffects(formattedEffects);
  
  console.log('\nЭффекты на первичные характеристики:');
  separatedEffects.primary.forEach(effect => {
    console.log(`  - ${effect.effect_details_json.target_attribute}: +${effect.effect_details_json.value}`);
  });
  
  console.log('\nЭффекты на вторичные характеристики:');
  separatedEffects.secondary.forEach(effect => {
    console.log(`  - ${effect.effect_details_json.target_attribute}: +${effect.effect_details_json.value}`);
  });
  
  // 4. Симуляция полного процесса
  console.log('\n=== СИМУЛЯЦИЯ ПОЛНОГО ПРОЦЕССА ===\n');
  
  const baseStats = { strength: 10, intellect: 8, spirit: 12, agility: 9, health: 15 };
  console.log('Базовые характеристики:', baseStats);
  
  // Применяем эффекты на первичные характеристики
  const modifiedPrimaryStats = mockCharacterStatsService.applyEffectsToStats(baseStats, separatedEffects.primary);
  console.log('\nПосле применения эффектов экипировки к первичным характеристикам:', modifiedPrimaryStats);
  
  // Рассчитываем вторичные характеристики
  const cultivation = { stage: 'закалка тела', level: 2 };
  const baseSecondaryStats = mockCharacterStatsService.calculateSecondaryStats(modifiedPrimaryStats, cultivation);
  console.log('\nБазовые вторичные характеристики (с учетом модифицированных первичных):', baseSecondaryStats);
  
  // Применяем эффекты на вторичные характеристики
  const finalSecondaryStats = mockCharacterStatsService.applyEffectsToStats(baseSecondaryStats, separatedEffects.secondary);
  console.log('\nФинальные вторичные характеристики:', finalSecondaryStats);
  
  // Проверка результатов
  console.log('\n=== ПРОВЕРКА РЕЗУЛЬТАТОВ ===\n');
  
  console.log('✅ Проверка эффектов на первичные характеристики:');
  console.log(`- strength: ${baseStats.strength} → ${modifiedPrimaryStats.strength} (ожидалось +5)`);
  console.log(`- intellect: ${baseStats.intellect} → ${modifiedPrimaryStats.intellect} (ожидалось +3)`);
  
  console.log('\n✅ Проверка влияния на вторичные характеристики:');
  console.log(`- physicalAttack: ${baseSecondaryStats.physicalAttack} (должен равняться модифицированной силе: ${modifiedPrimaryStats.strength})`);
  console.log(`- finalPhysicalAttack: ${finalSecondaryStats.physicalAttack} (базовый + эффекты экипировки: ${baseSecondaryStats.physicalAttack} + 8 = ${baseSecondaryStats.physicalAttack + 8})`);
  
  // Итоговые проверки
  const strengthCorrect = modifiedPrimaryStats.strength === baseStats.strength + 5;
  const intellectCorrect = modifiedPrimaryStats.intellect === baseStats.intellect + 3;
  const physicalAttackCorrect = baseSecondaryStats.physicalAttack === modifiedPrimaryStats.strength;
  const finalPhysicalAttackCorrect = finalSecondaryStats.physicalAttack === baseSecondaryStats.physicalAttack + 8;
  
  console.log('\n=== ИТОГОВЫЕ РЕЗУЛЬТАТЫ ===');
  console.log(`${strengthCorrect ? '✅' : '❌'} Эффект на силу применен правильно`);
  console.log(`${intellectCorrect ? '✅' : '❌'} Эффект на интеллект применен правильно`);
  console.log(`${physicalAttackCorrect ? '✅' : '❌'} physicalAttack рассчитан с учетом модифицированной силы`);
  console.log(`${finalPhysicalAttackCorrect ? '✅' : '❌'} Эффекты экипировки на вторичные характеристики применены правильно`);
  
  if (strengthCorrect && intellectCorrect && physicalAttackCorrect && finalPhysicalAttackCorrect) {
    console.log('\n🎉 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО! Новая логика работает корректно.');
  } else {
    console.log('\n❌ Некоторые тесты не прошли. Требуется доработка.');
  }
}

testNewLogic().catch(console.error);