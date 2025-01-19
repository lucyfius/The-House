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
            await interaction.reply({
                content: 'You need Administrator permissions to use this command.',
                flags: ['Ephemeral']
            });
            return;
        }

        const messageId = interaction.options.getString('messageid');
        const pairsString = interaction.options.getString('pairs');
        const note = interaction.options.getString('note');

        try {
            console.log('Debug - Starting command execution');
            console.log('Debug - Message ID:', messageId);
            console.log('Debug - Pairs String:', pairsString);
            
            const message = await interaction.channel.messages.fetch(messageId);
            console.log('Debug - Message found:', !!message);

            if (!message) {
                await interaction.reply({
                    content: '❌ Message not found! Make sure:\n1. You\'re using this command in the same channel as the message\n2. The message ID is correct\n3. The message hasn\'t been deleted',
                    flags: ['Ephemeral']
                });
                return;
            }

            // Parse emoji-role pairs with better error handling
            const pairs = [];
            const rawPairs = pairsString.split(',').map(p => p.trim());
            console.log('Debug - Raw pairs:', rawPairs);

            for (const pair of rawPairs) {
                console.log('Debug - Processing pair:', pair);
                const [emojiInput, roleId] = pair.split(/\s+/);
                console.log('Debug - Split pair:', { emojiInput, roleId });

                if (!emojiInput || !roleId) {
                    console.log('Debug - Invalid format detected:', { emojiInput, roleId });
                    await interaction.reply({
                        content: `❌ Invalid format in pair: "${pair}"\nExample format: \`:white_check_mark: @Role\`\n\nMake sure:\n1. The emoji has colons (:emoji:)\n2. There's a space between emoji and role\n3. The role is @mentioned`,
                        flags: ['Ephemeral']
                    });
                    return;
                }

                // Add emoji validation
                if (!emojiInput.startsWith(':') || !emojiInput.endsWith(':')) {
                    console.log('Debug - Invalid emoji format:', emojiInput);
                    await interaction.reply({
                        content: `❌ Invalid emoji format: "${emojiInput}"\nMake sure to include colons, like: :white_check_mark:`,
                        flags: ['Ephemeral']
                    });
                    return;
                }

                console.log('Debug - Raw roleId:', roleId);
                console.log('Debug - Role mention format:', roleId.match(/<@&\d+>/));

                const cleanRoleId = roleId.replace(/[<@&>]/g, '');
                console.log('Debug - Cleaned roleId:', cleanRoleId); // Debug log

                const role = await interaction.guild.roles.fetch(cleanRoleId);
                console.log('Debug - Found role:', role?.name || 'No role found'); // Debug log

                if (!role) {
                    await interaction.reply({
                        content: `❌ Role not found! Make sure you're @mentioning the role properly.\n\nReceived: ${roleId}\nCleaned ID: ${cleanRoleId}`,
                        flags: ['Ephemeral']
                    });
                    return;
                }

                // Store the emoji code directly
                const emoji = {
                    name: emojiInput.replace(/:/g, ''), // Remove colons for internal use
                    toString: () => emojiInput
                };

                // Store emoji information with the original code
                pairs.push({
                    emoji: emojiInput,  // Store with colons (e.g., :white_check_mark:)
                    emojiString: emojiInput,
                    roleId: role.id
                });

                // Add reaction to message using the Unicode emoji
                try {
                    const unicodeEmoji = {
                        'white_check_mark': '✅',
                        'x': '❌',
                        // Add more mappings as needed
                    }[emoji.name] || emoji.name;

                    await message.react(unicodeEmoji);
                } catch (error) {
                    console.error('Error adding reaction:', error);
                    await interaction.reply({
                        content: `❌ Failed to add reaction. Make sure you're using a valid emoji code like :white_check_mark:`,
                        flags: ['Ephemeral']
                    });
                    return;
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
                flags: ['Ephemeral']
            });
        } catch (error) {
            console.error('Error creating reaction roles:', error);
            await interaction.reply({
                content: '❌ Error setting up reaction roles. Make sure you\'re using the format: `/reactionrole messageid:123 pairs::white_check_mark: @Role`',
                flags: ['Ephemeral']
            });
        }
    }
}; 