namespace BubleRpg.Server.Game.Services;

/// <summary>
/// Тупое хранилище игровых данных, партиционированное по игре: у каждой игры свои сущности и
/// компоненты, но идентификаторы сущностей сквозные — по <c>entityId</c> однозначно
/// восстанавливается игра через карту принадлежности. Методы перечисления/создания
/// принимают <c>gameId</c>, доступ по идентификатору — только <c>entityId</c>.
/// Решений здесь нет: только коллекции и доступ к ним.
/// </summary>
public sealed class GameDbContext(ILogger<GameDbContext> logger)
{
    private sealed class GamePartition
    {
        public Dictionary<int, HashSet<Type>> Entities { get; } = new();
        public Dictionary<Type, Dictionary<int, object>> Models { get; } = new();
    }

    private Dictionary<int, GamePartition> partitions = new();
    private Dictionary<int, int> entityGame = new();
    private int nextId = 1;
    private int nextGameId = 1;

    /// <summary>Идентификаторы существующих игр.</summary>
    public IReadOnlyList<int> GameIds() => partitions.Keys.ToList();

    public bool HasGame(int gameId) => partitions.ContainsKey(gameId);

    /// <summary>
    /// Выделяет id и заводит пустую партицию игры. Модели (фазу, состав) заполняет вызывающий.
    /// </summary>
    public int AddGame()
    {
        var id = nextGameId++;
        partitions[id] = new GamePartition();
        return id;
    }

    public int EntityCreate(int gameId)
    {
        var store = GetOrCreate(gameId);
        var id = nextId++;
        store.Entities[id] = new HashSet<Type>();
        entityGame[id] = gameId;
        return id;
    }

    public void EntityRemove(int entityId)
    {
        if (!entityGame.TryGetValue(entityId, out var gameId)) return;
        if (!partitions.TryGetValue(gameId, out var store)) return;
        if (!store.Entities.TryGetValue(entityId, out var typeList)) return;

        foreach (var type in typeList)
            if (store.Models.TryGetValue(type, out var bucket)) bucket.Remove(entityId);

        store.Entities.Remove(entityId);
        entityGame.Remove(entityId);
    }

    public void EntitySet<T>(int entityId, T component) where T : class
    {
        var store = StoreOf(entityId);
        if (store == null || !store.Entities.TryGetValue(entityId, out var typeList))
            throw new InvalidOperationException($"[GameDbContext] Сущность {entityId} не найдена");

        var type = typeof(T);

        if (typeList.Contains(type)) logger.LogWarning($"Сущность {entityId} заменяет компонент {type.Name}");

        if (!store.Models.TryGetValue(type, out var bucket))
        {
            bucket = new Dictionary<int, object>();
            store.Models[type] = bucket;
        }

        bucket[entityId] = component;
        typeList.Add(type);
    }

    public T EntityGet<T>(int entityId) where T : class
    {
        var store = StoreOf(entityId);
        if (store == null) return null!;
        if (!store.Models.TryGetValue(typeof(T), out var bucket)) return null!;
        return bucket.TryGetValue(entityId, out var component) ? (T)component : null!;
    }

    public bool EntityHas<T>(int entityId) where T : class
    {
        var store = StoreOf(entityId);
        return store != null
            && store.Models.TryGetValue(typeof(T), out var bucket)
            && bucket.ContainsKey(entityId);
    }

    public void EntityRemoveSet<T>(int entityId) where T : class
    {
        var store = StoreOf(entityId);
        if (store == null) return;

        var type = typeof(T);

        if (store.Models.TryGetValue(type, out var bucket))
            bucket.Remove(entityId);

        if (store.Entities.TryGetValue(entityId, out var typeList))
            typeList.Remove(type);
    }

    public int? FindEntity<T>(int gameId) where T : class
    {
        var store = Get(gameId);
        if (store == null) return null;
        if (!store.Models.TryGetValue(typeof(T), out var bucket)) return null;
        foreach (var id in bucket.Keys) return id;
        return null;
    }

