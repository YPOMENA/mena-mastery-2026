const ROLE_ABBR = {
  "Chapter Manager":            "CM",
  "Chapter Chair":              "CC",
  "Chapter Vice Chair":         "CVC",
  "Assistant Learning Officer": "ALO",
  "Learning Officer":           "LO",
  "Membership Officer":         "MO",
  "MENA REX Officer":           "REX",
  "Forum Officer":              "FO",
  "Spouse Forum Officer":       "SFO",
  "Member Engagement Officer":  "MEO",
  "Member Engagement Vice Officer": "MEVO",
  "Family Officer":             "FAM",
  "Spouse/Partner Officer":     "SPO",
  "YPO Management Associate":   "MA",
  "Regional Chair":             "RC",
  "YNG":                        "YNG",
  "Panelist":                   "PAN",
  "Other":                      "OTH",
};

const ROLE_COLORS = {
  "Chapter Manager":            "#2E7D32",
  "Chapter Chair":              "#1565C0",
  "Chapter Vice Chair":         "#0277BD",
  "Assistant Learning Officer": "#6A1B9A",
  "Learning Officer":           "#8E24AA",
  "Membership Officer":         "#E65100",
  "MENA REX Officer":           "#00838F",
  "Forum Officer":              "#AD1457",
  "Spouse Forum Officer":       "#C2185B",
  "Member Engagement Officer":  "#3949AB",
  "Member Engagement Vice Officer": "#283593",
  "Family Officer":             "#00695C",
  "Spouse/Partner Officer":     "#D81B60",
  "YPO Management Associate":   "#555555",
  "Regional Chair":             "#B71C1C",
  "YNG":                        "#558B2F",
  "Panelist":                   "#6D4C41",
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

// Chapter values in the export that are really YPO staff entries (including a
// blank chapter); folded into "No Chapter Needed" on load so every staff
// registrant sits in one row.
const CHAPTER_ALIASES = {
  "": "No Chapter Needed",
  "Exchange Test": "No Chapter Needed",
  "Family": "No Chapter Needed",
};
REGISTRANTS.forEach(r => { if (CHAPTER_ALIASES[r.chapter]) r.chapter = CHAPTER_ALIASES[r.chapter]; });

// Confirmed roles that the export gets wrong, as chapter -> { exported role: correct role }.
// Applied on load, after CHAPTER_ALIASES.
const ROLE_OVERRIDES = {
  "YPO Gold Lebanon": { "Membership Officer": "Member Engagement Officer" },
  "YPO Oman Integrated": { "Other": "YNG" },
};
REGISTRANTS.forEach(r => {
  const fix = ROLE_OVERRIDES[r.chapter];
  if (fix && fix[r.role]) r.role = fix[r.role];
});

// Anything outside FULL_CHAPTER_LIST is not a MENA chapter (YPO staff placeholder,
// guest panelists from other regions, ...). Those rows never count toward chapter
// totals and are always pinned to the bottom of chapter lists with a short tag.
const PINNED_TAGS = {
  "No Chapter Needed": "not a chapter",
  "YPO Gold Taiwan": "non-MENA · ALO workshop panelist",
};
function isPinned(chapter) { return !FULL_CHAPTER_LIST.includes(chapter); }
function pinnedTag(chapter) { return PINNED_TAGS[chapter] || "not a MENA chapter"; }
function pinnedLabels(rows) {
  return [...new Set(rows.map(r => r.chapter).filter(isPinned))].sort((a, b) => a.localeCompare(b));
}

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

// MENA Mastery breakout sessions. Each registrant goes to one session, worked
// out from their role (the export has no session field). Roles not listed here
// (REX, YPO staff, YNG, Other) have no session.
const SESSIONS = [
  "Chapter Chair Session",
  "Learning Session",
  "Assistant Learning Session",
  "Forum & Spouse Forum Session",
  "Membership Session",
  "Member Engagement Session",
  "Spouse & Family Session",
];
const NO_SESSION = "No session";
const SESSION_BY_ROLE = {
  "Chapter Chair":              "Chapter Chair Session",
  "Chapter Vice Chair":         "Chapter Chair Session",
  "Regional Chair":             "Chapter Chair Session",
  "Learning Officer":           "Learning Session",
  "Assistant Learning Officer": "Assistant Learning Session",
  "Chapter Manager":            "Assistant Learning Session",
  "Forum Officer":              "Forum & Spouse Forum Session",
  "Spouse Forum Officer":       "Forum & Spouse Forum Session",
  "Membership Officer":         "Membership Session",
  "Member Engagement Officer":  "Member Engagement Session",
  "Member Engagement Vice Officer": "Member Engagement Session",
  "Spouse/Partner Officer":     "Spouse & Family Session",
  "Family Officer":             "Spouse & Family Session",
};
// Chapter-level exceptions, checked before the role mapping.
const SESSION_BY_CHAPTER = {
  "YPO Gold Taiwan": "Assistant Learning Session", // ALO workshop panelist
};
// Per-role, per-chapter session assignments for roles with no single session.
// Each chapter's list is handed out in order to that chapter's registrants with
// the role; anyone left over has no session. Who gets which slot within a
// chapter doesn't matter, as the dashboard only shows chapter-level counts.
const SESSION_ASSIGNMENTS = {
  "MENA REX Officer": {
    "YPO Lebanon":                   ["Member Engagement Session"],
    "YPO Emirates Integrated":       ["Member Engagement Session"],
    "YPO Dubai Integrated":          ["Assistant Learning Session"],
    "YPO Dubai Downtown Integrated": ["Forum & Spouse Forum Session", "Spouse & Family Session"],
    "YPO Khaleej Integrated":        ["Membership Session"],
  },
  "YNG": {
    "YPO Oman Integrated": ["Chapter Chair Session"],
    "YPO Gold Pakistan":   ["Membership Session"],
  },
  "YPO Management Associate": {
    "No Chapter Needed": [
      "Member Engagement Session",
      "Learning Session",
      "Assistant Learning Session",
      "Forum & Spouse Forum Session",
      "Membership Session",
      "Spouse & Family Session",
    ],
  },
};
const ASSIGNED_SESSION = new Map();
Object.entries(SESSION_ASSIGNMENTS).forEach(([role, byChapter]) => {
  Object.entries(byChapter).forEach(([chapter, slots]) => {
    REGISTRANTS.filter(r => r.role === role && r.chapter === chapter)
      .forEach((r, i) => { if (slots[i]) ASSIGNED_SESSION.set(r, slots[i]); });
  });
});

function sessionFor(r) {
  return SESSION_BY_CHAPTER[r.chapter] || ASSIGNED_SESSION.get(r) || SESSION_BY_ROLE[r.role] || NO_SESSION;
}

// ---------- KPI cards ----------
function renderKPIs() {
  const total = REGISTRANTS.length;
  const chapters = new Set(REGISTRANTS.map(r => r.chapter).filter(c => !isPinned(c))).size;
  const inSession = REGISTRANTS.filter(r => sessionFor(r) !== NO_SESSION).length;

  const zeros = zeroChapters();

  const kpis = [
    { num: total, lbl: "Total Registrants" },
    { num: `${chapters} / ${FULL_CHAPTER_LIST.length}`, lbl: "MENA Chapters Represented" },
    { num: inSession, lbl: "Assigned to a Session" },
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
    .filter(([chapter]) => !isPinned(chapter))
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

  // Pinned non-MENA rows always come last.
  pinnedLabels(REGISTRANTS).forEach(label => {
    const count = counts[label];
    wrap.appendChild(el("div", { class: "bar-row pinned-bar" }, [
      el("div", { class: "bar-label", title: label + " — " + pinnedTag(label) }, [document.createTextNode(label)]),
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
  const wrap = document.getElementById("sessionCards");
  [...SESSIONS, NO_SESSION].forEach(s => {
    const count = REGISTRANTS.filter(r => sessionFor(r) === s).length;
    const pct = total ? Math.round((count / total) * 100) : 0;
    wrap.appendChild(el("div", { class: "session-card" + (s === NO_SESSION ? " no-session" : "") }, [
      el("div", {}, [
        el("div", { class: "session-name" }, [document.createTextNode(s)]),
        el("div", { class: "session-pct" }, [document.createTextNode(pct + "% of registrants")]),
      ]),
      el("div", { class: "session-num" }, [document.createTextNode(count)]),
    ]));
  });
}

// ---------- Legend ----------
function renderLegend() {
  const wrap = document.getElementById("legendBar");
  ROLE_ORDER.forEach(role => {
    wrap.appendChild(el("span", { class: "item" }, [
      el("span", { class: "swatch", style: `background:${roleColor(role)}` }, []),
      document.createTextNode(roleAbbr(role) === role ? role : `${roleAbbr(role)} — ${role}`),
    ]));
  });
}

// ---------- Chapter x Role breakdown table ----------
let sortKey = "chapter";
let sortDir = 1;

// Ties on total fall back to chapter name A–Z so the order is stable.
function compareRows(a, b) {
  if (sortKey === "total") return sortDir * (a.total - b.total) || a.chapter.localeCompare(b.chapter);
  return sortDir * a.chapter.localeCompare(b.chapter);
}

function populateFilterOptions() {
  const sessionSel = document.getElementById("sessionFilter");
  [...SESSIONS, NO_SESSION].forEach(s => sessionSel.appendChild(el("option", { value: s }, [document.createTextNode(s)])));
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
    .filter(([chapter]) => !isPinned(chapter))
    .map(([chapter, roleCounts]) => {
      const total = Object.values(roleCounts).reduce((a, b) => a + b, 0);
      return { chapter, roleCounts, total };
    });

  rows.sort(compareRows);

  // Pinned non-MENA rows always come last, alphabetically.
  pinnedLabels(filtered).forEach(label => {
    const total = Object.values(byChapter[label]).reduce((a, b) => a + b, 0);
    rows.push({ chapter: label, roleCounts: byChapter[label], total, isPinned: true });
  });

  return rows;
}

function applyFiltersAndRender() {
  const f = currentFilters();
  let filtered = REGISTRANTS.filter(r => {
    if (f.role && r.role !== f.role) return false;
    if (f.session && sessionFor(r) !== f.session) return false;
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
    unpinned.sort(compareRows);
    rows = [...unpinned, ...pinned];
  }

  if (f.search) rows = rows.filter(r => r.chapter.toLowerCase().includes(f.search));

  renderTable(rows);
  const totalPeople = rows.reduce((sum, r) => sum + r.total, 0);
  const zeroCount = rows.filter(r => r.isZero).length;
  const pinnedCount = rows.filter(r => r.isPinned).length;
  const chapterCount = rows.length - pinnedCount;
  document.getElementById("resultCount").textContent =
    `Showing ${chapterCount} MENA chapter${chapterCount === 1 ? "" : "s"}` +
    (pinnedCount ? ` + ${pinnedCount} non-MENA` : "") +
    ` · ${totalPeople} registrants matching filters` +
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
    if (r.isPinned) chapterTd.appendChild(el("span", { class: "pinned-tag" }, [document.createTextNode(pinnedTag(r.chapter))]));
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

// Keeps the header arrows, aria-sort and the "Sort by" dropdown in step with sortKey/sortDir.
function syncSortUI() {
  document.querySelectorAll("thead th[data-key]").forEach(th => {
    const active = th.getAttribute("data-key") === sortKey;
    th.classList.toggle("sorted", active);
    th.querySelector(".arrow").textContent = active ? (sortDir === 1 ? "▲" : "▼") : "⇅";
    th.setAttribute("aria-sort", active ? (sortDir === 1 ? "ascending" : "descending") : "none");
  });
  document.getElementById("sortSelect").value = `${sortKey}:${sortDir}`;
}

function setSort(key, dir) {
  sortKey = key;
  sortDir = dir;
  syncSortUI();
  applyFiltersAndRender();
}

function setupSortableHeaders() {
  document.querySelectorAll("thead th[data-key]").forEach(th => {
    th.tabIndex = 0;
    const toggle = () => {
      const key = th.getAttribute("data-key");
      setSort(key, sortKey === key ? -sortDir : (key === "total" ? -1 : 1));
    };
    th.addEventListener("click", toggle);
    th.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });
  document.getElementById("sortSelect").addEventListener("change", e => {
    const [key, dir] = e.target.value.split(":");
    setSort(key, Number(dir));
  });
  syncSortUI();
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
    setSort("chapter", 1);
  });
}

// ---------- Declined & cancelled ----------
// Not part of REGISTRANTS, so they never affect the counts above.
function renderDeclined() {
  const body = document.getElementById("declinedBody");
  const byStatus = {};
  DECLINED.forEach(d => byStatus[d.status] = (byStatus[d.status] || 0) + 1);
  document.getElementById("declinedCount").textContent =
    `${DECLINED.length} people · ` +
    Object.entries(byStatus).map(([s, n]) => `${n} ${s.toLowerCase()}`).join(" · ") +
    " · not counted in the registrant totals";

  const order = { Cancelled: 0, Declined: 1 };
  [...DECLINED]
    .sort((a, b) => (order[a.status] ?? 2) - (order[b.status] ?? 2) || !a.chapter - !b.chapter || a.chapter.localeCompare(b.chapter))
    .forEach(d => {
      const roles = el("div", { class: "role-chips" }, []);
      if (d.roles.length) {
        d.roles.forEach(role => roles.appendChild(el("span", { class: "role-chip", style: `background:${roleColor(role)}`, title: role },
          [document.createTextNode(role)])));
      } else {
        roles.appendChild(el("span", { class: "dash" }, [document.createTextNode("Unknown")]));
      }
      body.appendChild(el("tr", {}, [
        el("td", {}, [el("span", { class: `status-pill status-${d.status.toLowerCase()}` }, [document.createTextNode(d.status)])]),
        el("td", { class: "chapter-cell" }, [document.createTextNode(d.chapter || "Unverified")]),
        el("td", {}, [roles]),
        el("td", { class: "declined-note" }, [document.createTextNode(d.note || "")]),
      ]));
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
renderDeclined();
