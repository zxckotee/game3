import React, { createContext, useContext, useState, useEffect } from 'react';

// Создание контекста
export const GlobalStateContext = createContext();

// Провайдер контекста
export function GlobalStateProvider({ children }) {
  // Состояние для различных доменов приложения
  const [auth, setAuth] = useState(null);
  const [alchemy, setAlchemy] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [cultivation, setCultivation] = useState(null);
  const [techniques, setTechniques] = useState(null);
  const [stats, setStats] = useState(null);
  const [pets, setPets] = useState(null);
  const [market, setMarket] = useState(null);
  const [resources, setResources] = useState(null);
  const [sect, setSect] = useState(null);
  const [effects, setEffects] = useState(null);
  
  // Эффекты для подписки на события от компонентов-менеджеров
  useEffect(() => {
    // Обработчики событий
    const handleAuthUpdate = (event) => setAuth(event.detail);
    const handleAlchemyUpdate = (event) => setAlchemy(event.detail);
    const handleInventoryUpdate = (event) => setInventory(event.detail);
    const handleCultivationUpdate = (event) => setCultivation(event.detail);
    const handleTechniquesUpdate = (event) => setTechniques(event.detail);
    const handleStatsUpdate = (event) => setStats(event.detail);
    const handlePetsUpdate = (event) => setPets(event.detail);
    const handleMarketUpdate = (event) => setMarket(event.detail);
    const handleResourcesUpdate = (event) => setResources(event.detail);
    const handleSectUpdate = (event) => setSect(event.detail);
    const handleEffectsUpdate = (event) => setEffects(event.detail);
    
    // Подписка на события
    window.addEventListener('auth-updated', handleAuthUpdate);
    window.addEventListener('alchemy-recipes-updated', handleAlchemyUpdate);
    window.addEventListener('inventory-updated', handleInventoryUpdate);
    window.addEventListener('cultivation-updated', handleCultivationUpdate);
    window.addEventListener('learned-techniques-updated', handleTechniquesUpdate);
    window.addEventListener('character-stats-updated', handleStatsUpdate);
    window.addEventListener('user-pets-updated', handlePetsUpdate);
    window.addEventListener('market-items-updated', handleMarketUpdate);
    window.addEventListener('resources-updated', handleResourcesUpdate);
    window.addEventListener('sect-updated', handleSectUpdate);
    window.addEventListener('effects-updated', handleEffectsUpdate);
    
    // Отписка от событий при размонтировании
    return () => {
      window.removeEventListener('auth-updated', handleAuthUpdate);
      window.removeEventListener('alchemy-recipes-updated', handleAlchemyUpdate);
      window.removeEventListener('inventory-updated', handleInventoryUpdate);
      window.removeEventListener('cultivation-updated', handleCultivationUpdate);
      window.removeEventListener('learned-techniques-updated', handleTechniquesUpdate);
      window.removeEventListener('character-stats-updated', handleStatsUpdate);
      window.removeEventListener('user-pets-updated', handlePetsUpdate);
      window.removeEventListener('market-items-updated', handleMarketUpdate);
      window.removeEventListener('resources-updated', handleResourcesUpdate);
      window.removeEventListener('sect-updated', handleSectUpdate);
      window.removeEventListener('effects-updated', handleEffectsUpdate);
    };
  }, []);
  
  // Значение контекста для передачи компонентам
  const contextValue = {
    auth,
    alchemy,
    inventory,
    cultivation,
    techniques,
    stats,
    pets,
    market,
    resources,
    sect,
    effects
  };
  
  return (
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  );
}

// Хук для использования глобального состояния
export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState должен использоваться внутри GlobalStateProvider');
  }
  return context;
}

// Специализированные хуки для каждого домена
export function useAuth() {
  const { auth } = useGlobalState();
  return auth;
}

export function useAlchemy() {
  const { alchemy } = useGlobalState();
  return alchemy;
}

export function useInventory() {
  const { inventory } = useGlobalState();
  return inventory;
}

export function useCultivation() {
  const { cultivation } = useGlobalState();
  return cultivation;
}

export function useTechniques() {
  const { techniques } = useGlobalState();
  return techniques;
}

export function useStats() {
  const { stats } = useGlobalState();
  return stats;
}

export function usePets() {
  const { pets } = useGlobalState();
  return pets;
}

export function useMarket() {
  const { market } = useGlobalState();
  return market;
}

export function useResources() {
  const { resources } = useGlobalState();
  return resources;
}

export function useSect() {
  const { sect } = useGlobalState();
  return sect;
}

export function useEffects() {
  const { effects } = useGlobalState();
  return effects;
}