const thesisTheme = {

    font: {
        body: "Source Sans Pro",
        heading: "Raleway",

        weight: {
            normal: 400,
            medium: 600,
            bold: 700,
        },

        size: 10,
    },

    c: {
        bg1: "#fff",
        bg2: "#eee",
        bg3: "#ddd",
        bg4: "#888",

        text: "#000",
        text2: "#888",

        accent: "#000",
        accent2: "#444",

        highlighted: "#eee",

        selected: "#4adbfb",
        selected2: "#05c1eb",

        fylke: "#396500",
        norge: "#2c0065",

        mapBorder: "#000",
    },

    x: {
        mg: 15,
        aside: 60,
    },

} as const;

const embeddedTheme = {
    c: {
        bg1: "#fefeff",
        bg2: "#e3eff3",
        bg3: "#cde5ec",
        bg4: "#63a9be",
    },
} as const;


import { viewMode } from "../../../hooks/getUrlParams";

export const reportTheme = {
    ...thesisTheme,
    c: {
        ...thesisTheme.c,
        ...viewMode === "embedded" ? embeddedTheme.c : {},
    },
} as const;