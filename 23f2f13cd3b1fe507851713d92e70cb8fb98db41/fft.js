var testArray = [ 0.4967, -0.1383,  0.6477,  1.523 , -0.2342, -0.2341,  1.5792,
       0.7674, -0.4695,  0.5426, -0.4634, -0.4657,  0.242 , -1.9133,
      -1.7249, -0.5623, -1.0128,  0.3142, -0.908 , -1.4123,  1.4656,
      -0.2258,  0.0675, -1.4247, -0.5444,  0.1109, -1.151 ,  0.3757,
      -0.6006, -0.2917, -0.6017,  1.8523]


function fftTime(signal){
  var n = timeTaken();

  var frequencies = myfft(signal)

  //console.log("Time taken: ")

  var n2 = timeTaken();
  var deltaTime = n2-n;
  //console.log(deltaTime)
  return frequencies
}
function timeTaken(){
  var d = new Date();
  var n = d.getTime();
  return n;
}

function zeroPadding(signal){
  var paddedSignal = []
  for(var i = 0; i < signal.length;i++){
    paddedSignal.push(signal[i])
  }

  var closestI = 0
  //console.log("Signal is "+ signal.length +" long: ")
  for(var i = 2; i < signal.length +1; i = i*2 ){
    closestI = i
  }
  //console.log("Closest multiple of two: "+closestI)
  if(closestI == signal.length){
    //console.log("Padded signal length: "+paddedSignal.length)
    return paddedSignal
  }
  else{
    for(var i = signal.length; i < closestI *2; i++){
      paddedSignal.push(0)
    }
    //console.log("Padded signal length: "+paddedSignal.length)
    return paddedSignal
  }
}

