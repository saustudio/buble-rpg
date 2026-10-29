using BubleRpg.Server.Game.Model;
using BubleRpg.Network.Model;
using BubleRpg.Network.Services;
using BubleRpg.Server.Application.Services;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Network.Services;

public sealed class NetworkInputService(
    NetworkDataService data,
    GameDataService game) : IApplicationService
{
    public void Run(double deltaSeconds)
    {
        while (data.TryRead(out var entry)) ToGame(entry);
    }

    private void ToGame(NetworkData entry)
    {
        switch (entry)
        {
            case MoveData move:
                ToMoveTarget(move);
                break;

            case LevelBonusChoiceData bonus:
                ToBonusChoice(bonus.Id, bonus.BonusId, EBonusSource.Level);
                break;

            case WaveBonusChoiceData bonus:
                ToBonusChoice(bonus.Id, bonus.BonusId, EBonusSource.Wave);
                break;

            case LootPickData loot:
                ToLootPick(loot.Id, loot.ItemId);
                break;

            case HeroSpawnData spawn:
                ToSpawnRequest(spawn.Id);
                break;
        }
    }

    private void ToMoveTarget(MoveData move)
    {
        if (!double.IsFinite(move.X) || !double.IsFinite(move.Y)) return;

        var heroId = FindHero(move.Id);
        if (heroId == null) return;

        var target = game.EntityGet<MoveTarget>(heroId.Value);
        if (target == null)
        {
            game.EntitySet(heroId.Value, new MoveTarget { X = move.X, Y = move.Y });
            return;
        }

        target.X = move.X;
        target.Y = move.Y;
    }

    private void ToBonusChoice(string participantId, string bonusId, EBonusSource source)
    {
        var heroId = FindHero(participantId);
        if (heroId == null) return;

        var choice = game.EntityGet<BonusChoice>(heroId.Value);
        if (choice == null)
        {
            game.EntitySet(heroId.Value, new BonusChoice { BonusId = bonusId, Source = source });
            return;
        }

        choice.BonusId = bonusId;
        choice.Source = source;
    }

    private void ToLootPick(string participantId, string itemId)
    {
        var heroId = FindHero(participantId);
        if (heroId == null) return;

        var pick = game.EntityGet<LootPick>(heroId.Value);
        if (pick == null)
        {
            game.EntitySet(heroId.Value, new LootPick { ItemId = itemId });
            return;
        }

        pick.ItemId = itemId;
    }

    private void ToSpawnRequest(string participantId)
    {
        var entity = game.EntityCreate();
        game.EntitySet(entity, new HeroSpawnRequest { Id = participantId });
    }

    private int? FindHero(string participantId)
    {
        foreach (var (entityId, hero) in game.FindComponents<Hero>())
        {
            if (hero.Id == participantId) return entityId;
        }

        return null;
    }
}
