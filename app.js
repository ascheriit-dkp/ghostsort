const ZERO_WIDTH_SPACE = "\u200B";

const form = document.querySelector("#generator-form");
const input = document.querySelector("#item-count");

const results = document.querySelector("#results");
const prefixList = document.querySelector("#prefix-list");

const flipButton = document.querySelector("#flip-button");
const resetButton = document.querySelector("#reset-button");
const status = document.querySelector("#status");

const cleanupInput = document.querySelector("#cleanup-input");
const cleanupCopyButton = document.querySelector(
  "#cleanup-copy-button"
);
const cleanupFeedback = document.querySelector(
  "#cleanup-feedback"
);

let itemCount = 0;
let flipped = false;
let invalidTimer = null;
let cleanupCopyTimer = null;

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

/* cleanup */

function countZeroWidthSpaces(text) {
  return text.split(ZERO_WIDTH_SPACE).length - 1;
}

cleanupInput.addEventListener("input", () => {
  clearTimeout(cleanupCopyTimer);

  cleanupCopyButton.classList.remove("copied");
  cleanupCopyButton.textContent = "copy cleaned text";

  if (cleanupInput.value === "") {
    cleanupFeedback.textContent = "removes U+200B.";
    return;
  }

  const count = countZeroWidthSpaces(cleanupInput.value);

  if (count === 0) {
    cleanupFeedback.textContent = "no U+200B found.";
    return;
  }

  cleanupFeedback.textContent =
    `${count} invisible character${count === 1 ? "" : "s"} found.`;
});

cleanupCopyButton.addEventListener("click", async () => {
  const original = cleanupInput.value;

  if (original === "") {
    cleanupFeedback.textContent = "nothing to clean.";
    cleanupInput.focus();
    return;
  }

  const removed = countZeroWidthSpaces(original);

  const cleaned = original
    .split(ZERO_WIDTH_SPACE)
    .join("");

  const copied = await copyToClipboard(cleaned);

  if (!copied) {
    cleanupFeedback.textContent =
      "could not copy cleaned text.";

    return;
  }

  cleanupInput.value = cleaned;

  cleanupCopyButton.classList.add("copied");
  cleanupCopyButton.textContent = "copied";

  if (removed === 0) {
    cleanupFeedback.textContent =
      "nothing to remove. copied anyway.";
  } else {
    cleanupFeedback.textContent =
      `${removed} invisible character${removed === 1 ? "" : "s"} removed. copied.`;
  }

  clearTimeout(cleanupCopyTimer);

  cleanupCopyTimer = setTimeout(() => {
    cleanupCopyButton.classList.remove("copied");
    cleanupCopyButton.textContent = "copy cleaned text";
  }, 1200);
});
