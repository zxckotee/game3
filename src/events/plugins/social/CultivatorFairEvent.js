/**
 * CultivatorFairEvent.js
 * Событие "Ярмарка культиваторов"
 */

import { AbstractEvent } from '../../core/AbstractEvent';

export class CultivatorFairEvent extends AbstractEvent {
  constructor() {
    super({
      id: 'social_cultivator_fair',
      name: 'Ярмарка культиваторов',
      description: 'В этом регионе проводится ярмарка культиваторов, где можно приобрести редкие товары, узнать новости и встретиться с представителями разных сект и школ.',
      category: 'social',
      rarity: 'common',
      duration: { min: 720, max: 1440 }, // от 12 до 24 часов игрового времени
      conditions: {
        minLevel: 1, // доступно с самого начала
        seasonModifiers: { spring: 1.2, summer: 1.5, autumn: 1.2, winter: 0.7 },
        timeModifiers: { dawn: 0.5, morning: 1.5, noon: 1.5, afternoon: 1.5, evening: 1.0, night: 0.2, deepNight: 0.0 },
        weatherModifiers: { clear: 1.5, cloudy: 1.0, rain: 0.5, storm: 0.1, fog: 0.7, snow: 0.3 },
        locationModifiers: { city: 2.0, town: 1.5, village: 1.0, plains: 0.5, forest: 0.2, mountains: 0.1 }
      },
      effects: [
        { type: 'merchant_prices', value: 0.9, description: 'Цены у торговцев снижены на 10%' },
        { type: 'rare_items_availability', value: 1.5, description: 'Повышенный шанс появления редких товаров' }
      ],
      choices: [
        {
          text: 'Торговать на ярмарке',
          requirements: null,
          results: [
            { 
              type: 'trading', 
              profitModifier: 1.2,
              rareItemChance: 0.3,
              description: 'Повышенная прибыль от торговли и шанс найти редкие предметы' 
            }
          ],
          concludesEvent: false
        },
        {
          text: 'Собирать информацию и слухи',
          requirements: null,
          results: [
            { 
              type: 'information_gathering', 
              description: 'Получена информация о происходящем в мире' 
            }
          ],
          concludesEvent: false
        },
        {
          text: 'Искать представителей определенной секты',
          requirements: { stat: 'charisma', value: 3 },
          results: [
            { 
              type: 'sect_relations', 
              relationModifier: 10,
              description: 'Улучшены отношения с выбранной сектой' 
            }
          ],
          concludesEvent: false
        },
        {
          text: 'Участвовать в демонстрации техник',
          requirements: { skill: 'cultivation', level: 3 },
          results: [
            { type: 'reputation', amount: 15, description: 'Повышена репутация' },
            { type: 'experience', amount: 25, description: '+25 опыта культивации' }
          ],
          concludesEvent: false
        },
        {
          text: 'Покинуть ярмарку',
          requirements: null,
          results: [],
          concludesEvent: true
        }
      ],
      cooldown: 30 // дней игрового времени
    });
    
    // Дополнительные свойства для события ярмарки
    this.merchantList = []; // Список торговцев, которые появляются на ярмарке
    this.rareItems = []; // Список редких предметов, доступных на ярмарке
    this.rumors = []; // Список слухов, которые можно услышать
    this.sectRepresentatives = []; // Список представителей сект
  }
  
  /**
   * Применяет начальные эффекты события
   * @param {Object} context - Игровой контекст
   */
  applyInitialEffects(context) {
    // Создаем торговцев
    this.generateMerchants(context);
    
    // Генерируем редкие предметы
    this.generateRareItems(context);
    
    // Генерируем слухи
    this.generateRumors(context);
    
    // Определяем секты, представленные на ярмарке
    this.generateSectRepresentatives(context);
    
    // Применяем глобальные эффекты
    if (context.world.merchantPriceModifier) {
      context.world.merchantPriceModifier *= 0.9; // Снижаем цены на 10%
    }
    
    // Если в игре есть система новостей, добавляем новость о ярмарке
    if (context.world.news) {
      context.world.news.push({
        id: `fair_announcement_${Date.now()}`,
        title: 'Ярмарка культиваторов',
        content: `В регионе ${context.player.location.name || 'окрестностей'} проводится ярмарка культиваторов. Торговцы со всего мира привезли редкие товары и ценные материалы.`,
        importance: 'medium',
        timestamp: { ...context.world.time }
      });
    }
    
    // Создаем визуальный эффект празднования в городе/деревне
    if (context.world.visualEffects) {
      context.world.visualEffects.push({
        type: 'fair',
        intensity: 1.0,
        duration: this._endTime.hour * 60 + this._endTime.minute - (this._startTime.hour * 60 + this._startTime.minute),
        location: context.player.location.id
      });
    }
  }
  
