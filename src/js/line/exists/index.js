var _ = require('lodash');

function lineStartsAt(line, circle) {
  return line.startX === circle.x
    && line.startY === circle.y;
}

function lineEndsAt(line, circle) {
  return line.endX === circle.x
    && line.endY === circle.y;
}

function doesLineExist(lines, firstCircle, secondCircle) {
  var linesBetweenCircles = _.filter(lines, line => {
    return lineStartsAt(line, firstCircle) && lineEndsAt(line, secondCircle)
      ||
      lineStartsAt(line, secondCircle) && lineEndsAt(line, firstCircle)
  });

  return linesBetweenCircles && linesBetweenCircles.length > 0;
}

module.exports = doesLineExist; 