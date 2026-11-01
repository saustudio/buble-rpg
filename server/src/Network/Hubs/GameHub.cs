using System.Security.Claims;

using BubleRpg.Network.Model;
using BubleRpg.Network.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace BubleRpg.Network.Hubs;

[Authorize]
public sealed class GameHub(NetworkContext data, GameClientService clients) : Hub
{
    public override Task OnConnectedAsync()
    {
        clients.Add(Context.ConnectionId, GuestId);
        data.Queue.Writer.TryWrite(new HeroSpawnData { Id = GuestId });
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        var participantId = clients.Remove(Context.ConnectionId);
        if (participantId != null) data.Queue.Writer.TryWrite(new HeroDisconnectData { Id = participantId });

        // Ревизия добычи привязана к соединению: реконнект с новым id не должен наследовать чужую.
        data.LootRevisions.TryRemove(Context.ConnectionId, out _);
        return base.OnDisconnectedAsync(exception);
    }

    public Task RequestState() => Task.CompletedTask;

    // Респавн по тому же соединению: SpawnSystem удалит мёртвого героя и создаст нового.
    public Task Respawn() => SaveData(new HeroSpawnData { Id = GuestId });

    public Task MoveTo(double x, double y) => SaveData(new MoveData
    {
        Id = GuestId,
        X = x,
        Y = y
    });

    public Task ChooseLevelBonus(string bonusId) => SaveData(new LevelBonusChoiceData
    {
        Id = GuestId,
        BonusId = bonusId
    });

    public Task ChooseWaveBonus(string bonusId) => SaveData(new WaveBonusChoiceData
    {
        Id = GuestId,
        BonusId = bonusId
    });

    public Task PickLoot(int bagId, string itemId) => SaveData(new LootPickData
    {
        Id = GuestId,
        BagId = bagId,
        ItemId = itemId
    });

    public Task DiscardLoot(int bagId) => SaveData(new LootDiscardData
    {
        Id = GuestId,
        BagId = bagId
    });

    private Task SaveData(NetworkData entry)
    {
        data.Queue.Writer.TryWrite(entry);
        return Task.CompletedTask;
    }

    private string GuestId
    {
        get
        {
            var value = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(value)) return value;
            throw new HubException("Guest session has no identity.");
        }
    }
}
