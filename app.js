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
  const DEMO_SPEED = 1.2;

  const demoStage = demo.querySelector(".demo-stage");
  const demoCursor = demo.querySelector(".demo-cursor");

  const demoInput = demo.querySelector("[data-demo-input]");
  const demoInputValue = demo.querySelector(
    "[data-demo-input-value]"
  );
  const demoGenerate = demo.querySelector(
    "[data-demo-generate]"
  );
  const demoPrefixes = demo.querySelector(
    "[data-demo-prefixes]"
  );

  const demoExplorerWindow = demo.querySelector(
    ".demo-explorer-window"
  );
  const demoRenameOption = demo.querySelector(
    "[data-demo-rename-option]"
  );
  const demoShortcut = demo.querySelector(
    "[data-demo-shortcut]"
  );
  const demoFolderList = demo.querySelector(
    "[data-demo-folder-list]"
  );

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

  function demoDuration(milliseconds) {
    return Math.round(milliseconds / DEMO_SPEED);
  }

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
      }, demoDuration(milliseconds));
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
    demoShortcut.classList.remove("demo-visible");

    demoExplorerWindow.classList.remove(
      "demo-has-selection"
    );

    demo.querySelectorAll(".demo-prefix-row").forEach((row) => {
      row.classList.remove(
        "demo-copied",
        "demo-pressed"
      );

      const copyState = row.querySelector(
        "[data-demo-copy-state]"
      );

      copyState.textContent = "copy";
    });

    demo.querySelectorAll(".demo-folder").forEach((folder) => {
      folder.classList.remove(
        "demo-selected",
        "demo-renaming",
        "demo-caret-start",
        "demo-pressed"
      );

      folder.style.transform = "";
      folder.style.transition = "";
    });

    demoRenameOption.classList.remove("demo-pressed");

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

    for (let number = 1; number <= 3; number++) {
      const row = getDemoCopyRow(number);

      row.classList.add("demo-copied");

      row.querySelector(
        "[data-demo-copy-state]"
      ).textContent = "copied";
    }

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

    return pause(840, token);
  }

  async function demoClick(
    target,
    token,
    xRatio = 0.5,
    yRatio = 0.5
  ) {
    if (!await moveDemoCursorTo(
      target,
      token,
      xRatio,
      yRatio
    )) {
      return false;
    }

    demoCursor.classList.add("demo-clicking");
    target.classList.add("demo-pressed");

    if (!await pause(160, token)) {
      return false;
    }

    demoCursor.classList.remove("demo-clicking");
    target.classList.remove("demo-pressed");

    return pause(220, token);
  }

  async function copyDemoPrefix(number, token) {
    const row = getDemoCopyRow(number);

    if (!await demoClick(
      row,
      token,
      0.84,
      0.5
    )) {
      return false;
    }

    row.classList.add("demo-copied");

    row.querySelector(
      "[data-demo-copy-state]"
    ).textContent = "copied";

    return pause(480, token);
  }

  async function renameDemoFolder(
    folderName,
    order,
    token
  ) {
    const folder = getDemoFolder(folderName);

    const folderNameElement = folder.querySelector(
      ".demo-folder-name"
    );

    /*
     * Select folder.
     */
    if (!await demoClick(
      folder,
      token,
      0.35,
      0.5
    )) {
      return false;
    }

    folder.classList.add("demo-selected");

    demoExplorerWindow.classList.add(
      "demo-has-selection"
    );

    if (!await pause(520, token)) {
      return false;
    }

    /*
     * Click Explorer's Rename command.
     */
    if (!await demoClick(
      demoRenameOption,
      token
    )) {
      return false;
    }

    folder.classList.add("demo-renaming");

    if (!await pause(480, token)) {
      return false;
    }

    /*
     * Click at the beginning of the filename.
     */
    if (!await demoClick(
      folderNameElement,
      token,
      0.04,
      0.5
    )) {
      return false;
    }

    folder.classList.add("demo-caret-start");

    if (!await pause(420, token)) {
      return false;
    }

    /*
     * Paste the invisible prefix.
     */
    demoShortcut.classList.add("demo-visible");

    if (!await pause(1000, token)) {
      return false;
    }

    demoShortcut.classList.remove("demo-visible");

    folder.classList.remove("demo-caret-start");

    /*
     * Explorer re-sorts the folder.
     */
    reorderFolders(order);

    if (!await pause(680, token)) {
      return false;
    }

    folder.classList.remove(
      "demo-selected",
      "demo-renaming"
    );

    demoExplorerWindow.classList.remove(
      "demo-has-selection"
    );

    return pause(520, token);
  }

  async function runDemo(token) {
    while (
      token === demoToken &&
      demoVisible &&
      !reduceMotion.matches
    ) {
      resetDemo();

      if (!await pause(800, token)) {
        return;
      }

      /*
       * Enter 3 in GhostSort.
       */
      if (!await demoClick(
        demoInput,
        token,
        0.25,
        0.5
      )) {
        return;
      }

      demoInput.classList.add("demo-focused");

      if (!await pause(420, token)) {
        return;
      }

      demoInputValue.textContent = "3";

      if (!await pause(620, token)) {
        return;
      }

      demoInput.classList.remove("demo-focused");

      /*
       * Generate prefixes.
       */
      if (!await demoClick(
        demoGenerate,
        token
      )) {
        return;
      }

      demoPrefixes.classList.add("demo-visible");

      if (!await pause(900, token)) {
        return;
      }

      /*
       * Work → #01
       */
      if (!await copyDemoPrefix(1, token)) {
        return;
      }

      if (!await renameDemoFolder(
        "work",
        [
          "work",
          "archive",
          "personal"
        ],
        token
      )) {
        return;
      }

      /*
       * Personal → #02
       */
      if (!await copyDemoPrefix(2, token)) {
        return;
      }

      if (!await renameDemoFolder(
        "personal",
        [
          "work",
          "personal",
          "archive"
        ],
        token
      )) {
        return;
      }

      /*
       * Archive → #03
       */
      if (!await copyDemoPrefix(3, token)) {
        return;
      }

      if (!await renameDemoFolder(
        "archive",
        finalOrder,
        token
      )) {
        return;
      }

      demoCursor.classList.remove("demo-visible");

      /*
       * Leave final order visible before looping.
       */
      if (!await pause(2200, token)) {
        return;
      }
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