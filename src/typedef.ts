import { CommandInteraction } from 'discord.js';

export type BotSettings = {
    id: string;
    token: string;
};

export type Commands = {
    [key: string]: Command;
};

export type Command = (Interaction: CommandInteraction) => void;
