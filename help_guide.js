// help_guide.js - the long help, written three times over for three readers.
//
// The same site, explained at the depth each reader needs: Beginner for a
// first or second year undergraduate meeting a structure database for the
// first time, Intermediate for someone who knows nucleic acid chemistry and
// has used a database before, Expert for the bioinformatician or structural
// biologist who wants the fields, the formats and the endpoints.
//
// Wording lives here, not in views/help.ejs, so the page can be rewritten
// without touching the template. Each level is a list of sections; each
// section a list of parts. A part is one of:
//
//   { p: "..." }                    a paragraph
//   { list: ["...", "..."] }        a bulleted list
//   { steps: ["...", "..."] }       a numbered list
//   { table: { head: [...], rows: [[...]] } }
//   { code: "..." }                 a block of commands or output
//   { figure: { name, caption } }   a drawing from views/includes/figures
//   { image: { src, alt, caption } } a picture from public/assets/help
//   { slot: { side, caption } }     room kept for a picture, left or right,
//                                   with the text running beside it
//
// In any of that text, `code` is set in code and [words](/address) is a link.
// Plain text otherwise: no HTML, and no em dashes, as in help_texts.js.
// help.test.js checks all of it.

// The little markup above, as HTML. Everything is escaped first, so a title
// or an organism name with an angle bracket in it cannot become a tag.
const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ESCAPES[c]);

