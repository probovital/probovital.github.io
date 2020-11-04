// Set the configuration for your app
  // TODO: Replace with your app's config object
//import * as firebase from 'firebase';
//import * from ‘firebase’;



var plotlyLayout = {
  title: 'ECG data',
paper_bgcolor: 'rgba(0,0,0,0)',
plot_bgcolor: 'rgba(0,0,0,0)'
}
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
var fourierFilter = [];
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
var highPass = 10

var selectedPoint = 0;
var latestAction = [];

//export default !firebase.apps.length ? firebase.initializeApp(config) : firebase.app();
function initializeData2(data, startIndex, endIndex, name, pulse=false, color=gray, type='line'){
  if(pulse){
    return makeTrace(normalize(data.slice(startIndex,endIndex), pulse), startIndex, endIndex, name, color, type);
  }
  else{
    return makeTrace(normalize(data.slice(startIndex,endIndex), pulse), startIndex, endIndex, name, color, type);
    //return makeTrace(standardize(data.slice(startIndex,endIndex), pulse), startIndex, endIndex, name, color, type);
  }
}

function getEcgData(dataItem){
  return ecgArray.slice(dataItem, dataItem+10);
}
function makeTrace(data, startIndex, endIndex, name, color, type){
  return {x:range(startIndex, endIndex), y: data, name: name, type:type, line:{color: color, width: 3}}
}


function loadPlotlyTimeSeries(ecgData){
frequencyPlot(rawECGArray.slice(0,3000));

currentIndex = 0;
myPlot = document.getElementById('chartly_still');

Plotly.purge(myPlot);
plotlyLayout.title = currentTitle;
Plotly.newPlot(myPlot, [initializeData2(ecgData, 0, windowLength, "ECG data"),
                        initializeData2(missingArray, 0, windowLength, "Missing pulse detection", pulse=true, color='orange'),
                        initializeData2(falsePulseArray, 0, windowLength, "Incorrect pulse detection", pulse=true, color='red'),
                        initializeData2(pulseArray, 0, windowLength, "Pulse detection", pulse=true, color=auriculaPrimaryColor)], plotlyLayout);


myPlot.on('plotly_click', function(data){
  dialog = document.getElementById('clickDialog');
  dialog.style.backgroundColor = "red";
  dialog.setAttribute("style","width:400px");

  var pts = '';
  for(var i=0; i < data.points.length; i++){
      pts = 'x = '+data.points[i].x +'\ny = '+
          data.points[i].y.toPrecision(3) + '\n\n';
      selectedPoint = data.points[i].x;
  }

  var signal = calculateSignalToNoise(data.points[0].x).toPrecision(3);
  var signalText = "Signal to noise at this location: " + signal;

  text = document.getElementById('selectedPointsText');
  text.innerText = 'Closest point clicked:\n\n'+pts+signalText;
  //alert('Closest point clicked:\n\n'+pts);
});

}


function plotlyUpdate(startTime, endTime){
  Plotly.react('chartly_still', [initializeData2(returnCurrentECGFilter(), startTime, endTime, "ECG data"),
                              initializeData2(missingArray, startTime, endTime, "Missing pulse detection", pulse=true, color='orange'),
                            initializeData2(falsePulseArray, startTime, endTime, "Incorrect pulse detection", pulse=true, color='red'),
                          initializeData2(pulseArray, startTime, endTime, "Pulse detection", pulse=true, color=auriculaPrimaryColor)], plotlyLayout);
  Plotly.relayout('chartly_still', {
    xaxis: {
      range: [startTime, (endTime)]
    }})
  calculateChartStats();

}




