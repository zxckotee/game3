module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AlchemyRecipes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      type: {
        type: Sequelize.ENUM('pill', 'talisman', 'weapon', 'armor', 'accessory'),
        allowNull: false
      },
      rarity: {
        type: Sequelize.ENUM('common', 'uncommon', 'rare', 'epic', 'legendary'),
        allowNull: false,
        defaultValue: 'common'
      },
      requiredLevel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      requiredStage: {
        type: Sequelize.ENUM('Закалка тела', 'Очищение Ци', 'Золотое ядро', 'Формирование души'),
        allowNull: false,
        defaultValue: 'Закалка тела'
      },
      successRate: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 100.0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AlchemyRecipes');
  }
};
