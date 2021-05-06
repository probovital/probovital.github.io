// Set the configuration for your app
// TODO: Replace with your app's config object
//import * as firebase from 'firebase';
//import * from ‘firebase’;


async function run() {

    initialize();
    window.addEventListener('resize', resizePlot);
}

var GUI;
var startView;
var loginView;
var calendarView;
var plotView;
var searchView;
var currentView;

var GUIInitialized = false;

function initialize() {
    initializeFirebase();
    initializeGUI();
}

function initializeGUI() {
    GUI = document.getElementById("GUI");
    GUI.setAttribute('style', 'display: unset');

    startView = document.getElementById("startViewDiv");
    loginView = document.getElementById("loginViewDiv");
    plotView = document.getElementById("plotViewDiv");
    searchView = document.getElementById("searchView");

    /* Calendar view */
    calendarView = document.getElementById("calendarViewDiv");
    createCalendar();

    var searchText = document.getElementById("searchText");
    searchText.addEventListener('keyup', (event) => {
        if (event.keyCode == 13) {
            search(searchText.value)
        }
    });
    var searchButton = document.getElementById("searchButton");
    searchButton.addEventListener("click", () => {
        search(searchText.value);
    });

    var titleLoginButton = document.getElementById("titleLoginButton");
    titleLoginButton.addEventListener('click', titleLoginButtonFunction);
    if (firebase.auth().currentUser) {
        titleLoginButton.innerHTML = "Log out";
        searchText.visible = true;
        searchButton.visible = true;
        showCalendarView();
    } else {
        showLoginView();
    }
    setupLoginFunction();

    var backButton = document.getElementById('backButton');
    backButton.addEventListener('click', function () {
        showCalendarView();
        hideBackButton();
        clearPlotView();
    });
    hideBackButton();

    document.getElementById("ssnText").style.visibility = "hidden";
    document.getElementById("searchText").style.visibility = "hidden";
    document.getElementById("searchButton").style.visibility = "hidden";

    initializePlotView();

    GUIInitialized = true;
}

function initializeFirebase() {
    firebase.initializeApp(philipsFirebaseConfig);

    console.log("Loading Firebase");
    const firebaseApp = firebase;
    // Get a reference to the storage service, which is used to create references in your storage bucket
    storage = firebase.storage();
    database = firebase.firestore();
    storageRef = storage.ref(baseStorageRef);

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("state = definitely signed in");
            /*if (!GUIInitialized) {
                initializeGUI();
            }*/
            document.getElementById("titleLoginButton").innerHTML = "Log out";
            document.getElementById("ssnText").style.visibility = "visible";
            document.getElementById("searchText").style.visibility = "visible";
            document.getElementById("searchButton").style.visibility = "visible";
            document.getElementById("email").value = "";
            document.getElementById("password").value = "";
            document.getElementById("loginMessage").innerHTML = "";
            showCalendarView();
        }
        else {
            console.log("state = definitely signed out");
            /*if (!GUIInitialized) {
                initializeGUI();
            }*/
            document.getElementById("titleLoginButton").innerHTML = "Log in";
            document.getElementById("ssnText").style.visibility = "hidden";
            document.getElementById("searchText").style.visibility = "hidden";
            document.getElementById("searchButton").style.visibility = "hidden";
            document.getElementById("searchText").value = "";
        }
    })

    console.log("Firebase Loaded");
}

class Recording {
    constructor(BTAddress, CollDate, SSN, SuspectedAF) {
        this.BTAddress = BTAddress;
        this.CollDate = CollDate;
        this.SSN = SSN;
        this.SuspectedAF = SuspectedAF;
    }
}

var recordingConverter = {
    toFirestore: function (recording) {
        return {
            BTAddress: recording.BTAddress,
            CollDate: recording.CollDate,
            SSN: recording.SSN,
            SuspectedAF: recording.SuspectedAF
        }
    },
    fromFirestore: function (snapshot, options) {
        const data = snapshot.data(options);
        return new Recording(data.BTAddress, new Date(data.CollDate.seconds*1000), data.SSN, data.SuspectedAF);
    }
};

