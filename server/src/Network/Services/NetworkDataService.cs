using System.Threading.Channels;

using BubleRpg.Network.Model;

namespace BubleRpg.Network.Services;

/// <summary>Транспорт данных сеть → игра. Только запись и чтение, никаких решений.</summary>
public sealed class NetworkDataService(ILogger<NetworkDataService> logger)
{
    private readonly Channel<NetworkData> queue = Channel.CreateBounded<NetworkData>(
        new BoundedChannelOptions(1024)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
            SingleWriter = false
        });

    public bool TryWrite(NetworkData data)
    {
        if (queue.Writer.TryWrite(data)) return true;

        logger.LogWarning("Network data overflow, {Data} dropped.", data.GetType().Name);
        return false;
    }

    public bool TryRead(out NetworkData data) => queue.Reader.TryRead(out data);
}
