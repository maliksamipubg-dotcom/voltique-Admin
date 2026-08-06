import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Add from './pages/Add'
import List from './pages/List'
import Edit from './pages/Edit'
import Orders from './pages/Orders'
import Reviews from './pages/Reviews'
import Categories from './pages/Categories'
import ManualInvoice from './pages/ManualInvoice'
import ManualInvoiceHistory from './pages/ManualInvoiceHistory'
import Login from './components/Login'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { backendUrl } from './config.js'

export { backendUrl }
export const currency = 'Rs'
const App = () => {

  const [token,setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token'):'');
  const [sidebarOpen,setSidebarOpen] = useState(false);

  useEffect( ()=>{
    localStorage.setItem('token',token)
  },[token])
  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        newestOnTop
        stacked
        closeOnClick
        pauseOnHover
        pauseOnFocusLoss
        draggable
        theme="colored"
        closeButton
      />
      { token === ""
        ? <Login setToken={setToken}/>
        : <>
          <Navbar setToken={setToken} onMenuClick={()=>setSidebarOpen(!sidebarOpen)} />
          <hr />
          <div className='flex w-full'>
            {sidebarOpen && <div onClick={()=>setSidebarOpen(false)} className='fixed inset-0 z-30 bg-black/40 md:hidden' />}
            <Sidebar open={sidebarOpen} onClose={()=>setSidebarOpen(false)} />
            <div className='flex-1 min-w-0 p-4 sm:p-6 lg:p-8'>
              <Routes>
                <Route path='/' element={<Dashboard token={token} />} />
                <Route path='/add' element={<Add token={token} />} />
                <Route path='/list' element={<List token={token} />} />
                <Route path='/edit/:id' element={<Edit token={token} />} />
                <Route path='/orders' element={<Orders token={token} />} />
                <Route path='/reviews' element={<Reviews token={token} />} />
                <Route path='/categories' element={<Categories />} />
                <Route path='/manual-invoice' element={<ManualInvoice token={token} />} />
                <Route path='/manual-invoice-history' element={<ManualInvoiceHistory token={token} />} />
              </Routes>
            </div>
          </div>
        </>
        }
    </div>
  )
}

export default App
