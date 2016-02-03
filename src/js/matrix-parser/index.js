var _ = require('lodash');

/**
 * Locates the parent circles of a circle
 * 
 * 
 * 
 *                selectedCircle
 *                       | 
 *      left line        |        right line
 * (*)------------------(*)-------------------(*)
 *  |                                          |
 *  |                                          |
 *  Left parent                       Right parent
 * 
 * 
 */
function findCircleParents(lines, circles, selectedCircle) {
  var parentLines = [];
  
  var leftLine = _.find(lines, line => {
    return (line.endX === selectedCircle.x
      && line.endY === selectedCircle.y)
  });

  var rightLine = _.find(lines, line => {
    return (line.startX === selectedCircle.x
      && line.startY === selectedCircle.y)
  });

  var parentCircles = [];

  if (leftLine) {
    parentLines.push(leftLine);
    
    var leftParentCircle = _.find(circles, circle => {
      return circle.x === leftLine.startX && circle.y === leftLine.startY;
    });
    
    if(leftParentCircle){
      parentCircles.push(leftParentCircle);
    }
  }
  
  if(rightLine){
    parentLines.push(rightLine);
    
    var rightParentCircle = _.find(circles, circle => {
      return circle.x === rightLine.endX && circle.y === rightLine.endY;
    });
    
    if(rightParentCircle){
      parentCircles.push(rightParentCircle);
    }
  }

  return {
    connectedLines: parentLines,
    parentCircles: parentCircles
  };
}

module.exports = {
  findCircleParents: findCircleParents
};