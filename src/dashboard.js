const ROLE_ABBR = {
  "Chapter Manager":            "CM",
  "Chapter Chair":              "CC",
  "Assistant Learning Officer": "ALO",
  "Learning Officer":           "LO",
  "Membership Officer":         "MO",
  "MENA REX Officer":           "REX",
  "Forum Officer":              "FO",
  "Spouse Forum Officer":       "SFO",
  "Member Engagement Officer":  "MEO",
  "Family Officer":             "FAM",
  "Spouse/Partner Officer":     "SPO",
  "YPO Management Associate":   "MA",
  "Regional Chair":             "RC",
  "Other":                      "OTH",
};

const ROLE_COLORS = {
  "Chapter Manager":            "#2E7D32",
  "Chapter Chair":              "#1565C0",
  "Assistant Learning Officer": "#6A1B9A",
  "Learning Officer":           "#8E24AA",
  "Membership Officer":         "#E65100",
  "MENA REX Officer":           "#00838F",
  "Forum Officer":              "#AD1457",
  "Spouse Forum Officer":       "#C2185B",
  "Member Engagement Officer":  "#3949AB",
  "Family Officer":             "#00695C",
  "Spouse/Partner Officer":     "#D81B60",
  "YPO Management Associate":   "#555555",
  "Regional Chair":             "#B71C1C",
  "Other":                      "#616161",
};

const ROLE_ORDER = Object.keys(ROLE_ABBR);

// Full MENA chapter roster (from the regional chapter master list). Any chapter here
// with zero rows in REGISTRANTS has zero registrations for MENA Mastery and is flagged
// throughout the dashboard. "No Chapter Needed" (YPO Management/staff) is intentionally excluded.
const FULL_CHAPTER_LIST = [
  "YPO Bahrain Integrated",
  "YPO Cairo Integrated",
  "YPO Capital Pakistan Integrated",
  "YPO Dubai Downtown Integrated",
  "YPO Dubai Integrated",
  "YPO Emirates Integrated",
  "YPO Gold Lebanon",
  "YPO Gold Pakistan",
  "YPO Gold Saudi",
  "YPO Indus Integrated",
  "YPO Iraq Integrated",
  "YPO Jordan Integrated",
  "YPO Khaleej Integrated",
  "YPO Kuwait Integrated",
  "YPO Lebanon",
  "YPO Levant Integrated",
  "YPO MENA Gulf Regional Integrated",
  "YPO MENA One Regional Integrated",
  "YPO Morocco Integrated",
  "YPO Olive MENA Regional Integrated",
  "YPO Oman Integrated",
  "YPO Pakistan",
  "YPO Palestine Integrated",
  "YPO Qatar Integrated",
  "YPO Saudi",
  "YPO Tunisia Integrated",
  "YPO UAE Integrated",
];

function zeroChapters() {
  const registered = new Set(REGISTRANTS.map(r => r.chapter));
  return FULL_CHAPTER_LIST.filter(c => !registered.has(c));
}

// Not real MENA chapters — YPO Management/staff placeholder. Always pinned to the
// bottom of chapter lists rather than sorted in with real chapters.
const PINNED_LABELS = ["No Chapter Needed"];

function roleColor(role) { return ROLE_COLORS[role] || "#455A64"; }
function roleAbbr(role) { return ROLE_ABBR[role] || role; }

function el(tag, attrs, children) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === "class") e.className = attrs[k];
    else if (k === "html") e.innerHTML = attrs[k];
    else if (k === "style") e.setAttribute("style", attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  if (children) children.forEach(c => e.appendChild(c));
  return e;
}

// ---------- KPI cards ----------
function renderKPIs() {
  const total = REGISTRANTS.length;
  const chapters = new Set(REGISTRANTS.map(r => r.chapter)).size;
  const welcome = REGISTRANTS.filter(r => r.sessions.includes("Welcome Social")).length;
  const mastery = REGISTRANTS.filter(r => r.sessions.includes("MENA Mastery Sessions")).length;
  const white = REGISTRANTS.filter(r => r.sessions.includes("MENA White Party")).length;
  const spousesTotal = REGISTRANTS.filter(r => r.welcomeSpouse === "Yes" || r.whiteSpouse === "Yes").length;

  const zeros = zeroChapters();

  const kpis = [
    { num: total, lbl: "Total Registrants" },
    { num: chapters, lbl: "Chapters Represented" },
    { num: welcome, lbl: "Welcome Social" },
    { num: mastery, lbl: "MENA Mastery Sessions" },
    { num: white, lbl: "MENA White Party" },
    { num: spousesTotal, lbl: "Bringing a Spouse/Partner" },
    { num: zeros.length, lbl: "Chapters w/ Zero Registrations", warn: zeros.length > 0 },
  ];

  const grid = document.getElementById("kpiGrid");
  kpis.forEach(k => {
    grid.appendChild(el("div", { class: "kpi-card" }, [
      el("div", { class: "num", style: k.warn ? "color:#cf4436" : "" }, [document.createTextNode(k.num)]),
      el("div", { class: "lbl" }, [document.createTextNode(k.lbl)]),
    ]));
  });
}

