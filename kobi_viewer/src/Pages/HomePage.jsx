import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/homePageStyle.css";
import CustomButton from "../components/CustomButton";
import Header from "../components/Header";

const MENU_TITLE = "قائمة التحكم";
const ADD_LABEL = "إضافة";
const SELL_LABEL = "بيع";
const COUNT_LABEL = "عد";

function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="menu-container">
        <h1 className="menu-title">{MENU_TITLE}</h1>
        <CustomButton color="#4CAF50" onClick={() => navigate("/add")}>{ADD_LABEL}</CustomButton>
        <CustomButton color="#2196F3" onClick={() => alert("بيع")}>{SELL_LABEL}</CustomButton>
        <CustomButton color="#FF9800" onClick={() => alert("عد")}>{COUNT_LABEL}</CustomButton>
      </div>
    </>
  );
}

export default HomePage;
