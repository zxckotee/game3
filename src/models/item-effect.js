'use strict';

/**
 * Модель для эффектов алхимических предметов
 */
module.exports = (sequelize, DataTypes) => {
  const ItemEffect = sequelize.define('ItemEffect', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    itemId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'AlchemyItems',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'ItemEffects',
    timestamps: true
  });

  ItemEffect.associate = (models) => {
    // Связь многие-к-одному с алхимическими предметами
    ItemEffect.belongsTo(models.AlchemyItem, {
      foreignKey: 'itemId',
      as: 'item',
      onDelete: 'CASCADE'
    });
  };

  return ItemEffect;
};