/**
 * Сервис для работы с предметами и их обогащения данными из БД
 */
class ItemService {
  constructor() {
    // Инициализация кеша предметов
    this.itemCache = {};
    
    // Загружаем кеш из localStorage при инициализации
    this.loadCacheFromStorage();
    
    // Устанавливаем автоматическое сохранение кеша каждые 5 минут
    setInterval(() => this.saveCacheToStorage(), 300000);
    
    // Очистка старых записей кеша каждые 30 минут
    setInterval(() => this.cleanupCache(), 1800000);
    
    console.log(`[ItemService] Инициализирован, загружено ${Object.keys(this.itemCache).length} записей кеша`);
  }

  /**
   * Таблица сопоставления названий предметов со строковыми ID
   * Эта таблица больше не используется для преобразования строковых ID в числовые,
   * так как в БД теперь используются строковые ID.
   * Оставлена для обратной совместимости и справочных целей.
   */
  // Старая таблица сопоставления (закомментирована, сохранена для справки)
  /*
  itemIdMap = {
    // Оружие
    bronze_sword: 1001,
    iron_sword: 1002,
    east_wind_blade: 1003,
    azure_dragon_sword: 1004,
    
    // Броня
    linen_robe: 2001,
    leather_armor: 2002,
    mountain_guardian_armor: 2003,
    azure_dragon_robe: 2004,
    leather_helmet: 2005,
    perception_circlet: 2007,
    cloth_gloves: 2008,
    iron_gauntlets: 2009,
    spirit_channeling_gloves: 2010,
    cloth_shoes: 2011,
    swift_wind_boots: 2013,
    
    // Талисманы
    fire_talisman: 4001,
    water_talisman: 4002,
    protection_talisman: 4003,
    spiritual_sight_talisman: 4004,
    five_elements_talisman: 4005,
    
    // Пилюли
    qi_gathering_pill: 5001,
    cleansing_pill: 5002,
    healing_pill: 5003,
    breakthrough_pill: 5004,
    mind_calming_pill: 5005,
    basic_pill: 5006,
    
    // Аксессуары
    celestial_perception_ring: 3003,
    azure_dragon_scale_pendant: 3004
  };
  */
  
  /**
   * Карта соответствия названий предметов и их строковых ID
   * Используется для поиска ID по названию, если строковый ID не задан
   */
  nameToIdMap = {
    // Оружие
    'Бронзовый меч': 'bronze_sword',
    'Железный меч': 'iron_sword',
    'Клинок Восточного Ветра': 'east_wind_blade',
    'Меч Лазурного Дракона': 'azure_dragon_sword',
    
    // Броня
    'Льняная роба': 'linen_robe',
    'Кожаный доспех': 'leather_armor',
    'Доспех Горного Стража': 'mountain_guardian_armor',
    'Одеяние Лазурного Дракона': 'azure_dragon_robe',
    'Кожаный шлем': 'leather_helmet',
    'Венец Восприятия': 'perception_circlet',
    'Тканевые перчатки': 'cloth_gloves',
    'Железные рукавицы': 'iron_gauntlets',
    'Перчатки духовной проводимости': 'spirit_channeling_gloves',
    'Тканевые ботинки': 'cloth_shoes',
    'Сапоги Стремительного Ветра': 'swift_wind_boots',
    
    // Талисманы
    'Талисман огня': 'fire_talisman',
    'Талисман воды': 'water_talisman',
    'Талисман защиты': 'protection_talisman',
    'Талисман духовного зрения': 'spiritual_sight_talisman',
    'Талисман пяти стихий': 'five_elements_talisman',
    
    // Пилюли
    'Пилюля сбора ци': 'qi_gathering_pill',
    'Пилюля очищения': 'cleansing_pill',
    'Пилюля восстановления': 'healing_pill',
    'Пилюля духовного прорыва': 'breakthrough_pill',
    'Пилюля духовного покоя': 'mind_calming_pill',
    'Базовая пилюля': 'basic_pill',
    
    // Аксессуары
    'Кольцо Небесного Восприятия': 'celestial_perception_ring',
    'Подвеска из чешуи Лазурного Дракона': 'azure_dragon_scale_pendant'
  };
  
