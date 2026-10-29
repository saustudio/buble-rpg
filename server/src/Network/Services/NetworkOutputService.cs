using BubleRpg.Server.Game.Model;
using BubleRpg.Network.Model;
using BubleRpg.Network.Services;
using BubleRpg.Server.Application.Services;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Network.Services;

public sealed class NetworkOutputService(
    GameDataService game,
    EntityAttributesService attrService,
    GameClientService clients) : IApplicationService
{
    private const double Interval = 1.0 / 20.0;

    private double elapsed;
    private readonly Dictionary<string, Task> pending = new();

    public void Run(double deltaSeconds)
    {
        elapsed += deltaSeconds;
        if (elapsed < Interval) return;

        elapsed = 0;

        var monsters = ToMonsters();
        var wave = ToWave();

        foreach (var (connectionId, participantId) in clients.Connections)
        {
            if (pending.TryGetValue(connectionId, out var send) && !send.IsCompleted) continue;

            var response = ToResponse(participantId, monsters, wave);
            pending[connectionId] = clients.SendToConnectionAsync(connectionId, response);
        }

        PrunePending();
    }

    private void PrunePending()
    {
        if (pending.Count <= clients.Connections.Count) return;

        foreach (var connectionId in pending.Keys)
        {
            if (!clients.Connections.ContainsKey(connectionId)) pending.Remove(connectionId);
        }
    }

    private GameStateResponse ToResponse(string participantId, List<MonsterState> monsters, WaveState? wave)
    {
        HeroState? mine = null;
        var enemyHeroes = new List<HeroState>();
        int? enemyTarget = null;

        foreach (var (entityId, hero) in game.FindComponents<Hero>())
        {
            var state = ToHeroState(entityId);

            if (hero.Id == participantId)
            {
                mine = state;
                enemyTarget = game.EntityGet<EnemyHudTarget>(entityId)?.TargetId;
            }
            else
            {
                enemyHeroes.Add(state);
            }
        }

        // Фаза мира общая, но конкретному соединению смерть его героя отдаётся как OVER.
        var phase = game.Single<GameState>()?.State ?? EGameState.INIT;
        if (mine != null && mine.LifeCurrent <= 0) phase = EGameState.OVER;

        return new GameStateResponse(
            Arena.Width,
            Arena.Height,
            phase,
            mine,
            enemyHeroes,
            monsters,
            wave,
            enemyTarget);
    }

    private HeroState ToHeroState(int id)
    {
        var transform = game.EntityGet<Transform2D>(id);
        var velocity = game.EntityGet<Velocity>(id);
        var health = game.EntityGet<Health>(id);
        var experience = game.EntityGet<Experience>(id);
        var attributes = attrService.Attributes(id);
        var body = game.EntityGet<Rigidbody>(id);
        var attackReady = game.EntityGet<AttackCooldown>(id) == null;

        var equipment = game.EntityGet<Equipment>(id);
        var weapon = equipment?.Slots[EEquipSlot.WEAPON];

        var lifeCurrent = health == null || double.IsNaN(health.LifeCurrent)
            ? attributes.LifeMax
            : health.LifeCurrent;
        var esCurrent = health == null || double.IsNaN(health.EsCurrent)
            ? attributes.ES
            : health.EsCurrent;

        return new HeroState(
            id,
            transform?.X ?? 0,
            transform?.Y ?? 0,
            velocity?.DirX ?? 0,
            velocity?.DirY ?? 0,
            lifeCurrent,
            attributes.LifeMax,
            esCurrent,
            experience?.Lvl ?? 1,
            experience?.Value ?? 0,
            experience?.Next ?? 0,
            body?.Size ?? 25,
            attributes.Str,
            attributes.Dex,
            attributes.Int,
            attributes.AttackRange,
            attackReady,
            AttackType(attributes),
            attributes.ES,
            weapon?.Name,
            weapon == null ? null : Rarity(weapon.Rarity),
            ToHeroStats(attributes));
    }

    private static HeroStats ToHeroStats(EntityAttributes attributes)
    {
        return new HeroStats(
            attributes.PhysicalDamageMin,
            attributes.PhysicalDamageMax,
            attributes.FireDamageMin,
            attributes.FireDamageMax,
            attributes.ColdDamageMin,
            attributes.ColdDamageMax,
            attributes.LightDamageMin,
            attributes.LightDamageMax,
            attributes.AttackSpeed,
            attributes.Accuracy,
            attributes.CriticalChance,
            attributes.CriticalMultiplier,
            attributes.Stun,
            attributes.StunReduction,
            attributes.LifePerSecond,
            attributes.LifePerKill,
            attributes.Armour,
            attributes.PhysReduction,
            attributes.Evasion,
            attributes.Block,
            attributes.PhysReflect,
            attributes.FireResist,
            attributes.ColdResist,
            attributes.LightResist,
            attributes.MovementSpeed);
    }

    private WaveState? ToWave()
    {
        var wave = game.Single<Wave>();
        return wave == null
            ? null
            : new WaveState(wave.Lvl, wave.SpawnMax, wave.Spawned, wave.PrepareTimer);
    }

    private List<MonsterState> ToMonsters()
    {
        var result = new List<MonsterState>();

        foreach (var id in game.Query<Monster, Transform2D, Rigidbody, Health, EntityAttributes>())
        {
            var transform = game.EntityGet<Transform2D>(id);
            var velocity = game.EntityGet<Velocity>(id);
            var body = game.EntityGet<Rigidbody>(id);
            var health = game.EntityGet<Health>(id);
            var monster = game.EntityGet<Monster>(id);
            var equipment = game.EntityGet<Equipment>(id);
            var attributes = attrService.Attributes(id);
            var attackReady = game.EntityGet<AttackCooldown>(id) == null;

            var lifeCurrent = health == null || double.IsNaN(health.LifeCurrent)
                ? attributes.LifeMax
                : health.LifeCurrent;
            var esCurrent = health == null || double.IsNaN(health.EsCurrent)
                ? attributes.ES
                : health.EsCurrent;

            result.Add(new MonsterState(
                id,
                transform?.X ?? 0,
                transform?.Y ?? 0,
                velocity?.DirX ?? 0,
                velocity?.DirY ?? 0,
                lifeCurrent,
                attributes.LifeMax,
                esCurrent,
                attributes.ES,
                body?.Size ?? 20,
                monster?.Level ?? 1,
                monster?.Rarity ?? EMonsterRarity.COMMON,
                equipment == null ? 0 : EquipmentService.All(equipment).Count,
                attributes.AttackRange,
                attackReady,
                AttackType(attributes)));
        }

        return result;
    }

    private static EAttackType AttackType(EntityAttributes attributes)
    {
        var phys = attributes.PhysicalDamageMax;
        var fire = attributes.FireDamageMax;
        var cold = attributes.ColdDamageMax;
        var light = attributes.LightDamageMax;

        var max = Math.Max(Math.Max(phys, fire), Math.Max(cold, light));
        if (max <= 0) return EAttackType.PHYSICAL;
        if (max == fire) return EAttackType.FIRE;
        if (max == cold) return EAttackType.COLD;
        if (max == light) return EAttackType.LIGHT;

        return EAttackType.PHYSICAL;
    }

    private static string Rarity(EItemRarity rarity)
    {
        return rarity switch
        {
            EItemRarity.MAGIC => "magic",
            EItemRarity.RARE => "rare",
            _ => "common"
        };
    }
}
