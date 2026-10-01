//#region LOGS

export interface ErrorLogEntry
{
    timestamp: number;
    level: string;
    module: string;
    message: string;
    data?: unknown;
}

export enum LogLevel { DEBUG = 0, INFO = 1, WARN = 2, ERROR = 3, FATAL = 4 }

export class Logger
{
    private static currentLevel: LogLevel = LogLevel.DEBUG;
    private static readonly levelNames: string[] = ['🔍', 'ℹ️', '⚠️', '❌', '💀'];
    private static readonly levelLabels: string[] = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

    private static Log(level: LogLevel, module: string, message: string, ...data: any[]): void
    {
        if (level < this.currentLevel) return;

        const timestamp = new Date().toLocaleTimeString();
        let logMessage = `[${timestamp}] ${this.levelNames[level]} [${this.levelLabels[level]}][${module}] ${message} `;

        switch (level)
        {
            case 3: // ERROR
                if (data.length) console.error(logMessage, data);
                else console.error(logMessage);
                break;
            case 4: // FATAL
                if (data.length) console.error(logMessage, data);
                else console.error(logMessage);
                break;
            case 2: // WARN
                if (data.length) console.warn(logMessage, data);
                else console.warn(logMessage);
                break;
            case 1: // INFO
                if (data.length) console.info(logMessage, data);
                else console.info(logMessage);
                break;
            default:
                if (data.length) console.log(logMessage, data);
                else console.log(logMessage);
        }

        if (level >= 3)
        {
            if (!(window as any)._errorLog) (window as any)._errorLog = [];
            (window as any)._errorLog.push({
                timestamp: Date.now(),
                level: this.levelLabels[level],
                module,
                message,
                data
            });
            if ((window as any)._errorLog.length > 100) (window as any)._errorLog.shift();
        }
    }

    public static Debug(module: string, message: string, ...data: any[]): void
    {
        this.Log(0, module, message, data);
    }

    public static Info(module: string, message: string, ...data: any[]): void
    {
        this.Log(1, module, message, data);
    }

    public static Warn(module: string, message: string, ...data: any[]): void
    {
        this.Log(2, module, message, data);
    }

    public static Error(module: string, message: string, ...data: any[]): void
    {
        this.Log(3, module, message, data);
    }

    public static Fatal(module: string, message: string, ...data: any[]): void
    {
        this.Log(4, module, message, data);
        this.ShowErrorOverlay(message, data);
    }

    private static ShowErrorOverlay(message: string, ...data: any[]): void
    {
        try
        {
            const errorOverlay = document.getElementById('errorOverlay');
            const errorMessage = document.getElementById('errorMessage');

            if (!errorOverlay || !errorMessage)
            {
                console.error('FATAL: Элементы оверлея ошибок не найдены');
                return;
            }

            errorOverlay.classList.add('active');
            let fullMessage = message;
            if (data && data.length)
            {
                for (const v of data)
                {
                    if (v instanceof Error)
                    {
                        fullMessage += `\n\n${v.stack || v.message} `;
                    } else if (typeof v === 'object')
                    {
                        try { fullMessage += `\n\n${JSON.stringify(v, null, 2)} `; } catch { fullMessage += `\n\n${String(v)} `; }
                    } else { fullMessage += `\n\n${String(v)} `; }
                }
            }
            errorMessage.textContent = fullMessage;


        } catch (e)
        {
            console.error('FATAL: Ошибка при показе оверлея ошибок', e);
            document.body.innerHTML = `
    <div style="background:#1a0a0a;color:#ff4444;padding:40px;font-family:monospace;text-align:center;min-height:100vh;display:flex;flex-direction:column;justify-content:center;">
        <h1 style="font-size:2rem;">💀 КРИТИЧЕСКАЯ ОШИБКА</h1>
        <pre style="color:#ffaaaa;margin:20px;padding:20px;background:#2a1010;border-radius:12px;text-align:left;max-height:400px;overflow:auto;">${message}\n\n${(e as Error)?.stack || ''}</pre>
        <button onclick="location.reload()" style="background:#3a2a2a;border:2px solid #ff4444;border-radius:16px;padding:14px 30px;color:#ffaaaa;font-size:1.1rem;font-weight:600;cursor:pointer;">🔄 Перезагрузить страницу</button>
    </div>
                        `;
        }
    }
}

