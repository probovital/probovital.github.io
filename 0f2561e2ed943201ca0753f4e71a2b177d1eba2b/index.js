// Set the configuration for your app
// TODO: Replace with your app's config object
//import * as firebase from 'firebase';
//import * from ‘firebase’;


var plotlyLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    legend: {
        orientation: 'h',
        yanchor: 'bottom',
        y: 0.99,
        xanchor: 'left',
        x: 0
    },
    hoverinfo: 'none',
    hovermode: 'x',
    dragmode: 'pan',
    margin: {
        l: 50,
        r: 50,
        b: 20,
        t: 0,
        pad: 0
    },
    shapes: []
}

var plotlyLayoutOverview = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: { 'visible': false, fixedrange: true },
    yaxis: { 'visible': false, fixedrange: true },
    title: { 'visible': false },
    showlegend: false,
    margin: {
        l: 50,
        r: 50,
        b: 0,
        t: 0,
        pad: 0
    },
    shapes: []
}

var cursorAdded = false;
var cursor1 = {
    xid: 1,
    type: 'line',
    // x-reference is assigned to the x-values
    xref: 'x',
    // y-reference is assigned to the plot paper [0,1]
    yref: 'paper',
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 1,
    fillcolor: '#d3d3d3',
    opacity: 0.5,
};

var viewSquare = {
    xid: 2,
    type: 'square',
    xref: 'x',
    yref: 'y',
    x0: 0,
    y0: 0,
    x1: windowLength,
    y1: 1,
    opacity: 0.2,
    fillcolor: 'blue',
    linecolor: 'blue'
}

const auriculaPrimaryColor = "#082B3E"
const auriculaAccent = "17DFB8"
const auriculaBlack = "#1d1d1d"
const auriculaAltBlack = "#3B3A35"
const blue = "#0090B0"
const red = "#EE2F4E"
const gray = "768692"

var start = 0;
var end = 2000;
var list_index = 0;
var urls = [];
var listItems = [];
var currentStorage = 'gs://ecg-device.appspot.com/firestore/Philip filter160 ia50 pga8 20-12-10:11:28.csv';
var evaluateStorageSelected = false;
var baseStorageRef = 'firestore';
var evaluateStorageRef = 'evaluated';
var delimiter = ";";
var rawECGArray = [];
var ecgArray = [];
var pulseArray = [];
var missingArray = [];
var falsePulseArray = [];
var afArray = [];
var processedAFArray = [];
var ecgLoaded = false;
var currentIndex = 0;
var windowLength = 3000;
var storageRef;
var signalToNoise = 0;
var newBeats = []
var medianBeat = []
var storage = 0;
var database = 0;
var normalizedECGData = [];

var mainPlot;
var overviewPlot;

var selectedPoint = 0;
var latestAction = [];

function getEcgData(dataItem) {
    return ecgArray.slice(dataItem, dataItem + 10);
}
function makeTrace(data, start, end, name, pulse = false, color = gray, type = 'line') {
    plotData = normalize(data, start, end, pulse);
    var plotStart = math.max(0, start - 1.1 * windowLength);
    var plotEnd = end + 1.1 * windowLength;
    return { x: range(plotStart, plotEnd), y: plotData.slice(plotStart, plotEnd), name: name, type: type, line: { color: color, width: 3 }, hoverinfo: 'none' }
}

