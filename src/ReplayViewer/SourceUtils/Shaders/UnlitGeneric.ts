import { ModelBase, ModelBaseMaterial } from ".";

export class UnlitGenericMaterial extends ModelBaseMaterial {

}

export class UnlitGeneric extends ModelBase<UnlitGenericMaterial> {
    constructor(context: WebGLRenderingContext) {
        super(context, UnlitGenericMaterial);

        const gl = context;

        this.includeShaderSource(gl.VERTEX_SHADER, `
            void main()
            {
                ModelBase_main();
            }`);

        this.includeShaderSource(gl.FRAGMENT_SHADER, `
            precision mediump float;

            void main()
            {
                vec4 mainSample = ModelBase_main();
                gl_FragColor = vec4(ApplyFog(mainSample.rgb), mainSample.a);
            }`);

        this.compile();
    }
}