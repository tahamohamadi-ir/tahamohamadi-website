'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface ConflictDialogProps {
    /** Whether the dialog is open. */
    open: boolean;
    /** Callback when the user wants to close the dialog without action. */
    onOpenChange: (open: boolean) => void;
    /** Callback to reload the latest version from the server (discard local changes). */
    onReload: () => void;
    /** Callback to force save local changes, overriding the server version. */
    onForceSave: () => void;
    /** Whether a reload or force-save operation is in progress. */
    isLoading?: boolean;
}

/**
 * ConflictDialog — shown when a save returns HTTP 409 (optimistic lock conflict).
 *
 * Explains that the content was modified by another user or session and provides
 * two resolution options:
 * - **Reload**: Discard local changes and fetch the latest version from the server.
 * - **Force Save**: Override the server version with local changes.
 */
export function ConflictDialog({
    open,
    onOpenChange,
    onReload,
    onForceSave,
    isLoading = false,
}: ConflictDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
                        <DialogTitle>Conflict Detected</DialogTitle>
                    </div>
                    <DialogDescription>
                        This content was modified by another user or session since you started editing. Your
                        changes cannot be saved without resolving this conflict.
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-md border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Choose how to resolve:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>
                            <span className="font-medium">Reload</span> — Discard your local changes and load the
                            latest version from the server.
                        </li>
                        <li>
                            <span className="font-medium">Force Save</span> — Override the server version with
                            your current changes.
                        </li>
                    </ul>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onReload} disabled={isLoading}>
                        Reload
                    </Button>
                    <Button variant="destructive" onClick={onForceSave} disabled={isLoading}>
                        Force Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
