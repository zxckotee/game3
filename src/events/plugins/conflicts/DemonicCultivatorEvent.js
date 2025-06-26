/**
 * DemonicCultivatorEvent.js
 * Реализация события вторжения демонических культиваторов
 */

import { GlobalConflictEvent } from './GlobalConflictEvent';

/**
 * Класс события вторжения демонических культиваторов
 * Расширяет базовый класс глобального конфликта
 */
class DemonicCultivatorEvent extends GlobalConflictEvent {
  /**
   * Конструктор события вторжения демонических культиваторов
   */
  constructor() {
    super({
      id: 'demonic_cultivator_invasion',
      name: 'Вторжение демонических культиваторов',
      description: 'Группа демонических культиваторов вторглась в регион. Они разрушают духовные формации и оскверняют священные места.',
      minPlayerLevel: 5,
      scaleTypes: ['local', 'regional', 'global'],
      defaultScale: 'local',
      affectedFactions: ['sect', 'village', 'demonic_sect'],
    });
    
    // Типы демонических культиваторов для разных масштабов
    this.demonicTypes = {
      local: [
        { id: 'demonic_disciple', name: 'Ученик демонического пути', powerFactor: 0.9, healthFactor: 8, damageFactor: 1.8 },
        { id: 'blood_puppeteer', name: 'Кукловод крови', powerFactor: 0.8, healthFactor: 7, damageFactor: 2.2 }
      ],
      regional: [
        { id: 'demonic_disciple', name: 'Ученик демонического пути', powerFactor: 0.9, healthFactor: 8, damageFactor: 1.8 },
        { id: 'blood_puppeteer', name: 'Кукловод крови', powerFactor: 0.8, healthFactor: 7, damageFactor: 2.2 },
        { id: 'void_walker', name: 'Странник пустоты', powerFactor: 1.3, healthFactor: 12, damageFactor: 2.6 },
        { id: 'demonic_elder', name: 'Старейшина демонического пути', powerFactor: 1.5, healthFactor: 18, damageFactor: 3.0 }
      ],
      global: [
        { id: 'demonic_disciple', name: 'Ученик демонического пути', powerFactor: 0.9, healthFactor: 10, damageFactor: 2.0 },
        { id: 'blood_puppeteer', name: 'Кукловод крови', powerFactor: 0.8, healthFactor: 9, damageFactor: 2.5 },
        { id: 'void_walker', name: 'Странник пустоты', powerFactor: 1.3, healthFactor: 15, damageFactor: 3.0 },
        { id: 'demonic_elder', name: 'Старейшина демонического пути', powerFactor: 1.5, healthFactor: 22, damageFactor: 3.5 },
        { id: 'soul_devourer', name: 'Пожиратель душ', powerFactor: 1.8, healthFactor: 30, damageFactor: 4.0 }
      ]
    };
    
    // Возможные награды
    this.potentialRewards = {
      local: [
        { id: 'demonic_essence', name: 'Демоническая эссенция', type: 'material', chance: 0.5, stats: { quality: 1 } },
        { id: 'corrupted_crystal', name: 'Оскверненный кристалл', type: 'material', chance: 0.4, stats: { energy: 10 } },
        { id: 'blood_stone', name: 'Камень крови', type: 'material', chance: 0.3, stats: { health_regen: 2 } }
      ],
      regional: [
        { id: 'refined_demonic_essence', name: 'Очищенная демоническая эссенция', type: 'material', chance: 0.4, stats: { quality: 2 } },
        { id: 'void_fragment', name: 'Фрагмент пустоты', type: 'material', chance: 0.3, stats: { spirit_defense: 5 } },
        { id: 'demonic_technique_fragment', name: 'Фрагмент демонической техники', type: 'technique_part', chance: 0.2, stats: { technique: 'demonic_art' } },
        { id: 'sacrificial_dagger', name: 'Жертвенный кинжал', type: 'weapon', chance: 0.25, stats: { damage: 15, life_steal: 3 } }
      ],
      global: [
        { id: 'concentrated_demonic_essence', name: 'Концентрированная демоническая эссенция', type: 'material', chance: 0.3, stats: { quality: 3 } },
        { id: 'demonic_core', name: 'Демоническое ядро', type: 'material', chance: 0.2, stats: { energy_max: 30 } },
        { id: 'soul_binding_chains', name: 'Цепи связывания душ', type: 'weapon', chance: 0.15, stats: { damage: 20, control: 10 } },
        { id: 'forbidden_scripture', name: 'Запретное писание', type: 'technique', chance: 0.1, stats: { technique: 'forbidden_art' } },
        { id: 'demonic_transformation_pill', name: 'Пилюля демонической трансформации', type: 'consumable', chance: 0.05, stats: { temporary_power: 100, corruption: 20 } }
      ]
    };
    
    // Типы оскверненных мест
    this.corruptionSites = [
      { id: 'spirit_well', name: 'Духовный колодец', purification_difficulty: 1.0, corruption_effect: 'energy_drain' },
      { id: 'celestial_formation', name: 'Небесная формация', purification_difficulty: 1.5, corruption_effect: 'reality_distortion' },
      { id: 'ancient_shrine', name: 'Древнее святилище', purification_difficulty: 2.0, corruption_effect: 'cultivation_block' },
      { id: 'sacred_tree', name: 'Священное дерево', purification_difficulty: 1.2, corruption_effect: 'life_corruption' },
      { id: 'spiritual_beast_lair', name: 'Логово духовного зверя', purification_difficulty: 1.8, corruption_effect: 'beast_mutation' }
    ];
  }
  
