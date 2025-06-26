/**
 * Миграция для добавления колонки team_size в таблицу pvp_modes
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем колонку team_size, которая вычисляется как половина player_count
    await queryInterface.addColumn('pvp_modes', 'team_size', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // Обновляем значения для существующих записей
    await queryInterface.sequelize.query(`
      UPDATE pvp_modes 
      SET team_size = CEILING(player_count / 2)
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('pvp_modes', 'team_size');
  }
};