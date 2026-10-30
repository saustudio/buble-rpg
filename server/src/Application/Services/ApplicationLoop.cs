namespace BubleRpg.Server.Application.Services;

public interface ITickHandler
{
    void Update(double deltaSeconds);
}

public sealed class ApplicationLoop(
    IEnumerable<ITickHandler> handlers,
    ILogger<ApplicationLoop> logger) : BackgroundService
{
    private const double TickSeconds = 1.0 / 60.0;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(TickSeconds));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            foreach (var handler in handlers)
            {
                try { handler.Update(TickSeconds); }
                catch (Exception exception) { logger.LogError(exception, "{handler} failed on tick.", handler.GetType().Name); }
            }
        }
    }
}
