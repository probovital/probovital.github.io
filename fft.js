var testArray = [ 0.4967, -0.1383,  0.6477,  1.523 , -0.2342, -0.2341,  1.5792,
       0.7674, -0.4695,  0.5426, -0.4634, -0.4657,  0.242 , -1.9133,
      -1.7249, -0.5623, -1.0128,  0.3142, -0.908 , -1.4123,  1.4656,
      -0.2258,  0.0675, -1.4247, -0.5444,  0.1109, -1.151 ,  0.3757,
      -0.6006, -0.2917, -0.6017,  1.8523]


function myfft(signal) {
  var X = signal
  var N = X.length;
  if (N <= 1) {
    return X;
  }
  var M = N/2;
  var even = [];
  var odd = [];
  even.length = M;
  odd.length = M;
  for (var i = 0; i < M; ++i) {
    even[i] = X[i*2];
    odd[i] = X[i*2+1];
  }
  even = myfft(even);
  odd = myfft(odd);
  var a = -2*math.pi;
  for (var k = 0; k < M; ++k) {
    // t = exp(-2PI*i*k/N) * X_{k+N/2} (in two steps)
    var t = math.exp(math.complex(0, a*k/N));
    t = math.multiply(t, odd[k]);
    X[k] = odd[k] = math.add(even[k], t);
    X[k+M] = even[k] = math.subtract(even[k], t);
  }
  return X;
}

function minFFT(X, even = true){
  var N = X.length()
  if(N <= 1){
    return X
  }
  var M = N/2
  var even = []

  even.length = M
  if(even){
    for (var i = 0; i < M; i++){
      even[i] = X[i*2]
    }
  }
  even = inFFT(even)

  var odd = []
  odd.length = M
  if(even == false){
    for (var i = 0; i < M; i++){
      odd[i] = X[i*2+1]
    }
  }
  odd = minFFT(odd, false)

  var a = (-2*math.pi)/N
  for(var k = 0; k < M; k++){
    var t = math.exp(math.complex(0, a*k))
    t = math.multiply(t, odd[k])
    X[k] = odd[k] = math.add(even[k], t)
    X[k+M] = even[k] = math.subtract(even[k], t)
  }
  return X
}

function myInversefft(X){
  var N = X.length;
  if (N <= 1) {
    return X;
  }
  var M = N/2;
  var even = [];
  var odd = [];
  even.length = M;
  odd.length = M;
  for (var i = 0; i < M; ++i) {
    even[i] = X[i*2];
    odd[i] = X[i*2+1];
  }
  even = myInversefft(even);
  odd = myInversefft(odd);
  var a = 2*math.pi;
  for (var n = 0; n < M; ++n) {
    // t = exp(-2PI*i*k/N) * X_{k+N/2} (in two steps)
    var t = math.exp(math.complex(0, a*n/N));
    t = math.multiply(t, odd[n]);
    X[n] = odd[n] = math.add(even[n], t) / N;
    X[n+M] = even[n] = math.subtract(even[n], t) / N;
  }
  return X;
}

// generate linear space from A to B with S intervals
function linspace(A,B,S) {
  var Y = new Array(0);
  var D = (B-A)/(S-1);
  for (var i = A; i <= B; i+=D) {
    Y.push(i);
  }
  return Y;
}

// perhaps not necessary, but just preventing errors with mixing reals and
// complex numbers
function make_complex(X) {
  for (var i = 0; i < X.length; i++) {
    X[i] = math.complex(X[i],0);
  }
}

function calc_function(T) {
  var X = [];
  X.length = T.length;
  for (var t = 0; t < T.length; t++) {
    X[t] = math.sin(2*math.pi*T[t]);
  }
  return X;
}

var T=linspace(0,1,8);
var X=calc_function(T);
make_complex(X);

var Y=myfft(X);

// get only real part, should have a Dirac spike at sine freq
var Yr=[];
Yr.length = Y.length;
for (var i = 0; i < Y.length; i++) {
  Yr[i] = Y[i].re;
}

