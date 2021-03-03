import { IVector3 } from "../../Facepunch";
import { DrawableEntity, DrawList } from "../../Facepunch/WebGame";
import { Map } from "..";

export interface IEntity {
    classname: string;
    targetname?: string;
    origin?: IVector3;
    angles?: IVector3;
    scale?: number;
}

export interface IColor {
    r: number;
    g: number;
    b: number;
}

export interface IEnvFogController extends IEntity {
    fogEnabled: boolean;
    fogStart: number;
    fogEnd: number;
    fogMaxDensity: number;
    farZ: number;
    fogColor: IColor;
}

export class Entity extends DrawableEntity {
    readonly map: Map;
    readonly targetname: string;

    constructor(map: Map, info: IEntity) {
        super(true);

        this.map = map;
        this.targetname = info.targetname!;

        if (this.targetname != null) {
            this.map.addNamedEntity(this.targetname, this);
        }

        if (info.origin !== undefined) {
            this.setPosition(info.origin);
        }

        if (info.angles !== undefined) {
            const mul = Math.PI / 180;
            this.setAngles(info.angles.x * mul, info.angles.y * mul, info.angles.z * mul);
        }

        if (info.scale !== undefined) {
            this.setScale(info.scale);
        }
    }
}

export interface IPvsEntity extends IEntity {
    clusters: number[] | null;
}

export class PvsEntity extends Entity {
    private readonly clusters: number[];

    constructor(map: Map, info: IPvsEntity) {
        super(map, info);

        this.clusters = info.clusters!;
    }

    isInCluster(cluster: number): boolean {
        const clusters = this.clusters;
        if (clusters == null) return true;
        for (let i = 0, iEnd = clusters.length; i < iEnd; ++i) {
            if (clusters[i] === cluster) return true;
        }
        return false;
    }

    isInAnyCluster(clusters: number[]): boolean {
        if (clusters == null) return true;
        for (let i = 0, iEnd = clusters.length; i < iEnd; ++i) {
            if (this.isInCluster(clusters[i])) return true;
        }
        return false;
    }

    populateDrawList(drawList: DrawList, clusters: number[]): void {
        drawList.addItem(this);
        this.onPopulateDrawList(drawList, clusters);
    }

    protected onPopulateDrawList(drawList: DrawList, clusters: number[]): void {}
}