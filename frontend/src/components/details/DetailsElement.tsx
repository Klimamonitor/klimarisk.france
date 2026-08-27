import useDataStore, { type DistributionKey } from "../../hooks/useDataStore";
import type { RankElement } from "./DetailedStats";
import DetailsMetric from "./DetailsMetric";
import useLanguageStore from "../../hooks/useLanguageStore";
import Tooltip from "../Tooltip";
import { useEffect, useRef } from "react";

interface Props {
  e: RankElement;
}

function DetailsElement({ e }: Props) {
  const {
    setHighlightedDistribution,
    setSelectedDistribution,
    getRiskColor,
    selectedKommune,
    data,
    selectedYear,
    selectedDistribution,
    highlightedDistribution,
  } = useDataStore();
  const { l } = useLanguageStore();

  function handleInspectDistribution(key: DistributionKey) {
    if (selectedDistribution.type === "element" && key.type === "element" && selectedDistribution.key === key.key) {
      return setSelectedDistribution({ type: "risk" });
    }
    setSelectedDistribution(key);
  }

  const kommuneData = data && selectedYear && selectedKommune ? data.years[selectedYear].byKommune[selectedKommune] : null;

  const sortedMetrics = kommuneData ? [...e.metrics].sort((a, b) => {
    const aVal = a.invert ? 100 - kommuneData[a.key] : kommuneData[a.key];
    const bVal = b.invert ? 100 - kommuneData[b.key] : kommuneData[b.key];
    return -(aVal - bVal);
  }) : e.metrics;

  const selectedDistRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (selectedDistRef.current !== null) {
      selectedDistRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedDistribution]);

  return (
    <li className={`detailsElement ${selectedDistribution.type === "element" && selectedDistribution.key === e.key ? "selected" : ""}`}>
      <button
        onMouseEnter={() => setHighlightedDistribution({ type: "element", key: e.key })}
        onMouseLeave={() => setHighlightedDistribution(null)}
        onClick={() => handleInspectDistribution({ type: "element", key: e.key })}
        className={`detailsHandle ${highlightedDistribution && highlightedDistribution.type === "element" && highlightedDistribution.key === e.key ? "highlighted" : ""}`}
        ref={selectedDistribution.type === "element" && selectedDistribution.key === e.key ? selectedDistRef : null}
      >
        <div
          className="colorBox"
          style={{ "--risk-color": selectedKommune ? getRiskColor(selectedKommune, { type: "element", key: e.key }) : null } as React.CSSProperties}
        ></div>
        <div className="detailsName">
          <Tooltip text={l(e.description)}>
            {l(e.name)}
          </Tooltip>
        </div>

        <div className="detailsRank">
          {e.rank !== null ? e.rank : "-"}
        </div>

        <div className="detailsRankFylke">
          {e.rankFylke !== null ? e.rankFylke : "-"}
        </div>
      </button>
      <ul>
        {sortedMetrics.map((m, mIndex) => (
          <DetailsMetric
            key={`${e.key}-${mIndex}`}
            m={m}
          />
        ))}
      </ul>
    </li>
  );
}

export default DetailsElement;