// src/Pages/AddPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AddPageStyle.css";
import Header from "../components/Header";
import { useController } from "../context/ControllerContext";
import AddItemModal from "../components/AddItemModal";
import ShowHistory from "../components/ShowHistory";

function AddPage() {
  const [image, setImage] = useState(null);
  const [imgKey, setImgKey] = useState(0);
  const [objectCount, setObjectCount] = useState(0);
  const [connectStatus, setConnectStatus] = useState("Disconnected");
  const [showModal, setShowModal] = useState(false);
  const [savedData, setSavedData] = useState({ image: null, objectCount: 0 });
  const [editedCount, setEditedCount] = useState(0);
  const [historyData, setHistoryData] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();
  const controller = useController(); // Use shared instance

  // Arabic UI text variables
  const NO_IMAGE_TEXT = "لا توجد صورة حتى الآن";
  const STATUS_LABEL = " الحالة";
  const VIDEO_TITLE = "بث الفيديو";
  const CONNECTED_LABEL = "متصل";
  const ANALYSIS_INFO_LABEL = "معلومات التحليل";
  const OBJECT_COUNT_LABEL = "عدد الكائنات";
  const SAVE_BTN_LABEL = "💾 حفظ";
  const HISTORY_BTN_LABEL = "📜 السجل";
  const HOME_BTN_LABEL = "🏠 للصفحة الرئيسية";
  const SAVE_SUCCESS_MSG = "تم حفظ العنصر بنجاح";
  const DELETE_SUCCESS_MSG = "تم حذف العنصر بنجاح";

  // Helper to fix base64 padding
  function fixBase64Padding(base64) {
    return base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  }

  useEffect(() => {
    if (!controller) return;

    if (controller.isConnected()) {
      setConnectStatus(CONNECTED_LABEL);
      console.log("✅ Already connected to MQTT");
    } else {
      setConnectStatus("Disconnected");
    }

    // Register callback
    controller.addCommand("getDetectionLabels", (labels) => {
      console.log("📥 Received detection labels:", labels);

    });

    controller.addCommand("getAnalyzeVideo", (message) => {
      try {
        const payload = JSON.parse(message);
        console.log("📥 Received analyze video data:", payload);
        if (payload.image) {
          const base64img = fixBase64Padding(payload.image);
          setImage(`data:image/jpeg;base64,${base64img}`);
          setImgKey((k) => k + 1);
        }
        // Fix: use payload.object_count instead of payload.objectCount
        if (typeof payload.object_count !== 'undefined') {
          setObjectCount(payload.object_count);
        }
      } catch (e) {
        console.error("Error parsing message", e);
      }
    });

    controller.addCommand("saveItem", (message) => {
      console.log("📥 Received save item response:", message);
      if (message === "success") {
        alert(SAVE_SUCCESS_MSG);
      }
    });

    controller.addCommand("deleteItem", (message) => {
      console.log("📥 Received delete item response:", message);
      if (message === "success") {
        alert(DELETE_SUCCESS_MSG);
      }
    });

    controller.addCommand("getHistory", (message) => {
      console.log("📥 Received get history response:", message);
      try {
        const payload = typeof message === 'string' ? JSON.parse(message) : message;
        if (payload && payload.data && Array.isArray(payload.data.items)) {
          setHistoryData(payload.data.items);
          setShowHistory(true);
        }
      } catch (e) {
        console.error("Error parsing getHistory message", e);
      }
    });

    // Explicitly send the request and log it
    controller.sendRequest("getDetectionLabels", {});
    controller.sendRequest("getAnalyzeVideo", { frequnce: 5, time: 30 });

    // Send getAnalyzeVideo every 28 seconds while on this page
    const intervalId = setInterval(() => {
      controller.sendRequest("getAnalyzeVideo", { frequnce: 5, time: 30 });
    }, 29500);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [controller]);

  // Save to localStorage and show modal
  const handleSave = () => {
    if (!image) return;
    const entry = { image, objectCount };
    setSavedData(entry);
    setEditedCount(objectCount);
    setShowModal(true);
  };

  // Approve (V) handler: save with edited count
  const handleApprove = () => {
    const entry = { image: savedData.image, objectCount: editedCount };
    let savedEntries = [];
    try {
      savedEntries = JSON.parse(localStorage.getItem("savedEntries")) || [];
    } catch (e) {
      savedEntries = [];
    }
    savedEntries.push(entry);
    localStorage.setItem("savedEntries", JSON.stringify(savedEntries));
    setShowModal(false);
    // Format date as DD/MM/YYYY
    const timeNow = new Date(); 
    // Send saveItem request to controller with payload
    controller.sendRequest("saveItem", {
      item: {
        name: "Kobi",
        date: timeNow,
        amount: editedCount
      }
    });
  };

  // Reject (X) handler: just close
  const handleReject = () => {
    setShowModal(false);
  };

  return (
    <>
      <Header />
      <div className="addpage-container">
        <h2 className="addpage-title">{VIDEO_TITLE}</h2>
        <p className={`addpage-status ${connectStatus === CONNECTED_LABEL ? "connected" : "disconnected"}`}>
          {STATUS_LABEL} {connectStatus}
        </p>
        <div className="addpage-analysis-info">
          <b>{ANALYSIS_INFO_LABEL}</b>
          <div className="addpage-analysis-details">
            <p>{OBJECT_COUNT_LABEL} {objectCount}</p>
          </div>
        </div>
        <div className="addpage-image-wrapper">
          {image ? (
            <img key={imgKey} src={image} alt="Streamed" className="addpage-image" />
          ) : (
            <span className="addpage-no-image">{NO_IMAGE_TEXT}</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
          <button onClick={handleSave} className="addpage-action-btn">
            {SAVE_BTN_LABEL}
          </button>
          <button
            onClick={() => {
              setShowHistory(true);
              controller.sendRequest("getHistory", { data: { name: "kobi" } });
            }}
            className="addpage-action-btn"
          >
            {HISTORY_BTN_LABEL}
          </button>
          <button onClick={() => navigate("/")} className="addpage-action-btn">
            {HOME_BTN_LABEL}
          </button>
        </div>
        <AddItemModal
          show={showModal}
          savedData={savedData}
          editedCount={editedCount}
          setEditedCount={setEditedCount}
          handleApprove={handleApprove}
          handleReject={handleReject}
        />
        <ShowHistory
          show={showHistory}
          historyData={historyData}
          setShowHistory={setShowHistory}
          controller={controller}
          setHistoryData={setHistoryData}
        />
      </div>
    </>
  );
}

export default AddPage;
