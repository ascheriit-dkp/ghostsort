const ZERO_WIDTH_SPACE = "\u200B";

const form = document.querySelector("#generator-form");
const input = document.querySelector("#item-count");

const results = document.querySelector("#results");
const prefixList = document.querySelector("#prefix-list");

const flipButton = document.querySelector("#flip-button");
const resetButton = document.querySelector("#reset-button");
const status = document.querySelector("#status");

let itemCount = 0;
let flipped = false;
let invalidTimer = null;

input.addEventListener("input", () => {
  if (input.value === "") {
    return;
  }

  const value = Number(input.value);

  if (Number.isFinite(value) && value > 99) {
    input.value = "";
    input.classList.add("invalid");
    input.setAttribute("aria-invalid", "true");

    status.textContent = "Enter a number from 1 to 99.";

    clearTimeout(invalidTimer);

    invalidTimer = setTimeout(() => {
      input.classList.remove("invalid");
      input.removeAttribute("aria-invalid");
    }, 650);

    return;
  }

  clearTimeout(invalidTimer);
  input.classList.remove("invalid");
  input.removeAttribute("aria-invalid");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const count = Number(input.value);

  if (!Number.isInteger(count) || count < 1 || count > 99) {
    input.focus();
    return;
  }

  itemCount = count;
  flipped = false;

  render();
});

flipButton.addEventListener("click", () => {
  flipped = !flipped;
  render();
});

resetButton.addEventListener("click", () => {
  itemCount = 0;
  flipped = false;

  prefixList.innerHTML = "";
  results.hidden = true;

  clearTimeout(invalidTimer);
  input.classList.remove("invalid");
  input.removeAttribute("aria-invalid");

  input.value = "";
  input.focus();
});

function getPrefixCount(index) {
  if (flipped) {
    return index + 1;
  }

  return itemCount - index;
}

function render() {
  prefixList.innerHTML = "";

  for (let index = 0; index < itemCount; index++) {
    const prefixCount = getPrefixCount(index);
    const prefix = ZERO_WIDTH_SPACE.repeat(prefixCount);

    const row = document.createElement("button");

    row.type = "button";
    row.className = "prefix-row";

    const rank = String(index + 1).padStart(2, "0");

    row.innerHTML = `
      <span class="rank">#${rank}</span>
      <span class="count">U+200B × ${prefixCount}</span>
      <span class="copy-state">copy</span>
    `;

    row.addEventListener("click", async () => {
      const copied = await copyToClipboard(prefix);

      if (!copied) {
        status.textContent = "Could not copy prefix.";
        return;
      }

      row.classList.add("copied");

      const copyState = row.querySelector(".copy-state");
      copyState.textContent = "copied";

      status.textContent =
        `Copied ${prefixCount} invisible character${prefixCount === 1 ? "" : "s"}.`;
    });

    prefixList.appendChild(row);
  }

  results.hidden = false;
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }

  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(textarea);

  textarea.focus();
  textarea.select();

  let success = false;

  try {
    success = document.execCommand("copy");
  } catch {
    success = false;
  }

  textarea.remove();

  return success;
}

/* demo */

const demo = document.querySelector(".demo");

