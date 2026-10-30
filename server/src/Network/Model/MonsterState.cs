using BubleRpg.Server.Game.Model;

namespace BubleRpg.Network.Model;

public sealed record MonsterState(
    int Id,
    double X,
    double Y,
    double DirX,
    double DirY,
    double LifeCurrent,
    double LifeMax,
    double EsCurrent,
    double EsMax,
    double Size,
    int Level,
    EMonsterRarity Rarity,
    int ItemCount,
    double AttackRange,
    bool AttackReady);
