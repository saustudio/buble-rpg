/**
 * Справочники презентации предметов: эмодзи-иконки статов, подписи аффиксов, имена редкости и
 * пары min/max. Ключи — «сырые» строки статов, ровно те, что приходят по проводу (`Final`,
 * `Implicits`, `Explicits`). Это единственный источник имён редкости на клиенте.
 * <para/>
 * Список ключей сверен с серверными константами `AffixType` и `AffixLocalType`. Локальные
 * (`local_*`) аффиксы в `Final` не попадают — сервер сворачивает их в базовые статы (см.
 * `ItemFactory.ApplyFinals`), поэтому в парах min/max их отдельно не обрабатываем.
 */

/** Эмодзи-иконки статов, общие для нескольких аффиксов. */
const ICONS = {
    SPEED: "💨",
    RANGE: "⭕",
    ACCURACY: "🎯",
    CRIT: "💥",
    PHYS: "👊",
    FIRE: "🔥",
    COLD: "❄️",
    LIGHT: "⚡",
    EVASION: "🌪️",
    ES: "🔮",
    ARMOUR: "🛡️",
    MOVEMENT: "🏃",
    LIFE_REGEN: "💚",
    LIFE: "❤️",
    LIFE_PER_KILL: "💜",
    REFLECT: "🦔",
    CRIT_MULT: "✖️",
    STR: "💪",
    INT: "🧠",
    DEX: "🤸",
    STAT: "📊",
} as const;

