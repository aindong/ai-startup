export class Vector2 {
  constructor(public x: number, public y: number) {}

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  subtract(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  multiply(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  divide(scalar: number): Vector2 {
    return new Vector2(this.x / scalar, this.y / scalar);
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vector2 {
    const mag = this.magnitude();
    return mag === 0 ? Vector2.zero() : this.divide(mag);
  }

  distance(other: Vector2): number {
    return this.subtract(other).magnitude();
  }

  lerp(target: Vector2, t: number): Vector2 {
    return new Vector2(
      this.x + (target.x - this.x) * t,
      this.y + (target.y - this.y) * t
    );
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  equals(other: Vector2): boolean {
    return this.x === other.x && this.y === other.y;
  }
} 