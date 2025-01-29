let current_Chart;

// Function to fetch weather data
async function fetchWeatherData() {
  try {
    const response = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=temperature_2m,relative_humidity_2m&start=2024-05-01&end=2024-05-10'
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const weatherData = data.hourly.time.map((time, index) => ({
      date: time.split("T")[0],
      temperature: data.hourly.temperature_2m[index],
      humidity: data.hourly.relative_humidity_2m[index],
    }));

    const uniqueWeatherData = [];
    const seenDates = new Set();

    for (const entry of weatherData) {
      if (!seenDates.has(entry.date)) {
        uniqueWeatherData.push(entry);
        seenDates.add(entry.date);
      }
      if (uniqueWeatherData.length === 10) break;
    }

    return uniqueWeatherData;

  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    return []; // Return an empty array if there's an error
  }
}

// Update charts and event listeners with fetched data
fetchWeatherData().then((weatherData) => {
  if (!weatherData || weatherData.length === 0) {
    console.error('No weather data fetched or data is undefined.');
  } else {
    console.log('Weather data fetched:', weatherData);
  }

  // Ensure that weatherData is defined before calling the chart functions
  if (weatherData && weatherData.length > 0) {
    displayBarChart(weatherData);
    document.querySelector("button[onclick='displayBarChart()']").onclick = () => displayBarChart(weatherData);
    document.querySelector("button[onclick='displayPieChart()']").onclick = () => displayPieChart(weatherData);
    document.querySelector("button[onclick='displayHistogram()']").onclick = () => displayHistogram(weatherData);
    document.querySelector("button[onclick='displayHeatmap()']").onclick = () => displayHeatmap(weatherData);
    document.querySelector("button[onclick='displayLineChart()']").onclick = () => displayLineChart(weatherData);
    document.querySelector("button[onclick='displayScatterPlot()']").onclick = () => displayScatterPlot(weatherData);

    displayWeatherTable(weatherData); // Update the table with fetched data
  }
});

// Function to create and display the table
function displayWeatherTable(weatherData) {
  const tableContainer = document.getElementById('weather-table');
  tableContainer.innerHTML = ''; // Clear previous table if any
  
  // Create table element
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';

  // Create table header
  const headerRow = document.createElement('tr');
  ['Date', 'Temperature (°C)', 'Humidity (%)'].forEach(headerText => {
      const header = document.createElement('th');
      header.textContent = headerText;
      header.style.border = '1px solid #ddd';
      header.style.padding = '8px';
      header.style.backgroundColor = 'rgb(76 104 159)';
      header.style.color = 'white';
      headerRow.appendChild(header);
  });
  table.appendChild(headerRow);

  // Create table rows
  weatherData.forEach(data => {
      const row = document.createElement('tr');
      Object.values(data).forEach(text => {
          const cell = document.createElement('td');
          cell.textContent = text;
          cell.style.border = '1px solid black';
          cell.style.padding = '8px';
          row.appendChild(cell);
      });
      table.appendChild(row);
  });

  // Append the table to the container
  tableContainer.appendChild(table);
}

// Function to display Bar Chart
function displayBarChart(weatherData) {
  clear_Chart();
  current_Chart = "bar";
  const svg = createSVG().classed("bar", true);
  const xScale = d3
    .scaleBand()
    .domain(weatherData.map((d) => d.date))
    .range([0, 800])
    .padding(0.3);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(weatherData, (d) => d.temperature)])
    .range([400, 0]);

  const bars = svg
    .selectAll("rect")
    .data(weatherData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => xScale(d.date))
    .attr("y", 400) // Start the bars at the bottom
    .attr("width", xScale.bandwidth())
    .attr("height", 0) // Start the bars with zero height
    .attr("fill", "#00246B")
    .on("mouseover", function (d) {
      showTooltip(d);
    })
    .on("mouseout", function () {
      hideTooltip();
    });

  // Add transitions for bars and data labels
  bars
    .transition()
    .duration(800)
    .attr("y", (d) => yScale(d.temperature))
    .attr("height", (d) => 400 - yScale(d.temperature))
    .on("end", function () {
      // Data label at the top of each bar along the y-axis
      svg
        .selectAll(".data-label")
        .data(weatherData)
        .enter()
        .append("text")
        .attr("class", "data-label")
        .attr("x", (d) => xScale(d.date) + xScale.bandwidth() / 2)
        .attr("y", (d) => yScale(d.temperature) + 15) // Adjust for label position
        .attr("text-anchor", "middle")
        .attr("font-size", 8)
        .attr("fill", "#ffffff")
        .text((d) => `Temp: ${d?.temperature}`);
    });

  addAxes(svg, xScale, yScale, "Date", "Temperature (°C)");
  addTitle(svg, "Bar Chart");
}

