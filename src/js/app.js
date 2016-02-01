var Snap = require('snapsvg');
var _ = require('lodash');

(function () {
  const CircleRadius = 8;
  const FillColor = "#bada55";
  const PlaceholderStrokeColor = "#0098BA";
  const PlaceholderFillColor = "#A8E0ED";
  const StrokeColor = "#000";
  const SelectedStrokeColor = "#FF0000";

  var paper;
  var lastCircle;
  var lastPlaceholder;
  var selectedCircle;

  var relativeLocationX = 0;
  var relativeLocationY = 0;
  var dragStartX = 0;
  var dragStartY = 0;

  var dragIsCalled = false;
  var lineBeingDragged = null;

  var circles = [];
  var lines = [];

  function renderDragPlaceholder(placeHolder) {

    var placeHolderLineOptions = {
      strokeColor: PlaceholderStrokeColor,
      opacity: 0.5,
      strokeDasharray: "10,10"
    };
    
    var placeHolderCircleOptions = {
      strokeColor: PlaceholderStrokeColor,
      filleColor: PlaceholderFillColor,
      opacity: 0.5
    };

    renderLine(placeHolder.leftLine, placeHolderLineOptions);
    renderLine(placeHolder.rightLine, placeHolderLineOptions);
    renderCircle(placeHolder.circle, placeHolderCircleOptions);
    lastPlaceholder = placeHolder;
  };

  function getDraggedLine(t) {
    var startX = t.data('startX');
    var startY = t.data('startY');
    var endX = t.data('endX');
    var endY = t.data('endY');

    return _.find(lines, l => {
      return l.startX == startX
        && l.startY == startY
        && l.endX == endX
        && l.endY == endY;
    });
  };

  function dropLine(line) {
    _.remove(lines, l => {
      return l.startX == line.startX
        && l.startY == line.startY
        && l.endX == line.endX
        && l.endY == line.endY;
    });
  };
  
  function dropCircle(circle){
    console.log(circle);
    console.info(circles);
    _.remove(circles, c => {
      return c.x == circle.x 
        && c.y == circle.y;
    });
    console.info(circles);
  };

  function dragMove(xFromStart, yFromStart) {
    var x = (dragStartX + xFromStart) - relativeLocationX;
    var y = (dragStartY + yFromStart) - relativeLocationY;


    lineBeingDragged = getDraggedLine(this);

    var dragPlaceholder = {
      leftLine: {
        startX: lineBeingDragged.startCircle.x,
        startY: lineBeingDragged.startCircle.y,
        endX: x,
        endY: y
      },
      rightLine: {
        startX: x,
        startY: y,
        endX: lineBeingDragged.endCircle.x,
        endY: lineBeingDragged.endCircle.y
      },
      circle: {
        x: x,
        y: y
      }
    };

    clear();
    renderDragPlaceholder(dragPlaceholder);
    render();
  };

  function dragStart(x, y, e) {
    dragStartX = x;
    dragStartY = y;

    dragIsCalled = true;
  };

  function dragEnd(e) {

    dropLine(lineBeingDragged);

    clear();
    renderLine(lastPlaceholder.leftLine);
    renderLine(lastPlaceholder.rightLine);
    renderCircle(lastPlaceholder.circle);
    render();

    lines.push(lastPlaceholder.leftLine);
    lines.push(lastPlaceholder.rightLine);
    circles.push(lastPlaceholder.circle);

    lastCircle = lastPlaceholder.circle;
    lastPlaceholder = null;
    lineBeingDragged = null;
    dragIsCalled = false;
  };

  /**
   * @param linePosition  The positioning information for the line (startX, startY, endX, endY)
   * @param options       Additional options for the line (strokeColor, opacity, strokeDasharray)
   */
  function renderLine(linePosition, options) {
    if (!options) {
      options = {};
    }

    paper.line(
      linePosition.startX,
      linePosition.startY,
      linePosition.endX,
      linePosition.endY
      )
      .attr({
        stroke: options.strokeColor || StrokeColor,
        strokeWidth: 6,
        opacity: options.opacity || 1,
        strokeDasharray: options.strokeDasharray || ""
      })
      .data({
        startX: linePosition.startX,
        startY: linePosition.startY,
        endX: linePosition.endX,
        endY: linePosition.endY
      })
      .drag(dragMove, dragStart, dragEnd);
  };

  /**
   * @param circlePosition  The positioning information for the circle (x, y)
   * @param options         Additional options for the circle (fillColor, strokeColor, opacity, strokeDasharray)
   */
  function renderCircle(circlePosition, options) {
    if(!options){
      options = {};
    }
    
    if(selectedCircle && 
    (selectedCircle.x === circlePosition.x && selectedCircle.y === circlePosition.y)){
      options.strokeColor = SelectedStrokeColor;
    }
    
    paper.circle(
      circlePosition.x,
      circlePosition.y,
      CircleRadius
      )
      .attr({
        fill: options.fillColor || FillColor,
        opacity: options.opacity || 1,
        stroke: options.strokeColor || StrokeColor,
        strokeWidth: 4,
        strokeDasharray: options.strokeDasharray || ""
      })
      .data({
        x: circlePosition.x,
        y: circlePosition.y
      })
      .click(function (e) {
        dragIsCalled = false;

        var thisCircle = {
          x: this.data('x'),
          y: this.data('y')
        };
        
        selectedCircle = thisCircle;
        
        addLineBetweenCircles(lastCircle, thisCircle);
        lastCircle = thisCircle;

        clear();
        render();
        e.stopPropagation();
      });
  };

  function clear() {
    //Guess what this does :)
    paper.clear();
  }

  function render() {

    for (var i in lines) {
      var lineInfo = lines[i];
      renderLine(lineInfo);
    }

    for (var i in circles) {
      var circleInfo = circles[i];
      renderCircle(circleInfo);
    }
  };

  function setupSnap() {
    paper = Snap("#svg-main");

    paper.click(function (e) {
      if (dragIsCalled) {
        dragIsCalled = false;
        return;
      }

      selectedCircle = null;
      drawCircle(e.offsetX, e.offsetY);
      clear();
      render();
    });
  };

  function drawCircle(x, y) {
    var newCircle = { x: x, y: y };
    circles.push(newCircle);

    if (lastCircle) {
      addLineBetweenCircles(lastCircle, newCircle);
    }

    lastCircle = newCircle;
  };

  function addLineBetweenCircles(oldCircle, newCircle) {
    var startX = oldCircle.x;
    var startY = oldCircle.y;

    var endX = newCircle.x;
    var endY = newCircle.y;

    var newLine =
      {
        startX: startX,
        startY: startY,
        endX: endX,
        endY: endY,
        startCircle: oldCircle,
        endCircle: newCircle
      };

    lines.push(newLine);
  };

  function init() {
    var svg = document.getElementById('svg-main');
    var svgBoundaries = svg.getBoundingClientRect();
    relativeLocationX = svgBoundaries.left;
    relativeLocationY = svgBoundaries.top;

    setupSnap();
  };

  init();
} ());