//#endregion

//#region ECS

export type EntityId = number;

export interface System
{
    Update(deltaTime: number): void;
}

export interface IComponent { }
export class FrameComponent implements IComponent { }

export class World
{
    private static entities: Map<EntityId, Set<string>> = new Map();
    private static components: Map<string, Map<EntityId, IComponent>> = new Map();
    private static systems: System[] = [];
    private static nextId: EntityId = 1;

    // === СИСТЕМЫ ===
    public static SystemAdd(system: System): void
    {
        this.systems.push(system);
    }

    public static Update(delta: number): void
    {
        for (const system of this.systems) system.Update(delta);
        for (const [type, components] of Array.from(this.components.entries()))
        {
            for (const [entity, component] of Array.from(components.entries()))
            {
                if (component instanceof FrameComponent)
                {
                    this.components.get(type)!.delete(entity);
                    this.entities.get(entity)?.delete(type);
                }
            }
        }
    }

    // === СУЩНОСТИ ===
    public static EntityCreate(): EntityBuilder
    {
        const id = this.nextId++;
        this.entities.set(id, new Set());
        return new EntityBuilder(id);
    }

    public static EntityRemove(entityId: EntityId): void
    {
        if (!this.entities.has(entityId)) return;

        const componentTypeList = this.entities.get(entityId)!;
        for (const type of componentTypeList)
        {
            if (this.components.has(type))
                this.components.get(type)!.delete(entityId);
        }

        this.entities.delete(entityId);
    }

    public static EntityQuery(...types: (string | Function)[]): EntityId[]
    {
        const typeNames = types.map(t => typeof t === 'string' ? t : t.name);

        const result: EntityId[] = [];
        for (const [id, comps] of this.entities)
        {
            let hasAll = true;
            for (const type of typeNames)
            {
                if (!comps.has(type))
                {
                    hasAll = false;
                    break;
                }
            }
            if (hasAll) result.push(id);
        }
        return result;
    }

    public static EntityFirst(...types: (string | Function)[]): EntityId | null
    {
        const result = this.EntityQuery(...types);
        return result.length > 0 ? result[0] : null;
    }

    // === КОМПОНЕНТЫ ===
    public static SetComponent<T extends IComponent>(entityId: EntityId, component: T): void
    {
        if (!this.entities.has(entityId)) throw new Error(`[World] Сущность ${entityId} не найдена`);

        const type = (component as any).constructor?.name || 'unknown';
        const typeList = this.entities.get(entityId)!;
        if (typeList.has(type)) console.warn(`[World] Сущность ${entityId} заменяет компонент ${type}`);

        if (!this.components.has(type)) this.components.set(type, new Map());

        this.components.get(type)!.set(entityId, component);
        typeList.add(type);

    }

    public static RemoveComponent<T>(
        entityId: EntityId,
        componentType: new (...args: any[]) => T
    ): void
    {
        const type = componentType.name;
        if (this.components.has(type))
        {
            this.components.get(type)!.delete(entityId);
            this.entities.get(entityId)?.delete(type);
        }
    }

    public static GetComponent<T extends IComponent>(
        entityId: EntityId,
        componentType: new (...args: any[]) => T
    ): T | null
    {
        const type = componentType.name;
        if (!this.components.has(type)) return null;
        return this.components.get(type)!.get(entityId) as T || null;
    }