function myfft(signal) {

  var X = signal
  var N = X.length;
  if (N <= 1) {
    //console.log("Recursion stops here")
    //console.log("Value: "+X)
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
  //console.log("This is the returned signal")
  //console.log(X)

  return X;
}

function mySignalReverser(signal){
  var N = signal.length;
  var reversedSignal = []
  for(var i = 0; i < N; i++){
    reversedSignal.push(0)
  }
  for (var i=0; i < signal.length; i++){
    reversedSignal[N-1-i] = Math.sqrt(Math.pow(signal[i].re,2)+Math.pow(signal[i].im,2));

    //reversedSignal[N-1-i] = signal[i].re
  }

  return reversedSignal
}
function myInverseFFTer(signal){
  var correctedSignal = []
  for(var i = 0; i<signal.length;i++){
    correctedSignal.push(signal[i])
    correctedSignal[i].re = correctedSignal[i].re/signal.length
    correctedSignal[i].im = correctedSignal[i].im/signal.length
  }
  return correctedSignal
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
    X[n+M] = even[n] = math.add(even[n], t) / N;
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
  //console.log(matriser)
  var C = matriser[0]
  var S = matriser[1]
  //console.log(C)

  var Cdot = dotProduct(signal, C);
  var Sdot = dotProduct(signal, S, true);


  //console.log("Sdot"+Sdot)
  //console.log(Sdot[1])

  frequencies = []
  for(var i = 0; i<Sdot.length;i++){
    frequencies.push(math.complex(Cdot[i], -Sdot[i].im))
  }
  //console.log("Frequencies"+ frequencies)
  return frequencies

}


//* REVERS DFT //
function egenReversDFT(signal, filter=0){

  var im1 = math.complex(0, 1).im
  var testValue = signal[1]
  //console.log("Signal:"+signal[1])
  //console.log(testValue.re)
  //console.log(testValue.im)
  var N = signal.length
  var matriser = egenDFTcykel(signal)
  //console.log(matriser)
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

  //console.log("Cdot")
  //console.log(Cdot)
  //console.log("Sdot")
  //console.log(Sdot)

  var newCdot = []
  var newSdot = []
  frequencies = []
  for(var i = 0; i<Sdot.length;i++){
    newCdot.push(Cdot[i]/N)
    newSdot.push(-Sdot[i].im/N*im1)
    //frequencies.push(math.complex((Cdot[i]/N), (Sdot[i].im/N)))
    frequencies.push((Cdot[i]/N) - (Sdot[i].im/N*im1))
  }
  //console.log("New Cdot")
  //console.log(newCdot)
  //console.log("New Sdot")
  //console.log(newSdot)
  //console.log("Återskapad signal")
  //console.log(frequencies)
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

  //console.log(C)
  //console.log(S)
  //console.log("One cycle" + one_cycle)

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
  //console.log("Cdot"+Cdot)
  //console.log("Sdot1"+Sdot[1])
  if(reverse == false){
    frequencies = []
    for(var i = 0; i<Sdot.length;i++){
      frequencies.push(math.complex(Cdot[i], -Sdot[i].im))
    }
    //console.log("Frequencies"+ frequencies)
    return frequencies
  }
  else{
    returnSignal = []
    for(var i = 0; i<Sdot.length;i++){
      returnSignal.push(math.complex(Cdot[i]/N, Sdot[i].im/N))
    }
    //console.log("Signal"+ returnSignal)
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

function philipFilter(signal){
  var fs = 400;
  //var wclow = 2* math.pi * (2/fs)
  //var wchigh = 2* math.pi * (10/fs)
  var lowPass = 20 //Low pass, ju högre desto mer höga signaler som kommer igenom.
  var highPass = 30 //High pass, ju lägre desto mer vågig blir signalen.
  var wclow = 2* math.pi * (lowPass/fs)
  var wchigh = 2* math.pi * (highPass/fs)
  var lowPass = 0
  var highPass = 0
  var tempFilter = []
  for(var i = 0; i < 8; i++){
    tempFilter.push(0)
  }
  var filteredArray = []
  filteredArray.push(0)
  filteredArray.push(0)


  for( var i = 0; i < signal.length; i++){
    var filteredPoint = signal[i]

    // cos(2pi * fc)-1 + sqrt( cos(2pi * fc)^2 ) - 4cos(2pi * fc) + 3
    var lowA = Math.cos(wclow)-1 + Math.sqrt( Math.pow(Math.cos(wclow), 2) - 4* Math.cos(wclow)+3)
    var highA = Math.cos(wchigh)-1 + Math.sqrt( Math.pow(Math.cos(wchigh), 2) - 4* Math.cos(wchigh)+3)

    if(i == 0){
      lowPass = lowA * filteredPoint + (1-lowA)
      highPass = highA * filteredPoint + (1-lowA)
    }
    else{
      lowPass = lowA * filteredPoint + (1-lowA)* lowPass
      highPass = highA * filteredPoint + (1-lowA)* highPass
    }
    filteredPoint = highPass - lowPass

    tempFilter.push(filteredPoint)
    tempFilter.shift()

    //Rekursion , Detta är moving average
    // om y[50] = x[47] + x[48] + x[49] + x[50] + x[51] + x[52] + x[53]
    // kan y [51] räknas som = y[50] + x[54] - x[47]- Det är alltså förra punkten du räknat ut
    // plus den punkt som kommer in i fönstret, minus den punkt som försvinner från fönstret
    filteredPoint = filteredArray[filteredArray.length-1] - ((1/8)* tempFilter[0]) + ((1/8) * tempFilter[tempFilter.length-1])

    filteredArray.push(filteredPoint)

  }
return filteredArray
}

function meanFilter(signal, k=8){
  //Funktionen yt = (2k+1) ^-1 * sum(x[i]) for i = [t-k ... t+k]
  srate = 400 //Hz signalen fångades i
  windowSize = 1000*(k*2+1) / srate

  var filteredSignal = []
  for(var i =0; i < signal.length; i++){
    filteredSignal.push(0)
  }
  for(var i =k+1; i < (signal.length- k - 1); i++){
    filteredSignal[i] = math.mean(signal.slice(i-k, i+k))
  }
  return filteredSignal
}

function medianFilter(signal, k=5){
  //Funktionen yt = (2k+1) ^-1 * sum(x[i]) for i = [t-k ... t+k]
  srate = 400 //Hz signalen fångades i
  windowSize = 1000*(k*2+1) / srate

  var filteredSignal = []
  for(var i =0; i < signal.length; i++){
    filteredSignal.push(0)
  }
  for(var i =k+1; i < (signal.length- k - 1); i++){
    filteredSignal[i] = math.median(signal.slice(i-k, i+k))
  }
  return filteredSignal
}

function teagerKaiserEnergyOperator(signal){
  //Konverterar signalen till energi, bra för pulsdetektion
  srate = 400 //Hz signalen fångades i
  var filteredSignal = []
  for(var i =0; i < signal.length; i++){
    filteredSignal.push(0)
  }
  for(var i =2; i < (signal.length - 1); i++){
    filteredSignal[i] = Math.pow((signal[i]), 2) - ((signal[i-1])*(signal[i+1]))
  }
  return filteredSignal

}

function calculateMagnitude(frequencies){
  var magnitudeArray = Array(frequencies.length).fill(0)

  for(var i =0; i < frequencies.length;i++){
    magnitudeArray[i] = Math.pow(Math.pow(frequencies[i].re,2)+Math.pow(frequencies[i].im,2),0.5)
  }
  return magnitudeArray
}

function inverseCalculateMagnitude(magnitudes, phases){
  var frequencyArray = []
  for(var i =0; i < magnitudes.length;i++){
    var realValue = magnitudes[i]*Math.cos(phases[i])
    var imaginaryValue =  magnitudes[i]*Math.sin(phases[i])
    frequencyArray.push(math.complex(realValue,imaginaryValue))
  }

  return frequencyArray
}
function calculatePhase(frequencies){
  var phaseArray = Array(frequencies.length).fill(0)
  for(var i =0; i < frequencies.length;i++){
    phaseArray[i] = Math.atan(frequencies[i].im/frequencies[i].re)
  }
  return phaseArray
}


function FIRfilter(high = 20, low = 100, length){
  var filter = Array(length).fill(0)
  sr = 400
  var nyquist = 400/2
  var filterBounds = [high, low]
  var cornerWidth = 20
  var currentValue = 0
  var corner = []
  var currentCornerValue = 0.05
  var cornerIndex = 1
  for(var i = 0; i < cornerWidth; i++){
    corner.push(currentCornerValue)
    currentCornerValue = currentCornerValue/2
  }

  for(var i=filterBounds[0] - 40; i < filterBounds[0]-20; i++){
    currentValue = currentValue + corner[corner.length-cornerIndex]
    cornerIndex++
    filter[i]=currentValue
  }
  cornerIndex = 1
  for(var i=filterBounds[0] - 20; i < filterBounds[0]; i++){
    currentValue = currentValue + (0.05-corner[corner.length-cornerIndex])
    cornerIndex++
    filter[i]=currentValue
  }
  for(var i=filterBounds[0]; i < filterBounds[1]; i++){
    currentValue = 1
    filter[i]=currentValue
  }
  cornerIndex = 1
  for(var i=filterBounds[1]; i < filterBounds[1]+20; i++){
    currentValue = currentValue - corner[corner.length-cornerIndex]

    cornerIndex++
    filter[i]=currentValue
  }
  cornerIndex = 1
  for(var i=filterBounds[1] + 20; i < filterBounds[1]+40; i++){
    currentValue = currentValue - (0.05-corner[corner.length-cornerIndex])
    cornerIndex++
    filter[i]=currentValue
  }
  return filter
}


//Skapar en sinc funktion som multipliceras med ett fönster, helst blackman
// Det valda M påverkar bredden på transition band (BW) enligt formeln:


function windowedSinc(M, fs=400, targetFrequency=1, transitionBandwidth = 4){

  //fc motsvarar cutoff frequency, och anges som mellan 0 - 0.5. Här räknas den ut från sampling frequency.
  //Om vi samplar med fs = 400, och vill fokusera på frekvenser runt 1Hz, blir fc = 1/400 = 0.0025
  var fc = targetFrequency / fs


  //Precis som ovan korrigerar vi vår transition bandwidth med sampling rate. Med valen ovan blir wb = 4 / 400 = 0.01
  var wb = transitionBandwith / fs

  //Nu har vi då att ta reda på filtrets längd. Vi vill välja hur specifikt filtret ska filtrera.
  //Ett filter som ska filtrera på precis en specifik punkt blir väldigt långt och långsamt,
  // är det okej med bredare felmarginal så går allt snabbare.
  //Här har vi valt transitionBandwith = 4. Det ger M = 4/wb  = 4 / 0.01 = 400, ett rätt långt fönster!
  var M = Math.floor(4/wb)

  //M måste var jämnt, är det inte det så lägger vi till en på längden.
  if(M%2 != 0){
    M=M+1
  }
  var windowedSinc = Array(M*2).fill(0)
  var filter = windowFunction("blackman", M)

  //Needs to be normalized
  for(var i = 0; i < M; i++){
    if(i == M/2){
      //This handles divide by zero at this point
      windowedSinc[i] = 2*math.pi*fc
    }
    else{
      //Here we create the truncated sinc function
      windowedSinc[i] = Math.sin(2*math.pi*fc*(i-(M/2)))/(i-(M/2))
    }
    //Here we multiply the truncated sinc by the filter, to smoothe it
    windowedSinc[i] *= filter[i]
  }


}

function windowFunction(name = "blackman", M){
  var filter = Array(M*2).fill(0)

  for(var i = 0; i < M; i++){
    var currentValue = 0
    if(name == "blackman"){
      currentValue = 0.42-0.25*cos((2*math.pi*i)/M) + 0.08 * cos((4*math.pi*i)/M)
    }
    if(name == "hamming"){
      currentValue = 0.54-0.46 * Math.cos((2*math.pi*i)/M)
    }
    if(name == "hanning"){
      currentValue = 0.5-0.5*cos((2*math.pi*i)/M)
    }
    filter[i].push(currentValue)

    return filter
  }



}

function pontusBandPass(signal, targetFrequency = 25, targetBandWidth = 20, fs = 400){

    //Defining coefficients
    var fc = targetFrequency/fs
    var BW = targetBandWidth/fs
    var R = 1-(3*BW)
    var K = (1-(2*R*Math.cos(2*math.pi*fc))+math.pow(R,2))/(2-(2*Math.cos(2*math.pi*fc)))

    var a0 = 1-K
    var a1 = 2*(K-R)*Math.cos(2*math.pi*fc)
    var a2 = Math.pow(R, 2)-K
    var b1 = 2*R*Math.cos(2*math.pi*fc)
    var b2 = -Math.pow(R,2)

    //Creating the array of filtered values.
    //As the first filtered value will look two points back in time we need to populate these with 0
    var Ys = Array(2).fill(0)

    for( var i = 2; i < signal.length; i++){

      //Recursively add a filtered timepoint based on 2 points back in time for unfiltered and filtered signals.
      var y = a0*signal[i] + a1*signal[i-1] + a2*signal[i-2] + b1*Ys[i-1] + b2*Ys[i-2]

      Ys.push(y)

    }
  //console.log("Ys: ")
  //console.log(Ys)
  return Ys

}
