"use client";

import usePresenceSync from "../hooks/usePresenceSync";

/**
 * PresenceMonitor Component
 *
 * Monitors and synchronizes user online presence status across the application.
 * This component doesn't render any UI - it only initializes and maintains
 * real-time presence tracking via Pusher.
 *
 * Should be mounted once at the application root level.
 */
const PresenceMonitor = () => {
    usePresenceSync();

    return null;
};

export default PresenceMonitor;
