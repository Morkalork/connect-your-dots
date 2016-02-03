var Snap = require('snapsvg');
var _ = require('lodash');
var matrixParser = require('./matrix-parser');
var addLine = require('./add-line');

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
  var ctrlDown = false;

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

  function dropCircle(circle) {
    _.remove(circles, c => {
      return c.x == circle.x
        && c.y == circle.y;
    });
  };

  function dragMove(xFromStart, yFromStart) {
    var x = (dragStartX + xFromStart) - relativeLocationX;
    var y = (dragStartY + yFromStart) - relativeLocationY;

    lineBeingDragged = getDraggedLine(this);

    var newCircle = {
      x: x,
      y: y
    };

    var dragPlaceholder = {
      leftLine: {
        startX: lineBeingDragged.startCircle.x,
        startY: lineBeingDragged.startCircle.y,
        endX: x,
        endY: y,
        startCircle: lineBeingDragged.startCircle,
        endCircle: newCircle
      },
      rightLine: {
        startX: x,
        startY: y,
        endX: lineBeingDragged.endCircle.x,
        endY: lineBeingDragged.endCircle.y,
        startCircle: newCircle,
        endCircle: lineBeingDragged.endCircle
      },
      circle: newCircle
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

    if (!lineBeingDragged) {
      return;
    }

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
    if (!options) {
      options = {};
    }

    if (selectedCircle &&
      (selectedCircle.x === circlePosition.x && selectedCircle.y === circlePosition.y)) {
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

        if (e.which === 1) {    //Left button
          if (ctrlDown) {
            removeCircle(thisCircle);
          }
          else {
            selectCircle(thisCircle);
          }
        }

        e.stopPropagation();
      });
  };

  function selectCircle(thisCircle) {
    selectedCircle = thisCircle;

    addLine(lines, lastCircle, thisCircle);
    lastCircle = thisCircle;

    clear();
    render();
  }

  /**
   * When removing circles you need to reconnect the dots
   */
  function removeCircle(thisCircle) {
    var family = matrixParser.findCircleParents(lines, circles, thisCircle);

    dropCircle(thisCircle);

    _.forEach(family.connectedLines, line => {
      dropLine(line);
    });

    if (family.parentCircles.length === 2) {
      // if we have two parents than connect them instead now that they've lost their child...
      addLine(lines, family.parentCircles[0], family.parentCircles[1]);
    }

    selectCircle(family.parentCircles[0]);

    clear();
    render();
  }

  function clear() {
    //Guess what this does :)
    paper.clear();
  }

  function render() {

    // console.log("Drawing %i lines!", lines.length);
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
      addLine(lines, lastCircle, newCircle);
    }

    lastCircle = newCircle;
  };



  function init() {
    var svg = document.getElementById('svg-main');
    svg
    .oncontextmenu = function (e) {
      e.preventDefault(); // Be gone with ye!
      return false;
    }

    window.addEventListener('keydown', function (e) {
      if (e.keyCode === 17) {
        ctrlDown = true;
      }
    })
    addEventListener('keyup', function (e) {
      if (e.keyCode === 17) {
        ctrlDown = false;
      }
    });

    var svgBoundaries = svg.getBoundingClientRect();
    relativeLocationX = svgBoundaries.left;
    relativeLocationY = svgBoundaries.top;

    setupSnap();
  };

  init();
} ());