/* I keep the terminal commands and game here. */

(function () {
  "use strict";

  var out = document.getElementById("term-out");
  var form = document.getElementById("term-form");
  var input = document.getElementById("term-cmd");
  var board = document.getElementById("term-board");
  var gameStatus = document.getElementById("term-game-status");
  if (!out || !form || !input) return;

  var KN = window.KN || {};

  var who = function () {
    var id = "";
    try { id = localStorage.getItem("kn-subject") || ""; } catch (e) {}
    return (id || "guest").toLowerCase() + "@outpost:~$";
  };
  var dressPrompt = function () {
    var ps = document.querySelector(".term__ps");
    if (ps) ps.textContent = who();
  };
  dressPrompt();

  var print = function (html, cls) {
    var d = document.createElement("div");
    if (cls) d.className = cls;
    d.innerHTML = html;
    out.appendChild(d);
    out.scrollTop = out.scrollHeight;
  };
  var escapeText = function (value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var echo = function (cmd) {
    print('<span class="t-acc">' + escapeText(who()) + "</span> " + escapeText(cmd));
  };

  var W = 10, H = 16;
  var SHAPES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1, 1], [0, 1, 0]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 1, 0], [0, 1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]]
  ];
  var game = null;

  var rotate = function (m) {
    return m[0].map(function (_, i) {
      return m.map(function (row) { return row[i]; }).reverse();
    });
  };
  var collides = function (g, shape, px, py) {
    for (var y = 0; y < shape.length; y++)
      for (var x = 0; x < shape[y].length; x++)
        if (shape[y][x]) {
          var bx = px + x, by = py + y;
          if (bx < 0 || bx >= W || by >= H) return true;
          if (by >= 0 && g.grid[by][bx]) return true;
        }
    return false;
  };
  var spawn = function (g) {
    g.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];

    g.px = Math.floor((W - g.shape[0].length) / 2);
    g.py = 0;
    if (collides(g, g.shape, g.px, g.py)) g.over = true;
  };

  var KICKS = [
    [0, 0],
    [-1, 0], [1, 0], [-2, 0], [2, 0], [-3, 0], [3, 0],
    [0, -1], [-1, -1], [1, -1], [-2, -1], [2, -1],
    [0, -2], [0, -3]
  ];
  var tryRotate = function (g) {
    var rs = rotate(g.shape);
    for (var k = 0; k < KICKS.length; k++) {
      var dx = KICKS[k][0], dy = KICKS[k][1];
      if (!collides(g, rs, g.px + dx, g.py + dy)) {
        g.shape = rs;
        g.px += dx;
        g.py += dy;
        return true;
      }
    }
    return false;
  };
  var lock = function (g) {
    g.shape.forEach(function (row, y) {
      row.forEach(function (v, x) {
        if (v && g.py + y >= 0) g.grid[g.py + y][g.px + x] = 1;
      });
    });
    var kept = g.grid.filter(function (row) {
      return !row.every(function (c) { return c; });
    });
    var cleared = H - kept.length;
    while (kept.length < H) kept.unshift(new Array(W).fill(0));
    g.grid = kept;
    if (cleared) {
      g.lines += cleared;
      g.score += [0, 100, 300, 500, 800][cleared];
    }
    spawn(g);
  };
  var step = function (g) {
    if (!collides(g, g.shape, g.px, g.py + 1)) g.py++;
    else lock(g);
  };
  var draw = function (g) {
    var hi = 0;
    try { hi = parseInt(localStorage.getItem("kn-tris-hi"), 10) || 0; } catch (e) {}
    var s = "KN-TRIS   score " + g.score + "   lines " + g.lines + "   hi " + Math.max(hi, g.score) + "\n";
    s += "┌" + "─".repeat(W * 2) + "┐\n";
    for (var y = 0; y < H; y++) {
      s += "│";
      for (var x = 0; x < W; x++) {
        var v = g.grid[y][x];
        if (!v && g.shape) {
          var sy = y - g.py, sx = x - g.px;
          if (sy >= 0 && sy < g.shape.length && sx >= 0 && sx < g.shape[sy].length && g.shape[sy][sx]) v = 1;
        }
        /* I use two characters per cell to keep the board proportions readable. */
        s += v ? "██" : "  ";
      }
      s += "│\n";
    }
    s += "└" + "─".repeat(W * 2) + "┘";
    var statusText = g.over ? "you lose. press q to close" : "←→ move · ↑ rotate · ↓ fall · space drop · q quit";
    if (gameStatus) {
      gameStatus.textContent = statusText;
      gameStatus.hidden = false;
    } else {
      s += "\n" + statusText;
    }
    board.textContent = s;
  };
  var speed = function (g) { return Math.max(120, 480 - g.lines * 22); };
  var loop = function (g) {
    clearInterval(g.timer);
    g.timer = setInterval(function () {
      if (g.over) { clearInterval(g.timer); draw(g); return; }
      step(g);
      draw(g);
      if (speed(g) !== g.cur) { g.cur = speed(g); loop(g); }
    }, g.cur = speed(g));
  };
  var endGame = function (msg) {
    if (!game) return;
    clearInterval(game.timer);
    try {
      var hi = parseInt(localStorage.getItem("kn-tris-hi"), 10) || 0;
      if (game.score > hi) localStorage.setItem("kn-tris-hi", String(game.score));
    } catch (e) {}
    print(msg + " final score: <span class='t-acc'>" + game.score + "</span> · " + game.lines + " lines.");
    game = null;
    board.hidden = true;
    if (gameStatus) gameStatus.hidden = true;

    input.disabled = false;
    input.placeholder = "";
    input.focus();
  };
  var startGame = function () {
    if (game) return;
    game = { grid: [], score: 0, lines: 0, over: false };
    for (var y = 0; y < H; y++) game.grid.push(new Array(W).fill(0));
    spawn(game);
    board.hidden = false;
    draw(game);
    loop(game);
    /* I reserve the keyboard for the game until it closes. */
    input.blur();
    input.disabled = true;
    input.placeholder = "KN-TRIS running - press q to quit";
  };

  document.addEventListener("keydown", function (e) {
    if (!game) return;
    if (e.key === "q" || e.key === "Q" || e.key === "Escape") {
      endGame(game.over ? "" : "aborted.");
      e.preventDefault();
      return;
    }
    if (game.over) return;
    var g = game;
    switch (e.key) {
      case "ArrowLeft":
        if (!collides(g, g.shape, g.px - 1, g.py)) g.px--;
        break;
      case "ArrowRight":
        if (!collides(g, g.shape, g.px + 1, g.py)) g.px++;
        break;
      case "ArrowUp":
      case "x":
      case "X":
        tryRotate(g);
        break;
      case "ArrowDown":
        step(g);
        break;
      case " ":
        while (!collides(g, g.shape, g.px, g.py + 1)) g.py++;
        lock(g);
        break;
      default:
        return;
    }
    draw(g);
    if (g.over) endGame("stack breached containment.");
    e.preventDefault();
  });

  var resetOutput = function () {
    out.innerHTML = "";
    print("KN/TERM ready. type <span class='t-acc'>help</span>. or do not.", "t-dim");
    out.scrollTop = 0;
  };

  var CMDS = {
    help: function () {
      print("commands: <span class='t-acc'>help · play · whoami · subject · date · ls · discord · clear · exit</span>");
    },
    logout: function () { print("subjects are not released."); },
    play: function () { startGame(); },
    tetris: function () { startGame(); },
    whoami: function () {
      var id = "";
      try { id = localStorage.getItem("kn-subject") || ""; } catch (e) {}
      print(id
        ? "subject <span class='t-acc'>" + id + "</span>. clearance: none. designation permanent."
        : "unregistered. refresh to receive a designation.");
    },
    subject: function () {
      var id = "", burned = [];
      try {
        id = localStorage.getItem("kn-subject") || "";
        burned = JSON.parse(localStorage.getItem("kn-subject-burned") || "[]");
      } catch (e) {}
      if (!id) { print("no designation on file."); return; }
      print("designation .... <span class='t-acc'>" + id + "</span>");
      print("status ......... active");
      print("issued ......... this terminal");
      if (burned.length > 1) {
        print("burned here .... " + burned.filter(function (b) { return b !== id; }).join(", "));
      }
      print("the designation cannot be changed or surrendered.", "t-dim");
    },
    date: function () { print(new Date().toString() + " <span class='t-dim'>(the outpost keeps its own time)</span>"); },
    ls: function () { print("games/  logs/  art/  <span class='t-dim'>secrets/</span>"); },
    secrets: function () { print("permission denied."); },
    discord: function () {
      print("opening the channel...");
      window.open(KN.discord || "#", "_blank", "noopener");
    },
    clear: resetOutput,
    exit: function () { print("there is no exit. close the tab like everyone else."); },
    hello: function () { print("hey."); },
    hi: function () { print("hey."); }
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var raw = input.value.trim();
    input.value = "";
    if (!raw) return;
    echo(raw);
    var cmd = raw.toLowerCase().split(/\s+/)[0];
    if (cmd === "sudo") { print("no."); return; }
    if (cmd === "rm") { print("the site is load-bearing. request denied."); return; }
    if (cmd === "cat" || cmd === "cd") {
      print(/secret/.test(raw) ? "permission denied." : "nothing readable there.");
      return;
    }
    if (Object.prototype.hasOwnProperty.call(CMDS, cmd)) CMDS[cmd]();
    else print("unknown command: " + escapeText(cmd) + " - try <span class='t-acc'>help</span>");
  });

  document.addEventListener("kn:subject", dressPrompt);

  resetOutput();
})();