function hideAll() {
    startView.setAttribute('style', 'display: none');
    loginView.setAttribute('style', 'display: none');
    calendarView.setAttribute('style', 'display: none');
    plotView.setAttribute('style', 'display: none');
}

function showGUI() {

}

/* Login view */
function showLoginView() {
    hideAll();
    loginView.setAttribute('style', 'display: flex');
    currentView = loginView;
}

function titleLoginButtonFunction() {
    if (firebase.auth().currentUser) {
        firebase.auth().signOut();
    }
    showLoginView();
}

function setupLoginFunction() {
    var loginButton = document.getElementById("loginButton");
    loginButton.addEventListener('click', login);
    var password = document.getElementById("password");
    password.addEventListener("keyup", function (event) {
        if (event.keyCode == 13) {
            login();
        }
    });
}

function login() {
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var loginMessage = document.getElementById("loginMessage");
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION).then(() => {
        return firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredentials) => {
                showCalendarView();
            })
            .catch((error) => {
                var errorCode = error.code;
                var errorMessage = error.message;
                loginMessage.innerHTML = "Error code: " + errorCode + "\nError message: " + errorMessage;
                console.log(error);
            });
    }).catch((error) => {
        console.log(error);
    });
}


/* Plot view */
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
    shapes: [],
    autosize: true
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
    shapes: [],
    autosize: true
}

