import { Vector3 } from "../Facepunch";
import { PvsEntity } from "../SourceUtils/Entities";
import { Map } from "../SourceUtils";
import { ReplayFile, TickData } from ".";
import { DebugLine, DrawList } from "../Facepunch/WebGame";

interface IRouteLineSegment {
    debugLine: DebugLine;
    clusters: {[index: number]: boolean};
}

export class RouteLine extends PvsEntity {
    private static readonly segmentTicks = 60 * 128;

    private readonly segments: IRouteLineSegment[];

    private isVisible = false;

    get visible(): boolean {
        return this.isVisible;
    }

    set visible(value: boolean) {
        if (this.isVisible === value) return;

        this.isVisible = value;
        if (value) {
            this.map.addPvsEntity(this);
        } else {
            this.map.removePvsEntity(this);
        }

        this.map.viewer.forceDrawListInvalidation(true);
    }

    constructor(map: Map, replay: ReplayFile) {
        super(map, { classname: "route_line", clusters: null });

        this.segments = new Array<IRouteLineSegment>(Math.ceil(replay.tickCount / RouteLine.segmentTicks));

        const tickData = new TickData();
        const progressScale = 16 / replay.tickRate;
        const lastPos = new Vector3();
        const currPos = new Vector3();

        for (let i = 0; i < this.segments.length; ++i) {
            const firstTick = i * RouteLine.segmentTicks;
            const lastTick = Math.min((i + 1) * RouteLine.segmentTicks, replay.tickCount - 1);

            const segment = this.segments[i] = {
                debugLine: new DebugLine(map.viewer),
                clusters: {}
            };

            const debugLine = segment.debugLine;
            const clusters = segment.clusters;

            debugLine.setColor({x: 0.125, y: 0.75, z: 0.125}, {x: 0.0, y: 0.25, z: 0.0});
            debugLine.frequency = 4.0;

            let lineStartTick = firstTick;

            for (let t = firstTick; t <= lastTick; ++t) {
                replay.getTickData(t, tickData);

                currPos.copy(tickData.position);
                currPos.z += 16;

                const leaf = map.getLeafAt(currPos);
                if (leaf != null && leaf.cluster !== -1) {
                    (clusters as any)[leaf.cluster] = true;
                }

                // Start new line if first in segment or player teleported
                if (t === firstTick || lastPos.sub(currPos).lengthSq() > 1024.0) {
                    debugLine.moveTo(currPos);
                    lineStartTick = t;
                } else {
                    debugLine.lineTo(currPos, (t - lineStartTick) * progressScale);
                }

                lastPos.copy(currPos);
            }

            debugLine.update();
        }
    }

    protected onPopulateDrawList(drawList: DrawList, clusters: number[]): void {
        for (let segment of this.segments) {
            if (clusters == null) {
                drawList.addItem(segment.debugLine);
                continue;
            }

            const segmentClusters = segment.clusters;

            for (let cluster of clusters) {
                if (segmentClusters[cluster]) {
                    drawList.addItem(segment.debugLine);
                    break;
                }
            }
        }
    }

    dispose(): void {
        this.visible = false;

        for (let segment of this.segments) {
            segment.debugLine.dispose();
        }

        this.segments.splice(0, this.segments.length);
    }
}