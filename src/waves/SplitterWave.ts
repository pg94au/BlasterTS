import Debug from "debug";
const debug = Debug("Blaster:SplitterWave");
import {random} from 'underscore';

import {AudioPlayer} from "../devices/AudioPlayer";
import {Clock} from "../timing/Clock";
import {Point} from '../Point';
import {Splitter} from '../enemies/Splitter';
import {Wave} from './Wave';
import {World} from "../World";

export class SplitterWave implements Wave {
    private readonly _audioPlayer: AudioPlayer;
    private readonly _world: World;
    private readonly _clock: Clock;
    private _addNextEnemyAt: Date = new Date();
    private _numberOfEnemiesLeftToDeploy: number = 15;

    constructor(audioPlayer: AudioPlayer, world: World, clock: Clock) {
        debug('SplitterWave constructor');
        this._audioPlayer = audioPlayer;
        this._world = world;
        this._clock = clock;
    }

    get isActive(): boolean {
        return (this._numberOfEnemiesLeftToDeploy > 0)
            || (this._world.activeEnemies.length > 0)
            || (this._world.activeExplosions.length > 0);
    }

    tick(): void {
        debug('SplitterWave.tick');

        if (this._numberOfEnemiesLeftToDeploy > 0) {
            // Add new enemy when the time comes, but only if a maximum allowed aren't already active.
            if ((this._addNextEnemyAt <= new Date()) && (this._world.activeEnemies.length < 3)) {
                // Space out the addition of enemies.
                this._addNextEnemyAt = new Date();
                this._addNextEnemyAt.setSeconds(this._addNextEnemyAt.getSeconds() + 1);

                const worldDimensions = this._world.dimensions;
                const splitterStartingPoint = new Point(
                    Math.floor(random(100 + 50, worldDimensions.width - 100 - 50)),
                    -20
                );
                const _splitter = new Splitter(this._audioPlayer, this._world, this._clock, splitterStartingPoint);
                this._world.addActor(_splitter);

                this._numberOfEnemiesLeftToDeploy--;
            }
        }
    }
}
