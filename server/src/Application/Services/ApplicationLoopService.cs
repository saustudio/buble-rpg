namespace BubleRpg.Server.Application.Services;

public interface IApplicationService
{
    void Run(double deltaSeconds);
}

public sealed class ApplicationLoopService(
    IEnumerable<IApplicationService> services,
    ILogger<ApplicationLoopService> logger) : BackgroundService
{
    private const double TickSeconds = 1.0 / 60.0;

    private readonly IApplicationService[] ordered = services.ToArray();

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(TickSeconds));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            foreach (var service in ordered)
            {
                try { service.Run(TickSeconds); }
                catch (Exception exception) { logger.LogError(exception, "{Service} failed on tick.", service.GetType().Name); }
            }
        }
    }
}
