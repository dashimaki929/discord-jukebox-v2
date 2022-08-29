import * as fs from 'fs';
import { Client, GatewayIntentBits } from 'discord.js';

import { Bots, BotSettings } from './typedef';
const Bots: Bots = {};
const settings: BotSettings = JSON.parse(readFile('./config/settings.json'));
const playlist: string[] = readFile('./config/playlist.txt').split(/\r?\n/);

import { commands, registSlashCommands } from './commands';
import { Bot } from './bot';
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ],
});

client.once('ready', async () => {
    await registSlashCommands(settings);

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

client.login(settings.token);

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
