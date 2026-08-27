import { useState, useEffect } from "react";
import useDataStore from "../hooks/useDataStore";
import "./RiskTree.css";
import useLanguageStore, { t } from "../hooks/useLanguageStore";
import Tooltip from "./Tooltip";
import { ChevronDown, ChevronRight } from "lucide-react";

const METRIC_VARIANTS: Record<string, string[]> = {
  "hSnowresorts": ["hSnow"],
  "hFlood": ["hFloodeaip"],
  "hSubm": ["hSubmeaip"]
};
const VARIANT_KEYS = Object.values(METRIC_VARIANTS).flat();

const RADIO_LABELS: Record<string, { fr: string; en: string }> = {
  "hSnowresorts": {
    fr: "Pondéré par la dépendance à l'économie du ski",
    en: "Weighted (socio-economic dependency)"
  },
  "hSnow": {
    fr: "Données climatiques brutes",
    en: "Raw climate hazard"
  },
  "hFlood": {
    fr: "Cartographie des TRI",
    en: "TRI mapping"
  },
  "hFloodeaip": {
    fr: "Cartographie des EAIP",
    en: "EAIP mapping"
  },
  "hSubm": {
    fr: "Cartographie des TRI",
    en: "TRI mapping"
  },
  "hSubmeaip": {
    fr: "Cartographie des EAIP",
    en: "EAIP mapping"
  }
};

