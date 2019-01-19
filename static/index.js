$(function() {
  function onResize() {
    var height = window.innerHeight;
    var is_safari = navigator.userAgent.indexOf("Safari") > -1;

    if (
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPod/i)
    ) {
      if (is_safari) {
        height += 80;
      }
    }
    $("#radar")
      .attr("width", window.innerWidth)
      .attr("height", height);
  }
  window.addEventListener("resize", onResize);
  onResize();

  // 禁止移动端弹性webview
  document.ontouchmove = function(event) {
    event.preventDefault();
  };
});

$(function() {
  var radar = new Radar($("#radar")[0]);
  var socket = io();
  var socketUpdateCounter = new Utils.MinsCounter();
  socket.on("update", function(snapshot) {
    locations = snapshot;
    socketUpdateCounter.update();
    redraw();
  });
  var locations = {};
  var trackPlayerIndex = parseInt(Utils.getParameterByName("id") || 1) - 1;

  var maps = [
    "Erangel_Main_High_Res.jpg",
    "Miramar_Main_High_Res.jpg",
    "Savage_Main_High_Res.png",
    "Camp_Jackal_Main_High_Res.jpg",
    "Vikendi_Main_High_Res.png.png"
  ];
  var mapParameter = Utils.getParameterByName("map");
  if (mapParameter === "1") {
    // Erangle
    radar.setMap(maps[0], 8);
  } else if (mapParameter === "2") {
    // Desert
    radar.setMap(maps[1], 8);
  } else if (mapParameter === "3") {
    // Sanhok
    radar.setMap(maps[2], 3.984);
  } else if (mapParameter === "4") {
    // Range
    radar.setMap(maps[3], 1.992);
  } else if (mapParameter === "5") {
    // Vikendi
    radar.setMap(maps[4], 5.977);
  } else {
    radar.setMap(maps[Math.random() < 0.5 ? 1 : 0]);
  }

  // 手势支持
  var hammertime = new Hammer.Manager($(".container")[0]);
  hammertime.add(
    new Hammer.Pan({
      threshold: 0
    })
  );
  hammertime.add(
    new Hammer.Pinch({
      threshold: 0
    })
  );

  // 拖动
  var lastDelta = {
    x: 0,
    y: 0
  };
  hammertime.on("panmove", function(ev) {
    radar.setMove(ev.deltaX - lastDelta.x, ev.deltaY - lastDelta.y);
    lastDelta.x = ev.deltaX;
    lastDelta.y = ev.deltaY;
    redraw();
  });
  hammertime.on("panend", function(ev) {
    lastDelta = {
      x: 0,
      y: 0
    };
  });

  // 缩放
  var lastScale = 0;
  hammertime.on("pinchmove", function(ev) {
    var size = 0.6;
    if (lastScale > ev.scale) {
      size = -size;
    }
    radar.setZoom(Math.pow(1.1, size));
    lastScale = ev.scale;
    redraw();
  });
  hammertime.on("pinchend", function() {
    lastScale = 0;
  });

  // 鼠标滚轮缩放
  $(".container").on("mousewheel DOMMouseScroll", function(e) {
    var evt = e.originalEvent;
    var delta = evt.wheelDelta
      ? evt.wheelDelta / 40
      : evt.detail
      ? -evt.detail
      : 0;
    if (delta) {
      radar.setZoom(Math.pow(1.1, delta));
      redraw();
    }
    return evt.preventDefault() && false;
  });

  function redraw() {
    radar.clear();

    // 视角追踪
    if (locations.players && locations.players[trackPlayerIndex]) {
      var player = locations.players[trackPlayerIndex];
      radar.setFocus(player.x, player.y);
    }
    // draw map
    radar.map();
    radar.grid();

    drawZone();
    drawItems();
    drawPlayers();
    drawVehicles();
    drawMisc();
  }

  function drawZone() {
    if (!locations.gamestate) {
      return;
    }
    let gamestate = locations.gamestate;
    radar.arc(
      gamestate.spx,
      gamestate.spy,
      gamestate.sr,
      1,
      "rgba(255,255,255,0.5)",
      "rgba(0,0,0,0)"
    );
    radar.arc(
      gamestate.bpx,
      gamestate.bpy,
      gamestate.br,
      1,
      "rgba(0,0,255,0.5)",
      "rgba(0,0,0,0)"
    );
    radar.arc(
      gamestate.rpx,
      gamestate.rpy,
      gamestate.rr,
      1,
      "rgba(120,0,0,0.2)",
      "rgba(120,0,0,0.1)"
    );
  }

  function drawPlayers() {
    if (!locations.players) {
      return;
    }

    var players = locations.players;
    let trackedPlayer = players[trackPlayerIndex];
    let trackedTeam = players[trackPlayerIndex].t;

    // draw indicator
    for (var i = players.length - 1; i >= 0; i--) {
      var player = players[i];
      if (player.t !== trackedTeam && player.hp != 0) {
        // draw indicator
        radar.indicate(trackedPlayer.x, trackedPlayer.y, player.x, player.y);
      }
    }

    // hp == 0
    for (var i = players.length - 1; i >= 0; i--) {
      var player = players[i];
      var color = "";
      if (player.hp == 0) {
        color = "#000000";
        radar.dot(player.x, player.y, color);
      }
    }

    // teammate
    for (var i = players.length - 1; i >= 0; i--) {
      var player = players[i];
      if (i == trackPlayerIndex && player.hp != 0) {
        var color = "#00BB00";
        radar.lineWithAngle(player.x, player.y, 15, 6, player.r, color);
        radar.dot(player.x, player.y, color);
        radar.pieChart(player.x, player.y, (100 - player.hp) / 100, "gray");
        radar.text(player.x, player.y, i + 1, "white");
      } else if (player.t == trackedTeam) {
        var color = "#0033BB";
        radar.lineWithAngle(player.x, player.y, 15, 6, player.r, color);
        radar.dot(player.x, player.y, color);
        radar.pieChart(player.x, player.y, (100 - player.hp) / 100, "gray");
        radar.text(player.x, player.y, i + 1, "white");
      }
    }

    // enemy
    for (var i = players.length - 1; i >= 0; i--) {
      var player = players[i];
      if (player.t != trackedTeam && player.hp != 0) {
        var color = "#FF0000";
        radar.lineWithAngle(player.x, player.y, 15, 6, player.r, color);
        radar.dot(player.x, player.y, color);
        radar.pieChart(player.x, player.y, (100 - player.hp) / 100, "gray");
        // draw player dot text for our enemies
        let rad = Math.atan2(
          player.x - trackedPlayer.x,
          trackedPlayer.y - player.y
        );
        let angle = Math.floor(((360 * rad) / (2 * Math.PI) + 5) / 10);
        angle += angle < 0 ? 36 : 0;
        radar.text(player.x, player.y, angle, "white");
      }
    }
  }

  function drawItems() {
    if (!locations.items) {
      return;
    }
    var items = locations.items;
    for (var i = items.length - 1; i >= 0; i--) {
      var item = items[i];
      radar.text(item.x, item.y, item.n, "red");
    }
  }

  function drawVehicles() {
    if (!locations.vehicles) {
      return;
    }
    var vehicles = locations.vehicles;
    for (var i = vehicles.length - 1; i >= 0; i--) {
      var vehicle = vehicles[i];
      var name = "";
      if (vehicle.v.indexOf("_") >= 0) {
        name = vehicle.v.split("_")[0];
      }
      radar.text(vehicle.x, vehicle.y, name, "orange");
    }
  }

  function drawMisc() {
    radar.floatText(
      0,
      10,
      "Update: " + socketUpdateCounter.getPerSec() + " fps"
    );
  }
});
