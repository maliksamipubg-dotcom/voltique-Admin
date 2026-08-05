import React, { useState } from 'react'
import { backendUrl } from '../App'
import axios from 'axios'
import { toast } from "react-toastify"

const Login = ({setToken}) => {

    const [email,setEmail] = useState('')
    const [password,setPassword] = useState('')

    const onSubmitHandler = async(e)=>{
        try {
            e.preventDefault();
            const response = await axios.post(backendUrl + '/api/user/admin',{email,password})
            if (response.data.success) {
                setToken(response.data.token)
                toast.success("Login Successful 🎉")
            }
            else{
                toast.error(response.data.message)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-dark via-primary-dark to-emerald-700 w-full'>
        <div className='backdrop-blur-lg bg-white/10 shadow-xl rounded-2xl px-8 py-6 max-w-md w-full border border-white/20'>
            <h1 className='text-3xl font-extrabold text-white text-center mb-6 drop-shadow-lg heading-font'>Voltique Hub Admin Panel</h1>
            <form onSubmit={onSubmitHandler}>
                <div className='mb-4'>
                    <p className='text-sm font-medium text-white/90 mb-2'>Email Address</p>
                    <input 
                        onChange={(e)=>setEmail(e.target.value)} 
                        value={email} 
                        type="email" 
                        placeholder='your@email.com' 
                        required
                        className='rounded-lg w-full px-4 py-2 bg-white/90 text-gray-800 border border-gray-200 focus:ring-2 focus:ring-blue-400 outline-none'
                    />
                </div>
                <div className='mb-4'>
                    <p className='text-sm font-medium text-white/90 mb-2'>Password</p>
                    <input 
                        onChange={(e)=>setPassword(e.target.value)} 
                        value={password} 
                        type="password" 
                        placeholder='Enter your password' 
                        required
                        className='rounded-lg w-full px-4 py-2 bg-white/90 text-gray-800 border border-gray-200 focus:ring-2 focus:ring-emerald-400 outline-none'
                    />
                </div>
                <button 
                    type="submit" 
                    className='mt-3 w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 shadow-md hover:scale-105 transition-transform duration-300'
                >
                    Login
                </button>
            </form>
            <p className='text-center text-white/80 text-xs mt-6'>© {new Date().getFullYear()} Voltique Hub Admin Portal. All rights reserved.</p>
        </div>
    </div>
)
}

export default Login