function RiskTree() {
  const {
    dataModel,
    refreshCacheRisk,
    setHighlightedDistribution,
    checkDistribution,
  } = useDataStore();

  const { l } = useLanguageStore();
  const [expandedMetrics, setExpandedMetrics] = useState<Record<string, boolean>>({});

  // Nettoyage au premier lancement : désactive les variantes secondaires si l'option principale est cochée
  useEffect(() => {
    if (dataModel) {
      let needsRefresh = false;
      dataModel.elements.forEach((element: any) => {
        element.metrics.forEach((metric: any) => {
          if (METRIC_VARIANTS[metric.key as string]) {
            if (!metric.disabled) {
              METRIC_VARIANTS[metric.key as string].forEach((vKey) => {
                const v = element.metrics.find((m: any) => m.key === vKey);
                if (v && !v.disabled) {
                  v.disabled = true;
                  needsRefresh = true;
                }
              });
            }
          }
        });
      });
      if (needsRefresh) {
        refreshCacheRisk();
        checkDistribution();
      }
    }
  }, [dataModel, refreshCacheRisk, checkDistribution]);

  if (!dataModel) {
    return <p>{l(t.common.loading)}</p>;
  }

  // Clic sur la case principale de la catégorie (Aléa, Exposition, etc.)
  const handleElementToggle = (element: any, isChecked: boolean) => {
    element.disabled = !isChecked;

    // Si on décoche le parent, on éteint toutes les métriques
    // Si on coche le parent, on rallume toutes les métriques principales (hors variantes alternatives)
    element.metrics.forEach((m: any) => {
      if (!isChecked) {
        m.disabled = true;
      } else {
        m.disabled = VARIANT_KEYS.includes(m.key as string);
      }
    });

    refreshCacheRisk();
    checkDistribution();
  };

  // Clic sur un indicateur simple ou le parent d'une variante
  const handleMetricToggle = (element: any, metric: any, hasVariants: boolean, variants: string[], isChecked: boolean) => {
    // Si la catégorie était éteinte et qu'on active un facteur, on rallume la catégorie
    if (isChecked && element.disabled) {
      element.disabled = false;
    }

    if (hasVariants) {
      if (!isChecked) {
        metric.disabled = true;
        variants.forEach((vKey) => {
          const v = element.metrics.find((m: any) => m.key === vKey);
          if (v) v.disabled = true;
        });
      } else {
        metric.disabled = false;
        variants.forEach((vKey) => {
          const v = element.metrics.find((m: any) => m.key === vKey);
          if (v) v.disabled = true;
        });
      }
    } else {
      metric.disabled = !isChecked;
    }

    // Si aucune métrique n'est plus active dans l'élément, on éteint l'élément parent
    const hasAnyActiveMetric = element.metrics.some((m: any) => !m.disabled);
    if (!hasAnyActiveMetric) {
      element.disabled = true;
    }

    refreshCacheRisk();
    checkDistribution();
  };

  // Clic sur un bouton radio (variante alternative)
  const handleRadioSelect = (element: any, targetKey: string, parentKey: string, variants: string[]) => {
    // Si la catégorie était éteinte, la réactiver
    if (element.disabled) {
      element.disabled = false;
    }

    const allKeys = [parentKey, ...variants];
    allKeys.forEach((k) => {
      const metric = element.metrics.find((m: any) => m.key === k);
      if (metric) {
        metric.disabled = metric.key !== targetKey;
      }
    });

    refreshCacheRisk();
    checkDistribution();
  };

  return (
    <div className="riskTree">
      <ul>
        {dataModel.elements.map((element) => (
          <li
            key={element.key}
            onMouseEnter={() => setHighlightedDistribution({ type: "element", key: element.key })}
            onMouseLeave={() => setHighlightedDistribution(null)}
            className={`treeElement ${element.disabled ? "disabled" : ""}`}
          >
            <div className="treeRow">
              <label htmlFor={`risktree-${element.key}`} className="treeHandle">
                <input
                  type="checkbox"
                  checked={!element.disabled}
                  onChange={(e) => handleElementToggle(element, e.target.checked)}
                  id={`risktree-${element.key}`}
                  className="treeBox"
                />
                <Tooltip text={element.description ? l(element.description) : undefined}>
                  <div className="treeName">{l(element.name)}</div>
                </Tooltip>
              </label>
            </div>

            <ul>
              {element.metrics
                .filter((m) => !VARIANT_KEYS.includes(m.key as string))
                .map((metric) => {
                  const variants = METRIC_VARIANTS[metric.key as string];
                  const hasVariants = variants && variants.length > 0;
                  const isExpanded = expandedMetrics[metric.key as string];

                  const isGroupActive = hasVariants
                    ? !metric.disabled || variants.some((vKey) => !element.metrics.find((m: any) => m.key === vKey)?.disabled)
                    : !metric.disabled;

                  const radioGroup = hasVariants
                    ? [metric, ...element.metrics.filter((m: any) => variants.includes(m.key as string))]
                    : [];

                  return (
                    <div key={metric.key}>
                      <li className={`treeMetric ${!isGroupActive ? "disabled" : ""}`}>
                        <div className="treeRow">
                          {hasVariants ? (
                            <button
                              type="button"
                              className="variantToggleBtn"
                              onClick={(e) => {
                                e.preventDefault();
                                setExpandedMetrics((prev) => ({
                                  ...prev,
                                  [metric.key as string]: !prev[metric.key as string],
                                }));
                              }}
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          ) : (
                            <div className="variantSpacer" />
                          )}

                          <label htmlFor={`risktree-${element.key}-${metric.key}`} className="treeHandle">
                            <input
                              type="checkbox"
                              checked={isGroupActive}
                              onChange={(e) =>
                                handleMetricToggle(element, metric, !!hasVariants, variants || [], e.target.checked)
                              }
                              id={`risktree-${element.key}-${metric.key}`}
                              className="treeBox"
                            />
                            <Tooltip text={metric.description ? l(metric.description) : undefined}>
                              <div className="treeName">{l(metric.name)}</div>
                            </Tooltip>
                          </label>
                        </div>
                      </li>

                      {hasVariants && isExpanded && (
                        <div className="radioGroupContainer">
                          {radioGroup.map((option) => {
                            const isSelected = !option.disabled;
                            const radioLabel = RADIO_LABELS[option.key as string]
                              ? l(RADIO_LABELS[option.key as string])
                              : l(option.name);

                            return (
                              <li key={option.key} className="treeMetric radioMetric">
                                <div className="treeRow">
                                  <div className="variantLine" />
                                  <label htmlFor={`risktree-radio-${option.key}`} className="treeHandle radioHandle">
                                    <input
                                      type="radio"
                                      name={`radio-group-${metric.key}`}
                                      id={`risktree-radio-${option.key}`}
                                      checked={isSelected}
                                      onChange={() =>
                                        handleRadioSelect(element, option.key as string, metric.key as string, variants)
                                      }
                                      className="treeRadioBox"
                                    />
                                    <Tooltip text={option.description ? l(option.description) : undefined}>
                                      <div className={`treeName radioName ${isSelected ? "selected" : ""}`}>
                                        {radioLabel}
                                      </div>
                                    </Tooltip>
                                  </label>
                                </div>
                              </li>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RiskTree;