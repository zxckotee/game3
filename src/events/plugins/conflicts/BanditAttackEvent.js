/**
 * BanditAttackEvent.js
 * Реализация события нападения банды разбойников
 */

import { GlobalConflictEvent } from './GlobalConflictEvent';

/**
 * Класс события нападения банды разбойников
 * Расширяет базовый класс глобального конфликта
 */
class BanditAttackEvent extends GlobalConflictEvent {
  /**
   * Конструктор события нападения разбойников
   */
  constructor() {
    super({
      id: 'bandit_attack',
      name: 'Нападение банды разбойников',
      description: 'Банда разбойников напала на местных жителей. Вы можете помочь отбить атаку, присоединиться к разбойникам или попытаться договориться.',
      minPlayerLevel: 3,
      scaleTypes: ['local', 'regional', 'global'],
      defaultScale: 'local',
      affectedFactions: ['village', 'bandits', 'merchants'],
    });
    
    // Типы бандитов для разных масштабов
    this.banditTypes = {
      local: [
        { id: 'bandit_thug', name: 'Головорез', powerFactor: 0.8, healthFactor: 10, damageFactor: 1.5 },
        { id: 'bandit_archer', name: 'Лучник', powerFactor: 0.7, healthFactor: 8, damageFactor: 2 }
      ],
      regional: [
        { id: 'bandit_thug', name: 'Головорез', powerFactor: 0.8, healthFactor: 10, damageFactor: 1.5 },
        { id: 'bandit_archer', name: 'Лучник', powerFactor: 0.7, healthFactor: 8, damageFactor: 2 },
        { id: 'bandit_veteran', name: 'Ветеран', powerFactor: 1.2, healthFactor: 15, damageFactor: 2.5 }
      ],
      global: [
        { id: 'bandit_thug', name: 'Головорез', powerFactor: 0.8, healthFactor: 12, damageFactor: 1.8 },
        { id: 'bandit_archer', name: 'Лучник', powerFactor: 0.7, healthFactor: 10, damageFactor: 2.2 },
        { id: 'bandit_veteran', name: 'Ветеран', powerFactor: 1.2, healthFactor: 18, damageFactor: 2.8 },
        { id: 'bandit_captain', name: 'Капитан бандитов', powerFactor: 1.5, healthFactor: 25, damageFactor: 3.5 }
      ]
    };
    
    // Возможные награды
    this.potentialRewards = {
      local: [
        { id: 'crude_sword', name: 'Примитивный меч', type: 'weapon', chance: 0.3, stats: { damage: 5 } },
        { id: 'leather_vest', name: 'Кожаный жилет', type: 'armor', chance: 0.4, stats: { defense: 3 } },
        { id: 'minor_healing_pill', name: 'Малая пилюля исцеления', type: 'consumable', chance: 0.6, stats: { heal: 20 } }
      ],
      regional: [
        { id: 'steel_sword', name: 'Стальной меч', type: 'weapon', chance: 0.25, stats: { damage: 12 } },
        { id: 'reinforced_armor', name: 'Укрепленная броня', type: 'armor', chance: 0.3, stats: { defense: 10 } },
        { id: 'medium_healing_pill', name: 'Средняя пилюля исцеления', type: 'consumable', chance: 0.5, stats: { heal: 50 } },
        { id: 'bandit_map', name: 'Карта логова бандитов', type: 'quest', chance: 0.2, stats: { unlocks: 'bandit_hideout_quest' } }
      ],
      global: [
        { id: 'spirit_infused_blade', name: 'Клинок, наполненный духовной энергией', type: 'weapon', chance: 0.15, stats: { damage: 25, spirit_damage: 10 } },
        { id: 'veteran_bandit_armor', name: 'Доспех ветерана бандитов', type: 'armor', chance: 0.2, stats: { defense: 20, intimidation: 5 } },
        { id: 'major_healing_pill', name: 'Большая пилюля исцеления', type: 'consumable', chance: 0.4, stats: { heal: 100 } },
        { id: 'bandit_technique_scroll', name: 'Свиток техники бандитов', type: 'technique', chance: 0.1, stats: { technique: 'shadow_strike' } },
        { id: 'bandit_king_map', name: 'Карта убежища короля бандитов', type: 'quest', chance: 0.05, stats: { unlocks: 'bandit_king_quest' } }
      ]
    };
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
    
    // Определяем силу противников в зависимости от масштаба
    const enemyPower = this.getEnemyPowerByScale(scale, gameState.player.level);
    
    // Генерируем группу бандитов
    const enemyGroup = this.generateBanditGroup(scale, enemyPower);
    
    // Вычисляем награды
    const rewards = this.calculateRewards(scale, gameState.player.level);
    
    // Добавляем предметы в награду
    rewards.items = this.generateRewardItems(scale);
    
    // Определяем доступные варианты выбора
    const choices = this.getAvailableChoices(gameState, eventContext.location, scale);
    
    // Создаем контекст события
    return {
      scale,
      enemyPower,
      enemyGroup,
      rewards,
      choices,
      expirationTime: this.calculateExpirationTime(scale),
      escalationChance: scale !== 'global' ? 0.3 : 0,
      // Добавляем специфичный для бандитов контекст
      banditFaction: this.determineBanditFaction(eventContext.location),
      hostages: scale !== 'local' ? this.generateHostages(scale) : null,
      villageVulnerability: Math.random(), // От 0 до 1, влияет на последствия
    };
  }
  
