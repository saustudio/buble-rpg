using System.Text.Json.Serialization;

namespace BubleRpg.Server.Game.Model;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EBonusModifier
{
    flat,
    percent,
    percentPoint
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EBonusEffectType
{
    Str,
    Dex,
    Int,

    StunInc,
    StunReduction,

    LifeMax,
    LifePerSecond,
    LifePerKill,

    PhysReflect,
    PhysReduction,
    Armour,
    Evasion,
    ES,
    ESRegenDelay,
    ESRegenRate,
    Block,

    FireResist,
    ColdResist,
    LightResist,

    PhysDamage,
    FireDamage,
    ColdDamage,
    LightDamage,

    AttackSpeed,
    AttackRange,
    MovementSpeed,
    Accuracy,
    CriticalChance,
    CriticalMultiplier,

    MonsterCount,
    MonsterLevel,
    MonsterHealth,
    MonsterDamage,
    MonsterSpeed,
    MonsterResist,
    SpawnSpeed,
    EliteChance,
    ItemQuantity,
    ItemRarity
}

public interface IBonusEffect
{
    EBonusEffectType Type { get; set; }
    EBonusModifier Mod { get; set; }
    double Value { get; set; }
}

public interface IBonus
{
    string Id { get; set; }
    double Weight { get; set; }
    List<IBonusEffect> Effects { get; set; }
}

public sealed class BonusEffect : IBonusEffect
{
    public EBonusEffectType Type { get; set; }
    public EBonusModifier Mod { get; set; }
    public double Value { get; set; }
}

public sealed class BonusData : IBonus
{
    public string Id { get; set; } = string.Empty;
    public double Weight { get; set; } = 1;
    public List<IBonusEffect> Effects { get; set; } = new();
}

public sealed class BonusNodeEffect
{
    [JsonPropertyName("type")]
    public EBonusEffectType Type { get; set; }

    [JsonPropertyName("mod")]
    public EBonusModifier Mod { get; set; }

    [JsonPropertyName("min")]
    public double Min { get; set; }

    [JsonPropertyName("max")]
    public double Max { get; set; }

    [JsonPropertyName("decimals")]
    public int? Decimals { get; set; }
}

public sealed class BonusNode
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("weight")]
    public double? Weight { get; set; }

    [JsonPropertyName("effects")]
    public List<BonusNodeEffect> Effects { get; set; } = new();
}
