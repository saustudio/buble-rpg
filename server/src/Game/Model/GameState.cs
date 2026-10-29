using System.Text.Json.Serialization;

namespace BubleRpg.Server.Game.Model;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EGameState
{
    INIT,
    PLAY,
    OVER,
    PAUSE
}

public sealed class GameState
{
    public EGameState State { get; set; } = EGameState.INIT;
    public HashSet<string> PauseSources { get; set; } = new();
}
