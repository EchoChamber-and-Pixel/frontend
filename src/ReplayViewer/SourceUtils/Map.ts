import { BspLeaf, MapViewer, SkyCube } from ".";
import { Http, IVector3, Vector3 } from "../Facepunch";
import { CommandBuffer, CommandBufferParameter, DrawList, ICommandBufferParameterProvider, MaterialLoadable, TextureLoadable, TextureUtils, UniformType } from "../Facepunch/WebGame";
import { BrushEntity, Displacement, Entity, IBrushEntity, IDisplacement, IEntity, IEnvFogController, IKeyframeRope, IMoveRope, ISkyCamera, IStaticProp, IWorldspawn, KeyframeRope, MoveRope, PvsEntity, SkyCamera, StaticProp, Worldspawn } from "./Entities";

export interface IPageInfo {
    first: number;
    count: number;
    url: string;
}

export interface IMap {
    name: string;
    lightmapUrl: string;
    visPages: IPageInfo[];
    leafPages: IPageInfo[];
    dispPages: IPageInfo[];
    materialPages: IPageInfo[];
    brushModelPages: IPageInfo[];
    studioModelPages: IPageInfo[];
    vertLightingPages: IPageInfo[];
    ambientPages: IPageInfo[];
    entities: IEntity[];
}

export class Map implements ICommandBufferParameterProvider {
    static readonly lightmapParam = new CommandBufferParameter(UniformType.Texture);

    readonly viewer: MapViewer;

    skyCamera!: SkyCamera;

    private tSpawns!: IEntity[];
    private ctSpawns!: IEntity[];
    private playerSpawns!: IEntity[];

    private namedEntities: { [targetname: string]: Entity } = {};

    private worldspawn!: Worldspawn;
    private pvsEntities!: PvsEntity[];

    private lightmap!: TextureLoadable;
    private skyCube!: SkyCube;

    private info!: IMap;
    private clusterVis: { [cluster: number]: number[] | null } = {};
    private clusterEnts: { [cluster: number]: PvsEntity[] } = {};

    private worldspawnLoadedCallbacks: (() => void)[] = [];

    constructor(viewer: MapViewer) {
        this.viewer = viewer;
    }

    isReady(): boolean {
        return this.info != null && this.lightmap != null && this.lightmap.isLoaded() && this.worldspawn.model != null;
    }

    unload(): void {
        throw new Error("Map unloading not implemented.");
    }

    load(url: string): void {
        Http.getJson<IMap>(url, info => {
            this.onLoad(info);
        });
    }

    getLightmapLoadProgress(): number {
        return this.lightmap == null ? 0 : this.lightmap.getLoadProgress();
    }

    private onLoad(info: IMap): void {
        if (this.info != null) this.unload();

        this.info = info;
        this.viewer.visLoader.setPageLayout(info.visPages);
        this.viewer.leafGeometryLoader.setPageLayout(info.leafPages);
        this.viewer.dispGeometryLoader.setPageLayout(info.dispPages);
        this.viewer.mapMaterialLoader.setPageLayout(info.materialPages);
        this.viewer.bspModelLoader.setPageLayout(info.brushModelPages);
        this.viewer.studioModelLoader.setPageLayout(info.studioModelPages);
        this.viewer.vertLightingLoader.setPageLayout(info.vertLightingPages);
        this.viewer.ambientLoader.setPageLayout(info.ambientPages);

        this.lightmap = this.viewer.textureLoader.load(info.lightmapUrl);

        this.tSpawns = [];
        this.ctSpawns = [];
        this.playerSpawns = [];

        this.pvsEntities = [];
        for (let i = 0, iEnd = info.entities.length; i < iEnd; ++i) {
            const ent = info.entities[i];
            let inst: Entity | null = null;
            let pvsInst: PvsEntity | null = null;

            switch (ent.classname) {
                case "worldspawn":
                    const worldspawn = ent as IWorldspawn;
                    this.worldspawn = new Worldspawn(this, worldspawn);
                    this.lightmap.addUsage(this.worldspawn);

                    if (worldspawn.skyMaterial != null) {
                        const skyMat = new MaterialLoadable(this.viewer);
                        skyMat.loadFromInfo(worldspawn.skyMaterial);
                        this.skyCube = new SkyCube(this.viewer, skyMat);
                    }

                    break;
                case "env_fog_controller":
                    const fogController = ent as IEnvFogController;
                    const fog = this.viewer.mainCamera.fog;
                    if (!fogController.fogEnabled) break;
                    fog.color.set(fogController.fogColor.r, fogController.fogColor.g, fogController.fogColor.b);
                    fog.start = fogController.fogStart;
                    fog.end = fogController.fogEnd;
                    fog.maxDensity = fogController.fogMaxDensity;

                    if (fogController.farZ !== 0) this.viewer.mainCamera.setFar(fogController.farZ);
                    break;
                case "info_player_terrorist":
                    this.tSpawns.push(ent);
                    break;
                case "info_player_counterterrorist":
                    this.ctSpawns.push(ent);
                    break;
                case "info_player_start":
                    this.playerSpawns.push(ent);
                    break;
                case "displacement":
                    pvsInst = new Displacement(this, ent as IDisplacement);
                    break;
                case "func_brush":
                    pvsInst = new BrushEntity(this, ent as IBrushEntity);
                    break;
                case "prop_static":
                    if ((ent as IStaticProp).model === -1) break;
                    pvsInst = new StaticProp(this, ent as IStaticProp);
                    break;
                case "sky_camera":
                    this.skyCamera = new SkyCamera(this.viewer, ent as ISkyCamera);
                    break;
                case "keyframe_rope":
                    inst = new KeyframeRope(this, ent as IKeyframeRope);
                    break;
                case "move_rope":
                    pvsInst = new MoveRope(this, ent as IMoveRope);
                    break;
                default:
                    inst = new Entity(this, ent);
                    break;
            }

            if (pvsInst != null) {
                this.pvsEntities.push(pvsInst);
            }
        }

        const pos = new Vector3();

        if (this.viewer.mainCamera.getPosition(pos).x === 0 && pos.y === 0 && pos.z === 0) {
            const spawn = this.tSpawns[0] || this.ctSpawns[0] || this.playerSpawns[0];
            this.viewer.mainCamera.setPosition(spawn.origin!);
            this.viewer.mainCamera.translate(0, 0, 64);
            this.viewer.setCameraAngles((spawn.angles!.y - 90) * Math.PI / 180, spawn.angles!.x * Math.PI / 180);
        }

        this.viewer.forceDrawListInvalidation(true);
    }

