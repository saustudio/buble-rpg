using BubleRpg.Server.Game.Services;
using BubleRpg.Server.Game.Systems;

namespace BubleRpg.Server.Game.Extensions;

public static class GameModule
{
    public static IServiceCollection AddGame(this IServiceCollection services)
    {
        services.AddSingleton<GameDataService>();

        services.AddSingleton<GameStateService>();
        services.AddSingleton<WaveService>();
        services.AddSingleton<PhysicsService>();
        services.AddSingleton<EquipmentService>();
        services.AddSingleton<EntityModsService>();
        services.AddSingleton<EntityAttributesService>();
        services.AddSingleton<StunService>();

        services.AddSingleton<IGameSystem, MovementSystem>();
        services.AddSingleton<IGameSystem, TargetSystem>();
        services.AddSingleton<IGameSystem, PursueSystem>();
        services.AddSingleton<IGameSystem, RigidbodySystem>();
        services.AddSingleton<IGameSystem, WaveSystem>();
        services.AddSingleton<IGameSystem, SpawnSystem>();
        services.AddSingleton<IGameSystem, StatsSystem>();
        services.AddSingleton<IGameSystem, AttackSystem>();
        services.AddSingleton<IGameSystem, DefenceSystem>();
        services.AddSingleton<IGameSystem, DamageSystem>();
        services.AddSingleton<IGameSystem, BattleEffectSystem>();
        services.AddSingleton<IGameSystem, StunSystem>();
        services.AddSingleton<IGameSystem, HealthSystem>();
        services.AddSingleton<IGameSystem, EnemyHudSystem>();
        services.AddSingleton<IGameSystem, LootSystem>();
        services.AddSingleton<IGameSystem, ExperienceSystem>();
        services.AddSingleton<IGameSystem, BonusSystem>();
        services.AddSingleton<IGameSystem, GameStateSystem>();

        services.AddSingleton<GameService>();

        return services;
    }
}
