import { HeroStats } from "./HeroStats";

/** View-модель героя для UI. */
export interface HeroState
{
    Id: number;
    X: number;
    Y: number;
    DirX: number;
    DirY: number;
    LifeCurrent: number;
    LifeMax: number;
    EsCurrent: number;
    Level: number;
    Experience: number;
    ExperienceNext: number;
    Size: number;
    Str: number;
    Dex: number;
    Int: number;
    AttackRange: number;
    AttackReady: boolean;
    EsMax: number;
    WeaponName: string | null;
    WeaponRarity: string | null;
    Stats: HeroStats;
    IsGhost: boolean;
}
