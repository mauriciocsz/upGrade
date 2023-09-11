var dependencyMap = [] // Map that'll be used globally to check all subjects dependencies
var json = undefined  // Object read from the JSON file


document.addEventListener("DOMContentLoaded", function() {

    var cy = cytoscape({
        container: document.getElementById("cy"),
        elements: [],
        style: [
            {
                selector: ".subjectNode",
                style: {
                    "shape": "round-rectangle",
                    "background-color": "white",
                    "border-color": "black",
                    "border-width": "2.5px",
                    "padding": "40px",
                    "width": "100px",
                    "content": "data(label)",
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'text-wrap': 'wrap',
                    'font-weight': 'bolder',
                }
            },
            {
                selector: "edge",
                style: {
                    "line-color": "blue",
                    'curve-style': 'straight',
                }
            },
            {
                selector: ".finalEdge",
                style: {
                    'target-arrow-shape': 'triangle',
                    'target-arrow-color': 'data(color)',
                    'curve-style': 'bezier',
                }
            },
            {
                selector: ".connector",
                css: {
                    "padding" : "0px",
                    "background-color": "blue",
                    "width" : "0.0000000005px",
                    "height": "0.0000000001px"
                }
            }
        ],
        layout: {
            name: 'preset',
        } 
    });

    cy.on('grab', 'node', function(event) {
        var node = event.target;

        var edges = node.connectedEdges();

        edges.forEach(function(edge) {
            edge.style({'opacity': '0'})
        });

      });

    cy.on('dragfree', 'node', function(event) {
        var node = event.target;
        var nodePosition = node.position();
        
        var edges = node.connectedEdges();
        edges.forEach(function(edge) {
            edge.style({'opacity': '1'})
        });

        // Find the semester the node is supposed to go to
        var calc = Math.ceil(nodePosition.x / 300) - 1

        if (calc < 0) {
            calc = 0
        } else if (calc >= json.semestres.length) {
            calc = json.semestres.length - 1
        }

        var nodeCurrSemester = undefined
        
        json.semestres.forEach((semestre) => {
            var index = semestre.nodes.findIndex(currNode => currNode.id == node.id())
            if(index != -1) {
                nodeCurrSemester = semestre.nodes[index]
                semestre.nodes.splice(index, 1)
            }
        })

        json.semestres[calc].nodes.push(nodeCurrSemester)

        // Re-generate graph
        createGraph(json, cy)
      });

      cy.on('mouseover', 'node', function(event){
        
        var node = event.target;
        if(!node.classes().includes('connector')) {
            var nodesExcluded = []
            var edgesExcluded = []

            nodesExcluded.push(event.target.id())

            var previousNodes = getPreviousNodes(event.target, cy)
            nodesExcluded.push(...previousNodes)

            var previousEdges = getPreviousEdges(previousNodes, cy)
            edgesExcluded.push(...previousEdges)

            var nextNodes = getNextNodes(event.target, cy)
            nodesExcluded.push(...nextNodes)

            var nextEdges = getNextEdges(event.target.id(), nextNodes, cy)
            edgesExcluded.push(...nextEdges)

            cy.nodes().forEach((node) => {
                if(!nodesExcluded.includes(node.id()))
                    node.style("opacity", 0.15)
                    
            })

            cy.edges().forEach((edge) => {
                if(!edge.data().to.includes(event.target.id()) && !edgesExcluded.includes(edge.id()))
                    edge.style("opacity", 0.15)
            })

            console.log('Node id: ' + node.id() + " col: " + node.data().col + " row:" + node.data().row);
        }

        
      });

      cy.on('mouseout', 'node', function(event){
        cy.nodes().forEach((node) => {
            node.style("opacity", 1)
        })

        cy.edges().forEach((edge) => {
            edge.style("opacity", 1)
        })
      });

      cy.on('click', 'edge', function(event){
        var edge = event.target;
        console.log(edge.id())
        console.log(edge.data())
      });

    cy.on('layoutready', function() {
        start(cy)
    });

    cy.ready(function() {
        start(cy)
    })

});

function getNextEdges(current, nodes, cy) {
    var edges = []

    cy.edges().forEach((edge) => {

        if(edge.data().parent == (current))
            edges.push(edge.id())
    })


    nodes.forEach((nodeCode) => {
        cy.edges().forEach((edge) => {

            if(edge.data().parent == (nodeCode))
                edges.push(edge.id())
        })
    })

    return edges
}

