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

🎭 **Role Management**
• Reaction roles system
• Auto-role assignment
• Role removal on unreact
• Multiple roles per message

🎰 **Enhanced Raffle System**
• Anti-spam protection
• Rate limiting
• Raid prevention
• Better error handling

🎲 **Improved Betting**
• Automatic bet expiration
• Challenge system
• Winner verification
• Unit tracking

🔧 **Technical Updates**
• Performance optimizations
• Better error handling
• Improved stability
• Memory usage optimizations

📊 **Admin Features**
• Enhanced logging
• Better command feedback
• Improved permissions
• Server management tools

📅 Last Updated: ${new Date().toLocaleDateString()}
            `)
            .setFooter({ text: 'Thanks for using our bot!' })
            .setTimestamp();

        await interaction.reply({ embeds: [updateEmbed] });
    }
}; 