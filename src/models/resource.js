'use strict';

/**
 * Модель для игровых ресурсов
 */
module.exports = (sequelize, DataTypes) => {
  const Resource = sequelize.define('Resource', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rarity: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    stackable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    maxStack: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 99,
      field: 'max_stack'
    },
    effects: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'image_url'
    }
  }, {
    tableName: 'resources',
    timestamps: true
  });

  Resource.associate = (models) => {
    // Ресурс может быть связан с другими моделями, например, с инвентарем
    // (здесь можно добавить связи при необходимости)
  };

  return Resource;
};
