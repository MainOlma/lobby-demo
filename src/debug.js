console.log("debug");
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
console.log(promises)

Promise.all(promises).then(function (values) {
    //console.log("file1", values[0]) //dep
    //console.log("files2", values[1])//lobby
    //console.log("url", JSON.stringify(values[2]))//lobby from url
    rawDep = values[0];
    var rawLobby = values[1]; //2 to load from url
    rawRating = values[2]; //
    dataDepMap(rawDep);
    getLobbyMap(rawLobby);
    doSomething();

});

function dataDepMap(rawdata) {
    Object.defineProperties(Array.prototype, {
        'flatMap': {
            value: function (lambda) {
                return Array.prototype.concat.apply([], this.map(lambda));
            },
            writeable: false,
            enumerable: false
        }
    });
    console.log("1")
    data = rawdata.flatMap((d) => {
        groups = d.groups
        groups.length==0 ? groups=[7917] : groups // кто без групп? -> в группу "Не выявлено"
        var rating=Math.floor(Math.random() * (10-4))+4
        //rating=GetRating(d.person)
        return groups.map((b) => {
            myGroups.add(b)
            /*the set provide unique values of lobby groups*/
            return {
                id: d.id,
                name: d.fullname,
                fraction:d.fraction,
                gender:d.gender,
                group: b,
                //rating: rating.log,
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
    console.log("data:",data[0], data.length)
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
}

function doSomething() {


    var width = 1200,
        height = 1000,
        padding = 2, // separation between same-color nodes
        clusterPadding = 15, // separation between different-color nodes
        maxRadius = 10;


    var n = data.length, // total number of nodes
        m = myArrGroups.length// number of distinct clusters

    var color = d3.scaleOrdinal()
        .domain(['Единая Россия', 'ЛДПР', 'КПРФ', 'Справедливая Россия'])
        //.range(['#50A2FE','#F2B600','#DA4141','#FF7A00'])
        .range(['is-color-er', 'is-color-yellow', 'is-color-red', 'is-color-orange'])
        .unknown('is-color-gray')

    var colorTest = d3.scaleSequential(d3.interpolateRainbow) //rainbow nodes
        .domain(d3.range(m));

    // The largest node for each cluster
    var clusters = new Array(m);
    var uniq = 0

    var nodes = data.map(function (d) {
        var clusterParentId, clusterParent2Id
        var group = lobby.find(x => x.id === d.group)
        if (group.level == 0) clusterParentId = group.parent
        if (group.level == 1) clusterParentId = lobby.find(x => x.id == group.parent).id
        if (group.level == 2) {
            clusterParentId = lobby.find(x => x.id == lobby.find(x => x.id == group.parent).parent).id;
            clusterParent2Id = lobby.find(x => x.id == group.parent).id;
            clusterParent2Name = lobby.find(x => x.id == group.parent).name
        }
        var i = +d.group,
            j = clusterParent2Id ? clusterParent2Id : +i
        r = Math.floor(Math.random() * (maxRadius - 3)) + 3,
            d = {
                name: d.name,
                fraction: d.fraction,
                id: d.id,
                gender: d.gender,
                //cluster: +i,
                cluster: clusterParent2Id ? clusterParent2Id : +i,
                clusterMin: +i,

                //clusterName: group.name,
                clusterName: clusterParent2Id ? clusterParent2Name : group.name,
                clusterLevel: group.level,
                clusterParent: clusterParentId,
                clusterParentMiddle: clusterParent2Id ? clusterParent2Id : null,
                color: color(d.fraction),
                //color:colorTest((clusterParent2Id ? clusterParent2Id : +i)/10),
                election_method: d.election_method,
                committees: d.committees,
                convocations: d.convocations,
                uniq: uniq++,
                r: d.rating,
                x: /*Math.cos(i / m * 2 * Math.PI) * 300*/ +width / 2 + Math.random(),
                y: /*Math.sin(i / m * 2 * Math.PI) * 300*/ +height / 2 + Math.random()

            };

        var count = 0;
        (clusters[j]) ? count = clusters[j].count + 1 : count = 1 //counter of nodes in cluster
        if (!clusters[j] || (r > clusters[j].r)) {
            clusters[j] = d;
        }
        ;
        clusters[j].count = count//write count of nodes of current cluster
        return d;
    });
    nodes.sort(function (a, b) {
        return b.count - a.count;
    })
    nodes.sort(function (a, b) {
        return a.clusterParent - b.clusterParent;
    })

    var clientWidth = document.documentElement.clientWidth
    if (clientWidth >= 1112) clientWidth = 1112
    var clientHeight = (clientWidth < 750) ? 400 : height

    const margin = {top: 100, right: 100, bottom: 100, left: 100};

    const svg = d3.select('#clusters')
        .append('svg')
        .attr('height', clientHeight)
        .attr('width', clientWidth)
        .append('g')


    var clearClusters = clusters.filter(function (el) {
        return el;
    })//remove null from array
    clearClusters.sort(function (a, b) {
        return b.count - a.count;
    })
    clearClusters.sort(function (a, b) {
        return a.clusterParent - b.clusterParent;
    })
    //console.log("clearClusters",clearClusters)


    var nodes2 = nodes.concat(clearClusters);//merge nodes and clusters signs


    var columnsTotal = 9
    var xScale = d3.scaleLinear()
        .domain([0, columnsTotal - 1])
        .range([80, clientWidth - 200]);

    var yScale = d3.scaleLinear()
        .domain([0, 15])
        .range([100, height - 100]);

    clearClusters[0].col = 0;
    clearClusters[0].row = 0
    clearClusters.forEach(function (el, i, arr) {
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


        (clientWidth <= 750) ? GetCoordinatesForMobile(el) : GetCoordinatesForDesktop(el)


    })
console.log("clearClusters",clearClusters)
}