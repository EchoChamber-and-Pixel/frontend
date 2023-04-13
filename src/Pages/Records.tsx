import moment from "moment";
import { ChangeEvent, useEffect, useState } from "react";
import { FormGroup, Input, Label, Table } from "reactstrap";
import { GetMaps, GetRecords } from "../API/RecordsEndpoints";
import Record from '../Models/Record';

// https://stackoverflow.com/a/52560608
const format = (val: number) => `0${Math.floor(val)}`.slice(-2);
function formatTime(timeInMs: number) {
    const hours = timeInMs / 3.6e+6;
    const minutes = timeInMs / 60000;
    const seconds = (timeInMs / 1000) % 60;
    return [hours, minutes, seconds].map(format).join(':');
}

/**
 * Render component for records.
 */
function Records() {
  const [records, setRecords] = useState<Record[]>([]);
  const [maps, setMaps] = useState<string[]>([]);
  const [mapFilter, setMapFilter] = useState<string>('');

  const fetchRecords = async () => {
    const data = await GetRecords(mapFilter);
    setRecords(data);
  };

  const fetchMaps = async () => {
    const data = await GetMaps();
    setMaps(data.map(ele => ele.name));
  }

  const onFilterChange = function (evt: ChangeEvent<HTMLInputElement>) {
    setMapFilter(evt.target.value);
  }

  useEffect(() => {
    fetchRecords();
    fetchMaps();
  }, [mapFilter]);

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
      <FormGroup>
        <Label for="mapSelect">Map</Label>
        <Input type="select" name="mapSelect" id="mapSelect" onChange={onFilterChange}>
          <option value="">Filter map</option>
          {maps.map((map, i) => {
            return <option key={i} value={map}>{map}</option>
          })}
        </Input>
      </FormGroup>
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
