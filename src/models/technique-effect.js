const { Model, DataTypes } = require('../services/database');
const { unifiedDatabase } = require('../services/database-connection-manager');

// Получаем экземпляр Sequelize асинхронно
let sequelizeInstance = null;
async function getSequelize() {
  if (!sequelizeInstance) {
    const result = await unifiedDatabase.getSequelizeInstance();
    sequelizeInstance = result.db;
  }
  return sequelizeInstance;
}

class TechniqueEffect extends Model {
  static associate(models) {
    // Определение связей с другими моделями
    TechniqueEffect.belongsTo(models.Technique, {
      foreignKey: 'technique_id', // Используем snake_case
      as: 'technique'
    });
    // Связь со статистиками эффекта (если есть модель TechniqueEffectStat)
    // TechniqueEffect.hasMany(models.TechniqueEffectStat, { foreignKey: 'effect_id', as: 'stats' });
  }
}

// Исправление: не используем super за пределами класса
TechniqueEffect.init = async function() {
  const sequelize = await getSequelize();
  
  // Вызываем метод init стандартным образом
  return Model.init.call(this, {
    id: { // Соответствует id в SQL
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    techniqueId: { // Соответствует technique_id в SQL
      type: DataTypes.STRING(30), // Исправлен тип
      allowNull: false,
      field: 'technique_id',
      references: {
        model: 'techniques', // Имя таблицы в lowercase
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    type: { // Соответствует type в SQL
      type: DataTypes.STRING(30), // Исправлен тип
      allowNull: false
    },
    name: { // Соответствует name в SQL
      type: DataTypes.STRING(100), // Исправлен тип
      allowNull: false
    },
    duration: { // Соответствует duration в SQL
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    damage: { // Соответствует damage в SQL
      type: DataTypes.INTEGER
      // defaultValue убрано
    },
    damageType: { // Соответствует damage_type в SQL
      type: DataTypes.STRING(20),
      field: 'damage_type'
    },
    healing: { // Соответствует healing в SQL
      type: DataTypes.INTEGER
      // defaultValue убрано
    }
    // Поле stats удалено
  }, {
    sequelize,
    modelName: 'TechniqueEffect',
    tableName: 'technique_effects', // Исправлено: имя таблицы в snake_case
    timestamps: false               // В SQL нет полей created_at, updated_at
  });
};

// Инициализируем модель сразу для применения изменений
(async () => {
  try {
    await TechniqueEffect.init();
    console.log('TechniqueEffect модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели TechniqueEffect:', error);
    console.error(error.stack);
  }
})();

module.exports = TechniqueEffect;
