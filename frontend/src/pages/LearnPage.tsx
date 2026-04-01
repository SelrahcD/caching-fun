import { useState, useMemo } from "react";
import { scenarios } from "../learn/scenarios";
import { ScenarioPicker } from "../learn/ScenarioPicker";
import { Diagram } from "../learn/Diagram";
import { StepCard } from "../learn/StepCard";
import { StepControls } from "../learn/StepControls";
import { LogPanel } from "../learn/LogPanel";
import type { LogEntry } from "../learn/scenarios";
import "../learn/animations.css";

export function LearnPage() {
  const [activeScenarioId, setActiveScenarioId] = useState(scenarios[0].id);
  const [stepIndex, setStepIndex] = useState(0);

  const scenario = scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];
  const step = scenario.steps[stepIndex];

  const logEntries = useMemo(() => {
    const entries: LogEntry[] = [];
    for (let i = 0; i <= stepIndex; i++) {
      const log = scenario.steps[i].log;
      if (log) entries.push(log);
    }
    return entries;
  }, [scenario, stepIndex]);

  const handleSelectScenario = (id: string) => {
    setActiveScenarioId(id);
    setStepIndex(0);
  };

  return (
    <div style={{ background: "#1a1a2e", color: "#eee", minHeight: "calc(100vh - 45px)" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "24px" }}>
        <h1 style={{ padding: "24px 24px 0", margin: 0, fontSize: "22px" }}>
          How HTTP Caching Works
        </h1>
        <p style={{ padding: "4px 24px 0", margin: 0, color: "#aaa", fontSize: "14px" }}>
          Step through each scenario to see how requests flow through the system.
        </p>

        <ScenarioPicker
          scenarios={scenarios}
          activeId={activeScenarioId}
          onSelect={handleSelectScenario}
        />

        <Diagram state={step.diagram} />

        <StepCard
          stepNumber={stepIndex + 1}
          title={step.title}
          description={step.description}
        />

        <StepControls
          current={stepIndex}
          total={scenario.steps.length}
          onPrevious={() => setStepIndex((i) => Math.max(0, i - 1))}
          onNext={() => setStepIndex((i) => Math.min(scenario.steps.length - 1, i + 1))}
        />

        <LogPanel entries={logEntries} />
      </div>
    </div>
  );
}
