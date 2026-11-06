// Generated from src/content/bank/validate.ts by: npm run content:bundle. Do not edit.

// src/engine/voxel.ts
function validateShape(cells, opts = { connected: !0 }) {
  let errs = [];
  if (!Array.isArray(cells) || cells.length === 0) return ["shape_empty"];
  cells.length > 12 && errs.push("shape_too_many_cells");
  let seen = /* @__PURE__ */ new Set();
  for (let c of cells) {
    if (!Array.isArray(c) || c.length !== 3 || !c.every((v) => Number.isInteger(v))) {
      errs.push("cell_not_integer_triple");
      continue;
    }
    let k = c.join(",");
    seen.has(k) && errs.push(`duplicate_cell_${k}`), seen.add(k);
  }
  if (errs.length) return errs;
  let cs = cells;
  for (let ax of [0, 1, 2]) {
    let vals = cs.map((c) => c[ax]);
    Math.max(...vals) - Math.min(...vals) + 1 > 5 && errs.push("shape_too_large");
  }
  return opts.connected !== !1 && !isConnected(cs) && errs.push("shape_disconnected"), errs;
}
function isConnected(cells) {
  if (!cells.length) return !1;
  let set = new Set(cells.map((c) => c.join(","))), seen = /* @__PURE__ */ new Set([cells[0].join(",")]), stack = [cells[0]];
  for (; stack.length; ) {
    let [x, y, z] = stack.pop();
    for (let [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      let k = `${x + dx},${y + dy},${z + dz}`;
      set.has(k) && !seen.has(k) && (seen.add(k), stack.push([x + dx, y + dy, z + dz]));
    }
  }
  return seen.size === set.size;
}
function normalize(cells) {
  let min = [0, 1, 2].map((a) => Math.min(...cells.map((c) => c[a])));
  return cells.map((c) => [c[0] - min[0], c[1] - min[1], c[2] - min[2]]).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
}
var shapeKey = (cells) => normalize(cells).map((c) => c.join(",")).join(";"), sameShape = (a, b) => shapeKey(a) === shapeKey(b), rot1 = (c, axis) => {
  let [x, y, z] = c;
  return axis === "x" ? [x, -z, y] : axis === "y" ? [z, y, -x] : [-y, x, z];
};
function rotate(cells, axis, turns) {
  let n = (turns % 4 + 4) % 4, out = cells.map((c) => [...c]);
  for (let i = 0; i < n; i++) out = out.map((c) => rot1(c, axis));
  return normalize(out);
}
function reflect(cells, normalAxis) {
  let i = { x: 0, y: 1, z: 2 }[normalAxis];
  return normalize(cells.map((c) => {
    let d = [...c];
    return d[i] = -d[i], d;
  }));
}
function allOrientations(cells) {
  let out = /* @__PURE__ */ new Map(), base = normalize(cells), ups = [base, rotate(base, "x", 1), rotate(base, "x", 2), rotate(base, "x", 3), rotate(base, "z", 1), rotate(base, "z", 3)];
  for (let u of ups) for (let t = 0; t < 4; t++) {
    let r = rotate(u, "y", t);
    out.set(shapeKey(r), r);
  }
  return [...out.values()];
}
var congruentByRotation = (a, b) => allOrientations(a).some((o2) => sameShape(o2, b)), isAchiral = (cells) => congruentByRotation(cells, reflect(cells, "x")), rotationInvariant = (cells, axis, turns) => sameShape(cells, rotate(cells, axis, turns));
function view(cells, side) {
  let proj = cells.map(([x, y, z]) => {
    switch (side) {
      case "front":
        return [x, y];
      case "back":
        return [-x, y];
      case "right":
        return [-z, y];
      case "left":
        return [z, y];
      case "top":
        return [x, -z];
      case "bottom":
        return [x, z];
    }
  }), minC = Math.min(...proj.map((p) => p[0])), maxC = Math.max(...proj.map((p) => p[0])), minR = Math.min(...proj.map((p) => p[1])), maxR = Math.max(...proj.map((p) => p[1])), rows = [];
  for (let up = maxR; up >= minR; up--) {
    let row = "";
    for (let c = minC; c <= maxC; c++) row += proj.some((p) => p[0] === c && p[1] === up) ? "#" : ".";
    rows.push(row);
  }
  return rows;
}
var gridKey = (g) => g.join("/");
function validateGrid(g) {
  return !Array.isArray(g) || !g.length || !g.every((r) => typeof r == "string" && /^[#.]+$/.test(r)) ? ["grid_invalid"] : new Set(g.map((r) => r.length)).size !== 1 ? ["grid_ragged"] : g.some((r) => r.includes("#")) ? [] : ["grid_empty"];
}

// src/engine/voxelRender.ts
var I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1], mul = (a, b) => [
  a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
  a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
  a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
  a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
  a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
  a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
  a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
  a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
  a[6] * b[2] + a[7] * b[5] + a[8] * b[8]
], apply = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]], det = (m) => m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);
function axisRotation(axis, deg) {
  let r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  return axis === "x" ? [1, 0, 0, 0, c, -s, 0, s, c] : axis === "y" ? [c, 0, s, 0, 1, 0, -s, 0, c] : [c, -s, 0, s, c, 0, 0, 0, 1];
}
var CAMERA = mul(axisRotation("x", 25), axisRotation("y", -35)), LIGHT = (() => {
  let v = [-0.45, 0.75, 0.5], n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
})(), FACES = [
  { n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1], tag: "x+" },
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], tag: "x-" },
  { n: [0, 1, 0], u: [0, 0, 1], v: [1, 0, 0], tag: "y+" },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], tag: "y-" },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], tag: "z+" },
  { n: [0, 0, -1], u: [0, 1, 0], v: [1, 0, 0], tag: "z-" }
];
function projectShape(cells, obj = I3, camera = CAMERA) {
  let set = new Set(cells.map((c) => c.join(","))), ctr = [0, 1, 2].map((a) => (Math.min(...cells.map((c) => c[a])) + Math.max(...cells.map((c) => c[a]))) / 2), m = mul(camera, obj), sign = Math.sign(det(obj)) || 1, faces = [];
  for (let cell of cells)
    for (let f of FACES) {
      if (set.has([cell[0] + f.n[0], cell[1] + f.n[1], cell[2] + f.n[2]].join(","))) continue;
      let c = [cell[0] - ctr[0] + f.n[0] * 0.5, cell[1] - ctr[1] + f.n[1] * 0.5, cell[2] - ctr[2] + f.n[2] * 0.5], t = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [
        c[0] + 0.5 * (a * f.u[0] + b * f.v[0]),
        c[1] + 0.5 * (a * f.u[1] + b * f.v[1]),
        c[2] + 0.5 * (a * f.u[2] + b * f.v[2])
      ]).map((p) => apply(m, p)), e1 = [t[1][0] - t[0][0], t[1][1] - t[0][1], t[1][2] - t[0][2]], e2 = [t[2][0] - t[0][0], t[2][1] - t[0][1], t[2][2] - t[0][2]], n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], len = Math.hypot(...n);
      if (len < 1e-6 || (n = [n[0] / len * sign, n[1] / len * sign, n[2] / len * sign], n[2] <= 1e-4)) continue;
      let depth = t.reduce((s, p) => s + p[2], 0) / 4, shade = 0.42 + 0.58 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]), dominant = Math.abs(n[1]) > 0.6 ? "top" : n[0] > 0 ? "right" : "left";
      faces.push({ points: t.map((p) => [p[0], -p[1]]), depth, shade, normalClass: dominant, cell });
    }
  return faces.sort((a, b) => a.depth - b.depth);
}
var inside = (pt, poly) => {
  let r = !1;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    let [xi, yi] = poly[i], [xj, yj] = poly[j];
    yi > pt[1] != yj > pt[1] && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi && (r = !r);
  }
  return r;
};
function visualSignature(cells, obj = I3, n = 44, extent = 4.2) {
  let faces = projectShape(cells, obj), s = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    let pt = [((c + 0.5) / n - 0.5) * 2 * extent, ((r + 0.5) / n - 0.5) * 2 * extent], v = ".";
    for (let f of faces) inside(pt, f.points) && (v = f.normalClass[0]);
    s += v;
  }
  return s;
}

