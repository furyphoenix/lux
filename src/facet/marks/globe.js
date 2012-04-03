function spherical_mercator_patch(tess)
{
    var uv = [];
    var elements = [];
    var i, j;

    for (i=0; i<=tess; ++i)
        for (j=0; j<=tess; ++j)
            uv.push(i/tess, j/tess);

    for (i=0; i<tess; ++i)
        for (j=0; j<tess; ++j) {
            var ix = (tess + 1) * i + j;
            elements.push(ix, ix+1, ix+tess+2, ix, ix+tess+2, ix+tess+1);
        }

    return Facet.model({
        type: "triangles",
        uv: [uv, 2],
        elements: elements,
        vertex: function(min, max) {
            var xf = this.uv.mul(max.sub(min)).add(min);
            return Facet.Scale.Geo.mercator_to_spherical(xf.at(0), xf.at(1));
        },
        transformed_uv: function(min, max) {
            return Shade.mix(min, max, this.uv).div(Math.PI * 2).add(Shade.vec(0, 0.5));
        }
    });
}

function latlong_to_mercator(lat, lon)
{
    lat = lat / (180 / Math.PI);
    lon = lon / (180 / Math.PI);
    return [lon, Math.log(1.0/Math.cos(lat) + Math.tan(lat))];
}

function osm_tile_array(mvp, model)
{
    var patch = spherical_mercator_patch(10);
    var cache_size = 64;

    function new_tile() {
        var texture = Facet.texture({
            width: 256,
            height: 256,
            mag_filter: gl.LINEAR,
            min_filter: gl.LINEAR,
            name: "tile" + i
        });
        return {
            texture: texture,
            // 0: inactive,
            // 1: mid-request,
            // 2: ready to draw.
            active: 0,
            x: -1,
            y: -1,
            zoom: -1,
            last_touched: 0
        };
    };

    var tiles = [];
    for (var i=0; i<cache_size; ++i) {
        tiles.push(new_tile());
    };

    var min_x = Shade.parameter("float");
    var max_x = Shade.parameter("float");
    var min_y = Shade.parameter("float");
    var max_y = Shade.parameter("float");
    var sampler = Shade.parameter("sampler2D");

    var v = patch.vertex(Shade.vec(min_x, min_y), 
                         Shade.vec(max_x, max_y));
    var sphere_batch = Facet.bake(patch, {
        gl_Position: mvp.mul(v),
        gl_FragColor: Shade.texture2D(sampler, patch.uv).discard_if(model.mul(v).z().lt(0))
    });

    var result = {
        tiles: tiles,
        queue: [],
        current_osm_zoom: 3,
        new_center: function(center_lat, center_lon, center_zoom) {
            var w = gl.viewportWidth;
            var zoom_divider = 63.6396;
            var base_zoom = Math.log(w / zoom_divider) / Math.log(2);

            var zoom = base_zoom + (Math.log(center_zoom / 3) / Math.log(2));
            zoom = ~~zoom;
            this.current_osm_zoom = zoom;
            var lst = latlong_to_mercator(center_lat, center_lon);
            var y = (lst[1] / (Math.PI * 2) + 0.5) * (1 << zoom);
            var x = lst[0] / (Math.PI * 2) * (1 << zoom);
            // var y = (center_lat + 90) / 180 * (1 << zoom);
            // var x = center_lon / 360 * (1 << zoom);
            y = (1 << zoom) - y - 1;
            x = (x + (1 << (zoom - 1))) & ((1 << zoom) - 1);

            for (var i=-2; i<=2; ++i) {
                for (var j=-2; j<=2; ++j) {
                    var rx = ~~x + i;
                    var ry = ~~y + j;
                    if (ry < 0 || ry >= (1 << zoom))
                        continue;
                    if (rx < 0)
                        rx += 1 << zoom;
                    if (rx >= (1 << zoom))
                        rx -= 1 << zoom;
                    this.request(rx, ry, ~~zoom);
                }
            }
        },
        get_available_id: function(x, y, zoom) {
            // easy cases first: return available tile or a cache hit
            var now = new Date().getTime();
            for (var i=0; i<cache_size; ++i) {
                if (this.tiles[i].x == x &&
                    this.tiles[i].y == y &&
                    this.tiles[i].zoom == zoom &&
                    this.tiles[i].active != 0) {
                    this.tiles[i].last_touched = now;
                    return i;
                }
            }
            for (i=0; i<cache_size; ++i) {
                if (!this.tiles[i].active) {
                    this.tiles[i].last_touched = now;
                    return i;
                }
            }
            // now we need to bump someone out. who?
            var worst_index = -1;
            var worst_time = 1e30;
            for (i=0; i<cache_size; ++i) {
                if (this.tiles[i].active == 1)
                    // don't use this one, it's getting bumped out
                    continue;
                var score = this.tiles[i].last_touched;
                if (score < worst_time) {
                    worst_time = score;
                    worst_index = i;
                }
            }
            return worst_index;
        },
        init: function() {
            for (var z=0; z<3; ++z)
                for (var i=0; i<(1 << z); ++i)
                    for (var j=0; j<(1 << z); ++j)
                        this.request(i, j, z);
        },
        sanity_check: function() {
            var d = {};
            for (var i=0; i<cache_size; ++i) {
                if (this.tiles[i].active !== 2)
                    continue;
                var k = this.tiles[i].x + "-" +
                    this.tiles[i].y + "-" +
                    this.tiles[i].zoom;
                if (d[k] !== undefined) {
                    console.log("BAD STATE!", 
                                this.tiles[i].x, this.tiles[i].y, this.tiles[i].zoom, 
                                this.tiles[i].active,
                                k);                    
                    throw "die";
                }
                d[k] = true;
            }
        },
        request: function(x, y, zoom) {
            var that = this;
            var id = this.get_available_id(x, y, zoom);
            if (id === -1) {
                alert("Could not fulfill request " + x + " " + y + " " + zoom);
                return;
            }
            if (this.tiles[id].x == x && 
                this.tiles[id].y == y && 
                this.tiles[id].zoom == zoom) {
                return;
            }

            that.tiles[id].x = x;
            that.tiles[id].y = y;
            that.tiles[id].zoom = zoom;
            this.tiles[id].active = 1;
            var f = function(x, y, zoom, id) {
                return function() {
                    that.tiles[id].active = 2;
                    that.tiles[id].last_touched = new Date().getTime();
                    that.sanity_check();
                    Facet.Scene.invalidate();
                };
            };
            Facet.load_image_into_texture({
                texture: tiles[id].texture,
                src: "http://tile.openstreetmap.org/"+zoom+"/"+x+"/"+y+".png",
                crossOrigin: "anonymous",
                onload: f(x, y, zoom, id)
            });
        },
        draw: function() {
            var lst = _.range(cache_size);
            var that = this;
            lst.sort(function(id1, id2) { 
                var g1 = Math.abs(tiles[id1].zoom - that.current_osm_zoom);
                var g2 = Math.abs(tiles[id2].zoom - that.current_osm_zoom);
                return g2 - g1;
            });

            gl.disable(gl.DEPTH_TEST);
            for (var i=0; i<cache_size; ++i) {
                var t = tiles[lst[i]];
                if (t.active != 2)
                    continue;
                min_x.set((t.x / (1 << t.zoom))           * Math.PI*2 + Math.PI);
                min_y.set((1 - (t.y + 1) / (1 << t.zoom)) * Math.PI*2 - Math.PI);
                max_x.set(((t.x + 1) / (1 << t.zoom))     * Math.PI*2 + Math.PI);
                max_y.set((1 - t.y / (1 << t.zoom))       * Math.PI*2 - Math.PI);
                sampler.set(t.texture);
                sphere_batch.draw();
            }
        }
    };

    return result;
};

