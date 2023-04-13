import React, { useRef } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { Button } from "reactstrap"
import { ReplayResponse, UploadReplay } from "../API/ReplaysEndpoints";


function Upload(props: RouteComponentProps) { 
    const fileInput = useRef(null);

    const buttonClick = (event: React.MouseEvent) => (fileInput.current as any).click();

    const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;
        const file = event.target.files[0];
        const response = await UploadReplay(file);
        if (!response) return;
        const replayResponse = response as ReplayResponse;
        console.log(replayResponse.id);
        props.history.push(`/replay/${replayResponse.id}`);
    }
    return (
        <div>
            <input type="file" ref={fileInput} hidden onChange={onFileChange} />
            <Button onClick={buttonClick}>Upload</Button>
        </div>
    )
}

export default withRouter(Upload);