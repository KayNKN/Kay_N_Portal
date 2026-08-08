/* KN/OS - chrome + rendering. content lives in content.js, not here. */

(function () {
  "use strict";

  var KN = window.KN || {};
  var pad = function (n) { return String(n).padStart(2, "0"); };

  /* ═══ boot sequence (homepage, once per session) ═══════
     Held back until access control is satisfied - an unregistered
     visitor registers first, then the machine boots. */
  var boot = document.getElementById("boot");
  var runBoot = function () {
    if (!boot || !boot.parentNode) return;
    var pre = document.getElementById("boot-text");
    var seen = false;
    try { seen = sessionStorage.getItem("kn-booted") === "1"; } catch (e) {}
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* plain boot readout. the counts are real - they come from content.js,
       so the numbers move when I add a log entry or ship a game. */
    var line = function (label, value, cls) {
      var dots = ".".repeat(Math.max(3, 24 - label.length));
      return label + ' <span class="b-dim">' + dots + "</span> " +
             '<span class="' + (cls || "b-ok") + '">' + value + "</span>";
    };
    var LINES = [
      '<span class="b-dim">KN/OS 0.1.0 - signal outpost</span>',
      '<span class="b-dim">' + "─".repeat(32) + "</span>",
      "",
      line("mount /dev/archive", "ok"),
      line("load transmissions", String((KN.logs || []).length)),
      line("load builds", String((KN.games || []).length)),
      line("open channel", "ok"),
      line("integrity check", "anomaly", "b-warn"),
      "",
      '<span class="b-ok">ready.</span>'
    ];
    var PROMPT = '\n<span class="b-acc">kay_n@outpost:~$</span> <span class="b-cur">█</span>';

    var bootDone = function () {
      boot.classList.add("boot--out");
      setTimeout(function () { boot.remove(); }, 500);
      try { sessionStorage.setItem("kn-booted", "1"); } catch (e) {}
    };

    if (seen) {
      boot.remove();
    } else if (still) {
      pre.innerHTML = LINES.join("\n") + PROMPT;
      setTimeout(bootDone, 800);
    } else {
      var i = 0;
      var typer = setInterval(function () {
        i++;
        pre.innerHTML = LINES.slice(0, i).join("\n") +
          (i < LINES.length ? '<span class="b-cur">█</span>' : "");
        if (i >= LINES.length) {
          clearInterval(typer);
          pre.innerHTML = LINES.join("\n") + PROMPT;
          setTimeout(bootDone, 560);
        }
      }, 110);
    }
  };

  /* ═══ status bar ═══════════════════════════════════════ */
  var clockEl = document.getElementById("clock");
  if (clockEl) {
    var tick = function () {
      var d = new Date();
      clockEl.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    };
    tick();
    setInterval(tick, 1000);
  }

  /* signal meter - drifts, drops out rarely, always recovers.
     Runs regardless of reduced-motion: it is a discrete readout,
     and freezing it reads as broken. */
  var sigEl = document.getElementById("sig-bars");
  if (sigEl) {
    var BARS = 4;
    var level = 3;
    var paint = function () {
      var s = "";
      for (var b = 0; b < BARS; b++) s += b < level ? "<b>▮</b>" : "<i>▯</i>";
      sigEl.innerHTML = s;
      sigEl.parentNode.classList.toggle("statusbar__sig--lost", level === 0);
    };
    paint();
    setInterval(function () {
      var r = Math.random();
      if (level === 0) level = 2;                    /* it always comes back */
      else if (r < 0.06) level = 0;                  /* rare dropout */
      else if (r < 0.5) level = Math.max(1, level - 1);
      else if (r < 0.95) level = Math.min(BARS, level + 1);
      paint();
    }, 900);
  }

  var counterEl = document.getElementById("visit-counter");
  if (counterEl) {
    try {
      var visits = (parseInt(localStorage.getItem("kn-visits"), 10) || 0) + 1;
      localStorage.setItem("kn-visits", String(visits));
      counterEl.textContent = "your visits: " + visits;
    } catch (e) {
      counterEl.textContent = "your visits: ?";
    }
  }

  /* ═══ subject registration ═════════════════════════════
     Permanent, per-browser. No logout by design. Used designations
     go on a burn list so a dropped one can never be reclaimed.
     Uniqueness is per-browser only - a static site has no server
     to check other visitors against. */
  var SUBJ = "kn-subject", BURNED = "kn-subject-burned";

  var readSubject = function () {
    try { return localStorage.getItem(SUBJ) || ""; } catch (e) { return ""; }
  };
  var readBurned = function () {
    try { return JSON.parse(localStorage.getItem(BURNED) || "[]"); } catch (e) { return []; }
  };
  var paintSubject = function (id) {
    var cell = document.getElementById("subject-cell");
    if (!cell) return;
    if (!id) { cell.hidden = true; return; }
    cell.hidden = false;
    cell.textContent = "subject: " + id;
    cell.title = "designation " + id + " - permanent";
  };

  /* the subject types only their own part; SUBJ- is fixed and shown to
     them in the field, so every designation reads SUBJ-XXXX */
  var PREFIX = "SUBJ-";
  /* Claim a designation in the shared registry. The id is the table's
     primary key, so two people racing for the same name is settled by
     the database itself: the loser gets a 409.
     "ok" | "taken" | "skip" (not set up) | "down" (unreachable).
     A registry that is down must never lock anyone out, so "down"
     falls back to the per-browser checks. */
  var claimRemote = function (id) {
    /* accept the bare project URL or one that already ends in /rest/v1 */
    var base = (KN.supabaseUrl || "").replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
    var key = KN.supabaseKey || "";
    if (!base || !key) return Promise.resolve("skip");
    var headers = {
      apikey: key,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    };
    /* legacy anon keys are JWTs and also want an Authorization header;
       the newer sb_publishable_... keys are resolved from apikey alone */
    if (key.indexOf("eyJ") === 0) headers.Authorization = "Bearer " + key;
    return fetch(base + "/rest/v1/subjects", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ id: id })
    }).then(function (res) {
      if (res.status === 201 || res.status === 200) return "ok";
      if (res.status === 409) return "taken";
      return "down";
    }).catch(function () { return "down"; });
  };

  var checkId = function (raw) {
    var tail = String(raw || "").trim().toUpperCase().replace(/\s+/g, "_");
    if (!tail) return { err: "designation required." };
    if (tail.length < 2) return { err: "too short - 2 characters minimum." };
    if (tail.length > 12) return { err: "too long - 12 characters maximum." };
    if (!/^[A-Z0-9_\-]+$/.test(tail)) return { err: "permitted: A-Z 0-9 _ - only." };
    var id = PREFIX + tail;
    if (readBurned().indexOf(id) !== -1) {
      return { err: id + " is burned. it cannot be reissued." };
    }
    return { id: id };
  };

  var gate = document.getElementById("gate");
  var openGate = function () {
    if (!gate) return;
    var head = document.getElementById("gate-head");
    var input = document.getElementById("gate-input");
    var err = document.getElementById("gate-err");
    var form = document.getElementById("gate-form");

    var LINES = [
      "KN/OS - ACCESS CONTROL",
      "──────────────────────────────",
      "unregistered visitor detected.",
      "everyone who passes through here is",
      "logged as a subject.",
      "",
      "state your designation."
    ];
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    gate.hidden = false;
    document.body.style.overflow = "hidden";

    var ready = function () {
      input.focus();
    };
    if (still) {
      head.textContent = LINES.join("\n");
      ready();
    } else {
      var i = 0;
      var t = setInterval(function () {
        head.textContent = LINES.slice(0, ++i).join("\n");
        if (i >= LINES.length) { clearInterval(t); ready(); }
      }, 90);
    }

    input.addEventListener("input", function () { err.textContent = ""; });

    var submitBtn = form.querySelector('button[type="submit"]');
    var busy = false;

    var admit = function (id) {
      var burned = readBurned();
      burned.push(id);
      try {
        localStorage.setItem(SUBJ, id);
        localStorage.setItem(BURNED, JSON.stringify(burned));
      } catch (e2) { /* private mode: it holds for this session only */ }
      paintSubject(id);
      document.dispatchEvent(new CustomEvent("kn:subject", { detail: id }));
      gate.classList.add("gate--out");
      setTimeout(function () {
        gate.remove();
        /* unlock the site, then let the machine boot */
        document.documentElement.classList.remove("gated");
        document.body.style.overflow = "";
        runBoot();
      }, 380);
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy) return;
      busy = true;
      err.textContent = "";
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "checking…"; }

      var res = checkId(input.value);
      if (res.err) {
        busy = false;
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "register"; }
        err.textContent = res.err;
        input.focus();
        return;
      }

      claimRemote(res.id).then(function (verdict) {
        busy = false;
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "register"; }
        if (verdict === "taken") {
          err.textContent = res.id + " is already assigned to another subject.";
          input.focus();
          return;
        }
        admit(res.id);
      });
    });
  };

  /* access control first, always. registered visitors go straight to the
     boot; unregistered ones see nothing of the site until they register. */
  if (readSubject()) {
    paintSubject(readSubject());
    document.documentElement.classList.remove("gated");
    runBoot();
  } else {
    document.documentElement.classList.add("gated");
    openGate();
  }

  /* ═══ nav separators ═══════════════════════════════════
     a drawn rule between each button, added here so the markup
     stays clean and every page gets it automatically. */
  document.querySelectorAll(".deck").forEach(function (nav) {
    var links = [].slice.call(nav.querySelectorAll("a"));
    links.forEach(function (a, i) {
      if (i === 0) return;
      var sep = document.createElement("span");
      sep.className = "deck__sep";
      sep.textContent = "──";
      sep.setAttribute("aria-hidden", "true");
      nav.insertBefore(sep, a);
    });
  });

  /* ═══ rendering helpers ════════════════════════════════ */
  var DAY = 86400000;
  var daysSince = function (iso) {
    return Math.max(0, Math.round((Date.now() - new Date(iso + "T00:00:00").getTime()) / DAY));
  };
  var agoText = function (d) {
    return d === 0 ? "today" : d === 1 ? "yesterday" :
           d < 60 ? d + " days ago" : Math.round(d / 30) + " months ago";
  };
  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var prettyDate = function (iso) {
    var p = iso.split("-");
    return "[" + p[2] + " " + MON[+p[1] - 1] + " " + p[0] + "]";
  };
  var el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  var isPh = function (s) { return /^\s*\[/.test(s || ""); };
  var phify = function (node, text) {
    node.textContent = text;
    node.classList.toggle("ph", isPh(text));
    return node;
  };
  /* ── media ────────────────────────────────────────────────
     a media field takes one item or a list of them. each item is
     either a path/URL string or { src, caption }. the kind is worked
     out from the file extension, so I never declare it:
       image  .png .jpg .gif .webp .avif
       video  .mp4 .webm .mov .m4v
       audio  .mp3 .wav .ogg .m4a .flac
       youtube  any youtube.com / youtu.be link
     more than one item gets a thumbnail strip under the stage. */
  var srcOf = function (item) {
    return typeof item === "string" ? item : (item && item.src) || "";
  };
  var capOf = function (item) {
    return (item && typeof item === "object" && item.caption) || "";
  };
  var kindOf = function (src) {
    if (/(?:youtube\.com|youtu\.be)/i.test(src)) return "youtube";
    if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(src)) return "video";
    if (/\.(mp3|wav|ogg|oga|m4a|aac|flac)(\?|#|$)/i.test(src)) return "audio";
    return "image";
  };
  var ytId = function (src) {
    var m = String(src).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_\-]{6,})/);
    return m ? m[1] : "";
  };
  var clock = function (s) {
    return isFinite(s) ? Math.floor(s / 60) + ":" + pad(Math.floor(s % 60)) : "0:00";
  };

  /* audio: built by hand so it matches the terminal instead of the browser */
  var buildAudio = function (src, cap) {
    var wrap = el("div", "aud");
    var audio = document.createElement("audio");
    audio.src = src;
    audio.preload = "metadata";
    var btn = el("button", "aud__btn", "▶");
    btn.type = "button";
    btn.setAttribute("aria-label", "play");
    var mid = el("div", "aud__mid");
    var name = el("div", "aud__name", cap || src.split("/").pop());
    var bar = el("div", "aud__bar");
    var fill = el("div", "aud__fill");
    bar.appendChild(fill);
    mid.appendChild(name);
    mid.appendChild(bar);
    var time = el("span", "aud__time", "0:00 / 0:00");
    var sync = function () {
      var d = audio.duration || 0;
      fill.style.width = d ? (audio.currentTime / d * 100) + "%" : "0%";
      time.textContent = clock(audio.currentTime) + " / " + clock(d);
    };
    btn.addEventListener("click", function () {
      if (audio.paused) audio.play(); else audio.pause();
    });
    audio.addEventListener("play", function () {
      btn.textContent = "❚❚"; btn.setAttribute("aria-label", "pause");
    });
    var stopped = function () {
      btn.textContent = "▶"; btn.setAttribute("aria-label", "play");
    };
    audio.addEventListener("pause", stopped);
    audio.addEventListener("ended", stopped);
    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("loadedmetadata", sync);
    var seek = function (e) {
      var r = bar.getBoundingClientRect();
      if (audio.duration) {
        audio.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * audio.duration;
      }
    };
    bar.addEventListener("click", seek);
    wrap.appendChild(btn);
    wrap.appendChild(mid);
    wrap.appendChild(time);
    wrap.appendChild(audio);
    return wrap;
  };

  /* Nothing is requested from Google until the visitor clicks.
     On file:// YouTube refuses to embed (error 153), so there we open
     the video in a tab instead. Serve over http to test embeds. */
  var offline = location.protocol === "file:";
  /* once a visitor has started a video, expanding it should carry on
     playing rather than hand them a fresh unplayed panel */
  var started = {};

  var ytFrame = function (id, cap, autoplay) {
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + id +
            "?rel=0&playsinline=1" + (autoplay ? "&autoplay=1" : "");
    f.title = cap || "video";
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture";
    f.allowFullscreen = true;
    f.referrerPolicy = "strict-origin-when-cross-origin";
    f.setAttribute("frameborder", "0");
    return f;
  };

  var buildYouTube = function (src, cap) {
    var id = ytId(src);
    var box = el("div", "ytbox");
    var wrap = el("div", "yt");
    box.appendChild(wrap);

    if (started[id] && !offline) {
      wrap.appendChild(ytFrame(id, cap, false));
      return box;
    }

    var btn = el("button", "yt__play");
    btn.type = "button";
    btn.setAttribute("aria-label", "play this YouTube video");
    btn.appendChild(el("span", "yt__tri", "▶"));
    btn.appendChild(el("span", "yt__lbl", cap || "play video"));
    btn.addEventListener("click", function (ev) {
      /* this button removes itself below, so keep the click from
         reaching any collapsible parent once it is detached */
      ev.stopPropagation();
      if (offline) {
        window.open("https://www.youtube.com/watch?v=" + id, "_blank", "noopener");
        return;
      }
      started[id] = true;
      wrap.innerHTML = "";
      wrap.appendChild(ytFrame(id, cap, true));
    });
    wrap.appendChild(btn);
    return box;
  };

  var buildOne = function (item, alt) {
    var src = srcOf(item), cap = capOf(item), k = kindOf(src);
    var node;
    if (k === "youtube") return buildYouTube(src, cap);
    if (k === "audio") return buildAudio(src, cap);
    if (k === "video") {
      node = document.createElement("video");
      node.src = src;
      node.controls = true;
      node.playsInline = true;
      node.preload = "metadata";
    } else {
      node = document.createElement("img");
      node.src = src;
      node.alt = cap || alt || "";
      node.loading = "lazy";
      node.decoding = "async";
    }
    if (!cap) return node;
    var box = el("div", "gal__wrap");
    box.appendChild(node);
    box.appendChild(el("p", "gal__cap", cap));
    return box;
  };

  /* ── maximise ─────────────────────────────────────────────
     A gallery grows to fill the screen in place. Nothing is copied
     or reparented, because moving an iframe reloads it and a second
     player would leave the first one running underneath. */
  var maxed = null;

  var unmaximise = function () {
    if (!maxed) return;
    maxed.classList.remove("is-max");
    document.body.style.overflow = "";
    var btn = maxed.querySelector(".gal__expand");
    if (btn) { btn.textContent = "⤢"; btn.title = "expand"; }
    maxed = null;
  };

  var maximise = function (gal) {
    if (maxed === gal) { unmaximise(); return; }
    unmaximise();
    maxed = gal;
    gal.classList.add("is-max");
    document.body.style.overflow = "hidden";
    var btn = gal.querySelector(".gal__expand");
    if (btn) { btn.textContent = "✕"; btn.title = "close"; }
  };

  /* capture phase so the tetris handler never sees these keys */
  document.addEventListener("keydown", function (e) {
    if (!maxed) return;
    if (e.key === "Escape") unmaximise();
    else if (e.key === "ArrowLeft") maxed.__prev && maxed.__prev();
    else if (e.key === "ArrowRight") maxed.__next && maxed.__next();
    else return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  /* run once the browser has a spare moment */
  var idle = function (fn) {
    if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 2500 });
    else setTimeout(fn, 900);
  };

  /* hold off building a gallery until it is near the viewport, so a page
     of clips does not pull every file down at once */
  var whenVisible = function (node, run) {
    if (!("IntersectionObserver" in window)) { run(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); run(); }
    }, { rootMargin: "300px" });
    io.observe(node);
  };

  var mediaInto = function (holder, media, alt) {
           /* "" keeps the empty slot */
    var items = (Array.isArray(media) ? media : [media]).filter(function (m) {
      return srcOf(m);
    });
    if (!items.length) return;
    whenVisible(holder, function () { buildGallery(holder, items, alt); });
  };

  var buildGallery = function (holder, items, alt) {
    holder.innerHTML = "";

    var many = items.length > 1;
    var gal = el("div", "gal");
    var stage = el("div", "gal__stage");
    var at = 0;
    var thumbs = [];

    /* expand button - always available, whatever the media is */
    var expand = el("button", "gal__expand", "⤢");
    expand.type = "button";
    expand.title = "expand";
    expand.setAttribute("aria-label", "expand");
    expand.addEventListener("click", function (e) {
      e.stopPropagation();
      maximise(gal);
    });

    var prev = el("button", "gal__arrow gal__arrow--prev", "‹");
    var next = el("button", "gal__arrow gal__arrow--next", "›");
    [prev, next].forEach(function (b) { b.type = "button"; });
    prev.setAttribute("aria-label", "previous");
    next.setAttribute("aria-label", "next");
    var count = el("span", "gal__count");

    var show = function (i) {
      at = (i + items.length) % items.length;
      stage.innerHTML = "";
      stage.dataset.kind = kindOf(srcOf(items[at]));
      var node = buildOne(items[at], alt);
      stage.appendChild(node);
      /* clicking a still image blows it up */
      var img = node.tagName === "IMG" ? node : node.querySelector && node.querySelector("img");
      if (img) {
        img.classList.add("is-zoomable");
        img.addEventListener("click", function () { maximise(gal); });
        /* now that this item is on screen, give its thumb a real preview */
        var tb = thumbs[at];
        if (tb && !tb.style.backgroundImage) {
          tb.style.backgroundImage = 'url("' + srcOf(items[at]).replace(/"/g, "%22") + '")';
          tb.textContent = "";
        }
      }
      stage.appendChild(expand);
      if (many) {
        stage.appendChild(prev);
        stage.appendChild(next);
        stage.appendChild(count);
        count.textContent = (at + 1) + " / " + items.length;
      }
      thumbs.forEach(function (t, j) { t.classList.toggle("is-on", at === j); });
    };

    prev.addEventListener("click", function (e) { e.stopPropagation(); show(at - 1); });
    next.addEventListener("click", function (e) { e.stopPropagation(); show(at + 1); });
    /* let the keyboard drive this gallery while it is maximised */
    gal.__prev = function () { show(at - 1); };
    gal.__next = function () { show(at + 1); };
    /* clicking the backdrop around the media closes the maximised view */
    gal.addEventListener("click", function (e) {
      if (e.target === gal && gal.classList.contains("is-max")) unmaximise();
    });

    gal.appendChild(stage);

    if (many) {
      var strip = el("div", "gal__strip");
      items.forEach(function (item, i) {
        var src = srcOf(item), k = kindOf(src);
        var t = el("button", "gal__thumb gal__thumb--" + k);
        t.type = "button";
        t.title = capOf(item) || src.split("/").pop();
        if (k === "image") {
          /* previews cost a full-size download, so the active one loads
             now and the rest wait until the browser is idle - they show
             up on their own without holding up first paint */
          if (i === 0) {
            t.style.backgroundImage = 'url("' + src.replace(/"/g, "%22") + '")';
          } else {
            t.textContent = String(i + 1);
            idle(function () {
              t.style.backgroundImage = 'url("' + src.replace(/"/g, "%22") + '")';
              t.textContent = "";
            });
          }
        } else {
          t.textContent = k === "audio" ? "♪" : "▶";
        }
        t.addEventListener("click", function () { show(i); });
        thumbs.push(t);
        strip.appendChild(t);
      });
      gal.appendChild(strip);
    }

    show(0);
    holder.appendChild(gal);
  };
  var logRow = function (entry) {
    var li = el("li", "log__row");
    var t = el("time", "log__date", prettyDate(entry.date));
    t.setAttribute("datetime", entry.date);
    li.appendChild(t);
    li.appendChild(el("span", "tag tag--" + (entry.tag || "misc"), entry.tag || "misc"));
    var a = el("a", "log__link");
    phify(a, entry.title);
    a.href = entry.url || "log.html";
    li.appendChild(a);
    li.appendChild(el("span", "log__ago", agoText(daysSince(entry.date))));
    return li;
  };

  /* ═══ shared chrome from content.js ════════════════════ */
  document.querySelectorAll(".js-tagline").forEach(function (n) { phify(n, KN.tagline || ""); });
  document.querySelectorAll(".js-discord").forEach(function (n) { n.href = KN.discord || "#"; });
  //document.querySelectorAll(".js-itch").forEach(function (n) {
  //  n.href = KN.itch || "#";
  //  n.target = "_blank";
  //  n.rel = "noopener";
  //});

  /* top-bar socials: wire the link, or drop the button if there's no
     URL in content.js - better an absent button than a dead one */
  [["js-twitter", KN.twitter], ["js-youtube", KN.youtube]].forEach(function (pair) {
    document.querySelectorAll("." + pair[0]).forEach(function (n) {
      var url = (pair[1] || "").trim();
      if (!url || url === "#") {
        /* take its separator with it, or we leave a dangling rule */
        var sep = n.previousElementSibling;
        if (sep && sep.classList.contains("deck__sep")) sep.remove();
        n.remove();
        return;
      }
      n.href = url;
    });
  });
  /* the address is shown, never linked - no mailto, nothing to click */
  document.querySelectorAll(".js-mail").forEach(function (n) {
    n.textContent = (KN.mail || "").replace(/^mailto:/i, "");
  });

  var lastTx = document.getElementById("last-tx");
  if (lastTx && KN.logs && KN.logs.length) {
    lastTx.textContent = agoText(daysSince(KN.logs[0].date));
  }

  /* ═══ lore streams ═════════════════════════════════════
     Four columns of system chatter drifting through the margins.
     Each column gets its own shuffled order, direction and speed,
     so nothing ever lines up. The list is doubled inside each
     column and the animation travels exactly -50%, which makes
     the loop seamless. */
  var bgfx = document.querySelector(".bgfx");
  if (bgfx && (KN.lore || []).length) {
    var LORE = KN.lore.slice();
    var mark = function (s) {
      /* *starred* fragments come out red */
      return String(s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/\*([^*]+)\*/g, "<i>$1</i>");
    };
    var shuffled = function () {
      var a = LORE.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    };
    /* The loop travels -50%, so half a column must cover the screen or
       the tail leaves a gap. Repeat the list until it does, then double. */
    var LINE_H = 25;                                   /* 10px × 2.5 line-height */
    var tall = Math.max(window.innerHeight, screen.height || 0, 900) * 1.3;
    var perHalf = Math.max(1, Math.ceil(tall / (LORE.length * LINE_H)));

    [
      { cls: "stream--l1", dur: 74, down: false },
      { cls: "stream--l2", dur: 96, down: true },
      { cls: "stream--r1", dur: 82, down: true },
      { cls: "stream--r2", dur: 110, down: false }
    ].forEach(function (col) {
      var half = [];
      for (var c = 0; c < perHalf; c++) half = half.concat(shuffled());
      var col_ = el("div", "stream " + col.cls + (col.down ? " stream--down" : ""));
      col_.innerHTML = half.concat(half).map(function (l) {
        return "<div>" + mark(l) + "</div>";
      }).join("");
      /* keep the speed per-pixel consistent however long the column is */
      col_.style.animationDuration = (col.dur * perHalf) + "s";
      col_.style.animationDelay = "-" + Math.floor(Math.random() * col.dur) + "s";
      bgfx.appendChild(col_);
    });
  }

  /* ═══ homepage ═════════════════════════════════════════ */
  var homeLog = document.getElementById("home-log");
  if (homeLog && KN.logs) {
    KN.logs.slice(0, 5).forEach(function (e) { homeLog.appendChild(logRow(e)); });
  }

  var wbName = document.getElementById("wb-name");
  if (wbName && KN.project) {
    wbName.textContent = KN.project.name || "UNTITLED";
    phify(document.getElementById("wb-pitch"), KN.project.pitch || "");
    mediaInto(document.getElementById("wb-media"), KN.project.media, KN.project.name);
  }

  /* protocol monitor - gives the workbench column something to say */
  var mon = document.getElementById("wb-monitor");
  if (mon) {
    var since = KN.logs && KN.logs.length ? daysSince(KN.logs[0].date) : null;
    var rows = [
      ['<span class="mon__live">status</span>', "Developed"],
      ["designation", '<b id="mon-subj"></b>'],
      ["records", "<b>" + ((KN.logs || []).length) + "</b> transmissions"],
      ["last entry", "<b>" + (since === null ? "-" : agoText(since)) + "</b>"]
    ];
    mon.innerHTML =
      '<div class="mon__title">protocol monitor</div>' +
      rows.map(function (r) {
        return '<div class="mon__row">' + r[0] +
               ' <span class="mon__dots">·····</span> ' + r[1] + "</div>";
      }).join("") +
      '<div class="mon__foot"><span class="mon__rot" id="mon-rot"></span></div>';

    /* this panel is built before the gate is answered, so pick the
       designation up again once one has been issued */
    var monSubj = document.getElementById("mon-subj");
    var showSubj = function () {
      monSubj.textContent = readSubject() || "UNREGISTERED";
    };
    showSubj();
    document.addEventListener("kn:subject", showSubj);

    /* the bottom line cycles through the same lore as the margins */
    var rot = document.getElementById("mon-rot");
    var pool = (KN.lore || []).slice();
    if (rot && pool.length) {
      var at = Math.floor(Math.random() * pool.length);
      var say = function () {
        rot.innerHTML = String(pool[at % pool.length])
          .replace(/&/g, "&amp;").replace(/</g, "&lt;")
          .replace(/\*([^*]+)\*/g, "<i>$1</i>");
        at++;
      };
      say();
      setInterval(function () {
        rot.classList.add("is-swap");
        setTimeout(function () { say(); rot.classList.remove("is-swap"); }, 400);
      }, 4200);
    }
  }

  var shelf = document.getElementById("Protocols-shelf");
  if (shelf && KN.games) {
    KN.games.forEach(function (g) {
      var li = el("li");
      var a = el("a", "cart");
      a.href = "games.html";
      a.appendChild(el("span", "cart__ridges"));
      var lab = el("span", "cart__label");
      lab.appendChild(el("span", "cart__year", g.year || ""));
      lab.appendChild(phify(el("span", "cart__name"), g.title));
      lab.appendChild(phify(el("span", "cart__desc"), g.desc || ""));
      var tags = el("span", "cart__tags");
      (g.tags || []).forEach(function (t) { tags.appendChild(el("i", null, t)); });
      lab.appendChild(tags);
      a.appendChild(lab);
      li.appendChild(a);
      shelf.appendChild(li);
    });
    /* waiting slots - count and wording both come from content.js */
    var d = KN.Protocols || {};
    var slots = d.emptySlots === undefined ? 1 : d.emptySlots;
    for (var s = 0; s < slots; s++) {
      var li2 = el("li");
      var empty = el("span", "cart cart--empty");
      empty.appendChild(el("span", "cart__ridges"));
      var lab2 = el("span", "cart__label");
      lab2.appendChild(el("span", "cart__year", d.emptyYear || "SOON"));
      lab2.appendChild(el("span", "cart__name", d.emptyTitle || "empty slot"));
      lab2.appendChild(el("span", "cart__desc", d.emptyNote || "the next one goes here"));
      empty.appendChild(lab2);
      li2.appendChild(empty);
      shelf.appendChild(li2);
    }
  }

  /* ═══ log archive page ═════════════════════════════════
     Each entry is its own dropdown. The panel lives inside that
     entry's <li>, so entries can never show each other's content.
     Contents build on first open. */
  var archiveRow = function (entry) {
    var li = logRow(entry);
    var detailed = !!(entry.desc || entry.media);

    /* a caret column on every row - empty when there is nothing to
       open - so the dates stay aligned all the way down */
    var caret = el("span", "log__caret", detailed ? "▸" : "");
    li.insertBefore(caret, li.firstChild);
    if (!detailed) return li;

    li.classList.add("is-expandable");
    /* with no real link to follow, clicking the title should open the
       entry instead of navigating */
    var link = li.querySelector(".log__link");
    if (link && !entry.url) link.removeAttribute("href");

    var detail = el("div", "log__detail");
    detail.hidden = true;
    li.appendChild(detail);

    var built = false;
    var toggle = function () {
      var opening = detail.hidden;
      if (opening && !built) {
        built = true;
        if (entry.desc) detail.appendChild(phify(el("p", "log__desc"), entry.desc));
        if (entry.media) {
          var m = el("div", "log__media");
          mediaInto(m, entry.media, entry.title);
          detail.appendChild(m);
        }
      }
      detail.hidden = !opening;
      li.classList.toggle("is-open", opening);
      caret.textContent = opening ? "▾" : "▸";
      li.setAttribute("aria-expanded", opening ? "true" : "false");
    };

    li.setAttribute("role", "button");
    li.setAttribute("aria-expanded", "false");
    li.tabIndex = 0;
    li.addEventListener("click", function (ev) {
      /* Real links and anything inside the open panel behave normally.
         Walk the dispatch path rather than the live DOM: controls that
         replace themselves (the video play button) are already detached
         by the time this runs, and closest() would miss them. */
      var path = (ev.composedPath && ev.composedPath()) || [];
      for (var i = 0; i < path.length; i++) {
        var n = path[i];
        if (n === li) break;
        if (n.nodeType !== 1) continue;
        if (n.classList.contains("log__detail")) return;
        if (n.tagName === "A" && n.hasAttribute("href")) return;
      }
      toggle();
    });
    li.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toggle(); }
    });
    return li;
  };

  var archive = document.getElementById("archive");
  if (archive && KN.logs) {
    var year = null, list = null;
    KN.logs.forEach(function (e) {
      var y = e.date.slice(0, 4);
      if (y !== year) {
        year = y;
        archive.appendChild(el("p", "log__year", "- " + y + " -"));
        list = el("ol", "log");
        archive.appendChild(list);
      }
      list.appendChild(archiveRow(e));
    });
  }

  /* ── downloads ────────────────────────────────────────────
     A game can ship one build or several. Accepts either:
       download:  "downloads/game.zip"                      (one)
       downloads: { windows: "...zip", linux: "...tar.gz" }  (menu)
       downloads: [ { os:"windows", file:"...", size:"240 MB" }, ... ]
     One build renders a plain button; several render a dropdown. */
  var buildList = function (g) {
    var out = [];
    var d = g.downloads;
    if (Array.isArray(d)) {
      d.forEach(function (x) {
        if (x && (x.file || x.url)) {
          out.push({ os: x.os || x.name || "download", file: x.file || x.url, size: x.size || "" });
        }
      });
    } else if (d && typeof d === "object") {
      Object.keys(d).forEach(function (k) {
        var v = d[k];
        if (!v) return;
        if (typeof v === "string") out.push({ os: k, file: v, size: "" });
        else if (v.file || v.url) out.push({ os: k, file: v.file || v.url, size: v.size || "" });
      });
    }
    if (!out.length && g.download) out.push({ os: "download", file: g.download, size: "" });
    return out;
  };

  var buildMenu = function (builds) {
    var wrap = el("span", "dlmenu");
    var btn = el("button", "btn btn--dl", "▼ download build");
    btn.type = "button";
    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-expanded", "false");
    var list = el("div", "dlmenu__list");
    list.hidden = true;

    builds.forEach(function (b) {
      var a = el("a", "dlmenu__item");
      a.href = b.file;
      a.setAttribute("download", "");
      a.appendChild(el("span", "dlmenu__os", b.os));
      a.appendChild(el("span", "dlmenu__sz", b.size || ""));
      list.appendChild(a);
    });

    var close = function () {
      list.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    };
    var open = function () {
      /* only one menu open at a time */
      document.querySelectorAll(".dlmenu__list").forEach(function (o) { o.hidden = true; });
      list.hidden = false;
      btn.setAttribute("aria-expanded", "true");
    };
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (list.hidden) open(); else close();
    });
    list.addEventListener("click", function (e) { e.stopPropagation(); });
    document.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !list.hidden) { close(); btn.focus(); }
    });

    wrap.appendChild(btn);
    wrap.appendChild(list);
    return wrap;
  };

  /* ═══ games page ═══════════════════════════════════════ */
  var releases = document.getElementById("releases");
  if (releases && KN.games) {
    KN.games.forEach(function (g) {
      var sec = el("section", "panel release");
      var head = el("div", "panel__head");
      head.appendChild(phify(el("span", "panel__title"), g.title));
      head.appendChild(el("span", "panel__meta", (g.version || "") + " · released " + (g.year || "")));
      sec.appendChild(head);
      var body = el("div", "panel__body feature");
      var fig = el("figure", "feature__screen");
      var slot = el("div", "artslot");
      slot.appendChild(el("span", "artslot__mark", "▢"));
      slot.appendChild(el("span", null, "media slot - image or video"));
      fig.appendChild(slot);
      mediaInto(fig, g.media, g.title);
      body.appendChild(fig);
      var info = el("div", "feature__info");
      info.appendChild(phify(el("p", "feature__pitch"), g.pitch || ""));
      /* "specs" or "platforms" - either spelling, either case */
      var specs = g.specs || g.platforms || g.Platforms || "";
      if (specs) info.appendChild(phify(el("p", "feature__specs"), specs));
      var dl = el("p", "dl");
      /* released: false seals the whole row - no live download, no store
         links, just a dead button and "coming soon" chips */
      var out = g.released !== false;

      if (!out) {
        dl.appendChild(el("span", "btn btn--locked", g.lockedLabel || "⊘ build sealed"));
        var soonItch = el("span", "soon", "itch.io ");
        soonItch.appendChild(el("i", null, "coming soon"));
        dl.appendChild(soonItch);
      } else {
        var builds = buildList(g);
        if (builds.length === 1) {
          var b = el("a", "btn btn--dl", "▼ download build");
          b.href = builds[0].file;
          b.setAttribute("download", "");
          dl.appendChild(b);
        } else if (builds.length > 1) {
          dl.appendChild(buildMenu(builds));
        }
        /* fall back to the site-wide itch page when a game has no page of
           its own; skip the button entirely if there is nowhere to go */
        var itchUrl = (g.itch && g.itch !== "#") ? g.itch : (KN.itch || "");
        if (itchUrl && itchUrl !== "#") {
          var it = el("a", "btn", "itch.io");
          it.href = itchUrl;
          it.target = "_blank";
          it.rel = "noopener";
          dl.appendChild(it);
        }
      }
      if (KN.steamSoon) {
        var s = el("span", "soon", "steam ");
        s.appendChild(el("i", null, "coming soon"));
        dl.appendChild(s);
      } else if (KN.steam) {
        var st = el("a", "btn", "steam");
        st.href = KN.steam;
        dl.appendChild(st);
      }
      info.appendChild(dl);
      info.appendChild(el("p", "dl__note", out
        ? "direct download, no launcher, no account. unzip and run."
        : (g.lockedNote || "no build has been released to subjects yet.")));
      body.appendChild(info);
      sec.appendChild(body);
      releases.appendChild(sec);
    });
  }

  /* ═══ about page ═══════════════════════════════════════ */
  var bio = document.getElementById("bio");
  if (bio && KN.bio) {
    KN.bio.forEach(function (p) { bio.appendChild(phify(el("p"), p)); });
  }
})();
