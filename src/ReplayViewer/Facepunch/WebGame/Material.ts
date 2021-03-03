import { ITextureInfo, IColor, RenderResource, ShaderProgram, Game, Texture } from ".";
import { ILoadable, Vector4, Http } from "..";

export enum MaterialPropertyType {
    Boolean = 1,
    Number = 2,
    Color = 3,
    TextureUrl = 4,
    TextureIndex = 5,
    TextureInfo = 6
}

export interface IMaterialProperty {
    type: MaterialPropertyType;
    name: string;
    value: boolean | number | string | ITextureInfo | IColor;
}

export interface IMaterialInfo {
    shader: string;
    properties: IMaterialProperty[];
}

export class Material extends RenderResource<Material> {
    private static nextId = 0;

    readonly id = Material.nextId++;

    properties: any;

    program!: ShaderProgram;
    enabled = true;

    readonly isDynamic: boolean;

    constructor(isDynamic: boolean);
    constructor(program: ShaderProgram, isDynamic: boolean);
    constructor(program?: ShaderProgram | boolean, isDynamic?: boolean) {
        super();

        if (typeof program === "boolean") {
            this.isDynamic = program;
        } else {
            this.program = program as ShaderProgram;
            this.isDynamic = isDynamic !== undefined && isDynamic;
        }

        if (this.program != null) {
            this.properties = this.program.createMaterialProperties();
        } else {
            this.properties = {};
        }
    }

    clone(isDynamic: boolean = false): Material {
        return new MaterialClone(this, isDynamic);
    }

    isLoaded(): boolean {
        return this.program != null;
    }
}

export class MaterialClone extends Material {
    constructor(base: Material, isDynamic: boolean) {
        super(isDynamic);

        base.addDependent(this);

        this.program = base.program;
        this.properties = {};

        if (base.program == null) {
            base.addOnLoadCallback(mat => {
                this.program = mat.program;

                const thisProps = this.properties;
                const thatProps = mat.properties;
                for (let prop in thatProps) {
                    if (thatProps.hasOwnProperty(prop) && !thisProps.hasOwnProperty(prop)) {
                        thisProps[prop] = thatProps[prop];
                    }
                }
            });
        }
    }
}

export class MaterialLoadable extends Material implements ILoadable {
    private static nextDummyId = 0;

    private readonly game: Game;
    private readonly url: string;

    private textureSource!: (index: number) => Texture;

    private loadProgress = 0;

    constructor(game: Game, url?: string) {
        super(false);

        this.game = game;
        this.url = url!;
    }

    getLoadProgress(): number {
        return this.loadProgress;
    }

    private addPropertyFromInfo(info: IMaterialProperty): void {
        switch (info.type) {
            case MaterialPropertyType.Boolean:
            case MaterialPropertyType.Number: {
                this.properties[info.name] = info.value as boolean | number;
                break;
            }
            case MaterialPropertyType.Color: {
                let vec = this.properties[info.name];
                if (vec === undefined) {
                    vec = this.properties[info.name] = new Vector4();
                }

                const color = info.value as IColor;

                vec.set(color.r, color.g, color.b, color.a);
                break;
            }
            case MaterialPropertyType.TextureUrl: {
                const texUrl = Http.getAbsUrl(info.value as string, this.url);
                const tex = this.properties[info.name] = this.game.textureLoader.load(texUrl);
                tex.addDependent(this);
                break;
            }
            case MaterialPropertyType.TextureIndex: {
                if (this.textureSource == null) {
                    console.warn("No texture source provided for material.");
                    break;
                }

                const tex = this.properties[info.name] = this.textureSource(info.value as number);
                tex.addDependent(this);
                break;
            }
            case MaterialPropertyType.TextureInfo: {
                if (info.value == null) {
                    console.warn("Texture info missing for material.");
                    break;
                }

                const texInfo = info.value as ITextureInfo;
                const tex = this.properties[info.name] = texInfo.path != null
                    ? this.game.textureLoader.load(texInfo.path)
                    : this.game.textureLoader.load(`__dummy_${MaterialLoadable.nextDummyId++}`);

                tex.addDependent(this);
                tex.loadFromInfo(texInfo);
                break;
            }
        }
    }

    loadFromInfo(info: IMaterialInfo, textureSource?: (index: number) => Texture): void {
        this.program = this.game.shaders.get(info.shader);
        this.textureSource = textureSource!;
        this.loadProgress = 1;

        if (this.program != null) {
            this.properties = this.program.createMaterialProperties();

            for (let i = 0; i < info.properties.length; ++i) {
                this.addPropertyFromInfo(info.properties[i]);
            }
        } else {
            this.properties = {};
        }

        if (this.program != null) {
            this.dispatchOnLoadCallbacks();
        }
    }
    
    loadNext(callback: (requeue: boolean) => void): void {
        if (this.program != null) {
            callback(false);
            return;
        }

        Http.getJson<IMaterialInfo>(this.url, info => {
            this.loadFromInfo(info);
            callback(false);
        }, error => {
            callback(false);
        }, (loaded, total) => {
            if (total !== undefined) {
                this.loadProgress = loaded / total;
            }
        });
    }
}