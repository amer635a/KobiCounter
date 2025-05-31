// src/Pages/AddPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AddPageStyle.css";
import Header from "../components/Header";
import { useMqttImageStream } from "../hooks/useMqttImageStream";
import { useController } from "../context/ControllerContext";

function AddPage() {
  const [image, setImage] = useState(null);
  const [imgKey, setImgKey] = useState(0);
  const [connectStatus, setConnectStatus] = useState("Disconnected");
  const navigate = useNavigate();
  const controller = useController(); // Use shared instance

  const NO_IMAGE_TEXT = "لا توجد صورة حتى الآن";
  const STATUS_LABEL = "الحالة:";
  const VIDEO_TITLE = "بث الفيديو";
  const HOME_BUTTON_LABEL = "للصفحة الرئيسية";
  const CONNECTED_LABEL = "متصل";

  // Hook handles the MQTT stream
  useMqttImageStream({ setImage, setImgKey, setConnectStatus });

  useEffect(() => {
    if (!controller?.isConnected()) return;

    console.log("✅ Already connected to MQTT");

    // Register callback
    controller.addCommand("getDetectionLabels", (labels) => {
      console.log("📥 Received detection labels:", labels);
      alert(`تم استلام تسميات الكشف: `);
    });

    // Explicitly send the request and log it
    controller.sendRequest("getDetectionLabels", {});
  }, [controller]);

  return (
    <>
      <Header />
      <div className="addpage-container">
        <h2 className="addpage-title">{VIDEO_TITLE}</h2>
        <p className={`addpage-status ${connectStatus === CONNECTED_LABEL ? "connected" : "disconnected"}`}>
          {STATUS_LABEL} {connectStatus}
        </p>
        <div style={{ margin: '16px 0', textAlign: 'center', background: '#f5f5f5', borderRadius: 8, padding: 12 }}>
          <b>معلومات التحليل:</b>
          <div style={{ marginTop: 8, direction: 'rtl', textAlign: 'right', fontSize: 15 }}>
            {/* Info content here */}
          </div>
        </div>
        <div className="addpage-image-wrapper">
          {image ? (
            <img key={imgKey} src={image} alt="Streamed" className="addpage-image" />
          ) : (
            <span className="addpage-no-image">{NO_IMAGE_TEXT}</span>
          )}
        </div>
        <button onClick={() => navigate("/")} className="addpage-home-btn">
          {HOME_BUTTON_LABEL}
        </button>
      </div>
    </>
  );
}

export default AddPage;
