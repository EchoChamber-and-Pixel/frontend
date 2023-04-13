import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

function modeToString(mode: number) {
    if (mode === 0)
        return 'VNL';
    if (mode === 1)
        return 'SKZ';
    if (mode === 2)
        return 'KZT';
    return 'UNK';
}

// https://stackoverflow.com/a/52560608
const format = (val: number) => `0${Math.floor(val)}`.slice(-2);
function formatTime(timeS: number) {
    const hours = timeS / 3600;
    const minutes = (timeS % 3600) / 60;
    const seconds = timeS % 60;

    return [hours, minutes, seconds].map(format).join(':');
}

function Replay() {
    const div = useRef(null);
    const { replayId } = useParams() as any;

    const [replay, setReplay] = useState(false as any);

    useEffect(() => {
        const viewer = new Gokz.ReplayViewer(div.current! as HTMLElement);
        viewer.mapBaseUrl = '//static.ruto.sh/resources/maps';
        viewer.isPlaying = true;
        viewer.showDebugPanel = false;
        viewer.showKeyDisplay = false;

        viewer.replayLoaded.addListener((replayFile) => {
            setReplay(replayFile);
        });

        const replayUrl = `/api/replays/${replayId}`;
        viewer.loadReplay(replayUrl);
        viewer.animate();
    }, [replayId]);

    return (
        <div>
            <div>
                { replay ? <h1>{replay.playerName} [{modeToString(replay.mode)} | { replay.course}] ON {replay.mapName} - {formatTime(replay.time)}</h1> : <h1>Loading</h1> }
            </div>
            <div ref={div} id="replaybox"></div>
        </div>
    )
}

 export default Replay;