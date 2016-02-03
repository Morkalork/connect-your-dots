var doesLineExist = require('../does-line-exist');

function addLineBetweenCircles(lines, oldCircle, newCircle) {
  
  if(doesLineExist(lines, newCircle, oldCircle)){
    console.log("not adding line!");
    return;
  }

  var startX = oldCircle.x;
  var startY = oldCircle.y;

  var endX = newCircle.x;
  var endY = newCircle.y;

  var newLine =
    {
      startX: startX,
      startY: startY,
      endX: endX,
      endY: endY,
      startCircle: oldCircle,
      endCircle: newCircle
    };

  lines.push(newLine);
};

module.exports = addLineBetweenCircles;