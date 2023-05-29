import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
export default function Update(props) {
  const Navigate = useNavigate();
  const location = useLocation();

  const [credentials, setCredentials] = useState({
    first_name: location.state
      ? location.state.first_name
      : props.userData.result.first_name,
    last_name: location.state
      ? location.state.last_name
      : props.userData.result.last_name,
    email: location.state ? location.state.email : props.userData.result.email,
    mobile: location.state
      ? location.state.mobile
      : props.userData.result.mobile,
  });
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:2001/user/update", {
        method: "POST",
        headers: {
          authorization: "yk11_",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...credentials,
          _id: location.state ? location.state._id : props.userData.result._id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Registration successful
        props.showAlert("Data Updated", "success");

        Navigate("/"); // Redirect to login page
        location.state &&
          location.state.email === props.userData.result.email &&
          props.setUserData((pre) => {
            return {
              ...pre,
              result: {
                ...pre.result,
                first_name: credentials.first_name,
                last_name: credentials.last_name,
                email: credentials.email,
                mobile: credentials.mobile,
              },
            };
          });
        location.state ||
          props.setUserData((pre) => {
            return {
              ...pre,
              result: {
                ...pre.result,
                first_name: credentials.first_name,
                last_name: credentials.last_name,
                email: credentials.email,
                mobile: credentials.mobile,
              },
            };
          });
      } else {
        // Registration failed
        props.showAlert("Registration failed", "danger", data.error);
      }
    } catch (error) {
      console.log("Error:", error.message);
    }
  };
  const onChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  return (
    <div className="container my-3">
      <>
        <h2>Signup</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="FirstName" className="form-label">
              First Name
            </label>
            <input
              type="text"
              className="form-control"
              name="first_name"
              id="First Name"
              value={credentials.first_name}
              onChange={onChange}
              aria-describedby="fn"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="LastName" className="form-label">
              Last Name
            </label>
            <input
              type="text"
              className="form-control"
              name="last_name"
              value={credentials.last_name}
              id="Last Name"
              onChange={onChange}
              aria-describedby="ln"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="Email address" className="form-label">
              Email address
            </label>
            <input
              type="email"
              className="form-control"
              name="email"
              id="Email address"
              value={credentials.email}
              onChange={onChange}
              aria-describedby="email"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="Mobile" className="form-label">
              Mobile
            </label>
            <input
              type="number"
              className="form-control"
              name="mobile"
              id="Mobile"
              value={credentials.mobile}
              onChange={onChange}
              aria-describedby="Mobile"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Update
          </button>
        </form>
      </>
    </div>
  );
}
