using BubleRpg.Server.Game.Model;

namespace BubleRpg.Network.Model;

public sealed record GameStateResponse(
    double Width,
    double Height,
    EGameState Phase,
    HeroState? Hero,
    IReadOnlyList<HeroState> EnemyHeroes,
    IReadOnlyList<MonsterState> Monsters,
    WaveState? Wave,
    int? EnemyTarget);
