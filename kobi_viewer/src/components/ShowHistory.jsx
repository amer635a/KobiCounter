import React from "react";
import "./styles/AddItemModalAndHistory.css";

function ShowHistory({ show, historyData, setShowHistory, controller, setHistoryData }) {
  if (!show) return null;
  return (
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
  );
}

export default ShowHistory;
