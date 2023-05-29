import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login(props) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const Navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Perform database checking and authentication
    try {
      const response = await fetch("http://localhost:2001/login", {
        method: "POST",
        headers: {
          authorization: "yk11_",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        // Authentication successful
        props.showAlert("Login successful", "success");
        localStorage.setItem("token", data.result.token);
        props.setToken(data.result.token);
        Navigate("/"); // Redirect to the homepage
      } else {
        // Authentication failed
        props.showAlert("Login failed", "danger");
      }
    } catch (error) {
      console.log("Error:", error.message);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <div>
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </div>
      </form>
    </div>
  );
}
