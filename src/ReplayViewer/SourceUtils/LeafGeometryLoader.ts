import { IPageInfo, MapViewer, PagedLoader, ResourcePage } from ".";
import { ICompressedMeshData, MeshHandle, MeshManager } from "../Facepunch/WebGame";

export interface IFace {
    material: number;
    element: number;
}

export interface IMaterialGroup {
    material: number;
    meshData: ICompressedMeshData;
}

export interface ILeafGeometryPage {
    leaves: IFace[][];
    materials: IMaterialGroup[];
}

export class LeafGeometryPage extends ResourcePage<ILeafGeometryPage, MeshHandle[]> {
    private readonly viewer: MapViewer;

    private matGroups!: MeshHandle[][];
    private leafFaces!: IFace[][];

    constructor(viewer: MapViewer, page: IPageInfo) {
        super(page);

        this.viewer = viewer;
    }

    onLoadValues(page: ILeafGeometryPage): void {
        this.matGroups = new Array<MeshHandle[]>(page.materials.length);
        this.leafFaces = page.leaves;

        for (let i = 0, iEnd = page.materials.length; i < iEnd; ++i) {
            const matGroup = page.materials[i];
            const mat = this.viewer.mapMaterialLoader.loadMaterial(matGroup.material);
            const data = MeshManager.decompress(matGroup.meshData);
            this.matGroups[i] = this.viewer.meshes.addMeshData(data, index => mat);
        }

        super.onLoadValues(page);
    }

    protected onGetValue(index: number): MeshHandle[] {
        const leafFaces = this.leafFaces[index];

        const handles = new Array<MeshHandle>(leafFaces.length);
        for (let i = 0, iEnd = leafFaces.length; i < iEnd; ++i) {
            const leafFace = leafFaces[i];
            handles[i] = this.matGroups[leafFace.material][leafFace.element];
        }

        return handles;
    }
}

export class LeafGeometryLoader extends PagedLoader<ILeafGeometryPage, MeshHandle[], LeafGeometryPage> {
    readonly viewer: MapViewer;

    constructor(viewer: MapViewer) {
        super();

        this.viewer = viewer;
    }

    protected onCreatePage(page: IPageInfo): LeafGeometryPage {
        return new LeafGeometryPage(this.viewer, page);
    }
}