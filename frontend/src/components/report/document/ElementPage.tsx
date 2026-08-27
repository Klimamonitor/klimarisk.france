import type { ReportSnapshot } from "./reportSnapshot";
import { Page, View, Text, Link } from "@react-pdf/renderer";
import { reportStyles as s } from "./reportStyles";
import { ordinal } from "../../../hooks/useLanguageStore";

interface Props {
    report: ReportSnapshot;
    element: ReportSnapshot["elements"][number];
}

function ElementPage({ report, element }: Props) {
    const {
        l,
        t,
        kommune,
        language
    } = report;

    const rawLevel = (kommune as any)?.aggregationLevel;
    const keyStr = String(kommune?.key || "").trim();

    const aggLevel: "commune" | "epci" | "departement" = rawLevel || (() => {
        if (keyStr.length <= 3 || keyStr.startsWith("DEP_")) return "departement";
        if (keyStr.length === 9 || keyStr.length === 14 || keyStr.startsWith("EPCI_") || keyStr.startsWith("2000") || keyStr.startsWith("24")) {
            return "epci";
        }
        return "commune";
    })();

    const getEntityLabelPlural = () => {
        if (language === "en") {
            if (aggLevel === "epci") return "inter-municipalities";
            if (aggLevel === "departement") return "departments";
            return "municipalities";
        }
        if (aggLevel === "epci") return "intercommunalités";
        if (aggLevel === "departement") return "départements";
        return "communes";
    };

    const getNotConcernedText = () => {
        if (language === "en") {
            if (aggLevel === "epci") return "Inter-municipality not concerned.";
            if (aggLevel === "departement") return "Department not concerned.";
            return "Municipality not concerned.";
        }
        if (aggLevel === "epci") return "Intercommunalité non concernée.";
        if (aggLevel === "departement") return "Département non concerné.";
        return "Commune non concernée.";
    };

    const entityPlural = getEntityLabelPlural();
    const notConcernedText = getNotConcernedText();

    const renderRankings = (rank?: number, rankFylke?: number) => {
        if (
            rank === undefined ||
            rank === null ||
            rankFylke === undefined ||
            rankFylke === null
        ) {
            return <Text style={s.ranking}>{notConcernedText}</Text>;
        }

        if (language === "en") {
            return (
                <>
                    <Text style={s.ranking}>
                        Ranked <Text style={s.emph}>{ordinal(rank, "en")}</Text> out of{" "}
                        <Text style={s.emph}>{kommune.numKommuneNorge}</Text> {entityPlural} in France (1 = highest climate risk).
                    </Text>
                    {aggLevel !== "departement" && (
                        <Text>
                            Ranked <Text style={s.emph}>{ordinal(rankFylke, "en")}</Text> out of{" "}
                            <Text style={s.emph}>{kommune.numKommuneFylke}</Text> {entityPlural} in its department (1 = highest climate risk).
                        </Text>
                    )}
                </>
            );
        }

        return (
            <>
                <Text style={s.ranking}>
                    Classé <Text style={s.emph}>{ordinal(rank, "fr")}</Text> sur{" "}
                    <Text style={s.emph}>{kommune.numKommuneNorge}</Text> {entityPlural} en France (1 = risque climatique le plus élevé).
                </Text>
                {aggLevel !== "departement" && (
                    <Text>
                        Classé <Text style={s.emph}>{ordinal(rankFylke, "fr")}</Text> sur{" "}
                        <Text style={s.emph}>{kommune.numKommuneFylke}</Text> {entityPlural} dans son département (1 = risque climatique le plus élevé).
                    </Text>
                )}
            </>
        );
    };

    return (
        <Page size="A4" style={[s.page, s.elementPage]} bookmark={l(element.name)} id={element.key}>
            <Text
                fixed
                style={s.pageNumber}
                render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            />

            <View style={s.sidebanner} fixed />

            <View style={s.elementPage.heading}>
                <View
                    style={[
                        s.elementPage.headingColorBox,
                        { backgroundColor: element.color },
                    ]}
                />

                <View style={s.elementPage.headingContent}>
                    <View style={[s.elementPage.titleBox, s.title]}>
                        <Text>{l(element.name)}</Text>

                        <View style={s.score}>
                            <Text style={s.titleLabel}>{l(t.report.document.score)}</Text>
                            <View style={s.titleScoreVal}>
                                <Text style={s.emph}>{element.value?.toFixed()}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={s.description}>
                        <Text>{l(element.description)}</Text>
                    </View>

                    {renderRankings(element.rank, element.rankFylke)}
                </View>
            </View>

            {element.metrics.map((metric) => (
                <View
                    key={`${element.key}-${metric.key}`}
                    style={s.elementPage.section}
                    wrap={false}
                    bookmark={l(metric.name)}
                    id={metric.key}
                >
                    <View
                        style={[
                            s.elementPage.colorBox,
                            { backgroundColor: metric.color },
                        ]}
                    />

                    <View style={[s.elementPage.titleBox, s.smallTitle]}>
                        <Text>{l(metric.name)}</Text>

                        {metric.value !== undefined && (
                            <View style={s.score}>
                                <Text style={s.smallTitleLabel}>{l(t.report.document.score)}</Text>
                                <View style={s.scoreVal}>
                                    <Text style={s.emph}>{metric.value.toFixed()}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={s.description}>
                        <Text>{l(metric.description)}</Text>
                    </View>

                    {metric.url && (
                        <Text style={s.url}>
                            <Text style={s.description}>{l(t.report.document.urlLabel)}</Text>{" "}
                            <Link src={metric.url}>{metric.url}</Link>
                        </Text>
                    )}

                    {renderRankings(metric.rank, metric.rankFylke)}
                </View>
            ))}
        </Page>
    );
}

export default ElementPage;