using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class RigidbodySystem(PhysicsService physics) : IGameSystem
{
    public void Update(double deltaTime)
    {
        physics.ResolveCollisions();
    }
}
