/**
 * Тестовый скрипт для проверки новой логики с эффектами экипировки на первичные характеристики
 */

const CharacterStatsService = require('./src/services/character-stats-service');

// Тестовые данные с эффектами на первичные и вторичные характеристики
const mockInventoryItemsWithPrimaryEffects = [
  {
    id: 'strength_ring',
    name: 'Кольцо силы',
    equipped: true,
    effects: [
      {
        type: 'statBoost',
        target: 'strength', // Эффект на первичную характеристику
        value: 5,
        operation: 'absolute'
      }
    ]
  },
  {
    id: 'combat_sword',
    name: 'Боевой меч',
    equipped: true,
    effects: [
      {
        type: 'combatBoost',
        target: 'physicalDamage', // Эффект на вторичную характеристику
        value: 8,
        operation: 'absolute'
      }
    ]
  },
  {
    id: 'intellect_amulet',
    name: 'Амулет интеллекта',
    equipped: true,
    effects: [
      {
        type: 'statBoost',
        target: 'intellect', // Эффект на первичную характеристику
        value: 3,
        operation: 'absolute'
      }
    ]
  },
  {
    id: 'defense_armor',
    name: 'Защитная броня',
    equipped: true,
    effects: [
      {
        type: 'combatBoost',
        target: 'physicalDefense', // Эффект на вторичную характеристику
        value: 12,
        operation: 'absolute'
      }
    ]
  }
];

async function testPrimaryEffectsLogic() {
  console.log('=== ТЕСТ НОВОЙ ЛОГИКИ С ЭФФЕКТАМИ НА ПЕРВИЧНЫЕ ХАРАКТЕРИСТИКИ ===\n');
  
  // Тест 1: Извлечение и разделение эффектов
  console.log('1. Извлечение эффектов экипировки:');
  const equipmentEffects = CharacterStatsService.extractEquipmentEffects(mockInventoryItemsWithPrimaryEffects);
  console.log('Извлеченные эффекты:', equipmentEffects.map(e => `${e.target}: +${e.value}`));
  
  console.log('\n2. Преобразование эффектов:');
  const formattedEffects = CharacterStatsService.convertEquipmentEffectsToStatsFormat(equipmentEffects);
  console.log('Преобразованные эффекты:', formattedEffects.map(e => `${e.effect_details_json.target_attribute}: +${e.effect_details_json.value}`));
  
  console.log('\n3. Разделение эффектов на первичные и вторичные:');
  const separatedEffects = CharacterStatsService.separateEquipmentEffects(formattedEffects);
  
  console.log('Эффекты на первичные характеристики:');
  separatedEffects.primary.forEach(effect => {
    console.log(`  - ${effect.effect_details_json.target_attribute}: +${effect.effect_details_json.value}`);
  });
  
  console.log('Эффекты на вторичные характеристики:');
  separatedEffects.secondary.forEach(effect => {
    console.log(`  - ${effect.effect_details_json.target_attribute}: +${effect.effect_details_json.value}`);
  });
  
  // Тест 2: Симуляция полного процесса
  console.log('\n=== СИМУЛЯЦИЯ ПОЛНОГО ПРОЦЕССА ===\n');
  
  // Базовые характеристики
  const baseStats = {
    strength: 10,
    intellect: 8,
    spirit: 12,
    agility: 9,
    health: 15
  };
  
  console.log('4. Базовые характеристики:', baseStats);
  
  // Применяем эффекты на первичные характеристики
  const modifiedPrimaryStats = CharacterStatsService.applyEffectsToStats(baseStats, separatedEffects.primary);
  console.log('\n5. После применения эффектов экипировки к первичным характеристикам:', modifiedPrimaryStats);
  
  // Рассчитываем вторичные характеристики
  const cultivation = { stage: 'закалка тела', level: 2 };
  const baseSecondaryStats = CharacterStatsService.calculateSecondaryStats(modifiedPrimaryStats, cultivation);
  console.log('\n6. Базовые вторичные характеристики (рассчитанные с учетом модифицированных первичных):', baseSecondaryStats);
  
  // Применяем эффекты на вторичные характеристики
  const finalSecondaryStats = CharacterStatsService.applyEffectsToStats(baseSecondaryStats, separatedEffects.secondary);
  console.log('\n7. Финальные вторичные характеристики (после применения эффектов экипировки):', finalSecondaryStats);
  
  // Тест 3: Проверка правильности расчетов
  console.log('\n=== ПРОВЕРКА ПРАВИЛЬНОСТИ РАСЧЕТОВ ===\n');
  
  console.log('Ожидаемые изменения:');
  console.log(`- strength: ${baseStats.strength} → ${modifiedPrimaryStats.strength} (+5 от кольца силы)`);
  console.log(`- intellect: ${baseStats.intellect} → ${modifiedPrimaryStats.intellect} (+3 от амулета интеллекта)`);
  console.log(`- physicalAttack: должен быть равен модифицированной силе (${modifiedPrimaryStats.strength}) + эффекты экипировки`);
  console.log(`- physicalDefense: базовое значение + 12 от защитной брони`);
  
  // Проверяем physicalAttack
  const expectedPhysicalAttack = modifiedPrimaryStats.strength; // physicalAttack = strength в calculateSecondaryStats
  const actualPhysicalAttackFromCalculation = baseSecondaryStats.physicalAttack;
  const finalPhysicalAttack = finalSecondaryStats.physicalAttack;
  
  console.log('\nДетальная проверка physicalAttack:');
  console.log(`- Модифицированная сила: ${modifiedPrimaryStats.strength}`);
  console.log(`- physicalAttack из calculateSecondaryStats: ${actualPhysicalAttackFromCalculation}`);
  console.log(`- Финальный physicalAttack: ${finalPhysicalAttack}`);
  console.log(`- Прирост от эффектов на вторичные характеристики: +${finalPhysicalAttack - actualPhysicalAttackFromCalculation}`);
  
  if (actualPhysicalAttackFromCalculation === expectedPhysicalAttack) {
    console.log('✅ physicalAttack корректно рассчитан с учетом модифицированной силы');
  } else {
    console.log('❌ physicalAttack рассчитан неправильно');
  }
  
  console.log('\n=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===');
  console.log('Первичные характеристики (с эффектами экипировки):', modifiedPrimaryStats);
  console.log('Вторичные характеристики (финальные):', finalSecondaryStats);
}

// Запускаем тест
testPrimaryEffectsLogic().catch(console.error);