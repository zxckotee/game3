/**
 * Тестовый скрипт для проверки новой логики расчета характеристик с эффектами экипировки
 */

const CharacterStatsService = require('./src/services/character-stats-service');

// Тестовые данные
const testUserId = 1;

// Мокаем зависимости для тестирования
const mockInventoryItems = [
  {
    id: 'sword_001',
    name: 'Меч силы',
    equipped: true,
    effects: [
      {
        type: 'statBoost',
        target: 'strength',
        value: 5,
        operation: 'absolute'
      },
      {
        type: 'combatBoost', 
        target: 'physicalDamage',
        value: 10,
        operation: 'absolute'
      }
    ]
  },
  {
    id: 'armor_001',
    name: 'Броня защиты',
    equipped: true,
    effects: [
      {
        type: 'combatBoost',
        target: 'physicalDefense',
        value: 8,
        operation: 'absolute'
      }
    ]
  },
  {
    id: 'ring_001',
    name: 'Кольцо в инвентаре',
    equipped: false, // Не экипировано - не должно учитываться
    effects: [
      {
        type: 'statBoost',
        target: 'strength',
        value: 100,
        operation: 'absolute'
      }
    ]
  }
];

async function testEquipmentEffects() {
  console.log('=== ТЕСТ ИЗВЛЕЧЕНИЯ ЭФФЕКТОВ ЭКИПИРОВКИ ===');
  
  // Тест 1: Извлечение эффектов
  const equipmentEffects = CharacterStatsService.extractEquipmentEffects(mockInventoryItems);
  console.log('Извлеченные эффекты экипировки:', equipmentEffects);
  
  // Тест 2: Преобразование эффектов
  const formattedEffects = CharacterStatsService.convertEquipmentEffectsToStatsFormat(equipmentEffects);
  console.log('Преобразованные эффекты:', formattedEffects);
  
  // Тест 3: Применение эффектов к тестовым характеристикам
  const testSecondaryStats = {
    physicalAttack: 20,
    physicalDefense: 15,
    spiritualAttack: 18,
    spiritualDefense: 12,
    attackSpeed: 10,
    criticalChance: 5,
    movementSpeed: 8,
    luck: 3
  };
  
  console.log('Базовые вторичные характеристики:', testSecondaryStats);
  
  const modifiedStats = CharacterStatsService.applyEffectsToStats(testSecondaryStats, formattedEffects);
  console.log('Модифицированные характеристики:', modifiedStats);
  
  // Проверяем ожидаемые изменения
  console.log('\n=== ПРОВЕРКА РЕЗУЛЬТАТОВ ===');
  console.log(`physicalAttack: ${testSecondaryStats.physicalAttack} → ${modifiedStats.physicalAttack} (ожидается +10 = 30)`);
  console.log(`physicalDefense: ${testSecondaryStats.physicalDefense} → ${modifiedStats.physicalDefense} (ожидается +8 = 23)`);
  
  // Проверяем, что неэкипированные предметы не влияют
  const strengthBonus = equipmentEffects.find(e => e.target === 'strength' && e.itemId === 'ring_001');
  if (!strengthBonus) {
    console.log('✅ Неэкипированные предметы корректно игнорируются');
  } else {
    console.log('❌ Неэкипированные предметы ошибочно учитываются');
  }
}

// Запускаем тест
testEquipmentEffects().catch(console.error);