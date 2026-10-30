export enum EMonsterRarity
{
    COMMON = "COMMON",
    RARE = "RARE",
    ELITE = "ELITE",
}

/** View-модель монстра для UI. */
export interface MonsterState
{
    Id: number;
    X: number;
    Y: number;
    DirX: number;
    DirY: number;
    LifeCurrent: number;
    LifeMax: number;
    EsCurrent: number;
    EsMax: number;
    Size: number;
    Level: number;
    Rarity: EMonsterRarity;
    ItemCount: number;
    AttackRange: number;
    AttackReady: boolean;
}
