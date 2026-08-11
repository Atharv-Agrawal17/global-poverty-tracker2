const API =
"https://pip.worldbank.org/pip/v1/pip";

let povertyChart = null;
let peopleChart = null;

const countries = {

"AFG":"Afghanistan",
"ALB":"Albania",
"DZA":"Algeria",
"ARG":"Argentina",
"AUS":"Australia",
"AUT":"Austria",
"BGD":"Bangladesh",
"BEL":"Belgium",
"BOL":"Bolivia",
"BRA":"Brazil",
"CAN":"Canada",
"CHL":"Chile",
"CHN":"China",
"COL":"Colombia",
"CRI":"Costa Rica",
"CIV":"Côte d'Ivoire",
"HRV":"Croatia",
"CZE":"Czechia",
"DNK":"Denmark",
"DOM":"Dominican Republic",
"ECU":"Ecuador",
"EGY":"Egypt",
"SLV":"El Salvador",
"EST":"Estonia",
"ETH":"Ethiopia",
"FIN":"Finland",
"FRA":"France",
"GEO":"Georgia",
"DEU":"Germany",
"GHA":"Ghana",
"GRC":"Greece",
"GTM":"Guatemala",
"GIN":"Guinea",
"HND":"Honduras",
"HUN":"Hungary",
"IND":"India",
"IDN":"Indonesia",
"IRL":"Ireland",
"ITA":"Italy",
"JAM":"Jamaica",
"JPN":"Japan",
"JOR":"Jordan",
"KAZ":"Kazakhstan",
"KEN":"Kenya",
"KOR":"South Korea",
"KGZ":"Kyrgyz Republic",
"LVA":"Latvia",
"LBN":"Lebanon",
"LSO":"Lesotho",
"LBR":"Liberia",
"LTU":"Lithuania",
"LUX":"Luxembourg",
"MDG":"Madagascar",
"MWI":"Malawi",
"MYS":"Malaysia",
"MLI":"Mali",
"MRT":"Mauritania",
"MEX":"Mexico",
"MDA":"Moldova",
"MNG":"Mongolia",
"MAR":"Morocco",
"MOZ":"Mozambique",
"MMR":"Myanmar",
"NAM":"Namibia",
"NPL":"Nepal",
"NLD":"Netherlands",
"NZL":"New Zealand",
"NIC":"Nicaragua",
"NER":"Niger",
"NGA":"Nigeria",
"MKD":"North Macedonia",
"NOR":"Norway",
"PAK":"Pakistan",
"PAN":"Panama",
"PRY":"Paraguay",
"PER":"Peru",
"PHL":"Philippines",
"POL":"Poland",
"PRT":"Portugal",
"ROU":"Romania",
"RWA":"Rwanda",
"SAU":"Saudi Arabia",
"SEN":"Senegal",
"SRB":"Serbia",
"SLE":"Sierra Leone",
"SVK":"Slovakia",
"SVN":"Slovenia",
"ZAF":"South Africa",
"ESP":"Spain",
"LKA":"Sri Lanka",
"SDN":"Sudan",
"SWE":"Sweden",
"CHE":"Switzerland",
"TJK":"Tajikistan",
"TZA":"Tanzania",
"THA":"Thailand",
"TGO":"Togo",
"TUN":"Tunisia",
"TUR":"Türkiye",
"UGA":"Uganda",
"UKR":"Ukraine",
"ARE":"United Arab Emirates",
"GBR":"United Kingdom",
"USA":"United States",
"URY":"Uruguay",
"UZB":"Uzbekistan",
"VEN":"Venezuela",
"VNM":"Vietnam",
"ZMB":"Zambia",
"ZWE":"Zimbabwe"

};


function $(id) {
return document.getElementById(id);
}


function showError(message) {

const box = $("error");

box.textContent = message;

box.classList.remove("hidden");

}


function hideError() {

$("error").classList.add("hidden");

}


function formatNumber(value) {

if (
value === null ||
value === undefined ||
!Number.isFinite(Number(value))
) {
return "Unavailable";
}

return Number(value)
.toLocaleString(
undefined,
{
maximumFractionDigits: 2
}
);

}


function populateCountries() {

const select =
$("country");

select.innerHTML = "";

Object.entries(countries)
.sort(
(a,b) =>
a[1].localeCompare(b[1])
)
.forEach(
([code,name]) => {

const option =
document.createElement("option");

option.value = code;

option.textContent =
name;

select.appendChild(option);

}
);

select.value = "IND";

}


async function requestPIP(countryCode) {

const url =
new URL(API);

url.searchParams.set(
"country_code",
countryCode
);

url.searchParams.set(
"poverty_line",
"3"
);

console.log(
"World Bank PIP request:",
url.toString()
);

const response =
await fetch(
url.toString(),
{
cache: "no-store"
}
);

if (!response.ok) {

throw new Error(
`World Bank API returned HTTP ${response.status}`
);

}

const data =
await response.json();

console.log(
"World Bank PIP response:",
data
);

return data;

}


function extractRows(data) {

if (Array.isArray(data)) {
return data;
}

if (Array.isArray(data.data)) {
return data.data;
}

if (Array.isArray(data.results)) {
return data.results;
}

if (Array.isArray(data.result)) {
return data.result;
}

return [];

}


function findValue(row, keys) {

for (
const key of keys
) {

if (
row[key] !== undefined &&
row[key] !== null &&
row[key] !== ""
) {

return row[key];

}

}

return null;

}


