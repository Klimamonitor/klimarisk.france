// src/components/report/document/TerritoryCoverPage.tsx

import { Page, View, Text, Image } from "@react-pdf/renderer";
import type { ReportSnapshot } from "./reportSnapshot";
import { reportStyles as s } from "./reportStyles";
import useDataStore from "../../../hooks/useDataStore";

interface Props {
    report: ReportSnapshot;
    allReports?: ReportSnapshot[];
    mapImageDataUrl?: string;
}

export default function TerritoryCoverPage({ report, allReports, mapImageDataUrl }: Props) {
    const { l, kommune } = report;

    // Déduction du type de territoire
    const rawAgg = (kommune as any).aggregationLevel;
    const territoryTitle = rawAgg === "region" ? "Rapport Régional" : "Rapport Départemental";

    // Récupération des années/horizons depuis le store global si allReports est incomplet
    const storeState = useDataStore.getState();
    const dataModelYears = (storeState.dataModel as any)?.years || [];

    // Construction de la liste complète des horizons à afficher
    let horizonList = allReports && allReports.length > 0 ? allReports : [];

    if (horizonList.length === 0 && dataModelYears.length > 0) {
        horizonList = dataModelYears.map((yr: any) => ({
            ...report,
            year: yr,
        }));
    }
    if (horizonList.length === 0) {
        horizonList = [report];
    }

    return (
        <Page size="A4" style={[s.page, { padding: 30, justifyContent: 'space-between' }]} bookmark="Page de garde">
            {/* 1. En-tête : Titres */}
            <View style={{ alignItems: 'center', marginBottom: 15 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 6 }}>
                    {territoryTitle}
                </Text>
                <Text style={{ fontSize: 18, color: '#3b82f6', textAlign: 'center' }}>
                    {kommune.name}
                </Text>
            </View>

            {/* 2. Section centrale : Les cartes d'horizons pour le Risque Global */}
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a', textAlign: 'center', marginBottom: 8 }}>
                    Évolution du Risque Climatique Global
                </Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
                    {horizonList.map((yrRep) => {
                        const yrKey = typeof yrRep.year === "object" ? yrRep.year?.key : yrRep.year;
                        const yearNameObj = typeof yrRep.year === "object" ? yrRep.year?.name : yrRep.year;

                        const yrMaps = yrRep.indicatorMaps || (yrRep as any).metricMaps || report.indicatorMaps;

                        // Ciblage strict de la carte du Risque Global (risk)
                        const riskMapUrl =
                            yrMaps?.[`${yrKey}_risk`] ||
                            yrMaps?.risk ||
                            mapImageDataUrl;

                        return (
                            <View
                                key={`cover-hz-${yrKey}`}
                                style={{
                                    width: '48%',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: 4,
                                    borderWidth: 0.5,
                                    borderColor: '#cbd5e1',
                                    padding: 4,
                                    marginBottom: 6,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ fontSize: 7.5, fontWeight: 'bold', color: '#ea580c', marginBottom: 3 }}>
                                    {l(yearNameObj)}
                                </Text>
                                <View style={{ width: '100%', height: 135, backgroundColor: '#ffffff', borderRadius: 3, borderWidth: 0.5, borderColor: '#e2e8f0', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                                    {riskMapUrl ? (
                                        <Image src={riskMapUrl} cache={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <Text style={{ fontSize: 5, color: "#94a3b8" }}>Carte non disponible</Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* 3. Texte d'avertissement méthodologique bas de page */}
            <View style={{ marginTop: 15, padding: 8, backgroundColor: '#f1f5f9', borderRadius: 4, borderWidth: 0.5, borderColor: '#cbd5e1' }}>
                <Text style={{ fontSize: 6.5, fontWeight: 'bold', color: '#334155', marginBottom: 2 }}>
                    Interprétation des indicateurs
                </Text>
                <Text style={{ fontSize: 6, color: '#64748b', lineHeight: 1.3 }}>
                    Les indicateurs de risque présentés dans ce document sont évalués de manière relative à l'échelle de l'ensemble des communes de France. Ils permettent de situer ce territoire au niveau national et ne constituent pas une mesure absolue des impacts locaux. Vous pouvez trouver la  métholodogie détaillée derrière l'élaboration des indicateurs à cette adresse : https://www.vestforsk.no/nn/publication/development-comprehensive-climate-risk-ranking-french-municipalities.
                </Text>
            </View>
        </Page>
    );
}