// src/Pages/AddPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AddPageStyle.css";
import Header from "../components/Header";
import { useController } from "../context/ControllerContext";

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

  const NO_IMAGE_TEXT = "لا توجد صورة حتى الآن";
  const STATUS_LABEL = ":الحالة";
  const VIDEO_TITLE = "بث الفيديو";
  const HOME_BUTTON_LABEL = "للصفحة الرئيسية";
  const CONNECTED_LABEL = "متصل";
  const ANALYSIS_INFO_LABEL = ":معلومات التحليل";
  const OBJECT_COUNT_LABEL = ":عدد الكائنات";

 
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
        alert("تم حفظ العنصر بنجاح");
      }
    });

    controller.addCommand("deleteItem", (message) => {
      console.log("📥 Received delete item response:", message);
      if (message === "success") {
        alert("تم حذف العنصر بنجاح");
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

    // Send getAnalyzeVideo every 5 seconds while on this page
    const intervalId = setInterval(() => {
      controller.sendRequest("getAnalyzeVideo", { frequnce: 5, time: 30 });
    }, 28000);

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
        <button onClick={() => navigate("/")} className="addpage-home-btn">
          {HOME_BUTTON_LABEL}
        </button>
        <button onClick={handleSave} className="addpage-save-btn">
          حفظ
        </button>
        <button onClick={() => controller.sendRequest("getHistory", { data: { name: "kobi" } })} className="addpage-history-btn">
          السجل
        </button>
        {showModal && (
          <div className="addpage-modal-overlay">
            <div className="addpage-modal">
              <button className="addpage-modal-close" onClick={handleReject}>
                ×
              </button>
              <h3>تم الحفظ</h3>
              {savedData.image && (
                <img src={savedData.image} alt="Saved" className="addpage-modal-image" />
              )}
              <div className="addpage-modal-count-row">
                <label className="addpage-modal-count-label">عدد الكائنات:</label>
                <input
                  type="number"
                  value={editedCount}
                  onChange={e => setEditedCount(Number(e.target.value))}
                  className="addpage-modal-count-input"
                />
              </div>
              <div className="addpage-modal-actions">
                <button onClick={handleApprove} className="addpage-modal-approve">✔</button>
                <button onClick={handleReject} className="addpage-modal-reject">✖</button>
              </div>
            </div>
          </div>
        )}
        {showHistory && (
          <div className="addpage-modal-overlay">
            <div className="addpage-modal">
              <button className="addpage-modal-close" onClick={() => setShowHistory(false)}>
                ×
              </button>
              <h3>سجل العناصر</h3>
              <div className="addpage-history-table-wrapper">
                <table className="addpage-history-table">
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>التاريخ</th>
                      <th>العدد</th>
                      <th>الحالة</th>
                      <th>حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name === 'kobi' ? 'كبة' : item.name}</td>
                        <td>{
                          new Date(item.date).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                          })
                        }</td>
                        <td>{item.amount}</td>
                        <td>
                          {item.status === 'make' ? (
                            <span style={{ color: '#43a047', fontWeight: 'bold', fontSize: '1.2em' }}>+</span>
                          ) : item.status === 'sell' ? (
                            <span style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '1.2em' }}>-</span>
                          ) : (
                            item.status
                          )}
                        </td>
                        <td>
                          <button
                            className="addpage-history-delete-btn"
                            title="حذف"
                            style={{ background: 'none', boxShadow: 'none' }}
                            onClick={() => {
                              controller.sendRequest("deleteItem", { id: item.date });
                              const newHistory = historyData.filter((_, i) => i !== idx);
                              setHistoryData(newHistory);
                            }}
                          >
                            <span role="img" aria-label="delete">🗑️</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AddPage;
