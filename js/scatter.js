/* Scatterplot: Star rating (x) vs Annual Energy kWh/year (y)*/
(function () {
  const DATA_URL = "./data/Ex5_TV_energy.csv";

  // 1) Load & parse 
  d3.csv(DATA_URL, rowConverter).then(raw => {
    // Remove rows missing required numeric fields
    const data = raw.filter(d => isFinite(d.star) && isFinite(d.kwh));

    // 2) Set up SVG + group 
    const { svg, g } = SC.createSVG("#scatter");

    // 3) Scales 
    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.star))   // min..max of stars
      .nice()
      .range([0, SC.innerWidth]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.kwh)])  // start at 0 for energy
      .nice()
      .range([SC.innerHeight, 0]);

    // 4) Gridlines behind marks 
    SC.drawGridlines(g, x, y, SC.innerWidth, SC.innerHeight);

    // 5) Axes 
    const xAxis = d3.axisBottom(x).ticks(8);
    const yAxis = d3.axisLeft(y).ticks(8);

    g.append("g")
      .attr("class", "axis axis-x")
      .attr("transform", `translate(0, ${SC.innerHeight})`)
      .call(xAxis);

    g.append("g")
      .attr("class", "axis axis-y")
      .call(yAxis);

    // Axis labels (top-right for x, top-left for y to avoid overlap)
    SC.addAxisLabels({
      svg,
      xText: "Star rating (stars)",
      yText: "Annual energy (kWh/year)",
    });

    // 6) Tooltip 
    const tip = SC.createTooltip(g);

    // 7) Marks (points)
    g.selectAll("circle.point")
      .data(data)
      .join("circle")
      .attr("class", "point")
      .attr("r", 3.5)
      .attr("cx", d => x(d.star))
      .attr("cy", d => y(d.kwh))
      .attr("fill", SC.colors.primary)
      .attr("opacity", 0.65)
      .on("mouseenter", function (e, d) {
        // brighten hovered point
        d3.select(this)
          .interrupt()
          .transition().duration(80)
          .attr("r", 5)
          .attr("opacity", 0.95);

        // compose tooltip text
        const txt = `${SC.fmt2d(d.star)}★ • ${SC.fmtInt(d.kwh)} kWh` + (d.model ? `\n${d.model}` : "");
        // mouse position: use circle coords to keep stable
        const cx = +d3.select(this).attr("cx");
        const cy = +d3.select(this).attr("cy");
        tip.show(txt, cx, cy);
      })
      .on("mouseleave", function () {
        d3.select(this)
          .interrupt()
          .transition().duration(120)
          .attr("r", 3.5)
          .attr("opacity", 0.65);

        tip.hide();
      });

  }).catch(err => {
    console.error("Failed to load scatter data:", err);
  });

  // --- Row converter ---
  function rowConverter(raw) {
    // Try to find likely header names in your file
    const starVal = SC.pick(raw, [
      "star2",
    ]);
    const kwhVal = SC.pick(raw, [
      "energy_consumpt",
    ]);

    // Optional fields for nicer tooltips
    const modelVal = SC.pick(raw, [
      "model", 
    ]);
    const techVal = SC.pick(raw, [
      "screen_tech",
    ]);
    const sizeVal = SC.pick(raw, [
      "screensize",
    ]);

    return {
      star: SC.toNum(starVal),
      kwh:  SC.toNum(kwhVal),
      model: modelVal || "",
      tech:  techVal  || "",
      size:  SC.toNum(sizeVal)
    };
  }
})();
