using BubleRpg.Network.Model;
using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Network.Services;

/// <summary>
/// Отображение доменных игровых данных в сетевую модель <see cref="GameStateMessage"/>.
/// Живёт отдельно от транспорта: <see cref="NetworkService"/> только собирает, копит и рассылает.
/// </summary>
public sealed class GameStateMapper(
    GameDbContext game,
    EntityAttributesService attrService)
{
    /// <summary>Собирает персональный снимок игры для конкретного участника.</summary>
    public GameStateMessage Map(int gameId, string participantId)
    {
        HeroState? myHero = null;
        var enemyHeroes = new List<HeroState>();
        int? enemyTarget = null;

        foreach (var (entityId, hero) in game.FindComponents<Hero>(gameId))
        {
            var state = MapHero(entityId);

            if (hero.Id == participantId)
            {
                // Свой герой отдаётся владельцу даже мёртвым (нужен уровень для окна «ПОРАЖЕНИЕ»).
                myHero = state;
                enemyTarget = game.EntityGet<EnemyHudTarget>(entityId)?.TargetId;
            }
            else if (state.LifeCurrent > 0)
            {
                // Мёртвые чужие герои не отдаются — их никто не рисует.
                enemyHeroes.Add(state);
            }
        }

        // Фаза мира общая, но конкретному соединению смерть его героя отдаётся как OVER.
        var phase = game.Single<GameState>(gameId)?.State ?? EGameState.INIT;
        if (myHero != null && myHero.LifeCurrent <= 0) phase = EGameState.OVER;

        return new GameStateMessage(
            Arena.Width,
            Arena.Height,
            phase,
            myHero,
            enemyHeroes,
            MapMonsters(gameId),
            MapWave(gameId),
            enemyTarget,
            Collect<AttackHit>(gameId),
            Collect<DefenceEvasion>(gameId),
            Collect<DefenceBlock>(gameId));
    }

    /// <summary>События боя текущего тика: каждая коллекция — свой тип события.</summary>
    public List<T> Collect<T>(int gameId) where T : class
    {
        var result = new List<T>();

        foreach (var entityId in game.Query<T>(gameId))
        {
            var component = game.EntityGet<T>(entityId);
            if (component != null) result.Add(component);
        }

        return result;
    }

    private HeroState MapHero(int id)
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
            attributes.ES,
            weapon?.Name,
            weapon == null ? null : Rarity(weapon.Rarity),
            ToHeroStats(attributes),
            game.EntityHas<Ghost>(id));
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
        var wave = game.Single<Wave>(gameId);
        return wave == null ? null : new WaveState(wave.Lvl, wave.SpawnMax, wave.Spawned, wave.PrepareTimer);
    }

    private List<MonsterState> MapMonsters(int gameId)
    {
        var result = new List<MonsterState>();

        foreach (var id in game.Query<Monster, Transform2D, Rigidbody, Health, EntityAttributes>(gameId))
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
                attackReady));
        }

        return result;
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
