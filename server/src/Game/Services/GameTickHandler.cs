using BubleRpg.Server.Application.Services;
using BubleRpg.Server.Game.Systems;

namespace BubleRpg.Server.Game.Services
{
    public class GameTickHandler(IEnumerable<IGameSystem> systems, GameService gameService) : ITickHandler
    {
        public void Update(double deltaSeconds)
        {
            // Системы сами обходят список игр и берут связанные данные по gameId.
            foreach (var system in systems) system.Update(deltaSeconds);
            gameService.FinishGames();
        }
    }
}
