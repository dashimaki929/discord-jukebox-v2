import {
    AudioPlayer,
    createAudioPlayer,
    NoSubscriberBehavior,
} from '@discordjs/voice';

export class Bot {
    static connectedGuildsCount = 0;

    player: AudioPlayer;
    playlist: string[];
    musicQueue: string[];
    volume: number;

    isPlaying: boolean;

    constructor(playlist: string[] = [], volume: number = 5) {
        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });

        this.playlist = playlist;
        this.musicQueue = [];
        this.volume = volume / 100;

        this.isPlaying = false;

        // Initialize the playlist queue
        this.initMusicQueue();

        // Add up the number of guilds that are connected
        Bot.connectedGuildsCount++;
    }

    initMusicQueue() {
        const shuffle = ([...array]) => {
            for (let i = array.length - 1; i >= 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };
        this.musicQueue = shuffle(this.playlist).filter(Boolean);
    }

    getNextMusicHash() {
        const nextMusicHash = this.musicQueue.shift();

        if (!this.musicQueue.length) {
            this.initMusicQueue();
        }

        return nextMusicHash;
    }
}