export function rich(text) {
    return escape(text)
        .replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`)
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, words, href) =>
            `<a href="${href}"${href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${words}</a>`);
}

export const LEVELS = [
    {
        key: "beginner",
        name: "Beginner",
        who: "New to structure databases",
        blurb: "Start here if you have met DNA and RNA in a lecture but never opened a structure database.",
        sections: [
            {
                id: "what-it-is",
                title: "What this site is",
                parts: [
                    { p: "NA3DB is a catalogue of experimentally determined structures of nucleic acids. Every entry is a real molecule from a real experiment, published by the group that did the work." },
                    { slot: { side: "right", caption: "A real structure, rendered: something that says at a glance that these are measured molecules and not cartoons." } },
                    { p: "That is the first thing to be clear about: these are measurements, not predictions and not models drawn by a computer. Somebody grew a crystal, or froze a sample, or ran it through a magnet, and worked out where each atom sits." },
                    { p: "The records themselves come from the [Protein Data Bank](https://www.rcsb.org/), the worldwide archive every structure is published into. NA3DB keeps the nucleic acid ones, adds an analysis of their backbone conformation from [DNATCO](https://dnatco.datmos.org/) and base pair analysis from NAPAIR and puts the two behind one search box." },
                    { p: "So you can ask things the PDB alone cannot answer easily: which structures contain a G to U wobble pair, which have an unusual backbone, which other chains in the archive have exactly this sequence." }
                ]
            },
                                    {
                id: "mmcif-file",
                title: "What is mmCIF file",
                parts: [
                    { p: "The primary file format used by the Protein Data Bank (PDB) for storing structural data of biological macromolecules." }
                ]
            },
            {
                id: "one-entry",
                title: "What one entry is",
                parts: [
                    { p: "An entry is one published experiment. It has a four character name, its PDB id, such as `4TNA` or `1EHZ`. That id never changes and never gets reused, which is why papers cite it." },
                    { p: "An entry carries the molecule or molecules that were in the sample, the coordinates of their atoms, and the facts about how it was done:" },
                    { list: [
                        "the experimental method: X-ray diffraction, NMR or electron microscopy",
                        "the resolution, for the methods that have one: how much detail was measured, in angstrom. Lower is better. At 1.5 A you see single atoms; at 3.5 A you see little more than the shape",
                        "who deposited it, when, and in which paper",
                        "what else was in the sample: ions, drugs, proteins, water"
                    ] },
                    { p: "One entry can hold several copies of the same molecule, or a protein and the DNA it binds. That is normal and the page tells you which is which." }
                ]
            },
                        {
                id: "nucleic-acids-type",
                title: "What is nucleic acid",
                parts: [
                    { p: "From the point of this database, nucleic acids are polymers defined in mmCIF files."},
                    { p: "RNA, DNA, PNA and LNA etc." }
                ]
            },
            {
                id: "finding",
                title: "Finding something",
                parts: [
                    { p: "There is one search box, on the [front page](/) and at the top of every search. It looks in the id, the title, the authors, the molecule names, the source organisms and the modified nucleotides, all at once. You do not have to say which." },
                    { steps: [
                        "Type what you know: `tRNA`, `ribozyme`, `Z-DNA`, `Escherichia coli`, a PDB id, or an author's surname.",
                        "Watch the number in the box. It says how many structures match before you press anything, so you can tell a good query from a bad one while typing.",
                        "Press Search."
                    ] },
                    { slot: { side: "left", caption: "The search box with its live count, mid typing." } },
                    { p: "If nothing comes to mind, the front page has a second way in: rows of questions such as What is it made of and How was it solved. Answer a few with Yes or No and the box counts what is left. It is the same search either way." },
                    { p: "One more thing worth knowing early: your search lives in the address. Copy the link from the browser bar and whoever opens it sees exactly the results you saw, in the same order, on the same page." }
                ]
            },
            {
                id: "narrowing",
                title: "Narrowing it down",
                parts: [
                    { p: "A plain search usually finds too much. Press Filters (or go to [Full search](/search?panel=open)) and the panel on the left lets you say more: the method, what the entry is made of, the organism, a bound ligand, how usual the backbone shape is." },
                    { p: "The button at the bottom of the panel always says how many you would get, like Show 103 results, so you never press it and land on an empty page." },
                    { slot: { side: "right", caption: "The filter panel open beside a list of results, with two filter chips in use." } },
                    { p: "Every filter you switch on appears as a chip above the results. Press the cross on a chip to drop that one filter and keep the rest." },
                    { p: "Above the results you can also change how they are drawn, as tiles, cards or lines, and the order they come in: newest first, best resolution first, highest confal score first." }
                ]
            },
            {
                id: "structure-page",
                title: "Reading a structure page",
                parts: [
                    { p: "Press any result and you get that entry's own page, like `/structure/4TNA`. It is long, so it is cut into sections and the list of them runs down the side. The ones you will want first:" },
                    { table: { head: ["Section", "What is in it"], rows: [
                        ["Overview", "the title, the method, the date, the resolution, the authors and the paper"],
                        ["Molecules", "each separate molecule in the entry, its sequence, and a FASTA download"],
                        ["Base pairs", "a picture of every base pair in the molecule, and the counts by kind"],
                        ["Conformation", "the shape of the backbone, step by step, in colour"],
                        ["Ligands", "the small molecules bound to it, each linked to its own page"],
                        ["Citations", "every paper about this entry, with links"]
                    ] } },
                    { figure: { name: "arc-anatomy",
                                caption: "The Base pairs picture, taken apart. The molecule is the straight line, 5' on the left. Every base pair is an arc joining its two bases: green for the usual ones, orange for a G to U wobble, purple for anything else. Arcs nested inside one another are a stem. An arc that crosses the others is drawn underneath, and a dot on the line is a modified nucleotide." } },
                    { p: "Each section has a question mark on its band that explains the words in it, and a chevron that folds it away. An empty section stays in the list, greyed out: None recorded is a fact about the entry too." },
                    { p: "Each section also has its own link, like `/structure/4TNA#base-pairs`, which is the one to paste into an email or a report." }
                ]
            },
            {
                id: "words",
                title: "Words you will meet",
                parts: [
                    { table: { head: ["Word", "What it means"], rows: [
                        ["PDB id", "the four character name of one entry, like 4TNA. Permanent and citable"],
                        ["Resolution", "how much detail was measured, in angstrom. Lower is better"],
                        ["Base pair", "two bases held together by hydrogen bonds"],
                        ["Watson-Crick pair", "the classic pairing: A with T or U, G with C"],
                        ["Modified nucleotide", "a building block that is not plain A, C, G, T or U, nearly always a chemical change to one of them. PSU, pseudouridine, is the most common"],
                        ["Ligand", "a small molecule bound to the structure: an ion like MG, a cofactor, or a drug. Water is left out"],
                        ["Chain", "one continuous strand of the molecule, named by a letter"],
                        ["FASTA", "the plain text format every sequence tool reads"]
                    ] } },
                    { p: "The harder words, Leontis-Westhof family, NtC class, confal score, are explained on the Intermediate page, and on each section's question mark where they are used." }
                ]
            },
            {
                id: "try-it",
                title: "Try it, in four steps",
                parts: [
                    { steps: [
                        "Type `tRNA` in the box and press Search. These are transfer RNAs, the molecules that carry amino acids to the ribosome.",
                        "In the filter panel, set Experimental method to X-ray, and watch the count fall.",
                        "Sort by Resolution, best first, and open the top entry.",
                        "Scroll to Base pairs. The arcs over the line are the pairs; the nested groups are the stems of the cloverleaf you were taught, and the arcs that cross them hold the folded molecule together."
                    ] },
                    { slot: { side: "left", caption: "The finished thing: a tRNA's arc picture, the cloverleaf as the site draws it." } },
                    { p: "That last picture is the whole point of the site: a shape you have only seen as a diagram, measured in a real molecule." }
                ]
            }
        ]
    },

    {
        key: "intermediate",
        name: "Intermediate",
        who: "Knows the chemistry, wants the detail",
        blurb: "For readers who know nucleic acid chemistry and have used a structure database before. What the annotations mean, how the search really behaves, and what to be careful with.",
        sections: [
            {
                id: "contents",
                title: "What is in the database, and what is not",
                parts: [
                    { p: "NA3DB holds the nucleic acid containing entries of the PDB: DNA, RNA, DNA/RNA hybrids, and complexes of any of those with protein. The deposited records are the PDB's own. The backbone analysis and the base pair annotation come from DNATCO's extended mmCIF files for the same entries." },
                    { p: "Two scoping rules matter when you compare numbers with another tool:" },
                    { list: [
                        "Annotation is of the first model only. For an NMR ensemble that means model 1, not an average over the ensemble and not a per model table.",
                        "The counts on a page are those of the deposited file, the asymmetric unit. The arc picture, by contrast, is drawn for biological assembly 1, the molecule as it works in the cell. A dimer that symmetry completes therefore shows more in the picture than the count beside it."
                    ] },
                    { slot: { side: "right", caption: "The same entry twice: the asymmetric unit beside biological assembly 1, to show why the two counts differ." } },
                    { p: "Water is excluded everywhere. A modified base is counted as the base it was made from, so a pseudouridine pairing with A counts as a cWW A-U pair and is also listed as a modified nucleotide." }
                ]
            },
            {
                id: "search-semantics",
                title: "How the search reads your query",
                parts: [
                    { p: "The box is a contains match, any case, across id, title, authors, entity names, source organisms and modified nucleotide codes. It is not a boolean language: there is no AND, OR or quoting to learn." },
                    { p: "The logic lives in the filters instead, and it is worth knowing which way each one goes:" },
                    { list: [
                        "Several values of one filter are an OR. Method X-ray plus EM finds entries solved either way.",
                        "Different filters are an AND. Method X-ray plus Polymer type RNA finds entries that are both.",
                        "The Excludes switch at the top flips the whole search: everything that does not match."
                    ] },
                    { p: "Resolution only applies to the methods that report one, so it appears once you have chosen such a method. Entries without a resolution are not silently dropped by a filter you did not set." },
                    { p: "Everything is in the query string, which means a search is reproducible and quotable. `/search?polymer_type=RNA&experimental_method=X-RAY%20DIFFRACTION&confal_min=70` is a perfectly good thing to put in a methods section." }
                ]
            },
            {
                id: "base-pairs",
                title: "Base pairs and the Leontis-Westhof scheme",
                parts: [
                    { p: "Pairs are named the way the field names them: cis or trans, then the edge of each base that takes part. The edges are Watson-Crick (W), Hoogsteen (H) and sugar (S), which gives twelve families. `cWW` is the familiar pair; `tHS` is a trans pair touching the Hoogsteen edge of one base and the sugar edge of the other." },
                    { image: { src: "/assets/help/lw-families.png",
                               alt: "The twelve Leontis-Westhof families, each drawn as two bases meeting edge to edge, and below them one base with its Watson-Crick, Hoogsteen and sugar edges named",
                               caption: "The twelve families, and the three edges they are named from. A circle marks the Watson-Crick edge, a square the Hoogsteen edge and a triangle the sugar edge; the two bases of a cis pair lie the same way up, a trans pair has one of them turned over." } },
                    { p: "NA3DB groups them for counting into four buckets, which is what the numbers on a card mean:" },
                    { table: { head: ["Bucket", "Holds"], rows: [
                        ["cWW A-U", "canonical pairs, A-T in DNA"],
                        ["cWW G-C", "canonical pairs"],
                        ["cWW G-U", "the wobble pair"],
                        ["Others", "every non canonical pair, broken down by family"]
                    ] } },
                    { p: "In the arc picture, green is a canonical cWW pair, orange the G-U wobble, purple everything else. Nested arcs are a stem. Crossing arcs are a pseudoknot or a long range tertiary contact, and they are drawn below the line so the secondary structure above stays readable." },
                    { p: "The full list, filtered by family, is in the full screen view, and the same data is one press away as CSV." }
                ]
            },
            {
                id: "conformation",
                title: "Backbone shape: NtC, CANA and confal",
                parts: [
                    { p: "DNATCO describes a dinucleotide step, the unit between two neighbouring nucleotides, by its torsion angles, and assigns it to one of 96 NtC classes such as `AA00`. A step that fits none of them is NANT, no class. Classes are grouped into 15 CANA groups: A-form, B-form, BII, Z-form, intercalated, opened, syn and so on." },
                    { slot: { side: "left", caption: "A strip of steps in the DNATCO colours, from A-form through B-form to an unassigned one." } },
                    { p: "The confal score says how well the assignment fits. It runs up to 100: high means the geometry is close to the class centre, low means the step is unusual. A low score is a finding or a modelling problem, and distinguishing the two is your job, not the database's." },
                    { p: "The colours used on the page are DNATCO's own, so a figure made here reads the same as one made there: yellow A-form, pale blue B-form, deep blue BII, cyan minor B, green Z-form, magenta intercalated, red opened, orange syn, light grey no class. A box split in two is a transition, read 5' to 3'." },
                    { p: "You can search on this directly: a confal range, or an NtC class by name, in the 3D Features group of the filter panel. Class definitions follow [Cerny et al. 2020](https://doi.org/10.1093/nar/gkaa383)." }
                ]
            },
            {
                id: "views",
                title: "The three views",
                parts: [
                    { p: "The Views panel on a structure page shows the same molecule three ways, and follows you as you read: 1D while you are in the sequence sections, 3D in Conformation." },
                    { list: [
                        "1D is the sequence with the pairing written as layered dot bracket notation: one row per Leontis-Westhof family, deeper bracket kinds where pairs cross, and & between strands.",
                        "The sequence map puts everything on one ruler: a bar per step, coloured by NtC and as tall as its confal score, then the sequence, then the bracket rows. Point at a column to see its pairs and its step.",
                        "3D is the interactive model, where the structure has been loaded."
                    ] },
                    { figure: { name: "sequence-map",
                                caption: "One column per nucleotide. The bar above is the backbone step to the next one; the bracket rows below are the pairs, one row per family, so a pair that crosses another never has to share a row with it." } },
                    { p: "The notation is downloadable as text, which is the quick way to get a secondary structure into another tool." }
                ]
            },
            {
                id: "same-sequence",
                title: "Chains with the same sequence",
                parts: [
                    { p: "Same sequence finds every other chain in NA3DB whose sequence is identical letter for letter, plain A, C, G, T or U only. Pick any two and the page compares them position by position: the base pairs each one makes, the NtC class of each step, and the chemistry of each nucleotide." },
                    { slot: { side: "right", caption: "Two chains of the same sequence compared, with the positions that differ marked." } },
                    { p: "This is the cheap way to ask whether a feature you are looking at is real or is one crystal's opinion. A nucleotide that one of the two does not model is never counted as a difference, so missing density does not masquerade as a conformational change." }
                ]
            },
            {
                id: "getting-data",
                title: "Taking the data with you",
                parts: [
                    { table: { head: ["What", "Where"], rows: [
                        ["Sequences", "the FASTA button, for one molecule or the whole entry"],
                        ["Base pairs", "the CSV button in the Base pairs section"],
                        ["Secondary structure", "Download notation in the Sequence map"],
                        ["A list of results", "the Report icon in the rail: tick your columns, export to CSV"],
                        ["Anything, by script", "the API, described on the Expert page"]
                    ] } },
                    { p: "The report builder is the one to reach for when you want a table of many entries rather than a file about one." }
                ]
            },
            {
                id: "pitfalls",
                title: "Things that trip people up",
                parts: [
                    { list: [
                        "Picture and count disagree: the picture is assembly 1, the count is the asymmetric unit. Both are correct answers to different questions.",
                        "Only the first model is annotated, so an NMR entry's numbers describe one member of the ensemble.",
                        "A modified base is counted as its parent, which is what you want for pairing statistics and not what you want if you are hunting modifications. Use the Modified nucleotides section or filter for that.",
                        "Author residue numbering is kept as deposited, so it can start above 1 and can skip. Do not assume position equals index.",
                        "A low confal score is not a flag of a bad structure by itself. Look at the step before concluding anything."
                    ] }
                ]
            }
        ]
    },

    {
        key: "expert",
        name: "Expert",
        who: "Wants the fields, formats and endpoints",
        blurb: "For bioinformaticians and structural biologists. Where the data comes from, what the API serves, and what the limits are.",
        sections: [
            {
                id: "provenance",
                title: "Provenance",
                parts: [
                    { p: "Two upstream sources, kept separate in the schema:" },
                    { list: [
                        "The PDB entry record: identifiers, title, method, resolution, deposition date, citations, entities, chains, sequences, ligands, source organisms and expression hosts.",
                        "DNATCO's extended mmCIF for the same entry, which carries the base pair annotation and the step level backbone analysis in its own categories, among them `_ndb_base_pair_list`, `_ndb_base_pair_annotation` and `_ndb_struct_ntc_step`."
                    ] },
                    { p: "Annotation covers the first model. Pair and step counts are of the asymmetric unit as deposited; assembly expansion is applied only for drawing. Waters are dropped at load." },
                    { p: "NtC and CANA assignments and confal scores are DNATCO's, not recomputed here, so they are directly comparable with a DNATCO page for the same entry." }
                ]
            },
            {
                id: "api",
                title: "The API",
                parts: [
                    { p: "JSON unless noted, no key, no rate limit beyond politeness. Filters go in the query string exactly as they do on the website, so you can build a request by searching in the browser and copying the address." },
                    { table: { head: ["Endpoint", "Returns"], rows: [
                        ["GET /api/health", "{\"ok\":true,\"database\":\"up\"}, or 503"],
                        ["GET /api/stats", "the number of entries held"],
                        ["GET /api/fields", "every filter and column the API understands"],
                        ["GET /api/count", "how many entries a search finds"],
                        ["GET /api/entries", "one page of results. Takes page, per_page, sort, match"],
                        ["GET /api/entries/:id", "one entry, or 404"],
                        ["GET /api/export", "every match, for the report"],
                        ["GET /api/entries/:id/base_pairs", "every pair of the first model. ?format=csv for a file"],
                        ["GET /api/entries/:id/arcs", "what the arc picture is drawn from"],
                        ["GET /api/entries/:id/sequence_map", "what the sequence map is drawn from"],
                        ["GET /api/entries/:id/same_sequence", "chains sharing a sequence with this entry"],
                        ["GET /api/same_sequence/compare", "two chains compared, given as ENTRY:CHAIN"],
                        ["GET /api/ligands", "every ligand code, its name and how many entries hold it"],
                        ["GET /structure/:id/arcs.svg", "the arc picture as SVG"],
                        ["GET /structure/:id/fasta", "FASTA of every molecule. ?only=na for nucleic acids only"],
                        ["GET /structure/:id/fasta/:entity", "FASTA of one molecule"]
                    ] } },
                    { slot: { side: "left", caption: "A terminal: one curl against the API and the first lines of what comes back." } },
                    { p: "Status codes are the obvious ones. A list query that matches nothing is a 200 with no results; a missing entry is 404; an impossible range is 400; the database being down is 503. Error bodies never carry the host, the port or the query." }
                ]
            },
            {
                id: "parameters",
                title: "Filter parameters",
                parts: [
                    { table: { head: ["Parameter", "Matches"], rows: [
                        ["q", "the one search box: id, title, authors, entity names, organisms, modified residues"],
                        ["entry_id, author_name, entity_name, source_organism, nonstandard_residue, expression_host, assigned_ntc", "contains, any case"],
                        ["ligand", "the exact code (SAM), or five or more letters of the name"],
                        ["taxonomy_id", "exact number"],
                        ["confal_min, confal_max, resolution_min, resolution_max", "a range"],
                        ["experimental_method, polymer_type, monomer_flag, source_kind, modification", "one of, comma separated"],
                        ["has_ligand, has_water, synthetic", "a yes or no about the entry"],
                        ["match", "contains (default) or excludes, which flips the whole search"],
                        ["page, per_page, sort", "paging and order. per_page defaults to 20"]
                    ] } },
                    { p: "Comma separated values within one parameter are an OR; separate parameters are an AND. Parameter names are a stable interface: they are what bookmarks and published links are made of, so they are not renamed." }
                ]
            },
            {
                id: "pairs-as-data",
                title: "Base pairs as data",
                parts: [
                    { p: "`/api/entries/:id/base_pairs?format=csv` gives one row per pair with the columns `chain_1`, `res_1`, `chain_2`, `res_2`, `family`, `kind`. Residue numbers are the authors' own. `family` is the Leontis-Westhof name; `kind` is the bucket used for the counts: `wc`, `gu` or `nc`." },
                    { code: "import pandas as pd\npairs = pd.read_csv(\"https://na3db.org/api/entries/1EHZ/base_pairs?format=csv\")\npairs.groupby(\"family\").size()" },
                    { p: "The dot bracket notation from the sequence map encodes more than a single bracket line can: one row per family, `[`, `{` and `<` for pairs that cross within a row, a second row of the same family when a nucleotide pairs twice in it, and `&` between strands. Parse it row by row, not as one string, or crossing pairs will look like errors." }
                ]
            },
            {
                id: "bulk",
                title: "Bulk work",
                parts: [
                    { list: [
                        "Page through `/api/entries` with `page` and `per_page`; `per_page` is capped at 200.",
                        "`/api/export` is the report path and is capped at 5,000 rows, which is the right call for a table and the wrong one for a mirror.",
                        "For a whole database copy, take it from the sources: the PDB for the records, DNATCO for the annotation. NA3DB is a view over both, not an archive of record."
                    ] },
                    { code: "curl -s 'https://na3db.org/api/count?polymer_type=RNA&confal_min=80'\ncurl -s 'https://na3db.org/api/entries?q=ribozyme&per_page=200&page=1'\ncurl -s 'https://na3db.org/structure/1EHZ/fasta?only=na'" }
                ]
            },
            {
                id: "limits",
                title: "Limits worth knowing",
                parts: [
                    { list: [
                        "First model only, so no per model or ensemble wide statistics.",
                        "Sequence identity in Same sequence is exact and over plain letters, not an alignment. It will not find a chain that differs by one nucleotide.",
                        "Modified residues are mapped to their parent for pairing, which is deliberate but means pairing statistics do not distinguish a pseudouridine from a uridine.",
                        "Entries not analysed by DNATCO carry the PDB facts but no NtC steps or confal score, and are therefore invisible to a confal filter.",
                        "The 3D viewer is present where a structure has been loaded for it; elsewhere the panel offers the viewers on other sites."
                    ] },
                    { p: "If something here is wrong, or an endpoint would be more useful in another shape, say so on the [Contact](/contact) page. The API is young enough to change." }
                ]
            }
        ]
    },

    {
        key: "resource",
        name: "Resources",
        who: "rsync, mirror, or other programmatic use",
        blurb: "For bioinformaticians and structural biologists.",
        sections: [
            {
                id: "rsync",
                title: "Rsync and mirroring",
                parts: [
                    { p: "Text text and more text" },
                ]
            }
        ]
    }
];

export const LEVEL_KEYS = LEVELS.map((l) => l.key);
export const level_named = (asked) => LEVELS.find((l) => l.key === asked) ?? LEVELS[0];

export default LEVELS;
