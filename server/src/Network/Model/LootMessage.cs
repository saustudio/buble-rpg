namespace BubleRpg.Network.Model;

/// <summary>
/// Добыча участника: мешки с убитых. Отправляется отдельным событием <c>"Loot"</c> только при
/// изменении набора, а не в снимке каждый тик.
/// </summary>
public sealed record LootMessage(
    IReadOnlyList<LootDrop> Drops);

/// <summary>
/// Мешок с одного трупа. С одного убитого берётся ровно один предмет, остальные сгорают,
/// поэтому мешок уходит клиенту целиком — иначе выбор одного предмета удалял бы невидимое.
/// <see cref="BagId"/> — id сущности жертвы, устойчивый адрес мешка в рамках жизни героя.
/// </summary>
public sealed record LootDrop(
    int BagId,
    IReadOnlyList<Item> Items);
