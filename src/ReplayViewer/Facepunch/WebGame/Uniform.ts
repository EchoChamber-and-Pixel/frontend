import { ShaderProgram, CommandBufferParameter, CommandBuffer, Texture } from ".";

export interface IUniformCtor<TUniform extends Uniform> {
    new (program: ShaderProgram, name: string): TUniform;
}

export abstract class Uniform {
    protected readonly context: WebGLRenderingContext;

    protected readonly program: ShaderProgram;
    private name: string;
    private location: WebGLUniformLocation | undefined;

    private parameter: CommandBufferParameter | undefined;

    isSampler = false;

    constructor(program: ShaderProgram, name: string) {
        this.program = program;
        this.name = name;
        this.context = program.context;
    }

    toString(): string {
        return this.name;
    }

    getLocation(): WebGLUniformLocation | undefined {
        if (this.location !== undefined) return this.location;
        if (!this.program.isCompiled()) return undefined;
        return this.location = this.context.getUniformLocation(this.program.getProgram(), this.name) as WebGLUniformLocation;
    }

    reset(): void {
        this.parameter = undefined;
    }

    bufferParameter(buf: CommandBuffer, param: CommandBufferParameter) {
        if (this.parameter === param) return;
        this.parameter = param;
        buf.setUniformParameter(this, param);
    }
}

export class Uniform1F extends Uniform {
    private x: number | undefined;

    reset(): void {
        super.reset();
        this.x = undefined;
    }

    bufferValue(buf: CommandBuffer, x: number): void {
        if (!buf.immediate && this.x === x) return;
        this.x = x;
        buf.setUniform1F(this, x);
    }

    set(x: number): void {
        this.context.uniform1f(this.getLocation()!, x);
    }
}

export class Uniform1I extends Uniform {
    private x: number | undefined;

    reset(): void {
        super.reset();
        this.x = undefined;
    }

    bufferValue(buf: CommandBuffer, x: number): void {
        if (!buf.immediate && this.x === x) return;
        this.x = x;
        buf.setUniform1I(this, x);
    }

    set(x: number): void {
        this.context.uniform1i(this.getLocation()!, x);
    }
}

export class Uniform2F extends Uniform {
    private x: number | undefined;
    private y: number | undefined;

    reset(): void {
        super.reset();
        this.x = undefined;
        this.y = undefined;
    }

    bufferValue(buf: CommandBuffer, x: number, y: number): void {
        if (!buf.immediate && this.x === x && this.y === y) return;
        this.x = x;
        this.y = y;
        buf.setUniform2F(this, x, y);
    }

    set(x: number, y: number): void {
        this.context.uniform2f(this.getLocation()!, x, y);
    }
}

export class Uniform3F extends Uniform {
    private x: number | undefined;
    private y: number | undefined;
    private z: number | undefined;

    reset(): void {
        super.reset();
        this.x = undefined;
        this.y = undefined;
        this.z = undefined;
    }

    bufferValue(buf: CommandBuffer, x: number, y: number, z: number): void {
        if (!buf.immediate && this.x === x && this.y === y && this.z === z) return;
        this.x = x;
        this.y = y;
        this.z = z;
        buf.setUniform3F(this, x, y, z);
    }

    set(x: number, y: number, z: number): void {
        this.context.uniform3f(this.getLocation()!, x, y, z);
    }
}

export class Uniform4F extends Uniform {
    private x: number | undefined;
    private y: number | undefined;
    private z: number | undefined;
    private w: number | undefined;

    reset(): void {
        super.reset();
        this.x = undefined;
        this.y = undefined;
        this.z = undefined;
        this.w = undefined;
    }

    bufferValue(buf: CommandBuffer, x: number, y: number, z: number, w: number): void {
        if (!buf.immediate && this.x === x && this.y === y && this.z === z && this.w === w) return;
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        buf.setUniform4F(this, x, y, z, w);
    }

    set(x: number, y: number, z: number, w: number): void {
        this.context.uniform4f(this.getLocation()!, x, y, z, w);
    }
}

export class UniformSampler extends Uniform {
    private value: number | undefined;
    private default: Texture | undefined;

    private texUnit: number;
    private sizeUniform: Uniform4F | undefined;

    constructor(program: ShaderProgram, name: string) {
        super(program, name);

        this.isSampler = true;

        this.texUnit = program.reserveNextTextureUnit();
    }

    getSizeUniform(): Uniform4F {
        if (this.sizeUniform != null) return this.sizeUniform;
        return this.sizeUniform = this.program.addUniform(`${this}_Size`, Uniform4F) as Uniform4F;
    }

    hasSizeUniform(): boolean {
        return this.sizeUniform != null;
    }

    getTexUnit(): number {
        return this.texUnit;
    }

    setDefault(tex: Texture): void {
        this.default = tex;
    }

    reset(): void {
        super.reset();
        this.value = undefined;
    }

    bufferValue(buf: CommandBuffer, tex: Texture | null): void {
        if (tex == null || !tex.isLoaded()) {
            tex = this.default as Texture;
        }

        buf.bindTexture(this.texUnit, tex);

        if (!buf.immediate && this.value !== this.texUnit) {
            this.value = this.texUnit;
            buf.setUniform1I(this, this.texUnit);
        }

        if (this.sizeUniform == null) return;

        if (tex != null) {
            buf.setUniformTextureSize(this.sizeUniform, tex);
        } else {
            this.sizeUniform.bufferValue(buf, 1, 1, 1, 1);
        }
    }

    set(tex: Texture): void {
        if (tex == null || !tex.isLoaded()) {
            tex = this.default as Texture;
        }

        this.context.activeTexture(this.context.TEXTURE0 + this.texUnit);
        this.context.bindTexture(tex.getTarget(), tex.getHandle());
        this.context.uniform1i(this.getLocation()!, this.texUnit);
        
        const width = tex.getWidth(0);
        const height = tex.getHeight(0);

        this.sizeUniform!.set(width, height, 1 / width, 1 / height);
    }
}

export class UniformMatrix4 extends Uniform {
    private transpose: boolean | undefined;
    private values: Float32Array | undefined;

    reset(): void {
        super.reset();
        this.transpose = undefined;
        this.values = undefined;
    }

    bufferValue(buf: CommandBuffer, transpose: boolean, values: Float32Array): void {
        if (!buf.immediate && this.transpose === transpose && this.values === values) return;
        this.transpose = transpose;
        this.values = values;

        buf.setUniformMatrix4(this, transpose, values);
    }

    set(transpose: boolean, values: Float32Array): void {
        this.context.uniformMatrix4fv(this.getLocation()!, transpose, values);
    }
}