  /**
   * Переопределение метода активации события
   * @param {Object} gameState - Текущее состояние игры
   * @param {Object} eventContext - Контекст события
   * @returns {Object} - Контекст активированного события
   */
  onActivate(gameState, eventContext) {
    // Получаем или устанавливаем масштаб конфликта
    const scale = eventContext.scale || this.defaultScale;
    
    // Учитываем лунную фазу (влияет на силу демонических культиваторов)
    const lunarPhaseMultiplier = this.getLunarPhaseMultiplier(gameState.world.time);
    
    // Определяем силу противников в зависимости от масштаба с учетом лунной фазы
    const enemyPower = this.getEnemyPowerByScale(scale, gameState.player.level) * lunarPhaseMultiplier;
    
    // Генерируем группу демонических культиваторов
    const enemyGroup = this.generateDemonicGroup(scale, enemyPower);
    
    // Вычисляем награды
    const rewards = this.calculateRewards(scale, gameState.player.level);
    
    // Добавляем предметы в награду
    rewards.items = this.generateRewardItems(scale);
    
    // Определяем доступные варианты выбора
    const choices = this.getAvailableChoices(gameState, eventContext.location, scale);
    
    // Выбираем оскверненные места в зависимости от масштаба
    const corruptedSites = this.selectCorruptedSites(scale);
    
    // Создаем контекст события
    return {
      scale,
      enemyPower,
      enemyGroup,
      rewards,
      choices,
      expirationTime: this.calculateExpirationTime(scale),
      escalationChance: scale !== 'global' ? 0.35 : 0, // У демонических культиваторов повышенный шанс эскалации
      
      // Добавляем специфичный для демонических культиваторов контекст
      lunarPhaseMultiplier,
      demonicSect: this.determineDemonicSect(eventContext.location),
      corruptedSites,
      portalLocation: this.generatePortalLocation(eventContext.location),
      corruptionLevel: 0.3 + (Math.random() * 0.4), // От 0.3 до 0.7
      ritualProgress: scale === 'global' ? Math.random() * 0.5 : 0, // Прогресс ритуала для глобальных конфликтов
    };
  }
  