  /**
   * Метод, вызываемый при завершении события
   * @param {Object} context - Игровой контекст
   */
  onConclude(context) {
    // Восстанавливаем нормальные цены
    if (context.world.merchantPriceModifier) {
      context.world.merchantPriceModifier /= 0.9; // Возвращаем цены к норме
    }
    
    // Удаляем визуальные эффекты
    if (context.world.visualEffects) {
      context.world.visualEffects = context.world.visualEffects.filter(effect => 
        effect.type !== 'fair' || effect.location !== context.player.location.id
      );
    }
    
    // Если в игре есть система новостей, добавляем новость о завершении ярмарки
    if (context.world.news) {
      context.world.news.push({
        id: `fair_end_${Date.now()}`,
        title: 'Завершение ярмарки',
        content: `Ярмарка культиваторов в регионе ${context.player.location.name || 'окрестностей'} завершилась. Торговцы разъезжаются по своим делам.`,
        importance: 'low',
        timestamp: { ...context.world.time }
      });
    }
  }
  
  /**
   * Применяет конкретный результат
   * @param {Object} result - Результат для применения
   * @param {Object} context - Игровой контекст
   * @returns {Object} Информация о примененном результате
   */
  applyResult(result, context) {
    // Обработка торговли
    if (result.type === 'trading') {
      const tradingResult = this.processTradingActivity(context, result.profitModifier, result.rareItemChance);
      
      return {
        applied: true,
        description: tradingResult.description,
        profit: tradingResult.profit,
        items: tradingResult.items
      };
    }
    
    // Обработка сбора информации
    if (result.type === 'information_gathering') {
      const rumors = this.getRandomRumors(3); // Получаем 3 случайных слуха
      
      return {
        applied: true,
        description: 'Вы узнали несколько интересных слухов',
        rumors: rumors
      };
    }
    
    // Обработка отношений с сектами
    if (result.type === 'sect_relations') {
      const sect = this.selectRandomSect(context);
      if (sect) {
        // Улучшаем отношения с сектой
        this.improveSectRelations(context, sect.id, result.relationModifier);
        
        return {
          applied: true,
          description: `Ваши отношения с сектой "${sect.name}" улучшились`,
          sect: sect.name,
          relationChange: result.relationModifier
        };
      }
      
      return { applied: false, description: 'Не удалось найти подходящую секту' };
    }
    
    // Для остальных типов используем реализацию родительского класса
    return super.applyResult(result, context);
  }
  
  /**
   * Генерирует торговцев для ярмарки
   * @param {Object} context - Игровой контекст
   */
  generateMerchants(context) {
    const playerLevel = context.player.cultivation.level;
    
    // Определяем количество торговцев в зависимости от уровня игрока
    const merchantCount = 3 + Math.floor(playerLevel / 2);
    
    // Типы торговцев
    const merchantTypes = [
      { type: 'herb_merchant', name: 'Торговец травами', speciality: 'herbs' },
      { type: 'weapon_merchant', name: 'Торговец оружием', speciality: 'weapons' },
      { type: 'pill_merchant', name: 'Алхимик', speciality: 'pills' },
      { type: 'talisman_merchant', name: 'Талисманщик', speciality: 'talismans' },
      { type: 'artifact_merchant', name: 'Торговец артефактами', speciality: 'artifacts' },
      { type: 'beast_merchant', name: 'Заводчик духовных зверей', speciality: 'beasts' },
      { type: 'scroll_merchant', name: 'Продавец свитков', speciality: 'scrolls' },
    ];
    
    // Генерируем случайных торговцев
    this.merchantList = [];
    
    for (let i = 0; i < merchantCount; i++) {
      const randomIndex = Math.floor(Math.random() * merchantTypes.length);
      const merchantType = merchantTypes[randomIndex];
      
      this.merchantList.push({
        id: `merchant_${Date.now()}_${i}`,
        name: `${merchantType.name} ${this.getRandomName()}`,
        type: merchantType.type,
        speciality: merchantType.speciality,
        level: Math.max(1, Math.floor(playerLevel * (0.7 + Math.random() * 0.6))), // Уровень торговца относительно игрока
        priceModifier: 0.8 + Math.random() * 0.4, // Модификатор цен от 0.8 до 1.2
        inventory: [] // Инвентарь будет заполнен при первом разговоре с торговцем
      });
    }
  }
  
