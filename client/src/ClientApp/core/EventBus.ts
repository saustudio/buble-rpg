export class EventBus
{
    private readonly handlers = new Map<string, ((payload: unknown) => void)[]>();

    public Subscribe<T>(event: string, handler: (payload: T) => void): () => void
    {
        const wrapped = handler as (payload: unknown) => void;
        let list = this.handlers.get(event);

        if (!list)
        {
            list = [];
            this.handlers.set(event, list);
        }

        list.push(wrapped);

        return () =>
        {
            const index = list!.indexOf(wrapped);
            if (index >= 0) list!.splice(index, 1);
        };
    }

    public Publish<T>(event: string, payload: T): void
    {
        const list = this.handlers.get(event);
        if (!list) return;

        for (const handler of [...list]) handler(payload);
    }
}
