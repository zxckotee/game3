'use strict';

module.exports = (sequelize, DataTypes) => {
  const AlchemyItemProperty = sequelize.define('AlchemyItemProperty', {
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
    property_name: { // В snake_case
      type: DataTypes.STRING,
      allowNull: false
    },
    property_value: { // В snake_case
      type: DataTypes.INTEGER, // В SQL DECIMAL(10,2), но для свойств типа duration, charges - INTEGER подходит. Если будут дробные, изменить на DataTypes.DECIMAL
      allowNull: false
    }
  }, {
    tableName: 'alchemy_item_properties',
    timestamps: true, // Убедимся, что timestamps включены (хотя они и так по умолчанию true)
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  AlchemyItemProperty.associate = (models) => {
    AlchemyItemProperty.belongsTo(models.AlchemyItem, {
      foreignKey: 'item_id', // Указываем внешний ключ в snake_case
      as: 'alchemyItem'
    });
  };

  return AlchemyItemProperty;
};