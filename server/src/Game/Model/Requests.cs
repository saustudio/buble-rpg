namespace BubleRpg.Server.Game.Model;

public enum EBonusSource
{
    Level,
    Wave
}

public sealed class BonusChoice
{
    public string BonusId { get; set; } = string.Empty;
    public EBonusSource Source { get; set; }
}

public sealed class LootPick
{
    public string ItemId { get; set; } = string.Empty;
}

public sealed class HeroSpawnRequest
{
    /// <summary>Внешний идентификатор, для которого нужен герой.</summary>
    public string Id { get; set; } = string.Empty;
}
