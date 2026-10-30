import { AttackHit, DefenceBlock, DefenceEvasion } from "../Combat";
import { EGameState } from "../GameState";
import { HeroState } from "../HeroState";
import { MonsterState } from "../MonsterState";
import { WaveState } from "../WaveState";

/**
 * Сетевое сообщение верхнего уровня — снимок состояния игры от сервера.
 * Слой задаётся папкой: `network` знает view-модели, view про сеть не знает.
 * От view-модели `GameState` отличается только клиентскими полями
 * (`ExperienceBonusOffer`, `WaveBonusOffer`, `CreatedAt`) — их добавляет `GameHubService`.
 */
export interface GameStateMessage
{
    Width: number;
    Height: number;
    Phase: EGameState;
    /** Герой этого соединения; null, пока игровая логика его не создала. */
    MyHero: HeroState | null;
    /** Герои других участников. */
    EnemyHeroes: HeroState[];
    Monsters: MonsterState[];
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
