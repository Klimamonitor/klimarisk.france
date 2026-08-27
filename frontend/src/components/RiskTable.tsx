import { useState, useMemo, useEffect, useRef } from "react";
import { FixedSizeList as List, type ListChildComponentProps } from 'react-window';
import useDataStore, { type KommuneNr } from "../hooks/useDataStore";
import "./RiskTable.css";
import useLanguageStore, { t } from "../hooks/useLanguageStore";
import Tooltip from "./Tooltip";
import { MoveDown as ArrowDown, MoveUp as ArrowUp, Layers } from "lucide-react";

// Variantes pour empêcher les doublons de colonnes alternatives
const METRIC_VARIANTS: Record<string, string[]> = {
  "hSnowresorts": ["hSnow"],
  "hFlood": ["hFloodeaip"],
  "hSubm": ["hSubmeaip"]
};

const DEPARTEMENTS_MAP: Record<string, string> = {
  "01": "Ain", "02": "Aisne", "03": "Allier", "04": "Alpes-de-Haute-Provence", "05": "Hautes-Alpes",
  "06": "Alpes-Maritimes", "07": "Ardèche", "08": "Ardennes", "09": "Ariège", "10": "Aube",
  "11": "Aude", "12": "Aveyron", "13": "Bouches-du-Rhône", "14": "Calvados", "15": "Cantal",
  "16": "Charente", "17": "Charente-Maritime", "18": "Cher", "19": "Corrèze", "2A": "Corse-du-Sud",
  "2B": "Haute-Corse", "21": "Côte-d'Or", "22": "Côtes-d'Armor", "23": "Creuse", "24": "Dordogne",
  "25": "Doubs", "26": "Drôme", "27": "Eure", "28": "Eure-et-Loir", "29": "Finistère",
  "30": "Gard", "31": "Haute-Garonne", "32": "Gers", "33": "Gironde", "34": "Hérault",
  "35": "Ille-et-Vilaine", "36": "Indre", "37": "Indre-et-Loire", "38": "Isère", "39": "Jura",
  "40": "Landes", "41": "Loir-et-Cher", "42": "Loire", "43": "Haute-Loire", "44": "Loire-Atlantique",
  "45": "Loiret", "46": "Lot", "47": "Lot-et-Garonne", "48": "Lozère", "49": "Maine-et-Loire",
  "50": "Manche", "51": "Marne", "52": "Haute-Marne", "53": "Mayenne", "54": "Meurthe-et-Moselle",
  "55": "Meuse", "56": "Morbihan", "57": "Moselle", "58": "Nièvre", "59": "Nord",
  "60": "Oise", "61": "Orne", "62": "Pas-de-Calais", "63": "Puy-de-Dôme", "64": "Pyrénées-Atlantiques",
  "65": "Hautes-Pyrénées", "66": "Pyrénées-Orientales", "67": "Bas-Rhin", "68": "Haut-Rhin",
  "69": "Rhône", "70": "Haute-Saône", "71": "Saône-et-Loire", "72": "Sarthe", "73": "Savoie",
  "74": "Haute-Savoie", "75": "Paris", "76": "Seine-Maritime", "77": "Seine-et-Marne", "78": "Yvelines",
  "79": "Deux-Sèvres", "80": "Somme", "81": "Tarn", "82": "Tarn-et-Garonne", "83": "Var",
  "84": "Vaucluse", "85": "Vendée", "86": "Vienne", "87": "Haute-Vienne", "88": "Vosges",
  "89": "Yonne", "90": "Territoire de Belfort", "91": "Essonne", "92": "Hauts-de-Seine",
  "93": "Seine-Saint-Denis", "94": "Val-de-Marne", "95": "Val-d'Oise",
  "971": "Guadeloupe", "972": "Martinique", "973": "Guyane", "974": "La Réunion", "976": "Mayotte"
};

