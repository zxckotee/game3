const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class EquipmentItemSpecialEffect extends Model {}

  EquipmentItemSpecialEffect.init({
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
    effect_id: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'EquipmentItemSpecialEffect',
    tableName: 'equipment_item_special_effects',
    timestamps: false
  });

  return EquipmentItemSpecialEffect;
};