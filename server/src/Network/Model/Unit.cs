namespace BubleRpg.Network.Model;

/// <summary>
/// Юнит — герой или монстр. Отличаются они только созданием и управлением, а не составом
/// данных, поэтому клиент получает один тип, а роль определяется списком в
/// <see cref="GameStateMessage"/>: <c>MyHero</c>, <c>EnemyHeroes</c> или <c>Monsters</c>.
/// </summary>
public sealed record Unit(
    int Id,
    UnitLocation Location,
    UnitVitals Vitals,
    UnitAttack Attack,
    UnitAttributes Attributes,
    UnitOffence Offence,
    UnitDefence Defence,
    UnitProgress Progress,
    UnitEquipment Equipment,
    bool IsGhost);

/// <summary>Где юнит и куда он смотрит.</summary>
public sealed record UnitLocation(
    double X,
    double Y,
    double DirX,
    double DirY);

/// <summary>Текущее состояние жизни и энергетического щита.</summary>
public sealed record UnitVitals(
    double LifeCurrent,
    double LifeMax,
    double EsCurrent,
    double EsMax,
    double LifePerSecond,
    double LifePerKill);

/// <summary>Цикл удара: дистанция и готовность. Именно это клиент рисует у любой цели.</summary>
public sealed record UnitAttack(
    double Range,
    bool Ready);

/// <summary>Характеристики, размер тела и скорость движения.</summary>
public sealed record UnitAttributes(
    double Str,
    double Dex,
    double Int,
    double Size,
    double MovementSpeed);

/// <summary>Нападение: урон по стихиям, скорость, точность, криты и оглушение.</summary>
public sealed record UnitOffence(
    double PhysicalDamageMin,
    double PhysicalDamageMax,
    double FireDamageMin,
    double FireDamageMax,
    double ColdDamageMin,
    double ColdDamageMax,
    double LightDamageMin,
    double LightDamageMax,
    double AttackSpeed,
    double Accuracy,
    double CriticalChance,
    double CriticalMultiplier,
    double Stun);

/// <summary>Защита: броня, уклонение, блок, отражение и сопротивления.</summary>
public sealed record UnitDefence(
    double Armour,
    double PhysReduction,
    double Evasion,
    double Block,
    double PhysReflect,
    double StunReduction,
    double FireResist,
    double ColdResist,
    double LightResist);

/// <summary>
/// Уровень и опыт. У героя уровень растёт от опыта, у монстра задан волной — на клиенте
/// это просто число, поэтому смысл источника наружу не выходит.
/// </summary>
public sealed record UnitProgress(
    double Level,
    double Experience,
    double ExperienceNext);

/// <summary>
/// Надетые предметы. Деталей здесь нет: моды и уровень предмета приходят отдельным
/// запросом осмотра, их незачем слать каждый тик.
/// </summary>
public sealed record UnitEquipment(
    IReadOnlyList<UnitItem> Items);

/// <summary>Предмет без деталей: только то, что нужно для значка и подписи.</summary>
public sealed record UnitItem(
    string Slot,
    string Name,
    string Rarity);
