using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Application.Services;

namespace BubleRpg.Server.Game.Services;

public sealed class EntityAttributesService(
    GameDbContext store,
    EntityModsService modsService)
{

    public EntityAttributes Attributes(int entity)
    {
        var entityMods = CollectMods(entity);
        var baseAttributes = store.EntityGet<EntityAttributes>(entity);
        if (baseAttributes == null) return new EntityAttributes();
        return ApplyMod(entityMods, baseAttributes);
    }

    private EntityMods CollectMods(int entity)
    {
        var mods = new EntityMods();

        var bonuses = store.EntityGet<List<IBonus>>(entity);
        foreach (var bonus in bonuses ?? new List<IBonus>())
            modsService.Add(mods, BonusMod(bonus));

        var equipment = store.EntityGet<Equipment>(entity);
        if (equipment != null)
        {
            foreach (var item in EquipmentService.All(equipment))
                foreach (var (type, value) in item.Final)
                    modsService.Add(mods, AffixMod(type, value));
        }

        return mods;
    }

    private EntityAttributes ApplyMod(EntityMods mods, EntityAttributes attrs)
    {
        var str = (attrs.Str + mods.Str + mods.Attributes) * (1 + mods.AttributesInc / 100);
        var dex = (attrs.Dex + mods.Dex + mods.Attributes) * (1 + mods.AttributesInc / 100);
        var intValue = (attrs.Int + mods.Int + mods.Attributes) * (1 + mods.AttributesInc / 100);

        var lifeFromStr = str * 2;
        var lifeMax = (attrs.LifeMax + mods.LifeMaxFlat) * (1 + mods.LifeMaxInc / 100) + lifeFromStr;
        var lifePerSecond = attrs.LifePerSecond + mods.LifePerSecondFlat + mods.LifePerMinuteFlat / 60 + (mods.LifePerMinutePerc / 100 * lifeMax) / 60;
        var lifePerKill = attrs.LifePerKill + mods.LifePerKillFlat;

        var armInc = mods.ArmourInc + mods.DefenceInc;
        var armour = (attrs.Armour + mods.ArmourFlat + mods.ArmourAdd) * (1 + armInc / 100);

        var evInc = mods.EvasionInc + mods.DefenceInc;
        var evasion = (attrs.Evasion + mods.EvasionFlat + mods.EvasionAdd) * (1 + evInc / 100);

        var hasEnergyShield = attrs.ES + mods.EsFlat + mods.EsAdd > 0;
        var esFromIntPercent = hasEnergyShield ? intValue / 5 : 0;
        var esInc = mods.EsInc + mods.DefenceInc + esFromIntPercent;
        var es = (attrs.ES + mods.EsFlat + mods.EsAdd) * (1 + esInc / 100);

        var physReduction = attrs.PhysReduction + mods.PhysReduction + (1 + mods.PhysReductionInc / 100);
        var block = attrs.Block + mods.Block;

        var reflectInc = mods.PhysReflectInc;
        var physReflect = (attrs.PhysReflect + mods.PhysReflectFlat) * (1 + reflectInc / 100);

        var fireResist = attrs.FireResist + mods.FireResFlat;
        var coldResist = attrs.ColdResist + mods.ColdResFlat;
        var lightResist = attrs.LightResist + mods.LightResFlat;

        var physInc = mods.DamageInc + mods.CastDamageInc + mods.PhysInc;
        var physicalDamageMin = (attrs.PhysicalDamageMin + mods.PhysMinFlat) * (1 + physInc / 100);
        var physicalDamageMax = (attrs.PhysicalDamageMax + mods.PhysMaxFlat) * (1 + physInc / 100);

        var fireInc = mods.DamageInc + mods.CastDamageInc + mods.ElementDamageInc + mods.FireInc;
        var fireDamageMin = (attrs.FireDamageMin + mods.FireMinFlat) * (1 + fireInc / 100);
        var fireDamageMax = (attrs.FireDamageMax + mods.FireMaxFlat) * (1 + fireInc / 100);

        var coldInc = mods.DamageInc + mods.CastDamageInc + mods.ElementDamageInc + mods.ColdInc;
        var coldDamageMin = (attrs.ColdDamageMin + mods.ColdMinFlat) * (1 + coldInc / 100);
        var coldDamageMax = (attrs.ColdDamageMax + mods.ColdMaxFlat) * (1 + coldInc / 100);

        var lightInc = mods.DamageInc + mods.CastDamageInc + mods.ElementDamageInc + mods.LightInc;
        var lightDamageMin = (attrs.LightDamageMin + mods.LightMinFlat) * (1 + lightInc / 100);
        var lightDamageMax = (attrs.LightDamageMax + mods.LightMaxFlat) * (1 + lightInc / 100);

        var attackSpeedInc = mods.AttackSpeedInc + mods.CastDamageInc;
        var attackSpeedFlat = attrs.AttackSpeed + mods.AttackSpeedFlat + mods.CastSpeedFlat;
        var attackSpeed = attackSpeedFlat * (1 + attackSpeedInc / 100);
        var attackRange = (attrs.AttackRange + mods.AttackRangeFlat) * (1 + mods.AttackRangeInc / 100);

        var movementSpeed = (attrs.MovementSpeed + mods.MoveSpeedFlat) * (1 + mods.MoveSpeedInc / 100);

        var accFromDex = dex * 2;
        var accuracy = (attrs.Accuracy + mods.AccuracyFlat) * (1 + mods.AccuracyInc / 100) + accFromDex;

        var criticalChance = (attrs.CriticalChance + mods.CritChanceFlat + mods.CritChanceAddFlat) * (1 + mods.CritChanceInc / 100);
        var criticalMultiplier = attrs.CriticalMultiplier + mods.CritMultiplierFlat;

        return attrs with
        {
            Str = str,
            Dex = dex,
            Int = intValue,
            LifeMax = lifeMax,
            LifePerSecond = lifePerSecond,
            LifePerKill = lifePerKill,
            Armour = armour,
            Evasion = evasion,
            ES = es,
            PhysReduction = physReduction,
            Block = block,
            PhysReflect = physReflect,
            FireResist = fireResist,
            ColdResist = coldResist,
            LightResist = lightResist,
            PhysicalDamageMin = physicalDamageMin,
            PhysicalDamageMax = physicalDamageMax,
            FireDamageMin = fireDamageMin,
            FireDamageMax = fireDamageMax,
            ColdDamageMin = coldDamageMin,
            ColdDamageMax = coldDamageMax,
            LightDamageMin = lightDamageMin,
            LightDamageMax = lightDamageMax,
            AttackSpeed = attackSpeed,
            AttackRange = attackRange,
            MovementSpeed = movementSpeed,
            Accuracy = accuracy,
            CriticalChance = criticalChance,
            CriticalMultiplier = criticalMultiplier,
            Stun = attrs.Stun + mods.Stun,
            StunReduction = attrs.StunReduction + mods.StunReduction
        };
    }

    private EntityMods AffixMod(string type, double value)
    {
        var mod = new EntityMods();

        switch (type)
        {
            case AffixType.STR: mod.Str = value; break;
            case AffixType.DEX: mod.Dex = value; break;
            case AffixType.INT: mod.Int = value; break;
            case AffixType.STR_DEX: mod.Str = value; mod.Dex = value; break;
            case AffixType.STR_INT: mod.Str = value; mod.Int = value; break;
            case AffixType.DEX_INT: mod.Dex = value; mod.Int = value; break;
            case AffixType.ATTRIBUTES: mod.Attributes = value; break;
            case AffixType.ATTRIBUTES_INC: mod.AttributesInc = value; break;

            case AffixType.STUN_INC: mod.Stun = value; break;
            case AffixType.STUN_REDUCTION: mod.StunReduction = value; break;

            case AffixType.LIFE_MAX: mod.LifeMaxFlat = value; break;
            case AffixType.LIFE_MAX_INC: mod.LifeMaxInc = value; break;
            case AffixType.LIFE_PER_MINUTE_FLAT: mod.LifePerMinuteFlat = value; break;
            case AffixType.LIFE_PER_MINUTE_PERC: mod.LifePerMinutePerc = value; break;
            case AffixType.LIFE_PER_KILL: mod.LifePerKillFlat = value; break;

            case AffixType.PHYS_REDUCTION: mod.PhysReduction = value; break;
            case AffixType.PHYS_REDUCTION_INC: mod.PhysReductionInc = value; break;
            case AffixType.DEFENCE_INC: mod.DefenceInc = value; break;
            case AffixType.ARMOUR: mod.ArmourFlat = value; break;
            case AffixType.AMROUR_ADD: mod.ArmourAdd = value; break;
            case AffixType.EVASION: mod.EvasionFlat = value; break;
            case AffixType.EVASION_ADD: mod.EvasionAdd = value; break;
            case AffixType.EVASION_INC: mod.EvasionInc = value; break;
            case AffixType.ES: mod.EsFlat = value; break;
            case AffixType.ES_ADD: mod.EsAdd = value; break;
            case AffixType.BLOCK: mod.Block = value; break;

            case AffixType.FIRE_RES: mod.FireResFlat = value; break;
            case AffixType.COLD_RES: mod.ColdResFlat = value; break;
            case AffixType.LIGHT_RES: mod.LightResFlat = value; break;

            case AffixType.DAMAGE_INC: mod.DamageInc = value; break;
            case AffixType.ELEMENT_DAMAGE_INC: mod.ElementDamageInc = value; break;
            case AffixType.CAST_DAMAGE_INC: mod.CastDamageInc = value; break;

            case AffixType.ATTACK_PHYS_REFLECT: mod.PhysReflectFlat = value; break;
            case AffixType.PHYS_DAMAGE_MIN: mod.PhysMinFlat = value; break;
            case AffixType.PHYS_DAMAGE_MAX: mod.PhysMaxFlat = value; break;
            case AffixType.ATTACK_PHYS_DAMAGE_MIN: mod.PhysMinFlat = value; break;
            case AffixType.ATTACK_PHYS_DAMAGE_MAX: mod.PhysMaxFlat = value; break;
            case AffixType.PHYS_DAMAGE_INC: mod.PhysInc = value; break;

            case AffixType.CAST_PHYS_MIN: mod.PhysMinFlat = value; break;
            case AffixType.CAST_PHYS_MAX: mod.PhysMaxFlat = value; break;

            case AffixType.ATTACK_FIRE_DAMAGE_MIN: mod.FireMinFlat = value; break;
            case AffixType.ATTACK_FIRE_DAMAGE_MAX: mod.FireMaxFlat = value; break;
            case AffixType.CAST_FIRE_MIN: mod.FireMinFlat = value; break;
            case AffixType.CAST_FIRE_MAX: mod.FireMaxFlat = value; break;
            case AffixType.FIRE_DAMAGE_INC: mod.FireInc = value; break;

            case AffixType.ATTACK_COLD_DAMAGE_MIN: mod.ColdMinFlat = value; break;
            case AffixType.ATTACK_COLD_DAMAGE_MAX: mod.ColdMaxFlat = value; break;
            case AffixType.CAST_COLD_MIN: mod.ColdMinFlat = value; break;
            case AffixType.CAST_COLD_MAX: mod.ColdMaxFlat = value; break;
            case AffixType.COLD_DAMAGE_INC: mod.ColdInc = value; break;

            case AffixType.ATTACK_LIGHT_DAMAGE_MIN: mod.LightMinFlat = value; break;
            case AffixType.ATTACK_LIGHT_DAMAGE_MAX: mod.LightMaxFlat = value; break;
            case AffixType.CAST_LIGHT_MIN: mod.LightMinFlat = value; break;
            case AffixType.CAST_LIGHT_MAX: mod.LightMaxFlat = value; break;
            case AffixType.LIGHT_DAMAGE_INC: mod.LightInc = value; break;

            case AffixType.ATTACK_CAST_SPEED_INC: mod.AttackSpeedInc = value; mod.CastSpeedInc = value; break;
            case AffixType.ATTACK_SPEED: mod.AttackSpeedFlat = value; break;
            case AffixType.ATTACK_SPEED_INC: mod.AttackSpeedInc = value; break;
            case AffixType.ATTACK_RANGE: mod.AttackRangeFlat = value; break;
            case AffixType.ATTACK_RANGE_INC: mod.AttackRangeInc = value; break;
            case AffixType.CAST_SPEED_INC: mod.CastSpeedInc = value; break;
            case AffixType.CRITICAL_CHANCE: mod.CritChanceFlat = value; break;
            case AffixType.CRITICAL_CHANCE_ADD: mod.CritChanceAddFlat = value; break;
            case AffixType.CRITICAL_CHANCE_INC: mod.CritChanceInc = value; break;
            case AffixType.CRITICAL_CHANCE_MLT: mod.CritMultiplierFlat = value; break;
            case AffixType.ACCURACY: mod.AccuracyFlat = value; break;
            case AffixType.ACCURACY_INC: mod.AccuracyInc = value; break;
            case AffixType.MOVEMENT_SPEED: mod.MoveSpeedFlat = value; break;
            case AffixType.MOVEMENT_SPEED_INC: mod.MoveSpeedInc = value; break;
            default:
                break;
        }

        return mod;
    }

    private EntityMods BonusMod(IBonus bonus)
    {
        var raw = new EntityMods();

        foreach (var effect in bonus.Effects)
            modsService.Add(raw, EffectMod(effect));

        return raw;
    }

    private EntityMods EffectMod(IBonusEffect effect)
    {
        var mod = new EntityMods();

        switch (effect.Type)
        {
            case EBonusEffectType.Str: mod.Str = effect.Value; break;
            case EBonusEffectType.Dex: mod.Dex = effect.Value; break;
            case EBonusEffectType.Int: mod.Int = effect.Value; break;

            case EBonusEffectType.StunInc:
                if (effect.Mod == EBonusModifier.percentPoint) mod.Stun = effect.Value;
                else mod.StunIncPerc = effect.Value;
                break;
            case EBonusEffectType.StunReduction:
                if (effect.Mod == EBonusModifier.percentPoint) mod.StunReduction = effect.Value;
                else mod.StunReductionPerc = effect.Value;
                break;

            case EBonusEffectType.LifeMax:
                if (effect.Mod == EBonusModifier.flat) mod.LifeMaxFlat = effect.Value;
                else mod.LifeMaxInc = effect.Value;
                break;
            case EBonusEffectType.LifePerSecond: mod.LifePerSecondFlat = effect.Value; break;
            case EBonusEffectType.LifePerKill: mod.LifePerKillFlat = effect.Value; break;

            case EBonusEffectType.PhysReflect:
                if (effect.Mod == EBonusModifier.percent) mod.PhysReflectInc = effect.Value;
                else mod.PhysReflectFlat = effect.Value;
                break;
            case EBonusEffectType.PhysReduction:
                if (effect.Mod == EBonusModifier.percent) mod.PhysReductionInc = effect.Value;
                else mod.PhysReduction = effect.Value;
                break;
            case EBonusEffectType.Armour:
                if (effect.Mod == EBonusModifier.percent) mod.ArmourInc = effect.Value;
                else mod.ArmourFlat = effect.Value;
                break;
            case EBonusEffectType.Evasion:
                if (effect.Mod == EBonusModifier.percent) mod.EvasionInc = effect.Value;
                else mod.EvasionFlat = effect.Value;
                break;
            case EBonusEffectType.ES:
                if (effect.Mod == EBonusModifier.percent) mod.EsInc = effect.Value;
                else mod.EsFlat = effect.Value;
                break;
            case EBonusEffectType.ESRegenDelay: mod.EsRegenDelay = effect.Value; break;
            case EBonusEffectType.ESRegenRate: mod.EsRegenRate = effect.Value; break;
            case EBonusEffectType.Block:
                if (effect.Mod == EBonusModifier.percentPoint) mod.Block = effect.Value;
                else mod.BlockInc = effect.Value;
                break;

            case EBonusEffectType.FireResist: mod.FireResFlat = effect.Value; break;
            case EBonusEffectType.ColdResist: mod.ColdResFlat = effect.Value; break;
            case EBonusEffectType.LightResist: mod.LightResFlat = effect.Value; break;

            case EBonusEffectType.PhysDamage:
                if (effect.Mod == EBonusModifier.percent) mod.PhysInc = effect.Value;
                else { mod.PhysMinFlat = effect.Value; mod.PhysMaxFlat = effect.Value; }
                break;
            case EBonusEffectType.FireDamage:
                if (effect.Mod == EBonusModifier.percent) mod.FireInc = effect.Value;
                else { mod.FireMinFlat = effect.Value; mod.FireMaxFlat = effect.Value; }
                break;
            case EBonusEffectType.ColdDamage:
                if (effect.Mod == EBonusModifier.percent) mod.ColdInc = effect.Value;
                else { mod.ColdMinFlat = effect.Value; mod.ColdMaxFlat = effect.Value; }
                break;
            case EBonusEffectType.LightDamage:
                if (effect.Mod == EBonusModifier.percent) mod.LightInc = effect.Value;
                else { mod.LightMinFlat = effect.Value; mod.LightMaxFlat = effect.Value; }
                break;

            case EBonusEffectType.AttackSpeed:
                if (effect.Mod == EBonusModifier.percent) mod.AttackSpeedInc = effect.Value;
                else mod.AttackSpeedFlat = effect.Value;
                break;
            case EBonusEffectType.AttackRange: mod.AttackRangeInc = effect.Value; break;
            case EBonusEffectType.MovementSpeed:
                if (effect.Mod == EBonusModifier.percent) mod.MoveSpeedInc = effect.Value;
                else mod.MoveSpeedFlat = effect.Value;
                break;
            case EBonusEffectType.Accuracy: mod.AccuracyFlat = effect.Value; break;
            case EBonusEffectType.CriticalChance:
                if (effect.Mod == EBonusModifier.percentPoint) mod.CritChanceAddFlat = effect.Value;
                else mod.CritChanceFlat = effect.Value;
                break;
            case EBonusEffectType.CriticalMultiplier: mod.CritMultiplierFlat = effect.Value; break;
        }

        return mod;
    }

}
