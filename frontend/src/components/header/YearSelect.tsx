import useDataStore from "../../hooks/useDataStore";
import Tooltip from "../Tooltip";
import useLanguageStore, { t } from "../../hooks/useLanguageStore";


function YearSelect() {
  const {
    selectedYear,
    setSelectedYear,
    dataModel,
  } = useDataStore();
  const { l } = useLanguageStore();

  if (!selectedYear) return null;

  return (
    <div className="yearSelect">
      <div className="label">
        {l(t.header.year.label)} :
      </div>
      {dataModel?.years.map(year => (
        <button
          key={year.key}
          onClick={() => setSelectedYear(year.key)}
          className={year.key === selectedYear ? "selected" : ""}
        >
          <Tooltip text={l(year.description)}>
            {l(year.name)}
          </Tooltip>
        </button>
      ))}
    </div>
  )
}

export default YearSelect;