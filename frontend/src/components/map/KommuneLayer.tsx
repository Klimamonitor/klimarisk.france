import { useState, useEffect, useMemo, useRef } from 'react';
import { Source, Layer, useMap } from 'react-map-gl/maplibre';
import useDataStore from '../../hooks/useDataStore';
import useLanguageStore from '../../hooks/useLanguageStore'; // 🎯 AJOUTÉ : Importation de ton store de langue
import { getDataFileJSON } from '../../hooks/getPublicUrl';
import type { KommuneNr } from '../../hooks/useDataStore';

// 🎯 AJOUTÉ : Type de la prop locale pour éviter les erreurs TypeScript
interface KommuneLayerProps {
  setIsLoading: (loading: boolean) => void;
}

function KommuneLayer({ setIsLoading }: KommuneLayerProps) { // 🎯 AJOUTÉ : Passage en prop
  const [komGeoJSON, setKomGeoJSON] = useState<any>(null);
  const [epciGeoJSON, setEpciGeoJSON] = useState<any>(null);
  const [deptGeoJSON, setDeptGeoJSON] = useState<any>(null);
  const [regGeoJSON, setRegGeoJSON] = useState<any>(null);

  // 🎯 ÉTATS : Gestion de la visibilité des contours optionnels
  const [showDeptBorders, setShowDeptBorders] = useState<boolean>(true);
  const [showRegBorders, setShowRegBorders] = useState<boolean>(true);

  const prevSelectedRef = useRef<string | null>(null);

  // 🎯 AJOUTÉ : Récupération de la fonction de traduction de ton store
  const l = useLanguageStore((state) => state.l);

  const {
    selectedKommune,
    selectedDistribution,
    selectedYear,
    getRiskColor,
    aggregationLevel,
    data,
    cache,
  } = useDataStore();

  const mapInstance = useMap();

  // 1. Chargement unique des géométries brutes et injection d'un ID numérique séquentiel
  useEffect(() => {
    const injectNumericIds = (res: any) => {
      if (res?.features) {
        res.features = res.features.map((f: any, i: number) => ({
          ...f,
          id: i
        }));
      }
      return res;
    };

    getDataFileJSON('kommune.geojson').then(res => setKomGeoJSON(injectNumericIds(res)));
    getDataFileJSON('epci.geojson').then(res => setEpciGeoJSON(injectNumericIds(res)));
    getDataFileJSON('departement.geojson').then(res => setDeptGeoJSON(injectNumericIds(res)));
    getDataFileJSON('region.geojson').then(res => setRegGeoJSON(injectNumericIds(res)));
  }, []);

  // Définition de la géométrie active et de sa clé d'indexation
  const currentContext = useMemo(() => {
    if (aggregationLevel === "departement") return { geojson: deptGeoJSON, key: "code_insee" };
    if (aggregationLevel === "epci") return { geojson: epciGeoJSON, key: "code_siren" };
    return { geojson: komGeoJSON, key: "code_insee" };
  }, [aggregationLevel, komGeoJSON, epciGeoJSON, deptGeoJSON]);

  // 🎯 AJOUTÉ : Écoute de la fin de rendu effectif par le GPU (événement idle de MapLibre) via prop locale
  useEffect(() => {
    const mapRaw = mapInstance?.current || mapInstance?.default;
    if (!mapRaw || !currentContext.geojson || !data) return;

    const map = (typeof mapRaw.getMap === 'function' ? mapRaw.getMap() : mapRaw) as any;

    const handleMapIdle = () => {
      requestAnimationFrame(() => {
        setIsLoading(false); // Utilisation de la prop locale
      });
      map.off('idle', handleMapIdle);
    };

    if (map.isStyleLoaded() && map.isIdle()) {
      handleMapIdle();
    } else {
      map.on('idle', handleMapIdle);
    }

    return () => {
      map.off('idle', handleMapIdle);
    };
  }, [currentContext.geojson, data, mapInstance, setIsLoading]);

  // 2. Expression de couleur calculée pour le GPU
  const colorMatchExpression = useMemo(() => {
    const { geojson, key } = currentContext;
    if (!geojson || !data || !selectedYear) return '#e2e8f0';

    const expression: any[] = ['match', ['get', key]];
    const yearStr = String(selectedYear);
    const yearData = data.years[yearStr];

    if (yearData?.byKommune) {
      Object.keys(yearData.byKommune).forEach((formattedKey) => {
        const geoJSONCode = aggregationLevel === "commune"
          ? String(formattedKey).padStart(5, '0')
          : String(formattedKey).trim();

        const color = getRiskColor(formattedKey as KommuneNr);
        expression.push(geoJSONCode, color);
      });
    }

    expression.push('rgba(0,0,0,0)');
    return expression;
  }, [currentContext, data, selectedYear, aggregationLevel, selectedDistribution, getRiskColor, cache]);

  // 3. Gestion robuste des contours de sélection via l'ID numérique injecté
  useEffect(() => {
    const mapRaw = mapInstance?.current || mapInstance?.default;
    const { geojson, key } = currentContext;
    if (!mapRaw || !geojson) return;
    const map = (typeof mapRaw.getMap === 'function' ? mapRaw.getMap() : mapRaw) as any;
    if (!map?.isStyleLoaded()) return;

    const findFeatureIds = (code: string | null) => {
      if (!code) return [];
      const target = String(code).trim();
      return geojson.features
        .filter((ft: any) => {
          const c = aggregationLevel === "commune"
            ? String(ft.properties[key]).padStart(5, '0')
            : String(ft.properties[key]).trim();
          return c === target;
        })
        .map((ft: any) => ft.id);
    };

    const prevIds = findFeatureIds(prevSelectedRef.current);
    const nextIds = findFeatureIds(selectedKommune);

    prevIds.forEach((id: number) => {
      try { map.setFeatureState({ source: 'dynamic-source', id }, { selected: false }); } catch { }
    });

    nextIds.forEach((id: number) => {
      try { map.setFeatureState({ source: 'dynamic-source', id }, { selected: true }); } catch { }
    });

    prevSelectedRef.current = selectedKommune || null;
  }, [selectedKommune, mapInstance, currentContext, aggregationLevel]);

  if (!currentContext.geojson) return null;

  const layerStyle: any = {
    id: 'dynamic-layer',
    type: 'fill',
    paint: {
      'fill-color': colorMatchExpression,
      'fill-opacity': 0.8,
    }
  };

  const borderStyle: any = {
    id: 'dynamic-border-layer',
    type: 'line',
    paint: {
      'line-color': ['case', ['to-boolean', ['feature-state', 'selected']], '#000000', '#8a8a8a'],
      'line-width': ['case', ['to-boolean', ['feature-state', 'selected']], 1.5, 0.06],
      'line-opacity': ['case', ['to-boolean', ['feature-state', 'selected']], 1.0, 0.15]
    }
  };

  const deptBorderStyle: any = {
    id: 'dept-border-layer',
    type: 'line',
    layout: {
      'visibility': showDeptBorders ? 'visible' : 'none'
    },
    paint: { 'line-color': '#474747', 'line-width': 0.3, 'line-opacity': 0.25 }
  };

  const regBorderStyle: any = {
    id: 'reg-border-layer',
    type: 'line',
    layout: {
      'visibility': showRegBorders ? 'visible' : 'none'
    },
    paint: { 'line-color': '#474747', 'line-width': 0.7, 'line-opacity': 0.4 }
  };

  return (
    <>
      <Source key={aggregationLevel} id="dynamic-source" type="geojson" data={currentContext.geojson}>
        <Layer {...layerStyle} />
        <Layer {...borderStyle} />
      </Source>

      {deptGeoJSON && (
        <Source id="dept-source" type="geojson" data={deptGeoJSON}>
          <Layer {...deptBorderStyle} />
        </Source>
      )}

      {regGeoJSON && (
        <Source id="reg-source" type="geojson" data={regGeoJSON}>
          <Layer {...regBorderStyle} />
        </Source>
      )}

      <div className="mapLayerOverlayControl">
        <label className="overlayControlItem">
          <input
            type="checkbox"
            checked={showDeptBorders}
            onChange={(e) => setShowDeptBorders(e.target.checked)}
          />
          <span className="controlLabelText">
            {l({ fr: 'Départements', en: 'Departments' })}
          </span>
        </label>
        <label className="overlayControlItem">
          <input
            type="checkbox"
            checked={showRegBorders}
            onChange={(e) => setShowRegBorders(e.target.checked)}
          />
          <span className="controlLabelText">
            {l({ fr: 'Régions', en: 'Regions' })}
          </span>
        </label>
      </div>
    </>
  );
}

export default KommuneLayer;