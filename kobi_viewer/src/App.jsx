// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ControllerProvider } from "./context/ControllerContext";
import HomePage from "./Pages/HomePage";
import AddPage from "./Pages/AddPage";
import "./App.css";

function App() {
  return (
    <ControllerProvider mqttUrl="ws://localhost:9001">
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add" element={<AddPage />} />
        </Routes>
      </Router>
    </ControllerProvider>
  );
}

export default App;
