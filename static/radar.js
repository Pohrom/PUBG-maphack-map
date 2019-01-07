function Radar(canvas) {
    this.map = L.map("map", { crs: L.CRS.Simple }).setView(
      new L.LatLng(-128, 128),
      1
    );
  }
  
  function getRandomColor() {
    var letters = "0123456789ABCDEF";
    var color = "#";
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  
  function rotatePoints(center, points, yaw) {
    var res = [];
    var angle = yaw * (Math.PI / 180); // not really sure what this is
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      // translate to center
      var p2 = [p[0] - center[0], p[1] - center[1]];
      // rotate using matrix rotation
      var p3 = [
        Math.cos(angle) * p2[0] - Math.sin(angle) * p2[1],
        Math.sin(angle) * p2[0] + Math.cos(angle) * p2[1]
      ];
      // translate back to center
      var p4 = [p3[0] + center[0], p3[1] + center[1]];
      // done with that point
      res.push(p4);
    }
    return res;
  }
  
  // translates game coords to overlay coords
  // p / 813000 = o / 256
  Radar.prototype.game2Pix = function(p) {
    return p * (256 / 813000);
  };
  
  Radar.prototype.coords2Pos = function(x, y) {
    return [this.game2Pix(x), -this.game2Pix(y)];
  };
  
  Radar.prototype.setMap = function(map) {
    // 坐标系为 TileLayer 在第四象限, 左上角对齐坐标原点, 大小 256x256
    var bounds = L.latLngBounds([[0, 0], [-256, 256]]);
  
    L.tileLayer(map, {
      noWrap: true,
      attribution: "© MorHop",
      bounds: bounds
    }).addTo(this.map);
  
    var myLines = [
      {
        type: "LineString",
        coordinates: [[0, 0], [-105, 45], [-110, 55]]
      },
      {
        type: "LineString",
        coordinates: [[0, 0], [-110, 45], [-115, 55]]
      }
    ];
  
    var myStyle = {
      color: "#ff7800",
      weight: 5,
      opacity: 0.65
    };
  
    L.geoJSON(myLines, {
      style: myStyle
    }).addTo(this.map);
  
    var states = [
      {
        type: "Feature",
        properties: { party: "Republican" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-104.05, 48.99],
              [-97.22, 48.98],
              [-96.58, 45.94],
              [-104.03, 45.94],
              [-104.05, 48.99]
            ]
          ]
        }
      },
      {
        type: "Feature",
        properties: { party: "Democrat" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-109.05, 41.0],
              [-102.06, 40.99],
              [-102.03, 36.99],
              [-109.04, 36.99],
              [-109.05, 41.0]
            ]
          ]
        }
      }
    ];
    L.geoJSON(states, {
      style: function(feature) {
        switch (feature.properties.party) {
          case "Republican":
            return { color: "#ff0000" };
          case "Democrat":
            return { color: "#0000ff" };
        }
      }
    }).addTo(this.map);
  
    var geojsonFeature = [
      {
        type: "Point",
        coordinates: [0, 0]
      },
      {
        type: "Point",
        coordinates: [256, 0]
      },
      {
        type: "Point",
        coordinates: this.coords2Pos(813000, 813000)
      },
      {
        type: "Feature",
        properties: { party: "Democrat" },
        geometry: {
          type: "Point",
          coordinates: this.coords2Pos(0, 813000)
        }
      }
    ];
    console.dir(this.map.getBounds());
    var geojsonMarkerOptions = {
      radius: 6,
      fillColor: "#FF0000",
      color: getRandomColor(),
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    };
  
    L.geoJSON(geojsonFeature, {
      pointToLayer: function(feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions).bindPopup("10", {
          permanent: true,
          direction: "right"
        });
      }
    }).addTo(this.map);
  
    // Let us generate fake data
  function fakeData() {
      return [Math.random(), Math.random()];
    }
    var center = [48.861415, 2.349326];
    // Create a barchart
    var myBarChart = L.minichart(center, {data: fakeData()});
    this.map.addLayer(myBarChart);
    
    // Update data every 2 seconds
    setInterval(function() {
      myBarChart.setOptions({type: 'pie', data: fakeData(), width: 16, colors: ['#111111', '#FF0000'], labels:['1']})
    }, 2000);
  
    this.setCenter(813000, 813000);
  };
  
  Radar.prototype.setCenter = function(x, y) {
    let mapPos = this.coords2Pos(x, y);
    this.map.panTo([-mapPos[0], -mapPos[1]]);
  };
  
  
  Radar.prototype.clear = function() {
      this.map.removeLayer();
  };
  
  Radar.prototype.translate = function(offsetX, offsetY) {
    this.ctx.translate(offsetX, offsetY);
    this.viewPortOffset.X += offsetX;
    this.viewPortOffset.Y += offsetY;
  };
  
  Radar.prototype.dot = function(x, y, color, width) {
    var pos = this.coords2Pos(x, y);
    var radius = 7 / this.scaledFactor;
    this.ctx.beginPath();
    this.ctx.arc(pos.X, pos.Y, radius, 0, 2 * Math.PI, false);
    this.ctx.lineWidth = width || 5;
    this.ctx.fillStyle = color || "red";
    this.ctx.fill();
  };
  
  Radar.prototype.arc = function(x, y, r, lineWidth, strokeStyle, fillStyle) {
    var pos = this.coords2Pos(x, y);
    this.ctx.beginPath();
    this.ctx.arc(pos.X, pos.Y, this.game2Pix(r), 0, 360, false);
    this.ctx.lineWidth = lineWidth / this.scaledFactor;
    this.ctx.strokeStyle = strokeStyle || "white";
    this.ctx.stroke();
    this.ctx.fillStyle = fillStyle || "rgba(125,125,125,0.5)";
    this.ctx.fill();
  };
  
  Radar.prototype.pieChart = function(x, y, percent, color) {
    var pos = this.coords2Pos(x, y);
    var radius = 7 / this.scaledFactor;
    var startAngle = 1.5 * Math.PI;
    var endAngle = percent * 2 * Math.PI + 1.5 * Math.PI;
  
    // 扇形
    this.ctx.fillStyle = color || "gray";
    this.ctx.beginPath();
    this.ctx.moveTo(pos.X, pos.Y);
    this.ctx.arc(pos.X, pos.Y, radius, startAngle, endAngle, false);
    this.ctx.closePath();
    this.ctx.fill();
  };
  
  Radar.prototype.text = function(x, y, content, color) {
    var pos = this.coords2Pos(x, y);
    this.ctx.font = "" + 8 / this.scaledFactor + "pt Calibri";
    this.ctx.fillStyle = color || "white";
    this.ctx.textAlign = "center";
    this.ctx.fillText(content, pos.X, pos.Y + 3 / this.scaledFactor);
  };
  
  // useless
  Radar.prototype.floatText = function(posX, posY, content, color) {
    this.ctx.font = "" + 8 / this.scaledFactor + "pt Calibri";
    this.ctx.fillStyle = color || "lightgreen";
    this.ctx.textAlign = "left";
    this.ctx.fillText(
      content,
      posX - this.viewPortOffset.X,
      posY - this.viewPortOffset.Y
    );
  };
  
  Radar.prototype.underText = function(x, y, content, color) {
    var pos = this.coords2Pos(x, y);
    this.ctx.beginPath();
    this.ctx.moveTo(
      pos.X - (10 * content.length) / 2 / this.scaledFactor,
      pos.Y - 5 / this.scaledFactor + 20 / this.scaledFactor
    );
    this.ctx.lineTo(
      pos.X + (10 * content.length) / 2 / this.scaledFactor,
      pos.Y - 5 / this.scaledFactor + 20 / this.scaledFactor
    );
    this.ctx.lineTo(
      pos.X + (10 * content.length) / 2 / this.scaledFactor,
      pos.Y + 5 / this.scaledFactor + 20 / this.scaledFactor
    );
    this.ctx.lineTo(
      pos.X - (10 * content.length) / 2 / this.scaledFactor,
      pos.Y + 5 / this.scaledFactor + 20 / this.scaledFactor
    );
    this.ctx.closePath();
    if (this.scaledFactor < 1) {
      this.ctx.fillStyle = "rgba(255, 255, 255, " + this.scaledFactor * 0.5 + ")";
    } else {
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    }
    this.ctx.fill();
    this.ctx.font = "" + 8 / this.scaledFactor + "pt Calibri";
    this.ctx.fillStyle = color || "white";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      content,
      pos.X,
      pos.Y + 3 / this.scaledFactor + 20 / this.scaledFactor
    );
  };
  
  // from https://github.com/jerrytang67/helloworld
  Radar.prototype.lineWithAngle = function(x, y, length, width, angle, color) {
    var pos = this.coords2Pos(x, y);
    var anX = 5 * Math.cos((Math.PI * angle) / 180.0);
    var anY = 5 * Math.sin((Math.PI * angle) / 180.0);
  
    var x1 = pos.X + anX;
    var y1 = pos.Y + anY;
  
    var circle1 = {
      x: pos.X,
      y: pos.Y,
      r: 5
    };
    var circle2 = {
      x: x1,
      y: y1,
      r: 0
    };
  
    var arrow = {
      h: width / this.scaledFactor,
      w: length / this.scaledFactor
    };
  
    drawArrow(this.ctx, arrow, circle1, circle2, color);
  
    //draw arrow -- uuaing
    function drawArrow(canvasContext, arrow, ptArrow, endPt, color) {
      var angleInDegrees = getAngleBetweenPoints(ptArrow, endPt);
      var endPt = getPointOnCircle(endPt.r, ptArrow, endPt);
      // first save the untranslated/unrotated context
      canvasContext.save();
  
      // move the rotation point to the center of the rect
      canvasContext.translate(endPt.x, endPt.y);
      // rotate the rect
      canvasContext.rotate((angleInDegrees * Math.PI) / 180);
      canvasContext.beginPath();
      canvasContext.moveTo(0, 0);
  
      canvasContext.lineTo(0, -arrow.h);
      canvasContext.lineTo(arrow.w, 0);
      canvasContext.lineTo(0, +arrow.h);
      canvasContext.closePath();
      canvasContext.fillStyle = color;
      canvasContext.lineWidth = 0;
      //canvasContext.stroke();
      canvasContext.fill();
  
      // restore the context to its untranslated/unrotated state
      canvasContext.restore();
    }
  
    function getPointOnCircle(radius, originPt, endPt) {
      var angleInDegrees = getAngleBetweenPoints(originPt, endPt);
      // Convert from degrees to radians via multiplication by PI/180
      var x = radius * Math.cos((angleInDegrees * Math.PI) / 180) + originPt.x;
      var y = radius * Math.sin((angleInDegrees * Math.PI) / 180) + originPt.y;
      return {
        x: x,
        y: y
      };
    }
  
    function getAngleBetweenPoints(originPt, endPt) {
      var interPt = {
        x: endPt.x - originPt.x,
        y: endPt.y - originPt.y
      };
      return (Math.atan2(interPt.y, interPt.x) * 180) / Math.PI;
    }
  };
  