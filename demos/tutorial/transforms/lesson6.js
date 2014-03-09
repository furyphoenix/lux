function add_scatterplot(json)
{
    var lats = make_buffer(json, "lat"),
        lons = make_buffer(json, "lon");
    var min_lat = Shade.parameter("float",0),
        min_lon = Shade.parameter("float",0),
        max_lat = Shade.parameter("float",0),
        max_lon = Shade.parameter("float",0);
    var selected = Shade(function(lat, lon) {
        return lat.gt(min_lat).and(lat.lt(max_lat))
            .and(lon.gt(min_lon)).and(lon.lt(max_lon));
    });
    var dots = Lux.Marks.dots({
        position: Shade.vec(lats, lons),
        fill_color: selected(lats, lons).ifelse(Shade.color("red"), Shade.color("white")),
        stroke_width: 1,
        elements: json.length
    });
    var scene = Lux.Scene;
    var lat_lon_scene = Lux.Scene.Transform.Geo.latlong_to_mercator();
    var degrees_scene = Lux.scene({ transform: deg2rad });
    scene.add(lat_lon_scene);
    lat_lon_scene.add(degrees_scene);
    degrees_scene.add(dots);

    function brush(b1, b2) {
        var min = [Math.min(b1[0], b2[0]), Math.min(b1[1], b2[1])];
        var max = [Math.max(b1[0], b2[0]), Math.max(b1[1], b2[1])];
        $("#min-lat").text(min[0]);
        $("#max-lat").text(max[0]);
        $("#min-lon").text(min[1]);
        $("#max-lon").text(max[1]);        
        min_lat.set(min[0]);
        max_lat.set(max[0]);
        min_lon.set(min[1]);
        max_lon.set(max[1]);
        Lux.Scene.invalidate();
    }

    degrees_scene.add(Lux.Marks.rectangle_brush({
        on: { brush_changed: brush },
        accept_event: function(event) { return event.shiftKey; }
    }));
}

$().ready(function () {
    Lux.init({
        interactor: Lux.UI.center_zoom_interactor({width: 720, height: 720, zoom: 0.5}),
        clearColor: [0, 0, 0, 0.2]
    });
    Lux.Net.json("airports.json", add_scatterplot);
});

//////////////////////////////////////////////////////////////////////////////

// transformation spec
function deg2rad(appearance) {
    appearance = _.clone(appearance);
    appearance.position = Shade.radians(appearance.position);
    return appearance;
}
function rad2deg(appearance) {
    appearance = _.clone(appearance);
    appearance.position = Shade.degrees(appearance.position);
    return appearance;
}
deg2rad.inverse = rad2deg;
rad2deg.inverse = deg2rad;

function make_buffer(json, field) {
    return Lux.attribute_buffer({
        vertex_array: _.map(json, function(o) { return o[field]; }), 
        item_size: 1
    });
};