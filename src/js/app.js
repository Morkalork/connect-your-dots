var Snap = require('snapsvg');
var _ = require('lodash');

var extend = require('./utilities/extend');
var matrixParser = require('./matrix-parser');
var addLine = require('./line/add');
var arrowFigure = require('./figures/arrow.js');
var findPolygons = require('./polygon/find');
var dropLine = require('./line/drop');
var dropCircle = require('./circle/drop');
var renderer = require('./renderer');
var guidGenerator = require('./utilities/guid-generator.js');
var getLine = require('./line/get');
var polygonParseRealPath = require('./polygon/parse-real-path');

(function () {
  const CircleRadius = 8;
  const PlaceholderStrokeColor = "#0098BA";
  const PlaceholderFillColor = "#A8E0ED";
  const StrokeColor = "#000";
  const SelectedStrokeColor = "#FF0000";

  var svg;
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
  var shiftDown = false;

  var circles = [];
  var lines = [];
  var rectangles = [];
  var lineFigures = [];
  var polygons = [];

  var sizeRectangleStartCoordinates = null;
  var sizeRectangle = null;
  var sizeRectangleElement = null;

  /**
   * Rendering options
   */
  var customAttributes = {
    stroke: StrokeColor,
    strokeWidth: 4,
    fill: "#bada55",
    id: ""
  };

  var lineOptions = {
    paper: null,
    line: null,
    dragMove: lineMove,
    dragStart: lineMoveStart,
    dragEnd: lineMoveEnd
  };

  var circleOptions = {
    paper: null,
    circle: null,
    radius: CircleRadius,
    onClick: circleClick
  };

  var polygonOptions = {
    paper: null,
    polygon: null,
    dragMove: polygonMove,
    dragStart: polygonMoveStart,
    dragEnd: polygonMoveStop
  };

  var rectangleOptions = {
    paper: null,
    rectangle: null
  };

  /**
   * Event handlers
   */
  function svgMouseDown(e) {
    if (shiftDown) {
      sizeRectangleStartCoordinates = {
        x: parseInt(e.offsetX),
        y: parseInt(e.offsetY),
        height: 0,
        width: 0
      };

      svg.addEventListener('mousemove', svgMouseMove);
      svg.addEventListener('mouseup', svgMouseUp);
    }
  };

  function svgMouseUp(e) {
    svg.removeEventListener('mouseup', svgMouseUp);
    svg.removeEventListener('mousemove', svgMouseMove);
    
    rectangles.push(sizeRectangle);
    sizeRectangle = null;
    sizeRectangleElement = null;

    paper.clear();
    render();
  };

  function svgMouseMove(e) {
    var x = sizeRectangleStartCoordinates.x;
    var y = sizeRectangleStartCoordinates.y;

    var newX = parseInt(e.offsetX);
    var newY = parseInt(e.offsetY);

    var width = newX - x;
    var height = newY - y;

    if (width < 0) {
      width = sizeRectangleStartCoordinates.x - newX;
      x = newX;
    }

    if (height < 0) {
      height = sizeRectangleStartCoordinates.y - newY;
      y = newY;
    }

    if (sizeRectangleElement) {
      sizeRectangleElement.remove();
    }
    
    
    sizeRectangle = {
      x: x,
      y: y,
      width: width,
      height: height
    };

    sizeRectangleElement = paper
      .rect(sizeRectangle)
      .attr({
        stroke: "#000",
        strokeWidth: 2,
        opacity: 0.3,
        "fill-opacity": 0,
        strokeDasharray: "3,3"
      });

  }

  function paperClick(e) {
    if (dragIsCalled) {
      dragIsCalled = false;
      return;
    }

    if (e.which === 2) {
      return;
    }

    if (!shiftDown) {
      selectedCircle = null;
      var newCircle = {
        x: e.offsetX,
        y: e.offsetY
      };

      drawCircle(newCircle);
      selectCircle(newCircle);
    }

    paper.clear();
    render();
  };

  function polygonMoveStart(e) {
    dragIsCalled = true;
    this.data('originalTransform', this.transform().local);
  };

  function polygonMoveStop() {
    var transformString = this.attr('transform').string.substring(1); // Remove the first character
    var transformSplit = transformString.split(',');
    var coords = {
      x: parseInt(transformSplit[0]),
      y: parseInt(transformSplit[1])
    };

    var realPath = this.realPath;
    var newPolygon = polygonParseRealPath(realPath);

    _.forEach(polygons, polygon => {
      if (polygon.id === this.id) {
        polygon.coordinates = newPolygon
        return false; // break
      }
    });
  };

  function polygonMove(dx, dy) {
    var originalTransform = this.data('originalTransform');
    var extraTransform = (originalTransform ? "T" : "t") + [dx, dy];
    this.attr({
      transform: originalTransform + extraTransform
    });
  };

  function lineMove(xFromStart, yFromStart) {
    var x = (dragStartX + xFromStart) - relativeLocationX;
    var y = (dragStartY + yFromStart) - relativeLocationY;

    lineBeingDragged = getLine.getDraggedLine(this, lines);

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

  function lineMoveStart(x, y, e) {
    dragStartX = x;
    dragStartY = y;

    dragIsCalled = true;
  };

  function lineMoveEnd(e) {

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

  /**
   * Business
   */
  function renderDragPlaceholder(placeHolder) {

    var newLineOptions = {
      paper: paper,
      strokeColor: PlaceholderStrokeColor,
      opacity: 0.5,
      strokeDasharray: "10,10",
    };

    var lineOptions = extend(lineOptions, newLineOptions);

    lineOptions.line = placeHolder.leftLine;
    renderer.line(lineOptions);

    lineOptions.line = placeHolder.rightLine;
    renderer.line(lineOptions);

    var placeHolderCircleOptions = {
      paper: paper,
      strokeColor: PlaceholderStrokeColor,
      filleColor: PlaceholderFillColor,
      opacity: 0.5,
      circle: placeHolder.circle
    };

    var circleOption = extend(circleOption, placeHolderCircleOptions);

    renderer.circle(circleOption);
    lastPlaceholder = placeHolder;
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

    var polygon = {
      id: guidGenerator.run(),
      coordinates: polygonArray
    };

    polygons.push(polygon);

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
      var attributes = extend({}, customAttributes);

      if (selectedCircle &&
        (selectedCircle.x === circle.x && selectedCircle.y === circle.y)) {
        attributes.stroke = SelectedStrokeColor;
      } else {
        attributes.stroke = StrokeColor;
      }

      renderer.circle(circleOptions, attributes);
    });

    _.forEach(lineFigures, figure => {
      renderLineFigure(figure);
    });

    _.forEach(polygons, polygon => {
      polygonOptions.polygon = polygon.coordinates;
      var attributes = extend({}, customAttributes); //shallow clone
      attributes.id = polygon.id;
      renderer.polygon(polygonOptions, attributes);
    });

    _.forEach(rectangles, rectangle => {
      rectangleOptions.rectangle = rectangle;
      var attributes = extend({}, customAttributes);
      attributes.id = guidGenerator.run();
      renderer.rectangle(rectangleOptions, attributes);
    });
  };

  function setupSnap() {
    paper = Snap("#svg-main");

    lineOptions.paper = paper;
    circleOptions.paper = paper;
    polygonOptions.paper = paper;
    rectangleOptions.paper = paper;

    paper.click(paperClick);
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
    svg = document.getElementById('svg-main');
    svg
    .oncontextmenu = function (e) {
      e.preventDefault(); // Be gone with ye!
      return false;
    }

    svg.addEventListener('mousedown', svgMouseDown);

    window.addEventListener('keydown', function (e) {
      if (e.keyCode === 16) {
        shiftDown = true;
      } else if (e.keyCode === 17) {
        ctrlDown = true;
      }
    })
    addEventListener('keyup', function (e) {
      if (e.keyCode === 16) {
        shiftDown = false;
      } else if (e.keyCode === 17) {
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