  /**
   * Нормализует ID предмета для использования в API
   * @param {string|number} itemId - ID предмета
   * @returns {string} - Нормализованный ID предмета
   */
  normalizeItemId(itemId) {
    // Если входной идентификатор - число, преобразуем в строку
    if (typeof itemId === 'number') {
      return String(itemId);
    }
    
    // Если это строка, пытаемся нормализовать ее
    if (typeof itemId === 'string') {
      // Если прямого сопоставления нет, пытаемся выполнить поиск по имени
      // (для случаев, когда у нас есть только название предмета)
      const stringIdFromName = this.nameToIdMap[itemId];
      if (stringIdFromName) {
        return stringIdFromName;
      }
      
      // Возвращаем исходную строку
      return itemId;
    }
    
    console.warn(`[ItemService] Не удалось нормализовать идентификатор: ${itemId}`);
    return String(itemId || '');
  }
  /**
   * Проверяет, есть ли предмет в кеше
   * @param {string|number} itemId - ID предмета
   * @returns {boolean} - true, если предмет в кеше
   */
  isItemCached(itemId) {
    // Нормализуем ID для использования в качестве ключа кеша
    const cacheKey = String(itemId);
    return !!this.itemCache[cacheKey];
  }

  /**
   * Получает информацию о предмете из кеша
   * @param {string|number} itemId - ID предмета
   * @returns {Object|null} - Данные о предмете или null
   */
  getItemFromCache(itemId) {
    // Нормализуем ID для использования в качестве ключа кеша
    const cacheKey = String(itemId);
    
    if (!this.itemCache[cacheKey]) {
      return null;
    }
    
    const cachedItem = this.itemCache[cacheKey];
    
    // Проверяем, не устарели ли данные (24 часа)
    const maxAge = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
    if (Date.now() - cachedItem.cachedAt > maxAge) {
      // Если данные устарели, удаляем их из кеша
      delete this.itemCache[cacheKey];
      console.log(`[ItemService] Удалены устаревшие данные из кеша для предмета ${itemId}`);
      return null;
    }
    
    console.log(`[ItemService] ✅ Данные о предмете ${itemId} взяты из кеша`);
    return cachedItem.data;
  }

  /**
   * Сохраняет информацию о предмете в кеш
   * @param {string|number} itemId - ID предмета
   * @param {Object} itemData - Данные о предмете
   */
  cacheItem(itemId, itemData) {
    // Нормализуем ID для использования в качестве ключа кеша
    const cacheKey = String(itemId);
    
    this.itemCache[cacheKey] = {
      data: itemData,
      cachedAt: Date.now()
    };
    
    console.log(`[ItemService] ✅ Данные о предмете ${itemId} сохранены в кеш`);
  }

  /**
   * Загружает кеш из localStorage
   */
  loadCacheFromStorage() {
    try {
      const cachedData = localStorage.getItem('itemServiceCache');
      if (cachedData) {
        this.itemCache = JSON.parse(cachedData);
        console.log(`[ItemService] Загружен кеш из localStorage: ${Object.keys(this.itemCache).length} предметов`);
      }
    } catch (error) {
      console.error('[ItemService] Ошибка при загрузке кеша:', error);
      this.itemCache = {};
    }
  }

  /**
   * Сохраняет кеш в localStorage
   */
  saveCacheToStorage() {
    try {
      localStorage.setItem('itemServiceCache', JSON.stringify(this.itemCache));
      console.log(`[ItemService] Кеш сохранен в localStorage: ${Object.keys(this.itemCache).length} предметов`);
    } catch (error) {
      console.error('[ItemService] Ошибка при сохранении кеша:', error);
    }
  }

