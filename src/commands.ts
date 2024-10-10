import { createReadStream, createWriteStream, existsSync } from 'fs';
import { REST, Routes, SlashCommandBuilder, ChannelType } from 'discord.js';
import {
    AudioPlayerStatus,
    createAudioResource,
    getVoiceConnections,
    joinVoiceChannel,
    StreamType,
} from '@discordjs/voice';
import yts from 'yt-search';
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

            // set 1hour time signal.
            _setTimeSignal(self);

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

    /**
     * Play Command
     *      Used to add songs to the queue.
     */
    play: (interaction, self) => {
        if (!interaction.guildId) return;

        let content = null;

        const voiceConnection = getVoiceConnections().get(interaction.guildId);
        if (voiceConnection) {
            const url = interaction.options.get('video')?.value! as string;
            if (url) {
                const hash = url.match(/[\w-]{11}/);
                if (hash) {
                    self.musicQueue.unshift(hash[0]);
                    _download(self.musicQueue[0]);

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
     * Playlist Command
     *      Used to set up playlists from YouTube.
     */
    playlist: async (interaction, self) => {
        if (!interaction.guildId) return;

        let content = null;

        const voiceConnection = getVoiceConnections().get(interaction.guildId);
        if (voiceConnection) {
            const url = interaction.options.get('playlist')?.value! as string;
            if (url) {
                const hash = url.match(/[\w-]{34}/);
                if (hash) {
                    const playlist = await yts({ listId: hash[0] });
                    if (playlist.videos.length) {
                        self.playlist = playlist.videos.map(
                            (video) => video.videoId
                        );
                        self.initMusicQueue(false);
                        _download(self.musicQueue[0]);

                        interaction.reply(
                            `🎶 プレイリスト \`${playlist.title}\` を設定しました。\n${playlist.url}`
                        );
                    } else {
                        content =
                            '⚠ プレイリストが空か、再生可能な曲がありません。';
                    }
                } else {
                    content = '⚠ 指定された URL の形式が正しくありません。';
                }
            } else {
                content = '⚠ YouTube の URL を指定してください';
            }
        } else {
            content = '⚠ 接続中のボイスチャンネルが存在しません。';
        }

        if (content) {
            interaction.reply({ content, ephemeral: true });
        }
    },

    /**
     * Search Command
     *      Used to search for songs from Youtube and add them to the queue.
     */
    search: async (interaction, self) => {
        if (!interaction.guildId) return;

        let content = null;

        const voiceConnection = getVoiceConnections().get(interaction.guildId);
        if (voiceConnection) {
            const word = interaction.options.get('searchword')
                ?.value! as string;
            if (word) {
                const query = await yts(word);
                const video = query.videos[0];

                self.musicQueue.unshift(video.videoId);
                _download(self.musicQueue[0]);

                content = `🎵 楽曲をキューに追加しました。\n${video.url}`;
            } else {
                content = '⚠ 検索ワードを指定してください。';
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

    /**
     * Skip Command
     *      Used for shuffle playback of the current playlist.
     */
    shuffle: (interaction, self) => {
        if (!interaction.guildId) return;

        let content = null;

        const voiceConnection = getVoiceConnections().get(interaction.guildId);
        if (voiceConnection) {
            self.initMusicQueue(true);
            self.playlist = [...self.musicQueue];
            _download(self.musicQueue[0]);

            content = '🔀 現在のプレイリストをシャッフル再生します。';
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
                    .setDescription('🎵 URL を指定して音楽を再生')
                    .addStringOption((option) =>
                        option
                            .setName('video')
                            .setDescription('YouTube video URL or Hash')
                            .setRequired(true)
                    )
                    .toJSON(),
                new SlashCommandBuilder()
                    .setName('playlist')
                    .setDescription('🎶 YouTube からプレイリストを設定')
                    .addStringOption((option) =>
                        option
                            .setName('playlist')
                            .setDescription('YouTube playlist URL or Hash')
                            .setRequired(true)
                    )
                    .toJSON(),
                new SlashCommandBuilder()
                    .setName('search')
                    .setDescription('🔍 YouTube 動画検索')
                    .addStringOption((option) =>
                        option
                            .setName('searchword')
                            .setDescription('Search words from youtube')
                            .setRequired(true)
                    )
                    .toJSON(),
                new SlashCommandBuilder()
                    .setName('pause')
                    .setDescription(
                        '⏯ 再生中の曲を一時停止 / 一時停止中の曲を再開'
                    )
                    .toJSON(),
                new SlashCommandBuilder()
                    .setName('skip')
                    .setDescription('⏭️ 現在の曲をスキップ')
                    .toJSON(),
                new SlashCommandBuilder()
                    .setName('shuffle')
                    .setDescription('⏭️ 現在のプレイリストをシャッフル再生')
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

    self.audioResource = createAudioResource(stream, {
        inputType: StreamType.WebmOpus,
        inlineVolume: true,
    });
    self.audioResource.volume?.setVolume(self.volume);

    self.player.play(self.audioResource);

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
                requestOptions: {
                    headers: {
                        Cookie: Bot.cookies,
                    },
                },
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

function _setTimeSignal(self: Bot) {
    const nextTimeSignalDate = new Date();
    nextTimeSignalDate.setHours(nextTimeSignalDate.getHours() + 1);
    nextTimeSignalDate.setMinutes(0);
    nextTimeSignalDate.setSeconds(0);
    nextTimeSignalDate.setMilliseconds(0);

    /* Used during timesignal testing */
    // nextTimeSignalDate.setMinutes(nextTimeSignalDate.getMinutes() + 1);
    // nextTimeSignalDate.setSeconds(0);
    // nextTimeSignalDate.setMilliseconds(0);

    const untilNextTimeSignalMS =
        Number(nextTimeSignalDate) - Number(new Date());

    return new Promise((resolve) => {
        self.timeSignalTO = setTimeout(() => {
            _playTimeSignal(self);
            _setTimeSignal(self);
            resolve(true);
        }, untilNextTimeSignalMS);
    });
}

function _playTimeSignal(self: Bot) {
    const stream = createReadStream('./mp3/jihou.mp3');
    self.audioResource = createAudioResource(stream, {
        inputType: StreamType.WebmOpus,
        inlineVolume: true,
    });
    self.audioResource.volume?.setVolume(self.volume);

    self.player.play(self.audioResource);
}
