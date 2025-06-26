const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Effect extends Model {
    static associate(models) {
      Effect.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }
  
  Effect.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    source_type: {
      type: DataTypes.ENUM('technique', 'weather', 'sect', 'equipment', 'pet', 'status'),
      allowNull: false
    },
    source_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: -1 // -1 означает постоянный эффект
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Effect',
    tableName: 'effects',
    underscored: true,
    timestamps: true
  });
  
  return Effect;
};