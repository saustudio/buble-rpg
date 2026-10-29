using System.Security.Claims;

using BubleRpg.Network.Model;
using BubleRpg.Network.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace BubleRpg.Network.Hubs;

[Authorize]
public sealed class GameHub(NetworkDataService data, GameClientService clients) : Hub
{
    public override Task OnConnectedAsync()
    {
        clients.Add(Context.ConnectionId, GuestId);
        data.TryWrite(new HeroSpawnData { Id = GuestId });
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        clients.Remove(Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }

    public Task RequestState() => Task.CompletedTask;

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

    public Task PickLoot(string itemId) => SaveData(new LootPickData
    {
        Id = GuestId,
        ItemId = itemId
    });

    private Task SaveData(NetworkData entry)
    {
        data.TryWrite(entry);
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
