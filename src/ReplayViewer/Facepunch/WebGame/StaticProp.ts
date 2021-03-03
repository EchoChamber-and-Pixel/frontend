import { DrawableEntity, Model, MeshManager, VertexAttribute } from ".";
import { Vector3, IVector3 } from "..";

export class StaticProp extends DrawableEntity {
    private model!: Model;
    private tint!: Vector3;

    constructor() {
        super(true);
    }

    setColorTint(color: IVector3): void {
        if (this.tint != null) this.tint.copy(color);
        else this.tint = new Vector3().copy(color);
    }

    setModel(model: Model): void {
        if (this.model === model) return;
        if (this.model != null) {
            this.model.removeUsage(this);
        }

        this.model = model;

        if (model == null) {
            this.drawable.clearMeshHandles();
            return;
        }

        this.model.addUsage(this);

        model.addOnLoadCallback(mdl => this.onModelLoaded(mdl));
    }

    private onModelLoaded(model: Model): void {
        if (model !== this.model) return;

        this.drawable.clearMeshHandles();

        const meshData = MeshManager.clone(model.getMeshData());
        const transform = this.getMatrix();

        MeshManager.transform4F(meshData, VertexAttribute.position, pos => pos.applyMatrix4(transform), 1);
        MeshManager.transform4F(meshData, VertexAttribute.normal, norm => norm.applyMatrix4(transform), 0);

        if (this.tint != null) {
            MeshManager.transform3F(meshData, VertexAttribute.rgb, rgb => rgb.multiply(this.tint));
        }

        this.drawable.addMeshHandles(model.meshManager.addMeshData(meshData, index => model.getMaterial(index)));
    }
    
    getModel(): Model {
        return this.model;
    }
}