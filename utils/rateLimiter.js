const { Collection } = require('discord.js');

// Store command cooldowns
const cooldowns = new Collection();
// Store join attempts to prevent raids
const joinAttempts = new Collection();

// Cleanup old entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    cooldowns.sweep(time => now - time > 600000);
    joinAttempts.sweep(attempts => now - attempts.lastAttempt > 600000);
}, 600000);

module.exports = {
    checkRateLimit(userId, commandName, cooldownSeconds = 3) {
        const now = Date.now();
        const key = `${userId}-${commandName}`;
        const cooldownAmount = cooldownSeconds * 1000;

        if (cooldowns.has(key)) {
            const expirationTime = cooldowns.get(key) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return {
                    limited: true,
                    timeLeft: timeLeft.toFixed(1)
                };
            }
        }

        cooldowns.set(key, now);
        return { limited: false };
    },

    checkRaidPrevention(guildId, userId, maxAttempts = 3, timeWindow = 60) {
        const now = Date.now();
        const key = `${guildId}-${userId}`;
        
        const userAttempts = joinAttempts.get(key) || {
            count: 0,
            lastAttempt: now
        };

        // Reset count if outside time window
        if (now - userAttempts.lastAttempt > timeWindow * 1000) {
            userAttempts.count = 0;
        }

        userAttempts.count++;
        userAttempts.lastAttempt = now;
        joinAttempts.set(key, userAttempts);

        return userAttempts.count > maxAttempts;
    }
}; 