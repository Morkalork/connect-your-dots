var Snap = require('snapsvg');

(function () {
  const CircleRadius = 8;
  const FillColor = "#bada55";
  const StrokeColor = "#000";

  var snap;
  var lastCircle;

  // When drag is called this is true
  var dragIsCalled = false;
  
  // The line currently being dragged
  var lineBeingDragged = null;
  
  // When we drag a line we show a ghostly placeholder to display the new line settings
  var dragPlaceholder = null;

  var circles = [];
  var lines = [];

  function renderDragPlaceholder() {

  }

  function dragMove(e) {

  }

  function dragStart(e) {
    dragIsCalled = true;
    lineBeingDragged = this;

    console.log(e);
  }

  function dragEnd(e) {
    console.log(e);
  }

  function renderLine(lineInfo) {
    snap.line(
      lineInfo.startX,
      lineInfo.startY,
      lineInfo.endX,
      lineInfo.endY
      )
      .attr({
        stroke: StrokeColor,
        strokeWidth: 6
      })
      .drag(dragMove, dragStart, dragEnd);
  }

  function renderCircle(circleInfo) {
    snap.circle(
      circleInfo.x,
      circleInfo.y,
      CircleRadius
      )
      .attr({
        fill: FillColor,
        stroke: StrokeColor,
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
        render();
        e.stopPropagation();
      });
  }

  function render() {
    //Guess what this does :)
    snap.clear();

    for (var i in lines) {
      var lineInfo = lines[i];
      renderLine(lineInfo);
    }

    for (var i in circles) {
      var circleInfo = circles[i];
      renderCircle(circleInfo);
    }
  }

  function setupSnap() {
    snap = Snap("#svg-main");

    snap.click(function (e) {
      if (dragIsCalled) {
        dragIsCalled = false;
        return;
      }

      drawCircle(e.offsetX, e.offsetY);
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

    var newLine = { startX: startX, startY: startY, endX: endX, endY: endY };
    lines.push(newLine);
  };

  function init() {
    setupSnap();
  };

  init();
} ());