function loadPlotlyTimeSeries(ecgData) {

    currentIndex = 0;
    mainPlot = document.getElementById('chartly_still');

    Plotly.purge(mainPlot);
    Plotly.newPlot(mainPlot, [makeTrace(ecgData, 0, windowLength, "ECG data"),
                            makeTrace(missingArray, 0, windowLength, "Missing pulse detection", pulse = true, color = 'orange'),
                            makeTrace(falsePulseArray, 0, windowLength, "Incorrect pulse detection", pulse = true, color = 'red'),
                            makeTrace(pulseArray, 0, windowLength, "Pulse detection", pulse = true, color = auriculaPrimaryColor)], plotlyLayout, { displayModeBar: false });

    mainPlot.on('plotly_click', function (data) {
        dialog = document.getElementById('clickDialog');
        dialog.style.backgroundColor = "red";
        dialog.setAttribute("style", "width:400px");

        var pts = '';
        if (data.points.length > 0) {
            pts = 'x = ' + data.points[0].x + '\ny = ' +
                data.points[0].y.toPrecision(3) + '\n\n';
            selectedPoint = data.points[0].x;
        }

        var signal = calculateSignalToNoise(data.points[0].x).toPrecision(3);
        var signalText = "Signal to noise at this location: " + signal;

        text = document.getElementById('selectedPointsText');
        text.innerText = 'Closest point clicked:\n\n' + pts + signalText;
        console.log(data);
    });

    mainPlot.layout.shapes.push(cursor1);
    mainPlot.on("plotly_hover", function (data) {
        var update = {
            'shapes[0].x0': data.points[0].x,
            'shapes[0].x1': data.points[0].x
        };
        Plotly.relayout(mainPlot, update);
    });

    mainPlot.on('plotly_relayout', function (eventData) {
        if ('xaxis.range[0]' in eventData) {
            var currentXrangeLow = math.floor(eventData['xaxis.range[0]']);
            var currentXrangeHigh = math.floor(eventData['xaxis.range[1]']);
            if (currentXrangeLow < 0) {
                currentXrangeHigh = currentXrangeHigh - currentXrangeLow;
                currentXrangeLow = 0;
            }
            plotlyUpdate(currentXrangeLow, currentXrangeHigh);
            currentIndex = currentXrangeLow;
        }
    });

    overviewPlot = document.getElementById('chartly_overview');
    Plotly.newPlot(overviewPlot, [makeTrace(ecgData, 0, ecgData.length, "ECG data")], plotlyLayoutOverview, { displayModeBar: false });
    overviewPlot.on('plotly_click', function (data) {
        var windowStart = data.points[0].x - windowLength / 2;
        plotlyUpdate(windowStart, windowStart + windowLength);
    });
    overviewPlot.layout.shapes.push(viewSquare);
    overviewPlot.layout.shapes[0].x0 = 0;
    overviewPlot.layout.shapes[0].x1 = windowLength;
    var boxNum = 0;
    var afState = false;
    var start = 0;
    for (i = 0; i < afArray.length; i++) {
        afValue = afArray[i].replace(',','.');
        if (!afState && afValue < 0) {
            afState = true;
            start = i;
        } else if (afState && afValue > 0) {
            afState = false;
            overviewPlot.layout.shapes.push({
                xid: 3 + boxNum,
                type: 'square',
                xref: 'x',
                yref: 'y',
                x0: start,
                y0: 0,
                x1: i,
                y1: 1,
                opacity: 0.2,
                fillcolor: 'red',
                line: {
                    width: 0,
                    color: 'red'
                }
            });
            mainPlot.layout.shapes.push({
                xid: 3 + boxNum,
                type: 'square',
                xref: 'x',
                yref: 'y',
                x0: start,
                y0: 0,
                x1: i,
                y1: 1.1,
                opacity: 0.2,
                fillcolor: 'red',
                line: {
                    width: 0,
                    color: 'red'
                }
            });
            boxNum++;
        }
    }
    Plotly.relayout(overviewPlot, overviewPlot.layout);
}


function plotlyUpdate(startTime, endTime) {
    Plotly.react(mainPlot, [makeTrace(ecgArray, startTime, endTime, "ECG data", pulse = false),
                                    makeTrace(missingArray, startTime, endTime, "Missing pulse detection", pulse = true, color = 'orange'),
                                    makeTrace(falsePulseArray, startTime, endTime, "Incorrect pulse detection", pulse = true, color = 'red'),
                                    makeTrace(pulseArray, startTime, endTime, "Pulse detection", pulse = true, color = auriculaPrimaryColor)], plotlyLayout);
    Plotly.relayout(mainPlot, {
        xaxis: {
            range: [startTime, (endTime)],
            zeroline: false
        },
        yaxis: {
            range: [0, 1.1],
            visible: false
        }
    })
    calculateChartStats();
    overviewPlot.layout.shapes[0].x0 = startTime;
    overviewPlot.layout.shapes[0].x1 = endTime;
    Plotly.relayout(overviewPlot, overviewPlot.layout);
}




