var allData=[]
var cors="https://cors-anywhere.herokuapp.com/"
var url_lobby="https://dev.declarator.org/api/lobby_group/"


function getAPI(allData, startFrom,url) {
    return fetch(startFrom ? cors+startFrom : cors+url, {
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With':'XMLHttpRequest'
        },
    }).then(response => response.json())
        .then(data => {
            //console.log("data.next",data.results)
            allData=allData.concat(data.results);
            const nextPage = data.next;
            if (!nextPage)
                return allData;
            else
                return getAPI(allData, nextPage,url);
        });
}


// tooltip for mouseover functionality
var tooltip = floatingTooltip('gates_tooltip', 240);

var data=[];
var lobby=[];
var lobby_level_0=[];
var myGroups = new Set();
var myArrGroups = new Array()
var files = ["data/deputates.json", "data/lobby_group.json", "data/rating.json"];
var promises = [];
var rawDep, rawRating;

files.forEach(function (url) {
    promises.push(d3.json(url))
});
//promises.push(getAPI(allData,null,url_lobby));

Promise.all(promises).then(function (values) {
    //console.log("file1", values[0]) //dep
    //console.log("files2", values[1])//lobby
    //console.log("url", JSON.stringify(values[2]))//lobby from url
    rawDep = values[0]
    var rawLobby = values[1] //2 to load from url
    rawRating = values[2] //
    dataDepMap(rawDep)
    getLobbyMap(rawLobby);
    doSomething()

});


function dataDepMap(rawdata) {
    data = rawdata.flatMap((d) => {
        groups = d.groups
        groups.length==0 ? groups=[7917] : groups // кто без групп? -> в группу "Не выявлено"
        var rating=Math.floor(Math.random() * (10-4))+4
        return groups.map((b) => {
            myGroups.add(b)
            /*the set provide unique values of lobby groups*/
            return {
                id: d.id,
                name: d.fullname,
                fraction:d.fraction,
                gender:d.gender,
                group: b,
                rating: rating,
                election_method:d.election_method,
                committees:d.committees,
                convocations:d.convocations.length!=0 ? d.convocations.length : 1
            }
        })
    });
    var i = 0
    myGroups.forEach(function (value) {
        myArrGroups.push({id: i++, val: value});
        /*set to array*/
    });
    //console.log(data, data.length)
}

function getLobbyMap(rawdata) {
    lobby = rawdata.map((d,i) => {
        return {
            index:i,
            id: d.id,
            name: d.name,
            parent:d.parent,
            level:d.level,
            tree_id:d.tree_id
        }
    })
    lobby_level_0=lobby.filter(x=>x.level==0)

    console.log("lobby_0", lobby_level_0)
}




