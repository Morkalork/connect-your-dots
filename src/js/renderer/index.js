var extend = require('../utilities/extend.js');

var defaultRenderingAttributes = {
  stroke: "#000",
  strokeWidth: 6,
  fill: "#FF0000",
  opacity: 1,
  strokeDasharray: ""
};

var rectangleRenderingOptions = {
  paper: null,
  rectangle: null
};

function renderRectangle(customOptions, customAttributes){
  var attributes = extend(defaultRenderingAttributes, customAttributes);
  var options = extend(polygonRenderingOptions, customOptions);
  
  options.paper
    .rect(options.rectangle)
    .attr(attributes);
};

var polygonRenderingOptions = {
  paper: null,
  polygon: null,
  dragMove: null,
  dragStart: null,
  dragStop: null
};

function renderPolygon(customOptions, customAttributes) {
  var attributes = extend(defaultRenderingAttributes, customAttributes);
  var options = extend(polygonRenderingOptions, customOptions);

  options.paper
    .polygon(options.polygon)
    .attr(attributes)
    .drag(
      options.dragMove,
      options.dragStart,
      options.dragEnd
      );
};

var lineRenderingOptions = {
  paper: null,
  line: null,
  dragMove: null,
  dragStart: null,
  dragEnd: null
};

function renderLine(userOptions, customAttributes) {
  var attributes = extend(defaultRenderingAttributes, customAttributes);
  var options = extend(lineRenderingOptions, userOptions);

  var line = options.line;
  options.paper
    .line(
      line.startX,
      line.startY,
      line.endX,
      line.endY
      )
    .attr(attributes)
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
};

var circleRenderingOptions = {
  paper: null,
  circle: null,
  radius: 8,
  onClick: null
};

function renderCircle(customOptions, customAttributes){
  
  var attributes = extend(defaultRenderingAttributes, customAttributes);
  var options = extend(circleRenderingOptions, customOptions);
  
  var circle = options.circle;
  
  options.paper.circle(
      circle.x,
      circle.y,
      options.radius
      )
      .attr(attributes)
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
};

module.exports = {
  polygon: renderPolygon,
  line: renderLine,
  circle: renderCircle,
  rectangle: renderRectangle
};