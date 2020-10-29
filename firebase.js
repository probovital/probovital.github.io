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
      var cors1 = "https://gobetween.oklabs.org/";
      var cors2 = "https://cors-anywhere.herokuapp.com/";
      url2 = cors2 + url;
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


function createCSV(){
  const rows = [
    ["name1", "city1", "some other info"],
    ["name2", "city2", "more info"]
  ];

  let csvContent = "data:text/csv;charset=utf-8,";

  rows.forEach(function(rowArray) {
      let row = rowArray.join(",");
      csvContent += row + "\r\n";
  });
  return csvContent;
}

function upload(storage, filename, array){
    // Uint8Array
    var reference = 'evaluated/' + filename;
    var storageRef = storage.ref(reference);
    var bytes = Uint8Array.from(array);
    console.log(bytes);
  var bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21]);
  storageRef.put(Uint8Array.from(array)).then(function(snapshot) {
    console.log('Uploaded an array!');
  });
  console.log("Data uploaded");
}

function uploadBlob(storage, filename, arrayOfArrays){
    // Uint8Array
    //var string = "data:text/csv;charset=utf-8,"
    var string = "ECG;Label;Missing;Incorrect\n";
    var reference = 'evaluated/' + filename;
    var storageRef = storage.ref(reference);
    for(i=0;i<arrayOfArrays[0].length;i++){
      for (j=0; j<arrayOfArrays.length;j++){
        string += arrayOfArrays[j][i]
        if(j < arrayOfArrays.length-1){
          string += ";"
        }
      }
      string += "\n"
    }
  storageRef.putString(string).then(function(snapshot) {
  });
  console.log("Data uploaded");
}
