Shade.seq = function(parents)
{
    if (parents.length == 1) {
        return parents[0];
    }
    return Shade._create_concrete_exp({
        expression_name: "seq",
        parents: parents,
        glsl_expression: function(glsl_name) {
            return this.parents.map(function (n) { return n.glsl_expression(); }).join("; ");
        },
        type: Shade.Types.void_t,
        compile: function (ctx) {}
    });
};
