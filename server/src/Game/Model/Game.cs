namespace BubleRpg.Server.Game.Model;

/// <summary>
/// Состав и метаданные игры: имя, лимит игроков и участники. Живёт в партиции игры рядом с
/// <see cref="GameState"/>; фаза мира хранится отдельно, здесь — только «кто и как играет».
/// </summary>
public sealed class Game
{
    public string Name { get; set; } = string.Empty;
    public int MaxPlayers { get; set; }
    public HashSet<string> Participants { get; } = new();
}
