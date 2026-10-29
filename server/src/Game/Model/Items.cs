
namespace BubleRpg.Server.Game.Model;

public enum EItemRarity
{
    NORMAL,
    MAGIC,
    RARE
}

public static class ItemTag
{
    public const string WEAPON = "weapon";
    public const string HELM = "helmet";
    public const string BODY_ARMOUR = "body_armour";
    public const string GLOVES = "gloves";
    public const string BOOTS = "boots";
    public const string AMULET = "amulet";
    public const string SHEILD = "shield";
    public const string BELT = "belt";
    public const string QUIVER = "quiver";
    public const string RING = "ring";
    public const string NOT_FOR_SALE = "not_for_sale";
}

public static class ItemDomain
{
    public const string ITEM = "item";
}

public static class ItemGenerationType
{
    public const string PREFIX = "prefix";
    public const string SUFFIX = "suffix";
}

public static class ItemSpawnWeight
{
    public const string DEFAULT = "default";
}

public static class AffixType
{
    public const string STR = "additional_strength";
    public const string DEX = "additional_dexterity";
    public const string INT = "additional_intelligence";
    public const string DEX_INT = "additional_dexterity_and_intelligence";
    public const string STR_DEX = "additional_strength_and_dexterity";
    public const string STR_INT = "additional_strength_and_intelligence";
    public const string ATTRIBUTES = "additional_all_attributes";
    public const string ATTRIBUTES_INC = "all_attributes_+%";

    public const string ATTACK_SPEED = "attack_time";
    public const string ATTACK_SPEED_INC = "attack_speed_+%";

    public const string ATTACK_RANGE = "range";
    public const string ATTACK_RANGE_INC = "base_skill_area_of_effect_+%";
    public const string ACCURACY = "accuracy_rating";
    public const string ACCURACY_INC = "accuracy_rating_+%";
    public const string CRITICAL_CHANCE = "critical_strike_chance";
    public const string CRITICAL_CHANCE_ADD = "base_critical_strike_multiplier_+";
    public const string CRITICAL_CHANCE_INC = "critical_strike_chance_+%";
    public const string CRITICAL_CHANCE_MLT = "base_critical_strike_multiplier";

    public const string DAMAGE_INC = "damage_+%";
    public const string ELEMENT_DAMAGE_INC = "elemental_damage_+%";

    public const string PHYS_DAMAGE_MIN = "physical_damage_min";
    public const string PHYS_DAMAGE_MAX = "physical_damage_max";
    public const string PHYS_DAMAGE_INC = "physical_damage_+%";
    public const string FIRE_DAMAGE_INC = "fire_damage_+%";
    public const string COLD_DAMAGE_INC = "cold_damage_+%";
    public const string LIGHT_DAMAGE_INC = "lightning_damage_+%";

    public const string ATTACK_PHYS_REFLECT = "physical_damage_to_return_to_melee_attacker";
    public const string ATTACK_PHYS_DAMAGE_MIN = "attack_minimum_added_physical_damage";
    public const string ATTACK_PHYS_DAMAGE_MAX = "attack_maximum_added_physical_damage";
    public const string ATTACK_FIRE_DAMAGE_MIN = "attack_minimum_added_fire_damage";
    public const string ATTACK_FIRE_DAMAGE_MAX = "attack_maximum_added_fire_damage";
    public const string ATTACK_COLD_DAMAGE_MIN = "attack_minimum_added_cold_damage";
    public const string ATTACK_COLD_DAMAGE_MAX = "attack_maximum_added_cold_damage";
    public const string ATTACK_LIGHT_DAMAGE_MIN = "attack_minimum_added_lightning_damage";
    public const string ATTACK_LIGHT_DAMAGE_MAX = "attack_maximum_added_lightning_damage";

    public const string ATTACK_CAST_SPEED_INC = "attack_and_cast_speed_+%";
    public const string CAST_SPEED_INC = "base_cast_speed_+%";
    public const string CAST_DAMAGE_INC = "spell_damage_+%";
    public const string CAST_PHYS_MIN = "spell_minimum_added_physical_damage";
    public const string CAST_PHYS_MAX = "spell_maximum_added_physical_damage";
    public const string CAST_FIRE_MIN = "spell_minimum_added_fire_damage";
    public const string CAST_FIRE_MAX = "spell_maximum_added_fire_damage";
    public const string CAST_COLD_MIN = "spell_minimum_added_cold_damage";
    public const string CAST_COLD_MAX = "spell_maximum_added_cold_damage";
    public const string CAST_LIGHT_MIN = "spell_minimum_added_lightning_damage";
    public const string CAST_LIGHT_MAX = "spell_maximum_added_lightning_damage";