async function run() {
    createCalendar();
    var date = new Date();
    updateCalendar(date.getFullYear(), date.getMonth());

    /*firebase.initializeApp(firebaseConfig);


    console.log("Loading Firebase");
    const firebaseApp = firebase;
    // Get a reference to the storage service, which is used to create references in your storage bucket
    storage = firebase.storage();
    database = firebase.database();
    storageRef = storage.ref(baseStorageRef);

    //var gsReference = storage.refFromURL('gs://ecg-device.appspot.com/firestore/')
    //const fileRef = await gsReference.listAll();

    //var listRef = storageRef;

    console.log("Firebase Loaded");
    getFromStorage(storage, "1");

    document.getElementById('btnNext').onclick = function () {
        if (currentIndex + windowLength < ecgArray.length) {
            currentIndex += windowLength;
            plotlyUpdate(currentIndex, currentIndex + windowLength)
        }
    }

    document.getElementById('btnBack').onclick = function () {
        if (currentIndex >= windowLength) {
            currentIndex -= windowLength;
            plotlyUpdate(currentIndex, currentIndex + windowLength)
        }
        else if (currentIndex > 0) {
            currentIndex = 0;
            plotlyUpdate(currentIndex, currentIndex + windowLength)
        }
    }

    document.getElementById('btnUpdateWindowSize').onclick = function () {
        var textWindowSize = document.getElementById('textWindowSize');
        var windowSize = parseInt(textWindowSize.value);
        windowLength = windowSize;
        plotlyUpdate(currentIndex, currentIndex + windowSize);
        textWindowSize.placeholder = windowSize;
        textWindowSize.value = "";
    }

    document.getElementById('textWindowSize').addEventListener('keyup', function (event) {
        if (event.keyCode === 13) {
            document.getElementById('btnUpdateWindowSize').click();
        }
    });

    document.getElementById('btnMissingPulse').onclick = function () {
        document.getElementById('clickDialog').style.display = "none";
        missingArray[selectedPoint] = "1";
        plotlyUpdate(currentIndex, currentIndex + windowLength);
        latestAction.push({ "point": selectedPoint, "array": "missingArray" });

    }
    document.getElementById('btnFalsePulse').onclick = function () {
        document.getElementById('clickDialog').style.display = "none";
        falsePulseArray[selectedPoint] = "1";
        plotlyUpdate(currentIndex, currentIndex + windowLength);
        latestAction.push({ "point": selectedPoint, "array": "falsePulseArray" });
    }
    document.getElementById('popupCancel').onclick = function () {
        document.getElementById('clickDialog').style.display = "none";
    }*/
}

//Här lägger vi in att run ska köras när dokumentet är laddat.
document.addEventListener('DOMContentLoaded', run);

function makeplot(url) {
    Plotly.d3.dsv(delimiter)(url, function (data) { processData(data) });
};

const arrayColumn = (arr, n) => arr.map(x => x[n]);

function processData(allRows) {
    try {
        console.log(allRows);
        var x = [];
        var y = [];
        standard_deviation = [];
        var keys = Object.keys(allRows[0]);

        rawECGArray = arrayColumn(allRows, 'rawECG');
        ecgArray = arrayColumn(allRows, 'ECG');
        pulseArray = arrayColumn(allRows, 'Label');
        afArray = arrayColumn(allRows, 'AFSum');

        if (keys.includes('Missing')) {
            missingArray = arrayColumn(allRows, 'Missing');
        } else {
            missingArray = new Array(allRows.length);
        }
        if (keys.includes('Incorrect')) {
            falsePulseArray = arrayColumn(allRows, 'Incorrect');
        } else {
            falsePulseArray = new Array(allRows.length);
        }

        loadPlotlyTimeSeries(ecgArray);
        plotlyUpdate(0, windowLength);
        calculateChartStats();

    }
    catch (TypeError) {
        console.log("Error: No data loaded");
        console.log(TypeError)
    }
}

//Returns a range of values
function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start;
        start = 0;
    }
    if (typeof step == 'undefined') {
        step = 1;
    }
    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }
    var result = [];
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }
    return result;
};

function parseToFloat(array) {

    parsedArray = [];
    if (typeof array[0] === 'string' || array[0] instanceof String) {
        for (i = 0; i < array.length; i++) {
            parsedArray.push(parseFloat(array[i].replace(",", ".")));
        }
    }
    else {
        parsedArray = array;
    }
    return parsedArray;
}

