import { Alert } from "bootstrap";
import React from "react";
import { Link, Navigate } from "react-router-dom";
export default function UserDetails({userData, showAlert, setUserData}){
    async function deleteUser(){
        const passwordVal = await prompt("enter your password");
         const body = {user_id: userData.result._id, password: passwordVal}
         fetch("http://localhost:2001/user/delete",{
            method: 'POST',
            headers: {
              'authorization': 'yk11_',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
         }).then(data=>data.json()).then(data=>{
             if (data.success) {
                 // Registration successful
            showAlert("User Deleted","success");
            setUserData(null);
         
          } else {
              // Registration failed
              showAlert("Enter valid password","danger",data.error)
          }
        })
    }
    return<>
    <div>first_name: {userData.result.first_name}</div>
    <div>last_name: {userData.result.last_name}</div>
    <div>email: {userData.result.email}</div>
    <div>mobile: {userData.result.mobile}</div>
    <Link className="btn btn-primary mx-1" to="/update" role="button">Update data</Link>
    <button className="btn btn-danger mx-1" onClick={deleteUser}>Delete User</button>
    </>
}