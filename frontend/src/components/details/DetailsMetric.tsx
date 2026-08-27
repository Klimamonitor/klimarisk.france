import useDataStore, { type DistributionKey } from "../../hooks/useDataStore";
import type { RankMetric } from "./DetailedStats";
import useLanguageStore from "../../hooks/useLanguageStore";
import Tooltip from "../Tooltip";
import { useEffect, useRef } from "react";

interface Props {
  m: RankMetric;
}

function DetailsMetric({ m }: Props) {
  const {
    setHighlightedDistribution,
    setSelectedDistribution,
    getRiskColor,
    selectedKommune,
    selectedDistribution,
    highlightedDistribution,
  } = useDataStore();
  const { l } = useLanguageStore();

  function handleInspectDistribution(key: DistributionKey) {
    if (selectedDistribution.type === "metric" && key.type === "metric" && selectedDistribution.key === key.key) {
      return setSelectedDistribution({ type: "risk" });
    }
    setSelectedDistribution(key);
  }

  const selectedDistRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (selectedDistRef.current !== null) {
      selectedDistRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedDistribution]);

  return (
    <li className={`detailsMetric ${selectedDistribution.type === "metric" && selectedDistribution.key === m.key ? "selected" : ""}`}>
      <button
        onMouseEnter={() => setHighlightedDistribution({ type: "metric", key: m.key })}
        onMouseLeave={() => setHighlightedDistribution(null)}
        onClick={() => handleInspectDistribution({ type: "metric", key: m.key })}
        className={`detailsHandle ${highlightedDistribution && highlightedDistribution.type === "metric" && highlightedDistribution.key === m.key ? "highlighted" : ""}`}
        ref={selectedDistribution.type === "metric" && selectedDistribution.key === m.key ? selectedDistRef : null}
      >
        <div
          className="colorBox"
          style={{ "--risk-color": selectedKommune ? getRiskColor(selectedKommune, { type: "metric", key: m.key }) : null } as React.CSSProperties}
        ></div>
        <div className="detailsName">
          <Tooltip text={l(m.description)}>
            {l(m.name)}
          </Tooltip>
        </div>

        <div className="detailsRank">
          {m.rank !== null ? m.rank : "-"}
        </div>

        <div className="detailsRankFylke">
          {m.rankFylke !== null ? m.rankFylke : "-"}
        </div>
      </button>
    </li>
  );
}

export default DetailsMetric;