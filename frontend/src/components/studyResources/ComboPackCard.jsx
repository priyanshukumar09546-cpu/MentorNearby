// ============================================================
// components/studyResources/ComboPackCard.jsx
// Reusable Combo Pack Card with View PDF / Preview & Buy buttons
// ============================================================

import React from 'react';

const ComboPackCard = ({
  combo,
  onViewPreview,
  onBuyCombo,
}) => {
  if (!combo) return null;

  const isFormula = combo.resourceType === 'FORMULA_SHEET' || combo.type === 'FORMULA' || combo.comboType === 'FORMULA_COMBO';

  return (
    <div
      className={`mn-np-combo-card ${combo.badgeColor || (isFormula ? 'purple' : 'green')}`}
      onClick={() => {
        if (onViewPreview) onViewPreview(combo);
      }}
      style={{ cursor: 'pointer' }}
    >
      <div className="mn-np-combo-top">
        <div className="mn-np-combo-icon-wrap">
          <span className="mn-np-combo-icon">{combo.icon || (isFormula ? '📐' : '📚')}</span>
        </div>
        <span className={`mn-np-combo-pill ${isFormula ? 'formula' : 'notes'}`}>
          {isFormula ? 'Formula Combo' : 'Notes Combo'}
        </span>
      </div>

      <h4 className="mn-np-combo-name">{combo.name || combo.title}</h4>
      <div className="mn-np-combo-classes">
        Class {combo.classLevel} • {combo.subject}
      </div>

      <div className="mn-np-combo-count">
        Includes all Chapter {isFormula ? 'Formula Sheets' : 'Notes'}
      </div>

      <div
        className="mn-np-combo-actions"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          marginTop: 'auto',
          paddingTop: 10,
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <button
          type="button"
          className="mn-np-btn-view"
          onClick={(e) => {
            e.stopPropagation();
            if (onViewPreview) onViewPreview(combo);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span>👁️</span> View Preview
        </button>

        <button
          type="button"
          className="mn-np-btn-buy-combo"
          onClick={(e) => {
            e.stopPropagation();
            if (onBuyCombo) onBuyCombo(combo);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            height: 30,
            fontSize: 11.5,
          }}
        >
          <span>⚡</span> Buy Combo – ₹{combo.price}
        </button>
      </div>
    </div>
  );
};

export default ComboPackCard;
