using System.Collections.Concurrent;
using System.Threading.Channels;

using BubleRpg.Network.Model;

namespace BubleRpg.Network.Services;

/// <summary>
/// Сетевое состояние: очередь команд сеть → игра и незавершённые отправки.
/// Только хранение и доступ, никаких решений.
/// </summary>
public sealed class NetworkContext
{
    /// <summary>Очередь команд из сети в игру.</summary>
    public readonly Channel<NetworkData> Queue = Channel.CreateBounded<NetworkData>(new BoundedChannelOptions(1024)
    {
        FullMode = BoundedChannelFullMode.Wait,
        SingleReader = true,
        SingleWriter = false
    });

    /// <summary>
    /// Отправка в полёте: соединение → (задача, отправленные <c>HeroId</c>/<c>Revision</c>).
    /// Ревизия коммитится по этой паре, а не по текущей — иначе обновление, случившееся за время полёта, потерялось бы.
    /// Трогает только тик-поток, поэтому обычный словарь безопасен.
    /// </summary>
    public readonly Dictionary<string, (Task<bool> Task, int HeroId, long Revision)> Pending = new();

    /// <summary>Последняя успешно доставленная добыча: соединение → (герой, ревизия).</summary>
    public readonly ConcurrentDictionary<string, (int HeroId, long Revision)> LootRevisions = new();
}