    // Получить компонент у первой сущности, у которой есть этот компонент
    public static SingleComponent<T extends IComponent>(
        componentType: new (...args: any[]) => T
    ): T | null
    {
        const entity = this.EntityFirst(componentType);
        if (!entity) return null;
        return this.GetComponent(entity, componentType);
    }

    public static HasComponent<T>(
        entityId: EntityId,
        componentType: new (...args: any[]) => T
    ): boolean
    {
        const type = componentType.name;
        return this.components.has(type) &&
            this.components.get(type)!.has(entityId);
    }

    public static GetComponents(type: string): Map<EntityId, unknown>
    {
        return this.components.get(type) || new Map();
    }

    // === ОЧИСТКА ===
    public static Clear(): void
    {
        this.entities = new Map();
        this.components = new Map();
        this.systems = [];
    }
}

export class EntityBuilder
{
    constructor(private entityId: EntityId) { }

    public SetComponent(component: IComponent): this
    {
        World.SetComponent(this.entityId, component);
        return this;
    }

    public get Entity(): EntityId { return this.entityId }

}

//#endregion

//#region INPUT

export class Input
{
    private static keys: Map<string, boolean> = new Map();
    private static mousePosition: { x: number; y: number } = { x: 600, y: 500 };
    private static mouseDown: boolean = false;
    private static middleMouseDown: boolean = false;
    private static mouseWheelAccumulator: number = 0;

