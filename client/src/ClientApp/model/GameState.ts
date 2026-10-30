import { BonusOffer } from "./Bonus";
import { AttackHit, DefenceBlock, DefenceEvasion } from "./Combat";
import { HeroState } from "./HeroState";
import { MonsterState } from "./MonsterState";
import { WaveState } from "./WaveState";

// View-модель собирает собственные типы (не сетевые), чтобы UI не зависел от network-слоя.
export * from "./Bonus";
export * from "./Combat";
export * from "./HeroState";
export * from "./HeroStats";
export * from "./MonsterState";
export * from "./WaveState";

export enum EGameState
{
    INIT = "INIT",
    PLAY = "PLAY",
    OVER = "OVER",
    PAUSE = "PAUSE",
}

/**
 * View-модель состояния игры для UI. Наполняется `GameHubService` из сетевого
 * `network/GameState` и дополняется клиентскими полями (`CreatedAt`, предложения бонусов).
 */
export interface GameState
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
    ExperienceBonusOffer: BonusOffer[];
    WaveBonusOffer: BonusOffer[];
    /** Момент получения снапшота — по нему рендер интерполирует состояния. */
    CreatedAt: number;
}
