import React from "react";
import "../styles/customButton.css";

function CustomButton({ color, onClick, children }) {
  return (
    <button
      className="custom-button"
      style={{ backgroundColor: color }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default CustomButton;
