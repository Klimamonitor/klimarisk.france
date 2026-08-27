import { useState, useMemo, useRef, useEffect } from "react";
import useDataStore, { type KommuneNr } from "../../hooks/useDataStore";
import useLanguageStore from "../../hooks/useLanguageStore";
import { normalizeString } from "../../hooks/statistics";
import { getDataFileJSON } from "../../hooks/getPublicUrl";

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

interface SearchItem {
    id: string;
    name: string;
    normalized: string;
    deptCode: string;
    isEpci?: boolean;
}

export function MunicipalitySelect() {
    const {
        setSelectedKommune,
        selectedKommune,
        entityMapping,
        data,
        selectedYear,
    } = useDataStore();
    const { language } = useLanguageStore();

    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [allCommunes, setAllCommunes] = useState<SearchItem[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // 1. Chargement des communes depuis le GeoJSON
    useEffect(() => {
        getDataFileJSON("kommune.geojson").then((geo: any) => {
            if (geo?.features) {
                const list = geo.features.map((f: any) => {
                    const code = String(f.properties?.code_insee || f.properties?.insee || "").padStart(5, "0");
                    const name = f.properties?.nom_officiel || f.properties?.nom || f.properties?.name || "";
                    return {
                        id: code,
                        name,
                        normalized: normalizeString(name),
                        deptCode: code.startsWith("97") ? code.slice(0, 3) : code.slice(0, 2),
                        isEpci: false,
                    };
                });
                setAllCommunes(list);
            }
        });
    }, []);

    // 2. Constitution de la liste de recherche (Communes + EPCI)
    const searchPool = useMemo(() => {
        const pool: SearchItem[] = [];
        const seenIds = new Set<string>();

        // Ajout des entités présentes dans les données du store (incluant les EPCI)
        if (data?.years && selectedYear) {
            const yearStr = String(selectedYear);
            const yearData = data.years[yearStr];

            if (yearData?.byKommune) {
                Object.entries(yearData.byKommune).forEach(([id, item]: [string, any]) => {
                    const isEpci = String(id).length > 5;
                    const codeStr = String(id);
                    const deptCode = codeStr.startsWith("97") ? codeStr.slice(0, 3) : codeStr.slice(0, 2);
                    const name = item.klimarisk_name || item.name || id;

                    pool.push({
                        id,
                        name,
                        normalized: normalizeString(name),
                        deptCode: item.departement || deptCode,
                        isEpci,
                    });
                    seenIds.add(id);
                });
            }
        }

        // Ajout de toutes les communes du GeoJSON
        allCommunes.forEach((c) => {
            if (!seenIds.has(c.id)) {
                pool.push(c);
                seenIds.add(c.id);
            }
        });

        return pool;
    }, [data, selectedYear, allCommunes]);

    // 3. Filtrage en temps réel
    const suggestions = useMemo(() => {
        const q = normalizeString(query.trim());
        if (q.length < 2) return [];

        return searchPool
            .filter((k) => k.normalized.includes(q) || k.id.startsWith(q))
            .sort((a, b) => {
                if (a.normalized === q) return -1;
                if (b.normalized === q) return 1;
                const aStarts = a.normalized.startsWith(q);
                const bStarts = b.normalized.startsWith(q);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return a.name.localeCompare(b.name);
            })
            .slice(0, 15);
    }, [query, searchPool]);

    // 4. Synchronisation de la valeur affichée avec la commune sélectionnée
    useEffect(() => {
        if (!selectedKommune) {
            setQuery("");
        } else if (data?.years && selectedYear) {
            const yearStr = String(selectedYear);
            const item = data.years[yearStr]?.byKommune?.[String(selectedKommune)];
            if (item) {
                const name = item.klimarisk_name || item.name || selectedKommune;
                const codeStr = String(selectedKommune);
                const dCode = item.departement || (codeStr.startsWith("97") ? codeStr.slice(0, 3) : codeStr.slice(0, 2));
                setQuery(`${name} (${dCode})`);
            }
        }
    }, [selectedKommune, data, selectedYear]);

    // 5. Fermeture au clic extérieur
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (item: SearchItem) => {
        const targetEntity = (entityMapping && entityMapping[item.id]) ? entityMapping[item.id] : item.id;
        setSelectedKommune(targetEntity as KommuneNr);
        setIsOpen(false);
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            <input
                type="text"
                placeholder={
                    language === "en"
                        ? "Search a municipality or EPCI..."
                        : "Rechercher une commune ou un EPCI..."
                }
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                style={{
                    width: "100%",
                    maxWidth: "350px",
                    boxSizing: "border-box",
                    padding: "9px 12px",
                    fontSize: "0.88rem",
                    fontWeight: 500,
                    color: "#1e293b",
                    backgroundColor: "#ffffff",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "6px",
                    outline: "none",
                    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                }}
            />

            {/* Menu déroulant des suggestions */}
            {isOpen && suggestions.length > 0 && (
                <ul
                    style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        width: "100%",
                        maxWidth: "350px",
                        maxHeight: "220px",
                        overflowY: "auto",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        listStyle: "none",
                        margin: 0,
                        padding: "4px 0",
                        zIndex: 100,
                        boxSizing: "border-box",
                    }}
                >
                    {suggestions.map((k, i) => (
                        <li key={`${k.id}-${i}`} style={{ margin: 0, padding: 0 }}>
                            <button
                                type="button"
                                onClick={() => handleSelect(k)}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    border: "none",
                                    background: "none",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    fontSize: "0.85rem",
                                    color: "#1e293b",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    transition: "background-color 0.1s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#fff7ed";
                                    e.currentTarget.style.color = "#c2410c";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = "#1e293b";
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>{k.name}</span>
                                <span style={{ fontSize: "0.78rem", color: "#64748b", marginLeft: "8px" }}>
                                    {k.deptCode && `(${DEPARTEMENTS_MAP[k.deptCode] || k.deptCode})`}
                                    {k.isEpci && <span style={{ marginLeft: "4px", color: "#ea580c" }}>[EPCI]</span>}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default MunicipalitySelect;