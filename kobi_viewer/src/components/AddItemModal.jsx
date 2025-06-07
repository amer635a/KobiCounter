import React from "react";
import "./styles/AddItemModalAndHistory.css";

function AddItemModal({ show, savedData, editedCount, setEditedCount, handleApprove, handleReject }) {
  if (!show) return null;
  return (
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
  );
}

export default AddItemModal;
