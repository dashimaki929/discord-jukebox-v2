import {
    AudioPlayer,
    AudioResource,
    createAudioPlayer,
    NoSubscriberBehavior,
} from '@discordjs/voice';

export class Bot {
    static connectedGuildsCount = 0;
    static cookies = null;

    player: AudioPlayer;
    playlist: string[];
    musicQueue: string[];
    volume: number;
    audioResource: AudioResource | null;
    timeSignalTO: NodeJS.Timeout | null;

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
        this.audioResource = null;
        this.timeSignalTO = null;

        this.isPlaying = false;

        // Initialize the playlist queue
        this.initMusicQueue();

        // Add up the number of guilds that are connected
        Bot.connectedGuildsCount++;
    }

    initMusicQueue(doShuffle: boolean = true) {
        const shuffle = ([...array]) => {
            for (let i = array.length - 1; i >= 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        if (doShuffle) {
            this.musicQueue = shuffle(this.playlist).filter(Boolean);
        } else {
            this.musicQueue = this.playlist.filter(Boolean);
        }
    }

    getNextMusicHash() {
        const nextMusicHash = this.musicQueue.shift();

        if (!this.musicQueue.length) {
            this.initMusicQueue();
        }

        return nextMusicHash;
    }
}
