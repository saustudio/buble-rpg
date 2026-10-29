using System.Text.Json.Serialization;

namespace BubleRpg.Server.Game.Model;

public sealed class MetaStat
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("min")]
    public double Min { get; set; }

    [JsonPropertyName("max")]
    public double Max { get; set; }
}

public sealed class MetaWeight
{
    [JsonPropertyName("tag")]
    public string Tag { get; set; } = string.Empty;

    [JsonPropertyName("weight")]
    public double Weight { get; set; }
}

public sealed class MetaMod
{
    [JsonPropertyName("adds_tags")]
    public List<string>? AddsTags { get; set; }

    [JsonPropertyName("domain")]
    public string Domain { get; set; } = string.Empty;

    [JsonPropertyName("generation_type")]
    public string GenerationType { get; set; } = string.Empty;

    [JsonPropertyName("generation_weights")]
    public List<MetaWeight>? GenerationWeights { get; set; }

    [JsonPropertyName("groups")]
    public List<string>? Groups { get; set; }

    [JsonPropertyName("implicit_tags")]
    public List<string>? ImplicitTags { get; set; }

    [JsonPropertyName("is_essence_only")]
    public bool IsEssenceOnly { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("required_level")]
    public int RequiredLevel { get; set; }

    [JsonPropertyName("spawn_weights")]
    public List<MetaWeight>? SpawnWeights { get; set; }

    [JsonPropertyName("stats")]
    public List<MetaStat>? Stats { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;
}

public sealed class MetaRange
{
    [JsonPropertyName("min")]
    public double Min { get; set; }

    [JsonPropertyName("max")]
    public double Max { get; set; }
}

public sealed class MetaProperties
{
    [JsonPropertyName("evasion")]
    public MetaRange? Evasion { get; set; }

    [JsonPropertyName("energy_shield")]
    public MetaRange? EnergyShield { get; set; }

    [JsonPropertyName("armour")]
    public MetaRange? Armour { get; set; }

    [JsonPropertyName("block")]
    public double? Block { get; set; }

    [JsonPropertyName("attack_time")]
    public double? AttackTime { get; set; }

    [JsonPropertyName("critical_strike_chance")]
    public double? CriticalStrikeChance { get; set; }

    [JsonPropertyName("movement_speed")]
    public double? MovementSpeed { get; set; }

    [JsonPropertyName("physical_damage_min")]
    public double? PhysicalDamageMin { get; set; }

    [JsonPropertyName("physical_damage_max")]
    public double? PhysicalDamageMax { get; set; }

    [JsonPropertyName("range")]
    public double? Range { get; set; }
}

public sealed class MetaRequirements
{
    [JsonPropertyName("strength")]
    public double? Strength { get; set; }

    [JsonPropertyName("dexterity")]
    public double? Dexterity { get; set; }

    [JsonPropertyName("intelligence")]
    public double? Intelligence { get; set; }
}

public sealed class MetaVisualIdentity
{
    [JsonPropertyName("dds_file")]
    public string DdsFile { get; set; } = string.Empty;
}

public sealed class MetaItem
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("domain")]
    public string Domain { get; set; } = string.Empty;

    [JsonPropertyName("drop_level")]
    public int DropLevel { get; set; }

    [JsonPropertyName("implicits")]
    public List<string>? Implicits { get; set; }

    [JsonPropertyName("item_class")]
    public string ItemClass { get; set; } = string.Empty;

    [JsonPropertyName("requirements")]
    public MetaRequirements? Requirements { get; set; }

    [JsonPropertyName("properties")]
    public MetaProperties Properties { get; set; } = new();

    [JsonPropertyName("visual_identity")]
    public MetaVisualIdentity VisualIdentity { get; set; } = new();

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();
}

