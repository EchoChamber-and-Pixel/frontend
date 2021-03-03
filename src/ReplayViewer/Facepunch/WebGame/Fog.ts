import { ICommandBufferParameterProvider, CommandBufferParameter, UniformType, CommandBuffer, Camera } from ".";
import { Vector3 } from "..";

export class Fog implements ICommandBufferParameterProvider {
    static readonly fogColorParam = new CommandBufferParameter(UniformType.Float3);
    static readonly fogInfoParam = new CommandBufferParameter(UniformType.Float4);

    start = 0;
    end = 8192;
    maxDensity = 0;
    
    readonly color = new Vector3();

    private readonly colorValues = new Float32Array(3);
    private readonly paramsValues = new Float32Array(4);
    
    populateCommandBufferParameters(buf: CommandBuffer): void {
        this.colorValues[0] = this.color.x;
        this.colorValues[1] = this.color.y;
        this.colorValues[2] = this.color.z;

        buf.setParameter(Fog.fogColorParam, this.colorValues);

        const clipParams = buf.getArrayParameter(Camera.clipInfoParam);

        const near = clipParams[0];
        const far = clipParams[1];

        const densMul = this.maxDensity / (this.end - this.start);
        const dens0 = (0 - this.start) * densMul;
        const dens1 = (1 - this.start) * densMul;

        this.paramsValues[0] = dens0;
        this.paramsValues[1] = dens1 - dens0;
        this.paramsValues[2] = 0;
        this.paramsValues[3] = this.maxDensity;

        buf.setParameter(Fog.fogInfoParam, this.paramsValues);
    }
}