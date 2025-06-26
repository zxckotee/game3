/**
 * Утилиты для расчета бонусов экипировки напрямую из эффектов предметов
 * Извлекает данные из state.player.inventory.items[].effects
 */

/**
 * Рассчитывает общие бонусы экипировки на основе эффектов экипированных предметов
 * @param {Array} inventoryItems - Массив предметов инвентаря
 * @returns {Object} - Объект с суммарными бонусами
 */
export function calculateEquipmentBonusesFromInventory(inventoryItems) {
  if (!inventoryItems || !Array.isArray(inventoryItems)) {
    console.warn('Невозможно рассчитать бонусы: инвентарь недоступен или не является массивом');
    return createEmptyBonusStructure();
  }
  
  // Создаем базовую структуру для суммарных бонусов
  const totalBonuses = createEmptyBonusStructure();
  
  // Фильтруем только экипированные предметы
  const equippedItems = inventoryItems.filter(item => item.equipped);
  
  console.log(`[equipmentBonusCalculator] Расчет бонусов для ${equippedItems.length} экипированных предметов`);
  
  // Для каждого экипированного предмета извлекаем и обрабатываем эффекты
  equippedItems.forEach(item => {
    console.log(`[equipmentBonusCalculator] Обработка предмета: ${item.name || item.id}`);
    
    // Пропускаем, если у предмета нет эффектов
    if (!item.effects || !Array.isArray(item.effects)) {
      console.log(`[equipmentBonusCalculator] Предмет ${item.name || item.id} не имеет эффектов`);
      return;
    }
    
    console.log(`[equipmentBonusCalculator] Найдено ${item.effects.length} эффектов у предмета ${item.name || item.id}`);
    console.log(`[equipmentBonusCalculator] Эффекты:`, item.effects);
    
    // Обрабатываем каждый эффект предмета
    item.effects.forEach(effect => {
      // Проверяем, что effect реально существует
      if (!effect) {
        console.warn(`[equipmentBonusCalculator] Пустой эффект в предмете ${item.name || item.id}`);
        return;
      }
      
      // Выводим подробную информацию о каждом эффекте
      console.log(`[equipmentBonusCalculator] Обработка эффекта:`, effect);
      
      // Преобразуем строковое значение в число
      // ИСПРАВЛЕНИЕ: Добавлена проверка и правильное преобразование
      let value = 0;
      if (typeof effect.value === 'string') {
        // Убираем кавычки и преобразуем в число
        value = parseFloat(effect.value.replace(/"/g, ''));
      } else if (typeof effect.value === 'number') {
        value = effect.value;
      }
      
      // Проверяем, что значение было успешно преобразовано
      if (isNaN(value)) {
        console.warn(`[equipmentBonusCalculator] Неверное значение эффекта: ${effect.value}`);
        return;
      }
      
      console.log(`[equipmentBonusCalculator] Преобразованное значение: ${value}`);
      
      // ИСПРАВЛЕНИЕ: Обработка по точным названиям из скриншота
      switch (effect.type) {
        case 'statBoost':
          // Прямое обновление силы
          if (effect.target === 'strength') {
            totalBonuses.stats.strength += value;
            console.log(`[equipmentBonusCalculator] Добавлено ${value} к силе`);
          } 
          // Можно добавить больше проверок для других характеристик
          else if (effect.target === 'dexterity') {
            totalBonuses.stats.dexterity += value;
          }
          else if (effect.target === 'vitality') {
            totalBonuses.stats.vitality += value;
          }
          else if (effect.target === 'intelligence') {
            totalBonuses.stats.intelligence += value;
          }
          else if (effect.target === 'perception') {
            totalBonuses.stats.perception += value;
          }
          else if (effect.target === 'luck') {
            totalBonuses.stats.luck += value;
          }
          else {
            console.warn(`[equipmentBonusCalculator] Неизвестная цель statBoost: ${effect.target}`);
          }
          break;
          
        case 'combatBoost':
          // Прямое обновление физического урона
          if (effect.target === 'physicalDamage') {
            totalBonuses.combat.physicalDamage += value;
            console.log(`[equipmentBonusCalculator] Добавлено ${value} к физическому урону`);
          }
          // Можно добавить больше проверок для других боевых характеристик
          else if (effect.target === 'magicDamage') {
            totalBonuses.combat.magicDamage += value;
          }
          else if (effect.target === 'physicalDefense') {
            totalBonuses.combat.physicalDefense += value;
          }
          else if (effect.target === 'magicDefense') {
            totalBonuses.combat.magicDefense += value;
          }
          else if (effect.target === 'critChance') {
            totalBonuses.combat.critChance += value;
          }
          else if (effect.target === 'critDamage') {
            totalBonuses.combat.critDamage += value;
          }
          else if (effect.target === 'dodgeChance') {
            totalBonuses.combat.dodgeChance += value;
          }
          else {
            console.warn(`[equipmentBonusCalculator] Неизвестная цель combatBoost: ${effect.target}`);
          }
          break;
          
        case 'cultivationBoost':
          if (effect.target === 'energyMax') {
            totalBonuses.cultivation.energyMax += value;
          }
          else if (effect.target === 'energyRegen') {
            totalBonuses.cultivation.energyRegen += value;
          }
          else if (effect.target === 'comprehensionRate') {
            totalBonuses.cultivation.comprehensionRate += value;
          }
          else if (effect.target === 'breakthroughChance') {
            totalBonuses.cultivation.breakthroughChance += value;
          }
          else {
            console.warn(`[equipmentBonusCalculator] Неизвестная цель cultivationBoost: ${effect.target}`);
          }
          break;
          
        case 'elementalBoost':
          if (effect.element) {
            if (totalBonuses.elemental[effect.element] !== undefined) {
              totalBonuses.elemental[effect.element] += value;
            } else {
              console.warn(`[equipmentBonusCalculator] Неизвестный элемент: ${effect.element}`);
            }
          } else {
            console.warn(`[equipmentBonusCalculator] У элементального эффекта отсутствует элемент`);
          }
          break;
          
        case 'special':
          const specialEffect = {
            id: effect.id || `special-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: effect.name || 'Особый эффект',
            description: effect.description || 'Нет описания'
          };
          totalBonuses.special.push(specialEffect);
          console.log(`[equipmentBonusCalculator] Добавлен особый эффект: ${specialEffect.name}`);
          break;
          
        default:
          console.warn(`[equipmentBonusCalculator] Неизвестный тип эффекта: ${effect.type}`);
      }
    });
  });
  
  // Проверка на наборы (сеты) экипировки
  processEquipmentSets(equippedItems, totalBonuses);
  
  console.log(`[equipmentBonusCalculator] Итоговые бонусы:`, totalBonuses);
  return totalBonuses;
}

/**
 * Обрабатывает бонусы наборов экипировки
 * @param {Array} equippedItems - Массив экипированных предметов
 * @param {Object} totalBonuses - Объект с суммарными бонусами для обновления
 */
function processEquipmentSets(equippedItems, totalBonuses) {
  // Группировка предметов по наборам
  const setItems = {};
  
  equippedItems.forEach(item => {
    if (item.setId) {
      if (!setItems[item.setId]) {
        setItems[item.setId] = [];
      }
      setItems[item.setId].push(item);
    }
  });
  
  // Если нет наборов, выходим
  if (Object.keys(setItems).length === 0) {
    return;
  }
  
  console.log(`[equipmentBonusCalculator] Обработка наборов экипировки: ${Object.keys(setItems).length} наборов`);
  
  // Для каждого набора проверяем активные бонусы
  Object.entries(setItems).forEach(([setId, items]) => {
    console.log(`[equipmentBonusCalculator] Набор ${setId}: ${items.length} предметов`);
    
    // Пример сетов (можно заменить на реальные данные из API или конфигурации)
    const setData = {
      'novice_set': {
        name: 'Набор новичка',
        bonuses: [
          { 
            count: 2,
            effects: [{
              type: 'cultivationBoost',
              target: 'energyMax',
              value: 10
            }, {
              type: 'cultivationBoost',
              target: 'energyRegen',
              value: 1
            }]
          }
        ]
      },
      'azure-dragon': {
        name: 'Набор Лазурного Дракона',
        bonuses: [
          { 
            count: 2,
            effects: [{
              type: 'statBoost',
              target: 'strength',
              value: 20
            }]
          },
          {
            count: 4,
            effects: [{
              type: 'special',
              id: 'azure-dragon-breath',
              name: 'Дыхание Лазурного Дракона',
              description: 'Позволяет использовать атаку дыханием дракона'
            }]
          }
        ]
      }
    };
    
    // Если набор известен, применяем бонусы
    const set = setData[setId];
    if (set) {
      console.log(`[equipmentBonusCalculator] Применение бонусов набора ${set.name}`);
      
      // Проверяем каждый уровень бонусов набора
      set.bonuses.forEach(bonusLevel => {
        // Если экипировано достаточно предметов из набора
        if (items.length >= bonusLevel.count) {
          console.log(`[equipmentBonusCalculator] Активирован бонус за ${bonusLevel.count} предмета(ов)`);
          
          // Применяем эффекты
          if (bonusLevel.effects && Array.isArray(bonusLevel.effects)) {
            bonusLevel.effects.forEach(effect => {
              // Простая копия логики из основной функции для обработки эффектов
              let value = typeof effect.value === 'string' ? parseFloat(effect.value) : effect.value || 0;
              
              switch (effect.type) {
                case 'statBoost':
                  if (totalBonuses.stats[effect.target] !== undefined) {
                    totalBonuses.stats[effect.target] += value;
                  }
                  break;
                  
                case 'combatBoost':
                  if (totalBonuses.combat[effect.target] !== undefined) {
                    totalBonuses.combat[effect.target] += value;
                  }
                  break;
                  
                case 'cultivationBoost':
                  if (totalBonuses.cultivation[effect.target] !== undefined) {
                    totalBonuses.cultivation[effect.target] += value;
                  }
                  break;
                  
                case 'elementalBoost':
                  if (effect.element && totalBonuses.elemental[effect.element] !== undefined) {
                    totalBonuses.elemental[effect.element] += value;
                  }
                  break;
                  
                case 'special':
                  totalBonuses.special.push({
                    id: effect.id || `set-special-${Date.now()}`,
                    name: effect.name || 'Особый эффект набора',
                    description: effect.description || 'Нет описания'
                  });
                  break;
              }
            });
          }
        }
      });
    } else {
      console.log(`[equipmentBonusCalculator] Набор ${setId} не найден в базе данных`);
    }
  });
}

/**
 * Создает пустую структуру бонусов
 * @returns {Object} - Пустая структура бонусов
 */
export function createEmptyBonusStructure() {
  return {
    stats: { strength: 0, dexterity: 0, vitality: 0, intelligence: 0, perception: 0, luck: 0 },
    combat: { physicalDamage: 0, magicDamage: 0, physicalDefense: 0, magicDefense: 0, critChance: 0, critDamage: 0, dodgeChance: 0 },
    cultivation: { energyMax: 0, energyRegen: 0, comprehensionRate: 0, breakthroughChance: 0 },
    elemental: { fire: 0, water: 0, earth: 0, air: 0, light: 0, dark: 0 },
    special: []
  };
}

export default {
  calculateEquipmentBonusesFromInventory,
  createEmptyBonusStructure
};