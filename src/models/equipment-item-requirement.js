const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class EquipmentItemRequirement extends Model {}

  EquipmentItemRequirement.init({
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
    value: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'EquipmentItemRequirement',
    tableName: 'equipment_item_requirements',
    timestamps: false
  });

  return EquipmentItemRequirement;
};