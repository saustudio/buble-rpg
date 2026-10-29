import { GameState } from "../model/GameState";

/**
 * Сейчас — самостоятельный in-memory репозиторий состояния.
 *
 * В перспективе: InMemoryContext.GameState — InMemorySet<GameState>.
 * Контекст будет объединять volatile-наборы по провайдеру и жизненному
 * циклу. Вызывающий код продолжит работать через типизированный набор,
 * а не через Map/ключи напрямую.
 */
export class GameStateRepository
{
    private static readonly MaxSize = 500;

    private readonly data: GameState[] = [];

    public Create(state: GameState): void
    {
        this.data.push(state);
        if (this.data.length > GameStateRepository.MaxSize) this.data.splice(0, this.data.length - GameStateRepository.MaxSize);
    }

    public Last(): GameState | null
    {
        return this.data.length === 0
            ? null
            : this.data[this.data.length - 1];
    }

    public List(): readonly GameState[]
    {
        return this.data;
    }
}