async function run() {
  console.log("Test array")
  console.log(testArray)
//  console.log("FFT of Test array")
//  console.log(egenDFT(testArray))
  var frequencies = egenDFT(testArray)
  egenReversDFT(frequencies)
  //egenDFT(egenDFT(testArray),false)


//  var reverse = new RFFT(transform, 12)
  document.getElementById("test").style.display = "none";
  document.getElementById("titleText").innerHTML = currentTitle;
  document.getElementById("delimiter").value = delimiter;

  firebase.initializeApp(firebaseConfig);


console.log("Loading Firebase");
const firebaseApp = firebase;
  // Get a reference to the storage service, which is used to create references in your storage bucket
  var storage = firebase.storage();
  var database = firebase.database();
  storageRef = storage.ref(baseStorageRef);

  //var gsReference = storage.refFromURL('gs://ecg-device.appspot.com/firestore/')
  //const fileRef = await gsReference.listAll();

  //var listRef = storageRef;

console.log("Firebase Loaded");
  loadFromStorage(storageRef);
  getFromStorage(storage, "1");

    document.getElementById('btnNext').onclick = function(){
      if(currentIndex+windowLength < ecgArray.length){
        currentIndex += windowLength;
        plotlyUpdate(currentIndex, currentIndex+windowLength)
      }
    }
    document.getElementById('btnBack').onclick = function(){
      if(currentIndex >= windowLength){
        currentIndex -= windowLength;
        plotlyUpdate(currentIndex, currentIndex+windowLength)
      }
      else if(currentIndex > 0){
        currentIndex = 0;
        plotlyUpdate(currentIndex, currentIndex+windowLength)
      }
    }

    document.getElementById('btnStop').onclick = function(){
      try{
        var latestActions = latestAction[latestAction.length-1];
        lastSelectedPoint = latestActions.point;
        if(latestActions.array=="missingArray"){
          missingArray[lastSelectedPoint] = "0";
          latestAction.pop();
        }
        else if(latestActions.array=="falsePulseArray"){
          falsePulseArray[lastSelectedPoint] = "0";
          latestAction.pop();
        }
        plotlyUpdate(currentIndex, currentIndex+windowLength);
        }
    catch(TypeError){
      console.log("No more to undo");
    }
  }
  document.getElementById('btnFilter').onclick = function(){
    if(filterValue=="Filtered"){
      filterValue="Raw";
    }
    else if(filterValue=="Raw"){
      filterValue="Fourier";
    }
    else{
      filterValue="Filtered";
    }

    //loadPlotlyTimeSeries(returnCurrentECGFilter());
    plotlyUpdate(0, 3000);
    calculateChartStats();
    displayMedianBeat(calculateMedianBeat());
    document.getElementById('btnFilter').value = filterValue;
  }

  btnFilter
    document.getElementById('btnUpload').onclick = function(){
      console.log("lala");
      uploadBlob(storage, currentTitle, [ecgArray, pulseArray, missingArray, falsePulseArray]);
  }

    document.getElementById('btnMissingPulse').onclick = function(){
      document.getElementById('clickDialog').style.display = "none";
      missingArray[selectedPoint] = "1";
      plotlyUpdate(currentIndex, currentIndex+windowLength);
      latestAction.push({"point": selectedPoint, "array": "missingArray"});
      //console.log(latestAction);
      //console.log(latestAction[0].point);

    }
    document.getElementById('btnFalsePulse').onclick = function(){
      document.getElementById('clickDialog').style.display = "none";
      falsePulseArray[selectedPoint] = "1";
      plotlyUpdate(currentIndex, currentIndex+windowLength);
      latestAction.push({"point": selectedPoint, "array": "falsePulseArray"});
    }
    document.getElementById('popupCancel').onclick = function(){
      document.getElementById('clickDialog').style.display = "none";
    }
    document.getElementById('btnReloadMedian').onclick = function(){
      var numberOfBeats = document.getElementById('medianNumberOfBeats').value;
      displayMedianBeat(calculateMedianBeat(numberOfBeats));
    }
    document.getElementById('btnReloadFilter').onclick = function(){
      lowPass = document.getElementById('lowPass').value;
      highPass = document.getElementById('highPass').value;
      frequencyPlot(rawECGArray.slice(0,3000));
    }

  document.getElementById('delimiter').onclick = async function(){
    if(delimiter == ","){
      delimiter = ";";
    }
    else{
      delimiter =",";
    }
    document.getElementById('delimiter').value = delimiter;
  }
  document.getElementById('storageRefButton').onclick = async function(){
    if(evaluateStorageSelected){
      evaluateStorageSelected = false;
      storageRef = storage.ref(baseStorageRef);
      loadFromStorage(storageRef);
    }
    else{
      evaluateStorageSelected = true;
      storageRef = storage.ref(evaluateStorageRef);
      loadFromStorage(storageRef);
    }
  }



}

