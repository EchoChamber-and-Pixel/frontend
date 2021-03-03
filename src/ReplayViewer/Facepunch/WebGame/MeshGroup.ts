import { DrawMode, Material, VertexAttribute, MeshHandle, CommandBuffer, ShaderProgram } from ".";
import { WebGl } from "..";

export interface IMeshElement {
    mode: DrawMode,
    material: number | Material;
    indexOffset: number;
    indexCount: number;
    vertexOffset?: number;
    vertexCount?: number;
}

export interface IMeshData {
    attributes: VertexAttribute[];
    elements: IMeshElement[];
    vertices: number[];
    indices: number[];
}

export interface ICompressedMeshData {
    attributes: (VertexAttribute | string)[];
    elements: IMeshElement[];
    vertices: number[] | string;
    indices: number[] | string;
}

export class MeshGroup {
    private static readonly maxIndexDataLength = 2147483648;
    private static readonly vertexComponentSize = 4;

    private static nextId = 1;

    readonly id = MeshGroup.nextId++;

    private readonly context: WebGLRenderingContext;
    private readonly attribs: VertexAttribute[];
    private readonly attribOffsets: number[];

    readonly vertexLength: number;
    readonly indexSize: number;

    private readonly maxVertexDataLength: number;
    private readonly maxSubBufferLength: number;

    private vertexBuffer: WebGLBuffer | undefined;
    private indexBuffer: WebGLBuffer | undefined;

    private vertexData!: Float32Array;
    private indexData!: Uint16Array | Uint32Array;

    private vertexDataLength = 0;
    private indexDataLength = 0;
    private subBufferOffset = 0;

    constructor(context: WebGLRenderingContext, attribs: VertexAttribute[]) {
        this.context = context;

        this.indexSize = context.getExtension("OES_element_index_uint") != null ? 4 : 2;
        this.vertexLength = 0;

        this.attribs = [];
        this.attribOffsets = [];
        for (let i = 0; i < attribs.length; ++i) {
            this.attribs.push(attribs[i]);
            this.attribOffsets.push(this.vertexLength * MeshGroup.vertexComponentSize);
            this.vertexLength += attribs[i].size;
        }

        const maxVertsPerSubBuffer = this.indexSize === 4 ? 2147483648 : 65536;
        
        this.maxVertexDataLength = MeshGroup.maxIndexDataLength;
        this.maxSubBufferLength = this.vertexLength * maxVertsPerSubBuffer;

        this.vertexBuffer = context.createBuffer() as Float32Array;
        this.indexBuffer = context.createBuffer() as Uint16Array;
    }

    clear(): void {
        this.vertexDataLength = 0;
        this.indexDataLength = 0;
        this.subBufferOffset = 0;
    }

    compareTo(other: MeshGroup): number {
        return this.id - other.id;
    }

    canAddMeshData(data: IMeshData): boolean {
        if (this.attribs.length !== data.attributes.length) return false;

        for (let i = 0; i < this.attribs.length; ++i) {
            if (VertexAttribute.compare(this.attribs[i], data.attributes[i]) !== 0) return false;
        }

        return this.vertexDataLength + data.vertices.length <= this.maxVertexDataLength
            && this.indexDataLength + data.indices.length <= MeshGroup.maxIndexDataLength;
    }

    private ensureCapacity<TArray extends Float32Array | Uint16Array | Uint32Array>
        (array: TArray, length: number, ctor: (size: number) => TArray): TArray
    {
        if (array != null && array.length >= length) return array;

        let newLength = 2048;
        while (newLength < length) newLength *= 2;

        const newArray = ctor(newLength);
        if (array != null) newArray.set(array, 0);

        return newArray;
    }

    private updateBuffer<TArray extends Float32Array | Uint16Array | Uint32Array>
        (target: number, buffer: WebGLBuffer, data: TArray, newData: TArray, oldData: TArray, offset: number) {
        const gl = this.context;

        gl.bindBuffer(target, buffer);

        if (data !== oldData) {
            gl.bufferData(target, data.byteLength, gl.STATIC_DRAW);
            gl.bufferSubData(target, 0, data);
        } else {
            gl.bufferSubData(target, offset * data.BYTES_PER_ELEMENT, newData);
        }
    }

