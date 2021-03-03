import { TextureLoadable } from ".";
import { Loader } from "..";

export class TextureLoader extends Loader<TextureLoadable> {
    private readonly context: WebGLRenderingContext;
    
    constructor(context: WebGLRenderingContext) {
        super();
        this.context = context;
    }

    protected onCreateItem(url: string): TextureLoadable {
        return new TextureLoadable(this.context, url);
    }
}