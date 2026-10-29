namespace BubleRpg.Server.Game.Model;

public sealed class Health
{
    public double LifeCurrent { get; set; } = double.NaN;
    public double EsCurrent { get; set; } = double.NaN;
    public double EsCurrentPrev { get; set; } = double.NaN;
    public double EsRegenDelay { get; set; } = 10;
}

public sealed class Stun
{
    public Stun(int source, double duration, double? remaining = null)
    {
        Source = source;
        Duration = duration;
        Remaining = remaining ?? duration;
    }

    public int Source { get; set; }
    public double Duration { get; set; }
    public double Remaining { get; set; }
}
