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
 */
function isCirclePartOfPolygon(circle, circles, lines, foundCircles) {

  if (!foundCircles) {
    foundCircles = [circle];
  }

  var circleLines = _.filter(lines, line => {
    return (line.startX === circle.x && line.startY === circle.y)
      ||
      (line.endX === circle.x && line.endY === circle.y);
  });

  if (circleLines && circleLines.length > 0) {

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

function getCirclesConnectedToCircle(circle, circles, lines) {
  if (!circles || circles.length <= 0) {
    return [];
  }

  if (!lines || lines.length <= 0) {
    return [];
  }

  var connectedCircles = [circle];

  _.forEach(lines, line => {
    if (line.startX === circle.x && line.startY === circle.y) {
      connectedCircles.push(line.endCircle);
    } else if (line.endX === circle.x && line.endY === circle.y) {
      connectedCircles.push(line.startCircle);
    }

  });

  circles = _.difference(circles, connectedCircles);

  _.forEach(connectedCircles, connectedCircle => {
    if (connectedCircle.x !== circle.x && connectedCircle.y !== circle.y) {
      var moreConnectedCircles = getCirclesConnectedToCircle(connectedCircle, circles, lines);

      _.forEach(moreConnectedCircles, more => {
        addIfNotExists(connectedCircles, more);
      });
    }
  });

  return connectedCircles;
};

function isPolygon(circles, lines) {

  if (!circles || circles.length <= 0) {
    return;
  }

  if (!lines || lines.length <= 0) {
    return;
  }

  var foundCircles = isCirclePartOfPolygon(circles[0], circles, lines);

  return [foundCircles];
};

module.exports = isPolygon;