// src/App.js

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./page/Dashboard"; // Import the Dashboard page
import DiagnosisRecords from "./page/DiagnosisRecords"; // Import the new DiagnosisRecords page
import Navbar from "./components/Navbar"; // Import Navbar component
import io from "socket.io-client";


const api_url = "https://bp4ipsw-iandayn.as1.pitunnel.net/"

const socket = io(api_url, { transports: ["websocket"] });

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Dashboard api_url={api_url} socket={socket} />} />
                <Route path="/records" element={<DiagnosisRecords api_url={api_url} socket={socket} />} /> {/* Add the new route for records */}
            </Routes>
        </Router>
    );
}

export default App;