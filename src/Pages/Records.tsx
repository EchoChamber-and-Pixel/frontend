import moment from "moment";
import { useEffect, useState } from "react";
import { Table } from "reactstrap";
import { GetRecords } from "../API/RecordsEndpoints";
import Record from '../Models/Record';

// https://stackoverflow.com/a/52560608
const format = (val: number) => `0${Math.floor(val)}`.slice(-2);
function formatTime(timeS: number) {
    const hours = timeS / 3600;
    const minutes = (timeS % 3600) / 60;
    const seconds = timeS % 60;

    return [hours, minutes, seconds].map(format).join(':');
}

/**
 * Render component for records.
 */
function Records() {
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await GetRecords();
      setRecords(data);
    };

    fetchData();
  }, []);

  return (
    <div
      style={{
        maxWidth: "96%",
        margin: "auto",
        paddingTop: "40px",
        textAlign: "left",
      }}
    >
      <legend style={{ textAlign: "left" }}>
        Records{" "}
        <span role="img" aria-label="record button">
          ⏺
        </span>
      </legend>
      <Table striped hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Player</th>
            <th>Time</th>
            <th>Map</th>
            <th>Course</th>
            <th>Mode</th>
            <th>Created</th>
            <th>Replay</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, i) => {
            return <tr key={i}>
              <td>{record.id}</td>
              <td>{record.playerName}</td>
              <td>{formatTime(record.time)}</td>
              <td>{record.mapName}</td>
              <td>{record.course}</td>
              <td>{record.mode}</td>
              <td>{moment(record.created+'Z').fromNow()}</td>
              <td><a href={`/replay/${record.id}`}>Watch</a></td>
            </tr>;
          })}
        </tbody>
      </Table>
      
    </div>
  );
}

export default Records;
