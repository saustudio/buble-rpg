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

    /// <summary>Незавершённые отправки: соединение → задача рассылки.</summary>
    public readonly Dictionary<string, Task> Pending = new();
}
