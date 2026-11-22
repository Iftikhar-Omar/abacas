// File: engine.js
// Directory: src/
// Exact arithmetic parser and step-by-step abacus move generator.

export var ENGINE_VERSION = "4.0.0";
export var abs = (n) => n < 0n ? -n : n;
export var gcd = (a, b) => {
  a = abs(a);
  b = abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1n;
};
export var Q = class _Q {
  constructor(n, d = 1n) {
    n = BigInt(n);
    d = BigInt(d);
    if (!d) throw Error("divisionZero");
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
    if (abs(this.n).toString().length > 40 || this.d.toString().length > 40)
      throw Error("tooLarge");
  }
  add(b) {
    return new _Q(this.n * b.d + b.n * this.d, this.d * b.d);
  }
  sub(b) {
    return new _Q(this.n * b.d - b.n * this.d, this.d * b.d);
  }
  mul(b) {
    return new _Q(this.n * b.n, this.d * b.d);
  }
  div(b) {
    return new _Q(this.n * b.d, this.d * b.n);
  }
  neg() {
    return new _Q(-this.n, this.d);
  }
  eq(b) {
    return this.n === b.n && this.d === b.d;
  }
  get zero() {
    return this.n === 0n;
  }
  static from(s) {
    s = String(s);
    if (!/^-?\d+(\.\d+)?$/.test(s)) throw Error("invalidNumber");
    const [a, b = ""] = s.split(".");
    return new _Q(BigInt(a + b), 10n ** BigInt(b.length));
  }
  decimal(max = 8) {
    let d = this.d, k = 0;
    while (d % 2n === 0n) {
      d /= 2n;
      k++;
    }
    let j = 0;
    while (d % 5n === 0n) {
      d /= 5n;
      j++;
    }
    const scale = Math.max(k, j);
    if (d !== 1n || scale > max) return null;
    const n = this.n * 10n ** BigInt(scale) / this.d;
    return { n, scale };
  }
  toString() {
    const f = this.decimal(8);
    if (!f) return `${this.n}/${this.d}`;
    return formatScaled(f.n, f.scale);
  }
};
export function formatScaled(n, scale) {
  const neg = n < 0n;
  n = abs(n);
  let s = n.toString().padStart(scale + 1, "0");
  if (scale) s = s.slice(0, -scale) + "." + s.slice(-scale);
  return (neg ? "-" : "") + s;
}
export function normalize(s) {
  return String(s).replace(/[০-৯٠-٩۰-۹०-९０-９]/g, (c) => {
    const code = c.charCodeAt(0);
    for (const start of [2534, 1632, 1776, 2406, 65296])
      if (code >= start && code < start + 10) return String(code - start);
    return c;
  }).replace(/٫/g, ".").replace(/٪/g, "%").replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-").replace(/√/g, "sqrt");
}
export function parse(source) {
  source = normalize(source);
  if (source.length > 2e3) throw Error("tooLong");
  const equation = source.includes("=");
  source = source.replace(/[xX]/g, equation ? "x" : "*");
  const re = /\s*(?:(\d+(?:\.\d+)?)|(sqrt|x)|([+\-*/^()=%]))/gy;
  const tokens = [];
  let pos = 0;
  while (pos < source.length) {
    if (!source.slice(pos).trim()) break;
    re.lastIndex = pos;
    const m = re.exec(source);
    if (!m) throw Error("syntax");
    const token = m[1] || m[2] || m[3];
    if (equation && token === "x" && /^\d/.test(tokens.at(-1) || ""))
      tokens.push("*");
    tokens.push(token);
    pos = re.lastIndex;
  }
  let i = 0, depth = 0;
  function primary() {
    if (++depth > 24) throw Error("tooDeep");
    let t = tokens[i++], a2;
    if (t === "(") {
      a2 = expr();
      if (tokens[i++] !== ")") throw Error("syntax");
    } else if (t === "sqrt") {
      if (tokens[i++] !== "(") throw Error("syntax");
      a2 = { op: "sqrt", a: expr() };
      if (tokens[i++] !== ")") throw Error("syntax");
    } else if (t === "x") a2 = { op: "x" };
    else if (t && /^\d/.test(t)) a2 = { op: "num", q: Q.from(t) };
    else throw Error("syntax");
    while (tokens[i] === "%") {
      i++;
      a2 = { op: "/", a: a2, b: { op: "num", q: new Q(100) } };
    }
    depth--;
    return a2;
  }
  function power() {
    let a2 = primary();
    if (tokens[i] === "^") {
      i++;
      a2 = { op: "^", a: a2, b: unary() };
    }
    return a2;
  }
  function unary() {
    if (tokens[i] === "+" || tokens[i] === "-") {
      let op = tokens[i++];
      return op === "+" ? unary() : { op: "neg", a: unary() };
    }
    return power();
  }
  function term() {
    let a2 = unary();
    while (["*", "/"].includes(tokens[i])) {
      let op = tokens[i++];
      a2 = { op, a: a2, b: unary() };
    }
    return a2;
  }
  function expr() {
    let a2 = term();
    while (["+", "-"].includes(tokens[i])) {
      let op = tokens[i++];
      a2 = { op, a: a2, b: term() };
    }
    return a2;
  }
  const a = expr();
  let tree = a;
  if (tokens[i] === "=") {
    i++;
    tree = { op: "=", a, b: expr() };
  }
  if (i !== tokens.length) throw Error("syntax");
  return tree;
}
export function isqrt(n) {
  if (n < 0n) throw Error("negativeRoot");
  if (n < 2n) return n;
  let x = n, y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}
