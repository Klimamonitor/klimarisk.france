import type { KommuneNr, Year, ElementKey, MetricKey } from "../../../hooks/useDataStore";
import { type Language, t } from "../../../hooks/useLanguageStore";

type StatValues = {
    color: string;
    value?: number;
    rank?: number;
    rankFylke?: number;
};

type Metric = {
    key: MetricKey;
    name: Record<Language, string>;
    description?: Record<Language, string>;
    url?: string;
    invert?: boolean;
} & StatValues;

type Element = {
    key: ElementKey;
    name: Record<Language, string>;
    description?: Record<Language, string>;
    invert?: boolean;
    metrics: Metric[];
} & StatValues;

type YearInfo = {
    key: Year;
    name: Record<Language, string>;
    description?: Record<Language, string>;
};

type RiskInfo = {
    name: Record<Language, string>;
    description?: Record<Language, string>;
} & StatValues;

export type MetricTopFlop = {
    top20: { code: string; name: string; value: number }[];
    flop20: { code: string; name: string; value: number }[];
};

type ReportDataModel = {
    elements: Element[];
    risk: RiskInfo;
    kommune: {
        key: KommuneNr;
        name: string;
        numKommuneNorge: number;
        numKommuneFylke: number;
        aggregationLevel?: "commune" | "epci" | "departement" | "region";
    };
    year: YearInfo;
    documentation?: Record<Language, string>[];

    // 🎯 Données des classements communaux pour départements et régions
    topFlopData?: Record<string, MetricTopFlop>;

    // 🎯 Image globale de la carte
    mapImageDataUrl?: string;

    // 🎯 Dictionnaire des captures de cartes par composante (h, e, s, r) et/ou sous-indicateurs
    indicatorMaps?: Record<string, string>;
};

export type ReportSnapshot =
    ReportDataModel
    & {
        language: Language,
        l: (entry: Record<Language, string> | undefined) => string | undefined,
        t: typeof t,
    };