    public const string DEFENCE_INC = "global_defences_+%";

    public const string EVASION = "evasion";
    public const string EVASION_ADD = "base_evasion_rating";
    public const string EVASION_INC = "evasion_rating_+%";

    public const string ES = "energy_shield";
    public const string ES_ADD = "base_maximum_energy_shield";
    public const string BLOCK = "block";
    public const string ARMOUR = "armour";
    public const string AMROUR_ADD = "base_physical_damage_reduction_rating";
    public const string PHYS_REDUCTION = "base_additional_physical_damage_reduction_%";
    public const string PHYS_REDUCTION_INC = "physical_damage_reduction_rating_+%";

    public const string MOVEMENT_SPEED = "movement_speed";
    public const string MOVEMENT_SPEED_INC = "base_movement_velocity_+%";
    public const string LIFE_PER_MINUTE_FLAT = "base_life_regeneration_rate_per_minute";
    public const string LIFE_PER_MINUTE_PERC = "life_regeneration_rate_per_minute_%";
    public const string LIFE_PER_KILL = "base_life_gained_on_enemy_death";
    public const string LIFE_MAX = "base_maximum_life";
    public const string LIFE_MAX_INC = "maximum_life_+%";
    public const string FIRE_RES = "base_fire_damage_resistance_%";
    public const string COLD_RES = "base_cold_damage_resistance_%";
    public const string LIGHT_RES = "base_lightning_damage_resistance_%";

    public const string STUN_INC = "stun_threshold_+%";
    public const string STUN_REDUCTION = "base_stun_threshold_reduction_+%";
}

public static class AffixLocalType
{
    public const string CRITICAL_STRICE_CHANCE_INC = "local_critical_strike_chance_+%";
    public const string ACCURACY = "local_accuracy_rating";
    public const string ATTACK_SPEED_INC = "local_attack_speed_+%";
    public const string BLOCK = "local_additional_block_chance_%";

    public const string ARMOUR = "local_base_physical_damage_reduction_rating";
    public const string ARMOUR_INC = "local_physical_damage_reduction_rating_+%";
    public const string ARMOUR_ES_INC = "local_armour_and_energy_shield_+%";
    public const string ARMOR_EVASION_INC = "local_armour_and_evasion_+%";

    public const string ES = "local_energy_shield";
    public const string ES_INC = "local_energy_shield_+%";

    public const string EVASION = "local_base_evasion_rating";
    public const string EVASION_INC = "local_evasion_rating_+%";
    public const string EVASION_ES_INC = "local_evasion_and_energy_shield_+%";

    public const string PHYS_DAMAGE_INC = "local_physical_damage_+%";
    public const string PHYS_DAMAGE_MIN = "local_minimum_added_physical_damage";
    public const string PHYS_DAMAGE_MAX = "local_maximum_added_physical_damage";

    public const string FIRE_DAMAGE_MIN = "local_minimum_added_fire_damage";
    public const string FIRE_DAMAGE_MAX = "local_maximum_added_fire_damage";

    public const string COLD_DAMAGE_MIN = "local_minimum_added_cold_damage";
    public const string COLD_DAMAGE_MAX = "local_maximum_added_cold_damage";

    public const string LIGHT_DAMAGE_MIN = "local_minimum_added_lightning_damage";
    public const string LIGHT_DAMAGE_MAX = "local_maximum_added_lightning_damage";
    public const string LIGHT_PENETRATION = "local_lightning_penetration_%";
}

public sealed class Item
{
    public Item(
        string name,
        int level,
        double str,
        double dex,
        double @int,
        EItemRarity rarity,
        string @class,
        string tag,
        string icon)
    {
        Name = name;
        Level = level;
        Str = str;
        Dex = dex;
        Int = @int;
        Rarity = rarity;
        Class = @class;
        Tag = tag;
        Icon = icon;
    }

    public Dictionary<string, double> Base { get; set; } = new();
    public Dictionary<string, double> Explicits { get; set; } = new();
    public Dictionary<string, double> Implicits { get; set; } = new();
    public Dictionary<string, double> Final { get; set; } = new();
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; }
    public int Level { get; set; }
    public double Str { get; set; }
    public double Dex { get; set; }
    public double Int { get; set; }
    public EItemRarity Rarity { get; set; }
    public string Class { get; set; }
    public string Tag { get; set; }
    public string Icon { get; set; }
}

