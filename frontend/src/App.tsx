import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SidebarVisibilityProvider } from './services/SidebarVisibilityContext'; // 
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import ItrackerUpload from './pages/ItrackerUpload';
import ItrackerDash from './pages/ItrackerDash';
import TabulacionesUpload from './pages/TabulacionesUpload';
import TabulacionesDash from './pages/TabulacionesDash';
import AbmDashboard from './pages/AbmDashboard';
import AbmUpload from './pages/AbmUpload';
import AdminPanel from './pages/AdminPanel';
import PlacasDash from './pages/PlacasDash';
import Error404 from './pages/Error404'; // Importa la página de error


const App: React.FC = () => {
  return (
<Router>
<SidebarVisibilityProvider>
<Routes>
<Route path="/" element={<LoginPage />} />
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/projects" element={<Projects />} />
<Route path="/tasks" element={<Tasks />} />
<Route path="/itracker" element={<ItrackerUpload />} />
<Route path="/itrackerdash" element={<ItrackerDash />} />
<Route path="/tabulaciones" element={<TabulacionesUpload />} />
<Route path="/tabulacionesdash" element={<TabulacionesDash />} />
<Route path="/admin" element={<AdminPanel />} />
<Route path="/abmdashboard" element={<AbmDashboard />} />
<Route path="/abm" element={<AbmUpload />} />
<Route path="/placasdash" element={<PlacasDash />} />
<Route path="*" element={<Error404 />} />
</Routes>
</SidebarVisibilityProvider>
</Router>
  );
};
 


//function App() {
//  return (
//    <div className="App">
//      <header className="App-header">
//        <img src={logo} className="App-logo" alt="logo" />
//        <p>
//          Edit <code>src/App.tsx</code> and save to reload.
//        </p>
//        <a
//          className="App-link"
//          href="https://reactjs.org"
//          target="_blank"
//          rel="noopener noreferrer"
//        >
//          Learn React
//        </a>
//      </header>
//    </div>
//  );
//}

export default App;
