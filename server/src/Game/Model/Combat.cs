using System.Text.Json.Serialization;

namespace BubleRpg.Server.Game.Model;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EAttackType
{
    PHYSICAL,
    FIRE,
    COLD,
    LIGHT
}

public sealed class AttackCooldown
{
    public AttackCooldown(double value = 1)
    {
        Value = value;
    }

    public double Value { get; set; }
}

public sealed class AttackHit
{
    public AttackHit(int source, int target)
    {
        Source = source;
        Target = target;
    }

    public double Phys { get; set; }
    public double Fire { get; set; }
    public double Cold { get; set; }
    public double Light { get; set; }
    public bool IsCrit { get; set; }
    public int Source { get; set; }
    public int Target { get; set; }
}

public sealed class DefenceEvasion
{
    public DefenceEvasion(int source, int target)
    {
        Source = source;
        Target = target;
    }

    public int Source { get; set; }
    public int Target { get; set; }
}

public sealed class DefenceBlock
{
    public DefenceBlock(int source, int target)
    {
        Source = source;
        Target = target;
    }

    public int Source { get; set; }
    public int Target { get; set; }
}

public sealed class BlockEffect 
{
    public BlockEffect(int source, int target, double lifetime, double elapsed = 0)
    {
        Source = source;
        Target = target;
        Lifetime = lifetime;
        Elapsed = elapsed;
    }

    public int Source { get; set; }
    public int Target { get; set; }
    public double Lifetime { get; set; }
    public double Elapsed { get; set; }
}

public sealed class MissEffect
{
    public MissEffect(int source, int target, double lifetime, double elapsed = 0)
    {
        Source = source;
        Target = target;
        Lifetime = lifetime;
        Elapsed = elapsed;
    }

    public int Source { get; set; }
    public int Target { get; set; }
    public double Lifetime { get; set; }
    public double Elapsed { get; set; }
}

public sealed class HitEffect
{
    public HitEffect(int source, int target, double amount, bool isCrit, double lifetime, double elapsed = 0)
    {
        Source = source;
        Target = target;
        Amount = amount;
        IsCrit = isCrit;
        Lifetime = lifetime;
        Elapsed = elapsed;
    }

    public int Source { get; set; }
    public int Target { get; set; }
    public double Amount { get; set; }
    public bool IsCrit { get; set; }
    public double Lifetime { get; set; }
    public double Elapsed { get; set; }
}
