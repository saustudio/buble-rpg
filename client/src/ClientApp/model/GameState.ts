import { GameState as NetworkGameState } from "./network/GameState";
import { EBonusEffectType, EBonusModifier } from "./Bonus";

export { EGameState } from "./network/GameState";
export { EMonsterRarity } from "./network/MonsterState";
export { EAttackType } from "./network/AttackType";
export type { HeroState } from "./network/HeroState";
export type { MonsterState } from "./network/MonsterState";
export type { WaveState } from "./network/WaveState";

export interface BonusEffect
{
    readonly Type: EBonusEffectType;
    readonly Mod: EBonusModifier;
    readonly Value: number;
}

export interface BonusOffer
{
    readonly Id: string;
    readonly Effects: readonly BonusEffect[];
}

/** Состояние игры: поля хаба как есть плюс клиентские надстройки. */
export type GameState = NetworkGameState & {
    readonly ExperienceBonusOffer: readonly BonusOffer[];
    readonly WaveBonusOffer: readonly BonusOffer[];
    readonly CreatedAt: number;
};
