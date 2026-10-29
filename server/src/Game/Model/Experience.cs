namespace BubleRpg.Server.Game.Model;

public sealed class Experience
{
    public Experience(double value = 0, double next = 100, double lvl = 1)
    {
        Value = value;
        Next = next;
        Lvl = lvl;
    }

    public double Value { get; set; }
    public double Next { get; set; }
    public double Lvl { get; set; }
}
