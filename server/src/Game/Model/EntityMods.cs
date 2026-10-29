namespace BubleRpg.Server.Game.Model;

public sealed class EntityMods
{
    public double Str { get; set; }
    public double Dex { get; set; }
    public double Int { get; set; }
    public double Attributes { get; set; }
    public double AttributesInc { get; set; }
    public double Stun { get; set; }
    public double StunReduction { get; set; }
    public double StunIncPerc { get; set; }
    public double StunReductionPerc { get; set; }

    public double LifeMaxFlat { get; set; }
    public double LifeMaxInc { get; set; }
    public double LifePerSecondFlat { get; set; }
    public double LifePerMinuteFlat { get; set; }
    public double LifePerMinutePerc { get; set; }
    public double LifePerKillFlat { get; set; }

    public double PhysReflectFlat { get; set; }
    public double PhysReflectInc { get; set; }
    public double PhysReduction { get; set; }
    public double PhysReductionInc { get; set; }
    public double DefenceInc { get; set; }
    public double ArmourFlat { get; set; }
    public double ArmourAdd { get; set; }
    public double ArmourInc { get; set; }
    public double EvasionFlat { get; set; }
    public double EvasionAdd { get; set; }
    public double EvasionInc { get; set; }
    public double EsFlat { get; set; }
    public double EsAdd { get; set; }
    public double EsInc { get; set; }
    public double EsRegenDelay { get; set; }
    public double EsRegenRate { get; set; }
    public double Block { get; set; }
    public double BlockInc { get; set; }

    public double FireResFlat { get; set; }
    public double ColdResFlat { get; set; }
    public double LightResFlat { get; set; }

    public double DamageInc { get; set; }
    public double ElementDamageInc { get; set; }
    public double PhysMinFlat { get; set; }
    public double PhysMaxFlat { get; set; }
    public double PhysInc { get; set; }
    public double FireMinFlat { get; set; }
    public double FireMaxFlat { get; set; }
    public double FireInc { get; set; }
    public double ColdMinFlat { get; set; }
    public double ColdMaxFlat { get; set; }
    public double ColdInc { get; set; }
    public double LightMinFlat { get; set; }
    public double LightMaxFlat { get; set; }
    public double LightInc { get; set; }

    public double CastSpeedFlat { get; set; }
    public double CastSpeedInc { get; set; }
    public double CastDamageInc { get; set; }

    public double AttackSpeedFlat { get; set; }
    public double AttackSpeedInc { get; set; }
    public double AttackRangeFlat { get; set; }
    public double AttackRangeInc { get; set; }
    public double AccuracyFlat { get; set; }
    public double AccuracyInc { get; set; }
    public double CritChanceFlat { get; set; }
    public double CritChanceAddFlat { get; set; }
    public double CritChanceInc { get; set; }
    public double CritMultiplierFlat { get; set; }
    public double MoveSpeedFlat { get; set; }
    public double MoveSpeedInc { get; set; }
}