//Här lägger vi in att run ska köras när dokumentet är laddat.
document.addEventListener('DOMContentLoaded', run);



function loadFromStorage(storageReference){

  storageReference.listAll().then(function(result){
    list_index = 0;
    listItems = [];
      result.items.forEach(function(refItem){
        //Here we are retrieving the unique url for the selected item
        refItem.getDownloadURL().then(function(url){
            listItems.push([refItem.name, url]);
            list_index++;
            if(list_index == result.items.length){
              listItems.sort();
              createListItem(listItems);
            }
        });
      })
      //console.log("List items");
      //console.log(listItems);

  }).catch(function(error){
      console.log(error);
  });
}






function makeplot(url) {
  //Plotly.d3.csv("https://raw.githubusercontent.com/plotly/datasets/master/2014_apple_stock.csv", function(data){ processData(data) } );
  Plotly.d3.dsv(delimiter)(url, function(data){ processData(data) } );
};


function processData(allRows) {
  try{
  console.log(allRows);
  var x = [];
  var y = [];
  standard_deviation = [];
  var columns = ['rawECG', 'ECG', 'PPGRED', 'PPGIR', 'Label', 'Missing', 'Incorrect'];
  var keys = Object.keys(allRows[0]);

  for(j=0; j<keys.length;j++){
    x = [], y = [], standard_deviation = [];
    //document.getElementById('length').value = allRows.length;
    end = allRows.length;
    for (var i=start; i<end; i++) {
      row = allRows[i];
      //console.log(row[keys[j]]);
      y.push(row[keys[j]]);
    }
    y = parseToFloat(y);
    if(keys[j]=='rawECG'){
      rawECGArray = y;

      //rawECGArray = smoothe(parseToFloat(rawECGArray), 10);
      var filter = new IIRFilter(DSP.LOWPASS, 50, 400);
      //rawECGArray = DSP.invert(parseToFloat(rawECGArray))
      var fft = new FFT(1024, 400);
      var parsedArray = parseToFloat(rawECGArray.slice(0,1024));

    //  fft.forward(parseToFloat(rawECGArray.slice(0,1024)));
    //    rawECGArray = fft.spectrum.

      //rawECGArray = filter.process(parseToFloat(rawECGArray));
      //console.log(rawECGArray)
    //  console.log(lowPassFilter.lowPassFilter(parseToFloat(rawECGArray), 5, 400, 1))
    }
    if(keys[j]=='ECG'){
      ecgArray = y;

    }
    if(keys[j]=='Label'){
      pulseArray = y;
      missingArray = [];
      falsePulseArray = [];
      for(i=0; i< y.length;i++){
        missingArray.push("0");
        falsePulseArray.push("0");
      }
    }
    if(keys[j]=='Missing'){
        missingArray = y;
    }
    if(keys[j]=='Incorrect'){
      falsePulseArray = y;
    }
  }
  flipECG();
  loadPlotlyTimeSeries(ecgArray);
  plotlyUpdate(0, 3000);
  calculateChartStats();
  displayMedianBeat(calculateMedianBeat());


}
catch(TypeError){
  console.log("Error: No data loaded");
}

}