  /**
   * Определение фракции бандитов на основе локации
   * @param {string} location - Идентификатор локации
   * @returns {string} - Название фракции бандитов
   */
  determineBanditFaction(location) {
    // В реальном приложении здесь будет логика определения фракции
    // в зависимости от региона и других факторов
    const possibleFactions = [
      'Горные ястребы',
      'Красные ножи',
      'Тени долины',
      'Черный кулак',
      'Речные разбойники'
    ];
    
    // Для демонстрации выбираем случайную фракцию
    // В реальном приложении это будет определяться более детерминировано
    return possibleFactions[Math.floor(Math.random() * possibleFactions.length)];
  }
  
  /**
   * Генерация заложников для региональных и глобальных конфликтов
   * @param {string} scale - Масштаб конфликта
   * @returns {Array} - Массив объектов заложников
   */
  generateHostages(scale) {
    const count = scale === 'regional' ? 
      Math.floor(1 + Math.random() * 3) : // 1-3 заложника для регионального
      Math.floor(3 + Math.random() * 5);  // 3-7 заложников для глобального
      
    const hostageTypes = [
      { type: 'villager', name: 'Житель деревни', importance: 1 },
      { type: 'merchant', name: 'Торговец', importance: 2 },
      { type: 'cultivator', name: 'Начинающий культиватор', importance: 3 },
      { type: 'elder', name: 'Старейшина деревни', importance: 4 },
      { type: 'sect_disciple', name: 'Ученик секты', importance: 5 }
    ];
    
    const hostages = [];
    
    for (let i = 0; i < count; i++) {
      // Выбираем тип заложника с учетом важности
      // Более важные заложники реже встречаются
      const typeIndex = Math.floor(Math.pow(Math.random(), 2) * hostageTypes.length);
      const hostageType = hostageTypes[typeIndex];
      
      hostages.push({
        id: `hostage_${i}`,
        ...hostageType,
        health: 100 - Math.floor(Math.random() * 30), // Здоровье 70-100%
        ransomValue: 100 * hostageType.importance * (0.8 + Math.random() * 0.4) // Ценность выкупа
      });
    }
    
    return hostages;
  }
  
