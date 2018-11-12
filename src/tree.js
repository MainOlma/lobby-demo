
var chart = function chart() {
    const root = tree(data);

let x0 = Infinity;
let x1 = -x0;
root.each(d => {
    if (d.x > x1) x1 = d.x;
    if (d.x < x0) x0 = d.x;
});

const svg = d3.select("#tree svg")
    .style("width", "940")
    .style("height", "7000");



const g = svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("transform", `translate(${root.dy / 3},${root.dx - x0})`);

const link = g.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(root.links())
    .enter().append("path")
    .attr("d", d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x));

const node = g.append("g")
    .attr("stroke-linejoin", "round")
    .attr("stroke-width", 3)
    .selectAll("g")
    .data(root.descendants().reverse())
    .enter().append("g")
    .attr("transform", d => `translate(${d.y},${d.x})`);

node.append("circle")
    .attr("fill", d => d.children ? "#555" : "#999")
    .attr("r", 2.5);

node.append("text")
    .attr("dy", "0.31em")
    .attr("x", d => d.children ? -6 : 6)
    .attr("text-anchor", d => d.children ? "end" : "start")
    .text(d => d.data.data.name)
    .clone(true).lower()
    .attr("stroke", "white");

return svg.node();
}




tree = data => {
    console.log(JSON.stringify(data,null,2))
    var stratification = d3.stratify(data)
        .id(function(d) { return d.id; })
        .parentId(function(d) { return d.parent; })
        (data);
    console.log(stratification)
    const root = d3.hierarchy(stratification);
    console.log(root)
    root.dx = 10;
    root.dy = width / (root.height + 1);
    return d3.tree().separation((a,b)=>a.parent == b.parent ? 2 : 5).nodeSize([root.dx, root.dy])(root);
}

width = 932


d3.json(matrix_path, {'mode': 'no-cors'}).then(function (rawdata) {
    data=rawdata.results.map((d)=>{
        return{
            id:+d.id,
            //level:+d.level,
            name:d.name,
            parent:(d.parent!=null) ? +d.parent : 0,
        }
    });
    data.push({id:0,parent:"",name:"lobby"});//add root node

    chart();
});