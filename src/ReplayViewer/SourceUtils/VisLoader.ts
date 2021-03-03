import { IPageInfo, PagedLoader, ResourcePage } from ".";
import { Utils } from "../Facepunch";

export interface IVisPage {
    values: (number[] | string)[];
}

export class VisPage extends ResourcePage<IVisPage, number[]> {
    protected onGetValue(index: number): number[] {
        if (typeof (this.page.values[index]) === "string") {
            this.page.values[index] = Utils.decompress(this.page.values[index]) as number[];
        }

        return this.page.values[index] as number[];
    }
}

export class VisLoader extends PagedLoader<IVisPage, number[], VisPage> {
    constructor() {
        super();
        this.throwIfNotFound = false;
    }

    protected onCreatePage(page: IPageInfo): VisPage {
        return new VisPage(page);
    }
}