  /**
   * Получение множителя в зависимости от лунной фазы
   * В полнолуние сила демонических культиваторов увеличивается
   * @param {Object} worldTime - Игровое время
   * @returns {number} - Множитель силы
   */
  getLunarPhaseMultiplier(worldTime) {
    // В полнолуние сильнее, в новолуние слабее
    // В реальном приложении луна будет вычисляться из состояния игрового мира
    
    // Симуляция лунной фазы от 0 (новолуние) до 1 (полнолуние)
    const lunarPhase = (worldTime && worldTime.day) ? 
      (worldTime.day % 30) / 30 : 
      Math.random();
    
    // Полнолуние (0.9-1.0) дает максимальный бонус
    if (lunarPhase > 0.9) {
      return 1.3; // +30% к силе
    }
    // Почти полная луна (0.7-0.9) дает средний бонус
    else if (lunarPhase > 0.7) {
      return 1.2; // +20% к силе
    }
    // Новолуние (0.0-0.1) ослабляет демонов
    else if (lunarPhase < 0.1) {
      return 0.8; // -20% к силе
    }
    // Остальные фазы имеют незначительное влияние
    else {
      return 1.0 + ((lunarPhase - 0.5) * 0.4); // От -20% до +20%
    }
  }
  
  /**
   * Определение секты демонических культиваторов на основе локации
   * @param {string} location - Идентификатор локации
   * @returns {string} - Название секты демонических культиваторов
   */
  determineDemonicSect(location) {
    // В реальном приложении здесь будет логика определения секты
    // в зависимости от региона и других факторов
    const possibleSects = [
      'Секта Пожирателей Душ',
      'Культ Кровавой Луны',
      'Орден Темного Пламени',
      'Последователи Бездны',
      'Хранители Запретных Знаний'
    ];
    
    // Для демонстрации выбираем случайную секту
    return possibleSects[Math.floor(Math.random() * possibleSects.length)];
  }
  
  /**
   * Выбор оскверненных мест в зависимости от масштаба конфликта
   * @param {string} scale - Масштаб конфликта
   * @returns {Array} - Массив объектов оскверненных мест
   */
  selectCorruptedSites(scale) {
    // Определяем количество оскверненных мест в зависимости от масштаба
    const count = {
      'local': 1,
      'regional': 2 + Math.floor(Math.random() * 2), // 2-3
      'global': 4 + Math.floor(Math.random() * 3)  // 4-6
    }[scale] || 1;
    
    const sites = [];
    
    // Создаем копию массива, чтобы не изменять оригинал
    const availableSites = [...this.corruptionSites];
    
    for (let i = 0; i < count; i++) {
      // Если мест больше не осталось, прерываем цикл
      if (availableSites.length === 0) break;
      
      // Выбираем случайное место из оставшихся
      const randomIndex = Math.floor(Math.random() * availableSites.length);
      const site = availableSites.splice(randomIndex, 1)[0];
      
      // Добавляем место с уникальным ID и уровнем осквернения
      sites.push({
        ...site,
        id: `${site.id}_${i}`,
        corruption_level: 0.5 + Math.random() * 0.5, // 50-100% осквернения
        purified: false
      });
    }
    
    return sites;
  }
  
  /**
   * Генерация информации о демоническом портале
   * @param {string} location - Локация события
   * @returns {Object} - Информация о портале
   */
  generatePortalLocation(location) {
    // Тип портала зависит от силы события
    const portalTypes = [
      'Малая пространственная трещина',
      'Разлом измерений',
      'Врата в демоническое измерение',
      'Мост между мирами',
      'Великий портал Бездны'
    ];
    
    return {
      name: portalTypes[Math.floor(Math.random() * 3)], // Случайный тип из первых трех
      stability: 0.3 + Math.random() * 0.5, // 30-80% стабильности
      guardians: Math.floor(1 + Math.random() * 3), // 1-3 стража
      closingDifficulty: 2 + Math.random() * 3 // Сложность закрытия 2-5
    };
  }
  
