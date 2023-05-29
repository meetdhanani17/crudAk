import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom'


export default function Singup(props) {
  const Navigate=useNavigate();

    const [credentials, setCredentials] = useState({first_name: "",last_name:"", email: "",mobile:"", password: ""}) 
    const handleSubmit = async (e) => {
        e.preventDefault();
       
        try {
          const response = await fetch('http://localhost:2001/user/add', {
            method: 'POST',
            headers: {
              'authorization': 'yk11_',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });
    
          const data = await response.json();
    
          if (data.success) {
            // Registration successful
            props.showAlert("Registration successful","success")
            Navigate('/login');// Redirect to login page
         
          } else {
            if(data.message === "Email Id already registered"){

              props.showAlert(data.message,"danger",data.message)
            }else{
              // Registration failed
              props.showAlert("Registration failed","danger",data.error)

            }
          }
        } catch (error) {
          console.log('Error:', error.message);
        }
      };


    
    const onChange = (e)=>{
        setCredentials({...credentials, [e.target.name]: e.target.value})
    }

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
              aria-describedby="fn" required
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
              aria-describedby="ln" required
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
              aria-describedby="email" required
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
              aria-describedby="Mobile" required
            />                 
          </div>



          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={credentials.password}
              onChange={onChange}
              id="password" required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </form>
      </>
    </div>
  );
}
