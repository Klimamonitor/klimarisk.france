import useDataStore, { type DistributionKey } from "../../hooks/useDataStore";
import type { RankRisk } from "./DetailedStats";
import DetailsElement from "./DetailsElement";
import useLanguageStore, { t } from "../../hooks/useLanguageStore";
import Tooltip from "../Tooltip";
import { useEffect, useRef } from "react";

interface Props {
  r: RankRisk;
  countyName?: string;
}

function DetailsRisk({ r, countyName }: Props) {
  const {
    selectedKommune,
    setHighlightedDistribution,
    setSelectedDistribution,
    getRiskColor,
    cache,
    selectedYear,
    selectedDistribution,
    highlightedDistribution,
  } = useDataStore();
  const { l } = useLanguageStore();

  function handleInspectDistribution(key: DistributionKey) {
    setSelectedDistribution(key);
  }

  const kommuneCache = cache && selectedYear && selectedKommune ? cache.years[selectedYear].byKommune[selectedKommune] : null;

  const sortedElements = kommuneCache ? [...r.elements].sort((a, b) => {
    const aVal = a.invert ? 100 - kommuneCache[a.key] : kommuneCache[a.key];
    const bVal = b.invert ? 100 - kommuneCache[b.key] : kommuneCache[b.key];
    return -(aVal - bVal);
  }) : r.elements;

  const selectedDistRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (selectedDistRef.current !== null) {
      selectedDistRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedDistribution]);

  return (
    <div className={`detailsRisk ${selectedDistribution.type === "risk" ? "selected" : ""}`}>
      <div className="detailsHeader">
        <div style={{ "--detailsHeaderColor": "var(--c-norge)" } as React.CSSProperties}>
          <Tooltip text={l(t.details.tooltip.norge)}>
            {l(t.chart.tooltip.norway)}
          </Tooltip>
        </div>
        <div style={{ "--detailsHeaderColor": "var(--c-fylke)" } as React.CSSProperties}>
          <Tooltip text={l(t.details.tooltip.fylke)}>
            {countyName || l(t.chart.tooltip.county)}
          </Tooltip>
        </div>
      </div>
      <button
        onMouseEnter={() => setHighlightedDistribution({ type: "risk" })}
        onMouseLeave={() => setHighlightedDistribution(null)}
        onClick={() => handleInspectDistribution({ type: "risk" })}
        className={`detailsHandle ${highlightedDistribution && highlightedDistribution.type === "risk" ? "highlighted" : ""}`}
        ref={selectedDistribution.type === "risk" ? selectedDistRef : null}
      >
        <div
          className="colorBox"
          style={{ "--risk-color": selectedKommune ? getRiskColor(selectedKommune, { type: "risk" }) : null } as React.CSSProperties}
        ></div>
        <div className="detailsName">
          {l(r.name)}
        </div>
        {/* 🎯 MODIFIÉ : Intégration du dénominateur total national */}
        <div className="detailsRank">
          {r.rank} <span className="rankDenominator">/ {r.totalCount}</span>
        </div>
        {/* 🎯 MODIFIÉ : Intégration du dénominateur total départemental/local */}
        <div className="detailsRankFylke">
          {r.rankFylke} <span className="rankDenominator">/ {r.totalCountFylke}</span>
        </div>
      </button>
      <ul className="detailsElementsContainer">
        {sortedElements.map((e, eIndex) => (
          <DetailsElement key={eIndex} e={e} />
        ))}
      </ul>
    </div>
  );
}

export default DetailsRisk;