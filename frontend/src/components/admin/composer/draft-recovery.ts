export const DRAFT_RECOVERY_STORAGE_PREFIX = "cms:composer:draft-recovery:";

export interface DraftRecoveryMarker {
    pageId: string;
    version: number;
    session: string;
}

function markerKey(pageId: string): string {
    return `${DRAFT_RECOVERY_STORAGE_PREFIX}${pageId}`;
}

export function writeDraftRecoveryMarker(marker: DraftRecoveryMarker): void {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(markerKey(marker.pageId), JSON.stringify(marker));
}

export function consumeDraftRecoveryMarker(pageId: string): DraftRecoveryMarker | null {
    if (typeof window === "undefined") return null;
    const key = markerKey(pageId);
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    sessionStorage.removeItem(key);
    try {
        const marker = JSON.parse(raw) as Partial<DraftRecoveryMarker>;
        if (marker.pageId !== pageId || typeof marker.version !== "number" || typeof marker.session !== "string") {
            return null;
        }
        return marker as DraftRecoveryMarker;
    } catch {
        return null;
    }
}

export function clearDraftRecoveryMarker(pageId: string): void {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(markerKey(pageId));
}
