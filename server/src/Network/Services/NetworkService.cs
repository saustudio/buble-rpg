using BubleRpg.Network.Model;
using BubleRpg.Network.Services;
using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

using Microsoft.Extensions.Logging;

namespace BubleRpg.Server.Network.Services;

/// <summary>
/// Транспорт сетевого слоя: каждый тик собирает персональные снимки через <see cref="GameStateMapper"/>
/// и рассылает их клиентам, затем применяет команды клиентов. Идёт после <see cref="GameService"/>,
/// поэтому снимок отражает завершённый тик, а команды вступают в силу на следующем тике.
/// Отправка идёт с частотой тика (60 Гц), поэтому события боя не накапливаются: снимок = тик.
/// Соединению, у которого отправка ещё в полёте, тик пропускается — состояние не встаёт в очередь.
/// Добыча в снимок не входит: она меняется редко и уходит отдельным событием <c>"Loot"</c>.
/// Снимок и добыча материализуются синхронно в тик-потоке; задача-полёт трогает только SignalR.
/// </summary>
public sealed class NetworkService(
    NetworkContext netContext,
    GameService games,
    GameDbContext store,
    GameStateMapper mapper,
    GameClientService clients,
    ILogger<NetworkService> logger)
{
    // ===== Вывод =====

    /// <summary>Собирает снимок для каждого соединения и рассылает его. Занятому соединению тик пропускается.</summary>
    public void Send()
    {
        // Завершённые отправки коммитятся первыми: гейт `Pending` должен видеть только задачи в полёте.
        PrunePending();

        foreach (var (connectionId, participantId) in clients.Connections)
        {
            // Предыдущая отправка ещё в полёте — тик пропускаем, чтобы не копить очередь.
            if (netContext.Pending.ContainsKey(connectionId)) continue;

            var gameId = games.GameOf(participantId);
            if (gameId == null) continue;

            // Материализация должна остаться в тик-потоке: полёт задачи ECS не трогает.
            var snapshot = mapper.MapState(gameId.Value, participantId);

            // Пока игровая логика не создала героя, соединению нечего слать.
            if (snapshot.MyHero == null) continue;

            // Добычу читаем только на чтение: решение «пора ли слать» — забота сети, а не домена.
            var heroId = snapshot.MyHero.Id;
            var loot = store.EntityGet<Loot>(heroId);
            var revision = loot?.Revision ?? 0;

            LootMessage? lootMessage = null;
            if (!netContext.LootRevisions.TryGetValue(connectionId, out var delivered)
                || delivered.HeroId != heroId
                || delivered.Revision != revision)
            {
                lootMessage = mapper.MapLoot(loot);
            }

            netContext.Pending[connectionId] = (
                SendToConnectionAsync(connectionId, snapshot, lootMessage),
                heroId,
                revision);
        }
    }

    /// <summary>
    /// Отправляет снимок и, если добыча изменилась, следом её содержимое. Порядок важен:
    /// добыча приходит после снимка, в котором уже есть герой. Одна задача на соединение —
    /// это же и гейт против накопления очереди. ECS и <see cref="Loot"/> здесь не читаются.
    /// </summary>
    private async Task<bool> SendToConnectionAsync(string connectionId, GameStateMessage snapshot, LootMessage? loot)
    {
        try
        {
            await clients.SendStateAsync(connectionId, snapshot);

            if (loot != null) await clients.SendLootAsync(connectionId, loot);

            return true;
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Не удалось отправить снимок соединению {ConnectionId}.", connectionId);
            return false;
        }
    }

    private void PrunePending()
    {
        foreach (var connectionId in netContext.Pending.Keys.ToList())
        {
            // Соединение исчезло: снимаем гейт, ревизию не коммитим.
            if (!clients.Connections.ContainsKey(connectionId))
            {
                netContext.Pending.Remove(connectionId);
                continue;
            }

            var pending = netContext.Pending[connectionId];
            if (!pending.Task.IsCompleted) continue;

            netContext.Pending.Remove(connectionId);

            // Ревизия считается доставленной только при успешной отправке — иначе повтор на следующем тике.
            if (pending.Task.IsCompletedSuccessfully && pending.Task.Result)
                netContext.LootRevisions[connectionId] = (pending.HeroId, pending.Revision);
            else
                logger.LogError("Отправка соединению {ConnectionId} не удалась; повтор на следующем тике.", connectionId);
        }

        foreach (var connectionId in netContext.LootRevisions.Keys.ToList())
        {
            if (!clients.Connections.ContainsKey(connectionId)) netContext.LootRevisions.TryRemove(connectionId, out _);
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
                // Клик обрабатывается на следующем тике. Ack нет: повторный клик по тому же
                // предмету не найдёт мешок и будет молча отклонён, поэтому дублирование безопасно.
                // TODO: накопление кликов не троттлится — безопасность держится на единственном DrainCommands.
                games.PickLoot(loot.Id, loot.BagId, loot.ItemId);
                break;

            case LootDiscardData loot:
                games.DiscardLoot(loot.Id, loot.BagId);
                break;
        }
    }
}