// Function to display Line Chart
function displayLineChart(weatherData) {
  clear_Chart();
  current_Chart = "line";
  const svg = createSVG().classed("line", true);

  const xScale = d3
    .scaleBand()
    .domain(weatherData.map((d) => d.date))
    .range([0, 800])
    .padding(0.1);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(weatherData, (d) => d.temperature) * 1.2])
    .range([400, 0]);

  const line = d3
    .line()
    .x((d) => xScale(d.date) + xScale.bandwidth() / 2)
    .y((d) => yScale(d.temperature));

  const linePath = svg
    .append("path")
    .data([weatherData])
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", "#00246B");

  const circles = svg
    .selectAll("circle")
    .data(weatherData)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d.date) + xScale.bandwidth() / 2)
    .attr("cy", (d) => yScale(d.temperature))
    .attr("r", 5)
    .attr("fill", "#e74c3c");

  circles
    .on("mouseover", function (d) {
      d3.select(this).attr("r", 8);
      showTooltip(d);
    })
    .on("mouseout", function () {
      d3.select(this).attr("r", 5);
      hideTooltip();
    });

  circles.each(function (d) {
    const circle = d3.select(this);
    const textX = +circle.attr("cx") + 16;
    const textY = +circle.attr("cy");

    svg
      .append("text")
      .attr("x", textX)
      .attr("y", textY)
      .attr("text-anchor", "start")
      .attr("font-size", 12)
      .attr("fill", "#ffffff")
      .text("Temp: " + d.temperature);
  });

  addAxes(svg, xScale, yScale, "Date", "Temperature (°C)");
  addTitle(svg, "Line Chart");
}

// Function to display Scatter Plot
function displayScatterPlot(weatherData) {
  clear_Chart();
  current_Chart = "scatter";
  const svg = createSVG().classed("scatter-plot", true);

  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(weatherData, (d) => d?.temperature)])
    .range([0, 800]);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(weatherData, (d) => d?.humidity) * 1.2]) // Increase the maximum by 20%
    .range([400, 0]);

  const circles = svg
    .selectAll("circle")
    .data(weatherData)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d.temperature))
    .attr("cy", (d) => yScale(d.humidity))
    .attr("r", 8)
    .attr("fill", "#00246B")
    .on("mouseover", function (d) {
      showTooltip(d);
    })
    .on("mouseout", function () {
      hideTooltip();
    });

  // Label below each circle
  circles.each(function (d) {
    const circle = d3.select(this);
    const textX = +circle.attr("cx");
    const textY = +circle.attr("cy") + 20; // Adjust for label position

    svg
      .append("text")
      .attr("x", textX)
      .attr("y", textY)
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("font-size", 9)
      .attr("fill", "white")
      .text(`Humidity: ${d?.humidity}`);
  });

  addAxes(svg, xScale, yScale, "Temperature (°C)", "Humidity (%)");
  addTitle(svg, "Scatter Plot");
}

// Function to display Pie Chart
function displayPieChart(weatherData) {
  clear_Chart();
  current_Chart = "pie";
  const svg = createSVG().classed("pie", true);
  const pie = d3.pie().value((d) => d.temperature); 
  const arc = d3.arc().innerRadius(0).outerRadius(150);

  // Define a color scale
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  const arcs = svg
    .selectAll("arc")
    .data(pie(weatherData))
    .enter()
    .append("g")
    .attr("transform", "translate(400,200)");

    const slices = arcs
    .append("path")
    .attr("d", arc)
    .attr("fill", (d, i) => colorScale(i));

  // Add transition for slices
  slices
    .transition()
    .duration(1000)
    .attrTween("d", function (d) {
      const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return function (t) {
        return arc(interpolate(t));
      };
    });

    slices
    .on("mouseover", function (d) {
      showTooltip(d.data);
    })
    .on("mouseout", function () {
      hideTooltip();
    });

  addLegend(svg);
  addTitle(svg, "Pie Chart");
}

