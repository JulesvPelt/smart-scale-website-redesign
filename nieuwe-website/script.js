(() => {
  const qs = (s, ctx = document) => ctx.querySelector(s);
  const qsa = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let chatStarted = false;
  // Speech-bubble icon used on the chat launcher (pre-load button + n8n toggle), so both look identical.
  const CHAT_ICON_URI = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%230d0b06'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M21%2011.5a8.38%208.38%200%200%201-.9%203.8%208.5%208.5%200%200%201-7.6%204.7%208.38%208.38%200%200%201-3.8-.9L3%2021l1.9-5.7a8.38%208.38%200%200%201-.9-3.8%208.5%208.5%200%200%201%204.7-7.6%208.38%208.38%200%200%201%203.8-.9h.5a8.48%208.48%200%200%201%208%208v.5z'/%3E%3C/svg%3E";
  const setInlineStyles = (el, styles) => {
    if (!el || !styles) return;
    Object.entries(styles).forEach(([key, val]) => {
      el.style[key] = val;
    });
  };

  const forceLeftAlign = (root = document) => {
    const headerSelectors = [".jm-header", ".n8n-chat__header", ".n8n-chat__panel header", ".cs-header", ".cs-title"];
    headerSelectors.forEach((sel) => {
      qsa(sel, root).forEach((el) =>
        setInlineStyles(el, {
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          textAlign: "left",
          gap: "8px",
        })
      );
    });
    qsa(".n8n-chat__messages, .cs-messages", root).forEach((el) =>
      setInlineStyles(el, { alignItems: "flex-start", textAlign: "left" })
    );
    qsa(
      ".n8n-chat__message, .n8n-chat__message--bot, .n8n-chat__message--assistant, .n8n-chat__message--user, .cs-message, .cs-message--assistant, .cs-message--user",
      root
    ).forEach((el) =>
      setInlineStyles(el, { alignItems: "flex-start", justifyContent: "flex-start", textAlign: "left" })
    );
  };

  const forceYellowButtons = (root = document) => {
    const yellowSelectors = [
      ".jm-chat-launcher",
      ".jm-button",
      ".n8n-chat__toggle",
      ".n8n-chat__footer button[type='submit']",
      ".n8n-chat__quick-replies button",
      ".n8n-chat__cta button",
      ".cs-launcher",
      ".cs-button",
      ".cs-button-primary",
      ".cs-chat-button",
      ".cs-submit-button",
    ];
    yellowSelectors.forEach((sel) => {
      qsa(sel, root).forEach((el) =>
        setInlineStyles(el, {
          background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
          color: "#0d0b06",
          borderColor: "var(--accent)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        })
      );
    });
  };

  const enforceChatUI = () => {
    forceLeftAlign(document);
    forceYellowButtons(document);
    const rispose = qs("cs-widget, .cs-widget");
    if (rispose?.shadowRoot) {
      forceLeftAlign(rispose.shadowRoot);
      forceYellowButtons(rispose.shadowRoot);
    }
  };

  function initNav() {
    const toggle = qs(".nav-toggle");
    const menu = qs(".nav-links");
    const demoItem = qs(".nav-item-demo");
    const demoSub = qs(".nav-submenu");
    let hideTimer;
    if (!toggle || !menu) return;
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      menu.classList.toggle("open");
    });
    qsa(".nav-links a").forEach((link) =>
      link.addEventListener("click", () => {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );

    if (demoItem && demoSub) {
      const demoLink = demoItem.querySelector("a");
      const open = () => {
        clearTimeout(hideTimer);
        demoItem.classList.add("open");
      };
      const close = () => {
        hideTimer = setTimeout(() => demoItem.classList.remove("open"), 180);
      };
      demoItem.addEventListener("mouseenter", open);
      demoItem.addEventListener("mouseleave", close);
      demoSub.addEventListener("mouseenter", open);
      demoSub.addEventListener("mouseleave", close);
      // Desktop hover handles open; on mobile submenu is always visible, so no toggle logic needed.
    }
  }

  function initSmoothScroll() {
    qsa('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const targetId = anchor.getAttribute("href").slice(1);
        const target = targetId ? qs(`#${targetId}`) : null;
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
        }
      });
    });
  }

  function initReveal() {
    if (prefersReducedMotion) {
      qsa("[data-reveal]").forEach((el) => el.classList.add("revealed"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    qsa("[data-reveal]").forEach((el) => observer.observe(el));
  }

  function initAccordion() {
    qsa("[data-accordion]").forEach((item) => {
      const btn = qs(".faq-question", item);
      const ans = qs(".faq-answer", item);
      if (!btn || !ans) return;
      btn.addEventListener("click", () => {
        const open = item.classList.contains("active");
        qsa("[data-accordion]").forEach((el) => el.classList.remove("active"));
        if (!open) item.classList.add("active");
      });
    });
  }

  function initParallax() {
    const el = qs("[data-parallax]");
    if (!el || prefersReducedMotion) return;
    const strength = 14;
    document.addEventListener("pointermove", (evt) => {
      const { innerWidth, innerHeight } = window;
      const x = (evt.clientX / innerWidth - 0.5) * strength;
      const y = (evt.clientY / innerHeight - 0.5) * strength;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  function initTypewriter() {
    const target = qs("[data-typewriter]");
    if (!target) return;
    const rawText = target.dataset.typewriterText || target.textContent || "";
    const fullText = rawText.replace(/\r?\n/g, "\n").trim();
    if (!fullText) return;
    if (prefersReducedMotion) {
      target.innerHTML = fullText.replace(/\n/g, "<br>");
      return;
    }
    target.setAttribute("aria-live", "polite");
    target.classList.add("typewriter");
    target.textContent = "";
    const ghost = document.createElement("span");
    ghost.className = "typewriter-ghost";
    ghost.textContent = fullText;
    ghost.setAttribute("aria-hidden", "true");
    const live = document.createElement("span");
    live.className = "typewriter-live";
    target.append(ghost, live);
    const typeDelay = 61.56;
    const blankPause = 0;
    const cycleDelay = 5000;

    const runCycle = () => {
      live.classList.remove("typewriter-done");
      let index = 0;
      const step = () => {
        if (index <= fullText.length) {
          live.textContent = fullText.slice(0, index);
          index++;
          setTimeout(step, typeDelay);
        } else {
          live.classList.add("typewriter-done");
          setTimeout(() => {
            live.textContent = "";
            live.classList.remove("typewriter-done");
            setTimeout(runCycle, blankPause);
          }, cycleDelay);
        }
      };
      step();
    };
    runCycle();
  }

  async function initRealChat() {
    const mode = document.body.dataset.chatMode;
    if (mode === "rispose") return;
    const path = location.pathname.replace(/\/+$/, "") || "/";
    const imagesBase = location.protocol === "file:" ? "images" : "/images";
    const configMap = {
      shopify: {
        webhookUrl: "https://n8n.srv1160115.hstgr.cloud/webhook/c38073cd-b1c3-401f-ba69-abd8db13d5b1/chat",
        primary: "#fbbf24",
        secondary: "#f59e0b",
        headerName: "Kast-bot",
        headerSubtitle: "Persoonlijk advies dat bij jou KAST",
        profileUrl: "https://i.postimg.cc/DztW036D/ffedaa1c-4e42-4c2e-9cb2-f2b835d4d59e-1.png",
        welcome: "Yo! Welkom bij Kosso Nutrition - hier draait alles om groei, discipline en kwaliteit. Hoe kan ik je helpen?",
      },
      garage: {
        webhookUrl: "https://n8n.srv1160115.hstgr.cloud/webhook/f68007c2-4b6a-4e91-b1ae-d36ae45158a9/chat",
        primary: "#E53E3E",
        secondary: "#C53030",
        headerName: "Mike",
        headerSubtitle: "Uw digitale monteur",
        profileUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5",
        welcome: "Welkom bij DrivePro! Mijn naam is Mike. Vragen over een APK, onderhoud of reparatie? Ik help je direct!",
      },
      schoonheid: {
        webhookUrl: "https://n8n.srv1160115.hstgr.cloud/webhook/aeb6b74d-d188-42b1-a024-8bd4a81c7671/chat",
        primary: "#D4AFB9",
        secondary: "#b899a2",
        headerName: "Chloé",
        headerSubtitle: "Uw beauty adviseur",
        profileUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        welcome: "Hallo! Ik ben Chloé van LUMINA. Ik help je graag met het vinden van de perfecte behandeling of het boeken van een afspraak.",
      },
      default: {
        webhookUrl: "https://n8n.srv1160115.hstgr.cloud/webhook/dfbbd7ea-36bc-4d39-a70d-b2e867823f4f/chat",
        primary: "#fbbf24",
        secondary: "#f59e0b",
        headerName: "Joshua",
        headerSubtitle: "Stel gerust uw vragen",
        profileUrl: `${imagesBase}/joshua-profiel-48.jpg`,
        profileUrl2x: `${imagesBase}/joshua-profiel-96.jpg`,
        welcome: "Hallo, mijn naam is Joshua. Hoe kan ik u helpen?\n\nIk kan u helpen door vragen te beantwoorden over Smart-Scale of zelfs een afspraak voor u in te plannen!",
      },
    };

    const selected =
      path.includes("garage") ? configMap.garage :
      path.includes("schoonheid") ? configMap.schoonheid :
      path.includes("shopify") ? configMap.shopify :
      configMap.default;

    if (!selected) return;

    if (!document.getElementById("n8n-chat-style")) {
      const link = document.createElement("link");
      link.id = "n8n-chat-style";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css";
      document.head.appendChild(link);
    }

    const style = document.createElement("style");
    style.id = "n8n-chat-custom-style";
    style.textContent = `
      :root { --jm-primary: ${selected.primary}; --jm-primary-dark: ${selected.secondary}; }
      /* Never clip the launcher button so it stays a full circle. */
      .chat-window-wrapper, .n8n-chat, .chat-window-toggle, .n8n-chat__toggle { overflow: visible !important; }
      /* Hide n8n's default icon and render one consistent, fully-round speech-bubble launcher. */
      .n8n-chat__toggle, .chat-window-toggle {
        position: relative !important;
        width: 62px !important;
        height: 62px !important;
        border: 1px solid ${selected.primary} !important;
        border-radius: 50% !important;
        background-image: url("${CHAT_ICON_URI}"), linear-gradient(135deg, ${selected.primary}, ${selected.secondary}) !important;
        background-repeat: no-repeat, no-repeat !important;
        background-position: center, center !important;
        background-size: 28px 28px, auto !important;
        box-shadow: 0 16px 40px rgba(0,0,0,0.35) !important;
      }
      .n8n-chat__toggle > *, .chat-window-toggle > * { visibility: hidden !important; }
      .n8n-chat__panel header { background: #fbbf24 !important; color: #000000 !important; }
      .n8n-chat__footer button[type="submit"] { background: ${selected.primary} !important; border-color: ${selected.primary} !important; color: #fff !important; }
    `;
    document.head.appendChild(style);

    const { createChat } = await import("https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js");
    createChat({ webhookUrl: selected.webhookUrl, useShadowDom: false });

    // Apply custom header/profile/welcome similar to dist build
    const applyHeader = () => {
      const headerSelectors = [
        ".n8n-chat__header",
        ".chat-header",
        ".chat-heading",
        ".n8n-chat__panel header",
        ".widget-header",
        ".chat-widget-header",
      ];
      for (const sel of headerSelectors) {
        const el = qs(sel);
        if (!el) continue;
        const container = el.classList.contains("chat-header") ? el : el.closest(".chat-header");
        const isCard = Boolean(container && container.closest(".card"));
        const textColor = isCard ? "#ffffff" : "#000000";
        const objectPosition = selected.headerName === "Mike" ? "right center" : "center";
        const srcset = selected.profileUrl2x
          ? `${selected.profileUrl} 1x, ${selected.profileUrl2x} 2x`
          : "";
        const srcsetAttr = srcset ? `srcset="${srcset}"` : "";
        el.innerHTML = `
          <div class="jm-header" style="display:flex;align-items:center;gap:8px;justify-content:flex-start;text-align:left;color:${textColor} !important;">
            <img class="jm-header__img" src="${selected.profileUrl}" ${srcsetAttr} alt="${selected.headerName}" width="48" height="48" loading="lazy" decoding="async" style="width:48px;height:48px;border-radius:50%;object-fit:cover;object-position:${objectPosition};border:1px solid rgba(255,255,255,0.08);">
            <div style="color:${textColor} !important;font-weight:600;font-size:18px;line-height:1.2;">
              ${selected.headerName}
              <div style="color:${textColor} !important;font-size:13px;font-weight:400;margin-top:2px;line-height:1.2;">
                ${selected.headerSubtitle}
              </div>
            </div>
          </div>
        `;
        setInlineStyles(el, {
          background: "#fbbf24",
          color: textColor,
        });
        if (container) {
          const containerStyles = {
            background: isCard ? "transparent" : "#fbbf24",
            color: isCard ? "#fff" : "#000000",
          };
          if (isCard) containerStyles.paddingBottom = "20px";
          setInlineStyles(container, containerStyles);
        }
        // Remove default subtitle paragraphs like "Start a chat..."
        qsa("p", el.parentElement || el).forEach((p) => p.remove());
      }
      qsa(".card .chat-header, .card .chat-heading").forEach((cardHeader) =>
        setInlineStyles(cardHeader, { background: "transparent", color: "#fff", paddingBottom: "20px" })
      );
    };

    const applyWelcome = () => {
      const bubbles = qsa(".chat-message, .message, .bot-message, .n8n-chat__message, .bot, .message--bot");
      if (!bubbles.length) return;
      const primary = bubbles.find((b) => {
        const text = (b.textContent || "").trim();
        return !text || /hallo|welkom|hi|hey/i.test(text) || text.length < 200;
      }) || bubbles[0];
      const welcome = selected.welcome || primary.textContent || "";
      primary.textContent = welcome;
      bubbles.forEach((b) => {
        const text = (b.textContent || "").trim();
        if (b !== primary && (/my name is|how can i help/i.test(text) || text.length === 0)) {
          b.remove();
        }
      });
    };

    const recolor = () => {
      const toggle = qs(".n8n-chat__toggle") || qs(".chat-window-toggle");
      if (toggle) {
        toggle.style.background = "linear-gradient(135deg, var(--accent), var(--accent-2))";
        toggle.style.border = "1px solid var(--accent)";
        toggle.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
        toggle.style.color = "#0d0b06";
        toggle.classList.add("jm-cta-yellow");
      }
      qsa(".n8n-chat__panel header, .chat-header, .chat-heading, .chat-widget-header, .widget-header").forEach((heading) => {
        heading.style.background = "#fbbf24";
        heading.style.color = "#000000";
      });
      const sendBtn =
        qs(".n8n-chat__footer button[type='submit']") ||
        qs(".chat-input-send-button") ||
        qs(".chat-inputs-controls button");
      if (sendBtn) {
        sendBtn.classList.add("jm-cta-yellow");
        sendBtn.style.background = "var(--accent)";
        sendBtn.style.borderColor = "var(--accent)";
        sendBtn.style.color = "#0d0b06";
      }
      qsa(".n8n-chat__toggle, .chat-window-toggle").forEach((el) => el.classList.add("jm-cta-yellow"));
      qsa(".n8n-chat__quick-replies button, .n8n-chat__cta button, .chat-inputs-controls button, .chat-input-send-button").forEach((el) =>
        el.classList.add("jm-cta-yellow")
      );
    };

    const alignAndColor = () => {
      enforceChatUI();
    };

    const tryApply = () => {
      applyHeader();
      applyWelcome();
      recolor();
      alignAndColor();
    };

    setTimeout(tryApply, 400);
    setTimeout(tryApply, 1000);
    setTimeout(tryApply, 2000);
  }

  function hideRisposeFooter() {
    const widget = qs("cs-widget, .cs-widget");
    if (!widget) return false;
    const tryHideBySelector = (root) => {
      if (!root?.querySelectorAll) return false;
      const candidates = root.querySelectorAll(".text-xs.text-stone-500.border-t, .border-t.border-stone-200");
      const footer =
        candidates[0] ||
        Array.from(root.querySelectorAll("*")).find((el) => (el.textContent || "").toLowerCase().includes("powered by rispose"));
      if (footer) {
        footer.style.display = "none";
        footer.setAttribute("data-hidden", "true");
        return true;
      }
      return false;
    };

    const hiddenInLightDom = tryHideBySelector(widget);
    const hiddenInShadow = widget.shadowRoot ? tryHideBySelector(widget.shadowRoot) : false;

    if (hiddenInLightDom || hiddenInShadow) {
      enforceChatUI();
      return true;
    }

    widget.style.overflow = "hidden";
    widget.style.clipPath = "inset(0 0 28px 0)";
    widget.dataset.risposeFooterCropped = "true";
    enforceChatUI();
    return true;
  }

  function createChatLauncher(onClick) {
    if (qs("#jm-chat-launcher")) return qs("#jm-chat-launcher");
    const launcher = document.createElement("button");
    launcher.id = "jm-chat-launcher";
    launcher.className = "jm-chat-launcher";
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Open chat");
    setInlineStyles(launcher, {
      position: "fixed",
      right: "22px",
      bottom: "22px",
      width: "62px",
      height: "62px",
      borderRadius: "50%",
      border: "1px solid var(--accent)",
      backgroundImage: `url("${CHAT_ICON_URI}"), linear-gradient(135deg, var(--accent), var(--accent-2))`,
      backgroundRepeat: "no-repeat, no-repeat",
      backgroundPosition: "center, center",
      backgroundSize: "28px 28px, auto",
      boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)",
      cursor: "pointer",
      zIndex: "40",
    });
    if (onClick) launcher.addEventListener("click", onClick);
    document.body.appendChild(launcher);
    return launcher;
  }

  function scheduleChatInit() {
    let launcher = null;
    const startChat = () => {
      if (chatStarted) return;
      chatStarted = true;
      if (launcher) {
        launcher.setAttribute("aria-busy", "true");
        launcher.style.opacity = "0.7";
      }
      initRealChat();
      let tries = 0;
      const timer = setInterval(() => {
        const toggle = qs(".n8n-chat__toggle") || qs(".chat-window-toggle");
        if (toggle) {
          if (launcher) launcher.remove();
          toggle.click();
          clearInterval(timer);
          return;
        }
        if (tries > 20) {
          if (launcher) {
            launcher.removeAttribute("aria-busy");
            launcher.style.opacity = "1";
          }
          chatStarted = false;
          clearInterval(timer);
        }
        tries++;
      }, 250);
    };
    launcher = createChatLauncher(startChat);
  }

  // Animated plexus/constellation background for the brand hero. Canvas + rAF,
  // paused via IntersectionObserver when off-screen. Returns handles so the
  // load timeline (intro reveal) and scroll (fade-out) can drive it.
  function initNetworkCanvas(canvas, opts) {
    const ctx = canvas.getContext("2d");
    const reduced = Boolean(opts && opts.reduced);
    const ACCENT = "251, 191, 36";
    const LINK_DIST = 150;
    const MOUSE_RADIUS = 170;
    const MAX_PUSH = 18;
    const MAX_SCALE = 1.4;
    let w = 0, h = 0, dpr = 1, nodes = [], raf = null, running = false, last = 0;
    let intro = reduced ? 1 : 0; // 0..1 load reveal
    let scrollAlpha = 1;         // 1 -> 0.4 as the hero scrolls away
    const mouse = { x: 0, y: 0, active: false };
    // Only wire up listeners on mouse-driven devices; the RAF loop samples
    // mouse.x/y itself, the listener just records the raw position.
    const hasMouse = !reduced && typeof window.matchMedia === "function" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const build = () => {
      const count = Math.max(26, Math.min(40, Math.round((w * h) / 42000)));
      nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.025,
          vy: (Math.random() - 0.5) * 0.025,
          r: 2 + Math.random() * 4,
          delay: Math.random() * 0.6,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.6 + Math.random() * 0.8,
          ox: 0, oy: 0,       // cursor-repel offset, springs back to 0
          rx: 0, ry: 0,       // rendered position = natural position + offset
          mouseT: 0,          // 0..1 closeness to cursor, eased
        });
      }
    };
    const nodeAlpha = (n) => (reduced ? 1 : Math.max(0, Math.min(1, (intro - n.delay) / 0.4)));

    const draw = (dt) => {
      ctx.clearRect(0, 0, w, h);
      const mx = mouse.active ? mouse.x : null;
      const my = mouse.active ? mouse.y : null;
      // Frame-rate independent spring factor: reaches target over ~120ms,
      // smooth enough to never feel like a jittery snap-back.
      const spring = Math.min(1, dt / 120);
      const cursorLinks = []; // nodes within reach, for the temporary cursor lines

      for (const n of nodes) {
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        n.x = Math.max(0, Math.min(w, n.x));
        n.y = Math.max(0, Math.min(h, n.y));
        n.pulse += n.pulseSpeed * dt * 0.003;
        n.deg = 0; // connection count, recomputed each frame for the hub glow

        // Cursor repel: push away from the mouse, strength fades with distance.
        // Springs back to the natural drift position once out of reach.
        let targetOx = 0, targetOy = 0, targetT = 0;
        if (mx !== null) {
          const dx = n.x - mx, dy = n.y - my;
          const dist = Math.hypot(dx, dy) || 0.001;
          if (dist < MOUSE_RADIUS) {
            const t = 1 - dist / MOUSE_RADIUS; // 0 at radius edge, 1 at cursor
            targetT = t;
            const push = t * MAX_PUSH;
            targetOx = (dx / dist) * push;
            targetOy = (dy / dist) * push;
            cursorLinks.push({ n, dist });
          }
        }
        n.ox += (targetOx - n.ox) * spring;
        n.oy += (targetOy - n.oy) * spring;
        n.mouseT += (targetT - n.mouseT) * spring;
        n.rx = n.x + n.ox;
        n.ry = n.y + n.oy;
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dist = Math.hypot(a.rx - b.rx, a.ry - b.ry);
          if (dist >= LINK_DIST) continue;
          a.deg++;
          b.deg++;
          const al = (1 - dist / LINK_DIST) * 0.22 * nodeAlpha(a) * nodeAlpha(b) * scrollAlpha;
          if (al <= 0.003) continue;
          ctx.strokeStyle = `rgba(${ACCENT}, ${al})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.rx, a.ry);
          ctx.lineTo(b.rx, b.ry);
          ctx.stroke();
        }
      }
      // Temporary links from the cursor to the 1-3 closest nodes in reach,
      // same thin low-opacity style as the node-to-node connections.
      if (mx !== null && cursorLinks.length) {
        cursorLinks.sort((p, q) => p.dist - q.dist);
        for (const { n, dist } of cursorLinks.slice(0, 3)) {
          const al = (1 - dist / MOUSE_RADIUS) * 0.3 * nodeAlpha(n) * scrollAlpha;
          if (al <= 0.003) continue;
          ctx.strokeStyle = `rgba(${ACCENT}, ${al})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(n.rx, n.ry);
          ctx.stroke();
        }
      }
      // Additive blending so overlapping halos build up a warm aura.
      ctx.globalCompositeOperation = "lighter";
      for (const n of nodes) {
        const al = nodeAlpha(n) * scrollAlpha;
        if (al <= 0.003) continue;
        const glow = Math.sin(n.pulse) * 0.5 + 0.5;
        // Hub factor: more connections -> larger, stronger glow (visual hierarchy).
        const hub = Math.min(1, n.deg / 5);
        // Cursor proximity boosts glow size/intensity on top of the hub factor.
        const mt = n.mouseT;
        const core = n.r * (1 + glow * 0.2) * (1 + mt * (MAX_SCALE - 1));
        const glowR = core * (3 + hub * 4.5 + mt * 3) * (1 + glow * 0.18);
        // Layered radial halo mirrors a multi-stop box-shadow (tight -> wide, fading).
        const g = ctx.createRadialGradient(n.rx, n.ry, core * 0.6, n.rx, n.ry, glowR);
        g.addColorStop(0, `rgba(${ACCENT}, ${Math.min(1, (0.55 + hub * 0.2 + mt * 0.3) * al)})`);
        g.addColorStop(0.28, `rgba(${ACCENT}, ${Math.min(1, (0.22 + hub * 0.12 + mt * 0.2) * al)})`);
        g.addColorStop(0.6, `rgba(${ACCENT}, ${Math.min(1, (0.09 + hub * 0.06 + mt * 0.1) * al)})`);
        g.addColorStop(1, `rgba(${ACCENT}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.rx, n.ry, glowR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      // Crisp solid cores on top of the halos.
      for (const n of nodes) {
        const al = nodeAlpha(n) * scrollAlpha;
        if (al <= 0.003) continue;
        const glow = Math.sin(n.pulse) * 0.5 + 0.5;
        const scale = 1 + n.mouseT * (MAX_SCALE - 1);
        ctx.beginPath();
        ctx.arc(n.rx, n.ry, n.r * (1 + glow * 0.2) * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ACCENT}, ${Math.min(1, 0.85 * al + 0.15)})`;
        ctx.fill();
      }
    };
    const loop = (t) => {
      if (!running) return;
      const dt = last ? Math.min(40, t - last) : 16;
      last = t;
      draw(dt);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || reduced) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };

    resize();
    build();
    draw(16);
    window.addEventListener("resize", () => {
      resize();
      build();
      if (!running) draw(16);
    });

    if (hasMouse) {
      // Listen on the section (canvas's parent) so movement over the text/
      // buttons on top still updates the cursor position; the handler only
      // stores raw coordinates, all math happens in the RAF loop above.
      const host = canvas.parentElement || canvas;
      host.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;
      });
      host.addEventListener("mouseleave", () => {
        mouse.active = false;
      });
    }

    if (reduced) {
      draw(16);
    } else {
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())),
        { threshold: 0 }
      );
      io.observe(canvas);
    }

    return {
      setIntro: (v) => {
        intro = v;
        if (!running) draw(16);
      },
      setScrollAlpha: (v) => {
        scrollAlpha = v;
        if (!running) draw(16);
      },
    };
  }

  // Homepage scroll storytelling (GSAP + ScrollTrigger). Only runs on pages that
  // load GSAP and contain the relevant sections, so other pages are unaffected.
  function initHomeMotion() {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap) return;

    // Reduced motion: no pin/scrub. Draw a single static network frame, show the
    // call UI in its first state and list all phase captions as plain text.
    if (prefersReducedMotion) {
      const netCanvas = qs(".brandhero-net");
      if (netCanvas) initNetworkCanvas(netCanvas, { reduced: true });
      const cap = qs(".vhero .vhero-caption");
      if (cap) cap.classList.add("show-all");
      return;
    }
    if (!ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    // Lenis smooth scroll, synced to ScrollTrigger + GSAP's ticker so scrub
    // animations stay locked to the scroll position. Homepage only.
    const Lenis = window.Lenis;
    if (Lenis && qs(".brandhero")) {
      const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // --- 0. Brand hero: network background + load choreography ---
    const brand = qs(".brandhero");
    if (brand) {
      const netCanvas = qs(".brandhero-net", brand);
      const net = netCanvas ? initNetworkCanvas(netCanvas, { reduced: false }) : null;
      const wordmark = qs(".bh-wordmark", brand);
      const eyebrow = qs(".bh-eyebrow", brand);
      const sub = qs(".bh-sub", brand);
      const cta = qs(".bh-cta", brand);
      const cue = qs(".bh-scroll", brand);

      gsap.set([eyebrow, sub, cta].filter(Boolean), { opacity: 0, y: 20 });
      gsap.set(wordmark, { opacity: 0, scale: 0.95 });
      if (cue) gsap.set(cue, { opacity: 0 });

      const intro = { v: 0 };
      const tl = gsap.timeline();
      tl.to(intro, { v: 1, duration: 1.5, ease: "power2.out", onUpdate: () => net && net.setIntro(intro.v) }, 0);
      if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.7);
      if (wordmark) tl.to(wordmark, { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out" }, 0.8);
      tl.to([sub, cta].filter(Boolean), { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "power3.out" }, 1.0);
      if (cue) tl.to(cue, { opacity: 1, duration: 0.6 }, 1.4);

      // Scroll away: content lifts + fades, nodes dim so the section "stays behind".
      gsap.to(qs(".brandhero-content", brand), {
        opacity: 0,
        y: -30,
        ease: "none",
        scrollTrigger: { trigger: brand, start: "top top", end: "bottom 45%", scrub: true },
      });
      if (net) {
        ScrollTrigger.create({
          trigger: brand,
          start: "top top",
          end: "bottom top",
          scrub: true,
          onUpdate: (self) => net.setScrollAlpha(1 - self.progress * 0.6),
        });
      }
    }

    // --- 1. Websites: pinned code -> site transformation (3 phases) ---
    const webstage = qs(".webstage");
    if (webstage) {
      const codeLines = qsa(".cln", webstage);
      const code = qs(".webcode", webstage);
      const site = qs(".websiteview", webstage);
      const scan = qs(".webscan", webstage);
      const cards = qsa(".bl-card", webstage);
      const blocks = qsa(".webblock", webstage);
      const mmWeb = gsap.matchMedia();

      // Desktop: pin the grid and run one linear timeline across ~2.6 screens.
      mmWeb.add("(min-width: 901px)", () => {
        gsap.set(codeLines, { opacity: 0, y: -8 });
        gsap.set(code, { opacity: 1 });
        gsap.set(site, { clipPath: "inset(0 100% 0 0)" });
        if (scan) gsap.set(scan, { opacity: 0, left: "0%" });
        if (cards.length) gsap.set(cards, { opacity: 0, y: 10 });
        gsap.set(blocks, { opacity: 0, y: 15 });
        gsap.set(blocks[0], { opacity: 1, y: 0 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: webstage,
            start: "top top",
            end: "+=2600",
            pin: ".webstage-pin",
            anticipatePin: 1,
            scrub: true,
          },
        });

        // Phase 1 (0-30%): code lines type in from top to bottom.
        tl.to(codeLines, { opacity: 1, y: 0, stagger: 0.05, duration: 3 }, 0);

        // Phase 2 (30-70%): one continuous wipe reveals the mockup over the
        // code, driven directly by scroll progress (no separate fades/eases).
        // The scan line rides the clip-path boundary the whole way.
        if (blocks[0]) tl.to(blocks[0], { opacity: 0, y: -15, duration: 0.6 }, 3);
        if (blocks[1]) tl.to(blocks[1], { opacity: 1, y: 0, duration: 0.6 }, 3.3);
        if (scan) tl.to(scan, { opacity: 1, duration: 0.2 }, 3);

        const wipe = { p: 0 };
        tl.to(
          wipe,
          {
            p: 1,
            duration: 4,
            onUpdate: () => {
              const pct = wipe.p * 100;
              site.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
              if (scan) scan.style.left = pct + "%";
            },
          },
          3
        );

        // The layered cards fade in with a short stagger once the wipe has
        // swept past them, so the reveal itself feels stepped, not instant.
        if (cards.length) tl.to(cards, { opacity: 1, y: 0, stagger: 0.05, duration: 0.5 }, 6.4);

        // Code stays visible in the background until the wipe has fully
        // covered it, then it (and the scan line) fade out in one beat.
        tl.to([code, scan].filter(Boolean), { opacity: 0, duration: 0.3 }, 6.9);

        // Phase 3 (70-100%): site fully up, final block + CTA, idle glow (CSS).
        if (blocks[1]) tl.to(blocks[1], { opacity: 0, y: -15, duration: 0.6 }, 7);
        if (blocks[2]) tl.to(blocks[2], { opacity: 1, y: 0, duration: 0.6 }, 7.3);
        tl.to({}, { duration: 2.6 }, 7.3);

        return () => {
          if (tl.scrollTrigger) tl.scrollTrigger.kill();
          tl.kill();
          site.style.clipPath = "";
          if (scan) scan.style.left = "";
        };
      });
      // Mobile/reduced: CSS stacks the three text blocks and shows the site as-is.
    }

    // --- 2. Voicebot hero: premium call-UI sticky journey ---
    const stage = qs(".vhero");
    if (stage) {
      const states = qsa(".call-state", stage);
      const phases = qsa(".v-phase", stage);
      const dots = qsa(".callsteps i", stage);
      const timer = qs(".cs-timer", stage);
      const screen = qs(".phone-screen", stage);
      const slideInner = qs("[data-slide-inner]", stage);

      const fmt = (s) => "0" + Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
      const setStep = (i) => {
        states.forEach((s, idx) => s.classList.toggle("is-active", idx === i));
        phases.forEach((p, idx) => p.classList.toggle("is-active", idx === i));
        dots.forEach((d, idx) => d.classList.toggle("is-active", idx === i));
        if (screen) screen.classList.toggle("is-ringing", i === 0);
      };

      const mm = gsap.matchMedia();

      // Desktop: pin the hero and advance the call states phase by phase on scroll.
      mm.add("(min-width: 901px)", () => {
        const segment = 1 / states.length;
        const st = ScrollTrigger.create({
          trigger: stage,
          start: "top top",
          end: "+=3600",
          pin: ".vhero-pin",
          anticipatePin: 1,
          onUpdate: (self) => {
            const i = Math.min(states.length - 1, Math.floor(self.progress * states.length));
            setStep(i);
            if (timer) timer.textContent = fmt(Math.round(self.progress * 28));
            // Scrollen is de "swipe": binnen fase 1 schuift de knop mee met de scrollprogressie.
            if (slideInner) {
              const p = Math.max(0, Math.min(1, self.progress / segment));
              slideInner.style.setProperty("--p", p);
            }
          },
        });
        return () => {
          st.kill();
          setStep(0);
          if (slideInner) slideInner.style.setProperty("--p", 0);
        };
      });

      // Mobile/tablet: no pin. The phone shows the incoming-call state and the
      // phase captions stack as a readable list (handled in CSS).
    }

    // --- 3. AI Automations: pinned workflow journey ---
    // Left: six process steps with active/completed states. Right: one
    // continuously growing automation interface. Finished panels collapse
    // into compact "done" rows so the data visibly carries over per step.
    const auto = qs("[data-autoflow]");
    if (auto) {
      const afSteps = qsa("[data-af-step]", auto);
      const afPanels = qsa("[data-af-panel]", auto);
      const afIdle = qs("[data-af-idle]", auto);
      const afStatus = qs("[data-af-status]", auto);
      const afRail = qs("[data-af-rail]", auto);
      const IDLE_STATUS = "Wachten op nieuwe aanvraag…";
      const STATUSES = [
        "Nieuwe lead ontvangen",
        "AI analyseert de aanvraag…",
        "CRM wordt bijgewerkt…",
        "Follow-up wordt verstuurd…",
        "Afspraak wordt ingepland…",
        "Workflow voltooid ✓",
      ];

      const mmAuto = gsap.matchMedia();

      mmAuto.add("(min-width: 901px)", () => {
        auto.classList.add("is-live");
        let lastKey = "";

        const apply = (progress) => {
          const n = afSteps.length;
          const raw = Math.min(n - 0.001, progress * n);
          const i = Math.floor(raw);
          // First third of phase 1 stays idle, then the lead "arrives".
          const leadIn = i === 0 && raw - i < 0.33;
          if (afRail) afRail.style.transform = "scaleX(" + progress + ")";
          const key = i + (leadIn ? "a" : "b");
          if (key === lastKey) return;
          lastKey = key;
          afSteps.forEach((s, idx) => {
            s.classList.toggle("is-active", idx === i);
            s.classList.toggle("is-done", idx < i);
          });
          afPanels.forEach((p, idx) => {
            p.classList.toggle("is-on", idx === i && !leadIn);
            p.classList.toggle("is-done", idx < i);
          });
          if (afIdle) afIdle.classList.toggle("is-off", !leadIn);
          if (afStatus) afStatus.textContent = leadIn ? IDLE_STATUS : STATUSES[i];
        };

        const st = ScrollTrigger.create({
          trigger: auto,
          start: "top top",
          end: "+=3200",
          pin: ".autoflow-pin",
          anticipatePin: 1,
          onUpdate: (self) => apply(self.progress),
        });
        apply(0);

        return () => {
          st.kill();
          auto.classList.remove("is-live");
          afSteps.forEach((s) => s.classList.remove("is-active", "is-done"));
          afPanels.forEach((p) => p.classList.remove("is-on", "is-done"));
          if (afIdle) afIdle.classList.remove("is-off");
          if (afStatus) afStatus.textContent = "Workflow actief";
          if (afRail) afRail.style.transform = "";
        };
      });

      // Mobile: stacked step + visual pairs with a simple reveal per panel.
      mmAuto.add("(max-width: 900px)", () => {
        gsap.set(afPanels, { opacity: 0, y: 18 });
        ScrollTrigger.batch(afPanels, {
          start: "top 88%",
          onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, overwrite: true }),
        });
      });
    }

    // --- Generic fade-ins for remaining sections ---
    const fades = qsa("[data-fade]").filter((el) => !el.closest(".autoflow"));
    if (fades.length) {
      gsap.set(fades, { opacity: 0, y: 20 });
      ScrollTrigger.batch(fades, {
        start: "top 88%",
        onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, overwrite: true }),
      });
    }

    ScrollTrigger.refresh();
  }

  function init() {
    initNav();
    initSmoothScroll();
    initReveal();
    initTypewriter();
    initAccordion();
    initParallax();
    initHomeMotion();
    scheduleChatInit();
    let tries = 0;
    const footerTimer = setInterval(() => {
      if (hideRisposeFooter() || tries > 25) clearInterval(footerTimer);
      tries++;
    }, 300);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
