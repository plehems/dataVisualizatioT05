// Attach shared helpers + constants to a single global for simplicity (no ES modules needed)
window.SC = (() => {
  // --- Dimensions (margin convention) ---
  const margin = { top: 40, right: 28, bottom: 48, left: 64 };
  const width  = 800;
  const height = 800;
  const innerWidth  = width  - margin.left - margin.right;
  const innerHeight = height - margin.top  - margin.bottom;

  // --- Colors & formatters ---
  const colors = {
    primary:  "#2D72BC",  // points
    axisText: "#1e1f22ff",
    grid:     "#e5e7eb",
    line:     "#E0559E"
  };
  const fmtInt = d3.format(",d");
  const fmt1d = d3.format(".1f");
  const fmt2d = d3.format(".2f");

  // --- Create a responsive SVG + inner <g> translated by margins ---
  function createSVG(containerSelector) {
    const svg = d3.select(containerSelector)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img");

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    return { svg, g };
  }

  // --- Axes labels (x bottom centered, y left rotated) ---
  function addAxisLabels({ svg, xText, yText }) {
    // centers of the plotting area in the *SVG* coordinate system
    const cx = margin.left + (innerWidth  ?? (width  - margin.left - margin.right)) / 2;
    const cy = margin.top  + (innerHeight ?? (height - margin.top  - margin.bottom)) / 1.5;
    // X label
    svg.append("text")
      .attr("class", "axis-label")
      .attr("x", cx)
      .attr("y", height)
      .attr("text-anchor", "middle")
      .style("fill", colors.axisText)
      .style("font-size", "15px")
      .text(xText);

    // Y label (simple top-left placement to avoid rotation issues)
    svg.append("text")
      .attr("class", "axis-label")
      .attr("x", 10)
      .attr("y", 18)
      .attr("text-anchor", "start")
      .attr("transform", `translate(${margin.left - 80}, ${cy}) rotate(-90)`)
      .style("fill", colors.axisText)
      .style("font-size", "15px")
      .text(yText);
  }

  // --- Gridlines (drawn behind marks) ---
  function drawGridlines(g, xScale, yScale, innerWidth, innerHeight) {
    // Horizontal gridlines
    g.append("g")
      .attr("class", "grid grid-y")
      .call(
        d3.axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#b2bdd1ff");

    // Vertical gridlines
    g.append("g")
      .attr("class", "grid grid-x")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(xScale)
          .tickSize(-innerHeight)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#f1f5f9");
  }

  // --- Simple SVG tooltip (group with rect+text) ---
  function createTooltip(g) {
    const tooltipWidth  = 152;
    const tooltipHeight = 40;

    const t = g.append("g")
      .attr("class", "tooltip")
      .style("opacity", 0);

    t.append("rect")
      .attr("width", tooltipWidth)
      .attr("height", tooltipHeight)
      .attr("rx", 6).attr("ry", 6)
      .attr("fill", "#111827")
      .attr("fill-opacity", 0.92);

    t.append("text")
      .attr("x", tooltipWidth / 2)
      .attr("y", tooltipHeight / 2 + 1)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .style("font-weight", 700)
      .style("font-size", 12)
      .text("");

    // APIs to show/hide/update
    function show(text, x, y) {
      t.select("text").text(text);
      t.attr("transform", `translate(${x - tooltipWidth / 2}, ${y - tooltipHeight - 10})`)
        .transition().duration(120)
        .style("opacity", 1);
    }
    function hide() {
      t.transition().duration(120).style("opacity", 0);
    }

    return { show, hide };
  }

  // --- small utilities ---
  const toNum = v => v == null || v === "" ? NaN : +v;
  const pick = (obj, keys) => {
    for (const k of keys) if (k in obj && obj[k] !== "") return obj[k];
    return undefined;
  };

  return {
    // dims
    margin, width, height, innerWidth, innerHeight,
    // tokens/helpers
    colors, fmtInt, fmt1d, fmt2d,
    createSVG, addAxisLabels, drawGridlines, createTooltip,
    // utils
    toNum, pick
  };
})();
