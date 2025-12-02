import { Channel, Members } from "pusher-js";
import { useOnlineUsersList } from "./useOnlineUsersList";
import { useEffect, useState } from "react";
import { pusherClient } from "../libs/pusher";

/**
 * usePresenceSync - Synchronizes user presence status via Pusher
 * Manages subscription to presence channel and updates online user list in real-time
 *
 * This hook handles:
 * - Subscribing to Pusher presence channel
 * - Tracking when users join/leave
 * - Updating the online users store
 * - Cleanup on unmount
 */
const usePresenceSync = () => {
    const {
        setOnlineUsers,
        addOnlineUser,
        removeOnlineUser
    } = useOnlineUsersList();

    const [presenceChannel, setPresenceChannel] = useState<Channel | null>(null);

    useEffect(() => {
        let channelInstance = presenceChannel;

        // Subscribe to presence channel if not already subscribed
        if (!channelInstance) {
            channelInstance = pusherClient.subscribe('presence-messenger');
            setPresenceChannel(channelInstance);
        }

        /**
         * Handle successful subscription - receives initial member list
         */
        const handleSubscriptionSuccess = (members: Members) => {
            const memberIds: string[] = [];
            members.each((member: Record<string, any>) => {
                memberIds.push(member.id);
            });
            setOnlineUsers(memberIds);
        };

        /**
         * Handle new member joining the channel
         */
        const handleMemberJoined = (member: Record<string, any>) => {
            addOnlineUser(member.id);
        };

        /**
         * Handle member leaving the channel
         */
        const handleMemberLeft = (member: Record<string, any>) => {
            removeOnlineUser(member.id);
        };

        // Bind event handlers to Pusher events
        channelInstance.bind('pusher:subscription_succeeded', handleSubscriptionSuccess);
        channelInstance.bind("pusher:member_added", handleMemberJoined);
        channelInstance.bind("pusher:member_removed", handleMemberLeft);

        // Cleanup function - unbind events and unsubscribe
        return () => {
            if (presenceChannel) {
                presenceChannel.unbind('pusher:subscription_succeeded', handleSubscriptionSuccess);
                presenceChannel.unbind("pusher:member_added", handleMemberJoined);
                presenceChannel.unbind("pusher:member_removed", handleMemberLeft);
                pusherClient.unsubscribe('presence-messenger');
                setPresenceChannel(null);
            }
        }
    }, [presenceChannel, setOnlineUsers, addOnlineUser, removeOnlineUser]);
};

export default usePresenceSync;