    addVertexData(data: Float32Array, meshHandle?: MeshHandle): number {
        const gl = this.context;

        // TODO: maybe validate MeshHandle if given

        const vertexOffset = this.vertexDataLength;
        const oldVertexData = this.vertexData;
        this.vertexData = this.ensureCapacity(this.vertexData,
            this.vertexDataLength + data.length,
            size => new Float32Array(size));

        this.vertexData.set(data, vertexOffset);
        this.vertexDataLength += data.length;

        if (this.vertexDataLength - this.subBufferOffset > this.maxSubBufferLength) {
            this.subBufferOffset = vertexOffset;
        }

        this.updateBuffer(gl.ARRAY_BUFFER, this.vertexBuffer!, this.vertexData, data, oldVertexData, vertexOffset);

        return vertexOffset;
    }

    addIndexData(data: Uint32Array | Uint16Array, meshHandle?: MeshHandle): number {
        if (data.BYTES_PER_ELEMENT !== this.indexSize) {
            throw new Error(`Expected index data element size to be ${this.indexSize}, not ${data.BYTES_PER_ELEMENT}.`);
        }

        // TODO: maybe validate MeshHandle if given

        const gl = this.context;

        const indexOffset = this.indexDataLength;
        const oldIndexData = this.indexData;
        this.indexData = this.ensureCapacity(this.indexData,
            this.indexDataLength + data.length,
            this.indexSize === 4 ? size => new Uint32Array(size) : size => new Uint16Array(size));

        this.indexData.set(data, indexOffset);
        this.indexDataLength += data.length;

        this.updateBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer!, this.indexData, data, oldIndexData, indexOffset);

        if (meshHandle != null) {
            meshHandle.indexCount += data.length;
        }

        return indexOffset;
    }

    addMeshData(data: IMeshData, getMaterial: (materialIndex: number) => Material, target: MeshHandle[]): void {
        if (!this.canAddMeshData(data)) {
            throw new Error("Target MeshGroup is incompatible with the given IMeshData.");
        }

        const gl = this.context;

        const newVertices = new Float32Array(data.vertices);
        const newIndices = this.indexSize === 4 ? new Uint32Array(data.indices) : new Uint16Array(data.indices);

        const oldVertexData = this.vertexData;
        const oldIndexData = this.indexData;

        const vertexOffset = this.addVertexData(newVertices);
        
        const elementOffset = Math.round(vertexOffset / this.vertexLength) - this.subBufferOffset;
        if (elementOffset !== 0) {
            for (let i = 0, iEnd = newIndices.length; i < iEnd; ++i) {
                newIndices[i] += elementOffset;
            }
        }

        const indexOffset = this.addIndexData(newIndices);

        for (let i = 0; i < data.elements.length; ++i) {
            const element = data.elements[i];
            const material = typeof element.material === "number"
                ? getMaterial != null ? getMaterial(element.material) : null
                : element.material;
            target.push(new MeshHandle(this, this.subBufferOffset, WebGl.decodeConst(element.mode),
                element.indexOffset + indexOffset, element.indexCount, material!));
        }
    }

    bufferBindBuffers(buf: CommandBuffer, program: ShaderProgram): void {
        const gl = this.context;

        buf.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer!);
        buf.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer!);

        program.bufferEnableAttributes(buf, this.attribs);
    }

    bufferAttribPointers(buf: CommandBuffer, program: ShaderProgram, vertexOffset: number): void {
        const gl = this.context;

        const compSize = MeshGroup.vertexComponentSize;
        const stride = this.vertexLength * compSize;

        for (let i = 0, iEnd = this.attribs.length; i < iEnd; ++i) {
            program.bufferAttribPointer(buf, this.attribs[i], stride, vertexOffset + this.attribOffsets[i]);
        }
    }

    bufferRenderElements(buf: CommandBuffer, mode: number, offset: number, count: number): void {
        const gl = this.context;

        buf.drawElements(mode, count, this.indexSize === 4 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
            offset * this.indexSize, this.indexSize);
    }

    dispose(): void {
        if (this.vertexBuffer !== undefined) {
            this.context.deleteBuffer(this.vertexBuffer);
            this.vertexBuffer = undefined;
        }

        if (this.indexBuffer !== undefined) {
            this.context.deleteBuffer(this.indexBuffer);
            this.indexBuffer = undefined;
        }
    }
}