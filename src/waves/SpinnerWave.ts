import Debug from "debug";
const debug = Debug("Blaster:SpinnerWave");
import {random} from 'underscore';

import {AudioPlayer} from "../devices/AudioPlayer";
import {Bomber} from '../enemies/Bomber';
import {Clock} from "../timing/Clock";
import {Point} from '../Point';
import {Scheduler} from '../timing/Scheduler';
import {Spinner} from '../enemies/Spinner';
import {Wave} from './Wave';
import {World} from "../World";

export class SpinnerWave implements Wave {
    private readonly _audioPlayer: AudioPlayer;
    private readonly _world: World;
    private readonly _clock: Clock;
    private readonly _scheduler: Scheduler;
    private _numberOfSpinnersLeftToDeploy: number = 10;
    private _numberOfBombersLeftToDeploy: number = 5;
    private _currentBomber: Bomber | null = null;

    constructor(audioPlayer: AudioPlayer, world: World, clock: Clock) {
        this._audioPlayer = audioPlayer;
        this._world = world;
        this._clock = clock;
        this._scheduler = new Scheduler(clock);
    }

    get isActive(): boolean {
        return (this._numberOfSpinnersLeftToDeploy > 0)
            || (this._world.activeEnemies.length > 0)
            || (this._world.activeExplosions.length > 0);
    }

    tick(): void {
        debug('SpinnerWave.tick');

        if (this._numberOfSpinnersLeftToDeploy > 0) {
            this._scheduler.scheduleOperation(
                'deploySpinner',
                250,
                () => { this.deploySpinner() }
            );
        }

        // Limit the number of bombers so the player can't just sit and pick them off forever.
        if (this._numberOfBombersLeftToDeploy > 0) {
            // To consider scheduling the addition of a bomber, there can't already be an active one.
            if ((this._currentBomber === null) || (!this._currentBomber.isActive)) {
                // Additionally, bombers will only be scheduled if other enemies are still active.
                if (this._world.activeEnemies.length > 0) {
                    this._scheduler.scheduleOperation(
                        'deployBomber',
                        10000,
                        () => { this.deployBomber() }
                    );
                }
            }
        }

        this._scheduler.executeDueOperations();
    }

    private deploySpinner(): void {
        debug('SpinnerWave.deploySpinner');

        const worldDimensions = this._world.dimensions;
        const spinnerStartX = worldDimensions.width / 2;
        const spinnerStartY = -20;
        const leftSpinner = new Spinner(
            this._audioPlayer,
            this._world,
            this._clock,
            new Point(spinnerStartX - 40, spinnerStartY),
            Spinner.Pattern.Type1,
            Spinner.Bias.Left
        );
        this._world.addActor(leftSpinner);
        const rightSpinner = new Spinner(
            this._audioPlayer,
            this._world,
            this._clock,
            new Point(spinnerStartX + 40, spinnerStartY),
            Spinner.Pattern.Type1,
            Spinner.Bias.Right
        );
        this._world.addActor(rightSpinner);

        this._numberOfSpinnersLeftToDeploy -= 2;
    }

    private deployBomber(): void {
        debug('SpinnerWave.deployBomber');

        const worldDimensions = this._world.dimensions;
        const bomberStartY = Math.floor(random(50, worldDimensions.height / 2));
        const bomber = new Bomber(this._audioPlayer, this._world, this._clock, bomberStartY);
        this._currentBomber = bomber;
        this._world.addActor(bomber);

        this._numberOfBombersLeftToDeploy--;
    }
}
