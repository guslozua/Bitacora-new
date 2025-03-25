import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';


const App: React.FC = () => {
  return (
<Router>
<Routes>
<Route path="/" element={<LoginPage />} />
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/projects" element={<Projects />} />
</Routes>
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
