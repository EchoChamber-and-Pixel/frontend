import { IFace, IMaterialGroup, IPageInfo, MapViewer, PagedLoader, ResourcePage } from ".";
import { MeshHandle, MeshManager } from "../Facepunch/WebGame";

export interface IDispGeometryPage {
    displacements: IFace[];
    materials: IMaterialGroup[];
}

export class DispGeometryPage extends ResourcePage<IDispGeometryPage, MeshHandle> {
    private readonly viewer: MapViewer;

    private matGroups!: MeshHandle[][];
    private dispFaces!: IFace[];

    constructor(viewer: MapViewer, page: IPageInfo) {
        super(page);

        this.viewer = viewer;
    }

    onLoadValues(page: IDispGeometryPage): void {
        this.matGroups = new Array<MeshHandle[]>(page.materials.length);
        this.dispFaces = page.displacements;

        for (let i = 0, iEnd = page.materials.length; i < iEnd; ++i) {
            const matGroup = page.materials[i];
            const mat = this.viewer.mapMaterialLoader.loadMaterial(matGroup.material);
            const data = MeshManager.decompress(matGroup.meshData);
            this.matGroups[i] = this.viewer.meshes.addMeshData(data, index => mat);
        }

        super.onLoadValues(page);
    }

    protected onGetValue(index: number): MeshHandle {
        const dispFace = this.dispFaces[index];
        if (dispFace.element === -1 || dispFace.material === -1) return null!;
        return this.matGroups[dispFace.material][dispFace.element];
    }
}

export class DispGeometryLoader extends PagedLoader<IDispGeometryPage, MeshHandle, DispGeometryPage> {
    readonly viewer: MapViewer;

    constructor(viewer: MapViewer) {
        super();

        this.viewer = viewer;
    }

    protected onCreatePage(page: IPageInfo): DispGeometryPage {
        return new DispGeometryPage(this.viewer, page);
    }
}