import Debug from "debug";
const debug = Debug("Blaster:LevelManager");

import {AudioPlayer} from "./devices/AudioPlayer";
import {Clock} from "./timing/Clock";
import {EventEmitter} from 'events';
import {Level} from "./Level";
import {LevelState} from "./LevelState";
import {Scheduler} from './timing/Scheduler';
import {TextInterlude} from './TextInterlude';
import {World} from "./World";

export class LevelManager {
    private readonly _eventEmitter = new EventEmitter();
    private readonly _audioPlayer: AudioPlayer;
    private readonly _world: World;
    private readonly _levels: Level[];
    private _textInterlude: TextInterlude | null = null;
    private _currentLevel: number = 0;
    private readonly _clock: Clock;
    private readonly _scheduler: Scheduler;
    private _state: LevelState = LevelState.Intro;
    private _isActive: boolean = true;

    constructor(audioPlayer: AudioPlayer, world: World, clock: Clock, levels: Level[]) {
        debug('LevelManager constructor');
        this._audioPlayer = audioPlayer;
        this._world = world;
        this._levels = levels;
        this._clock = clock;
        this._scheduler = new Scheduler(clock);
    }

    get currentLevel(): number {
        return this._currentLevel + 1;
    }

    get active(): boolean {
        return this._isActive;
    }

    on(event: string, args: (...args: any[]) => void): void {
        debug('LevelManager.on');
        this._eventEmitter.on(event, args);
        this._eventEmitter.emit('level', this._currentLevel + 1);
    }

    tick(): void {
        debug('LevelManager.tick');

        if (!this._isActive) {
            return;
        }

        switch (this._state) {
            case LevelState.Intro:
                this.tickWithinLevelIntro();
                break;
            case LevelState.Play:
                this.tickWithinLevel();
                break;
            case LevelState.Win:
                this.tickWithinWinnerSequence();
                break;
            default:
                throw new Error('Unexpected state: ' + this._state);
                break;
        }

        this._scheduler.executeDueOperations();
    }

    private tickWithinLevelIntro(): void {
        const TIME_TO_LEVEL_TEXT_VISIBLE = 2000;
        const TIME_LEVEL_TEXT_IS_VISIBLE = 4000;
        const TIME_AFTER_LEVEL_TEXT_VISIBLE = 2000;

        if (this._textInterlude == null) {
            this._textInterlude = new TextInterlude(
                this._world, this._clock,
                "Level " + (this._currentLevel + 1),
                "Arial", 50, "red",
                this._world.dimensions.width / 2, this._world.dimensions.height / 2,
                TIME_TO_LEVEL_TEXT_VISIBLE, TIME_LEVEL_TEXT_IS_VISIBLE, TIME_AFTER_LEVEL_TEXT_VISIBLE
            );

            setTimeout(() => {
                this._audioPlayer.play('level_start');
            }, TIME_TO_LEVEL_TEXT_VISIBLE);
        }

        this._textInterlude.tick();
        if (!this._textInterlude.active) {
            this._textInterlude = null;
            this._state = LevelState.Play;
        }
    }

    private tickWithinLevel(): void {
        this._levels[this._currentLevel].tick();

        if (!this._levels[this._currentLevel].active) {
            if (this._currentLevel < this._levels.length-1) {
                this._currentLevel++;
                this._state = LevelState.Intro;
                this._eventEmitter.emit('level', this._currentLevel + 1);
            }
            else {
                this._state = LevelState.Win;
            }
        }
    }

    private tickWithinWinnerSequence(): void {
        const TIME_TO_CONGRATULATIONS_TEXT_VISIBLE = 2000;
        const TIME_CONGRATULATIONS_TEXT_IS_VISIBLE = 4000;
        const TIME_AFTER_CONGRATULATIONS_TEXT_VISIBLE = 2000;

        if (this._textInterlude == null) {
            this._textInterlude = new TextInterlude(
                this._world, this._clock,
                "CONGRATULATIONS!",
                "Arial", 32, "green",
                this._world.dimensions.width / 2, this._world.dimensions.height / 2,
                TIME_TO_CONGRATULATIONS_TEXT_VISIBLE, TIME_CONGRATULATIONS_TEXT_IS_VISIBLE, TIME_AFTER_CONGRATULATIONS_TEXT_VISIBLE
            );

            setTimeout(() => {
                this._audioPlayer.play('congratulations');
            }, TIME_TO_CONGRATULATIONS_TEXT_VISIBLE);
        }

        this._textInterlude.tick();
        if (!this._textInterlude.active) {
            this._textInterlude = null;
            this._state = LevelState.Play;
            this._isActive = false;
        }
    }
}
