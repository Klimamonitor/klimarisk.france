import { useCallback } from "react";

export function useMapSnapshot() {
    const captureMap = useCallback((mapInstance: any): string | undefined => {
        if (!mapInstance) return undefined;
        try {
            // MapLibre / Mapbox GL Canvas Export
            const canvas = mapInstance.getCanvas();
            return canvas.toDataURL("image/png");
        } catch (e) {
            console.error("Erreur lors de la capture de la carte :", e);
            return undefined;
        }
    }, []);

    return { captureMap };
}