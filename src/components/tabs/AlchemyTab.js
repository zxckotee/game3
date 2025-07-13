import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import styled from 'styled-components';
import alchemyService from '../../services/alchemy-service-adapter';

// Стилизованные компоненты
const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  color: #f0f0f0;
`;

const TabHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const TabTitle = styled.h2`
  font-size: 24px;
  margin: 0;
  color: #ffd700;
`;

const TabContent = styled.div`
  display: flex;
  flex: 1;
  gap: 20px;
`;

const LeftPanel = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  padding: 15px;
  display: flex;
  flex-direction: column;
`;

const RightPanel = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  padding: 15px;
  display: flex;
  flex-direction: column;
`;

const TabMenu = styled.div`
  display: flex;
  margin-bottom: 15px;
  border-bottom: 1px solid #444;
`;

const TabButton = styled.button`
  background: ${props => props.active ? 'rgba(255, 215, 0, 0.2)' : 'transparent'};
  color: ${props => props.active ? '#ffd700' : '#ccc'};
  border: none;
  padding: 10px 15px;
  font-size: 16px;
  cursor: pointer;
  border-bottom: ${props => props.active ? '2px solid #ffd700' : 'none'};
  transition: all 0.3s;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
    color: #ffd700;
  }
`;

const RecipeList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RecipeCard = styled.div`
  display: flex;
  background: ${props => props.selected ? 'rgba(255, 215, 0, 0.1)' : 'rgba(30, 30, 30, 0.7)'};
  border: 1px solid ${props => props.selected ? '#ffd700' : '#444'};
  border-radius: 5px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 215, 0, 0.05);
    border-color: #ffd700;
  }
`;

const RecipeIcon = styled.div`
  width: 40px;
  height: 40px;
  background: #333;
  border-radius: 5px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`;

const RecipeInfo = styled.div`
  flex: 1;
`;

const RecipeName = styled.div`
  font-weight: bold;
  color: ${props => {
    switch(props.rarity) {
      case 'common': return '#aaa';
      case 'uncommon': return '#1eff00';
      case 'rare': return '#0070dd';
      case 'epic': return '#a335ee';
      case 'legendary': return '#ff8000';
      default: return '#aaa';
    }
  }};
`;

const RecipeDescription = styled.div`
  font-size: 14px;
  color: #aaa;
  margin-top: 5px;
`;

const RecipeDetails = styled.div`
  padding: 15px;
  background: rgba(30, 30, 30, 0.7);
  border-radius: 5px;
  margin-top: 15px;
`;

const DetailTitle = styled.h3`
  margin: 0 0 10px 0;
  color: #ffd700;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const DetailLabel = styled.div`
  color: #aaa;
`;

const DetailValue = styled.div`
  color: #fff;
`;

const IngredientsList = styled.div`
  margin-top: 15px;
`;

const IngredientItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  background: ${props => props.available ? 'rgba(0, 128, 0, 0.1)' : 'rgba(128, 0, 0, 0.1)'};
`;

const IngredientName = styled.div`
  flex: 1;
  color: ${props => props.available ? '#5f5' : '#f55'};
`;

const IngredientQuantity = styled.div`
  color: ${props => props.available ? '#5f5' : '#f55'};
  display: flex;
  align-items: center;
  gap: 5px;
`;

const QuantityBadge = styled.span`
  background: ${props => props.enough ? 'rgba(0, 128, 0, 0.3)' : 'rgba(128, 0, 0, 0.3)'};
  color: ${props => props.enough ? '#5f5' : '#f55'};
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.8em;
`;

const ActionButton = styled.button`
  background: ${props => props.primary ? 'rgba(255, 215, 0, 0.2)' : 'rgba(80, 80, 80, 0.3)'};
  color: ${props => props.primary ? '#ffd700' : '#ccc'};
  border: 1px solid ${props => props.primary ? '#ffd700' : '#444'};
  border-radius: 5px;
  padding: 10px 15px;
  margin-top: 15px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: ${props => props.primary ? 'rgba(255, 215, 0, 0.3)' : 'rgba(80, 80, 80, 0.5)'};
  }
  
  &:disabled {
    background: rgba(50, 50, 50, 0.3);
    color: #666;
    border-color: #333;
    cursor: not-allowed;
  }
`;

const SearchBar = styled.input`
  background: rgba(30, 30, 30, 0.7);
  color: #fff;
  border: 1px solid #444;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 15px;
  font-size: 16px;
  
  &::placeholder {
    color: #777;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const FilterSelect = styled.select`
  background: rgba(30, 30, 30, 0.7);
  color: #fff;
  border: 1px solid #444;
  border-radius: 5px;
  padding: 8px;
  font-size: 14px;
`;

const NoRecipesMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #777;
  font-style: italic;
`;

const ResultMessage = styled.div`
  margin-top: 20px;
  padding: 15px;
  border-radius: 5px;
  background: ${props => props.success ? 'rgba(0, 128, 0, 0.2)' : 'rgba(128, 0, 0, 0.2)'};
  color: ${props => props.success ? '#5f5' : '#f55'};
  text-align: center;
`;

const CraftingProgress = styled.div`
  margin-top: 20px;
  height: 20px;
  background: rgba(30, 30, 30, 0.7);
  border-radius: 10px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(to right, #ffd700, #ffaa00);
  border-radius: 10px;
  transition: width 0.1s linear;
`;

