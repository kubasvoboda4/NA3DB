// help.test.js - the one "?" help component and the "How to ..." guides:
// every help text lives in help_texts.js, every "?" is drawn by
// views/includes/help.ejs, and every guide shares one look. No database needed.

import test from "node:test";
import assert from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
import help from "./help_texts.js";
import { LEVELS, LEVEL_KEYS, level_named, rich } from "./help_guide.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const views = (dir = "views") => readdirSync(new URL(dir, import.meta.url), { withFileTypes: true })
    .flatMap((f) => f.isDirectory() ? views(`${dir}/${f.name}`) : f.name.endsWith(".ejs") ? [`${dir}/${f.name}`] : []);
const CSS = read("./public/style.css");

test("every help text is plain, filled in and free of em dashes", () => {
    for (const [key, text] of Object.entries(help)) {
        assert.equal(typeof text, "string", key);
        assert.ok(text.trim().length > 20, `${key} is empty`);
        assert.doesNotMatch(text, /—/, `${key} has an em dash`);
    }
});

test("every structure section has its help text, and no text is left unused", () => {
    let sections = [...read("./detail.js").matchAll(/\{ id: "([\w-]+)", title:/g)].map((m) => m[1]);
    assert.equal(sections.length, 12);
    let used = [...sections, ...views().flatMap((v) => [...read(`./${v}`).matchAll(/help\["([\w-]+)"\]/g)].map((m) => m[1]))];
    assert.deepEqual([...new Set(used)].sort(), Object.keys(help).sort());
});

test("every \"?\" is drawn by the one shared template", () => {
    let help_ejs = read("./views/includes/help.ejs");
    assert.match(help_ejs, /<details class="help">/);
    assert.match(help_ejs, /throw new Error/, "an unknown key fails loudly, not as an empty bubble");
    for (const v of views().filter((v) => !v.endsWith("includes/help.ejs"))) {
        let src = read(`./${v}`);
        assert.doesNotMatch(src, /class="(band_)?help"/, `${v} draws its own "?"`);
        assert.doesNotMatch(src, /<summary[^>]*>\?<\/summary>/, `${v} draws its own "?"`);
    }
    assert.match(read("./views/structure.ejs"), /include\("includes\/help", \{ key: s\.id \}\)/);
    assert.doesNotMatch(read("./views/structure.ejs"), /const help = \{/, "the texts live in help_texts.js");
    assert.doesNotMatch(CSS, /band_help/);
});

test("the \"?\" is round, ink blue, and closes on Escape", () => {
    let rule = CSS.match(/\n\.help > summary \{([\s\S]*?)\}/)[1];
    assert.match(rule, /border-radius: 50%/);
    assert.match(rule, /color: var\(--accent\)/);
    assert.match(rule, /border: [\d.]+px solid var\(--accent\)/);
    let page = read("./views/structure.ejs");
    assert.match(page, /event\.key !== "Escape"\) return;[\s\S]{0,120}\.help\[open\]/);
});

test("every guide shares one look", () => {
    let guides = [
        ...views().flatMap((v) => [...read(`./${v}`).matchAll(/<details class="([^"]*)"[^>]*>\s*<summary>(How |Why )/g)]),
        ...read("./public/sameseq.js").matchAll(/<details class="([^"]*)"[^>]*>\s*<summary>(How |Why )/g),
    ].map((m) => m[1]);
    assert.equal(guides.length, 4, "colours, map, same-sequence picture, three tables");
    for (const cls of guides) assert.match(cls, /^guide\b/, `${cls} is not a guide`);
    assert.doesNotMatch(CSS, /\.(report_why|ss_how) (summary|p|ul)/, "a guide restyles its own summary or body");
});

test("the colour guide cites DNATCO's live palette, not the old Mol* copy", () => {
    let page = read("./views/structure.ejs");
    assert.match(page, /href="https:\/\/dnatco\.datmos\.org"/);
    assert.doesNotMatch(page, /dnatco\/src\/color\.ts/);
});

// --- the long help: /help at three depths --------------------------------

const PART_KINDS = ["p", "list", "steps", "table", "code", "figure", "image", "slot"];
const every_string = (level) => level.sections.flatMap((sec) => sec.parts.flatMap((part) => {
    if (part.p) return [part.p];
    if (part.list) return part.list;
    if (part.steps) return part.steps;
    if (part.code) return [part.code];
    if (part.figure) return [part.figure.caption];
    if (part.image) return [part.image.caption, part.image.alt];
    if (part.slot) return [part.slot.caption];
    return [...part.table.head, ...part.table.rows.flat()];
}));

test("the three depths are there, and every level is whole", () => {
    // The three the page is built around come first and keep their keys:
    // links to /help?level=... are published. A level being drafted beside
    // them is fine, so the list is a prefix, not the whole of it.
    assert.deepEqual(LEVEL_KEYS.slice(0, 3), ["beginner", "intermediate", "expert"]);
    assert.deepEqual([...new Set(LEVEL_KEYS)], LEVEL_KEYS, "two levels share a key");
    for (const level of LEVELS) {
        assert.ok(level.name && level.who && level.blurb, level.key);
        assert.ok(level.sections.length >= 1, `${level.key} has nothing to say`);
        let ids = level.sections.map((s) => s.id);
        assert.deepEqual([...new Set(ids)], ids, `${level.key} repeats a section id`);
        for (const sec of level.sections) {
            assert.match(sec.id, /^[a-z][a-z0-9-]*$/, sec.id);
            assert.ok(sec.title && sec.parts.length, sec.id);
            for (const part of sec.parts) {
                let kinds = Object.keys(part);
                assert.equal(kinds.length, 1, `${sec.id} has a part of two kinds`);
                assert.ok(PART_KINDS.includes(kinds[0]), `${sec.id}: ${kinds[0]} is not a part kind`);
            }
        }
    }
});

test("the long help is written the way the short notes are", () => {
    for (const level of LEVELS) {
        for (const text of every_string(level)) {
            assert.equal(typeof text, "string", level.key);
            assert.doesNotMatch(text, /—/, `${level.key}: "${text.slice(0, 40)}" has an em dash`);
            assert.doesNotMatch(text, /<[a-z/]/i, `${level.key}: "${text.slice(0, 40)}" holds HTML`);
        }
    }
});

test("an unknown level is the first one, not an error", () => {
    assert.equal(level_named("expert").key, "expert");
    assert.equal(level_named(undefined).key, "beginner");
    assert.equal(level_named("wizard").key, "beginner");
});

test("rich() escapes first, then marks up code and links", () => {
    assert.equal(rich("a < b & c"), "a &lt; b &amp; c");
    assert.equal(rich("<script>alert(1)</script>"), "&lt;script&gt;alert(1)&lt;/script&gt;");
    assert.equal(rich("the `cWW` pair"), "the <code>cWW</code> pair");
    assert.equal(rich("see [Contact](/contact)"), 'see <a href="/contact">Contact</a>');
    assert.match(rich("see [PDB](https://www.rcsb.org/)"), /target="_blank" rel="noopener"/);
});

test("every figure a level asks for is a template that exists", () => {
    let drawn = LEVELS.flatMap((l) => l.sections.flatMap((s) => s.parts.filter((p) => p.figure).map((p) => p.figure)));
    // Two drawn here, the rest supplied as pictures; see the test above.
    assert.ok(drawn.length >= 2, "the long help is all words");
    let files = readdirSync(new URL("./views/includes/figures", import.meta.url));
    for (const fig of drawn) {
        assert.ok(files.includes(`${fig.name}.ejs`), `no figure named ${fig.name}`);
        assert.ok(fig.caption && fig.caption.length > 30, `${fig.name} has no caption worth reading`);
        // Drawn in the page, not fetched: a figure must take the theme.
        let src = read(`./views/includes/figures/${fig.name}.ejs`);
        assert.match(src, /<svg/, `${fig.name} is not a drawing`);
        assert.doesNotMatch(src, /(fill|stroke)="#/, `${fig.name} paints a colour of its own`);
    }
});

test("every picture a level shows is a file that is there, with words for it", () => {
    let shown = LEVELS.flatMap((l) => l.sections.flatMap((s) => s.parts.filter((p) => p.image).map((p) => p.image)));
    for (const pic of shown) {
        assert.match(pic.src, /^\/assets\/help\//, `${pic.src} is not kept with the help's own pictures`);
        assert.ok(readFileSync(new URL(`./public${pic.src}`, import.meta.url)).length > 1000, `${pic.src} is missing`);
        assert.ok(pic.alt && pic.alt.length > 20, `${pic.src} has no alt text`);
        assert.ok(pic.caption && pic.caption.length > 30, `${pic.src} has no caption`);
    }
});

test("every picture kept room for says which side it is on and what goes there", () => {
    let slots = LEVELS.flatMap((l) => l.sections.flatMap((s) => s.parts.filter((p) => p.slot).map((p) => p.slot)));
    assert.ok(slots.length >= 6, "the long help is one long column of words");
    for (const slot of slots) {
        assert.ok(["left", "right"].includes(slot.side), `a picture on the ${slot.side}`);
        assert.ok(slot.caption.length > 20, "a slot that does not say what belongs in it");
    }
    let css = read("./public/style.css");
    assert.match(css, /\.help_slot_right \{ float: right;/);
    assert.match(css, /\.help_slot_left  \{ float: left;/);
    // A floated picture must not hang into the next section.
    assert.match(css, /\.help_section::after \{[\s\S]*?clear: both;/);
});

test("the help page draws every kind of part, and /help is written", () => {
    let page = read("./views/help.ejs");
    for (const kind of PART_KINDS) assert.match(page, new RegExp(`part\\.${kind}`), `the template ignores ${kind}`);
    assert.match(page, /<%- rich\(part\.p\) %>/, "a paragraph must go through rich()");
    assert.doesNotMatch(page, /<%- (?!rich|include)/, "nothing else is written unescaped");
    assert.match(page, /href="\/help\?level=<%= l\.key %>"/, "each level is a link to bookmark");
    let server = read("./server.js");
    assert.doesNotMatch(server, /const UNWRITTEN = \{[^}]*help:/, "/help has its own page now");
    assert.match(server, /res\.render\("help"/);
});
