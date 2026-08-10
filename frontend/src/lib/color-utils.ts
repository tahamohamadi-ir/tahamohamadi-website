/**
 * Converts a HEX color string to an HSL formatted string suitable for CSS variables.
 * For example: "#000000" -> "0 0% 0%"
 */
export function hexToHsl(hex: string): string {
    // Remove the hash if present
    hex = hex.replace(/^#/, "");

    // Parse the hex string
    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else {
        return "0 0% 0%"; // fallback to black on invalid hex
    }

    // Convert RGB to 0-1 scale
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    // Format for shadcn CSS variables: "h s% l%"
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Determines whether the text color should be black or white based on the background HEX color.
 * Returns the HSL value for either black or white.
 */
export function getContrastForegroundHsl(hex: string): string {
    hex = hex.replace(/^#/, "");

    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else {
        return "0 0% 100%"; // default to white
    }

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return HSL for white or black
    return luminance > 0.5 ? "0 0% 0%" : "0 0% 100%";
}
