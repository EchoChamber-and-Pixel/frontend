import { useEffect, useState } from "react";
import { GetRecords } from "../API/RecordsEndpoints";

/**
 * Render component for records.
 */
function Records() {
  const [records, setRecords] = useState<string[]>([]);

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
      {records.map((record) => {
        return <span key={record}>{record}</span>;
      })}
    </div>
  );
}

export default Records;
