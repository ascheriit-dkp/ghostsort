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