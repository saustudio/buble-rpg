using BubleRpg.Server.Game.Model;
using BubleRpg.Network.Model;
using BubleRpg.Network.Services;
using BubleRpg.Server.Application.Services;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Network.Services;

public sealed class NetworkOutputService(
    GameDbContext gameData,
    EntityAttributesService attrService,
    GameClientService clients,
    GameService games) : IApplicationService
{
    private const double Interval = 1.0 / 20.0;

    private double elapsed;
    private readonly Dictionary<string, Task> pending = new();

    public void Run(double deltaSeconds)
    {
        elapsed += deltaSeconds;
        if (elapsed < Interval) return;

        elapsed = 0;

        foreach (var (gameId, connections) in GroupConnections())
        {
            var monsters = MapMonsters(gameId);
            var wave = MapWave(gameId);

            foreach (var (connectionId, participantId) in connections)
            {
                var response = ToResponse(gameId, participantId, monsters, wave);
                pending[connectionId] = clients.SendToConnectionAsync(connectionId, response);
            }
        }

        PrunePending();
    }

    /// <summary>Группирует соединения по играм, чтобы срез игры строился один раз на игру.</summary>
    private Dictionary<int, List<(string ConnectionId, string ParticipantId)>> GroupConnections()
    {
        var result = new Dictionary<int, List<(string, string)>>();

        foreach (var (connectionId, participantId) in clients.Connections)
        {
            if (pending.TryGetValue(connectionId, out var send) && !send.IsCompleted) continue;

            var gameId = games.GameOf(participantId);
            if (gameId == null) continue;

            if (!result.TryGetValue(gameId.Value, out var list))
            {
                list = new List<(string, string)>();
                result[gameId.Value] = list;
            }

            list.Add((connectionId, participantId));
        }

        return result;
    }

    private void PrunePending()
    {
        if (pending.Count <= clients.Connections.Count) return;

        foreach (var connectionId in pending.Keys)
        {
            if (!clients.Connections.ContainsKey(connectionId)) pending.Remove(connectionId);
        }
    }

    private GameStateResponse ToResponse(int gameId, string participantId, List<MonsterState> monsters, WaveState? wave)
    {
        HeroState? mine = null;
        var enemyHeroes = new List<HeroState>();
        int? enemyTarget = null;

        foreach (var (entityId, hero) in gameData.FindComponents<Hero>(gameId))
        {
            var dtoHero = MapHero(entityId);

            if (hero.Id == participantId)
            {
                // Свой герой отдаётся владельцу даже мёртвым (нужен уровень для окна «ПОРАЖЕНИЕ»).
                mine = dtoHero;
                enemyTarget = gameData.EntityGet<EnemyHudTarget>(entityId)?.TargetId;
            }
            else if (dtoHero.LifeCurrent > 0)
            {
                // Мёртвые чужие герои не отдаются — их никто не рисует.
                enemyHeroes.Add(dtoHero);
            }
        }

        // Фаза мира общая, но конкретному соединению смерть его героя отдаётся как OVER.
        var phase = gameData.Single<GameState>(gameId)?.State ?? EGameState.INIT;
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

    private HeroState MapHero(int id)
    {
        var transform = gameData.EntityGet<Transform2D>(id);
        var velocity = gameData.EntityGet<Velocity>(id);
        var health = gameData.EntityGet<Health>(id);
        var experience = gameData.EntityGet<Experience>(id);
        var attributes = attrService.Attributes(id);
        var body = gameData.EntityGet<Rigidbody>(id);
        var attackReady = gameData.EntityGet<AttackCooldown>(id) == null;

        var equipment = gameData.EntityGet<Equipment>(id);
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
            ToHeroStats(attributes),
            gameData.EntityHas<Ghost>(id));
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

    private WaveState? MapWave(int gameId)
    {
        var wave = gameData.Single<Wave>(gameId);
        return wave == null ? null : new WaveState(wave.Lvl, wave.SpawnMax, wave.Spawned, wave.PrepareTimer);
    }

    private List<MonsterState> MapMonsters(int gameId)
    {
        var result = new List<MonsterState>();

        foreach (var id in gameData.Query<Monster, Transform2D, Rigidbody, Health, EntityAttributes>(gameId))
        {
            var transform = gameData.EntityGet<Transform2D>(id);
            var velocity = gameData.EntityGet<Velocity>(id);
            var body = gameData.EntityGet<Rigidbody>(id);
            var health = gameData.EntityGet<Health>(id);
            var monster = gameData.EntityGet<Monster>(id);
            var equipment = gameData.EntityGet<Equipment>(id);
            var attributes = attrService.Attributes(id);
            var attackReady = gameData.EntityGet<AttackCooldown>(id) == null;

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
