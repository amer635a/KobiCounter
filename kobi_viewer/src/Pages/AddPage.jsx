import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import "../styles/AddPageStyle.css";
import Header from "../components/Header";
import { useMqttImageStream } from "../hooks/useMqttImageStream";

function AddPage() {
  const [image, setImage] = useState(null);
  const [imgKey, setImgKey] = useState(0);
  const [connectStatus, setConnectStatus] = useState("Disconnected");

  const navigate = useNavigate();

  const NO_IMAGE_TEXT = "لا توجد صورة حتى الآن";
  const STATUS_LABEL = "الحالة:";
  const VIDEO_TITLE = "بث الفيديو";
  const HOME_BUTTON_LABEL = "للصفحة الرئيسية";
  const CONNECTED_LABEL = "متصل";

  // useMqttImageStream hook handles MQTT logic
  useMqttImageStream({ setImage, setImgKey, setConnectStatus });

  return (
    <>
      <Header />
      <div className="addpage-container">
        <h2 className="addpage-title">{VIDEO_TITLE}</h2>
        <p className={`addpage-status ${connectStatus === CONNECTED_LABEL ? 'connected' : 'disconnected'}`}>
          {STATUS_LABEL} {connectStatus}
        </p>
        <div className="addpage-image-wrapper">
          {image ? (
            <img
              key={imgKey}
              src={image}
              alt="Streamed"
              className="addpage-image"
            />
          ) : (
            <span className="addpage-no-image">{NO_IMAGE_TEXT}</span>
          )}
        </div>
        <button
          onClick={() => navigate("/")}
          className="addpage-home-btn"
        >
          {HOME_BUTTON_LABEL}
        </button>
      </div>
    </>
  );
}

export default AddPage;

