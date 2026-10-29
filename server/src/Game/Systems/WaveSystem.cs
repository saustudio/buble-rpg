using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class WaveSystem(
    GameDbContext store,
    WaveService waveService) : IGameSystem
{
    public void Update(double deltaTime)
    {
        foreach (var gameId in store.GameIds())
        {
            var gs = store.Single<GameState>(gameId);
            if (gs == null || gs.State == EGameState.OVER) continue;

            var waveEntity = store.First<Wave>(gameId);
            if (waveEntity == null)
            {
                if (gs.State == EGameState.INIT || gs.State == EGameState.PLAY) CreateWave(gameId);
                continue;
            }

            var wave = store.EntityGet<Wave>(waveEntity.Value);

            if (gs.State == EGameState.INIT)
            {
                waveService.Reset(wave);
                continue;
            }

            if (gs.State != EGameState.PLAY) continue;

            if (wave.PrepareTimer > 0)
            {
                wave.PrepareTimer = Math.Max(0, wave.PrepareTimer - deltaTime);
                continue;
            }

            if (wave.Spawned < wave.SpawnMax) continue;

            var alive = store.Query<Monster, Health>(gameId).Any(entity =>
            {
                var health = store.EntityGet<Health>(entity);
                return health == null || double.IsNaN(health.LifeCurrent) || health.LifeCurrent > 0;
            });

            if (alive) continue;

            wave.Lvl++;
            wave.Spawned = 0;
            wave.SpawnTimer = 0;
            wave.PrepareTimer = WaveService.PrepareSeconds;
            waveService.Apply(wave);
        }
    }

    private void CreateWave(int gameId)
    {
        var wave = new Wave();
        waveService.Apply(wave);
        wave.PrepareTimer = WaveService.PrepareSeconds;
        store.EntitySet(store.EntityCreate(gameId), wave);
    }
}
