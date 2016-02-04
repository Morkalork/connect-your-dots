var extend = require('../utilities/extend.js');

var defaultRenderingAttributes = {
  stroke: "#000",
  strokeWidth: 6,
  fill: "#FF0000",
  opacity: 1,
  strokeDasharray: ""
};

function renderPolygon(paper, polygon, customAttributes) {

  var attributes = extend(defaultRenderingAttributes, customAttributes);

  paper.polygon(polygon)
    .attr(attributes)
    .click(function (e) {

    });
}

var lineRenderingOptions = {
  paper: null,
  line: null,
  attributes: defaultRenderingAttributes,
  dragMove: null,
  dragStart: null,
  dragEnd: null
};

function renderLine(userOptions) {
  var options = extend(lineRenderingOptions, userOptions);

  var line = options.line;
  options.paper
    .line(
      line.startX,
      line.startY,
      line.endX,
      line.endY
      )
    .attr(options.attributes)
    .data({
      startX: line.startX,
      startY: line.startY,
      endX: line.endX,
      endY: line.endY
    })
    .drag(
      options.dragMove,
      options.dragStart,
      options.dragEnd
      );
}

var circleRenderingOptions = {
  paper: null,
  circle: null,
  radius: 8,
  attributes: defaultRenderingAttributes,
  onClick: null
}

function renderCircle(customOptions){
  
  var options = extend(circleRenderingOptions, customOptions);
  
  var circle = options.circle;
  
  options.paper.circle(
      circle.x,
      circle.y,
      options.radius
      )
      .attr(options.attributes)
      .data({
        x: circle.x,
        y: circle.y
      })
      .click(function (e) {
        if(options.onClick){
          options.onClick(this, e);
        }

        e.stopPropagation();
      });
}

module.exports = {
  polygon: renderPolygon,
  line: renderLine,
  circle: renderCircle
};