/**
 * Компонент вкладки "Алхимия"
 */
// Словарь с русскими переводами ингредиентов
const ingredientTranslations = {
  'herb_qigathering': 'Трава сбора ци',
  'water_spirit': 'Духовная вода',
  'mineral_dust': 'Минеральная пыль',
  'herb_ironroot': 'Железный корень',
  'beast_bone': 'Кость зверя',
  'mineral_iron': 'Железная руда',
  'herb_clearflow': 'Трава чистого потока',
  'water_pure': 'Чистая вода',
  'crystal_clear': 'Прозрачный кристалл',
  'herb_spiritbloom': 'Цветок духа',
  'essence_concentration': 'Эссенция концентрации',
  'crystal_mind': 'Кристалл разума',
  'herb_goldensage': 'Золотой шалфей',
  'essence_purity': 'Эссенция чистоты',
  'crystal_formation': 'Кристалл формирования',
  'metal_celestial': 'Небесный металл',
  'herb_soulwhisper': 'Трава шепота души',
  'essence_enlightenment': 'Эссенция просветления',
  'crystal_soul': 'Кристалл души',
  'dust_stardust': 'Звездная пыль',
  'paper_talisman': 'Бумага для талисмана',
  'ink_basic': 'Базовые чернила',
  'essence_reflection': 'Эссенция отражения',
  'ink_fire': 'Огненные чернила',
  'feather_phoenix': 'Перо феникса',
  'metal_heavenly': 'Небесный металл высшего качества',
  'essence_heaven': 'Эссенция небес',
  'crystal_star': 'Звездный кристалл',
  'spirit_ancient': 'Древний дух'
};

// Таблица соответствия идентификаторов в инвентаре и рецептах
const idMappings = {
  'essence_heaven': 'essence_of_heaven', // Пример возможного несоответствия
  // Добавьте другие несоответствия при необходимости
};

// Функция нормализации идентификаторов
const normalizeItemId = (id) => {
  if (!id) return '';
  
  // Приводим к нижнему регистру
  let normalizedId = String(id).toLowerCase();
  
  // Проверяем наличие в таблице соответствия
  if (idMappings[normalizedId]) {
    console.log(`Нормализация ID: ${normalizedId} -> ${idMappings[normalizedId]}`);
    return idMappings[normalizedId];
  }
  
  return normalizedId;
};

