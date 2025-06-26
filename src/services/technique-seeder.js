const { Sequelize } = require('sequelize');
const Technique = require('../models/technique');
const TechniqueEffect = require('../models/technique-effect');
const fs = require('fs');
const path = require('path');

class TechniqueSeeder {
  static async seedTechniques() {
    try {
      // Очищаем существующие техники и эффекты
      await TechniqueEffect.destroy({ where: {} });
      await Technique.destroy({ where: {} });

      // Загружаем техники из файла данных
      const techniquesFilePath = path.join(__dirname, '../data/techniques.js');
      const techniquesFileContent = fs.readFileSync(techniquesFilePath, 'utf8');
      
      // Извлекаем массив техник из файла
      const techniquesMatch = techniquesFileContent.match(/const techniques = \[([\s\S]*?)\];/);
      if (!techniquesMatch) {
        throw new Error('Не удалось найти массив техник в файле');
      }
      
      // Преобразуем содержимое файла в модуль
      const modulePath = path.join(__dirname, '../data/techniques');
      const techniquesModule = require(modulePath);
      const techniques = techniquesModule.techniques;
      
      if (!Array.isArray(techniques)) {
        throw new Error('Техники должны быть массивом');
      }
      
      console.log(`Найдено ${techniques.length} техник для загрузки`);
      
      // Создаем техники в базе данных
      for (const tech of techniques) {
        // Создаем технику
        const technique = await Technique.create({
          techniqueId: tech.id,
          name: tech.name,
          description: tech.description,
          type: tech.type,
          element: tech.element,
          icon: tech.icon,
          level: tech.level,
          damage: tech.damage,
          damageType: tech.damageType,
          healing: tech.healing || 0,
          energyCost: tech.energyCost,
          cooldown: tech.cooldown,
          maxLevel: tech.maxLevel,
          requiredLevel: tech.requiredLevel
        });
        
        // Создаем эффекты для техники
        if (tech.effects && Array.isArray(tech.effects) && tech.effects.length > 0) {
          for (const effect of tech.effects) {
            await TechniqueEffect.create({
              techniqueId: technique.id,
              type: effect.type,
              name: effect.name,
              duration: effect.duration || 0,
              damage: effect.damage || 0,
              damageType: effect.damageType,
              healing: effect.healing || 0,
              stats: effect.stats || null
            });
          }
        }
      }

      console.log('Техники успешно загружены в базу данных');
    } catch (error) {
      console.error('Ошибка при загрузке техник:', error);
      throw error;
    }
  }
}

module.exports = TechniqueSeeder;


// Экспортируем функции и константы
module.exports = {
  techniques
};

// Экспортируем отдельные свойства для совместимости
module.exports.techniques = techniques;