  /**
   * Генерация группы демонических культиваторов для конфликта
   * @param {string} scale - Масштаб конфликта
   * @param {number} power - Общая сила группы
   * @returns {Array} - Массив объектов демонических культиваторов
   */
  generateDemonicGroup(scale, power) {
    const demonicTypes = this.demonicTypes[scale] || this.demonicTypes.local;
    const demonics = [];
    
    // Определяем количество культиваторов в зависимости от масштаба
    const count = {
      'local': 1 + Math.floor(Math.random() * 2), // 1-2
      'regional': 3 + Math.floor(Math.random() * 3), // 3-5
      'global': 4 + Math.floor(Math.random() * 4)  // 4-7
    }[scale] || 2;
    
    // Если это глобальный конфликт, добавляем лидера культа
    if (scale === 'global') {
      const cultLeader = {
        id: 'demonic_cult_leader',
        name: 'Лидер демонического культа',
        level: Math.floor(power * 1.6),
        health: power * 45,
        damage: power * 5,
        abilities: [
          { id: 'soul_drain', name: 'Высасывание души', damage: power * 7, effect: 'life_steal', cooldown: 3 },
          { id: 'demonic_summon', name: 'Призыв демона', effect: 'summon', duration: 5, cooldown: 6 },
          { id: 'reality_distortion', name: 'Искажение реальности', effect: 'debuff', duration: 4, cooldown: 5 }
        ],
        resistances: {
          physical: 0.3, // 30% сопротивление физическому урону
          fire: 0.5, // 50% сопротивление огню
          poison: 0.8 // 80% сопротивление яду
        },
        loot: {
          guaranteed: [
            { id: 'demonic_sect_emblem', name: 'Эмблема демонической секты', type: 'quest_item' }
          ],
          chance: [
            { id: 'demonic_core', name: 'Демоническое ядро', type: 'material', chance: 0.7 },
            { id: 'soul_jade', name: 'Нефрит душ', type: 'material', chance: 0.4 },
            { id: 'forbidden_manual', name: 'Запретный манускрипт', type: 'technique', chance: 0.2 }
          ]
        }
      };
      
      demonics.push(cultLeader);
    }
    
    // Распределяем оставшуюся силу между обычными культиваторами
    const remainingPower = power * (scale === 'global' ? 0.6 : 1); // Учитываем, что часть силы ушла на лидера
    const powerPerDemonic = remainingPower / count;
    
    for (let i = 0; i < count; i++) {
      // Выбираем случайный тип культиватора из доступных для данного масштаба
      const demonicType = demonicTypes[Math.floor(Math.random() * demonicTypes.length)];
      
      // Базовые способности для всех демонических культиваторов
      const baseAbilities = [
        { id: 'dark_strike', name: 'Удар тьмы', damage: powerPerDemonic * 1.5, cooldown: 2 }
      ];
      
      // Дополнительные способности для более сильных типов
      let extraAbilities = [];
      if (demonicType.powerFactor > 1.0) {
        extraAbilities = [
          { id: 'blood_curse', name: 'Проклятие крови', effect: 'damage_over_time', duration: 3, cooldown: 4 }
        ];
      }
      if (demonicType.powerFactor > 1.5) {
        extraAbilities.push(
          { id: 'soul_shackle', name: 'Оковы души', effect: 'control', duration: 2, cooldown: 5 }
        );
      }
      
      demonics.push({
        id: `${demonicType.id}_${i}`,
        name: demonicType.name,
        level: Math.floor(powerPerDemonic * demonicType.powerFactor),
        health: Math.floor(powerPerDemonic * demonicType.healthFactor),
        damage: Math.floor(powerPerDemonic * demonicType.damageFactor),
        abilities: [...baseAbilities, ...extraAbilities],
        resistances: {
          physical: 0.1, // 10% сопротивление физическому урону
          spiritual: 0.2 // 20% сопротивление духовному урону
        }
      });
    }
    
    return demonics;
  }
  
  /**
   * Генерация предметов для награды
   * @param {string} scale - Масштаб конфликта
   * @returns {Array} - Массив предметов
   */
  generateRewardItems(scale) {
    const potentialItems = this.potentialRewards[scale] || this.potentialRewards.local;
    const rewardItems = [];
    
    // Проходим по всем потенциальным предметам и проверяем шанс выпадения
    potentialItems.forEach(item => {
      if (Math.random() < item.chance) {
        rewardItems.push({
          id: item.id,
          name: item.name,
          type: item.type,
          ...item.stats
        });
      }
    });
    
    return rewardItems;
  }
  
