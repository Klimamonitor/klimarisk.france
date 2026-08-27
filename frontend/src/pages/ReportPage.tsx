// src/pages/ReportPage.tsx

import "./ReportPage.css";
import { useState, useMemo, useEffect } from "react";
import useDataStore from "../hooks/useDataStore";
import useLanguageStore, { t } from "../hooks/useLanguageStore";
import ReportDocument from "../components/report/document/ReportDocument";
import ReportViewer from "../components/report/ReportViewer";
import Header from "../components/header/Header";
import MunicipalitySelect from "../components/report/MunicipalitySelect";
import ReportUrlSync from "../components/report/ReportUrlSync";
import { reportStylesRevision } from "../components/report/document/reportStyles";
import ReportDownloadButton from "../components/report/ReportDownloadButton";
import { type ReportSnapshot } from "../components/report/document/reportSnapshot";
import {
    getDescendingRank,
} from "../hooks/statistics";
import { TerritoryExportModal } from "../components/report/TerritoryExportModal";

export type ReportMode = "local" | "departement" | "region";

const DEPARTEMENTS = [
    { key: "01", name: "01 - Ain" }, { key: "02", name: "02 - Aisne" }, { key: "03", name: "03 - Allier" },
    { key: "04", name: "04 - Alpes-de-Haute-Provence" }, { key: "05", name: "05 - Hautes-Alpes" },
    { key: "06", name: "06 - Alpes-Maritimes" }, { key: "07", name: "07 - Ardèche" },
    { key: "08", name: "08 - Ardennes" }, { key: "09", name: "09 - Ariège" },
    { key: "10", name: "10 - Aube" }, { key: "11", name: "11 - Aude" },
    { key: "12", name: "12 - Aveyron" }, { key: "13", name: "13 - Bouches-du-Rhône" },
    { key: "14", name: "14 - Calvados" }, { key: "15", name: "15 - Cantal" },
    { key: "16", name: "16 - Charente" }, { key: "17", name: "17 - Charente-Maritime" },
    { key: "18", name: "18 - Cher" }, { key: "19", name: "19 - Corrèze" },
    { key: "2A", name: "2A - Corse-du-Sud" }, { key: "2B", name: "2B - Haute-Corse" },
    { key: "21", name: "21 - Côte-d'Or" }, { key: "22", name: "22 - Côtes-d'Armor" },
    { key: "23", name: "23 - Creuse" }, { key: "24", name: "24 - Dordogne" },
    { key: "25", name: "25 - Doubs" }, { key: "26", name: "26 - Drôme" },
    { key: "27", name: "27 - Eure" }, { key: "28", name: "28 - Eure-et-Loir" },
    { key: "29", name: "29 - Finistère" }, { key: "30", name: "30 - Gard" },
    { key: "31", name: "31 - Haute-Garonne" }, { key: "32", name: "32 - Gers" },
    { key: "33", name: "33 - Gironde" }, { key: "34", name: "34 - Hérault" },
    { key: "35", name: "35 - Ille-et-Vilaine" }, { key: "36", name: "36 - Indre" },
    { key: "37", name: "37 - Indre-et-Loire" }, { key: "38", name: "38 - Isère" },
    { key: "39", name: "39 - Jura" }, { key: "40", name: "40 - Landes" },
    { key: "41", name: "41 - Loir-et-Cher" }, { key: "42", name: "42 - Loire" },
    { key: "43", name: "43 - Haute-Loire" }, { key: "44", name: "44 - Loire-Atlantique" },
    { key: "45", name: "45 - Loiret" }, { key: "46", name: "46 - Lot" },
    { key: "47", name: "47 - Lot-et-Garonne" }, { key: "48", name: "48 - Lozère" },
    { key: "49", name: "49 - Maine-et-Loire" }, { key: "50", name: "50 - Manche" },
    { key: "51", name: "51 - Marne" }, { key: "52", name: "52 - Haute-Marne" },
    { key: "53", name: "53 - Mayenne" }, { key: "54", name: "54 - Meurthe-et-Moselle" },
    { key: "55", name: "55 - Meuse" }, { key: "56", name: "56 - Morbihan" },
    { key: "57", name: "57 - Moselle" }, { key: "58", name: "58 - Nièvre" },
    { key: "59", name: "59 - Nord" }, { key: "60", name: "60 - Oise" },
    { key: "61", name: "61 - Orne" }, { key: "62", name: "62 - Pas-de-Calais" },
    { key: "63", name: "63 - Puy-de-Dôme" }, { key: "64", name: "64 - Pyrénées-Atlantiques" },
    { key: "65", name: "65 - Hautes-Pyrénées" }, { key: "66", name: "66 - Pyrénées-Orientales" },
    { key: "67", name: "67 - Bas-Rhin" }, { key: "68", name: "68 - Haut-Rhin" },
    { key: "69", name: "69 - Rhône" }, { key: "70", name: "70 - Haute-Saône" },
    { key: "71", name: "71 - Saône-et-Loire" }, { key: "72", name: "72 - Sarthe" },
    { key: "73", name: "73 - Savoie" }, { key: "74", name: "74 - Haute-Savoie" },
    { key: "75", name: "75 - Paris" }, { key: "76", name: "76 - Seine-Maritime" },
    { key: "77", name: "77 - Seine-et-Marne" }, { key: "78", name: "78 - Yvelines" },
    { key: "79", name: "79 - Deux-Sèvres" }, { key: "80", name: "80 - Somme" },
    { key: "81", name: "81 - Tarn" }, { key: "82", name: "82 - Tarn-et-Garonne" },
    { key: "83", name: "83 - Var" }, { key: "84", name: "84 - Vaucluse" },
    { key: "85", name: "85 - Vendée" }, { key: "86", name: "86 - Vienne" },
    { key: "87", name: "87 - Haute-Vienne" }, { key: "88", name: "88 - Vosges" },
    { key: "89", name: "89 - Yonne" }, { key: "90", name: "90 - Territoire de Belfort" },
    { key: "91", name: "91 - Essonne" }, { key: "92", name: "92 - Hauts-de-Seine" },
    { key: "93", name: "93 - Seine-Saint-Denis" }, { key: "94", name: "94 - Val-de-Marne" },
    { key: "95", name: "95 - Val-d'Oise" }
];

