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
var currentStorage = 'gs://ecg-device.appspot.com/firestore/MedDev data D2:48:9E:6B:201027:11:22:25EKGdata.csv';
var evaluateStorageSelected = false;
var baseStorageRef = 'firestore';
var evaluateStorageRef = 'evaluated';
var delimiter = ";";
var ecgArray = [];
var pulseArray = [];
var missingArray = [];
var falsePulseArray = [];
var ecgLoaded = false;
var currentIndex = 0;
var windowLength = 3000;
var storageRef;
var signalToNoise = 0;

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


function loadPlotlyTimeSeries(){
currentIndex = 0;
myPlot = document.getElementById('chartly_still');

Plotly.purge(myPlot);
plotlyLayout.title = currentTitle;
Plotly.newPlot(myPlot, [initializeData2(ecgArray, 0, windowLength, "ECG data"),
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
  Plotly.react('chartly_still', [initializeData2(ecgArray, startTime, endTime, "ECG data"),
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
  y = [];
  standard_deviation = [];
  var columns = ['ECG', 'PPGRED', 'PPGIR', 'Label', 'Missing', 'Incorrect'];
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
  loadPlotlyTimeSeries();
  plotlyUpdate(0, 3000);
  calculateChartStats();
}catch(TypeError){
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
  for(i=0; i < array.length; i++){
    parsedArray.push(parseFloat(array[i].replace(",", ".")));
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

function calculateStandardDeviation(numbers){
  var length = numbers.length;
  mean = calculateMean(numbers);
  return Math.sqrt(numbers.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a+b) / length);
}


function normalize(array, pulse=false){
  parsedArray = parseToFloat(array);
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
    if(parseFloat(pulseArray[i].replace(",", ".")) > 0){
      //console.log("Pulse Detected")
      detectedPulses++;
      pulseIndexes.push(i);
    }
    if(parseFloat(missingArray[i].replace(",", ".")) > 0){
      missingPulses++;
    }
    if(parseFloat(falsePulseArray[i].replace(",", ".")) > 0){
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
