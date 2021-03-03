import { ModelLoadable, Game } from ".";
import { Loader } from "..";

export class ModelLoader extends Loader<ModelLoadable> {
    private readonly game: Game;
    
    constructor(game: Game) {
        super();
        this.game = game;
    }

    protected onCreateItem(url: string): ModelLoadable {
        return new ModelLoadable(this.game, url);
    }
}