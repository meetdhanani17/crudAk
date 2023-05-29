import React, { useState, useEffect, useReducer } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Router,
  Navigate,
} from "react-router-dom";
import UserDetails from "./components/UserDetails";
import About from "./components/About";
import Navbar from "./components/Navbar";
import Singup from "./components/Singup";
import Update from "./components/Update";
import Login from "./components/Login";
import Alert from "./components/Alert";
import Home from "./components/Home";

function App() {
  const [alert, setAlert] = useState(null);
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const showAlert = (message, type) => {
    setAlert({
      msg: message,
      type: type,
    });
    setTimeout(() => {
      setAlert(null);
    }, 1500);
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    }
    console.log(userData);
    const tempToken = localStorage.getItem("token");
    if (token || tempToken) {
      fetch("http://localhost:2001/user_details/token", {
        method: "POST",
        headers: {
          authorization: "yk11_",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: token || tempToken }),
      })
        .then((data) => data.json())
        .then((data) => {
          if (data.success) {
            setUserData(data);
          } else {
            localStorage.removeItem("token");
          }
        });
    }
  }, [token]);
  return (
    <BrowserRouter>
      <Navbar userData={userData} setUserData={setUserData} />
      <Alert alert={alert} />
      <Routes>
        <Route exact path="/" element={<Home showAlert={showAlert} />} />
        <Route exact path="/about" element={<About />} />
        <Route
          exact
          path="/singup"
          element={<Singup showAlert={showAlert} />}
        />
        <Route
          exact
          path="/user"
          element={
            userData ? (
              <UserDetails
                userData={userData}
                showAlert={showAlert}
                setUserData={setUserData}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          exact
          path="/update"
          element={
            userData ? (
              <Update
                setUserData={setUserData}
                showAlert={showAlert}
                setToken={setToken}
                userData={userData}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          exact
          path="/login"
          element={<Login showAlert={showAlert} setToken={setToken} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
