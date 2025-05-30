import React from "react";
import { useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import "../styles/HeaderStyle.css";

function Header() {
  const navigate = useNavigate();
  return (
    <header className="header-container">
      <div className="header-center">
        <img
          src="/photo/logo.jpeg"
          alt="Logo"
          className="header-logo"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer", height: 50 }}
        />
      </div>
      <div className="header-right">
        <HomeIcon
          className="header-home-icon"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer", fontSize: 40, marginLeft: 16 }}
        />
      </div>
    </header>
  );
}

export default Header;
