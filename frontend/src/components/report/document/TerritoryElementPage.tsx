// src/components/report/document/TerritoryElementPage.tsx

import type { ReportSnapshot } from "./reportSnapshot";
import { Page, View, Text, Image } from "@react-pdf/renderer";
import { reportStyles as s } from "./reportStyles";

interface MetricRanking {
    top20: { code: string; name: string; value: number }[];
    flop20: { code: string; name: string; value: number }[];
}

interface Props {
    report: ReportSnapshot;
    element: ReportSnapshot["elements"][number];
    allReports?: ReportSnapshot[];
    topFlopData?: Record<string, MetricRanking>;
    metricMaps?: Record<string, string>;
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

export function TerritoryElementPage({ report, element, allReports, topFlopData, metricMaps }: Props): any {
    const { l, kommune, language } = report;
    const isHazard = element.key === "h";
    const territoryTitle = kommune.aggregationLevel === "region" ? "Régionale" : "Départementale";
    const territorySubject = kommune.aggregationLevel === "region" ? "Région" : "Département";

    const horizonList = isHazard && allReports && allReports.length > 0 ? allReports : [report];
    const resolvedTopFlop = topFlopData || report.topFlopData;
    const resolvedMaps = metricMaps || (report as any).metricMaps || report.indicatorMaps;

    const isRiskZero = (rk?: MetricRanking) => {
        if (!rk) return true;
        const maxTop = rk.top20?.reduce((max, item) => Math.max(max, item.value || 0), 0) ?? 0;
        return (rk as any).allZero || !rk.top20 || rk.top20.length === 0 || maxTop === 0;
    };

    // =========================================================================
    // CAS 1 : COMPOSANTE ALÉA (SYNTHÈSE MULTI-HORIZONS GLOBALE)
    // =========================================================================
    if (isHazard) {
        // Message uniquement si TOUS les horizons temporels sont à zéro
        const isAllHorizonsZero = horizonList.every((yrRep) => {
            const rk = yrRep.topFlopData?.[element.key] || topFlopData?.[element.key];
            return isRiskZero(rk);
        });

        return (
            <Page size="A4" style={[s.page, { padding: 12 }]} bookmark={`${l(element.name)} (Global)`} id={`page-${element.key}-global`}>
                <Text fixed style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />

                <View wrap={false} style={{ marginBottom: 4, borderBottomWidth: 1, borderBottomColor: "#cbd5e1", paddingBottom: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: "bold", color: "#1e293b" }}>
                        {l(element.name)} — Analyse {territoryTitle}
                    </Text>
                    {element.description && (
                        <Text style={{ fontSize: 6, color: "#64748b", marginTop: 1, lineHeight: 1.15 }}>
                            {l(element.description)}
                        </Text>
                    )}
                </View>

                {isAllHorizonsZero ? (
                    // 🎯 Message unique affiché SEULEMENT si TOUS les horizons sont nuls
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 4, borderWidth: 0.5, borderColor: "#cbd5e1", marginVertical: 20, padding: 20 }}>
                        <Text style={{ fontSize: 10, fontWeight: "bold", color: "#475569", marginBottom: 6 }}>
                            {territorySubject} non concerné(e) par ce risque
                        </Text>
                        <Text style={{ fontSize: 7.5, color: "#94a3b8", textAlign: "center" }}>
                            Toutes les communes présentent un niveau d'aléa nul sur l'ensemble des horizons temporels étudiés.
                        </Text>
                    </View>
                ) : (
                    // 🎯 Dès qu'au moins un horizon a des données, on affiche systématiquement la carte pour chaque horizon
                    <View style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                        {horizonList.map((yrRep) => {
                            const yrKey = yrRep.year?.key || yrRep.year;
                            const yrMaps = yrRep.indicatorMaps || resolvedMaps;
                            const compMap = yrMaps?.[`${yrKey}_${element.key}`] || yrMaps?.[element.key];
                            const rk = yrRep.topFlopData?.[element.key] || topFlopData?.[element.key];

                            return (
                                <View
                                    key={`hz-global-${yrKey}`}
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
                                            {compMap ? (
                                                <Image src={compMap} cache={false} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                            ) : (
                                                <Text style={{ fontSize: 5, color: "#94a3b8" }}>Carte indisponible</Text>
                                            )}
                                        </View>
                                    </View>

                                    <View style={{ width: "38%", flexDirection: "row", justifyContent: "space-between" }}>
                                        <View style={{ width: "48.5%" }}>
                                            <Text style={{ fontSize: 4.8, fontWeight: "bold", color: "#b91c1c", marginBottom: 0.8 }}>20 communes au risque le plus élevé</Text>
                                            {rk?.top20?.slice(0, 20).map((item, idx, arr) => (
                                                <View key={`g-top-${item.code}-${idx}`} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 0.05, borderBottomWidth: 0.3, borderBottomColor: "#e2e8f0" }}>
                                                    <Text style={{ fontSize: 4, color: "#334155" }}>{getRankDisplay(arr, idx)}. {truncateName(item.name, 30)}</Text>
                                                    <Text style={{ fontSize: 4, fontWeight: "bold", color: "#0f172a" }}>{item.value.toFixed(1)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                        <View style={{ width: "48.5%" }}>
                                            <Text style={{ fontSize: 4.8, fontWeight: "bold", color: "#15803d", marginBottom: 0.8 }}>20 communes au risque le plus faible</Text>
                                            {rk?.flop20?.slice(0, 20).map((item, idx, arr) => (
                                                <View key={`g-flop-${item.code}-${idx}`} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 0.05, borderBottomWidth: 0.3, borderBottomColor: "#e2e8f0" }}>
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

    // =========================================================================
    // CAS 2 : AUTRES COMPOSANTES (PÉRIODE DE RÉFÉRENCE UNIQUE)
    // =========================================================================
    const globalRk = resolvedTopFlop?.[element.key];
    const isGlobalNotConcerned = isRiskZero(globalRk);

    return (
        <Page size="A4" style={[s.page, { padding: 14 }]} bookmark={l(element.name)} id={element.key}>
            <Text fixed style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />

            <View wrap={false} style={{ marginBottom: 5, borderBottomWidth: 1, borderBottomColor: "#cbd5e1", paddingBottom: 2.5 }}>
                <Text style={{ fontSize: 11, fontWeight: "bold", color: "#1e293b" }}>
                    {l(element.name)} — Analyse {territoryTitle}
                </Text>
                {element.description && (
                    <Text style={{ fontSize: 6, color: "#64748b", marginTop: 1, lineHeight: 1.15 }}>
                        {l(element.description)}
                    </Text>
                )}
            </View>

            {/* Synthèse globale */}
            <View wrap={false} style={{ marginBottom: 5, padding: 4, backgroundColor: "#f1f5f9", borderRadius: 3, borderWidth: 0.5, borderColor: "#cbd5e1" }}>
                <Text style={{ fontSize: 7, fontWeight: "bold", color: "#0f172a", marginBottom: 2 }}>
                    {language === "en" ? "Global Overview: " : "Synthèse globale : "} {l(element.name)}
                </Text>

                {isGlobalNotConcerned ? (
                    <View style={{ padding: 10, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 6.8, fontWeight: "bold", color: "#64748b", marginBottom: 1 }}>
                            {territorySubject} non concerné(e) par cette composante
                        </Text>
                        <Text style={{ fontSize: 5.5, color: "#94a3b8" }}>
                            Toutes les communes présentent une valeur nulle.
                        </Text>
                    </View>
                ) : (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ width: "60%", height: 205, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", borderRadius: 2, borderWidth: 0.5, borderColor: "#cbd5e1", overflow: "hidden" }}>
                            {resolvedMaps?.[element.key] ? (
                                <Image src={resolvedMaps[element.key]} cache={false} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            ) : (
                                <Text style={{ fontSize: 5.5, color: "#94a3b8" }}>Carte indisponible</Text>
                            )}
                        </View>

                        <View style={{ width: "38%", flexDirection: "row", justifyContent: "space-between" }}>
                            <View style={{ width: "48.5%" }}>
                                <Text style={{ fontSize: 5.2, fontWeight: "bold", color: "#b91c1c", marginBottom: 1 }}>20 communes au risque le plus élevé</Text>
                                {globalRk?.top20?.slice(0, 20).map((item, idx, arr) => (
                                    <View key={`other-top-${item.code}-${idx}`} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 0.1, borderBottomWidth: 0.3, borderBottomColor: "#cbd5e1" }}>
                                        <Text style={{ fontSize: 4.2, flex: 1, color: "#334155" }}>{getRankDisplay(arr, idx)}. {truncateName(item.name, 30)}</Text>
                                        <Text style={{ fontSize: 4.2, fontWeight: "bold", width: 12, textAlign: "right", color: "#0f172a" }}>{item.value.toFixed(1)}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={{ width: "48.5%" }}>
                                <Text style={{ fontSize: 5.2, fontWeight: "bold", color: "#15803d", marginBottom: 1 }}>20 communes au risque le plus faible</Text>
                                {globalRk?.flop20?.slice(0, 20).map((item, idx, arr) => (
                                    <View key={`other-flop-${item.code}-${idx}`} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 0.1, borderBottomWidth: 0.3, borderBottomColor: "#cbd5e1" }}>
                                        <Text style={{ fontSize: 4.2, flex: 1, color: "#334155" }}>{getRankDisplay(arr, idx)}. {truncateName(item.name, 30)}</Text>
                                        <Text style={{ fontSize: 4.2, fontWeight: "bold", width: 12, textAlign: "right", color: "#0f172a" }}>{item.value.toFixed(1)}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )}
            </View>

            {/* Sous-indicateurs standards */}
            {element.metrics.map((metric) => {
                const metricRk = resolvedTopFlop?.[metric.key];
                const isMetricNotConcerned = isRiskZero(metricRk);

                return (
                    <View key={`${element.key}-${metric.key}`} wrap={false} style={{ marginBottom: 3.5, padding: 3.5, backgroundColor: "#f8fafc", borderRadius: 3, borderWidth: 0.5, borderColor: "#e2e8f0" }}>
                        <Text style={{ fontSize: 6.8, fontWeight: "bold", color: "#1e293b", marginBottom: 0.5 }}>{l(metric.name)}</Text>
                        {metric.description && <Text style={{ fontSize: 5.2, color: "#64748b", marginBottom: 1.5, lineHeight: 1.15 }}>{l(metric.description)}</Text>}

                        {isMetricNotConcerned ? (
                            <View style={{ padding: 6, alignItems: "center", justifyContent: "center" }}>
                                <Text style={{ fontSize: 6.2, fontWeight: "bold", color: "#64748b" }}>
                                    {territorySubject} non concerné(e) par cet indicateur
                                </Text>
                            </View>
                        ) : (
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <View style={{ width: "60%", height: 225, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", borderRadius: 2, borderWidth: 0.5, borderColor: "#e2e8f0", overflow: "hidden" }}>
                                    {resolvedMaps?.[metric.key] ? (
                                        <Image src={resolvedMaps[metric.key]} cache={false} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                    ) : (
                                        <Text style={{ fontSize: 5.2, color: "#94a3b8" }}>Carte indisponible</Text>
                                    )}
                                </View>

                                <View style={{ width: "38%", flexDirection: "row", justifyContent: "space-between" }}>
                                    <View style={{ width: "48.5%" }}>
                                        <Text style={{ fontSize: 5, fontWeight: "bold", color: "#b91c1c", marginBottom: 0.8 }}>20 communes au risque le plus élevé</Text>
                                        {metricRk?.top20?.slice(0, 20).map((item, idx, arr) => (
                                            <View key={`sub-top-${item.code}-${idx}`} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 0.1, borderBottomWidth: 0.3, borderBottomColor: "#e2e8f0" }}>
                                                <Text style={{ fontSize: 4.2, flex: 1, color: "#334155" }}>{getRankDisplay(arr, idx)}. {truncateName(item.name, 30)}</Text>
                                                <Text style={{ fontSize: 4.2, fontWeight: "bold", width: 12, textAlign: "right", color: "#0f172a" }}>{item.value.toFixed(1)}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={{ width: "48.5%" }}>
                                        <Text style={{ fontSize: 5, fontWeight: "bold", color: "#15803d", marginBottom: 0.8 }}>20 communes au risque le plus faible</Text>
                                        {metricRk?.flop20?.slice(0, 20).map((item, idx, arr) => (
                                            <View key={`sub-flop-${item.code}-${idx}`} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 0.1, borderBottomWidth: 0.3, borderBottomColor: "#e2e8f0" }}>
                                                <Text style={{ fontSize: 4.2, flex: 1, color: "#334155" }}>{getRankDisplay(arr, idx)}. {truncateName(item.name, 30)}</Text>
                                                <Text style={{ fontSize: 4.2, fontWeight: "bold", width: 12, textAlign: "right", color: "#0f172a" }}>{item.value.toFixed(1)}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                );
            })}
        </Page>
    );
}

export default TerritoryElementPage;