/**
 * Сейчас — самостоятельный localStorage-репозиторий сессии.
 *
 * В перспективе: LocalStorageContext.Session — LocalStorageSet<string>.
 * При появлении Settings и других persistent-моделей они станут
 * отдельными Set в том же контексте. Доступ — через типизированные Set,
 * не через localStorage или строковые ключи напрямую.
 */
export class GameSessionRepository
{
    private static readonly storageKey = "buble-rpg.guest-token";

    public Create(token: string): void
    {
        localStorage.setItem(GameSessionRepository.storageKey, token);
    }

    public Query(): string | null
    {
        return localStorage.getItem(GameSessionRepository.storageKey);
    }
}
