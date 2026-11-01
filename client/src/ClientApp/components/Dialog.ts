//#region UI

export class UIDialog
{
    protected readonly overlay: HTMLElement;

    constructor(public readonly Id: string)
    {
        this.overlay = document.querySelector<HTMLElement>(`.ui-dialog-overlay[data-dialog=${this.Id}]`)!;
    }

    public get Container(): HTMLElement
    {
        return this.overlay.querySelector<HTMLElement>(".ui-dialog-body")!;
    }

    public get Visibled(): boolean 
    {
        return this.overlay.classList.contains("is-open");
    }

    public Open(): void
    {
        this.overlay.classList.add("is-open");
    }

    public Close(): void
    {
        this.overlay.classList.remove("is-open");
    }
}

//#endregion
