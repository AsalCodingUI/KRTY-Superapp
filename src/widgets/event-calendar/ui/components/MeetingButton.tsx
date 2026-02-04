"use client";

import { Button } from '@/components/ui';
import { logError } from "@/shared/lib/utils/logger";
import { RiFileCopyLine, RiVideoOnLine } from '@remixicon/react';
import { useState } from 'react';

interface MeetingButtonProps {
    meetingUrl: string;
    className?: string;
}

export function MeetingButton({ meetingUrl, className }: MeetingButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(meetingUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            logError('Failed to copy:', err);
        }
    };

    const handleJoin = () => {
        window.open(meetingUrl, '_blank');
    };

    return (
        <div className={className}>
            <div className="flex items-center gap-2">
                <Button
                    onClick={handleJoin}
                    className="flex-1 bg-surface-brand hover:bg-surface-brand-hover text-primary-fg"
                >
                    <RiVideoOnLine className="w-4 h-4 mr-2" />
                    Join with Google Meet
                </Button>
                <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg border border-border-border hover:bg-muted transition-colors"
                    title="Copy meeting link"
                >
                    <RiFileCopyLine className="w-4 h-4 text-content" />
                </button>
            </div>

            {copied && (
                <p className="text-xs text-success mt-2">
                    Link copied to clipboard!
                </p>
            )}

            <div className="mt-2">
                <p className="text-xs text-content-muted">
                    Your group call will be limited to 1 hour
                </p>
                <a
                    href={meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline break-all"
                >
                    {meetingUrl}
                </a>
            </div>
        </div>
    );
}
