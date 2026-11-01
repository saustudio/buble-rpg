using BubleRpg.Server.Game.Model;

using Microsoft.Extensions.Logging;

using GameModel = BubleRpg.Server.Game.Model.Game;

namespace BubleRpg.Server.Game.Services;

/// <summary>
/// Бизнес-логика игр (комнат) поверх тупого хранилища <see cref="GameDbContext"/>. Здесь живут
/// правила жизненного цикла игры: кто в какую игру попадает, когда игра завершается, когда
/// уничтожается. Данные (сущности, компоненты, состав) — в контексте, решений он не принимает.
/// Завершённая игра помечается <see cref="EGameState.OVER"/> и пропускается системами.
/// </summary>
public sealed class GameService(
    GameDbContext context,
    EntityAttributesService attrService,
    ILogger<GameService> logger)
{
    /// <summary>Игра, к которой относится участник, либо <c>null</c>, если он ещё не подключён.</summary>
    public int? GameOf(string participantId)
    {
        foreach (var gameId in context.GameIds())
        {
            var game = context.Single<GameModel>(gameId);
            if (game != null && game.Participants.Contains(participantId)) return gameId;
        }

        return null;
    }

    /// <summary>
    /// Выбирает игру для спавна: если участник уже в живой игре — остаётся в ней (подключается к текущей волне);
    /// иначе — указанная игра (будущий явный выбор), случайная живая или новая.
    /// </summary>
    public int ResolveSpawnGame(string participantId, int? preferredGameId = null)
    {
        var currentId = GameOf(participantId);
        if (currentId != null && context.HasGame(currentId.Value) && !IsFinished(currentId.Value))
            return currentId.Value;

        if (currentId != null && context.HasGame(currentId.Value))
            LeaveGame(currentId.Value, participantId);

        var gameId = ChooseGame(preferredGameId);
        AssignParticipant(participantId, gameId);
        return gameId;
    }

    /// <summary>
    /// Убирает участника и его героя из игры; пустую игру уничтожает вместе со всеми данными.
    /// Вызывается с игрового тика, когда участник отключился.
    /// </summary>
    public void RemoveParticipant(string participantId)
    {
        var gameId = GameOf(participantId);
        if (gameId == null) return;

        LeaveGame(gameId.Value, participantId);
    }

    /// <summary>Ставит заявку на спавн героя участника: игру выбирают правила жизненного цикла.</summary>
    public void RequestSpawn(string participantId, int? preferredGameId = null)
    {
        var gameId = ResolveSpawnGame(participantId, preferredGameId);

        var entity = context.EntityCreate(gameId);
        context.EntitySet(entity, new HeroSpawnRequest { Id = participantId });
    }

    /// <summary>Применяет цель движения участника к его герою.</summary>
    public void MoveTo(string participantId, double x, double y)
    {
        if (!double.IsFinite(x) || !double.IsFinite(y)) return;

        var heroId = HeroOf(participantId);
        if (heroId == null) return;

        var target = context.EntityGet<MoveTarget>(heroId.Value);
        if (target == null)
        {
            context.EntitySet(heroId.Value, new MoveTarget { X = x, Y = y });
            return;
        }

        target.X = x;
        target.Y = y;
    }

    /// <summary>Выбор бонуса уровня.</summary>
    public void ChooseLevelBonus(string participantId, string bonusId) => ChooseBonus(participantId, bonusId, EBonusSource.Level);

    /// <summary>Выбор бонуса волны.</summary>
    public void ChooseWaveBonus(string participantId, string bonusId) => ChooseBonus(participantId, bonusId, EBonusSource.Wave);

    /// <summary>
    /// Выбор предмета из мешка. С одного трупа берётся ровно один предмет, остальные сгорают;
    /// заменённый предмет выбрасывается. Мешок адресуется <paramref name="bagId"/> (id трупа),
    /// предмет — <paramref name="itemId"/>. Мёртвый герой, чужая фаза, невыполненные требования
    /// и неизвестный идентификатор отклоняются молча (Debug-лог). Компонент <see cref="Loot"/>
    /// при опустении не удаляется: иначе <c>Revision</c> сбросился бы к 0 и переиспользовался.
    /// </summary>
    public void PickLoot(string participantId, int bagId, string itemId)
    {
        var heroId = HeroOf(participantId);
        if (heroId == null)
        {
            logger.LogDebug("PickLoot: у участника {Participant} нет героя.", participantId);
            return;
        }

        var gameId = GameOf(participantId);
        var gameState = gameId != null ? context.Single<GameState>(gameId.Value) : null;
        if (gameState == null || gameState.State != EGameState.PLAY)
        {
            logger.LogDebug("PickLoot: герой {Hero} вне фазы PLAY.", heroId.Value);
            return;
        }

        var loot = context.EntityGet<Loot>(heroId.Value);
        if (loot == null) return;

        // NaN — здоровье ещё не инициализировано, то есть герой полон.
        var health = context.EntityGet<Health>(heroId.Value);
        if (health != null && !double.IsNaN(health.LifeCurrent) && health.LifeCurrent <= 0)
        {
            logger.LogDebug("PickLoot: герой {Hero} мёртв.", heroId.Value);
            return;
        }

        var equipment = context.EntityGet<Equipment>(heroId.Value);
        if (equipment == null) return;

        if (!loot.ItemList.TryGetValue(bagId, out var items))
        {
            logger.LogDebug("PickLoot: у героя {Hero} нет мешка {Bag}.", heroId.Value, bagId);
            return;
        }

        var picked = items.FirstOrDefault(item => item.Id == itemId);
        if (picked == null)
        {
            logger.LogDebug("PickLoot: в мешке {Bag} нет предмета {Item}.", bagId, itemId);
            return;
        }

        // Та же формула, что на клиенте (ItemService.RequirementsMet): порог «ровно» проходит.
        // TODO: self-replacement — Attributes включает Final заменяемого предмета, после Equip требования могут не выполняться.
        var attrs = attrService.Attributes(heroId.Value);
        if (picked.Str > attrs.Str || picked.Dex > attrs.Dex || picked.Int > attrs.Int)
        {
            logger.LogDebug(
                "PickLoot: требования не выполнены (нужно {Str}/{Dex}/{Int}, есть {HaveStr}/{HaveDex}/{HaveInt}).",
                picked.Str, picked.Dex, picked.Int, attrs.Str, attrs.Dex, attrs.Int);
            return;
        }

        EEquipSlot slot;
        try { slot = EquipmentService.ResolveSlot(picked); }
        catch (InvalidOperationException exception)
        {
            logger.LogDebug(exception, "PickLoot: нет слота для предмета {Item}.", picked.Id);
            return;
        }

        loot.TakeBag(bagId);
        EquipmentService.EquipAt(equipment, slot, picked);

        logger.LogDebug("PickLoot: hero={Hero}, bag={Bag}, item={Item}, slot={Slot}.", heroId.Value, bagId, picked.Id, slot);
    }

    /// <summary>Удаляет сумку с добычей целиком, если герой существует, жив и находится в фазе PLAY.</summary>
    public void DiscardLoot(string participantId, int bagId)
    {
        var heroId = HeroOf(participantId);
        if (heroId == null) return;

        var gameId = GameOf(participantId);
        var gameState = gameId != null ? context.Single<GameState>(gameId.Value) : null;
        if (gameState == null || gameState.State != EGameState.PLAY) return;

        var loot = context.EntityGet<Loot>(heroId.Value);
        if (loot == null) return;

        var health = context.EntityGet<Health>(heroId.Value);
        if (health != null && !double.IsNaN(health.LifeCurrent) && health.LifeCurrent <= 0) return;

        if (loot.TakeBag(bagId) == null)
            logger.LogDebug("DiscardLoot: у героя {Hero} нет мешка {Bag}.", heroId.Value, bagId);
    }

    /// <summary>Список игр для будущего выбора комнаты игроком.</summary>
    public IReadOnlyList<GameInfo> ListGames()
    {
        var result = new List<GameInfo>();

        foreach (var gameId in context.GameIds())
        {
            var game = context.Single<GameModel>(gameId);

            result.Add(new GameInfo
            {
                GameId = gameId,
                Name = game?.Name ?? string.Empty,
                Finished = IsFinished(gameId),
                Players = game?.Participants.Count ?? 0,
                Wave = context.Single<Wave>(gameId)?.Lvl ?? 0,
                Monsters = context.Query<Monster>(gameId).Count
            });
        }

        return result;
    }

    /// <summary>Добавляет участника в состав игры.</summary>
    private void AssignParticipant(string participantId, int gameId)
    {
        var game = context.Single<GameModel>(gameId);
        game?.Participants.Add(participantId);
    }

    /// <summary>Снимает участника с игры (без удаления героя и игры).</summary>
    private void RemoveParticipant(int gameId, string participantId)
    {
        context.Single<GameModel>(gameId)?.Participants.Remove(participantId);
    }

    /// <summary>Помечает завершённые игры: в них нет живых героев и никто не ждёт спавна.</summary>
    public void FinishGames()
    {
        foreach (var gameId in context.GameIds())
        {
            var gs = context.Single<GameState>(gameId);
            if (gs == null || gs.State != EGameState.PLAY) continue;

            if (!HasLivingHero(gameId) && !HasAwaitingSpawn(gameId))
                gs.State = EGameState.OVER;
        }
    }

    private bool IsFinished(int gameId)
    {
        var gs = context.Single<GameState>(gameId);
        return gs != null && gs.State == EGameState.OVER;
    }

    private int ChooseGame(int? preferredGameId)
    {
        if (preferredGameId is int preferred && context.HasGame(preferred) && Joinable(preferred))
            return preferred;

        var joinable = context.GameIds().Where(Joinable).ToList();
        if (joinable.Count > 0) return joinable[Random.Shared.Next(joinable.Count)];

        return CreateGame();
    }

    private bool Joinable(int gameId)
    {
        if (IsFinished(gameId)) return false;

        var game = context.Single<GameModel>(gameId);
        if (game == null) return false;

        return game.MaxPlayers == 0 || game.Participants.Count < game.MaxPlayers;
    }

    private int CreateGame()
    {
        var id = context.AddGame();

        // Пустая игра сразу получает GameState и состав; волна появится на первом тике WaveSystem.
        var entity = context.EntityCreate(id);
        context.EntitySet(entity, new GameState());
        context.EntitySet(entity, new GameModel { Name = $"Игра {id}" });

        return id;
    }

    /// <summary>Убирает участника и его героя из игры; пустую игру уничтожает.</summary>
    private void LeaveGame(int gameId, string participantId)
    {
        var heroId = FindHeroEntity(gameId, participantId);
        if (heroId != null) context.EntityRemove(heroId.Value);

        RemoveParticipant(gameId, participantId);

        var game = context.Single<GameModel>(gameId);
        if (game == null || game.Participants.Count == 0) context.RemoveGame(gameId);
    }

    /// <summary>Сущность героя участника в его текущей игре, либо <c>null</c>.</summary>
    private int? HeroOf(string participantId)
    {
        var gameId = GameOf(participantId);
        if (gameId == null) return null;

        return FindHeroEntity(gameId.Value, participantId);
    }

    private void ChooseBonus(string participantId, string bonusId, EBonusSource source)
    {
        var heroId = HeroOf(participantId);
        if (heroId == null) return;

        var choice = context.EntityGet<BonusChoice>(heroId.Value);
        if (choice == null)
        {
            context.EntitySet(heroId.Value, new BonusChoice { BonusId = bonusId, Source = source });
            return;
        }

        choice.BonusId = bonusId;
        choice.Source = source;
    }

    private int? FindHeroEntity(int gameId, string participantId)
    {
        foreach (var (entityId, hero) in context.FindComponents<Hero>(gameId))
        {
            if (hero.Id == participantId) return entityId;
        }

        return null;
    }

    private bool HasLivingHero(int gameId)
    {
        foreach (var (entityId, _) in context.FindComponents<Hero>(gameId))
        {
            var health = context.EntityGet<Health>(entityId);
            if (health == null || double.IsNaN(health.LifeCurrent) || health.LifeCurrent > 0) return true;
        }

        return false;
    }

    private bool HasAwaitingSpawn(int gameId)
    {
        var game = context.Single<GameModel>(gameId);
        if (game == null) return false;

        foreach (var participantId in game.Participants)
        {
            if (FindHeroEntity(gameId, participantId) == null) return true;
        }

        return false;
    }
}