function createListItem(arrayOfItems){
  document.getElementById("recordsList").innerHTML="";
  console.log("Creating List items");
  var ul = document.querySelector("ul");


  for(i=0; i < arrayOfItems.length; i++){

    var li = document.createElement("a");
    li.className = "list-group-item list-group-item-action";
    li.setAttribute("id", "list_field_" + i);
    li.setAttribute("value", i);
    li.setAttribute('href', "#");
    li.innerText = (arrayOfItems[i])[0];

    ul.appendChild(li);
    document.getElementById('list_field_' + i).onclick = function(event){

      //console.log(event);
      //console.log(event.target);
      //console.log(event.target.attributes.value.value);
      //console.log(event.target.innerText);
      //console.log(listItems);
      url2 = "https://cors-anywhere.herokuapp.com/" + (listItems[event.target.attributes.value.value])[1];
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

function parseToFloat(array){

  parsedArray = [];
  if (typeof array[0] === 'string' || array[0] instanceof String){
    for(i=0; i < array.length; i++){
      parsedArray.push(parseFloat(array[i].replace(",", ".")));
    }
  }
  else{
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

function calculateMedian(values){
  if(values.length ===0) return 0;
  values.sort(function(a,b){
    return a-b;
  });
  var half = Math.floor(values.length / 2);
  if (values.length % 2){
      return values[half];
  }
  return (values[half - 1] + values[half]) / 2.0;
}

function calculateStandardDeviation(numbers){
  var length = numbers.length;
  var mean = calculateMean(numbers);
  return Math.sqrt(numbers.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a+b) / length);
}

function returnCurrentECGFilter(){
  if(filterValue=="Filtered"){
    return ecgArray;
  }
  else if(filterValue=="Fourier"){
    return fourierFilter;
  }
  else{
    return rawECGArray;
  }
}


function normalize(array, pulse=false){
  var parsedArray = parseToFloat(array);

  var min = Math.min.apply(Math, parsedArray);
  var max = Math.max.apply(Math, parsedArray);
  normalizedArray = [];
  for(i=0; i < parsedArray.length; i++){
    if(pulse){
      normalizedArray.push(((parsedArray[i]-min)/(max-min))/10);
    }
    else{
      normalizedArray.push((parsedArray[i]-min)/(max-min));
    }
  }
  return normalizedArray;
}
function standardize(array){
  parsedArray = parseToFloat(array);
  var mean = calculateMean(parsedArray)
  var standardDeviation = calculateStandardDeviation(parsedArray);
  standardizedArray = [];
  for(var i=0; i < parsedArray.length; i++){
    standardizedArray.push(((parsedArray[i]-mean)/(standardDeviation)));
  }
  return standardizedArray;
}



function calculateSignalToNoise(pointInTime){
  var noiseLocation = pointInTime - 140
  var qrs = Math.max.apply(Math, absoluteValues(parseToFloat(ecgArray.slice(pointInTime - 5,pointInTime+5))));
  var noise = Math.max.apply(Math, absoluteValues(parseToFloat(ecgArray.slice(noiseLocation-5,noiseLocation+5))));
  return qrs/noise;
}

function calculateMeanSignalToNoises(pulseIndexes){
  signalToNoises = []
  for(var i=0; i < pulseIndexes.length; i++){
    var value = calculateSignalToNoise(pulseIndexes[i])
    signalToNoises.push(value);
  }
  return calculateMean(signalToNoises);
}

function absoluteValues(array){
  absoluteArray = [];
  for(var i=0; i < array.length; i++){
    absoluteArray.push(Math.abs(array[i]));
  }
  return absoluteArray;
}


function calculateChartStats(){
  var detectedPulses = 0
  var missingPulses = 0
  var incorrectPulses = 0
  var pulseIndexes = []
  for(var i = 0; i < pulseArray.length; i++){
    if(pulseArray[i] > 0){
      //console.log("Pulse Detected")
      detectedPulses++;
      pulseIndexes.push(i);
    }
    if(missingArray[i] > 0){
      missingPulses++;
    }
    if(falsePulseArray[i] > 0){
      incorrectPulses++;
    }
  }
  signalToNoise = calculateMeanSignalToNoises(pulseIndexes).toPrecision(3);
  var errorRate = ((missingPulses + incorrectPulses) / detectedPulses).toPrecision(3);
document.getElementById('chartStatText').innerText =  "Algorithm pulse detection\n\n" +
                                                      "Detected Pulses: " + detectedPulses + "\n" +
                                                      "Missed Pulses: " + missingPulses + "\n" +
                                                      "Incorrect Pulses: " + incorrectPulses + "\n" +
                                                      "Error Rate: " + errorRate + "\n\n" +
                                                      "Signal to noise: " + signalToNoise + "\n\n";

}


function calculateMedianBeat(beatNumber=5){
  var medianBeatArray = [];
  var beatRange = 0;
  var beatIndexes = [];
  var arrayOfDistances = [];
  var numberOfBeats = beatNumber;


  for(var i=0; i < pulseArray.length; i++){
    if(pulseArray[i] > 0 | missingArray[i] > 0){
      beatIndexes.push(i);
    }
  }
  for(var i=0; i<beatIndexes.length-2; i++){
    arrayOfDistances.push(beatIndexes[i+1] - beatIndexes[i]);
  }
  beatRange = Math.floor(calculateMedian(arrayOfDistances));

  if(numberOfBeats<2){
    numberOfBeats=2;
  }
  if(numberOfBeats > beatIndexes.length){
    numberOfBeats = beatIndexes.length;
  }

  //kolla varje index, om det finns ett puls eller missing beat så ska det räknas
  //spara detta index i en array
  //skapa ny array med avståndet mellan varje index
  // räkna ut medianavståndet och spara i beatrange

  var pointValues = [];
  for(var j=0; j < (beatRange *2) ; j++){
    pointValues = [];
    for(var i=0; i < numberOfBeats; i++){
      if ((beatIndexes[i]-beatRange) > 0 & (beatIndexes[i]+beatRange) < ecgArray.length){
        var value = beatIndexes[i] - beatRange + j;
        var thisValue =returnCurrentECGFilter()[value];

        pointValues.push(thisValue);
      }
    }
    var medianValue = calculateMedian(pointValues);
    medianBeatArray.push("" + medianValue);
  }

  //för varje beat, titta i range innan och efter, kolla att det finns plats fram och bak
  //spara varje index i en nested array index[i][värde]
  //skapa ny array medianBeat där varje värde är medianvärdet av värdena för index

  return medianBeatArray;
}

function displayMedianBeat(array){
  myPlot = document.getElementById('median');
  Plotly.purge(myPlot);
  plotlyLayout.title = "Median Beat";
  Plotly.newPlot(myPlot, [initializeData2(array, 0, array.length, "Median Beat")], plotlyLayout);
  Plotly.relayout(myPlot, {
    xaxis: {
      range: [0, array.length]
    }})
  console.log("Median beat created")
}

function smoothe(array, smoothening){
  var values = [];
  var value = array[0];
  values.push(value);

  for(var i =1; i<array.length;i++){
    var currentValue = array[i];
    value+= (currentValue - value) / smoothening;
    values.push(value);
  }
  return values;
}


function flipECG(beatNumber=10){
  beatIndexes = [];
  pulseValues = [];
  var numberOfBeats = beatNumber;
  beatRange = 10;

  signalArray = standardize(returnCurrentECGFilter());
  for(var i=0; i < pulseArray.length; i++){
    if(pulseArray[i] > 0 | missingArray[i] > 0){
      beatIndexes.push(i);
    }
  }

  if(numberOfBeats > beatIndexes.length){
    numberOfBeats = beatIndexes.length
  }
  var largestValues = 0;
  var pointValues = [];
  for(var i=0; i < numberOfBeats; i++){
    pointValues = [];
    if ((beatIndexes[i]-beatRange) > 0 & (beatIndexes[i]+beatRange) < ecgArray.length){
    for(var j=0; j < (beatRange*2) ; j++){
        var value = beatIndexes[i] - beatRange + j;
        var thisValue = signalArray[value];
        pointValues.push(thisValue);
      }
    }
    var largest = Math.max.apply(Math, pointValues);
    var smallest = Math.min.apply(Math, pointValues);
    if(Math.abs(smallest)>largest){
      largestValues += smallest
    }
    else{
      largestValues+= largest
    }
  }
  if(largestValues < 0){
    rawECGArray = DSP.invert(rawECGArray)
    ecgArray = DSP.invert(ecgArray)
    console.log("Signal flipped")
  }
  console.log("Largest value: "+largestValues)

}

function frequencyPlot(signal){
  var frequencies = egenDFT(signal)
  var reals = []
  for(var i = 0; i < frequencies.length; i++){
    reals.push(frequencies[i].re)
  }
  myPlot = document.getElementById('frequencies');
  Plotly.purge(myPlot);
  plotlyLayout.title = "Frequencies";
  Plotly.newPlot(myPlot, [initializeData2(reals, 0, reals.length, "Frequencies")], plotlyLayout);
  Plotly.relayout(myPlot, {
    xaxis: {
      range: [0, reals.length]
    }})
  console.log("Frequency plot created")

  fourierFiltering(frequencies)

//  egenReversDFT(frequencies)
}

function fourierFiltering(signal){
  var length = signal.length-1
  var middle = Math.floor(length/2)
  var im1 = math.complex(0, 1).im
  //var highPass = 10
  var fs = 400
  var highPassCorrected = Math.floor(highPass*fs)

  //var lowPass = 500
  var lowPassCorrected = Math.floor(lowPass*fs)

  var gaussFilter = [[]]
  for(var i = 0; i < length; i++){
    rowI = []
    for(var j =0; j< length; j++){
      rowI.push(0);
    }
    gaussFilter.push(rowI)
  }
  gaussFilter.shift()

  var sigma = 8
  r = 20

  for(var k = 0; k < length; k++){
    for(var i = 0; i<r; i++){
      gaussFilter[k][i] = Math.exp(Math.pow(-(i),2)/(2*Math.pow(sigma,2)))
    }
    gaussFilter[k][length-i] = gaussFilter[k][i]
  }
  console.log("Gauss filter")
  console.log(gaussFilter)


  //gauss(1:r+1) = exp(-(1:r+1).^ 2 / (2 * sigma ^ 2));  % +ve frequencies
  //gauss(end-r+1:end) = fliplr(gauss(2:r+1));           % -ve frequencies
  //y_gauss = ifft(Y.*gauss,1024);



  //for(var i = middle; i>lowPass; i--){
  //  signal[i].re = 0
  //  signal[length-i].re = 0
  //  signal[i].im= 0*im1
  //  signal[length-i].im= 0*im1
  //}

  for(var i = 0; i<highPass; i++){
    signal[i].re = 0
    signal[length-i].re = 0
    signal[i].im= 0*im1
    signal[length-i].im= 0*im1
  }
   fourierFilter = egenReversDFT(signal)
}






// OLD FUNCTIONS TARGETTED FOR REMOVAL










function garbage (){
  for( j = 0; j<columns.length; j++){

    x = [], y = [], standard_deviation = [];
    //document.getElementById('length').value = allRows.length;
    end = allRows.length;


    for (var i=start; i<end; i++) {
      row = allRows[i];
      x.push(i);
      y.push(row[columns[j]]);

      //if(i % end == 0){
      //  console.log(i);
      //}
    }
    console.log(y);
    if(columns[j]=='ECG'){
      ecgArray = y;
    }
    if(columns[j]=='Label'){
      pulseArray = y;
      missingArray = [];
      falsePulseArray = [];
      for(i=0; i< y.length;i++){
        missingArray.push("0");
        falsePulseArray.push("0");
      }
    }
    //if(columns[j]=='Missing'){
    //    missingArray = y;
    //}
    if(columns[j]=='Incorrect'){
      console.log("goes in here");
      falsePulseArray = y;
    }

    makePlotly( x, y, standard_deviation, j);
  }
  loadPlotlyTimeSeries();
  plotlyUpdate(0, 3000);
  chartStats();
}

function makePlotly( x, y, standard_deviation, i){
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
if (i == 0){
  Plotly.newPlot('EKG_div', traces, layout);


}
else if (i == 1){
  Plotly.newPlot('PPG_Red_div', traces,
    {title: 'PPG Red data'});
}
else if (i == 2){
  Plotly.newPlot('PPG_IR_div', traces,
    {title: 'PPG IR data'});
}
else if (i == 3){

  //console.log(document.getElementById('chartly_still').data);
  Plotly.newPlot('labels_div', traces,
    {title: 'Labels'});
}

};
