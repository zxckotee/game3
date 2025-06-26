/**
 * Сервис для работы с системой репутации
 * Обеспечивает функциональность для управления репутацией, определения уровней,
 * расчета влияния на связанные репутации и проверки доступных возможностей
 */
const Reputation = require('../models/reputation');
const ReputationFeature = require('../models/reputation-feature');
const ReputationRelation = require('../models/reputation-relation');
const { Op } = require('sequelize');

class ReputationService {
  /**
   * Получение репутации игрока
   * @param {number} userId - ID пользователя
   * @param {string} entityType - Тип сущности (city, faction, global)
   * @param {number} entityId - ID сущности
   * @param {string} sphere - Сфера влияния
   * @returns {Promise<Object>} - Данные о репутации
   */
  async getReputation(userId, entityType, entityId, sphere = 'general') {
    let reputation = await Reputation.findOne({
      where: {
        userId,
        entityType,
        entityId: entityId || null,
        sphere
      }
    });

    if (!reputation) {
      // Если репутация не найдена, создаем запись с нейтральным значением
      reputation = await Reputation.create({
        userId,
        entityType,
        entityId: entityId || null,
        sphere,
        value: 0,
        level: 'нейтральный',
        history: []
      });
    }

    return reputation;
  }

  /**
   * Изменение репутации с учетом влияния на связанные репутации
   * @param {number} userId - ID пользователя
   * @param {string} entityType - Тип сущности (city, faction, global)
   * @param {number} entityId - ID сущности
   * @param {string} sphere - Сфера влияния
   * @param {number} amount - Изменение значения (положительное или отрицательное)
   * @param {string} reason - Причина изменения репутации
   * @returns {Promise<Object>} - Данные об измененной репутации и связанных изменениях
   */
  async changeReputation(userId, entityType, entityId, sphere, amount, reason) {
    // Получаем текущую репутацию
    const reputation = await this.getReputation(userId, entityType, entityId, sphere);
    const oldValue = reputation.value;
    const oldLevel = reputation.level;

    // Рассчитываем новое значение (ограничиваем от -100 до 100)
    const newValue = Math.max(-100, Math.min(100, oldValue + amount));
    
    // Определяем новый уровень
    const newLevel = this.calculateReputationLevel(newValue);
    
    // Запись в историю изменений
    const historyEntry = {
      date: new Date().toISOString(),
      oldValue,
      newValue,
      change: amount,
      reason
    };
    
    const history = [...reputation.history];
    history.push(historyEntry);
    
    // Сохраняем обновленную репутацию
    await reputation.update({
      value: newValue,
      level: newLevel,
      history
    });
    
    // Проверяем и обрабатываем связанные изменения репутации
    const relatedChanges = await this.processRelatedReputations(
      userId, entityType, entityId, sphere, amount, reason
    );
    
    // Проверяем изменение уровня репутации и доступность новых возможностей
    let unlockedFeatures = [];
    if (oldLevel !== newLevel && amount > 0) {
      unlockedFeatures = await this.checkNewFeatures(userId, entityType, entityId, sphere, newLevel);
    }
    
    return {
      reputation,
      relatedChanges,
      unlockedFeatures,
      levelChanged: oldLevel !== newLevel
    };
  }

  /**
   * Обработка влияния на связанные репутации
   * @param {number} userId - ID пользователя
   * @param {string} entityType - Тип сущности (city, faction, global)
   * @param {number} entityId - ID сущности
   * @param {string} sphere - Сфера влияния
   * @param {number} amount - Изменение значения
   * @param {string} reason - Причина изменения репутации
   * @returns {Promise<Array>} - Список связанных изменений
   */
  async processRelatedReputations(userId, entityType, entityId, sphere, amount, reason) {
    // Находим все связанные репутации
    const relations = await ReputationRelation.findAll({
      where: {
        sourceType: entityType,
        sourceId: entityId || null,
        sourceSphere: sphere,
        isActive: true
      }
    });
    
    const relatedChanges = [];
    
    // Обрабатываем каждую связанную репутацию
    for (const relation of relations) {
      // Рассчитываем влияние на связанную репутацию
      const relatedAmount = Math.round(amount * relation.impactFactor);
      
      // Если влияние есть, изменяем связанную репутацию
      if (relatedAmount !== 0) {
        const relatedReason = `${reason} (Влияние от ${entityType} ${entityId || 'global'} ${sphere})`;
        
        const change = await this.changeReputation(
          userId,
          relation.targetType,
          relation.targetId,
          relation.targetSphere,
          relatedAmount,
          relatedReason
        );
        
        relatedChanges.push({
          entityType: relation.targetType,
          entityId: relation.targetId,
          sphere: relation.targetSphere,
          amount: relatedAmount,
          description: relation.description
        });
      }
    }
    
    return relatedChanges;
  }

