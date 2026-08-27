const params = new URLSearchParams(window.location.search);


type ViewMode = "normal" | "embedded";

export const viewMode: ViewMode = params.has("embed") && params.get("embed") !== "false" ? "embedded" : "normal";