function doSomething() {


    var width = 1200,
        height = 1000,
        padding = 10, // separation between same-color nodes
        clusterPadding = 30, // separation between different-color nodes
        maxRadius = 10;


    var n = data.length, // total number of nodes
        m = myArrGroups.length// number of distinct clusters

    var color = d3.scaleOrdinal()
        .domain(['Единая Россия','ЛДПР','КПРФ','Справедливая Россия'])
        .range(['#50A2FE','#7ACBF9','#E38889','#FEA247'])
        .unknown("#ababab")

    var colorTest = d3.scaleSequential(d3.interpolateRainbow) //rainbow nodes
        .domain(d3.range(m));

    // The largest node for each cluster
    var clusters = new Array(m);
    var uniq=0

    var nodes = data.map(function (d) {
        var clusterParentId, clusterParent2Id
        var group=lobby.find(x => x.id === d.group)
        if (group.level==0 ) clusterParentId=group.parent
        if (group.level==1 ) clusterParentId=lobby.find(x=>x.id==group.parent).id
        if (group.level==2 ) {clusterParentId=lobby.find(x=>x.id==lobby.find(x=>x.id==group.parent).parent).id;clusterParent2Id=lobby.find(x=>x.id==group.parent).id;clusterParent2Name=lobby.find(x=>x.id==group.parent).name}
        var i = +d.group,
            j = clusterParent2Id ? clusterParent2Id : +i
        r =Math.floor(Math.random() * (maxRadius-3))+3,
            d = {
                name: d.name,
                fraction:d.fraction,
                id: d.id,
                gender:d.gender,
                //cluster: +i,
                cluster: clusterParent2Id ? clusterParent2Id : +i,
                clusterMin: +i,

                //clusterName: group.name,
                clusterName: clusterParent2Id ? clusterParent2Name : group.name,
                clusterLevel:group.level,
                clusterParent: clusterParentId,
                clusterParentMiddle: clusterParent2Id ? clusterParent2Id : null,
                color:color(d.fraction),
                //color:colorTest((clusterParent2Id ? clusterParent2Id : +i)/10),
                election_method:d.election_method,
                committees:d.committees,
                convocations:d.convocations,
                uniq:uniq++,
                r: d.rating,
                x: /*Math.cos(i / m * 2 * Math.PI) * 300*/ + width / 2 + Math.random(),
                y: /*Math.sin(i / m * 2 * Math.PI) * 300*/ + height / 2 + Math.random()

            };

        var count=0;
        (clusters[j] ) ? count=clusters[j].count+1 : count=1 //counter of nodes in cluster
        if (!clusters[j] || (r > clusters[j].r)) {
            clusters[j] = d;
        };
        clusters[j].count=count//write count of nodes of current cluster
        return d;
    });
    console.log("clusters",clusters)
    nodes.sort(function(a, b) { return b.count - a.count; })
    nodes.sort(function(a, b) { return a.clusterParent - b.clusterParent; })

    const margin = {top: 100, right: 100, bottom: 100, left: 100};

    const svg = d3.select('#clusters')
        .append('svg')
        .attr('height', height)
        .attr('width', width)
        .append('g')


    var clearClusters=clusters.filter(function(el) { return el; })//remove null from array
    clearClusters.sort(function(a, b) { return b.count - a.count; })
    clearClusters.sort(function(a, b) { return a.clusterParent - b.clusterParent; })
    //console.log("clearClusters",clearClusters)



    var nodes2 = nodes.concat(clearClusters);//merge nodes and clusters signs


    var columnsTotal=9
    var xScale = d3.scaleLinear()
        .domain([0, columnsTotal-1])
        .range([100, width-200]);

    var yScale = d3.scaleLinear()
        .domain([0, 15])
        .range([100, height-100]);

    clearClusters[0].col=0; clearClusters[0].row=0
    clearClusters.forEach(function (el,i,arr) {
        /*if (i>0) {
            curr = el
            prev = arr[i - 1]
            if (prev.clusterParent == curr.clusterParent) {
                delta = (i%2==0) ? 0.5 : -0.5
                if (prev.col < columnsTotal-1) {//строка не заполнена?
                    curr.col = prev.col + 1
                    curr.row = prev.row+delta
                }
                else {//переход на новую строку
                    curr.col = 0
                    curr.row = prev.row + 1+delta
                }
            }
            else {//новый кластер с новой строки
                curr.row = prev.row + 4
                curr.col = 0
                //makeTitle(curr.clusterParent,curr.row-2,0)
            }
        }*/

        curr = el

        switch (curr.clusterParent) {
            case 7624://федеральное
                curr.row =2
                curr.col = 7.5
                break;
            case 7667://региональное
                curr.row =10
                curr.col = 7
                break;
            case 7753://отраслевое
                curr.row =4
                curr.col = 4
                break;
            case 7801://общ-полит
                curr.row =2
                curr.col = 0.5
                break;
            case 7813://фин-пром группы
                curr.row =10
                curr.col = 1
                break;
            default:
                curr.row =9
                curr.col = 9

        }

    })
    makeEncloses()

    function makeEncloses() {
        svg.append("g").attr("class", "encloses")
        lobby_level_0.forEach(function (level) {

            svg.select("g.encloses").append("path").attr("class", "enclose")
                .attr("fill", "none")
                .attr("id", "enclose" + level.id)

            svg.select("g.encloses").append("text")
                .attr("dy", -clusterPadding/2)
                .append("textPath") //append a textPath to the text element
                .attr("xlink:href", "#enclose" + level.id) //place the ID of the path here
                .attr("startOffset", "25%")
                .style("text-anchor", "middle") //place the text halfway on the arc

                .text(level.name);
        })
    }


    function encloses() {
        lobby_level_0.forEach(function (level) {

            var e = svg.select('path.enclose#enclose'+level.id)
            var nd = nodes2.filter(x=>x.clusterParent==level.id)
            var encloseCircle = d3.packEnclose(nd)
            if (encloseCircle){
                var arc = d3.arc()
                    .innerRadius(encloseCircle.r)
                    .outerRadius(encloseCircle.r)
                    .startAngle(-60 * (3.14/180)) //converting from degs to radians
                    .endAngle(120 * (3.14/180))
                e.transition().duration(100).attr("transform", "translate("+encloseCircle.x+","+encloseCircle.y+")")
                    .attr("d",arc())
            }
        })
    }

    lastRow=clearClusters[clearClusters.length-1].row
    console.log("lastRow",lastRow)

    function makeTitle(id,row,col) {
        var group = lobby.find(x=>x.id==id)
        svg.append("text").attr("class","title").attr("y",yScale(row)).attr("x",xScale(col)).text(group.name)
    }


    function foci(clusterId){
        cluster=clearClusters.find(x=>x.cluster==clusterId)
        return {
            "x" : xScale(cluster.col),
            "y": yScale(cluster.row)
        }
    }

    var forceX = d3.forceX((d) => foci(d.cluster).x);
    var forceY = d3.forceY((d) => foci(d.cluster).y);

    var links


    var force = d3.forceSimulation()
        .nodes(nodes.sort((a,b)=>a.cluster-b.cluster))
        //.force('center', d3.forceCenter(width / 2, height / 2))
        //.force("gravity", d3.forceManyBody(-10).distanceMax(20))
        //.force("x", d3.forceX().strength(0.2))
        //.force("y", d3.forceY().strength(0.2))
        .force('collide', collide)
        .force('cluster', clustering)
        .force('x',forceX.strength(0.1))
        .force('y',forceY.strength(0.1))
        .force('collide2', d3.forceCollide(d => d.r+2 ).strength(0.8).iterations(2))
        //.alpha(1)
        //.velocityDecay(1)
        .alphaTarget(0.03)
        //.alphaDecay(0.03)
        .on("tick", tick)

    var label_force=d3.forceSimulation()
        .nodes(clearClusters.filter(x=>x.count>10))
        .force("gravity1", d3.forceManyBody(-140).distanceMax(100).distanceMin(0))
        //.force("gravity2", d3.forceManyBody(100).distanceMax(100).distanceMin(100))
        .on("tick", tick2)

    const circles = svg.append('g')
        .datum(nodes)
        .selectAll('.circle')
        .data(d => d)
        .enter().append('circle')
        .attr('r', d => d.r)
        .attr('fill', d=>d.color)
        .attr("cx", d => d.dx)
        .attr("cy", d => d.dy)
        .on('mouseover', showDetail)
        .on('mouseout', hideDetail)
        .on('click', showCard)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    const labels = svg.append('g')
        .datum(clearClusters.filter(x=>x.count>10))
        .selectAll('.g')
        .data(d => d)
        .enter().append("g")
        .attr('class', "lobby_label")
        .attr('fill', d => d3.rgb(d.color).darker())
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("transform",d=>"translate("+d.x+" "+ d.y+")")
        //.append('text')
        //.attr("pointer-events","none")
        .attr("text-anchor","middle")
        //.text(d=>d.clusterName)
        .each(makeText)

        //.attr('stroke', 'black')
        //.attr('stroke-width', 0.6)
        //.on('mouseover', overLabel)
        //.on('mouseout', outLabel)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));



    function makeText(d) {
        d3.select(this).append("text").text(d.clusterName).each(makeBack)
    }

    function makeBack() {
        var width, height, x, y
        width = this.getBBox().width+4
        height = this.getBBox().height
        x = this.getBBox().x-2
        y = this.getBBox().y
        d3.select(this.parentNode).insert("rect", "text")
            .attr("x", x)
            .attr("y", y)
            .attr("width", width)
            .attr("height", height)
            .attr("class", "backForLabel")
    }


    function dragstarted(d) {
        if (!d3.event.active) force.alphaTarget(.03).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) force.alphaTarget(.03);
        d.fx = null;
        d.fy = null;
    }

    circles.transition()
        .duration(1000)
        .attrTween("r", function (d) {
            var i = d3.interpolate(0, d.r);
            return function (t) {
                return d.r = i(t);
            };
        })
        .on("end",function(d,i) {
            console.log(i,circles.size())
            if (i === circles.size()-1) {

                MakeSelect(clearClusters)
            }
            //MakeSelect(clearClusters)
        })
    ;

    labels.transition()
        .duration(1000)
        .attrTween("r", function (d) {
            var i = d3.interpolate(0, d.r);
            return function (t) {
                return d.r = i(t);
            };
        });

    function tick() {
        encloses()

        circles
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
        if (links) {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);}


        label_force.alphaTarget(1).restart();
    }
    function tick2() {
        labels
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr("transform",d=>"translate("+d.x+" "+ d.y+")");
    }

    // Move d to be adjacent to the cluster node.
    function clustering(alpha) {
        nodes.forEach((d) => {
            const cluster = clearClusters.find(x=>x.cluster==d.cluster);
            if (cluster === d) return;
            let x = d.x - cluster.x;
            let y = d.y - cluster.y;
            let l = Math.sqrt((x * x) + (y * y));
            const r = d.r + cluster.r;

            if (l !== r) {
                l = ((l - r) / l) * 0.1;
                d.x -= x *= l;
                d.y -= y *= l;
                cluster.x += x;
                cluster.y += y;
            }
        });
    }

    function collide(alpha) {
        const quadtree = d3.quadtree()
            .x(d => d.x)
            .y(d => d.y)
            .addAll(nodes2);

        nodes2.forEach((d) => {
            const r = d.r + maxRadius + Math.max(padding, clusterPadding);
            const nx1 = d.x - r;
            const nx2 = d.x + r;
            const ny1 = d.y - r;
            const ny2 = d.y + r;
            quadtree.visit((quad, x1, y1, x2, y2) => {
                if (quad.data && (quad.data !== d)) {
                    let x = d.x - quad.data.x;
                    let y = d.y - quad.data.y;
                    let l = Math.sqrt((x * x) + (y * y));
                    const r = d.r + quad.data.r + (d.cluster === quad.data.cluster ? padding : clusterPadding);
                    if (l < r) {
                        l = ((l - r) / l) * 0.03;
                        d.x -= x *= l;
                        d.y -= y *= l;
                        quad.data.x += x;
                        quad.data.y += y;
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
        });
    }


    /*
* Function called on mouseover to display the
* details of a bubble in the tooltip.
*/
    function showDetail(d) {
        drawCloneLinks(d)
        //circles.style("opacity",1).transition().attr("fill", d=>d.color)
        //labels.transition().style("opacity",1)
        // change outline to indicate hover state.
        //d3.select(this).attr('stroke', 'black');

        //var groupname=lobby.find(x => x.id === d.cluster)
        var groupname=lobby.find(x => x.id === d.clusterMin)

        //circles.filter(e=>e.id!=d.id).transition().attr('fill', "gray");
        //circles.filter(e=>e.cluster===d.cluster).transition().attr('fill', 'blue');
        circles.filter(e=>e.id===d.id).transition().attr('stroke', '#000').attr('stroke-width', '2px');

        var content =
            '<span class="name">'+d.name+' </span><br/>' +
            '<span class="value">' +d.fraction+'</span><br/>' +
            '<span class="value">'+groupname.name+' '+d.cluster+'</span><br/>' +
            '<span class="name">ID: </span><span class="value">' + d.id + '</span>';

        tooltip.showTooltip(content, d3.event);
    }

    function drawCloneLinks(target) {
        var clones=nodes.filter(x=>x.id==target.id)
        var arr=clones.map(function (clone) {
            return{
                source:target.uniq,
                target:clone.uniq,
                value:1
            }
        })
        console.log(arr)
        links = arr.map(d => Object.create(d));
        console.log(links)
        svg.select("g.links").remove()
        link = svg.insert("g",":first-child").classed("links",true)
            .attr("stroke", "#999")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke-width", d => Math.sqrt(d.value));
        /*link = svg.append('g').classed("links",true)
            .datum(clones)
            .selectAll('.link')
            .data(d => d)
            .enter().append('line')
            .attr('x1', target.x)
            .attr('y1', target.y)
            .attr("x2", d => d.x)
            .attr("y2", d => d.y)
            .attr("stroke","black")*/

            force.force("link", d3.forceLink(links).id(d => d.uniq).strength(0))
    }

    /*
 * Hides tooltip
 */
    function hideDetail(d) {
        // reset outline
        circles.transition().attr('stroke', 'none');

        //d3.select(this).attr('stroke', d3.rgb(color(d.cluster / 10)).darker());
        tooltip.hideTooltip();
    }

    function overLabel(d) {
        d3.select(this).style("display","none")
    }

    function outLabel(d) {
        d3.select(this).style("display","block")
    }



    /*
* Helper function to convert a number into a string
* and add commas to it to improve presentation.
*/
    function addCommas(nStr) {
        nStr += '';
        var x = nStr.split('.');
        var x1 = x[0];
        var x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }

        return x1 + x2;
    }

    //MakeSelect(clearClusters)

    function MakeSelect(data_clusters) {
        //createSelect("select_election_method", "Способ избрания","election_method")
        //createSelect("select_fraction", "Фракция","fraction")
        createSelect("select_committees", "Комитет","committees")
        CreateSlider()


        data2=lobby.sort((a,b)=>a.tree_id-b.tree_id)

        data_clusters.sort((a,b)=>a.clusterName-b.clusterName)
            .sort((a,b)=>a.clusterParent-b.clusterParent)

        var select = d3.select('#controls')
            .select('select#select_lobby')
            .on('change',onchange)

        d3.selectAll("button").on("click", function () {
            var value=d3.select(this).attr("value")
            var allBtns=d3.select(this.parentNode).selectAll("button")
            //allBtns.classed("myCssClass", !d3.select(this).classed("myCssClass"))
            allBtns.classed("is-active", false)
            d3.select(this).classed("is-active", true)
            onchange()
        })

        select.append('option').text("Лобби").attr("value",-1)

        var options = select
            .selectAll('option.opt')
            .data(data2).enter()
            .append('option')
            .classed("opt",true)
            .attr("value",d=>d.id)
            .text(d=>{
                x=+d.level
                if (x==0) y="\xA0"
                if (x==1) y="\xA0\xA0\xA0\xA0"
                if (x==2) y="\xA0\xA0\xA0\xA0\xA0\xA0\xA0\xA0"

                if (x==0) return y+ d.name.toUpperCase()
                return y+ d.name
            })
            .each(PrependOption)
            .each(function(d) {
                t=nodes.filter(x=>x.cluster==d.id ||
                    x.clusterParent==d.id||
                    x.clusterParentMiddle==d.id||
                    x.clusterMin==d.id)
                if (t.length==0) {

                    d3.select(this).property("disabled", true)
                    d3.select(this).remove()
                }})


        function PrependOption(d){
            if (d.level==0) {
                var ti = document.createElement('option');
                ti.disabled=true
                if (this.nextSibling && this.parentNode) this.parentNode.insertBefore(ti, this);
            }
        }

        function createSelect(selector, placeholder,key) {
            jj2  = []//массив значений ключа
            data.forEach(function (dep) {
                keys=dep[key] // ключ может быть массивом значений
                Array.isArray(keys)
                    ?   keys.forEach(function (comitet) {//надо пройти по нему
                        jj2.push({key: comitet}); //получаем значения ключа в том числе и из массивов
                    })
                    :   jj2.push({key: dep[key]})//если не массив - просто берём значение
            })
            var nest=d3.nest()
                .key(d=>d.key)
                .entries(jj2)
            var opts=nest.flatMap(x=>x.key)
            var select = d3.select('#controls')
                .select('select#'+selector)
                .on('change',onchange)
            select.append('option').text(placeholder).attr("value",-1)
            var options = select
                .selectAll('option.opt')
                .data(opts).enter()
                .append('option')
                .attr("value",d=>d)
                .text((d)=>{
                    var text = key=="committees" ? d.replace("Комитет ГД п","П") : d

                    return text}
                )
        }

        function CreateSlider() {
            var slider = document.getElementById('convocations');

            my_slider=noUiSlider.create(slider, {
                start: [1, 7],
                step:1,
                connect: true,
                range: {
                    'min': 1,
                    'max': 7
                }
            });

            var snapValues = [
                document.getElementById('slider-snap-value-lower'),
                document.getElementById('slider-snap-value-upper')
            ];

            slider.noUiSlider.on('update', function (values, handle) {
                snapValues[handle].innerHTML = values[handle];
                onchange();
            });

        }

        function onchange() {
            var i_search = d3.select('input#search').property('value')
            var s_lobby = d3.select('select#select_lobby').property('value')
            //var s_method = d3.select('select#select_election_method').property('value')
            /*var s_fraction = d3.select('select#select_fraction').property('value')*/
            var s_comitet = d3.select('select#select_committees').property('value')

            var r_conv=my_slider.get()

            var b_fraction, b_method, b_gender

            if (d3.selectAll('#fraction .is-active').node()!=null)
                b_fraction=d3.select('#fraction .is-active').property('value')
            if (d3.selectAll('#method .is-active').node()!=null)
                b_method=d3.select('#method .is-active').property('value')
            if (d3.selectAll('#gender .is-active').node()!=null)
                b_gender=d3.select('#gender .is-active').property('value')

            result=circles.filter(x=>
                ((i_search!="") ?
                    (x.name.toLowerCase().includes(i_search.toLowerCase()) ||
                        x.clusterName.toLowerCase().includes(i_search.toLowerCase())) : true)
                &&
                ((s_lobby!=-1 && s_lobby) ?
                    (x.cluster==s_lobby ||
                        x.clusterParent==s_lobby ||
                        x.clusterMin==s_lobby ||
                        x.clusterParentMiddle==s_lobby) : true)
                /*&&
                ((s_method!=-1) ? (x.election_method==s_method) : true)*/
                /*&&
                    ((s_fraction!=-1) ? (x.fraction==s_fraction) :true)*/
                &&
                ((s_comitet!=-1) ? x.committees.includes(s_comitet): true)
                &&
                (+x.convocations>=+r_conv[0] && +x.convocations<=+r_conv[1])
                &&
                (b_fraction ? (x.fraction==b_fraction) : true)
                &&
                (b_method ? (x.election_method==b_method) : true)
                &&
                (b_gender ? (x.gender==b_gender) : true)
            )
            //console.log(result)
            hightlightOn(result)

        }



        var serchbox=d3.select("#search").on("keyup",onchange)
        var clearbtn=d3.select("#clear").on("click",hightlightOff)

        // Search
        function handleClickSearch(event){
            currentSearchTerm = document.getElementById("search").value;
            search(currentSearchTerm);
            return false;
        }

        function search(term){
            result=circles.filter(x=>
                (x.name.toLowerCase().includes(term.toLowerCase()) ||
                    x.clusterName.toLowerCase().includes(term.toLowerCase())))
            term!=""? hightlightOn(result): hightlightOff()
        }

        function hightlightOn(spot) {
            circles.transition ? console.log("yes") : console.log("no")
            circles.transition().attr("fill", d=>d.color).style("opacity",0.3)
            labels.transition().style("opacity",0.3)

            var circles_clusters=spot.data().map(s=>s.cluster)
            var labels_spot=labels.filter(x=>circles_clusters.includes(x.cluster))

            spot.transition().style("opacity",1)
            labels_spot.transition().style("opacity",1)
        }

        function hightlightOff() {
            d3.selectAll("#search").property("value","")
            d3.selectAll("#controls button").classed("is-active",false)
            d3.selectAll("select").property("selectedIndex", 0)
            circles.transition().attr("fill", d=>d.color).style("opacity",1)
            labels.transition().style("opacity",1)
        }

    }


}