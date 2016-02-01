var Snap = require('snapsvg');
var _ = require('lodash');

(function () {
  const CircleRadius = 8;
  const FillColor = "#bada55";
  const PlaceholderStrokeColor = "#0098BA";
  const PlaceholderFillColor = "#A8E0ED";
  const StrokeColor = "#000";
  const SelectedStrokeColor = "#00FF00";

  var paper;
  var lastCircle;
  var lastPlaceholder;

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

    renderLine(placeHolder.leftLine, placeHolderLineOptions);
    renderLine(placeHolder.rightLine, placeHolderLineOptions);
    renderCircle(placeHolder.circle, PlaceholderStrokeColor, PlaceholderFillColor, 0.5);
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
  }

  function dropLine(line) {
    _.remove(lines, l => {
      return l.startX == line.startX
        && l.startY == line.startY
        && l.endX == line.endX
        && l.endY == line.endY;
    });
  }

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
   * @param paper         The SnapSVG paper to draw on
   * @param linePosition  The positioning information for the line (startX, startY, endX, endY)
   * @param options       Additional options for the line (strokeColor, opacity, strokeDasharray)
   */
  function renderLine(lineInfo, options) {
    if (!options) {
      options = {};
    }

    paper.line(
      lineInfo.startX,
      lineInfo.startY,
      lineInfo.endX,
      lineInfo.endY
      )
      .attr({
        stroke: options.strokeColor || StrokeColor,
        strokeWidth: 6,
        opacity: options.opacity || 1,
        strokeDasharray: options.strokeDasharray || ""
      })
      .data({
        startX: lineInfo.startX,
        startY: lineInfo.startY,
        endX: lineInfo.endX,
        endY: lineInfo.endY
      })
      .drag(dragMove, dragStart, dragEnd);
  };

  function renderCircle(circleInfo, fillColor, strokeColor, opacity) {
    paper.circle(
      circleInfo.x,
      circleInfo.y,
      CircleRadius
      )
      .attr({
        fill: fillColor || FillColor,
        opacity: opacity || 1,
        stroke: strokeColor || StrokeColor,
        strokeWidth: 4
      })
      .data({
        x: circleInfo.x,
        y: circleInfo.y
      })
      .click(function (e) {
        dragIsCalled = false;

        var thisCircle = {
          x: this.data('x'),
          y: this.data('y')
        };

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