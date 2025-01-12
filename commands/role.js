const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage roles for members')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to a member')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The member to add the role to')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from a member')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The member to remove the role from')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const target = interaction.options.getMember('target');
        const role = interaction.options.getRole('role');

        // Check if the role is manageable
        if (!role.editable) {
            return interaction.reply({
                content: 'I cannot manage this role. It might be higher than my role.',
                ephemeral: true
            });
        }

        try {
            if (subcommand === 'add') {
                await target.roles.add(role);
                await interaction.reply({
                    content: `Successfully added role ${role.name} to ${target.user.tag}`,
                    ephemeral: true
                });
            } else if (subcommand === 'remove') {
                await target.roles.remove(role);
                await interaction.reply({
                    content: `Successfully removed role ${role.name} from ${target.user.tag}`,
                    ephemeral: true
                });
            }
        } catch (error) {
            await interaction.reply({
                content: 'Failed to manage roles. Check my permissions and role hierarchy.',
                ephemeral: true
            });
        }
    },
}; 