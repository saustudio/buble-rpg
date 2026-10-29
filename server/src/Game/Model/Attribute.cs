namespace BubleRpg.Server.Game.Model;

public sealed class Attribute
{
    public Attribute(string id, double value)
    {
        Id = id;
        Value = value;
    }

    public string Id { get; set; }
    public double Value { get; set; }
}
