// src/assets/territoryMapRenderer.ts

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

function getDeptCodeFromInsee(insee: string): string {
    if (insee.startsWith("97")) return insee.slice(0, 3);
    if (insee.startsWith("2A") || insee.startsWith("2B")) return insee.slice(0, 2);
    return insee.slice(0, 2).padStart(2, "0");
}

export function generateTerritoryMapImage(
    geojsonData: any,
    territoryKey: string,
    aggregationLevel: string,
    colorMap: Record<string, string>,
    width = 300,
    height = 160
): string {
    if (!geojsonData || !geojsonData.features) return "";

    const isDept = aggregationLevel === "departement";
    const cleanTarget = String(territoryKey).trim().replace(/^DEP_|^REG_/, "").padStart(2, "0");
    const regionDepts = REGION_DEPARTEMENTS_MAP[cleanTarget] || [];

    const matchingFeatures: { feature: any; insee: string }[] = [];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // 1. Filtrage ultra-rapide des communes concernées
    for (let i = 0; i < geojsonData.features.length; i++) {
        const f = geojsonData.features[i];
        if (!f || !f.geometry) continue;

        const props = f.properties || {};
        let insee = String(props.code_insee || props.insee || props.code || "").trim();
        if (/^\d{1,4}$/.test(insee)) insee = insee.padStart(5, "0");

        const deptCode = getDeptCodeFromInsee(insee);
        const regProp = String(props.region || props.INSEE_REG || props.code_region || "").trim();

        let belongs = isDept ? deptCode === cleanTarget : (regionDepts.includes(deptCode) || regProp === cleanTarget);

        if (belongs) {
            matchingFeatures.push({ feature: f, insee });

            const geom = f.geometry;
            const processRing = (ring: [number, number][]) => {
                for (let j = 0; j < ring.length; j++) {
                    const [lng, lat] = ring[j];
                    if (lng < minX) minX = lng;
                    if (lat < minY) minY = lat;
                    if (lng > maxX) maxX = lng;
                    if (lat > maxY) maxY = lat;
                }
            };

            if (geom.type === "Polygon") {
                const coords = geom.coordinates as [number, number][][];
                for (let k = 0; k < coords.length; k++) processRing(coords[k]);
            } else if (geom.type === "MultiPolygon") {
                const coords = geom.coordinates as [number, number][][][];
                for (let k = 0; k < coords.length; k++) {
                    for (let l = 0; l < coords[k].length; l++) processRing(coords[k][l]);
                }
            }
        }
    }

    if (matchingFeatures.length === 0 || minX === Infinity) return "";

    // 2. Création du Canvas en mémoire (taille optimisée pour le PDF)
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d", { alpha: false }); // Optimisation 2D context
    if (!ctx) return "";

    ctx.scale(2, 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const meanLat = ((minY + maxY) / 2) * (Math.PI / 180);
    const cosLat = Math.cos(meanLat);

    const padding = 8;
    const projectedGeoW = (maxX - minX) * cosLat;
    const projectedGeoH = maxY - minY;

    const scale = Math.min(
        (width - padding * 2) / (projectedGeoW || 1),
        (height - padding * 2) / (projectedGeoH || 1)
    );

    const centerGeoX = (minX + maxX) / 2;
    const centerGeoY = (minY + maxY) / 2;

    const project = (lng: number, lat: number) => {
        const x = width / 2 + (lng - centerGeoX) * cosLat * scale;
        const y = height / 2 - (lat - centerGeoY) * scale;
        return [x, y];
    };

    // 3. Dessin groupé par couleur pour éviter les changements de contexte canvas trop fréquents
    const colorGroups: Record<string, [number, number][][]> = {};

    matchingFeatures.forEach(({ feature, insee }) => {
        const fillColor = colorMap[insee] || "#cbd5e1";
        if (!colorGroups[fillColor]) colorGroups[fillColor] = [];

        const geom = feature.geometry;
        const addRingToGroup = (ring: [number, number][]) => {
            const pts: [number, number][] = [];
            for (let j = 0; j < ring.length; j++) {
                pts.push(project(ring[j][0], ring[j][1]) as [number, number]);
            }
            colorGroups[fillColor].push(pts);
        };

        if (geom.type === "Polygon") {
            const coords = geom.coordinates as [number, number][][];
            for (let k = 0; k < coords.length; k++) addRingToGroup(coords[k]);
        } else if (geom.type === "MultiPolygon") {
            const coords = geom.coordinates as [number, number][][][];
            for (let k = 0; k < coords.length; k++) {
                for (let l = 0; l < coords[k].length; l++) addRingToGroup(coords[k][l]);
            }
        }
    });

    ctx.lineWidth = 0.01;
    ctx.strokeStyle = "#000000";

    Object.entries(colorGroups).forEach(([fillColor, rings]) => {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        for (let i = 0; i < rings.length; i++) {
            const ring = rings[i];
            for (let j = 0; j < ring.length; j++) {
                const [x, y] = ring[j];
                if (j === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();
    });

    const dataUrl = canvas.toDataURL("image/png");

    // 🎯 Nettoyage immédiat de la mémoire du canvas
    canvas.width = 0;
    canvas.height = 0;

    return dataUrl;
}