// src/components/report/TerritoryExportModal.tsx

import { useState, useEffect, useRef } from "react";
import useDataStore from "../../hooks/useDataStore";
import { pdf } from "@react-pdf/renderer";
import ReportDocument from "./document/ReportDocument";
import { type ReportSnapshot } from "./document/reportSnapshot";
import { getDataFileJSON } from "../../hooks/getPublicUrl";
import { generateTerritoryMapImage } from "../../assets/territoryMapRenderer";

interface Props {
  reportBase: ReportSnapshot;
  allReports?: ReportSnapshot[];
  onClose: () => void;
}

// 🎯 Même couleur de risque nul que dans useDataStore et le renderer
const ZERO_RISK_COLOR = "#fff4eb";

export function TerritoryExportModal({ reportBase, allReports, onClose }: Props) {
  const [progressText, setProgressText] = useState<string>("Chargement du territoire...");
  const [progressPercent, setProgressPercent] = useState<number>(10);
  const isCancelledRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    isCancelledRef.current = false;

    const runExport = async () => {
      try {
        if (!isMounted || isCancelledRef.current) return;
        setProgressPercent(15);
        setProgressText("Filtrage des données géographiques...");

        const fullGeojson = await getDataFileJSON("kommune.geojson");
        if (!isMounted || isCancelledRef.current) return;

        const targetTerritory = String(reportBase.kommune.key).trim().replace(/^DEP_|^REG_/, "").padStart(2, "0");
        const aggLevel = reportBase.kommune.aggregationLevel || "departement";

        const territoryFeatures = (fullGeojson.features || []).filter((f: any) => {
          if (!f || !f.geometry) return false;
          let insee = String(f.properties?.code_insee || f.properties?.insee || f.properties?.code || "").trim();
          if (/^\d{1,4}$/.test(insee)) insee = insee.padStart(5, "0");
          if (aggLevel === "departement") {
            const dept = insee.startsWith("97") ? insee.slice(0, 3) : insee.slice(0, 2);
            return dept === targetTerritory;
          }
          return true;
        });

        const targetGeojson = {
          type: "FeatureCollection",
          features: territoryFeatures.length > 0 ? territoryFeatures : fullGeojson.features,
        };

        const storeState = useDataStore.getState();
        const { data, cache, dataModel, getRiskColors, getDistributionDomain } = storeState;

        if (!data || !cache || !dataModel) {
          throw new Error("Données indisponibles dans le store");
        }

        const capturedMaps: Record<string, string> = {};
        const activeElements = (reportBase.elements || dataModel.elements || []).filter((e: any) => !e.disabled);
        const yearsList = dataModel.years || [reportBase.year];

        setProgressPercent(30);
        setProgressText("Génération des cartes...");

        const computeColorMapForYear = (distKey: any, yrKey: string): Record<string, string> => {
          const colors = getRiskColors(distKey);
          const domain = getDistributionDomain(distKey);
          if (!domain || domain[0] === domain[1]) return {};

          const [minRisk, maxRisk] = distKey.type === "risk" ? [0, 100] : domain;
          const yearData = data.years?.[String(yrKey)];
          const yearCache = cache.years?.[String(yrKey)];
          if (!yearData && !yearCache) return {};

          const colorMap: Record<string, string> = {};
          targetGeojson.features.forEach((f: any) => {
            let insee = String(f.properties?.code_insee || f.properties?.insee || f.properties?.code || "").trim();
            if (/^\d{1,4}$/.test(insee)) insee = insee.padStart(5, "0");
            if (!insee) return;

            let rawValue: number | undefined;
            if (distKey.type === "risk") {
              rawValue = yearCache?.byKommune?.[insee]?.totalRisk;
            } else if (distKey.type === "element") {
              rawValue = yearCache?.byKommune?.[insee]?.[String(distKey.key)];
            } else {
              rawValue = yearData?.byKommune?.[insee]?.[String(distKey.key)];
            }

            // 🎯 Interception stricte du risque nul / absent
            if (rawValue === undefined || rawValue === null || rawValue <= 0.001) {
              colorMap[insee] = ZERO_RISK_COLOR;
              return;
            }

            // Normalisation sur la plage > 0
            const effectiveMin = minRisk <= 0 ? 0.001 : minRisk;
            const ratio = Math.max(0, Math.min(1, (rawValue - effectiveMin) / (maxRisk - effectiveMin || 1)));
            const colorIndex = Math.min(
              Math.floor(ratio * colors.length),
              colors.length - 1
            );
            colorMap[insee] = colors[colorIndex] ?? colors[0];
          });

          return colorMap;
        };

        const totalSteps = yearsList.length * (activeElements.length + 1);
        let currentStep = 0;

        for (let yrIdx = 0; yrIdx < yearsList.length; yrIdx++) {
          const yr = yearsList[yrIdx];
          const yrKey = String(typeof yr === "object" ? yr.key : yr);

          if (!isMounted || isCancelledRef.current) return;
          await new Promise((resolve) => setTimeout(resolve, 5));

          // A. Carte du Risque Global pour cet horizon
          const riskColorMap = computeColorMapForYear({ type: "risk" }, yrKey);
          const riskImg = generateTerritoryMapImage(targetGeojson, targetTerritory, aggLevel, riskColorMap, 750, 400);
          if (riskImg) {
            capturedMaps[`${yrKey}_risk`] = riskImg;
            if (yrIdx === 0) capturedMaps["risk"] = riskImg;
          }
          currentStep++;

          // B. Cartes des composantes et métriques
          for (const element of activeElements) {
            if (!isMounted || isCancelledRef.current) return;
            await new Promise((resolve) => setTimeout(resolve, 5));

            const isHazard = element.key === "h";
            if (!isHazard && yrIdx > 0) {
              currentStep++;
              continue;
            }

            const elemColorMap = computeColorMapForYear({ type: "element", key: element.key }, yrKey);
            const elemImg = generateTerritoryMapImage(targetGeojson, targetTerritory, aggLevel, elemColorMap, 750, 400);
            if (elemImg) {
              capturedMaps[`${yrKey}_${element.key}`] = elemImg;
              if (yrIdx === 0) capturedMaps[element.key] = elemImg;
            }

            for (const metric of (element.metrics || []).filter((m: any) => !m.disabled)) {
              if (!isMounted || isCancelledRef.current) return;
              await new Promise((resolve) => setTimeout(resolve, 5));

              const metricColorMap = computeColorMapForYear({ type: "metric", key: metric.key }, yrKey);
              const metricImg = generateTerritoryMapImage(targetGeojson, targetTerritory, aggLevel, metricColorMap, 750, 400);
              if (metricImg) {
                capturedMaps[`${yrKey}_${metric.key}`] = metricImg;
                if (yrIdx === 0) capturedMaps[metric.key] = metricImg;
              }
            }

            currentStep++;
            setProgressPercent(30 + Math.round((currentStep / Math.max(totalSteps, 1)) * 55));
          }
        }

        if (!isMounted || isCancelledRef.current) return;

        setProgressPercent(88);
        setProgressText("Compilation du document PDF...");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const baseReportsList = allReports && allReports.length > 0 ? allReports : [reportBase];
        const updatedReports = baseReportsList.map((rep) => ({
          ...rep,
          indicatorMaps: capturedMaps,
          metricMaps: capturedMaps,
          mapImageDataUrl: capturedMaps["risk"] || capturedMaps[activeElements[0]?.key] || undefined,
        }));

        const doc = (
          <ReportDocument
            report={updatedReports[0]}
            allReports={updatedReports}
          />
        );

        const blob = await pdf(doc).toBlob();
        if (!isMounted || isCancelledRef.current) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Rapport_Territorial_${aggLevel}_${reportBase.kommune.key}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setProgressPercent(100);
        setProgressText("Téléchargement terminé !");
        setTimeout(() => {
          if (isMounted) onClose();
        }, 300);
      } catch (err) {
        console.error("Erreur critique export PDF :", err);
        alert("Une erreur est survenue lors de la création du document.");
        if (isMounted) onClose();
      }
    };

    runExport();

    return () => {
      isMounted = false;
      isCancelledRef.current = true;
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        zIndex: 10000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          padding: "26px 36px",
          borderRadius: 10,
          textAlign: "center",
          minWidth: 340,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", color: "#0f172a", fontSize: 16, fontWeight: "bold" }}>
          Export du Rapport Territorial
        </h3>
        <p style={{ color: "#ea580c", margin: "12px 0", fontSize: 13, fontWeight: "bold" }}>
          {progressText}
        </p>

        <div
          style={{
            width: "100%",
            height: 6,
            backgroundColor: "#e2e8f0",
            borderRadius: 3,
            overflow: "hidden",
            margin: "12px 0",
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              backgroundColor: "#ea580c",
              transition: "width 0.15s ease-out",
            }}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={() => {
              isCancelledRef.current = true;
              onClose();
            }}
            style={{
              padding: "6px 14px",
              backgroundColor: "#f1f5f9",
              color: "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

export default TerritoryExportModal;