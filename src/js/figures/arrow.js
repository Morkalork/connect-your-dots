var extend = require('../utilities/extend.js');

var defaultOptions = {
  //This is where the arrow starts
  startX: 0,
  startY: 0,
  
  //This is where the arrow ends (and points to)
  endX: 0,
  endY: 0,
  
  //This is the svg-paper onto which we draw
  paper: null,

  color: "#000",

  thickness: 1,
  
  //The angle the arrow head goes out from the head
  arrowHeadAngle: 20
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

  arrowLength = Math.floor(arrowLength * 0.5);
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

  var degreeDiff = options.arrowHeadAngle;
  
  var plus = degreesToRadians(angle - degreeDiff);
  var p1X = (options.endX - (arrowLength * Math.cos(plus)));
  var p1Y = (options.endY - (arrowLength * Math.sin(plus)));
  
  var minus = degreesToRadians(angle + degreeDiff);
  var p2X = (options.endX - (arrowLength * Math.cos(minus)));
  var p2Y = (options.endY - (arrowLength * Math.sin(minus)));
  
  /*
  //Could be useful if you want to create a polygon arrow instead
  var polygon = paper
    .polygon(p1X, p1Y, p2X, p2Y, p3X, p3Y)
    .attr(attributes);
    */
    
  var leftLine = paper.line(options.endX, options.endY, p1X, p1Y).attr(attributes);
  lines.push(leftLine);
  
  var rightLine = paper.line(options.endX, options.endY, p2X, p2Y).attr(attributes);
  lines.push(rightLine);
  
  return lines;
}

module.exports = {
  draw: draw
};