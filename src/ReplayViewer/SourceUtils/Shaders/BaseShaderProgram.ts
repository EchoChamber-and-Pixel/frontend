import { ShaderProgram, CommandBuffer, Material } from "../../Facepunch/WebGame";

export class BaseMaterial {
    cullFace = true;
}

export class BaseShaderProgram<TMaterial extends BaseMaterial> extends ShaderProgram {
    private readonly materialCtor: { new(): TMaterial };

    constructor(context: WebGLRenderingContext, ctor: { new(): TMaterial }) {
        super(context);

        this.materialCtor = ctor;
    }

    createMaterialProperties(): any {
        return new this.materialCtor();
    }

    bufferMaterial(buf: CommandBuffer, material: Material): void {
        this.bufferMaterialProps(buf, material.properties as TMaterial);
    }

    bufferMaterialProps(buf: CommandBuffer, props: TMaterial): void {
        const gl = this.context;

        if (props.cullFace) {
            buf.enable(gl.CULL_FACE);
        } else {
            buf.disable(gl.CULL_FACE);
        }
    }
}