function getNextNodes(node, cy) {
    
    var thing = dependencyMap[node.id()]

    if(thing == undefined)
        return []

    var next = [...thing]

    if(next == undefined) 
        return []
    

    var current = next.shift()
    var result = []


    while(current != undefined) {
        result.push(current)

        var dependencies = dependencyMap[current]
        if(dependencies == undefined) {
            current = next.shift()
            continue
        }

        dependencies.forEach((dependee) => {
            if(!next.includes(dependee)) {
                next.push(dependee)
            }
        })
        

        current = next.shift()
    }
    return result
}

function getPreviousNodes(node, cy) {
    var nodes = [...node.data().dependencies]
    var result = []

    var current = nodes.shift()

    while (current != undefined) {
        result.push(current)

        var dependencies = cy.getElementById(current).data().dependencies
        dependencies.forEach((depend) => {
            if(!result.includes(depend)) {
                nodes.push(depend)
            }
        })
        current = nodes.shift()
    }

    return result
}

function getPreviousEdges(nodes, cy) {
    var edges = []

    nodes.forEach((nodeCode) => {
        cy.edges().forEach((edge) => {
            if(edge.data().to.includes(nodeCode))
                edges.push(edge.id())
        })
    })

    return edges
}


function start(cy) {
    fetch('grade.jsonc')
    .then(response => response.text())
    .then(text => createGraph(JSON.parse(text), cy))
}



function createGraph(jsonObject, cy) {
    json = jsonObject

    // Remove all nodes
    cy.edges().remove();
    cy.nodes().remove();
    dependencyMap = []


    let col = 1;
    for (semestre of json.semestres) {
        let row = 1;
        for (node of semestre.nodes) {
            let newNode = createNewNode(node.id, node.name, node.credits, node.depends_on, col, row, semestre)
            cy.add(newNode)
            row++;
        }
        col++;
    }
    semestres = col - 1

    createConnectionNodes(cy)

    for (semestre of json.semestres) {
        for (node of semestre.nodes) {
            var pathsToCreate =[]
            for (dependencies of node.depends_on) {
                if (dependencyMap[dependencies] == undefined) {
                    dependencyMap[dependencies] = [node.id]
                } else {
                    dependencyMap[dependencies].push(node.id)
                }
            }
        }
    }

    Object.entries(dependencyMap).forEach((dependency) =>{
        var key = dependency[0]
        var vals = dependency[1]

        const origin = cy.getElementById(key)

        var pathsToCreate = []
        vals.forEach((val) => {
            const destination = cy.getElementById(val)
            let paths = findGoodPath(origin, destination, cy)
            pathsToCreate.push(paths)
        })
        dealWithPaths(pathsToCreate, cy)
    })
}

function dealWithPaths(pathsToCreate, cy){
    if(pathsToCreate.length == 0)
        return
    
    var conflictsSum = [0, 0, 0, 0]

    pathsToCreate.forEach((paths) => {
        conflictsSum[0] += paths[0].conflicts
        conflictsSum[1] += paths[1].conflicts
        conflictsSum[2] += paths[2].conflicts
        conflictsSum[3] += paths[3].conflicts
    })

    var chosenPath = conflictsSum.indexOf(Math.min(...conflictsSum))

    pathsToCreate.forEach((paths) => {
        genPath(paths[chosenPath].path, cy)
    })
}

function createNewNode(id, name, credits, dependencies, column, row, semestre) {
    return { 
        data: { id: id  , label: name, col: column, row:row, credits: credits, color: randomColor(), dependencies: dependencies} , 
        position: {x:(100 + 300*(column-1)), y:(100 + (150*(row-1)))},
        classes: ["subjectNode", semestre.name], 
    }
}