  /**
   * Очищает устаревшие записи кеша
   * @param {number} maxAge - Максимальный возраст записи в миллисекундах (по умолчанию 24 часа)
   */
  cleanupCache(maxAge = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    let cleanedCount = 0;
    
    Object.keys(this.itemCache).forEach(itemId => {
      if (now - this.itemCache[itemId].cachedAt > maxAge) {
        delete this.itemCache[itemId];
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`[ItemService] Очистка кеша: удалено ${cleanedCount} устаревших записей`);
      this.saveCacheToStorage();
    }
  }

  /**
   * Получает детальную информацию о предмете из БД по его ID
   * @param {string|number} itemId - ID предмета
   * @returns {Promise<Object|null>} - Детальная информация о предмете или null при ошибке
   */
  async getItemDetails(itemId) {
    try {
      console.log(`[ItemService] ========== НАЧАЛО ЗАПРОСА ИНФОРМАЦИИ О ПРЕДМЕТЕ ==========`);
      console.log(`[ItemService] Запрос информации о предмете: ${itemId}`);
      console.log(`[ItemService] Тип itemId: ${typeof itemId}`);
      
      // Проверяем, есть ли предмет в кеше
      if (this.isItemCached(itemId)) {
        const cachedItem = this.getItemFromCache(itemId);
        if (cachedItem) {
          console.log(`[ItemService] ✅ Данные о предмете ${itemId} получены из кеша`);
          return cachedItem;
        }
      }
      
      // Нормализуем ID для запроса к API (теперь без преобразования в числовой формат)
      const normalizedId = this.normalizeItemId(itemId);
      
      console.log(`[ItemService] ✅ Нормализация ID: ${itemId} -> ${normalizedId}`);
      console.log(`[ItemService] Выполняем запрос к API: /api/items/${normalizedId}`);
      
      // Получаем ETag из кеша, если он есть
      const cacheKey = String(itemId);
      const etag = this.itemCache[cacheKey]?.etag;
      
      // Создаем заголовки для запроса
      const headers = {};
      if (etag) {
        headers['If-None-Match'] = etag;
      }
      
      const response = await fetch(`/api/items/${normalizedId}`, { headers });
      
      console.log(`[ItemService] Получен ответ от API, статус: ${response.status}`);
      
      // Обработка 304 Not Modified
      if (response.status === 304 && this.isItemCached(itemId)) {
        console.log(`[ItemService] 📦 Получен статус 304 Not Modified, используем данные из кеша`);
        // Сохраняем или обновляем ETag
        const newEtag = response.headers.get('ETag');
        if (newEtag && this.itemCache[cacheKey]) {
          this.itemCache[cacheKey].etag = newEtag;
        }
        return this.getItemFromCache(itemId);
      }
      
      // Проверка на ошибки
      if (!response.ok) {
        console.warn(`[ItemService] ⚠️ Ошибка получения данных о предмете ${itemId}: ${response.status} ${response.statusText}`);
        return null;
      }
      
      // Получаем данные только один раз
      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error(`[ItemService] ❌ Ошибка при разборе JSON ответа:`, jsonError);
        return null;
      }
      
      // Сохраняем ETag, если сервер его предоставил
      const newEtag = response.headers.get('ETag');
      if (newEtag && this.itemCache[cacheKey]) {
        this.itemCache[cacheKey].etag = newEtag;
      }
      
      if (responseData.success && responseData.item) {
        console.log(`[ItemService] ✅ Успешно получены данные о предмете ${itemId}`);
        console.log(`[ItemService] Полученные данные:`, JSON.stringify({
          item_id: responseData.item.item_id,
          name: responseData.item.name,
          type: responseData.item.type,
          rarity: responseData.item.rarity,
          effects_count: responseData.item.effects?.length || 0,
          requirements_count: responseData.item.requirements?.length || 0,
          special_effects_count: responseData.item.specialEffects?.length || 0
        }, null, 2));
        
        // Сохраняем данные в кеш
        this.cacheItem(itemId, responseData.item);
        
        return responseData.item;
      } else {
        console.warn(`[ItemService] ⚠️ Ошибка в ответе API: ${responseData.message || 'Неизвестная ошибка'}`);
        console.warn(`[ItemService] Полученный ответ:`, JSON.stringify(responseData, null, 2));
        return null;
      }
    } catch (error) {
      console.error(`[ItemService] ❌ Ошибка при получении информации о предмете ${itemId}:`, error);
      console.error(`[ItemService] Стек ошибки:`, error.stack);
      return null;
    } finally {
      console.log(`[ItemService] ========== ЗАВЕРШЕНИЕ ЗАПРОСА ИНФОРМАЦИИ О ПРЕДМЕТЕ ${itemId} ==========`);
    }
  }
  
}

export default new ItemService();