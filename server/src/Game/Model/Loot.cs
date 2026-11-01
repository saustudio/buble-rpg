namespace BubleRpg.Server.Game.Model;

/// <summary>
/// Добыча героя, сгруппированная по трупам: ключ — id сущности жертвы (он же <c>BagId</c> на клиенте).
/// С одного трупа берётся ровно один предмет, поэтому мешок уходит клиенту целиком.
/// Любая мутация проходит через <see cref="AddBag"/>/<see cref="TakeBag"/> и двигает <see cref="Revision"/> —
/// ревизия единственный признак изменения домена для сети. Метаданные жертвы не храним.
/// </summary>
public sealed class Loot
{
    public long Revision { get; private set; }

    public Dictionary<int, List<Item>> ItemList { get; } = new();

    /// <summary>Кладёт мешок трупа; повторный вызов на тот же ключ заменяет содержимое.</summary>
    public void AddBag(int target, List<Item> items)
    {
        ItemList[target] = items;
        Revision++;
    }

    /// <summary>Забирает мешок целиком; нет мешка — ревизия не двигается.</summary>
    public List<Item>? TakeBag(int target)
    {
        if (!ItemList.Remove(target, out var items)) return null;

        Revision++;
        return items;
    }
}
