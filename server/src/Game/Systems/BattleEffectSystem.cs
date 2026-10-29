using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class BattleEffectSystem(
    GameDataService store,
    GameStateService gameStateService) : IGameSystem
{
    public void Update(double deltaTime)
    {
        var gs = gameStateService.Current;
        if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) return;

        foreach (var eventId in store.Query<DefenceEvasion>())
        {
            var e = store.EntityGet<DefenceEvasion>(eventId);
            CreateMissEffect(e.Source, e.Target);
        }

        foreach (var eventId in store.Query<AttackHit>())
        {
            var e = store.EntityGet<AttackHit>(eventId);
            CreateHitEffect(e.Source, e.Target, e.Phys + e.Fire + e.Cold + e.Light, e.IsCrit);
        }

        foreach (var eventId in store.Query<DefenceBlock>())
        {
            var e = store.EntityGet<DefenceBlock>(eventId);
            CreateBlockEffect(e.Source, e.Target);
        }

        foreach (var entityId in store.Query<MissEffect>())
        {
            var effect = store.EntityGet<MissEffect>(entityId);
            effect.Elapsed += deltaTime;
            if (effect.Elapsed >= effect.Lifetime) store.EntityRemove(entityId);
        }

        foreach (var entityId in store.Query<HitEffect>())
        {
            var effect = store.EntityGet<HitEffect>(entityId);
            effect.Elapsed += deltaTime;
            if (effect.Elapsed >= effect.Lifetime) store.EntityRemove(entityId);
        }

        foreach (var entityId in store.Query<BlockEffect>())
        {
            var effect = store.EntityGet<BlockEffect>(entityId);
            effect.Elapsed += deltaTime;
            if (effect.Elapsed >= effect.Lifetime) store.EntityRemove(entityId);
        }
    }

    private void CreateMissEffect(int source, int target)
    {
        var body = store.EntityGet<Rigidbody>(target);
        var pos = store.EntityGet<Transform2D>(target);
        var entity = store.EntityCreate();
        store.EntitySet(entity, new Transform2D(pos.X, pos.Y - body.Size));
        store.EntitySet(entity, new MissEffect(source, target, 0.6));
    }

    private void CreateBlockEffect(int source, int target)
    {
        var body = store.EntityGet<Rigidbody>(target);
        var pos = store.EntityGet<Transform2D>(target);
        var entity = store.EntityCreate();
        store.EntitySet(entity, new Transform2D(pos.X, pos.Y - body.Size));
        store.EntitySet(entity, new BlockEffect(source, target, 0.6));
    }

    private void CreateHitEffect(int source, int target, double amount, bool isCrit)
    {
        var body = store.EntityGet<Rigidbody>(target);
        var pos = store.EntityGet<Transform2D>(target);
        var entity = store.EntityCreate();
        store.EntitySet(entity, new Transform2D(pos.X, pos.Y - body.Size));
        store.EntitySet(entity, new HitEffect(source, target, amount, isCrit, 0.6));
    }
}
