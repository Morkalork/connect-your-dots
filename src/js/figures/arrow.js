var extend = require('../utilities/extend.js');

var defaultOptions = {
  //This is where the arrow starts
  startX: 0,
  startY: 0,
  
  //This is where the arrow ends and additional lines are drawn from
  endX: 0,
  endY: 0,
  
  //This is the svg-paper onto which we draw
  paper: null,

  color: "#000",

  thickness: 1
}

function getArrowLength(startX, startY, endX, endY){
  var length1 = (endY - startY);
  var length2 = (endX - startX);
  var arrowLength = length1 > length2
    ? length2
    : length1;

  if (arrowLength < 0) {
    arrowLength *= -1;
  }

  arrowLength = Math.floor(arrowLength * 0.25);
  return arrowLength;
}

function getAngleInDegrees(startX, startY, endX, endY){
  var deltaX = endX - startX;
  var deltaY = endY - startY;
  
  var angleInRadians = Math.atan2(deltaY, deltaX);
  var angleInDegrees = angleInRadians * (180 / Math.PI);
  
  return angleInDegrees;
}

function degreesToRadians(angleDegrees) {
   return angleDegrees / 180 * Math.PI;
}

function draw(userOptions) {
  var options = extend(defaultOptions, userOptions);

  if (!options.paper) {
    throw new Error("Cannot draw an arrow without a paper");
  }

  var paper = options.paper;
  var lines = [];

  var attributes = {
    stroke: options.color,
    strokeWidth: options.thickness
  };
  
  //The arrow shaft
  var shaft = paper.line(
    options.startX,
    options.startY,
    options.endX,
    options.endY
    )
    .attr(attributes);

  lines.push(shaft);

  var leansUp = options.startY > options.endY;
  var leansLeft = options.startX > options.endX;

  var arrowLength = getArrowLength(
    options.startX,
    options.startY,
    options.endX,
    options.endY
  );
  
  var angle = getAngleInDegrees(
    options.startX,
    options.startY,
    options.endX,
    options.endY
  );

  var degreeDiff = 20;
  
  var p1X = options.endX;
  var p1Y = options.endY;
  
  var plus = degreesToRadians(angle - degreeDiff);
  var p2X = (options.endX - (arrowLength * Math.cos(plus)));
  var p2Y = (options.endY - (arrowLength * Math.sin(plus)));
  
  var minus = degreesToRadians(angle + degreeDiff);
  var p3X = (options.endX - (arrowLength * Math.cos(minus)));
  var p3Y = (options.endY - (arrowLength * Math.sin(minus)));
  
  console.log(p1X, p1Y, p2X, p2Y, p3X, p3Y);
  var polygon = paper
    .polygon(p1X, p1Y, p2X, p2Y, p3X, p3Y)
    .attr(attributes);

  return lines;
}

module.exports = {
  draw: draw
};