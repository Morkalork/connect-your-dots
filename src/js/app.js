var Snap = require('snapsvg');

(function () {
  const CircleRadius = 8;

  var snap;
  var lastCircle;

  var circles = [];
  var lines = [];

  function renderLine(lineInfo) {
    snap.line(
      lineInfo.startX,
      lineInfo.startY,
      lineInfo.endX,
      lineInfo.endY
      )
      .attr({
        stroke: "#000",
        strokeWidth: 4
      })
      .click(function (e) {
        console.log("line clikc!");
        e.stopPropagation();
      });
  }

  function renderCircle(circleInfo) {
    snap.circle(
      circleInfo.x,
      circleInfo.y,
      CircleRadius
      )
      .attr({
        fill: "#bada55",
        stroke: "#333",
        strokeWidth: 1
      })
      .data({
        x: circleInfo.x,
        y: circleInfo.y
      })
      .click(function (e) {
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