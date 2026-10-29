namespace BubleRpg.Network.Services;

public sealed class GuestSessionCleanupService(
    GuestSessionService sessions,
    ILogger<GuestSessionCleanupService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            var removed = sessions.RemoveExpired();
            if (removed > 0)
                logger.LogInformation("Removed {Count} expired guest sessions.", removed);
        }
    }
}
