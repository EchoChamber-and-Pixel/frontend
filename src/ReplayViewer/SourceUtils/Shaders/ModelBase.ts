import { Vector3 } from "../../Facepunch";
import { BaseMaterialProps, BaseShaderProgram, Camera, CommandBuffer, Fog, Texture, TextureUtils, Uniform1F, Uniform1I, Uniform3F, Uniform4F, UniformMatrix4, UniformSampler, VertexAttribute } from "../../Facepunch/WebGame";

export class ModelBaseMaterial extends BaseMaterialProps {
    basetexture: Texture | null = null;
    alphaTest = false;
    translucent = false;
    alpha = 1;
    fogEnabled = true;
    emission = false;
    emissionTint = new Vector3(0, 0, 0);
}

export abstract class ModelBase<TMaterial extends ModelBaseMaterial> extends BaseShaderProgram<TMaterial> {
    readonly uProjection = this.addUniform("uProjection", UniformMatrix4);
    readonly uView = this.addUniform("uView", UniformMatrix4);
    readonly uModel = this.addUniform("uModel", UniformMatrix4);

    readonly uBaseTexture = this.addUniform("uBaseTexture", UniformSampler);

    readonly uAlphaTest = this.addUniform("uAlphaTest", Uniform1F);
    readonly uTranslucent = this.addUniform("uTranslucent", Uniform1F);
    readonly uAlpha = this.addUniform("uAlpha", Uniform1F);

    readonly uFogParams = this.addUniform("uFogParams", Uniform4F);
    readonly uFogColor = this.addUniform("uFogColor", Uniform3F);
    readonly uFogEnabled = this.addUniform("uFogEnabled", Uniform1I);

    readonly uEmission = this.addUniform("uEmission", Uniform1I);
    readonly uEmissionTint = this.addUniform("uEmissionTint", Uniform3F);

    constructor(context: WebGLRenderingContext, ctor: { new(): TMaterial }) {
        super(context, ctor);

        const gl = context;

        this.includeShaderSource(gl.VERTEX_SHADER, `
            attribute vec3 aPosition;
            attribute vec2 aTextureCoord;

            varying vec2 vTextureCoord;
            varying float vDepth;

            uniform mat4 ${this.uProjection};
            uniform mat4 ${this.uView};
            uniform mat4 ${this.uModel};

            uniform mediump int ${this.uEmission};

            void ModelBase_main()
            {
                vec4 viewPos = ${this.uView} * ${this.uModel} * vec4(aPosition, 1.0);

                gl_Position = ${this.uProjection} * viewPos;

                vTextureCoord = aTextureCoord;
                vDepth = -viewPos.z;
            }`);

        this.includeShaderSource(gl.FRAGMENT_SHADER, `
            precision mediump float;

            varying vec2 vTextureCoord;
            varying float vDepth;

            uniform sampler2D ${this.uBaseTexture};

            uniform float ${this.uAlphaTest};   // [0, 1]
            uniform float ${this.uTranslucent}; // [0, 1]
            uniform float ${this.uAlpha};       // [0..1]

            uniform vec4 ${this.uFogParams};
            uniform vec3 ${this.uFogColor};
            uniform int ${this.uFogEnabled};

            uniform int ${this.uEmission};
            uniform vec3 ${this.uEmissionTint};

            vec3 ApplyFog(vec3 inColor)
            {
                if (${this.uFogEnabled} == 0) return inColor;

                float fogDensity = ${this.uFogParams}.x + ${this.uFogParams}.y * vDepth;
                fogDensity = min(max(fogDensity, ${this.uFogParams}.z), ${this.uFogParams}.w);
                return mix(inColor, ${this.uFogColor}, fogDensity);
            }

            vec4 ModelBase_main()
            {
                vec4 sample = texture2D(${this.uBaseTexture}, vTextureCoord);
                if (sample.a <= ${this.uAlphaTest} - 0.5) discard;

                float alpha = mix(1.0, ${this.uAlpha} * sample.a, ${this.uTranslucent});

                if (${this.uEmission} != 0)
                {
                    sample.rgb += ${this.uEmissionTint};
                }

                return vec4(sample.rgb, alpha);
            }`);

        this.addAttribute("aPosition", VertexAttribute.position);
        this.addAttribute("aTextureCoord", VertexAttribute.uv);

        this.uBaseTexture.setDefault(TextureUtils.getErrorTexture(context));
    }

    bufferSetup(buf: CommandBuffer): void {
        super.bufferSetup(buf);

        this.uProjection.bufferParameter(buf, Camera.projectionMatrixParam);
        this.uView.bufferParameter(buf, Camera.viewMatrixParam);

        this.uFogParams.bufferParameter(buf, Fog.fogInfoParam);
        this.uFogColor.bufferParameter(buf, Fog.fogColorParam);
    }

    bufferModelMatrix(buf: CommandBuffer, value: Float32Array): void {
        super.bufferModelMatrix(buf, value);

        this.uModel.bufferValue(buf, false, value);
    }

    bufferMaterialProps(buf: CommandBuffer, props: TMaterial): void {
        super.bufferMaterialProps(buf, props);

        this.uBaseTexture.bufferValue(buf, props.basetexture!);

        this.uAlphaTest.bufferValue(buf, props.alphaTest ? 1 : 0);
        this.uTranslucent.bufferValue(buf, props.translucent ? 1 : 0);
        this.uAlpha.bufferValue(buf, props.alpha);

        this.uFogEnabled.bufferValue(buf, props.fogEnabled ? 1 : 0);

        this.uEmission.bufferValue(buf, props.emission ? 1 : 0);
        if (props.emission) {
            this.uEmissionTint.bufferValue(buf, props.emissionTint.x, props.emissionTint.y, props.emissionTint.z);
        }

        const gl = this.context;

        buf.enable(gl.DEPTH_TEST);

        if (props.translucent) {
            buf.depthMask(false);
            buf.enable(gl.BLEND);
            buf.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        } else {
            buf.depthMask(true);
            buf.disable(gl.BLEND);
        }
    }
}