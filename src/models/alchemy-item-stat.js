'use strict';

module.exports = (sequelize, DataTypes) => {
  const AlchemyItemStat = sequelize.define('AlchemyItemStat', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    item_id: { // В snake_case
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'alchemy_items', // Имя таблицы в snake_case
        key: 'id'
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    stat_name: { // В snake_case
      type: DataTypes.STRING,
      allowNull: false
    },
    stat_value: { // В snake_case
      type: DataTypes.DECIMAL(10, 2), // Соответствует SQL DECIMAL(10, 2)
      allowNull: false
    }
  }, {
    tableName: 'alchemy_item_stats',
    timestamps: true, // Убедимся, что timestamps включены
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  AlchemyItemStat.associate = (models) => {
    AlchemyItemStat.belongsTo(models.AlchemyItem, {
      foreignKey: 'item_id', // Указываем внешний ключ в snake_case
      as: 'alchemyItem'
    });
  };

  return AlchemyItemStat;
};