function RiskTable() {
  const {
    dataModel,
    data,
    cache,
    selectedYear,
    selectedKommune,
    setSelectedKommune,
    highlightedKommune,
    setHighlightedKommune,
    layout,
    highlightedDistribution,
    selectedDistribution,
    getRiskColor,
    aggregationLevel,
    setAggregationLevel
  } = useDataStore();

  const { l } = useLanguageStore();

  const [sortKey, setSortKey] = useState<string>("totalRisk");
  const [sortAscending, setSortAscending] = useState<boolean>(false);

  const handleSort = (key: string, invert?: boolean) => {
    if (key === "name" || invert) {
      if (sortKey !== key) {
        setSortKey(key);
        setSortAscending(true);
      } else {
        if (sortAscending) {
          setSortAscending(false);
        } else {
          setSortKey("totalRisk");
          setSortAscending(false);
        }
      }
      return;
    }
    if (sortKey !== key) {
      setSortKey(key);
      setSortAscending(false);
    } else {
      if (!sortAscending) {
        setSortAscending(true);
      } else {
        setSortKey("totalRisk");
        setSortAscending(false);
      }
    }
  };

  const headers = useMemo(() => {
    if (!dataModel) return [];

    return dataModel.elements.filter(e => !e.disabled).flatMap(e => {
      const elementHeader = {
        key: String(e.key),
        name: e.name,
        description: e.description,
        isDeterminant: true,
        ...(e.invert ? { invert: true } : {}),
      };

      if (layout === "second") {
        let activeMetrics = e.metrics.filter(m => !m.disabled);

        Object.entries(METRIC_VARIANTS).forEach(([parentKey, variants]) => {
          const isParentActive = activeMetrics.some(m => String(m.key) === parentKey);
          if (isParentActive) {
            activeMetrics = activeMetrics.filter(m => !variants.includes(String(m.key)));
          } else {
            const activeVariant = activeMetrics.find(m => variants.includes(String(m.key)));
            if (activeVariant) {
              activeMetrics = activeMetrics.filter(m => !variants.includes(String(m.key)) || String(m.key) === String(activeVariant.key));
            }
          }
        });

        const metricsHeaders = activeMetrics.map(m => ({
          key: String(m.key),
          name: m.name,
          description: m.description,
          isDeterminant: false,
          ...(!!m.invert !== !!e.invert ? { invert: true } : {}),
        }));
        return [elementHeader, ...metricsHeaders];
      }

      return [elementHeader];
    });
  }, [dataModel, layout, cache]);

  const rows = useMemo(() => {
    if (!data || !cache || !dataModel || !selectedYear) return [];

    const activeMetricKeys = headers.filter(h => !h.isDeterminant).map(h => h.key);

    const tmp = Object.keys(data.years[selectedYear].byKommune).map(k => {
      const kommuneData = data.years[selectedYear].byKommune[k as KommuneNr];
      const kommuneCache = cache.years[selectedYear].byKommune[k as KommuneNr];

      let displayName = kommuneData.name as string;

      if (aggregationLevel === "departement") {
        const deptCode = String(k).padStart(2, '0');
        displayName = DEPARTEMENTS_MAP[deptCode] || displayName;
      }

      const rowData: Record<string, any> = {
        name: displayName,
        komNr: k as KommuneNr,
        totalRisk: kommuneCache?.totalRisk as number,
      };

      dataModel.elements.forEach(e => {
        rowData[String(e.key)] = kommuneCache?.[String(e.key)];
      });

      if (layout === "second") {
        activeMetricKeys.forEach(mKey => {
          rowData[mKey] = kommuneData[mKey];
        });
      }

      return rowData;
    });

    return tmp as {
      name: string;
      komNr: KommuneNr;
      totalRisk: number;
      [key: string]: string | number;
    }[];
  }, [data, cache, dataModel, selectedYear, layout, aggregationLevel, headers]);

  const rowsSorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aValue: string | number = a && sortKey in a ? (a[sortKey] as string | number) ?? '' : '';
      const bValue: string | number = b && sortKey in b ? (b[sortKey] as string | number) ?? '' : '';

      if (aValue === bValue) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      if (aValue < bValue) return sortAscending ? -1 : 1;
      if (aValue > bValue) return sortAscending ? 1 : -1;
      return 0;
    });
  }, [rows, sortKey, sortAscending]);

  const listRef = useRef<List | null>(null);
  const selectedRowRef = useRef<HTMLDivElement>(null);
  const selectedColRef = useRef<HTMLDivElement>(null);

  const headerRef = useRef<HTMLDivElement>(null);
  const outerListRef = useRef<HTMLDivElement>(null);
  const tbodyRef = useRef<HTMLDivElement>(null);

  const [tableHeight, setTableHeight] = useState<number>(420);

  useEffect(() => {
    const currentTbody = tbodyRef.current;
    if (!currentTbody) return;

    const updateHeight = () => {
      const height = currentTbody.clientHeight;
      if (height > 50) {
        setTableHeight(height);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    const observer = new ResizeObserver(updateHeight);
    observer.observe(currentTbody);

    return () => {
      window.removeEventListener("resize", updateHeight);
      observer.disconnect();
    };
  }, [data, cache]);

  useEffect(() => {
    const listContainer = outerListRef.current;
    const headerContainer = headerRef.current;

    if (!listContainer || !headerContainer) return;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target === listContainer) {
        headerContainer.scrollLeft = listContainer.scrollLeft;
      } else if (target === headerContainer) {
        listContainer.scrollLeft = headerContainer.scrollLeft;
      }
    };

    listContainer.addEventListener("scroll", handleScroll, { passive: true });
    headerContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      listContainer.removeEventListener("scroll", handleScroll);
      headerContainer.removeEventListener("scroll", handleScroll);
    };
  }, [data, cache, tableHeight, layout]);

  useEffect(() => {
    if (!listRef.current || !selectedKommune) return;
    const idx = rowsSorted.findIndex(r => r.komNr === selectedKommune);
    if (idx >= 0) {
      listRef.current.scrollToItem(idx, 'center');
    }
  }, [selectedKommune, rowsSorted]);

  if (!data || !cache) {
    return <p>{l(t.common.loading)}</p>;
  }

  const Row = ({ index, style }: ListChildComponentProps) => {
    const row = rowsSorted[index];
    if (!row) return null;

    const renderValue = (val: any) => {
      if (val === null || val === undefined) return '';
      const num = Number(val);
      return isNaN(num) ? String(val) : num.toFixed(0);
    };

    return (
      <div
        style={style}
        className={`rt-row ${row.komNr === selectedKommune ? 'selected' : ''} ${row.komNr === highlightedKommune ? 'highlighted' : ''}`}
        onMouseEnter={() => setHighlightedKommune(row.komNr)}
        onMouseLeave={() => setHighlightedKommune(null)}
        ref={row.komNr === selectedKommune ? selectedRowRef : null}
        onClick={() => setSelectedKommune(row.komNr)}
      >
        <div className="rt-cell indexCol" style={{ "--risk-color": getRiskColor(row.komNr) } as React.CSSProperties}>
          {index + 1}
        </div>
        <div className="rt-cell kommuneCol">
          <span className="kommuneNameText">{row.name}</span>
        </div>
        <div className={`rt-cell numeric totalRiskCol ${highlightedDistribution && highlightedDistribution.type === "risk" ? "highlightedCol" : ""} ${selectedDistribution.type === "risk" ? "selectedCol" : ""}`}>
          {renderValue(row.totalRisk)}
        </div>
        {headers.map((header, headerIndex) => (
          <div
            key={`${index}-${headerIndex}`}
            className={`rt-cell numeric ${header.isDeterminant ? 'determinantCol' : ''} ${(highlightedDistribution && highlightedDistribution?.type !== "risk" && String(highlightedDistribution.key) === header.key) ? "highlightedCol" : ""} ${selectedDistribution.type !== "risk" && String(selectedDistribution.key) === header.key ? "selectedCol" : ""}`}
          >
            {renderValue(row[header.key])}
          </div>
        ))}
      </div>
    );
  };

  const getTableHeaderName = () => {
    if (aggregationLevel === "commune") return l(t.table.kommune);
    if (aggregationLevel === "epci") return "EPCI";
    return l(t.table.departement) || "Department";
  };

  return (
    <div className="riskTableContainer">
      <div className="aggregation-controls">
        <span className="agg-label">
          <Layers size={16} /> {l(t.table.level) || "Level :"}
        </span>
        <button
          className={`agg-btn ${aggregationLevel === "commune" ? "active" : ""}`}
          onClick={() => setAggregationLevel("commune")}
        >
          {l(t.table.communes) || "Municipalities"}
        </button>
        <button
          className={`agg-btn ${aggregationLevel === "epci" ? "active" : ""}`}
          onClick={() => setAggregationLevel("epci")}
        >
          <Tooltip
            text={l({
              fr: "Établissement public de coopération intercommunale : agglomération, communauté de communes, métropoles...",
              en: "Public establishment for intercommunal cooperation : agglomeration, community of municipalities, metropolises..."
            })}
          >
            EPCI
          </Tooltip>
        </button>
        <button
          className={`agg-btn ${aggregationLevel === "departement" ? "active" : ""}`}
          onClick={() => setAggregationLevel("departement")}
        >
          {l(t.table.departements) || "Departments"}
        </button>
      </div>

      <div className="rt-table">
        <div className="rt-thead" ref={headerRef}>
          <div className="rt-row rt-header">
            <div className="rt-cell indexCol">#</div>
            <div className="rt-cell kommuneCol">
              <button type="button" onClick={() => handleSort("name")}>
                {getTableHeaderName()}
                <div className="sortIcon">
                  {sortKey === "name" && (sortAscending ? <ArrowUp /> : <ArrowDown />)}
                </div>
              </button>
            </div>
            <div
              className={`rt-cell numeric totalRiskCol ${highlightedDistribution && highlightedDistribution.type === "risk" ? "highlightedCol" : ""} ${selectedDistribution.type === "risk" ? "selectedCol" : ""}`}
              ref={selectedDistribution.type === "risk" ? selectedColRef : null}
            >
              <button type="button" onClick={() => handleSort("totalRisk")}>
                {l(t.common.totalRisk)}
                <div className="sortIcon">
                  {sortKey === "totalRisk" && (sortAscending ? <ArrowUp /> : <ArrowDown />)}
                </div>
              </button>
            </div>
            {headers.map((header, index) => (
              <div
                key={index}
                className={`rt-cell numeric ${header.isDeterminant ? 'determinantCol' : ''} ${highlightedDistribution && highlightedDistribution?.type !== "risk" && String(highlightedDistribution.key) === header.key ? "highlightedCol" : ""} ${selectedDistribution.type !== "risk" && String(selectedDistribution.key) === header.key ? "selectedCol" : ""}`}
                ref={selectedDistribution.type !== "risk" && String(selectedDistribution.key) === header.key ? selectedColRef : null}
              >
                <button type="button" onClick={() => handleSort(header.key, header.invert)}>
                  <Tooltip text={header.description ? l(header.description) : undefined}>
                    {l(header.name)}
                  </Tooltip>
                  <div className="sortIcon">
                    {sortKey === header.key && (sortAscending ? <ArrowUp /> : <ArrowDown />)}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rt-tbody" ref={tbodyRef}>
          <List
            ref={(el: List<any> | null) => {
              listRef.current = el;
              if (el) {
                outerListRef.current = (el as any)._outerRef;
              }
            }}
            height={tableHeight}
            itemCount={rowsSorted.length}
            itemSize={24}
            width="100%"
          >
            {Row}
          </List>
        </div>
      </div>
    </div>
  );
}

export default RiskTable;