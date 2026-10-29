using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class SpawnSystem(
    GameDbContext store,
    EntityAttributesService attrService,
    WaveService waveService) : IGameSystem
{
    /// <summary>Сколько секунд новый герой остаётся духом.</summary>
    private const double GhostSeconds = 5;

    public void Update(double deltaTime)
    {
        foreach (var gameId in store.GameIds())
        {
            ProcessHeroSpawnRequests(gameId);

            var gs = store.Single<GameState>(gameId);
            if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) continue;

            if (gs.State == EGameState.INIT)
            {
                foreach (var entity in store.Query<Monster>(gameId)) store.EntityRemove(entity);
                continue;
            }

            var deathList = store.Query<Monster, Health>(gameId)
                .Where(entity => store.EntityGet<Health>(entity).LifeCurrent <= 0)
                .ToList();

            foreach (var entity in deathList) store.EntityRemove(entity);

            var wave = store.Single<Wave>(gameId);
            if (wave == null) continue;
            if (wave.PrepareTimer > 0) continue;
            if (wave.Spawned >= wave.SpawnMax) continue;

            wave.SpawnTimer -= deltaTime;
            if (wave.SpawnTimer > 0) continue;

            SpawnMonster(gameId, wave);
            wave.Spawned++;
            wave.SpawnTimer = wave.SpawnInterval;
        }
    }

    private void ProcessHeroSpawnRequests(int gameId)
    {
        foreach (var (entityId, request) in store.FindComponents<HeroSpawnRequest>(gameId))
        {
            store.EntityRemove(entityId);
            SpawnHero(gameId, request.Id);
        }
    }

    private int? FindHero(int gameId, string id)
    {
        foreach (var (entityId, hero) in store.FindComponents<Hero>(gameId))
        {
            if (hero.Id == id) return entityId;
        }

        return null;
    }

    private bool IsHeroAlive(int heroId)
    {
        if (!store.EntityHas<Hero>(heroId)) return false;

        var health = store.EntityGet<Health>(heroId);
        return health == null || double.IsNaN(health.LifeCurrent) || health.LifeCurrent > 0;
    }

    private int SpawnHero(int gameId, string id)
    {
        // Живого героя этого участника переиспользуем, мёртвого убираем и создаём нового.
        var existing = FindHero(gameId, id);
        if (existing != null)
        {
            if (IsHeroAlive(existing.Value)) return existing.Value;
            store.EntityRemove(existing.Value);
        }

        var baseStats = new EntityAttributes(15, 15, 15, default, default, default, default, 38, default, default, default, default, default, default, default, default, default, default, default, default, default, default, default, default, default, default, default, default, default, default, default, 50, 20, default, 2);

        var equipment = new Equipment();
        var weapon = ItemFactory.Random(1, ItemTag.WEAPON, baseStats.Str, baseStats.Dex, baseStats.Int);
        if (weapon != null)
        {
            EquipmentService.Equip(equipment, weapon);
        }

        var weaponRange = 0d;
        if (weapon != null && weapon.Final.TryGetValue(AffixType.ATTACK_RANGE, out var range))
        {
            weaponRange = range;
        }

        if (weaponRange < 100)
        {
            AddHeroEquipment(equipment, ItemTag.HELM, baseStats);
            AddHeroEquipment(equipment, ItemTag.BODY_ARMOUR, baseStats);
            AddHeroEquipment(equipment, ItemTag.GLOVES, baseStats);
            AddHeroEquipment(equipment, ItemTag.AMULET, baseStats);
            AddHeroEquipment(equipment, ItemTag.RING, baseStats);
            AddHeroEquipment(equipment, ItemTag.BELT, baseStats);
            AddHeroEquipment(equipment, ItemTag.BOOTS, baseStats);
        }

        var hero = store.EntityCreate(gameId);
        store.EntitySet(hero, equipment);
        store.EntitySet(hero, baseStats);
        store.EntitySet(hero, new Hero { Id = id });
        store.EntitySet(hero, new Prey());
        store.EntitySet(hero, new Health());
        store.EntitySet(hero, new Experience());
        // Фракция героя — его id сущности: у каждого участника своя, монстры — 0.
        store.EntitySet(hero, new Fraction(hero));
        store.EntitySet(hero, new Velocity());
        store.EntitySet(hero, new Rigidbody(25, 50));
        store.EntitySet(hero, new Transform2D(600, 400));
        // Новый герой появляется духом: несколько секунд неуязвим и вне боя.
        store.EntitySet(hero, new Ghost { Remaining = GhostSeconds });

        return hero;
    }

    private void SpawnMonster(int gameId, Wave wave)
    {
        var stats = waveService.Stats(wave.Modifiers);
        var level = wave.SpawnLevel;

        var bossMult = wave.Lvl % 5 == 0 && wave.Spawned == 0 ? 3 : 1;
        var eliteMult = Random.Shared.NextDouble() < stats.EliteChance ? 2 : 1;
        var powerMult = bossMult * eliteMult;

        var type = ESpawnEntityClass.WARIOR;
        var typeRoll = Random.Shared.NextDouble();
        if (wave.Lvl > 2 && typeRoll < 0.3) type = ESpawnEntityClass.MONC;
        if (wave.Lvl > 4 && typeRoll < 0.1) type = ESpawnEntityClass.ASSASIN;

        var archetype = Archetype(type);
        var attributes = new EntityAttributes(
            Str: (archetype.Str + level * powerMult) * stats.DamageMult,
            Dex: (archetype.Dex + level * powerMult) * stats.DamageMult,
            Int: (archetype.Int + level * powerMult) * stats.DamageMult,
            LifeMax: archetype.BaseHP * powerMult * stats.HealthMult,
            FireResist: stats.Resist,
            ColdResist: stats.Resist,
            LightResist: stats.Resist,
            MovementSpeed: archetype.MoveSpeed * stats.SpeedMult);

        var equipment = CreateEquipment(
            level,
            attributes.Str,
            attributes.Dex,
            attributes.Int,
            stats.ItemRarityBonus,
            stats.ItemQuantityMult);

        var size = archetype.Size + powerMult * 5;
        var mass = 50 * powerMult;

        var monster = store.EntityCreate(gameId);
        store.EntitySet(monster, attributes);
        store.EntitySet(monster, SpawnPosition(size));
        store.EntitySet(monster, new Fraction(0));
        store.EntitySet(monster, new Pursuer());
        store.EntitySet(monster, new Velocity());
        store.EntitySet(monster, new Rigidbody(size, mass));
        store.EntitySet(monster, new Health());
        store.EntitySet(monster, equipment);

        var final = attrService.Attributes(monster);
        var power = Power(final);

        var rarity = EMonsterRarity.COMMON;
        if (power > 90) rarity = EMonsterRarity.ELITE;
        else if (power > 40) rarity = EMonsterRarity.RARE;

        store.EntitySet(monster, new Monster(power, level, rarity) { Type = type });
    }

    private (double BaseHP, double Size, double MoveSpeed, double Str, double Dex, double Int) Archetype(
        ESpawnEntityClass type)
    {
        return type switch
        {
            ESpawnEntityClass.WARIOR => (38, 20, 20, 15, 0, 0),
            ESpawnEntityClass.ASSASIN => (38, 20, 10, 0, 15, 0),
            ESpawnEntityClass.MONC => (38, 20, 10, 0, 0, 15),
            _ => (38, 20, 10, 0, 0, 0)
        };
    }

    private Transform2D SpawnPosition(double size)
    {
        const double width = Arena.Width;
        const double height = Arena.Height;

        var x = Random.Shared.NextDouble() * width;
        var y = Random.Shared.NextDouble() * height;
        var offset = size + 10;
        var side = Random.Shared.Next(4);

        if (side == 0)
        {
            x = Random.Shared.NextDouble() * width;
            y = -offset;
        }
        else if (side == 1)
        {
            x = Random.Shared.NextDouble() * width;
            y = height + offset;
        }
        else if (side == 2)
        {
            x = -offset;
            y = Random.Shared.NextDouble() * height;
        }
        else
        {
            x = width + offset;
            y = Random.Shared.NextDouble() * height;
        }

        x = Math.Min(width + 20, Math.Max(-20, x));
        y = Math.Min(height + 20, Math.Max(-20, y));

        return new Transform2D(x, y);
    }

    private double Power(EntityAttributes stats)
    {
        var hitDamage = Avg(stats.PhysicalDamageMin, stats.PhysicalDamageMax);
        var spellDamage = Avg(stats.FireDamageMin, stats.FireDamageMax)
            + Avg(stats.ColdDamageMin, stats.ColdDamageMax)
            + Avg(stats.LightDamageMin, stats.LightDamageMax);
        var critMult = 1 + stats.CriticalChance * (stats.CriticalMultiplier - 1);
        var offence = (hitDamage + spellDamage) * stats.AttackSpeed * critMult;

        var averageResist = (stats.FireResist + stats.ColdResist + stats.LightResist) / 3;
        var resistMult = 1 / Math.Max(0.1, 1 - averageResist / 100);
        var armourMult = 1 + Math.Log10(1 + stats.Armour / 50) * 0.5;
        var evasionMult = 1 + stats.Evasion / (stats.Evasion + 200);
        var blockMult = 1 + stats.Block * 0.5;
        var defence = (stats.LifeMax + stats.ES) * resistMult * armourMult * evasionMult * blockMult;

        return Math.Sqrt(Math.Max(0, offence)) * 2 + Math.Sqrt(Math.Max(0, defence)) * 0.6;
    }

    private Equipment CreateEquipment(
        int level,
        double str,
        double dex,
        double intValue,
        double rarityBonus,
        double quantityMult)
    {
        var rarityProgress = Math.Min(1, Math.Max(0, level / 50d + rarityBonus / 100));
        var commonChance = 0.7 * (1 - rarityProgress) + 0.1 * rarityProgress;
        var magicChance = 0.9 * (1 - rarityProgress) + 0.4 * rarityProgress;

        var itemCount = 2;
        var rarityRoll = Random.Shared.NextDouble();
        if (rarityRoll < commonChance) itemCount = 0;
        else if (rarityRoll < magicChance) itemCount = 1;

        var equipment = new Equipment();
        var weapon = ItemFactory.Random(level, ItemTag.WEAPON, str, dex, intValue);
        if (weapon != null)
        {
            EquipmentService.Equip(equipment, weapon);
        }

        if (itemCount == 0) return equipment;

        var slotChances = new List<(string Tag, double Chance)>
        {
            (ItemTag.HELM, 0.7),
            (ItemTag.BODY_ARMOUR, 0.7),
            (ItemTag.GLOVES, 0.7),
            (ItemTag.AMULET, 0.7),
            (ItemTag.RING, 0.7),
            (ItemTag.BELT, 0.7),
            (ItemTag.BOOTS, 0.7)
        };

        var maxItems = itemCount == 1 ? 2 + Random.Shared.Next(3) - 1 : slotChances.Count;

        for (var i = slotChances.Count - 1; i > 0; i--)
        {
            var j = Random.Shared.Next(i + 1);
            (slotChances[i], slotChances[j]) = (slotChances[j], slotChances[i]);
        }

        var added = 0;

        foreach (var (tag, chance) in slotChances)
        {
            if (added >= maxItems) break;
            if (Random.Shared.NextDouble() > Math.Min(1, chance * quantityMult)) continue;

            var item = ItemFactory.Random(level, tag, str, dex, intValue);
            if (item == null) continue;

            EquipmentService.Equip(equipment, item);
            added++;
        }

        return equipment;
    }

    private void AddHeroEquipment(Equipment equipment, string tag, EntityAttributes stats)
    {
        var item = ItemFactory.Random(1, tag, stats.Str, stats.Dex, stats.Int);
        if (item != null) EquipmentService.Equip(equipment, item);
    }

    private static double Avg(double min, double max)
    {
        return (min + max) * 0.5;
    }
}