function normalizeRows(data) {

const rows =
extractRows(data);

return rows

.map(row => {

const year =
findValue(
row,
[
"reporting_year",
"reportingYear",
"year",
"survey_year",
"surveyYear"
]
);

const rate =
findValue(
row,
[
"headcount",
"headcount_ratio",
"headcountRatio",
"poverty_rate",
"povertyRate",
"headcount_ratio_povline"
]
);

const poor =
findValue(
row,
[
"poor",
"poor_pop",
"poor_population",
"number_poor"
]
);

return {

year:
Number(year),

rate:
Number(rate),

poor:
poor === null
? null
: Number(poor)

};

})

.filter(
row =>
Number.isFinite(row.year) &&
Number.isFinite(row.rate)
)

.sort(
(a,b) =>
a.year - b.year
);

}


function renderCountry(rows) {

if (!rows.length) {

throw new Error(
"No usable poverty observations were returned."
);

}

const latest =
rows[rows.length - 1];

const previous =
rows.length > 1
? rows[rows.length - 2]
: null;


$("rate").textContent =
`${formatNumber(latest.rate)}%`;

$("rateYear").textContent =
`Latest available observation: ${latest.year}`;


if (
latest.poor !== null &&
Number.isFinite(latest.poor)
) {

$("poorPop").textContent =
formatNumber(latest.poor);

$("poorYear").textContent =
`Observation: ${latest.year}`;

}

else {

$("poorPop").textContent =
"Unavailable";

$("poorYear").textContent =
"Not provided by selected PIP response";

}


if (previous) {

const difference =
latest.rate -
previous.rate;

const relative =
previous.rate !== 0
? (
difference /
previous.rate
) * 100
: null;


$("change").textContent =
`${difference >= 0 ? "+" : ""}` +
`${formatNumber(difference)} pp`;


if (relative !== null) {

$("changeType").textContent =
`${relative >= 0 ? "+" : ""}` +
`${formatNumber(relative)}% since ${previous.year}`;

}
else {

$("changeType").textContent =
"Relative change unavailable";

}


if (difference > 0.1) {

$("status").textContent =
"Increasing";

}

else if (difference < -0.1) {

$("status").textContent =
"Decreasing";

}

else {

$("status").textContent =
"Stable";

}


$("statusDetail").textContent =
`Compared with ${previous.year}`;

}

else {

$("change").textContent =
"Unavailable";

$("changeType").textContent =
"Only one observation";

$("status").textContent =
"Unavailable";

$("statusDetail").textContent =
"More observations required";

}


renderTable(rows);

renderCharts(rows);

}


function renderTable(rows) {

$("dataTable").innerHTML = "";

rows
.slice()
.reverse()
.forEach(
row => {

const tr =
document.createElement("tr");

tr.innerHTML = `

<td>${row.year}</td>

<td>${formatNumber(row.rate)}%</td>

<td>
${
row.poor !== null &&
Number.isFinite(row.poor)
?
formatNumber(row.poor)
:
"Unavailable"
}
</td>

<td>World Bank PIP</td>

`;

$("dataTable")
.appendChild(tr);

}
);

}


function renderCharts(rows) {

const labels =
rows.map(
row => row.year
);

const rates =
rows.map(
row => row.rate
);


if (povertyChart) {

povertyChart.destroy();

}


povertyChart =
new Chart(
$("povertyChart"),
{

type: "line",

data: {

labels,

datasets: [

{

label:
"Poverty rate (%)",

data:
rates,

tension:
0.25,

borderWidth:
2,

pointRadius:
3

}

]

},

options: {

responsive: true,

maintainAspectRatio: false,

plugins: {

legend: {
display: true
}

},

scales: {

y: {

beginAtZero: true,

title: {

display: true,

text:
"Poverty rate (%)"

}

},

x: {

title: {

display: true,

text:
"Year"

}

}

}

}

}
);


const peopleCanvas =
$("peopleChart");


if (peopleChart) {

peopleChart.destroy();

}


const people =
rows.map(
row =>
Number.isFinite(row.poor)
? row.poor
: null
);


peopleChart =
new Chart(
peopleCanvas,
{

type: "line",

data: {

labels,

datasets: [

{

label:
"People in poverty",

data:
people,

tension:
0.25,

borderWidth:
2,

pointRadius:
3

}

]

},

options: {

responsive: true,

maintainAspectRatio: false,

scales: {

y: {

beginAtZero: true,

title: {

display: true,

text:
"People"

}

}

}

}

}
);

}


async function loadCountry(code) {

hideError();


$("rate").textContent =
"Loading...";

$("poorPop").textContent =
"Loading...";

$("change").textContent =
"Loading...";

$("status").textContent =
"Loading...";


try {

const data =
await requestPIP(code);

const rows =
normalizeRows(data);

renderCountry(rows);

}

catch(error) {

console.error(error);

$("rate").textContent =
"Unavailable";

$("poorPop").textContent =
"Unavailable";

$("change").textContent =
"Unavailable";

$("status").textContent =
"Unavailable";

showError(
`Could not load World Bank data for ${countries[code]}. ${error.message}`
);

}

}


$("country")
.addEventListener(
"change",
event => {

loadCountry(
event.target.value
);

}
);


$("refresh")
.addEventListener(
"click",
() => {

loadCountry(
$("country").value
);

}
);


populateCountries();

loadCountry("IND");