  /**
   * Генерация группы бандитов для конфликта
   * @param {string} scale - Масштаб конфликта
   * @param {number} power - Общая сила группы
   * @returns {Array} - Массив объектов бандитов
   */
  generateBanditGroup(scale, power) {
    const banditTypes = this.banditTypes[scale] || this.banditTypes.local;
    const bandits = [];
    
    // Определяем количество бандитов в зависимости от масштаба
    const count = {
      'local': 2 + Math.floor(Math.random() * 3), // 2-4
      'regional': 4 + Math.floor(Math.random() * 4), // 4-7
      'global': 6 + Math.floor(Math.random() * 5)  // 6-10
    }[scale] || 3;
    
    // Если это глобальный конфликт, добавляем босса
    if (scale === 'global') {
      const boss = {
        id: 'bandit_warlord',
        name: 'Военачальник бандитов',
        level: Math.floor(power * 1.5),
        health: power * 40,
        damage: power * 4,
        abilities: [
          { id: 'cleave', name: 'Рассечение', damage: power * 6, cooldown: 3 },
          { id: 'rally', name: 'Боевой клич', effect: 'buff_allies', duration: 3, cooldown: 5 }
        ],
        loot: {
          guaranteed: [
            { id: 'warlord_emblem', name: 'Эмблема военачальника', type: 'quest_item' }
          ],
          chance: [
            { id: 'spirit_stone', name: 'Духовный камень', type: 'material', chance: 0.5 },
            { id: 'bandit_technique', name: 'Техника бандитов', type: 'technique', chance: 0.3 }
          ]
        }
      };
      
      bandits.push(boss);
    }
    
    // Распределяем оставшуюся силу между обычными бандитами
    const remainingPower = power * (scale === 'global' ? 0.7 : 1); // Учитываем, что часть силы ушла на босса
    const powerPerBandit = remainingPower / count;
    
    for (let i = 0; i < count; i++) {
      // Выбираем случайный тип бандита из доступных для данного масштаба
      const banditType = banditTypes[Math.floor(Math.random() * banditTypes.length)];
      
      bandits.push({
        id: `${banditType.id}_${i}`,
        name: banditType.name,
        level: Math.floor(powerPerBandit * banditType.powerFactor),
        health: Math.floor(powerPerBandit * banditType.healthFactor),
        damage: Math.floor(powerPerBandit * banditType.damageFactor)
      });
    }
    
    return bandits;
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
    
    // Добавляем специфические для бандитов варианты
    const banditChoices = [
      {
        id: 'negotiate',
        name: 'Вести переговоры',
        description: 'Попытаться договориться с бандитами, чтобы минимизировать ущерб',
        requirementsMet: true // В реальном приложении здесь будут проверки навыков дипломатии
      },
      {
        id: 'intimidate',
        name: 'Запугать',
        description: 'Использовать свой статус культиватора, чтобы запугать бандитов',
        requirementsMet: gameState.player.level >= 5 // Требуется минимальный уровень
      },
      {
        id: 'join',
        name: 'Присоединиться к бандитам',
        description: 'Временно присоединиться к бандитам для получения выгоды',
        requirementsMet: gameState.player.reputation 
                          && gameState.player.reputation.bandits 
                          && gameState.player.reputation.bandits.value > -50 // Не слишком враждебная репутация с бандитами
      }
    ];
    
    // Для глобального масштаба добавляем специальные варианты
    if (scale === 'global') {
      banditChoices.push({
        id: 'gather_allies',
        name: 'Собрать союзников',
        description: 'Собрать группу культиваторов для совместного противостояния банде',
        requirementsMet: gameState.player.reputation 
                          && gameState.player.reputation.general 
                          && gameState.player.reputation.general.value > 25 // Требуется положительная репутация
      });
    }
    
    return [...baseChoices, ...banditChoices];
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
    
    // Обработка специфических для бандитов действий
    switch (choiceId) {
      case 'negotiate':
        // Определяем шанс успеха переговоров
        const negotiationSkill = (gameState.player.stats.wisdom || 10) / 10; // Мудрость влияет на навык переговоров
        const negotiationSuccessChance = 0.4 + (negotiationSkill * 0.1);
        const negotiationSuccess = Math.random() < negotiationSuccessChance;
        
        if (negotiationSuccess) {
          return {
            success: true,
            message: 'Вам удалось договориться с бандитами. Они согласились уйти в обмен на часть ваших ресурсов.',
            consequences: {
              resourceLoss: Math.floor(gameState.player.inventory.currency.gold * 0.2), // Потеря 20% золота
              reputationChanges: {
                village: 10, // Местные жители благодарны
                bandits: 5 // Небольшое улучшение отношений с бандитами
              },
              escalationChance: eventContext.escalationChance * 0.5 // Снижаем шанс эскалации
            }
          };
        } else {
          return {
            success: false,
            message: 'Переговоры провалились. Бандиты не согласились на ваши условия и атакуют!',
            combatInitiated: true,
            enemies: eventContext.enemyGroup,
            // Бандиты раздражены неудачными переговорами
            combatModifiers: {
              enemyDamageBonus: 0.1
            },
            consequences: {
              victory: {
                rewards: eventContext.rewards,
                reputationChanges: {
                  village: 15,
                  bandits: -10
                }
              },
              defeat: {
                penalties: this.calculatePenalties(gameState),
                reputationChanges: {
                  village: -5,
                  bandits: 0
                }
              }
            }
          };
        }
        
      case 'intimidate':
        // Определяем шанс успеха запугивания
        const intimidationSkill = (gameState.player.stats.strength || 10) / 5 + (gameState.player.level / 10);
        const intimidationSuccessChance = 0.3 + (intimidationSkill * 0.1);
        const intimidationSuccess = Math.random() < intimidationSuccessChance;
        
        if (intimidationSuccess) {
          return {
            success: true,
            message: 'Вы внушили страх бандитам своей силой. Они в ужасе разбегаются!',
            rewards: {
              experience: Math.floor(eventContext.rewards.experience * 0.5), // 50% опыта как за бой
              gold: Math.floor(eventContext.rewards.gold * 0.3), // 30% золота (бросили при бегстве)
              reputation: eventContext.rewards.reputation // Полная репутация
            },
            reputationChanges: {
              village: 20, // Значительное улучшение репутации с деревней
              bandits: -20 // Значительное ухудшение репутации с бандитами
            },
            escalationChance: eventContext.escalationChance * 1.2 // Увеличиваем шанс эскалации (бандиты захотят отомстить)
          };
        } else {
          return {
            success: false,
            message: 'Бандиты не впечатлены вашей попыткой запугивания. Они смеются и атакуют с удвоенной яростью!',
            combatInitiated: true,
            enemies: eventContext.enemyGroup,
            // Бандиты разозлены неудачной попыткой запугивания
            combatModifiers: {
              enemyDamageBonus: 0.2,
              enemyInitiativeBonus: 5
            },
            consequences: {
              victory: {
                rewards: {
                  ...eventContext.rewards,
                  experience: Math.floor(eventContext.rewards.experience * 1.2) // Бонус к опыту за сложный бой
                },
                reputationChanges: {
                  village: 15,
                  bandits: -15
                }
              },
              defeat: {
                penalties: {
                  ...this.calculatePenalties(gameState),
                  healthReduction: 0.6 // Увеличенный урон здоровью
                },
                reputationChanges: {
                  village: -10,
                  bandits: 0
                }
              }
            }
          };
        }
        
      case 'join':
        // Присоединение к бандитам дает временные выгоды, но влияет на репутацию
        return {
          success: true,
          message: 'Вы временно присоединяетесь к банде бандитов. Они принимают вас, но с подозрением.',
          rewards: {
            experience: Math.floor(eventContext.rewards.experience * 0.7), // 70% опыта
            gold: Math.floor(eventContext.rewards.gold * 1.5), // 150% золота (ваша доля в награбленном)
            items: [...eventContext.rewards.items, {
              id: 'bandit_outfit',
              name: 'Одежда бандита',
              type: 'disguise',
              duration: 48 * 60 // 48 часов игрового времени
            }]
          },
          reputationChanges: {
            village: -30, // Значительное ухудшение репутации с деревней
            bandits: 15, // Улучшение репутации с бандитами
            merchants: -20 // Ухудшение репутации с торговцами
          },
          temporaryEffects: [
            {
              id: 'bandit_alliance',
              name: 'Союз с бандитами',
              duration: 7 * 24 * 60, // 7 дней в игровых минутах
              effects: {
                banditHostility: -100, // Бандиты не нападают
                merchantPrices: 1.2, // Торговцы повышают цены на 20%
                villageServices: false // Недоступны некоторые услуги в деревнях
              }
            }
          ],
          questUnlocked: 'bandit_hideout_access', // Доступ к секретному убежищу бандитов
          escalationChance: 0 // Конфликт не эскалирует, так как вы присоединились к бандитам
        };
        
      case 'gather_allies':
        // Сбор союзников для противостояния бандитской угрозе
        return {
          success: true,
          message: 'Вам удалось собрать группу культиваторов для борьбы с бандитской угрозой.',
          delayedResolution: true, // Результат будет определен позже
          alliedForces: {
            count: Math.floor(3 + (gameState.player.reputation.general.value / 10)), // Количество союзников зависит от репутации
            strength: gameState.player.level * 0.8 // Средняя сила союзников
          },
          nextStep: 'coordinate_attack', // Следующий шаг в цепочке событий
          temporaryEffects: [
            {
              id: 'coordinating_allies',
              name: 'Координация союзников',
              duration: 12 * 60, // 12 часов в игровых минутах
              effects: {
                movementSpeed: 0.8, // Замедление передвижения
                combatParticipation: false // Нельзя участвовать в других боях
              }
            }
          ],
          reputationChanges: {
            village: 5, // Небольшое улучшение репутации за инициативу
            general: 10 // Улучшение общей репутации
          }
        };
        
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
        changes.village = 15; // Хорошее отношение жителей деревни
        changes.bandits = -10; // Ухудшение отношений с бандитами
        changes.merchants = 10; // Улучшение отношений с торговцами
        break;
        
      case 'defeat':
        changes.village = -5; // Небольшое ухудшение отношений с деревней (не смогли защитить)
        // Отношения с бандитами не меняются при поражении
        break;
        
      case 'avoid_success':
        // Нейтральное действие - небольшие изменения
        changes.village = -2; // Небольшое ухудшение (не помогли)
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
    
    // Добавляем специфичные для бандитов детали эскалации
    
    // Определяем новую фракцию бандитов (могут прийти на помощь союзники)
    if (Math.random() < 0.3) {
      escalatedContext.banditFaction = this.determineBanditFaction(eventContext.location);
    }
    
    // При эскалации до регионального или глобального уровня появляются заложники
    if (escalatedContext.scale !== 'local' && !eventContext.hostages) {
      escalatedContext.hostages = this.generateHostages(escalatedContext.scale);
    } else if (eventContext.hostages) {
      // Если заложники уже были, увеличиваем их число
      const additionalHostages = this.generateHostages(escalatedContext.scale);
      escalatedContext.hostages = [...eventContext.hostages, ...additionalHostages];
    }
    
    // Обновляем сообщение о эскалации с учетом контекста бандитов
    if (escalatedContext.scale === 'regional') {
      escalatedContext.message = `Конфликт с бандитами эскалировал! Банда ${eventContext.banditFaction} получила подкрепление из соседних регионов.`;
    } else if (escalatedContext.scale === 'global') {
      escalatedContext.message = `Конфликт достиг глобального масштаба! Несколько крупных банд объединились под предводительством могущественного военачальника бандитов.`;
    }
    
    return escalatedContext;
  }
}

export { BanditAttackEvent };
