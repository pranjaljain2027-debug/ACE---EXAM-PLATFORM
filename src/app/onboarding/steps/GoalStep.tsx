import React from "react";

type GoalOption = 
  | "improve_problem_solving"
  | "enhance_logical_thinking"
  | "build_confidence"
  | "prepare_assessment"
  | "not_sure_yet";

const GoalStep: React.FC<{ 
  goals: GoalOption[]; 
  onChange: (newGoals: GoalOption[]) => void 
}> = ({ goals, onChange }) => {
  const handleToggle = (goal: GoalOption, event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    if (checked) {
      onChange([...goals, goal]);
    } else {
      onChange(goals.filter(g => g !== goal));
    }
  };

  return (
    <section className="onboarding-step" aria-labelledby="goal-title">
      <h2 id="goal-title">Learning goal</h2>
      <p>
        What would you like your child to get from using Heir of Wisdom?
      </p>
      <fieldset>
        <legend className="visually-hidden">Learning goal</legend>
        <label>
          <input
            type="checkbox"
            name="goal"
            value="improve_problem_solving"
            checked={goals.includes("improve_problem_solving")}
            onChange={handleToggle("improve_problem_solving")}
          />
          Improve problem-solving skills
        </label>
        <label>
          <input
            type="checkbox"
            name="goal"
            value="enhance_logical_thinking"
            checked={goals.includes("enhance_logical_thinking")}
            onChange={handleToggle("enhance_logical_thinking")}
          />
          Enhance logical thinking
        </label>
        <label>
          <input
            type="checkbox"
            name="goal"
            value="build_confidence"
            checked={goals.includes("build_confidence")}
            onChange={handleToggle("build_confidence")}
          />
          Build confidence
        </label>
        <label>
          <input
            type="checkbox"
            name="goal"
            value="prepare_assessment"
            checked={goals.includes("prepare_assessment")}
            onChange={handleToggle("prepare_assessment")}
          />
          Prepare for assessment
        </label>
        <label>
          <input
            type="checkbox"
            name="goal"
            value="not_sure_yet"
            checked={goals.includes("not_sure_yet")}
            onChange={handleToggle("not_sure_yet")}
          />
          Not sure yet
        </label>
      </fieldset>
    </section>
  );
};

export default GoalStep;