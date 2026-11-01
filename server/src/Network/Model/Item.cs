namespace BubleRpg.Network.Model;

/// <summary>
/// Предмет добычи целиком: клиент показывает список и сравнивает характеристики, поэтому
/// приходят моды и итоговые значения. Иконка едет ссылкой на CDN, а не картинкой: клиент
/// сам решает, как её показать. Текст модов по-прежнему собирается на клиенте.
/// </summary>
public sealed record Item(
    string Id,
    string Slot,
    string Name,
    string Class,
    string Rarity,
    int Level,
    ItemRequirements Requirements,
    IReadOnlyDictionary<string, double> Implicits,
    IReadOnlyDictionary<string, double> Explicits,
    IReadOnlyDictionary<string, double> Base,
    IReadOnlyDictionary<string, double> Final,
    string ImageUrl,
    string Tag);

/// <summary>Требования к ношению: минимумы характеристик, а не бонусы.</summary>
public sealed record ItemRequirements(
    double Str,
    double Dex,
    double Int);
