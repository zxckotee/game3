module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('weather_systems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      currentTime: {
        type: Sequelize.INTEGER, // время в минутах от 0 до 1439
        defaultValue: 720 // полдень
      },
      daysPassed: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      weatherType: {
        type: Sequelize.STRING,
        defaultValue: 'ясно'
      },
      weatherIntensity: {
        type: Sequelize.INTEGER,
        defaultValue: 5
      },
      lastUpdated: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      activeSpecialEvent: {
        type: Sequelize.STRING,
        allowNull: true
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
  down: async (queryInterface) => {
    await queryInterface.dropTable('weather_systems');
  }
};
