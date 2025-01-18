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
**Latest Updates (v1.0.0)**

🎰 **New Raffle System**
• Start fun raffles with prizes
• Pick lucky numbers to win
• Multiple winners support
• Auto-end timer system

🎲 **Betting Features**
• Winners can challenge each other
• Track your betting history
• Multiple bet types supported
• Auto-updating stats display

📊 **Statistics System**
• View your betting performance
• Filter by time periods
• Track win/loss ratios
• Detailed bet history

🔧 **Technical Improvements**
• Enhanced performance
• Better error handling
• Improved user feedback
• Automatic cleanup systems

📅 Last Updated: ${new Date().toLocaleDateString()}
            `)
            .setFooter({ text: 'Thanks for using our bot!' })
            .setTimestamp();

        await interaction.reply({ embeds: [updateEmbed] });
    }
}; 