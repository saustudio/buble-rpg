using BubleRpg.Server.Game.Model;

namespace BubleRpg.Server.Game.Services;

public sealed class EntityModsService
{
    public void Add(EntityMods target, EntityMods source)
    {
        target.Str += source.Str;
        target.Dex += source.Dex;
        target.Int += source.Int;
        target.Attributes += source.Attributes;
        target.AttributesInc += source.AttributesInc;
        target.Stun += source.Stun;
        target.StunReduction += source.StunReduction;
        target.StunIncPerc += source.StunIncPerc;
        target.StunReductionPerc += source.StunReductionPerc;

        target.LifeMaxFlat += source.LifeMaxFlat;
        target.LifeMaxInc += source.LifeMaxInc;
        target.LifePerSecondFlat += source.LifePerSecondFlat;
        target.LifePerMinuteFlat += source.LifePerMinuteFlat;
        target.LifePerMinutePerc += source.LifePerMinutePerc;
        target.LifePerKillFlat += source.LifePerKillFlat;

        target.PhysReflectFlat += source.PhysReflectFlat;
        target.PhysReflectInc += source.PhysReflectInc;
        target.PhysReduction += source.PhysReduction;
        target.PhysReductionInc += source.PhysReductionInc;
        target.DefenceInc += source.DefenceInc;
        target.ArmourFlat += source.ArmourFlat;
        target.ArmourAdd += source.ArmourAdd;
        target.ArmourInc += source.ArmourInc;
        target.EvasionFlat += source.EvasionFlat;
        target.EvasionAdd += source.EvasionAdd;
        target.EvasionInc += source.EvasionInc;
        target.EsFlat += source.EsFlat;
        target.EsAdd += source.EsAdd;
        target.EsInc += source.EsInc;
        target.EsRegenDelay += source.EsRegenDelay;
        target.EsRegenRate += source.EsRegenRate;
        target.Block += source.Block;
        target.BlockInc += source.BlockInc;

        target.FireResFlat += source.FireResFlat;
        target.ColdResFlat += source.ColdResFlat;
        target.LightResFlat += source.LightResFlat;

        target.DamageInc += source.DamageInc;
        target.ElementDamageInc += source.ElementDamageInc;
        target.PhysMinFlat += source.PhysMinFlat;
        target.PhysMaxFlat += source.PhysMaxFlat;
        target.PhysInc += source.PhysInc;
        target.FireMinFlat += source.FireMinFlat;
        target.FireMaxFlat += source.FireMaxFlat;
        target.FireInc += source.FireInc;
        target.ColdMinFlat += source.ColdMinFlat;
        target.ColdMaxFlat += source.ColdMaxFlat;
        target.ColdInc += source.ColdInc;
        target.LightMinFlat += source.LightMinFlat;
        target.LightMaxFlat += source.LightMaxFlat;
        target.LightInc += source.LightInc;

        target.CastSpeedFlat += source.CastSpeedFlat;
        target.CastSpeedInc += source.CastSpeedInc;
        target.CastDamageInc += source.CastDamageInc;

        target.AttackSpeedFlat += source.AttackSpeedFlat;
        target.AttackSpeedInc += source.AttackSpeedInc;
        target.AttackRangeFlat += source.AttackRangeFlat;
        target.AttackRangeInc += source.AttackRangeInc;
        target.AccuracyFlat += source.AccuracyFlat;
        target.AccuracyInc += source.AccuracyInc;
        target.CritChanceFlat += source.CritChanceFlat;
        target.CritChanceAddFlat += source.CritChanceAddFlat;
        target.CritChanceInc += source.CritChanceInc;
        target.CritMultiplierFlat += source.CritMultiplierFlat;
        target.MoveSpeedFlat += source.MoveSpeedFlat;
        target.MoveSpeedInc += source.MoveSpeedInc;
    }
}