Facet.Marks.globe = function(opts)
{
    opts = _.defaults(opts || {}, {
        longitude_center: -98,
        latitude_center: 38,
        zoom: 3
    });

    var gl = Facet._globals.ctx;

    var zooming = false, panning = false;
    var prev;
    var inertia_delta = [0,0];
    var starting_inertia_delta = [0,0];
    var min_x, max_x, min_y, max_y;
    var sphere = spherical_mercator_patch(40);
    var model_matrix = Shade.parameter("mat4");

    var texture = Facet.texture({
        width: 2048,
        height: 2048,
        mag_filter: gl.LINEAR,
        min_filter: gl.LINEAR,
        name: "big_globe"
    });

    min_x = Shade.parameter("float");
    max_x = Shade.parameter("float");
    min_y = Shade.parameter("float");
    max_y = Shade.parameter("float");
    var min = Shade.vec(min_x, min_y), max = Shade.vec(max_x, max_y);
    var sampler = Shade.parameter("sampler2D", texture);

    var mvp = opts.view_proj.mul(model_matrix);
    var sphere_batch = Facet.bake(sphere, {
        gl_Position: mvp.mul(sphere.vertex(min, max)),
        gl_FragColor: Shade.texture2D(sampler, sphere.transformed_uv(min, max))
    });

    var display = function() { gl.display(); };
    for (var i=0; i<8; ++i)
        for (var j=0; j<8; ++j)
            Facet.load_image_into_texture({
                texture: texture,
                src: "http://tile.openstreetmap.org/3/" +
                     i + "/" + j + ".png",
                crossOrigin: "anonymous",
                x_offset: ((i + 4) % 8)  * 256,
                y_offset: 2048 - (j+1) * 256,
                onload: display
            });

    var result = {
        longitude_center: opts.longitude_center,
        latitude_center: opts.latitude_center,
        zoom: opts.zoom,
        model_matrix: model_matrix,
        mvp: mvp,

        update_model_matrix: function() {
            while (this.longitude_center < 0)
                this.longitude_center += 360;
            while (this.longitude_center > 360)
                this.longitude_center -= 360;
            var r1 = Facet.rotation(this.latitude_center * (Math.PI/180), [ 1, 0, 0]);
            var r2 = Facet.rotation(this.longitude_center * (Math.PI/180), [ 0,-1, 0]);
            this.model_matrix.set(mat4.product(r1, r2));
        },

        mousedown: function(event) {
            prev = [event.offsetX, event.offsetY];
            inertia_delta = [0, 0];
            starting_inertia_delta = [0, 0];
        },

        mousemove: function(event) {
            var w = gl.viewportWidth;
            var h = gl.viewportHeight;
            var w_divider = 218.18;
            var h_divider = 109.09;

            if (event.which & 1 && !event.shiftKey) {
                panning = true;
                this.longitude_center -= (event.offsetX - prev[0]) / (w * this.zoom / w_divider);
                this.latitude_center += (event.offsetY - prev[1]) / (h * this.zoom / h_divider);
                this.latitude_center = Math.max(Math.min(80, this.latitude_center), -80);
                this.update_model_matrix();
            }
            if (event.which & 1 && event.shiftKey) {
                zooming = true;
                this.zoom *= 1.0 + (event.offsetY - prev[1]) / 240;
            }
            prev = [event.offsetX, event.offsetY];
            gl.display();
        },
        mouseup: function(event) {
            var w = gl.viewportWidth;
            var h = gl.viewportHeight;
            var w_divider = 218.18;
            var h_divider = 109.09;
            var that = this;
            if (panning) {
                inertia_delta[0] = -(event.offsetX - prev[0]) / (w * that.zoom / w_divider);
                inertia_delta[1] =  (event.offsetY - prev[1]) / (h * that.zoom / h_divider);
                starting_inertia_delta[0] = inertia_delta[0] === 0 ? 1 : inertia_delta[0];
                starting_inertia_delta[1] = inertia_delta[1] === 0 ? 1 : inertia_delta[1];

                prev = [event.offsetX, event.offsetY];
                var f = function() {
                    gl.display();
                    that.longitude_center += inertia_delta[0];
                    that.latitude_center  += inertia_delta[1];
                    that.latitude_center  = Math.max(Math.min(80, that.latitude_center),
                                                -80);
                    that.update_model_matrix();
                    inertia_delta[0] *= 0.95;
                    inertia_delta[1] *= 0.95;
                    if (Math.max(Math.abs(inertia_delta[0] / starting_inertia_delta[0]), 
                                 Math.abs(inertia_delta[1] / starting_inertia_delta[0])) > 0.01)
                        window.requestAnimFrame(f, that.canvas);
                };
                f();
            }
            panning = zooming = false;
        },

        draw: function() {
            this.update_model_matrix();
            
            // gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);

            var t = latlong_to_mercator(this.latitude_center, this.longitude_center);
            var window = Math.PI * Math.min(1, 1 / (this.zoom * Math.cos(this.latitude_center / 180 * Math.PI)));

            var mn_x = (t[0] - window);
            var mx_x = (t[0] + window);
            while (mn_x > Math.PI * 2) {
                mn_x -= Math.PI * 2;
                mx_x -= Math.PI * 2;
            }

            min_y.set(t[1] - window);
            max_y.set(t[1] + window);

            if (mn_x < 0) {
                min_x.set(mn_x + Math.PI*2);
                max_x.set(Math.PI*2);
                sphere_batch.draw();

                min_x.set(0);
                max_x.set(mx_x);
                sphere_batch.draw();
            } else if (mx_x > Math.PI*2) {
                min_x.set(mn_x);
                max_x.set(Math.PI*2);
                sphere_batch.draw();

                min_x.set(0);
                max_x.set(mx_x - Math.PI*2);
                sphere_batch.draw();
            } else {
                min_x.set(mn_x);
                max_x.set(mx_x);
                sphere_batch.draw();
            }
        }
    };
    result.update_model_matrix();
    return result;
};
