using BubleRpg.Network.Model;
using BubleRpg.Network.Services;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Network.Services;

/// <summary>
/// Транспорт сетевого слоя: каждый тик собирает персональные снимки через <see cref="GameStateMapper"/>
/// и рассылает их клиентам, затем применяет команды клиентов. Идёт после <see cref="GameService"/>,
/// поэтому снимок отражает завершённый тик, а команды вступают в силу на следующем тике.
/// Отправка идёт с частотой тика (60 Гц), поэтому события боя не накапливаются: снимок = тик.
/// Соединению, у которого отправка ещё в полёте, тик пропускается — состояние не встаёт в очередь.
/// </summary>
public sealed class NetworkService(
    NetworkContext netContext,
    GameService games,
    GameStateMapper mapper,
    GameClientService clients)
{
    // ===== Вывод =====

    /// <summary>Собирает снимок для каждого соединения и рассылает его. Занятому соединению тик пропускается.</summary>
    public void Send()
    {
        foreach (var (connectionId, participantId) in clients.Connections)
        {
            // Предыдущая отправка ещё в полёте — тик пропускаем, чтобы не копить очередь.
            if (netContext.Pending.TryGetValue(connectionId, out var send) && !send.IsCompleted) continue;

            var gameId = games.GameOf(participantId);
            if (gameId == null) continue;

            var snapshot = mapper.Map(gameId.Value, participantId);

            // Пока игровая логика не создала героя, соединению нечего слать.
            if (snapshot.MyHero == null) continue;

            netContext.Pending[connectionId] = clients.SendToConnectionAsync(connectionId, snapshot);
        }

        PrunePending();
    }

    private void PrunePending()
    {
        if (netContext.Pending.Count <= clients.Connections.Count) return;

        foreach (var connectionId in netContext.Pending.Keys)
        {
            if (!clients.Connections.ContainsKey(connectionId)) netContext.Pending.Remove(connectionId);
        }
    }

    // ===== Ввод =====

    public void DrainCommands()
    {
        while (netContext.Queue.Reader.TryRead(out var entry)) ToGame(entry);
    }

    /// <summary>Переводит команду из сети в вызов игровой логики.</summary>
    private void ToGame(NetworkData entry)
    {
        switch (entry)
        {
            case HeroSpawnData spawn:
                games.RequestSpawn(spawn.Id, spawn.GameId);
                break;

            case HeroDisconnectData disconnect:
                games.RemoveParticipant(disconnect.Id);
                break;

            case MoveData move:
                games.MoveTo(move.Id, move.X, move.Y);
                break;

            case LevelBonusChoiceData bonus:
                games.ChooseLevelBonus(bonus.Id, bonus.BonusId);
                break;

            case WaveBonusChoiceData bonus:
                games.ChooseWaveBonus(bonus.Id, bonus.BonusId);
                break;

            case LootPickData loot:
                games.PickLoot(loot.Id, loot.ItemId);
                break;
        }
    }
}
