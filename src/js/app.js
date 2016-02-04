var Snap = require('snapsvg');
var _ = require('lodash');

var matrixParser = require('./matrix-parser');
var addLine = require('./add-line');
var arrowFigure = require('./figures/arrow.js');
var findPolygons = require('./find-polygons');
var dropLine = require('./drop-line');
var dropCircle = require('./drop-circle');
var renderer = require('./renderer');

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
  var lineFigures = [];
  var polygons = [];

  /**
   * Rendering options
   */
  var lineOptions = {
    paper: null,
    line: null,
    dragMove: dragMove,
    dragStart: dragStart,
    dragEnd: dragEnd
  };

  var circleOptions = {
    paper: null,
    circle: null,
    radius: CircleRadius,
    attributes: {
      stroke: StrokeColor,
      fill: FillColor
    },
    onClick: circleClick
  };

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

    paper.clear();
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

    dropLine(lineBeingDragged, lines);

    paper.clear();

    lines.push(lastPlaceholder.leftLine);
    lines.push(lastPlaceholder.rightLine);
    circles.push(lastPlaceholder.circle);

    render();

    lastCircle = lastPlaceholder.circle;
    lastPlaceholder = null;
    lineBeingDragged = null;
    dragIsCalled = false;
  };

  function renderLineFigure(figure) {
    switch (figure.type) {
      case 'arrow':
        arrowFigure.draw(figure.options);
        break;
    }
  }

  function circleClick(t, e) {
    dragIsCalled = false;

    var thisCircle = {
      x: t.data('x'),
      y: t.data('y')
    };

    if (e.which === 1) {    //Left button
      if (ctrlDown) {
        removeCircle(thisCircle);
      }
      else {
        addLineBetweenCircles(lastCircle, thisCircle);
        selectCircle(thisCircle);

        var drawings = findPolygons(circles, lines);

        if (drawings.length > 0) {
          _.forEach(drawings, drawing => {
            convertDrawingToPolygon(drawing);
          });

          selectedCircle = null;
          lastCircle = null;
        }

        paper.clear();
        render();
      }
    }
  };

  function convertDrawingToPolygon(polygonCircles) {

    var polygonArray = [];
    _.forEach(polygonCircles, circle => {
      polygonArray.push(circle.x, circle.y);
    });

    polygons.push(polygonArray);

    var polygonLines = matrixParser.getLinesForCircles(polygonCircles, lines);
    lines = _.difference(lines, polygonLines);
    circles = _.difference(circles, polygonCircles);

    paper.clear();
    render();
  }

  function selectCircle(thisCircle) {
    if (selectedCircle) {
      if (selectedCircle.x === thisCircle.x
        && selectedCircle.y === thisCircle.y) {
        //We clicked on the currently selected circle, deselect!
        selectedCircle = null;
        lastCircle = null;
        return;
      }
    }

    selectedCircle = thisCircle;
    lastCircle = thisCircle;
  }

  function addLineBetweenCircles(firstCircle, secondCircle) {
    addLine(lines, firstCircle, secondCircle);
  }

  /**
   * When removing circles you need to reconnect the dots
   */
  function removeCircle(thisCircle) {
    var family = matrixParser.findCircleParents(lines, circles, thisCircle);
    dropCircle(thisCircle, circles);

    _.forEach(family.connectedLines, line => {
      dropLine(line, lines);
    });

    if (family.parentCircles.length >= 2) {
      // if we have two parents than connect them instead now that they've lost their child...
      addLineBetweenCircles(family.parentCircles[0], family.parentCircles[1]);
    }

    selectCircle(family.parentCircles[0]);

    paper.clear();
    render();
  }

  function render() {

    _.forEach(lines, line => {
      lineOptions.line = line;
      renderer.line(lineOptions);
    });

    _.forEach(circles, circle => {
      circleOptions.circle = circle;

      if (selectedCircle &&
        (selectedCircle.x === circle.x && selectedCircle.y === circle.y)) {
        circleOptions.stroke = SelectedStrokeColor;
      }

      renderer.circle(circleOptions);
    });

    _.forEach(lineFigures, figure => {
      renderLineFigure(figure);
    });

    _.forEach(polygons, polygon => {
      renderer.polygon(paper, polygon);
    });
  };

  function setupSnap() {
    paper = Snap("#svg-main");

    lineOptions.paper = paper;
    circleOptions.paper = paper;

    paper.click(function (e) {
      if (dragIsCalled) {
        dragIsCalled = false;
        return;
      }

      if (e.which === 2) {
        return;
      }

      selectedCircle = null;
      var newCircle = {
        x: e.offsetX,
        y: e.offsetY
      };

      drawCircle(newCircle);
      selectCircle(newCircle);
      paper.clear();
      render();
    });
  };

  function drawCircle(newCircle) {
    circles.push(newCircle);

    if (lastCircle) {
      addLineBetweenCircles(lastCircle, newCircle);
    }

    lastCircle = newCircle;
  };

  function addDEMOFigures() {
    var arrow1Options = {
      type: 'arrow',
      options: {
        startX: 150,
        startY: 100,
        endX: 200,
        endY: 250,
        paper: paper,
        thickness: 2
      }
    };

    lineFigures.push(arrow1Options);

    var arrow2Options = {
      type: 'arrow',
      options: {
        startX: 250,
        startY: 200,
        endX: 200,
        endY: 150,
        paper: paper,
        thickness: 6,
        color: "#0000FF"
      }
    };

    lineFigures.push(arrow2Options);
  }

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
    //addDEMOFigures();
    render();
  };

  init();
} ());