function calculateMean(numbers) {
    var total = 0, i;
    for (i = 0; i < numbers.length; i += 1) {
        total += numbers[i];
    }
    return total / numbers.length;
}

function normalize(array, start, end, pulse = false) {
    var parsedArray = parseToFloat(array);

    var min = Math.min.apply(Math, parsedArray.slice(start, end));
    var max = Math.max.apply(Math, parsedArray.slice(start, end));
    normalizedArray = [];
    for (i = 0; i < parsedArray.length; i++) {
        if (pulse) {
            normalizedArray.push(((parsedArray[i] - min) / (max - min)) / 10);
        }
        else {
            normalizedArray.push((parsedArray[i] - min) / (max - min));
        }
    }
    return normalizedArray;
}

function calculateSignalToNoise(pointInTime) {
    var noiseLocation = pointInTime - 140
    var qrs = Math.max.apply(Math, absoluteValues(parseToFloat(ecgArray.slice(pointInTime - 5, pointInTime + 5))));
    var noise = Math.max.apply(Math, absoluteValues(parseToFloat(ecgArray.slice(noiseLocation - 5, noiseLocation + 5))));
    return qrs / noise;
}

function calculateMeanSignalToNoises(pulseIndexes) {
    signalToNoises = []
    for (var i = 0; i < pulseIndexes.length; i++) {
        var value = calculateSignalToNoise(pulseIndexes[i])
        signalToNoises.push(value);
    }
    return calculateMean(signalToNoises);
}

function absoluteValues(array) {
    absoluteArray = [];
    for (var i = 0; i < array.length; i++) {
        absoluteArray.push(Math.abs(array[i]));
    }
    return absoluteArray;
}


function calculateChartStats() {
    var detectedPulses = 0
    var missingPulses = 0
    var incorrectPulses = 0
    var pulseIndexes = []
    for (var i = 0; i < pulseArray.length; i++) {
        if (pulseArray[i] > 0) {
            //console.log("Pulse Detected")
            detectedPulses++;
            pulseIndexes.push(i);
        }
        if (missingArray[i] > 0) {
            missingPulses++;
        }
        if (falsePulseArray[i] > 0) {
            incorrectPulses++;
        }
    }
    signalToNoise = calculateMeanSignalToNoises(pulseIndexes).toPrecision(3);
    var errorRate = ((missingPulses + incorrectPulses) / detectedPulses).toPrecision(3);
    document.getElementById('chartStatText').innerText = "Algorithm pulse detection\n\n" +
        "Detected Pulses: " + detectedPulses + "\n" +
        "Missed Pulses: " + missingPulses + "\n" +
        "Incorrect Pulses: " + incorrectPulses + "\n" +
        "Error Rate: " + errorRate + "\n\n" +
        "Signal to noise: " + signalToNoise + "\n\n";

}

function createCalendar() {
    var div = document.getElementById('calendarDiv');
    var tbl = document.createElement('table');
    tbl.className = "calendar";

    for (i = 0; i < 6; i++) {
        var tr = document.createElement('tr');
        for (j = 0; j < 7; j++) {
            var td = document.createElement('td');
            td.id = 'r'+i+'c'+j;
            tr.appendChild(td);
        }
        tbl.appendChild(tr);
    }
    div.appendChild(tbl);
}

function updateCalendar(year, month) {
    var day = (new Date(year, month, 1)).getDay() - 1;
    if (day < 0) day += 7;
    var days = 0;
    switch (month) {
        case 0:
            days = 31;
            break;
        case 1:
            days = new Date(year, month + 1, 0).getDate();
            break;
        case 2:
            days = 31;
            break;
        case 3:
            days = 30;
            break;
        case 4:
            days = 31;
            break;
        case 5:
            days = 30;
            break;
        case 6:
            days = 31;
            break;
        case 7:
            days = 31;
            break;
        case 8:
            days = 30;
            break;
        case 9:
            days = 31;
            break;
        case 10:
            days = 30;
            break;
        case 11:
            days = 31;
            break;
        default:
            break;
    }
    for (i = 0; i < days; i++) {
        var row = math.floor((day + i) / 7);
        var column = (day + i) % 7;
        var id = 'r' + row + 'c' + column;
        var td = document.getElementById(id);
        td.appendChild(document.createTextNode(i + 1));
    }
}