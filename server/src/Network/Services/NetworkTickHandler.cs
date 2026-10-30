using BubleRpg.Server.Application.Services;

namespace BubleRpg.Server.Network.Services
{
    public class NetworkTickHandler(NetworkService networkService) : ITickHandler
    {
        public void Update(double deltaSeconds)
        {
            // Снимок завершённого тика уходит сразу; команды применяются после — на следующий тик.
            networkService.Send();
            networkService.DrainCommands();
        }
    }
}
