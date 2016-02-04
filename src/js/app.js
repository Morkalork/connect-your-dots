var Snap = require('snapsvg');
var _ = require('lodash');

var matrixParser = require('./matrix-parser');
var addLine = require('./add-line');
var arrowFigure = require('./figures/arrow.js');
var findPolygons = require('./find-polygons');
var dropLine = require('./drop-line');
var dropCircle = require('./drop-circle');

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

    dropLine(lineBeingDragged, lines);

    clear();

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
  
  function renderPolygon(polygon, options){
    if(!options){
      options = {};
    }
    
    paper.polygon(polygon)
      .attr({
        stroke: options.strokeColor || StrokeColor,
        strokeWidth: 6,
      })
      .click(function(e){
        console.log(e);
      });
  }

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
            addLineBetweenCircles(lastCircle, thisCircle);
            selectCircle(thisCircle);

            var drawings = findPolygons(circles, lines);
            
            if(drawings.length > 0){
              _.forEach(drawings, drawing => {
                convertDrawingToPolygon(drawing);
              });
            }

            clear();
            render();
          }
        }

        e.stopPropagation();
      });
  };
  
  function convertDrawingToPolygon(polygonCircles){
    
    var polygonArray = [];
    _.forEach(polygonCircles, circle => {
      polygonArray.push(circle.x, circle.y);
    });
    
    polygons.push(polygonArray);
    
    console.log(polygons);
    var polygonLines = matrixParser.getLinesForCircles(polygonCircles, lines);
    lines = _.difference(lines, polygonLines);
    circles = _.difference(circles, polygonCircles);
    
    clear();
    render();
  }

  function selectCircle(thisCircle) {
    if (selectedCircle) {
      if(selectedCircle.x === thisCircle.x
        && selectedCircle.y === thisCircle.y){
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

    clear();
    render();
  }

  function clear() {
    //Guess what this does :)
    paper.clear();
  }

  function render() {

    _.forEach(lines, lineInfo => {
      renderLine(lineInfo);
    });

    _.forEach(circles, circleInfo => {
      renderCircle(circleInfo);
    });

    _.forEach(lineFigures, figure => {
      renderLineFigure(figure);
    });
    
    _.forEach(polygons, polygon => {
      renderPolygon(polygon);
    });
  };

  function setupSnap() {
    paper = Snap("#svg-main");

    paper.click(function (e) {
      if (dragIsCalled) {
        dragIsCalled = false;
        return;
      }
      
      if(e.which === 2){
        return;
      }

      selectedCircle = null;
      var newCircle = {
        x: e.offsetX,
        y: e.offsetY
      };

      drawCircle(newCircle);
      selectCircle(newCircle);
      clear();
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