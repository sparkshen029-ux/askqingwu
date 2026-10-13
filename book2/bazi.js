/* bazi.js — Four Pillars calculator, The Old Master Series · Book Two.
   v1.0 basic edition · v1.1 adds the climate line: one line after the three checks,
   from the Qiongtong Baojian entries the book itself quotes and checks (first-month
   Jia and third-month Jia, chapter six; fifth-month Bing, chapter ten). Any other
   month gets the boundary stated, never an improvised prescription.
   Zero interpretation: computes and displays the pillars; the reading is the reader's.
   Contract (book ch00): question first · records the date · shows the pillars as they
   fall · names its tables and rules · then stops talking. Privacy (ch12): nothing you
   type leaves this page.
   Data tables match Appendix A of the book. Rules per the book's P-cards:
   year turns at Lìchūn · months turn at the 12 minor terms · day = Julian-day wheel ·
   hour = true solar time (longitude + equation of time, shown) · night rat-hour two schools. */

(function () {
"use strict";

/* ---------- data ---------- */
var STEMS = [
  {zh:"甲", py:"jiǎ", el:"Wood", yang:true}, {zh:"乙", py:"yǐ", el:"Wood", yang:false},
  {zh:"丙", py:"bǐng", el:"Fire", yang:true}, {zh:"丁", py:"dīng", el:"Fire", yang:false},
  {zh:"戊", py:"wù", el:"Earth", yang:true}, {zh:"己", py:"jǐ", el:"Earth", yang:false},
  {zh:"庚", py:"gēng", el:"Metal", yang:true}, {zh:"辛", py:"xīn", el:"Metal", yang:false},
  {zh:"壬", py:"rén", el:"Water", yang:true}, {zh:"癸", py:"guǐ", el:"Water", yang:false}
];
var BRANCHES = [
  {zh:"子", py:"zǐ", el:"Water", yang:true,  animal:"Rat"},
  {zh:"丑", py:"chǒu", el:"Earth", yang:false, animal:"Ox"},
  {zh:"寅", py:"yín", el:"Wood", yang:true,  animal:"Tiger"},
  {zh:"卯", py:"mǎo", el:"Wood", yang:false, animal:"Rabbit"},
  {zh:"辰", py:"chén", el:"Earth", yang:true,  animal:"Dragon"},
  {zh:"巳", py:"sì", el:"Fire", yang:false, animal:"Snake"},
  {zh:"午", py:"wǔ", el:"Fire", yang:true,  animal:"Horse"},
  {zh:"未", py:"wèi", el:"Earth", yang:false, animal:"Goat"},
  {zh:"申", py:"shēn", el:"Metal", yang:true,  animal:"Monkey"},
  {zh:"酉", py:"yǒu", el:"Metal", yang:false, animal:"Rooster"},
  {zh:"戌", py:"xū", el:"Earth", yang:true,  animal:"Dog"},
  {zh:"亥", py:"hài", el:"Water", yang:false, animal:"Pig"}
];
var HIDDEN = [ /* [main, mid, rest] */
  ["癸"], ["己","癸","辛"], ["甲","丙","戊"], ["乙"], ["戊","乙","癸"], ["丙","庚","戊"],
  ["丁","己"], ["己","丁","乙"], ["庚","壬","戊"], ["辛"], ["戊","辛","丁"], ["壬","甲"]
];
var EL_FEEDS = {Wood:"Fire", Fire:"Earth", Earth:"Metal", Metal:"Water", Water:"Wood"};
var EL_CONTROLS = {Wood:"Earth", Earth:"Water", Water:"Fire", Fire:"Metal", Metal:"Wood"};
var FEEDS_ME = {Fire:"Wood", Earth:"Fire", Metal:"Earth", Water:"Metal", Wood:"Water"};
var GRADE = {
  same:       {zh:"旺", py:"wàng", en:"Prime — in season, at the height of its round"},
  fed:        {zh:"相", py:"xiàng", en:"Next — the month feeds this element; the heir behind the sitting power"},
  feeding:    {zh:"休", py:"xiū", en:"Resting — this element's push has gone out into the month"},
  overrunning:{zh:"囚", py:"qiú", en:"Pressed — an aggressor against the month's throne"},
  overrun:    {zh:"死", py:"sǐ", en:"Spent — overpowered by the month"}
};
var TERMS = [ /* the 12 minor terms that open months: name, apparent longitude, month branch */
  {n:"Lìchūn 立春",   lon:315, br:2},  {n:"Jīngzhé 惊蛰", lon:345, br:3},
  {n:"Qīngmíng 清明", lon:15,  br:4},  {n:"Lìxià 立夏",  lon:45,  br:5},
  {n:"Mángzhòng 芒种", lon:75, br:6},  {n:"Xiǎoshǔ 小暑", lon:105, br:7},
  {n:"Lìqiū 立秋",    lon:135, br:8},  {n:"Báilù 白露",  lon:165, br:9},
  {n:"Hánlù 寒露",    lon:195, br:10}, {n:"Lìdōng 立冬", lon:225, br:11},
  {n:"Dàxuě 大雪",    lon:255, br:0},  {n:"Xiǎohán 小寒", lon:285, br:1}
];
var WUHU = {0:2, 5:2, 1:4, 6:4, 2:6, 7:6, 3:8, 8:8, 4:0, 9:0}; /* Tiger-month stem by year stem: 甲己→丙 乙庚→戊 丙辛→庚 丁壬→壬 戊癸→甲 */
var WUSHU = {0:0, 5:0, 1:2, 6:2, 2:4, 7:4, 3:6, 8:6, 4:8, 9:8}; /* zi-hour stem by day stem: 甲己→甲 乙庚→丙 丙辛→戊 丁壬→庚 戊癸→壬 */
var CITIES = [
  ["Beijing", 116.4074, 8], ["Shanghai", 121.4737, 8], ["Chengdu", 104.0667, 8],
  ["Chongqing", 106.5516, 8], ["Guangzhou", 113.2644, 8], ["Shenzhen", 114.0579, 8],
  ["Hangzhou", 120.1551, 8], ["Nanjing", 118.7969, 8], ["Wuhan", 114.3054, 8],
  ["Xi'an", 108.9402, 8], ["Tianjin", 117.1901, 8], ["Kunming", 102.8329, 8],
  ["Changsha", 112.9388, 8], ["Urumqi", 87.6177, 8], ["Lhasa", 91.1322, 8],
  ["Harbin", 126.6424, 8], ["Shenyang", 123.4315, 8], ["Qingdao", 120.3826, 8],
  ["Xiamen", 118.0894, 8], ["Lanzhou", 103.8343, 8], ["Hong Kong", 114.1694, 8],
  ["Taipei", 121.5654, 8], ["Singapore", 103.8516, 8], ["Kuala Lumpur", 101.6869, 8],
  ["New York", -74.0060, -5], ["Toronto", -79.3832, -5], ["Chicago", -87.6298, -6],
  ["Los Angeles", -118.2437, -8], ["San Francisco", -122.4194, -8],
  ["Vancouver", -123.1216, -8], ["London", -0.1276, 0], ["Paris", 2.3522, 1],
  ["Berlin", 13.4050, 1], ["Sydney", 151.2093, 10], ["Melbourne", 144.9631, 10],
  ["Auckland", 174.7633, 12]
];
var CN_DST = [[1986,5,4,1986,9,14],[1987,4,12,1987,9,13],[1988,4,17,1988,9,11],
              [1989,4,16,1989,9,17],[1990,4,15,1990,9,16],[1991,4,14,1991,9,15]];
/* climate line (v1.1) — only the Qiongtong Baojian entries the book itself quotes and
   verifies; every other month reports the boundary honestly. Zero interpretation:
   the line says what the catalogue calls for, and draws no conclusion about a life. */
var CLIMATE = {
  "甲|寅": {t:"first-month Jia wood: toward Bing revealed and Gui hidden — cold wood facing the sun", ch:"six"},
  "甲|辰": {t:"third-month Jia wood: toward Geng metal first, Ren water second", ch:"six"},
  "丙|午": {t:"fifth-month Bing fire: toward Ren and Geng revealed high", ch:"ten"}
};
function climateLine(dayStemIdx, monthBrIdx){
  var e = CLIMATE[STEMS[dayStemIdx].zh + "|" + BRANCHES[monthBrIdx].zh];
  if (e) return "The climate tables (Qiongtong Baojian) call " + e.t +
    ". The book quotes this entry in chapter " + e.ch + ".";
  return "The tables in the book cover this month's entry; see chapter six. This tool prints " +
    "only the entries the book itself quotes, and it will not improvise the rest.";
}

/* ---------- astronomy (Meeus/NOAA-grade low precision; time error well under one minute) ---------- */
function inChinaDST(y, mo, d){
  var t = y*10000 + mo*100 + d;
  for (var i = 0; i < CN_DST.length; i++){
    var w = CN_DST[i];
    if (t >= w[0]*10000 + w[1]*100 + w[2] && t <= w[3]*10000 + w[4]*100 + w[5]) return true;
  }
  return false;
}
function rad(d){ return d*Math.PI/180; }
function deg(r){ return r*180/Math.PI; }
function jdFromUTC(y, mo, d, h, mi){
  return Date.UTC(y, mo-1, d, h, mi, 0) / 86400000 + 2440587.5;
}
function gregorianFromJDN(jdn){
  var a = jdn + 32044, b = Math.floor((4*a+3)/146097), c = a - Math.floor(146097*b/4),
      d2 = Math.floor((4*c+3)/1461), e = c - Math.floor(1461*d2/4), m2 = Math.floor((5*e+2)/153);
  return { y: 100*b + d2 - 4800 + Math.floor(m2/10), m: m2 + 3 - 12*Math.floor(m2/10),
           d: e - Math.floor((153*m2+2)/5) + 1 };
}
function jdnOf(y, m, d){
  var a = Math.floor((14-m)/12), yy = y + 4800 - a, mm = m + 12*a - 3;
  return d + Math.floor((153*mm+2)/5) + 365*yy + Math.floor(yy/4) - Math.floor(yy/100) + Math.floor(yy/400) - 32045;
}
function sunLongitude(jd){
  var T = (jd - 2451545.0)/36525.0;
  var L0 = 280.46646 + 36000.76983*T + 0.0003032*T*T;
  var M = 357.52911 + 35999.05029*T - 0.0001537*T*T;
  var Mr = rad(M);
  var C = (1.914602 - 0.004817*T - 0.000014*T*T)*Math.sin(Mr)
        + (0.019993 - 0.000101*T)*Math.sin(2*Mr) + 0.000289*Math.sin(3*Mr);
  var om = rad(125.04 - 1934.136*T);
  var lam = L0 + C - 0.00569 - 0.00478*Math.sin(om);
  return ((lam % 360) + 360) % 360;
}
function eotMinutes(jd){
  var T = (jd - 2451545.0)/36525.0;
  var L0 = rad(280.46646 + 36000.76983*T + 0.0003032*T*T);
  var M  = rad(357.52911 + 35999.05029*T - 0.0001537*T*T);
  var e  = 0.016708634 - 0.000042037*T - 0.0000001267*T*T;
  var obl = rad(23.439291 - 0.0130042*T);
  var y = Math.tan(obl/2); y = y*y;
  var E = y*2*Math.sin(2*L0) - 2*e*Math.sin(M) + 4*e*y*Math.sin(M)*Math.cos(2*L0)
        - 0.5*y*y*Math.sin(4*L0) - 1.25*e*e*Math.sin(2*M);
  return 4*deg(E); /* minutes; apparent solar time − mean solar time */
}
function termDayOffset(lon){
  var off = (lon - 280) % 360; if (off < 0) off += 360; /* L0 ≈ 280° on Jan 1 */
  return off / 0.98565;
}
function termJD(lon, jdSeed){ /* apparent longitude crossing, Newton */
  var jd = jdSeed;
  for (var i = 0; i < 60; i++){
    var lam = sunLongitude(jd);
    var diff = lon - lam;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    if (Math.abs(diff) < 1e-7) break;
    jd += diff / 0.98565;
  }
  return jd;
}
/* the last minor term at or before jdUT (UT Julian day) */
function lastTermUT(jdUT){
  var g = gregorianFromJDN(Math.floor(jdUT + 0.5));
  var found = [];
  for (var yy = g.y - 1; yy <= g.y + 1; yy++){
    for (var i = 0; i < TERMS.length; i++){
      var seed = jdFromUTC(yy, 1, 1, 0, 0) + termDayOffset(TERMS[i].lon);
      var jd = termJD(TERMS[i].lon, seed);
      if (jd <= jdUT) found.push({term: TERMS[i], jdUT: jd});
    }
  }
  found.sort(function(a, b){ return b.jdUT - a.jdUT; });
  return found[0] || null;
}
function nextTermUT(jdUT){
  var g = gregorianFromJDN(Math.floor(jdUT + 0.5));
  var found = [];
  for (var yy = g.y - 1; yy <= g.y + 1; yy++){
    for (var i = 0; i < TERMS.length; i++){
      var seed = jdFromUTC(yy, 1, 1, 0, 0) + termDayOffset(TERMS[i].lon);
      var jd = termJD(TERMS[i].lon, seed);
      if (jd > jdUT) found.push({term: TERMS[i], jdUT: jd});
    }
  }
  found.sort(function(a, b){ return a.jdUT - b.jdUT; });
  return found[0] || null;
}
function localDT(jdUT, tz){
  var l = jdUT + tz/24;
  var g = gregorianFromJDN(Math.floor(l + 0.5));
  var mins = Math.round(((l + 0.5) % 1) * 1440);
  if (mins >= 1440){ mins -= 1440; var g2 = gregorianFromJDN(Math.floor(l + 0.5) + 1); g = g2; }
  return {y:g.y, m:g.m, d:g.d, hh:Math.floor(mins/60), mi:mins%60};
}

/* ---------- naming / relations ---------- */
function gzPair(s, b){ return STEMS[s].zh + BRANCHES[b].zh + " (" + STEMS[s].py + "-" + BRANCHES[b].py + ")"; }
function tenGod(dmStemIdx, otherStemIdx){
  var dm = STEMS[dmStemIdx], ot = STEMS[otherStemIdx];
  var samePol = dm.yang === ot.yang;
  if (ot.el === dm.el) return samePol ? "Friend 比肩" : "Rob Wealth 劫财";
  if (EL_FEEDS[dm.el] === ot.el) return samePol ? "Eating God 食神" : "Hurting Officer 伤官";
  if (EL_CONTROLS[dm.el] === ot.el) return samePol ? "Indirect Wealth 偏财" : "Direct Wealth 正财";
  if (EL_CONTROLS[ot.el] === dm.el) return samePol ? "Seven Killings 七杀" : "Direct Officer 正官";
  return samePol ? "Indirect Resource 偏印" : "Direct Resource 正印";
}
function gradeOf(el, monthEl){
  if (el === monthEl) return GRADE.same;
  if (FEEDS_ME[el] === monthEl) return GRADE.fed;
  if (EL_FEEDS[el] === monthEl) return GRADE.feeding;
  if (EL_CONTROLS[el] === monthEl) return GRADE.overrunning;
  return GRADE.overrun;
}
function pairIndexOf(s, b){ /* position in the 60-wheel of a valid (s,b) pair */
  for (var i = s; i < 60; i += 10) if (i % 12 === b) return i;
  return -1;
}

/* ---------- core computation ---------- */
/* y,mo,d civil date; hh,mi clock time in the zone's STANDARD time; lon deg east;
   tz std offset hours; opts {nightSchool:'early'|'late', eot:bool, dst:bool,
   southern:bool, gender:'m'|'f'|null} */
function compute(y, mo, d, hh, mi, lon, tz, opts){
  var log = [];
  var clockMin = hh*60 + mi;
  var workY = y, workM = mo, workD = d;
  var dstApplied = false, dstInWindow = inChinaDST(y, mo, d);
  if (opts.dst && dstInWindow){
    clockMin -= 60; dstApplied = true;
    if (clockMin < 0){ clockMin += 1440; var p = gregorianFromJDN(jdnOf(workY, workM, workD) - 1); workY = p.y; workM = p.m; workD = p.d; }
    log.push("Daylight-saving switch is ON: one hour subtracted — the clock read summer time in China's 1986-1991 window.");
  }
  /* true solar time */
  var stdMeridian = tz * 15;
  var lonCorr = (lon - stdMeridian) * 4;
  var meanMin = clockMin + lonCorr;
  var eot = 0;
  if (opts.eot){
    var jdNoonUT = jdFromUTC(workY, workM, workD, 12, 0) - tz/24;
    eot = eotMinutes(jdNoonUT);
  }
  var tstMin = meanMin + (opts.eot ? eot : 0);
  var dayShift = Math.floor(tstMin / 1440);
  var tod = tstMin - dayShift*1440;
  var civ = gregorianFromJDN(jdnOf(workY, workM, workD) + dayShift);
  log.push("Clock time entered: " + pad(hh) + ":" + pad(mi) + " — read as " + (dstApplied ? "summer" : "standard") + " time, UTC" + (tz >= 0 ? "+" : "") + tz + ".");
  log.push("Longitude step: the sun's clock against the zone meridian " + stdMeridian + "° → " + signMin(lonCorr) + " → mean local solar time " + clock(tod - (opts.eot ? eot : 0)) + ".");
  log.push(opts.eot
    ? "Equation of time: " + signMin(eot) + " → true solar time " + clock(tod) + (dayShift !== 0 ? " — which by the sun falls on " + civ.y + "-" + pad(civ.m) + "-" + pad(civ.d) + "." : ".")
    : "Equation of time: OFF (longitude step only) — the hour clock is mean local solar time " + clock(tod) + ".");
  if (dstInWindow && !dstApplied){
    log.push("Note: this date sits inside China's 1986-1991 daylight-saving window. This tool treats your clock time as standard time, as the book's walkthrough does. If the birth time was read off a summer-time clock, switch the daylight-saving option on and look again — the hour pillar may change.");
  }
  var jdBirthUT = jdFromUTC(civ.y, civ.m, civ.d, Math.floor(tod/60), Math.round(tod % 60)) - tz/24;

  /* year pillar — turns at Lìchūn */
  var lichunUT = termJD(315, jdFromUTC(civ.y, 1, 1, 0, 0) + termDayOffset(315));
  var yearIdx = (jdBirthUT >= lichunUT) ? ((civ.y - 4) % 60 + 60) % 60 : ((civ.y - 5) % 60 + 60) % 60;
  var lc = localDT(lichunUT, tz);
  /* month pillar — turns at the minor terms */
  var last = lastTermUT(jdBirthUT);
  var monthBr = last.term.br;
  var termNote = last.term.n + " fell " + fullDT(last.jdUT, tz) + " (local standard time) — it opened the " + BRANCHES[monthBr].zh + " (" + BRANCHES[monthBr].animal + ") month.";
  if (opts.southern){
    monthBr = (monthBr + 6) % 12;
    termNote += " Southern-hemisphere school is ON: the month seat is taken six stations around the wheel (a minority convention, disclosed not recommended).";
  }
  var monthStem = (WUHU[yearIdx % 10] + ((monthBr - 2 + 12) % 12)) % 10;
  /* day pillar — the sixty-wheel, continuous */
  var dayJdn = jdnOf(civ.y, civ.m, civ.d);
  var nightZi = tod >= 23*60;
  var effJdn = dayJdn;
  if (nightZi && opts.nightSchool === "early") effJdn = dayJdn + 1;
  var dayIdx = ((effJdn + 49) % 60 + 60) % 60;
  /* hour pillar */
  var hourBr = Math.floor(((tod + 60) % 1440) / 120);
  var hourStem = (WUSHU[dayIdx % 10] + hourBr) % 10;
  /* decades board (needs gender: direction = year-stem polarity × gender) */
  var board = null;
  if (opts.gender === "m" || opts.gender === "f"){
    var yangYear = STEMS[yearIdx % 10].yang;
    var forward = (yangYear && opts.gender === "m") || (!yangYear && opts.gender === "f");
    var refTerm = forward ? nextTermUT(jdBirthUT) : lastTermUT(jdBirthUT);
    var days = Math.abs(refTerm.jdUT - jdBirthUT);
    var startYears = days / 3; /* 3 days → 1 year, the classical count */
    var mi0 = pairIndexOf(monthStem, monthBr);
    var cols = [];
    for (var k = 0; k < 8; k++){
      /* first decade is the month pillar's NEIGHBOR (the month seat itself is not a decade) */
      var idx = ((forward ? mi0 + k + 1 : mi0 - k - 1) % 60 + 60) % 60;
      var ageA = startYears + 10*k, ageB = startYears + 10*(k+1);
      cols.push({s: idx % 10, b: idx % 12, from: ageA, to: ageB});
    }
    board = {forward: forward, startYears: startYears, term: refTerm.term.n, cols: cols};
  }
  return {
    input: {y:y, m:mo, d:d, hh:hh, mi:mi, lon:lon, tz:tz, opts:opts},
    pillars: {
      year:  {s: yearIdx % 10, b: yearIdx % 12},
      month: {s: monthStem, b: monthBr},
      day:   {s: dayIdx % 10, b: dayIdx % 12},
      hour:  {s: hourStem, b: hourBr}
    },
    tst: {lonCorr: lonCorr, eot: eot, tod: tod, dayShift: dayShift, mean: meanMin, stdMeridian: stdMeridian},
    civil: civ,
    term: {name: last.term.n, jdUT: last.jdUT, note: termNote},
    lichun: {local: lc, note: "Lìchūn 立春 (the year-wheel's joint) fell " + fullDT(lichunUT, tz) + " local standard time; the year pillar reads " + (jdBirthUT >= lichunUT ? "from it" : "from the previous year's joint") + "."},
    nightZi: nightZi,
    board: board,
    log: log
  };
}
function shiftDate(y, m, d, delta){
  return gregorianFromJDN(jdnOf(y, m, d) + delta);
}
function pad(n){ return (n < 10 ? "0" : "") + n; }
function signMin(v){ return (v < 0 ? "−" : "+") + Math.abs(Math.round(v*10)/10) + " min"; }
function clock(mins){
  mins = ((mins % 1440) + 1440) % 1440;
  return pad(Math.floor(mins/60)) + ":" + pad(Math.round(mins % 60));
}
function fullDT(jdUT, tz){
  var t = localDT(jdUT, tz);
  return t.y + "-" + pad(t.m) + "-" + pad(t.d) + " " + pad(t.hh) + ":" + pad(t.mi);
}

/* ---------- startup self-test: dual anchors + the book's worked example (the gate) ---------- */
function selfTest(){
  var out = {checks: [], pass: true};
  function chk(name, got, want){
    var ok = got === want;
    out.checks.push({name: name, got: got, want: want, ok: ok});
    if (!ok) out.pass = false;
  }
  var a1 = ((jdnOf(1949,10,1) + 49) % 60 + 60) % 60;
  chk("anchor · 1949-10-01 day pillar", STEMS[a1%10].zh + BRANCHES[a1%12].zh, "甲子");
  var a2 = ((jdnOf(1900,1,1) + 49) % 60 + 60) % 60;
  chk("anchor · 1900-01-01 day pillar", STEMS[a2%10].zh + BRANCHES[a2%12].zh, "甲戌");
  try {
    var r = compute(1990, 6, 20, 12, 40, 104.0667, 8,
                    {nightSchool:"early", eot:true, dst:false, southern:false, gender:null});
    var p = r.pillars;
    chk("book vector · 1990-06-20 Chengdu 12:40 — year",  STEMS[p.year.s].zh + BRANCHES[p.year.b].zh, "庚午");
    chk("book vector — month", STEMS[p.month.s].zh + BRANCHES[p.month.b].zh, "壬午");
    chk("book vector — day",   STEMS[p.day.s].zh + BRANCHES[p.day.b].zh, "丙辰");
    chk("book vector — hour",  STEMS[p.hour.s].zh + BRANCHES[p.hour.b].zh, "甲午");
  } catch (e){
    chk("book vector · 1990-06-20", "exception: " + e, "庚午/壬午/丙辰/甲午");
  }
  return out;
}

window.BAZI = {
  STEMS: STEMS, BRANCHES: BRANCHES, HIDDEN: HIDDEN, TERMS: TERMS, CITIES: CITIES,
  gzPair: gzPair, tenGod: tenGod, gradeOf: gradeOf, compute: compute,
  climateLine: climateLine,
  selfTest: selfTest, pad: pad, shiftDate: shiftDate, jdnOf: jdnOf,
  gregorianFromJDN: gregorianFromJDN, localDT: localDT, pairIndexOf: pairIndexOf
};
})();
