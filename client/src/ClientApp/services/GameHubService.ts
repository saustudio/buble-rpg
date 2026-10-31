import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { EventBus } from "../core/EventBus";
import { GameEvents } from "../core/GameEvents";
import { EGameState, GameState } from "../model/GameState";
import { GameStateMessage } from "../model/network/GameStateMessage";
import { GuestAuthService } from "./GuestAuthService";
import { IGameService } from "./IGameService";
import { GameSessionRepository } from "../store/GameSessionRepository";
import { GameStateRepository } from "../store/GameStateRepository";

export class GameHubService implements IGameService
{
    private static readonly MoveInterval = 50;

    private readonly sessions = new GameSessionRepository();
    private readonly auth: GuestAuthService;
    private hub: HubConnection | null = null;
    private lastMoveSentAt = 0;

    constructor(
        private readonly repository: GameStateRepository,
        private readonly events: EventBus,
        private readonly baseUrl: string)
    {
        this.auth = new GuestAuthService(baseUrl);
    }

    public async Start(): Promise<void>
    {
        try
        {
            this.hub = this.CreateHub();
            await this.hub.start();
            await this.RequestState();
        }
        catch (error)
        {
            this.events.Publish(GameEvents.Error, error);
        }
    }

    public Stop(): void
    {
        if (!this.hub) return;

        void this.hub.stop();
        this.hub = null;
    }

    public async MoveTo(x: number, y: number): Promise<void>
    {
        const state = this.repository.Last();
        if (state?.Phase !== EGameState.PLAY) return;
        if (!state.MyHero) return;

        // Цель совпадает с позицией героя — это остановка, её нельзя терять в троттлинге.
        const isStop = state.MyHero.Location.X === x && state.MyHero.Location.Y === y;

        const now = performance.now();
        if (!isStop && now - this.lastMoveSentAt < GameHubService.MoveInterval) return;

        this.lastMoveSentAt = now;
        await this.InvokeAsync("MoveTo", x, y);
    }

    public async ChooseLevelBonus(bonusId: string): Promise<void>
    {
        await this.InvokeAsync("ChooseLevelBonus", bonusId);
    }

    public async ChooseWaveBonus(bonusId: string): Promise<void>
    {
        await this.InvokeAsync("ChooseWaveBonus", bonusId);
    }

    public async PickLoot(itemId: string): Promise<void>
    {
        await this.InvokeAsync("PickLoot", itemId);
    }

    public async Respawn(): Promise<void>
    {
        await this.InvokeAsync("Respawn");
    }

    private CreateHub(): HubConnection
    {
        const hubUrl = new URL("game", this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`).toString();

        const hub = new HubConnectionBuilder()
            .withUrl(hubUrl, { accessTokenFactory: this.EnsureAccessTokenAsync.bind(this), withCredentials: false })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build();

        hub.on("GameState", this.OnGameState.bind(this));
        hub.onreconnected(this.OnReconnected.bind(this));

        return hub;
    }

    private async EnsureAccessTokenAsync(): Promise<string>
    {
        const token = this.sessions.Query();
        const accessToken = await this.auth.AuthenticateAsync(token);
        this.sessions.Create(accessToken);
        return accessToken;
    }

    private async RequestState(): Promise<void>
    {
        if (!this.hub) return;
        await this.hub.invoke("RequestState");
    }

    private OnGameState(state: GameStateMessage): void
    {
        const gameState = this.ToViewFromDto(state, performance.now());
        this.repository.Create(gameState);
        this.events.Publish(GameEvents.StateChanged, gameState);
    }

    /** Сетевой снимок → View-модель: добавляет клиентские поля, которых нет в проводе. */
    private ToViewFromDto(snapshot: GameStateMessage, createdAt: number): GameState
    {
        return {
            ...snapshot,
            ExperienceBonusOffer: [],
            WaveBonusOffer: [],
            CreatedAt: createdAt,
        };
    }

    private OnReconnected(): void
    {
        void this.RequestState()
            .catch(error => console.error("Unable to request game state after reconnect.", error));
    }

    private async InvokeAsync(methodName: string, ...args: unknown[]): Promise<void>
    {
        if (!this.hub || this.hub.state !== HubConnectionState.Connected) return;
        await this.hub.invoke(methodName, ...args);
    }
}
