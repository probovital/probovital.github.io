// Set the configuration for your app
// TODO: Replace with your app's config object
//import * as firebase from 'firebase';
//import * from ‘firebase’;


var plotlyLayout = {
    title: 'ECG data',
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    legend: { 'orientation': 'h' },
    hoverinfo: 'none',
    hovermode: 'x',
    dragmode: 'pan',
    margin: {
        l: 50,
        r: 50,
        b: 0,
        t: 0,
        pad: 0
    },
    shapes: []
}

var plotlyLayoutMedian = {
    title: 'ECG data',
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    legend: { 'orientation': 'h' },
    hoverinfo: 'none',
    hovermode: 'closest',
    dragmode: 'pan',
    margin: {
        l: 50,
        r: 50,
        b: 0,
        t: 0,
        pad: 0
    }
}

var plotlyLayoutOverview = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: { 'visible': false, fixedrange: true },
    yaxis: { 'visible': false, fixedrange: true },
    title: { 'visible': false },
    hovermode: false,
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
var currentStorage = 'gs://ecg-device.appspot.com/firestore/MedDev data D2:48:9E:6B:201027:11:22:25EKGdata.csv';
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
var filterValue = "Filtered";
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

//export default !firebase.apps.length ? firebase.initializeApp(config) : firebase.app();
function initializeData(data, name, pulse = false, color = gray, type = 'line') {
    return makeTrace(normalize(data, pulse), name, color, type);
}

function getEcgData(dataItem) {
    return ecgArray.slice(dataItem, dataItem + 10);
}
function makeTrace(data, name, color, type) {
    return { x: range(0, data.length), y: data, name: name, type: type, line: { color: color, width: 3 }, hoverinfo: 'none' }
}


function loadPlotlyTimeSeries(ecgData) {
    philipsFilter = meanFilter(rawECGArray, k = 8);

    currentIndex = 0;
    myPlot = document.getElementById('chartly_still');

    Plotly.purge(myPlot);
    plotlyLayout.title = currentTitle;
    normalizedECGData = normalize(ecgData, pulse = false);
    Plotly.newPlot(myPlot, [initializeData(ecgData, "ECG data"),
                            initializeData(missingArray, "Missing pulse detection", pulse = true, color = 'orange'),
                            initializeData(falsePulseArray, "Incorrect pulse detection", pulse = true, color = 'red'),
        initializeData(pulseArray, "Pulse detection", pulse = true, color = auriculaPrimaryColor)], plotlyLayout, { displayModeBar: false });

    var overviewPlot = document.getElementById('chartly_overview');
    Plotly.newPlot(overviewPlot, [initializeData(ecgData, "ECG data")], plotlyLayoutOverview, { displayModeBar: false });
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
        /*for (var i = 0; i < data.points.length; i++) {
            pts = 'x = ' + data.points[i].x + '\ny = ' +
                data.points[i].y.toPrecision(3) + '\n\n';
            selectedPoint = data.points[i].x;
        }*/

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
        }
    });

    overviewPlot.on('plotly_click', function (data) {
        console.log(data);
    });
}


function plotlyUpdate(startTime, endTime) {
    /*Plotly.react('chartly_still', [initializeData(returnCurrentECGFilter(), "ECG data"),
                                    initializeData(missingArray, "Missing pulse detection", pulse = true, color = 'orange'),
                                    initializeData(falsePulseArray, "Incorrect pulse detection", pulse = true, color = 'red'),
                                    initializeData(pulseArray, "Pulse detection", pulse = true, color = auriculaPrimaryColor)], plotlyLayout);*/
    Plotly.relayout('chartly_still', {
        xaxis: {
            range: [startTime, (endTime)]
        }, 
        yaxis: {
            range: [0, math.max(normalizedECGData.slice(startTime,endTime))]
        }
    })
    calculateChartStats();
}




