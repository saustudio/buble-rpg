/** Удар: точка попадания не передаётся, клиент берёт позицию цели из снапшота. */
export interface AttackHit {
    Phys: number;
    Fire: number;
    Cold: number;
    Light: number;
    IsCrit: boolean;
    Source: number;
    Target: number;
}

/** Уклонение: удар не прошёл. */
export interface DefenceEvasion {
    Source: number;
    Target: number;
}

/** Блок: удар не прошёл. */
export interface DefenceBlock {
    Source: number;
    Target: number;
}
