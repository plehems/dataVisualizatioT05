/* Electricity Spot Price Over Time */
(function () {
  const DATA_URL = "./data/Ex5_ARE_Spot_Prices.csv";

  d3.csv(DATA_URL).then(rows => {
    if (!rows || !rows.length) {
      const { svg } = SC.createSVG("#line");
      svg.append("text").attr("x", 16).attr("y", 24).attr("fill", "#b91c1c")
        .text("No data found in Ex5_ARE_Spot_Prices.csv");
      return;
    }

    // Detect the YEAR column name (case-insensitive)
    const keys = Object.keys(rows[0] || {});
    const yearKey = keys.find(k => /year/i.test(k));
    if (!yearKey) {
      const { svg } = SC.createSVG("#line");
      svg.append("text").attr("x", 16).attr("y", 24).attr("fill", "#b91c1c")
        .text("No 'Year' column found in CSV.");
      return;
    }

    // Helper: "$42.3 /MWh" -> 42.3
    const cleanNumber = (v) => {
      if (v == null) return NaN;
      const cleaned = String(v).replace(/[^0-9.\-]/g, "");
      return cleaned === "" ? NaN : +cleaned;
    };

    // Build {year, price} by averaging across all city columns per row
    const data = rows.map(row => {
      const year = +String(row[yearKey]).trim();
      const nums = [];
      for (const k of keys) {
        if (k === yearKey) continue;
        const n = cleanNumber(row[k]);
        if (Number.isFinite(n)) nums.push(n);
      }
      const price = nums.length ? d3.mean(nums) : NaN;
      return { year, price };
    })
    .filter(d => Number.isFinite(d.year) && Number.isFinite(d.price))
    .sort((a, b) => d3.ascending(a.year, b.year));

    // SVG + group
    const { svg, g } = SC.createSVG("#line");

    if (!data.length) {
      svg.append("text").attr("x", SC.margin.left + 8).attr("y", SC.margin.top + 16)
        .attr("fill", "#6b7280").style("font-size", "12px")
        .text("All rows were empty/invalid for price values; nothing to plot.");
      return;
    }

    // Scales
    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year)).nice()
      .range([0, SC.innerWidth]);

    const yMax = d3.max(data, d => d.price) || 1;
    const y = d3.scaleLinear()
      .domain([0, yMax * 1.1]).nice()
      .range([SC.innerHeight, 0]);

    // Gridlines
    SC.drawGridlines(g, x, y, SC.innerWidth, SC.innerHeight);

    // Axes
    g.append("g")
      .attr("class", "axis axis-x")
      .attr("transform", `translate(0,${SC.innerHeight})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    g.append("g")
      .attr("class", "axis axis-y")
      .call(d3.axisLeft(y));

    // Axis labels
    SC.addAxisLabels({
      svg,
      xText: "Year",
      yText: "Electricity spot price ($/MWh)"
    });

    // Tooltip
    const tip = SC.createTooltip(g);

    // Line
    const line = d3.line()
      .defined(d => Number.isFinite(d.year) && Number.isFinite(d.price))
      .x(d => x(d.year))
      .y(d => y(d.price))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", SC.colors.line)
      .attr("stroke-width", 3)
      .attr("d", line);

    // Dots + hover
    g.selectAll("circle.dot")
      .data(data)
      .join("circle")
      .attr("class", "dot")
      .attr("r", 3)
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.price))
      .attr("fill", SC.colors.line)
      .on("mouseenter", function (e, d) {
        d3.select(this).transition().duration(80).attr("r", 5);
        tip.show(`${d.year}: $${SC.fmt1d(d.price)} /MWh`, x(d.year), y(d.price));
      })
      .on("mouseleave", function () {
        d3.select(this).transition().duration(80).attr("r", 3);
        tip.hide();
      });

    // ------------------ Average value box (top-left INSIDE plot) ------------------
    const avg = d3.mean(data, d => d.price);
    if (Number.isFinite(avg)) {
      const padX = 10, padY = 8;

      // Container group positioned just inside the plotting area
      const boxG = svg.append("g")
        .attr("class", "avg-box")
        .attr("transform", `translate(${SC.margin.left + 8}, ${SC.margin.top + 8})`);

      // Text first (so we can measure size)
      const t = boxG.append("text")
        .attr("x", padX)
        .attr("y", padY + 10)                // small top padding
        .style("font-size", "12px")
        .style("font-weight", 700)
        .style("fill", "#0f172a")
        .text(`Average across years: $${SC.fmt1d(avg)} /MWh`);

      // Size the rounded rect to fit the text + padding
      const bb = t.node().getBBox();
      boxG.insert("rect", ":first-child")
        .attr("width", bb.width + padX * 2)
        .attr("height", bb.height + padY * 2 + 6)  // +6 for text baseline
        .attr("rx", 8).attr("ry", 8)
        .attr("fill", "#F0F9FF")    // soft blue background
        .attr("stroke", "#38BDF8"); // cyan border
    }
  }).catch(err => {
    console.error("Failed to load line data:", err);
  });
})();
