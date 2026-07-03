import useDataStore from "../../hooks/useDataStore";
import useLanguageStore, { t } from "../../hooks/useLanguageStore";


function LayoutSelect() {
  const {
    layout,
    setLayout,
  } = useDataStore();
  const { l } = useLanguageStore();

  return (
    <div className="layoutSelect">
      <div className="label">
        {l(t.header.layout.label)} :
      </div>
      <button 
        onClick={() => setLayout("first")}
        className={layout === "first" ? "selected" : ""}
      >
        {l(t.header.layout.l1)}
      </button>
      <button
        onClick={() => setLayout("second")}
        className={layout === "second" ? "selected" : ""}
      >
        {l(t.header.layout.l2)}
      </button>
    </div>
  )
}

export default LayoutSelect;