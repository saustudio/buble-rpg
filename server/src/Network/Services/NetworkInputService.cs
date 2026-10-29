using BubleRpg.Server.Game.Model;
using BubleRpg.Network.Model;
using BubleRpg.Network.Services;
using BubleRpg.Server.Application.Services;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Network.Services;

public sealed class NetworkInputService(
    NetworkDataService data,
    GameDbContext game,
    GameService games) : IApplicationService
{
    public void Run(double deltaSeconds)
    {
        while (data.TryRead(out var entry)) ToGame(entry);
    }

    private void ToGame(NetworkData entry)
    {
        switch (entry)
        {
            case HeroSpawnData spawn:
                ToSpawnRequest(spawn.Id, spawn.GameId);
                break;

            case HeroDisconnectData disconnect:
                games.RemoveParticipant(disconnect.Id);
                break;

            case HeroActionData action:
                ToHeroAction(action);
                break;
        }
    }

    /// <summary>Действия участника применяются в контексте его игры.</summary>
    private void ToHeroAction(HeroActionData action)
    {
        var gameId = games.GameOf(action.Id);
        if (gameId == null) return;

        switch (action)
        {
            case MoveData move:
                ToMoveTarget(gameId.Value, move);
                break;

            case LevelBonusChoiceData bonus:
                ToBonusChoice(gameId.Value, bonus.Id, bonus.BonusId, EBonusSource.Level);
                break;

            case WaveBonusChoiceData bonus:
                ToBonusChoice(gameId.Value, bonus.Id, bonus.BonusId, EBonusSource.Wave);
                break;

            case LootPickData loot:
                ToLootPick(gameId.Value, loot.Id, loot.ItemId);
                break;
        }
    }

    private void ToMoveTarget(int gameId, MoveData move)
    {
        if (!double.IsFinite(move.X) || !double.IsFinite(move.Y)) return;

        var heroId = FindHero(gameId, move.Id);
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

    private void ToBonusChoice(int gameId, string participantId, string bonusId, EBonusSource source)
    {
        var heroId = FindHero(gameId, participantId);
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

    private void ToLootPick(int gameId, string participantId, string itemId)
    {
        var heroId = FindHero(gameId, participantId);
        if (heroId == null) return;

        var pick = game.EntityGet<LootPick>(heroId.Value);
        if (pick == null)
        {
            game.EntitySet(heroId.Value, new LootPick { ItemId = itemId });
            return;
        }

        pick.ItemId = itemId;
    }

    private void ToSpawnRequest(string participantId, int? preferredGameId)
    {
        var gameId = games.ResolveSpawnGame(participantId, preferredGameId);

        var entity = game.EntityCreate(gameId);
        game.EntitySet(entity, new HeroSpawnRequest { Id = participantId });
    }

    private int? FindHero(int gameId, string participantId)
    {
        foreach (var (entityId, hero) in game.FindComponents<Hero>(gameId))
        {
            if (hero.Id == participantId) return entityId;
        }

        return null;
    }
}