// ---------- Chapter bars ----------
function renderChapterBars() {
  const counts = {};
  REGISTRANTS.forEach(r => counts[r.chapter] = (counts[r.chapter] || 0) + 1);
  const zeros = zeroChapters();

  const entries = Object.entries(counts)
    .filter(([chapter]) => !PINNED_LABELS.includes(chapter))
    .sort((a, b) => b[1] - a[1]);
  const max = entries.length ? entries[0][1] : 1;
  const wrap = document.getElementById("chapterBars");

  entries.forEach(([chapter, count]) => {
    const pct = Math.max(4, Math.round((count / max) * 100));
    wrap.appendChild(el("div", { class: "bar-row" }, [
      el("div", { class: "bar-label", title: chapter }, [document.createTextNode(chapter)]),
      el("div", { class: "bar-track" }, [el("div", { class: "bar-fill navy", style: `width:${pct}%` }, [])]),
      el("div", { class: "bar-count" }, [document.createTextNode(count)]),
    ]));
  });

  zeros.forEach(chapter => {
    wrap.appendChild(el("div", { class: "bar-row zero-bar" }, [
      el("div", { class: "bar-label", title: chapter + " — no registrations" }, [document.createTextNode("⚠ " + chapter)]),
      el("div", { class: "bar-track" }, [el("div", { class: "bar-fill", style: "width:0%" }, [])]),
      el("div", { class: "bar-count" }, [document.createTextNode("0")]),
    ]));
  });

  // Pinned non-chapter rows (YPO Management/staff) always come last.
  PINNED_LABELS.forEach(label => {
    const count = counts[label] || 0;
    if (count === 0) return;
    wrap.appendChild(el("div", { class: "bar-row pinned-bar" }, [
      el("div", { class: "bar-label", title: label + " — not a MENA chapter" }, [document.createTextNode(label)]),
      el("div", { class: "bar-track" }, [el("div", { class: "bar-fill", style: `width:${Math.max(4, Math.round((count / max) * 100))}%` }, [])]),
      el("div", { class: "bar-count" }, [document.createTextNode(count)]),
    ]));
  });

  const calloutWrap = document.getElementById("zeroCallout");
  if (zeros.length) {
    calloutWrap.appendChild(el("div", { class: "zero-callout" }, [
      document.createTextNode("⚠ "),
      el("strong", {}, [document.createTextNode(String(zeros.length) + " chapter" + (zeros.length > 1 ? "s" : "") + "")]),
      document.createTextNode(" with zero registrations: " + zeros.join(", ")),
    ]));
  }
}

// ---------- Role bars (global) ----------
function renderRoleBars() {
  const counts = {};
  REGISTRANTS.forEach(r => counts[r.role] = (counts[r.role] || 0) + 1);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? entries[0][1] : 1;
  const wrap = document.getElementById("roleBars");
  wrap.style.display = "grid";
  wrap.style.gridTemplateColumns = "repeat(auto-fit, minmax(280px, 1fr))";
  wrap.style.gap = "6px 22px";
  entries.forEach(([role, count]) => {
    const pct = Math.max(4, Math.round((count / max) * 100));
    wrap.appendChild(el("div", { class: "bar-row" }, [
      el("div", { class: "bar-label", style: "width:180px;", title: role }, [document.createTextNode(role)]),
      el("div", { class: "bar-track" }, [el("div", { class: "bar-fill", style: `width:${pct}%; background:${roleColor(role)}` }, [])]),
      el("div", { class: "bar-count" }, [document.createTextNode(count)]),
    ]));
  });
}

