import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
export default function Home() {
  const [userDetails, setUserDetails] = useState([]);
  async function getUser() {
    try {
      const response = await fetch("http://localhost:2001/user/listAll", {
        method: "POST",
        headers: {
          authorization: "yk11_",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(),
      });
      const data = await response.json();
      setUserDetails(data.result);
    } catch (e) {}
  }

  return (
    <div>
      <h1>home</h1>
      {userDetails.map((data) => {
        return (
          <>
            <div>{data.first_name}</div>
            <div>{data.last_name}</div>
            <div>{data.email}</div>
            <div>{data.mobile}</div>
            <Link
              className="btn btn-primary mx-1"
              to="/update"
              role="button"
              state={data}
            >
              Update data
            </Link>
          </>
        );
      })}
      <div></div>
      <button onClick={getUser}>Get Users</button>
    </div>
  );
}