function createConnectionNodes(cy) {
    let elementos = cy.elements()
    edgesMap = Array((elementos.length*2) + 1).fill().map(()=>Array(semestres+1).fill())

    for(let x = 0; x< semestres; x++) {
        for(let y=0; y<elementos.length; y++) {
            var node = {
                data: {
                    id: x + "_" + y + "_connector_blue",
                    col: x,
                    row: y -1,
                    type: "blue"
                },
                position: {
                    x: (100 + 300*(x-1)) + 150,
                    y: (100 + (150*(y-1))) 
                },
                classes: 'connector'
            }

            cy.add(node)

            var node2 = {
                data: {
                    id: x + "_" + y + "_connector_next_blue",
                    type: "blue"
                },
                position: {
                    x: (100 + 300*(x-1)) + 150,
                    y: (100 + (150*(y-1))) + 75
                },
                classes: 'connector'
            }

            cy.add(node2)
            var node3 = {
                data: {
                    id: x + "_" + y + "_connector_red",
                    col: x,
                    row: y -1,
                    type: "red"
                },
                position: {
                    x: (100 + 300*(x-1)) + 140,
                    y: (95 + (150*(y-1))) 
                },
                classes: 'connector',
                css: {
                    "padding" : "0px",
                    "background-color": "red",
                }
            }

            cy.add(node3)

            var node4 = {
                data: {
                    id: x + "_" + y + "_connector_next_red",
                    type: "red"
                },
                position: {
                    x: (100 + 300*(x-1)) + 140,
                    y: (95 + (150*(y-1))) + 75
                },
                classes: 'connector',
                css: {
                    "padding" : "0px",
                    "background-color": "red",
                }
            }

            cy.add(node4)

            var node5 = {
                data: {
                    id: x + "_" + y + "_connector_green",
                    col: x,
                    row: y -1,
                    type: "green"
                },
                position: {
                    x: (100 + 300*(x-1)) + 160,
                    y: (105 + (150*(y-1))) 
                },
                classes: 'connector',
                css: {
                    "padding" : "0px",
                    "background-color": "green",
                }
            }

            cy.add(node5)

            var node6 = {
                data: {
                    id: x + "_" + y + "_connector_next_green",
                    type: "green"
                },
                position: {
                    x: (100 + 300*(x-1)) + 160,
                    y: (105 + (150*(y-1))) + 75
                },
                classes: 'connector',
                css: {
                    "padding" : "0px",
                    "background-color": "green",
                }
            }

            cy.add(node6)

            var node7 = {
                data: {
                    id: x + "_" + y + "_connector_yellow",
                    col: x,
                    row: y -1,
                    type: "yellow"
                },
                position: {
                    x: (100 + 300*(x-1)) + 170,
                    y: (110 + (150*(y-1))) 
                },
                classes: 'connector',
                css: {
                    "padding" : "0px",
                    "background-color": "yellow",
                }
            }

            cy.add(node7)

            var node8 = {
                data: {
                    id: x + "_" + y + "_connector_next_yellow",
                    type: "yellow"
                },
                position: {
                    x: (100 + 300*(x-1)) + 170,
                    y: (110 + (150*(y-1))) + 75
                },
                classes: 'connector',
                css: {
                    "padding" : "0px",
                    "background-color": "yellow",
                }
            }

            cy.add(node8)
        }
    }
} 


function genPath(path, cy) {
    var previousNode = undefined
    var color = undefined
    var parent = undefined
    var initialNode = path[0]
    var lastNode = path[path.length-1]

    path.forEach((code) => {
        var node = cy.getElementById(code)

        if(parent == undefined)
            parent = code

        if(node.data().color != undefined && color == undefined) {
            color = node.data().color
        }

        if (previousNode != undefined && !hasRepeatingEdges(parent, code, cy)) {
            var classes = []

            if (code == lastNode)
                classes = ["finalEdge"]

            var conn = { 
                data: { 
                    id: Math.random(99999),
                    source: previousNode.id(), 
                    target: code,
                    parent: parent,
                    color: color,
                    from: initialNode,
                    to: [lastNode]
                }, 
                style:{"line-color": color},
                classes: classes
            }
            cy.add(conn)

        } else if (hasRepeatingEdges(parent, code, cy)){
            var edges = cy.getElementById(code).connectedEdges()
            var edgeFound = edges.filter(edge => edge.data().parent == parent)[0]
            edgeFound.data.to = edgeFound.data().to.push(lastNode)
            edgeFound.trigger('data')

            var edges2 = cy.getElementById(code).connectedEdges()
            var edgeFound2 = edges2.filter(edge => edge.data().parent == parent)[0]
        }

        previousNode = node

    })
}

