import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "GuestSnapper - Wedding Photo Gallery",
        short_name: "GuestSnapper",
        description:
            "Create beautiful wedding photo galleries that guests can easily access and contribute to. Share memories, collect photos, and preserve your special moments.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2563eb",
        icons: [
            {
                src: "/favicon.ico",
                sizes: "any",
                type: "image/x-icon"
            }
        ],
        categories: ["photography", "lifestyle", "social"],
        orientation: "portrait-primary"
    }
}
