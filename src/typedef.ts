import { CommandInteraction } from 'discord.js';
import { Bot } from './bot';

export type Bots = {
    [key: string]: Bot;
};

export type BotSettings = {
    id: string;
    token: string;
};

export type Commands = {
    [key: string]: Command;
};

export type Command = (Interaction: CommandInteraction, self: Bot) => void;
