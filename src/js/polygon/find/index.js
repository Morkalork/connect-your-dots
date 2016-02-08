var _ = require('lodash');

function addIfNotExists(circles, circle) {
  var exists = _.find(circles, c => {
    return c.x === circle.x && c.y === circle.y;
  });

  if (!exists) {
    circles.push(circle);
  }
}

function getLineCircle(line, knownCircle, circles) {
  var otherCircle = _.find(circles, circle => {
    if (circle.x !== knownCircle.x && circle.y !== knownCircle.y) {
      if ((line.startX === circle.x && line.startY === circle.y)
        ||
        (line.endX === circle.x && line.endY === circle.y)) {
        return true;
      }
    }

    return false;
  });

  return otherCircle;
}

function isCircleAlreadyFound(circle, foundCircles) {
  return _.some(foundCircles, c => {
    return c.x === circle.x && c.y === circle.y;
  });
}

/**
 * This is a polygon
 *      (*)
 *     /   \
 *    /     \
 *   /       \
 * (*)       (*)
 *   \       /
 *    \     /
 *     \   /
 *      (*)
 * 
 * 
 * This is not
 * (*)-------------------(*)
 *                       /
 *                      /
 *                     /
 *                    /
 *                  (*)
 * 
 * But this one is tricky
 * (*)--------(*)---------(*)
 *              \         /
 *               \       /
 *                \     /
 *                 \   /
 *                  (*)
 */
function isCirclePartOfPolygon(circle, circles, lines, foundCircles) {

  if (!foundCircles) {
    foundCircles = [circle];
  }

  // These are the lines connected to this circle
  var circleLines = _.filter(lines, line => {
    return (line.startX === circle.x && line.startY === circle.y)
      ||
      (line.endX === circle.x && line.endY === circle.y);
  });

  // Now, we're only interested in a circle if it has more than one connection
  if (circleLines && circleLines.length > 1) {

    _.forEach(circleLines, circleLine => {
      var otherCircleOnLine = getLineCircle(circleLine, circle, circles);
      if (otherCircleOnLine) {
        var alreadyFound = isCircleAlreadyFound(otherCircleOnLine, foundCircles);

        if (!alreadyFound) {
          foundCircles.push(otherCircleOnLine);
          isCirclePartOfPolygon(otherCircleOnLine, circles, lines, foundCircles);
          return false;
        }
      }
    });
  }

  return foundCircles;
}

function isPolygon(circles, lines) {

  if (!circles || circles.length <= 0) {
    return;
  }

  if (!lines || lines.length <= 0) {
    return;
  }

  var count = 0;
  var circlesLeftToCheck = circles;
  do {
    console.log(circlesLeftToCheck);
    count++;
    var foundCircles = isCirclePartOfPolygon(circlesLeftToCheck[0], circlesLeftToCheck, lines);
    console.log("Found circles: ", foundCircles);
    circlesLeftToCheck = _.difference(circlesLeftToCheck, foundCircles);
  }
  while (count < 10 && circlesLeftToCheck.length > 0);

  return [foundCircles];
};

module.exports = isPolygon;