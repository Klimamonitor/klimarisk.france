import './Map.css';
import { Map as MapGl, NavigationControl, type MapLayerMouseEvent } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import KommuneLayer from "./KommuneLayer";
import KommuneSearch from '../../components/KommuneSearch';
import { useRef, useEffect, useState, useMemo } from 'react';
import useDataStore, { type KommuneNr } from '../../hooks/useDataStore';
import { getDataFileJSON } from '../../hooks/getPublicUrl';
import { LoadingScreen } from '../../../LoadingScreen';

const NO_BACKGROUND_STYLE: any = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f8f9fa' } }]
};

function updateBoundsWithGeometry(geometry: any, currentBounds: [[number, number], [number, number]]) {
  let [minX, minY] = currentBounds[0];
  let [maxX, maxY] = currentBounds[1];
  const coords = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat(1);
  for (const ring of coords) {
    for (const [lng, lat] of ring) {
      if (lng < minX) minX = lng;
      if (lat < minY) minY = lat;
      if (lng > maxX) maxX = lng;
      if (lat > maxY) maxY = lat;
    }
  }
  return [[minX, minY], [maxX, maxY]] as [[number, number], [number, number]];
}

function Map() {
  const mapRef = useRef<any>(null);
  const { selectedKommune, setSelectedKommune, entityMapping, aggregationLevel, selectedDistribution } = useDataStore();

  const [komGeoJSON, setKomGeoJSON] = useState<any>(null);
  const [epciGeoJSON, setEpciGeoJSON] = useState<any>(null);
  const [deptGeoJSON, setDeptGeoJSON] = useState<any>(null);

  const [mapLoading, setMapLoading] = useState<boolean>(true);

  useEffect(() => {
    getDataFileJSON('kommune.geojson').then(setKomGeoJSON).catch(console.error);
    getDataFileJSON('epci.geojson').then(setEpciGeoJSON).catch(console.error);
    getDataFileJSON('departement.geojson').then(setDeptGeoJSON).catch(console.error);
  }, []);

  const currentContext = useMemo(() => {
    if (aggregationLevel === "departement") return { geojson: deptGeoJSON };
    if (aggregationLevel === "epci") return { geojson: epciGeoJSON };
    return { geojson: komGeoJSON };
  }, [aggregationLevel, komGeoJSON, epciGeoJSON, deptGeoJSON]);

  const layerUpdateKey = useMemo(() => {
    const distId = selectedDistribution ? `${selectedDistribution.type}-${(selectedDistribution as any).key || ''}` : 'risk';
    return `${aggregationLevel}-${distId}`;
  }, [aggregationLevel, selectedDistribution]);

  // Dans Map.tsx, remplacez handleMapIdle par :

  const handleMapIdle = () => {
    if (mapRef.current) {
      const mapInstance = mapRef.current.getMap ? mapRef.current.getMap() : mapRef.current;
      const canvas = mapInstance?.getCanvas ? mapInstance.getCanvas() : null;
      if (canvas) {
        try {
          const img = canvas.toDataURL("image/jpeg", 0.85);
          (window as any).__currentMapSnapshot = img;

          const distKey = (selectedDistribution as any)?.key || "overview";
          const savedMaps = JSON.parse(sessionStorage.getItem("klimarisk_maps") || "{}");
          savedMaps[distKey] = img;
          savedMaps["overview"] = img;
          sessionStorage.setItem("klimarisk_maps", JSON.stringify(savedMaps));
        } catch (e) {
          console.warn("Capture canvas:", e);
        }
      }
    }
  };

  // GESTION DU ZOOM ET DE LA PRISE DE PHOTO
  useEffect(() => {
    const { geojson } = currentContext;
    if (!selectedKommune || !mapRef.current || !geojson?.features) return;

    const mapInstance = mapRef.current.getMap ? mapRef.current.getMap() : mapRef.current;
    const target = String(selectedKommune).trim();

    let bounds: [[number, number], [number, number]] = [[Infinity, Infinity], [-Infinity, -Infinity]];
    let hasFeatures = false;

    geojson.features.forEach((f: any) => {
      if (!f.properties || !f.geometry) return;

      const props = f.properties;
      const possibleIds = [props.code_insee, props.code, props.insee, props.code_siren, props.code_region];

      const isMatch = possibleIds.some(val => {
        if (!val) return false;
        const strVal = String(val).trim();
        if (aggregationLevel === "commune") return strVal.padStart(5, '0') === target;
        return strVal === target;
      });

      if (isMatch) {
        bounds = updateBoundsWithGeometry(f.geometry, bounds);
        hasFeatures = true;
      }
    });

    if (hasFeatures && bounds[0][0] !== Infinity) {
      const maxZoomLevel = aggregationLevel === "commune" ? 10 : aggregationLevel === "epci" ? 9 : 8;

      mapInstance.once('moveend', () => {
        setTimeout(() => {
          handleMapIdle();
        }, 500);
      });

      mapInstance.fitBounds(bounds, { padding: 40, maxZoom: maxZoomLevel, animate: true, duration: 1000 });
    }
  }, [selectedKommune, currentContext, aggregationLevel]);

  const onMapClick = (event: MapLayerMouseEvent) => {
    const features = event.target.queryRenderedFeatures(event.point, { layers: ['dynamic-layer'] });
    const clickedFeature = features?.[0];

    if (clickedFeature && clickedFeature.properties) {
      const props = clickedFeature.properties;
      let entityId = "";

      if (aggregationLevel === "departement") {
        entityId = String(props.code_insee || props.code || "").trim();
      } else if (aggregationLevel === "epci") {
        entityId = String(props.code_siren || "").trim();
      } else {
        entityId = String(props.code_insee || props.insee || "").padStart(5, '0');
      }

      if (entityId) {
        const targetEntity = aggregationLevel === "commune" ? (entityMapping[entityId] || entityId) : entityId;
        setSelectedKommune(targetEntity as KommuneNr);
      }
    }
  };

  return (
    <div className="mapContainer" style={{ position: 'relative', width: '100%', height: '100%' }}>

      {mapLoading && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          zIndex: 9999, pointerEvents: 'all'
        }}>
          <LoadingScreen />
        </div>
      )}

      <MapGl
        key="maplibre-pure-instance"
        ref={mapRef}
        style={{ width: '100%', height: '100%', position: 'relative' }}
        initialViewState={{ longitude: 2.2, latitude: 46.6, zoom: 5.5 }}
        maxZoom={12} minZoom={4}
        mapLib={maplibregl}
        mapStyle={NO_BACKGROUND_STYLE}
        interactiveLayerIds={['dynamic-layer']}
        onClick={onMapClick}
        {...({
          preserveDrawingBuffer: true,
          onIdle: handleMapIdle,
          onLoad: (e: any) => {
            (window as any).__mapInstance = e.target;
          }
        } as any)}
      >
        <KommuneSearch />
        <NavigationControl position="top-right" showCompass={false} />
        <KommuneLayer key={layerUpdateKey} setIsLoading={setMapLoading} />
      </MapGl>
    </div>
  );
}

export default Map;