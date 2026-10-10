import React from "react";
import { NextAction } from "../../lib/scoring/nextAction";

const NextActionCard: React.FC<{ nextAction: NextAction }> = ({ nextAction }) => {
  const { insight, label, route } = nextAction;

  return (
    <div className="next-action-card">
      <h3>Suggested Next Step</h3>
      <p>{insight}</p>
      {route ? (
        <a href={route} className="next-action-link">
          {label}
        </a>
      ) : (
        <span className="next-action-disabled">{label}</span>
      )}
    </div>
  );
};

export default NextActionCard;