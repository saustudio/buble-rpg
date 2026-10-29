using BubleRpg.Server.Game.Model;

namespace BubleRpg.Network.Model;

public sealed record HeroState(
    int Id,
    double X,
    double Y,
    double DirX,
    double DirY,
    double LifeCurrent,
    double LifeMax,
    double EsCurrent,
    double Level,
    double Experience,
    double ExperienceNext,
    double Size,
    double Str,
    double Dex,
    double Int,
    double AttackRange,
    bool AttackReady,
    EAttackType AttackType,
    double EsMax,
    string? WeaponName,
    string? WeaponRarity,
    HeroStats Stats);
