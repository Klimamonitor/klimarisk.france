import { StyleSheet } from "@react-pdf/renderer";
import { reportTheme as t } from "./reportTheme";


export const reportStyles = StyleSheet.create({
    page: {
        padding: 0,
        fontFamily: t.font.body,
        fontWeight: t.font.weight.normal,
        color: t.c.text,
        fontSize: t.font.size,
        backgroundColor: t.c.bg1,
    },

    pageNumber: {
        position: "absolute" as const,
        bottom: t.x.mg * 2,
        right: t.x.mg * 3.5,
        fontSize: t.font.size * .9,
        color: t.c.text2,
    },

    heading: {
        backgroundColor: t.c.bg2,
        width: "100%",
        height: 120,
        padding: t.x.mg * 3,
        paddingBottom: 0,
    },

    title: {
        fontFamily: t.font.heading,
        fontWeight: t.font.weight.bold,
        fontSize: t.font.size * 2.2,
        marginBottom: t.x.mg / 2,
        paddingRight: t.x.mg * 2.5,
    },

    section: {
        marginBottom: 16,
    },

    smallTitle: {
        fontWeight: t.font.weight.medium,
        fontSize: t.font.size * 1.2,
        paddingRight: t.x.mg * 2.5,
    },

    label: {
        // fontStyle: "italic" as const,
    },
    titleLabel: {
        fontWeight: t.font.weight.normal,
        fontSize: t.font.size * 1.8,
    },
    smallTitleLabel: {
        fontWeight: t.font.weight.normal,
        fontSize: t.font.size * 1.1,
    },

    score: {
        display: "flex" as const,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        fontFamily: t.font.body,
    },
    scoreVal: {
        width: t.font.size * 2,
        textAlign: "right" as const,
    },
    titleScoreVal: {
        width: t.font.size * 3.4,
        textAlign: "right" as const,
    },

    emph: {
        fontWeight: t.font.weight.medium,
    },

    description: {
        fontStyle: "italic" as const,
        fontSize: t.font.size * 0.9,
        paddingRight: t.x.mg * 2.5,
    },

    url: {
        fontStyle: "normal" as const,
    },

    ranking: {
        marginTop: t.font.size * .4,
    },

    sidebanner: {
        backgroundColor: t.c.bg2,
        height: 842,
        width: t.x.aside,
        zIndex: 9,
        position: "absolute" as const,
        top: 0,
        left: 0,
    },

    titlePage: {

        headingMargin: {
            height: t.x.mg * .5,
        },

        heading: {
            marginTop: 0,
        },

        titleScoreVal: {
            width: t.font.size * 4,
            textAlign: "right" as const,
        },

        navLink: {
            textDecoration: "none" as const,
            color: t.c.text,
        },

        chosen: {
            fontSize: t.font.size * 1.1,
        },
        chosenVal: {
            fontWeight: t.font.weight.medium,
            fontSize: t.font.size * 1.2,
        },

        metric: {
            display: "flex" as const,
            flexDirection: "row" as const,
            alignItems: "center" as const,
            gap: t.font.size / 2,
            marginTop: t.x.mg / 10,

            colorBox: {
                height: t.font.size * 1.2,
                aspectRatio: 1,
            },
            name: {

            },
        },
    },

    elementPage: {
        paddingTop: t.x.mg * 2,
        paddingBottom: t.x.mg * 3,

        heading: {
            backgroundColor: t.c.bg3,
            minHeight: 80,
            padding: t.x.mg / 2,
            margin: t.x.mg / 2,
            marginBottom: 0,
            marginTop: t.x.mg * -1.5,
            position: "relative" as const,
            display: "flex" as const,
            flexDirection: "row" as const,
        },

        headingColorBox: {
            width: t.x.aside - t.x.mg * 2,
            alignSelf: "stretch" as const,
            flexShrink: 0,
        },

        headingContent: {
            paddingTop: t.x.mg * 1.5,
            paddingBottom: t.x.mg * 0.5,
            marginLeft: t.x.mg * 2,
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: 0,
        },

        section: {
            marginLeft: t.x.aside,
            paddingTop: t.x.mg,
            paddingHorizontal: t.x.mg,
            position: "relative" as const,
            minHeight: t.x.aside,
        },

        colorBox: {
            height: t.x.aside - 2 * t.x.mg,
            aspectRatio: "1 / 1",
            position: "absolute" as const,
            top: t.x.mg,
            left: -t.x.aside + t.x.mg,
        },

        titleBox: {
            display: "flex" as const,
            flexDirection: "row" as const,
            justifyContent: "space-between" as const,
        },
    },

    documentation: {
        text: {
            fontSize: t.font.size * 1.1,
            marginTop: t.x.mg,
            marginLeft: t.x.aside + t.x.mg,
            marginRight: t.x.aside + t.x.mg,
            display: "flex" as const,
            flexDirection: "row" as const,
            alignItems: "flex-start" as const,
            justifyContent: "flex-start" as const,
            gap: t.x.mg / 2,
        },
        bullet: {
            borderRadius: 1000,
            aspectRatio: "1 / 1",
            backgroundColor: t.c.text,
            opacity: .7,
            width: t.font.size * .6,
            marginTop: t.font.size * .45,
        },
    },

});

// Triggers vite HMR updates in dev mode
export const reportStylesRevision = Date.now();