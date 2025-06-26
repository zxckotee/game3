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

class Sect extends Model {
  static associate(models) {
    this.hasMany(models.SectMember, { as: 'members', foreignKey: 'sectId' }); // Оставляем camelCase
    this.belongsTo(models.User, { as: 'leader', foreignKey: 'leaderId' }); // Оставляем camelCase
  }

  /**
   * Вычисляет и обновляет бонусы секты на основе её уровня
   */
  updateBenefits() {
    this.benefits = [
      {type: 'cultivation_speed', modifier: Math.round(0.05 * this.level * 100)},
      {type: 'resource_gathering', modifier: Math.round(0.03 * this.level * 100)},
      {type: 'energy_regen', modifier: 1 * this.level},
      {type: 'technique_discount', modifier: Math.round(Math.min(0.5, 0.02 * this.level) * 100)},
      {type: 'max_energy', modifier: 10 * this.level}
    ];
  }

  /**
   * Возвращает ранг секты в зависимости от её уровня
   */
  updateRank() {
    if (this.level >= 30) {
      this.rank = 'Бессмертная';
    } else if (this.level >= 20) {
      this.rank = 'Верховная';
    } else if (this.level >= 15) {
      this.rank = 'Великая';
    } else if (this.level >= 10) {
      this.rank = 'Большая';
    } else if (this.level >= 5) {
      this.rank = 'Средняя';
    } else {
      this.rank = 'Начальная';
    }
    return this.rank;
  }

  /**
   * Вычисляет и возвращает требуемый опыт для следующего уровня
   */
  calculateRequiredExperience() {
    this.requiredExperience = Math.floor(100 * Math.pow(1.5, this.level - 1));
    return this.requiredExperience;
  }
}

Sect.init = async function() {
  const sequelize = await getSequelize();
  
  // Определяем поля модели. Добавляем ID и внешний ключ leaderId.
  return Model.init.call(this, {
    id: { // Добавляем ID
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    leaderId: { // Добавляем внешний ключ для User
      type: DataTypes.INTEGER, // Предполагаем INTEGER ID для User
      allowNull: false,
      field: 'leader_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rank: {
      type: DataTypes.STRING,
      defaultValue: 'Начальная'
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    requiredExperience: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      field: 'required_experience'
    },
    influence: {
      type: DataTypes.INTEGER, 
      defaultValue: 100
    },
    resources: { // Это поле может быть избыточным, если есть resourcesJson
      type: DataTypes.INTEGER,
      defaultValue: 50
    },
    resourcesJson: { // Поле для хранения ресурсов в JSON
      type: DataTypes.JSON,
      defaultValue: {},
      field: 'resources_json'
    },
    territories: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    techniques: { // Возможно, это поле должно быть связью, а не JSON
      type: DataTypes.JSON,
      defaultValue: []
    },
    foundingDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'founding_date'
    },
    benefits: {
      type: DataTypes.JSON,
      defaultValue: [
        {type: 'cultivation_speed', modifier: 5},
        {type: 'resource_gathering', modifier: 3},
        {type: 'energy_regen', modifier: 1},
        {type: 'technique_discount', modifier: 2},
        {type: 'max_energy', modifier: 10}
      ]
    }
    // createdAt и updatedAt будут добавлены автоматически
  }, {
    sequelize,
    modelName: 'Sect',
    tableName: 'sects', // Имя таблицы в snake_case
    timestamps: true,  // Используем timestamps
    underscored: true  // Используем snake_case для createdAt и updatedAt
  });
};

// Инициализируем модель сразу для применения изменений
(async () => {
  try {
    await Sect.init();
    console.log('Sect модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели Sect:', error);
    console.error(error.stack);
  }
})();

module.exports = Sect;
