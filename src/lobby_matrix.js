var matrix_path="data/lobby_group.json";
var lobby_matrix=lobbyMatrix();

readJSON(matrix_path);

function readJSON(path) {
   d3.json(path, {'mode': 'no-cors'}).then(function (data) {
       lobby_matrix("#matrix",data)
    });

}

function lobbyMatrix() {
    var matrix=function (selector, rawData) {
        //console.log(JSON.stringify(rawData,null,'\t'))

     var levels= d3.nest()
         .key(function(d) { return d.level; }).sortKeys(d3.ascending)
         .key(function(d) { return d.parent; }).sortKeys(d3.ascending)
         .entries(rawData.results);

     var level_00=d3.nest()
         .key((d)=>d.level).sortKeys(d3.ascending)
         .key((d)=>d.name).sortKeys(d3.ascending)
         //.rollup((d)=>d.name)
         .entries(rawData.results)


        var list = d3.select("#matrix").append("div")
        var level_0=rawData.results.filter(d=> d.parent == null && d.level==0)
        var level_1=rawData.results.filter(d=> d.parent == 6 && d.level==1)

        list.selectAll("input.level_0_checkbox")
            .data(level_0)
            .enter()
            .append("p")
            .text(function(d) {return d.name+" "+d.id ; })
            .append("input")
            .classed("level_0_checkbox",true)
            .attr("type","checkbox")
            .attr("id",(d)=>d.id);

     /*d3.selectAll("input.level_0_checkbox")
            .data(rawData.results.filter(b=> console.log(this) ))
            .enter().append("p")
            .text(d=>d.name+" "+d.id )
            .append("input")
            .classed("level_1_checkbox",true)
            .attr("type","checkbox")
            .attr("id",d=>d.id)*/



    }


    return matrix;
}