// src/engine/geometry.ts
var norm360 = (deg) => (Math.round(deg) % 360 + 360) % 360;
function orientationOf(o2) {
  let x = !!o2.reflectedX, y = !!o2.reflectedY;
  return x && y ? { r: norm360(o2.rotation + 180), m: !1 } : y ? { r: norm360(o2.rotation + 180), m: !0 } : { r: norm360(o2.rotation), m: x };
}
var SHAPE_SYMMETRY = {
  circle: { rotationPeriod: 1, mirrorAxis: 0 },
  square: { rotationPeriod: 90, mirrorAxis: 0 },
  hexagon: { rotationPeriod: 60, mirrorAxis: 0 },
  star: { rotationPeriod: 72, mirrorAxis: 0 },
  triangle: { rotationPeriod: 120, mirrorAxis: 0 },
  diamond: { rotationPeriod: 180, mirrorAxis: 0 },
  arrow: { rotationPeriod: 360, mirrorAxis: 0 },
  crescent: { rotationPeriod: 360, mirrorAxis: 90 },
  flag: { rotationPeriod: 360, mirrorAxis: null },
  ell: { rotationPeriod: 360, mirrorAxis: null }
};
function canonicalOrientation(shape, o2) {
  let sym = SHAPE_SYMMETRY[shape] ?? { rotationPeriod: 360, mirrorAxis: null }, { r, m } = o2;
  return m && sym.mirrorAxis !== null && (r = norm360(r - 2 * sym.mirrorAxis), m = !1), sym.rotationPeriod <= 1 ? { r: 0, m } : (r = norm360(r) % sym.rotationPeriod, { r, m });
}
function rotateWorld(o2, deltaDeg) {
  let ori = orientationOf(o2);
  return { ...o2, rotation: norm360(ori.r + deltaDeg), reflectedX: ori.m, reflectedY: !1 };
}
function reflectWorld(o2, axis) {
  let ori = orientationOf(o2), r = norm360(axis === "vertical" ? -ori.r : 180 - ori.r);
  return { ...o2, rotation: r, reflectedX: !ori.m, reflectedY: !1 };
}
function sceneSignature(objs) {
  return objs.map((o2) => {
    let c = canonicalOrientation(o2.shape, orientationOf(o2));
    return [o2.shape, c.r, c.m ? 1 : 0, o2.color.toLowerCase(), (o2.scale || 1).toFixed(2), Math.round(o2.x / 5) * 5, Math.round(o2.y / 5) * 5].join(":");
  }).sort().join("|");
}

