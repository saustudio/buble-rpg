namespace BubleRpg.Server.Game.Model;

/// <summary>
/// Проекция игры для будущего списка комнат: по ней клиент сможет выбрать, к какой игре подключиться.
/// Пока используется только внутри сервера, наружу не отдаётся.
/// </summary>
public sealed class GameInfo
{
    public int GameId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool Finished { get; set; }
    public int Players { get; set; }
    public int Wave { get; set; }
    public int Monsters { get; set; }
}