// Function to display Heatmap
function displayHeatmap(weatherData) {
  clear_Chart();
  current_Chart = "heatmap";
  const svg = createSVG().classed("heatmap", true);

  const xValues = weatherData.map((d) => d?.date);
  const yValues = weatherData.map((d) => d?.temperature);

  const xScale = d3.scaleBand().domain(xValues).range([0, 800]).padding(0.1);

  const yScale = d3.scaleBand().domain(yValues).range([400, 0]);

  const colorScale = d3
    .scaleLinear()
    .domain([0, d3.max(weatherData, (d) => d.temperature)])
    .range(["#00246B", "#CADCFC"]);

  const cells = svg
    .selectAll("rect")
    .data(weatherData)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.date))
    .attr("y", (d) => yScale(d.temperature))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("fill", (d) => colorScale(d.temperature))
    .on("mouseover", function (d) {
      showTooltip(d);
    })
    .on("mouseout", function () {
      hideTooltip();
    });

  addAxes(svg, xScale, yScale, "Date", "Temperature (°C)", xValues, yValues);
  addTitle(svg, "Heatmap");

  svg
    .append("text")
    .attr("x", 400)
    .attr("y", 430)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("fill", "#ffffff")
    .text("Temperature based on color intensity");
}

// Function to display Histogram
function displayHistogram(weatherData) {
  clear_Chart();
  current_Chart = "histogram";
  const svg = createSVG().classed("histogram", true);

  const xScale = d3
    .scaleBand()
    .domain(weatherData.map((d) => d.date))
    .range([0, 800])
    .padding(0.1);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(weatherData, (d) => d.temperature) * 1.2])
    .range([400, 0]);

  const bars = svg
    .selectAll("rect")
    .data(weatherData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => xScale(d.date))
    .attr("y", 400) // Start the bars at the bottom
    .attr("width", xScale.bandwidth())
    .attr("height", 0) // Start the bars with zero height
    .attr("fill", "#3498db")
    .on("mouseover", function (d) {
      d3.select(this).transition().duration(200).attr("fill", "#2980b9"); // Change color on hover
      showTooltip(d);
    });

  // Add transitions for smoother animation
  bars
    .transition()
    .duration(800)
    .attr("y", (d) => yScale(d.temperature))
    .attr("height", (d) => 400 - yScale(d.temperature));

  addAxes(svg, xScale, yScale, "Date", "Temperature (°C)");
  addTitle(svg, "Interactive Histogram");
}

// Helper Functions

function addAxes(svg, xScale, yScale, xAxisLabel, yAxisLabel) {
  svg
    .append("g")
    .attr("transform", "translate(10,400)")
    .call(d3.axisBottom(xScale))
    .append("text")
    .attr("x", 400)
    .attr("y", 40)
    .attr("id", "chart-text")
    .attr("font-size", 14)
    .text(xAxisLabel);

  svg
    .append("g")
    .call(d3.axisLeft(yScale))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -60)
    .attr("x", 200)
    .attr("id", "chart-text")
    .attr("font-size", 14)
    .text(yAxisLabel);
}

function createSVG() {
  return d3
    .select("#chart-container")
    .append("svg")
    .attr("width", 830)
    .attr("height", 450);
}

function addTitle(svg, title) {
  svg
    .append("text")
    .attr("x", 400)
    .attr("y", 20)
    .attr("font-size", 18)
    .attr("text-anchor", "middle")
    .attr("id", "chart-title")
    .text(title);
}

function clear_Chart() {
  d3.select("#chart-container").selectAll("svg").remove();
}

function hideTooltip() {
  const tooltip = d3.select("#tooltip");
  tooltip.style("display", "none");
}

function addLegend(svg) {
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", "translate(500,50)");

  weatherData.forEach((d, i) => {
    const legendRow = legend
      .append("g")
      .attr("transform", `translate(0,${i * 20})`);

    legendRow
      .append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", colorScale(i));

    legendRow
      .append("text")
      .attr("x", 20)
      .attr("y", 10)
      .attr("dy", "0.3em")
      .text(d.date)
      .attr("fill", "#00246B");
  });
}

function showTooltip(data) {
  const tooltip = d3.select("#tooltip");
  tooltip.html(`
        <strong>Date:</strong> ${data?.date}<br>
        <strong>Temperature:</strong> ${data?.temperature} °C<br>
        <strong>Humidity:</strong> ${data?.humidity} %
    `);
  tooltip.style("display", "block");
}

// Display Bar Chart initially
displayBarChart();
