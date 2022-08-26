import { CommandInteraction } from 'discord.js';

export type Settings = {
    bot: {
        id: string;
        token: string;
    };
    server: {
        list: string[];
    };
};

export type Commands = {
    [key: string]: Command;
}

export type Command = {
    description: string;
    options: CommandOption[];
    execute(interaction: CommandInteraction): void;
};

export type CommandOption = {
    type: number;
    name: string;
    description: string;
    choices: CommandOptionChoice[];
    required: boolean;
};

export type CommandOptionChoice = {
    name: string;
    value: string;
};
