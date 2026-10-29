using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class WaveSystem(
    GameDataService store,
    GameStateService gameStateService,
    WaveService waveService) : IGameSystem
{
    private const double PrepareSeconds = 2;

    public void Update(double deltaTime)
    {
        var gs = gameStateService.Current;
        if (gs == null || gs.State == EGameState.OVER) return;

        var waveEntity = store.First<Wave>();
        if (waveEntity == null)
        {
            if (gs.State == EGameState.INIT || gs.State == EGameState.PLAY) CreateWave();
            return;
        }

        var wave = store.EntityGet<Wave>(waveEntity.Value);

        if (gs.State == EGameState.INIT)
        {
            ResetWave(wave);
            return;
        }

        if (gs.State != EGameState.PLAY) return;

        if (wave.PrepareTimer > 0)
        {
            wave.PrepareTimer = Math.Max(0, wave.PrepareTimer - deltaTime);
            return;
        }

        if (wave.Spawned < wave.SpawnMax) return;

        var alive = store.Query<Monster, Health>().Any(entity =>
        {
            var health = store.EntityGet<Health>(entity);
            return health == null || double.IsNaN(health.LifeCurrent) || health.LifeCurrent > 0;
        });

        if (alive) return;

        wave.Lvl++;
        wave.Spawned = 0;
        wave.SpawnTimer = 0;
        wave.PrepareTimer = PrepareSeconds;
        ApplyStats(wave);
    }

    private void CreateWave()
    {
        var wave = new Wave();
        ApplyStats(wave);
        wave.PrepareTimer = PrepareSeconds;
        store.EntitySet(store.EntityCreate(), wave);
    }

    private void ResetWave(Wave wave)
    {
        wave.Lvl = 1;
        wave.Spawned = 0;
        wave.SpawnTimer = 0;
        wave.PrepareTimer = PrepareSeconds;
        wave.Modifiers.Clear();
        wave.Offers.Clear();
        ApplyStats(wave);
    }

    private void ApplyStats(Wave wave)
    {
        var stats = waveService.Stats(wave.Modifiers);
        wave.SpawnMax = stats.MaxCount;
        wave.SpawnLevel = stats.MonsterLevel;
        wave.SpawnInterval = stats.SpawnInterval;
        wave.EliteChance = stats.EliteChance;
        wave.ItemQuantityMult = stats.ItemQuantityMult;
        wave.ItemRarityBonus = stats.ItemRarityBonus;
    }
}
