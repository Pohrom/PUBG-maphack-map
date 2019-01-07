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
  });
  
  $(function() {
    var radar = new Radar();
    window.radar = radar;
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
      "https://tiles0-v2.pubgmap.net/tiles/erangel/v14/{z}/{x}/{y}.png",
      "https://tiles1-v2.pubgmap.net/tiles/miramar/v8/{z}/{x}/{y}.png",
      "https://tiles0-v2.pubgmap.net/tiles/savage/v5/{z}/{x}/{y}.png"
    ];
    var mapParameter = Utils.getParameterByName("map");
    if (mapParameter === "1") {
      radar.setMap(maps[0]);
    } else if (mapParameter === "2") {
      radar.setMap(maps[1]);
    } else if (mapParameter === "3") {
      radar.setMap(maps[2]);
    } else {
      radar.setMap(maps[Math.random() < 0.5 ? 1 : 0]);
    }
  
    function redraw() {
      radar.clear();
  
      // 视角追踪
      if (locations.players && locations.players[trackPlayerIndex]) {
        var player = locations.players[trackPlayerIndex];
        radar.setFocus(player.x, player.y);
      }
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
        radar.underText(player.x, player.y, player.p);
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
  