var plotlyLayoutMedian = {
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
    dragmode: 'none',
    title: {
        text: "Median Beat",
        yref: 'paper',
        y: 1,
        yanchor: 'bottom'
    },
    margin: {
        l: 50,
        r: 50,
        b: 20,
        t: 20,
        pad: 0
    },
    shapes: [],
    autosize: true,
    xaxis: { fixedrange: true },
    yaxis: { fixedrange: true }
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
var baseStorageUrl = 'gs://fw-update.appspot.com/RecordingData/';
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
var currentRecording;

var mainPlot;
var overviewPlot;
var medianPlot;

var selectedPoint = 0;
var latestAction = [];

function initializePlotView() {
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
        console.log(windowSize + " " + textWindowSize.value);
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
    document.getElementById('btnCancel').onclick = function () {
        document.getElementById('clickDialog').style.display = "none";
    }
}

function clearPlotView() {
    if (mainPlot !== undefined) {
        Plotly.purge(mainPlot);
        Plotly.purge(overviewPlot);
    }
    document.getElementById("plotTitle").innerHTML = "";
    document.getElementById("plotDiv").setAttribute("style", "display: none");
    document.getElementById("recordingList").innerHTML = "";
}

function getEcgData(dataItem) {
    return ecgArray.slice(dataItem, dataItem + 10);
}
function makeTrace(data, start, end, name, pulse = false, color = gray, type = 'line') {
    var plotStart = math.max(0, start - 1.1 * windowLength);
    var plotEnd = math.min(data.length, end + 1.1 * windowLength);
    plotData = normalize(data, start, end, pulse);
    return { x: range(plotStart, plotEnd), y: plotData, name: name, type: type, line: { color: color, width: 3 }, hoverinfo: 'none' }
}

function loadPlotlyTimeSeries(ecgData) {

    var date = currentRecording.CollDate;
    var plotTitle = `${patient.Name} ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    document.getElementById("plotTitle").innerHTML = plotTitle;
    currentIndex = 0;
    mainPlot = document.getElementById('chartly_still');

    Plotly.purge(mainPlot);
    plotlyLayout.shapes = [];
    Plotly.newPlot(mainPlot, [makeTrace(ecgData, 0, windowLength, "ECG data"),
                            makeTrace(missingArray, 0, windowLength, "Missing pulse detection", pulse = true, color = 'orange'),
                            makeTrace(falsePulseArray, 0, windowLength, "Incorrect pulse detection", pulse = true, color = 'red'),
                            makeTrace(pulseArray, 0, windowLength, "Pulse detection", pulse = true, color = auriculaPrimaryColor)], plotlyLayout, { displayModeBar: false });

    mainPlot.on('plotly_click', function (data) {
        dialog = document.getElementById('clickDialog');
        dialog.style.backgroundColor = "red";
        dialog.setAttribute("style", "display: unset");

        var pts = '';
        if (data.points.length > 0) {
            pts = 'x = ' + data.points[0].x + '\ny = ' +
                data.points[0].y.toPrecision(3) + '\n\n';
            selectedPoint = data.points[0].x;
        }

        var signal = calculateSignalToNoise(data.points[0].x).toPrecision(3);
        var signalText = "Signal to noise at this location: " + signal;

        text = document.getElementById('selectedPointsText');
        text.innerText = 'Closest point clicked:\n' + pts + signalText;
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
    Plotly.purge(overviewPlot);
    plotlyLayoutOverview.shapes = [];
    Plotly.newPlot(overviewPlot, [makeTrace(ecgData, 0, ecgData.length, "ECG data")], plotlyLayoutOverview, { displayModeBar: false });
    overviewPlot.on('plotly_click', function (data) {
        var windowStart = data.points[0].x - windowLength / 2;
        plotlyUpdate(windowStart, windowStart + windowLength);
    });
    overviewPlot.layout.shapes.push(viewSquare);
    overviewPlot.layout.shapes[0].x0 = 0;
    overviewPlot.layout.shapes[0].x1 = windowLength;
    updateShapes(0, ecgData.length, overviewPlot.layout.shapes);
    updateShapes(0, windowLength, mainPlot.layout.shapes);
    Plotly.relayout(overviewPlot, overviewPlot.layout);
    Plotly.relayout(mainPlot, mainPlot.layout);

    medianPlot = document.getElementById('median');
    displayMedianBeat(calculateMedianBeat());
}


function plotlyUpdate(startTime, endTime) {
    Plotly.react(mainPlot, [makeTrace(ecgArray, startTime, endTime, "ECG data", pulse = false),
                                    makeTrace(missingArray, startTime, endTime, "Missing pulse detection", pulse = true, color = 'orange'),
                                    makeTrace(falsePulseArray, startTime, endTime, "Incorrect pulse detection", pulse = true, color = 'red'),
                                    makeTrace(pulseArray, startTime, endTime, "Pulse detection", pulse = true, color = auriculaPrimaryColor)], plotlyLayout);
    //calculateChartStats();
    overviewPlot.layout.shapes[0].x0 = startTime;
    overviewPlot.layout.shapes[0].x1 = endTime;
    Plotly.relayout(overviewPlot, overviewPlot.layout);
    mainPlot.layout.shapes = new Array(mainPlot.layout.shapes[0]);
    updateShapes(math.max(startTime - windowLength, 0), math.min(endTime + windowLength, ecgArray.length), mainPlot.layout.shapes);
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
    currentIndex = startTime;
}

function updateShapes(startIndex, endIndex, shapes) {
    var boxNum = 0;
    var afState = false;
    var start = 0;
    for (i = startIndex; i < endIndex; i++) {
        afValue = afArray[i];
        if (!afState && afValue < 0) {
            afState = true;
            start = i;
        } else if (afState && (afValue >= 0 || i == endIndex - 1)) {
            afState = false;
            shapes.push({
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
            boxNum++;
        }
    }
}

function resizePlot() {
    if (currentView === plotView) {
        plotlyUpdate(currentIndex, currentIndex + windowLength);
    }
}

function createPlotView(id) {
    currentRecordingFile = recordingFiles.get(id);
    if (currentRecordingFile === undefined) {
        return;
    }
    document.documentElement.scrollTop = 0;
    currentStorage = baseStorageUrl + currentRecording.id + "/" + currentRecordingFile.FileName;

    getFromStorage(storage, "1");

    document.getElementById("plotDiv").setAttribute("style", "display: unset;");
}

//Här lägger vi in att run ska köras när dokumentet är laddat.
document.addEventListener('DOMContentLoaded', run);

function makeplot(url) {
    Plotly.d3.dsv(delimiter)(url, function (data) { processData(data) });
};

const arrayColumn = (arr, n) => arr.map(x => x[n]);

function processData(allRows) {
    try {
        //console.log(allRows);
        var x = [];
        var y = [];
        standard_deviation = [];
        var keys = Object.keys(allRows[0]);

        rawECGArray = parseToFloat(arrayColumn(allRows, 'rawECG'));
        ecgArray = parseToFloat(arrayColumn(allRows, 'ECG'));
        pulseArray = parseToFloat(arrayColumn(allRows, 'Label'));
        afArray = parseToFloat(arrayColumn(allRows, 'AFSum'));

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
        //calculateChartStats();
        
        console.log("Data processed");
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

    var parsedArray = [];
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
    normalizedArray = [];
    try {
        arrayToNormalize = array.slice(math.max(0, start - 1.1 * windowLength), math.min(array.length, end + 1.1 * windowLength));
        var referenceArray = array.slice(start, end);
        var min = referenceArray[0];
        var max = referenceArray[0];
        for (i = 0; i < referenceArray.length; i++) {
            var value = referenceArray[i];
            min = value < min ? value : min;
            max = value > max ? value : max;
        }

        for (i = 0; i < arrayToNormalize.length; i++) {
            if (pulse) {
                normalizedArray.push(((arrayToNormalize[i] - min) / (max - min)) / 10);
            }
            else {
                normalizedArray.push((arrayToNormalize[i] - min) / (max - min));
            }
        }
    } catch (error) {
        console.log(error)
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

function displayMedianBeat(array) {
    Plotly.purge(medianPlot);
    Plotly.newPlot(medianPlot, [makeTrace(array, 0, array.length, "Median Beat")], plotlyLayoutMedian, { displayModeBar: false });
    Plotly.relayout(medianPlot, {
        xaxis: {
            range: [0, array.length],
            fixedrange: true
        }
    })
    console.log("Median beat created")
}

function calculateMedianBeat(beatNumber = 5, index = 0) {
    var medianBeatArray = [];
    var beatRange = 0;
    var beatIndexes = [];
    var arrayOfDistances = [];
    var numberOfBeats = beatNumber;


    for (var i = 0; i < pulseArray.length; i++) {
        if (pulseArray[i] > 0 | missingArray[i] > 0) {
            beatIndexes.push(i);
        }
    }
    for (var i = 0; i < beatIndexes.length - 2; i++) {
        arrayOfDistances.push(beatIndexes[i + 1] - beatIndexes[i]);
    }
    beatRange = Math.floor(calculateMedian(arrayOfDistances));

    //if(numberOfBeats<2){
    //  numberOfBeats=2;
    //}
    if (numberOfBeats > beatIndexes.length) {
        numberOfBeats = beatIndexes.length;
    }
    numberOfBeats = beatIndexes.length;
    //kolla varje index, om det finns ett puls eller missing beat så ska det räknas
    //spara detta index i en array
    //skapa ny array med avståndet mellan varje index
    // räkna ut medianavståndet och spara i beatrange
    newBeats = []
    for (var i = 0; i < numberOfBeats - 2; i++) {
        newBeats.push([])
    }

    var pointValues = [];
    //for(var j=0; j < (beatRange *2) ; j++){
    for (var j = 0; j < 450; j++) {
        pointValues = [];
        for (var i = 1; i < numberOfBeats - 2; i++) {
            if ((beatIndexes[i] - beatRange) > 0 & (beatIndexes[i] + beatRange) < ecgArray.length) {
                //var value = beatIndexes[i] - beatRange + j;
                var value = beatIndexes[i] - 200 + j;
                var thisValue = ecgArray[value + index];

                pointValues.push(thisValue);
                newBeats[i].push(thisValue);
            }
        }
        var medianValue = calculateMedian(pointValues);
        //var medianValue = math.mean(pointValues);
        medianBeatArray.push("" + medianValue);

    }

    //för varje beat, titta i range innan och efter, kolla att det finns plats fram och bak
    //spara varje index i en nested array index[i][värde]
    //skapa ny array medianBeat där varje värde är medianvärdet av värdena för index
    newBeats.push(Float32Array.from(medianBeatArray))
    newBeats.shift()
    console.log(newBeats)
    //uploadBlob(storage, "/Medianbeats" + currentTitle, [newBeats])
    return medianBeatArray;
}

function calculateMedian(values) {
    if (values.length === 0) return 0;
    values.sort(function (a, b) {
        return a - b;
    });
    var half = Math.floor(values.length / 2);
    if (values.length % 2) {
        return values[half];
    }
    return (values[half - 1] + values[half]) / 2.0;
}

/* Calendar view */

var currentMonth = new Date().getMonth();
var currentYear = new Date().getFullYear();
var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function showCalendarView() {
    hideAll();
    document.getElementById('calendarViewDiv').setAttribute('style', 'display: unset');
    updateCalendar(currentYear, currentMonth);
    currentView = calendarView;
}

function createCalendar() {
    var div = document.getElementById('calendarTitleDiv');

    var title = document.createElement('p');
    title.id = 'calendarTitle';
    div.appendChild(title);

    div = document.getElementById('calendarDiv');
    var prevArrow = document.createElement('p');
    prevArrow.className = 'arrow';
    prevArrow.id = 'prevArrow';
    prevArrow.appendChild(document.createTextNode('<'));
    prevArrow.addEventListener('click', loadPrevMonth);
    div.appendChild(prevArrow);
    var tbl = document.createElement('table');
    tbl.className = "calendar";
    var tr = document.createElement('tr');
    var th = document.createElement('th');
    th.innerHTML = 'Mon';
    tr.appendChild(th);
    th = document.createElement('th');
    th.innerHTML = 'Tue';
    tr.appendChild(th);
    th = document.createElement('th');
    th.innerHTML = 'Wed';
    tr.appendChild(th);
    th = document.createElement('th');
    th.innerHTML = 'Thu';
    tr.appendChild(th);
    th = document.createElement('th');
    th.innerHTML = 'Fri';
    tr.appendChild(th);
    th = document.createElement('th');
    th.innerHTML = 'Sat';
    tr.appendChild(th);
    th = document.createElement('th');
    th.innerHTML = 'Sun';
    tr.appendChild(th);
    tbl.appendChild(tr);
    

    for (i = 0; i < 6; i++) {
        tr = document.createElement('tr');
        for (j = 0; j < 7; j++) {
            var td = document.createElement('td');
            td.id = 'r' + i + 'c' + j;
            td.addEventListener('click', event => {
                listRecordingFiles(event.target.id);
            });
            tr.appendChild(td);
        }
        tbl.appendChild(tr);
    }
    div.appendChild(tbl);
    var nextArrow = document.createElement('p');
    nextArrow.className = 'arrow';
    nextArrow.id = 'nextArrow';
    nextArrow.appendChild(document.createTextNode('>'));
    nextArrow.addEventListener('click', loadNextMonth);
    div.appendChild(nextArrow);
    updateCalendar(currentYear, currentMonth);
}

function updateCalendarTitle(year, month) {
    var title = document.getElementById('calendarTitle')
    title.innerHTML = patient.Name + " - " + monthNames[month] + " " + year;
}

var calendarRecordings = new Map();

function updateCalendar(year, month) {
    updateCalendarTitle(year, month);
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

    var numFilled = 0;
    var prevMonthDays = new Date(year, month, 0).getDate();
    var currentDate;
    for (i = day; i > 0; i--) {
        currentDate = new Date(year, (month > 0 ? month-1 : 11), prevMonthDays - i + 1);
        var recording = recordingsContainsDate(currentDate);
        var color = 'white';
        if (recording != null) {
            color = recording.SuspectedAF ? 'red' : 'lightgreen';
        }
        var id = 'r0c' + (day - i);
        var td = document.getElementById(id);
        td.setAttribute('style', 'background-color: '+color+'; opacity: 0.5');
        td.innerHTML = (prevMonthDays - i + 1);
        numFilled++;
    }

    calendarRecordings.clear();
    var i = 0;
    for (i = 0; i < days; i++) {
        var row = math.floor((day + i) / 7);
        var column = (day + i) % 7;
        var id = 'r' + row + 'c' + column;
        var td = document.getElementById(id);
        currentDate = new Date(year, month, i + 1);
        var recording = recordingsContainsDate(currentDate);
        var color = 'white';
        if (recording != null) {
            color = recording.SuspectedAF ? 'red' : 'lightgreen';
            calendarRecordings.set( id, recording );
        }
        td.setAttribute('style', 'background-color: '+color);
        td.innerHTML = (i + 1);
        numFilled++
    }

    for (i = numFilled; i < 42; i++) {
        currentDate = new Date(year, ((month + 1) % 12), i + 1 - numFilled);
        var recording = recordingsContainsDate(currentDate);
        var color = 'white';
        if (recording != null) {
            color = recording.SuspectedAF ? 'red' : 'lightgreen';
        }
        var row = math.floor(i / 7);
        var column = i % 7;
        var id = 'r' + row + 'c' + column;
        var td = document.getElementById(id);
        td.setAttribute('style', 'background-color: '+color+'; opacity: 0.5');
        td.innerHTML = (i - numFilled + 1);
    }
}

function loadPrevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentYear--;
        currentMonth += 12;
    }
    updateCalendar(currentYear, currentMonth);
}

function loadNextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentYear++;
        currentMonth -= 12;
    }
    updateCalendar(currentYear, currentMonth);
}

var recordings = [];
var patient = { Name: "", SSN: "1234567890" };

function search(ssn) {
    ssn = ssn.split('-').join('');
    if (ssn.length > 10) {
        ssn = ssn.substring(2);
    }
    database.collection('Recordings').where('SSN', '==', ssn).withConverter(recordingConverter).get().then((querySnapshot) => {
        if (querySnapshot.empty) {
            alert("The patient you searched for is not included in this database");
            return;
        }
        recordings = [];
        querySnapshot.forEach(doc => {
            recordings.push(doc.data());
            recordings[recordings.length - 1].id = doc.id;
        });
        if (currentView == plotView) {
            clearPlotView();
        }
        updateCalendar(currentYear, currentMonth);
        showCalendarView();
        /*database.collection('Patients').doc(ssn).collection('Recordings').withConverter(recordingConverter).get().then(snapshot => {
            recordings = [];
            snapshot.forEach(data => {
                recordings.push(data.data());
            });
            if (currentView == plotView) {
                clearPlotView();
            }
            updateCalendar(currentYear, currentMonth);
            showCalendarView();
        });*/
        console.log("Searched");
    })/*.catch((error) => {
        console.log(error.message);
    });*/
}

Date.prototype.isSameDateAs = function (pDate) {
    return (
        this.getFullYear() === pDate.getFullYear() &&
        this.getMonth() === pDate.getMonth() &&
        this.getDate() === pDate.getDate()
    );
}

function recordingsContainsDate(date) {
    for(recording of recordings) {
        if (date.isSameDateAs(recording.CollDate)) {
            return recording;
        }
    }
    return null;
}

var recordingFiles = new Map();
var recordingFilesList = [];

function listRecordingFiles(id) {
    currentRecording = calendarRecordings.get(id);
    if (currentRecording === undefined) {
        return;
    }
    hideAll();
    
    database.collection("Recordings").doc(currentRecording.id).collection("Files").get().then(snapshot => {
        recordingFilesList = [];
        snapshot.forEach(doc => {
            recordingFilesList.push(doc.data());
        });
        recordingFilesList.sort(dynamicSort("FileName"));
        generateRecoringFilesList();
    });
    hideAll();
    plotView.setAttribute('style', 'display: unset');
    currentView = plotView;
    showBackButton();
}

function dynamicSort(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a, b) {
        /* next line works with strings and numbers, 
         * and you may want to customize it to your needs
         */
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}
function generateRecoringFilesList() {
    recordingsListUl = document.getElementById("recordingList");
    
    console.log("Creating List items");

    for (i = 0; i < recordingFilesList.length; i++) {
        var recording = recordingFilesList[i];
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        if (recording.SuspectedAF) {
            td.className = "recordingAF";
        } else {
            td.className = "recordingNotAF";
        }
        var id = "file_" + i;
        td.setAttribute("id", id);
        td.setAttribute("value", i);
        td.innerText = recording.FileName;
        td.addEventListener("click", function (event) { createPlotView(event.target.id) })
        tr.appendChild(td);
        recordingsListUl.appendChild(tr);
        recordingFiles.set(id, recording);
    }
    console.log("Done creating List items");
}

function showBackButton() {
    document.getElementById("backButton").setAttribute('style', 'visibility: visible;');
}

function hideBackButton() {
    document.getElementById("backButton").setAttribute('style', 'visibility: hidden;');

}