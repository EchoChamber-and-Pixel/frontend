import { ResourcePage, PagedLoader, IPageInfo } from ".";
import { IVector3 } from "../Facepunch";

export interface IAmbientPage {
    values: IAmbientSample[][];
}

export interface IAmbientSample {
    position: IVector3;
    samples: number[];
}

export class AmbientPage extends ResourcePage<IAmbientPage, IAmbientSample[]> {
    protected onGetValue(index: number): IAmbientSample[] {
        console.log('hello2');
        console.log(index);
        return this.page.values[index];
    }
}

export class AmbientLoader extends PagedLoader<IAmbientPage, IAmbientSample[], AmbientPage> {
    protected onCreatePage(page: IPageInfo): AmbientPage {
        console.log('hello');
        return new AmbientPage(page);
    }
}