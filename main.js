/* I render the site using content.js. */

(function () {
  "use strict";

  var KN = window.KN || {};
  var logs = (KN.logs || []).slice().sort(function (a, b) {
    return (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0);
  });
  var pad = function (n) { return String(n).padStart(2, "0"); };

  var artwork = KN.artwork || {};
  if (artwork.tabIcon) {
    document.querySelectorAll('link[rel="icon"]').forEach(function (icon) { icon.href = artwork.tabIcon; });
  }
  if (artwork.mainImage) {
    document.querySelectorAll('.v2-logo img').forEach(function (img) { img.src = artwork.mainImage; });
  }
  if (artwork.mainVideo) {
    document.querySelectorAll('.v2-logo img').forEach(function (img) {
      var video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('aria-hidden', 'true');
      video.poster = img.src;
      video.src = artwork.mainVideo;
      img.replaceWith(video);
    });
  }
  var logoDialog;
  var closeLogo = function () {
    if (!logoDialog) return;
    logoDialog.hidden = true;
    var video = logoDialog.querySelector('video');
    if (video) video.pause();
  };
  document.querySelectorAll('.v2-logo').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      if (!logoDialog) {
        logoDialog = document.createElement('div');
        logoDialog.className = 'logo-lightbox';
        logoDialog.setAttribute('role', 'dialog');
        logoDialog.setAttribute('aria-modal', 'true');
        logoDialog.setAttribute('aria-label', 'Expanded Kay_N logo');
        logoDialog.hidden = true;
        var panel = document.createElement('div');
        panel.className = 'logo-lightbox__panel';
        var close = document.createElement('button');
        close.className = 'logo-lightbox__close';
        close.type = 'button';
        close.setAttribute('aria-label', 'Close expanded logo');
        close.textContent = '×';
        close.addEventListener('click', closeLogo);
        var sourceVideo = trigger.querySelector('video');
        var image;
        if (sourceVideo) {
          image = sourceVideo.cloneNode(true);
          image.muted = true;
          image.removeAttribute('aria-hidden');
          image.setAttribute('aria-label', 'Kay_N logo, expanded');
        } else {
          image = document.createElement('img');
          image.alt = 'Kay_N logo, expanded';
          image.src = (trigger.querySelector('img') || {}).src || artwork.mainImage || 'Tab_Logo.png';
        }
        panel.appendChild(close);
        panel.appendChild(image);
        logoDialog.appendChild(panel);
        logoDialog.addEventListener('click', function (event) { if (event.target === logoDialog) closeLogo(); });
        document.body.appendChild(logoDialog);
      }
      logoDialog.hidden = false;
      var expandedVideo = logoDialog.querySelector('video');
      if (expandedVideo) expandedVideo.play().catch(function () {});
      logoDialog.querySelector('.logo-lightbox__close').focus();
    });
  });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeLogo(); });
  var syncNavigation = function () {
    var page = location.pathname.split('/').pop() || 'index.html';
    var target = page === 'about.html' && location.hash === '#contact' ? 'contact.html' : page;
    document.querySelectorAll('.v2-nav a').forEach(function (link) {
      if (link.getAttribute('href') === target) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };
  syncNavigation();
  window.addEventListener('hashchange', syncNavigation);
  window.addEventListener('pageshow', syncNavigation);

  var boot = document.getElementById("boot");
  var runBoot = function () {
    if (!boot || !boot.parentNode) return;
    var pre = document.getElementById("boot-text");
    var seen = false;
    try { seen = sessionStorage.getItem("kn-booted") === "1"; } catch (e) {}
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

    var line = function (label, value, cls) {
      var dots = ".".repeat(Math.max(3, 24 - label.length));
      return label + ' <span class="b-dim">' + dots + "</span> " +
             '<span class="' + (cls || "b-ok") + '">' + value + "</span>";
    };
    var LINES = [
      '<span class="b-dim">KAY_N 2.0</span>',
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

  var clockEl = document.getElementById("clock");
  if (clockEl) {
    var tick = function () {
      var d = new Date();
      clockEl.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    };
    tick();
    setInterval(tick, 1000);
  }

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
      if (level === 0) level = 2;
      else if (r < 0.06) level = 0;
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
      counterEl.textContent = "Visits:: " + visits;
    } catch (e) {
      counterEl.textContent = "Visits:: ?";
    }
  }

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
    cell.textContent = "Subject:: " + id;
    cell.title = "designation " + id + " - permanent";
  };

  var PREFIX = "SUBJ-";
  /* I claim names through the database, which enforces uniqueness. */
  var claimRemote = function (id) {

    var base = (KN.supabaseUrl || "").replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
    var key = KN.supabaseKey || "";
    if (!base || !key) return Promise.resolve("down");
    var headers = {
      apikey: key,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    };
    /* I send the authorization header only for legacy JWT keys. */
    if (key.indexOf("eyJ") === 0) headers.Authorization = "Bearer " + key;
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 10000);
    return fetch(base + "/rest/v1/subjects", {
      method: "POST",
      signal: controller.signal,
      headers: headers,
      body: JSON.stringify({ id: id })
    }).then(function (res) {
      if (res.status === 201 || res.status === 200) return "ok";
      if (res.status === 409) return "taken";
      return "down";
    }).catch(function () { return "down"; }).finally(function () { clearTimeout(timeout); });
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
      } catch (e2) { /* I keep this registration for the current session if storage is unavailable. */ }
      paintSubject(id);
      document.dispatchEvent(new CustomEvent("kn:subject", { detail: id }));
      gate.classList.add("gate--out");
      setTimeout(function () {
        gate.remove();

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
        if (verdict !== "ok") {
          err.textContent = "registration is unavailable. please check your connection and try again.";
          input.focus();
          return;
        }
        admit(res.id);
      });
    });
  };

  if (readSubject()) {
    paintSubject(readSubject());
    document.documentElement.classList.remove("gated");
    runBoot();
  } else {
    document.documentElement.classList.add("gated");
    openGate();
  }

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

  /* I load YouTube only after a visitor presses play. */
  var offline = location.protocol === "file:";
  /* I keep the same video player when expanding it. */
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

  /* I handle gallery keys before the terminal game can receive them. */
  document.addEventListener("keydown", function (e) {
    if (!maxed) return;
    if (e.key === "Escape") unmaximise();
    else if (e.key === "ArrowLeft") maxed.__prev && maxed.__prev();
    else if (e.key === "ArrowRight") maxed.__next && maxed.__next();
    else return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  var idle = function (fn) {
    if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 2500 });
    else setTimeout(fn, 900);
  };

  var whenVisible = function (node, run) {
    if (!("IntersectionObserver" in window)) { run(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); run(); }
    }, { rootMargin: "300px" });
    io.observe(node);
  };

  var mediaInto = function (holder, media, alt) {
    var request = (holder.__mediaRequest || 0) + 1;
    holder.__mediaRequest = request;

    var items = (Array.isArray(media) ? media : [media]).filter(function (m) {
      return srcOf(m);
    });
    if (!items.length) return;
    whenVisible(holder, function () {
      if (holder.__mediaRequest === request) buildGallery(holder, items, alt);
    });
  };

  var buildGallery = function (holder, items, alt) {
    holder.innerHTML = "";

    var many = items.length > 1;
    var gal = el("div", "gal");
    var stage = el("div", "gal__stage");
    var at = 0;
    var thumbs = [];

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
      stage.querySelectorAll("audio, video").forEach(function (player) { player.pause(); });
      stage.innerHTML = "";
      stage.dataset.kind = kindOf(srcOf(items[at]));
      var node = buildOne(items[at], alt);
      stage.appendChild(node);

      var img = node.tagName === "IMG" ? node : node.querySelector && node.querySelector("img");
      if (img) {
        img.classList.add("is-zoomable");
        img.addEventListener("click", function () { maximise(gal); });

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
      thumbs.forEach(function (t, j) {
        t.classList.toggle("is-on", at === j);
        t.setAttribute("aria-pressed", String(at === j));
      });
    };

    prev.addEventListener("click", function (e) { e.stopPropagation(); show(at - 1); });
    next.addEventListener("click", function (e) { e.stopPropagation(); show(at + 1); });

    gal.__prev = function () { show(at - 1); };
    gal.__next = function () { show(at + 1); };

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
        t.setAttribute("aria-label", "Show media " + (i + 1) + ": " + t.title);
        if (k === "image") {
          /* I load the first preview now and defer the rest until the browser is idle. */
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

  document.querySelectorAll(".js-tagline").forEach(function (n) { phify(n, KN.tagline || ""); });
  document.querySelectorAll(".js-discord").forEach(function (n) { n.href = KN.discord || "#"; });

  [["js-twitter", KN.twitter], ["js-youtube", KN.youtube]].forEach(function (pair) {
    document.querySelectorAll("." + pair[0]).forEach(function (n) {
      var url = (pair[1] || "").trim();
      if (!url || url === "#") {

        var sep = n.previousElementSibling;
        if (sep && sep.classList.contains("deck__sep")) sep.remove();
        n.remove();
        return;
      }
      n.href = url;
    });
  });

  document.querySelectorAll(".js-mail").forEach(function (n) {
    var address = (KN.mail || "").replace(/^mailto:/i, "").trim();
    n.textContent = address;
    n.href = "mailto:" + address;
  });

  var lastTx = document.getElementById("last-tx");
  if (lastTx && logs.length) {
    lastTx.textContent = agoText(daysSince(logs[0].date));
  }

  var homeLog = document.getElementById("home-log");
  if (homeLog) {
    logs.slice(0, 5).forEach(function (e) { homeLog.appendChild(logRow(e)); });
  }

  var musicLibrary = document.getElementById("music-library");
  var musicPlayer = document.getElementById("music-player");
  if (musicLibrary && musicPlayer && Array.isArray(KN.music)) {
    var musicCards = [];
    var activeMusicAudio;
    var cleanName = function (value) { return String(value || "").replace(/^\s*\[\s*|\s*\]\s*$/g, "").trim(); };
    /* I use each game's release date to order its soundtrack. */
    var musicItems = orderedGames(KN.music.map(function (item) {
      var game = (KN.games || []).find(function (game) {
        return cleanName(game.title).toLowerCase() === cleanName(item.game).toLowerCase();
      });
      return Object.assign({}, item, {
        released: game ? game.released !== false : item.released === true,
        releaseDate: game ? game.releaseDate : item.releaseDate
      });
    })).map(function (entry) { return entry.game; });
    var selectMusic = function (item, index) {
      if (activeMusicAudio) activeMusicAudio.pause();
      musicCards.forEach(function (card, i) { card.setAttribute("aria-pressed", String(i === index)); });
      musicPlayer.replaceChildren();
      var title = item.title || cleanName(item.game) + " OST";
      musicPlayer.appendChild(el("h3", "music-player__title", title));
      if (Array.isArray(item.tracks) && item.tracks.length) {
        var header = el("div", "music-track-heading");
        ["#", "TITLE"].forEach(function (label) { header.appendChild(el("span", "", label)); });
        header.setAttribute("aria-hidden", "true");
        musicPlayer.appendChild(header);
        var trackList = el("ol", "music-tracks");
        var player = document.createElement("audio");
        player.preload = "none";
        activeMusicAudio = player;
        var selectedTrack = item.tracks.findIndex(function (track) { return !!track.audio; });
        var trackButtons = [];
        var bar = el("div", "music-controls");
        var toggle = el("button", "music-toggle", "▶");
        toggle.type = "button";
        toggle.disabled = selectedTrack < 0;
        var seek = document.createElement("input");
        seek.type = "range";
        seek.className = "music-seek";
        seek.min = "0";
        seek.max = "100";
        seek.step = "0.1";
        seek.value = "0";
        seek.disabled = true;
        seek.setAttribute("aria-label", "Seek within track");
        var syncSeek = function () {
          var duration = player.duration;
          if (!Number.isFinite(duration) || duration <= 0) duration = Number((item.tracks[selectedTrack] || {}).duration);
          var hasDuration = Number.isFinite(duration) && duration > 0;
          seek.disabled = !hasDuration;
          seek.max = hasDuration ? String(duration) : "100";
          seek.value = String(hasDuration ? player.currentTime || 0 : 0);
          var progress = hasDuration ? Math.min(100, Math.max(0, Number(seek.value) / duration * 100)) : 0;
          seek.style.setProperty("--played", progress + "%");
        };
        var status = el("p", "music-status");
        status.setAttribute("role", "status");
        var syncPlayback = function () {
          var track = item.tracks[selectedTrack];
          toggle.textContent = player.paused ? "▶" : "Ⅱ";
          toggle.setAttribute("aria-label", (player.paused ? "Play " : "Pause ") + (track ? track.title : "soundtrack"));
          trackButtons.forEach(function (button, i) { button.setAttribute("aria-pressed", String(i === selectedTrack)); });
        };
        var playTrack = function (trackIndex) {
          var track = item.tracks[trackIndex];
          if (!track || !track.audio) return;
          if (selectedTrack !== trackIndex || !player.getAttribute("src")) {
            player.pause();
            selectedTrack = trackIndex;
            player.src = track.audio;
            seek.value = "0";
            seek.disabled = true;
            seek.style.setProperty("--played", "0%");
          } else if (!player.paused) {
            player.pause();
            return;
          }
          status.textContent = "";
          syncPlayback();
          player.play().catch(function () { status.textContent = "Unable to play this track. Try again."; syncPlayback(); });
        };
        item.tracks.forEach(function (track, trackIndex) {
          var row = el("li", "");
          var button = el("button", "music-track");
          button.type = "button";
          button.disabled = !track.audio;
          var trackTitle = track.title || "Track " + String(trackIndex + 1).padStart(2, "0");
          button.setAttribute("aria-label", trackTitle + (track.audio ? " — play or pause" : " — coming soon"));
          button.appendChild(el("span", "music-track__number", String(trackIndex + 1).padStart(2, "0")));
          var label = el("span", "music-track__label");
          label.appendChild(el("span", "music-track__title", trackTitle));
          label.appendChild(el("span", "music-track__artist", item.artist || "Kay_N"));
          button.appendChild(label);
          button.addEventListener("click", function () { playTrack(trackIndex); });
          trackButtons.push(button);
          row.appendChild(button);
          trackList.appendChild(row);
        });
        toggle.addEventListener("click", function () { playTrack(selectedTrack); });
        seek.addEventListener("input", function () {
          if (!seek.disabled) {
            player.currentTime = Number(seek.value);
            syncSeek();
          }
        });
        ["loadedmetadata", "durationchange", "timeupdate"].forEach(function (event) { player.addEventListener(event, syncSeek); });
        ["play", "pause", "ended"].forEach(function (event) { player.addEventListener(event, syncPlayback); });
        player.addEventListener("error", function () { status.textContent = "Unable to load this track. Try again."; });
        syncPlayback();
        bar.appendChild(toggle);
        bar.appendChild(seek);
        musicPlayer.appendChild(trackList);
        musicPlayer.appendChild(bar);
        musicPlayer.appendChild(status);
        musicPlayer.appendChild(player);
      } else if (item.audio) {
        var audio = document.createElement("audio");
        activeMusicAudio = audio;
        audio.controls = true;
        audio.preload = "metadata";
        audio.src = item.audio;
        audio.setAttribute("aria-label", title + " audio player");
        musicPlayer.appendChild(audio);
      } else {
        musicPlayer.appendChild(el("p", "music-player__empty", item.note || "I have not uploaded this soundtrack yet."));
      }
    };
    musicItems.forEach(function (item, index) {
      var card = el("button", "music-card");
      card.type = "button";
      card.setAttribute("aria-pressed", "false");
      card.setAttribute("aria-label", "Load " + (item.title || cleanName(item.game) + " soundtrack"));
      var cover = el("span", "music-cover");
      if (item.model) {
        var model = document.createElement("model-viewer");
        model.className = "music-model";
        model.src = item.model;
        model.setAttribute("alt", item.title || "Soundtrack CD model");
        model.setAttribute("camera-orbit", item.modelOrbit || "30deg 75deg auto");
        model.setAttribute("rotation-per-second", item.modelRotation || "18deg");
        model.setAttribute("auto-rotate", "");
        model.setAttribute("disable-zoom", "");
        model.setAttribute("interaction-prompt", "none");
        cover.appendChild(model);
      } else {
        cover.appendChild(el("span", "music-model-space", "MODEL PENDING"));
      }
      card.appendChild(cover);
      card.appendChild(el("span", "music-card__label", item.game || item.title || "Untitled"));
      card.addEventListener("click", function () { selectMusic(item, index); });
      musicCards.push(card);
      musicLibrary.appendChild(card);
    });
    if (musicCards.length) selectMusic(musicItems[0], 0);
  }

  var wbName = document.getElementById("wb-name");

  var modelViewer = function (g, name, interactive) {
    var model = el("model-viewer", interactive ? "display-model" : "game-model");
    model.setAttribute("src", g.model);
    model.setAttribute("alt", name + " 3D model");
    model.setAttribute("auto-rotate", "");
    model.setAttribute("auto-rotate-delay", "0");
    model.setAttribute("rotation-per-second", g.modelRotation || "18deg");
    model.setAttribute("camera-orbit", g.modelOrbit || "30deg 78deg auto");
    model.setAttribute("environment-image", "neutral");
    model.setAttribute("shadow-intensity", "0");
    model.setAttribute("interaction-prompt", "none");
    model.setAttribute("loading", "lazy");
    if (interactive) {
      model.setAttribute("camera-controls", "");
      model.setAttribute("touch-action", "pan-y");
    } else {
      model.setAttribute("aria-hidden", "true");
      model.setAttribute("tabindex", "-1");
    }
    return model;
  };

  /* I sort games and soundtracks by release date, keeping upcoming entries last. */
  function orderedGames(games) {
    var releaseTime = function (game) {
      var time = Date.parse(game.releaseDate || "");
      return Number.isFinite(time) ? time : 0;
    };
    return games.map(function (game, index) { return {game: game, index: index}; }).sort(function (a, b) {
      var aReleased = a.game.released !== false;
      var bReleased = b.game.released !== false;
      if (aReleased !== bReleased) return aReleased ? -1 : 1;
      return (aReleased ? releaseTime(b.game) - releaseTime(a.game) : 0) || a.index - b.index;
    });
  }

  var shelf = document.getElementById("games-shelf");
  var gameButtons = [];
  var requireGameModel = shelf && shelf.dataset.requireModel === "true";
  if (shelf && KN.games) {
    orderedGames(KN.games).forEach(function (entry) {
      var g = entry.game;
      var index = entry.index;

      if (requireGameModel && !g.model) {
        var pending = el("li");
        var holder = el("span", "cart cart--pending");
        var space = el("span", "cart__model-space");
        space.setAttribute("aria-hidden", "true");
        holder.appendChild(space);
        holder.appendChild(el("span", "cart__name", String(g.title || g.name || "UNTITLED").replace(/^\s*\[\s*|\s*\]\s*$/g, "").trim()));
        pending.appendChild(holder);
        shelf.appendChild(pending);
        return;
      }
      var li = el("li");
      var a = el("button", "cart");
      a.type = "button";
      a.setAttribute("aria-controls", "display");
      a.setAttribute("aria-pressed", "false");
      a.addEventListener("click", function () { selectGame(g, index); });
      gameButtons[index] = a;
      var title = String(g.title || g.name || "UNTITLED").replace(/^\s*\[\s*|\s*\]\s*$/g, "").trim();
      a.setAttribute("aria-label", "Load " + title);
      if (g.model) {
        var tileModel = modelViewer(g, title, false);
        a.appendChild(tileModel);
        var modelState = el("span", "cart__model-state", "loading…");
        modelState.setAttribute("aria-hidden", "true");
        tileModel.addEventListener("load", function () { modelState.hidden = true; });
        tileModel.addEventListener("error", function () { modelState.textContent = "model unavailable"; });
        a.appendChild(modelState);
      } else if (g.thumbnail) {
        var icon = el("img", "cart__image");
        icon.src = g.thumbnail; icon.alt = ""; icon.loading = "lazy";
        a.appendChild(icon);
      } else if (!requireGameModel && title.toLowerCase() === "a_way_out") {
        var stage = el("span", "pillar-stage");
        stage.setAttribute("aria-hidden", "true");
        var canvas = el("canvas", "pillar-canvas");
        canvas.width = 264; canvas.height = 330;
        canvas.textContent = "Wireframe pillar";
        stage.appendChild(canvas);
        a.appendChild(stage);
      }
      a.appendChild(el("span", "cart__name", title));
      var meta = el("span", "cart__meta");
      meta.appendChild(el("span", "cart__year", g.year || ""));
      meta.appendChild(el("span", "cart__state"));
      a.appendChild(meta);
      li.appendChild(a);
      shelf.appendChild(li);
    });

    var d = KN.Protocols || {};
    var minimum = Number(shelf.dataset.minSlots) || 0;
    var slots = Math.max(d.emptySlots || 0, minimum - shelf.children.length);
    for (var s = 0; s < slots; s++) {
      var li2 = el("li");
      var empty = el("span", "cart cart--pending cart--unknown");
      var blankModel = el("span", "cart__model-space");
      blankModel.setAttribute("aria-hidden", "true");
      empty.appendChild(blankModel);
      empty.appendChild(el("span", "cart__name", d.emptyTitle || "???"));
      li2.appendChild(empty);
      shelf.appendChild(li2);
    }
  }

  var archiveRow = function (entry) {
    var li = logRow(entry);
    var detailed = !!(entry.desc || entry.media);

    var caret = el("span", "log__caret", detailed ? "▸" : "");
    li.insertBefore(caret, li.firstChild);
    if (!detailed) return li;

    li.classList.add("is-expandable");

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
      /* I inspect the click path so replaced media controls do not collapse the entry. */
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
  if (archive) {
    var year = null, list = null;
    logs.forEach(function (e) {
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

  var gameName = function (value) {
    return String(value || "").replace(/^\s*\[\s*|\s*\]\s*$/g, "").trim();
  };
  var switchTimer = 0;
  var selectGame = function (g, index) {
    if (!wbName) return;
    var displayPanel = document.getElementById("display");
    if (displayPanel && displayPanel.classList && typeof displayPanel.classList.add === "function") {
      displayPanel.classList.remove("is-switching");

      void displayPanel.offsetWidth;
      displayPanel.classList.add("is-switching");
      clearTimeout(switchTimer);
      switchTimer = setTimeout(function () { displayPanel.classList.remove("is-switching"); }, 420);
    }
    var name = gameName(g.title || g.name) || "UNTITLED";
    var released = g.released !== false;
    var status = released ? "released" : "in development";
    wbName.textContent = name;
    var gameInfo = document.getElementById("game-info");
    if (gameInfo) gameInfo.hidden = false;
    document.getElementById("display-status").textContent = status;
    gameButtons.forEach(function (button, i) {
      if (button) button.setAttribute("aria-pressed", String(i === index));
    });

    var media = Array.isArray(g.media) ? g.media.slice() : [g.media];
    // I keep each project trailer with its own game.
    var project = KN.project || {};
    if (gameName(project.name).toLowerCase() === name.toLowerCase()) {
      var extras = Array.isArray(project.media) ? project.media : [project.media];
      extras.forEach(function (item) {
        if (srcOf(item) && !media.some(function (existing) { return srcOf(existing) === srcOf(item); })) media.push(item);
      });
    }
    var holder = document.getElementById("wb-media");
    if (maxed && holder.contains(maxed)) unmaximise();
    holder.querySelectorAll("audio, video").forEach(function (player) { player.pause(); });
    holder.replaceChildren(el("div", "artslot", media.some(srcOf) ? "loading media…" : "no media yet"));
    mediaInto(holder, media, name);

    var builds = buildList(g);
    var actions = document.getElementById("display-actions");
    actions.replaceChildren();
    if (released) {
      builds.forEach(function (build) {
        var link = el("a", "btn btn--dl", "↓ " + build.os);
        link.href = build.file;
        link.setAttribute("download", "");
        link.setAttribute("aria-label", "Download " + name + " for " + build.os);
        actions.appendChild(link);
      });
      [["itch.io", g.itch], ["steam", g.steam]].forEach(function (store) {
        if (!store[1] || store[1] === "#") return;
        var link = el("a", "btn", store[0]);
        link.href = store[1]; link.target = "_blank"; link.rel = "noopener";
        actions.appendChild(link);
      });
    } else {
      actions.appendChild(el("span", "btn btn--locked", g.lockedLabel || "coming soon"));
    }
    var logLink = el("a", "btn", "devlog");
    logLink.href = g.devlog || "log.html";
    actions.appendChild(logLink);

    var specs = document.getElementById("display-specs");
    specs.textContent = [g.version, g.specs || g.platforms || g.Platforms].filter(Boolean).join("\n");
    specs.hidden = !specs.textContent;
    var details = document.getElementById("display-details");
    details.open = false;
    details.hidden = (!g.pitch || g.pitch === g.desc) && !specs.textContent;
    document.getElementById("display-description").textContent = g.pitch || "";
  };
  if (wbName) {
    var games = KN.games || [];
    var onlyModels = typeof requireGameModel !== "undefined" && requireGameModel;
    var first = games.findIndex(function (g) {
      return (!onlyModels || g.model) && gameName(g.title || g.name).toLowerCase() === gameName((KN.project || {}).name).toLowerCase();
    });
    if (first < 0) first = games.findIndex(function (g) { return !onlyModels || g.model; });
    if (first >= 0) selectGame(games[first], first);
    else if (!onlyModels) selectGame(Object.assign({released: false}, KN.project || {}), -1);
  }

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

      var specs = g.specs || g.platforms || g.Platforms || "";
      if (specs) info.appendChild(phify(el("p", "feature__specs"), specs));
      var dl = el("p", "dl");

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

  var bio = document.getElementById("bio");
  if (bio && KN.bio) {
    KN.bio.forEach(function (p) { bio.appendChild(phify(el("p"), p)); });
  }
})();
