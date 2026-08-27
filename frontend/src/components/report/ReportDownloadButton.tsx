import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import useLanguageStore, { t } from "../../hooks/useLanguageStore";
import useDataStore from "../../hooks/useDataStore";
import ReportDocument from "./document/ReportDocument";
import type { ReportSnapshot } from "./document/reportSnapshot";

interface Props {
    report: ReportSnapshot;
}

// Attente robuste
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function captureTerritoryMaps(
    mapInstance: any,
    elements: ReportSnapshot["elements"],
    territoryBounds?: any
): Promise<Record<string, string>> {
    const indicatorMaps: Record<string, string> = {};
    const { setSelectedDistribution, selectedDistribution } = useDataStore.getState();

    console.log("📸 --- DÉBUT DE LA CAPTURE DES CARTES ---");

    if (!mapInstance) {
        console.error("❌ ERREUR: mapInstance est vide ou introuvable !");
        return indicatorMaps;
    }

    // 1. Cadrage
    if (territoryBounds) {
        console.log("📍 Cadrage sur le territoire en cours...");
        mapInstance.fitBounds(territoryBounds, { padding: 30, duration: 0 });
        mapInstance.triggerRepaint();
        await sleep(600); // Laisse à la carte le temps de se positionner
    }

    const initialDist = selectedDistribution;

    try {
        for (const el of elements) {
            console.log(`⏳ Capture de la composante [${el.key}]...`);
            setSelectedDistribution({ type: "element", key: el.key as any });

            // Laisser le temps à React de MAJ le state + MapLibre de dessiner
            await sleep(100);
            mapInstance.triggerRepaint();
            await sleep(500);

            let canvas = mapInstance.getCanvas();
            if (canvas) {
                const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
                indicatorMaps[el.key] = dataUrl;
                console.log(`✅ Image ${el.key} capturée (Taille: ${Math.round(dataUrl.length / 1024)} ko)`);
            }

            for (const metric of el.metrics) {
                console.log(`⏳ Capture du sous-indicateur [${metric.key}]...`);
                setSelectedDistribution({ type: "metric", key: metric.key as any });

                await sleep(100);
                mapInstance.triggerRepaint();
                await sleep(500); // 🎯 Délai crucial pour la mise à jour des couleurs

                canvas = mapInstance.getCanvas();
                if (canvas) {
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
                    indicatorMaps[metric.key] = dataUrl;
                    console.log(`✅ Image ${metric.key} capturée (Taille: ${Math.round(dataUrl.length / 1024)} ko)`);
                } else {
                    console.error(`❌ Échec capture pour ${metric.key}: canvas introuvable`);
                }
            }
        }
    } catch (err) {
        console.error("❌ Erreur critique lors de la boucle de capture :", err);
    } finally {
        console.log("🔄 Restauration de l'affichage initial...");
        if (initialDist) {
            setSelectedDistribution(initialDist);
        }
    }

    console.log("📸 --- FIN DE LA CAPTURE ---", indicatorMaps);
    return indicatorMaps;
}

// ... le reste de votre composant ReportDownloadButton reste inchangé ...
function ReportDownloadButton({ report }: Props) {
    const { l } = useLanguageStore();
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);

        try {
            const mapInstance = (window as any).__mapInstance;
            const isTerritory =
                report.kommune.aggregationLevel === "departement" ||
                report.kommune.aggregationLevel === "region" ||
                report.kommune.aggregationLevel === "epci";

            let indicatorMaps: Record<string, string> = {};

            if (isTerritory) {
                if (mapInstance) {
                    indicatorMaps = await captureTerritoryMaps(
                        mapInstance,
                        report.elements,
                        (window as any).__currentTerritoryBounds
                    );
                } else {
                    console.error("❌ Impossible de lancer la capture, window.__mapInstance n'existe pas !");
                }
            }

            const enrichedReport: any = {
                ...report,
                indicatorMaps,
                metricMaps: indicatorMaps,
            };

            const doc = <ReportDocument report={enrichedReport} />;
            const asPdf = pdf(doc);
            const blob = await asPdf.toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = (l(t.report.download.fileName) as string) || `Rapport_${report.kommune.name}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erreur téléchargement PDF :", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reportDownloadButton">
            <button type="button" disabled={loading} onClick={handleDownload}>
                <Download size={18} style={{ marginRight: "0.5rem" }} />
                {loading ? l(t.report.download.generating) : l(t.report.download.download)}
            </button>
        </div>
    );
}

export default ReportDownloadButton;