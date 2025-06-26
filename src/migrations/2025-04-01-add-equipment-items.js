'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Массив предметов экипировки
    const equipmentItems = [
      // Оружие
      {
        itemId: 'bronze-sword',
        name: 'Бронзовый меч',
        type: 'weapon',
        rarity: 'common',
        properties: JSON.stringify({
          description: 'Простой бронзовый меч, подходящий для начинающих культиваторов',
          effects: [
            { type: 'statBoost', target: 'strength', value: 2, operation: 'add' },
            { type: 'combatBoost', target: 'physicalDamage', value: 5 }
          ],
          requirements: {
            level: 1,
            strength: 5
          },
          icon: 'bronze-sword.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'iron-sword',
        name: 'Железный меч',
        type: 'weapon',
        rarity: 'uncommon',
        properties: JSON.stringify({
          description: 'Крепкий железный меч, выкованный опытным кузнецом',
          effects: [
            { type: 'statBoost', target: 'strength', value: 4, operation: 'add' },
            { type: 'combatBoost', target: 'physicalDamage', value: 8 }
          ],
          requirements: {
            level: 2,
            strength: 10
          },
          icon: 'iron-sword.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'eastern-wind-blade',
        name: 'Клинок Восточного Ветра',
        type: 'weapon',
        rarity: 'rare',
        properties: JSON.stringify({
          description: 'Легкий и острый меч, созданный по древним техникам Восточного региона',
          effects: [
            { type: 'statBoost', target: 'strength', value: 6, operation: 'add' },
            { type: 'statBoost', target: 'dexterity', value: 5, operation: 'add' },
            { type: 'combatBoost', target: 'physicalDamage', value: 12 },
            { type: 'combatBoost', target: 'critChance', value: 0.05 }
          ],
          requirements: {
            level: 3,
            strength: 15,
            dexterity: 12
          },
          icon: 'eastern-wind-blade.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'azure-dragon-sword',
        name: 'Меч Лазурного Дракона',
        type: 'weapon',
        rarity: 'epic',
        properties: JSON.stringify({
          description: 'Легендарный меч, в лезвии которого заключена частица силы древнего дракона',
          effects: [
            { type: 'statBoost', target: 'strength', value: 10, operation: 'add' },
            { type: 'statBoost', target: 'dexterity', value: 8, operation: 'add' },
            { type: 'combatBoost', target: 'physicalDamage', value: 20 },
            { type: 'combatBoost', target: 'critChance', value: 0.1 },
            { type: 'elementalBoost', element: 'water', value: 15 }
          ],
          requirements: {
            level: 5,
            strength: 25,
            dexterity: 20
          },
          setId: 'azure-dragon',
          icon: 'azure-dragon-sword.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Броня для тела
      {
        itemId: 'cloth-robe',
        name: 'Льняная роба',
        type: 'armor',
        rarity: 'common',
        properties: JSON.stringify({
          armorType: 'body',
          description: 'Простая льняная роба, обеспечивающая минимальную защиту',
          effects: [
            { type: 'statBoost', target: 'vitality', value: 2, operation: 'add' },
            { type: 'combatBoost', target: 'physicalDefense', value: 3 }
          ],
          requirements: {
            level: 1
          },
          icon: 'cloth-robe.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'leather-armor',
        name: 'Кожаный доспех',
        type: 'armor',
        rarity: 'uncommon',
        properties: JSON.stringify({
          armorType: 'body',
          description: 'Прочный доспех из обработанной кожи',
          effects: [
            { type: 'statBoost', target: 'vitality', value: 3, operation: 'add' },
            { type: 'combatBoost', target: 'physicalDefense', value: 6 },
            { type: 'combatBoost', target: 'dodgeChance', value: 0.02 }
          ],
          requirements: {
            level: 2
          },
          icon: 'leather-armor.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'mountain-guardian-armor',
        name: 'Доспех Горного Стража',
        type: 'armor',
        rarity: 'rare',
        properties: JSON.stringify({
          armorType: 'body',
          description: 'Крепкий доспех, выкованный из руды, добытой в древних горах',
          effects: [
            { type: 'statBoost', target: 'vitality', value: 5, operation: 'add' },
            { type: 'statBoost', target: 'strength', value: 3, operation: 'add' },
            { type: 'combatBoost', target: 'physicalDefense', value: 12 },
            { type: 'elementalBoost', element: 'earth', value: 8 }
          ],
          requirements: {
            level: 3,
            vitality: 15
          },
          icon: 'mountain-guardian-armor.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'azure-dragon-robe',
        name: 'Одеяние Лазурного Дракона',
        type: 'armor',
        rarity: 'epic',
        properties: JSON.stringify({
          armorType: 'body',
          description: 'Мистическое одеяние, сотканное из чешуи лазурного дракона',
          effects: [
            { type: 'statBoost', target: 'vitality', value: 8, operation: 'add' },
            { type: 'statBoost', target: 'intelligence', value: 6, operation: 'add' },
            { type: 'combatBoost', target: 'physicalDefense', value: 15 },
            { type: 'combatBoost', target: 'magicDefense', value: 15 },
            { type: 'elementalBoost', element: 'water', value: 12 },
            { type: 'cultivation', target: 'comprehensionRate', value: 0.05 }
          ],
          requirements: {
            level: 5,
            vitality: 20,
            intelligence: 20
          },
          setId: 'azure-dragon',
          icon: 'azure-dragon-robe.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Шлемы
      {
        itemId: 'leather-cap',
        name: 'Кожаный шлем',
        type: 'armor',
        rarity: 'common',
        properties: JSON.stringify({
          armorType: 'head',
          description: 'Простой кожаный шлем, защищающий голову от ударов',
          effects: [
            { type: 'statBoost', target: 'vitality', value: 1, operation: 'add' },
            { type: 'combatBoost', target: 'physicalDefense', value: 2 }
          ],
          requirements: {
            level: 1
          },
          icon: 'leather-cap.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'iron-helmet',
        name: 'Железный шлем',
        type: 'armor',
        rarity: 'uncommon',
        properties: JSON.stringify({
          armorType: 'head',
          description: 'Прочный железный шлем, обеспечивающий хорошую защиту',
          effects: [
            { type: 'statBoost', target: 'vitality', value: 2, operation: 'add' },
            { type: 'combatBoost', target: 'physicalDefense', value: 4 },
            { type: 'combatBoost', target: 'magicDefense', value: 2 }
          ],
          requirements: {
            level: 2,
            strength: 8
          },
          icon: 'iron-helmet.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'perception-circlet',
        name: 'Венец Восприятия',
        type: 'armor',
        rarity: 'rare',
        properties: JSON.stringify({
          armorType: 'head',
          description: 'Легкий обруч с драгоценным камнем, усиливающий духовное восприятие',
          effects: [
            { type: 'statBoost', target: 'perception', value: 5, operation: 'add' },
            { type: 'statBoost', target: 'intelligence', value: 3, operation: 'add' },
            { type: 'combatBoost', target: 'magicDefense', value: 8 },
            { type: 'cultivation', target: 'comprehensionRate', value: 0.03 }
          ],
          requirements: {
            level: 3,
            perception: 15,
            intelligence: 12
          },
          icon: 'perception-circlet.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Перчатки
      {
        itemId: 'cloth-gloves',
        name: 'Тканевые перчатки',
        type: 'armor',
        rarity: 'common',
        properties: JSON.stringify({
          armorType: 'hands',
          description: 'Простые тканевые перчатки, защищающие руки от холода',
          effects: [
            { type: 'statBoost', target: 'dexterity', value: 1, operation: 'add' },
            { type: 'combatBoost', target: 'physicalDefense', value: 1 }
          ],
          requirements: {
            level: 1
          },
          icon: 'cloth-gloves.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'iron-gauntlets',
        name: 'Железные рукавицы',
        type: 'armor',
        rarity: 'uncommon',
        properties: JSON.stringify({
          armorType: 'hands',
          description: 'Крепкие железные рукавицы для защиты рук',
          effects: [
            { type: 'statBoost', target: 'strength', value: 2, operation: 'add' },
            { type: 'combatBoost', target: 'physicalDefense', value: 3 },
            { type: 'combatBoost', target: 'physicalDamage', value: 2 }
          ],
          requirements: {
            level: 2,
            strength: 10
          },
          icon: 'iron-gauntlets.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'spirit-channeling-gloves',
        name: 'Перчатки духовной проводимости',
        type: 'armor',
        rarity: 'rare',
        properties: JSON.stringify({
          armorType: 'hands',
          description: 'Особые перчатки, улучшающие проводимость духовной энергии',
          effects: [
            { type: 'statBoost', target: 'dexterity', value: 3, operation: 'add' },
            { type: 'statBoost', target: 'intelligence', value: 4, operation: 'add' },
            { type: 'combatBoost', target: 'magicDamage', value: 8 },
            { type: 'cultivation', target: 'energyRegen', value: 2 }
          ],
          requirements: {
            level: 3,
            intelligence: 15
          },
          icon: 'spirit-channeling-gloves.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Обувь
      {
        itemId: 'cloth-shoes',
        name: 'Тканевые ботинки',
        type: 'armor',
        rarity: 'common',
        properties: JSON.stringify({
          armorType: 'legs',
          description: 'Простые тканевые ботинки для повседневного ношения',
          effects: [
            { type: 'statBoost', target: 'dexterity', value: 1, operation: 'add' },
            { type: 'combatBoost', target: 'dodgeChance', value: 0.01 }
          ],
          requirements: {
            level: 1
          },
          icon: 'cloth-shoes.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'leather-boots',
        name: 'Кожаные сапоги',
        type: 'armor',
        rarity: 'uncommon',
        properties: JSON.stringify({
          armorType: 'legs',
          description: 'Прочные кожаные сапоги, обеспечивающие хорошую защиту и мобильность',
          effects: [
            { type: 'statBoost', target: 'dexterity', value: 2, operation: 'add' },
            { type: 'combatBoost', target: 'physicalDefense', value: 3 },
            { type: 'combatBoost', target: 'dodgeChance', value: 0.02 }
          ],
          requirements: {
            level: 2,
            dexterity: 8
          },
          icon: 'leather-boots.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'swift-wind-boots',
        name: 'Сапоги Стремительного Ветра',
        type: 'armor',
        rarity: 'rare',
        properties: JSON.stringify({
          armorType: 'legs',
          description: 'Легкие сапоги, зачарованные для увеличения скорости и маневренности',
          effects: [
            { type: 'statBoost', target: 'dexterity', value: 5, operation: 'add' },
            { type: 'combatBoost', target: 'dodgeChance', value: 0.05 },
            { type: 'special', id: 'swift-movement', name: 'Стремительное движение', description: 'Увеличивает скорость передвижения на 15%' }
          ],
          requirements: {
            level: 3,
            dexterity: 15
          },
          icon: 'swift-wind-boots.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Аксессуары
      {
        itemId: 'jade-pendant',
        name: 'Нефритовый амулет',
        type: 'accessory',
        rarity: 'common',
        properties: JSON.stringify({
          description: 'Простой амулет из нефрита, слегка усиливающий циркуляцию энергии',
          effects: [
            { type: 'statBoost', target: 'vitality', value: 1, operation: 'add' },
            { type: 'cultivation', target: 'energyMax', value: 5 }
          ],
          requirements: {
            level: 1
          },
          icon: 'jade-pendant.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'spiritual-crystal-bracelet',
        name: 'Браслет с духовным кристаллом',
        type: 'accessory',
        rarity: 'uncommon',
        properties: JSON.stringify({
          description: 'Браслет с кристаллом, накапливающим духовную энергию',
          effects: [
            { type: 'statBoost', target: 'intelligence', value: 2, operation: 'add' },
            { type: 'cultivation', target: 'energyMax', value: 10 },
            { type: 'cultivation', target: 'energyRegen', value: 1 }
          ],
          requirements: {
            level: 2,
            intelligence: 10
          },
          icon: 'spiritual-crystal-bracelet.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'celestial-perception-ring',
        name: 'Кольцо Небесного Восприятия',
        type: 'accessory',
        rarity: 'rare',
        properties: JSON.stringify({
          description: 'Древнее кольцо, улучшающее способность воспринимать духовную энергию',
          effects: [
            { type: 'statBoost', target: 'perception', value: 4, operation: 'add' },
            { type: 'statBoost', target: 'intelligence', value: 3, operation: 'add' },
            { type: 'cultivation', target: 'comprehensionRate', value: 0.05 },
            { type: 'special', id: 'energy-sight', name: 'Видение энергии', description: 'Позволяет видеть потоки духовной энергии' }
          ],
          requirements: {
            level: 3,
            perception: 15,
            intelligence: 12
          },
          icon: 'celestial-perception-ring.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'azure-dragon-scale-pendant',
        name: 'Подвеска из чешуи Лазурного Дракона',
        type: 'accessory',
        rarity: 'epic',
        properties: JSON.stringify({
          description: 'Редкая подвеска, изготовленная из чешуи легендарного Лазурного Дракона',
          effects: [
            { type: 'statBoost', target: 'vitality', value: 5, operation: 'add' },
            { type: 'statBoost', target: 'intelligence', value: 5, operation: 'add' },
            { type: 'combatBoost', target: 'magicDefense', value: 10 },
            { type: 'elementalBoost', element: 'water', value: 15 },
            { type: 'cultivation', target: 'energyMax', value: 20 }
          ],
          requirements: {
            level: 5,
            intelligence: 20
          },
          setId: 'azure-dragon',
          icon: 'azure-dragon-scale-pendant.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Артефакты
      {
        itemId: 'qi-stone',
        name: 'Камень ци',
        type: 'artifact',
        rarity: 'common',
        properties: JSON.stringify({
          description: 'Простой камень, способный накапливать небольшое количество духовной энергии',
          effects: [
            { type: 'cultivation', target: 'energyMax', value: 8 },
            { type: 'cultivation', target: 'energyRegen', value: 0.5 }
          ],
          requirements: {
            level: 1
          },
          icon: 'qi-stone.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'spirit-pearl',
        name: 'Духовная жемчужина',
        type: 'artifact',
        rarity: 'uncommon',
        properties: JSON.stringify({
          description: 'Жемчужина, в которой сконцентрирована духовная энергия моря',
          effects: [
            { type: 'statBoost', target: 'intelligence', value: 2, operation: 'add' },
            { type: 'cultivation', target: 'energyMax', value: 15 },
            { type: 'elementalBoost', element: 'water', value: 8 }
          ],
          requirements: {
            level: 2,
            intelligence: 8
          },
          icon: 'spirit-pearl.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'five-elements-vessel',
        name: 'Сосуд Пяти Стихий',
        type: 'artifact',
        rarity: 'rare',
        properties: JSON.stringify({
          description: 'Древний сосуд, способный хранить и преобразовывать энергию пяти стихий',
          effects: [
            { type: 'statBoost', target: 'intelligence', value: 4, operation: 'add' },
            { type: 'cultivation', target: 'comprehensionRate', value: 0.04 },
            { type: 'elementalBoost', element: 'fire', value: 5 },
            { type: 'elementalBoost', element: 'water', value: 5 },
            { type: 'elementalBoost', element: 'earth', value: 5 },
            { type: 'elementalBoost', element: 'air', value: 5 },
            { type: 'special', id: 'elements-harmony', name: 'Гармония Стихий', description: 'Увеличивает эффективность техник всех стихий на 5%' }
          ],
          requirements: {
            level: 4,
            intelligence: 18
          },
          icon: 'five-elements-vessel.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemId: 'heavenly-insight-mirror',
        name: 'Зеркало Небесных Откровений',
        type: 'artifact',
        rarity: 'epic',
        properties: JSON.stringify({
          description: 'Мистическое зеркало, позволяющее заглянуть в суть вещей и ускорить духовное развитие',
          effects: [
            { type: 'statBoost', target: 'perception', value: 6, operation: 'add' },
            { type: 'statBoost', target: 'intelligence', value: 6, operation: 'add' },
            { type: 'cultivation', target: 'comprehensionRate', value: 0.08 },
            { type: 'cultivation', target: 'breakthroughChance', value: 0.05 },
            { type: 'special', id: 'dao-insight', name: 'Прозрение Дао', description: 'Дает шанс получить озарение во время медитации' }
          ],
          requirements: {
            level: 5,
            perception: 20,
            intelligence: 20
          },
          icon: 'heavenly-insight-mirror.png'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Добавление предметов экипировки в таблицу инвентаря торговцев
    const merchantItems = [];
    
    // Получаем данные о торговцах
    const merchants = await queryInterface.sequelize.query(
      `SELECT id, name, specialization FROM merchants`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    // Распределяем предметы по торговцам в соответствии с их специализацией
    for (const merchant of merchants) {
      let merchantEquipment = [];
      
      if (merchant.specialization === 'оружие' || merchant.name === 'Мастер Ли') {
        // Для оружейника добавляем оружие и доспехи
        merchantEquipment = equipmentItems.filter(item => {
          const props = JSON.parse(item.properties);
          return item.type === 'weapon' || 
                 (item.type === 'armor' && ['body', 'head', 'hands', 'legs'].includes(props.armorType));
        });
      } else if (merchant.specialization === 'талисманы' || merchant.name === 'Госпожа Юнь') {
        // Для торговца талисманами добавляем аксессуары и артефакты
        merchantEquipment = equipmentItems.filter(item => 
          item.type === 'accessory' || item.type === 'artifact'
        );
      }
      
      // Добавляем предметы в инвентарь торговца
      for (const item of merchantEquipment) {
        const props = JSON.parse(item.properties);
        const price = 
          item.rarity === 'common' ? 50 + Math.floor(Math.random() * 50) :
          item.rarity === 'uncommon' ? 150 + Math.floor(Math.random() * 100) :
          item.rarity === 'rare' ? 400 + Math.floor(Math.random() * 200) :
          item.rarity === 'epic' ? 1000 + Math.floor(Math.random() * 500) : 
          100;
        
        merchantItems.push({
          merchantId: merchant.id,
          itemId: item.itemId,
          itemType: item.type,
          name: item.name,
          description: props.description,
          rarity: item.rarity,
          quantity: item.rarity === 'epic' ? 1 : -1, // -1 означает бесконечное количество
          price: price,
          currencyType: 'gold',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    // Вставляем записи в таблицу merchant_inventories
    if (merchantItems.length > 0) {
      await queryInterface.bulkInsert('merchant_inventories', merchantItems);
    }
    
    // Создаем записи в таблице InventoryItems для добавления в инвентарь
    await queryInterface.bulkInsert('InventoryItems', equipmentItems.map(item => ({
      userId: null, // Будет заполнено при покупке
      itemId: item.itemId,
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      quantity: 0, // Будет обновлено при покупке
      equipped: false,
      properties: item.properties,
      createdAt: new Date(),
      updatedAt: new Date()
    })));
  },
  
  down: async (queryInterface, Sequelize) => {
    // Удаляем записи из инвентаря торговцев
    await queryInterface.bulkDelete('merchant_inventories', {
      itemId: {
        [Sequelize.Op.in]: [
          'bronze-sword', 'iron-sword', 'eastern-wind-blade', 'azure-dragon-sword',
          'cloth-robe', 'leather-armor', 'mountain-guardian-armor', 'azure-dragon-robe',
          'leather-cap', 'iron-helmet', 'perception-circlet',
          'cloth-gloves', 'iron-gauntlets', 'spirit-channeling-gloves',
          'cloth-shoes', 'leather-boots', 'swift-wind-boots',
          'jade-pendant', 'spiritual-crystal-bracelet', 'celestial-perception-ring', 'azure-dragon-scale-pendant',
          'qi-stone', 'spirit-pearl', 'five-elements-vessel', 'heavenly-insight-mirror'
        ]
      }
    });
    
    // Удаляем шаблоны предметов экипировки
    await queryInterface.bulkDelete('InventoryItems', {
      itemId: {
        [Sequelize.Op.in]: [
          'bronze-sword', 'iron-sword', 'eastern-wind-blade', 'azure-dragon-sword',
          'cloth-robe', 'leather-armor', 'mountain-guardian-armor', 'azure-dragon-robe',
          'leather-cap', 'iron-helmet', 'perception-circlet',
          'cloth-gloves', 'iron-gauntlets', 'spirit-channeling-gloves',
          'cloth-shoes', 'leather-boots', 'swift-wind-boots',
          'jade-pendant', 'spiritual-crystal-bracelet', 'celestial-perception-ring', 'azure-dragon-scale-pendant',
          'qi-stone', 'spirit-pearl', 'five-elements-vessel', 'heavenly-insight-mirror'
        ]
      },
      userId: null
    });
  }
};
