
function start(){
  this.data('originalTransform', this.transform().local);
};

function stop(){
  var transformString = this.attr('transform').string.substring(1); //Remove the first character
  var transformSplit = transformString.split(',');
  var coords = {
    x: parseInt(transformSplit[0]),
    y: parseInt(transformSplit[1])
  };
  
  console.log(coords);
};

function move(dx, dy){
  var originalTransform = this.data('originalTransform');
  var extraTransform = (originalTransform ? "T" : "t") + [dx, dy];
  this.attr({
    transform: originalTransform + extraTransform
  });
};

module.exports = {
  start: start,
  stop: stop,
  move: move
};