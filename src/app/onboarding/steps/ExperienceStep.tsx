import React from "react";

type ExperienceLevel = "new_to_reasoning" | "some_experience" | "regular_practiser";

const ExperienceStep: React.FC<{ onChange: (experienceLevel: ExperienceLevel) => void }> = ({ onChange }) => {
  return (
    <section className="onboarding-step" aria-labelledby="experience-title">
      <h2 id="experience-title">Experience level</h2>
      <p>
        Select the option that best describes your child's prior experience with
        reasoning assessments or practice.
      </p>
      <fieldset>
        <legend className="visually-hidden">Experience level</legend>
        <label>
          <input
            type="radio"
            name="experience-level"
            value="new_to_reasoning"
            onChange={() => onChange("new_to_reasoning")}
          />
          New to reasoning
        </label>
        <label>
          <input
            type="radio"
            name="experience-level"
            value="some_experience"
            onChange={() => onChange("some_experience")}
          />
          Some experience
        </label>
        <label>
          <input
            type="radio"
            name="experience-level"
            value="regular_practiser"
            onChange={() => onChange("regular_practiser")}
          />
          Regular practiser
        </label>
      </fieldset>
    </section>
  );
};

export default ExperienceStep;