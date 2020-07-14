// Set the configuration for your app
  // TODO: Replace with your app's config object
//import * as firebase from 'firebase';
//import * from ‘firebase’;

const firebaseConfig = {
  apiKey: "AIzaSyBlqFZN0ssCK8v1jbggxptaWxocUpjEkoc",
  authDomain: "ecg-device.firebaseapp.com",
  databaseURL: "https://ecg-device.firebaseio.com",
  projectId: "ecg-device",
  storageBucket: "ecg-device.appspot.com",
  messagingSenderId: "288169120284",
  appId: "1:288169120284:web:539cf8ea9a132161a6c5d9",
  measurementId: "G-CYNRF73Q7L"
};

var start = 0;
var end = 2000;
var list_index = 0;
var urls = [];
var listItems = [];
var currentStorage = 'gs://ecg-device.appspot.com/firestore/MedDev200622:13:52:26EKGdata.csv';

//export default !firebase.apps.length ? firebase.initializeApp(config) : firebase.app();

  async function run() {

  document.getElementById("test").style.display = "none";

//try {
  firebase.initializeApp(firebaseConfig);
//}
//catch (err) {
// we skip the “already exists” message which is
// not an actual error when we’re hot-reloading
  //if (!/already exists/.test(err.message)) {
  //console.error(‘Firebase initialization error raised’, err.stack);
  //}
//}

console.log("Loading Firebase");
const firebaseApp = firebase;
  // Get a reference to the storage service, which is used to create references in your storage bucket
  var storage = firebase.storage();
  var database = firebase.database();


  var storageRef = storage.ref('firestore');
  //var gsReference = storage.refFromURL('gs://ecg-device.appspot.com/firestore/')
  //const fileRef = await gsReference.listAll();

  //var listRef = storageRef;

console.log("Firebase Loaded");
  storageRef.listAll().then(function(result){

      result.items.forEach(function(imgRef){

        //Here we are retrieving the unique url for the selected item
        imgRef.getDownloadURL().then(function(url){
            listItems.push([imgRef.name, url]);
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

  getFromStorage(storage, "1");

  document.getElementById('load_graph').onclick = async function(){
    start = document.getElementById('start').value;
    end = document.getElementById('end').value;
    getFromStorage(storage, "1");
  }
  document.getElementById('onlyECG').onclick = async function(){
    document.getElementById('EKG_div').setAttribute("style","width:1600px; height:600px");
    document.getElementById('PPG_IR_div').style.display = "none";
    document.getElementById('PPG_Red_div').style.display = "none";
    getFromStorage(storage, "1");
  }
  document.getElementById('onlyPPGIR').onclick = async function(){
    document.getElementById('PPG_IR_div').setAttribute("style","width:1600px; height:600px");
    document.getElementById('EKG_div').style.display = "none";
    document.getElementById('PPG_Red_div').style.display = "none";
    getFromStorage(storage, "1");
  }
  document.getElementById('onlyPPGRed').onclick = async function(){
    document.getElementById('PPG_Red_div').setAttribute("style","width:1600px; height:600px");
    document.getElementById('PPG_IR_div').style.display = "none";
    document.getElementById('EKG_div').style.display = "none";
    getFromStorage(storage, "1");
  }
  document.getElementById('all').onclick = async function(){
    document.getElementById('EKG_div').setAttribute("style","width:1600px; height:250px");
    document.getElementById('PPG_Red_div').setAttribute("style","width:1600px; height:250px");
    document.getElementById('PPG_IR_div').setAttribute("style","width:1600px; height:250px");
    document.getElementById('PPG_IR_div').style.display = "block";
    document.getElementById('PPG_Red_div').style.display = "block";
    document.getElementById('EKG_div').style.display = "block";
    getFromStorage(storage, "1");
  }


}
//Här lägger vi in att run ska köras när dokumentet är laddat.
document.addEventListener('DOMContentLoaded', run);


function writeNewPost(database, uid, username, picture, title, body) {
  // A post entry.
  var postData = {
    author: username,
    uid: uid,
    body: body,
    title: title,
    starCount: 0,
    authorPic: picture
  };
  // Get a key for a new Post.
  var newPostKey = database.ref().child('posts').push().key;

  // Write the new post's data simultaneously in the posts list and the user's post list.
  var updates = {};
  updates['/posts/' + newPostKey] = postData;
  updates['/user-posts/' + uid + '/' + newPostKey] = postData;
  updates['/testing/' + uid + '/' + newPostKey] = postData;
  return database.ref().update(updates);
}


function readData(){
  var userId = firebase.auth().currentUser.uid;
return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
  var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
  // ...
});
}

function getFromStorage(storage, reference){
  console.log("Loading datasource from storage");
  // Create a storage reference from our storage service
  var storageRef = storage.ref();
  var gsReference = storage.refFromURL('gs://ecg-device.appspot.com/firestore/Pontus.jpg')
  // Create a reference from a Google Cloud Storage URI

  if(reference == "1"){
    gsReference = storage.refFromURL(currentStorage);

      gsReference.getDownloadURL().then(function(url) {
      // `url` is the download URL for 'images/stars.jpg'
      //Fixing the CORS problem
      url2 = "https://cors-anywhere.herokuapp.com/" + url;
      console.log(url2);
        makeplot(url2);
    }).catch(function(error) {
      // Handle any errors
    });

  }
  else if (reference != ""){
    gsReference = storage.refFromURL(reference)
    gsReference.getDownloadURL().then(function(url) {
    console.log(url);
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = function(event) {
      var blob = xhr.response;
      //console.log(blob);
      getData (blob);
    };
    xhr.open('GET', url);
    }).catch(function(error) {
      // Handle any errors
    });
  }
  else{
    gsReference.getDownloadURL().then(function(url) {
    // `url` is the download URL for 'images/stars.jpg'
    // This can be downloaded directly:
    // Or inserted into an <img> element:
    var img = document.getElementById('test');
    img.src = url;
  }).catch(function(error) {
    // Handle any errors
  });
  }
console.log("Datasource Loaded");
}


function makeplot(url) {
  //Plotly.d3.csv("https://raw.githubusercontent.com/plotly/datasets/master/2014_apple_stock.csv", function(data){ processData(data) } );
  Plotly.d3.dsv(';')(url, function(data){ processData(data) } );
};


function processData(allRows) {
  //console.log(allRows);
  var x = [], y = [], standard_deviation = [];
  var columns = ['ECG', 'PPGRED', 'PPGIR', 'Label'
  ];

  for( j = 0; j<columns.length; j++){
    x = [], y = [], standard_deviation = [];
    document.getElementById('length').value = allRows.length;
    end = allRows.length;


    for (var i=start; i<end; i++) {
      row = allRows[i];
      x.push( i );
      if(columns[j] == 'Label'){
        if( row[columns[j]] == "stall"){
          y.push( 0 );
        }
        else if(row[columns[j]] == "sitt"){
          y.push( 1 );
        }
        else{
            y.push(row[columns[j]]);
        }
      }
      else{
        y.push( row[columns[j]] );
      }
      //if(i % end == 0){
      //  console.log(i);
      //}
    }
    makePlotly( x, y, standard_deviation, j);
  }



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
else{
  Plotly.newPlot('labels_div', traces,
    {title: 'Labels'});
}

};

function createListItem(arrayOfItems){
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
      makeplot(url2);
    }
  }
console.log("Done creating List items");
}
