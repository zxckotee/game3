const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class EquipmentItemEffect extends Model {}

  EquipmentItemEffect.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    item_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'equipment_items', // Ссылка на таблицу
        key: 'item_id'
      }
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    target: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    value: {
      type: DataTypes.DECIMAL(10, 5),
      allowNull: false
    },
    operation: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'EquipmentItemEffect',
    tableName: 'equipment_item_effects',
    timestamps: false
  });

  return EquipmentItemEffect;
};