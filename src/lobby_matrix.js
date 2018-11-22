var matrix_path="data/lobby_group.json";
var lobby_matrix=lobbyMatrix();

var allData=[]
var cors="https://cors-anywhere.herokuapp.com/"
var url_lobby="https://dev.declarator.org/api/lobby_group/"
var promises = [];
promises.push(getAPI(allData,null,url_lobby));

Promise.all(promises).then(function (values) {
    console.log("url", JSON.stringify(values[0]))
    rawLobby = values[0]
    lobby_matrix("#matrix",rawLobby)
});
function getAPI(allData, startFrom,url) {
    return fetch(startFrom ? cors+startFrom : cors+url, {
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With':'XMLHttpRequest'
        },
    }).then(response => response.json())
        .then(data => {
            console.log("data.next",data.results)
            allData=allData.concat(data.results);
            const nextPage = data.next;
            if (!nextPage)
                return allData;
            else
                return getAPI(allData, nextPage);
        });
}

//readJSON(matrix_path);

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
         .entries(rawData);

     var level_00=d3.nest()
         .key((d)=>d.level).sortKeys(d3.ascending)
         .key((d)=>d.name).sortKeys(d3.ascending)
         //.rollup((d)=>d.name)
         .entries(rawData)


        var list = d3.select("#matrix").append("div")
        var level_0=rawData.filter(d=> d.parent == null && d.level==0)
        var level_1=rawData.filter(d=> d.parent == 6 && d.level==1)

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