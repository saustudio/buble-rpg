export class UIDialog
{
    private handlers: Map<string, (() => void)[]> = new Map();
    public OnClose(handler: () => void): void { this.AddHandler("close", handler); }
    public OnOpen(handler: () => void): void { this.AddHandler("open", handler); }

    constructor(public Id: string)
    {
        const overlay = document.querySelector<HTMLElement>(`.ui-dialog-overlay[data-dialog=${this.Id}]`)!;
        const closeBtn = overlay.querySelector<HTMLElement>(".ui-dialog-close");
        if (closeBtn) closeBtn.addEventListener("click", () => this.Close());
        //document.querySelectorAll<HTMLElement>(".stat-nav-btn").forEach(btn => btn.addEventListener("click", () => this.Visibled ? this.Close() : this.Open()));
    }

    public get Container(): HTMLElement
    {
        return document.querySelector<HTMLElement>(`.ui-dialog-overlay[data-dialog=${this.Id}] .ui-dialog-body`)!;
    }

    public get Visibled(): boolean 
    {
        const overlay = document.querySelector<HTMLElement>(`.ui-dialog-overlay[data-dialog=${this.Id}]`)!;
        return overlay.classList.contains("is-open");
    }


    public Open(): void
    {
        if (this.Visibled) return;

        const overlay = document.querySelector<HTMLElement>(`.ui-dialog-overlay[data-dialog=${this.Id}]`)!;
        overlay.classList.add("is-open");
        this.SyncNavButtons();

        const handlers = this.handlers.get("open") ?? [];
        for (const handler of handlers) handler();
    }

    public Close(): void
    {
        if (!this.Visibled) return;

        const overlay = document.querySelector<HTMLElement>(`.ui-dialog-overlay[data-dialog=${this.Id}]`)!;
        overlay.classList.remove("is-open");
        this.SyncNavButtons();

        const handlers = this.handlers.get("close") ?? [];
        for (const handler of handlers) handler();

    }

    private SyncNavButtons(): void
    {
        const isOpen = this.Visibled;
        document.querySelectorAll<HTMLElement>("[data-dialog]:not(.ui-dialog-overlay)").forEach(btn => btn.classList.toggle("active",isOpen && btn.dataset.dialog === this.Id));
    }

    private AddHandler(event: string, handler: () => void): void
    {
        let list = this.handlers.get(event);
        if (!list) { list = []; this.handlers.set(event, list); }
        list.push(handler);
    }
}
