/** View-модель характеристик героя для UI. */
export interface HeroStats
{
    PhysicalDamageMin: number;
    PhysicalDamageMax: number;
    FireDamageMin: number;
    FireDamageMax: number;
    ColdDamageMin: number;
    ColdDamageMax: number;
    LightDamageMin: number;
    LightDamageMax: number;
    AttackSpeed: number;
    Accuracy: number;
    CriticalChance: number;
    CriticalMultiplier: number;
    Stun: number;
    StunReduction: number;
    LifePerSecond: number;
    LifePerKill: number;
    Armour: number;
    PhysReduction: number;
    Evasion: number;
    Block: number;
    PhysReflect: number;
    FireResist: number;
    ColdResist: number;
    LightResist: number;
    MovementSpeed: number;
}
