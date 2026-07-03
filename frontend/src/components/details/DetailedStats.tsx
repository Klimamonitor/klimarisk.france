import useDataStore, { type ElementKey, type MetricKey } from "../../hooks/useDataStore";
import { getDescendingRank } from "../../hooks/statistics";
import { useMemo } from "react";
import "./DetailedStats.css";
import DetailsRisk from "./DetailsRisk";
import useLanguageStore, { t, type Language } from "../../hooks/useLanguageStore";

const DEPARTEMENTS_MAP: Record<string, string> = {
  "01": "Ain", "02": "Aisne", "03": "Allier", "04": "Alpes-de-Haute-Provence", "05": "Hautes-Alpes",
  "06": "Alpes-Maritimes", "07": "Ardèche", "08": "Ardennes", "09": "Ariège", "10": "Aube",
  "11": "Aude", "12": "Aveyron", "13": "Bouches-du-Rhône", "14": "Calvados", "15": "Cantal",
  "16": "Charente", "17": "Charente-Maritime", "18": "Cher", "19": "Corrèze", "2A": "Corse-du-Sud",
  "2B": "Haute-Corse", "21": "Côte-d'Or", "22": "Côtes-d'Armor", "23": "Creuse", "24": "Dordogne",
  "25": "Doubs", "26": "Drôme", "27": "Eure", "28": "Eure-et-Loir", "29": "Finistère",
  "30": "Gard", "31": "Haute-Garonne", "32": "Gers", "33": "Gironde", "34": "Hérault",
  "35": "Ille-et-Vilaine", "36": "Indre", "37": "Indre-et-Loire", "38": "Isère", "39": "Jura",
  "40": "Landes", "41": "Loir-et-Cher", "42": "Loire", "43": "Haute-Loire", "44": "Loire-Atlantique",
  "45": "Loiret", "46": "Lot", "47": "Lot-et-Garonne", "48": "Lozère", "49": "Maine-et-Loire",
  "50": "Manche", "51": "Marne", "52": "Haute-Marne", "53": "Mayenne", "54": "Meurthe-et-Moselle",
  "55": "Meuse", "56": "Morbihan", "57": "Moselle", "58": "Nièvre", "59": "Nord",
  "60": "Oise", "61": "Orne", "62": "Pas-de-Calais", "63": "Puy-de-Dôme", "64": "Pyrénées-Atlantiques",
  "65": "Hautes-Pyrénées", "66": "Pyrénées-Orientales", "67": "Bas-Rhin", "68": "Haut-Rhin",
  "69": "Rhône", "70": "Haute-Saône", "71": "Saône-et-Loire", "72": "Sarthe", "73": "Savoie",
  "74": "Haute-Savoie", "75": "Paris", "76": "Seine-Maritime", "77": "Seine-et-Marne", "78": "Yvelines",
  "79": "Deux-Sèvres", "80": "Somme", "81": "Tarn", "82": "Tarn-et-Garonne", "83": "Var",
  "84": "Vaucluse", "85": "Vendée", "86": "Vienne", "87": "Haute-Vienne", "88": "Vosges",
  "89": "Yonne", "90": "Territoire de Belfort", "91": "Essonne", "92": "Hauts-de-Seine",
  "93": "Seine-Saint-Denis", "94": "Val-de-Marne", "95": "Val-d'Oise",
  "971": "Guadeloupe", "972": "Martinique", "973": "Guyane", "974": "La Réunion", "976": "Mayotte"
};

export type RankMetric = {
  name: Record<Language, string>;
  description?: Record<Language, string>;
  key: MetricKey;
  invert?: boolean;
  rank: number;
  rankFylke: number;
}
export type RankElement = {
  name: Record<Language, string>;
  description?: Record<Language, string>;
  key: ElementKey;
  invert?: boolean;
  rank: number;
  rankFylke: number;
  metrics: RankMetric[];
}
export type RankRisk = {
  name: Record<Language, string>;
  rank: number;
  rankFylke: number;
  totalCount: number;      // 🎯 AJOUTÉ : Nombre d'entités total (échelle nationale)
  totalCountFylke: number; // 🎯 AJOUTÉ : Nombre d'entités total (échelle départementale / locale)
  elements: RankElement[];
}

