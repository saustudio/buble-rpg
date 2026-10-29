using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Application.Services;

namespace BubleRpg.Server.Game.Services;

public sealed class PhysicsService(GameDbContext store)
{
    public void ResolveCollisions(int gameId)
    {
        var entities = store.Query<Transform2D, Rigidbody>(gameId);

        for (var i = 0; i < entities.Count; i++)
        {
            for (var j = i + 1; j < entities.Count; j++)
            {
                var entityA = entities[i];
                var entityB = entities[j];

                var posA = store.EntityGet<Transform2D>(entityA);
                var posB = store.EntityGet<Transform2D>(entityB);
                var bodyA = store.EntityGet<Rigidbody>(entityA);
                var bodyB = store.EntityGet<Rigidbody>(entityB);

                var minDistance = bodyA.Size + bodyB.Size;
                var dx = posB.X - posA.X;
                var dy = posB.Y - posA.Y;
                var distance = Math.Sqrt(dx * dx + dy * dy);

                if (distance < minDistance && distance > 0.001)
                {
                    var nx = dx / distance;
                    var ny = dy / distance;
                    var overlap = (minDistance - distance) / 2;
                    var totalMass = bodyA.Mass + bodyB.Mass;

                    var pushA = bodyA.IsStatic ? 0 : overlap * (bodyB.Mass / totalMass);
                    var pushB = bodyB.IsStatic ? 0 : overlap * (bodyA.Mass / totalMass);

                    posA.X -= nx * pushA;
                    posA.Y -= ny * pushA;
                    posB.X += nx * pushB;
                    posB.Y += ny * pushB;
                }
            }
        }
    }
}
