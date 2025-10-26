/* Technology Mix (using Screen_Tech + Mean(Labelled energy consumption (kWh/year))) */
(function () {
  const DATA_URL = "./data/Ex5_TV_energy_Allsizes_byScreenType.csv";

  d3.csv(DATA_URL).then(rows => {
    const { svg, g } = SC.createSVG("#donut");

    if (!rows?.length) {
      svg.append("text")
        .attr("x", SC.margin.left + 8)
        .attr("y", SC.margin.top + 16)
        .attr("fill", "#b91c1c")
        .style("font-weight", 700)
        .text("No rows found in Ex5_TV_energy_Allsizes_byScreenType.csv");
      return;
    }

    // exact headers
    const techKey = "Screen_Tech";
    let valKey = "Mean(Labelled energy consumption (kWh/year))";

    // small fallback if header has minor variation
    if (!(valKey in rows[0])) {
      const keys = Object.keys(rows[0]);
      const guess = keys.find(k => /Mean\(Labelled energy consumption \(kWh\/year\)\)/i.test(k));
      if (guess) valKey = guess;
    }

    const toNum = v => {
      if (v == null) return NaN;
      const s = String(v).replace(/[^0-9.\-]/g, "");
      return s === "" ? NaN : +s;
    };

    // map -> { tech, v }
    const data = rows.map(r => ({
      tech: r[techKey] != null ? String(r[techKey]).trim() : "",
      v: toNum(r[valKey])
    }))
    .filter(d => d.tech && Number.isFinite(d.v));

    if (!data.length) {
      svg.append("text")
        .attr("x", SC.margin.left + 8)
        .attr("y", SC.margin.top + 16)
        .attr("fill", "#b91c1c")
        .style("font-weight", 700)
        .text("No valid rows (missing Screen_Tech or numeric Mean...).");
      return;
    }

    // geometry
    const R = Math.min(SC.innerWidth, SC.innerHeight) / 2;
    const innerR = R * 0.55;

    const center = g.append("g")
      .attr("transform", `translate(${SC.innerWidth / 2}, ${SC.innerHeight / 2})`);

    // pie + arcs
    const total = d3.sum(data, d => d.v);
    const pie = d3.pie().value(d => d.v).sort(null);
    const arc = d3.arc().innerRadius(innerR).outerRadius(R);
    const arcLabel = d3.arc().innerRadius((innerR + R) / 2).outerRadius((innerR + R) / 2);

    // colors
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.tech))
      .range(["#2D72BC", "#22A06B", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6", "#EC4899", "#10B981"]);

    // tooltip
    const tip = SC.createTooltip(g);

    // slices
    center.selectAll("path.slice")
      .data(pie(data))
      .join("path")
      .attr("class", "slice")
      .attr("d", arc)
      .attr("fill", d => color(d.data.tech))
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .on("mouseenter", function (e, d) {
        d3.select(this).transition().duration(120).attr("opacity", 0.9);
        const pct = d.data.v / total;
        tip.show(`${d.data.tech}\n${d3.format(".1%")(pct)} of total`, SC.innerWidth / 2, SC.innerHeight / 2 - R);
      })
      .on("mouseleave", function () {
        d3.select(this).transition().duration(120).attr("opacity", 1);
        tip.hide();
      });

    // labels for slices ≥ 5%
    center.selectAll("text.label")
      .data(pie(data))
      .join("text")
      .filter(d => (d.data.v / total) >= 0.05)
      .attr("class", "label")
      .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#374151")
      .text(d => `${d.data.tech} ${d3.format(".0%")(d.data.v / total)}`);

    // tiny legend under chart (optional)
    const legend = g.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${SC.margin.left}, ${SC.margin.top + SC.innerHeight - 8})`);

    const li = legend.selectAll("g.item")
      .data(data)
      .join("g")
      .attr("class", "item")
      .attr("transform", (d, i) => `translate(${(i % 4) * (SC.innerWidth / 4)}, ${Math.floor(i / 4) * 18})`);

    li.append("rect")
      .attr("x", 0).attr("y", -10)
      .attr("width", 12).attr("height", 12)
      .attr("fill", d => color(d.tech));

    li.append("text")
      .attr("x", 18).attr("y", 0)
      .style("font-size", "12px")
      .style("fill", "#374151")
      .text(d => d.tech);

    // axis labels (keeps layout consistent)
    SC.addAxisLabels({ svg, xText: "Technology mix (by mean energy)", yText: "" });
  }).catch(err => {
    console.error("Failed to load donut data:", err);
  });
})();
