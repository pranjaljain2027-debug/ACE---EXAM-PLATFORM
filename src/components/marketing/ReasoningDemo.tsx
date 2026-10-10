import { ExplanationPlayer } from "@/components/reasoning/ExplanationPlayer";
import { demoMatrixQuestion } from "@/content/demo/matrix-question";
import { reasoningDemoCopy } from "@/content/marketing/copy";

/**
 * The reasoning demo — section two, and the page's dominant visual.
 *
 * It sits directly under the hero so the first thing a visitor can try is the
 * thing the product is actually about, and it carries the page's only frame:
 * every other section is type and rules on the canvas, so that one border
 * reads as "here is the interactive part" rather than as decoration (spec §8.5).
 *
 * The player itself is U5's and is mounted unmodified, so this page and a real
 * session run the same component on the same question data.
 */
export function ReasoningDemo() {
  return (
    <section className="marketing-section marketing-demo" aria-labelledby="reasoning-demo-heading">
      <h2 id="reasoning-demo-heading">{reasoningDemoCopy.heading}</h2>
      <p className="marketing-lede">{reasoningDemoCopy.lede}</p>

      <div className="marketing-demo__frame">
        <ExplanationPlayer question={demoMatrixQuestion} submitMode="direct" />
      </div>
    </section>
  );
}
