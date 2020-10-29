


// Methods for creating a moving line chart
function loadPlotlyTimeSeries(){
  Plotly.purge('chartly');

  Plotly.plot('chartly', [{
    y:initializeData(0, windowLength),
    type:'line'
  }], plotlyLayout);
  var cnt = windowLength;
  if(ecgLoaded==false){
    //Plotly.extendTraces('chartly', {y:[initializeData()]}, [0] )
    setInterval(function(){
      cnt +=10;
      Plotly.extendTraces('chartly', {y:[getEcgData(cnt)]}, [0] )
      if(cnt > windowLength){
        Plotly.relayout('chartly', {
          xaxis: {
            range: [cnt-windowLength, cnt]
          }
        })
      }
    },10);
  }
  ecgLoaded = true;
  var myPlot = document.getElementById('chartly');
  myPlot.on('plotly_click', function(data){
    var pts = '';
    for(var i=0; i < data.points.length; i++){
        pts = 'x = '+data.points[i].x +'\ny = '+
            data.points[i].y.toPrecision(4) + '\n\n';
    }
    alert('Closest point clicked:\n\n'+pts);
  });
}