const REGIONS = [
    { key: "84", name: "Auvergne-Rhône-Alpes" },
    { key: "27", name: "Bourgogne-Franche-Comté" },
    { key: "53", name: "Bretagne" },
    { key: "24", name: "Centre-Val de Loire" },
    { key: "94", name: "Corse" },
    { key: "44", name: "Grand Est" },
    { key: "32", name: "Hauts-de-France" },
    { key: "11", name: "Île-de-France" },
    { key: "28", name: "Normandie" },
    { key: "75", name: "Nouvelle-Aquitaine" },
    { key: "76", name: "Occitanie" },
    { key: "52", name: "Pays de la Loire" },
    { key: "93", name: "Provence-Alpes-Côte d'Azur" },
];

const REGION_DEPARTEMENTS_MAP: Record<string, string[]> = {
    "84": ["01", "03", "07", "15", "26", "38", "42", "43", "63", "69", "73", "74"],
    "27": ["21", "25", "39", "58", "70", "71", "89", "90"],
    "53": ["22", "29", "35", "56"],
    "24": ["18", "28", "36", "37", "41", "45"],
    "94": ["2A", "2B"],
    "44": ["08", "10", "51", "52", "54", "55", "57", "67", "68", "88"],
    "32": ["02", "59", "60", "62", "80"],
    "11": ["75", "77", "78", "91", "92", "93", "94", "95"],
    "28": ["14", "27", "50", "61", "76"],
    "75": ["16", "17", "19", "23", "24", "33", "40", "47", "64", "79", "86", "87"],
    "76": ["09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82"],
    "52": ["44", "49", "53", "72", "85"],
    "93": ["04", "05", "06", "13", "83", "84"],
};

function getDeptFromInsee(code: string): string {
    const clean = String(code).trim();
    if (clean.startsWith("97")) return clean.slice(0, 3);
    if (clean.startsWith("2A") || clean.startsWith("2B")) return clean.slice(0, 2);
    return clean.padStart(5, "0").slice(0, 2);
}

