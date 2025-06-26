/**
 * Утилиты для отладки экипировки и бонусов
 */

// Форматированный вывод бонусов экипировки в консоль
export const printEquipmentBonuses = (bonuses) => {
  if (!bonuses) {
    console.log('%c🚫 Бонусы экипировки отсутствуют!', 'font-weight: bold; color: red;');
    return;
  }

  console.group('%c📊 Бонусы экипировки:', 'font-weight: bold; color: gold;');

  // Бонусы к характеристикам
  if (bonuses.stats) {
    console.group('%c Базовые характеристики:', 'color: aqua;');
    Object.entries(bonuses.stats).forEach(([stat, value]) => {
      const colorStyle = value > 0 
        ? 'color: green; font-weight: bold;' 
        : value < 0 
          ? 'color: red;' 
          : 'color: gray;';
      
      const statNames = {
        'strength': 'Сила',
        'dexterity': 'Ловкость',
        'vitality': 'Выносливость',
        'intelligence': 'Интеллект',
        'perception': 'Восприятие',
        'luck': 'Удача'
      };
      
      const statName = statNames[stat] || stat;
      console.log(`  ${statName}: %c${value > 0 ? '+' : ''}${value}`, colorStyle);
    });
    console.groupEnd();
  }

  // Боевые характеристики
  if (bonuses.combat) {
    console.group('%c Боевые характеристики:', 'color: red;');
    Object.entries(bonuses.combat).forEach(([stat, value]) => {
      const colorStyle = value > 0 
        ? 'color: green; font-weight: bold;' 
        : value < 0 
          ? 'color: red;' 
          : 'color: gray;';
          
      const statNames = {
        'physicalDamage': 'Физический урон',
        'magicDamage': 'Магический урон',
        'physicalDefense': 'Физическая защита',
        'magicDefense': 'Магическая защита',
        'critChance': 'Шанс крит. удара',
        'critDamage': 'Урон от крит. удара',
        'dodgeChance': 'Шанс уклонения'
      };
      
      const statName = statNames[stat] || stat;
      const suffix = ['critChance', 'critDamage', 'dodgeChance'].includes(stat) ? '%' : '';
      console.log(`  ${statName}: %c${value > 0 ? '+' : ''}${value}${suffix}`, colorStyle);
    });
    console.groupEnd();
  }

  // Характеристики культивации
  if (bonuses.cultivation) {
    console.group('%c Культивация:', 'color: cyan;');
    Object.entries(bonuses.cultivation).forEach(([stat, value]) => {
      const colorStyle = value > 0 
        ? 'color: green; font-weight: bold;' 
        : value < 0 
          ? 'color: red;' 
          : 'color: gray;';
          
      const statNames = {
        'energyMax': 'Макс. энергия',
        'energyRegen': 'Восст. энергии',
        'comprehensionRate': 'Скорость понимания',
        'breakthroughChance': 'Шанс прорыва'
      };
      
      const statName = statNames[stat] || stat;
      const suffix = stat === 'energyRegen' 
        ? '/час' 
        : ['comprehensionRate', 'breakthroughChance'].includes(stat) 
          ? '%' 
          : '';
      console.log(`  ${statName}: %c${value > 0 ? '+' : ''}${value}${suffix}`, colorStyle);
    });
    console.groupEnd();
  }

  // Стихийные бонусы
  if (bonuses.elemental) {
    console.group('%c Стихийные бонусы:', 'color: orange;');
    Object.entries(bonuses.elemental).forEach(([element, value]) => {
      const colorStyle = value > 0 
        ? 'color: green; font-weight: bold;' 
        : value < 0 
          ? 'color: red;' 
          : 'color: gray;';
          
      const elementNames = {
        'fire': 'Огонь',
        'water': 'Вода',
        'earth': 'Земля',
        'air': 'Воздух',
        'light': 'Свет',
        'dark': 'Тьма'
      };
      
      const elementName = elementNames[element] || element;
      console.log(`  ${elementName}: %c${value > 0 ? '+' : ''}${value}`, colorStyle);
    });
    console.groupEnd();
  }

  // Особые эффекты
  if (bonuses.special && bonuses.special.length > 0) {
    console.group('%c Особые эффекты:', 'color: magenta;');
    bonuses.special.forEach(effect => {
      console.log(`  %c${effect.name}:%c ${effect.description}`, 'color: yellow; font-weight: bold;', 'color: white;');
    });
    console.groupEnd();
  }

  console.groupEnd();
};