    addNamedEntity(targetname: string, entity: Entity): void {
        this.namedEntities[targetname] = entity;
    }

    getNamedEntity(targetname: string): Entity {
        return this.namedEntities[targetname];
    }

    addPvsEntity(entity: PvsEntity): void {
        this.pvsEntities.push(entity);
        this.clusterEnts = {};
    }

    removePvsEntity(entity: PvsEntity): void {
        const index = this.pvsEntities.indexOf(entity);
        if (index !== -1) {
            this.pvsEntities.splice(index, 1);
            this.clusterEnts = {};
        }
    }

    getPvsEntitiesInCluster(cluster: number): PvsEntity[] {
        let ents = this.clusterEnts[cluster];
        if (ents !== undefined) return ents;

        this.clusterEnts[cluster] = ents = [];

        for (let ent of this.pvsEntities) {
            if (ent.isInCluster(cluster)) {
                ents.push(ent);
            }
        }

        return ents;
    }

    getLeafAt(pos: IVector3, callback?: (leaf: BspLeaf) => void): BspLeaf | undefined {
        if (this.worldspawn == null || !this.worldspawn.model.isLoaded()) {
            if (callback != null) {
                const posCopy = new Vector3().copy(pos);
                this.worldspawnLoadedCallbacks.push(() => callback(this.getLeafAt(posCopy)!));
            }
            return undefined;
        }

        const leaf = this.worldspawn.model.getLeafAt(pos);
        if (callback != null) callback(leaf);

        return leaf;
    }

    update(dt: number): void {
        if (this.worldspawnLoadedCallbacks.length > 0 && this.worldspawn != null && this.worldspawn.model.isLoaded()) {
            for (let callback of this.worldspawnLoadedCallbacks) {
                callback();
            }

            this.worldspawnLoadedCallbacks = [];
        }
    }

    populateDrawList(drawList: DrawList, pvsRoot: BspLeaf): void {
        if (this.worldspawn == null) return;

        if (pvsRoot != null && this.skyCube != null && (this.skyCamera == null || pvsRoot === this.skyCamera.getLeaf())) {
            drawList.addItem(this.skyCube);
        }

        let vis: number[] | null = null;

        if (this.worldspawn.model != null && pvsRoot != null && pvsRoot.cluster !== undefined) {
            const cluster = pvsRoot.cluster;

            vis = this.clusterVis[cluster];
            if (vis === undefined) {
                let immediate = true;
                this.viewer.visLoader.load(cluster,
                    loaded => {
                        this.clusterVis[cluster] = vis = loaded;
                        if (!immediate) this.viewer.forceDrawListInvalidation(true);
                    });
                immediate = false;

                if (vis === undefined) {
                    this.clusterVis[cluster] = vis = null;
                }
            }
        }

        this.worldspawn.populateDrawList(drawList, vis!);

        if (vis == null) {
            for (let ent of this.pvsEntities) {
                drawList.addItem(ent);
            }
            return;
        }

        for (let cluster of vis) {
            const ents = this.getPvsEntitiesInCluster(cluster);
            for (let ent of ents) {
                if (ent.getIsInDrawList(drawList)) continue;
                ent.populateDrawList(drawList, vis);
            }
        }
    }

    populateCommandBufferParameters(buf: CommandBuffer): void {
        const lightmap = this.lightmap != null && this.lightmap.isLoaded()
            ? this.lightmap
            : TextureUtils.getWhiteTexture(this.viewer.context);

        buf.setParameter(Map.lightmapParam, lightmap);
    }
}