// src/content/figureRules.ts
var COLORS = { navy: "#233D5B", ochre: "#B98E4C", forest: "#547B62", brick: "#A4493D", slate: "#6E7F8D" }, CYCLE = [COLORS.navy, COLORS.ochre, COLORS.forest], uid = 0;
function o(shape, opts = {}) {
  return uid += 1, { id: `g${uid}`, shape, x: 50, y: 50, rotation: 0, scale: 1, color: COLORS.navy, reflectedX: !1, reflectedY: !1, zIndex: 1, ...opts };
}
var clone = (s) => s.map((x) => ({ ...x, id: `g${++uid}` })), each = (f) => (s) => clone(s).map(f), dots = (n, color = COLORS.navy, shape = "circle") => Array.from({ length: n }, (_, i) => o(shape, { x: 50 + (i - (n - 1) / 2) * 16, y: 50, scale: 0.42, color })), nextColor = (c, step = 1) => {
  let i = CYCLE.findIndex((x) => x.toLowerCase() === c.toLowerCase());
  return CYCLE[(((i < 0 ? 0 : i) + step) % 3 + 3) % 3];
}, rot = (d) => each((x) => rotateWorld(x, d)), flip = (axis) => each((x) => reflectWorld(x, axis)), recolor = (step) => each((x) => ({ ...x, color: nextColor(x.color, step) })), grow = (d) => each((x) => ({ ...x, scale: Math.round(Math.min(1.4, Math.max(0.6, (x.scale || 1) + d)) * 10) / 10 })), same = (s) => clone(s), countBy = (d) => (s) => dots(Math.max(1, s.length + d), s[0]?.color, s[0]?.shape), RULES = {
  rot_cw: {
    id: "rot_cw",
    domain: "rotation",
    skill: "rot-quarter-cw",
    ruleCount: 1,
    says: "Each step turns a quarter turn clockwise (to the right).",
    f: rot(90),
    confusers: [{ f: rot(-90), tag: "wrong_direction" }, { f: flip("vertical"), tag: "flipped_instead_of_turned" }, { f: same, tag: "no_change_applied" }, { f: rot(180), tag: "wrong_step_size" }]
  },
  rot_ccw: {
    id: "rot_ccw",
    domain: "rotation",
    skill: "rot-quarter-ccw",
    ruleCount: 1,
    says: "Each step turns a quarter turn counterclockwise (to the left).",
    f: rot(-90),
    confusers: [{ f: rot(90), tag: "wrong_direction" }, { f: flip("horizontal"), tag: "flipped_instead_of_turned" }, { f: same, tag: "no_change_applied" }, { f: rot(180), tag: "wrong_step_size" }]
  },
  rot_180: {
    id: "rot_180",
    domain: "rotation",
    skill: "rot-half-turn",
    ruleCount: 1,
    says: "Each step turns a half turn, so the shape ends up upside down.",
    f: rot(180),
    confusers: [{ f: flip("horizontal"), tag: "flipped_instead_of_turned" }, { f: rot(90), tag: "wrong_step_size" }, { f: same, tag: "no_change_applied" }, { f: flip("vertical"), tag: "flipped_instead_of_turned" }]
  },
  flip_lr: {
    id: "flip_lr",
    domain: "reflection",
    skill: "ref-horizontal",
    ruleCount: 1,
    says: "The shape flips left to right, like looking in a mirror.",
    f: flip("vertical"),
    confusers: [{ f: rot(180), tag: "turned_instead_of_flipped" }, { f: flip("horizontal"), tag: "wrong_mirror_axis" }, { f: same, tag: "no_change_applied" }, { f: rot(90), tag: "turned_instead_of_flipped" }]
  },
  flip_ud: {
    id: "flip_ud",
    domain: "reflection",
    skill: "ref-vertical",
    ruleCount: 1,
    says: "The shape flips top to bottom, like a reflection in water.",
    f: flip("horizontal"),
    confusers: [{ f: rot(180), tag: "turned_instead_of_flipped" }, { f: flip("vertical"), tag: "wrong_mirror_axis" }, { f: same, tag: "no_change_applied" }, { f: rot(-90), tag: "turned_instead_of_flipped" }]
  },
  count_up: {
    id: "count_up",
    domain: "progression",
    skill: "prog-count-step",
    ruleCount: 1,
    says: "Each step adds exactly one more.",
    f: countBy(1),
    confusers: [{ f: countBy(2), tag: "wrong_step_size" }, { f: same, tag: "no_change_applied" }, { f: countBy(-1), tag: "wrong_direction" }]
  },
  grow: {
    id: "grow",
    domain: "progression",
    skill: "prog-size-scale",
    ruleCount: 1,
    says: "Each step makes the shape a little bigger.",
    f: grow(0.2),
    confusers: [{ f: grow(-0.2), tag: "wrong_direction" }, { f: same, tag: "no_change_applied" }, { f: grow(0.4), tag: "wrong_step_size" }]
  },
  color_cycle: {
    id: "color_cycle",
    domain: "attributes",
    skill: "attr-color-cycle",
    ruleCount: 1,
    says: "The colour goes navy, then ochre, then forest green, then starts again.",
    f: recolor(1),
    confusers: [{ f: recolor(2), tag: "wrong_direction" }, { f: same, tag: "no_change_applied" }, { f: (s) => rot(90)(recolor(0)(s)), tag: "tracks_wrong_attribute" }]
  },
  rot_and_color: {
    id: "rot_and_color",
    domain: "attributes",
    skill: "attr-dual-conjunction",
    ruleCount: 2,
    says: "Two things change at once: a quarter turn clockwise and the next colour.",
    f: (s) => rot(90)(recolor(1)(s)),
    confusers: [{ f: rot(90), tag: "partial_rule" }, { f: recolor(1), tag: "partial_rule" }, { f: (s) => rot(-90)(recolor(1)(s)), tag: "wrong_direction" }, { f: same, tag: "no_change_applied" }]
  }
};

