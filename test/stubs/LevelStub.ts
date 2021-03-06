import {Level} from "../../src/Level";
import {Wave} from "../../src/waves/Wave";

export class LevelStub extends Level {
    private _stubActive: boolean = true;
    private _onTick: () => void = () => {};

    constructor(waves: Wave[] = []) {
        super(waves);
    }

    get active(): boolean {
        return this._stubActive;
    }

    isActive(value: boolean): LevelStub {
        this._stubActive = value;
        return this;
    }

    onTick(value: () => void): LevelStub {
        this._onTick = value;
        return this;
    }

    tick(): void {
        this._onTick();
    }
}
