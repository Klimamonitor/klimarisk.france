import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useDataStore, { type KommuneNr, type Year } from "../../hooks/useDataStore";
import useLanguageStore, { type Language } from "../../hooks/useLanguageStore";


function ReportUrlSync() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    selectedKommune,
    selectedYear,
    setSelectedKommune,
    setSelectedYear,
    data,
  } = useDataStore();
  const {
    language,
    setLanguage,
  } = useLanguageStore();

  // Read the URL once, after the data has loaded.
  useEffect(() => {
    if (!data || isInitialized) return;

    const kommuneParam = searchParams.get("k");
    const yearParam = searchParams.get("y");
    const languageParam = searchParams.get("l");

    const validYear =
      yearParam !== null && yearParam in data.years
        ? (yearParam as Year)
        : null;

    const validKommune =
      kommuneParam !== null &&
      validYear !== null &&
      kommuneParam in data.years[validYear].byKommune
        ? (kommuneParam as KommuneNr)
        : null;

    const validLanguage: Language | null =
      languageParam === "fr" || languageParam === "en"
        ? languageParam
        : null;

    if (validYear) setSelectedYear(validYear);
    if (validKommune) setSelectedKommune(validKommune);
    if (validLanguage) setLanguage(validLanguage);

    setIsInitialized(true);
  }, [
    data,
    isInitialized,
    searchParams,
    setSelectedKommune,
    setSelectedYear,
    setLanguage,
  ]);

  // After initialization, keep the URL synchronized with Zustand.
  useEffect(() => {
    if (!isInitialized) return;

    setSearchParams(currentParams => {
      const nextParams = new URLSearchParams(currentParams);

      if (selectedKommune) {
        nextParams.set("k", selectedKommune);
      } else {
        nextParams.delete("k");
      }

      if (selectedYear) {
        nextParams.set("y", selectedYear);
      } else {
        nextParams.delete("y");
      }

      nextParams.set("l", language);

      return nextParams;
    }, {
      replace: true,
    });
  }, [
    isInitialized,
    selectedKommune,
    selectedYear,
    language,
    setSearchParams,
  ]);

  return null;
}

export default ReportUrlSync;