    public static Init()
    {
        ['w', 'a', 's', 'd', 'r'].forEach(key => { Input.keys.set(key, false); });
        window.addEventListener('keydown', (e) => Input.handleKeyDown(e), true);
        window.addEventListener('keyup', (e) => Input.handleKeyUp(e), true);
        Input.InitMouseHandlers();

        Logger.Info(Input.name, '✅ система успешно инициализирована');
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

    private static InitMouseHandlers(): void
    {
        const canvas = document.getElementById('pixiCanvas')! as HTMLCanvasElement;

        canvas.addEventListener('mousedown', (e: MouseEvent) =>
        {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();

            const x = Math.min(rect.width, Math.max(0, (e.clientX - rect.left)));
            const y = Math.min(rect.height, Math.max(0, (e.clientY - rect.top)));

            this.mouseDown = e.button === 0;
            this.middleMouseDown = e.button === 1;

            this.mousePosition.x = Math.min(rect.width, Math.max(0, x));
            this.mousePosition.y = Math.min(rect.height, Math.max(0, y));

        });

        canvas.addEventListener('mousemove', (e: MouseEvent) =>
        {
            const rect = canvas.getBoundingClientRect();
            const x = Math.min(rect.width, Math.max(0, (e.clientX - rect.left)));
            const y = Math.min(rect.height, Math.max(0, (e.clientY - rect.top)));

            this.mousePosition.x = Math.min(rect.width, Math.max(0, x));
            this.mousePosition.y = Math.min(rect.height, Math.max(0, y));
        });

        canvas.addEventListener('mouseup', (e: MouseEvent) =>
        {
            e.preventDefault();
            this.mouseDown = e.button === 0;
            this.middleMouseDown = e.button === 1;
        });

        // Обработка колесика мыши
        canvas.addEventListener('wheel', (e: WheelEvent) =>
        {
            e.preventDefault();
            // Накопливаем значение прокрутки
            this.mouseWheelAccumulator += e.deltaY > 0 ? -1 : 1;

            // Обновляем позицию мыши при прокрутке
            const rect = canvas.getBoundingClientRect();
            this.mousePosition.x = Math.min(rect.width, Math.max(0, (e.clientX - rect.left)));
            this.mousePosition.y = Math.min(rect.height, Math.max(0, (e.clientY - rect.top)));

        }, { passive: false });



        canvas.addEventListener('click', function () { this.focus(); });
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
}

//#endregion

//#region RENDER

declare const PIXI: any;

export interface IRenderer
{
    Render(deltaTime: number): void;
}

export class Graphics
{
    public static Width: number;
    public static Height: number;
    public static ShapeLayer: any;
    public static TextLayer: any;
    public static EffectsLayer: any;
    public static UILayer: any;

    private static app: any;

    private static renderers: IRenderer[] = [];
    private static isRendering: boolean = false;

    static
    {
        Graphics.Width = 1000;
        Graphics.Height = 800;

        Graphics.app = new PIXI.Application({
            width: Graphics.Width,
            height: Graphics.Height,
            backgroundColor: 0x2f3b4c,
            antialias: true,
            resolution: 1,
            autoStart: false
        });

        // Создаём слои с правильными типами
        Graphics.ShapeLayer = new PIXI.Graphics();  // ✅ Примитивы
        Graphics.EffectsLayer = new PIXI.Graphics();   // ✅ Примитивы (эффекты)
        Graphics.UILayer = new PIXI.Graphics();        // ✅ Примитивы (UI)
        Graphics.TextLayer = new PIXI.Container();     // ✅ Контейнер для текста

        // Добавляем слои в сцену (порядок важен!)
        Graphics.app.stage.addChild(Graphics.ShapeLayer);  // Сначала графика
        Graphics.app.stage.addChild(Graphics.EffectsLayer);   // Потом эффекты
        Graphics.app.stage.addChild(Graphics.UILayer);        // UI сверху всего
        Graphics.app.stage.addChild(Graphics.TextLayer);      // Потом текст (поверх графики)

        // Подключаем canvas к DOM
        const canvasContainer = document.getElementById('pixiCanvas')!;
        canvasContainer.appendChild(Graphics.app.view);

        Graphics.app.ticker.add((deltaTime: number) =>
        {
            if (Graphics.isRendering) Graphics.Render(deltaTime);
        });
    }


    // Регистрация рендереров
    public static RendererAdd(renderer: IRenderer): void
    {
        Graphics.renderers.push(renderer);
    }

    // Очистка слоёв
    private static ClearLayers(): void
    {
        // GraphicsLayer — уничтожаем и создаём заново
        Graphics.app.stage.removeChild(Graphics.ShapeLayer);
        Graphics.ShapeLayer.destroy({ children: true, texture: true, baseTexture: true });
        Graphics.ShapeLayer = new PIXI.Graphics();
        Graphics.app.stage.addChildAt(Graphics.ShapeLayer, 0); // на своё место

        // Контейнеры — просто уничтожаем детей
        const destroyAll = (c: any) =>
        {
            while (c.children.length > 0)
            {
                const child = c.children[0];
                c.removeChild(child);
                child.destroy({ children: true, texture: true, baseTexture: true });
            }
        };
        destroyAll(Graphics.TextLayer);
        destroyAll(Graphics.EffectsLayer);
        destroyAll(Graphics.UILayer);
    }

    // Только рендеринг!
    private static Render(deltaTime: number): void
    {
        this.ClearLayers();
        for (const renderer of Graphics.renderers) renderer.Render(deltaTime);
    }

    public static Start(): void
    {
        Graphics.isRendering = true;
        Graphics.app.ticker.start();
    }

    public static Stop(): void
    {
        Graphics.isRendering = false;
        Graphics.app.ticker.stop();
    }
}

//#endregion


export class Ticker
{
    private lastTime = 0;
    private running = false;

    private handlers: ((delta: number) => void)[] = [];

    public OnTick(handler: (delta: number) => void): void
    {
        this.handlers.push(handler);
    }

    public Start(): void
    {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(t => this.Frame(t));
    }

    public Stop(): void
    {
        this.running = false;
    }

    private Frame(currentTime: number): void
    {
        if (!this.running) return;

        const delta = Math.min((currentTime - this.lastTime) / 1000, 0.05);
        this.lastTime = currentTime;

        for (const handler of this.handlers) handler(delta);

        requestAnimationFrame(t => this.Frame(t));
    }
}

