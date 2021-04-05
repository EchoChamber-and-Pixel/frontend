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
function formatTime(seconds: number) {
    const hours = seconds / 3600
    const minutes = (seconds % 3600) / 60

    return [hours, minutes, seconds % 60].map(format).join(':')
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

        const replayUrl = `https://ruto.sh/api/replays/${replayId}`;
        // console.log(replayUrl);
        viewer.loadReplay(replayUrl);
        viewer.animate();
    }, [replayId]);

    return (
        <div>
            <div>
                { replay ? <h1>{replay.playerName} [{modeToString(replay.mode)} | { replay.course}] ON {replay.mapName} - {formatTime(replay.time)}</h1> : <h1>Loading</h1> }
            </div>
            <div ref={div} id="asdf"></div>
        </div>
    )
}

 export default Replay;