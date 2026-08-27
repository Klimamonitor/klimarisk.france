import { create } from 'zustand';
import { type Language } from './useLanguageStore';

export type MetricKey = string & {
  readonly __brand: unique symbol;
};

export type ElementKey = string & {
  readonly __brand: unique symbol;
};

export type Year = string & {
  readonly __brand: unique symbol;
};

export type KommuneNr = string & {
  readonly __brand: unique symbol;
};

export type AggregationLevel =
  | 'commune'
  | 'departement'
  | 'epci';

type Metric = {
  key: MetricKey;
  name: Record<Language, string>;
  description?: Record<Language, string>;
  invert?: boolean;
  disabled: boolean;
};

type Element = {
  key: ElementKey;
  name: Record<Language, string>;
  description?: Record<Language, string>;
  invert?: boolean;
  disabled: boolean;
  metrics: Metric[];
};

type YearInfo = {
  key: Year;
  name: Record<Language, string>;
  description?: Record<Language, string>;
};

type DataModel = {
  elements: Element[];
  years: YearInfo[];
};

type KommuneData = {
  name: string;
  code_insee?: string;
  codes_siren_des_epci?: string;
  nom_epci?: string;
  departement?: string;
  [key: string]: any;
};

type Data = {
  years: {
    [year: string]: {
      byKommune: {
        [kommuneNr: string]: KommuneData;
      };
      byMetric: {
        [metricKey: string]: number[];
      };
    };
  };
};

type KommuneCache = {
  [elementKey: string]: number;
  totalRisk: number;
};

type Cache = {
  years: {
    [year: string]: {
      byKommune: {
        [kommuneNr: string]: KommuneCache;
      };
      byElement: {
        [elementKey: string]: number[];
      };
      byTotalRisk: number[];
    };
  };
};

type DistributionKeyType =
  | { type: 'risk' }
  | {
    type: 'element';
    key: ElementKey;
  }
  | {
    type: 'metric';
    key: MetricKey;
  };

export type DistributionKey = DistributionKeyType;

const distributionKeyToString = (
  key: DistributionKeyType
) => {
  if (key.type === 'risk') {
    return 'risk';
  }

  return `${key.type}:${String(key.key)}`;
};

const getDistributionDomainForKey = (
  distributionKey: DistributionKeyType,
  data: Data | null,
  cache: Cache | null
): [number, number] | undefined => {
  let min = Infinity;
  let max = -Infinity;

  if (distributionKey.type === 'metric') {
    if (!data) {
      return undefined;
    }

    for (const year of Object.values(data.years)) {
      const dist =
        year.byMetric[
        String(distributionKey.key)
        ];

      if (dist && dist.length > 0) {
        if (dist[0] < min) {
          min = dist[0];
        }

        if (
          dist[dist.length - 1] >
          max
        ) {
          max = dist[dist.length - 1];
        }
      }
    }
  } else {
    if (!cache) {
      return undefined;
    }

    for (const year of Object.values(cache.years)) {
      const dist =
        distributionKey.type === 'risk'
          ? year.byTotalRisk
          : year.byElement[
          String(distributionKey.key)
          ];

      if (dist && dist.length > 0) {
        if (dist[0] < min) {
          min = dist[0];
        }

        if (
          dist[dist.length - 1] >
          max
        ) {
          max = dist[dist.length - 1];
        }
      }
    }
  }

  if (
    min === Infinity ||
    max === -Infinity
  ) {
    return undefined;
  }

  return [min, max];
};