// Функция для получения русского названия ингредиента
const getIngredientRussianName = (itemId, fallbackName) => {
  // Проверяем наличие перевода в словаре
  if (itemId && ingredientTranslations[itemId]) {
    return ingredientTranslations[itemId];
  }
  
  // Если перевода нет, используем переданное имя или генерируем из itemId
  if (fallbackName) {
    return fallbackName;
  }
  
  // Если нет ни перевода, ни fallbackName, генерируем читаемое имя из itemId
  if (itemId) {
    return itemId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  return "Неизвестный ингредиент";
};

const AlchemyTab = () => {
  const { state, actions } = useGame();
  const { player, cultivation } = state;
  
  // Состояние компонента
  const [activeTab, setActiveTab] = useState('pills'); // pills, talismans, weapons, armor, accessories
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [craftingStatus, setCraftingStatus] = useState(null); // null, 'crafting', 'success', 'failed'
  const [craftingProgress, setCraftingProgress] = useState(0);
  const [craftingResult, setCraftingResult] = useState(null);
  
  // Получение типа рецептов для активной вкладки
  const getRecipeType = () => {
    switch (activeTab) {
      case 'pills': return 'pill';
      case 'talismans': return 'talisman';
      case 'weapons': return 'weapon';
      case 'armor': return 'armor';
      case 'accessories': return 'accessory';
      default: return 'pill';
    }
  };
  
  // Сбрасываем выбранный рецепт при переключении вкладок
  useEffect(() => {
    setSelectedRecipe(null);
    setCraftingStatus(null);
    setCraftingResult(null);
  }, [activeTab]);
  
  // Функция для безопасного выбора рецепта с глубоким копированием
  const selectRecipe = (recipe) => {
    console.log('Выбор рецепта:', recipe.name);
    
    // Полностью очищаем текущий выбранный рецепт
    setSelectedRecipe(null);
    
    // Сбрасываем статус и результат создания при выборе нового рецепта
    setCraftingStatus(null);
    setCraftingResult(null);
    
    // Делаем паузу перед установкой нового рецепта
    setTimeout(() => {
      // Создаем совершенно новый объект с только нужными свойствами
      const cleanRecipe = {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        type: recipe.type,
        rarity: recipe.rarity,
        requiredLevel: recipe.requiredLevel,
        requiredStage: recipe.requiredStage,
        successRate: recipe.successRate,
        // Создаем полностью новый массив ингредиентов с новыми объектами
        ingredients: []
      };
      
      // Если у рецепта есть ингредиенты и это массив, копируем каждый ингредиент
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        // Добавляем только уникальные ингредиенты, копируя каждый в новый объект
        const uniqueIngredients = new Map();
        
        recipe.ingredients.forEach(ing => {
          // Используем правильный идентификатор
          const itemId = ing.id;
          console.log("Обработка ингредиента из рецепта:", ing);
          
          if (!uniqueIngredients.has(itemId) && itemId) {
            // Получаем русское название из словаря переводов или генерируем читаемое имя
            let readableName = getIngredientRussianName(itemId, null);
            
            // УЛУЧШЕННАЯ ПРОВЕРКА: Проверяем наличие ингредиента в инвентаре
            // и явно выводим расширенную информацию для отладки
            console.log(`Поиск ингредиента ${itemId} в инвентаре...`);
            
            // Логируем предметы инвентаря с похожими ID для отладки
            const similarItems = player.inventory.items.filter(item => {
              const normalizedItemId = normalizeItemId(item.itemId);
              const normalizedSearchId = normalizeItemId(itemId);
              return normalizedItemId.includes(normalizedSearchId) ||
                     normalizedSearchId.includes(normalizedItemId);
            });
            
            if (similarItems.length > 0) {
              console.log("Похожие предметы в инвентаре:",
                similarItems.map(item => `${item.name} (ID: ${item.itemId}, тип: ${item.type}, кол-во: ${item.quantity})`)
              );
            }
            
            // Проверяем наличие ингредиента в инвентаре
            const availableQuantity = getIngredientQuantityInInventory(itemId);
            
            // Создаем объект для ингредиента с расширенной информацией
            uniqueIngredients.set(itemId, {
              id: itemId,
              name: ing.item?.name || ing.name || readableName,
              quantity: ing.quantity,
              available: availableQuantity,
              hasEnough: availableQuantity >= ing.quantity,
              // Сохраняем исходную информацию о типе для отладки
              originalType: ing.type
            });
            
            console.log(`Добавлен ингредиент: ${ing.item?.name || ing.name || readableName} (${itemId})`);
            console.log(`Статус доступности: ${availableQuantity}/${ing.quantity}, достаточно: ${availableQuantity >= ing.quantity ? 'ДА' : 'НЕТ'}`);
          }
        });
        
        // Преобразуем Map обратно в массив
        cleanRecipe.ingredients = Array.from(uniqueIngredients.values());
        console.log(`Всего уникальных ингредиентов: ${cleanRecipe.ingredients.length}`);
        
        // Проверяем общую доступность всех ингредиентов
        cleanRecipe.hasAllIngredients = cleanRecipe.ingredients.every(ing => ing.hasEnough);
      }
      
      console.log('Итоговый список ингредиентов:', cleanRecipe.ingredients);
      console.log(`Общая доступность рецепта: ${cleanRecipe.hasAllIngredients ? 'ДОСТУПЕН' : 'НЕДОСТУПЕН'}`);
      
      // Проверяем наличие предметов с типом "ingredient" в инвентаре
      const ingredientTypeItems = player.inventory.items.filter(item => item.type === 'ingredient');
      if (ingredientTypeItems.length > 0) {
        console.log("Предметы с типом 'ingredient' в инвентаре:",
          ingredientTypeItems.map(item => `${item.name} (ID: ${item.itemId}, кол-во: ${item.quantity})`)
        );
      }
      
      setSelectedRecipe(cleanRecipe);
    }, 100); // Увеличиваем задержку для обеспечения завершения всех асинхронных операций
  };

  // Функция загрузки рецептов (определена на уровне компонента для доступности во всех методах)
  const loadRecipes = async () => {
    try {
      // Очищаем рецепты перед загрузкой новых
      setRecipes([]);
      setSelectedRecipe(null);

      // Получаем текущий тип рецептов на основе активной вкладки
      const currentType = getRecipeType();
      
      console.log(`Загрузка рецептов типа: ${currentType}`);
      
      // Используем API сервиса алхимии для получения рецептов указанного типа
      // Получаем все данные о рецептах и ингредиентах за один запрос
      const recipesData = await alchemyService.getRecipesByType(currentType);
      
      console.log('Получены данные от API:', recipesData);
      
      // Обрабатываем полученные данные
      // Преобразуем серверные данные в формат, подходящий для интерфейса
      const formattedRecipes = recipesData.map(recipe => {
        // Извлекаем ингредиенты, обеспечивая корректное форматирование
        let ingredients = [];
        
        // Проверяем и обрабатываем ингредиенты корректно
        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
          ingredients = recipe.ingredients.map(ing => {
            // Обрабатываем случай, когда item === null и нужно использовать item_id
            const itemId = ing.item_id || ing.itemId;
            
            // Получаем русское название из словаря переводов
            let readableName = getIngredientRussianName(itemId, ing.item?.name || ing.name);
            
            return {
              id: itemId,
              name: ing.item?.name || ing.name || readableName,
              quantity: ing.quantity,
              
            };
          });
          
        }
        
        console.log(`Рецепт ${recipe.name} имеет ${ingredients.length} ингредиентов:`, ingredients);
        
        return {
          id: recipe.id,
          name: recipe.name,
          description: recipe.description,
        type: recipe.type,
        rarity: recipe.rarity,
        requiredLevel: recipe.required_level || recipe.requiredLevel,
        requiredStage: recipe.required_stage || recipe.requiredStage,
        successRate: recipe.success_rate || recipe.successRate,
        ingredients: ingredients
      };
    });
    
    console.log('Отформатированные рецепты:', formattedRecipes);
    
    // Устанавливаем новые рецепты
    setRecipes(formattedRecipes);
  } catch (error) {
    console.error('Ошибка при загрузке рецептов алхимии:', error);
  }
};

