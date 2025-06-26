// Этот файл теперь просто реэкспортирует все из GameContextProvider
// для обратной совместимости с существующим кодом

import { GameContext, useGameContext, GameContextProvider } from './GameContextProvider';

export { GameContext, useGameContext, GameContextProvider };
// Добавляем алиас useGame для обратной совместимости
export const useGame = useGameContext;
export default GameContext;
