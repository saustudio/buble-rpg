import { EventBus } from "./core/EventBus";
import { Graphics, Input } from "./core/Core";
import { GameHubService } from "./services/GameHubService";
import { BattleEffectRenderer } from "./rendering/BattleEffectRenderer";
import { UnitRenderer } from "./rendering/UnitRenderer";
import { GameStateRepository } from "./store/GameStateRepository";
import { LootRepository } from "./store/LootRepository";
import { IndexPage } from "./components/IndexPage";

export class Main
{
    private readonly baseUrl = "https://localhost:7288/";
    private readonly repository = new GameStateRepository();
    private readonly lootRepository = new LootRepository();
    private readonly events = new EventBus();
    private readonly connection = new GameHubService(this.repository, this.lootRepository, this.events, this.baseUrl);

    public async Run(): Promise<void>
    {
        this.InitRendering();
        this.InitUI();
        this.InitNetwork();
    }

    private InitUI(): void
    {
        const page = new IndexPage(this.repository, this.lootRepository, this.events, this.connection);
        page.OnClose(() => { Graphics.Stop(); this.connection.Stop(); });
    }

    private InitRendering(): void
    {
        const canvasContainer = document.getElementById("gameCanvasContainer");
        if (canvasContainer)
        {
            canvasContainer.style.width = `${Graphics.Width}px`;
            canvasContainer.style.height = `${Graphics.Height}px`;
            canvasContainer.style.aspectRatio = `${Graphics.Width} / ${Graphics.Height}`;
        }

        Graphics.RendererAdd(new UnitRenderer(this.repository));
        Graphics.RendererAdd(new BattleEffectRenderer(this.repository));
        Graphics.Start();

        // Canvas создаётся в Graphics.Start(), поэтому ввод цепляется только после него.
        Input.Init();
    }

    private InitNetwork(): void
    {
        this.connection.Start();
    }
}

await new Main().Run();
