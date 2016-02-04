var _ = require('lodash');

function dropCircle(circle, circles){
    _.remove(circles, c => {
      return c.x == circle.x
        && c.y == circle.y;
    });
}

module.exports = dropCircle;