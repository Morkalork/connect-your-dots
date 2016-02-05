var _ = require('lodash');

function getDraggedLine(lineInstance, lines) {
  var startX = lineInstance.data('startX');
  var startY = lineInstance.data('startY');
  var endX = lineInstance.data('endX');
  var endY = lineInstance.data('endY');

  return _.find(lines, l => {
    return l.startX == startX
      && l.startY == startY
      && l.endX == endX
      && l.endY == endY;
  });
};

module.exports = {
  getDraggedLine: getDraggedLine
};