  /**
   * Переопределение метода получения доступных вариантов действий
   * @param {Object} gameState - Текущее состояние игры
   * @param {string} location - Текущая локация
   * @param {string} scale - Масштаб конфликта
   * @returns {Array} - Массив доступных действий
   */
  getAvailableChoices(gameState, location, scale) {
    // Получаем базовые варианты из родительского класса
    const baseChoices = super.getAvailableChoices(gameState, location);
    
    // Добавляем специфические для демонических культиваторов варианты
    const demonicChoices = [
      {
        id: 'purify',
        name: 'Очистить место',
        description: 'Попытаться очистить оскверненное место от демонической энергии',
        requirementsMet: gameState.player.stats && gameState.player.stats.spirit >= 15 // Требуется достаточный уровень духа
      },
      {
        id: 'close_portal',
        name: 'Закрыть портал',
        description: 'Попытаться закрыть портал, через который проникают демонические культиваторы',
        requirementsMet: gameState.player.level >= 10 // Требуется минимальный уровень
      }
    ];
    
    // Для определенных типов персонажей добавляем возможность получить знания
    if (gameState.player.cultivation && gameState.player.cultivation.path !== 'righteous') {
      demonicChoices.push({
        id: 'extract_knowledge',
        name: 'Извлечь знания',
        description: 'Попытаться получить запретные знания демонического культивирования',
        requirementsMet: gameState.player.stats && gameState.player.stats.intelligence >= 20
      });
    }
    
    // Для глобального масштаба добавляем специальные варианты
    if (scale === 'global') {
      demonicChoices.push({
        id: 'call_sect_help',
        name: 'Призвать помощь секты',
        description: 'Связаться с вашей сектой и запросить помощь старших',
        requirementsMet: gameState.player.sect && gameState.player.sect.reputation >= 50 // Требуется хорошая репутация в секте
      });
    }
    
    return [...baseChoices, ...demonicChoices];
  }
  
