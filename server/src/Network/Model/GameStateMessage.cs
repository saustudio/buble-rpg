using BubleRpg.Server.Game.Model;

namespace BubleRpg.Network.Model;

/// <summary>
/// Сетевое сообщение верхнего уровня: снимок состояния игры, уходящий клиенту.
/// Персонализация — <see cref="MyHero"/> (герой получателя) и <see cref="EnemyHeroes"/> (живые чужие).
/// Отправляется раз в тик, поэтому события боя — это события ровно одного тика, без накопления.
/// </summary>
public sealed record GameStateMessage(
    double Width,
    double Height,
    EGameState Phase,
    Unit? MyHero,
    IReadOnlyList<Unit> EnemyHeroes,
    IReadOnlyList<Unit> Monsters,
    WaveState? Wave,
    int? EnemyTarget,
    IReadOnlyList<AttackHit> Hits,
    IReadOnlyList<DefenceEvasion> Evasions,
    IReadOnlyList<DefenceBlock> Blocks);
