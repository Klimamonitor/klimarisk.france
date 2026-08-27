import useDataStore, { type Year } from "../../hooks/useDataStore";
import useLanguageStore, { t } from "../../hooks/useLanguageStore";

interface Props {
    className?: string;
}

function ReportYearSelect({ className }: Props) {
    const {
        selectedYear,
        setSelectedYear,
        dataModel,
    } = useDataStore();
    const { l } = useLanguageStore();

    if (!selectedYear) return null;

    return (
        <select
            className={`reportYearSelect ${className || ""}`}
            value={selectedYear ?? ""}
            onChange={(event) =>
                setSelectedYear(event.target.value as Year)
            }
        >
            <option value="" disabled>
                {l(t.report.selectYear)}
            </option>

            {dataModel?.years.map((year) => (
                <option
                    key={year.key}
                    value={year.key}
                >
                    {l(year.name)}
                </option>
            ))}
        </select>
    );
}

export default ReportYearSelect;