  /**
   * Генерирует редкие предметы для ярмарки
   * @param {Object} context - Игровой контекст
   */
  generateRareItems(context) {
    const playerLevel = context.player.cultivation.level;
    
    // Определяем количество редких предметов
    const itemCount = 2 + Math.floor(playerLevel / 3);
    
    // Типы редких предметов
    const itemTypes = [
      { type: 'spirit_herb', rarity: 'rare', minLevel: 1 },
      { type: 'cultivation_manual', rarity: 'rare', minLevel: 2 },
      { type: 'artifact_weapon', rarity: 'rare', minLevel: 3 },
      { type: 'artifact_armor', rarity: 'rare', minLevel: 4 },
      { type: 'spirit_pet_egg', rarity: 'epic', minLevel: 5 },
      { type: 'ancient_talisman', rarity: 'epic', minLevel: 6 },
      { type: 'legendary_pill', rarity: 'legendary', minLevel: 8 }
    ];
    
    // Фильтруем предметы по уровню игрока
    const availableItems = itemTypes.filter(item => item.minLevel <= playerLevel);
    
    // Генерируем случайные редкие предметы
    this.rareItems = [];
    
    for (let i = 0; i < itemCount; i++) {
      if (availableItems.length === 0) break;
      
      const randomIndex = Math.floor(Math.random() * availableItems.length);
      const itemType = availableItems[randomIndex];
      
      // Добавляем случайный предмет
      this.rareItems.push({
        id: `rare_item_${Date.now()}_${i}`,
        name: this.getRandomItemName(itemType.type),
        type: itemType.type,
        rarity: itemType.rarity,
        level: Math.max(1, Math.floor(playerLevel * (0.8 + Math.random() * 0.5))),
        price: 100 * Math.pow(2, itemType.minLevel) * (0.8 + Math.random() * 0.4),
        description: this.getRandomItemDescription(itemType.type)
      });
    }
  }
  
  /**
   * Генерирует слухи для ярмарки
   * @param {Object} context - Игровой контекст
   */
  generateRumors(context) {
    // Список возможных слухов
    const possibleRumors = [
      'В горах на востоке обнаружена древняя гробница бессмертного.',
      'Секта Небесного Пламени объявила набор новых учеников.',
      'В южных лесах видели редкого духовного зверя пятого ранга.',
      'Старейшина Чжао из секты Пяти Элементов достиг прорыва в царство формирования ядра.',
      'Ходят слухи о предстоящем межсектовом турнире через месяц.',
      'В торговом городе Линьян появился загадочный алхимик, создающий пилюли невиданной эффективности.',
      'Демонические культиваторы захватили несколько деревень на западной границе.',
      'Император объявил награду за поимку опасного преступника, бывшего ученика секты Лазурного Дракона.',
      'В долине Девяти Цветов начался сезон цветения духовных трав.',
      'Духовные камни в регионе Юньтай стали терять свою энергию по неизвестной причине.',
      'Великая семья Ли объявила о помолвке своей наследницы с учеником секты Великого Пути.',
      'В тайном аукционе в столице будет выставлен древний артефакт эпохи Воинствующих Царств.'
    ];
    
    // Выбираем 5-8 случайных слухов
    const rumorCount = 5 + Math.floor(Math.random() * 4);
    
    // Создаем копию массива для случайного выбора
    const rumorsForSelection = [...possibleRumors];
    this.rumors = [];
    
    for (let i = 0; i < rumorCount; i++) {
      if (rumorsForSelection.length === 0) break;
      
      // Выбираем случайный слух
      const randomIndex = Math.floor(Math.random() * rumorsForSelection.length);
      const selectedRumor = rumorsForSelection.splice(randomIndex, 1)[0];
      
      this.rumors.push({
        id: `rumor_${Date.now()}_${i}`,
        content: selectedRumor,
        importance: Math.random() < 0.3 ? 'high' : Math.random() < 0.7 ? 'medium' : 'low',
        reliability: Math.random() < 0.2 ? 'questionable' : Math.random() < 0.8 ? 'plausible' : 'reliable'
      });
    }
  }
  
