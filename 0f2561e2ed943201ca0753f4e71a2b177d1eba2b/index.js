// Set the configuration for your app
// TODO: Replace with your app's config object
//import * as firebase from 'firebase';
//import * from ‘firebase’;


var plotlyLayout = {
    title: 'ECG data',
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    legend: {
        orientation: 'h',
        yanchor: 'top',
        y: 1,
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
    margin: {
        l: 50,
        r: 50,
        b: 0,
        t: 0,
        pad: 0
    }
}

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

const plotlyLayout2 = {
    title: 'ECG data',
    xaxis: {
        showgrid: false,
        showline: false,
        visible: false,
        range: [0, (3000)]
    },
    yaxis: {
        showgrid: false,
        showline: false,
        visible: false
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)'
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
var currentTitle = "MedDev data D2:48:9E:6B:201027:11:22:25EKGdata.csv";
//var currentTitle = "20-10-28:20:22.csv"
var currentStorage = 'gs://ecg-device.appspot.com/firestore/Philip filter160 ia50 pga8 20-12-10:11:28.csv';
//var currentStorage = 'gs://ecg-device.appspot.com/firestore/20-10-28:20:22.csv';
var evaluateStorageSelected = false;
var baseStorageRef = 'firestore';
var evaluateStorageRef = 'evaluated';
var delimiter = ";";
var rawECGArray = [];
var ecgArray = [];
var deltaSignal = [];
var stepSignal = [];
var fourierFilter = [];
var philipsFilter = [];
var pulseArray = [];
var missingArray = [];
var falsePulseArray = [];
var ecgLoaded = false;
var currentIndex = 0;
var windowLength = 3000;
var storageRef;
var signalToNoise = 0;
var lowPass = 500
var highPass = 100
var newBeats = []
var medianBeat = []
var storage = 0;
var database = 0;
var normalizedECGData = [];
var currentXrangeLow = 0;
var currentXrangeHigh = 3000;


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
    philipsFilter = meanFilter(rawECGArray, k = 8);

    currentIndex = 0;
    myPlot = document.getElementById('chartly_still');

    Plotly.purge(myPlot);
    plotlyLayout.title = currentTitle;
    Plotly.newPlot(myPlot, [makeTrace(ecgData, 0, windowLength, "ECG data"),
                            makeTrace(missingArray, 0, windowLength, "Missing pulse detection", pulse = true, color = 'orange'),
                            makeTrace(falsePulseArray, 0, windowLength, "Incorrect pulse detection", pulse = true, color = 'red'),
                            makeTrace(pulseArray, 0, windowLength, "Pulse detection", pulse = true, color = auriculaPrimaryColor)], plotlyLayout, { displayModeBar: false });

    myPlot.on('plotly_click', function (data) {
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

    myPlot.on("plotly_hover", function (data) {
        if (myPlot.layout.shapes.length === 0) {
            myPlot.layout.shapes.push(cursor1);
        }
        var update = {
            'shapes[0].x0': data.points[0].x,
            'shapes[0].x1': data.points[0].x
        };
        Plotly.relayout(myPlot, update);
    });

    myPlot.on('plotly_relayout', function (eventData) {
        if ('xaxis.range[0]' in eventData) {
            currentXrangeLow = math.floor(eventData['xaxis.range[0]']);
            currentXrangeHigh = math.floor(eventData['xaxis.range[1]']);
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
        console.log(data);
    });
}


function plotlyUpdate(startTime, endTime) {
    Plotly.react('chartly_still', [makeTrace(ecgArray, startTime, endTime, "ECG data", pulse = false),
                                    makeTrace(missingArray, startTime, endTime, "Missing pulse detection", pulse = true, color = 'orange'),
                                    makeTrace(falsePulseArray, startTime, endTime, "Incorrect pulse detection", pulse = true, color = 'red'),
                                    makeTrace(pulseArray, startTime, endTime, "Pulse detection", pulse = true, color = auriculaPrimaryColor)], plotlyLayout);
    Plotly.relayout('chartly_still', {
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
}




async function run() {
    document.getElementById("test").style.display = "none";
    document.getElementById("titleText").innerHTML = currentTitle;

    firebase.initializeApp(firebaseConfig);


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
    }
}

//Här lägger vi in att run ska köras när dokumentet är laddat.
document.addEventListener('DOMContentLoaded', run);

function makeplot(url) {
    //Plotly.d3.csv("https://raw.githubusercontent.com/plotly/datasets/master/2014_apple_stock.csv", function(data){ processData(data) } );
    Plotly.d3.dsv(delimiter)(url, function (data) { processData(data) });
};


function processData(allRows) {
    try {
        console.log(allRows);
        var x = [];
        var y = [];
        standard_deviation = [];
        var columns = ['rawECG', 'ECG', 'PPGRED', 'PPGIR', 'Label', 'Missing', 'Incorrect'];
        var keys = Object.keys(allRows[0]);

        for (j = 0; j < keys.length; j++) {
            x = [], y = [], standard_deviation = [];
            //document.getElementById('length').value = allRows.length;
            end = allRows.length;
            for (var i = start; i < end; i++) {
                row = allRows[i];
                //console.log(row[keys[j]]);
                y.push(row[keys[j]]);
            }
            y = parseToFloat(y);
            if (keys[j] == 'rawECG') {
                rawECGArray = y;
            }
            if (keys[j] == 'ECG') {
                ecgArray = y;

            }
            if (keys[j] == 'Label') {
                pulseArray = y;
                missingArray = [];
                falsePulseArray = [];
                for (i = 0; i < y.length; i++) {
                    missingArray.push("0");
                    falsePulseArray.push("0");
                }
            }
            if (keys[j] == 'Missing') {
                missingArray = y;
            }
            if (keys[j] == 'Incorrect') {
                falsePulseArray = y;
            }
        }
        loadPlotlyTimeSeries(ecgArray);
        plotlyUpdate(0, 3000);
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
