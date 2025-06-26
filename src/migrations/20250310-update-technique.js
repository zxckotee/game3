const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Обновляем тип поля type, чтобы включить все типы техник
    await queryInterface.changeColumn('Techniques', 'type', {
      type: Sequelize.STRING,
      allowNull: false
    });

    // Обновляем тип поля element, чтобы включить все элементы
    await queryInterface.changeColumn('Techniques', 'element', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Добавляем новые поля
    await queryInterface.addColumn('Techniques', 'techniqueId', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });

    await queryInterface.addColumn('Techniques', 'icon', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Techniques', 'damageType', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Techniques', 'healing', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('Techniques', 'maxLevel', {
      type: Sequelize.INTEGER,
      defaultValue: 5
    });

    await queryInterface.addColumn('Techniques', 'requiredLevel', {
      type: Sequelize.INTEGER,
      defaultValue: 1
    });

    // Переименовываем поле requiredCultivationLevel в requiredLevel
    await queryInterface.renameColumn('Techniques', 'requiredCultivationLevel', 'requiredCultivationLevel_old');
    
    // Копируем данные из старого поля в новое
    await queryInterface.sequelize.query(`
      UPDATE "Techniques" 
      SET "requiredLevel" = "requiredCultivationLevel_old"
    `);
    
    // Удаляем старое поле
    await queryInterface.removeColumn('Techniques', 'requiredCultivationLevel_old');
  },

  down: async (queryInterface, Sequelize) => {
    // Возвращаем тип поля type к исходному
    await queryInterface.changeColumn('Techniques', 'type', {
      type: Sequelize.ENUM('боевая', 'защитная', 'вспомогательная'),
      allowNull: false
    });

    // Возвращаем тип поля element к исходному
    await queryInterface.changeColumn('Techniques', 'element', {
      type: Sequelize.ENUM('огонь', 'вода', 'дерево', 'металл', 'земля', 'молния', 'ветер', 'тьма', 'свет'),
      allowNull: false
    });

    // Удаляем добавленные поля
    await queryInterface.removeColumn('Techniques', 'techniqueId');
    await queryInterface.removeColumn('Techniques', 'icon');
    await queryInterface.removeColumn('Techniques', 'damageType');
    await queryInterface.removeColumn('Techniques', 'healing');
    await queryInterface.removeColumn('Techniques', 'maxLevel');

    // Возвращаем поле requiredCultivationLevel
    await queryInterface.renameColumn('Techniques', 'requiredLevel', 'requiredLevel_old');
    await queryInterface.addColumn('Techniques', 'requiredCultivationLevel', {
      type: Sequelize.INTEGER,
      defaultValue: 1
    });
    
    // Копируем данные из временного поля в новое
    await queryInterface.sequelize.query(`
      UPDATE "Techniques" 
      SET "requiredCultivationLevel" = "requiredLevel_old"
    `);
    
    // Удаляем временное поле
    await queryInterface.removeColumn('Techniques', 'requiredLevel_old');
  }
};