function ReportPage() {
    const {
        selectedKommune,
        setSelectedKommune,
        selectedYear,
        setSelectedYear,
        data,
        cache,
        dataModel,
        getRiskColor,
        getFylkeDistribution,
    } = useDataStore();

    const { l, language } = useLanguageStore();

    const [reportMode, setReportMode] = useState<ReportMode>("local");
    const [selectedDept, setSelectedDept] = useState<string>("01");
    const [selectedRegion, setSelectedRegion] = useState<string>("84");
    const [showExportModal, setShowExportModal] = useState<boolean>(false);

    const targetKey = useMemo(() => {
        if (reportMode === "departement") return selectedDept;
        if (reportMode === "region") return selectedRegion;
        return selectedKommune;
    }, [reportMode, selectedDept, selectedRegion, selectedKommune]) as any;

    const targetName = useMemo(() => {
        if (reportMode === "departement") {
            return DEPARTEMENTS.find((d) => d.key === selectedDept)?.name || selectedDept;
        }
        if (reportMode === "region") {
            return REGIONS.find((r) => r.key === selectedRegion)?.name || selectedRegion;
        }
        return targetKey;
    }, [reportMode, selectedDept, selectedRegion, targetKey]);

    useEffect(() => {
        if (reportMode !== "local" || !targetKey) return;
        if (selectedKommune !== targetKey) {
            setSelectedKommune(targetKey);
        }
    }, [reportMode, targetKey, selectedKommune, setSelectedKommune]);

    const allYearReports: ReportSnapshot[] = useMemo(() => {
        if (!targetKey || !data || !cache || !dataModel || !dataModel.years) {
            return [];
        }

        const rawData = data as any;
        const rawCache = cache as any;

        return dataModel.years.map((yearObj: any) => {
            const yrKey = yearObj.key;
            const yearData = rawData.years[yrKey] || {};
            const yearCache = rawCache.years[yrKey] || {};

            const kommuneData = yearData.byKommune?.[targetKey] || {};
            const kommuneCache = yearCache.byKommune?.[targetKey] || {};

            const rawDataModel = dataModel as any;
            const totalRiskVal = kommuneCache?.totalRisk;

            const topFlopData: Record<string, any> = {};

            if (reportMode !== "local") {
                const validDepts = reportMode === "region" ? (REGION_DEPARTEMENTS_MAP[String(targetKey)] || []) : [];

                // 1. Classement pour le RISQUE GLOBAL
                const riskEntities = Object.entries(yearCache.byKommune || {})
                    .filter(([code]) => {
                        const dept = getDeptFromInsee(code);
                        if (reportMode === "departement") return dept === String(targetKey).padStart(2, "0");
                        if (reportMode === "region") return validDepts.includes(dept);
                        return true;
                    })
                    .map(([code, entity]: [string, any]) => {
                        const kData = yearData.byKommune?.[code];
                        const val = entity?.totalRisk;
                        return {
                            code,
                            name: kData?.klimarisk_name || kData?.name || code,
                            value: typeof val === "number" ? val : 0,
                        };
                    })
                    .filter((item) => item.value > 0);

                riskEntities.sort((a, b) => b.value - a.value);

                topFlopData["risk"] = {
                    top20: riskEntities.slice(0, 20),
                    flop20: [...riskEntities].reverse().slice(0, 20),
                };

                // 2. Classements pour chaque composante et métrique
                dataModel.elements.forEach((element: any) => {
                    if (element.disabled) return;

                    const territoryEntities = Object.entries(yearCache.byKommune || {})
                        .filter(([code]) => {
                            const dept = getDeptFromInsee(code);
                            if (reportMode === "departement") return dept === String(targetKey).padStart(2, "0");
                            if (reportMode === "region") return validDepts.includes(dept);
                            return true;
                        })
                        .map(([code, entity]: [string, any]) => {
                            const kData = yearData.byKommune?.[code];
                            const val = entity?.[element.key];
                            return {
                                code,
                                name: kData?.klimarisk_name || kData?.name || code,
                                value: typeof val === "number" ? val : 0,
                            };
                        })
                        .filter((item) => item.value > 0);

                    territoryEntities.sort((a, b) => (element.invert ? a.value - b.value : b.value - a.value));

                    topFlopData[element.key] = {
                        top20: territoryEntities.slice(0, 20),
                        flop20: [...territoryEntities].reverse().slice(0, 20),
                    };

                    element.metrics.forEach((metric: any) => {
                        if (metric.disabled) return;

                        const metricEntities = Object.entries(yearData.byKommune || {})
                            .filter(([code]) => {
                                const dept = getDeptFromInsee(code);
                                if (reportMode === "departement") return dept === String(targetKey).padStart(2, "0");
                                if (reportMode === "region") return validDepts.includes(dept);
                                return true;
                            })
                            .map(([code, kData]: [string, any]) => {
                                const val = kData?.[metric.key];
                                return {
                                    code,
                                    name: kData?.klimarisk_name || kData?.name || code,
                                    value: typeof val === "number" ? val : 0,
                                };
                            })
                            .filter((item) => item.value > 0);

                        const isMetricInvert = !metric.invert !== !element.invert;
                        metricEntities.sort((a, b) => (isMetricInvert ? a.value - b.value : b.value - a.value));

                        topFlopData[metric.key] = {
                            top20: metricEntities.slice(0, 20),
                            flop20: [...metricEntities].reverse().slice(0, 20),
                        };
                    });
                });
            }

            const reportDataModel = {
                elements: dataModel.elements
                    .filter((e: any) => !e.disabled)
                    .map((e: any) => {
                        const elemVal = kommuneCache?.[e.key];
                        const isElemZero = elemVal === 0 || elemVal === undefined || elemVal === null;

                        return {
                            ...e,
                            metrics: e.metrics
                                .filter((m: any) => !m.disabled)
                                .map((m: any) => {
                                    const metricVal = kommuneData?.[m.key];
                                    const isMetricZero = metricVal === 0 || metricVal === undefined || metricVal === null;

                                    return {
                                        ...m,
                                        color: getRiskColor(targetKey, { type: "metric", key: m.key }),
                                        value: metricVal,
                                        rank: isMetricZero
                                            ? undefined
                                            : getDescendingRank(
                                                yearData?.byMetric?.[m.key] || [],
                                                metricVal,
                                                !m.invert !== !e.invert
                                            ),
                                        rankFylke: isMetricZero
                                            ? undefined
                                            : getDescendingRank(
                                                getFylkeDistribution(
                                                    targetKey,
                                                    { type: "metric", key: m.key },
                                                    yrKey
                                                ) || [],
                                                metricVal,
                                                !m.invert !== !e.invert
                                            ),
                                    };
                                }),
                            color: getRiskColor(targetKey, { type: "element", key: e.key }),
                            value: elemVal,
                            rank: isElemZero
                                ? undefined
                                : getDescendingRank(yearCache?.byElement?.[e.key] || [], elemVal, e.invert),
                            rankFylke: isElemZero
                                ? undefined
                                : getDescendingRank(
                                    getFylkeDistribution(
                                        targetKey,
                                        { type: "element", key: e.key },
                                        yrKey
                                    ) || [],
                                    elemVal,
                                    e.invert
                                ),
                        };
                    }),

                risk: {
                    ...(rawDataModel?.risk || {}),
                    color: getRiskColor(targetKey, { type: "risk" }),
                    value: totalRiskVal,
                    rank:
                        totalRiskVal === 0 || totalRiskVal === undefined || totalRiskVal === null
                            ? undefined
                            : getDescendingRank(yearCache?.byTotalRisk || [], totalRiskVal),
                    rankFylke:
                        totalRiskVal === 0 || totalRiskVal === undefined || totalRiskVal === null
                            ? undefined
                            : getDescendingRank(
                                getFylkeDistribution(targetKey, { type: "risk" }, yrKey) || [],
                                totalRiskVal
                            ),
                },

                kommune: {
                    key: targetKey,
                    name:
                        reportMode === "local"
                            ? kommuneData?.klimarisk_name || kommuneData?.name || targetKey
                            : targetName,
                    aggregationLevel:
                        reportMode === "local"
                            ? String(targetKey).length > 5
                                ? "epci"
                                : "commune"
                            : reportMode,
                    numKommuneNorge: Object.keys(yearData?.byKommune || {}).length,
                    numKommuneFylke:
                        getFylkeDistribution(targetKey, { type: "risk" }, yrKey)?.length || 0,
                },

                year: yearObj,
                documentation: rawDataModel?.documentation,
                topFlopData,
            } as const;

            return {
                ...reportDataModel,
                language,
                l: (entry: any) => (entry ? entry[language] : undefined),
                t,
            } as unknown as ReportSnapshot;
        });
    }, [
        targetKey,
        targetName,
        reportMode,
        data,
        cache,
        dataModel,
        language,
        getRiskColor,
        getFylkeDistribution
    ]);

    const primaryReport = useMemo(() => {
        if (reportMode === "local" && selectedYear) {
            return allYearReports.find((r) => String(r.year?.key) === String(selectedYear)) || allYearReports[0] || null;
        }
        return allYearReports[0] || null;
    }, [allYearReports, reportMode, selectedYear]);

    return (
        <div className="reportPage">
            <ReportUrlSync />

            <main>
                <Header noControls />

                <div className="reportPageContent">
                    <h1>{l(t.report.title) || "Génération de Rapport"}</h1>

                    <h2>1. Type de rapport</h2>
                    <div className="reportTypeSelector">
                        <button
                            type="button"
                            className={`reportTypeBtn ${reportMode === "local" ? "active" : ""}`}
                            onClick={() => setReportMode("local")}
                        >
                            <span className="btnTitle">Rapport Communal / EPCI</span>
                            <span className="btnSub">Analyse locale</span>
                        </button>

                        <button
                            type="button"
                            className={`reportTypeBtn ${reportMode === "departement" ? "active" : ""}`}
                            onClick={() => setReportMode("departement")}
                        >
                            <span className="btnTitle">Rapport Départemental</span>
                            <span className="btnSub">Cartes & Classements départementaux</span>
                        </button>

                        <button
                            type="button"
                            className={`reportTypeBtn ${reportMode === "region" ? "active" : ""}`}
                            onClick={() => setReportMode("region")}
                        >
                            <span className="btnTitle">Rapport Régional</span>
                            <span className="btnSub">Cartes & Classements régionaux</span>
                        </button>
                    </div>

                    <h2>
                        2. {
                            reportMode === "local"
                                ? "Sélectionner la commune / EPCI"
                                : reportMode === "departement"
                                    ? "Sélectionner le département"
                                    : "Sélectionner la région"
                        }
                    </h2>
                    <p>
                        {reportMode === "local"
                            ? "Choisissez la commune ou l'intercommunalité pour laquelle générer le rapport complet."
                            : reportMode === "departement"
                                ? "Choisissez le département pour obtenir les cartes et classements complets."
                                : "Choisissez la région pour obtenir les cartes et classements complets."
                        }
                    </p>

                    {reportMode === "local" && (
                        <div>
                            <MunicipalitySelect />

                            {dataModel?.years && dataModel.years.length > 1 && (
                                <div style={{ marginTop: "16px" }}>
                                    <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "6px", color: "#1e293b" }}>
                                        Horizon temporel
                                    </h3>
                                    <select
                                        className="territorySelect"
                                        value={selectedYear ?? ""}
                                        onChange={(e) => setSelectedYear(e.target.value as any)}
                                    >
                                        {dataModel.years.map((y: any) => (
                                            <option key={y.key} value={y.key}>
                                                {l(y.name)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {reportMode === "departement" && (
                        <select
                            className="territorySelect"
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                        >
                            {DEPARTEMENTS.map((dept) => (
                                <option key={dept.key} value={dept.key}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {reportMode === "region" && (
                        <select
                            className="territorySelect"
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                        >
                            {REGIONS.map((reg) => (
                                <option key={reg.key} value={reg.key}>
                                    {reg.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {primaryReport && (
                        <div style={{ marginTop: "14px" }}>
                            {reportMode === "local" ? (
                                <ReportDownloadButton report={primaryReport} />
                            ) : (
                                <button
                                    type="button"
                                    className="reportDownloadBtn"
                                    onClick={() => setShowExportModal(true)}
                                >
                                    Télécharger le rapport territorial (PDF)
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {showExportModal && primaryReport && (
                <TerritoryExportModal
                    reportBase={primaryReport}
                    allReports={allYearReports}
                    onClose={() => setShowExportModal(false)}
                />
            )}

            {primaryReport && (
                <ReportViewer
                    key={[
                        reportStylesRevision,
                        primaryReport.kommune.key,
                        primaryReport.year?.key,
                        primaryReport.language,
                        reportMode,
                    ].join("-")}
                    document={
                        <ReportDocument
                            report={primaryReport}
                            allReports={allYearReports}
                        />
                    }
                />
            )}
        </div>
    );
}

export default ReportPage;