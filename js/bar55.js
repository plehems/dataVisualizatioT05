/* Mean Energy (55" TVs) — displays CSV values (no calculations) */
(function () {
  const DATA_URL = "./data/Ex5_TV_energy_55inchtv_byScreenType.csv";

  d3.csv(DATA_URL).then(rows => {
    if (!rows || !rows.length) {
      const { svg } = SC.createSVG("#bar55");
      svg.append("text")
        .attr("x", SC.margin.left + 8)
        .attr("y", SC.margin.top + 16)
        .attr("fill", "#b91c1c")
        .style("font-weight", 700)
        .text("No rows found in Ex5_TV_energy_55inchtv_byScreenType.csv");
      return;
    }

    // Exact column names (with a small fallback just in case)
    const techKey = "Screen_Tech";
    // This key contains parentheses; use bracket notation when accessing it.
    let valueKey = "Mean(Labelled energy consumption (kWh/year))";

    // Fallback: if the exact valueKey isn't present (minor header variation), try to detect it.
    if (!(valueKey in rows[0])) {
      const keys = Object.keys(rows[0]);
      const guess = keys.find(k => /^Mean\(Labelled energy consumption \(kWh\/year\)\)/i.test(k) || /Labelled energy/i.test(k));
      if (guess) valueKey = guess;
    }

    // Helper to coerce strings like "123 kWh/yr" -> 123
    const toNum = v => {
      if (v == null) return NaN;
      const s = String(v).replace(/[^0-9.\-]/g, "");
      return s === "" ? NaN : +s;
    };

    // Map rows to { tech, mean } and keep CSV order
    const data = rows.map(r => ({
      tech: r[techKey] != null ? String(r[techKey]).trim() : "",
      mean: toNum(r[valueKey])
    })).filter(d => d.tech && Number.isFinite(d.mean));

    const { svg, g } = SC.createSVG("#bar55");

    if (!data.length) {
      svg.append("text")
        .attr("x", SC.margin.left + 8)
        .attr("y", SC.margin.top + 16)
        .attr("fill", "#b91c1c")
        .style("font-weight", 700)
        .text("No valid rows (missing Screen_Tech or numeric Mean...).");
      return;
    }

    // Scales
    const x = d3.scaleBand()
      .domain(data.map(d => d.tech))   // CSV order
      .range([0, SC.innerWidth])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.mean)]).nice()
      .range([SC.innerHeight, 0]);

    // Axes
    g.append("g")
      .attr("class", "axis axis-x")
      .attr("transform", `translate(0,${SC.innerHeight})`)
      .call(d3.axisBottom(x));

    g.append("g")
      .attr("class", "axis axis-y")
      .call(d3.axisLeft(y));

    // Axis titles
    SC.addAxisLabels({
      svg,
      xText: 'Screen technology',
      yText: 'Mean annual energy (kWh/year)'
    });

    // Bars
    g.selectAll("rect.bar")
      .data(data)
      .join("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.tech))
      .attr("y", d => y(d.mean))
      .attr("width", x.bandwidth())
      .attr("height", d => SC.innerHeight - y(d.mean))
      .attr("fill", SC.colors.primary);

    // Value labels
    g.selectAll("text.value")
      .data(data)
      .join("text")
      .attr("class", "value")
      .attr("x", d => x(d.tech) + x.bandwidth()/2)
      .attr("y", d => y(d.mean) - 6)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#374151")
      .text(d => SC.fmt1d(d.mean));
  })
  .catch(err => console.error("Failed to load bar55 data:", err));
})();
