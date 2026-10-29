using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class MovementSystem(
    GameDbContext store,
    EntityAttributesService attrService) : IGameSystem
{
    public void Update(double deltaTime)
    {
        foreach (var gameId in store.GameIds())
        {
            var gs = store.Single<GameState>(gameId);
            if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) continue;

            foreach (var entity in store.Query<Transform2D, Velocity, Rigidbody>(gameId))
            {
                var pos = store.EntityGet<Transform2D>(entity);
                var vel = store.EntityGet<Velocity>(entity);
                var body = store.EntityGet<Rigidbody>(entity);

                // Мёртвые сущности остаются в мире (герой-труп ждёт респавна), но не двигаются.
                var health = store.EntityGet<Health>(entity);
                if (health != null && !double.IsNaN(health.LifeCurrent) && health.LifeCurrent <= 0) continue;

                if (store.EntityHas<Stun>(entity))
                {
                    vel.DirX = 0;
                    vel.DirY = 0;
                    continue;
                }

                var attr = attrService.Attributes(entity);
                var speed = attr.MovementSpeed;
                speed *= body.BaseMass / body.Mass;

                var speedX = vel.DirX * speed;
                var speedY = vel.DirY * speed;

                var target = store.EntityGet<MoveTarget>(entity);
                if (target != null)
                {
                    var dx = target.X - pos.X;
                    var dy = target.Y - pos.Y;
                    var dist = Math.Sqrt(dx * dx + dy * dy);
                    if (dist <= body.Size + 20)
                    {
                        speedX = 0;
                        speedY = 0;
                    }
                }

                pos.X += speedX * deltaTime;
                pos.Y += speedY * deltaTime;
            }
        }
    }
}
