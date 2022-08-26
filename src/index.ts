import * as fs from 'fs';
import { Client, GatewayIntentBits } from 'discord.js';

import { BotSettings } from './typedef';
const settings: BotSettings = JSON.parse(readFile('./config/settings.json'));

import { commands, registSlashCommands } from './commands';
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

/**
 * Execute at bot startup
 */
client.once('ready', async () => {
    await registSlashCommands(settings);

    console.log('Bot "discord-jukebox-v2" has successfully started!');
});

client.on('interactionCreate', (interaction) => {
    if (interaction.isCommand()) {
        commands[interaction.commandName](interaction);
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
        console.debug(data);
    } catch (e) {
        console.error(e);
    }

    return data;
}