  /**
   * Генерирует представителей сект для ярмарки
   * @param {Object} context - Игровой контекст
   */
  generateSectRepresentatives(context) {
    // Список возможных сект
    const possibleSects = [
      { id: 'celestial_sword', name: 'Секта Небесного Меча', element: 'metal' },
      { id: 'azure_lotus', name: 'Секта Лазурного Лотоса', element: 'water' },
      { id: 'thunder_peak', name: 'Школа Громовой Вершины', element: 'lightning' },
      { id: 'five_elements', name: 'Секта Пяти Элементов', element: 'mixed' },
      { id: 'crimson_flame', name: 'Секта Багряного Пламени', element: 'fire' },
      { id: 'jade_forest', name: 'Секта Нефритового Леса', element: 'wood' },
      { id: 'iron_heart', name: 'Школа Железного Сердца', element: 'earth' },
      { id: 'misty_cloud', name: 'Секта Облачного Тумана', element: 'air' }
    ];
    
    // Выбираем 2-4 случайные секты
    const sectCount = 2 + Math.floor(Math.random() * 3);
    
    // Создаем копию массива для случайного выбора
    const sectsForSelection = [...possibleSects];
    this.sectRepresentatives = [];
    
    for (let i = 0; i < sectCount; i++) {
      if (sectsForSelection.length === 0) break;
      
      // Выбираем случайную секту
      const randomIndex = Math.floor(Math.random() * sectsForSelection.length);
      const selectedSect = sectsForSelection.splice(randomIndex, 1)[0];
      
      this.sectRepresentatives.push({
        id: selectedSect.id,
        name: selectedSect.name,
        element: selectedSect.element,
        representativeName: this.getRandomName(),
        representativeLevel: 3 + Math.floor(Math.random() * 5), // Уровень 3-7
        relationModifier: 0.8 + Math.random() * 0.4 // Дружелюбность представителя 0.8-1.2
      });
    }
  }
  
  /**
   * Обрабатывает активность торговли
   * @param {Object} context - Игровой контекст
   * @param {number} profitModifier - Модификатор прибыли
   * @param {number} rareItemChance - Шанс найти редкий предмет
   * @returns {Object} Результат торговли
   */
  processTradingActivity(context, profitModifier, rareItemChance) {
    const playerLevel = context.player.cultivation.level;
    
    // Базовая прибыль зависит от уровня игрока
    const baseProfit = 50 * Math.pow(1.2, playerLevel);
    const actualProfit = Math.floor(baseProfit * profitModifier * (0.8 + Math.random() * 0.4));
    
    // Добавляем прибыль игроку
    if (context.player.inventory && context.player.inventory.currency) {
      context.player.inventory.currency.gold += actualProfit;
    }
    
    // Проверяем шанс на получение редкого предмета
    const foundItems = [];
    if (Math.random() < rareItemChance && this.rareItems.length > 0) {
      // Выбираем случайный предмет из списка редких
      const randomIndex = Math.floor(Math.random() * this.rareItems.length);
      const selectedItem = { ...this.rareItems[randomIndex] };
      
      // Добавляем предмет в инвентарь
      if (context.player.inventory && context.player.inventory.items) {
        context.player.inventory.items.push(selectedItem);
        foundItems.push(selectedItem);
      }
    }
    
    return {
      profit: actualProfit,
      items: foundItems,
      description: foundItems.length > 0
        ? `Вы заработали ${actualProfit} золота и нашли редкий предмет: ${foundItems[0].name}`
        : `Вы заработали ${actualProfit} золота`
    };
  }
  
  /**
   * Улучшает отношения с сектой
   * @param {Object} context - Игровой контекст
   * @param {string} sectId - ID секты
   * @param {number} amount - Величина улучшения отношений
   * @returns {boolean} Успешность операции
   */
  improveSectRelations(context, sectId, amount) {
    // Проверяем, есть ли у игрока система отношений с фракциями
    if (context.player.relations && context.player.relations.sects) {
      // Если секта уже есть в отношениях, увеличиваем значение
      if (context.player.relations.sects[sectId] !== undefined) {
        context.player.relations.sects[sectId] += amount;
      } else {
        // Иначе создаем новое отношение с базовым значением + улучшение
        context.player.relations.sects[sectId] = 0 + amount;
      }
      return true;
    }
    return false;
  }
  
  /**
   * Выбирает случайную секту из представленных на ярмарке
   * @param {Object} context - Игровой контекст
   * @returns {Object|null} Выбранная секта или null, если нет сект
   */
  selectRandomSect(context) {
    if (this.sectRepresentatives.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * this.sectRepresentatives.length);
    return this.sectRepresentatives[randomIndex];
  }
  