export const ItemResources = {
    /** Имена редкости по проводным значениям. */
    RarityNames: {
        "common": "Обычный",
        "magic": "Необычный",
        "rare": "Редкий",
    } as Record<string, string>,

    /** CSS-классы редкости (совпадают с классами в index.html). */
    RarityClasses: {
        "common": "common",
        "magic": "magic",
        "rare": "rare",
    } as Record<string, string>,

    /** Пары min/max, реально достижимые в `Final` (без `local_*`). */
    PairedStats: [
        ["physical_damage_min", "physical_damage_max"],
        ["attack_minimum_added_physical_damage", "attack_maximum_added_physical_damage"],
        ["attack_minimum_added_fire_damage", "attack_maximum_added_fire_damage"],
        ["attack_minimum_added_cold_damage", "attack_maximum_added_cold_damage"],
        ["attack_minimum_added_lightning_damage", "attack_maximum_added_lightning_damage"],
        ["spell_minimum_added_physical_damage", "spell_maximum_added_physical_damage"],
        ["spell_minimum_added_fire_damage", "spell_maximum_added_fire_damage"],
        ["spell_minimum_added_cold_damage", "spell_maximum_added_cold_damage"],
        ["spell_minimum_added_lightning_damage", "spell_maximum_added_lightning_damage"],
    ] as [string, string][],

    /** Эмодзи-иконки статов по сырым ключам. */
    AffixIcons: {
        "additional_strength": ICONS.STR,
        "additional_intelligence": ICONS.INT,
        "additional_dexterity": ICONS.DEX,
        "additional_all_attributes": ICONS.STAT,
        "all_attributes_+%": ICONS.STAT,

        "base_maximum_life": ICONS.LIFE,
        "maximum_life_+%": ICONS.LIFE,
        "base_life_gained_on_enemy_death": ICONS.LIFE_PER_KILL,
        "base_life_regeneration_rate_per_minute": ICONS.LIFE_REGEN,
        "life_regeneration_rate_per_minute_%": ICONS.LIFE_REGEN,

        "base_fire_damage_resistance_%": ICONS.FIRE,
        "base_cold_damage_resistance_%": ICONS.COLD,
        "base_lightning_damage_resistance_%": ICONS.LIGHT,

        "physical_damage_+%": ICONS.PHYS,
        "physical_damage_min": ICONS.PHYS,
        "attack_minimum_added_physical_damage": ICONS.PHYS,

        "attack_minimum_added_cold_damage": ICONS.COLD,
        "cold_damage_+%": ICONS.COLD,

        "attack_minimum_added_fire_damage": ICONS.FIRE,
        "spell_minimum_added_fire_damage": ICONS.FIRE,

        "lightning_damage_+%": ICONS.LIGHT,
        "attack_minimum_added_lightning_damage": ICONS.LIGHT,

        "attack_time": ICONS.SPEED,
        "attack_speed_+%": ICONS.SPEED,
        "base_cast_speed_+%": ICONS.SPEED,
        "range": ICONS.RANGE,
        "physical_damage_to_return_to_melee_attacker": ICONS.REFLECT,
        "accuracy_rating": ICONS.ACCURACY,
        "critical_strike_chance": ICONS.CRIT,
        "base_critical_strike_multiplier_+": ICONS.CRIT,

        "evasion": ICONS.EVASION,
        "base_evasion_rating": ICONS.EVASION,
        "evasion_rating_+%": ICONS.EVASION,

        "energy_shield": ICONS.ES,
        "base_maximum_energy_shield": ICONS.ES,

        "movement_speed": ICONS.MOVEMENT,
        "base_movement_velocity_+%": ICONS.MOVEMENT,

        "armour": ICONS.ARMOUR,
        "base_physical_damage_reduction_rating": ICONS.ARMOUR,
        "base_stun_threshold_reduction_+%": ICONS.ARMOUR,
        "base_additional_physical_damage_reduction_%": ICONS.ARMOUR,
        "physical_damage_reduction_rating_+%": ICONS.ARMOUR,
    } as Record<string, string>,

    /** Подписи аффиксов по сырым ключам. */
    AffixLabels: {
        // Атрибуты.
        "additional_strength": "Сила",
        "additional_dexterity": "Ловкость",
        "additional_intelligence": "Интеллект",
        "additional_strength_and_dexterity": "Сила и ловкость",
        "additional_strength_and_intelligence": "Сила и интеллект",
        "additional_dexterity_and_intelligence": "Ловкость и интеллект",
        "additional_all_attributes": "Все атрибуты",
        "all_attributes_+%": "Повышение атрибутов",

        // Общие атаки и урон.
        "accuracy_rating": "Меткость",
        "accuracy_rating_+%": "Повышение меткости",
        "local_accuracy_rating": "Меткость",
        "range": "Радиус атаки",
        "base_skill_area_of_effect_+%": "Повышение радиуса атаки",
        "stun_threshold_+%": "Шанс оглушения",
        "base_stun_threshold_reduction_+%": "Порог оглушения",

        "critical_strike_chance": "Крит. шанс",
        "base_critical_strike_multiplier_+": "Крит. шанс",
        "critical_strike_chance_+%": "Повышение крит. шанса",
        "base_critical_strike_multiplier": "Множитель крит.урона",

        "elemental_damage_+%": "Повышение элементального урона",
        "damage_+%": "Повышение урона",

        "physical_damage_min": "Урон физой",
        "physical_damage_max": "Урон физой",
        "physical_damage_+%": "Повышение урона физой",
        "fire_damage_+%": "Повышение урона огнем",
        "cold_damage_+%": "Повышение урона холодом",
        "lightning_damage_+%": "Повышение урона молнией",
        "physical_damage_to_return_to_melee_attacker": "Отражение физического урона от атак",
        "attack_and_cast_speed_+%": "Повышение скорости атаки и каста",

        // Урон атаками.
        "attack_time": "Скорость атаки",
        "attack_speed_+%": "Повышение скорости атаки",
        "attack_minimum_added_physical_damage": "Урон физой",
        "attack_maximum_added_physical_damage": "Урон физой",
        "attack_minimum_added_fire_damage": "Урон огнем",
        "attack_maximum_added_fire_damage": "Урон огнем",
        "attack_minimum_added_cold_damage": "Урон холодом",
        "attack_maximum_added_cold_damage": "Урон холодом",
        "attack_minimum_added_lightning_damage": "Урон молнией",
        "attack_maximum_added_lightning_damage": "Урон молнией",

        // Урон магией.
        "spell_damage_+%": "Повышение урона",
        "base_cast_speed_+%": "Скорость каста",
        "spell_minimum_added_physical_damage": "Урон физической магии",
        "spell_maximum_added_physical_damage": "Урон физической магии",
        "spell_minimum_added_cold_damage": "Урон магии холода",
        "spell_maximum_added_cold_damage": "Урон магии холода",
        "spell_minimum_added_fire_damage": "Урон магии огня",
        "spell_maximum_added_fire_damage": "Урон магии огня",
        "spell_minimum_added_lightning_damage": "Урон магии грома",
        "spell_maximum_added_lightning_damage": "Урон магии грома",

        // Защита.
        "block": "Шанс блока",
        "base_additional_physical_damage_reduction_%": "Снижение получаемого физического урона",
        "physical_damage_reduction_rating_+%": "Снижение получаемого физического урона %",
        "global_defences_+%": "Повышение защиты",
        "armour": "Броня",
        "base_physical_damage_reduction_rating": "Броня",
        "evasion": "Уклонение",
        "base_evasion_rating": "Уклонение",
        "evasion_rating_+%": "Повышение уклонения",

        "energy_shield": "Энергощит",
        "base_maximum_energy_shield": "Энергощит",

        "base_fire_damage_resistance_%": "Сопротивление огню",
        "base_cold_damage_resistance_%": "Сопротивление холоду",
        "base_lightning_damage_resistance_%": "Сопротивление молнии",

        "movement_speed": "Передвижение",
        "base_movement_velocity_+%": "Повышение скорости передвижения",

        "base_maximum_life": "Здоровье",
        "maximum_life_+%": "Повышение здоровья",
        "base_life_regeneration_rate_per_minute": "Регенерация здоровья в минуту",
        "life_regeneration_rate_per_minute_%": "Регенерация здоровья в минуту от макс.здоровья",
        "base_life_gained_on_enemy_death": "Здоровье за убийство",

        // Локальные аффиксы (в `Final` не попадают, но подписи держим для полноты).
        "local_critical_strike_chance_+%": "Повышение крит. шанса",
        "local_physical_damage_+%": "Повышение урона физой",
        "local_minimum_added_physical_damage": "Урон физой",
        "local_maximum_added_physical_damage": "Урон физой",
        "local_minimum_added_fire_damage": "Урон огнем",
        "local_maximum_added_fire_damage": "Урон огнем",
        "local_minimum_added_cold_damage": "Урон холодом",
        "local_maximum_added_cold_damage": "Урон холодом",
        "local_minimum_added_lightning_damage": "Урон молнией",
        "local_maximum_added_lightning_damage": "Урон молнией",
        "local_lightning_penetration_%": "Пробивание сопротивлению молнии",
        "local_attack_speed_+%": "Повышение скорости атаки",
        "local_additional_block_chance_%": "Шанс блока",
        "local_base_physical_damage_reduction_rating": "Броня",
        "local_physical_damage_reduction_rating_+%": "Повышение брони",
        "local_armour_and_energy_shield_+%": "Повышенные броня и энергощит",
        "local_armour_and_evasion_+%": "Повышенные броня и уклонение",
        "local_energy_shield": "Энергощит",
        "local_energy_shield_+%": "Повышение энергощита",
        "local_base_evasion_rating": "Уклонение",
        "local_evasion_rating_+%": "Повышение уклонения",
        "local_evasion_and_energy_shield_+%": "Повышенные уклонение и энергощит",
    } as Record<string, string>,
};
