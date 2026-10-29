import { HeroState } from "./HeroState";
import { MonsterState } from "./MonsterState";
import { WaveState } from "./WaveState";

export enum EGameState
{
    INIT = "INIT",
    PLAY = "PLAY",
    OVER = "OVER",
    PAUSE = "PAUSE",
}

export interface GameState {
    Width: number;
    Height: number;
    Phase: EGameState;
    /** Герой этого соединения; null, пока игровая логика его не создала. */
    Hero: HeroState | null;
    /** Герои других участников. */
    EnemyHeroes: HeroState[];
    Monsters: MonsterState[];
    Wave: WaveState | null;
    /** Кого атакует мой герой: id монстра или другого героя. */
    EnemyTarget: number | null;
}
