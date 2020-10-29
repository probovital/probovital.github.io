async function run(){


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
    document.getElementById('labels').onclick = async function(){
      f = open("labels.txt", "r");
    }
}
document.addEventListener('DOMContentLoaded', run);
