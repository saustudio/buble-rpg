namespace BubleRpg.Server.Game.Services;

public sealed class GameDataService(ILogger<GameDataService> logger)
{
    private Dictionary<int, HashSet<Type>> entities = new();
    private Dictionary<Type, Dictionary<int, object>> models = new();
    private int nextId = 1;

    public int EntityCreate()
    {
        var id = nextId++;
        entities[id] = new HashSet<Type>();
        return id;
    }

    public void EntityRemove(int entityId)
    {
        if (!entities.TryGetValue(entityId, out var typeList)) return;

        foreach (var type in typeList)
            if (models.TryGetValue(type, out var bucket)) bucket.Remove(entityId);

        entities.Remove(entityId);
    }

    public void EntitySet<T>(int entityId, T component) where T : class
    {
        if (!entities.TryGetValue(entityId, out var typeList))
            throw new InvalidOperationException($"[GameDataService] Сущность {entityId} не найдена");

        var type = typeof(T);

        if (typeList.Contains(type)) logger.LogWarning($"Сущность {entityId} заменяет компонент {type.Name}");

        if (!models.TryGetValue(type, out var bucket))
        {
            bucket = new Dictionary<int, object>();
            models[type] = bucket;
        }

        bucket[entityId] = component;
        typeList.Add(type);
    }

    public T EntityGet<T>(int entityId) where T : class
    {
        if (!models.TryGetValue(typeof(T), out var bucket)) return null!;
        return bucket.TryGetValue(entityId, out var component) ? (T)component : null!;
    }

    public bool EntityHas<T>(int entityId) where T : class
    {
        return models.TryGetValue(typeof(T), out var bucket) && bucket.ContainsKey(entityId);
    }

    public void EntityRemoveSet<T>(int entityId) where T : class
    {
        var type = typeof(T);

        if (models.TryGetValue(type, out var bucket))
            bucket.Remove(entityId);

        if (entities.TryGetValue(entityId, out var typeList))
            typeList.Remove(type);
    }

    public int? FindEntity<T>() where T : class
    {
        if (!models.TryGetValue(typeof(T), out var bucket)) return null;
        foreach (var id in bucket.Keys) return id;
        return null;
    }

    public List<int> FindEntitys<T>() where T : class
    {
        if (!models.TryGetValue(typeof(T), out var bucket)) return new List<int>();
        return bucket.Keys.ToList();
    }

    public List<(int EntityId, T Component)> FindComponents<T>() where T : class
    {
        if (!models.TryGetValue(typeof(T), out var bucket)) return new List<(int, T)>();
        return bucket.Select(pair => (pair.Key, (T)pair.Value)).ToList();
    }

    public List<int> Query(params Type[] types)
    {
        var result = new List<int>();

        foreach (var (id, components) in entities)
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

    public List<int> Query<T1>() where T1 : class => Query(typeof(T1));

    public List<int> Query<T1, T2>()
        where T1 : class
        where T2 : class
        => Query(typeof(T1), typeof(T2));

    public List<int> Query<T1, T2, T3>()
        where T1 : class
        where T2 : class
        where T3 : class
        => Query(typeof(T1), typeof(T2), typeof(T3));

    public List<int> Query<T1, T2, T3, T4>()
        where T1 : class
        where T2 : class
        where T3 : class
        where T4 : class
        => Query(typeof(T1), typeof(T2), typeof(T3), typeof(T4));

    public List<int> Query<T1, T2, T3, T4, T5>()
        where T1 : class
        where T2 : class
        where T3 : class
        where T4 : class
        where T5 : class
        => Query(typeof(T1), typeof(T2), typeof(T3), typeof(T4), typeof(T5));

    public int? First(params Type[] types)
    {
        var result = Query(types);
        return result.Count > 0 ? result[0] : null;
    }

    public int? First<T1>() where T1 : class => First(typeof(T1));

    public int? First<T1, T2>()
        where T1 : class
        where T2 : class
        => First(typeof(T1), typeof(T2));

    public int? First<T1, T2, T3>()
        where T1 : class
        where T2 : class
        where T3 : class
        => First(typeof(T1), typeof(T2), typeof(T3));

    public T Single<T>() where T : class
    {
        var entityId = First<T>();
        if (entityId == null) return null!;
        return EntityGet<T>(entityId.Value);
    }

    public void Clear()
    {
        entities = new Dictionary<int, HashSet<Type>>();
        models = new Dictionary<Type, Dictionary<int, object>>();
        nextId = 1;
    }
}