  /**
   * Определение уровня репутации на основе числового значения
   * @param {number} value - Числовое значение репутации (-100 до 100)
   * @returns {string} - Уровень репутации
   */
  calculateReputationLevel(value) {
    if (value <= -75) return 'враждебный';
    if (value <= -50) return 'неприязненный';
    if (value <= -25) return 'подозрительный';
    if (value < 25) return 'нейтральный';
    if (value < 50) return 'дружелюбный';
    if (value < 75) return 'уважаемый';
    if (value < 100) return 'почитаемый';
    return 'легендарный';
  }

  /**
   * Проверка новых доступных возможностей
   * @param {number} userId - ID пользователя
   * @param {string} entityType - Тип сущности (city, faction, global)
   * @param {number} entityId - ID сущности
   * @param {string} sphere - Сфера влияния
   * @param {string} level - Текущий уровень репутации
   * @returns {Promise<Array>} - Список разблокированных возможностей
   */
  async checkNewFeatures(userId, entityType, entityId, sphere, level) {
    // Уровни репутации в порядке возрастания
    const levels = [
      'дружелюбный', 'уважаемый', 'почитаемый', 'легендарный'
    ];
    
    // Определяем индекс текущего уровня
    const levelIndex = levels.indexOf(level);
    if (levelIndex === -1) return []; // Если уровень ниже "дружелюбный"
    
    // Находим все возможности, доступные на текущем уровне
    const features = await ReputationFeature.findAll({
      where: {
        entityType,
        entityId: entityId || null,
        sphere: [sphere, 'general'], // Учитываем как конкретную сферу, так и общие возможности
        requiredLevel: level, // Только возможности, требующие текущий уровень
        isActive: true
      }
    });
    
    return features;
  }

  /**
   * Получение всех доступных возможностей для игрока
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>} - Список доступных возможностей
   */
  async getAvailableFeatures(userId) {
    // Получаем все репутации игрока
    const reputations = await Reputation.findAll({
      where: { userId }
    });
    
    const availableFeatures = [];
    
    // Для каждой репутации проверяем доступные возможности
    for (const reputation of reputations) {
      // Пропускаем репутации ниже "дружелюбный"
      if (['враждебный', 'неприязненный', 'подозрительный', 'нейтральный'].includes(reputation.level)) {
        continue;
      }
      
      // Находим все возможности, доступные на текущем и более низких уровнях
      const features = await ReputationFeature.findAll({
        where: {
          entityType: reputation.entityType,
          entityId: reputation.entityId,
          sphere: [reputation.sphere, 'general'],
          requiredLevel: this.getAccessibleLevels(reputation.level),
          isActive: true
        }
      });
      
      availableFeatures.push(...features);
    }
    
    return availableFeatures;
  }

  /**
   * Получение всех уровней репутации, доступных на данном уровне и ниже
   * @param {string} level - Текущий уровень репутации
   * @returns {Array} - Список доступных уровней
   */
  getAccessibleLevels(level) {
    const levels = [
      'дружелюбный', 'уважаемый', 'почитаемый', 'легендарный'
    ];
    
    const levelIndex = levels.indexOf(level);
    if (levelIndex === -1) return [];
    
    return levels.slice(0, levelIndex + 1);
  }

