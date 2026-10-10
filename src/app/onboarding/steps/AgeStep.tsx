import React from "react";

type AgeBand = "introductory" | "developing" | "advanced";

const AgeStep: React.FC<{ onChange: (ageBand: AgeBand) => void }> = ({ onChange }) => {
  return (
    <section className="onboarding-step" aria-labelledby="age-title">
      <h2 id="age-title">Age band</h2>
      <p>
        Select the age band that best describes your child. This helps us tailor the
        practice experience to their developmental level.
      </p>
      <fieldset>
        <legend className="visually-hidden">Age band</legend>
        <label>
          <input
            type="radio"
            name="age-band"
            value="introductory"
            onChange={() => onChange("introductory")}
          />
          Introductory (ages 6-8)
        </label>
        <label>
          <input
            type="radio"
            name="age-band"
            value="developing"
            onChange={() => onChange("developing")}
          />
          Developing (ages 9-12)
        </label>
        <label>
          <input
            type="radio"
            name="age-band"
            value="advanced"
            onChange={() => onChange("advanced")}
          />
          Advanced (ages 13-15)
        </label>
      </fieldset>
    </section>
  );
};

export default AgeStep;