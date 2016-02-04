var _ = require('lodash');

/**
 * @param line  The line to drop
 * @param lines The collection of lines available
 */
function dropLine(line, lines){
  _.remove(lines, l => {
      return l.startX == line.startX
        && l.startY == line.startY
        && l.endX == line.endX
        && l.endY == line.endY;
    });
}

module.exports = dropLine;