// src/hooks/statistics.ts

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

export function percentile(sorted: number[], value: number): number {
  const n = sorted.length;
  if (n === 0) return 0;

  let low = 0;
  let high = n;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (sorted[mid] < value) low = mid + 1;
    else high = mid;
  }
  const lower = low;

  high = n;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (sorted[mid] <= value) low = mid + 1;
    else high = mid;
  }
  const upper = low;

  const countLess = lower;
  const countEqual = upper - lower;

  return ((countLess + 0.5 * countEqual) / n) * 100;
}

export function getDescendingRank(arr: number[], value: number, invert?: boolean): number {
  let left = 0;
  let right = arr.length;

  if (invert) {
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (arr[mid] < value) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    return left + 1;
  }

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] <= value) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return arr.length - left + 1;
}

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-]/g, " ")
    .trim();
}

export interface RankedCommune {
  code: string;
  name: string;
  value: number;
  rank: number;
}

export interface MetricTopFlop {
  top20: RankedCommune[];
  flop20: RankedCommune[];
  allZero?: boolean;
}

// Calcule les rangs en gérant les ex æquo (même rang si même valeur)
function assignRanks(items: { code: string; name: string; value: number }[]): RankedCommune[] {
  let currentRank = 1;
  return items.map((item, index) => {
    if (index > 0 && Math.abs(item.value - items[index - 1].value) > 0.0001) {
      currentRank = index + 1;
    }
    return {
      ...item,
      rank: currentRank,
    };
  });
}

export function getTerritoryTopFlopCommunes(
  yearData: any,
  territoryCode: string,
  metricKey: string,
  invert: boolean = false,
  limit: number = 20
): MetricTopFlop {
  if (!yearData?.byKommune) return { top20: [], flop20: [], allZero: true };

  const cleanTerritory = String(territoryCode).trim().replace(/^DEP_|^REG_/, "");
  const isDept = cleanTerritory.length <= 3 && !REGION_DEPARTEMENTS_MAP[cleanTerritory];
  const regionDepts = REGION_DEPARTEMENTS_MAP[cleanTerritory] || [];

  const communes = Object.entries(yearData.byKommune)
    .filter(([code, item]: [string, any]) => {
      let insee = String(code).trim();
      if (/^\d{1,4}$/.test(insee)) insee = insee.padStart(5, "0");
      if (insee.length !== 5) return false;

      const deptCode = getDeptFromInsee(insee);
      if (isDept) {
        return deptCode === cleanTerritory.padStart(2, "0");
      } else {
        const regProp = String(item?.region || item?.regionCode || item?.code_region || "").trim();
        return regionDepts.includes(deptCode) || regProp === cleanTerritory;
      }
    })
    .map(([code, item]: [string, any]) => ({
      code,
      name: item.klimarisk_name || item.name || code,
      value: typeof item[metricKey] === "number" ? item[metricKey] : 0,
    }));

  // Vérification si toutes les communes ont un score nul
  const allZero = communes.length === 0 || communes.every((c) => c.value === 0);

  if (allZero) {
    return { top20: [], flop20: [], allZero: true };
  }

  // Tri pour le Top (les plus élevés selon le sens d'inversion)
  const sortedDesc = [...communes].sort((a, b) => (invert ? a.value - b.value : b.value - a.value));
  const sortedAsc = [...communes].sort((a, b) => (invert ? b.value - a.value : a.value - b.value));

  return {
    top20: assignRanks(sortedDesc.slice(0, limit)),
    flop20: assignRanks(sortedAsc.slice(0, limit)),
    allZero: false,
  };
}