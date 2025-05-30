// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VideoStream from "./Pages/AddPage";
import HomePage from "./Pages/HomePage";
import "./style.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/add" element={<VideoStream />} />
      </Routes>
    </Router>
  );
}

export default App;
