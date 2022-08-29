import { createReadStream, createWriteStream, existsSync } from 'fs';
import { REST, Routes, SlashCommandBuilder, ChannelType } from 'discord.js';
import {
    AudioPlayerStatus,
    createAudioResource,
    getVoiceConnections,
    joinVoiceChannel,
    StreamType,
} from '@discordjs/voice';
import ytdl from 'discord-ytdl-core';
import { Commands, BotSettings } from './typedef';
import { Bot } from './bot';
import internal from 'stream';

export const commands: Commands = {
    /**
     * Ping Command
     *      Used to check bot communication.
     */
    ping: (interaction) => {
        interaction.reply('Pong!');
    },

    /**
     * Connect Command
     *      Used to connect a bot to a voice channel.
     */
    connect: (interaction, self) => {
        const channelId = interaction.options.get('channel')?.value! as string;
        const voiceChannel = interaction.guild?.channels.cache.get(channelId);

        let content = null;

        if (voiceChannel) {
            if (!interaction.guild || !interaction.guildId) return;

            joinVoiceChannel({
                channelId,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            content = `🟢 ボイスチャンネル（\`${voiceChannel.name}\`）に接続しました。`;

            _play(interaction.guildId, self);
        } else {
            content = '⚠ 指定されたボイスチャンネルが存在しません。';
        }

        interaction.reply({ content, ephemeral: true });
    },

    /**
     * Disconnect Command
     *      Used to disconnect the bot from the voice channel.
     */
    disconnect: (interaction) => {
        if (!interaction.guildId) return;

        let content = null;

        const voiceConnection = getVoiceConnections().get(interaction.guildId);
        if (voiceConnection) {
            voiceConnection.destroy();

            content = '🔴 ボイスチャンネルから切断しました。';
        } else {
            content = '⚠ 接続中のボイスチャンネルが存在しません。';
        }

        interaction.reply({ content, ephemeral: true });
    },

    play: (interaction, self) => {
        if (!interaction.guildId) return;

        let content = null;

        const voiceConnection = getVoiceConnections().get(interaction.guildId);
        if (voiceConnection) {
            const url = interaction.options.get('url')?.value! as string;
            if (url && ytdl.validateURL(url)) {
                const hash = url.match(/[\w-]{11}/);
                if (hash) {
                    self.musicQueue.unshift(hash[0]);
                    _download(hash[0]);

                    content = `🎵 楽曲をキューに追加しました。\nhttps://www.youtube.com/watch?v=${hash}`;
                } else {
                    content = '⚠ 指定された URL の形式が正しくありません。';
                }
            } else {
                content = '⚠ YouTube の URL を指定してください';
            }
        } else {
            content = '⚠ 接続中のボイスチャンネルが存在しません。';
        }

        interaction.reply({ content, ephemeral: true });
    },

    /**
     * Pause Command
     *      Used to pause music playback.
     */
    pause: (interaction, self) => {
        if (!interaction.guildId) return;

        let content = null;

        const voiceConnection = getVoiceConnections().get(interaction.guildId);
        if (voiceConnection) {
            if (self.isPlaying) {
                self.player.pause();
                content = '⏯ 再生中の楽曲を一時停止しました。';
            } else {
                self.player.unpause();
                content = '⏯ 一時停止中の楽曲を再開しました。';
            }
        } else {
            content = '⚠ 接続中のボイスチャンネルが存在しません。';
        }

        interaction.reply({ content, ephemeral: true });
    },

    /**
     * Skip Command
     *      Used to skip the current music.
     */
    skip: (interaction, self) => {
        if (!interaction.guildId) return;

        let content = null;

        const voiceConnection = getVoiceConnections().get(interaction.guildId);
        if (voiceConnection) {
            self.player.stop();

            content = '⏭️ 再生中の楽曲をスキップしました。';
        } else {
            content = '⚠ 接続中のボイスチャンネルが存在しません。';
        }

        interaction.reply({ content, ephemeral: true });
    },
};

/**
 * Register the command with the server
 *
 * @param settings BotSettings
 */
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
                new SlashCommandBuilder()
                    .setName('play')
                    .setDescription('🎵 URLを指定して音楽を再生')
                    .addStringOption((option) =>
                        option
                            .setName('url')
                            .setDescription('YouTube URL or hash')
                            .setRequired(true)
                    )
                    .toJSON(),
                new SlashCommandBuilder()
                    .setName('pause')
                    .setDescription('⏯ 再生中の曲を一時停止 / 一時停止中の曲を再開')
                    .toJSON(),
                new SlashCommandBuilder()
                    .setName('skip')
                    .setDescription('⏭️ 現在の曲をスキップ')
                    .toJSON(),
            ],
        });
    } catch (e) {
        console.log('[ERROR]', e);
    }
}

async function _play(guildId: string, self: Bot) {
    const voiceConnection = getVoiceConnections().get(guildId);
    if (!voiceConnection) return;

    voiceConnection.subscribe(self.player);

    const stream = await _stream(self);
    if (!stream) return;

    const resource = createAudioResource(stream, {
        inputType: StreamType.WebmOpus,
        inlineVolume: true,
    });
    resource.volume?.setVolume(self.volume);

    self.player.play(resource);

    self.player.removeAllListeners();

    self.player.on('error', (e) => {
        console.log(
            '[WARN]',
            `${e.message} with resource ${e.resource.metadata}`
        );
        _play(guildId, self);
    });

    self.player.on(AudioPlayerStatus.Playing, () => {
        self.isPlaying = true;
        _download(self.musicQueue[0]);
    });

    self.player.on(AudioPlayerStatus.Paused, () => {
        self.isPlaying = false;
    });

    self.player.on(AudioPlayerStatus.Idle, () => {
        _play(guildId, self);
    });
}

async function _stream(self: Bot): Promise<internal.Readable | undefined> {
    const hash = self.getNextMusicHash();
    if (!hash) return;

    try {
        const filepath = await _download(hash);
        return createReadStream(filepath);
    } catch (e) {
        console.log('[WARN]', e);
        return _stream(self);
    }
}

function _download(hash: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const BASE_URL = 'https://www.youtube.com/watch';
        const url = `${BASE_URL}?v=${hash}`;

        let filepath: string = `./mp3/cache/${hash}.mp3`;
        if (!existsSync(filepath)) {
            console.log('[INFO]', `download: ${url}`);

            const ws = createWriteStream(filepath);
            ytdl(url, {
                filter: 'audioonly',
                opusEncoded: false,
                fmt: 'mp3',
                encoderArgs: ['-af', 'loudnorm'],
            })
                .on('end', () => {
                    resolve(filepath);
                })
                .on('error', (e) => {
                    reject(e);
                })
                .pipe(ws);
        } else {
            resolve(filepath);
        }
    });
}
