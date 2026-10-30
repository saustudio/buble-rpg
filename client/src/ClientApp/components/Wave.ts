//#region UI

import { IGameStateView } from "../core/Core";
import { GameState } from "../model/GameState";

export class WaveUI implements IGameStateView
{
    private readonly waveNotification: HTMLElement;
    private readonly waveNumber: HTMLElement;
    private readonly waveSub: HTMLElement;
    private readonly statWave: HTMLElement;
    private readonly statEnemiesLeft: HTMLElement;

    constructor()
    {
        this.waveNotification = document.getElementById('waveNotification')!;
        this.waveNumber = document.getElementById('waveNumber')!;
        this.waveSub = document.getElementById('waveSub')!;
        this.statWave = document.getElementById('statWave')!;
        this.statEnemiesLeft = document.getElementById('statEnemiesLeft')!;
    }

    public Refresh(state: GameState): void
    {
        const wave = state.Wave;

        this.statWave.textContent = wave ? String(wave.Lvl) : "—";
        this.statEnemiesLeft.textContent = String(state.Monsters.length);

        if (!wave || wave.PrepareTimer <= 0)
        {
            this.waveNotification.classList.remove('show');
            return;
        }

        this.waveNotification.classList.add('show');

        const isBossWave = wave.Lvl % 5 === 0;
        this.waveNumber.textContent = String(wave.Lvl);
        this.waveSub.textContent = isBossWave ? '👑 БОСС ИДЁТ!' : `⚔️ ${wave.SpawnMax} врагов`;
    }
}

//#endregion