const buildRiskColorMapForKey = (
  distKey: DistributionKeyType,
  year: Year,
  data: Data | null,
  cache: Cache | null,
  colors: string[]
): Record<string, string> | null => {
  if (
    !data ||
    !cache ||
    !cache.years[String(year)]
  ) {
    return null;
  }

  const isGlobalRisk =
    distKey.type === 'risk';

  const domain =
    getDistributionDomainForKey(
      distKey,
      data,
      cache
    );

  if (!domain) {
    return null;
  }

  const [minRisk, maxRisk] =
    isGlobalRisk
      ? [0, 100]
      : domain;

  if (minRisk === maxRisk) {
    return null;
  }

  const yearData =
    data.years[String(year)];

  const yearCache =
    cache.years[String(year)];

  return Object.fromEntries(
    Object.entries(
      yearData.byKommune
    ).map(
      ([komNr, kommuneData]) => {
        const rawValue =
          distKey.type === 'risk'
            ? yearCache.byKommune[
              komNr
            ]?.totalRisk
            : distKey.type ===
              'element'
              ? yearCache.byKommune[
                komNr
              ]?.[
              String(distKey.key)
              ]
              : kommuneData[
              String(distKey.key)
              ];

        const value =
          rawValue ?? minRisk;

        return [
          komNr,
          computeColorForValue(
            value,
            minRisk,
            maxRisk,
            colors
          ),
        ];
      }
    )
  );
};

type ColorMapCache = {
  [year: string]: {
    [distributionKey: string]: Record<
      string,
      string
    >;
  };
};

let riskColorCache: ColorMapCache = {};

const clearComputedCaches = () => {
  riskColorCache = {};
};

const sumInvertibleValues = (
  metrics: Metric[],
  kommune: KommuneData
): number => {
  return metrics.reduce(
    (acc, metric) =>
      acc +
      (metric.disabled
        ? 0
        : metric.invert === true
          ? 100 -
          kommune[
          String(metric.key)
          ]
          : kommune[
          String(metric.key)
          ]),
    0
  );
};

const ZERO_RISK_COLOR = '#fff4eb';

const defaultRiskColors = [
  '#fee0c9',
  '#ffc593',
  '#ff9040',
  '#f8501c',
  '#e61313',
  '#ba0000',
  '#850000',
];

const computeColorForValue = (
  value: number,
  minRisk: number,
  maxRisk: number,
  colors: string[]
): string => {
  if (value <= 0) return ZERO_RISK_COLOR;

  const ratio = Math.max(0, Math.min(1, (value - minRisk) / (maxRisk - minRisk || 1)));
  const colorIndex = Math.min(
    Math.floor(ratio * colors.length),
    colors.length - 1
  );
  return colors[colorIndex] ?? colors[0];
};

type MinMaxMap = {
  [elementKey: string]: {
    min: number;
    max: number;
  };
};

let globalMinMaxCache: MinMaxMap = {};

interface DataStore {
  dataModel: DataModel | null;
  rawData: Data | null;
  data: Data | null;
  entityMapping: Record<string, string>;

  fetchData: () => Promise<void>;

  cache: Cache | null;

  applyAggregation: (
    level: AggregationLevel
  ) => void;

  refreshCacheDeep: () => void;
  refreshCacheRisk: () => void;

  refreshCacheElement: (
    elementKey?: ElementKey
  ) => void;

  calculateElementValue: (
    elementKey: ElementKey,
    komNr: KommuneNr,
    year: Year
  ) => number | null;

  getRiskColor: (
    komNr: KommuneNr,
    distKey?: DistributionKey
  ) => string;

  selectedYear: Year | null;

  setSelectedYear: (
    year: Year
  ) => void;

  highlightedKommune: KommuneNr | null;

  setHighlightedKommune: (
    kommune: KommuneNr | null
  ) => void;

  selectedKommune: KommuneNr | null;

  setSelectedKommune: (
    kommune: KommuneNr | null
  ) => void;

  selectedDistribution: DistributionKey;

  setSelectedDistribution: (
    key: DistributionKey
  ) => void;

  getDistributionDomain: (
    distributionKey: DistributionKey
  ) =>
    | [number, number]
    | undefined;

  layout: 'first' | 'second';

  setLayout: (
    layout: 'first' | 'second'
  ) => void;

  highlightedDistribution:
  | DistributionKey
  | null;

  setHighlightedDistribution: (
    key: DistributionKey | null
  ) => void;

  getFylkeDistribution: (
    komNr: KommuneNr,
    distKey: DistributionKey,
    year: Year
  ) => number[] | null;

  checkDistribution: () => void;