function egenDFTa(signal){
  X = signal
  var N = signal.length
  var pi = math.pi
  var frequencies = []

  for(k=0; k<N-1; k++){
    for(n=0; n<N-1;n++){
      var wave = math.exp(math.complex(0, -2*pi*n*k/N))
      //Xk+=(signal[n] * wave)
      X[k]=math.multiply(signal[n], wave)
      console.log(signal[n])
      console.log(wave)
      console.log(signal[n] * wave)
      console.log(math.multiply(signal[n], wave))
    }
  //  frequencies.push(Xk)
  }
  return X
}

function egenDFTmatrix(signal){
  var N = signal.length
  var C = [[]]
  var S = [[]]

  for(var i = 0; i < N; i++){
    rowI = []
    rowJ = []
    for(var j =0; j< N; j++){
      rowI.push(0);
      rowJ.push(0);
    }
    C.push(rowI)
    S.push(rowJ)
  }
  C.shift()
  S.shift()
  return [C, S]
}

function egenDFTcykel(signal){
  var N = signal.length
  var matriser = egenDFTmatrix(signal);
  var C = matriser[0]
  var S = matriser[1]
  var ns = range(signal.length)
  one_cycle = []
  for(var i = 0; i < N; i++){
    one_cycle.push(2 * math.pi * i / N)
  }

  for(var k = 0; k <N; k++){
    var t_k = []
    for(var i=0; i < one_cycle.length;i++){
      t_k.push(k * one_cycle[i])
      C[k][i] = Math.cos(t_k[i])
      S[k][i] = Math.sin(t_k[i])
    }


     //console.log("K: " +k)
     //console.log("One cycle: " +one_cycle)
     //console.log("t_k: " +t_k)
     //console.log("C"+C[k])
     //C[k, :] = Math.cos(t_k)
     //S[k, :] = Math.sin(t_k)

  }
  return [C, S]
}

function dot(firstArray, secondArray, thirdArray = 0){
  var complex = false

  var N = firstArray.length
  var dotProduct = 0
  if(thirdArray==0){
  for(var i=0; i<N; i++){
    dotProduct+= firstArray[i]*secondArray[i]
  }
  }
  else{
    for(var i=0; i<N; i++){
      dotProduct+= firstArray[i]*secondArray[i]*thirdArray[i]
    }
  }
  return dotProduct
}

//function dotComplex(firstArray, secondArray){
//  var reals =[]
//  var ims = []
//  for(var i = 0; i< secondArray.length; i++){
//    reals.push(secondArray[i].re)
//    ims.push(secondArray[i].im)
//  }
//  var dotProduct = []
//dotProduct.push(dot(firstArray, secondArray))
//}

function dotProduct(signal, matrix, imaginary=false, filter = 0){
  var N = matrix[0].length
  var dotProductMatrix = []

  if(filter==0){
  for(var k=0; k<N; k++){
    //var dotProduct = 0
//
    //for(var i=0; i<N; i++){
    //  dotProduct+= matrix[k][i]*signal[i]
  //  }
    var dotProduct = dot(matrix[k], signal)

  if(imaginary==true){
    dotProductMatrix.push(math.complex(0, dotProduct))
  }
  else{
    dotProductMatrix.push(dotProduct)
  }

  }
  }
  else{
    for(var k=0; k<N; k++){
      //var dotProduct = 0
  //
      //for(var i=0; i<N; i++){
      //  dotProduct+= matrix[k][i]*signal[i]
    //  }
      var dotProduct = dot(matrix[k], signal, filter)

    if(imaginary==true){
      dotProductMatrix.push(math.complex(0, dotProduct))
    }
    else{
      dotProductMatrix.push(dotProduct)
    }

    }
  }
  return dotProductMatrix
}


//* DFT //
function egenDFT(signal){
  var N = signal.length
  var matriser = egenDFTcykel(signal)
  console.log(matriser)
  var C = matriser[0]
  var S = matriser[1]
  //console.log(C)

  var Cdot = dotProduct(signal, C);
  var Sdot = dotProduct(signal, S, true);


  console.log("Sdot"+Sdot)
  console.log(Sdot[1])

  frequencies = []
  for(var i = 0; i<Sdot.length;i++){
    frequencies.push(math.complex(Cdot[i], -Sdot[i].im))
  }
  console.log("Frequencies"+ frequencies)
  return frequencies

}