// ---------- Session cards ----------
function renderSessionCards() {
  const total = REGISTRANTS.length;
  const sessionsOrder = ["Welcome Social", "MENA Mastery Sessions", "MENA White Party"];
  const wrap = document.getElementById("sessionCards");
  sessionsOrder.forEach(s => {
    const count = REGISTRANTS.filter(r => r.sessions.includes(s)).length;
    const pct = total ? Math.round((count / total) * 100) : 0;
    wrap.appendChild(el("div", { class: "session-card" }, [
      el("div", {}, [
        el("div", { class: "session-name" }, [document.createTextNode(s)]),
        el("div", { class: "session-pct" }, [document.createTextNode(pct + "% of registrants")]),
      ]),
      el("div", { class: "session-num" }, [document.createTextNode(count)]),
    ]));
  });

  const spouseWrap = document.getElementById("spouseCards");
  const welcomeSp = REGISTRANTS.filter(r => r.welcomeSpouse === "Yes").length;
  const whiteSp = REGISTRANTS.filter(r => r.whiteSpouse === "Yes").length;
  [
    { name: "Welcome Social +1", count: welcomeSp },
    { name: "White Party +1", count: whiteSp },
  ].forEach(s => {
    spouseWrap.appendChild(el("div", { class: "session-card" }, [
      el("div", {}, [el("div", { class: "session-name" }, [document.createTextNode(s.name)])]),
      el("div", { class: "session-num" }, [document.createTextNode(s.count)]),
    ]));
  });
}

// ---------- Legend ----------
function renderLegend() {
  const wrap = document.getElementById("legendBar");
  ROLE_ORDER.forEach(role => {
    wrap.appendChild(el("span", { class: "item" }, [
      el("span", { class: "swatch", style: `background:${roleColor(role)}` }, []),
      document.createTextNode(`${roleAbbr(role)} — ${role}`),
    ]));
  });
}

// ---------- Chapter x Role breakdown table ----------
let sortKey = "chapter";
let sortDir = 1;

function populateFilterOptions() {
  const roleSel = document.getElementById("roleFilter");
  ROLE_ORDER.forEach(r => {
    const count = REGISTRANTS.filter(x => x.role === r).length;
    if (count > 0) roleSel.appendChild(el("option", { value: r }, [document.createTextNode(r)]));
  });
}

function currentFilters() {
  return {
    search: document.getElementById("searchBox").value.trim().toLowerCase(),
    role: document.getElementById("roleFilter").value,
    session: document.getElementById("sessionFilter").value,
  };
}

function buildChapterBreakdown(filtered) {
  const byChapter = {};
  filtered.forEach(r => {
    if (!byChapter[r.chapter]) byChapter[r.chapter] = {};
    byChapter[r.chapter][r.role] = (byChapter[r.chapter][r.role] || 0) + 1;
  });
  let rows = Object.entries(byChapter)
    .filter(([chapter]) => !PINNED_LABELS.includes(chapter))
    .map(([chapter, roleCounts]) => {
      const total = Object.values(roleCounts).reduce((a, b) => a + b, 0);
      return { chapter, roleCounts, total };
    });

  if (sortKey === "chapter") {
    rows.sort((a, b) => sortDir * a.chapter.localeCompare(b.chapter));
  } else if (sortKey === "total") {
    rows.sort((a, b) => sortDir * (a.total - b.total));
  }

  // Pinned non-chapter rows (YPO Management/staff) always come last, unsorted.
  PINNED_LABELS.forEach(label => {
    if (byChapter[label]) {
      const total = Object.values(byChapter[label]).reduce((a, b) => a + b, 0);
      rows.push({ chapter: label, roleCounts: byChapter[label], total, isPinned: true });
    }
  });

  return rows;
}

function applyFiltersAndRender() {
  const f = currentFilters();
  let filtered = REGISTRANTS.filter(r => {
    if (f.role && r.role !== f.role) return false;
    if (f.session && !r.sessions.includes(f.session)) return false;
    return true;
  });

  let rows = buildChapterBreakdown(filtered);

  // Only surface zero-registration chapters when no role/session filter narrows the
  // view away from "everyone" — otherwise a chapter could look zero just because of
  // the filter, not because it truly has no registrations for the event.
  if (!f.role && !f.session) {
    const present = new Set(rows.map(r => r.chapter));
    const pinned = rows.filter(r => r.isPinned);
    let unpinned = rows.filter(r => !r.isPinned);
    zeroChapters().forEach(chapter => {
      if (!present.has(chapter)) unpinned.push({ chapter, roleCounts: {}, total: 0, isZero: true });
    });
    if (sortKey === "chapter") unpinned.sort((a, b) => sortDir * a.chapter.localeCompare(b.chapter));
    else if (sortKey === "total") unpinned.sort((a, b) => sortDir * (a.total - b.total));
    rows = [...unpinned, ...pinned];
  }

  if (f.search) rows = rows.filter(r => r.chapter.toLowerCase().includes(f.search));

  renderTable(rows);
  const totalPeople = rows.reduce((sum, r) => sum + r.total, 0);
  const zeroCount = rows.filter(r => r.isZero).length;
  document.getElementById("resultCount").textContent =
    `Showing ${rows.length} chapters · ${totalPeople} registrants matching filters` +
    (zeroCount ? ` · ${zeroCount} with zero registrations` : "");
}