  riskColors: string[];

  getRiskColors: (
    distKey?: DistributionKey
  ) => string[];

  toggleMetricDisabled: (
    elementKey: ElementKey,
    metricKey: MetricKey
  ) => void;

  toggleElementDisabled: (
    elementKey: ElementKey
  ) => void;

  aggregationLevel: AggregationLevel;

  setAggregationLevel: (
    level: AggregationLevel
  ) => void;
}

export const useDataStore =
  create<DataStore>((set, get) => ({
    dataModel: null,
    rawData: null,
    data: null,
    entityMapping: {},
    cache: null,

    selectedYear: null,
    highlightedKommune: null,
    selectedKommune: null,

    selectedDistribution: {
      type: 'risk',
    } as DistributionKey,

    layout: 'first',
    highlightedDistribution: null,

    riskColors: defaultRiskColors,

    aggregationLevel: 'commune',

    fetchData: async () => {
      try {
        const [
          resPart1,
          resPart2,
          responseModel,
        ] = await Promise.all([
          fetch(
            'data/kommune_data_part1.json'
          ),
          fetch(
            'data/kommune_data_part2.json'
          ),
          fetch(
            'data/kommune_data_model.json'
          ),
        ]);

        if (
          !resPart1.ok ||
          !resPart2.ok ||
          !responseModel.ok
        ) {
          throw new Error(
            "Échec du chargement d'un des fichiers JSON de configuration."
          );
        }

        const part1: Data =
          await resPart1.json();

        const part2: Data =
          await resPart2.json();

        const dataModel: DataModel =
          await responseModel.json();

        const rawData: Data = {
          years: {
            ...part1.years,
            ...part2.years,
          },
        };

        const dataModelInitialized: DataModel =
        {
          ...dataModel,
          elements:
            dataModel.elements.map(
              (el) => ({
                ...el,
                disabled: false,
                metrics:
                  el.metrics.map(
                    (m) => ({
                      ...m,
                      disabled: false,
                    })
                  ),
              })
            ),
        };

        const selectedYear =
          dataModelInitialized.years &&
            dataModelInitialized.years
              .length > 0
            ? dataModelInitialized
              .years[0].key
            : null;

        set({
          dataModel:
            dataModelInitialized,
          rawData,
          selectedYear,
        });

        globalMinMaxCache = {};

        for (const element of
          dataModelInitialized.elements) {
          let min = Infinity;
          let max = -Infinity;

          for (const yearData of Object.values(
            rawData.years
          )) {
            for (const kom of Object.values(
              yearData.byKommune
            )) {
              const calculatedRisk =
                sumInvertibleValues(
                  element.metrics,
                  kom
                );

              if (
                calculatedRisk < min
              ) {
                min = calculatedRisk;
              }

              if (
                calculatedRisk > max
              ) {
                max = calculatedRisk;
              }
            }
          }

          globalMinMaxCache[
            String(element.key)
          ] = {
            min,
            max,
          };
        }

        get().applyAggregation(
          'commune'
        );
      } catch (error) {
        console.error(
          "Échec critique lors du chargement ou de la fusion des fichiers :",
          error
        );
      }
    },

    applyAggregation: (level) => {
      const {
        rawData,
        dataModel,
      } = get();

      if (!rawData || !dataModel) {
        return;
      }

      const mapping: Record<
        string,
        string
      > = {};

      if (level === 'commune') {
        const firstYear =
          Object.values(
            rawData.years
          )[0];

        if (firstYear) {
          for (const k of Object.keys(
            firstYear.byKommune
          )) {
            mapping[k] = k;
          }
        }

        set({
          data: rawData,
          entityMapping: mapping,
          aggregationLevel: level,
          selectedKommune: null,
        });
      } else {
        const aggregatedData: Data = {
          years: {},
        };

        for (const [
          yearStr,
          yearObj,
        ] of Object.entries(
          rawData.years
        )) {
          aggregatedData.years[
            yearStr
          ] = {
            byKommune: {},
            byMetric: {},
          };

          const grouped: Record<
            string,
            {
              name: string;
              count: number;
              metrics: Record<
                string,
                number
              >;
            }
          > = {};

          for (const [
            komNr,
            komData,
          ] of Object.entries(
            yearObj.byKommune
          )) {
            let groupKey = komNr;
            let groupName =
              komData.name;

            if (
              level ===
              'departement'
            ) {
              groupKey =
                komData.departement ||
                String(
                  komNr
                ).slice(0, 2);

              groupName = `Département ${groupKey}`;
            } else if (
              level === 'epci'
            ) {
              groupKey =
                komData.codes_siren_des_epci ||
                'Inconnu';

              groupName =
                komData.nom_epci ||
                `EPCI ${groupKey}`;
            }

            mapping[komNr] =
              groupKey;

            if (
              !grouped[groupKey]
            ) {
              grouped[groupKey] = {
                name: groupName,
                count: 0,
                metrics: {},
              };
            }

            grouped[groupKey]
              .count += 1;

            for (const element of
              dataModel.elements) {
              for (const metric of
                element.metrics) {
                const value =
                  Number(
                    komData[
                    String(
                      metric.key
                    )
                    ]
                  ) || 0;

                grouped[groupKey]
                  .metrics[
                  String(
                    metric.key
                  )
                ] =
                  (grouped[
                    groupKey
                  ].metrics[
                    String(
                      metric.key
                    )
                  ] || 0) + value;
              }
            }
          }

          for (const [
            groupKey,
            groupData,
          ] of Object.entries(
            grouped
          )) {
            const avgData: KommuneData =
            {
              name:
                groupData.name,
            };

            for (const element of
              dataModel.elements) {
              for (const metric of
                element.metrics) {
                const avgVal =
                  groupData.metrics[
                  String(
                    metric.key
                  )
                  ] /
                  groupData.count;

                avgData[
                  String(metric.key)
                ] = avgVal;

                if (
                  !aggregatedData
                    .years[
                    yearStr
                  ]
                    .byMetric[
                  String(
                    metric.key
                  )
                  ]
                ) {
                  aggregatedData
                    .years[
                    yearStr
                  ]
                    .byMetric[
                  String(
                    metric.key
                  )
                  ] = [];
                }

                aggregatedData
                  .years[
                  yearStr
                ]
                  .byMetric[
                  String(
                    metric.key
                  )
                ].push(avgVal);
              }
            }

            aggregatedData
              .years[
              yearStr
            ]
              .byKommune[
              groupKey
            ] = avgData;
          }

          for (const metricKey of Object.keys(
            aggregatedData.years[
              yearStr
            ].byMetric
          )) {
            aggregatedData.years[
              yearStr
            ].byMetric[
              metricKey
            ].sort(
              (a, b) => a - b
            );
          }
        }

        set({
          data: aggregatedData,
          entityMapping: mapping,
          aggregationLevel: level,
          selectedKommune: null,
        });
      }

      get().refreshCacheDeep();
    },

    refreshCacheDeep: () => {
      const {
        dataModel,
        data,
        calculateElementValue,
      } = get();

      if (
        !dataModel ||
        !data ||
        !data.years
      ) {
        return;
      }

      const cache: Cache = {
        years: {},
      };

      const globalRawRisks: Record<
        string,
        Record<string, number>
      > = {};

      const allTotalRiskValues: number[] =
        [];

      for (const year of Object.keys(
        data.years
      )) {
        cache.years[year] = {
          byKommune: {},
          byElement: {},
          byTotalRisk: [],
        };

        globalRawRisks[year] = {};

        for (const komNr of Object.keys(
          data.years[year]
            .byKommune
        )) {
          const kommuneCache: KommuneCache =
          {
            totalRisk: 0,
          };

          let totalRiskRaw = 0;

          for (const element of
            dataModel.elements) {
            const elementValue =
              calculateElementValue(
                element.key,
                komNr as KommuneNr,
                year as Year
              );

            if (
              elementValue !== null
            ) {
              kommuneCache[
                String(element.key)
              ] = elementValue;

              const baseValue =
                element.disabled
                  ? 0
                  : element.invert ===
                    true
                    ? 100 -
                    elementValue
                    : elementValue;

              const isResponse =
                String(
                  element.key
                ).toLowerCase() ===
                'r';

              totalRiskRaw +=
                isResponse
                  ? baseValue * 0.3
                  : baseValue;
            }
          }

          globalRawRisks[year][
            komNr
          ] = totalRiskRaw;

          allTotalRiskValues.push(
            totalRiskRaw
          );

          cache.years[year]
            .byKommune[komNr] =
            kommuneCache;
        }
      }

      let absMinRisk = Infinity;
      let absMaxRisk = -Infinity;

      for (
        let i = 0;
        i <
        allTotalRiskValues.length;
        i++
      ) {
        const value =
          allTotalRiskValues[i];

        if (value < absMinRisk) {
          absMinRisk = value;
        }

        if (value > absMaxRisk) {
          absMaxRisk = value;
        }
      }

      if (
        absMinRisk === Infinity
      ) {
        absMinRisk = 0;
      }

      if (
        absMaxRisk === -Infinity
      ) {
        absMaxRisk = 100;
      }

      const delta =
        absMaxRisk - absMinRisk;

      for (const year of Object.keys(
        data.years
      )) {
        for (const komNr of Object.keys(
          data.years[year]
            .byKommune
        )) {
          const rawVal =
            globalRawRisks[year][
            komNr
            ];

          cache.years[year]
            .byKommune[
            komNr
          ].totalRisk =
            delta === 0
              ? 0
              : ((rawVal -
                absMinRisk) /
                delta) *
              100;
        }

        for (const element of
          dataModel.elements) {
          cache.years[year]
            .byElement[
            String(element.key)
          ] = Object.values(
            cache.years[year]
              .byKommune
          )
            .map(
              (kommune) =>
                kommune[
                String(
                  element.key
                )
                ]
            )
            .sort(
              (a, b) => a - b
            );
        }

        cache.years[year]
          .byTotalRisk =
          Object.values(
            cache.years[year]
              .byKommune
          )
            .map(
              (kommune) =>
                kommune.totalRisk
            )
            .sort(
              (a, b) => a - b
            );
      }

      clearComputedCaches();

      set({ cache });
    },

    refreshCacheRisk: () => {
      get().refreshCacheDeep();
    },

    refreshCacheElement: () => {
      get().refreshCacheDeep();
    },

    calculateElementValue: (
      elementKey,
      komNr,
      year
    ) => {
      const {
        dataModel,
        data,
      } = get();

      if (
        !dataModel ||
        !data ||
        !komNr ||
        !year
      ) {
        return null;
      }

      const element =
        dataModel.elements.find(
          (el) =>
            el.key === elementKey
        );

      if (!element) {
        return null;
      }

      const kommune =
        data.years[
          String(year)
        ]?.byKommune[
        String(komNr)
        ];

      if (!kommune) {
        return null;
      }

      const tmpRes =
        sumInvertibleValues(
          element.metrics,
          kommune
        );

      const bounds =
        globalMinMaxCache[
        String(elementKey)
        ];

      if (
        !bounds ||
        bounds.min === bounds.max
      ) {
        return null;
      }

      return (
        ((tmpRes - bounds.min) /
          (bounds.max -
            bounds.min)) *
        100
      );
    },

    getRiskColor: (
      komNr,
      distKey?
    ) => {
      const {
        data,
        cache,
        selectedYear,
        selectedDistribution,
        getRiskColors,
        riskColors,
      } = get();

      const dist =
        distKey ??
        selectedDistribution;

      const colors = distKey
        ? getRiskColors(dist)
        : riskColors;

      if (
        !data ||
        !cache ||
        !selectedYear ||
        colors.length === 0 ||
        !cache.years[
        String(selectedYear)
        ]
      ) {
        return 'gray';
      }

      const distKeyString =
        distributionKeyToString(
          dist
        );

      if (
        !riskColorCache[
        String(selectedYear)
        ]
      ) {
        riskColorCache[
          String(selectedYear)
        ] = {};
      }

      if (
        !riskColorCache[
        String(selectedYear)
        ][distKeyString]
      ) {
        const colorMap =
          buildRiskColorMapForKey(
            dist,
            selectedYear,
            data,
            cache,
            colors
          );

        if (!colorMap) {
          return 'gray';
        }

        riskColorCache[
          String(selectedYear)
        ][distKeyString] =
          colorMap;
      }

      return (
        riskColorCache[
        String(selectedYear)
        ][distKeyString][
        String(komNr)
        ] ?? 'gray'
      );
    },

    setSelectedYear: (year) =>
      set({
        selectedYear: year,
      }),

    setHighlightedKommune: (
      kommune
    ) => {
      const {
        entityMapping,
      } = get();

      const mapped = kommune
        ? (entityMapping[
          String(kommune)
        ] ??
          String(
            kommune
          )) as KommuneNr
        : null;

      set({
        highlightedKommune:
          mapped,
      });
    },

    setSelectedKommune: (
      kommune
    ) =>
      set((state) => {
        if (!kommune) {
          return {
            selectedKommune:
              null,
          };
        }

        const mapped =
          (state.entityMapping[
            String(kommune)
          ] ??
            String(
              kommune
            )) as KommuneNr;

        if (
          state.selectedKommune ===
          mapped
        ) {
          return {
            selectedKommune:
              null,
          };
        }

        return {
          selectedKommune:
            mapped,
        };
      }),

    setSelectedDistribution: (
      key
    ) =>
      set({
        selectedDistribution:
          key,
        riskColors:
          get().getRiskColors(
            key
          ),
      }),

    getDistributionDomain: (
      distributionKey
    ) => {
      if (
        distributionKey.type ===
        'risk'
      ) {
        return [0, 100];
      }

      let min = Infinity;
      let max = -Infinity;

      if (
        distributionKey.type ===
        'metric'
      ) {
        const { data } =
          get();

        if (!data) {
          return undefined;
        }

        for (const year of Object.values(
          data.years
        )) {
          const dist =
            year.byMetric[
            String(
              distributionKey.key
            )
            ];

          if (
            dist &&
            dist.length > 0
          ) {
            if (
              dist[0] < min
            ) {
              min = dist[0];
            }

            if (
              dist[
              dist.length - 1
              ] > max
            ) {
              max =
                dist[
                dist.length - 1
                ];
            }
          }
        }
      } else {
        const { cache } =
          get();

        if (!cache) {
          return undefined;
        }

        for (const year of Object.values(
          cache.years
        )) {
          const dist =
            year.byElement[
            String(
              distributionKey.key
            )
            ];

          if (
            dist &&
            dist.length > 0
          ) {
            if (
              dist[0] < min
            ) {
              min = dist[0];
            }

            if (
              dist[
              dist.length - 1
              ] > max
            ) {
              max =
                dist[
                dist.length - 1
                ];
            }
          }
        }
      }

      return [min, max];
    },

    setLayout: (layout) =>
      set({ layout }),

    setHighlightedDistribution: (
      key
    ) =>
      set({
        highlightedDistribution:
          key,
      }),

    getFylkeDistribution(
      komNr,
      distKey,
      year
    ) {
      const {
        data,
        cache,
      } = get();

      if (
        !data ||
        !cache ||
        !year ||
        !cache.years[
        String(year)
        ]
      ) {
        return null;
      }

      const deptNr =
        String(komNr).slice(
          0,
          2
        );

      if (
        distKey.type ===
        'risk'
      ) {
        return Object.entries(
          cache.years[
            String(year)
          ].byKommune
        )
          .filter(([k]) =>
            k.startsWith(
              deptNr
            )
          )
          .map(
            ([, k]) =>
              (k as KommuneCache)
                .totalRisk
          )
          .sort(
            (a, b) => a - b
          );
      }

      if (
        distKey.type ===
        'element'
      ) {
        return Object.entries(
          cache.years[
            String(year)
          ].byKommune
        )
          .filter(([k]) =>
            k.startsWith(
              deptNr
            )
          )
          .map(
            ([, k]) =>
              (k as KommuneCache)[
              String(
                distKey.key
              )
              ]
          )
          .sort(
            (a, b) => a - b
          );
      }

      return Object.entries(
        data.years[
          String(year)
        ].byKommune
      )
        .filter(([k]) =>
          k.startsWith(
            deptNr
          )
        )
        .map(
          ([, k]) =>
            (k as KommuneData)[
            String(
              distKey.key
            )
            ]
        )
        .sort(
          (a, b) => a - b
        );
    },

    toggleElementDisabled: (
      elementKey
    ) => {
      const {
        dataModel,
      } = get();

      if (!dataModel) {
        return;
      }

      const updatedElements =
        dataModel.elements.map(
          (element) => {
            if (
              element.key ===
              elementKey
            ) {
              return {
                ...element,
                disabled:
                  !element.disabled,
              };
            }

            return element;
          }
        );

      set({
        dataModel: {
          ...dataModel,
          elements:
            updatedElements,
        },
      });

      get().refreshCacheDeep();
      get().checkDistribution();
    },

    toggleMetricDisabled: (
      elementKey,
      metricKey
    ) => {
      const {
        dataModel,
      } = get();

      if (!dataModel) {
        return;
      }

      const updatedElements =
        dataModel.elements.map(
          (element) => {
            if (
              element.key ===
              elementKey
            ) {
              return {
                ...element,
                metrics:
                  element.metrics.map(
                    (metric) =>
                      metric.key ===
                        metricKey
                        ? {
                          ...metric,
                          disabled:
                            !metric.disabled,
                        }
                        : metric
                  ),
              };
            }

            return element;
          }
        );

      set({
        dataModel: {
          ...dataModel,
          elements:
            updatedElements,
        },
      });

      get().refreshCacheDeep();
      get().checkDistribution();
    },

    checkDistribution() {
      const {
        selectedDistribution,
        dataModel,
        setSelectedDistribution,
      } = get();

      if (!dataModel) {
        return;
      }

      if (
        selectedDistribution.type ===
        'element'
      ) {
        const element =
          dataModel.elements.find(
            (e) =>
              e.key ===
              selectedDistribution.key
          );

        if (element?.disabled) {
          setSelectedDistribution({
            type: 'risk',
          });
        }
      } else if (
        selectedDistribution.type ===
        'metric'
      ) {
        for (const element of
          dataModel.elements) {
          for (const metric of
            element.metrics) {
            if (
              metric.key ===
              selectedDistribution.key
            ) {
              if (
                element.disabled ||
                metric.disabled
              ) {
                setSelectedDistribution({
                  type: 'risk',
                });

                return;
              }
            }
          }
        }
      }
    },

    getRiskColors: (key) => {
      const {
        dataModel,
      } = get();

      if (!dataModel || !key) {
        return defaultRiskColors;
      }

      if (
        key.type === 'risk'
      ) {
        return defaultRiskColors;
      }

      if (
        key.type === 'element'
      ) {
        return dataModel.elements.find(
          (element) =>
            element.key ===
            key.key
        )?.invert
          ? [
            ...defaultRiskColors,
          ].reverse()
          : defaultRiskColors;
      }

      if (
        key.type === 'metric'
      ) {
        const element =
          dataModel.elements.find(
            (e) =>
              e.metrics.some(
                (m) =>
                  m.key ===
                  key.key
              )
          );

        if (!element) {
          return defaultRiskColors;
        }

        const metric =
          element.metrics.find(
            (m) =>
              m.key === key.key
          );

        if (!metric) {
          return defaultRiskColors;
        }

        return !!element.invert !==
          !!metric.invert
          ? [
            ...defaultRiskColors,
          ].reverse()
          : defaultRiskColors;
      }

      return defaultRiskColors;
    },

    setAggregationLevel: (
      level
    ) => {
      set({
        aggregationLevel:
          level,
      });

      get().applyAggregation(
        level
      );
    },
  }));

export default useDataStore;