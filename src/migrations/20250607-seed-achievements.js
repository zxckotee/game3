module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Заполняем таблицу предопределенными достижениями
    return queryInterface.bulkInsert('achievements', [
      {
        title: 'Первые шаги',
        description: 'Достигните 1-го уровня культивации',
        icon: '🧘',
        category: 'культивация',
        rewards: JSON.stringify([{"type":"currency","amount":100,"icon":"💰"}]),
        required_value: 1,
        is_hidden: false,
        display_order: 10,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'Коллекционер техник',
        description: 'Изучите 5 различных техник',
        icon: '📚',
        category: 'техники',
        rewards: JSON.stringify([{"type":"experience","amount":200,"icon":"⭐"}]),
        required_value: 5,
        is_hidden: false,
        display_order: 20,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'Исследователь',
        description: 'Откройте 10 новых локаций',
        icon: '🗺️',
        category: 'исследование',
        rewards: JSON.stringify([{"type":"item","name":"Карта сокровищ","icon":"📜"}]),
        required_value: 10,
        is_hidden: false,
        display_order: 30,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'Мастер алхимии',
        description: 'Создайте 20 алхимических предметов',
        icon: '⚗️',
        category: 'алхимия',
        rewards: JSON.stringify([{"type":"currency","amount":300,"icon":"💰"},{"type":"item","name":"Редкий ингредиент","icon":"🧪"}]),
        required_value: 20,
        is_hidden: false,
        display_order: 40,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'Охотник за сокровищами',
        description: 'Соберите 50 ценных ресурсов',
        icon: '💎',
        category: 'экономика',
        rewards: JSON.stringify([{"type":"currency","amount":500,"icon":"💰"}]),
        required_value: 50,
        is_hidden: false,
        display_order: 50,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'Воин',
        description: 'Победите 30 врагов',
        icon: '⚔️',
        category: 'битвы',
        rewards: JSON.stringify([{"type":"experience","amount":300,"icon":"⭐"}]),
        required_value: 30,
        is_hidden: false,
        display_order: 60,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'Мудрец секты',
        description: 'Достигните уровня Старейшины в своей секте',
        icon: '👑',
        category: 'социальное',
        rewards: JSON.stringify([{"type":"reputation","amount":200,"icon":"🏅"}]),
        required_value: 1,
        is_hidden: false,
        display_order: 70,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'Гранд-мастер культивации',
        description: 'Достигните 10-го уровня культивации',
        icon: '🌟',
        category: 'культивация',
        rewards: JSON.stringify([{"type":"currency","amount":1000,"icon":"💰"},{"type":"experience","amount":1000,"icon":"⭐"}]),
        required_value: 10,
        is_hidden: true,
        display_order: 100,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем все записи из таблицы достижений
    return queryInterface.bulkDelete('achievements', null, {});
  }
};