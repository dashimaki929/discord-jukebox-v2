import * as fs from 'fs';
import { Client, GatewayIntentBits } from 'discord.js';

import { Bots, BotSettings } from './typedef';
const Bots: Bots = {};
const BOT_SETTINGS: BotSettings = JSON.parse(
    readFile('./config/bot_settings.json')
);
const playlist: string[] = readFile('./config/playlist.txt').split(/\r?\n/);

import { commands, registSlashCommands } from './commands';
import { Bot } from './bot';
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

const HEADER_SETTINGS = JSON.parse(readFile('./config/header_settings.json'));
Bot.cookies = HEADER_SETTINGS.cookie.join('');

client.once('ready', async () => {
    await registSlashCommands(BOT_SETTINGS);

    console.log('Bot "discord-jukebox-v2" has successfully started!');
});

client.on('interactionCreate', (interaction) => {
    if (!interaction.guildId) return;

    let self = Bots[interaction.guildId];
    if (!self) {
        self = new Bot(playlist);
        Bots[interaction.guildId] = self;
    }

    if (interaction.isCommand()) {
        commands[interaction.commandName](interaction, self);
    }
});

client.login(BOT_SETTINGS.token);

/**
 * Read file as text
 *
 * @param filepath
 */
function readFile(filepath: string): string {
    let data = '';

    try {
        data = fs.readFileSync(filepath, 'utf-8');
        console.debug(filepath);
        console.debug(data);
    } catch (e) {
        console.error(e);
    }

    return data;
}
