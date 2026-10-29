//#region input

export class Input
{
    private static canvas: HTMLCanvasElement | null = null;

    private static keys: Map<string, boolean> = new Map();
    private static mousePosition: { x: number; y: number } = { x: 0, y: 0 };
    private static mouseInside: boolean = false;
    private static mouseDown: boolean = false;
    private static middleMouseDown: boolean = false;
    private static mouseWheelAccumulator: number = 0;

    private static clickHandlers: ((x: number, y: number) => void)[] = [];
    private static mouseMoveHandlers: ((x: number, y: number) => void)[] = [];
    private static mouseLeaveHandlers: (() => void)[] = [];

    /** Игровой контроллер ввода: сам находит канвас и держит координаты поля. */
    public static Init(): void
    {
        if (Input.canvas) return;

        const container = document.getElementById('pixiCanvas');
        const canvas = container?.querySelector<HTMLCanvasElement>('canvas');
        if (!canvas) throw new Error('Missing #pixiCanvas canvas element.');

        Input.canvas = canvas;

        ['w', 'a', 's', 'd', 'r'].forEach(key => { Input.keys.set(key, false); });
        window.addEventListener('keydown', (e) => Input.handleKeyDown(e), true);
        window.addEventListener('keyup', (e) => Input.handleKeyUp(e), true);
        Input.InitMouseHandlers(canvas);
    }

    /** Подписка на клик левой кнопкой по канвасу (намерение движения). */
    public static OnClick(handler: (x: number, y: number) => void): () => void
    {
        Input.clickHandlers.push(handler);
        return () => Input.RemoveHandler(Input.clickHandlers, handler);
    }

    /** Подписка на движение мыши по полю. Возвращает функцию отписки. */
    public static OnMouseMove(handler: (x: number, y: number) => void): () => void
    {
        Input.mouseMoveHandlers.push(handler);
        return () => Input.RemoveHandler(Input.mouseMoveHandlers, handler);
    }

    /** Подписка на выход мыши за пределы поля. Возвращает функцию отписки. */
    public static OnMouseLeave(handler: () => void): () => void
    {
        Input.mouseLeaveHandlers.push(handler);
        return () => Input.RemoveHandler(Input.mouseLeaveHandlers, handler);
    }

    private static RemoveHandler<T>(handlers: T[], handler: T): void
    {
        const index = handlers.indexOf(handler);
        if (index >= 0) handlers.splice(index, 1);
    }

    private static handleKeyDown(e: KeyboardEvent): void
    {
        const key = e.key.toLowerCase();
        if (Input.keys.has(key))
        {
            e.preventDefault();
            e.stopPropagation();
            Input.keys.set(key, true);
        }
    }

    private static handleKeyUp(e: KeyboardEvent): void
    {
        const key = e.key.toLowerCase();
        if (Input.keys.has(key))
        {
            e.preventDefault();
            e.stopPropagation();
            Input.keys.set(key, false);
        }
    }

    public static IsKeyDown(key: string): boolean
    {
        return Input.keys.get(key.toLowerCase()) || false;
    }

    public static get IsWASDPressed(): boolean
    {
        return Input.keys.get('w') || Input.keys.get('a') ||
            Input.keys.get('s') || Input.keys.get('d') || false;
    }

    public static get WASDDirection(): { dx: number; dy: number }
    {
        let dx = 0, dy = 0;
        if (Input.keys.get('w')) dy -= 1;
        if (Input.keys.get('s')) dy += 1;
        if (Input.keys.get('a')) dx -= 1;
        if (Input.keys.get('d')) dx += 1;
        return { dx, dy };
    }

    public static get Mouse(): { X: number, Y: number }
    {
        return { X: Input.mousePosition.x, Y: Input.mousePosition.y };
    }

    public static get IsMouseInside(): boolean
    {
        return Input.mouseInside;
    }

    public static get IsMouseDown(): boolean
    {
        return Input.mouseDown;
    }

    public static get IsMiddleMouseDown(): boolean
    {
        return Input.middleMouseDown;
    }

    public static get MouseWheelDelta(): number
    {
        const delta = Input.mouseWheelAccumulator;
        Input.mouseWheelAccumulator = 0;
        return delta;
    }

    private static InitMouseHandlers(canvas: HTMLCanvasElement): void
    {
        canvas.addEventListener('mouseenter', () =>
        {
            Input.mouseInside = true;
        });

        canvas.addEventListener('mouseleave', () =>
        {
            Input.mouseInside = false;
            Input.mouseDown = false;
            Input.middleMouseDown = false;

            for (const handler of Input.mouseLeaveHandlers) handler();
        });

        canvas.addEventListener('mousedown', (e: MouseEvent) =>
        {
            e.preventDefault();
            Input.mouseInside = true;
            Input.mouseDown = e.button === 0;
            Input.middleMouseDown = e.button === 1;
            Input.UpdateMousePosition(e);
        });

        canvas.addEventListener('mousemove', (e: MouseEvent) =>
        {
            Input.mouseInside = true;
            Input.UpdateMousePosition(e);
        });

        canvas.addEventListener('mouseup', (e: MouseEvent) =>
        {
            e.preventDefault();
            if (e.button === 0) Input.mouseDown = false;
            if (e.button === 1) Input.middleMouseDown = false;
        });

        canvas.addEventListener('wheel', (e: WheelEvent) =>
        {
            e.preventDefault();
            Input.mouseWheelAccumulator += e.deltaY > 0 ? -1 : 1;
            Input.UpdateMousePosition(e);
        }, { passive: false });

        // Намерение движения: клик левой кнопкой по канвасу.
        canvas.addEventListener('click', (e: MouseEvent) =>
        {
            const field = Input.ToField(e);
            for (const handler of Input.clickHandlers) handler(field.x, field.y);
        });

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /** Пересчёт координат курсора из CSS-пикселей в логические пиксели поля. */
    private static ToField(e: MouseEvent): { x: number; y: number }
    {
        const canvas = Input.canvas;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };

        return {
            x: Math.min(canvas.width, Math.max(0, (e.clientX - rect.left) / rect.width * canvas.width)),
            y: Math.min(canvas.height, Math.max(0, (e.clientY - rect.top) / rect.height * canvas.height)),
        };
    }

    private static UpdateMousePosition(e: MouseEvent): void
    {
        const field = Input.ToField(e);
        Input.mousePosition.x = field.x;
        Input.mousePosition.y = field.y;

        for (const handler of Input.mouseMoveHandlers) handler(field.x, field.y);
    }
}

//#endregion
