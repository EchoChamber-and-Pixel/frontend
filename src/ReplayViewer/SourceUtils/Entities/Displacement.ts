import { IPvsEntity, PvsEntity } from ".";
import { Map } from ".."
import { DrawList } from "../../Facepunch/WebGame";

export interface IDisplacement extends IPvsEntity {
    index: number;
}

export class Displacement extends PvsEntity {
    private readonly index: number;
    private isLoaded = false;

    constructor(map: Map, info: IDisplacement) {
        super(map, info);

        this.index = info.index;
    }

    onAddToDrawList(list: DrawList): void {
        if (!this.isLoaded) {
            this.isLoaded = true;
            this.map.viewer.dispGeometryLoader.load(this.index, handle => {
                if (handle != null) this.drawable.addMeshHandles([handle]);
            });
        }

        super.onAddToDrawList(list);
    }
}