function DetailedStats() {
  const {
    dataModel,
    data,
    cache,
    selectedYear,
    selectedKommune,
    getFylkeDistribution,
    aggregationLevel,
    rawData
  } = useDataStore();
  const { l } = useLanguageStore();

  const yearData = data && selectedYear ? data.years[selectedYear] : null;
  const yearCache = cache && selectedYear ? cache.years[selectedYear] : null;

  const ranks = useMemo(() => {
    if (!yearData || !yearCache || !dataModel || !selectedKommune || !selectedYear) return null;

    const currentKommuneCache = yearCache.byKommune[selectedKommune];
    const currentKommuneData = yearData.byKommune[selectedKommune];

    if (!currentKommuneCache || !currentKommuneData) return null;

    const fylkeRiskDist = getFylkeDistribution(selectedKommune, { type: "risk" }, selectedYear);
    if (!fylkeRiskDist) return null;

    const tmp: RankRisk = {
      name: t.common.totalRisk,
      rank: getDescendingRank(yearCache.byTotalRisk, currentKommuneCache.totalRisk),
      rankFylke: getDescendingRank(fylkeRiskDist, currentKommuneCache.totalRisk),
      totalCount: yearCache.byTotalRisk.length, // 🎯 AJOUTÉ : Extrait la taille de la distribution nationale
      totalCountFylke: fylkeRiskDist.length,   // 🎯 AJOUTÉ : Extrait la taille de la distribution départementale
      elements: dataModel.elements.filter(e => !e.disabled).map(e => {
        const fylkeElementDist = getFylkeDistribution(selectedKommune, { type: "element", key: e.key }, selectedYear) || [];
        return {
          name: e.name,
          description: e.description,
          key: e.key,
          ...(e.invert ? { invert: true } : {}),
          rank: getDescendingRank(yearCache.byElement[e.key] || [], currentKommuneCache[e.key] ?? 0, e.invert),
          rankFylke: getDescendingRank(fylkeElementDist, currentKommuneCache[e.key] ?? 0, e.invert),
          metrics: e.metrics.filter(m => !m.disabled).map(m => {
            const fylkeMetricDist = getFylkeDistribution(selectedKommune, { type: "metric", key: m.key }, selectedYear) || [];
            const isInvertedMetric = !!m.invert !== !!e.invert;
            return {
              name: m.name,
              description: m.description,
              key: m.key,
              ...(isInvertedMetric ? { invert: true } : {}),
              rank: getDescendingRank(yearData.byMetric[m.key] || [], currentKommuneData[m.key] ?? 0, isInvertedMetric),
              rankFylke: getDescendingRank(fylkeMetricDist, currentKommuneData[m.key] ?? 0, isInvertedMetric)
            };
          }),
        };
      }),
    };
    return tmp;
  }, [yearData, yearCache, dataModel, selectedKommune, getFylkeDistribution, selectedYear]);

  const currentCountyLabel = useMemo(() => {
    if (!selectedKommune) return undefined;
    if (aggregationLevel === "departement") return undefined;

    if (aggregationLevel === "epci" && rawData && selectedYear) {
      const sampleCommune = Object.values(rawData.years[selectedYear].byKommune).find(
        c => c.codes_siren_des_epci === selectedKommune
      );
      if (sampleCommune?.departement) {
        return DEPARTEMENTS_MAP[sampleCommune.departement] || `Dép. ${sampleCommune.departement}`;
      }
    }

    const isDomTom = selectedKommune.startsWith("97");
    const deptCode = isDomTom ? selectedKommune.slice(0, 3) : selectedKommune.slice(0, 2);
    const deptName = DEPARTEMENTS_MAP[deptCode];
    return deptName ? deptName : `Dép. ${deptCode}`;
  }, [selectedKommune, aggregationLevel, rawData, selectedYear]);

  if (!yearData || !yearCache || !dataModel) {
    return (
      <div>{l(t.common.loading)}</div>
    );
  }

  return (
    <div className="detailsList">
      {!selectedKommune || !ranks ? (
        <div>
          {l(t.details.selectSomething)}
        </div>
      ) : (
        <DetailsRisk r={ranks} countyName={currentCountyLabel} />
      )}
    </div>
  );
}

export default DetailedStats;