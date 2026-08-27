import type { Bookmark } from "@react-pdf/types";

declare module "@react-pdf/renderer" {
    interface TextProps {
        bookmark?: string | Bookmark;
    }
    interface ViewProps {
        bookmark?: string | Bookmark;
    }
}