import { useEffect, useRef } from "react";

function Replay() {
    const div = useRef(null);

    useEffect(() => {
        const viewer = new Gokz.ReplayViewer(div.current! as HTMLElement);
        viewer.mapBaseUrl = '//static.ruto.sh/resources/maps';
        viewer.isPlaying = true;
        viewer.showDebugPanel = false;

        viewer.replayLoaded.addListener((replay) => {
            // const strMode = Gokz.GlobalMode[replay.mode].toUpperCase();
            // this.title = `${replay.playerName} [${strMode}] on ${replay.mapName} - Stage ${replay.course}`;
        });

        const replayUrl = `/kz_reach_v2.replay`;
        console.log(replayUrl);
        viewer.loadReplay(replayUrl);
        viewer.animate();
    }, []);

    return (
        <div>
            hello there
            <div ref={div} id="asdf"></div>
        </div>
    )
}

 export default Replay;