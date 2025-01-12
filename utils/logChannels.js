const LOG_CHANNELS = {
    MOD_ACTIONS: 'mod-logs',        // Bans, kicks, warns, etc.
    USER_UPDATES: 'user-logs',      // Nickname changes, avatar updates, etc.
    MESSAGE_LOGS: 'message-logs',   // Deletions, edits, bulk deletes
    JOIN_LEAVE: 'join-logs',        // Member joins, leaves, invites
    VOICE_LOGS: 'voice-logs',       // Voice channel activity
    ROLE_LOGS: 'role-logs',         // Role changes, permission updates
    SERVER_LOGS: 'server-logs'      // Server setting changes, emoji updates, etc.
};

module.exports = { LOG_CHANNELS }; 