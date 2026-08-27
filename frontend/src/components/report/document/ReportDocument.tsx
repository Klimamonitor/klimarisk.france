// src/components/report/document/ReportDocument.tsx

import "./reportFonts";
import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import type { ReportSnapshot } from "./reportSnapshot";
import ElementPage from "./ElementPage";
import TerritoryElementPage from "./TerritoryElementPage";
import DocumentationPage from "./DocumentationPage";
import TitlePage from "./TitlePage";
import TerritoryCoverPage from "./TerritoryCoverPage";
import { reportStyles as s } from "./reportStyles";
import React from "react";

interface Props {
    report?: ReportSnapshot;
    allReports?: ReportSnapshot[];
}

const truncateName = (str: string, max = 30) =>
    str.length > max ? `${str.slice(0, max - 1)}…` : str;

function getRankDisplay(items: { value: number }[], currentIndex: number): number {
    if (currentIndex === 0) return 1;
    let rank = 1;
    for (let i = 1; i <= currentIndex; i++) {
        if (Math.abs(items[i].value - items[i - 1].value) > 0.001) {
            rank = i + 1;
        }
    }
    return rank;
}

// 🎯 Page dédiée au Risque Global (4 horizons)
function TerritoryRiskGlobalPage({
    report,
    allReports,
    topFlopData,
    metricMaps,
}: {
    report: ReportSnapshot;
    allReports: ReportSnapshot[];
    topFlopData?: any;
    metricMaps?: Record<string, string>;
}) {
    const { l, kommune } = report;
    const territoryTitle = kommune.aggregationLevel === "region" ? "Régionale" : "Départementale";
    const territorySubject = kommune.aggregationLevel === "region" ? "Région" : "Département";
    const horizonList = allReports && allReports.length > 0 ? allReports : [report];
    const resolvedMaps = metricMaps || (report as any).metricMaps || report.indicatorMaps;

    const isRiskZero = (rk?: any) => {
        if (!rk) return true;
        const maxTop = rk.top20?.reduce((max: number, item: any) => Math.max(max, item.value || 0), 0) ?? 0;
        return rk.allZero || !rk.top20 || rk.top20.length === 0 || maxTop === 0;
    };

    const isAllHorizonsZero = horizonList.every((yrRep) => {
        const rk = yrRep.topFlopData?.risk || topFlopData?.risk;
        return isRiskZero(rk);
    });

    return (
        <Page size="A4" style={[s.page, { padding: 12 }]} bookmark="Risque Global" id="page-risk-global">
            <Text fixed style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />

            <View wrap={false} style={{ marginBottom: 4, borderBottomWidth: 1, borderBottomColor: "#cbd5e1", paddingBottom: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: "bold", color: "#1e293b" }}>
                    Risque Global — Analyse {territoryTitle}
                </Text>
                <Text style={{ fontSize: 6, color: "#64748b", marginTop: 1, lineHeight: 1.15 }}>
                    Évaluation synthétique combinant l'aléa climatique futur, la vulnérabilité socio-écologique et l'exposition territoriale.
                </Text>
            </View>

            {isAllHorizonsZero ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 4, borderWidth: 0.5, borderColor: "#cbd5e1", marginVertical: 20, padding: 20 }}>
                    <Text style={{ fontSize: 10, fontWeight: "bold", color: "#475569", marginBottom: 6 }}>
                        {territorySubject} non concerné(e) par ce risque
                    </Text>
                    <Text style={{ fontSize: 7.5, color: "#94a3b8", textAlign: "center" }}>
                        Toutes les communes présentent un niveau de risque global nul sur l'ensemble des horizons temporels.
                    </Text>
                </View>
            ) : (
                <View style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                    {horizonList.map((yrRep) => {
                        const yrKey = yrRep.year?.key || yrRep.year;
                        const yrMaps = yrRep.indicatorMaps || (yrRep as any).metricMaps || resolvedMaps;
                        const riskMap = yrMaps?.[`${yrKey}_risk`] || yrMaps?.risk || yrMaps?.[`${yrKey}_h`] || yrMaps?.h;
                        const rk = yrRep.topFlopData?.risk || topFlopData?.risk;

                        return (
                            <View
                                key={`hz-risk-${yrKey}`}
                                wrap={false}
                                style={{
                                    flex: 1,
                                    padding: 2.5,
                                    backgroundColor: "#f8fafc",
                                    borderRadius: 3,
                                    borderWidth: 0.5,
                                    borderColor: "#cbd5e1",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <View style={{ width: "60%", height: "100%", alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontSize: 6.5, fontWeight: "bold", color: "#ea580c", marginBottom: 1 }}>
                                        {l(yrRep.year?.name || yrRep.year)}
                                    </Text>
                                    <View style={{ width: "100%", height: 165, backgroundColor: "#ffffff", borderRadius: 2, borderWidth: 0.5, borderColor: "#cbd5e1", overflow: "hidden", justifyContent: "center", alignItems: "center" }}>
                                        {riskMap ? (
                                            <Image src={riskMap} cache={false} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                        ) : (
                                            <Text style={{ fontSize: 5, color: "#94a3b8" }}>Carte indisponible</Text>
                                        )}
                                    </View>
                                </View>

                                <View style={{ width: "38%", flexDirection: "row", justifyContent: "space-between" }}>
                                    <View style={{ width: "48.5%" }}>
                                        <Text style={{ fontSize: 4.8, fontWeight: "bold", color: "#b91c1c", marginBottom: 0.8 }}>20 communes au risque le plus élevé</Text>
                                        {rk?.top20?.slice(0, 20).map((item: any, idx: number, arr: any[]) => (
                                            <View key={`r-top-${item.code}-${idx}`} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 0.05, borderBottomWidth: 0.3, borderBottomColor: "#e2e8f0" }}>
                                                <Text style={{ fontSize: 4, color: "#334155" }}>{getRankDisplay(arr, idx)}. {truncateName(item.name, 30)}</Text>
                                                <Text style={{ fontSize: 4, fontWeight: "bold", color: "#0f172a" }}>{item.value.toFixed(1)}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <View style={{ width: "48.5%" }}>
                                        <Text style={{ fontSize: 4.8, fontWeight: "bold", color: "#15803d", marginBottom: 0.8 }}>20 communes au risque le plus faible</Text>
                                        {rk?.flop20?.slice(0, 20).map((item: any, idx: number, arr: any[]) => (
                                            <View key={`r-flop-${item.code}-${idx}`} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 0.05, borderBottomWidth: 0.3, borderBottomColor: "#e2e8f0" }}>
                                                <Text style={{ fontSize: 4, color: "#334155" }}>{getRankDisplay(arr, idx)}. {truncateName(item.name, 30)}</Text>
                                                <Text style={{ fontSize: 4, fontWeight: "bold", color: "#0f172a" }}>{item.value.toFixed(1)}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}
        </Page>
    );
}

// 🎯 Page unitaire pour chaque métrique d'aléa
function TerritoryMetricPage({
    report,
    element,
    metric,
    allReports,
    topFlopData,
    metricMaps,
}: {
    report: ReportSnapshot;
    element: any;
    metric: any;
    allReports: ReportSnapshot[];
    topFlopData?: any;
    metricMaps?: Record<string, string>;
}) {
    const { l, kommune } = report;
    const territoryTitle = kommune.aggregationLevel === "region" ? "Régionale" : "Départementale";
    const territorySubject = kommune.aggregationLevel === "region" ? "Région" : "Département";
    const horizonList = allReports && allReports.length > 0 ? allReports : [report];
    const resolvedMaps = metricMaps || (report as any).metricMaps || report.indicatorMaps;

    const isRiskZero = (rk?: any) => {
        if (!rk) return true;
        const maxTop = rk.top20?.reduce((max: number, item: any) => Math.max(max, item.value || 0), 0) ?? 0;
        return rk.allZero || !rk.top20 || rk.top20.length === 0 || maxTop === 0;
    };

    const isAllHorizonsZero = horizonList.every((yrRep) => {
        const rk = yrRep.topFlopData?.[metric.key] || topFlopData?.[metric.key];
        return isRiskZero(rk);
    });

    return (
        <Page size="A4" style={[s.page, { padding: 12 }]} bookmark={l(metric.name)} id={metric.key}>
            <Text fixed style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />

            <View wrap={false} style={{ marginBottom: 4, borderBottomWidth: 1, borderBottomColor: "#cbd5e1", paddingBottom: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: "bold", color: "#1e293b" }}>
                    {l(metric.name)} — {l(element.name)} ({territoryTitle})
                </Text>
                {metric.description && (
                    <Text style={{ fontSize: 6, color: "#64748b", marginTop: 1, lineHeight: 1.15 }}>
                        {l(metric.description)}
                    </Text>
                )}
            </View>

            {isAllHorizonsZero ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 4, borderWidth: 0.5, borderColor: "#cbd5e1", marginVertical: 20, padding: 20 }}>
                    <Text style={{ fontSize: 10, fontWeight: "bold", color: "#475569", marginBottom: 6 }}>
                        {territorySubject} non concerné(e) par ce risque
                    </Text>
                    <Text style={{ fontSize: 7.5, color: "#94a3b8", textAlign: "center" }}>
                        Toutes les communes présentent un niveau de risque nul sur l'ensemble des horizons temporels étudiés.
                    </Text>
                </View>
            ) : (
                <View style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                    {horizonList.map((yrRep) => {
                        const yrKey = yrRep.year?.key || yrRep.year;
                        const yrMaps = yrRep.indicatorMaps || (yrRep as any).metricMaps || resolvedMaps;
                        const subMap = yrMaps?.[`${yrKey}_${metric.key}`] || yrMaps?.[metric.key];
                        const rk = yrRep.topFlopData?.[metric.key] || topFlopData?.[metric.key];

                        return (
                            <View
                                key={`hz-sub-${metric.key}-${yrKey}`}
                                wrap={false}
                                style={{
                                    flex: 1,
                                    padding: 2.5,
                                    backgroundColor: "#f8fafc",
                                    borderRadius: 3,
                                    borderWidth: 0.5,
                                    borderColor: "#cbd5e1",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <View style={{ width: "60%", height: "100%", alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontSize: 6.5, fontWeight: "bold", color: "#ea580c", marginBottom: 1 }}>
                                        {l(yrRep.year?.name || yrRep.year)}
                                    </Text>
                                    <View style={{ width: "100%", height: 165, backgroundColor: "#ffffff", borderRadius: 2, borderWidth: 0.5, borderColor: "#cbd5e1", overflow: "hidden", justifyContent: "center", alignItems: "center" }}>
                                        {subMap ? (
                                            <Image src={subMap} cache={false} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                        ) : (
                                            <Text style={{ fontSize: 5, color: "#94a3b8" }}>Carte indisponible</Text>
                                        )}
                                    </View>
                                </View>

                                <View style={{ width: "38%", flexDirection: "row", justifyContent: "space-between" }}>
                                    <View style={{ width: "48.5%" }}>
                                        <Text style={{ fontSize: 4.8, fontWeight: "bold", color: "#b91c1c", marginBottom: 0.8 }}>20 communes au risque le plus élevé</Text>
                                        {rk?.top20?.slice(0, 20).map((item: any, idx: number, arr: any[]) => (
                                            <View key={`m-top-${item.code}-${idx}`} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 0.05, borderBottomWidth: 0.3, borderBottomColor: "#e2e8f0" }}>
                                                <Text style={{ fontSize: 4, color: "#334155" }}>{getRankDisplay(arr, idx)}. {truncateName(item.name, 30)}</Text>
                                                <Text style={{ fontSize: 4, fontWeight: "bold", color: "#0f172a" }}>{item.value.toFixed(1)}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <View style={{ width: "48.5%" }}>
                                        <Text style={{ fontSize: 4.8, fontWeight: "bold", color: "#15803d", marginBottom: 0.8 }}>20 communes au risque le plus faible</Text>
                                        {rk?.flop20?.slice(0, 20).map((item: any, idx: number, arr: any[]) => (
                                            <View key={`m-flop-${item.code}-${idx}`} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 0.05, borderBottomWidth: 0.3, borderBottomColor: "#e2e8f0" }}>
                                                <Text style={{ fontSize: 4, color: "#334155" }}>{getRankDisplay(arr, idx)}. {truncateName(item.name, 30)}</Text>
                                                <Text style={{ fontSize: 4, fontWeight: "bold", color: "#0f172a" }}>{item.value.toFixed(1)}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}
        </Page>
    );
}

export function ReportDocument({ report, allReports }: Props) {
    const reportsList = allReports && allReports.length > 0 ? allReports : (report ? [report] : []);
    const baseReport = reportsList[0];

    if (!baseReport) return null;

    const { l, t, language } = baseReport;
    const rawKommune = baseReport.kommune as any;

    const isTerritory =
        rawKommune.aggregationLevel === "departement" ||
        rawKommune.aggregationLevel === "region" ||
        rawKommune.aggregationLevel === "epci";

    const territoryMaps = baseReport.indicatorMaps || (baseReport as any).metricMaps;
    const coverMapImage =
        baseReport.mapImageDataUrl ||
        (territoryMaps ? territoryMaps[baseReport.elements[0]?.key] : undefined);

    return (
        <Document
            title={l(t.report.title)}
            author="Arthur Lucas / Vestlandforsking"
            subject={`${baseReport.kommune.key} ${baseReport.kommune.name} | Multi-horizon Report`}
            keywords="climate risk, Noradapt, Klimamonitor, municipality, kommune, Klimarisk"
            creator="Klimarisk France"
            language={language}
        >
            {/* 1. Page de garde */}
            {isTerritory ? (
                <TerritoryCoverPage report={baseReport} allReports={reportsList} mapImageDataUrl={coverMapImage} />
            ) : (
                <TitlePage report={baseReport} />
            )}

            {/* 2. Page Risque Global en mode territorial */}
            {isTerritory && (
                <TerritoryRiskGlobalPage
                    report={baseReport}
                    allReports={reportsList}
                    topFlopData={baseReport.topFlopData}
                    metricMaps={territoryMaps}
                />
            )}

            {/* 3. Pages des éléments et métriques */}
            {baseReport.elements.map((element) => {
                if (isTerritory) {
                    return (
                        <React.Fragment key={element.key}>
                            <TerritoryElementPage
                                report={baseReport}
                                element={element}
                                allReports={reportsList}
                                topFlopData={baseReport.topFlopData}
                                metricMaps={territoryMaps}
                            />
                            {element.key === "h" && (element.metrics || []).filter((m: any) => !m.disabled).map((metric: any) => (
                                <TerritoryMetricPage
                                    key={metric.key}
                                    report={baseReport}
                                    element={element}
                                    metric={metric}
                                    allReports={reportsList}
                                    topFlopData={baseReport.topFlopData}
                                    metricMaps={territoryMaps}
                                />
                            ))}
                        </React.Fragment>
                    );
                }

                return (
                    <ElementPage
                        key={element.key}
                        report={baseReport}
                        element={element}
                    />
                );
            })}

            {/* 4. Documentation */}
            {baseReport.documentation && baseReport.documentation.length > 0 && (
                <DocumentationPage report={baseReport} />
            )}
        </Document>
    );
}

export default ReportDocument;