export function calc(op, a, b) {
  switch (op) {
    case "+":
      return a.add(b);
    case "-":
      return a.sub(b);
    case "*":
      return a.mul(b);
    case "/":
      return a.div(b);
    case "neg":
      return a.neg();
    case "^":
      if (b.d !== 1n || abs(b.n) > 12n) throw Error("exponent");
      return b.n < 0n ? new Q(a.d ** -b.n, a.n ** -b.n) : new Q(a.n ** b.n, a.d ** b.n);
    case "sqrt": {
      let n = isqrt(a.n), d = isqrt(a.d);
      if (n * n !== a.n || d * d !== a.d) throw Error("irrationalRoot");
      return new Q(n, d);
    }
  }
}
export function evaluate(node) {
  if (typeof node === "string") node = parse(node);
  if (node.op === "num") return node.q;
  if (node.op === "x" || node.op === "=") throw Error("equation");
  return calc(node.op, evaluate(node.a), node.b && evaluate(node.b));
}
export function linear(node) {
  if (node.op === "x") return [new Q(1), new Q(0)];
  if (node.op === "num") return [new Q(0), node.q];
  if (node.op === "neg") return linear(node.a).map((q) => q.neg());
  if (node.op === "sqrt" || node.op === "^") {
    return [new Q(0), evaluate(node)];
  }
  let [a, b] = linear(node.a), [c, d] = linear(node.b);
  switch (node.op) {
    case "+":
      return [a.add(c), b.add(d)];
    case "-":
      return [a.sub(c), b.sub(d)];
    case "*":
      if (!a.zero && !c.zero) throw Error("nonlinear");
      return [a.mul(d).add(c.mul(b)), b.mul(d)];
    case "/":
      if (!c.zero) throw Error("nonlinear");
      return [a.div(d), b.div(d)];
  }
  throw Error("nonlinear");
}
export var notation = (op) => ({ "*": "\xD7", "/": "\xF7", "-": "\u2212", "+": "+", "^": "^" })[op] || op;
export function solve(source) {
  const tree = parse(source);
  if (tree.op === "sqrt") {
    const a = evaluate(tree.a);
    if (a.d === 1n && a.n >= 0n && isqrt(a.n) ** 2n !== a.n)
      return rootApproximation(a.n, 3, source);
  }
  let steps = [], groups = [], board = 0n, scale = 0, group = null;
  const snapshot = () => ({
    value: formatScaled(board, scale),
    raw: board.toString(),
    scale
  });
  function newGroup(label, tone = "neutral") {
    group = { id: groups.length, label, tone, start: steps.length };
    groups.push(group);
  }
  function emit(kind, params = {}, lesson = "place", options = {}) {
    const step = {
      id: steps.length,
      group: group.id,
      kind,
      params,
      lesson,
      before: options.before || snapshot(),
      after: snapshot(),
      ...options
    };
    steps.push(step);
    if (steps.length > 8e3) throw Error("tooManySteps");
  }
  function symbolic(kind, params, lesson, value) {
    const before = snapshot();
    emit(kind, params, lesson, {
      before,
      after: { value: value.toString(), raw: null, scale: 0 },
      symbolic: true
    });
  }
  function move(c, to, kind, params, lesson) {
    const before = snapshot();
    const p = 10n ** BigInt(c), old = Number(board / p % 10n);
    board += BigInt(to - old) * p;
    emit(
      kind,
      { ...params, column: c, place: formatScaled(p, scale), from: old, to },
      lesson,
      { before, column: c }
    );
  }
  function within(c, target, rule) {
    let v = Number(board / 10n ** BigInt(c) % 10n);
    const upper = Math.floor(v / 5), tu = Math.floor(target / 5), lo = v % 5, tl = target % 5;
    const lesson = rule || (upper !== tu && lo !== tl ? "five" : "direct");
    if (upper !== tu) {
      move(c, tu * 5 + lo, tu ? "upperOn" : "upperOff", { amount: 5 }, lesson);
      v = tu * 5 + lo;
    }
    if (lo !== tl)
      move(
        c,
        target,
        tl > lo ? "lowerOn" : "lowerOff",
        { amount: Math.abs(tl - lo) },
        lesson
      );
  }
  function addDigit(c, d, rule) {
    if (!d) return;
    const v = Number(board / 10n ** BigInt(c) % 10n);
    if (v + d >= 10) {
      emit("makeTen", { digit: d, complement: 10 - d, column: c }, "ten", {
        column: c
      });
      within(c, v - (10 - d), "ten");
      addDigit(c + 1, 1, "ten");
    } else within(c, v + d, rule);
  }
  function subDigit(c, d, rule) {
    if (!d) return;
    const v = Number(board / 10n ** BigInt(c) % 10n);
    if (v < d) {
      emit("borrowTen", { digit: d, complement: 10 - d, column: c }, "borrow", {
        column: c
      });
      subDigit(c + 1, 1, "borrow");
      addDigit(c, 10 - d, "borrow");
    } else within(c, v - d, rule);
  }
  function set(q, label) {
    const f = q.decimal(8);
    newGroup(label || q.toString());
    if (!f || f.n < 0n || f.n.toString().length > 18) {
      symbolic("exact", { value: q.toString() }, "fractions", q);
      return false;
    }
    scale = f.scale;
    board = 0n;
    emit("clear", {}, "zero");
    const chars = abs(f.n).toString();
    for (let i = 0; i < chars.length; i++) {
      const d = Number(chars[i]);
      if (d) within(chars.length - 1 - i, d, "place");
    }
    if (f.n === 0n) emit("zero", {}, "zero");
    return true;
  }
  function transition(a, op, b, result2, label) {
    const fa = a.decimal(), fb = b.decimal(), fr = result2.decimal();
    if (fa && fb && fr && fa.n >= 0n && fb.n >= 0n && fr.n >= 0n && Math.max(
      fa.n.toString().length,
      fb.n.toString().length,
      fr.n.toString().length
    ) + Math.max(fa.scale, fb.scale, fr.scale) <= 18) {
      const sc = Math.max(fa.scale, fb.scale, fr.scale);
      scale = sc;
      board = fa.n * 10n ** BigInt(sc - fa.scale);
      newGroup(label || `${notation(op)} ${b}`, op === "-" ? "warm" : "cool");
      emit(
        "operation",
        { a: a.toString(), op: notation(op), b: b.toString() },
        op === "-" ? "subtract" : "direct"
      );
      const n = fb.n * 10n ** BigInt(sc - fb.scale), chars = n.toString();
      for (let i = 0; i < chars.length; i++) {
        let d = Number(chars[i]), c = chars.length - 1 - i;
        if (d) (op === "+" ? addDigit : subDigit)(c, d);
      }
      const expected = fr.n * 10n ** BigInt(sc - fr.scale);
      if (board !== expected) throw Error("invariant");
      emit(
        "operationDone",
        { result: result2.toString() },
        op === "-" ? "subtract" : "direct"
      );
      return;
    }
    newGroup(label || `${notation(op)} ${b}`, op === "-" ? "warm" : "cool");
    if (a.d !== 1n || b.d !== 1n) {
      const den = a.d * b.d / gcd(a.d, b.d);
      symbolic(
        "commonParts",
        {
          left: `${a.n * (den / a.d)}/${den}`,
          right: `${b.n * (den / b.d)}/${den}`,
          op: notation(op)
        },
        "fractions",
        a
      );
      symbolic(
        "combineParts",
        {
          left: (a.n * (den / a.d)).toString(),
          right: (b.n * (den / b.d)).toString(),
          den: den.toString(),
          op: notation(op),
          result: result2.toString()
        },
        "fractions",
        result2
      );
    } else
      symbolic(
        "signedOrFraction",
        {
          a: a.toString(),
          op: notation(op),
          b: b.toString(),
          result: result2.toString()
        },
        "negative",
        result2
      );
  }
  function visit(n) {
    if (n.op === "num") {
      set(n.q);
      return n.q;
    }
    if (n.op === "x") throw Error("equation");
    const a = visit(n.a);
    let b;
    if (n.b) {
      if (n.b.op === "num") b = n.b.q;
      else {
        b = visit(n.b);
        set(a);
      }
    }
    const result2 = calc(n.op, a, b);
    if (n.op === "+" || n.op === "-") transition(a, n.op, b, result2);
    else if (n.op === "*") {
      newGroup(`${a} \xD7 ${b}`, "cool");
      symbolic(
        "multiplyPlan",
        { a: a.toString(), b: b.toString() },
        "multiply",
        a
      );
      if (a.n < 0n || b.n < 0n)
        symbolic(
          "signRule",
          {
            a: a.toString(),
            b: b.toString(),
            op: "\xD7",
            result: result2.toString()
          },
          "negative",
          a
        );
      if (a.d !== 1n || b.d !== 1n)
        symbolic(
          "fractionProduct",
          {
            left: a.n.toString(),
            right: b.n.toString(),
            leftDen: a.d.toString(),
            rightDen: b.d.toString(),
            result: result2.toString()
          },
          "fractions",
          result2
        );
      const dec = b.decimal();
      if (dec && dec.n >= 0n && a.n >= 0n && dec.n.toString().length <= 10) {
        let sum = new Q(0);
        set(sum);
        const chars = dec.n.toString();
        for (let i = 0; i < chars.length; i++) {
          let d = Number(chars[i]);
          if (!d) continue;
          const factor = new Q(
            BigInt(d) * 10n ** BigInt(chars.length - 1 - i),
            10n ** BigInt(dec.scale)
          );
          const part = a.mul(factor);
          newGroup(`${a} \xD7 ${factor}`, "cool");
          symbolic(
            "partialProduct",
            {
              a: a.toString(),
              factor: factor.toString(),
              part: part.toString()
            },
            "multiply",
            part
          );
          transition(
            sum,
            "+",
            part,
            sum.add(part),
            `+ ${part} (${a} \xD7 ${factor})`
          );
          sum = sum.add(part);
        }
      } else
        symbolic(
          "multiplyExact",
          { a: a.toString(), b: b.toString(), result: result2.toString() },
          "multiply",
          result2
        );
      newGroup(`${a} \xD7 ${b} = ${result2}`, "cool");
      symbolic(
        "operationDone",
        { result: result2.toString() },
        "multiply",
        result2
      );
      set(result2);
    } else if (n.op === "/") {
      newGroup(`${a} \xF7 ${b}`, "cool");
      symbolic("dividePlan", { a: a.toString(), b: b.toString() }, "divide", a);
      if (a.n < 0n || b.n < 0n)
        symbolic(
          "signRule",
          {
            a: a.toString(),
            b: b.toString(),
            op: "\xF7",
            result: result2.toString()
          },
          "negative",
          a
        );
      if (b.d !== 1n)
        symbolic(
          "reciprocal",
          {
            a: a.toString(),
            b: b.toString(),
            inverse: new Q(b.d, b.n).toString(),
            result: result2.toString()
          },
          "fractions",
          a
        );
      const da = a.decimal(), db = b.decimal();
      if (da && db && (da.scale || db.scale)) {
        const sc = Math.max(da.scale, db.scale), factor = 10n ** BigInt(sc);
        symbolic(
          "divisionScale",
          {
            a: a.toString(),
            b: b.toString(),
            factor: factor.toString(),
            left: (da.n * 10n ** BigInt(sc - da.scale)).toString(),
            right: (db.n * 10n ** BigInt(sc - db.scale)).toString(),
            result: result2.toString()
          },
          "decimal",
          a
        );
      }
      if (a.d === 1n && b.d === 1n && a.n >= 0n && b.n > 0n) {
        let rem = 0n, q = "";
        for (const digit of a.n.toString()) {
          rem = rem * 10n + BigInt(digit);
          const got = rem / b.n, used = got * b.n, left = rem - used;
          q += got.toString();
          symbolic(
            "divideDigit",
            {
              bring: digit,
              total: rem.toString(),
              divisor: b.toString(),
              digit: got.toString(),
              used: used.toString(),
              remain: left.toString(),
              quotient: BigInt(q).toString()
            },
            "divide",
            new Q(BigInt(q))
          );
          rem = left;
        }
        if (rem)
          symbolic(
            "remainder",
            {
              a: a.toString(),
              quotient: BigInt(q).toString(),
              remainder: rem.toString(),
              divisor: b.toString(),
              result: result2.toString()
            },
            "fractions",
            result2
          );
      }
      symbolic(
        "divideCheck",
        { a: a.toString(), b: b.toString(), result: result2.toString() },
        "divide",
        result2
      );
      set(result2);
    } else {
      newGroup(
        n.op === "sqrt" ? `\u221A(${a})` : n.op === "neg" ? `\u2212(${a})` : `${a} ^ ${b}`
      );
      symbolic(
        n.op === "sqrt" ? "rootCheck" : n.op === "neg" ? "negate" : "power",
        { a: a.toString(), b: b?.toString(), result: result2.toString() },
        n.op === "sqrt" ? "roots" : n.op === "neg" ? "negative" : "powers",
        result2
      );
      set(result2);
    }
    return result2;
  }
  let result;
  if (tree.op === "=") {
    const [a, b] = linear(tree.a), [c, d] = linear(tree.b), coef = a.sub(c), constant = d.sub(b);
    newGroup(source);
    symbolic(
      "balance",
      {
        leftA: a.toString(),
        leftB: b.toString(),
        rightA: c.toString(),
        rightB: d.toString()
      },
      "equations",
      new Q(0)
    );
    if (coef.zero) {
      result = constant.zero ? "allSolutions" : "noSolution";
      emit(result, {}, "equations", {
        symbolic: true,
        after: { raw: null, value: "\u2014", scale: 0 }
      });
    } else {
      symbolic(
        "collect",
        { coefficient: coef.toString(), constant: constant.toString() },
        "equations",
        constant
      );
      result = constant.div(coef);
      symbolic(
        "solveX",
        {
          coefficient: coef.toString(),
          constant: constant.toString(),
          result: result.toString()
        },
        "equations",
        result
      );
      const left = a.mul(result).add(b), right = c.mul(result).add(d);
      symbolic(
        "verifyX",
        {
          left: left.toString(),
          right: right.toString(),
          result: result.toString()
        },
        "equations",
        result
      );
    }
  } else result = visit(tree);
  for (const g of groups) {
    const ss = steps.filter((s) => s.group === g.id);
    g.count = ss.length;
    ss.forEach((s, i) => {
      s.sub = i + 1;
      s.total = ss.length;
    });
  }
  return {
    source,
    result: result.toString(),
    steps,
    groups,
    version: ENGINE_VERSION
  };
}
export function answerEquals(input, expected) {
  try {
    return evaluate(String(input)).eq(evaluate(String(expected)));
  } catch {
    return false;
  }
}
export function rootApproximation(n, places = 3, source = null) {
  n = BigInt(n);
  if (n < 0n || n.toString().length > 18 || !Number.isInteger(places) || places < 0 || places > 6)
    throw Error("rootRange");
  let text = n.toString();
  if (text.length % 2) text = "0" + text;
  const integerPairs = text.length / 2, pairs = text.match(/.{2}/g).concat(Array(places + 1).fill("00"));
  let root = 0n, remainder = 0n, steps = [], groups = [];
  const emit = (kind, params, after, group2) => steps.push({
    id: steps.length,
    group: group2,
    kind,
    params,
    lesson: "root-estimate",
    symbolic: true,
    before: { raw: null, value: "\u2014", scale: 0 },
    after: { raw: null, value: after, scale: 0 }
  });
  pairs.forEach((pair, i) => {
    const group2 = groups.length;
    groups.push({
      id: group2,
      label: `\u221A${n} \xB7 ${i + 1}`,
      tone: "cool",
      start: steps.length
    });
    const brought = remainder * 100n + BigInt(pair), base = 20n * root;
    let digit = 0n;
    while (digit < 9n && (base + digit + 1n) * (digit + 1n) <= brought) digit++;
    const used = (base + digit) * digit;
    emit(
      "rootBring",
      { pair, total: brought.toString() },
      root.toString(),
      group2
    );
    emit(
      "rootTrial",
      {
        base: base.toString(),
        digit: digit.toString(),
        used: used.toString(),
        total: brought.toString()
      },
      root.toString(),
      group2
    );
    remainder = brought - used;
    root = root * 10n + digit;
    const decimalCount = Math.max(0, i + 1 - integerPairs);
    emit(
      "rootDigit",
      {
        remain: remainder.toString(),
        partial: formatScaled(root, decimalCount)
      },
      formatScaled(root, decimalCount),
      group2
    );
  });
  const guard = root % 10n, rounded = root / 10n + (guard >= 5n ? 1n : 0n), result = formatScaled(rounded, places);
  const group = groups.length;
  groups.push({
    id: group,
    label: `\u221A${n} \u2248 ${result}`,
    tone: "cool",
    start: steps.length
  });
  emit(
    "roundRoot",
    { guard: guard.toString(), places, result },
    `\u2248 ${result}`,
    group
  );
  for (const g of groups) {
    const ss = steps.filter((s) => s.group === g.id);
    g.count = ss.length;
    ss.forEach((s, i) => {
      s.sub = i + 1;
      s.total = ss.length;
    });
  }
  return {
    source: source || `sqrt(${n})`,
    result,
    approximate: true,
    places,
    steps,
    groups,
    version: ENGINE_VERSION
  };
}
