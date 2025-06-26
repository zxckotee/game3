/**
 * Тест для проверки исправлений циклических зависимостей в адаптерах
 */

// Импортируем модули констант напрямую
console.log('\n=== ТЕСТИРОВАНИЕ МОДУЛЕЙ КОНСТАНТ ===');
const ResourceConstants = require('../constants/resource-constants');
const SpiritPetConstants = require('../constants/spirit-pet-constants');
const AlchemyConstants = require('../constants/alchemy-constants');

console.log('ResourceConstants.RESOURCE_TYPES доступны:', !!ResourceConstants.RESOURCE_TYPES);
console.log('SpiritPetConstants.PET_TYPES доступны:', !!SpiritPetConstants.PET_TYPES);
console.log('AlchemyConstants.ITEM_TYPES доступны:', !!AlchemyConstants.ITEM_TYPES);

// Импортируем адаптеры с циклическими зависимостями
const ResourceAdapter = require('../services/resource-adapter');
const SpiritPetsAdapter = require('../data/spirit-pets-adapter');
const AlchemyAdapter = require('../services/alchemy-service-adapter');

// Функция для проверки наличия свойств и методов в адаптере
function testAdapter(name, adapter, expectedProps = [], expectedMethods = []) {
  console.log(`\n=== Тестирование адаптера: ${name} ===`);
  
  console.log('\nСвойства:');
  expectedProps.forEach(prop => {
    const exists = adapter[prop] !== undefined;
    console.log(`- ${prop}: ${exists ? 'Доступно' : 'Недоступно'}`);
    if (exists) {
      console.log(`  Значение: ${JSON.stringify(adapter[prop]).substring(0, 100)}...`);
    }
  });
  
  console.log('\nМетоды:');
  expectedMethods.forEach(method => {
    const exists = typeof adapter[method] === 'function';
    console.log(`- ${method}: ${exists ? 'Доступно' : 'Недоступно'}`);
  });
}

// Запускаем тесты
console.log('\n=== ТЕСТИРОВАНИЕ ИСПРАВЛЕНИЙ ЦИКЛИЧЕСКИХ ЗАВИСИМОСТЕЙ ===');

// Проверяем, что RESOURCE_TYPES совпадают
console.log('\nПроверка совпадения констант:');
console.log('ResourceAdapter.RESOURCE_TYPES === ResourceConstants.RESOURCE_TYPES:',
  ResourceAdapter.RESOURCE_TYPES === ResourceConstants.RESOURCE_TYPES);
console.log('SpiritPetsAdapter.PET_TYPES === SpiritPetConstants.PET_TYPES:',
  SpiritPetsAdapter.PET_TYPES === SpiritPetConstants.PET_TYPES);
console.log('AlchemyAdapter.ITEM_TYPES === AlchemyConstants.ITEM_TYPES:',
  AlchemyAdapter.ITEM_TYPES === AlchemyConstants.ITEM_TYPES);

// Тест ResourceAdapter
testAdapter('ResourceAdapter', ResourceAdapter,
  ['RESOURCE_TYPES', 'RARITY'],
  ['getAllResources', 'getResourceById', 'getResourcesByType', 'getResourcesByRarity']
);

// Тест SpiritPetsAdapter
testAdapter('SpiritPetsAdapter', SpiritPetsAdapter,
  ['PET_TYPES', 'spiritPets', 'petTypes', 'petTypeBaseStats', 'petTypeAbilities', 'evolutionStages', 'petSpawnLocations'],
  ['calculateExpForLevel', 'calculateStatBonus', 'calculateCombatBonus', 'getSpiritPetById']
);

// Тест AlchemyAdapter
testAdapter('AlchemyAdapter', AlchemyAdapter,
  ['alchemyItems', 'ITEM_TYPES', 'RARITY', 'EFFECT_TYPES', 'RECIPE_CATEGORIES'],
  ['getAllRecipes', 'getRecipeById', 'getRecipesByType', 'getRecipesByRarity']
);

console.log('\n=== ТЕСТЫ ЗАВЕРШЕНЫ ===');