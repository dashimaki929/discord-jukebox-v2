import * as fs from 'fs';
import { Client, CommandInteraction, GatewayIntentBits } from 'discord.js';

import { Settings, Command } from './typedef';
const settings: Settings = JSON.parse(readFile('./config/settings.json'));

import { commands } from './commands';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

/**
 * Execute at bot startup
 */
client.once('ready', async () => {
    // Register slash-commands to the server
    for (let serverId of settings.server.list) {
        await client.application?.commands.set(
            Object.keys(commands).map((name) => {
                const command: Command = commands[name];
                return {
                    name,
                    description: command.description,
                    options: command.options,
                };
            }),
            serverId
        );
    }

    console.log('Bot "discord-jukebox-v2" has successfully started!');
});

client.on('interactionCreate', interaction => {
    if (interaction.isCommand()) {
        commands[interaction.commandName].execute(interaction);
    }
});

client.login(settings.bot.token);

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
