/**
 * Юнит — герой или монстр. Отличаются они только созданием и управлением, поэтому модель
 * одна, а роль задаёт список, в котором юнит пришёл: `MyHero`, `EnemyHeroes` или `Monsters`.
 */
export interface Unit
{
    Id: number;
    Location: UnitLocation;
    Vitals: UnitVitals;
    Attack: UnitAttack;
    Attributes: UnitAttributes;
    Offence: UnitOffence;
    Defence: UnitDefence;
    Progress: UnitProgress;
    Equipment: UnitEquipment;
    IsGhost: boolean;
}

/** Где юнит и куда он смотрит. */
export interface UnitLocation
{
    X: number;
    Y: number;
    DirX: number;
    DirY: number;
}

/** Текущее состояние жизни и энергетического щита. */
export interface UnitVitals
{
    LifeCurrent: number;
    LifeMax: number;
    EsCurrent: number;
    EsMax: number;
    LifePerSecond: number;
    LifePerKill: number;
}

/** Цикл удара: дистанция и готовность. */
export interface UnitAttack
{
    Range: number;
    Ready: boolean;
}

/** Характеристики, размер тела и скорость движения. */
export interface UnitAttributes
{
    Str: number;
    Dex: number;
    Int: number;
    Size: number;
    MovementSpeed: number;
}

/** Нападение: урон по стихиям, скорость, точность, криты и оглушение. */
export interface UnitOffence
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
}

/** Защита: броня, уклонение, блок, отражение и сопротивления. */
export interface UnitDefence
{
    Armour: number;
    PhysReduction: number;
    Evasion: number;
    Block: number;
    PhysReflect: number;
    StunReduction: number;
    FireResist: number;
    ColdResist: number;
    LightResist: number;
}

/** Уровень и опыт. У монстра уровня опыта нет — на клиенте это просто число. */
export interface UnitProgress
{
    Level: number;
    Experience: number;
    ExperienceNext: number;
}

/** Надетые предметы. Детали (моды, уровень предмета) приходят отдельным запросом осмотра. */
export interface UnitEquipment
{
    Items: UnitItem[];
}

/** Предмет без деталей: только то, что нужно для значка и подписи. */
export interface UnitItem
{
    Slot: string;
    Name: string;
    Rarity: string;
}

