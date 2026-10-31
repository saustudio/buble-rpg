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
        Unit? myHero = null;
        var enemyHeroes = new List<Unit>();
        var monsters = new List<Unit>();
        int? enemyTarget = null;

        foreach (var (entityId, hero) in game.FindComponents<BubleRpg.Server.Game.Model.Hero>(gameId))
        {
            var unit = MapUnit(entityId);

            if (hero.Id == participantId)
            {
                // Свой герой отдаётся владельцу даже мёртвым (нужен уровень для окна «ПОРАЖЕНИЕ»).
                myHero = unit;
                enemyTarget = game.EntityGet<EnemyHudTarget>(entityId)?.TargetId;
            }
            else if (unit.Vitals.LifeCurrent > 0)
            {
                // Мёртвые чужие герои не отдаются — их никто не рисует.
                enemyHeroes.Add(unit);
            }
        }

        foreach (var entityId in game.Query<Monster, Transform2D, Rigidbody, Health, EntityAttributes>(gameId))
        {
            monsters.Add(MapUnit(entityId));
        }

        // Фаза мира общая, но конкретному соединению смерть его героя отдаётся как OVER.
        var phase = game.Single<GameState>(gameId)?.State ?? EGameState.INIT;
        if (myHero != null && myHero.Vitals.LifeCurrent <= 0) phase = EGameState.OVER;

        return new GameStateMessage(
            Arena.Width,
            Arena.Height,
            phase,
            myHero,
            enemyHeroes,
            monsters,
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

    /// <summary>
    /// Собирает юнита из компонентов. Герой и монстр отличаются только тем, какие компоненты
    /// заполнены: опыт есть у героя, уровень монстра задан волной, остальное общее.
    /// </summary>
    private Unit MapUnit(int id)
    {
        // Атрибуты — самый дорогой расчёт (бонусы и предметы), считаем один раз на все блоки.
        var attributes = attrService.Attributes(id);

        return new Unit(
            id,
            MapLocation(id),
            MapVitals(id, attributes),
            MapAttack(id, attributes),
            MapAttributes(id, attributes),
            MapOffence(attributes),
            MapDefence(attributes),
            MapProgress(id),
            MapEquipment(id),
            game.EntityHas<Ghost>(id));
    }

    private UnitLocation MapLocation(int id)
    {
        var transform = game.EntityGet<Transform2D>(id);
        var velocity = game.EntityGet<Velocity>(id);

        return new UnitLocation(
            transform?.X ?? 0,
            transform?.Y ?? 0,
            velocity?.DirX ?? 0,
            velocity?.DirY ?? 0);
    }

    private UnitVitals MapVitals(int id, EntityAttributes attributes)
    {
        var health = game.EntityGet<Health>(id);

        var lifeCurrent = health == null || double.IsNaN(health.LifeCurrent)
            ? attributes.LifeMax
            : health.LifeCurrent;
        var esCurrent = health == null || double.IsNaN(health.EsCurrent)
            ? attributes.ES
            : health.EsCurrent;

        return new UnitVitals(
            lifeCurrent,
            attributes.LifeMax,
            esCurrent,
            attributes.ES,
            attributes.LifePerSecond,
            attributes.LifePerKill);
    }

    private UnitAttack MapAttack(int id, EntityAttributes attributes)
    {
        return new UnitAttack(
            attributes.AttackRange,
            game.EntityGet<AttackCooldown>(id) == null);
    }

    private UnitAttributes MapAttributes(int id, EntityAttributes attributes)
    {
        var body = game.EntityGet<Rigidbody>(id);

        return new UnitAttributes(
            attributes.Str,
            attributes.Dex,
            attributes.Int,
            body?.Size ?? 25,
            attributes.MovementSpeed);
    }

    private static UnitOffence MapOffence(EntityAttributes attributes)
    {
        return new UnitOffence(
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
            attributes.Stun);
    }

    private static UnitDefence MapDefence(EntityAttributes attributes)
    {
        return new UnitDefence(
            attributes.Armour,
            attributes.PhysReduction,
            attributes.Evasion,
            attributes.Block,
            attributes.PhysReflect,
            attributes.StunReduction,
            attributes.FireResist,
            attributes.ColdResist,
            attributes.LightResist);
    }

    private UnitProgress MapProgress(int id)
    {
        var experience = game.EntityGet<Experience>(id);
        if (experience != null) return new UnitProgress(experience.Lvl, experience.Value, experience.Next);

        // У монстра прогресса нет: уровень задаёт волна.
        var monster = game.EntityGet<Monster>(id);
        return new UnitProgress(monster?.Level ?? 1, 0, 0);
    }

    private UnitEquipment MapEquipment(int id)
    {
        var equipment = game.EntityGet<Equipment>(id);
        if (equipment == null) return new UnitEquipment(Array.Empty<UnitItem>());

        var items = new List<UnitItem>();

        foreach (var slot in Enum.GetValues<EEquipSlot>())
        {
            if (!equipment.Slots.TryGetValue(slot, out var item) || item == null) continue;
            items.Add(new UnitItem(Slot(slot), item.Name, Rarity(item.Rarity)));
        }

        return new UnitEquipment(items);
    }

    private WaveState? MapWave(int gameId)
    {
        var wave = game.Single<Wave>(gameId);
        return wave == null ? null : new WaveState(wave.Lvl, wave.SpawnMax, wave.Spawned, wave.PrepareTimer);
    }

    /// <summary>Слот уходит строкой: enum без конвертера сериализовался бы числом.</summary>
    private static string Slot(EEquipSlot slot) => slot.ToString().ToLowerInvariant();

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
