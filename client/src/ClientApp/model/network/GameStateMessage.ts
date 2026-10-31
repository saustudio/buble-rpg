import { AttackHit, DefenceBlock, DefenceEvasion } from "../Combat";
import { EGameState } from "../GameState";
import { Unit } from "../Unit";
import { WaveState } from "../WaveState";

/**
 * Сетевое сообщение верхнего уровня — снимок состояния игры от сервера.
 * Слой задаётся папкой: `network` знает view-модели, view про сеть не знает.
 * От view-модели `GameState` отличается только клиентскими полями
 * (`ExperienceBonusOffer`, `WaveBonusOffer`, `CreatedAt`) — их добавляет `GameHubService`.
 *
 * Юнит один на героя и монстра: роль определяется списком, а не типом.
 */
export interface GameStateMessage
{
    Width: number;
    Height: number;
    Phase: EGameState;
    /** Герой этого соединения; null, пока игровая логика его не создала. */
    MyHero: Unit | null;
    /** Герои других участников. */
    EnemyHeroes: Unit[];
    Monsters: Unit[];
    Wave: WaveState | null;
    /** Кого атакует мой герой: id монстра или другого героя. */
    EnemyTarget: number | null;
    /** Удары с прошлого снапшота. */
    Hits: AttackHit[];
    /** Уклонения с прошлого снапшота. */
    Evasions: DefenceEvasion[];
    /** Блоки с прошлого снапшота. */
    Blocks: DefenceBlock[];
}