function renderTable(rows) {
  const body = document.getElementById("tableBody");
  body.innerHTML = "";
  if (!rows.length) {
    body.appendChild(el("tr", {}, [
      el("td", { colspan: "3" }, [el("div", { class: "empty-state" }, [document.createTextNode("No chapters match these filters.")])])
    ]));
    return;
  }

  let grandTotal = 0;
  const grandByRole = {};

  rows.forEach(r => {
    grandTotal += r.total;
    Object.entries(r.roleCounts).forEach(([role, ct]) => {
      grandByRole[role] = (grandByRole[role] || 0) + ct;
    });

    const tr = el("tr", { class: r.isZero ? "zero-row" : (r.isPinned ? "pinned-row" : "") }, []);
    const chapterTd = el("td", { class: "chapter-cell" }, [document.createTextNode(r.chapter)]);
    if (r.isPinned) chapterTd.appendChild(el("span", { class: "pinned-tag" }, [document.createTextNode("not a chapter")]));
    tr.appendChild(chapterTd);

    const chipsWrap = el("div", { class: "role-chips" }, []);
    const rolesPresent = ROLE_ORDER.filter(role => r.roleCounts[role]);
    if (r.isZero) {
      chipsWrap.appendChild(el("span", { class: "zero-tag" }, [document.createTextNode("⚠ No registrations")]));
    } else if (rolesPresent.length) {
      rolesPresent.forEach(role => {
        chipsWrap.appendChild(el("span", { class: "role-chip", style: `background:${roleColor(role)}`, title: role }, [
          document.createTextNode(roleAbbr(role) + " "),
          el("span", { class: "ct" }, [document.createTextNode(String(r.roleCounts[role]))]),
        ]));
      });
    } else {
      chipsWrap.appendChild(el("span", { class: "dash" }, [document.createTextNode("—")]));
    }
    tr.appendChild(el("td", {}, [chipsWrap]));
    tr.appendChild(el("td", { class: "total-cell" }, [document.createTextNode(String(r.total))]));
    body.appendChild(tr);
  });

  // Grand total row
  const gTr = el("tr", { class: "grand-row" }, []);
  gTr.appendChild(el("td", {}, [document.createTextNode("Grand Total")]));
  const gChips = el("div", { class: "role-chips" }, []);
  ROLE_ORDER.filter(role => grandByRole[role]).forEach(role => {
    gChips.appendChild(el("span", { class: "role-chip", style: `background:${roleColor(role)}`, title: role }, [
      document.createTextNode(roleAbbr(role) + " "),
      el("span", { class: "ct" }, [document.createTextNode(String(grandByRole[role]))]),
    ]));
  });
  gTr.appendChild(el("td", {}, [gChips]));
  gTr.appendChild(el("td", { class: "total-cell" }, [document.createTextNode(String(grandTotal))]));
  body.appendChild(gTr);
}

function setupSortableHeaders() {
  document.querySelectorAll("thead th[data-key]").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-key");
      if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = key === "total" ? -1 : 1; }
      document.querySelectorAll("thead th .arrow").forEach(a => a.textContent = "");
      th.querySelector(".arrow").textContent = sortDir === 1 ? "▲" : "▼";
      applyFiltersAndRender();
    });
  });
}

function setupFilterEvents() {
  ["searchBox", "roleFilter", "sessionFilter"].forEach(id => {
    document.getElementById(id).addEventListener("input", applyFiltersAndRender);
    document.getElementById(id).addEventListener("change", applyFiltersAndRender);
  });
  document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("searchBox").value = "";
    document.getElementById("roleFilter").value = "";
    document.getElementById("sessionFilter").value = "";
    applyFiltersAndRender();
  });
}

renderKPIs();
renderChapterBars();
renderRoleBars();
renderSessionCards();
renderLegend();
populateFilterOptions();
setupSortableHeaders();
setupFilterEvents();
applyFiltersAndRender();
