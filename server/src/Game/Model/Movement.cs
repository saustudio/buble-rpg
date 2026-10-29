namespace BubleRpg.Server.Game.Model;

public sealed class Transform2D
{
    public Transform2D(double x, double y)
    {
        X = x;
        Y = y;
    }

    public double X { get; set; }
    public double Y { get; set; }
}

public sealed class Velocity
{
    public double DirX { get; set; }
    public double DirY { get; set; }
}

public sealed class Rigidbody
{
    public Rigidbody(double size, double baseMass, double? mass = null, bool isStatic = false)
    {
        Size = size;
        BaseMass = baseMass;
        Mass = mass ?? baseMass;
        IsStatic = isStatic;
    }

    public double Size { get; set; }
    public double BaseMass { get; set; }
    public double Mass { get; set; }
    public bool IsStatic { get; set; }
}

public sealed class MoveTarget
{
    public double X { get; set; }
    public double Y { get; set; }
}