async function run() {
    deltaSignal = deltaFunction(windowLength);
    stepSignal = stepFunction(600);

    //  var reverse = new RFFT(transform, 12)
    document.getElementById("test").style.display = "none";
    document.getElementById("titleText").innerHTML = currentTitle;
    document.getElementById("delimiter").value = delimiter;

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
    loadFromStorage(storageRef);
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

    document.getElementById('btnStop').onclick = function () {
        try {
            var latestActions = latestAction[latestAction.length - 1];
            lastSelectedPoint = latestActions.point;
            if (latestActions.array == "missingArray") {
                missingArray[lastSelectedPoint] = "0";
                latestAction.pop();
            }
            else if (latestActions.array == "falsePulseArray") {
                falsePulseArray[lastSelectedPoint] = "0";
                latestAction.pop();
            }
            plotlyUpdate(currentIndex, currentIndex + windowLength);
        }
        catch (TypeError) {
            console.log("No more to undo");
        }
    }
    document.getElementById('btnFilter').onclick = function () {
        if (filterValue == "Filtered") {
            filterValue = "Raw";
        }
        else if (filterValue == "Raw") {
            filterValue = "Fourier";
        }
        else if (filterValue == "Fourier") {
            filterValue = "DeltaFunction";
        }
        else if (filterValue == "DeltaFunction") {
            filterValue = "PhilipsFilter";
        }
        else {
            filterValue = "Filtered";
        }

        //loadPlotlyTimeSeries(returnCurrentECGFilter());
        plotlyUpdate(0, 3000);
        calculateChartStats();

        //var medianBeatArray = []
        //for(var i=-5; i <5; i++){
        //  medianBeatArray.push(calculateMedianBeat(index=i))
        //}
        //displayMedianBeat(medianBeatDistorted(medianBeatArray));
        displayMedianBeat(calculateMedianBeat());
        document.getElementById('btnFilter').value = filterValue;
    }

    document.getElementById('btnUpload').onclick = function () {
        uploadBlob(storage, currentTitle, [ecgArray, pulseArray, missingArray, falsePulseArray]);
    }
    document.getElementById('btnDownload').onclick = function () {
        storage.refFromURL(currentStorage).getDownloadURL().then(function (url) { window.open(url) });
    }

    document.getElementById('btnMissingPulse').onclick = function () {
        document.getElementById('clickDialog').style.display = "none";
        missingArray[selectedPoint] = "1";
        plotlyUpdate(currentIndex, currentIndex + windowLength);
        latestAction.push({ "point": selectedPoint, "array": "missingArray" });
        //console.log(latestAction);
        //console.log(latestAction[0].point);

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
    document.getElementById('btnReloadMedian').onclick = function () {
        var numberOfBeats = document.getElementById('medianNumberOfBeats').value;
        displayMedianBeat(calculateMedianBeat(numberOfBeats));
    }
    document.getElementById('btnReloadFilter').onclick = function () {
        lowPass = document.getElementById('lowPass').value;
        highPass = document.getElementById('highPass').value;
        frequencyPlot(rawECGArray.slice(0, 3000));
    }

    document.getElementById('delimiter').onclick = async function () {
        if (delimiter == ",") {
            delimiter = ";";
        }
        else {
            delimiter = ",";
        }
        document.getElementById('delimiter').value = delimiter;
    }
    document.getElementById('storageRefButton').onclick = async function () {
        if (evaluateStorageSelected) {
            evaluateStorageSelected = false;
            storageRef = storage.ref(baseStorageRef);
            loadFromStorage(storageRef);
        }
        else {
            evaluateStorageSelected = true;
            storageRef = storage.ref(evaluateStorageRef);
            loadFromStorage(storageRef);
        }
    }

}

//Här lägger vi in att run ska köras när dokumentet är laddat.
document.addEventListener('DOMContentLoaded', run);



function loadFromStorage(storageReference) {

    storageReference.listAll().then(function (result) {
        list_index = 0;
        listItems = [];
        result.items.forEach(function (refItem) {
            //Here we are retrieving the unique url for the selected item
            refItem.getDownloadURL().then(function (url) {
                listItems.push([refItem.name, url]);
                list_index++;
                if (list_index == result.items.length) {
                    listItems.sort();
                    createListItem(listItems);
                }
            });
        })
        //console.log("List items");
        //console.log(listItems);

    }).catch(function (error) {
        console.log(error);
    });
}






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

                //rawECGArray = smoothe(parseToFloat(rawECGArray), 10);
                var filter = new IIRFilter(DSP.LOWPASS, 50, 400);
                //rawECGArray = DSP.invert(parseToFloat(rawECGArray))
                var fft = new FFT(1024, 400);
                var parsedArray = parseToFloat(rawECGArray.slice(0, 1024));

                //  fft.forward(parseToFloat(rawECGArray.slice(0,1024)));
                //    rawECGArray = fft.spectrum.

                //rawECGArray = filter.process(parseToFloat(rawECGArray));
                //console.log(rawECGArray)
                //  console.log(lowPassFilter.lowPassFilter(parseToFloat(rawECGArray), 5, 400, 1))
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
        flipECG();
        loadPlotlyTimeSeries(ecgArray);
        plotlyUpdate(0, 3000);
        calculateChartStats();
        //var medianBeatArray = []
        //for(var i=-5; i <5; i++){
        //  medianBeatArray.push(calculateMedianBeat(index=i))
        //}
        //displayMedianBeat(medianBeatDistorted(medianBeatArray));
        //displayMedianBeat(calculateMedianBeat());
        //convolveSignals(rawECGArray, ecgArray)


    }
    catch (TypeError) {
        console.log("Error: No data loaded");
        console.log(TypeError)
    }
}


