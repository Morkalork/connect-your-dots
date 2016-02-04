var _ = require('lodash');

/**
 * Locates the parent circles of a circle
 * 
 * 
 * 
 *                selectedCircle
 *                       | 
 *                       |        
 * (*)------------------(*)-------------------(*)
 *  |                      \                    |
 *  |                      |                    |
 *  |                      |                    |
 *  parent                 |                  parent
 *                         |
 *                    parent
 * 
 */
function findCircleParents(lines, circles, selectedCircle) {
  
  var connectedLines = _.filter(lines, line => {
    return (line.endX === selectedCircle.x && line.endY === selectedCircle.y)
      ||
      (line.startX === selectedCircle.x && line.startY === selectedCircle.y);
  });

  var parentCircles = [];

  if (connectedLines && connectedLines.length > 0) {
    _.forEach(connectedLines, line => {
      var connectedCircle = _.filter(circles, circle => {
        
        if(circle.x === selectedCircle.x && circle.y === selectedCircle.y){
          return false; //We don't want the one we're removing
        }
        
        return (circle.x === line.startX && circle.y === line.startY)
          ||
          (circle.x === line.endX && circle.y === line.endY);
      });

      if (connectedCircle) {
        parentCircles = parentCircles.concat(connectedCircle);
      }
    });
  }

  return {
    connectedLines: connectedLines,
    parentCircles: parentCircles
  };
}

module.exports = {
  findCircleParents: findCircleParents
};