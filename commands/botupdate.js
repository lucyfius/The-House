const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botupdate')
        .setDescription('📢 See what\'s new with the bot'),

    async execute(interaction) {
        const updateEmbed = new EmbedBuilder()
            .setTitle('🚀 Bot Updates')
            .setColor('#00FF00')
            .setDescription(`
**Latest Updates (v1.1.0)**

🎰 **Raffle System Improvements**
• New flexible duration system (e.g., "30s", "5m", "2h", "1d")
• New \`/raffle leave\` command to exit active raffles
• Rate limiting for leave command to prevent spam
• Clear feedback messages when leaving
• Auto-updating entry count display
• Reliable raffle end timer system
• Better error handling for edge cases

🎲 **Betting System Enhancements**
• Auto-expiring betting challenges
• Improved winner verification
• Better challenge state management
• Enhanced betting round validation
• Clearer betting feedback messages

🔧 **Technical Updates**
• Periodic checks for expired raffles
• Database consistency checks
• Entry validation improvements
• Better error handling
• Improved stability
• Memory optimizations
• Enhanced logging system
• Sequelize model improvements

📊 **Admin Features**
• Enhanced logging capabilities
• Better command feedback
• Improved error messages
• Better state management
• Enhanced permission checks

📅 Last Updated: ${new Date().toLocaleDateString()}
            `)
            .setFooter({ text: 'Thanks for using our bot!' })
            .setTimestamp();

        await interaction.reply({ embeds: [updateEmbed] });
    }
}; 