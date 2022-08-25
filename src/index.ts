import * as fs from 'fs';
import { Client, GatewayIntentBits } from 'discord.js';

const settings = JSON.parse(readFile('./config/settings.json'));

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once('ready', async () => {
    console.log('Bot "discord-jukebox-v2" has successfully started!');
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