// Загрузка рецептов при изменении вкладки
useEffect(() => {
  loadRecipes();
}, [activeTab]);
  
  // Фильтрация рецептов
  const filteredRecipes = React.useMemo(() => {
    if (!recipes || recipes.length === 0) {
      return [];
    }
    
    return recipes.filter(recipe => {
      // Фильтр по поисковому запросу
      const matchesSearch = searchQuery === '' || 
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Фильтр по редкости
      const matchesRarity = rarityFilter === 'all' || recipe.rarity === rarityFilter;
      
      // Фильтр по доступности (уровень культивации игрока)
      const playerStage = cultivation?.stage || 'Закалка тела';
      const playerLevel = cultivation?.level || 1;
      
      const stageOrder = ['Закалка тела', 'Очищение Ци', 'Золотое ядро', 'Формирование души'];
      const playerStageIndex = stageOrder.indexOf(playerStage);
      const recipeStageIndex = stageOrder.indexOf(recipe.requiredStage);
      
      let isAvailable = true;
      
      // Если ступень игрока ниже требуемой, рецепт недоступен
      if (playerStageIndex < recipeStageIndex) {
        isAvailable = false;
      }
      
      // Если ступень та же, проверяем уровень
      if (playerStageIndex === recipeStageIndex && playerLevel < recipe.requiredLevel) {
        isAvailable = false;
      }
      
      return matchesSearch && matchesRarity;
    });
  }, [recipes, searchQuery, rarityFilter, cultivation]);
  
  // Проверка наличия ингредиентов у игрока
  const checkIngredients = (recipe) => {
    if (!recipe || !recipe.ingredients || !player.inventory.items) {
      console.log('ОШИБКА: Нет рецепта, ингредиентов или инвентаря');
      return false;
    }
    
    console.log('======= ФИНАЛЬНАЯ ПРОВЕРКА ИНГРЕДИЕНТОВ ДЛЯ КРАФТА =======');
    console.log('Рецепт:', recipe.name);
    console.log('Всего ингредиентов в рецепте:', recipe.ingredients.length);
    
    // Логируем все предметы инвентаря для отладки
    console.log('ПОЛНЫЙ ИНВЕНТАРЬ:');
    player.inventory.items.forEach(item => {
      console.log(`- ${item.name}, ID: ${item.itemId}, тип: ${item.type}, количество: ${item.quantity}`);
    });
    
    // НОВЫЙ ПОДХОД: Используем доступность ингредиентов, определенную при выборе рецепта
    // Так как мы уже проверили доступность в selectRecipe, можем использовать эту информацию
    if (recipe.hasAllIngredients === true) {
      console.log('РЕЗУЛЬТАТ: Все ингредиенты доступны согласно предварительной проверке');
      return true;
    }
    
    // Резервный вариант: для каждого ингредиента проверяем наличие в инвентаре
    console.log('Запуск проверки наличия каждого ингредиента:');
    for (const ingredient of recipe.ingredients) {
      const normalizedIngredientId = normalizeItemId(ingredient.id);
      
      // Расширенный отладочный лог
      console.log(`\nПроверяем ингредиент: ${ingredient.name} (ID: ${ingredient.id}, нормализованный ID: ${normalizedIngredientId})`);
      console.log(`Требуемое количество: ${ingredient.quantity}`);
      
      // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: ПРЯМОЙ ПОИСК БЕЗ УЧЕТА ТИПА
      // Ищем любой предмет с подходящим ID независимо от типа
      let inventoryItem = null;
      
      // Сначала ищем по точному совпадению ID
      const exactMatches = player.inventory.items.filter(item => {
        const normalizedItemId = normalizeItemId(item.itemId);
        return normalizedItemId === normalizedIngredientId || item.itemId === ingredient.id;
      });
      
      if (exactMatches.length > 0) {
        console.log(`Найдены точные совпадения (${exactMatches.length}):`,
          exactMatches.map(item => `${item.name} (ID: ${item.itemId}, тип: ${item.type}, кол-во: ${item.quantity})`)
        );
        // Используем первый найденный предмет
        inventoryItem = exactMatches[0];
      }
      
      // 2. Простой поиск по ID (точное совпадение)
      if (!inventoryItem) {
        inventoryItem = player.inventory.items.find(item => {
          const normalizedItemId = normalizeItemId(item.itemId);
          // ИЗМЕНЕНО: убрана проверка типа, только сравнение ID
          return normalizedItemId === normalizedIngredientId;
        });
        
        if (inventoryItem) {
          console.log(`Найдено точное совпадение по ID: ${inventoryItem.name} (ID: ${inventoryItem.itemId})`);
        }
      }
      
      // 3. Частичное совпадение по ID
      if (!inventoryItem) {
        inventoryItem = player.inventory.items.find(item => {
          const normalizedItemId = normalizeItemId(item.itemId);
          return normalizedItemId && normalizedIngredientId &&
                 (normalizedItemId.includes(normalizedIngredientId) ||
                  normalizedIngredientId.includes(normalizedItemId));
        });
        
        if (inventoryItem) {
          console.log(`Найдено частичное совпадение по ID: ${inventoryItem.name} (ID: ${inventoryItem.itemId})`);
        }
      }
      
      // 4. Поиск по имени
      if (!inventoryItem) {
        const russianName = getIngredientRussianName(ingredient.id, null);
        inventoryItem = player.inventory.items.find(item =>
          item.name === russianName ||
          (item.name && russianName && (
            item.name.toLowerCase().includes(russianName.toLowerCase()) ||
            russianName.toLowerCase().includes(item.name.toLowerCase())
          ))
        );
        
        if (inventoryItem) {
          console.log(`Найдено совпадение по имени: ${inventoryItem.name} (ID: ${inventoryItem.itemId})`);
        }
      }
      
      // 5. Последняя попытка - полный игнор типа и поиск по любому совпадению
      if (!inventoryItem) {
        console.log(`Аварийный поиск для "${ingredient.name}" без учета типа предмета`);
        
        const possibleMatches = player.inventory.items.filter(item =>
          // Проверяем только ID и количество, полностью игнорируя тип
          item.quantity >= ingredient.quantity && (
            normalizeItemId(item.itemId) === normalizedIngredientId ||
            item.itemId === ingredient.id ||
            (normalizeItemId(item.itemId).includes(normalizedIngredientId.slice(0, 3)) ||
             normalizedIngredientId.includes(normalizeItemId(item.itemId).slice(0, 3)) ||
             item.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
             ingredient.name.toLowerCase().includes(item.name.toLowerCase()))
          )
        );
        
        if (possibleMatches.length > 0) {
          console.log(`Найдены аварийные совпадения (${possibleMatches.length}):`,
            possibleMatches.map(item => `${item.name} (ID: ${item.itemId}, кол-во: ${item.quantity})`)
          );
          inventoryItem = possibleMatches[0];
          console.log(`Используем: ${inventoryItem.name} (кол-во: ${inventoryItem.quantity})`);
        }
      }
      
      // Финальная проверка результатов поиска
      if (!inventoryItem) {
        console.log(`❌ ОШИБКА: Ингредиент ${ingredient.name} (ID: ${ingredient.id}) не найден в инвентаре`);
        return false;
      } else if (inventoryItem.quantity < ingredient.quantity) {
        console.log(`❌ ОШИБКА: Ингредиент ${ingredient.name} найден (${inventoryItem.name}), но количества недостаточно: ${inventoryItem.quantity}/${ingredient.quantity}`);
        return false;
      } else {
        console.log(`✅ УСПЕХ: Ингредиент ${ingredient.name} найден как ${inventoryItem.name}: ${inventoryItem.quantity}/${ingredient.quantity} - ОК`);
      }
    }
    
    console.log('🏆 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ: Все ингредиенты найдены в достаточном количестве');
    return true;
  };
  
  // Получение количества ингредиента в инвентаре
  const getIngredientQuantityInInventory = (ingredientId) => {
    if (!player.inventory.items) {
      return 0;
    }
    
    const normalizedIngredientId = normalizeItemId(ingredientId);
    
    // Добавляем расширенный отладочный лог
    console.log(`Поиск в инвентаре ингредиента с ID: ${ingredientId}, нормализованный ID: ${normalizedIngredientId}`);
    
    // Логируем предметы в инвентаре с их типами для отладки
    console.log("Предметы в инвентаре (с типами):");
    const inventoryIds = player.inventory.items.map(item => {
      const normalizedItemId = normalizeItemId(item.itemId);
      console.log(`- ${item.name}: itemId="${item.itemId}", тип="${item.type}", нормализованный="${normalizedItemId}"`);
      return { original: item.itemId, normalized: normalizedItemId, type: item.type };
    });
    
    // Пробуем несколько вариантов поиска
    // Добавляем явную проверку типа, чтобы как "ingredient", так и "consumable" считались подходящими
    let inventoryItem = player.inventory.items.find(item => {
      const normalizedItemId = normalizeItemId(item.itemId);
      // Теперь явно сравниваем ID и проверяем совместимость типов
      return normalizedItemId === normalizedIngredientId;
    });
    
    console.log(`Результат начального поиска для ${ingredientId}: ${inventoryItem ? 'найден' : 'не найден'}`);
    console.log(`Предметы инвентаря с типом ingredient или consumable:`,
      player.inventory.items
        .filter(item => item.type === 'ingredient' || item.type === 'consumable')
        .map(item => `${item.name} (ID: ${item.itemId}, тип: ${item.type}, кол-во: ${item.quantity})`)
    );
    
    // Если не нашли точное совпадение, пробуем частичное
    if (!inventoryItem) {
      inventoryItem = player.inventory.items.find(item => {
        const normalizedItemId = normalizeItemId(item.itemId);
        return (normalizedItemId && normalizedIngredientId &&
                (normalizedItemId.includes(normalizedIngredientId) ||
                 normalizedIngredientId.includes(normalizedItemId)));
      });
    }
    
    // Если все еще не нашли, пробуем поиск по имени
    if (!inventoryItem) {
      const russianName = getIngredientRussianName(ingredientId, null);
      inventoryItem = player.inventory.items.find(item => item.name === russianName);
    }
    
    // НОВЫЙ МЕТОД: Полностью игнорируем тип предмета и другие атрибуты,
    // ищем только по идентификатору в любом формате
    if (!inventoryItem) {
      console.log(`Последняя попытка поиска: полный перебор всех предметов, игнорируя тип`);
      // Ищем все предметы, которые могут соответствовать этому ингредиенту
      const possibleMatches = player.inventory.items.filter(item => {
        // Проверяем все возможные форматы ID
        const itemNormalizedId = normalizeItemId(item.itemId);
        const ingredientNormalizedId = normalizedIngredientId;
        
        // Проверяем строковое соответствие, частичное соответствие, и содержание
        return itemNormalizedId === ingredientNormalizedId ||
               item.itemId === ingredientId ||
               (itemNormalizedId && ingredientNormalizedId &&
                (itemNormalizedId.includes(ingredientNormalizedId) ||
                 ingredientNormalizedId.includes(itemNormalizedId)));
      });
      
      // Если нашли возможные совпадения, логируем их и берем первое
      if (possibleMatches.length > 0) {
        console.log(`Найдены возможные совпадения (${possibleMatches.length}):`,
                   possibleMatches.map(item => `${item.name} (${item.itemId}, тип: ${item.type})`));
        inventoryItem = possibleMatches[0];
      }
    }
    
    if (inventoryItem) {
      console.log(`Найден предмет в инвентаре: ${inventoryItem.name} (${inventoryItem.itemId}), тип: ${inventoryItem.type}, количество: ${inventoryItem.quantity}`);
    } else {
      console.log(`Предмет с ID ${ingredientId} не найден в инвентаре`);
      
      // НОВАЯ ЛОГИКА: Проверяем предметы с типом "ingredient" и похожим ID
      const ingredientTypeItems = player.inventory.items.filter(item =>
        item.type === 'ingredient' &&
        (normalizeItemId(item.itemId).includes(normalizedIngredientId) ||
         normalizedIngredientId.includes(normalizeItemId(item.itemId)))
      );
      
      if (ingredientTypeItems.length > 0) {
        console.log(`Найдены предметы с типом "ingredient" и похожим ID:`,
          ingredientTypeItems.map(item => `${item.name} (${item.itemId}), количество: ${item.quantity}`)
        );
        // Используем первый найденный предмет с типом "ingredient"
        inventoryItem = ingredientTypeItems[0];
        console.log(`Используем предмет с типом "ingredient" как доступный: ${inventoryItem.name}, количество: ${inventoryItem.quantity}`);
      }
    }
    
    // Важно: возвращаем количество найденного предмета,
    // даже если его тип "ingredient"
    return (inventoryItem ? inventoryItem.quantity : 0);
  };
  
  // Обработчик нажатия кнопки создания предмета
  const handleCraft = async () => {
    if (!selectedRecipe) return;
    
    // Проверяем наличие ингредиентов перед началом крафта
    if (!checkIngredients(selectedRecipe)) {
      // Показываем уведомление, если ингредиентов недостаточно
      if (actions && actions.addNotification) {
        actions.addNotification({
          message: 'Недостаточно ингредиентов для создания предмета',
          type: 'error'
        });
      }
      return;
    }
    
    // Начинаем процесс крафта
    setCraftingStatus('crafting');
    setCraftingProgress(0);
    
    try {
      // Симулируем процесс крафта с анимацией прогресса
      const craftingTime = 3000; // 3 секунды
      const interval = 50; // 50 миллисекунд для каждого обновления
      const steps = craftingTime / interval;
      let currentStep = 0;
      
      const craftingInterval = setInterval(() => {
        currentStep++;
        setCraftingProgress(Math.min(100, (currentStep / steps) * 100));
        
        if (currentStep >= steps) {
          clearInterval(craftingInterval);
          // Вызываем функцию завершения крафта, которая взаимодействует с API
          completeCrafting();
        }
      }, interval);
    } catch (error) {
      console.error('Ошибка при создании предмета:', error);
      setCraftingStatus('failed');
      setCraftingResult(null);
      
      // Показываем уведомление об ошибке
      if (actions && actions.addNotification) {
        actions.addNotification({
          message: `Ошибка при создании предмета: ${error.message}`,
          type: 'error'
        });
      }
    }
  };
  
  // Завершение процесса крафта
  const completeCrafting = async () => {
    try {
      // Получаем userId из контекста
      const userId = player.id;
      
      if (!userId || !selectedRecipe) {
        console.error('Отсутствует ID пользователя или выбранный рецепт');
        setCraftingStatus('failed');
        setCraftingResult(null);
        return;
      }
      
      console.log(`Вызов API создания предмета: userId=${userId}, recipeId=${selectedRecipe.id}`);
      console.log("КЛИЕНТ: Состояние инвентаря до крафта:",
        player.inventory.items.map(item => `${item.name} (ID: ${item.itemId}): ${item.quantity}`));
      console.log("КЛИЕНТ: Используемые ингредиенты:", selectedRecipe.ingredients);
      
      // Вызов API для создания предмета
      const result = await alchemyService.craftItem(userId, selectedRecipe.id);
      
      console.log('Результат создания предмета:', result);
      
      if (result.success) {
        setCraftingStatus('success');
        setCraftingResult({
          name: selectedRecipe.name,
          description: selectedRecipe.description,
          rarity: selectedRecipe.rarity,
          items: result.items // Получаем созданные предметы с сервера
        });
        
        // Показываем уведомление об успехе
        if (actions && actions.addNotification) {
          actions.addNotification({
            message: `Успешно создан предмет: ${selectedRecipe.name}`,
            type: 'success'
          });
        }
        
        // Упрощенная версия: обновляем инвентарь игрока через API
        if (actions && actions.refreshInventory) {
          console.log("КЛИЕНТ: Запрос на полное обновление инвентаря через API");
          actions.refreshInventory();
        } else {
          console.warn('Функция обновления инвентаря недоступна');
        }
        
        console.log("КЛИЕНТ: Состояние инвентаря после крафта:",
          player.inventory.items.map(item => `${item.name} (ID: ${item.itemId}): ${item.quantity}`));
        
        // Сразу сбрасываем выбранный рецепт
        setSelectedRecipe(null);
      } else {
        setCraftingStatus('failed');
        setCraftingResult(null);
        
        // Показываем уведомление о неудаче
        if (actions && actions.addNotification) {
          actions.addNotification({
            message: result.message || 'Не удалось создать предмет. Ингредиенты потрачены впустую.',
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Ошибка при завершении создания предмета:', error);
      setCraftingStatus('failed');
      setCraftingResult(null);
      
      // Показываем уведомление об ошибке
      if (actions && actions.addNotification) {
        actions.addNotification({
          message: `Ошибка при создании предмета: ${error.message}`,
          type: 'error'
        });
      }
    }
  };
  
  // Рендеринг иконки рецепта
  const renderRecipeIcon = (type) => {
    switch (type) {
      case 'pill': return '💊';
      case 'talisman': return '📜';
      case 'weapon': return '⚔️';
      case 'armor': return '🛡️';
      case 'accessory': return '💍';
      default: return '?';
    }
  };
  
  // Функция для сброса только результата крафта
  const resetCraftingResult = () => {
    setCraftingStatus(null);
    setCraftingResult(null);
  };
  
  // Рендеринг сообщения о результате крафта
  const renderCraftingResult = () => {
    // Дополнительная проверка на наличие выбранного рецепта
    if (!craftingStatus || craftingStatus === 'crafting' || !selectedRecipe) {
      return null;
    }
    
    if (craftingStatus === 'success' && craftingResult) {
      return (
        <ResultMessage success>
          <h3>Создание успешно!</h3>
          <p>Вы успешно создали {craftingResult.name}</p>
          {craftingResult.items && craftingResult.items.length > 0 && (
            <div>
              <p>Полученные предметы:</p>
              <ul style={{ listStyleType: 'none', padding: '0' }}>
                {craftingResult.items.map((item, index) => (
                  <li key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '5px 0',
                    padding: '5px',
                    background: 'rgba(0, 128, 0, 0.1)',
                    borderRadius: '3px'
                  }}>
                    <div style={{ marginRight: '10px' }}>
                      {renderRecipeIcon(item.type || 'unknown')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                      <div style={{ fontSize: '0.8em', color: '#aaa' }}>
                        {item.quantity > 1 ? `${item.quantity} шт.` : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <ActionButton onClick={resetCraftingResult} style={{ marginTop: '15px' }}>
            Продолжить крафт
          </ActionButton>
        </ResultMessage>
      );
    } else if (selectedRecipe) {
      return (
        <ResultMessage success={false}>
          <h3>Создание не удалось!</h3>
          <p>Вы не смогли создать {selectedRecipe.name}. Ингредиенты потрачены впустую.</p>
        </ResultMessage>
      );
    }
    
    return null;
  };
  
  return (
    <TabContainer>
      <TabHeader>
        <TabTitle>Алхимия и создание предметов</TabTitle>
      </TabHeader>
      
      <TabMenu>
        <TabButton 
          active={activeTab === 'consumable'} // пилюли просто назовем расходниками, ведь у нас добавлены зелья и это все должно быть в одном разделе
          onClick={() => setActiveTab('consumable')}
        >
          Расходники
        </TabButton>
        <TabButton 
          active={activeTab === 'talismans'} 
          onClick={() => setActiveTab('talismans')}
        >
          Талисманы
        </TabButton>
        <TabButton 
          active={activeTab === 'weapons'} 
          onClick={() => setActiveTab('weapons')}
        >
          Оружие
        </TabButton>
        <TabButton 
          active={activeTab === 'armor'} 
          onClick={() => setActiveTab('armor')}
        >
          Броня
        </TabButton>
        <TabButton 
          active={activeTab === 'accessories'} 
          onClick={() => setActiveTab('accessories')}
        >
          Аксессуары
        </TabButton>
      </TabMenu>
      
      <TabContent>
        <LeftPanel>
          <SearchBar 
            placeholder="Поиск рецептов..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <FilterContainer>
            <FilterSelect 
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
            >
              <option value="all">Любая редкость</option>
              <option value="common">Обычные</option>
              <option value="uncommon">Необычные</option>
              <option value="rare">Редкие</option>
              <option value="epic">Эпические</option>
              <option value="legendary">Легендарные</option>
            </FilterSelect>
          </FilterContainer>
          
          <RecipeList>
            {filteredRecipes.length > 0 ? (
              filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  selected={selectedRecipe && selectedRecipe.id === recipe.id}
                  onClick={() => selectRecipe(recipe)}
                >
                  <RecipeIcon>{renderRecipeIcon(recipe.type)}</RecipeIcon>
                  <RecipeInfo>
                    <RecipeName rarity={recipe.rarity}>{recipe.name}</RecipeName>
                    <RecipeDescription>{recipe.description}</RecipeDescription>
                  </RecipeInfo>
                </RecipeCard>
              ))
            ) : (
              <NoRecipesMessage>Нет доступных рецептов в этой категории</NoRecipesMessage>
            )}
          </RecipeList>
        </LeftPanel>
        
        <RightPanel>
          {selectedRecipe ? (
            <>
              <DetailTitle>{selectedRecipe.name}</DetailTitle>
              <RecipeDescription>{selectedRecipe.description}</RecipeDescription>
              
              <RecipeDetails>
                <DetailRow>
                  <DetailLabel>Тип:</DetailLabel>
                  <DetailValue>
                    {(() => {
                      switch(selectedRecipe.type) {
                        case 'pill': return 'Пилюля';
                        case 'talisman': return 'Талисман';
                        case 'weapon': return 'Оружие';
                        case 'armor': return 'Броня';
                        case 'accessory': return 'Аксессуар';
                        default: return selectedRecipe.type;
                      }
                    })()}
                  </DetailValue>
                </DetailRow>
                
                <DetailRow>
                  <DetailLabel>Редкость:</DetailLabel>
                  <DetailValue style={{
                    color: (() => {
                      switch(selectedRecipe.rarity) {
                        case 'common': return '#aaa';
                        case 'uncommon': return '#1eff00';
                        case 'rare': return '#0070dd';
                        case 'epic': return '#a335ee';
                        case 'legendary': return '#ff8000';
                        default: return '#aaa';
                      }
                    })()
                  }}>
                    {(() => {
                      switch(selectedRecipe.rarity) {
                        case 'common': return 'Обычное';
                        case 'uncommon': return 'Необычное';
                        case 'rare': return 'Редкое';
                        case 'epic': return 'Эпическое';
                        case 'legendary': return 'Легендарное';
                        default: return selectedRecipe.rarity;
                      }
                    })()}
                  </DetailValue>
                </DetailRow>
                
                <DetailRow>
                  <DetailLabel>Требуемая ступень:</DetailLabel>
                  <DetailValue>{selectedRecipe.requiredStage}</DetailValue>
                </DetailRow>
                
                <DetailRow>
                  <DetailLabel>Требуемый уровень:</DetailLabel>
                  <DetailValue>{selectedRecipe.requiredLevel}</DetailValue>
                </DetailRow>
                
                <DetailRow>
                  <DetailLabel>Шанс успеха:</DetailLabel>
                  <DetailValue>{selectedRecipe.successRate}%</DetailValue>
                </DetailRow>
              </RecipeDetails>
              
              <IngredientsList>
                <DetailTitle>Ингредиенты:</DetailTitle>
                {/* Дополнительная проверка для предотвращения дублирования */}
                {selectedRecipe && selectedRecipe.ingredients && Array.isArray(selectedRecipe.ingredients) ?
                  // Используем Set для обеспечения уникальности ингредиентов по id
                  [...new Set(selectedRecipe.ingredients.map(ing => ing.id))].map(id => {
                    // Находим первый ингредиент с таким id
                    const ingredient = selectedRecipe.ingredients.find(ing => ing.id === id);
                    if (!ingredient) return null; // Проверка на случай, если ингредиент не найден
                    
                    const inventoryQuantity = getIngredientQuantityInInventory(ingredient.id);
                    const hasEnough = inventoryQuantity >= ingredient.quantity;
                    
                    console.log(`Отображение ингредиента: ${ingredient.name} (${ingredient.id})`);
                    
                    return (
                    <IngredientItem
                      key={ingredient.id}
                      available={hasEnough}
                    >
                      <IngredientName available={hasEnough}>{ingredient.name}</IngredientName>
                      <IngredientQuantity available={hasEnough}>
                        <QuantityBadge enough={hasEnough}>
                          {inventoryQuantity}/{ingredient.quantity}
                        </QuantityBadge>
                      </IngredientQuantity>
                    </IngredientItem>
                    );
                  }).filter(Boolean) // Фильтруем null значения
                : <div>Нет ингредиентов или неверный формат данных</div>}
              </IngredientsList>
              
              {craftingStatus === 'crafting' && (
                <CraftingProgress>
                  <ProgressBar progress={craftingProgress} />
                </CraftingProgress>
              )}
              
              {renderCraftingResult()}
              
              <ActionButton
                primary
                onClick={handleCraft}
                disabled={!selectedRecipe.hasAllIngredients || craftingStatus === 'crafting'}
              >
                {craftingStatus === 'crafting' ? 'Создание...' : 'Создать'}
              </ActionButton>
            </>
          ) : (
            <NoRecipesMessage>Выберите рецепт для просмотра деталей</NoRecipesMessage>
          )}
        </RightPanel>
      </TabContent>
    </TabContainer>
  );
};

export default AlchemyTab;
