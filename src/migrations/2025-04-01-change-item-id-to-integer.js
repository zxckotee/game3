'use strict';

/**
 * Миграция для изменения типа itemId с STRING на INTEGER
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Сначала создаем временную колонку с новым типом
      await queryInterface.addColumn('InventoryItems', 'itemId_new', {
        type: Sequelize.INTEGER,
        allowNull: true
      });

      // Копируем данные из старой колонки в новую, преобразуя строки в числа
      await queryInterface.sequelize.query(`
        UPDATE "InventoryItems" 
        SET "itemId_new" = CAST("itemId" AS INTEGER)
        WHERE "itemId" ~ '^[0-9]+$'
      `);

      // Удаляем старую колонку
      await queryInterface.removeColumn('InventoryItems', 'itemId');

      // Переименовываем новую колонку
      await queryInterface.renameColumn('InventoryItems', 'itemId_new', 'itemId');

      // Устанавливаем NOT NULL для новой колонки
      await queryInterface.changeColumn('InventoryItems', 'itemId', {
        type: Sequelize.INTEGER,
        allowNull: false
      });

      console.log('Миграция успешно выполнена');
    } catch (error) {
      console.error('Ошибка при выполнении миграции:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Сначала создаем временную колонку с прежним типом
      await queryInterface.addColumn('InventoryItems', 'itemId_old', {
        type: Sequelize.STRING,
        allowNull: true
      });

      // Копируем данные из текущей колонки в новую, преобразуя числа в строки
      await queryInterface.sequelize.query(`
        UPDATE "InventoryItems" 
        SET "itemId_old" = "itemId"::TEXT
      `);

      // Удаляем текущую колонку
      await queryInterface.removeColumn('InventoryItems', 'itemId');

      // Переименовываем временную колонку
      await queryInterface.renameColumn('InventoryItems', 'itemId_old', 'itemId');

      // Устанавливаем NOT NULL для колонки
      await queryInterface.changeColumn('InventoryItems', 'itemId', {
        type: Sequelize.STRING,
        allowNull: false
      });

      console.log('Откат миграции успешно выполнен');
    } catch (error) {
      console.error('Ошибка при откате миграции:', error);
      throw error;
    }
  }
};
