namespace BubleRpg.Network.Model;

/// <summary>Базовый тип для данных, идущих из сети в игру.</summary>
public abstract class NetworkData
{
}

/// <summary>Команда от участника. <see cref="Id"/> — его внешний идентификатор.</summary>
public abstract class HeroActionData : NetworkData
{
    public string Id { get; init; } = string.Empty;
}

public sealed class MoveData : HeroActionData
{
    public double X { get; init; }
    public double Y { get; init; }
}

public sealed class LevelBonusChoiceData : HeroActionData
{
    public string BonusId { get; init; } = string.Empty;
}

public sealed class WaveBonusChoiceData : HeroActionData
{
    public string BonusId { get; init; } = string.Empty;
}

public sealed class LootPickData : HeroActionData
{
    public string ItemId { get; init; } = string.Empty;
}

public sealed class HeroSpawnData : NetworkData
{
    public string Id { get; init; } = string.Empty;

    /// <summary>Необязательная игра, в которую хочет попасть участник (будущий явный выбор комнаты).</summary>
    public int? GameId { get; init; }
}

/// <summary>Участник отключился; обрабатывается на игровом тике вместе с остальным вводом.</summary>
public sealed class HeroDisconnectData : NetworkData
{
    public string Id { get; init; } = string.Empty;
}