  /**
   * Определение отношения NPC к игроку
   * @param {number} userId - ID пользователя
   * @param {number} npcId - ID NPC
   * @returns {Promise<Object>} - Информация об отношении NPC
   */
  async getNpcAttitude(userId, npcId) {
    // Здесь должна быть логика получения информации о NPC из базы данных
    // Для примера используем заглушку
    const npc = {
      id: npcId,
      name: 'NPC',
      cityId: 1,
      factionId: 2,
      primarySphere: 'trade',
      personalBias: 0 // Личное отношение NPC к игроку
    };
    
    // Получаем репутацию игрока в городе NPC
    const cityReputation = await this.getReputation(userId, 'city', npc.cityId, 'general');
    
    // Получаем репутацию игрока в сфере влияния NPC
    const sphereReputation = await this.getReputation(userId, 'city', npc.cityId, npc.primarySphere);
    
    // Получаем репутацию игрока во фракции NPC
    const factionReputation = await this.getReputation(userId, 'faction', npc.factionId, 'general');
    
    // Базовые значения для разных уровней репутации
    const attitudeValues = {
      'враждебный': 0,
      'неприязненный': 20,
      'подозрительный': 40,
      'нейтральный': 50,
      'дружелюбный': 60,
      'уважаемый': 75,
      'почитаемый': 90,
      'легендарный': 100
    };
    
    // Финальный расчет отношения
    const baseAttitude = attitudeValues[cityReputation.level];
    const sphereModifier = (attitudeValues[sphereReputation.level] - 50) * 0.5;
    const factionModifier = (attitudeValues[factionReputation.level] - 50) * 0.3;
    
    const finalAttitude = Math.max(0, Math.min(100, 
      baseAttitude + sphereModifier + factionModifier + npc.personalBias));
    
    // Определение уровня отношения на основе числового значения
    let attitudeLevel;
    if (finalAttitude < 20) attitudeLevel = 'враждебный';
    else if (finalAttitude < 40) attitudeLevel = 'неприязненный';
    else if (finalAttitude < 50) attitudeLevel = 'подозрительный';
    else if (finalAttitude < 60) attitudeLevel = 'нейтральный';
    else if (finalAttitude < 75) attitudeLevel = 'дружелюбный';
    else if (finalAttitude < 90) attitudeLevel = 'уважаемый';
    else attitudeLevel = 'почитаемый';
    
    // Расчет модификатора цены в зависимости от отношения
    const priceModifier = this.calculatePriceModifier(finalAttitude, 1.0);
    
    return {
      attitudeValue: finalAttitude,
      attitudeLevel,
      priceModifier,
      dialogue: this.selectDialogue(attitudeLevel)
    };
  }

  /**
   * Расчет модификатора цены в зависимости от отношения
   * @param {number} attitude - Числовое значение отношения (0-100)
   * @param {number} greedFactor - Фактор жадности NPC (0.5-1.5)
   * @returns {number} - Модификатор цены (0.7-1.5)
   */
  calculatePriceModifier(attitude, greedFactor = 1.0) {
    // Базовый диапазон модификатора: от 0.7 (лучшая цена) до 1.5 (худшая цена)
    // 0.7 при отношении 100, 1.5 при отношении 0
    const baseModifier = 1.5 - (attitude / 100) * 0.8;
    
    // Применяем фактор жадности NPC (может усилить или ослабить эффект)
    return baseModifier * greedFactor;
  }

  /**
   * Выбор диалога в зависимости от уровня отношения
   * @param {string} attitudeLevel - Уровень отношения
   * @returns {string} - Диалог NPC
   */
  selectDialogue(attitudeLevel) {
    const dialogues = {
      'враждебный': 'Убирайся отсюда, пока я не позвал стражу!',
      'неприязненный': 'Что тебе нужно? У меня нет времени на таких, как ты.',
      'подозрительный': 'Я не уверен, что могу тебе доверять, но слушаю.',
      'нейтральный': 'Приветствую. Чем могу помочь?',
      'дружелюбный': 'Рад видеть тебя снова! Чем могу быть полезен сегодня?',
      'уважаемый': 'Почтенный культиватор! Для меня честь служить вам.',
      'почитаемый': 'Великий мастер! Позвольте выразить мое глубочайшее почтение!'
    };
    
    return dialogues[attitudeLevel] || dialogues['нейтральный'];
  }
}

module.exports = new ReputationService();