if (demo) {
  const demoStage = demo.querySelector(".demo-stage");
  const demoCursor = demo.querySelector(".demo-cursor");

  const demoInput = demo.querySelector("[data-demo-input]");
  const demoInputValue = demo.querySelector("[data-demo-input-value]");
  const demoGenerate = demo.querySelector("[data-demo-generate]");
  const demoPrefixes = demo.querySelector("[data-demo-prefixes]");

  const demoFolderList = demo.querySelector("[data-demo-folder-list]");

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let demoVisible = false;
  let demoRunning = false;
  let demoToken = 0;

  const initialOrder = [
    "archive",
    "personal",
    "work"
  ];

  const finalOrder = [
    "work",
    "personal",
    "archive"
  ];

  function getDemoFolder(name) {
    return demo.querySelector(
      `[data-demo-folder="${name}"]`
    );
  }

  function getDemoCopyRow(number) {
    return demo.querySelector(
      `[data-demo-copy="${number}"]`
    );
  }

  function pause(milliseconds, token) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          token === demoToken &&
          demoVisible &&
          !reduceMotion.matches
        );
      }, milliseconds);
    });
  }

  function reorderFolders(order, animate = true) {
    const folders = order.map(getDemoFolder);

    if (!animate) {
      folders.forEach((folder) => {
        demoFolderList.appendChild(folder);
        folder.style.transition = "";
        folder.style.transform = "";
      });

      return;
    }

    const before = new Map();

    folders.forEach((folder) => {
      before.set(
        folder,
        folder.getBoundingClientRect().top
      );
    });

    folders.forEach((folder) => {
      demoFolderList.appendChild(folder);
    });

    folders.forEach((folder) => {
      const after = folder.getBoundingClientRect().top;
      const delta = before.get(folder) - after;

      folder.style.transition = "none";
      folder.style.transform = `translateY(${delta}px)`;
    });

    demoFolderList.getBoundingClientRect();

    folders.forEach((folder) => {
      folder.style.transition = "";
      folder.style.transform = "";
    });
  }

  function resetDemo() {
    demoInputValue.textContent = "";

    demoInput.classList.remove("demo-focused");
    demoGenerate.classList.remove("demo-pressed");

    demoPrefixes.classList.remove("demo-visible");

    demo.querySelectorAll(".demo-prefix-row").forEach((row) => {
      row.classList.remove("demo-copied");

      const copyState = row.querySelector(
        "[data-demo-copy-state]"
      );

      copyState.textContent = "copy";
    });

    demo.querySelectorAll(".demo-folder").forEach((folder) => {
      folder.classList.remove(
        "demo-selected",
        "demo-renaming"
      );

      folder.querySelector(
        ".demo-prefix-note"
      ).textContent = "";

      folder.style.transform = "";
      folder.style.transition = "";
    });

    reorderFolders(initialOrder, false);

    demoCursor.classList.remove(
      "demo-visible",
      "demo-clicking"
    );

    demoCursor.style.transform =
      "translate3d(0, 0, 0)";
  }

  function showReducedMotionState() {
    demoInputValue.textContent = "3";
    demoPrefixes.classList.add("demo-visible");

    reorderFolders(finalOrder, false);

    getDemoCopyRow(1)
      .querySelector("[data-demo-copy-state]")
      .textContent = "copied";

    getDemoCopyRow(2)
      .querySelector("[data-demo-copy-state]")
      .textContent = "copied";

    getDemoCopyRow(3)
      .querySelector("[data-demo-copy-state]")
      .textContent = "copied";

    getDemoCopyRow(1).classList.add("demo-copied");
    getDemoCopyRow(2).classList.add("demo-copied");
    getDemoCopyRow(3).classList.add("demo-copied");

    demoCursor.classList.remove("demo-visible");
  }

  async function moveDemoCursorTo(
    target,
    token,
    xRatio = 0.5,
    yRatio = 0.5
  ) {
    const stageRect =
      demoStage.getBoundingClientRect();

    const targetRect =
      target.getBoundingClientRect();

    const x =
      targetRect.left -
      stageRect.left +
      targetRect.width * xRatio;

    const y =
      targetRect.top -
      stageRect.top +
      targetRect.height * yRatio;

    demoCursor.classList.add("demo-visible");

    demoCursor.style.transform =
      `translate3d(${x}px, ${y}px, 0)`;

    return pause(720, token);
  }

  async function demoClick(target, token) {
    if (!await moveDemoCursorTo(target, token)) {
      return false;
    }

    demoCursor.classList.add("demo-clicking");

    target.classList.add("demo-pressed");

    if (!await pause(120, token)) {
      return false;
    }

    demoCursor.classList.remove("demo-clicking");
    target.classList.remove("demo-pressed");

    return pause(150, token);
  }

  async function copyDemoPrefix(number, token) {
    const row = getDemoCopyRow(number);

    if (!await demoClick(row, token)) {
      return false;
    }

    row.classList.add("demo-copied");

    row.querySelector(
      "[data-demo-copy-state]"
    ).textContent = "copied";

    return pause(300, token);
  }

  async function renameDemoFolder(
    folderName,
    prefixCount,
    order,
    token
  ) {
    const folder = getDemoFolder(folderName);

    if (!await moveDemoCursorTo(
      folder,
      token,
      0.42,
      0.5
    )) {
      return false;
    }

    folder.classList.add(
      "demo-selected",
      "demo-renaming"
    );

    folder.querySelector(
      ".demo-prefix-note"
    ).textContent =
      `+ U+200B × ${prefixCount}`;

    if (!await pause(700, token)) {
      return false;
    }

    reorderFolders(order);

    if (!await pause(480, token)) {
      return false;
    }

    folder.classList.remove(
      "demo-selected",
      "demo-renaming"
    );

    folder.querySelector(
      ".demo-prefix-note"
    ).textContent = "";

    return pause(250, token);
  }

  async function runDemo(token) {
    resetDemo();

    if (!await pause(600, token)) {
      return;
    }

    if (!await moveDemoCursorTo(
      demoInput,
      token,
      0.35,
      0.5
    )) {
      return;
    }

    demoInput.classList.add("demo-focused");

    if (!await pause(350, token)) {
      return;
    }

    demoInputValue.textContent = "3";

    if (!await pause(500, token)) {
      return;
    }

    demoInput.classList.remove("demo-focused");

    if (!await demoClick(
      demoGenerate,
      token
    )) {
      return;
    }

    demoPrefixes.classList.add("demo-visible");

    if (!await pause(700, token)) {
      return;
    }

    if (!await copyDemoPrefix(1, token)) {
      return;
    }

    if (!await renameDemoFolder(
      "work",
      3,
      [
        "work",
        "archive",
        "personal"
      ],
      token
    )) {
      return;
    }

    if (!await copyDemoPrefix(2, token)) {
      return;
    }

    if (!await renameDemoFolder(
      "personal",
      2,
      [
        "work",
        "personal",
        "archive"
      ],
      token
    )) {
      return;
    }

    if (!await copyDemoPrefix(3, token)) {
      return;
    }

    if (!await renameDemoFolder(
      "archive",
      1,
      finalOrder,
      token
    )) {
      return;
    }

    demoCursor.classList.remove("demo-visible");

    if (!await pause(1800, token)) {
      return;
    }

    if (
      token === demoToken &&
      demoVisible &&
      !reduceMotion.matches
    ) {
      runDemo(token);
    }
  }

  function startDemo() {
    if (
      demoRunning ||
      !demoVisible ||
      reduceMotion.matches
    ) {
      return;
    }

    demoRunning = true;

    const token = ++demoToken;

    runDemo(token).finally(() => {
      if (token === demoToken) {
        demoRunning = false;
      }
    });
  }

  function stopDemo() {
    demoVisible = false;
    demoRunning = false;
    demoToken++;

    resetDemo();
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;

      if (entry.isIntersecting) {
        demoVisible = true;

        if (reduceMotion.matches) {
          resetDemo();
          showReducedMotionState();
          return;
        }

        startDemo();
        return;
      }

      stopDemo();
    },
    {
      threshold: 0.25
    }
  );

  observer.observe(demo);

  reduceMotion.addEventListener("change", () => {
    demoToken++;
    demoRunning = false;

    resetDemo();

    if (!demoVisible) {
      return;
    }

    if (reduceMotion.matches) {
      showReducedMotionState();
      return;
    }

    startDemo();
  });
}