    public List<int> FindEntitys<T>(int gameId) where T : class
    {
        var store = Get(gameId);
        if (store == null) return new List<int>();
        if (!store.Models.TryGetValue(typeof(T), out var bucket)) return new List<int>();
        return bucket.Keys.ToList();
    }

    public List<(int EntityId, T Component)> FindComponents<T>(int gameId) where T : class
    {
        var store = Get(gameId);
        if (store == null) return new List<(int, T)>();
        if (!store.Models.TryGetValue(typeof(T), out var bucket)) return new List<(int, T)>();
        return bucket.Select(pair => (pair.Key, (T)pair.Value)).ToList();
    }

    public List<int> Query(int gameId, params Type[] types)
    {
        var result = new List<int>();
        var store = Get(gameId);
        if (store == null) return result;

        foreach (var (id, components) in store.Entities)
        {
            var hasAll = true;
            foreach (var type in types)
            {
                if (!components.Contains(type))
                {
                    hasAll = false;
                    break;
                }
            }

            if (hasAll) result.Add(id);
        }

        return result;
    }

    public List<int> Query<T1>(int gameId) where T1 : class => Query(gameId, typeof(T1));

    public List<int> Query<T1, T2>(int gameId)
        where T1 : class
        where T2 : class
        => Query(gameId, typeof(T1), typeof(T2));

    public List<int> Query<T1, T2, T3>(int gameId)
        where T1 : class
        where T2 : class
        where T3 : class
        => Query(gameId, typeof(T1), typeof(T2), typeof(T3));

    public List<int> Query<T1, T2, T3, T4>(int gameId)
        where T1 : class
        where T2 : class
        where T3 : class
        where T4 : class
        => Query(gameId, typeof(T1), typeof(T2), typeof(T3), typeof(T4));

    public List<int> Query<T1, T2, T3, T4, T5>(int gameId)
        where T1 : class
        where T2 : class
        where T3 : class
        where T4 : class
        where T5 : class
        => Query(gameId, typeof(T1), typeof(T2), typeof(T3), typeof(T4), typeof(T5));

    public int? First(int gameId, params Type[] types)
    {
        var result = Query(gameId, types);
        return result.Count > 0 ? result[0] : null;
    }

    public int? First<T1>(int gameId) where T1 : class => First(gameId, typeof(T1));

    public int? First<T1, T2>(int gameId)
        where T1 : class
        where T2 : class
        => First(gameId, typeof(T1), typeof(T2));

    public int? First<T1, T2, T3>(int gameId)
        where T1 : class
        where T2 : class
        where T3 : class
        => First(gameId, typeof(T1), typeof(T2), typeof(T3));

    public T Single<T>(int gameId) where T : class
    {
        var entityId = First<T>(gameId);
        if (entityId == null) return null!;
        return EntityGet<T>(entityId.Value);
    }

    /// <summary>Полностью удаляет игру вместе со всеми её данными.</summary>
    public void RemoveGame(int gameId)
    {
        if (!partitions.TryGetValue(gameId, out var store)) return;

        foreach (var entityId in store.Entities.Keys) entityGame.Remove(entityId);
        partitions.Remove(gameId);
    }

    public void Clear()
    {
        partitions = new Dictionary<int, GamePartition>();
        entityGame = new Dictionary<int, int>();
        nextId = 1;
        nextGameId = 1;
    }

    private GamePartition GetOrCreate(int gameId)
    {
        if (!partitions.TryGetValue(gameId, out var store))
        {
            store = new GamePartition();
            partitions[gameId] = store;
        }

        return store;
    }

    private GamePartition Get(int gameId)
    {
        return partitions.TryGetValue(gameId, out var store) ? store : null;
    }

    private GamePartition StoreOf(int entityId)
    {
        return entityGame.TryGetValue(entityId, out var gameId) ? Get(gameId) : null;
    }
}