function findGoodPath(startNode, endNode, cy) {
    let startCol = startNode.data().col
    let startRow = startNode.data().row
    let endCol = endNode.data().col
    let endRow = endNode.data().row

    var path = []

    const colors = ["red", "blue", "green", "yellow"]
    const possibleColors = getPossibleInitialConnections(startNode, cy)

    colors.forEach( (color) => {

        if (!possibleColors.includes(color)) {
            path.push({
                conflicts: 999,
                path: []
            })
        } else {
            

        var currentPath = []
        let conflicts = 0 

    // se está em uma coluna diferente:
    // se está numa linha acima, sobe e segue
    // else desce e segue

    // se está em uma linha diferente, sobe ou desce até chegar

        var column = startCol
        var row = startRow

        currentPath.push(startNode.id())
        currentPath.push(startNode.data().col + "_" + startNode.data().row + "_connector_" + color)

        if (startRow > endRow ) {
            row = startRow - 1
        } else if(startRow < endRow) {
            row = startRow + 1 
        }
        // COLUMN LOGIC
        // se está em uma coluna diferente:
        if (startCol < endCol - 1) {
            for (column; column < endCol - 1; column++) {
                currentPath.push(column + "_" + row + "_connector_next_" + color)

                if (hasNodeConflicts(cy, column + "_" + row + "_connector_next_" + color, startNode.id()))
                    conflicts += 1

            }

            currentPath.push(column + "_" + row + "_connector_next_" + color)

            if (hasNodeConflicts(cy, column + "_" + row + "_connector_next_" + color, startNode.id()))
                conflicts += 1
        }


        if(!(row < endRow)) {
            currentPath.push(column + "_" + row + "_connector_" + color )
            if (hasNodeConflicts(cy, column + "_" + row + "_connector_" + color , startNode.id()))
                conflicts += 1
        }
        


        // ROW LOGIC
        if (row < endRow) {
            row = row + 1
            for (row; row <= endRow; row++) {
                currentPath.push(column + "_" + row + "_connector_" + color)
    
                if (hasNodeConflicts(cy, column + "_" + row + "_connector_" + color, startNode.id()))
                    conflicts += 1
            }
        } else if (row > endRow) {
            row = row - 1
            for (row; row >= endRow; row--) {
                currentPath.push(column + "_" + row + "_connector_" + color)
    
                if (hasNodeConflicts(cy, column + "_" + row + "_connector_" + color, startNode.id()))
                    conflicts += 1
            }
        }
        currentPath.push(endNode.id())

        path.push({
            conflicts: conflicts,
            path: currentPath
        })
        }
    })

    return path
}



function hasNodeConflicts(cy, targetId, id) {
    let target = cy.getElementById(targetId)
    var edges = target.connectedEdges()

    if (edges.length == 0 || edges.some( (edge) => { return edge.data().parent == id})) {
        return false
    } else {
        return true 
    }
}

function getPossibleInitialConnections(startNode, cy) {
    let colors = ["red", "blue", "green", "yellow"]
    let possibilites = []

    for(let x=0;x<4;x++) {
        let targetId = startNode.data().col + "_" + startNode.data().row + "_connector_" + colors[x]
        let target = cy.getElementById(targetId)

        var edges = target.connectedEdges();
        if(startNode.id() == 6)
            debugger


        if (edges.length == 0 || edges.some( (edge) => { return edge.data().parent == startNode.id()})) {
            possibilites.push(colors[x])
        }

    }

    if (possibilites.length == 0) {
        possibilites = colors
    }

    return possibilites   
}

function hasRepeatingEdges(code, targetId, cy) {
    var target = cy.getElementById(targetId)
    var edges = target.connectedEdges()

    return edges.some((edge) => edge.data().parent == code)
}


function createPath(startNode, endNode, cy) {

    let startCol = startNode.data().col
    let startRow = startNode.data().row
    let endCol = endNode.data().col
    let endRow = endNode.data().row

    let count = 1
    var curr = startNode.id()
    let color = startNode.data().color


    var edges = startNode.connectedEdges()

    // Faz edge com o Connector
    if (!edges.some( (edge) => {
        return edge.data().target == (startCol + "_" + startRow + "_connector_blue")&& edge.style()["line-color"]==hexToRgb(color)
    })) {
        var conn = { 
            data: { 
                id: startNode.id() + "_to_" + endNode.id() + "_" + count++, 
                source: curr, 
                target: startCol + "_" + startRow + "_connector_blue"
            }, 
            style:{"line-color":color}
        }
    
        cy.add(conn)
        curr = conn.data.target
    } else {
        curr = ((endCol -1 ) + "_" + startRow + "_connector_blue")
    }

    if (startCol == endCol || startCol == endCol-1) {
        logicSameColumn(startNode, endNode, cy, count, curr, color)
    } else {
        logDiffColumn(startNode, endNode, cy, count, curr, color)
    }


}

function randomColor() {
    return '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');   
}