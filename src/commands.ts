import {
    CommandInteraction,
    REST,
    Routes,
    SlashCommandBuilder,
    ChannelType,
} from 'discord.js';
import { getVoiceConnections, joinVoiceChannel } from '@discordjs/voice';
import { Commands, BotSettings } from './typedef';

export const commands: Commands = {
    ping: (interaction: CommandInteraction) => {
        interaction.reply('Pong!');
    },
    connect: async (interaction: CommandInteraction) => {
        const channelId =
            interaction.options.get('channel')?.value?.toString() || '';
        const voiceChannel = interaction.guild?.channels.cache.get(channelId);

        if (voiceChannel) {
            if (!interaction.guild || !interaction.guildId) return;
            
            joinVoiceChannel({
                channelId,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            interaction.reply({
                content: `🟢 ボイスチャンネル（\`${voiceChannel.name}\`）に接続しました。`,
                ephemeral: true,
            });
        } else {
            interaction.reply({
                content: '⚠ 指定されたボイスチャンネルが存在しません。',
                ephemeral: true,
            });
        }
    },
    disconnect: (interaction: CommandInteraction) => {
        if (!interaction.guildId) return;
        
        const voiceConnection = getVoiceConnections().get(interaction.guildId);
        if (voiceConnection) {
            voiceConnection.destroy();
            interaction.reply({
                content: '🔴 ボイスチャンネルから切断しました。',
                ephemeral: true,
            });
        } else {
            interaction.reply({
                content: '⚠ 接続中のボイスチャンネルが存在しません。',
                ephemeral: true,
            });
        }
    },
};

export async function registSlashCommands(settings: BotSettings) {
    const rest = new REST({ version: '10' }).setToken(settings.token);

    try {
        await rest.put(Routes.applicationCommands(settings.id), {
            body: [
                new SlashCommandBuilder()
                    .setName('ping')
                    .setDescription('🔌 疎通確認')
                    .toJSON(),
                new SlashCommandBuilder()
                    .setName('connect')
                    .setDescription('🟢 ボイスチャンネルへ接続')
                    .addChannelOption((option) =>
                        option
                            .setName('channel')
                            .setDescription('接続先ボイスチャンネルを選択')
                            .setRequired(true)
                            .addChannelTypes(ChannelType.GuildVoice)
                    )
                    .toJSON(),
                new SlashCommandBuilder()
                    .setName('disconnect')
                    .setDescription('🔴 ボイスチャンネルから切断')
                    .toJSON(),
            ],
        });
    } catch (e) {
        console.error(e);
    }
}
