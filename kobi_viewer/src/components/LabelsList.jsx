import React from "react";
import "../styles/LabelsList.css";

/**
 * @param {Object} props
 * @param {Object} props.labels - The labels object (e.g., {0: 'Box1', 1: 'kobi'})
 * @param {Array<{key: string|number, label: string}>} props.itemsToShow - Array of items to show, each with key and display label
 */
function LabelsList({ labels, itemsToShow }) {
  if (!labels || Object.keys(labels).length === 0) {
    return <span className="labelslist-empty">لا توجد بيانات</span>;
  }
  return (
    <ul className="labelslist-root">
      {itemsToShow.map(({ key, label }) => (
        <li className="labelslist-item" key={key}>
          <span className="labelslist-key">{label}:</span>
          {/* Only show value if it exists and is not empty string */}
          {labels[key] ? null : <span className="labelslist-value" style={{color:'#888'}}>غير متوفر</span>}
        </li>
      ))}
    </ul>
  );
}

export default LabelsList;