  /**
   * Переопределение обработки выбора игрока
   * @param {string} choiceId - Идентификатор выбранного действия
   * @param {Object} gameState - Текущее состояние игры
   * @param {Object} eventContext - Контекст события
   * @returns {Object} - Результат выбора
   */
  handleChoice(choiceId, gameState, eventContext) {
    // Для базовых действий используем логику родительского класса
    if (choiceId === 'engage' || choiceId === 'avoid') {
      return super.handleChoice(choiceId, gameState, eventContext);
    }
    
    // Обработка специфических для демонических культиваторов действий
    switch (choiceId) {
      case 'purify':
        // Определяем шанс успеха очищения
        const spiritPower = (gameState.player.stats.spirit || 10) / 10; // Дух влияет на очищение
        
        // Находим неочищенное место
        const sitesToPurify = eventContext.corruptedSites.filter(site => !site.purified);
        
        // Если все места уже очищены
        if (sitesToPurify.length === 0) {
          return {
            success: true,
            message: 'Все оскверненные места уже очищены!',
            reputationChanges: {
              village: 5,
              sect: 5
            }
          };
        }
        
        // Выбираем случайное место для очищения
        const siteToClean = sitesToPurify[Math.floor(Math.random() * sitesToPurify.length)];
        
        // Расчет шанса успеха с учетом сложности места
        const purificationSuccessChance = 0.3 + (spiritPower * 0.1) - (siteToClean.purification_difficulty * 0.1);
        const purificationSuccess = Math.random() < purificationSuccessChance;
        
        if (purificationSuccess) {
          // Отмечаем место как очищенное
          siteToClean.purified = true;
          
          // Проверяем, очищены ли все места
          const allPurified = eventContext.corruptedSites.every(site => site.purified);
          
          // Если все места очищены, снижаем шанс эскалации
          if (allPurified) {
            eventContext.escalationChance = eventContext.escalationChance * 0.3;
          }
          
          return {
            success: true,
            message: `Вам удалось очистить ${siteToClean.name} от демонической энергии!`,
            rewards: {
              experience: Math.floor(eventContext.rewards.experience * 0.4), // 40% опыта
              items: [{
                id: 'purified_essence',
                name: 'Очищенная эссенция',
                type: 'material',
                quality: 2
              }]
            },
            reputationChanges: {
              village: 15,
              sect: 10,
              demonic_sect: -10
            },
            updatedContext: { 
              corruptedSites: eventContext.corruptedSites,
              escalationChance: eventContext.escalationChance
            }
          };
        } else {
          // Повышаем уровень осквернения при неудаче
          siteToClean.corruption_level = Math.min(1.0, siteToClean.corruption_level + 0.2);
          
          return {
            success: false,
            message: `Попытка очистить ${siteToClean.name} провалилась! Уровень осквернения увеличился.`,
            damage: {
              health: gameState.player.stats.max_health * 0.1, // 10% урона от максимального здоровья
              corruption: 5 // Небольшое осквернение самого игрока
            },
            updatedContext: { 
              corruptedSites: eventContext.corruptedSites 
            }
          };
        }
        
      case 'close_portal':
        // Определяем шанс успеха закрытия портала
        const closingSkill = (gameState.player.stats.intelligence || 10) / 5 + (gameState.player.stats.spirit || 10) / 10;
        const portalDifficulty = eventContext.portalLocation.closingDifficulty;
        
        // Расчет шанса успеха с учетом сложности портала
        const closingSuccessChance = 0.3 + (closingSkill * 0.05) - (portalDifficulty * 0.05);
        const closingSuccess = Math.random() < closingSuccessChance;
        
        if (closingSuccess) {
          return {
            success: true,
            message: `Вам удалось закрыть ${eventContext.portalLocation.name}! Поток демонических культиваторов прекращен.`,
            rewards: {
              experience: Math.floor(eventContext.rewards.experience * 0.8), // 80% опыта
              items: [{
                id: 'space_fragment',
                name: 'Фрагмент пространства',
                type: 'material',
                rarity: 'rare'
              }]
            },
            reputationChanges: {
              village: 20,
              sect: 15,
              demonic_sect: -20
            },
            // Существенно снижаем шанс эскалации
            updatedContext: {
              escalationChance: eventContext.escalationChance * 0.1,
              portalLocation: {
                ...eventContext.portalLocation,
                stability: 0, // Портал закрыт
                closed: true
              }
            },
            // Если все места были очищены и портал закрыт, можно полностью завершить конфликт
            conflictResolved: eventContext.corruptedSites.every(site => site.purified)
          };
        } else {
          return {
            success: false,
            message: `Попытка закрыть ${eventContext.portalLocation.name} провалилась! Портал стал еще более нестабильным.`,
            damage: {
              health: gameState.player.stats.max_health * 0.15, // 15% урона от максимального здоровья
              energy: gameState.player.cultivation.maxEnergy * 0.2 // Расход 20% энергии
            },
            // Увеличиваем нестабильность портала, что повышает шанс эскалации
            updatedContext: {
              escalationChance: eventContext.escalationChance * 1.5,
              portalLocation: {
                ...eventContext.portalLocation,
                stability: Math.max(0.1, eventContext.portalLocation.stability - 0.2) // Снижаем стабильность
              }
            }
          };
        }
        
      case 'extract_knowledge':
        // Определяем шанс успешного извлечения знаний
        const intelligenceSkill = (gameState.player.stats.intelligence || 10) / 10;
        const extractionSuccessChance = 0.2 + (intelligenceSkill * 0.1);
        const extractionSuccess = Math.random() < extractionSuccessChance;
        
        if (extractionSuccess) {
          return {
            success: true,
            message: 'Вам удалось извлечь часть запретных знаний из демонических техник. Это опасное, но мощное знание.',
            rewards: {
              experience: Math.floor(eventContext.rewards.experience * 0.3), // 30% опыта
              items: [{
                id: 'forbidden_technique_fragment',
                name: 'Фрагмент запретной техники',
                type: 'technique_part',
                rarity: 'rare'
              }]
            },
            reputationChanges: {
              sect: -10, // Праведные секты не одобряют
              demonic_sect: 5 // Демонические секты заинтересовались
            },
            // Накладываем эффект оскверенения
            temporaryEffects: [
              {
                id: 'demonic_corruption',
                name: 'Демоническое осквернение',
                duration: 24 * 60, // 24 часа игрового времени
                effects: {
                  spirit_regeneration: 0.8, // -20% к восстановлению духа
                  demonic_power: 1.1 // +10% к демонической силе
                }
              }
            ],
            escalationChance: eventContext.escalationChance * 0.9 // Слегка уменьшаем шанс эскалации
          };
        } else {
          return {
            success: false,
            message: 'Попытка извлечь знания провалилась! Демоническая энергия вырвалась и воздействует на ваш разум.',
            damage: {
              health: gameState.player.stats.max_health * 0.05, // 5% урона от максимального здоровья
              corruption: 10 // Значительное осквернение
            },
            temporaryEffects: [
              {
                id: 'mental_instability',
                name: 'Ментальная нестабильность',
                duration: 12 * 60, // 12 часов игрового времени
                effects: {
                  intelligence: 0.9, // -10% к интеллекту
                  concentration: 0.8 // -20% к концентрации
                }
              }
            ]
          };
        }
        
      case 'call_sect_help':
        // Проверяем репутацию в секте
        const sectReputation = gameState.player.sect ? gameState.player.sect.reputation : 0;
        
        // Определяем шанс получения помощи, зависящий от репутации
        const helpSuccessChance = Math.min(0.7, 0.3 + (sectReputation / 100) * 0.5);
        const sectHelpSuccess = Math.random() < helpSuccessChance;
        
        if (sectHelpSuccess) {
          return {
            success: true,
            message: 'Ваша секта откликнулась на зов! Старейшины секты прибудут через некоторое время, чтобы помочь в борьбе с демоническими культиваторами.',
            delayedResolution: true, // Результат будет определен позже
            sectHelp: {
              arrivalTime: 6 * 60, // 6 часов игрового времени
              elderCount: 1 + Math.floor(sectReputation / 30), // Количество старейшин зависит от репутации
              elderPower: gameState.player.level * 2 // Сила старейшин
            },
            nextStep: 'await_sect_elders', // Следующий шаг в цепочке событий
            // Временное защитное заклинание от секты
            temporaryEffects: [
              {
                id: 'sect_protection',
                name: 'Защита секты',
                duration: 8 * 60, // 8 часов игрового времени
                effects: {
                  spirit_defense: 1.3, // +30% к духовной защите
                  demonic_resistance: 1.2 // +20% к сопротивлению демонической энергии
                }
              }
            ],
            reputationChanges: {
              sect: 10, // Улучшение репутации в секте за проявленную инициативу
            },
            escalationChance: eventContext.escalationChance * 0.5 // Снижаем шанс эскалации
          };
        } else {
          return {
            success: false,
            message: 'Ваша секта не может оказать помощь в данный момент. Вам придется справиться своими силами.',
            reputationChanges: {
              sect: 5, // Небольшое улучшение репутации за попытку
            },
            // Даем небольшой бонус за счет подготовки
            temporaryEffects: [
              {
                id: 'self_preparation',
                name: 'Собственная подготовка',
                duration: 4 * 60, // 4 часа игрового времени
                effects: {
                  damage: 1.1, // +10% к урону
                  defense: 1.1 // +10% к защите
                }
              }
            ]
          };
        }
        
      default:
        return {
          success: false,
          message: 'Неизвестное действие. Конфликт продолжается.'
        };
    }
  }
  
