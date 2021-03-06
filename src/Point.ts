export class Point {
    private readonly _x: number;
    private readonly _y: number;

    constructor(x: number, y: number) {
        this._x = x;
        this._y  = y;
    }

    get x(): number {
        return this._x;
    }

    get y(): number {
        return this._y;
    }

    withX(x: number): Point {
        return new Point(x, this._y);
    }

    withY(y: number): Point {
        return new Point(this._x, y);
    }

    translate(x: number, y: number): Point {
        return new Point(this._x + x, this._y + y);
    }

    up(count: number = 1): Point {
        return new Point(this._x, this._y - count);
    }

    down(count: number = 1): Point {
        return new Point(this._x, this._y + count);
    }

    left(count: number = 1): Point {
        return new Point(this._x - count, this._y);
    }

    right(count: number = 1): Point {
        return new Point(this._x + count, this._y);
    }

    toString(): string {
        return 'Point(x=' + this._x + ', y=' + this._y + ')';
    }
}
