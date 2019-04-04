const between = (min, max) => Math.random() * (max - min) + min;

const color = d3.scaleSequential(d3.interpolateRainbow).domain([0, 1000]);
let currentColor = 0;

let canvas, canvasNode, canvasContext, polygon, sites, site, svg, target, voronoi;

// main redraw for voronoi running in `animate()`
const redraw = timestamp => {
    const diagram = voronoi(sites);
    const polygons = diagram.polygons();
    polygon = polygon.data(polygons).call(redrawPolygon);
    site = site.data(sites).call(redrawSite);
    drawTrail(polygons[0], timestamp);
};

const redrawPolygon = polygon => polygon.
    attr('d', d => d ? 'M' + d.join('L') + 'Z' : null);

const redrawSite = site => site.
    attr('cx', d => d.x).
    attr('cy', d => d.y).
    attr('r', d => d.target ? 10 : 2.5);

const drawTrail = (cell, timestamp) => {
    canvasContext.beginPath();
    canvasContext.moveTo(cell[0][0], cell[0][1]);
    for (let i = 1, n = cell.length; i < n; ++i) {
        canvasContext.lineTo(cell[i][0], cell[i][1]);
    }
    canvasContext.closePath();
    if (Math.floor(timestamp) % 10) {
        canvasContext.strokeStyle = color(currentColor);
        currentColor++;
    }
    canvasContext.stroke();
};

// cover entire screen
voronoi = d3.voronoi().
    extent([
        [-1, -1],
        [window.innerWidth + 1, window.innerHeight + 1]]).

    x(d => d.x).
    y(d => d.y);

svg = d3.select('body').
    insert('svg:svg', ':first-child').
    attr('class', 'vorannoyed');

sites = d3.range(100).map(() => {
    return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        target: false };

});
// pick first site to be te explorer
const explorer = Object.assign(sites[0], {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    explorer: true });


// voronoi areas
polygon = svg.append('g').
    attr('class', 'polygons').
    selectAll('path').
    data(voronoi.polygons(sites)).
    enter().append('path').
    call(redrawPolygon);

site = svg.append('g').
    attr('class', 'sites').
    selectAll('circle').
    data(sites).
    enter().append('circle').
    attr('r', 2.5).
    style('fill', () => {
        return d3.schemeCategory20c[Math.floor(between(0, 20))];
    }).
    call(redrawSite);

// init canvas overlay
canvas = d3.select('body').
    append('canvas').
    attr('class', 'trail');
canvasNode = canvas.node();
canvasNode.width = window.innerWidth * 2;
canvasNode.height = window.innerHeight * 2;
canvasNode.style.width = `${window.innerWidth}px`;
canvasNode.style.height = `${window.innerHeight}px`;

canvasContext = canvasNode.getContext('2d');
canvasContext.globalAlpha = 0.3;
canvasContext.scale(2, 2);

const setNewTarget = sites => {
    // ignore first site being the explorer itself
    const targetIndex = Math.floor(between(1, sites.length));
    sites.forEach((s, i) => {
        s.target = i === targetIndex;
        if (s.target) target = s;
    });
};

// slowly move the explorer towards the current target
const animate = timestamp => {
    explorer.x += (target.x - explorer.x) / 250;
    explorer.y += (target.y - explorer.y) / 250;
    redraw(timestamp);
    window.requestAnimationFrame(animate);
};

// change target every ten seconds
setNewTarget(sites);
setInterval(() => setNewTarget(sites), 10000);

animate(0);
