import { Lock } from "lucide-react";

import Card from "../ui/Card";

function SectionLocked({ label = "Esta seccion es privada." }) {
  return (
    <Card glass className="fc-empty-state fc-section-locked">
      <div className="fc-empty-state__icon">
        <Lock size={26} />
      </div>
      <p className="fc-card-text">{label}</p>
    </Card>
  );
}

export default SectionLocked;
