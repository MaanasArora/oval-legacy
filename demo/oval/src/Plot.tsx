import * as d3 from 'd3';

export default function ScatterPlot({
  data,
  width = 500,
  height = 500,
  marginTop = 20,
  marginRight = 20,
  marginBottom = 20,
  marginLeft = 20,
}) {
  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.x) as [number, number])
    .range([marginLeft, width - marginRight]);

  const y = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.y) as [number, number])
    .range([height - marginBottom, marginTop]);

  const color = d3.scaleSequential(d3.interpolateViridis).domain(
    d3.extent(data, (d) => d.z) as [number, number]
  );

  console.log(data);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <svg width={width} height={height}>
        <g fill="white">
          {data.map((d, i) => (
            <circle key={i} cx={x(d.x)} cy={y(d.y)} r={5} fill={color(d.z)} opacity={0.7} />
          ))}
        </g>
      </svg>
    </div>
  );
}
