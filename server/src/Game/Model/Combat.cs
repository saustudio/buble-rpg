using System.Text.Json.Serialization;

namespace BubleRpg.Server.Game.Model;

public sealed class AttackCooldown
{
    public AttackCooldown(double value = 1)
    {
        Value = value;
    }

    public double Value { get; set; }
}

/// <summary>Удар: живёт один тик, пока его не обработают защита, урон и сеть.</summary>
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

/// <summary>Уклонение: событие одного тика, удар при этом снимается.</summary>
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

/// <summary>Блок: событие одного тика, удар при этом снимается.</summary>
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
