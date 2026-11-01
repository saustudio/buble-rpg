using System.Collections.Concurrent;

using BubleRpg.Network.Hubs;
using BubleRpg.Network.Model;

using Microsoft.AspNetCore.SignalR;

namespace BubleRpg.Network.Services;

/// <summary>Рассылка состояния и реестр соединений: соединение → внешний идентификатор участника.</summary>
public sealed class GameClientService(IHubContext<GameHub> hubContext)
{
    private readonly ConcurrentDictionary<string, string> connections = new();

    public IReadOnlyDictionary<string, string> Connections => connections;

    public void Add(string connectionId, string participantId) => connections[connectionId] = participantId;

    /// <summary>Убирает соединение и возвращает идентификатор участника, если он был.</summary>
    public string? Remove(string connectionId)
    {
        connections.TryRemove(connectionId, out var participantId);
        return participantId;
    }

    /// <summary>Снимок состояния игры — событие <c>"GameState"</c>, каждый тик.</summary>
    public Task SendStateAsync(string connectionId, GameStateMessage state, CancellationToken cancellationToken = default)
    {
        return hubContext.Clients.Client(connectionId).SendAsync("GameState", state, cancellationToken);
    }

    /// <summary>Добыча — событие <c>"Loot"</c>, только при изменении набора.</summary>
    public Task SendLootAsync(string connectionId, LootMessage loot, CancellationToken cancellationToken = default)
    {
        return hubContext.Clients.Client(connectionId).SendAsync("Loot", loot, cancellationToken);
    }
}
