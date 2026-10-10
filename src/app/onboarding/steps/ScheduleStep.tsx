import React from "react";

type SchedulePreference = "mornings" | "afternoons" | "evenings" | "any_time";

const ScheduleStep: React.FC<{ 
  schedulePreference: SchedulePreference; 
  onChange: (schedulePreference: SchedulePreference) => void 
}> = ({ schedulePreference, onChange }) => {
  return (
    <section className="onboarding-step" aria-labelledby="schedule-title">
      <h2 id="schedule-title">Practice schedule</h2>
      <p>
        When would your child most likely practice?
      </p>
      <fieldset>
        <legend className="visually-hidden">Practice schedule</legend>
        <label>
          <input
            type="radio"
            name="schedule-preference"
            value="mornings"
            checked={schedulePreference === "mornings"}
            onChange={() => onChange("mornings")}
          />
          Mornings
        </label>
        <label>
          <input
            type="radio"
            name="schedule-preference"
            value="afternoons"
            checked={schedulePreference === "afternoons"}
            onChange={() => onChange("afternoons")}
          />
          Afternoons
        </label>
        <label>
          <input
            type="radio"
            name="schedule-preference"
            value="evenings"
            checked={schedulePreference === "evenings"}
            onChange={() => onChange("evenings")}
          />
          Evenings
        </label>
        <label>
          <input
            type="radio"
            name="schedule-preference"
            value="any_time"
            checked={schedulePreference === "any_time"}
            onChange={() => onChange("any_time")}
          />
          Any time
        </label>
      </fieldset>
    </section>
  );
};

export default ScheduleStep;