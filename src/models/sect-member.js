const { Model, DataTypes } = require('../services/database');
const connectionProvider = require('../utils/connection-provider');

// Получаем экземпляр Sequelize асинхронно
let sequelizeInstance = null;
async function getSequelize() {
  if (!sequelizeInstance) {
    const result = await connectionProvider.getSequelizeInstance();
    sequelizeInstance = result.db;
  }
  return sequelizeInstance;
}

class SectMember extends Model {
  static associate(models) {
    try {
      // Проверяем, что models существует и имеет Sequelize
      if (!models || !models.Sequelize) {
        console.warn('SectMember.associate: models или models.Sequelize не определены');
        return;
      }
      
      // Безопасное создание ассоциации с Sect
      if (models.Sect) {
        const isSectModel = models.Sect.prototype instanceof models.Sequelize.Model ||
                           typeof models.Sect.findOne === 'function' ||
                           models.Sect.prototype instanceof Model;
        
        if (isSectModel) {
          this.belongsTo(models.Sect, { as: 'sect', foreignKey: 'sectId' });
          console.log('Ассоциация SectMember -> Sect успешно установлена');
        } else {
          console.warn('Ассоциация SectMember -> Sect не установлена: Sect не является моделью Sequelize');
        }
      } else {
        console.warn('Ассоциация SectMember -> Sect не установлена: Sect не найден в models');
      }
      
      // Безопасное создание ассоциации с User
      if (models.User) {
        const isUserModel = models.User.prototype instanceof models.Sequelize.Model ||
                            typeof models.User.findOne === 'function' ||
                            models.User.prototype instanceof Model;
        
        if (isUserModel) {
          this.belongsTo(models.User, { as: 'user', foreignKey: 'userId' });
          console.log('Ассоциация SectMember -> User успешно установлена');
        } else {
          console.warn('Ассоциация SectMember -> User не установлена: User не является моделью Sequelize');
        }
      } else {
        console.warn('Ассоциация SectMember -> User не установлена: User не найден в models');
      }
    } catch (error) {
      console.error('Общая ошибка при установке ассоциаций для SectMember:', error.message);
    }
  }

  /**
   * Проверяет, можно ли тренироваться с этим членом сегодня
   * @returns {boolean} true, если можно тренироваться
   */
  canTrainToday() {
    if (!this.lastTrainingDate) return true;
    const lastTraining = new Date(this.lastTrainingDate);
    const now = new Date();
    lastTraining.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return lastTraining.getTime() !== now.getTime();
  }

  /**
   * Рассчитывает опыт, необходимый для следующего уровня
   * @returns {number} Требуемый опыт
   */
  calculateRequiredExperience() {
    this.requiredExperience = Math.floor(100 * Math.pow(1.2, this.level - 1));
    return this.requiredExperience;
  }

  /**
   * Добавляет опыт члену секты и проверяет возможность повышения уровня
   * @param {number} amount Количество опыта
   * @returns {object} Информация о повышении уровня
   */
  addExperience(amount) {
    this.experience += amount;
    const levelUp = {
      leveledUp: false,
      oldLevel: this.level,
      newLevel: this.level
    };
    while (this.experience >= this.requiredExperience) {
      this.level += 1;
      this.experience -= this.requiredExperience;
      this.calculateRequiredExperience();
      levelUp.leveledUp = true;
      levelUp.newLevel = this.level;
    }
    return levelUp;
  }

  /**
   * Обновляет роль члена секты в зависимости от уровня и лояльности
   * @returns {string} Новая роль
   */
  updateRole() {
    if (this.level >= 20 && this.loyalty >= 90) {
      this.role = 'Старейшина';
    } else if (this.level >= 10 && this.loyalty >= 70) {
      this.role = 'Внутренний ученик';
    } else {
      this.role = 'Внешний ученик';
    }
    return this.role;
  }
}

SectMember.init = async function() {
  const sequelize = await getSequelize();
  
  // Определяем поля модели. Добавляем ID и внешние ключи.
  return Model.init.call(this, {
    id: { // Добавляем ID
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: { // Добавляем внешний ключ для User
      type: DataTypes.INTEGER, // Предполагаем INTEGER ID для User
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sectId: { // Добавляем внешний ключ для Sect
      type: DataTypes.INTEGER, // Предполагаем INTEGER ID для Sect
      allowNull: false,
      field: 'sect_id',
      references: {
        model: 'sects', // Предполагаемое имя таблицы
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('Глава секты', 'Старейшина', 'Внутренний ученик', 'Внешний ученик'),
      defaultValue: 'Внешний ученик'
    },
    cultivationLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'cultivation_level'
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
    loyalty: {
      type: DataTypes.INTEGER,
      defaultValue: 50
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: true
    },
    skills: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    lastTrainingDate: {
      type: DataTypes.DATE,
      defaultValue: null,
      field: 'last_training_date'
    }
    // createdAt и updatedAt будут добавлены автоматически
  }, {
    sequelize,
    modelName: 'SectMember',
    tableName: 'sect_members', // Имя таблицы в snake_case
    timestamps: true,         // Используем timestamps
    underscored: true         // Используем snake_case для createdAt и updatedAt
  });
};

// Инициализируем модель сразу для применения изменений
(async () => {
  try {
    await SectMember.init();
    console.log('SectMember модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели SectMember:', error);
    console.error(error.stack);
  }
})();

module.exports = SectMember;
