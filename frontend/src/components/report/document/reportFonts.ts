import { Font } from "@react-pdf/renderer";

import sourceSansPro400 from "@fontsource/source-sans-pro/files/source-sans-pro-latin-400-normal.woff";
import sourceSansPro400Italic from "@fontsource/source-sans-pro/files/source-sans-pro-latin-400-italic.woff";
import sourceSansPro600 from "@fontsource/source-sans-pro/files/source-sans-pro-latin-600-normal.woff";
import sourceSansPro600Italic from "@fontsource/source-sans-pro/files/source-sans-pro-latin-600-italic.woff";
import sourceSansPro700 from "@fontsource/source-sans-pro/files/source-sans-pro-latin-700-normal.woff";
import sourceSansPro700Italic from "@fontsource/source-sans-pro/files/source-sans-pro-latin-700-italic.woff";

import raleway700 from "@fontsource/raleway/files/raleway-latin-700-normal.woff";

Font.register({
    family: "Source Sans Pro",
    fonts: [
        {
            src: sourceSansPro400,
            fontWeight: 400,
            fontStyle: "normal",
        },
        {
            src: sourceSansPro400Italic,
            fontWeight: 400,
            fontStyle: "italic",
        },
        {
            src: sourceSansPro600,
            fontWeight: 600,
            fontStyle: "normal",
        },
        {
            src: sourceSansPro600Italic,
            fontWeight: 600,
            fontStyle: "italic",
        },
        {
            src: sourceSansPro700,
            fontWeight: 700,
            fontStyle: "normal",
        },
        {
            src: sourceSansPro700Italic,
            fontWeight: 700,
            fontStyle: "italic",
        },
    ],
});

Font.register({
    family: "Raleway",
    fonts: [
        {
            src: raleway700,
            fontWeight: 700,
        },
    ],
});