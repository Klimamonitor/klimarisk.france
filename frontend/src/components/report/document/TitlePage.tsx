// src/components/report/document/TitlePage.tsx

import { Page, Text, View, Link } from "@react-pdf/renderer";
import { reportStyles as s } from "./reportStyles";
import type { ReportSnapshot } from "./reportSnapshot";
import { ordinal } from "../../../hooks/useLanguageStore";

interface Props {
    report: ReportSnapshot;
}

function TitlePage({ report }: Props) {
    const {
        l,
        t,
        language
    } = report;

    const titlePageTranslations = (t?.report?.document as any)?.titlePage || {};
    const interpTitle = titlePageTranslations.interpretationTitle
        ? l(titlePageTranslations.interpretationTitle)
        : (language === "en" ? "Interpretation of indicators" : "Interprétation des indicateurs");

    const interpText = titlePageTranslations.interpretationText
        ? l(titlePageTranslations.interpretationText)
        : (language === "en"
            ? "The risk indicators presented in this document are evaluated relative to the scale of all municipalities in France. They allow you to situate this territory at the national level and do not constitute an absolute measure of local impacts. You can find the detailed methodology behind the development of the indicators at this address: https://www.vestforsk.no/nn/publication/development-comprehensive-climate-risk-ranking-french-municipalities."
            : "Les indicateurs de risque présentés dans ce document sont évalués de manière relative à l'échelle de l'ensemble des communes de France. Ils permettent de situer ce territoire au niveau national et ne constituent pas une mesure absolue des impacts locaux. Vous pouvez trouver la méthodologie détaillée derrière l'élaboration des indicateurs à cette adresse : https://www.vestforsk.no/nn/publication/development-comprehensive-climate-risk-ranking-french-municipalities.");

    const globalRiskTitle = language === "en" ? "Overall Climate Risk" : "Risque global";

    return (
        <Page size="A4" style={[s.page, { paddingBottom: 65 }]}>
            {/* Numéro de page (conservé et visible) */}
            <Text
                fixed
                style={s.pageNumber}
                render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            />

            {/* Marge grisée latérale */}
            <View style={s.sidebanner} fixed />

            <View style={s.heading} bookmark={l(t.report.title)}>
                <Text style={s.title}>
                    {l(t.report.title)}
                </Text>

                <View style={s.titlePage.chosen}>
                    <Text>
                        {l(t.report.document.titlePage.chosenKommune)} <Text style={s.titlePage.chosenVal}>{report.kommune.key} | {report.kommune.name}</Text>
                    </Text>
                    <Text>
                        {l(t.report.document.titlePage.chosenYear)} <Text style={s.titlePage.chosenVal}>{l(report.year.name)} | {l(report.year.description)}</Text>
                    </Text>
                </View>
            </View>

            <View bookmark={globalRiskTitle} style={s.titlePage.headingMargin} />

            {/* En-tête du Risque Global */}
            <View style={[s.elementPage.heading, s.titlePage.heading]}>
                <View style={[s.elementPage.headingColorBox, {
                    backgroundColor: report.risk.color,
                }]} />

                <View style={s.elementPage.headingContent}>
                    <View style={[s.elementPage.titleBox, s.title]}>
                        <Text>
                            {globalRiskTitle}
                        </Text>

                        <View style={s.score}>
                            <Text style={s.titleLabel}>{l(t.report.document.score)}</Text>
                            <View style={s.titlePage.titleScoreVal}>
                                <Text style={s.emph}>{report.risk.value?.toFixed()}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={s.description}>
                        <Text>{l(report.risk.description)}</Text>
                    </View>

                    <Text style={s.ranking}>
                        {l(t.report.document.ranked.p1)} <Text style={s.emph}>{ordinal(report.risk.rank ?? 0, report.language)}</Text> {l(t.report.document.ranked.p2)} <Text style={s.emph}>{report.kommune.numKommuneNorge}</Text> {l(t.report.document.ranked.p3)} {l(t.report.document.ranked.norge)} {l(t.report.document.ranked.p4)}.
                    </Text>
                    <Text>
                        {l(t.report.document.ranked.p1)} <Text style={s.emph}>{ordinal(report.kommune.numKommuneFylke ?? 0, report.language)}</Text> {l(t.report.document.ranked.p2)} <Text style={s.emph}>{report.kommune.numKommuneNorge}</Text> {l(t.report.document.ranked.p3)} {l(t.report.document.ranked.norge)} {l(t.report.document.ranked.p4)}.
                    </Text>
                </View>
            </View>

            {/* Composantes */}
            {report.elements.map(element => (
                <View key={element.key} style={s.elementPage.section} wrap={false}>
                    <View style={[s.elementPage.colorBox, {
                        backgroundColor: element.color,
                    }]} />

                    <View style={[s.elementPage.titleBox, s.smallTitle]}>
                        <Text>
                            <Link src={`#${element.key}`} style={s.titlePage.navLink}>{l(element.name)}</Link>
                        </Text>

                        <View style={s.score}>
                            <Text style={s.smallTitleLabel}>{l(t.report.document.score)}</Text>
                            <View style={s.scoreVal}>
                                <Text style={s.emph}>{element.value?.toFixed()}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={s.description}>
                        <Text>{l(element.description)}</Text>
                    </View>

                    {element.metrics.map(metric => (
                        <View key={`${element.key}-${metric.key}`} style={s.titlePage.metric}>
                            <View style={[s.titlePage.metric.colorBox, {
                                backgroundColor: metric.color,
                            }]} />

                            <View style={s.titlePage.metric.name}>
                                <Text>
                                    <Link src={`#${metric.key}`} style={s.titlePage.navLink}>{l(metric.name)}</Link>
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            ))}

            
            <View fixed style={{
                position: "absolute",
                bottom: 50,
                left: 62,
                right: 30,
                borderTopWidth: 0.5,
                borderTopColor: "#cbd5e1",
                paddingTop: 4,
            }}>
                <Text style={{ fontSize: 6.8, fontWeight: "bold", color: "#334155", marginBottom: 1.5 }}>
                    {interpTitle}
                </Text>
                <Text style={{ fontSize: 5.8, color: "#64748b", lineHeight: 1.3 }}>
                    {interpText}
                </Text>
            </View>
        </Page>
    );
}

export default TitlePage;