// Выводит информацию об экипированных предметах
export const printEquippedItems = (equippedItems) => {
  if (!equippedItems || Object.keys(equippedItems).length === 0) {
    console.log('%c🚫 Экипированные предметы отсутствуют!', 'font-weight: bold; color: red;');
    return;
  }

  console.group('%c⚔️ Экипированные предметы:', 'font-weight: bold; color: gold;');

  Object.entries(equippedItems).forEach(([slot, item]) => {
    if (!item) return;

    const slotNames = {
      'weapon': 'Оружие',
      'headArmor': 'Голова',
      'bodyArmor': 'Тело',
      'handArmor': 'Руки',
      'legArmor': 'Ноги',
      'accessory1': 'Аксессуар 1',
      'accessory2': 'Аксессуар 2',
      'artifact1': 'Артефакт 1',
      'artifact2': 'Артефакт 2'
    };

    const rarityColors = {
      'common': 'white',
      'uncommon': '#1eff00',
      'rare': '#0070dd',
      'epic': '#a335ee',
      'legendary': '#ff8000'
    };

    const slotName = slotNames[slot] || slot;
    const rarityColor = rarityColors[item.rarity] || 'white';

    console.group(`%c${slotName}: %c${item.name}`, 'color: gray;', `color: ${rarityColor}; font-weight: bold;`);
    console.log(`  ID: ${item.id || item.itemId}`);
    console.log(`  Тип: ${item.type}`);
    console.log(`  Редкость: %c${item.rarity}`, `color: ${rarityColor};`);
    
    // Проверяем, есть ли у предмета предрассчитанные бонусы
    if (item.calculatedBonuses) {
      console.log(`  %c✅ Имеет предрассчитанные бонусы`, 'color: green; font-weight: bold;');
    } else {
      console.log(`  %c❌ Не имеет предрассчитанных бонусов`, 'color: red;');
    }
    
    console.groupEnd();
  });

  console.groupEnd();
};

// Единая функция отладки
export const debugEquipment = (state) => {
  console.group('%c🛡️ ОТЛАДКА ЭКИПИРОВКИ', 'font-size: 16px; font-weight: bold; color: gold;');

  if (state && state.player) {
    // Вывод текущих бонусов
    printEquipmentBonuses(state.player.equipmentBonuses);
    
    // Получаем экипированные предметы
    const equippedItems = {};
    
    if (state.player.inventory && state.player.inventory.items) {
      // Сортируем по типам экипировки
      state.player.inventory.items.forEach(item => {
        if (!item.equipped) return;
        
        switch(item.type) {
          case 'weapon':
            equippedItems.weapon = item;
            break;
          case 'armor':
            // Определяем подтип брони
            const armorType = item.properties?.armorType || item.armorType;
            const itemName = item.name.toLowerCase();
            
            if (armorType === 'head' || (!armorType && (itemName.includes('шлем') || itemName.includes('шапка')))) {
              equippedItems.headArmor = item;
            }
            else if (armorType === 'legs' || (!armorType && (itemName.includes('сапог') || itemName.includes('ботин')))) {
              equippedItems.legArmor = item;
            }
            else if (armorType === 'hands' || (!armorType && (itemName.includes('перчат') || itemName.includes('рукав')))) {
              equippedItems.handArmor = item;
            }
            else {
              equippedItems.bodyArmor = item;
            }
            break;
          case 'accessory':
            if (!equippedItems.accessory1) {
              equippedItems.accessory1 = item;
            } else if (!equippedItems.accessory2) {
              equippedItems.accessory2 = item;
            }
            break;
          case 'artifact':
            if (!equippedItems.artifact1) {
              equippedItems.artifact1 = item;
            } else if (!equippedItems.artifact2) {
              equippedItems.artifact2 = item;
            }
            break;
        }
      });
      
      // Вывод экипированных предметов
      printEquippedItems(equippedItems);
    } else {
      console.log('%c❌ Нет информации об инвентаре!', 'color: red; font-weight: bold;');
    }
  } else {
    console.log('%c❌ Нет информации о состоянии игрока!', 'color: red; font-weight: bold;');
  }

  console.groupEnd();
};

// Экспортируем все функции
export default {
  printEquipmentBonuses,
  printEquippedItems,
  debugEquipment
};
