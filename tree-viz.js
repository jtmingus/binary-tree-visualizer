const state = {
  // Node values
  nodes: [],
  // Node positions. Indexes correspon to order of nodes.
  positions: [],
  // Amount tree has been dragged.
  treeDelta: { x: 0, y: 0 },
  mouseDown: false,
  lastMousePos: null,
};

const DEFAULT_NODES = [1, 2, 3, 4, 5, 6, 7, 8, null, 10];
const NODES_LOCAL_STORAGE_KEY = "treeNodes";
function load() {
  const savedNodes = localStorage.getItem(NODES_LOCAL_STORAGE_KEY);
  state.nodes = savedNodes ? JSON.parse(savedNodes) : DEFAULT_NODES;

  // Write nodes to the UI.
  const textArea = document.getElementById("textAreaNodes");
  textArea.value = JSON.stringify(state.nodes);

  // Add event listeners.
  const canvas = document.getElementById("myCanvas");
  // TODO: Figure out how to track multiple touch events.
  canvas.addEventListener("mousedown", mouseDown);
  canvas.addEventListener("mouseup", mouseUp);
  canvas.addEventListener("mousemove", mouseMove);

  initCanvasSize();
}

/**
 * Initializes the canvas size and draws the tree.
 */
function initCanvasSize() {
  const canvas = document.getElementById("myCanvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  draw();
}

function updateTreeNodes() {
  let textValue = document.getElementById("textAreaNodes").value;
  textValue = textValue.trim();
  textValue = textValue.substring(1, textValue.length - 1);
  let newNodes;
  try {
    // Parse text values.
    newNodes = textValue.split(",").map((value) => {
      if (!value.length) return null;
      const trimmedValue = value.trim();
      console.log(trimmedValue);
      const regex = new RegExp("(null|undefined|[0-9]+)");
      if (!regex.test(trimmedValue)) {
        throw new Error("Array contains invalid values.");
      }

      if (trimmedValue === "null" || trimmedValue === "undefined") {
        return null;
      }

      return Number(trimmedValue);
    });

    for (let i = 0; i < state.nodes.length; i++) {
      if (
        state.nodes[i] !== null &&
        state.nodes[Math.floor((i - 1) / 2)] === null
      ) {
        throw new Error(
          "Not a valid tree input. Missing nodes can't have children nodes."
        );
      }
    }
  } catch (e) {
    window.alert(e.message);
    return;
  }

  state.nodes = newNodes;
  localStorage.setItem(NODES_LOCAL_STORAGE_KEY, JSON.stringify(newNodes));

  window.requestAnimationFrame(draw);
}

function draw() {
  if (!state.nodes) {
    return;
  }

  const canvas = document.getElementById("myCanvas");
  if (!canvas.getContext) return;
  const ctx = canvas.getContext("2d");

  const w = canvas.width;
  const h = canvas.height;
  const padding = 24;
  ctx.clearRect(0, 0, w, h);
  const centerX = w / 2;

  const levels = Math.ceil(Math.log2(state.nodes.length + 1));
  // Find the min diameter so that the nodes can fit vertically and horizontally.
  const diameter = Math.min(h / levels, w / (state.nodes.length / 2)) * 0.8;
  const radius = diameter / 2;
  const verticalSpacing = (h - 2 * padding - diameter * levels) / (levels - 1);

  // Calculate positions of each node.
  state.positions = [];
  for (let i = 0; i < levels; i++) {
    const yPos =
      i * (diameter + verticalSpacing) + radius + padding + state.treeDelta.y;
    const start = Math.pow(2, i) - 1;
    const levelCount = Math.pow(2, i + 1) - 1 - start;
    for (
      let j = start;
      j < Math.pow(2, i + 1) - 1 && j < state.nodes.length;
      j++
    ) {
      const even = (j - start) % 2 == 0;
      const xOffset = w / (levelCount + 1);
      let xPos = xOffset + (j - start) * xOffset + state.treeDelta.x;

      state.positions.push([xPos, yPos]);

      if (state.nodes[j] === null || state.nodes[j] === undefined) {
        continue;
      }
    }
  }

  // Draw nodes and edges.
  for (let i = 0; i < state.nodes.length; i++) {
    if (state.nodes[i] === null) continue;
    const [xPos, yPos] = state.positions[i];
    ctx.beginPath();
    ctx.fillStyle = "#000";
    ctx.arc(xPos, yPos, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw edges.
    if (i == 0) continue;
    const parentPosition = state.positions[Math.floor((i - 1) / 2)];
    ctx.beginPath();
    ctx.moveTo(xPos, yPos);
    ctx.lineTo(parentPosition[0], parentPosition[1]);
    ctx.stroke();
  }

  // Draw labels last.
  for (let i = 0; i < state.nodes.length; i++) {
    if (state.nodes[i] === null) continue;
    const [xPos, yPos] = state.positions[i];
    ctx.font = `${radius}px Tahoma`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText(state.nodes[i], xPos, yPos);
  }
}

function mouseDown(e) {
  state.mouseDown = true;
  state.lastMousePos = { x: e.clientX, y: e.clientY };

  const canvas = document.getElementById("myCanvas");
  canvas.style.cursor = "grabbing";
}

function mouseUp() {
  state.mouseDown = false;
  state.lastMousePos = null;

  const canvas = document.getElementById("myCanvas");
  canvas.style.cursor = "grab";
}

function mouseMove(e) {
  if (!state.mouseDown) return;

  console.log("move", e);
  state.treeDelta.x += e.clientX - state.lastMousePos.x;
  state.treeDelta.y += e.clientY - state.lastMousePos.y;
  state.lastMousePos = { x: e.clientX, y: e.clientY };
  window.requestAnimationFrame(draw);
}

window.addEventListener("load", load);
window.addEventListener("resize", initCanvasSize);