  /**
   * Переопределение расчета изменений репутации
   * @param {Object} gameState - Текущее состояние игры
   * @param {string} outcome - Исход конфликта
   * @returns {Object} - Изменения репутации для различных фракций
   */
  calculateReputationChanges(gameState, outcome) {
    const changes = {};
    
    switch (outcome) {
      case 'victory':
        changes.village = 20; // Значительное улучшение отношений с деревней
        changes.sect = 15; // Хорошее отношение праведных сект
        changes.demonic_sect = -20; // Значительное ухудшение отношений с демоническими сектами
        break;
        
      case 'defeat':
        changes.village = -10; // Ухудшение отношений с деревней (не смогли защитить)
        changes.sect = -5; // Небольшое ухудшение отношений с сектой
        // Демонические секты могут заинтересоваться игроком
        changes.demonic_sect = Math.random() < 0.3 ? 5 : 0;
        break;
        
      case 'avoid_success':
        // Уклонение от конфликта вызывает смешанную реакцию
        changes.village = -5; // Небольшое ухудшение (не помогли)
        changes.sect = -3; // Небольшое ухудшение (проявили трусость)
        break;
        
      default:
        // По умолчанию без изменений
        break;
    }
    
    return changes;
  }
  
  /**
   * Переопределение метода эскалации конфликта
   * @param {Object} gameState - Текущее состояние игры
   * @param {Object} eventContext - Контекст события
   * @returns {Object} - Новый контекст эскалированного конфликта
   */
  escalate(gameState, eventContext) {
    // Получаем базовый контекст эскалации из родительского класса
    const escalatedContext = super.escalate(gameState, eventContext);
    
    // Добавляем специфичные для демонических культиваторов детали эскалации
    
    // Увеличиваем уровень осквернения
    escalatedContext.corruptionLevel = Math.min(1.0, (eventContext.corruptionLevel || 0.3) + 0.2);
    
    // Добавляем новые оскверненные места при эскалации
    if (escalatedContext.scale !== 'local') {
      const newSites = this.selectCorruptedSites(escalatedContext.scale)
        .filter(newSite => !eventContext.corruptedSites.some(site => site.id.split('_')[0] === newSite.id.split('_')[0]));
      
      escalatedContext.corruptedSites = [...eventContext.corruptedSites, ...newSites];
    }
    
    // Обновляем портал - он становится мощнее
    if (eventContext.portalLocation) {
      const portalTypes = [
        'Малая пространственная трещина',
        'Разлом измерений',
        'Врата в демоническое измерение',
        'Мост между мирами',
        'Великий портал Бездны'
      ];
      
      // Выбираем следующий тип портала
      const currentPortalTypeIndex = portalTypes.indexOf(eventContext.portalLocation.name);
      const newPortalTypeIndex = Math.min(portalTypes.length - 1, currentPortalTypeIndex + 1);
      
      escalatedContext.portalLocation = {
        ...eventContext.portalLocation,
        name: portalTypes[newPortalTypeIndex],
        stability: Math.min(1.0, eventContext.portalLocation.stability + 0.2), // Увеличиваем стабильность
        guardians: eventContext.portalLocation.guardians + Math.floor(1 + Math.random() * 2), // Добавляем стражей
        closingDifficulty: eventContext.portalLocation.closingDifficulty + 1 // Увеличиваем сложность закрытия
      };
    }
    
    // Для глобального конфликта добавляем прогресс ритуала
    if (escalatedContext.scale === 'global') {
      escalatedContext.ritualProgress = (eventContext.ritualProgress || 0) + 0.2;
      // Если ритуал близок к завершению, добавляем предупреждение
      if (escalatedContext.ritualProgress > 0.8) {
        escalatedContext.criticalWarning = 'Демонический ритуал почти завершен! Последствия могут быть катастрофическими.';
      }
    }
    
    // Обновляем сообщение о эскалации с учетом контекста демонических культиваторов
    if (escalatedContext.scale === 'regional') {
      escalatedContext.message = `Конфликт с ${eventContext.demonicSect} эскалировал! Демонические культиваторы усилили свое влияние в регионе.`;
    } else if (escalatedContext.scale === 'global') {
      escalatedContext.message = `Конфликт достиг глобального масштаба! ${eventContext.demonicSect} начали масштабный ритуал, который угрожает всему региону.`;
    }
    
    return escalatedContext;
  }
}

export { DemonicCultivatorEvent };