  /**
   * Возвращает несколько случайных слухов
   * @param {number} count - Количество слухов
   * @returns {Array} Массив случайных слухов
   */
  getRandomRumors(count) {
    if (this.rumors.length === 0) {
      return [];
    }
    
    // Создаем копию массива для случайного выбора
    const rumorsForSelection = [...this.rumors];
    const selectedRumors = [];
    
    const actualCount = Math.min(count, rumorsForSelection.length);
    
    for (let i = 0; i < actualCount; i++) {
      const randomIndex = Math.floor(Math.random() * rumorsForSelection.length);
      const selectedRumor = rumorsForSelection.splice(randomIndex, 1)[0];
      selectedRumors.push(selectedRumor);
    }
    
    return selectedRumors;
  }
  
  /**
   * Возвращает случайное имя для NPC
   * @returns {string} Случайное имя
   */
  getRandomName() {
    const firstNames = ['Ли', 'Чжан', 'Ван', 'Чен', 'Лю', 'Хуан', 'Чжао', 'У', 'Сюй', 'Сунь'];
    const lastNames = ['Юнь', 'Фэн', 'Хуа', 'Вэй', 'Мин', 'Цзюнь', 'Линь', 'Цзянь', 'Лун', 'Тянь'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }
  
  /**
   * Возвращает случайное название предмета
   * @param {string} type - Тип предмета
   * @returns {string} Случайное название
   */
  getRandomItemName(type) {
    const prefixes = {
      'spirit_herb': ['Небесная', 'Духовная', 'Древняя', 'Мистическая', 'Чудесная'],
      'cultivation_manual': ['Искусство', 'Метод', 'Техника', 'Руководство', 'Трактат'],
      'artifact_weapon': ['Клинок', 'Меч', 'Сабля', 'Копье', 'Кинжал'],
      'artifact_armor': ['Мантия', 'Роба', 'Доспех', 'Щит', 'Шлем'],
      'spirit_pet_egg': ['Яйцо', 'Зародыш', 'Эмбрион', 'Семя', 'Кокон'],
      'ancient_talisman': ['Талисман', 'Амулет', 'Печать', 'Символ', 'Знак'],
      'legendary_pill': ['Пилюля', 'Эликсир', 'Снадобье', 'Настой', 'Лекарство']
    };
    
    const suffixes = {
      'spirit_herb': ['Ци', 'Души', 'Бессмертия', 'Долголетия', 'Просветления'],
      'cultivation_manual': ['Небесного Пути', 'Пяти Элементов', 'Бессмертного Начала', 'Великого Дао', 'Пустотного Сердца'],
      'artifact_weapon': ['Дракона', 'Феникса', 'Грома', 'Пламени', 'Морозного Инея'],
      'artifact_armor': ['Нефритового Щита', 'Драконьей Чешуи', 'Небесного Покрова', 'Горного Камня', 'Золотого Света'],
      'spirit_pet_egg': ['Дракона', 'Феникса', 'Цилиня', 'Черепахи', 'Тигра'],
      'ancient_talisman': ['Пяти Гор', 'Небесного Озера', 'Огненного Начала', 'Морозного Края', 'Древнего Бессмертного'],
      'legendary_pill': ['Пробуждения Духа', 'Очищения Ци', 'Формирования Ядра', 'Преобразования Тела', 'Просветления Души']
    };
    
    const typePrefix = prefixes[type] || ['Неизвестный'];
    const typeSuffix = suffixes[type] || ['предмет'];
    
    const prefix = typePrefix[Math.floor(Math.random() * typePrefix.length)];
    const suffix = typeSuffix[Math.floor(Math.random() * typeSuffix.length)];
    
    return `${prefix} ${suffix}`;
  }
  
  /**
   * Возвращает случайное описание предмета
   * @param {string} type - Тип предмета
   * @returns {string} Случайное описание
   */
  getRandomItemDescription(type) {
    const descriptions = {
      'spirit_herb': 'Редкая духовная трава, содержащая концентрированную энергию. Используется в алхимии и для непосредственного потребления.',
      'cultivation_manual': 'Руководство по культивации, содержащее методы тренировки и циркуляции энергии.',
      'artifact_weapon': 'Духовное оружие, усиливающее атаки и предоставляющее дополнительные боевые возможности.',
      'artifact_armor': 'Защитное снаряжение, усиленное духовной энергией, повышающее защиту и выносливость.',
      'spirit_pet_egg': 'Яйцо духовного существа, которое может стать верным спутником и помощником в культивации.',
      'ancient_talisman': 'Древний талисман со множеством запечатанных заклинаний и техник.',
      'legendary_pill': 'Легендарная пилюля, созданная мастером алхимии, значительно ускоряющая процесс культивации.'
    };
    
    return descriptions[type] || 'Редкий и ценный предмет, обладающий особыми свойствами.';
  }
}
