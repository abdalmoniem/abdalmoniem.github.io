(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  root.classList.add("js");

  /* Mobile navigation toggle. */
  var nav = document.querySelector(".site-nav");
  var navToggle = document.querySelector(".nav-toggle");
  if (nav && navToggle) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Back-to-top floating button plus scrolled-nav state. */
  var backToTop = document.getElementById("back-to-top");
  var ticking = false;

  function updateBackToTopButton() {
    if (!backToTop) {
      return;
    }
    var show = window.scrollY > document.documentElement.scrollHeight * 0.05;
    backToTop.classList.toggle("is-visible", show);
    backToTop.setAttribute("aria-hidden", show ? "false" : "true");
    backToTop.setAttribute("tabindex", show ? "0" : "-1");
  }

  function updateChrome() {
    if (nav) {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    updateBackToTopButton();
  }

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  window.addEventListener("scroll", function () {
    if (ticking) {
      return;
    }
    ticking = true;
    window.requestAnimationFrame(function () {
      updateChrome();
      ticking = false;
    });
  }, { passive: true });

  updateChrome();

  /* Reveal animations: replayable on scroll in and out. */
  var revealables = document.querySelectorAll(".reveal");
  if (revealables.length && !reduceMotion && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });

    revealables.forEach(function (element) {
      var rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        element.classList.add("is-visible");
      }
      revealObserver.observe(element);
    });
  } else {
    revealables.forEach(function (element) {
      element.classList.add("is-visible");
    });
  }

  /* Skill bars: replayable on scroll in and out. */
  var skillFills = document.querySelectorAll(".skill-bar-fill");
  if (skillFills.length && !reduceMotion && "IntersectionObserver" in window) {
    var skillObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle("in-view", entry.isIntersecting);
      });
    }, { threshold: 0.4 });

    skillFills.forEach(function (element) {
      var rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        element.classList.add("in-view");
      }
      skillObserver.observe(element);
    });
  } else {
    skillFills.forEach(function (element) {
      element.classList.add("in-view");
    });
  }

  /* Project filters. */
  var filterRow = document.getElementById("project-filters");
  var projectCards = document.querySelectorAll(".project-card[data-tools]");
  if (filterRow && projectCards.length) {
    var tools = [];
    projectCards.forEach(function (card) {
      card.dataset.tools.split(",").forEach(function (tool) {
        var value = tool.trim();
        if (value && tools.indexOf(value) === -1) {
          tools.push(value);
        }
      });
    });

    tools.sort().forEach(function (tool) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "chip-outline";
      button.textContent = tool;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", function () {
        var pressed = button.getAttribute("aria-pressed") === "true";
        button.setAttribute("aria-pressed", String(!pressed));

        var active = Array.prototype.filter.call(filterRow.children, function (child) {
          return child.getAttribute("aria-pressed") === "true";
        }).map(function (child) {
          return child.textContent;
        });

        projectCards.forEach(function (card) {
          var show = active.length === 0 || active.some(function (value) {
            return card.dataset.tools.indexOf(value) !== -1;
          });
          card.hidden = !show;
        });
      });
      filterRow.appendChild(button);
    });
  }

  /* Scroll spy for nav sections. */
  var navLinks = document.querySelectorAll(".nav-menu a[href^='#']");
  if (navLinks.length && "IntersectionObserver" in window) {
    var sections = [];
    navLinks.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = id ? document.getElementById(id) : null;
      if (section) {
        sections.push({ section: section, link: link });
      }
    });

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        var match = sections.find(function (item) {
          return item.section === entry.target;
        });
        if (!match) {
          return;
        }
        navLinks.forEach(function (link) {
          link.removeAttribute("aria-current");
        });
        match.link.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });

    sections.forEach(function (item) {
      spy.observe(item.section);
    });
  }

  /* Hero canvas background: pointer-reactive glow, drifting blobs, click particles. */
  function heroCssColor(name, fallback) {
    var value = "";
    try {
      value = window.getComputedStyle(root).getPropertyValue(name);
    } catch (error) {
      value = "";
    }
    return value && value.trim().length > 0 ? value.trim() : fallback;
  }

  function startHeroCanvas() {
    var hero = document.querySelector(".hero");
    var canvas = document.getElementById("hero-canvas");
    var parallax = document.querySelector(".hero-parallax");
    if (reduceMotion || !hero || !parallax || !canvas) {
      /* Skip the canvas background under reduced motion or when hero markup is absent. */
      return;
    }

    var ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    var brandColor = heroCssColor("--c-brand", "#6366f1");
    var accentColor = heroCssColor("--c-accent", "#06b6d4");
    var particleColors = [brandColor, accentColor, "#818cf8", "#22d3ee", "#a78bfa"];

    var heroWidth = 1;
    var heroHeight = 1;
    var pointerX = 0;
    var pointerY = 0;
    var pointerTX = 0;
    var pointerTY = 0;
    var parallaxX = 0;
    var parallaxY = 0;
    var parallaxTX = 0;
    var parallaxTY = 0;
    var parallaxLastX = 0;
    var parallaxLastY = 0;
    var particles = [];
    var frameId = null;
    var resizeQueued = false;

    function resizeHero() {
      var rect = hero.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      heroWidth = rect.width || 1;
      heroHeight = rect.height || 1;
      canvas.width = Math.round(heroWidth * dpr);
      canvas.height = Math.round(heroHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function requestHeroResize() {
      if (resizeQueued) {
        return;
      }
      resizeQueued = true;
      window.requestAnimationFrame(function () {
        resizeQueued = false;
        resizeHero();
      });
    }

    function drawHeroBlob(x, y, radius, color, alpha) {
      var blob = ctx.createRadialGradient(x, y, 0, x, y, radius);
      blob.addColorStop(0, color);
      blob.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.globalAlpha = alpha;
      ctx.fillStyle = blob;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    function spawnHeroParticles(x, y) {
      var count = 14;
      for (var i = 0; i < count; i++) {
        if (particles.length >= 160) {
          particles.shift();
        }
        var angle = Math.random() * Math.PI * 2;
        var speed = 2 + Math.random() * 5;
        var life = 70;
        particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.8 - 2,
          life: life,
          ttl: life,
          size: 1 + Math.random() * 2,
          color: particleColors[(Math.random() * particleColors.length) | 0]
        });
      }
    }

    function drawHero(timestamp) {
      pointerX = pointerX + (pointerTX - pointerX) * 0.08;
      pointerY = pointerY + (pointerTY - pointerY) * 0.08;
      parallaxX = parallaxX + (parallaxTX - parallaxX) * 0.08;
      parallaxY = parallaxY + (parallaxTY - parallaxY) * 0.08;

      ctx.clearRect(0, 0, heroWidth, heroHeight);

      var glowRadius = Math.max(heroWidth, heroHeight) * 0.55;
      var glow = ctx.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, glowRadius);
      glow.addColorStop(0, brandColor);
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(pointerX, pointerY, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      var time = (typeof timestamp === "number" ? timestamp : 0) / 1000;
      drawHeroBlob(heroWidth * (0.25 + Math.sin(time * 0.6) * 0.18), heroHeight * (0.3 + Math.cos(time * 0.45) * 0.2), heroWidth * 0.6, brandColor, 0.16);
      drawHeroBlob(heroWidth * (0.8 + Math.cos(time * 0.5) * 0.16), heroHeight * (0.75 + Math.sin(time * 0.65) * 0.18), heroWidth * 0.55, accentColor, 0.14);

      for (var i = particles.length - 1; i >= 0; i--) {
        var particle = particles[i];
        particle.life = particle.life - 1;
        particle.vy = particle.vy + 0.06;
        particle.x = particle.x + particle.vx;
        particle.y = particle.y + particle.vy;
        if (particle.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        var alpha = particle.life / particle.ttl;
        if (alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (parallaxX !== parallaxLastX || parallaxY !== parallaxLastY) {
        parallax.style.transform = "translate3d(" + parallaxX + "px," + parallaxY + "px,0)";
        parallaxLastX = parallaxX;
        parallaxLastY = parallaxY;
      }
    }

    function heroFrame(timestamp) {
      frameId = null;
      if (document.hidden) {
        /* Stop scheduling while hidden; resume from the visibilitychange handler. */
        return;
      }
      drawHero(timestamp);
      frameId = window.requestAnimationFrame(heroFrame);
    }

    function startHeroLoop() {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(heroFrame);
      }
    }

    function stopHeroLoop() {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
    }

    function onHeroPointerMove(event) {
      var rect = hero.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;
      pointerTX = x;
      pointerTY = y;
      var nx = heroWidth ? (x / heroWidth) - 0.5 : 0;
      var ny = heroHeight ? (y / heroHeight) - 0.5 : 0;
      parallaxTX = nx * 18;
      parallaxTY = ny * 18;
    }

    function onHeroPointerLeave() {
      pointerTX = 0;
      pointerTY = 0;
      parallaxTX = 0;
      parallaxTY = 0;
    }

    function onHeroPointerDown(event) {
      if (event.button !== 0) {
        return;
      }
      var rect = hero.getBoundingClientRect();
      spawnHeroParticles(event.clientX - rect.left, event.clientY - rect.top);
    }

    function onHeroResize() {
      requestHeroResize();
    }

    function onHeroVisibilityChange() {
      if (document.hidden) {
        stopHeroLoop();
      } else {
        startHeroLoop();
      }
    }

    function onHeroPageHide() {
      stopHeroLoop();
      hero.removeEventListener("pointermove", onHeroPointerMove);
      hero.removeEventListener("pointerleave", onHeroPointerLeave);
      hero.removeEventListener("pointerdown", onHeroPointerDown);
      window.removeEventListener("resize", onHeroResize);
      document.removeEventListener("visibilitychange", onHeroVisibilityChange);
      parallax.style.transform = "";
    }

    resizeHero();
    startHeroLoop();
    hero.addEventListener("pointermove", onHeroPointerMove);
    hero.addEventListener("pointerleave", onHeroPointerLeave);
    hero.addEventListener("pointerdown", onHeroPointerDown);
    window.addEventListener("resize", onHeroResize);
    document.addEventListener("visibilitychange", onHeroVisibilityChange);
    document.addEventListener("pagehide", onHeroPageHide);
  }

  startHeroCanvas();
})();