function createListItem(arrayOfItems) {
    document.getElementById("recordsList").innerHTML = "";
    console.log("Creating List items");
    var ul = document.querySelector("ul");


    for (i = 0; i < arrayOfItems.length; i++) {

        var li = document.createElement("a");
        li.className = "list-group-item list-group-item-action";
        li.setAttribute("id", "list_field_" + i);
        li.setAttribute("value", i);
        li.setAttribute('href', "#");
        li.innerText = (arrayOfItems[i])[0];

        ul.appendChild(li);
        document.getElementById('list_field_' + i).onclick = function (event) {

            //console.log(event);
            //console.log(event.target);
            //console.log(event.target.attributes.value.value);
            //console.log(event.target.innerText);
            //console.log(listItems);
            url2 = (listItems[event.target.attributes.value.value])[1];
            currentStorage = (listItems[event.target.attributes.value.value])[1];
            currentTitle = event.target.innerText;
            document.getElementById("titleText").innerHTML = currentTitle;
            makeplot(url2);
        }
    }
    console.log("Done creating List items");
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

function calculateStandardDeviation(numbers) {
    var length = numbers.length;
    var mean = calculateMean(numbers);
    return Math.sqrt(numbers.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / length);
}

function returnCurrentECGFilter() {
    if (filterValue == "Filtered") {
        return ecgArray;
    }
    else if (filterValue == "Fourier") {
        return fourierFilter;
    }
    else if (filterValue == "DeltaFunction") {
        return deltaSignal;
    }
    else if (filterValue == "PhilipsFilter") {
        return philipsFilter;
    }
    else {
        return rawECGArray;
    }
}


function normalize(array, pulse = false) {
    var parsedArray = parseToFloat(array);

    var min = Math.min.apply(Math, parsedArray);
    var max = Math.max.apply(Math, parsedArray);
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
function standardize(array) {
    parsedArray = parseToFloat(array);
    var mean = calculateMean(parsedArray)
    var standardDeviation = calculateStandardDeviation(parsedArray);
    standardizedArray = [];
    for (var i = 0; i < parsedArray.length; i++) {
        standardizedArray.push(((parsedArray[i] - mean) / (standardDeviation)));
    }
    return standardizedArray;
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
                var thisValue = returnCurrentECGFilter()[value + index];

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

function medianBeatDistorted(arrayOfMedianBeats) {
    medianBeatArray = []

    for (var i = 0; i < arrayOfMedianBeats[0].length; i++) {
        var medianValue = []
        for (var j = 0; j < arrayOfMedianBeats.length; j++) {
            medianValue.push(arrayOfMedianBeats[j][i])
        }
        medianBeatArray.push(calculateMedian(medianValue))
    }
    return medianBeatArray
}

function displayMedianBeat(array) {
    myPlot = document.getElementById('median');
    Plotly.purge(myPlot);
    plotlyLayout.title = "Median Beat";
    Plotly.newPlot(myPlot, [initializeData(array, "Median Beat")], plotlyLayoutMedian);
    Plotly.relayout(myPlot, {
        xaxis: {
            range: [0, array.length]
        }
    })
    console.log("Median beat created")
}

function smoothe(array, smoothening) {
    var values = [];
    var value = array[0];
    values.push(value);

    for (var i = 1; i < array.length; i++) {
        var currentValue = array[i];
        value += (currentValue - value) / smoothening;
        values.push(value);
    }
    return values;
}


function flipECG(beatNumber = 10) {
    var beatIndexes = [];
    var pulseValues = [];
    var numberOfBeats = beatNumber;
    var beatRange = 15;

    var signalArray = standardize(returnCurrentECGFilter());
    for (var i = 0; i < pulseArray.length; i++) {
        if (pulseArray[i] > 0 | missingArray[i] > 0) {
            beatIndexes.push(i);
        }
    }

    if (numberOfBeats > beatIndexes.length) {
        numberOfBeats = beatIndexes.length
    }
    var largestValues = 0;
    var pointValues = [];
    for (var i = 0; i < numberOfBeats; i++) {
        pointValues = [];
        if ((beatIndexes[i] - beatRange) > 0 & (beatIndexes[i] + beatRange) < ecgArray.length) {
            for (var j = 0; j < (beatRange * 2); j++) {
                var value = beatIndexes[i] - beatRange + j;
                var thisValue = signalArray[value];
                pointValues.push(thisValue);
            }
        }
        var largest = Math.max.apply(Math, pointValues);
        var smallest = Math.min.apply(Math, pointValues);
        if (Math.abs(smallest) > largest) {
            largestValues += smallest
        }
        else {
            largestValues += largest
        }
    }
    if (largestValues < 0) {
        rawECGArray = DSP.invert(rawECGArray)
        ecgArray = DSP.invert(ecgArray)
        console.log("Signal flipped")
    }
    console.log("Largest value: " + largestValues)

}

function frequencyPlot(signal) {
    console.log("FFT algorithms: ")
    //console.log(rawECGArray)
    var paddedSignal = zeroPadding(signal)
    //console.log(rawECGArray)
    var frequencies = fftTime(paddedSignal);
    //console.log("Freq"+frequencies)
    //console.log("Signal"+signal)

    //console.log("Reversed Frequencies"+mySignalReverser(signal))
    //console.log("Return signal"+fftTime(mySignalReverser(paddedSignal)))
    //  var frequencies = egenDFT(signal)
    //console.log("Freq2" +frequencies)
    var deltaFrequencies = egenDFT(deltaSignal)
    var reals = []
    for (var i = 0; i < frequencies.length; i++) {
        reals.push(frequencies[i].re)
    }
    myPlot = document.getElementById('frequencies');
    Plotly.purge(myPlot);
    plotlyLayout.title = "Frequencies";
    Plotly.newPlot(myPlot, [initializeData(reals, "Frequencies")], plotlyLayout);
    Plotly.relayout(myPlot, {
        xaxis: {
            range: [0, reals.length]
        }
    })
    console.log("Frequency plot created")


    console.log("InverseDFT Starts")
    var n = timeTaken();
    fourierFilter = fourierFiltering(frequencies)
    fourierFilter = meanFilter(fourierFilter)

    //Cutting the end of the filtered fourierSignal
    var padding = fourierFilter.length - rawECGArray.length
    for (var i = 0; i < padding; i++) {
        fourierFilter.pop()
    }
    console.log("Time taken: ")
    var n2 = timeTaken();
    var deltaTime = n2 - n;
    console.log(deltaTime)
    var newFilter = myInversefft(frequencies);
    //uncomment to allow deltaWave
    //console.log("Inverse FFT"+newFilter)
    //deltaSignal = fourierFiltering(deltaFrequencies)
    //deltaSignal = philipFilter(deltaSignal)

    //Använd nedanstående kod för att se hur en deltaSignal påverkas av ett filter, samt hur frekvenserna ser ut
    //deltaSignal = (philipFilter(deltaSignal))
    //deltaSignal = pontusBandPass(pontusBandPass(pontusBandPass(pontusBandPass(deltaSignal, targetFrequency = 25, targetBandWidth = 20))))
    //fourierFiltering(fftTime(zeroPadding(deltaSignal)))
    //fourierFiltering(deltaSignal)


    //  egenReversDFT(frequencies)
}

function fourierFiltering(signal) {
    var length = signal.length - 1
    var middle = Math.floor(length / 2)
    var im1 = math.complex(0, 1).im
    //var highPass = 10
    var fs = 400
    var highPassCorrected = Math.floor(highPass * fs)

    //var lowPass = 500
    var lowPassCorrected = Math.floor(lowPass * fs)

    var gaussFilter = [[]]
    var gaussFilter2 = []
    for (var i = 0; i < length; i++) {
        rowI = []
        for (var j = 0; j < length; j++) {
            rowI.push(0);
        }
        gaussFilter.push(rowI)
        gaussFilter2.push(0)
    }
    gaussFilter.shift()

    var correctedFs = length / 400

    var sigma = 30 * correctedFs
    //var r = 200
    var r = Math.floor(200 * correctedFs)


    for (var k = 0; k < length; k++) {
        for (var i = 0; i < r; i++) {
            gaussFilter[k][i] = Math.exp(-Math.pow((i), 2) / (2 * Math.pow(sigma, 2)))
            gaussFilter[k][length - i] = gaussFilter[k][i]
        }
        for (var i = 0; i < r; i++) {
            gaussFilter2[i] = gaussFilter[k][i]
            gaussFilter2[length - i] = gaussFilter[k][length - i]
        }

    }
    //for(var i = 0; i < 200; i++){
    //  gaussFilter2[i] = 1
    //  gaussFilter2[length-i] = 1
    //}
    //console.log("Gauss filter")
    //console.log(gaussFilter2)



    //gauss(1:r+1) = exp(-(1:r+1).^ 2 / (2 * sigma ^ 2));  % +ve frequencies
    //gauss(end-r+1:end) = fliplr(gauss(2:r+1));           % -ve frequencies
    //y_gauss = ifft(Y.*gauss,1024);



    //signal = remove50hzNoise(signal, noiseBand=50, noiseWidth = 25)
    //signal = remove50hzNoise(signal, noiseBand=100, noiseWidth = 15, noiseChange = 0.01, fs=400)

    //signal = remove50hzNoise(signal, noiseBand=150, noiseWidth = 15, noiseChange = 0.01, fs=400)
    //signal = remove50hzNoise(signal, noiseBand=190, noiseWidth = 5, noiseChange = 0.01, fs=400)
    //signal = remove50hzNoise(signal, noiseBand=2, noiseWidth = 1, noiseChange = 0.01, fs=400)
    //var firSignal = FIRfilter(40, 250, signal.length/2)
    //  console.log("fir"+firSignal)
    //  var flippedArray = Array.from(firSignal)
    //  firSignal = firSignal.concat(flippedArray.reverse())

    //  console.log("fir"+firSignal)
    var nySignal = []



    var magnitudes = calculateMagnitude(signal)

    //magnitudes = convolveSignals(rawECGArray, ecgArray)
    myPlot = document.getElementById('frequencies');
    Plotly.purge(myPlot);
    plotlyLayout.title = "Magnitudes";
    Plotly.newPlot(myPlot, [initializeData(magnitudes.slice(1, magnitudes.length / 2), "Frequencies")], plotlyLayout);
    Plotly.relayout(myPlot, {
        xaxis: {
            range: [0, magnitudes.length / 2]
        }
    })

    //  for(var i = 0; i < signal.length;i++){
    //  signal[i].re = signal[i].re * firSignal[i]
    //    signal[i].im = signal[i].im * firSignal[i]
    //  }

    return egenReversDFT(signal)
}

function deltaFunction(signalLength) {
    var deltaSignal = []
    deltaSignal.push(1);
    for (var i = 1; i < signalLength; i++) {
        deltaSignal.push(0)
    }
    return deltaSignal;
}


function stepFunction(signalLength) {
    var stepSignalTemp = []
    for (var i = 0; i < signalLength / 2; i++) {
        stepSignalTemp.push(0);
    }
    for (var i = signalLength / 2; i < signalLength; i++) {
        stepSignalTemp.push(1);
    }
    return stepSignalTemp
}


function remove50hzNoise(signal, noiseBand = 50, noiseWidth = 6, noiseChange = 0.01, fs = 400) {
    var length = signal.length
    var fc = fs / length
    noiseBand = Math.floor(noiseBand / fc)
    noiseWidth = Math.floor(noiseWidth / fc)

    for (var i = noiseBand - noiseWidth; i < noiseBand + noiseWidth; i++) {
        signal[i].re = signal[i].re * noiseChange
        signal[length - i].re = signal[length - i].re * noiseChange
        signal[i].im = signal[i].im * noiseChange
        signal[length - i].im = signal[length - i].im * noiseChange

        signal[i + noiseBand].re = signal[i + noiseBand].re * noiseChange
        signal[length - (i + noiseBand)].re = signal[length - (i + noiseBand)].re * noiseChange
        signal[i + noiseBand].im = signal[i + noiseBand].im * noiseChange
        signal[length - (i + noiseBand)].im = signal[length - (i + noiseBand)].im * noiseChange
    }
    return signal
}



function convolveSignals(inputSignal, targetSignal) {
    var inputSignalArray = createArrayOfBeats(inputSignal)
    var targetSignalArray = createArrayOfBeats(targetSignal)
    var inputMagnitude = []
    var targetMagnitude = []

    var inputFrequencies = signalFrequencies(inputSignalArray)
    var targetFrequencies = signalFrequencies(targetSignalArray)

    for (var i = 0; i < inputSignalArray.length; i++) {
        inputMagnitude.push(calculateMagnitude(inputFrequencies[i]))
    }
    for (var i = 0; i < targetSignalArray.length; i++) {
        targetMagnitude.push(calculateMagnitude(targetFrequencies[i]))
    }
    var inputAvgMagnitude = avgMagnitude(inputMagnitude)
    var targetAvgMagnitude = avgMagnitude(targetMagnitude)


    var magnitudeDifference = []
    for (var i = 0; i < targetAvgMagnitude.length; i++) {
        magnitudeDifference.push(targetAvgMagnitude[i] / inputAvgMagnitude[i])
    }

    //Take a pulse, get the phase and magnitude. Subtract avgMagnitude, redo to normal space and IFFT, then plot
    var filteredPulse = []
    var inputPhase = calculatePhase(inputFrequencies[7])
    for (var i = 0; i < targetAvgMagnitude.length; i++) {
        filteredPulse.push(inputMagnitude[7][i] * magnitudeDifference[i])
    }
    var inverseMagnitude = inverseCalculateMagnitude(filteredPulse, inputPhase)
    var reconstructedBeat = egenReversDFT(inverseMagnitude)
    //Plot it
    //myPlot = document.getElementById('frequencies');
    //Plotly.purge(myPlot);
    //plotlyLayout.title = "Reconstructed Beat";
    //Plotly.newPlot(myPlot, [initializeData2(reconstructedBeat, 0, reconstructedBeat.length, "Frequencies")], plotlyLayout);
    //Plotly.relayout(myPlot, {
    //  xaxis: {
    //    range: [0, reconstructedBeat.length]
    //  }})

    return magnitudeDifference
}


function signalFrequencies(signalArray) {
    var frequencyArray = []
    var frequencies = []

    for (var i = 0; i < signalArray.length; i++) {
        var paddedSignal = zeroPadding(signalArray[i])
        frequencyArray.push(fftTime(paddedSignal))
    }
    return frequencyArray
}


//Här skapar vi avg magnituden för så som signalen bör se ut eller faktiskt ser ut
function avgMagnitude(signalArray) {
    var avgMagnitude = Array(signalArray.length).fill(0)

    for (var i = 0; i < signalArray[0].length; i++) {
        var numberIterations = 1
        var mean = 0
        for (var j = 0; j < signalArray.length; j++) {

            //mean = mean*(numberIterations-(1/numberIterations)-1)+signalArray[j][i]*(1/numberIterations)
            mean = (mean * numberIterations + signalArray[j][i]) / (numberIterations + 1)
            numberIterations++
        }
        avgMagnitude[i] = mean
    }
    return avgMagnitude
}

// OLD FUNCTIONS TARGETTED FOR REMOVAL






function createArrayOfBeats(signal) {
    var beatsArray = [];
    var beatRange = 0;
    var beatIndexes = [];
    var arrayOfDistances = [];

    //search current pulseArray, if a point has a value >0 put it into beatIndexes
    for (var i = 0; i < pulseArray.length; i++) {
        if (pulseArray[i] > 0 | missingArray[i] > 0) {
            beatIndexes.push(i);
        }
    }

    //Calculate the median distance between beats
    for (var i = 0; i < beatIndexes.length - 2; i++) {
        arrayOfDistances.push(beatIndexes[i + 1] - beatIndexes[i]);
    }
    beatRange = Math.floor(calculateMedian(arrayOfDistances));

    //Create an array of beats
    var pointValues = [];
    //for each beat
    for (var i = 0; i < beatIndexes.length; i++) {
        pointValues = [];
        //for each value in that beats range
        for (var j = 0; j < (beatRange * 2); j++) {
            //if the window we are looking at is within the ecg array length
            if ((beatIndexes[i] - beatRange) > 0 & (beatIndexes[i] + beatRange) < ecgArray.length) {
                var value = beatIndexes[i] - beatRange + j;
                //push that point to the array of all the values for that beat
                pointValues.push(signal[value]);
            }
        }
        //push the beat into the array of beats
        if (pointValues.length != 0) {
            beatsArray.push(pointValues)
        }
    }
    //  console.log("Beats array: ")
    //  console.log(beatsArray)
    return beatsArray
}

//function rinseSignal(magnitudeDifference){
//  var paddedSignal = zeroPadding(signalArray[i])
//  var inputMagnitude = calculateMagnitude(fftTime(paddedSignal))
//  var newMagnitude = []
//  for(var i = 0; i < magnitudeDifference.length)
//}






















function garbage() {
    for (j = 0; j < columns.length; j++) {

        x = [], y = [], standard_deviation = [];
        //document.getElementById('length').value = allRows.length;
        end = allRows.length;


        for (var i = start; i < end; i++) {
            row = allRows[i];
            x.push(i);
            y.push(row[columns[j]]);

            //if(i % end == 0){
            //  console.log(i);
            //}
        }
        console.log(y);
        if (columns[j] == 'ECG') {
            ecgArray = y;
        }
        if (columns[j] == 'Label') {
            pulseArray = y;
            missingArray = [];
            falsePulseArray = [];
            for (i = 0; i < y.length; i++) {
                missingArray.push("0");
                falsePulseArray.push("0");
            }
        }
        //if(columns[j]=='Missing'){
        //    missingArray = y;
        //}
        if (columns[j] == 'Incorrect') {
            console.log("goes in here");
            falsePulseArray = y;
        }

        makePlotly(x, y, standard_deviation, j);
    }
    loadPlotlyTimeSeries();
    plotlyUpdate(0, 3000);
    chartStats();
}

function makePlotly(x, y, standard_deviation, i) {
    var plotDiv = document.getElementById("plot");
    var traces = [{
        x: x,
        y: y,
        type: 'scatter'
    }];

    var selectorOptions = {
        buttons: [{
            step: 'all',
        }],
    };


    var layout = {
        title: 'EKG data',
        xaxis: {
            rangeselector: selectorOptions,
            rangeslider: {}
        },
        yaxis: {
            fixedrange: false
        }
    };
    //console.log(i);
    if (i == 0) {
        Plotly.newPlot('EKG_div', traces, layout);


    }
    else if (i == 1) {
        Plotly.newPlot('PPG_Red_div', traces,
            { title: 'PPG Red data' });
    }
    else if (i == 2) {
        Plotly.newPlot('PPG_IR_div', traces,
            { title: 'PPG IR data' });
    }
    else if (i == 3) {

        //console.log(document.getElementById('chartly_still').data);
        Plotly.newPlot('labels_div', traces,
            { title: 'Labels' });
    }

};
