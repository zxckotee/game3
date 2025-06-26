module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('weather_systems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      hour: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 12
      },
      minute: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      dayPeriod: {
        type: Sequelize.ENUM('dawn', 'morning', 'noon', 'day', 'evening', 'night', 'deep_night'),
        allowNull: false,
        defaultValue: 'day'
      },
      day: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      season: {
        type: Sequelize.ENUM('spring', 'summer', 'autumn', 'winter'),
        allowNull: false,
        defaultValue: 'spring'
      },
      seasonDay: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      weather: {
        type: Sequelize.ENUM('clear', 'cloudy', 'rain', 'storm', 'fog', 'snow'),
        allowNull: false,
        defaultValue: 'clear'
      },
      weatherIntensity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'default'
      },
      lastUpdate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('weather_systems');
  }
};
