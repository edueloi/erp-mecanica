// Minimal stream stub for browser compatibility (used by xlsx-js-style)
export class Readable {
  pipe() { return this; }
  on() { return this; }
  read() { return null; }
}

export class Writable {
  write() { return true; }
  end() { return this; }
  on() { return this; }
}

export class Transform extends Readable {
  write() { return true; }
  end() { return this; }
}

export default { Readable, Writable, Transform };
