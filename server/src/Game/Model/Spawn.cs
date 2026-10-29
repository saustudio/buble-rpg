using System.Text.Json.Serialization;

namespace BubleRpg.Server.Game.Model;

public enum ESpawnEntityClass
{
    WARIOR,
    ASSASIN,
    MONC
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EMonsterRarity
{
    COMMON = 0,
    RARE = 1,
    ELITE = 2
}

/// <summary>Управляемая сущность. <see cref="Id"/> — внешний идентификатор, игра о его природе не знает.</summary>
public sealed class Hero
{
    public string Id { get; set; } = string.Empty;
}

/// <summary>
/// Временная неуязвимость при появлении в мире: дух не атакует, не получает урон и не преследуется
/// монстрами, но может перемещаться. <see cref="Remaining"/> — сколько секунд ещё действует.
/// </summary>
public sealed class Ghost
{
    public double Remaining { get; set; }
}

public sealed class Monster
{
    public Monster(double power, int level, EMonsterRarity rarity)
    {
        Power = power;
        Level = level;
        Rarity = rarity;
    }

    public ESpawnEntityClass Type { get; set; }
    public double Power { get; set; }
    public int Level { get; set; }
    public EMonsterRarity Rarity { get; set; }
}

public sealed class WaveEffect
{
    [JsonPropertyName("Type")]
    public EBonusEffectType Type { get; set; }

    [JsonPropertyName("ValueType")]
    public EBonusModifier ValueType { get; set; }

    [JsonPropertyName("Min")]
    public double Min { get; set; }

    [JsonPropertyName("Max")]
    public double Max { get; set; }
}

public sealed class WaveModifier
{
    [JsonPropertyName("Id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("Weight")]
    public double Weight { get; set; } = 1;

    [JsonPropertyName("Effects")]
    public List<WaveEffect> Effects { get; set; } = new();
}

public sealed class Wave
{
    public double SpawnMax { get; set; } = 6;
    public int SpawnLevel { get; set; } = 1;
    public double SpawnInterval { get; set; } = 2;
    public double EliteChance { get; set; }
    public double ItemQuantityMult { get; set; } = 1;
    public double ItemRarityBonus { get; set; }
    public int Lvl { get; set; } = 1;
    public double Spawned { get; set; }
    public double SpawnTimer { get; set; }
    public double PrepareTimer { get; set; } = 2;
    public List<WaveModifier> Modifiers { get; set; } = new();
    public List<WaveModifier> Offers { get; set; } = new();
}

