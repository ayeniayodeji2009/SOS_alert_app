import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Register = () => {
    const [formData, setFormData] = useState({
        firstname: '', lastname: '', username: '',
        email: '', phone_no: '', address: '',
        state: 'Lagos', country: 'Nigeria',
        blood_group: '', emergency_contact_name: '',
        emergency_contact_phone: '', password: '' // Make sure backend expects password too!
    });


    
    console.log(api); // Step 1: Check if api is defined
    const navigate = useNavigate();

    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     try {
    //         // FastAPI expects a JSON body
    //         await api.post('/users/register', formData);
    //         alert("Registration successful!");
    //         navigate('/login');
    //     } catch (err) {
    //         console.error(err.response?.data);
    //         alert("Error: Check console for missing fields");
    //     }
    // };
    const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting this data:", formData); // Step 1: See what you are sending
    
    try {
        const response = await api.post('/users/register', formData);
        console.log("Success Response:", response.data);
        alert("Registration Successful!");
        navigate('/login');
    } catch (err) {
        // Step 2: Capture the actual error
        console.error("Full Error Object:", err);
        if (err.response) {
            console.error("Backend Data:", err.response.data);
            alert(`Error: ${JSON.stringify(err.response.data.detail)}`);
        } else {
            alert("Network Error: Is the backend server running?");
        }
    }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

   return (
            <div className="auth-container">
                <div className="register-card">
                    <h2>Citizen Registration</h2>
                    <form onSubmit={handleSubmit} className="register-grid">
                        <input name="firstname" placeholder="First Name" onChange={handleChange} required />
                        <input name="lastname" placeholder="Last Name" onChange={handleChange} required />
                        
                        <input name="username" placeholder="Username" onChange={handleChange} required />
                        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
                        
                        <input name="phone_no" placeholder="Phone Number" onChange={handleChange} required />
                        <input name="blood_group" placeholder="Blood Group (e.g. O+)" onChange={handleChange} />
                        
                        {/* Address takes full width */}
                        <input name="address" className="full-width" placeholder="Residential Address" onChange={handleChange} required />
                        
                        <input name="state" value="Lagos" disabled />
                        <input name="country" value="Nigeria" disabled />
                        
                        <input name="emergency_contact_name" placeholder="Next of Kin Name" onChange={handleChange} />
                        <input name="emergency_contact_phone" placeholder="Next of Kin Phone" onChange={handleChange} />
                        
                        <input name="password" type="password" className="full-width" placeholder="Create Password" onChange={handleChange} required />
                        
                        <button type="submit" className="btn-register">Create SOS Account</button>
                    </form>
                </div>
            </div>
        );
};



export default Register;