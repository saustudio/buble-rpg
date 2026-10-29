namespace BubleRpg.Server.Game.Model;

public sealed class Loot
{
    public Loot()
    {
        ItemList = new Dictionary<int, List<Item>>();
    }

    public Loot(Dictionary<int, List<Item>> itemList)
    {
        ItemList = itemList;
    }

    public Dictionary<int, List<Item>> ItemList { get; set; }
}