// src/content/bank/taxonomy.ts
var common = ["Exactly four distinct options", "Exactly one defensible answer under the stated rule", "Hint does not reveal the answer", "Explanation and per-option rationales present"], QUESTION_TYPES = [
  // Spatial
  { id: "spatial_cube_rotation", title: "3D cube rotation", domain: "spatial", definition: "Pick the connected-cube shape after a stated quarter-turn about a stated axis.", excludes: "Viewpoint changes, mirror images as the correct answer.", ageBands: ["8-10", "10-12"], difficultyBands: [1, 2, 3, 4, 5], engine: "available", target: 200, acceptance: [...common, "Axis and direction stated in the prompt", "Correct option equals the transformed geometry; no distractor is equivalent", "Options render visually distinct"] },
  { id: "spatial_viewpoint", title: "Views of a cube structure", domain: "spatial", definition: "Pick the flat view of a cube structure seen from a stated side.", excludes: "Perspective drawings; hidden-cube counting.", ageBands: ["8-10", "10-12"], difficultyBands: [1, 2, 3, 4], engine: "available", target: 200, acceptance: [...common, "Viewing side and viewer orientation stated", "Correct grid equals the computed silhouette"] },
  { id: "spatial_plane_reflection", title: "3D mirror reflection", domain: "spatial", definition: "Pick the mirror image of a cube shape across a stated vertical or horizontal plane.", excludes: "Diagonal planes (planned).", ageBands: ["8-10", "10-12"], difficultyBands: [2, 3, 4, 5], engine: "available", target: 200, acceptance: [...common, "Mirror plane stated", "Correct option equals the reflected geometry"] },
  { id: "paper_folding", title: "Paper folding and hole punch", domain: "spatial", definition: "Predict holes after folding, punching and unfolding.", excludes: "", ageBands: ["8-10", "10-12"], difficultyBands: [1, 2, 3, 4], engine: "planned", target: 200, acceptance: common },
  { id: "nets_folding", title: "Nets and folded solids", domain: "spatial", definition: "Match a net to the solid it folds into.", excludes: "", ageBands: ["10-12"], difficultyBands: [2, 3, 4], engine: "planned", target: 200, acceptance: common },
  { id: "face_counting", title: "Visible and hidden faces", domain: "spatial", definition: "Count visible faces or infer hidden cubes.", excludes: "", ageBands: ["8-10", "10-12"], difficultyBands: [1, 2, 3], engine: "planned", target: 200, acceptance: common },
  { id: "shape_assembly", title: "Assembly and disassembly", domain: "spatial", definition: "Pick the piece that completes or splits a shape.", excludes: "", ageBands: ["8-10", "10-12"], difficultyBands: [2, 3, 4], engine: "planned", target: 200, acceptance: common },
  // Pattern and matrix (2D figural)
  { id: "figure_matrix", title: "Figure matrices", domain: "pattern", definition: "2x2 or 3x3 grid with one missing cell governed by row/column rules.", excludes: "", ageBands: ["8-10", "10-12"], difficultyBands: [1, 2, 3, 4, 5], engine: "available", target: 200, acceptance: [...common, "Rule recomputed from the generator"] },
  { id: "figural_analogy", title: "Figural analogies", domain: "pattern", definition: "A is to B as C is to ?, with shapes.", excludes: "", ageBands: ["8-10", "10-12"], difficultyBands: [1, 2, 3, 4], engine: "available", target: 200, acceptance: common },
  { id: "figural_series", title: "Figural series", domain: "pattern", definition: "Pick what comes next in a sequence of figures.", excludes: "", ageBands: ["8-10", "10-12"], difficultyBands: [1, 2, 3, 4], engine: "available", target: 200, acceptance: common },
  { id: "figure_classification", title: "Figure classification", domain: "pattern", definition: "Pick the figure that does not share the rule, or the one that does.", excludes: "", ageBands: ["8-10", "10-12"], difficultyBands: [1, 2, 3, 4], engine: "available", target: 200, acceptance: common },
  { id: "pattern_completion", title: "Pattern completion", domain: "pattern", definition: "Complete a missing region of a tiled design.", excludes: "", ageBands: ["8-10"], difficultyBands: [1, 2, 3], engine: "planned", target: 200, acceptance: common },
  // Quantitative
  { id: "number_series", title: "Number series", domain: "quantitative", definition: "Find the next number from a stated-type progression.", excludes: "", ageBands: ["8-10", "10-12"], difficultyBands: [1, 2, 3, 4], engine: "available", target: 200, acceptance: [...common, "Rule recomputed; no other option fits a simpler rule"] },
  { id: "number_puzzle", title: "Balance and shape equations", domain: "quantitative", definition: "Find a value from balanced scales or icon equations.", excludes: "", ageBands: ["8-10", "10-12"], difficultyBands: [1, 2, 3, 4], engine: "available", target: 200, acceptance: [...common, "Unique positive-integer solution verified by search"] },
  { id: "number_analogy", title: "Number analogies", domain: "quantitative", definition: "a -> b as c -> ?", excludes: "", ageBands: ["8-10", "10-12"], difficultyBands: [1, 2, 3], engine: "planned", target: 200, acceptance: common },
  { id: "arithmetic_reasoning", title: "Arithmetic word problems", domain: "quantitative", definition: "Short multi-step word problems.", excludes: "", ageBands: ["8-10", "10-12"], difficultyBands: [1, 2, 3], engine: "planned", target: 200, acceptance: common },
  // Logical
  { id: "logical_deduction", title: "Ordering and deduction", domain: "logical", definition: "Deduce order or identity from clues.", excludes: "", ageBands: ["8-10", "10-12"], difficultyBands: [2, 3, 4], engine: "planned", target: 200, acceptance: common },
  // Verbal
  { id: "verbal_analogy", title: "Picture and word analogies", domain: "verbal", definition: "A is to B as C is to ?, with words or pictures.", excludes: "", ageBands: ["8-10", "10-12"], difficultyBands: [1, 2, 3], engine: "available", target: 200, acceptance: [...common, "Human semantic review required"] },
  { id: "verbal_classification", title: "Word classification", domain: "verbal", definition: "Pick the word that does not belong.", excludes: "", ageBands: ["8-10", "10-12"], difficultyBands: [1, 2, 3], engine: "available", target: 200, acceptance: [...common, "Human semantic review required"] },
  { id: "sentence_completion", title: "Sentence completion", domain: "verbal", definition: "Pick the word that best completes a sentence.", excludes: "", ageBands: ["8-10", "10-12"], difficultyBands: [1, 2, 3], engine: "planned", target: 200, acceptance: common },
  { id: "synonyms_antonyms", title: "Synonyms and antonyms", domain: "verbal", definition: "", excludes: "", ageBands: ["8-10", "10-12"], difficultyBands: [1, 2, 3], engine: "planned", target: 200, acceptance: common },
  { id: "sentence_arrangement", title: "Sentence arrangement", domain: "verbal", definition: "", excludes: "", ageBands: ["10-12"], difficultyBands: [2, 3], engine: "planned", target: 200, acceptance: common },
  { id: "aural_reasoning", title: "Aural reasoning", domain: "verbal", definition: "Read-aloud clues, pick the answer.", excludes: "", ageBands: ["8-10"], difficultyBands: [1, 2], engine: "planned", target: 200, acceptance: common },
  // Directions
  { id: "following_directions", title: "Following directions", domain: "directions", definition: "Positional and multi-step directions.", excludes: "", ageBands: ["8-10"], difficultyBands: [1, 2, 3], engine: "planned", target: 200, acceptance: common }
], NOTE = "Original practice aligned to publicly described skills. Not affiliated with the test publisher.", LEARNING_PATHS = [
  {
    id: "cogat",
    title: "CogAT practice",
    kind: "exam_prep",
    description: NOTE,
    sections: [
      { id: "cogat-verbal", title: "Verbal Battery", topics: [
        { id: "cogat-verbal-analogies", title: "Picture / verbal analogies", types: ["verbal_analogy"] },
        { id: "cogat-sentence-completion", title: "Sentence completion", types: ["sentence_completion"] },
        { id: "cogat-verbal-classification", title: "Picture / verbal classification", types: ["verbal_classification"] }
      ] },
      { id: "cogat-quant", title: "Quantitative Battery", topics: [
        { id: "cogat-number-analogies", title: "Number analogies", types: ["number_analogy"] },
        { id: "cogat-number-series", title: "Number series", types: ["number_series"] },
        { id: "cogat-number-puzzles", title: "Number puzzles", types: ["number_puzzle"] }
      ] },
      { id: "cogat-nonverbal", title: "Nonverbal Battery", topics: [
        { id: "cogat-figure-matrices", title: "Figure matrices", types: ["figure_matrix", "figural_analogy"] },
        { id: "cogat-paper-folding", title: "Paper folding", types: ["paper_folding"] },
        { id: "cogat-figure-classification", title: "Figure classification", types: ["figure_classification"] }
      ] }
    ]
  },
  {
    id: "olsat",
    title: "OLSAT practice",
    kind: "exam_prep",
    description: NOTE,
    sections: [
      { id: "olsat-comprehension", title: "Verbal comprehension", topics: [
        { id: "olsat-directions", title: "Following directions", types: ["following_directions"] },
        { id: "olsat-synonyms", title: "Synonyms and antonyms", types: ["synonyms_antonyms"] },
        { id: "olsat-arrangement", title: "Sentence completion and arrangement", types: ["sentence_completion", "sentence_arrangement"] }
      ] },
      { id: "olsat-verbal-reasoning", title: "Verbal reasoning", topics: [
        { id: "olsat-aural", title: "Aural reasoning", types: ["aural_reasoning"] },
        { id: "olsat-arithmetic", title: "Arithmetic reasoning", types: ["arithmetic_reasoning"] },
        { id: "olsat-verbal-analogies", title: "Verbal analogies and classification", types: ["verbal_analogy", "verbal_classification"] }
      ] },
      { id: "olsat-figural", title: "Pictorial and figural reasoning", topics: [
        { id: "olsat-figural-classification", title: "Figural classification", types: ["figure_classification"] },
        { id: "olsat-figural-series", title: "Figural series", types: ["figural_series"] },
        { id: "olsat-matrices", title: "Pattern matrices", types: ["figure_matrix", "figural_analogy"] }
      ] },
      { id: "olsat-quant", title: "Quantitative reasoning", topics: [
        { id: "olsat-number", title: "Number relationships and puzzles", types: ["number_series", "number_puzzle"] }
      ] }
    ]
  },
  {
    id: "nnat",
    title: "NNAT practice",
    kind: "exam_prep",
    description: NOTE,
    sections: [
      { id: "nnat-core", title: "Nonverbal reasoning", topics: [
        { id: "nnat-pattern-completion", title: "Pattern completion", types: ["pattern_completion"] },
        { id: "nnat-analogy", title: "Reasoning by analogy", types: ["figural_analogy", "figure_matrix"] },
        { id: "nnat-serial", title: "Serial reasoning", types: ["figural_series"] },
        { id: "nnat-spatial", title: "Spatial visualization", types: ["spatial_cube_rotation", "spatial_viewpoint", "spatial_plane_reflection"] }
      ] }
    ]
  },
  {
    id: "general",
    title: "General Reasoning Studio",
    kind: "general_reasoning",
    description: "Shapes, patterns, numbers and words, at your own pace.",
    sections: [
      { id: "gen-spatial", title: "Shapes and space", topics: [
        { id: "gen-3d-rotation", title: "3D rotation", types: ["spatial_cube_rotation"] },
        { id: "gen-viewpoints", title: "Views from different sides", types: ["spatial_viewpoint"] },
        { id: "gen-mirrors", title: "Mirrors in 3D", types: ["spatial_plane_reflection"] },
        { id: "gen-folding", title: "Folding and nets", types: ["paper_folding", "nets_folding"] },
        { id: "gen-assembly", title: "Building and counting", types: ["face_counting", "shape_assembly"] }
      ] },
      { id: "gen-pattern", title: "Patterns", topics: [
        { id: "gen-matrices", title: "Grids and analogies", types: ["figure_matrix", "figural_analogy"] },
        { id: "gen-series", title: "What comes next", types: ["figural_series", "pattern_completion"] },
        { id: "gen-odd-one-out", title: "Odd one out", types: ["figure_classification"] }
      ] },
      { id: "gen-numbers", title: "Numbers", topics: [
        { id: "gen-number-series", title: "Number patterns", types: ["number_series", "number_analogy"] },
        { id: "gen-balance", title: "Balance puzzles", types: ["number_puzzle"] },
        { id: "gen-word-problems", title: "Word problems", types: ["arithmetic_reasoning"] }
      ] },
      { id: "gen-logic", title: "Logic", topics: [
        { id: "gen-deduction", title: "Clues and order", types: ["logical_deduction"] }
      ] },
      { id: "gen-words", title: "Words", topics: [
        { id: "gen-word-analogies", title: "Word analogies", types: ["verbal_analogy"] },
        { id: "gen-word-groups", title: "Word groups", types: ["verbal_classification"] },
        { id: "gen-sentences", title: "Sentences", types: ["sentence_completion", "sentence_arrangement"] },
        { id: "gen-directions", title: "Following directions", types: ["following_directions", "aural_reasoning"] }
      ] }
    ]
  }
], ALL_TOPICS = LEARNING_PATHS.flatMap((p) => p.sections.flatMap((s) => s.topics.map((t) => ({ ...t, pathId: p.id, sectionId: s.id, sectionTitle: s.title })))), TYPE_IDS = new Set(QUESTION_TYPES.map((t) => t.id)), TOPIC_IDS = new Set(ALL_TOPICS.map((t) => t.id));

