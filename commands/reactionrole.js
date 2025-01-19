const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const ReactionRole = require('../models/ReactionRole');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Add reaction roles to an existing message')
        .addStringOption(option =>
            option.setName('messageid')
                .setDescription('💬 Right-click message → Copy ID (Enable Developer Mode in Settings)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('pairs')
                .setDescription('✨ Format: :emoji: @Role1, 🎮 @Role2 (Add space between emoji & role)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('note')
                .setDescription('📝 Optional: Add instructions for users (e.g., "React to get roles!")')),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({
                content: 'You need Administrator permissions to use this command.',
                ephemeral: true
            });
        }

        const messageId = interaction.options.getString('messageid');
        const pairsString = interaction.options.getString('pairs');
        const note = interaction.options.getString('note');

        try {
            const message = await interaction.channel.messages.fetch(messageId);
            if (!message) {
                return interaction.reply({
                    content: '❌ Message not found! Make sure you\'re using this command in the same channel as the message.',
                    ephemeral: true
                });
            }

            // Parse emoji-role pairs with better error handling
            const pairs = [];
            const rawPairs = pairsString.split(',').map(p => p.trim());

            for (const pair of rawPairs) {
                const [emojiInput, roleId] = pair.split(/\s+/);
                if (!emojiInput || !roleId) {
                    return interaction.reply({
                        content: `❌ Invalid format in pair: "${pair}"\nFormat should be: :emoji: @Role`,
                        ephemeral: true
                    });
                }

                // Handle Discord emoji format
                let emoji;
                if (emojiInput.startsWith(':') && emojiInput.endsWith(':')) {
                    // Get emoji from guild or client
                    const emojiName = emojiInput.slice(1, -1); // Remove colons
                    emoji = interaction.client.emojis.cache.find(e => e.name === emojiName) ||
                           interaction.guild.emojis.cache.find(e => e.name === emojiName);
                    
                    if (!emoji) {
                        return interaction.reply({
                            content: `❌ Emoji "${emojiName}" not found. Make sure the bot has access to this emoji.`,
                            ephemeral: true
                        });
                    }
                } else {
                    emoji = emojiInput;
                }

                const cleanRoleId = roleId.replace(/[<@&>]/g, '');
                const role = await interaction.guild.roles.fetch(cleanRoleId);

                if (!role) {
                    return interaction.reply({
                        content: `❌ Role not found for emoji ${emojiInput}`,
                        ephemeral: true
                    });
                }

                // Store both the emoji ID/name and the full emoji for reactions
                pairs.push({
                    emoji: emoji.id || emoji,
                    emojiString: emoji.toString(),
                    roleId: role.id
                });

                // Add reaction to message
                try {
                    await message.react(emoji);
                } catch (error) {
                    console.error('Error adding reaction:', error);
                    return interaction.reply({
                        content: `❌ Failed to add reaction ${emojiInput}. Make sure it's a valid emoji or that the bot has access to it.`,
                        ephemeral: true
                    });
                }
            }

            // Delete any existing reaction role setup for this message
            await ReactionRole.destroy({
                where: {
                    messageId: messageId,
                    guildId: interaction.guild.id
                }
            });

            // Create new reaction role setup
            await ReactionRole.create({
                guildId: interaction.guild.id,
                messageId: messageId,
                channelId: interaction.channel.id,
                emojiRolePairs: pairs
            });

            const embed = new EmbedBuilder()
                .setTitle('✅ Reaction Roles Setup Complete')
                .setColor('#00ff00')
                .setDescription(`Successfully set up ${pairs.length} reaction role${pairs.length > 1 ? 's' : ''} for [this message](${message.url})`)
                .addFields(
                    pairs.map(pair => ({
                        name: `${pair.emojiString} Role`,
                        value: `<@&${pair.roleId}>`,
                        inline: true
                    }))
                );

            if (note) {
                embed.addFields({ name: 'Note', value: note });
            }

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        } catch (error) {
            console.error('Error creating reaction roles:', error);
            await interaction.reply({
                content: '❌ Failed to set up reaction roles. Make sure:\n1. The message ID is correct\n2. The emojis are valid\n3. The roles are properly mentioned\n4. The bot has permission to manage roles',
                ephemeral: true
            });
        }
    }
}; 