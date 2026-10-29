namespace BubleRpg.Server.Game.Model;

public sealed class Fraction
{
    public Fraction(double value)
    {
        Value = value;
    }

    public double Value { get; set; }
}

public sealed class Prey
{
}

public sealed class Pursuer
{
}

/// <summary>Цель, которую атакует герой: другой герой или монстр.</summary>
public sealed class EnemyHudTarget
{
    public int TargetId { get; set; }
    public double Remaining { get; set; }
}