//* REVERS DFT //
function egenReversDFT(signal, filter=0){

  var im1 = math.complex(0, 1).im
  var testValue = signal[1]
  console.log("Signal:"+signal[1])
  console.log(testValue.re)
  console.log(testValue.im)
  var N = signal.length
  var matriser = egenDFTcykel(signal)
  console.log(matriser)
  var C = matriser[0]
  var S = matriser[1]
  //console.log(C)
  var signalReal = []
  var signalIm = []

  for(var i = 0; i < signal.length; i++){
    signalReal.push(signal[i].re)
    signalIm.push(signal[i].im)
  }
  //console.log("Signal")
  //console.log(signal)
  //console.log("Signal Real")
  //console.log(signalReal)
  //console.log("Signal Imaginary")
  //console.log(signalIm)
  if(filter==0){
  var Cdot = dotProduct(signalReal, C);
  var Sdot = dotProduct(signalIm, S, true);
  }
  else{
    var Cdot = dotProduct(signalReal, C, filter);
    var Sdot = dotProduct(signalIm, S, true, filter);
  }

  console.log("Cdot")
  console.log(Cdot)
  console.log("Sdot")
  console.log(Sdot)

  var newCdot = []
  var newSdot = []
  frequencies = []
  for(var i = 0; i<Sdot.length;i++){
    newCdot.push(Cdot[i]/N)
    newSdot.push(-Sdot[i].im/N*im1)
    //frequencies.push(math.complex((Cdot[i]/N), (Sdot[i].im/N)))
    frequencies.push((Cdot[i]/N) - (Sdot[i].im/N*im1))
  }
  console.log("New Cdot")
  console.log(newCdot)
  console.log("New Sdot")
  console.log(newSdot)
  console.log("Återskapad signal")
  console.log(frequencies)
  return frequencies
}



function egenDFT2(signal, reverse=false){
  var N = signal.length
  var matriser = egenDFTmatrix(signal);
  var C = matriser[0]
  var S = matriser[1]
  var ns = range(signal.length)
  one_cycle = []
  for(var i = 0; i < N; i++){
    one_cycle.push(2 * math.pi * i / N)
  }

  console.log(C)
  console.log(S)
  console.log("One cycle" + one_cycle)

  for(var k = 0; k <N; k++){
    var t_k = []
    for(var i=0; i < one_cycle.length;i++){
      t_k.push(k * one_cycle[i])
      C[k][i] = Math.cos(t_k[i])
      S[k][i] = Math.sin(t_k[i])
    }


     //console.log("K: " +k)
     //console.log("One cycle: " +one_cycle)
     //console.log("t_k: " +t_k)
     //console.log("C"+C[k])
     //C[k, :] = Math.cos(t_k)
     //S[k, :] = Math.sin(t_k)
  }
  //console.log(C)

  var Cdot = []
  var Sdot = []
  for(var k=0; k<N; k++){
    var dotProductC = 0
    var dotProductS = 0
    for(var i=0; i<N; i++){
      dotProductC+= C[k][i]*signal[i]
      dotProductS+= S[k][i]*signal[i]
    }

    Cdot.push(dotProductC)
    Sdot.push(math.complex(0, dotProductS))


  }
  console.log("Cdot"+Cdot)
  console.log("Sdot1"+Sdot[1])
  if(reverse == false){
    frequencies = []
    for(var i = 0; i<Sdot.length;i++){
      frequencies.push(math.complex(Cdot[i], -Sdot[i].im))
    }
    console.log("Frequencies"+ frequencies)
    return frequencies
  }
  else{
    returnSignal = []
    for(var i = 0; i<Sdot.length;i++){
      returnSignal.push(math.complex(Cdot[i]/N, Sdot[i].im/N))
    }
    console.log("Signal"+ returnSignal)
    return returnSignal
  }

//  x_again = 1. / N * C.dot(X) + 1j / N * S.dot(X)
//  X_again = C.dot(x) - math.i * S.dot(x)
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