// src/content/bank/validate.ts
var VALIDATOR_VERSION = "bank-validator/1.0.0", norm = (s) => s.trim().toLowerCase().replace(/\s+/g, " ");
function seriesTerms(rule, first, n) {
  let out = [first];
  for (let i = 1; i < n; i++) {
    let prev = out[i - 1];
    rule.kind === "arithmetic" ? out.push(prev + rule.step) : rule.kind === "geometric" ? out.push(prev * rule.ratio) : rule.kind === "alternating_add" ? out.push(prev + rule.steps[(i - 1) % rule.steps.length]) : out.push(prev + rule.first_step + (i - 1) * rule.step_increase);
  }
  return out;
}
function solveBalance(p) {
  let shapes = [...new Set(p.scales.flatMap((s) => [...Object.keys(s.left), ...Object.keys(s.right)]))].sort(), sols = [], assign = {}, rec = (i) => {
    if (!(sols.length > 5e3)) {
      if (i === shapes.length) {
        p.scales.every((s) => {
          let sum = (side) => Object.entries(side).reduce((t, [k, n]) => t + assign[k] * n, 0);
          return sum(s.left) === sum(s.right);
        }) && sols.push({ ...assign });
        return;
      }
      for (let v = 1; v <= 12; v++)
        assign[shapes[i]] = v, rec(i + 1);
    }
  };
  return rec(0), sols;
}
function validateQuestion(q) {
  let issues = [], checks = [], err = (path, rule) => issues.push({ question: q?.id ?? "?", path, rule, severity: "error" }), warn = (path, rule) => issues.push({ question: q?.id ?? "?", path, rule, severity: "warning" }), semantic = !1;
  if (!q || typeof q != "object") return { validator_version: VALIDATOR_VERSION, question: "?", version: 0, passed: !1, checks, issues: [{ question: "?", path: "", rule: "not_an_object", severity: "error" }], needs_semantic_review: !1 };
  /^[a-z0-9][a-z0-9-]{2,60}$/.test(q.id ?? "") || err("id", "id_format"), (!Number.isInteger(q.version) || q.version < 1) && err("version", "version_positive_integer");
  let type = QUESTION_TYPES.find((t) => t.id === q.question_type);
  type ? type.engine !== "available" && err("question_type", "question_type_not_supported_yet") : err("question_type", "unknown_question_type");
  let p = q.payload, k = q.answer_key;
  if (!p || typeof p != "object")
    return err("payload", "missing"), finish();
  if (!k || typeof k != "object")
    return err("answer_key", "missing"), finish();
  p.family !== q.question_type && err("payload.family", "family_must_match_question_type"), q.title?.trim() || err("title", "required"), p.prompt?.trim() || err("payload.prompt", "required"), p.hint?.trim() || err("payload.hint", "required"), [1, 2, 3, 4, 5].includes(q.difficulty) || err("difficulty", "range_1_5"), type && !type.ageBands.includes(q.age_band) && err("age_band", "not_supported_for_type"), ["low", "medium", "high"].includes(q.reading_load) || err("reading_load", "enum"), q.learning_objective?.trim() || err("learning_objective", "required"), q.accessibility?.alt?.trim() || err("accessibility.alt", "required"), typeof q.accessibility?.relies_on_color != "boolean" && err("accessibility.relies_on_color", "required"), q.accessibility?.relies_on_color && warn("accessibility.relies_on_color", "question_relies_on_colour"), TOPIC_IDS.has(q.primary_topic) ? ALL_TOPICS.find((t) => t.id === q.primary_topic).types.includes(q.question_type) || err("primary_topic", "topic_does_not_list_this_type") : err("primary_topic", "unknown_topic");
  for (let [i, t] of (q.secondary_topics ?? []).entries()) TOPIC_IDS.has(t) || err(`secondary_topics[${i}]`, "unknown_topic");
  for (let [i, a] of (q.exam_alignment ?? []).entries()) {
    let topic = ALL_TOPICS.find((t) => t.id === a.topic);
    !topic || topic.pathId !== a.exam ? err(`exam_alignment[${i}].topic`, "topic_not_in_exam_path") : topic.types.includes(q.question_type) || err(`exam_alignment[${i}].topic`, "exam_topic_does_not_list_this_type"), a.rationale?.trim() || err(`exam_alignment[${i}].rationale`, "required");
  }
  checks.push("metadata", "taxonomy_references");
  let opts = p.options ?? [];
  (!Array.isArray(p.options) || opts.length !== 4) && err("payload.options", "exactly_four_options");
  let ids = opts.map((o2) => o2.id);
  (new Set(ids).size !== ids.length || ids.some((x) => !x)) && err("payload.options", "option_ids_unique_nonempty"), ids.includes(k.correct) || err("answer_key.correct", "not_an_option");
  for (let id of ids)
    k.rationales?.[id]?.trim() || err(`answer_key.rationales.${id}`, "rationale_required_for_every_option"), id !== k.correct && !k.distractor_kinds?.[id]?.trim() && err(`answer_key.distractor_kinds.${id}`, "required_for_every_distractor");
  if ((!k.explanation?.summary?.trim() || !Array.isArray(k.explanation?.steps) || !k.explanation.steps.length) && err("answer_key.explanation", "summary_and_steps_required"), /\b(answer|correct one) is\b|\boption [a-d]\b/i.test(p.hint ?? "") && err("payload.hint", "hint_reveals_answer"), JSON.stringify(p).match(/"(correct|is_correct|isCorrect|distractor_kinds|rationales)"/) && err("payload", "answer_data_in_public_payload"), checks.push("four_options", "key_references_option", "rationales", "explanation", "hint_no_leak"), q.question_type?.startsWith("spatial_")) {
    let src = p.source?.occupied_cells, se = validateShape(src);
    se.length && se.forEach((e) => err("payload.source", e)), p.interaction?.predict_first !== !0 && err("payload.interaction", "spatial_items_are_predict_first");
    let task = p.task;
    if ((!task?.described_as?.trim() || !p.prompt?.includes(task.described_as)) && err("payload.task.described_as", "prompt_must_state_the_transformation_verbatim"), !se.length && task) {
      let solutionCells = null, solutionGrid = null;
      if (task.type === "rotation" ? !["x", "y", "z"].includes(task.axis) || !Number.isInteger(task.quarter_turns) || task.quarter_turns % 4 === 0 || Math.abs(task.quarter_turns) > 3 ? err("payload.task", "rotation_task_invalid") : (solutionCells = rotate(src, task.axis, task.quarter_turns), rotationInvariant(src, task.axis, task.quarter_turns) && err("payload.source", "shape_unchanged_by_this_rotation")) : task.type === "reflection" ? (solutionCells = reflect(src, task.plane_normal), sameShape(solutionCells, src) ? err("payload.source", "shape_symmetric_across_this_mirror") : isAchiral(src) && warn("payload.source", "achiral_shape_mirror_image_is_also_a_turned_copy")) : task.type === "viewpoint" ? solutionGrid = view(src, task.side) : err("payload.task", "unknown_task"), solutionCells) {
        let vo = p.options, matches = vo.filter((o2) => o2.kind === "voxel" && !validateShape(o2.cells).length && sameShape(o2.cells, solutionCells));
        vo.forEach((o2, i) => {
          o2.kind !== "voxel" ? err(`payload.options[${i}]`, "expected_voxel_option") : validateShape(o2.cells).forEach((e) => err(`payload.options[${i}].cells`, e));
        }), matches.length !== 1 ? err("payload.options", `exactly_one_option_must_equal_the_solution (found ${matches.length})`) : matches[0].id !== k.correct && err("answer_key.correct", "key_disagrees_with_computed_solution"), new Set(vo.map((o2) => shapeKey(o2.cells ?? []))).size !== vo.length && err("payload.options", "equivalent_options");
        let sigs = vo.map((o2) => o2.cells ? visualSignature(o2.cells) : "");
        new Set(sigs).size !== sigs.length && err("payload.options", "options_render_identically"), k.solution?.cells && !sameShape(k.solution.cells, solutionCells) && err("answer_key.solution", "stored_solution_disagrees"), checks.push("geometry_recomputed", "options_not_equivalent", "options_visually_distinct");
      }
      if (solutionGrid) {
        let go = p.options;
        go.forEach((o2, i) => {
          o2.kind !== "grid" ? err(`payload.options[${i}]`, "expected_grid_option") : validateGrid(o2.grid).forEach((e) => err(`payload.options[${i}].grid`, e));
        });
        let matches = go.filter((o2) => o2.grid && gridKey(o2.grid) === gridKey(solutionGrid));
        matches.length !== 1 ? err("payload.options", `exactly_one_option_must_equal_the_view (found ${matches.length})`) : matches[0].id !== k.correct && err("answer_key.correct", "key_disagrees_with_computed_view"), new Set(go.map((o2) => gridKey(o2.grid ?? []))).size !== go.length && err("payload.options", "equivalent_options"), k.solution?.grid && gridKey(k.solution.grid) !== gridKey(solutionGrid) && err("answer_key.solution", "stored_solution_disagrees"), checks.push("view_recomputed", "options_not_equivalent");
      }
    }
  }
  if (q.question_type === "number_series") {
    let seq = p.sequence ?? [];
    if (seq.filter((x) => x === null).length !== 1 && err("payload.sequence", "exactly_one_missing_term"), !k.rule) err("answer_key.rule", "required");
    else if (typeof seq[0] != "number") err("payload.sequence", "first_term_must_be_given");
    else {
      let terms = seriesTerms(k.rule, seq[0], seq.length);
      seq.forEach((v, i) => {
        v !== null && v !== terms[i] && err(`payload.sequence[${i}]`, "term_does_not_follow_rule");
      });
      let missing = terms[seq.indexOf(null)], hits = p.options.filter((o2) => Number(o2.text) === missing);
      hits.length !== 1 ? err("payload.options", `exactly_one_option_must_equal_${missing}`) : hits[0].id !== k.correct && err("answer_key.correct", "key_disagrees_with_rule"), k.answer_value !== void 0 && k.answer_value !== missing && err("answer_key.answer_value", "disagrees_with_rule"), new RegExp(`\\b${missing}\\b`).test(p.hint) && err("payload.hint", "hint_contains_answer"), checks.push("series_recomputed");
    }
  }
  if (q.question_type === "number_puzzle") {
    let sols = solveBalance(p), ask = p.ask, values = new Set(sols.map((s) => ask && s[ask.in_terms_of] ? s[ask.shape] / s[ask.in_terms_of] : NaN));
    if (!sols.length) err("payload.scales", "no_solution_in_1_to_12");
    else if (values.size !== 1) err("payload.ask", `answer_not_unique (${values.size} possible values)`);
    else {
      let value = [...values][0];
      Number.isInteger(value) || err("payload.ask", "answer_not_a_whole_number");
      let hits = p.options.filter((o2) => Number(o2.text) === value);
      hits.length !== 1 ? err("payload.options", `exactly_one_option_must_equal_${value}`) : hits[0].id !== k.correct && err("answer_key.correct", "key_disagrees_with_solution"), k.answer_value !== void 0 && k.answer_value !== value && err("answer_key.answer_value", "disagrees_with_search"), new RegExp(`\\b${value}\\b`).test(p.hint) && err("payload.hint", "hint_contains_answer"), checks.push("unique_answer_by_search");
    }
  }
  if (q.question_type === "verbal_analogy" || q.question_type === "verbal_classification") {
    semantic = !0;
    let to = p.options;
    (new Set(to.map((o2) => norm(o2.text ?? ""))).size !== to.length || to.some((o2) => !o2.text?.trim())) && err("payload.options", "option_text_distinct_nonempty"), q.question_type === "verbal_analogy" && !(p.stem?.a && p.stem?.b && p.stem?.c) && err("payload.stem", "analogy_needs_a_b_c");
    let correct = to.find((o2) => o2.id === k.correct);
    correct && norm(p.hint).includes(norm(correct.text)) && err("payload.hint", "hint_contains_answer"), k.semantic_relation?.trim() || err("answer_key.semantic_relation", "required"), checks.push("verbal_structure", "needs_human_semantic_review");
  }
  if (["figure_matrix", "figural_analogy", "figural_series", "figure_classification"].includes(q.question_type)) {
    let fo = p.options;
    new Set(fo.map((o2) => sceneSignature(o2.objects ?? []))).size !== fo.length && err("payload.options", "equivalent_options");
    let expectKind = { figure_matrix: "matrix", figural_analogy: "analogy", figural_series: "sequence", figure_classification: "classification" }[q.question_type];
    p.stem?.kind !== expectKind && err("payload.stem.kind", `expected_${expectKind}`);
    let ruleId = k.figure_rule, rule = ruleId ? RULES[ruleId] : void 0;
    if (p.stem?.kind !== "classification")
      if (!rule) err("answer_key.figure_rule", "required_for_recomputation");
      else {
        let expected = null, s = p.stem;
        s.kind === "analogy" && (expected = rule.f(s.c)), s.kind === "sequence" && (expected = rule.f(s.frames[s.frames.length - 2])), s.kind === "matrix" && (expected = rule.f(s.cells[s.cells.length - 2]));
        let hits = fo.filter((o2) => expected && sceneSignature(o2.objects) === sceneSignature(expected));
        hits.length !== 1 ? err("payload.options", "exactly_one_option_must_follow_the_rule") : hits[0].id !== k.correct && err("answer_key.correct", "key_disagrees_with_rule"), checks.push("figure_rule_recomputed");
      }
    else semantic = !0;
  }
  return finish();
  function finish() {
    return {
      validator_version: VALIDATOR_VERSION,
      question: q?.id ?? "?",
      version: q?.version ?? 0,
      passed: !issues.some((i) => i.severity === "error"),
      checks,
      issues,
      needs_semantic_review: semantic
    };
  }
}
function validateBatch(qs, existing = []) {
  let reports = qs.map(validateQuestion), batchIssues = [], seen = /* @__PURE__ */ new Map();
  qs.forEach((q, i) => {
    let key = `${q.id}@${q.version}`;
    seen.has(key) && batchIssues.push({ question: q.id, path: `[${i}]`, rule: `duplicate_id_and_version_in_batch (also at [${seen.get(key)}])`, severity: "error" }), seen.set(key, i), existing.some((e) => e.id === q.id && e.version === q.version) && batchIssues.push({ question: q.id, path: `[${i}]`, rule: "version_already_exists_create_a_new_version", severity: "error" });
  });
  let fp = qs.map(fingerprint);
  fp.forEach((f, i) => {
    let j = fp.findIndex((g, jj) => jj !== i && g === f);
    j >= 0 && j < i && qs[i].id !== qs[j].id && batchIssues.push({ question: qs[i].id, path: `[${i}]`, rule: `likely_duplicate_of_${qs[j].id}`, severity: "warning" });
    let ex = existing.find((e) => e.fingerprint === f && e.id !== qs[i].id);
    ex && batchIssues.push({ question: qs[i].id, path: `[${i}]`, rule: `likely_duplicate_of_existing_${ex.id}`, severity: "warning" });
  });
  let ids = /* @__PURE__ */ new Set([...qs.map((q) => q.id), ...existing.map((e) => e.id)]);
  return qs.forEach((q, i) => {
    q.transfer_target && !ids.has(q.transfer_target) && batchIssues.push({ question: q.id, path: `[${i}].transfer_target`, rule: "unknown_transfer_target", severity: "error" });
  }), { ok: !batchIssues.some((x) => x.severity === "error") && reports.every((r) => r.passed), reports, batchIssues };
}
function fingerprint(q) {
  let p = q.payload, strip = (v) => Array.isArray(v) ? v.map(strip) : v && typeof v == "object" ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== "id").map(([k, x]) => [k, strip(x)])) : v;
  return `${q.question_type}|${norm(String(p.prompt ?? ""))}|${JSON.stringify(strip({ ...p, prompt: void 0, hint: void 0, read_aloud: void 0 }))}`;
}
export {
  VALIDATOR_VERSION,
  fingerprint,
  seriesTerms,
  solveBalance,
  validateBatch,
  validateQuestion
};
