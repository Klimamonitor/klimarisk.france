import useDataStore from '../../hooks/useDataStore';
import useLanguageStore, { t } from '../../hooks/useLanguageStore';
import { Link, useLocation } from 'react-router-dom';
import { FileText } from 'lucide-react';

function ReportButton() {
  const { selectedKommune, selectedYear } = useDataStore();
  const { language, l } = useLanguageStore();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  if (selectedKommune) params.set("k", selectedKommune);
  if (selectedYear) params.set("y", selectedYear);
  params.set("l", language);

  return (
    <div className="reportButton">
      <Link
        to={`/report?${params.toString()}`}
        className="btn-report-link"
      >
        <FileText size={18} style={{ marginRight: "0.2rem" }} />
        {l(t?.details?.generateReport) || l({ fr: "Générer le rapport", en: "Generate report" })}
      </Link>
    </div>
  );
}

export default ReportButton;